# Phase 4 - Full Code

This document contains the complete code for Phase 4 of the Venafi TPP existing certificate adoption feature.

Scope:

- Add the adoption controller.
- Add the key-only Secret seeding logic.
- Add controller and Secret tests.

Files:

- New: `pkg/controller/certificates/venafi-adoption/controller.go`
- New: `pkg/controller/certificates/venafi-adoption/secret.go`
- New: `pkg/controller/certificates/venafi-adoption/controller_test.go`
- New: `pkg/controller/certificates/venafi-adoption/secret_test.go`

Prerequisites:

- Phase 1 constants and condition type.
- Phase 2 Venafi client helpers.
- Phase 3 validation helpers.

Behavior:

- The controller runs before keymanager.
- It searches Venafi TPP for a certificate matching the Certificate host.
- If a valid certificate and private key are found, it writes only `tls.key` into the target Secret.
- It never writes `tls.crt` or `ca.crt`; the normal cert-manager issuance flow does that after the issuer returns the existing certificate.
- TPP search/retrieve/permission errors are treated as retryable failures and do not trigger normal issuance.
- No certificate, no private key, expired, or not-yet-valid certificates are skipped, and normal issuance proceeds.
- Key, identity, usage, and chain mismatches are failures that wait for user intervention.

---

## 1. New file: `pkg/controller/certificates/venafi-adoption/controller.go`

