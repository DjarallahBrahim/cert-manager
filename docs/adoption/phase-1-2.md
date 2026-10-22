# Phase 1-2 - Full Code

This document contains the complete code for Phase 1 and Phase 2 of the Venafi TPP existing certificate adoption feature.

Scope of this document:

- Phase 1: annotation and condition constants.
- Phase 2: Venafi client search, retrieval, and reuse helpers.
- Phase 2 tests.

Notes:

- CADN is intentionally ignored. Therefore Phase 2 does **not** call `RetrieveCertificateMetaData`, and `CADN` is left empty in `ExistingCertificate`.
- `SearchCertificates` returns only the certificate DN and GUID, so the implementation retrieves each candidate certificate to obtain CN, SANs, validity, thumbprint, and key information.
- `adoption_test.go` uses `github.com/youmark/pkcs8`, which is already an indirect dependency. Running `go mod tidy` may promote it to a direct dependency.

---

# Phase 1

## 1. `pkg/apis/certmanager/v1/types.go`

Insert the following constants inside the existing `// Issuer specific Annotations` `const` block, after `VenafiPickupIDAnnotationKey` and before the closing `)`:

```go
	// VenafiAdoptExistingAnnotationKey opts a Certificate into adopting an
	// existing Venafi TPP certificate and its private key.
	VenafiAdoptExistingAnnotationKey = "venafi.cert-manager.io/adopt-existing"

	// VenafiCertificateDNAnnotationKey records the source TPP certificate DN
	// on the adopted Kubernetes Secret.
	VenafiCertificateDNAnnotationKey = "venafi.cert-manager.io/certificate-dn"

	// VenafiCertificateGUIDAnnotationKey records the source TPP certificate GUID
	// on the adopted Kubernetes Secret.
	VenafiCertificateGUIDAnnotationKey = "venafi.cert-manager.io/certificate-guid"

	// VenafiCertificateThumbprintAnnotationKey records the source certificate
	// thumbprint on the adopted Kubernetes Secret.
	VenafiCertificateThumbprintAnnotationKey = "venafi.cert-manager.io/certificate-thumbprint"
```

`types.go` needs no new imports.

## 2. `pkg/apis/certmanager/v1/types_certificate.go`

Insert the following constant inside the existing `const` block that defines `CertificateConditionReady` and `CertificateConditionIssuing`, after `CertificateConditionIssuing` and before the closing `)`:

```go
	// CertificateConditionVenafiAdoption indicates the state of Venafi TPP
	// existing certificate adoption for a Certificate.
	CertificateConditionVenafiAdoption CertificateConditionType = "VenafiAdoption"
```

`types_certificate.go` needs no new imports.

No CRD, deepcopy, conversion, OpenAPI, or webhook changes are required for Phase 1.

---

# Phase 2

## 3. New file: `pkg/issuer/venafi/client/api/adoption.go`

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

package api

import "time"

// ExistingCertificate describes a certificate that already exists in Venafi TPP.
type ExistingCertificate struct {
	DN   string
	GUID string

	CN          string
	DNSNames    []string
	IPAddresses []string
	URIs        []string
	Emails      []string

	NotBefore time.Time
	NotAfter  time.Time

	Thumbprint string

	// CADN is intentionally not populated. CADN matching is not part of the
	// adoption design.
	CADN string

	KeyAlgorithm string
	KeySize      int
}

