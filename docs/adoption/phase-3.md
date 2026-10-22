# Phase 3 - Full Code

This document contains the complete code for Phase 3 of the Venafi TPP existing certificate adoption feature.

Scope:

- Add the adoption validation helpers.
- Validate a TPP certificate/private-key pair before anything is written to Kubernetes.
- Add table-driven unit tests.

Files:

- New: `pkg/controller/certificates/venafi-adoption/validate.go`
- New: `pkg/controller/certificates/venafi-adoption/validate_test.go`

Notes:

- CADN is not validated. It is intentionally out of scope.
- `validateAdoption` receives `now` so the controller can pass `clock.Now()` and tests are deterministic.
- The chain check validates signatures and CA validity. It is a structural consistency check, not a full trust-root verification.
- Other names are supported when present in the TPP certificate.
- The package name is `venafiadoption` because Go package names cannot contain a hyphen.

---

## 1. New file: `pkg/controller/certificates/venafi-adoption/validate.go`

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
	"bytes"
	"crypto"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/asn1"
	"errors"
	"fmt"
	"net"
	"strings"
	"time"

	apiutil "github.com/cert-manager/cert-manager/pkg/api/util"
	cmapi "github.com/cert-manager/cert-manager/pkg/apis/certmanager/v1"
	"github.com/cert-manager/cert-manager/pkg/util"
	"github.com/cert-manager/cert-manager/pkg/util/pki"
)

const (
	// ReasonInvalidCertificate indicates that the certificate or key could not
	// be used at all.
	ReasonInvalidCertificate = "InvalidCertificate"

	// ReasonKeyMismatch indicates that the private key does not match the
	// certificate, or does not match the Certificate spec.
	ReasonKeyMismatch = "KeyMismatch"

	// ReasonIdentityMismatch indicates that the certificate subject or SANs do
	// not match the Certificate spec.
	ReasonIdentityMismatch = "IdentityMismatch"

	// ReasonExpired indicates that the certificate is expired or already inside
	// its renewal window.
	ReasonExpired = "Expired"

	// ReasonNotYetValid indicates that the certificate is not valid yet.
	ReasonNotYetValid = "NotYetValid"

	// ReasonUsageMismatch indicates that the key usages or IsCA value do not
	// match the Certificate spec.
	ReasonUsageMismatch = "UsageMismatch"

	// ReasonCAMismatch indicates that the certificate chain could not be
	// validated.
	ReasonCAMismatch = "CAMismatch"
)

const adoptionSafetyMargin = 5 * time.Minute

var oidExtensionSubjectAltName = asn1.ObjectIdentifier{2, 5, 29, 17}

// ValidationError is returned when a TPP certificate/key pair cannot be
// adopted. Reason is intended to be used as a Certificate condition reason.
type ValidationError struct {
	Reason string
	Err    error
}

func (e *ValidationError) Error() string {
	if e.Err == nil {
		return e.Reason
	}
	return fmt.Sprintf("%s: %v", e.Reason, e.Err)
}

func (e *ValidationError) Unwrap() error {
	return e.Err
}

// ReasonForError returns the adoption validation reason for err, or an empty
// string if err is not a ValidationError.
func ReasonForError(err error) string {
	var validationErr *ValidationError
	if errors.As(err, &validationErr) {
		return validationErr.Reason
	}
	return ""
}