```go
/*
Copyright 2026 The cert-manager Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package venafiadoption

import (
	"context"
	"crypto/x509"
	"fmt"
	"strings"
	"time"

	"github.com/go-logr/logr"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/cache"
	"k8s.io/client-go/tools/record"
	"k8s.io/client-go/util/workqueue"
	"k8s.io/utils/clock"

	cminternal "github.com/cert-manager/cert-manager/internal/apis/certmanager"
	internalinformers "github.com/cert-manager/cert-manager/internal/informers"
	apiutil "github.com/cert-manager/cert-manager/pkg/api/util"
	cmapi "github.com/cert-manager/cert-manager/pkg/apis/certmanager/v1"
	cmmeta "github.com/cert-manager/cert-manager/pkg/apis/meta/v1"
	clientset "github.com/cert-manager/cert-manager/pkg/client/clientset/versioned"
	cmlisters "github.com/cert-manager/cert-manager/pkg/client/listers/certmanager/v1"
	controllerpkg "github.com/cert-manager/cert-manager/pkg/controller"
	"github.com/cert-manager/cert-manager/pkg/controller/certificates"
	issuerpkg "github.com/cert-manager/cert-manager/pkg/issuer"
	venaficlient "github.com/cert-manager/cert-manager/pkg/issuer/venafi/client"
	logf "github.com/cert-manager/cert-manager/pkg/logs"
	"github.com/cert-manager/cert-manager/pkg/metrics"
	"github.com/cert-manager/cert-manager/pkg/util/pki"
	"github.com/cert-manager/cert-manager/pkg/util/predicate"
)

const (
	// ControllerName is the name of the Venafi adoption controller.
	ControllerName = "certificates-venafi-adoption"

	// Condition reasons used by this controller.
	ReasonPending                     = "Pending"
	ReasonAdopted                     = "Adopted"
	ReasonAlreadyPresent              = "AlreadyPresent"
	ReasonSkipped                     = "Skipped"
	ReasonRequiresRotationPolicyNever = "RequiresRotationPolicyNever"
	ReasonRenewal                     = "Renewal"
	ReasonNotApplicable               = "NotApplicable"
	ReasonNotFound                    = "NotFound"
	ReasonAmbiguous                   = "Ambiguous"
	ReasonPrivateKeyUnavailable       = "PrivateKeyUnavailable"
	ReasonConflict                    = "Conflict"
	ReasonSearchFailed                = "SearchFailed"
	ReasonRetrieveFailed              = "RetrieveFailed"
)

var certificateGvk = cmapi.SchemeGroupVersion.WithKind("Certificate")

type controller struct {
	certificateLister        cmlisters.CertificateLister
	secretLister             internalinformers.SecretLister
	issuerLister             cmlisters.IssuerLister
	clusterIssuerLister      cmlisters.ClusterIssuerLister
	issuerHelper             issuerpkg.Helper
	coreClient               kubernetes.Interface
	cmClient                 clientset.Interface
	recorder                 record.EventRecorder
	clock                    clock.Clock
	clientBuilder            venaficlient.VenafiClientBuilder
	metrics                  *metrics.Metrics
	userAgent                string
	issuerOptions            controllerpkg.IssuerOptions
}

// NewController builds the Venafi adoption controller.
func NewController(
	log logr.Logger,
	ctx *controllerpkg.Context,
) (*controller, workqueue.TypedRateLimitingInterface[types.NamespacedName], []cache.InformerSynced, error) {
	queue := workqueue.NewTypedRateLimitingQueueWithConfig(
		controllerpkg.DefaultCertificateRateLimiter(),
		workqueue.TypedRateLimitingQueueConfig[types.NamespacedName]{
			Name: ControllerName,
		},
	)

	certificateInformer := ctx.SharedInformerFactory.Certmanager().V1().Certificates()
	secretsInformer := ctx.KubeSharedInformerFactory.Secrets()
	issuerInformer := ctx.SharedInformerFactory.Certmanager().V1().Issuers()
	clusterIssuerInformer := ctx.SharedInformerFactory.Certmanager().V1().ClusterIssuers()

	if _, err := certificateInformer.Informer().AddEventHandler(&controllerpkg.QueuingEventHandler{Queue: queue}); err != nil {
		return nil, nil, nil, fmt.Errorf("error setting up certificate event handler: %v", err)
	}

	if _, err := secretsInformer.Informer().AddEventHandler(&controllerpkg.BlockingEventHandler{
		WorkFunc: certificates.EnqueueCertificatesForResourceUsingPredicates(
			log,
			queue,
			certificateInformer.Lister(),
			labels.Everything(),
			predicate.ExtractResourceName(predicate.CertificateSecretName),
		),
	}); err != nil {
		return nil, nil, nil, fmt.Errorf("error setting up secret event handler: %v", err)
	}

	issuerLister := issuerInformer.Lister()
	clusterIssuerLister := clusterIssuerInformer.Lister()

	mustSync := []cache.InformerSynced{
		certificateInformer.Informer().HasSynced,
		secretsInformer.Informer().HasSynced,
		issuerInformer.Informer().HasSynced,
		clusterIssuerInformer.Informer().HasSynced,
	}

	userAgent := ""
	if ctx.RESTConfig != nil {
		userAgent = ctx.RESTConfig.UserAgent
	}

	return &controller{
		certificateLister:   certificateInformer.Lister(),
		secretLister:        secretsInformer.Lister(),
		issuerLister:        issuerLister,
		clusterIssuerLister: clusterIssuerLister,
		issuerHelper:        issuerpkg.NewHelper(issuerLister, clusterIssuerLister),
		coreClient:          ctx.Client,
		cmClient:            ctx.CMClient,
		recorder:            ctx.Recorder,
		clock:               ctx.Clock,
		clientBuilder:       venaficlient.New,
		metrics:             ctx.Metrics,
		userAgent:           userAgent,
		issuerOptions:       ctx.IssuerOptions,
	}, queue, mustSync, nil
}

func (c *controller) ProcessItem(ctx context.Context, key types.NamespacedName) error {
	log := logf.FromContext(ctx).WithValues("key", key)
	ctx = logf.NewContext(ctx, log)

	crt, err := c.certificateLister.Certificates(key.Namespace).Get(key.Name)
	if err != nil && !apierrors.IsNotFound(err) {
		return err
	}
	if crt == nil || crt.DeletionTimestamp != nil {
		return nil
	}

	if crt.Annotations[cmapi.VenafiAdoptExistingAnnotationKey] != "true" {
		return nil
	}

	crt = crt.DeepCopy()
	cminternal.SetRuntimeDefaults_Certificate(crt)

	issuerObj, err := c.issuerHelper.GetGenericIssuer(crt.Spec.IssuerRef, crt.Namespace)
	if err != nil {
		return c.setCondition(ctx, crt, cmmeta.ConditionFalse, ReasonSearchFailed,
			fmt.Sprintf("failed to resolve issuer: %v", err))
	}

	if issuerObj.GetSpec().Venafi == nil || issuerObj.GetSpec().Venafi.TPP == nil {
		return c.setCondition(ctx, crt, cmmeta.ConditionFalse, ReasonNotApplicable,
			"issuer is not a Venafi TPP issuer")
	}

	// If the Certificate was already adopted and the target key is still
	// present, there is nothing to do.
	if cond := apiutil.GetCertificateCondition(crt, cmapi.CertificateConditionVenafiAdoption); cond != nil &&
		cond.Status == cmmeta.ConditionTrue &&
		(cond.Reason == ReasonAdopted || cond.Reason == ReasonAlreadyPresent) &&
		c.targetSecretHasKey(crt) {
		return nil
	}

	if crt.Spec.PrivateKey == nil || crt.Spec.PrivateKey.RotationPolicy != cmapi.RotationPolicyNever {
		return c.setCondition(ctx, crt, cmmeta.ConditionFalse, ReasonRequiresRotationPolicyNever,
			"spec.privateKey.rotationPolicy must be Never for Venafi adoption")
	}

	usable, conflict := c.targetSecretState(crt)
	if conflict {
		return c.setCondition(ctx, crt, cmmeta.ConditionFalse, ReasonConflict,
			"target Secret is owned by another Certificate")
	}
	if usable {
		return c.setCondition(ctx, crt, cmmeta.ConditionTrue, ReasonAlreadyPresent,
			"target Secret already contains a valid certificate and private key")
	}

	if crt.Status.Revision != nil && c.targetSecretHasKey(crt) {
		return c.setCondition(ctx, crt, cmmeta.ConditionFalse, ReasonRenewal,
			"certificate has already been issued; adoption only runs on initial issuance")
	}

	if err := c.setCondition(ctx, crt, cmmeta.ConditionFalse, ReasonPending,
		"searching Venafi TPP for an existing certificate"); err != nil {
		return err
	}

	client, err := c.clientBuilder(
		c.issuerOptions.ResourceNamespace(issuerObj),
		c.secretLister,
		issuerObj,
		c.metrics,
		log,
		c.userAgent,
	)
	if err != nil {
		_ = c.setCondition(ctx, crt, cmmeta.ConditionFalse, ReasonSearchFailed,
			fmt.Sprintf("failed to initialize Venafi client: %v", err))
		return err
	}

	zone := issuerObj.GetSpec().Venafi.Zone
	candidates, err := client.SearchExistingCertificates(
		zone,
		crt.Spec.CommonName,
		crt.Spec.DNSNames,
		adoptionMinRemaining(crt),
	)
	if err != nil {
		_ = c.setCondition(ctx, crt, cmmeta.ConditionFalse, ReasonSearchFailed,
			fmt.Sprintf("failed to search Venafi TPP: %v", err))
		return err
	}

	if len(candidates) == 0 {
		return c.setCondition(ctx, crt, cmmeta.ConditionFalse, ReasonNotFound,
			"no matching Venafi TPP certificate found")
	}

	if len(candidates) > 1 &&
		candidates[0].NotAfter.Equal(candidates[1].NotAfter) &&
		candidates[0].Thumbprint != candidates[1].Thumbprint {
		return c.setCondition(ctx, crt, cmmeta.ConditionFalse, ReasonAmbiguous,
			"multiple Venafi TPP certificates match the host")
	}

	candidate := candidates[0]

	password, err := venaficlient.GenerateEphemeralPassword()
	if err != nil {
		_ = c.setCondition(ctx, crt, cmmeta.ConditionFalse, ReasonRetrieveFailed,
			fmt.Sprintf("failed to generate a private key password: %v", err))
		return err
	}

	retrieved, err := client.RetrieveExistingCertificate(candidate.DN, password)
	if err != nil {
		if isPrivateKeyUnavailable(err) {
			return c.setCondition(ctx, crt, cmmeta.ConditionFalse, ReasonPrivateKeyUnavailable,
				"Venafi TPP does not store a private key for the certificate")
		}
		_ = c.setCondition(ctx, crt, cmmeta.ConditionFalse, ReasonRetrieveFailed,
			fmt.Sprintf("failed to retrieve the Venafi TPP certificate: %v", err))
		return err
	}

	x509Cert, err := pki.DecodeX509CertificateBytes(retrieved.CertificatePEM)
	if err != nil {
		return c.setCondition(ctx, crt, cmmeta.ConditionFalse, ReasonInvalidCertificate,
			fmt.Sprintf("failed to decode the Venafi certificate: %v", err))
	}

	var chain []*x509.Certificate
	if len(retrieved.ChainPEM) > 0 {
		chain, err = pki.DecodeX509CertificateChainBytes(retrieved.ChainPEM)
		if err != nil {
			return c.setCondition(ctx, crt, cmmeta.ConditionFalse, ReasonInvalidCertificate,
				fmt.Sprintf("failed to decode the Venafi certificate chain: %v", err))
		}
	}

	privateKey, err := pki.DecodePrivateKeyBytes(retrieved.PrivateKeyPEM)
	if err != nil {
		return c.setCondition(ctx, crt, cmmeta.ConditionFalse, ReasonInvalidCertificate,
			fmt.Sprintf("failed to decode the Venafi private key: %v", err))
	}

	if err := validateAdoption(crt, x509Cert, chain, privateKey, c.clock.Now()); err != nil {
		reason := ReasonForError(err)
		if reason == "" {
			reason = ReasonInvalidCertificate
		}
		return c.setCondition(ctx, crt, cmmeta.ConditionFalse, reason, err.Error())
	}

	if err := c.writeAdoptedPrivateKey(ctx, crt, candidate, retrieved.PrivateKeyPEM); err != nil {
		_ = c.setCondition(ctx, crt, cmmeta.ConditionFalse, ReasonRetrieveFailed,
			fmt.Sprintf("failed to write the adopted private key: %v", err))
		return err
	}

	c.recorder.Eventf(crt, corev1.EventTypeNormal, ReasonAdopted,
		"Adopted Venafi TPP certificate %s", candidate.DN)

	return c.setCondition(ctx, crt, cmmeta.ConditionTrue, ReasonAdopted,
		"adopted Venafi TPP certificate "+candidate.DN)
}

func (c *controller) setCondition(
	ctx context.Context,
	crt *cmapi.Certificate,
	status cmmeta.ConditionStatus,
	reason, message string,
) error {
	latest, err := c.cmClient.CertmanagerV1().Certificates(crt.Namespace).Get(ctx, crt.Name, metav1.GetOptions{})
	if err != nil {
		latest = crt.DeepCopy()
	}

	apiutil.SetCertificateCondition(
		latest,
		latest.Generation,
		cmapi.CertificateConditionVenafiAdoption,
		status,
		reason,
		message,
	)

	_, err = c.cmClient.CertmanagerV1().Certificates(latest.Namespace).UpdateStatus(ctx, latest, metav1.UpdateOptions{})
	return err
}

func (c *controller) targetSecretHasKey(crt *cmapi.Certificate) bool {
	secret, err := c.secretLister.Secrets(crt.Namespace).Get(crt.Spec.SecretName)
	if err != nil {
		return false
	}
	return len(secret.Data[corev1.TLSPrivateKeyKey]) > 0
}

func adoptionMinRemaining(crt *cmapi.Certificate) time.Duration {
	duration := apiutil.DefaultCertDuration(crt.Spec.Duration)
	renewBefore := pki.RenewBefore(duration, crt.Spec.RenewBefore, crt.Spec.RenewBeforePercentage)
	return renewBefore + 5*time.Minute
}

func isPrivateKeyUnavailable(err error) bool {
	if err == nil {
		return false
	}

	message := strings.ToLower(err.Error())
	return strings.Contains(message, "private key") &&
		(strings.Contains(message, "vault") ||
			strings.Contains(message, "not stored") ||
			strings.Contains(message, "user-provided csr") ||
			strings.Contains(message, "no private key"))
}

type controllerWrapper struct {
	*controller
}

func (c *controllerWrapper) Register(ctx *controllerpkg.Context) (workqueue.TypedRateLimitingInterface[types.NamespacedName], []cache.InformerSynced, error) {
	log := logf.FromContext(ctx.RootContext, ControllerName)

	ctrl, queue, mustSync, err := NewController(log, ctx)
	c.controller = ctrl

	return queue, mustSync, err
}

func init() {
	controllerpkg.Register(ControllerName, func(ctx *controllerpkg.ContextFactory) (controllerpkg.Interface, error) {
		return controllerpkg.NewBuilder(ctx, ControllerName).
			For(&controllerWrapper{}).
			Complete()
	})
}
```