// RetrievedCertificate contains the certificate material retrieved from
// Venafi TPP. PrivateKeyPEM is unencrypted.
type RetrievedCertificate struct {
	CertificatePEM []byte
	ChainPEM       []byte
	CAPEM          []byte
	PrivateKeyPEM  []byte
}
```

## 4. Update: `pkg/issuer/venafi/client/venaficlient.go`

### 4.1 Extend `Interface`

Replace the existing `Interface` definition with:

```go
// Interface implements a Venafi client
type Interface interface {
	RequestCertificate(csrPEM []byte, duration time.Duration, customFields []api.CustomField) (string, error)
	RetrieveCertificate(pickupID string, csrPEM []byte, duration time.Duration, customFields []api.CustomField) ([]byte, error)

	SearchExistingCertificates(zone, cn string, sans []string, minRemaining time.Duration) ([]api.ExistingCertificate, error)
	RetrieveExistingCertificate(dn, privateKeyPassword string) (*api.RetrievedCertificate, error)
	FindReusableCertificate(zone string, csrPEM []byte, minRemaining time.Duration) (*api.RetrievedCertificate, error)

	Ping() error
	ReadZoneConfiguration() (*endpoint.ZoneConfiguration, error)
	SetClient(endpoint.Connector)
	VerifyCredentials() error
}
```

### 4.2 Extend the internal `connector` interface

Replace the existing `connector` definition with:

```go
// connector exposes a subset of the vcert Connector interface to make stubbing
// out its functionality during tests easier.
type connector interface {
	Ping() (err error)
	ReadZoneConfiguration() (config *endpoint.ZoneConfiguration, err error)
	RequestCertificate(req *certificate.Request) (requestID string, err error)
	RetrieveCertificate(req *certificate.Request) (certificates *certificate.PEMCollection, err error)
	SearchCertificates(req *certificate.SearchRequest) (*certificate.CertSearchResponse, error)
	// TODO: (irbekrm) this method is never used - can it be removed?
	RenewCertificate(req *certificate.RenewalRequest) (requestID string, err error)
}
```

No new imports are required in `venaficlient.go`, because it already imports `certificate`, `endpoint`, `time`, and `api`.

## 5. New file: `pkg/issuer/venafi/client/adoption.go`

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

package client

import (
	"crypto"
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"math/big"
	"net"
	"net/url"
	"sort"
	"strings"
	"time"

	"github.com/Venafi/vcert/v5/pkg/certificate"
	vcertutil "github.com/Venafi/vcert/v5/pkg/util"

	"github.com/cert-manager/cert-manager/pkg/issuer/venafi/client/api"
	"github.com/cert-manager/cert-manager/pkg/util/pki"
)

const (
	venafiRetrieveTimeout   = 60 * time.Second
	ephemeralPasswordLength = 24
)

// SearchExistingCertificates searches Venafi TPP for certificates in the given
// zone that are valid for the given common name and DNS SANs.
func (v *Venafi) SearchExistingCertificates(zone, cn string, sans []string, minRemaining time.Duration) ([]api.ExistingCertificate, error) {
	if cn == "" && len(sans) == 0 {
		return nil, fmt.Errorf("at least one of common name or DNS SANs must be provided")
	}
	if minRemaining < 0 {
		minRemaining = 0
	}

	filters := []string{
		"ParentDn=" + url.QueryEscape(normalizeZone(zone)),
		"ValidToGreater=" + url.QueryEscape(time.Now().Add(minRemaining).UTC().Format(time.RFC3339)),
	}
	if cn != "" {
		filters = append(filters, "CN="+url.QueryEscape(cn))
	}
	if len(sans) > 0 {
		filters = append(filters, "SAN-DNS="+url.QueryEscape(strings.Join(sans, ",")))
	}

	searchRequest := certificate.SearchRequest(filters)
	result, err := v.vcertClient.SearchCertificates(&searchRequest)
	if err != nil {
		return nil, fmt.Errorf("failed to search Venafi TPP certificates: %w", err)
	}
	if result == nil || len(result.Certificates) == 0 {
		return nil, nil
	}

	candidates := make([]api.ExistingCertificate, 0, len(result.Certificates))
	for _, info := range result.Certificates {
		if info.CertificateRequestId == "" {
			continue
		}

		certPEM, err := v.retrieveCertificatePEM(info.CertificateRequestId)
		if err != nil {
			return nil, err
		}

		cert, err := pki.DecodeX509CertificateBytes(certPEM)
		if err != nil {
			return nil, fmt.Errorf("failed to decode Venafi certificate %q: %w", info.CertificateRequestId, err)
		}

		candidates = append(candidates, api.ExistingCertificate{
			DN:           info.CertificateRequestId,
			GUID:         info.CertificateRequestGuid,
			CN:           cert.Subject.CommonName,
			DNSNames:     append([]string(nil), cert.DNSNames...),
			IPAddresses:  ipsToStrings(cert.IPAddresses),
			URIs:         urisToStrings(cert.URIs),
			Emails:       append([]string(nil), cert.EmailAddresses...),
			NotBefore:    cert.NotBefore,
			NotAfter:     cert.NotAfter,
			Thumbprint:   fmt.Sprintf("%x", sha256.Sum256(cert.Raw)),
			KeyAlgorithm: cert.PublicKeyAlgorithm.String(),
			KeySize:      publicKeySize(cert.PublicKey),
		})
	}

	// Newest first, so callers that take the first candidate get the newest
	// certificate.
	sort.SliceStable(candidates, func(i, j int) bool {
		return candidates[i].NotAfter.After(candidates[j].NotAfter)
	})

	return candidates, nil
}

// RetrieveExistingCertificate retrieves the certificate chain and private key
// for the given Venafi TPP certificate DN. The private key is decrypted before
// it is returned.
func (v *Venafi) RetrieveExistingCertificate(dn, privateKeyPassword string) (*api.RetrievedCertificate, error) {
	if privateKeyPassword == "" {
		return nil, fmt.Errorf("private key password must not be empty")
	}

	request := &certificate.Request{
		PickupID:        dn,
		FetchPrivateKey: true,
		KeyPassword:     privateKeyPassword,
		ChainOption:     certificate.ChainOptionRootLast,
		Timeout:         venafiRetrieveTimeout,
	}

	collection, err := v.vcertClient.RetrieveCertificate(request)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve Venafi certificate %q with private key: %w", dn, err)
	}
	if collection == nil || collection.Certificate == "" {
		return nil, fmt.Errorf("Venafi certificate %q returned no certificate data", dn)
	}

	privateKeyPEM, err := decryptPrivateKey(collection.PrivateKey, privateKeyPassword)
	if err != nil {
		return nil, err
	}

	certPEM := []byte(collection.Certificate)
	chainPEM := []byte(strings.Join(collection.Chain, "\n"))
	caPEM, err := parseCAPEM(certPEM, chainPEM)
	if err != nil {
		return nil, err
	}

	return &api.RetrievedCertificate{
		CertificatePEM: certPEM,
		ChainPEM:       chainPEM,
		CAPEM:          caPEM,
		PrivateKeyPEM:  privateKeyPEM,
	}, nil
}

// FindReusableCertificate searches Venafi TPP for a certificate whose public
// key and identity match the given CSR. It returns nil, nil when no matching
// certificate exists.
func (v *Venafi) FindReusableCertificate(zone string, csrPEM []byte, minRemaining time.Duration) (*api.RetrievedCertificate, error) {
	csr, err := pki.DecodeX509CertificateRequestBytes(csrPEM)
	if err != nil {
		return nil, fmt.Errorf("failed to decode CSR: %w", err)
	}

	candidates, err := v.SearchExistingCertificates(zone, csr.Subject.CommonName, csr.DNSNames, minRemaining)
	if err != nil {
		return nil, err
	}

	for _, candidate := range candidates {
		if !certificateIdentityMatchesCSR(candidate, csr) {
			continue
		}

		retrieved, err := v.retrieveCertificateBundle(candidate.DN)
		if err != nil {
			return nil, err
		}

		cert, err := pki.DecodeX509CertificateBytes(retrieved.CertificatePEM)
		if err != nil {
			return nil, fmt.Errorf("failed to decode Venafi certificate %q: %w", candidate.DN, err)
		}

		publicKeyMatches, err := pki.PublicKeysEqual(cert.PublicKey, csr.PublicKey)
		if err != nil {
			return nil, err
		}
		if !publicKeyMatches {
			continue
		}

		if !certificateSANsMatchCSR(cert, csr) {
			continue
		}

		return retrieved, nil
	}

	return nil, nil
}

// GenerateEphemeralPassword returns a strong random password suitable for a
// synchronous Venafi TPP private key retrieval.
func GenerateEphemeralPassword() (string, error) {
	const (
		lower   = "abcdefghijkmnopqrstuvwxyz"
		upper   = "ABCDEFGHJKLMNPQRSTUVWXYZ"
		digits  = "23456789"
		special = "!@#$%^&*()-_=+"
		all     = lower + upper + digits + special
	)

	chars := make([]byte, 0, ephemeralPasswordLength)
	for _, class := range []string{lower, upper, digits, special} {
		c, err := randomChar(class)
		if err != nil {
			return "", err
		}
		chars = append(chars, c)
	}

	for len(chars) < ephemeralPasswordLength {
		c, err := randomChar(all)
		if err != nil {
			return "", err
		}
		chars = append(chars, c)
	}

	for i := len(chars) - 1; i > 0; i-- {
		j, err := randomIndex(i + 1)
		if err != nil {
			return "", err
		}
		chars[i], chars[j] = chars[j], chars[i]
	}

	return string(chars), nil
}

func (v *Venafi) retrieveCertificatePEM(dn string) ([]byte, error) {
	request := &certificate.Request{
		PickupID:    dn,
		ChainOption: certificate.ChainOptionIgnore,
		Timeout:     venafiRetrieveTimeout,
	}

	collection, err := v.vcertClient.RetrieveCertificate(request)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve Venafi certificate %q: %w", dn, err)
	}
	if collection == nil || collection.Certificate == "" {
		return nil, fmt.Errorf("Venafi certificate %q returned no certificate data", dn)
	}

	return []byte(collection.Certificate), nil
}

func (v *Venafi) retrieveCertificateBundle(dn string) (*api.RetrievedCertificate, error) {
	request := &certificate.Request{
		PickupID:    dn,
		ChainOption: certificate.ChainOptionRootLast,
		Timeout:     venafiRetrieveTimeout,
	}

	collection, err := v.vcertClient.RetrieveCertificate(request)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve Venafi certificate %q: %w", dn, err)
	}
	if collection == nil || collection.Certificate == "" {
		return nil, fmt.Errorf("Venafi certificate %q returned no certificate data", dn)
	}

	certPEM := []byte(collection.Certificate)
	chainPEM := []byte(strings.Join(collection.Chain, "\n"))
	caPEM, err := parseCAPEM(certPEM, chainPEM)
	if err != nil {
		return nil, err
	}

	return &api.RetrievedCertificate{
		CertificatePEM: certPEM,
		ChainPEM:       chainPEM,
		CAPEM:          caPEM,
	}, nil
}

func parseCAPEM(certPEM, chainPEM []byte) ([]byte, error) {
	bundle := make([]byte, 0, len(certPEM)+len(chainPEM)+1)
	bundle = append(bundle, certPEM...)
	if len(chainPEM) > 0 {
		bundle = append(bundle, '\n')
		bundle = append(bundle, chainPEM...)
	}

	parsed, err := pki.ParseSingleCertificateChainPEM(bundle)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Venafi certificate chain: %w", err)
	}

	return parsed.CAPEM, nil
}

func decryptPrivateKey(privateKey, password string) ([]byte, error) {
	if privateKey == "" {
		return nil, fmt.Errorf("Venafi returned no private key for the certificate")
	}

	block, _ := pem.Decode([]byte(privateKey))
	if block == nil {
		return nil, fmt.Errorf("Venafi returned an invalid private key")
	}

	if block.Type != "ENCRYPTED PRIVATE KEY" {
		return []byte(privateKey), nil
	}

	decrypted, err := vcertutil.DecryptPkcs8PrivateKey(privateKey, password)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt Venafi private key: %w", err)
	}

	return []byte(decrypted), nil
}

func certificateIdentityMatchesCSR(candidate api.ExistingCertificate, csr *x509.CertificateRequest) bool {
	if csr.Subject.CommonName != "" && candidate.CN != csr.Subject.CommonName {
		return false
	}

	return stringSlicesEqual(candidate.DNSNames, csr.DNSNames) &&
		stringSlicesEqual(candidate.IPAddresses, ipsToStrings(csr.IPAddresses)) &&
		stringSlicesEqual(candidate.URIs, urisToStrings(csr.URIs)) &&
		stringSlicesEqual(candidate.Emails, csr.EmailAddresses)
}

func certificateSANsMatchCSR(cert *x509.Certificate, csr *x509.CertificateRequest) bool {
	if csr.Subject.CommonName != "" && cert.Subject.CommonName != csr.Subject.CommonName {
		return false
	}

	return stringSlicesEqual(cert.DNSNames, csr.DNSNames) &&
		stringSlicesEqual(ipsToStrings(cert.IPAddresses), ipsToStrings(csr.IPAddresses)) &&
		stringSlicesEqual(urisToStrings(cert.URIs), urisToStrings(csr.URIs)) &&
		stringSlicesEqual(cert.EmailAddresses, csr.EmailAddresses)
}

func stringSlicesEqual(a, b []string) bool {
	aa := append([]string(nil), a...)
	bb := append([]string(nil), b...)

	sort.Strings(aa)
	sort.Strings(bb)

	if len(aa) != len(bb) {
		return false
	}

	for i := range aa {
		if aa[i] != bb[i] {
			return false
		}
	}

	return true
}

func ipsToStrings(ips []net.IP) []string {
	out := make([]string, 0, len(ips))
	for _, ip := range ips {
		if ip != nil {
			out = append(out, ip.String())
		}
	}
	return out
}

func urisToStrings(uris []*url.URL) []string {
	out := make([]string, 0, len(uris))
	for _, uri := range uris {
		if uri != nil {
			out = append(out, uri.String())
		}
	}
	return out
}

func publicKeySize(publicKey crypto.PublicKey) int {
	switch key := publicKey.(type) {
	case *rsa.PublicKey:
		return key.N.BitLen()
	case *ecdsa.PublicKey:
		return key.Curve.Params().BitSize
	default:
		return 0
	}
}

func normalizeZone(zone string) string {
	if strings.HasPrefix(zone, `\VED\Policy`) {
		return zone
	}
	if !strings.HasPrefix(zone, `\`) {
		zone = `\` + zone
	}
	return `\VED\Policy` + zone
}

func randomChar(alphabet string) (byte, error) {
	index, err := randomIndex(len(alphabet))
	if err != nil {
		return 0, err
	}
	return alphabet[index], nil
}

func randomIndex(max int) (int, error) {
	value, err := rand.Int(rand.Reader, big.NewInt(int64(max)))
	if err != nil {
		return 0, fmt.Errorf("failed to generate random value: %w", err)
	}
	return int(value.Int64()), nil
}
```