// validateAdoption verifies that the given certificate, chain, and private key
// can safely be adopted for the given Certificate.
func validateAdoption(
	crt *cmapi.Certificate,
	cert *x509.Certificate,
	chain []*x509.Certificate,
	pk crypto.Signer,
	now time.Time,
) error {
	if crt == nil || cert == nil || pk == nil {
		return &ValidationError{
			Reason: ReasonInvalidCertificate,
			Err:    fmt.Errorf("certificate, chain, or private key is nil"),
		}
	}

	// 1. The private key must match the certificate.
	publicKeysMatch, err := pki.PublicKeysEqual(cert.PublicKey, pk.Public())
	if err != nil {
		return &ValidationError{
			Reason: ReasonKeyMismatch,
			Err:    fmt.Errorf("failed to compare certificate and private key: %w", err),
		}
	}
	if !publicKeysMatch {
		return &ValidationError{
			Reason: ReasonKeyMismatch,
			Err:    fmt.Errorf("private key does not match certificate public key"),
		}
	}

	// 2. The private key must match the Certificate spec.
	if violations := pki.PrivateKeyMatchesSpec(pk, crt.Spec); len(violations) > 0 {
		return &ValidationError{
			Reason: ReasonKeyMismatch,
			Err:    fmt.Errorf("private key does not match Certificate spec: %s", strings.Join(violations, ", ")),
		}
	}

	// 3. The certificate identity must match the Certificate spec.
	if err := validateIdentity(crt, cert); err != nil {
		return err
	}

	// 4. The certificate must be valid now and must not already be inside its
	// renewal window.
	if now.Before(cert.NotBefore) {
		return &ValidationError{
			Reason: ReasonNotYetValid,
			Err:    fmt.Errorf("certificate is not valid before %s", cert.NotBefore.UTC().Format(time.RFC3339)),
		}
	}

	renewBefore := pki.RenewBefore(
		cert.NotAfter.Sub(cert.NotBefore),
		crt.Spec.RenewBefore,
		crt.Spec.RenewBeforePercentage,
	)
	if !cert.NotAfter.After(now.Add(renewBefore).Add(adoptionSafetyMargin)) {
		return &ValidationError{
			Reason: ReasonExpired,
			Err: fmt.Errorf(
				"certificate expires at %s, which is inside the renewal window",
				cert.NotAfter.UTC().Format(time.RFC3339),
			),
		}
	}

	// 5. Key usages and IsCA must match the Certificate spec.
	if err := validateUsages(crt, cert); err != nil {
		return err
	}

	// 6. The certificate chain must be internally consistent.
	if err := validateChain(cert, chain, now); err != nil {
		return err
	}

	return nil
}

func validateIdentity(crt *cmapi.Certificate, cert *x509.Certificate) error {
	if crt.Spec.LiteralSubject != "" {
		expectedRDNSequence, err := pki.UnmarshalSubjectStringToRDNSequence(crt.Spec.LiteralSubject)
		if err != nil {
			return &ValidationError{
				Reason: ReasonIdentityMismatch,
				Err:    fmt.Errorf("failed to parse spec.literalSubject: %w", err),
			}
		}

		expectedRawSubject, err := pki.MarshalRDNSequenceToRawDERBytes(expectedRDNSequence)
		if err != nil {
			return &ValidationError{
				Reason: ReasonIdentityMismatch,
				Err:    fmt.Errorf("failed to encode spec.literalSubject: %w", err),
			}
		}

		if !bytes.Equal(cert.RawSubject, expectedRawSubject) {
			return &ValidationError{
				Reason: ReasonIdentityMismatch,
				Err:    fmt.Errorf("certificate subject does not match spec.literalSubject"),
			}
		}
	} else {
		if cert.Subject.CommonName != crt.Spec.CommonName {
			return &ValidationError{
				Reason: ReasonIdentityMismatch,
				Err:    fmt.Errorf("certificate commonName %q does not match spec.commonName %q", cert.Subject.CommonName, crt.Spec.CommonName),
			}
		}

		subject := crt.Spec.Subject
		if subject == nil {
			subject = &cmapi.X509Subject{}
		}

		if !util.EqualUnsorted(cert.Subject.Organization, subject.Organizations) {
			return identityMismatch("organizations")
		}
		if !util.EqualUnsorted(cert.Subject.Country, subject.Countries) {
			return identityMismatch("countries")
		}
		if !util.EqualUnsorted(cert.Subject.OrganizationalUnit, subject.OrganizationalUnits) {
			return identityMismatch("organizationalUnits")
		}
		if !util.EqualUnsorted(cert.Subject.Locality, subject.Localities) {
			return identityMismatch("localities")
		}
		if !util.EqualUnsorted(cert.Subject.Province, subject.Provinces) {
			return identityMismatch("provinces")
		}
		if !util.EqualUnsorted(cert.Subject.StreetAddress, subject.StreetAddresses) {
			return identityMismatch("streetAddresses")
		}
		if !util.EqualUnsorted(cert.Subject.PostalCode, subject.PostalCodes) {
			return identityMismatch("postalCodes")
		}
		if cert.Subject.SerialNumber != subject.SerialNumber {
			return identityMismatch("serialNumber")
		}
	}

	// SANs are always compared.
	if !util.EqualUnsorted(cert.DNSNames, crt.Spec.DNSNames) {
		return identityMismatch("dnsNames")
	}

	expectedIPs := make([]net.IP, 0, len(crt.Spec.IPAddresses))
	for _, raw := range crt.Spec.IPAddresses {
		ip := net.ParseIP(raw)
		if ip == nil {
			return &ValidationError{
				Reason: ReasonIdentityMismatch,
				Err:    fmt.Errorf("spec.ipAddresses contains an invalid IP address %q", raw),
			}
		}
		expectedIPs = append(expectedIPs, ip)
	}
	if !util.EqualIPsUnsorted(cert.IPAddresses, expectedIPs) {
		return identityMismatch("ipAddresses")
	}

	if !util.EqualUnsorted(pki.URLsToString(cert.URIs), crt.Spec.URIs) {
		return identityMismatch("uris")
	}

	if !util.EqualUnsorted(cert.EmailAddresses, crt.Spec.EmailAddresses) {
		return identityMismatch("emailAddresses")
	}

	if len(crt.Spec.OtherNames) > 0 {
		matched, err := otherNamesMatch(cert.Extensions, crt.Spec.OtherNames)
		if err != nil {
			return &ValidationError{
				Reason: ReasonIdentityMismatch,
				Err:    fmt.Errorf("failed to compare otherNames: %w", err),
			}
		}
		if !matched {
			return identityMismatch("otherNames")
		}
	}

	return nil
}