---

## 2. New file: `pkg/controller/certificates/venafi-adoption/secret.go`

```go
/*
Copyright 2026 The cert-manager Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package venafiadoption

import (
	"context"
	"maps"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	cmapi "github.com/cert-manager/cert-manager/pkg/apis/certmanager/v1"
	"github.com/cert-manager/cert-manager/pkg/issuer/venafi/client/api"
	"github.com/cert-manager/cert-manager/pkg/util/pki"
)

// targetSecretState reports whether the target Secret already contains a usable
// certificate/key pair, and whether it is owned by a different Certificate.
func (c *controller) targetSecretState(crt *cmapi.Certificate) (usable bool, conflict bool) {
	secret, err := c.secretLister.Secrets(crt.Namespace).Get(crt.Spec.SecretName)
	if apierrors.IsNotFound(err) {
		return false, false
	}
	if err != nil {
		return false, false
	}

	if owner := metav1.GetControllerOf(secret); owner != nil && owner.UID != crt.UID {
		return false, true
	}
	if name, ok := secret.Annotations[cmapi.CertificateNameKey]; ok && name != crt.Name {
		return false, true
	}

	certPEM := secret.Data[corev1.TLSCertKey]
	keyPEM := secret.Data[corev1.TLSPrivateKeyKey]
	if len(certPEM) == 0 || len(keyPEM) == 0 {
		return false, false
	}

	cert, err := pki.DecodeX509CertificateBytes(certPEM)
	if err != nil {
		return false, false
	}
	key, err := pki.DecodePrivateKeyBytes(keyPEM)
	if err != nil {
		return false, false
	}

	keysMatch, err := pki.PublicKeysEqual(cert.PublicKey, key.Public())
	if err != nil || !keysMatch {
		return false, false
	}

	if len(pki.PrivateKeyMatchesSpec(key, crt.Spec)) > 0 {
		return false, false
	}

	if err := validateIdentity(crt, cert); err != nil {
		return false, false
	}

	return true, false
}

// writeAdoptedPrivateKey writes only tls.key to the target Secret. The
// certificate itself is returned later by the Venafi issuer reuse check.
func (c *controller) writeAdoptedPrivateKey(
	ctx context.Context,
	crt *cmapi.Certificate,
	existing api.ExistingCertificate,
	keyPEM []byte,
) error {
	secret, err := c.coreClient.CoreV1().Secrets(crt.Namespace).Get(ctx, crt.Spec.SecretName, metav1.GetOptions{})
	if apierrors.IsNotFound(err) {
		secret = &corev1.Secret{
			ObjectMeta: metav1.ObjectMeta{
				Name:      crt.Spec.SecretName,
				Namespace: crt.Namespace,
			},
			Type: corev1.SecretTypeTLS,
			Data: make(map[string][]byte),
		}
	} else if err != nil {
		return err
	} else {
		secret = secret.DeepCopy()
	}

	if secret.Data == nil {
		secret.Data = make(map[string][]byte)
	}
	secret.Data[corev1.TLSPrivateKeyKey] = keyPEM

	if secret.Labels == nil {
		secret.Labels = make(map[string]string)
	}
	secret.Labels[cmapi.PartOfCertManagerControllerLabelKey] = "true"

	if secret.Annotations == nil {
		secret.Annotations = make(map[string]string)
	}
	secret.Annotations[cmapi.CertificateNameKey] = crt.Name
	secret.Annotations[cmapi.VenafiCertificateDNAnnotationKey] = existing.DN
	secret.Annotations[cmapi.VenafiCertificateGUIDAnnotationKey] = existing.GUID
	secret.Annotations[cmapi.VenafiCertificateThumbprintAnnotationKey] = existing.Thumbprint

	if crt.Spec.SecretTemplate != nil {
		maps.Copy(secret.Labels, crt.Spec.SecretTemplate.Labels)
		maps.Copy(secret.Annotations, crt.Spec.SecretTemplate.Annotations)
	}

	secret.OwnerReferences = []metav1.OwnerReference{
		*metav1.NewControllerRef(crt, certificateGvk),
	}

	if secret.ResourceVersion == "" {
		_, err = c.coreClient.CoreV1().Secrets(crt.Namespace).Create(ctx, secret, metav1.CreateOptions{})
		return err
	}

	_, err = c.coreClient.CoreV1().Secrets(crt.Namespace).Update(ctx, secret, metav1.UpdateOptions{})
	return err
}
```