## 6. Update: `pkg/issuer/venafi/client/instrumentedvenaficlient.go`

Add the following method after `RetrieveCertificate`:

```go
func (ic instrumentedConnector) SearchCertificates(req *certificate.SearchRequest) (*certificate.CertSearchResponse, error) {
	start := time.Now()
	ic.logger.V(logf.TraceLevel).Info("calling SearchCertificates")
	result, err := ic.conn.SearchCertificates(req)
	ic.metrics.ObserveVenafiRequestDuration(time.Since(start), "search_certificates")
	return result, err
}
```

No new imports are required.

## 7. Update: `pkg/issuer/venafi/client/fake/venafi.go`

Replace the file with:

```go
/*
Copyright 2020 The cert-manager Authors.

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

package fake

import (
	"fmt"
	"time"

	"github.com/Venafi/vcert/v5/pkg/endpoint"

	"github.com/cert-manager/cert-manager/pkg/issuer/venafi/client/api"
)

type Venafi struct {
	PingFn                        func() error
	RequestCertificateFn          func(csrPEM []byte, duration time.Duration, customFields []api.CustomField) (string, error)
	RetrieveCertificateFn         func(pickupID string, csrPEM []byte, duration time.Duration, customFields []api.CustomField) ([]byte, error)
	SearchExistingCertificatesFn  func(zone, cn string, sans []string, minRemaining time.Duration) ([]api.ExistingCertificate, error)
	RetrieveExistingCertificateFn func(dn, privateKeyPassword string) (*api.RetrievedCertificate, error)
	FindReusableCertificateFn     func(zone string, csrPEM []byte, minRemaining time.Duration) (*api.RetrievedCertificate, error)
	ReadZoneConfigurationFn       func() (*endpoint.ZoneConfiguration, error)
	VerifyCredentialsFn           func() error
}

func (v *Venafi) Ping() error {
	return v.PingFn()
}

func (v *Venafi) RequestCertificate(csrPEM []byte, duration time.Duration, customFields []api.CustomField) (string, error) {
	return v.RequestCertificateFn(csrPEM, duration, customFields)
}

func (v *Venafi) RetrieveCertificate(pickupID string, csrPEM []byte, duration time.Duration, customFields []api.CustomField) ([]byte, error) {
	return v.RetrieveCertificateFn(pickupID, csrPEM, duration, customFields)
}

func (v *Venafi) SearchExistingCertificates(zone, cn string, sans []string, minRemaining time.Duration) ([]api.ExistingCertificate, error) {
	if v.SearchExistingCertificatesFn == nil {
		return nil, nil
	}
	return v.SearchExistingCertificatesFn(zone, cn, sans, minRemaining)
}

func (v *Venafi) RetrieveExistingCertificate(dn, privateKeyPassword string) (*api.RetrievedCertificate, error) {
	if v.RetrieveExistingCertificateFn == nil {
		return nil, fmt.Errorf("RetrieveExistingCertificate is not implemented by the fake client")
	}
	return v.RetrieveExistingCertificateFn(dn, privateKeyPassword)
}

func (v *Venafi) FindReusableCertificate(zone string, csrPEM []byte, minRemaining time.Duration) (*api.RetrievedCertificate, error) {
	if v.FindReusableCertificateFn == nil {
		return nil, nil
	}
	return v.FindReusableCertificateFn(zone, csrPEM, minRemaining)
}

func (v *Venafi) ReadZoneConfiguration() (*endpoint.ZoneConfiguration, error) {
	return v.ReadZoneConfigurationFn()
}

func (v *Venafi) SetClient(endpoint.Connector) {}

// VerifyCredentials will return VerifyCredentialsFn if set, otherwise nil.
func (v *Venafi) VerifyCredentials() error {
	if v.VerifyCredentialsFn != nil {
		return v.VerifyCredentialsFn()
	}

	return nil
}
```