func validateUsages(crt *cmapi.Certificate, cert *x509.Certificate) error {
	if cert.IsCA != crt.Spec.IsCA {
		return &ValidationError{
			Reason: ReasonUsageMismatch,
			Err:    fmt.Errorf("certificate isCA=%t does not match spec.isCA=%t", cert.IsCA, crt.Spec.IsCA),
		}
	}

	expectedKeyUsage, expectedExtKeyUsage, err := pki.KeyUsagesForCertificateOrCertificateRequest(crt.Spec.Usages, crt.Spec.IsCA)
	if err != nil {
		return &ValidationError{
			Reason: ReasonUsageMismatch,
			Err:    fmt.Errorf("failed to calculate expected key usages: %w", err),
		}
	}

	if cert.KeyUsage != expectedKeyUsage {
		return &ValidationError{
			Reason: ReasonUsageMismatch,
			Err:    fmt.Errorf("certificate key usage %d does not match expected key usage %d", cert.KeyUsage, expectedKeyUsage),
		}
	}

	actualExtKeyUsage := apiutil.ExtKeyUsageStrings(cert.ExtKeyUsage)
	expectedExtKeyUsageStrings := apiutil.ExtKeyUsageStrings(expectedExtKeyUsage)
	if !util.EqualKeyUsagesUnsorted(actualExtKeyUsage, expectedExtKeyUsageStrings) {
		return &ValidationError{
			Reason: ReasonUsageMismatch,
			Err:    fmt.Errorf("certificate extended key usages %v do not match expected %v", actualExtKeyUsage, expectedExtKeyUsageStrings),
		}
	}

	if len(cert.UnknownExtKeyUsage) > 0 {
		return &ValidationError{
			Reason: ReasonUsageMismatch,
			Err:    fmt.Errorf("certificate contains unknown extended key usages"),
		}
	}

	return nil
}

func validateChain(cert *x509.Certificate, chain []*x509.Certificate, now time.Time) error {
	if cert == nil {
		return &ValidationError{
			Reason: ReasonCAMismatch,
			Err:    fmt.Errorf("certificate is nil"),
		}
	}

	current := cert
	sawIssuer := false

	for _, issuer := range chain {
		if issuer == nil || current.Equal(issuer) {
			continue
		}

		if now.Before(issuer.NotBefore) || now.After(issuer.NotAfter) {
			return &ValidationError{
				Reason: ReasonCAMismatch,
				Err:    fmt.Errorf("issuer certificate %q is not valid at the current time", issuer.Subject.CommonName),
			}
		}

		if err := current.CheckSignatureFrom(issuer); err != nil {
			return &ValidationError{
				Reason: ReasonCAMismatch,
				Err:    fmt.Errorf("certificate chain signature validation failed: %w", err),
			}
		}

		current = issuer
		sawIssuer = true
	}

	if !sawIssuer {
		// A self-signed leaf is acceptable. Check the self-signature directly
		// because CheckSignatureFrom enforces CA constraints.
		if err := cert.CheckSignature(cert.SignatureAlgorithm, cert.RawTBSCertificate, cert.Signature); err != nil {
			return &ValidationError{
				Reason: ReasonCAMismatch,
				Err:    fmt.Errorf("certificate has no issuer chain and is not self-signed: %w", err),
			}
		}
	}

	return nil
}