---

## 3. New file: `pkg/controller/certificates/venafi-adoption/controller_test.go`

```go
/*
Copyright 2026 The cert-manager Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package venafiadoption

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"math/big"
	"testing"
	"time"

	"github.com/go-logr/logr"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	fakeclock "k8s.io/utils/clock/testing"
	"k8s.io/utils/ptr"

	internalinformers "github.com/cert-manager/cert-manager/internal/informers"
	apiutil "github.com/cert-manager/cert-manager/pkg/api/util"
	cmapi "github.com/cert-manager/cert-manager/pkg/apis/certmanager/v1"
	cmmeta "github.com/cert-manager/cert-manager/pkg/apis/meta/v1"
	testpkg "github.com/cert-manager/cert-manager/pkg/controller/test"
	"github.com/cert-manager/cert-manager/pkg/issuer/venafi/client/api"
	venaficlient "github.com/cert-manager/cert-manager/pkg/issuer/venafi/client"
	venaficlientfake "github.com/cert-manager/cert-manager/pkg/issuer/venafi/client/fake"
	"github.com/cert-manager/cert-manager/pkg/metrics"
	"github.com/cert-manager/cert-manager/pkg/util/pki"
)

func newTestCertificate(
	t *testing.T,
	crt *cmapi.Certificate,
	notBefore, notAfter time.Time,
) (*x509.Certificate, []byte, []byte) {
	t.Helper()

	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}

	template := &x509.Certificate{
		SerialNumber:   big.NewInt(1),
		Subject:        pkix.Name{CommonName: crt.Spec.CommonName},
		DNSNames:       append([]string(nil), crt.Spec.DNSNames...),
		EmailAddresses: append([]string(nil), crt.Spec.EmailAddresses...),
		NotBefore:      notBefore,
		NotAfter:       notAfter,
	}

	keyUsage, extKeyUsage, err := pki.KeyUsagesForCertificateOrCertificateRequest(crt.Spec.Usages, crt.Spec.IsCA)
	if err != nil {
		t.Fatal(err)
	}
	template.KeyUsage = keyUsage
	template.ExtKeyUsage = extKeyUsage
	template.IsCA = crt.Spec.IsCA
	if crt.Spec.IsCA {
		template.BasicConstraintsValid = true
	}

	der, err := x509.CreateCertificate(rand.Reader, template, template, key.Public(), key)
	if err != nil {
		t.Fatal(err)
	}

	cert, err := x509.ParseCertificate(der)
	if err != nil {
		t.Fatal(err)
	}

	certPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der})
	keyPEM, err := pki.EncodePKCS8PrivateKey(key)
	if err != nil {
		t.Fatal(err)
	}

	return cert, certPEM, keyPEM
}

func newVenafiIssuer() *cmapi.ClusterIssuer {
	return &cmapi.ClusterIssuer{
		ObjectMeta: metav1.ObjectMeta{Name: "venafi-tpp"},
		Spec: cmapi.IssuerSpec{
			IssuerConfig: cmapi.IssuerConfig{
				Venafi: &cmapi.VenafiIssuer{
					Zone: "TeamA",
					TPP: &cmapi.VenafiTPP{
						URL: "https://tpp.example.com/vedsdk",
						CredentialsRef: cmmeta.LocalObjectReference{
							Name: "venafi-creds",
						},
					},
				},
			},
		},
	}
}

func newCertificateCR() *cmapi.Certificate {
	return &cmapi.Certificate{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "app",
			Namespace: "team-a",
			UID:       types.UID("app-uid"),
			Annotations: map[string]string{
				cmapi.VenafiAdoptExistingAnnotationKey: "true",
			},
		},
		Spec: cmapi.CertificateSpec{
			SecretName: "app-tls",
			CommonName: "app.example.com",
			DNSNames:   []string{"app.example.com"},
			IssuerRef: cmmeta.IssuerReference{
				Name: "venafi-tpp",
				Kind: "ClusterIssuer",
			},
			PrivateKey: &cmapi.CertificatePrivateKey{
				RotationPolicy: cmapi.RotationPolicyNever,
				Algorithm:      cmapi.RSAKeyAlgorithm,
				Size:           2048,
			},
			Usages: []cmapi.KeyUsage{
				cmapi.UsageDigitalSignature,
				cmapi.UsageKeyEncipherment,
			},
		},
	}
}

func runControllerTest(
	t *testing.T,
	crt *cmapi.Certificate,
	issuerObj *cmapi.ClusterIssuer,
	kubeObjects []runtime.Object,
	fakeClient venaficlient.Interface,
) (*cmapi.Certificate, *corev1.Secret, error) {
	t.Helper()

	now := time.Now()
	builder := &testpkg.Builder{
		T:                  t,
		CertManagerObjects: []runtime.Object{crt, issuerObj},
		KubeObjects:        kubeObjects,
		Clock:              fakeclock.NewFakeClock(now),
	}
	builder.Init()

	w := &controllerWrapper{}
	if _, _, err := w.Register(builder.Context); err != nil {
		t.Fatal(err)
	}

	w.controller.clientBuilder = func(
		_ string,
		_ internalinformers.SecretLister,
		_ cmapi.GenericIssuer,
		_ *metrics.Metrics,
		_ logr.Logger,
		_ string,
	) (venaficlient.Interface, error) {
		return fakeClient, nil
	}

	builder.Start()
	defer builder.Stop()

	err := w.controller.ProcessItem(t.Context(), types.NamespacedName{
		Namespace: crt.Namespace,
		Name:      crt.Name,
	})
	builder.Sync()

	gotCrt, getErr := builder.FakeCMClient().CertmanagerV1().Certificates(crt.Namespace).Get(
		t.Context(), crt.Name, metav1.GetOptions{},
	)
	if getErr != nil {
		t.Fatal(getErr)
	}

	gotSecret, secretErr := builder.FakeKubeClient().CoreV1().Secrets(crt.Namespace).Get(
		t.Context(), crt.Spec.SecretName, metav1.GetOptions{},
	)
	if apierrors.IsNotFound(secretErr) {
		gotSecret = nil
	} else if secretErr != nil {
		t.Fatal(secretErr)
	}

	return gotCrt, gotSecret, err
}

func TestProcessItem(t *testing.T) {
	now := time.Now()
	crtForCert := newCertificateCR()
	_, validCertPEM, validKeyPEM := newTestCertificate(
		t,
		crtForCert,
		now.Add(-time.Hour),
		now.Add(90*24*time.Hour),
	)

	expiredCrt := newCertificateCR()
	_, expiredCertPEM, expiredKeyPEM := newTestCertificate(
		t,
		expiredCrt,
		now.Add(-48*time.Hour),
		now.Add(-time.Hour),
	)

	tests := map[string]struct {
		mutate      func(*cmapi.Certificate, *cmapi.ClusterIssuer)
		kubeObjects []runtime.Object
		fakeClient  *venaficlientfake.Venafi
		wantReason  string
		wantStatus  cmmeta.ConditionStatus
		wantKey     bool
		wantErr     bool
	}{
		"no annotation": {
			mutate: func(crt *cmapi.Certificate, _ *cmapi.ClusterIssuer) {
				delete(crt.Annotations, cmapi.VenafiAdoptExistingAnnotationKey)
			},
		},
		"issuer is not Venafi TPP": {
			mutate: func(_ *cmapi.Certificate, issuer *cmapi.ClusterIssuer) {
				issuer.Spec.Venafi.TPP = nil
			},
			wantReason: ReasonNotApplicable,
			wantStatus: cmmeta.ConditionFalse,
		},
		"rotation policy is not Never": {
			mutate: func(crt *cmapi.Certificate, _ *cmapi.ClusterIssuer) {
				crt.Spec.PrivateKey.RotationPolicy = cmapi.RotationPolicyAlways
			},
			wantReason: ReasonRequiresRotationPolicyNever,
			wantStatus: cmmeta.ConditionFalse,
		},
		"no matching certificate": {
			fakeClient: &venaficlientfake.Venafi{
				SearchExistingCertificatesFn: func(string, string, []string, time.Duration) ([]api.ExistingCertificate, error) {
					return nil, nil
				},
			},
			wantReason: ReasonNotFound,
			wantStatus: cmmeta.ConditionFalse,
		},
		"successful adoption": {
			fakeClient: &venaficlientfake.Venafi{
				SearchExistingCertificatesFn: func(string, string, []string, time.Duration) ([]api.ExistingCertificate, error) {
					return []api.ExistingCertificate{
						{
							DN:         `\VED\Policy\TeamA\app.example.com`,
							GUID:       "{guid}",
							CN:         "app.example.com",
							DNSNames:   []string{"app.example.com"},
							NotAfter:   now.Add(90 * 24 * time.Hour),
							Thumbprint: "thumb",
						},
					}, nil
				},
				RetrieveExistingCertificateFn: func(string, string) (*api.RetrievedCertificate, error) {
					return &api.RetrievedCertificate{
						CertificatePEM: validCertPEM,
						PrivateKeyPEM:  validKeyPEM,
					}, nil
				},
			},
			wantReason: ReasonAdopted,
			wantStatus: cmmeta.ConditionTrue,
			wantKey:    true,
		},
		"certificate has no private key": {
			fakeClient: &venaficlientfake.Venafi{
				SearchExistingCertificatesFn: func(string, string, []string, time.Duration) ([]api.ExistingCertificate, error) {
					return []api.ExistingCertificate{
						{
							DN:         `\VED\Policy\TeamA\app.example.com`,
							CN:         "app.example.com",
							DNSNames:   []string{"app.example.com"},
							NotAfter:   now.Add(90 * 24 * time.Hour),
							Thumbprint: "thumb",
						},
					}, nil
				},
				RetrieveExistingCertificateFn: func(string, string) (*api.RetrievedCertificate, error) {
					return nil, fmt.Errorf("Failed to look up private key vault ID")
				},
			},
			wantReason: ReasonPrivateKeyUnavailable,
			wantStatus: cmmeta.ConditionFalse,
		},
		"expired certificate": {
			fakeClient: &venaficlientfake.Venafi{
				SearchExistingCertificatesFn: func(string, string, []string, time.Duration) ([]api.ExistingCertificate, error) {
					return []api.ExistingCertificate{
						{
							DN:         `\VED\Policy\TeamA\app.example.com`,
							CN:         "app.example.com",
							DNSNames:   []string{"app.example.com"},
							NotAfter:   now.Add(-time.Hour),
							Thumbprint: "thumb",
						},
					}, nil
				},
				RetrieveExistingCertificateFn: func(string, string) (*api.RetrievedCertificate, error) {
					return &api.RetrievedCertificate{
						CertificatePEM: expiredCertPEM,
						PrivateKeyPEM:  expiredKeyPEM,
					}, nil
				},
			},
			wantReason: ReasonExpired,
			wantStatus: cmmeta.ConditionFalse,
		},
		"search failure is retried": {
			fakeClient: &venaficlientfake.Venafi{
				SearchExistingCertificatesFn: func(string, string, []string, time.Duration) ([]api.ExistingCertificate, error) {
					return nil, fmt.Errorf("search failed")
				},
			},
			wantReason: ReasonSearchFailed,
			wantStatus: cmmeta.ConditionFalse,
			wantErr:    true,
		},
		"multiple ambiguous certificates": {
			fakeClient: &venaficlientfake.Venafi{
				SearchExistingCertificatesFn: func(string, string, []string, time.Duration) ([]api.ExistingCertificate, error) {
					return []api.ExistingCertificate{
						{
							DN:         `\VED\Policy\TeamA\app.example.com`,
							CN:         "app.example.com",
							DNSNames:   []string{"app.example.com"},
							NotAfter:   now.Add(90 * 24 * time.Hour),
							Thumbprint: "thumb-a",
						},
						{
							DN:         `\VED\Policy\TeamA\app.example.com-2`,
							CN:         "app.example.com",
							DNSNames:   []string{"app.example.com"},
							NotAfter:   now.Add(90 * 24 * time.Hour),
							Thumbprint: "thumb-b",
						},
					}, nil
				},
			},
			wantReason: ReasonAmbiguous,
			wantStatus: cmmeta.ConditionFalse,
		},
		"target Secret already valid": {
			kubeObjects: []runtime.Object{
				&corev1.Secret{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "app-tls",
						Namespace: "team-a",
						Annotations: map[string]string{
							cmapi.CertificateNameKey: "app",
						},
					},
					Type: corev1.SecretTypeTLS,
					Data: map[string][]byte{
						corev1.TLSCertKey:       validCertPEM,
						corev1.TLSPrivateKeyKey: validKeyPEM,
					},
				},
			},
			fakeClient: &venaficlientfake.Venafi{},
			wantReason: ReasonAlreadyPresent,
			wantStatus: cmmeta.ConditionTrue,
			wantKey:    true,
		},
		"renewal is skipped": {
			mutate: func(crt *cmapi.Certificate, _ *cmapi.ClusterIssuer) {
				crt.Status.Revision = ptr.To(1)
			},
			kubeObjects: []runtime.Object{
				&corev1.Secret{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "app-tls",
						Namespace: "team-a",
					},
					Type: corev1.SecretTypeTLS,
					Data: map[string][]byte{
						corev1.TLSPrivateKeyKey: validKeyPEM,
					},
				},
			},
			fakeClient: &venaficlientfake.Venafi{},
			wantReason: ReasonRenewal,
			wantStatus: cmmeta.ConditionFalse,
		},
	}

	for name, test := range tests {
		t.Run(name, func(t *testing.T) {
			crt := newCertificateCR()
			issuerObj := newVenafiIssuer()
			if test.mutate != nil {
				test.mutate(crt, issuerObj)
			}

			fakeClient := test.fakeClient
			if fakeClient == nil {
				fakeClient = &venaficlientfake.Venafi{}
			}

			gotCrt, gotSecret, err := runControllerTest(t, crt, issuerObj, test.kubeObjects, fakeClient)
			if (err != nil) != test.wantErr {
				t.Fatalf("ProcessItem() error = %v, wantErr %v", err, test.wantErr)
			}

			if test.wantReason == "" {
				if cond := apiutil.GetCertificateCondition(gotCrt, cmapi.CertificateConditionVenafiAdoption); cond != nil {
					t.Fatalf("expected no VenafiAdoption condition, got %+v", cond)
				}
				return
			}

			cond := apiutil.GetCertificateCondition(gotCrt, cmapi.CertificateConditionVenafiAdoption)
			if cond == nil {
				t.Fatalf("expected VenafiAdoption condition with reason %q, got nil", test.wantReason)
			}
			if cond.Reason != test.wantReason {
				t.Fatalf("condition reason = %q, want %q", cond.Reason, test.wantReason)
			}
			if cond.Status != test.wantStatus {
				t.Fatalf("condition status = %q, want %q", cond.Status, test.wantStatus)
			}

			if test.wantKey {
				if gotSecret == nil {
					t.Fatal("expected a target Secret")
				}
				if len(gotSecret.Data[corev1.TLSPrivateKeyKey]) == 0 {
					t.Fatal("expected tls.key in the target Secret")
				}
			}
		})
	}
}
```