## 8. Update: `pkg/issuer/venafi/client/fake/connector.go`

Replace the file with:

```go
/*
Copyright 2020 The cert-manager Authors.

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

package fake

import (
	"fmt"

	"github.com/Venafi/vcert/v5/pkg/certificate"
	"github.com/Venafi/vcert/v5/pkg/endpoint"
	"github.com/Venafi/vcert/v5/pkg/venafi/fake"
)

type Connector struct {
	*fake.Connector

	PingFunc                  func() error
	ReadZoneConfigurationFunc func() (*endpoint.ZoneConfiguration, error)
	RetrieveCertificateFunc   func(*certificate.Request) (*certificate.PEMCollection, error)
	RequestCertificateFunc    func(*certificate.Request) (string, error)
	SearchCertificatesFunc    func(*certificate.SearchRequest) (*certificate.CertSearchResponse, error)
	RenewCertificateFunc      func(*certificate.RenewalRequest) (string, error)
}

func (f Connector) Default() *Connector {
	if f.Connector == nil {
		f.Connector = fake.NewConnector(true, nil)
	}
	return &f
}

func (f *Connector) Ping() (err error) {
	if f.PingFunc != nil {
		return f.PingFunc()
	}
	return f.Connector.Ping()
}

func (f *Connector) ReadZoneConfiguration() (config *endpoint.ZoneConfiguration, err error) {
	if f.ReadZoneConfigurationFunc != nil {
		return f.ReadZoneConfigurationFunc()
	}
	return f.Connector.ReadZoneConfiguration()
}

func (f *Connector) RetrieveCertificate(req *certificate.Request) (certificates *certificate.PEMCollection, err error) {
	if f.RetrieveCertificateFunc != nil {
		return f.RetrieveCertificateFunc(req)
	}
	return f.Connector.RetrieveCertificate(req)
}

func (f *Connector) RequestCertificate(req *certificate.Request) (requestID string, err error) {
	if f.RequestCertificateFunc != nil {
		return f.RequestCertificateFunc(req)
	}
	return f.Connector.RequestCertificate(req)
}

func (f *Connector) SearchCertificates(req *certificate.SearchRequest) (*certificate.CertSearchResponse, error) {
	if f.SearchCertificatesFunc != nil {
		return f.SearchCertificatesFunc(req)
	}
	return nil, fmt.Errorf("SearchCertificates is not implemented by the fake connector")
}

func (f *Connector) RenewCertificate(req *certificate.RenewalRequest) (requestID string, err error) {
	if f.RenewCertificateFunc != nil {
		return f.RenewCertificateFunc(req)
	}
	return f.Connector.RenewCertificate(req)
}
```