func identityMismatch(field string) error {
	return &ValidationError{
		Reason: ReasonIdentityMismatch,
		Err:    fmt.Errorf("certificate does not match spec.%s", field),
	}
}

func otherNamesMatch(extensions []pkix.Extension, specOtherNames []cmapi.OtherName) (bool, error) {
	var sanExtension *pkix.Extension
	for i := range extensions {
		if extensions[i].Id.Equal(oidExtensionSubjectAltName) {
			sanExtension = &extensions[i]
			break
		}
	}
	if sanExtension == nil {
		return false, nil
	}

	generalNames, err := pki.UnmarshalSANs(sanExtension.Value)
	if err != nil {
		return false, err
	}

	actual := make([]cmapi.OtherName, 0, len(generalNames.OtherNames))
	for _, otherName := range generalNames.OtherNames {
		var inner asn1.RawValue
		if _, err := asn1.Unmarshal(otherName.Value.Bytes, &inner); err != nil {
			return false, err
		}

		value, err := pki.UnmarshalUniversalValue(inner)
		if err != nil {
			return false, err
		}
		if value.Type() != pki.UniversalValueTypeUTF8String {
			return false, fmt.Errorf("otherName %s is not a UTF8 string", otherName.TypeID)
		}

		actual = append(actual, cmapi.OtherName{
			OID:       otherName.TypeID.String(),
			UTF8Value: value.UTF8String,
		})
	}

	return util.EqualOtherNamesUnsorted(actual, specOtherNames), nil
}
```

---

## 2. New file: `pkg/controller/certificates/venafi-adoption/validate_test.go`

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
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"errors"
	"math/big"
	"net"
	"net/url"
	"testing"
	"time"

	cmapi "github.com/cert-manager/cert-manager/pkg/apis/certmanager/v1"
	"github.com/cert-manager/cert-manager/pkg/util/pki"
)

func mustRSAKey(t *testing.T) *rsa.PrivateKey {
	t.Helper()

	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	return key
}

func baseSpec() cmapi.CertificateSpec {
	return cmapi.CertificateSpec{
		CommonName:     "app.example.com",
		DNSNames:       []string{"app.example.com"},
		IPAddresses:    []string{"10.0.0.1"},
		URIs:           []string{"spiffe://example.com/app"},
		EmailAddresses: []string{"app@example.com"},
		Subject: &cmapi.X509Subject{
			Organizations: []string{"Example"},
			Countries:     []string{"FR"},
		},
		PrivateKey: &cmapi.CertificatePrivateKey{
			Algorithm: cmapi.RSAKeyAlgorithm,
			Size:      2048,
		},
		Usages: []cmapi.KeyUsage{
			cmapi.UsageDigitalSignature,
			cmapi.UsageKeyEncipherment,
		},
	}
}

func newCertificate(
	t *testing.T,
	key crypto.Signer,
	spec cmapi.CertificateSpec,
	notBefore, notAfter time.Time,
	parent *x509.Certificate,
	parentKey crypto.Signer,
) *x509.Certificate {
	t.Helper()

	template := &x509.Certificate{
		SerialNumber:   big.NewInt(1),
		Subject:        pkix.Name{CommonName: spec.CommonName},
		DNSNames:       append([]string(nil), spec.DNSNames...),
		EmailAddresses: append([]string(nil), spec.EmailAddresses...),
		NotBefore:      notBefore,
		NotAfter:       notAfter,
		IsCA:           spec.IsCA,
	}

	if spec.Subject != nil {
		template.Subject.Organization = append([]string(nil), spec.Subject.Organizations...)
		template.Subject.Country = append([]string(nil), spec.Subject.Countries...)
		template.Subject.OrganizationalUnit = append([]string(nil), spec.Subject.OrganizationalUnits...)
		template.Subject.Locality = append([]string(nil), spec.Subject.Localities...)
		template.Subject.Province = append([]string(nil), spec.Subject.Provinces...)
		template.Subject.StreetAddress = append([]string(nil), spec.Subject.StreetAddresses...)
		template.Subject.PostalCode = append([]string(nil), spec.Subject.PostalCodes...)
		template.Subject.SerialNumber = spec.Subject.SerialNumber
	}

	for _, raw := range spec.IPAddresses {
		ip := net.ParseIP(raw)
		if ip == nil {
			t.Fatalf("invalid IP address %q", raw)
		}
		template.IPAddresses = append(template.IPAddresses, ip)
	}

	for _, raw := range spec.URIs {
		uri, err := url.Parse(raw)
		if err != nil {
			t.Fatalf("invalid URI %q: %v", raw, err)
		}
		template.URIs = append(template.URIs, uri)
	}

	keyUsage, extKeyUsage, err := pki.KeyUsagesForCertificateOrCertificateRequest(spec.Usages, spec.IsCA)
	if err != nil {
		t.Fatal(err)
	}
	template.KeyUsage = keyUsage
	template.ExtKeyUsage = extKeyUsage

	if spec.IsCA {
		template.BasicConstraintsValid = true
	}

	if spec.LiteralSubject != "" {
		rdnSequence, err := pki.UnmarshalSubjectStringToRDNSequence(spec.LiteralSubject)
		if err != nil {
			t.Fatal(err)
		}
		rawSubject, err := pki.MarshalRDNSequenceToRawDERBytes(rdnSequence)
		if err != nil {
			t.Fatal(err)
		}
		template.RawSubject = rawSubject
	}

	if parent == nil {
		parent = template
		parentKey = key
	}

	der, err := x509.CreateCertificate(rand.Reader, template, parent, key.Public(), parentKey)
	if err != nil {
		t.Fatal(err)
	}

	cert, err := x509.ParseCertificate(der)
	if err != nil {
		t.Fatal(err)
	}

	return cert
}

func makeCA(t *testing.T, key crypto.Signer, cn string, notBefore, notAfter time.Time) *x509.Certificate {
	t.Helper()

	spec := cmapi.CertificateSpec{
		CommonName: cn,
		IsCA:       true,
		Usages:     []cmapi.KeyUsage{cmapi.UsageCertSign},
		PrivateKey: &cmapi.CertificatePrivateKey{
			Algorithm: cmapi.RSAKeyAlgorithm,
			Size:      2048,
		},
	}

	return newCertificate(t, key, spec, notBefore, notAfter, nil, nil)
}

func wantReason(t *testing.T, err error, reason string) {
	t.Helper()

	if err == nil {
		t.Fatalf("expected error with reason %q, got nil", reason)
	}

	var validationErr *ValidationError
	if !errors.As(err, &validationErr) {
		t.Fatalf("expected *ValidationError, got %T: %v", err, err)
	}

	if validationErr.Reason != reason {
		t.Fatalf("reason = %q, want %q (error: %v)", validationErr.Reason, reason, err)
	}
}

func TestValidateAdoption(t *testing.T) {
	now := time.Now()
	notBefore := now.Add(-time.Hour)
	notAfter := now.Add(90 * 24 * time.Hour)

	key := mustRSAKey(t)
	spec := baseSpec()
	cert := newCertificate(t, key, spec, notBefore, notAfter, nil, nil)
	selfSignedChain := []*x509.Certificate{cert}

	t.Run("valid self-signed certificate", func(t *testing.T) {
		crt := &cmapi.Certificate{Spec: spec}
		if err := validateAdoption(crt, cert, selfSignedChain, key, now); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("private key does not match certificate", func(t *testing.T) {
		otherKey := mustRSAKey(t)
		crt := &cmapi.Certificate{Spec: spec}
		wantReason(t, validateAdoption(crt, cert, selfSignedChain, otherKey, now), ReasonKeyMismatch)
	})

	t.Run("private key does not match spec", func(t *testing.T) {
		badSpec := spec
		badSpec.PrivateKey = &cmapi.CertificatePrivateKey{
			Algorithm: cmapi.RSAKeyAlgorithm,
			Size:      4096,
		}
		crt := &cmapi.Certificate{Spec: badSpec}
		wantReason(t, validateAdoption(crt, cert, selfSignedChain, key, now), ReasonKeyMismatch)
	})

	t.Run("common name mismatch", func(t *testing.T) {
		badSpec := spec
		badSpec.CommonName = "other.example.com"
		crt := &cmapi.Certificate{Spec: badSpec}
		wantReason(t, validateAdoption(crt, cert, selfSignedChain, key, now), ReasonIdentityMismatch)
	})

	t.Run("DNS names mismatch", func(t *testing.T) {
		badSpec := spec
		badSpec.DNSNames = []string{"other.example.com"}
		crt := &cmapi.Certificate{Spec: badSpec}
		wantReason(t, validateAdoption(crt, cert, selfSignedChain, key, now), ReasonIdentityMismatch)
	})

	t.Run("IP addresses mismatch", func(t *testing.T) {
		badSpec := spec
		badSpec.IPAddresses = []string{"10.0.0.2"}
		crt := &cmapi.Certificate{Spec: badSpec}
		wantReason(t, validateAdoption(crt, cert, selfSignedChain, key, now), ReasonIdentityMismatch)
	})

	t.Run("URIs mismatch", func(t *testing.T) {
		badSpec := spec
		badSpec.URIs = []string{"spiffe://example.com/other"}
		crt := &cmapi.Certificate{Spec: badSpec}
		wantReason(t, validateAdoption(crt, cert, selfSignedChain, key, now), ReasonIdentityMismatch)
	})

	t.Run("email addresses mismatch", func(t *testing.T) {
		badSpec := spec
		badSpec.EmailAddresses = []string{"other@example.com"}
		crt := &cmapi.Certificate{Spec: badSpec}
		wantReason(t, validateAdoption(crt, cert, selfSignedChain, key, now), ReasonIdentityMismatch)
	})

	t.Run("subject organizations mismatch", func(t *testing.T) {
		badSpec := spec
		badSpec.Subject = &cmapi.X509Subject{
			Organizations: []string{"Other"},
			Countries:     []string{"FR"},
		}
		crt := &cmapi.Certificate{Spec: badSpec}
		wantReason(t, validateAdoption(crt, cert, selfSignedChain, key, now), ReasonIdentityMismatch)
	})

	t.Run("literal subject match", func(t *testing.T) {
		literalSpec := cmapi.CertificateSpec{
			LiteralSubject: "CN=literal.example.com,O=Example,C=FR",
			PrivateKey: &cmapi.CertificatePrivateKey{
				Algorithm: cmapi.RSAKeyAlgorithm,
				Size:      2048,
			},
			Usages: []cmapi.KeyUsage{
				cmapi.UsageDigitalSignature,
				cmapi.UsageKeyEncipherment,
			},
		}
		literalCert := newCertificate(t, key, literalSpec, notBefore, notAfter, nil, nil)
		crt := &cmapi.Certificate{Spec: literalSpec}
		if err := validateAdoption(crt, literalCert, []*x509.Certificate{literalCert}, key, now); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("literal subject mismatch", func(t *testing.T) {
		literalSpec := cmapi.CertificateSpec{
			LiteralSubject: "CN=literal.example.com,O=Example,C=FR",
			PrivateKey: &cmapi.CertificatePrivateKey{
				Algorithm: cmapi.RSAKeyAlgorithm,
				Size:      2048,
			},
			Usages: []cmapi.KeyUsage{
				cmapi.UsageDigitalSignature,
				cmapi.UsageKeyEncipherment,
			},
		}
		literalCert := newCertificate(t, key, literalSpec, notBefore, notAfter, nil, nil)

		badSpec := literalSpec
		badSpec.LiteralSubject = "CN=other.example.com,O=Example,C=FR"
		crt := &cmapi.Certificate{Spec: badSpec}
		wantReason(t, validateAdoption(crt, literalCert, []*x509.Certificate{literalCert}, key, now), ReasonIdentityMismatch)
	})

	t.Run("expired certificate", func(t *testing.T) {
		expiredCert := newCertificate(t, key, spec, now.Add(-48*time.Hour), now.Add(-time.Hour), nil, nil)
		crt := &cmapi.Certificate{Spec: spec}
		wantReason(t, validateAdoption(crt, expiredCert, []*x509.Certificate{expiredCert}, key, now), ReasonExpired)
	})

	t.Run("certificate not yet valid", func(t *testing.T) {
		futureCert := newCertificate(t, key, spec, now.Add(time.Hour), now.Add(48*time.Hour), nil, nil)
		crt := &cmapi.Certificate{Spec: spec}
		wantReason(t, validateAdoption(crt, futureCert, []*x509.Certificate{futureCert}, key, now), ReasonNotYetValid)
	})

	t.Run("certificate inside renewal window", func(t *testing.T) {
		renewalCert := newCertificate(t, key, spec, now.Add(-89*24*time.Hour), now.Add(24*time.Hour), nil, nil)
		crt := &cmapi.Certificate{Spec: spec}
		wantReason(t, validateAdoption(crt, renewalCert, []*x509.Certificate{renewalCert}, key, now), ReasonExpired)
	})

	t.Run("key usages mismatch", func(t *testing.T) {
		badSpec := spec
		badSpec.Usages = []cmapi.KeyUsage{cmapi.UsageServerAuth}
		crt := &cmapi.Certificate{Spec: badSpec}
		wantReason(t, validateAdoption(crt, cert, selfSignedChain, key, now), ReasonUsageMismatch)
	})

	t.Run("isCA mismatch", func(t *testing.T) {
		badSpec := spec
		badSpec.IsCA = true
		crt := &cmapi.Certificate{Spec: badSpec}
		wantReason(t, validateAdoption(crt, cert, selfSignedChain, key, now), ReasonUsageMismatch)
	})

	t.Run("valid certificate signed by a CA", func(t *testing.T) {
		caKey := mustRSAKey(t)
		caCert := makeCA(t, caKey, "Test CA", notBefore, notAfter)
		leaf := newCertificate(t, key, spec, notBefore, notAfter, caCert, caKey)

		crt := &cmapi.Certificate{Spec: spec}
		if err := validateAdoption(crt, leaf, []*x509.Certificate{leaf, caCert}, key, now); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("missing issuer chain", func(t *testing.T) {
		caKey := mustRSAKey(t)
		caCert := makeCA(t, caKey, "Test CA", notBefore, notAfter)
		leaf := newCertificate(t, key, spec, notBefore, notAfter, caCert, caKey)

		crt := &cmapi.Certificate{Spec: spec}
		wantReason(t, validateAdoption(crt, leaf, []*x509.Certificate{leaf}, key, now), ReasonCAMismatch)
	})

	t.Run("wrong issuer chain", func(t *testing.T) {
		caKey := mustRSAKey(t)
		caCert := makeCA(t, caKey, "Test CA", notBefore, notAfter)
		leaf := newCertificate(t, key, spec, notBefore, notAfter, caCert, caKey)

		otherCAKey := mustRSAKey(t)
		otherCACert := makeCA(t, otherCAKey, "Other CA", notBefore, notAfter)

		crt := &cmapi.Certificate{Spec: spec}
		wantReason(t, validateAdoption(crt, leaf, []*x509.Certificate{leaf, otherCACert}, key, now), ReasonCAMismatch)
	})
}
```

---

## 3. Compile and test

```bash
gofmt -w \
  pkg/controller/certificates/venafi-adoption/validate.go \
  pkg/controller/certificates/venafi-adoption/validate_test.go

go test ./pkg/controller/certificates/venafi-adoption/...
```

Expected result:

- The package compiles.
- All validation tests pass.
- No other package is modified in Phase 3.

## 4. Notes for Phase 4

The adoption controller will call:

```go
err := validateAdoption(crt, x509Cert, chain, privateKey, c.clock.Now())
```

and map failures with:

```go
reason := ReasonForError(err)
```

If `reason` is empty, the controller should treat the error as an unexpected validation failure. In practice, if the certificate was retrieved with `RetrieveExistingCertificate`, the chain and key are available, so only the typed validation reasons above should occur.

- `tls.key` must only be written if `validateAdoption` returns nil.
- On `ReasonKeyMismatch`, `ReasonIdentityMismatch`, `ReasonUsageMismatch`, or `ReasonCAMismatch`, do not write the key and do not issue.
- On `ReasonExpired` or `ReasonNotYetValid`, do not write the key and allow normal issuance.
- CADN is not checked.