---

## 4. New file: `pkg/controller/certificates/venafi-adoption/secret_test.go`

```go
/*
Copyright 2026 The cert-manager Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package venafiadoption

import (
	"testing"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"

	cmapi "github.com/cert-manager/cert-manager/pkg/apis/certmanager/v1"
	testpkg "github.com/cert-manager/cert-manager/pkg/controller/test"
	"github.com/cert-manager/cert-manager/pkg/issuer/venafi/client/api"
)

func TestTargetSecretState(t *testing.T) {
	now := time.Now()
	crt := newCertificateCR()
	_, certPEM, keyPEM := newTestCertificate(t, crt, now.Add(-time.Hour), now.Add(90*24*time.Hour))

	tests := map[string]struct {
		kubeObjects []runtime.Object
		wantUsable  bool
		wantConflict bool
	}{
		"secret does not exist": {},
		"valid secret": {
			kubeObjects: []runtime.Object{
				&corev1.Secret{
					ObjectMeta: metav1.ObjectMeta{
						Name:      crt.Spec.SecretName,
						Namespace: crt.Namespace,
						Annotations: map[string]string{
							cmapi.CertificateNameKey: crt.Name,
						},
					},
					Data: map[string][]byte{
						corev1.TLSCertKey:       certPEM,
						corev1.TLSPrivateKeyKey: keyPEM,
					},
				},
			},
			wantUsable: true,
		},
		"secret owned by another certificate": {
			kubeObjects: []runtime.Object{
				&corev1.Secret{
					ObjectMeta: metav1.ObjectMeta{
						Name:      crt.Spec.SecretName,
						Namespace: crt.Namespace,
						OwnerReferences: []metav1.OwnerReference{
							*metav1.NewControllerRef(&cmapi.Certificate{
								ObjectMeta: metav1.ObjectMeta{
									Name:      "other",
									Namespace: crt.Namespace,
									UID:       "other-uid",
								},
							}, certificateGvk),
						},
					},
					Data: map[string][]byte{
						corev1.TLSCertKey:       certPEM,
						corev1.TLSPrivateKeyKey: keyPEM,
					},
				},
			},
			wantConflict: true,
		},
	}

	for name, test := range tests {
		t.Run(name, func(t *testing.T) {
			builder := &testpkg.Builder{
				T:           t,
				KubeObjects: test.kubeObjects,
			}
			builder.Init()
			builder.Start()
			defer builder.Stop()

			c := &controller{
				secretLister: builder.Context.KubeSharedInformerFactory.Secrets().Lister(),
				coreClient:   builder.Context.Client,
				cmClient:     builder.Context.CMClient,
			}

			usable, conflict := c.targetSecretState(crt)
			if usable != test.wantUsable {
				t.Fatalf("usable = %t, want %t", usable, test.wantUsable)
			}
			if conflict != test.wantConflict {
				t.Fatalf("conflict = %t, want %t", conflict, test.wantConflict)
			}
		})
	}
}

func TestWriteAdoptedPrivateKey(t *testing.T) {
	now := time.Now()
	crt := newCertificateCR()
	_, _, keyPEM := newTestCertificate(t, crt, now.Add(-time.Hour), now.Add(90*24*time.Hour))

	builder := &testpkg.Builder{T: t}
	builder.Init()
	builder.Start()
	defer builder.Stop()

	c := &controller{
		secretLister: builder.Context.KubeSharedInformerFactory.Secrets().Lister(),
		coreClient:   builder.Context.Client,
		cmClient:     builder.Context.CMClient,
	}

	existing := api.ExistingCertificate{
		DN:         `\VED\Policy\TeamA\app.example.com`,
		GUID:       "{guid}",
		Thumbprint: "thumb",
	}

	if err := c.writeAdoptedPrivateKey(t.Context(), crt, existing, keyPEM); err != nil {
		t.Fatal(err)
	}

	secret, err := builder.FakeKubeClient().CoreV1().Secrets(crt.Namespace).Get(
		t.Context(), crt.Spec.SecretName, metav1.GetOptions{},
	)
	if err != nil {
		t.Fatal(err)
	}

	if secret.Type != corev1.SecretTypeTLS {
		t.Fatalf("secret type = %q, want %q", secret.Type, corev1.SecretTypeTLS)
	}
	if len(secret.Data[corev1.TLSPrivateKeyKey]) == 0 {
		t.Fatal("expected tls.key in the Secret")
	}
	if len(secret.Data[corev1.TLSCertKey]) != 0 {
		t.Fatal("adoption must not write tls.crt")
	}
	if got := secret.Annotations[cmapi.VenafiCertificateDNAnnotationKey]; got != existing.DN {
		t.Fatalf("certificate DN annotation = %q, want %q", got, existing.DN)
	}
	if got := secret.Annotations[cmapi.CertificateNameKey]; got != crt.Name {
		t.Fatalf("certificate name annotation = %q, want %q", got, crt.Name)
	}
	if got := secret.Labels[cmapi.PartOfCertManagerControllerLabelKey]; got != "true" {
		t.Fatalf("fao label = %q, want true", got)
	}
	if len(secret.OwnerReferences) == 0 {
		t.Fatal("expected an owner reference to the Certificate")
	}
}
```

---

## 5. Notes

- The controller writes only `tls.key` so the trigger controller starts the normal issuance flow and cert-manager sets `status.revision`, `notAfter`, and `renewalTime`.
- The issuer reuse check from Phase 6 returns the existing certificate, so `RequestCertificate` is not called.
- TPP errors are returned to the workqueue and retried.
- No-certificate, no-private-key, expired, and not-yet-valid outcomes are terminal skips and let normal issuance proceed.
- Key/identity/usage/chain mismatches set a failed condition and do not issue.
- `setCondition` fetches the latest Certificate before updating the status to avoid stale resource version conflicts.
- `targetSecretState` uses `validateIdentity` from Phase 3 to decide whether an existing Secret is already usable.
- The controller is registered in `init()`, but it is only enabled once added to the default controller list in Phase 8.
```