## 9. New file: `pkg/issuer/venafi/client/adoption_test.go`

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

package client

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"math/big"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/Venafi/vcert/v5/pkg/certificate"
	"github.com/youmark/pkcs8"

	internalfake "github.com/cert-manager/cert-manager/pkg/issuer/venafi/client/fake"
	"github.com/cert-manager/cert-manager/pkg/util/pki"
)

func mustGenerateRSAKey(t *testing.T) *rsa.PrivateKey {
	t.Helper()

	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	return key
}

func mustCreateCertificate(t *testing.T, key crypto.Signer, cn string, dnsNames []string, notBefore, notAfter time.Time) ([]byte, *x509.Certificate) {
	t.Helper()

	template := &x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject:      pkix.Name{CommonName: cn},
		DNSNames:     dnsNames,
		NotBefore:    notBefore,
		NotAfter:     notAfter,
		KeyUsage:     x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
	}

	der, err := x509.CreateCertificate(rand.Reader, template, template, key.Public(), key)
	if err != nil {
		t.Fatal(err)
	}

	cert, err := x509.ParseCertificate(der)
	if err != nil {
		t.Fatal(err)
	}

	return pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der}), cert
}

func mustCreateCSR(t *testing.T, key crypto.Signer, cn string, dnsNames []string) []byte {
	t.Helper()

	template := &x509.CertificateRequest{
		Subject:  pkix.Name{CommonName: cn},
		DNSNames: dnsNames,
	}

	der, err := x509.CreateCertificateRequest(rand.Reader, template, key)
	if err != nil {
		t.Fatal(err)
	}

	return pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE REQUEST", Bytes: der})
}

