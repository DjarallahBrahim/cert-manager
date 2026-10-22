# Phase 7 - Full Code

This document contains the complete change for Phase 7 of the Venafi TPP existing certificate adoption feature.

Scope:

- Add the same certificate reuse check to the Kubernetes `CertificateSigningRequest` Venafi signer.
- This path cannot adopt a private key because it has no target Secret. It can only reuse an existing certificate when the CSR public key already matches it.
- This phase is optional if the feature is limited to `Certificate` resources.

Files:

- Update: `pkg/controller/certificatesigningrequests/venafi/venafi.go`
- Update: `pkg/controller/certificatesigningrequests/venafi/venafi_test.go`

Prerequisites:

- Phase 2 `FindReusableCertificate`.

---

## 1. Change to `pkg/controller/certificatesigningrequests/venafi/venafi.go`

### 1.1 Add imports

Add:

```go
	"time"

	"github.com/go-logr/logr"
```

The import block becomes:

```go
import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/Venafi/vcert/v5/pkg/endpoint"
	"github.com/go-logr/logr"
	certificatesv1 "k8s.io/api/certificates/v1"
	...
)
```

### 1.2 Insert the reuse check

In `Sign`, inside `if len(pickupID) == 0 {` and before:

```go
		pickupID, err := client.RequestCertificate(csr.Spec.Request, duration, customFields)
```

insert:

```go
		// Before creating a new Venafi request, try to reuse an existing
		// certificate whose public key matches the CSR.
		if issuerObj.GetSpec().Venafi != nil && issuerObj.GetSpec().Venafi.TPP != nil {
			minRemaining := duration / 3
			if minRemaining < 5*time.Minute {
				minRemaining = 5 * time.Minute
			}

			reusable, reuseErr := client.FindReusableCertificate(
				issuerObj.GetSpec().Venafi.Zone,
				csr.Spec.Request,
				minRemaining,
			)
			if reuseErr != nil {
				message := fmt.Sprintf("Failed to search Venafi TPP for a reusable certificate: %s", reuseErr)
				log.Error(reuseErr, message)
				v.recorder.Event(csr, corev1.EventTypeWarning, "ErrorReuse", message)
				return reuseErr
			}

			if reusable != nil {
				certPEM := make([]byte, 0, len(reusable.CertificatePEM)+len(reusable.ChainPEM)+1)
				certPEM = append(certPEM, reusable.CertificatePEM...)
				if len(reusable.ChainPEM) > 0 {
					certPEM = append(certPEM, '\n')
					certPEM = append(certPEM, reusable.ChainPEM...)
				}

				return v.finishSigning(ctx, csr, certPEM, log)
			}
		}
```

### 1.3 Extract the success path into a helper

Replace the existing success block:

```go
	bundle, err := utilpki.ParseSingleCertificateChainPEM(certPem)
	if err != nil {
		message := fmt.Sprintf("Failed to parse returned certificate bundle: %s", err)
		log.Error(err, message)
		v.recorder.Event(csr, corev1.EventTypeWarning, "ErrorParse", message)
		util.CertificateSigningRequestSetFailed(csr, "ErrorParse", message)
		_, userr := util.UpdateOrApplyStatus(ctx, v.certClient, csr, certificatesv1.CertificateFailed, v.fieldManager)
		return userr
	}

	csr.Status.Certificate = bundle.ChainPEM
	csr, err = util.UpdateOrApplyStatus(ctx, v.certClient, csr, "", v.fieldManager)
	if err != nil {
		message := "Error updating certificate"
		v.recorder.Eventf(csr, corev1.EventTypeWarning, "SigningError", "%s: %s", message, err)
		return err
	}

	log.V(logf.DebugLevel).Info("certificate issued")
	v.recorder.Event(csr, corev1.EventTypeNormal, "CertificateIssued", "Certificate fetched from venafi issuer successfully")

	return nil
```

with:

```go
	return v.finishSigning(ctx, csr, certPem, log)
```

Then add the helper:

```go
func (v *Venafi) finishSigning(
	ctx context.Context,
	csr *certificatesv1.CertificateSigningRequest,
	certPEM []byte,
	log logr.Logger,
) error {
	bundle, err := utilpki.ParseSingleCertificateChainPEM(certPEM)
	if err != nil {
		message := fmt.Sprintf("Failed to parse returned certificate bundle: %s", err)
		log.Error(err, message)
		v.recorder.Event(csr, corev1.EventTypeWarning, "ErrorParse", message)
		util.CertificateSigningRequestSetFailed(csr, "ErrorParse", message)
		_, userr := util.UpdateOrApplyStatus(ctx, v.certClient, csr, certificatesv1.CertificateFailed, v.fieldManager)
		return userr
	}

	csr.Status.Certificate = bundle.ChainPEM
	csr, err = util.UpdateOrApplyStatus(ctx, v.certClient, csr, "", v.fieldManager)
	if err != nil {
		message := "Error updating certificate"
		v.recorder.Eventf(csr, corev1.EventTypeWarning, "SigningError", "%s: %s", message, err)
		return err
	}

	log.V(logf.DebugLevel).Info("certificate issued")
	v.recorder.Event(csr, corev1.EventTypeNormal, "CertificateIssued", "Certificate fetched from venafi issuer successfully")

	return nil
}
```

The surrounding block becomes:

```go
	pickupID := csr.GetAnnotations()[experimentalapi.CertificateSigningRequestVenafiPickupIDAnnotationKey]

	if len(pickupID) == 0 {
		// Before creating a new Venafi request, try to reuse an existing
		// certificate whose public key matches the CSR.
		if issuerObj.GetSpec().Venafi != nil && issuerObj.GetSpec().Venafi.TPP != nil {
			...
		}

		pickupID, err := client.RequestCertificate(csr.Spec.Request, duration, customFields)
		...
	}

	certPem, err := client.RetrieveCertificate(...)
	...
	return v.finishSigning(ctx, csr, certPem, log)
```

---

## 2. Add a focused test to `pkg/controller/certificatesigningrequests/venafi/venafi_test.go`

Add the following imports if they are not already present:

```go
	"crypto/x509"
	"time"

	certificatesv1 "k8s.io/api/certificates/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	k8sfake "k8s.io/client-go/kubernetes/fake"
	"k8s.io/client-go/tools/record"

	cmapi "github.com/cert-manager/cert-manager/pkg/apis/certmanager/v1"
	cmmeta "github.com/cert-manager/cert-manager/pkg/apis/meta/v1"
	experimentalapi "github.com/cert-manager/cert-manager/pkg/apis/experimental/v1alpha1"
	controllerpkg "github.com/cert-manager/cert-manager/pkg/controller"
	venaficlient "github.com/cert-manager/cert-manager/pkg/issuer/venafi/client"
	venafiapi "github.com/cert-manager/cert-manager/pkg/issuer/venafi/client/api"
	fakevenaficlient "github.com/cert-manager/cert-manager/pkg/issuer/venafi/client/fake"
	"github.com/cert-manager/cert-manager/pkg/util/pki"
	"github.com/cert-manager/cert-manager/test/unit/gen"
)
```

Some of these are already imported by the existing test file. Keep the existing imports and add only the missing packages.

Test function:

```go
func TestSignReusesExistingCertificate(t *testing.T) {
	rootCSRPEM, rootPK, err := gen.CSR(x509.RSA, gen.SetCSRCommonName("root"))
	if err != nil {
		t.Fatal(err)
	}

	rootTmpl, err := pki.CertificateTemplateFromCSRPEM(
		rootCSRPEM,
		pki.CertificateTemplateOverrideDuration(time.Hour),
		pki.CertificateTemplateValidateAndOverrideBasicConstraints(true, nil),
		pki.CertificateTemplateValidateAndOverrideKeyUsages(0, nil),
	)
	if err != nil {
		t.Fatal(err)
	}

	rootPEM, rootCert, err := pki.SignCertificate(rootTmpl, rootTmpl, rootPK.Public(), rootPK)
	if err != nil {
		t.Fatal(err)
	}

	leafCSRPEM, leafPK, err := gen.CSR(x509.RSA, gen.SetCSRCommonName("leaf"))
	if err != nil {
		t.Fatal(err)
	}

	leafTmpl, err := pki.CertificateTemplateFromCSRPEM(
		leafCSRPEM,
		pki.CertificateTemplateOverrideDuration(time.Hour),
		pki.CertificateTemplateValidateAndOverrideBasicConstraints(false, nil),
		pki.CertificateTemplateValidateAndOverrideKeyUsages(0, nil),
	)
	if err != nil {
		t.Fatal(err)
	}

	leafPEM, _, err := pki.SignCertificate(leafTmpl, rootCert, leafPK.Public(), rootPK)
	if err != nil {
		t.Fatal(err)
	}

	issuerObj := &cmapi.Issuer{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "venafi-tpp",
			Namespace: "testns",
		},
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

	tests := map[string]struct {
		fakeClient       *fakevenaficlient.Venafi
		wantErr          bool
		wantPickup       bool
		wantCertificate  bool
	}{
		"matching certificate is reused": {
			fakeClient: &fakevenaficlient.Venafi{
				FindReusableCertificateFn: func(string, []byte, time.Duration) (*venafiapi.RetrievedCertificate, error) {
					return &venafiapi.RetrievedCertificate{
						CertificatePEM: leafPEM,
						ChainPEM:       rootPEM,
						CAPEM:          rootPEM,
					}, nil
				},
				RequestCertificateFn: func([]byte, time.Duration, []venafiapi.CustomField) (string, error) {
					t.Fatal("RequestCertificate must not be called when a certificate is reused")
					return "", nil
				},
			},
			wantCertificate: true,
		},
		"no matching certificate requests a new one": {
			fakeClient: &fakevenaficlient.Venafi{
				FindReusableCertificateFn: func(string, []byte, time.Duration) (*venafiapi.RetrievedCertificate, error) {
					return nil, nil
				},
				RequestCertificateFn: func([]byte, time.Duration, []venafiapi.CustomField) (string, error) {
					return "test-pickup", nil
				},
			},
			wantPickup: true,
		},
		"reuse search error is returned": {
			fakeClient: &fakevenaficlient.Venafi{
				FindReusableCertificateFn: func(string, []byte, time.Duration) (*venafiapi.RetrievedCertificate, error) {
					return nil, errors.New("tpp unavailable")
				},
				RequestCertificateFn: func([]byte, time.Duration, []venafiapi.CustomField) (string, error) {
					t.Fatal("RequestCertificate must not be called after a reuse search error")
					return "", nil
				},
			},
			wantErr: true,
		},
	}

	for name, test := range tests {
		t.Run(name, func(t *testing.T) {
			csr := &certificatesv1.CertificateSigningRequest{
				ObjectMeta: metav1.ObjectMeta{Name: "test-csr"},
				Spec: certificatesv1.CertificateSigningRequestSpec{
					Request: leafCSRPEM,
				},
			}

			kubeClient := k8sfake.NewSimpleClientset(csr.DeepCopy())

			v := &Venafi{
				issuerOptions: controllerpkg.IssuerOptions{
					ClusterResourceNamespace: "cert-manager",
				},
				secretsLister: nil,
				certClient:     kubeClient.CertificatesV1().CertificateSigningRequests(),
				recorder:       record.NewFakeRecorder(10),
				fieldManager:   "test",
				clientBuilder: func(
					string,
					internalinformers.SecretLister,
					cmapi.GenericIssuer,
					*metrics.Metrics,
					logr.Logger,
					string,
				) (venaficlient.Interface, error) {
					return test.fakeClient, nil
				},
			}

			err := v.Sign(t.Context(), csr, issuerObj)
			if (err != nil) != test.wantErr {
				t.Fatalf("Sign() error = %v, wantErr %v", err, test.wantErr)
			}

			got, err := kubeClient.CertificatesV1().CertificateSigningRequests().Get(
				t.Context(), csr.Name, metav1.GetOptions{},
			)
			if err != nil {
				t.Fatal(err)
			}

			if test.wantPickup {
				if got.Annotations[experimentalapi.CertificateSigningRequestVenafiPickupIDAnnotationKey] != "test-pickup" {
					t.Fatalf("pickup ID annotation = %q, want %q",
						got.Annotations[experimentalapi.CertificateSigningRequestVenafiPickupIDAnnotationKey],
						"test-pickup",
					)
				}
			}

			if test.wantCertificate {
				if len(got.Status.Certificate) == 0 {
					t.Fatal("expected the CSR status to contain the reused certificate")
				}
			}
		})
	}
}
```

Notes:

- The test uses `internalinformers.SecretLister`, which is the alias used by the existing test file.
- The test uses `experimentalapi.CertificateSigningRequestVenafiPickupIDAnnotationKey`; add the `experimentalapi` import shown above if it is not already present.
- The test uses `errors.New`, `time.Duration`, and `logr.Logger`, which are already imported by the existing test file.

---

## 3. Behavior summary

| Situation | Behavior |
|---|---|
| A TPP certificate matches the CSR public key | Return the certificate and update the CSR status |
| No matching certificate | Call `RequestCertificate` as before |
| Reuse search returns a TPP error | Fire `ErrorReuse`, return the error, and do not request |
| No TPP issuer | Skip reuse and call `RequestCertificate` as before |

---

## 4. Test command

```bash
gofmt -w \
  pkg/controller/certificatesigningrequests/venafi/venafi.go \
  pkg/controller/certificatesigningrequests/venafi/venafi_test.go

go test ./pkg/controller/certificatesigningrequests/venafi/...
```
