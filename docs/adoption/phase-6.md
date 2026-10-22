# Phase 6 - Full Code

This document contains the complete change for Phase 6 of the Venafi TPP existing certificate adoption feature.

Scope:

- Before calling `RequestCertificate`, search Venafi TPP for an existing certificate whose public key matches the CSR.
- If a match is found, return it as the issued certificate and do not create a new Venafi request.
- If no match is found, continue with the normal `RequestCertificate` flow.
- On a TPP search error, retry without creating a new request.

Files:

- Update: `pkg/controller/certificaterequests/venafi/venafi.go`
- Update: `pkg/controller/certificaterequests/venafi/venafi_test.go`

Prerequisites:

- Phase 2 `FindReusableCertificate`.
- Phase 4 adoption controller writes `tls.key` when a certificate is adopted.

---

## 1. Change to `pkg/controller/certificaterequests/venafi/venafi.go`

### 1.1 Add imports

Add:

```go
	"strconv"
	"time"
```

The import block becomes:

```go
import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/Venafi/vcert/v5/pkg/endpoint"
	k8sErrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	...
)
```

### 1.2 Insert the reuse check

In `Sign`, inside `if pickupID == "" {` and before:

```go
		pickupID, err = client.RequestCertificate(cr.Spec.Request, duration, customFields)
```

insert:

```go
		// Before creating a new Venafi request, try to reuse an existing
		// certificate whose public key matches the CSR.
		if issuerObj.GetSpec().Venafi != nil && issuerObj.GetSpec().Venafi.TPP != nil {
			revision := 0
			if raw := cr.Annotations[cmapi.CertificateRequestRevisionAnnotationKey]; raw != "" {
				revision, _ = strconv.Atoi(raw)
			}

			if revision == 1 {
				minRemaining := duration / 3
				if minRemaining < 5*time.Minute {
					minRemaining = 5 * time.Minute
				}

				reusable, reuseErr := client.FindReusableCertificate(
					issuerObj.GetSpec().Venafi.Zone,
					cr.Spec.Request,
					minRemaining,
				)
				if reuseErr != nil {
					message := "Failed to search Venafi TPP for a reusable certificate"
					v.reporter.Pending(cr, reuseErr, "ReuseError", message)
					log.Error(reuseErr, message)
					return nil, reuseErr
				}

				if reusable != nil {
					certPEM := make([]byte, 0, len(reusable.CertificatePEM)+len(reusable.ChainPEM)+1)
					certPEM = append(certPEM, reusable.CertificatePEM...)
					if len(reusable.ChainPEM) > 0 {
						certPEM = append(certPEM, '\n')
						certPEM = append(certPEM, reusable.ChainPEM...)
					}

					bundle, parseErr := utilpki.ParseSingleCertificateChainPEM(certPEM)
					if parseErr != nil {
						message := "Failed to parse the reused Venafi certificate bundle"
						v.reporter.Failed(cr, parseErr, "ParseError", message)
						log.Error(parseErr, message)
						return nil, nil
					}

					log.V(logf.DebugLevel).Info("reusing an existing Venafi certificate")
					return &issuerpkg.IssueResponse{
						Certificate: bundle.ChainPEM,
						CA:          bundle.CAPEM,
					}, nil
				}
			}
		}
```

The surrounding code becomes:

```go
	duration := apiutil.DefaultCertDuration(cr.Spec.Duration)
	pickupID := cr.ObjectMeta.Annotations[cmapi.VenafiPickupIDAnnotationKey]

	// check if the pickup ID annotation is there, if not set it up.
	if pickupID == "" {
		// Before creating a new Venafi request, try to reuse an existing
		// certificate whose public key matches the CSR.
		if issuerObj.GetSpec().Venafi != nil && issuerObj.GetSpec().Venafi.TPP != nil {
			...
		}

		pickupID, err = client.RequestCertificate(cr.Spec.Request, duration, customFields)
		...
	}
```

---

## 2. Add a focused test to `pkg/controller/certificaterequests/venafi/venafi_test.go`

Add the following test function to the existing file. It tests `Sign` directly, so it does not need the large `TestSign` expected-action table.

Add these imports if they are not already present:

```go
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"errors"
	"math/big"
	"time"

	"k8s.io/client-go/tools/record"
	"k8s.io/utils/clock"

	crutil "github.com/cert-manager/cert-manager/pkg/controller/certificaterequests/util"
	"github.com/cert-manager/cert-manager/pkg/issuer/venafi/client/api"
	internalvenafifake "github.com/cert-manager/cert-manager/pkg/issuer/venafi/client/fake"
	"github.com/cert-manager/cert-manager/pkg/util/pki"
)
```

Some of these are already imported by the existing test file. Keep the existing import block and add only the missing packages.

Test function:

```go
func TestSignReusesExistingCertificate(t *testing.T) {
	rootPK, err := pki.GenerateECPrivateKey(256)
	if err != nil {
		t.Fatal(err)
	}

	rootTmpl := &x509.Certificate{
		BasicConstraintsValid: true,
		PublicKeyAlgorithm:    x509.ECDSA,
		PublicKey:             rootPK.Public(),
		IsCA:                  true,
		Subject:               pkix.Name{CommonName: "root-ca"},
		NotBefore:             time.Now().Add(-time.Hour),
		NotAfter:              time.Now().Add(24 * time.Hour),
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign,
	}

	rootPEM, rootCert, err := pki.SignCertificate(rootTmpl, rootTmpl, rootPK.Public(), rootPK)
	if err != nil {
		t.Fatal(err)
	}

	leafPK, err := pki.GenerateECPrivateKey(256)
	if err != nil {
		t.Fatal(err)
	}

	csrPEM := generateCSR(t, leafPK)

	cr := &cmapi.CertificateRequest{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "test-cr",
			Namespace: "testns",
			Annotations: map[string]string{
				cmapi.CertificateRequestRevisionAnnotationKey: "1",
			},
		},
		Spec: cmapi.CertificateRequestSpec{
			Request: csrPEM,
			IssuerRef: cmmeta.IssuerReference{
				Name: "venafi-tpp",
				Kind: "Issuer",
			},
			Duration: &metav1.Duration{Duration: 90 * 24 * time.Hour},
		},
	}

	template, err := pki.CertificateTemplateFromCertificateRequest(cr)
	if err != nil {
		t.Fatal(err)
	}

	certPEM, _, err := pki.SignCertificate(template, rootCert, leafPK.Public(), rootPK)
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
		revision    string
		fakeClient  *internalvenafifake.Venafi
		wantErr     bool
		wantPickup  bool
		wantResponse bool
	}{
		"matching certificate is reused": {
			revision: "1",
			fakeClient: &internalvenafifake.Venafi{
				FindReusableCertificateFn: func(string, []byte, time.Duration) (*api.RetrievedCertificate, error) {
					return &api.RetrievedCertificate{
						CertificatePEM: certPEM,
						ChainPEM:       rootPEM,
						CAPEM:          rootPEM,
					}, nil
				},
				RequestCertificateFn: func([]byte, time.Duration, []api.CustomField) (string, error) {
					t.Fatal("RequestCertificate must not be called when a certificate is reused")
					return "", nil
				},
			},
			wantResponse: true,
		},
		"no matching certificate requests a new one": {
			revision: "1",
			fakeClient: &internalvenafifake.Venafi{
				FindReusableCertificateFn: func(string, []byte, time.Duration) (*api.RetrievedCertificate, error) {
					return nil, nil
				},
				RequestCertificateFn: func([]byte, time.Duration, []api.CustomField) (string, error) {
					return "test-pickup", nil
				},
			},
			wantPickup: true,
		},
		"revision greater than one does not reuse": {
			revision: "2",
			fakeClient: &internalvenafifake.Venafi{
				FindReusableCertificateFn: func(string, []byte, time.Duration) (*api.RetrievedCertificate, error) {
					t.Fatal("FindReusableCertificate must not be called for revision > 1")
					return nil, nil
				},
				RequestCertificateFn: func([]byte, time.Duration, []api.CustomField) (string, error) {
					return "test-pickup", nil
				},
			},
			wantPickup: true,
		},
		"reuse search error is retried": {
			revision: "1",
			fakeClient: &internalvenafifake.Venafi{
				FindReusableCertificateFn: func(string, []byte, time.Duration) (*api.RetrievedCertificate, error) {
					return nil, errors.New("tpp unavailable")
				},
				RequestCertificateFn: func([]byte, time.Duration, []api.CustomField) (string, error) {
					t.Fatal("RequestCertificate must not be called after a reuse search error")
					return "", nil
				},
			},
			wantErr: true,
		},
	}

	for name, test := range tests {
		t.Run(name, func(t *testing.T) {
			testCR := cr.DeepCopy()
			testCR.Annotations[cmapi.CertificateRequestRevisionAnnotationKey] = test.revision

			v := &Venafi{
				issuerOptions: controllerpkg.IssuerOptions{
					ClusterResourceNamespace: "cert-manager",
				},
				reporter: crutil.NewReporter(clock.RealClock{}, record.NewFakeRecorder(10)),
				clientBuilder: func(
					string,
					internalinformers.SecretLister,
					cmapi.GenericIssuer,
					*metrics.Metrics,
					logr.Logger,
					string,
				) (client.Interface, error) {
					return test.fakeClient, nil
				},
			}

			resp, err := v.Sign(t.Context(), testCR, issuerObj)
			if (err != nil) != test.wantErr {
				t.Fatalf("Sign() error = %v, wantErr %v", err, test.wantErr)
			}
			if test.wantPickup {
				if got := testCR.Annotations[cmapi.VenafiPickupIDAnnotationKey]; got != "test-pickup" {
					t.Fatalf("pickup ID annotation = %q, want %q", got, "test-pickup")
				}
			}
			if test.wantResponse {
				if resp == nil {
					t.Fatal("expected an IssueResponse, got nil")
				}
				if len(resp.Certificate) == 0 {
					t.Fatal("expected a certificate in the IssueResponse")
				}
				if len(resp.CA) == 0 {
					t.Fatal("expected a CA in the IssueResponse")
				}
			}
		})
	}
}
```

---

## 3. Behavior summary

| Situation | Behavior |
|---|---|
| Revision 1, TPP certificate public key matches CSR | Return the existing certificate; `RequestCertificate` is not called |
| Revision 1, no matching certificate | Call `RequestCertificate` as before |
| Revision > 1 | Skip reuse and call `RequestCertificate` |
| Reuse search returns a TPP error | Report pending and return the error; do not create a new request |
| Reuse bundle cannot be parsed | Report a parse failure; do not create a new request |

---

## 4. Test command

```bash
gofmt -w \
  pkg/controller/certificaterequests/venafi/venafi.go \
  pkg/controller/certificaterequests/venafi/venafi_test.go

go test ./pkg/controller/certificaterequests/venafi/...
```