func TestNormalizeZone(t *testing.T) {
	tests := map[string]string{
		"TeamA":                    `\VED\Policy\TeamA`,
		`\TeamA`:                   `\VED\Policy\TeamA`,
		`\VED\Policy\TeamA`:        `\VED\Policy\TeamA`,
		`\VED\Policy\TeamA\Sub`:    `\VED\Policy\TeamA\Sub`,
	}

	for input, expected := range tests {
		if got := normalizeZone(input); got != expected {
			t.Errorf("normalizeZone(%q) = %q, want %q", input, got, expected)
		}
	}
}

func TestGenerateEphemeralPassword(t *testing.T) {
	seen := make(map[string]bool)

	for i := 0; i < 20; i++ {
		password, err := GenerateEphemeralPassword()
		if err != nil {
			t.Fatal(err)
		}

		if len(password) < 12 {
			t.Fatalf("password %q is shorter than 12 characters", password)
		}

		classes := 0
		if strings.ContainsAny(password, "abcdefghijklmnopqrstuvwxyz") {
			classes++
		}
		if strings.ContainsAny(password, "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
			classes++
		}
		if strings.ContainsAny(password, "0123456789") {
			classes++
		}
		if strings.ContainsAny(password, "!@#$%^&*()-_=+") {
			classes++
		}
		if classes < 3 {
			t.Fatalf("password %q does not contain at least 3 character classes", password)
		}

		if seen[password] {
			t.Fatalf("generated duplicate password %q", password)
		}
		seen[password] = true
	}
}

func TestSearchExistingCertificates(t *testing.T) {
	key := mustGenerateRSAKey(t)
	certPEM, _ := mustCreateCertificate(
		t,
		key,
		"app.example.com",
		[]string{"app.example.com"},
		time.Now().Add(-time.Hour),
		time.Now().Add(24*time.Hour),
	)

	const dn = `\VED\Policy\TeamA\app.example.com`
	var filters []string

	conn := internalfake.Connector{
		SearchCertificatesFunc: func(req *certificate.SearchRequest) (*certificate.CertSearchResponse, error) {
			filters = append([]string(nil), (*req)...)
			return &certificate.CertSearchResponse{
				Certificates: []certificate.CertSeachInfo{
					{
						CertificateRequestId:   dn,
						CertificateRequestGuid: "{guid}",
					},
				},
			}, nil
		},
		RetrieveCertificateFunc: func(req *certificate.Request) (*certificate.PEMCollection, error) {
			if req.PickupID != dn {
				t.Fatalf("unexpected pickup ID %q", req.PickupID)
			}
			if req.FetchPrivateKey {
				t.Fatal("did not expect a private key request")
			}
			return &certificate.PEMCollection{Certificate: string(certPEM)}, nil
		},
	}.Default()

	v := &Venafi{vcertClient: conn}

	got, err := v.SearchExistingCertificates("TeamA", "app.example.com", []string{"app.example.com"}, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	if len(got) != 1 {
		t.Fatalf("expected 1 candidate, got %d", len(got))
	}
	if got[0].DN != dn {
		t.Errorf("DN = %q, want %q", got[0].DN, dn)
	}
	if got[0].GUID != "{guid}" {
		t.Errorf("GUID = %q, want %q", got[0].GUID, "{guid}")
	}
	if got[0].CN != "app.example.com" {
		t.Errorf("CN = %q, want %q", got[0].CN, "app.example.com")
	}
	if len(got[0].DNSNames) != 1 || got[0].DNSNames[0] != "app.example.com" {
		t.Errorf("DNSNames = %v, want [app.example.com]", got[0].DNSNames)
	}
	if got[0].Thumbprint == "" {
		t.Error("expected a non-empty thumbprint")
	}
	if got[0].CADN != "" {
		t.Errorf("CADN = %q, want empty because CADN is ignored", got[0].CADN)
	}

	joined := strings.Join(filters, "&")
	if !strings.Contains(joined, "ParentDn="+url.QueryEscape(`\VED\Policy\TeamA`)) {
		t.Errorf("filters do not contain the expected ParentDn: %s", joined)
	}
	if !strings.Contains(joined, "CN=app.example.com") {
		t.Errorf("filters do not contain the expected CN: %s", joined)
	}
	if !strings.Contains(joined, "SAN-DNS=app.example.com") {
		t.Errorf("filters do not contain the expected SAN-DNS: %s", joined)
	}
	if !strings.Contains(joined, "ValidToGreater=") {
		t.Errorf("filters do not contain ValidToGreater: %s", joined)
	}
}

func TestRetrieveExistingCertificate(t *testing.T) {
	key := mustGenerateRSAKey(t)
	certPEM, cert := mustCreateCertificate(
		t,
		key,
		"app.example.com",
		[]string{"app.example.com"},
		time.Now().Add(-time.Hour),
		time.Now().Add(24*time.Hour),
	)

	keyDER, err := x509.MarshalPKCS8PrivateKey(key)
	if err != nil {
		t.Fatal(err)
	}
	keyPEM := pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: keyDER})

	const dn = `\VED\Policy\TeamA\app.example.com`

	conn := internalfake.Connector{
		RetrieveCertificateFunc: func(req *certificate.Request) (*certificate.PEMCollection, error) {
			if req.PickupID != dn {
				t.Fatalf("unexpected pickup ID %q", req.PickupID)
			}
			if !req.FetchPrivateKey {
				t.Fatal("expected a private key request")
			}
			if req.KeyPassword != "password" {
				t.Fatalf("unexpected key password %q", req.KeyPassword)
			}
			return &certificate.PEMCollection{
				Certificate: string(certPEM),
				PrivateKey:  string(keyPEM),
			}, nil
		},
	}.Default()

	v := &Venafi{vcertClient: conn}

	got, err := v.RetrieveExistingCertificate(dn, "password")
	if err != nil {
		t.Fatal(err)
	}
	if len(got.CertificatePEM) == 0 {
		t.Fatal("expected certificate PEM")
	}
	if len(got.PrivateKeyPEM) == 0 {
		t.Fatal("expected private key PEM")
	}

	privateKey, err := pki.DecodePrivateKeyBytes(got.PrivateKeyPEM)
	if err != nil {
		t.Fatal(err)
	}
	matches, err := pki.PublicKeysEqual(cert.PublicKey, privateKey.Public())
	if err != nil {
		t.Fatal(err)
	}
	if !matches {
		t.Fatal("certificate and private key public keys do not match")
	}
}

func TestDecryptPrivateKey(t *testing.T) {
	key := mustGenerateRSAKey(t)
	const password = "ChangeMe-123456"

	der, err := pkcs8.MarshalPrivateKey(key, []byte(password), nil)
	if err != nil {
		t.Fatal(err)
	}
	encrypted := string(pem.EncodeToMemory(&pem.Block{Type: "ENCRYPTED PRIVATE KEY", Bytes: der}))

	decrypted, err := decryptPrivateKey(encrypted, password)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(decrypted), "ENCRYPTED PRIVATE KEY") {
		t.Fatal("private key was not decrypted")
	}
	if _, err := pki.DecodePrivateKeyBytes(decrypted); err != nil {
		t.Fatal(err)
	}
}

func TestFindReusableCertificate(t *testing.T) {
	key := mustGenerateRSAKey(t)
	certPEM, _ := mustCreateCertificate(
		t,
		key,
		"app.example.com",
		[]string{"app.example.com"},
		time.Now().Add(-time.Hour),
		time.Now().Add(24*time.Hour),
	)

	const dn = `\VED\Policy\TeamA\app.example.com`

	conn := internalfake.Connector{
		SearchCertificatesFunc: func(_ *certificate.SearchRequest) (*certificate.CertSearchResponse, error) {
			return &certificate.CertSearchResponse{
				Certificates: []certificate.CertSeachInfo{
					{
						CertificateRequestId:   dn,
						CertificateRequestGuid: "{guid}",
					},
				},
			}, nil
		},
		RetrieveCertificateFunc: func(_ *certificate.Request) (*certificate.PEMCollection, error) {
			return &certificate.PEMCollection{Certificate: string(certPEM)}, nil
		},
	}.Default()

	v := &Venafi{vcertClient: conn}

	csrPEM := mustCreateCSR(t, key, "app.example.com", []string{"app.example.com"})
	got, err := v.FindReusableCertificate("TeamA", csrPEM, time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	if got == nil {
		t.Fatal("expected a reusable certificate")
	}
	if len(got.CertificatePEM) == 0 {
		t.Fatal("expected certificate PEM")
	}

	otherKey := mustGenerateRSAKey(t)
	otherCSR := mustCreateCSR(t, otherKey, "app.example.com", []string{"app.example.com"})
	got, err = v.FindReusableCertificate("TeamA", otherCSR, time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	if got != nil {
		t.Fatal("expected no reusable certificate for a different key")
	}
}
```

---

# Compile and test

After applying Phase 1 and Phase 2:

```bash
gofmt -w \
  pkg/apis/certmanager/v1/types.go \
  pkg/apis/certmanager/v1/types_certificate.go \
  pkg/issuer/venafi/client/api/adoption.go \
  pkg/issuer/venafi/client/venaficlient.go \
  pkg/issuer/venafi/client/adoption.go \
  pkg/issuer/venafi/client/instrumentedvenaficlient.go \
  pkg/issuer/venafi/client/fake/venafi.go \
  pkg/issuer/venafi/client/fake/connector.go \
  pkg/issuer/venafi/client/adoption_test.go

go test ./pkg/issuer/venafi/client/...
```

Expected result:

- Phase 1 constants compile.
- The `Venafi` client still satisfies `Interface`.
- The fake `Venafi` and fake `Connector` satisfy the updated interfaces.
- `adoption_test.go` passes.

# Known limitations in Phase 2

- CADN is not retrieved or compared.
- Only DNS SANs are used in the TPP search filter. IP, URI, and email SANs are compared locally after retrieval, but they are not used in the search filter.
- `FindReusableCertificate` returns `nil, nil` when no certificate matches; TPP errors are returned as errors.
- The private key is retrieved and decrypted only by `RetrieveExistingCertificate`; reuse does not need the private key.
