# Adopting Existing Venafi TPP Certificates into cert-manager

Status: Draft  
Applies to: cert-manager with the Venafi TPP issuer  
Scope: Adopt certificates that already exist in Venafi TPP, including their private keys, into Kubernetes TLS Secrets and let cert-manager manage their lifecycle.  
Note: This is an implementation and test plan. The source changes described here are not part of the current tree.

## 1. Summary

Users already created certificates in Venafi TPP before cert-manager was introduced. TPP generated the key pair and stored the private key. The goal is to avoid creating a duplicate certificate when a `Certificate` resource is created for a host that already has a valid certificate in the same TPP zone.

The feature has three parts:

1. **Adoption:** find an existing TPP certificate, retrieve the certificate chain and private key, validate them, and create the target Kubernetes TLS Secret.
2. **Key reuse:** configure the `Certificate` so cert-manager reuses the private key already placed in the Secret instead of generating a new one.
3. **Issuer reuse:** before creating a new Venafi request, make the Venafi issuer search TPP for the existing certificate whose public key matches the `CertificateRequest` CSR. If found, return it as the issued certificate.

The end state is:

```text
Existing TPP certificate + private key
        |
        v
Kubernetes TLS Secret (tls.crt, tls.key, ca.crt)
        |
        v
Certificate with privateKey.rotationPolicy: Never
        |
        v
CertificateRequest with CSR generated from the existing key
        |
        v
Venafi issuer finds and returns the existing TPP certificate
        |
        v
Normal cert-manager status, Secret management, and renewal
```

## 2. Assumptions

This design assumes:

- The target certificates were created by Venafi TPP with centrally generated key pairs. In TPP terms, `CSR Generation` is `Service Generated CSR` and `Generate Key/CSR on Application` is not selected.
- In TPP, the certificate shows **Private Key Stored: Yes**.
- The TPP identity used by cert-manager has:
  - `Read` permission on the certificate object or its policy folder.
  - `Private Key Read` permission on the certificate object or its policy folder.
  - token scope that allows certificate retrieval, normally `certificate:manage`.
- The certificates are in the same TPP zone as the `Issuer`/`ClusterIssuer`, or the correct zone is explicitly configured.
- The existing certificate is still valid, or a new certificate may be issued when it is expired.
- The existing private key can be exported by TPP. If TPP stores the key but policy forbids export, adoption cannot proceed.

The implementation must still check these conditions at runtime and fail safely if any are false.

## 3. Non-goals

- Venafi Cloud/VCert SaaS support. This document targets TPP.
- Adopting certificates whose private key is not available in TPP, unless the key is imported separately.
- Automatically deciding that any certificate in a zone belongs to a Kubernetes namespace. Ownership must be explicit or policy-controlled.
- Replacing cert-manager's core key/CSR state machine. The design works with the existing `Certificate` -> `CertificateRequest` -> issuer flow.

## 4. Why the Venafi issuer alone cannot do this

cert-manager's issuer response contains only:

```go
type IssueResponse struct {
    Certificate []byte
    CA          []byte
}
```

The issuer cannot return a private key.

The certificate controller also checks:

```go
certificate.PublicKey == CSR.PublicKey
```

and the Secret must contain a private key matching the certificate.

Therefore, if an existing TPP certificate has a different private key from the one cert-manager generated, the issuer cannot simply return the old certificate. It would be rejected as not matching the CSR.

The CertificateRequest spec is immutable, so the CSR cannot be swapped after the request is created.

The correct insertion point is therefore **before** cert-manager generates the CSR: place the existing private key in the target Secret and tell cert-manager to reuse it.

## 5. Design overview

### 5.1 Components

| Component | Responsibility |
|---|---|
| TPP search/retrieve client | Search by zone/CN/SAN, retrieve certificate chain and private key, retrieve metadata |
| Adoption controller | Decide whether to adopt, validate the certificate/key, create the target Secret, set a Certificate condition |
| Keymanager gate | Prevent keymanager from generating a new key while adoption is pending |
| Venafi issuer reuse check | Before requesting a new certificate, search TPP and return the existing certificate if its public key matches the CSR |
| Secret builder | Construct a `kubernetes.io/tls` Secret with the correct data and metadata |
| Validation helpers | Verify certificate/key match, SANs, CA, validity, usages, and key spec |

### 5.2 Adoption state machine

The adoption controller should use a `Certificate` condition rather than a mutable annotation for its state:

```yaml
status:
  conditions:
    - type: VenafiAdoption
      status: "True"
      reason: Adopted
      message: "Adopted Venafi certificate \\VED\\Policy\\TeamA\\app.example.com"
```

States:

| Condition status | Reason | Meaning |
|---|---|---|
| `False` | `Pending` | Adoption is in progress; keymanager must wait |
| `True` | `Adopted` | Secret has been seeded with a valid cert/key |
| `False` | `Skipped` | No adoptable certificate; normal issuance may proceed |
| `False` | `Failed` | Adoption failed; retry or require administrator action |
| `True` | `AlreadyPresent` | Secret already contains a valid certificate/key |

Recommended keymanager behavior:

```text
if Certificate has venafi.cert-manager.io/adopt-existing=true:
    if condition VenafiAdoption is missing or reason is Pending:
        wait
    if condition reason is Adopted or AlreadyPresent or Skipped:
        continue
    if condition reason is Failed:
        wait and retry, unless the user removes the annotation
```

### 5.3 Why `rotationPolicy: Never`

cert-manager v1.18+ defaults `spec.privateKey.rotationPolicy` to `Always`.

With `Always`, keymanager always generates a new key, even if `spec.secretName` already contains a private key. That new key produces a new CSR public key, which cannot match the existing TPP certificate.

With `Never`, keymanager reads the private key from `spec.secretName` and creates the temporary `next-private-key` Secret from that key:

```go
func (c *controller) createNextPrivateKeyRotationPolicyNever(...) {
    s, err := c.secretLister.Secrets(crt.Namespace).Get(crt.Spec.SecretName)
    ...
    existingPKData := s.Data[corev1.TLSPrivateKeyKey]
    ...
}
```

That is what allows the existing TPP certificate to be reused.

Adoption requires:

```yaml
spec:
  privateKey:
    rotationPolicy: Never
    algorithm: RSA
    size: 2048
```

The algorithm and size must match the existing key exactly. If they do not, keymanager logs a warning and waits for user intervention.

After adoption, the policy can later be changed to `Always` if key rotation is desired at the next renewal.

### 5.4 Adoption versus renewal

Adoption should apply only to the initial issuance of a `Certificate`:

- `status.revision` is nil or the adoption condition indicates initial adoption.
- No valid certificate/key exists in the target Secret.
- The Certificate is not already in an `Issuing` cycle for a renewal.

On renewal:

- Do not adopt the same certificate again.
- Let the normal trigger/requestmanager flow create a new CertificateRequest.
- The Venafi issuer may search TPP but must not return the current certificate.
- A simple first implementation can reuse only for CertificateRequest revision `1`; renewal always requests a new certificate.

### 5.5 Fallback when the target host has no TPP certificate

If the target host does not exist in TPP, adoption is not an error. It is a definitive "no match" and cert-manager continues with normal issuance.

Flow:

```text
Certificate created with adopt-existing=true
        |
        v
VenafiAdoption=False, Reason=Pending
        |
        v
Search TPP by zone + CN/SANs
        |
        v
No matching certificate
        |
        v
VenafiAdoption=False, Reason=Skipped
Message="No matching Venafi certificate found"
        |
        v
keymanager proceeds
        |
        v
No private key in spec.secretName
        |
        v
Generate a new private key
        |
        v
requestmanager creates CertificateRequest with new CSR
        |
        v
Venafi issuer searches TPP again
        |
        v
No candidate, or candidate public key != CSR public key
        |
        v
client.RequestCertificate()
        |
        v
TPP issues a new certificate
        |
        v
Certificate becomes Ready
        |
        v
Normal renewal lifecycle
```

Condition transitions:

| Step | Condition |
|---|---|
| Adoption started | `VenafiAdoption=False`, `Reason=Pending` |
| TPP search returned no match | `VenafiAdoption=False`, `Reason=Skipped` |
| Normal issuance starts | keymanager and requestmanager continue |
| Certificate issued | `Ready=True` |

`Skipped` means "nothing to adopt; continue with normal issuance." The keymanager gate must allow processing when it sees `Skipped`.

#### `rotationPolicy: Never` does not block new certificates

`Never` means:

```text
If a private key exists in spec.secretName:
    reuse it
Else:
    generate a new one
```

So for a host with no existing TPP certificate and no existing Secret, `rotationPolicy: Never` is still correct. Keymanager finds no key and generates one normally.

#### "No match" versus "cannot determine"

| TPP result | Adoption behavior | Normal issuance? |
|---|---|---|
| No matching certificate | `Skipped` | Yes |
| Certificate exists but is expired | `Skipped` | Yes |
| Certificate exists but has no private key | `Skipped` or `PrivateKeyUnavailable` | Yes, according to policy |
| Certificate exists but key/identity/CA does not match | `Failed` / `KeyMismatch` | Wait for user or policy decision |
| TPP search timeout or 5xx | `Failed` / `SearchFailed` | Retry; do not immediately create a duplicate |
| TPP permission denied | `Failed` / `PermissionDenied` | Retry; do not create a duplicate |

The distinction is intentional:

- **No certificate** -> proceed and issue a new one.
- **Cannot determine whether a certificate exists** -> retry; do not issue blindly.
- **Certificate exists but cannot be adopted** -> wait for a decision, because issuing a new one may create a duplicate.

## 6. Data contract

### 6.1 Opt-in annotation

Use an annotation for the first implementation. This avoids CRD changes.

Add constants in `pkg/apis/certmanager/v1/types.go`:

```go
const (
    // VenafiAdoptExistingAnnotationKey opts a Certificate into adopting
    // an existing Venafi TPP certificate and private key.
    VenafiAdoptExistingAnnotationKey = "venafi.cert-manager.io/adopt-existing"

    // VenafiCertificateDNAnnotationKey records the source TPP certificate DN.
    VenafiCertificateDNAnnotationKey = "venafi.cert-manager.io/certificate-dn"

    // VenafiCertificateGUIDAnnotationKey records the source TPP certificate GUID.
    VenafiCertificateGUIDAnnotationKey = "venafi.cert-manager.io/certificate-guid"

    // VenafiCertificateThumbprintAnnotationKey records the source certificate thumbprint.
    VenafiCertificateThumbprintAnnotationKey = "venafi.cert-manager.io/certificate-thumbprint"
)
```

This is a `pkg`-only change. It does not require `internal/apis`, conversion, CRD generation, or a webhook rebuild.

### 6.2 Certificate shape

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: app
  namespace: team-a
  annotations:
    venafi.cert-manager.io/adopt-existing: "true"
spec:
  secretName: app-tls
  issuerRef:
    name: venafi-tpp
    kind: ClusterIssuer
  commonName: app.example.com
  dnsNames:
    - app.example.com
  privateKey:
    rotationPolicy: Never
    algorithm: RSA
    size: 2048
```

If the existing key is ECDSA:

```yaml
  privateKey:
    rotationPolicy: Never
    algorithm: ECDSA
    size: 256
```

If the existing key is Ed25519:

```yaml
  privateKey:
    rotationPolicy: Never
    algorithm: Ed25519
```

Set `commonName`, `dnsNames`, and other subject fields to the exact values in the existing certificate. The adoption validator must reject mismatches.

### 6.3 Secret shape

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-tls
  namespace: team-a
  labels:
    controller.cert-manager.io/fao: "true"
  annotations:
    venafi.cert-manager.io/certificate-dn: '\VED\Policy\TeamA\app.example.com'
    venafi.cert-manager.io/certificate-guid: '{...}'
    venafi.cert-manager.io/certificate-thumbprint: '...'
  ownerReferences:
    - apiVersion: cert-manager.io/v1
      kind: Certificate
      name: app
      uid: ...
type: kubernetes.io/tls
data:
  tls.crt: <leaf certificate + intermediate chain>
  tls.key: <unencrypted private key PEM>
  ca.crt:  <CA/root chain>
```

`tls.crt` must have the leaf certificate first. `ca.crt` may contain the root or the CA chain.

### 6.4 Certificate conditions

Add a condition type:

```text
VenafiAdoption
```

Reasons:

```text
Pending
Adopted
AlreadyPresent
Skipped
PrivateKeyUnavailable
KeyMismatch
IdentityMismatch
CAMismatch
Expired
Ambiguous
PermissionDenied
SearchFailed
RetrieveFailed
```

Conditions are status-only and do not change the CRD schema.

## 7. TPP integration

### 7.1 Permissions

The TPP identity used by the Venafi issuer needs:

- `Read` on the certificate object or parent policy folder.
- `Private Key Read` on the certificate object or parent policy folder.
- token scope `certificate:manage` for `Certificates/Retrieve`.

TPP object permissions are separate from token scopes. Granting `certificate:manage` is not enough if the identity lacks `Private Key Read` on the certificate.

Use the existing cert-manager Venafi credentials Secret. No new Secret type is required.

### 7.2 Search

Use TPP `GET Certificates` or vcert's `SearchCertificates`.

Example TPP search:

```http
GET /vedsdk/certificates/?ParentDn=\VED\Policy\TeamA
  &CN=app.example.com
  &ValidToGreater=2026-10-18T00:00:00Z
  &OptionalFields=KeyAlgorithm,KeySize,Subject,Issuer
Authorization: Bearer <token>
```

Useful filters:

```text
ParentDn
ParentDnRecursive
CN
SAN-DNS
SAN-IP
SAN-URI
SAN-Email
ValidToGreater
Disabled
InError
PendingWorkflow
```

Search result fields used by adoption:

```text
DN
Guid
ParentDn
X509.CN
X509.SANS
X509.Serial
X509.Thumbprint
X509.ValidFrom
X509.ValidTo
X509.KeyAlgorithm
X509.KeySize
```

Important details:

- Use `ParentDn` for an exact zone match.
- Use `ParentDnRecursive` only if subfolders are intentionally allowed.
- TPP search does not filter by CA DN/CADN. Retrieve metadata and compare `CertificateAuthorityDN`.
- vcert's `SearchCertificate` helper filters exact DNS SAN sets and only handles DNS SANs. For CN/IP/URI/email matching, use `SearchCertificates` and filter the results locally.
- Do not trust TPP metadata alone for key algorithm and size. Parse the actual certificate and private key after retrieval.

### 7.3 Retrieve certificate and private key

Use TPP `POST Certificates/Retrieve`:

```json
{
  "CertificateDN": "\\VED\\Policy\\TeamA\\app.example.com",
  "Format": "Base64 (PKCS #8)",
  "IncludePrivateKey": true,
  "IncludeChain": true,
  "RootFirstOrder": false,
  "Password": "<ephemeral-strong-password>"
}
```

The `Password` field encrypts the returned private key. It is not the TPP user password. TPP requires a strong password: at least 12 characters using at least three of uppercase, lowercase, numbers, and special characters.

Requirements:

- `IncludePrivateKey: true`
- a password
- `Private Key Read` permission
- certificate enrollment must be complete

If TPP does not have the key, the API returns:

```text
Failed to look up private key vault ID
```

In that case mark adoption as `PrivateKeyUnavailable`; do not create a Secret from the certificate alone.

### 7.4 vcert retrieval

The existing Venafi client can use:

```go
req := &certificate.Request{
    PickupID:        certificateDN,
    FetchPrivateKey: true,
    KeyPassword:     ephemeralPassword,
    ChainOption:     certificate.ChainOptionRootLast,
    Timeout:         60 * time.Second,
}

pemCollection, err := client.RetrieveCertificate(req)
```

`pemCollection` contains:

```go
Certificate string
Chain       []string
PrivateKey  string
```

For production, prefer an explicit TPP REST retrieval with `Format: Base64 (PKCS #8)` so the format is not dependent on vcert's RSA-oriented format selection. This matters for ECDSA and Ed25519 certificates.

### 7.5 Private key decryption

TPP returns the private key encrypted when `IncludePrivateKey=true`.

vcert includes a helper:

```go
import vcertutil "github.com/Venafi/vcert/v5/pkg/util"

decryptedPEM, err := vcertutil.DecryptPkcs8PrivateKey(pemCollection.PrivateKey, password)
```

Alternatively use `github.com/youmark/pkcs8` directly. cert-manager's `pki.DecodePrivateKeyBytes` does not support encrypted PKCS#8, so decrypt before storing in the Secret.

If the key is already unencrypted PEM, use it as-is.

Do not log the password, encrypted key, or decrypted key.

### 7.6 Key algorithm and size detection

TPP can return key metadata:

```http
GET /vedsdk/certificates/?ParentDn=...&CN=...&OptionalFields=KeyAlgorithm,KeySize
```

Fields:

```text
X509.KeyAlgorithm
X509.KeySize
```

Normalize values such as `ECC` to cert-manager's `ECDSA`.

The authoritative method is to parse the retrieved certificate:

```go
cert, err := pki.DecodeX509CertificateBytes(certPEM)
if err != nil {
    return err
}

switch pub := cert.PublicKey.(type) {
case *rsa.PublicKey:
    // algorithm: RSA
    // size: pub.N.BitLen()
case *ecdsa.PublicKey:
    // algorithm: ECDSA
    // size: pub.Curve.Params().BitSize
case ed25519.PublicKey:
    // algorithm: Ed25519
    // size: ignored
}
```

Derive the same values from the private key and confirm they match.

Mapping:

| Actual key | `Certificate.spec.privateKey` |
|---|---|
| RSA 2048 | `algorithm: RSA`, `size: 2048` |
| RSA 4096 | `algorithm: RSA`, `size: 4096` |
| RSA 3072 | `algorithm: RSA`, `size: 3072` |
| ECDSA P-256 | `algorithm: ECDSA`, `size: 256` |
| ECDSA P-384 | `algorithm: ECDSA`, `size: 384` |
| ECDSA P-521 | `algorithm: ECDSA`, `size: 521` |
| Ed25519 | `algorithm: Ed25519`, omit `size` |

`encoding` does not need to match for adoption. cert-manager can parse both PKCS#1 and PKCS#8 private keys.

## 8. Implementation plan

### 8.1 API constants

File:

```text
pkg/apis/certmanager/v1/types.go
```

Add the annotation constants from section 6.1.

No `internal/apis` change is needed because these are metadata annotations, not spec fields.

No generated code is needed for string constants.

### 8.2 Venafi client interface

Files:

```text
pkg/issuer/venafi/client/venaficlient.go
pkg/issuer/venafi/client/request.go
pkg/issuer/venafi/client/fake/venafi.go
```

Add types:

```go
type ExistingCertificate struct {
    DN         string
    GUID       string
    CN         string
    DNSNames   []string
    IPAddresses []string
    URIs       []string
    Emails     []string
    NotBefore  time.Time
    NotAfter   time.Time
    Thumbprint string
    CADN       string
    KeyAlgorithm string
    KeySize      int
}

type RetrievedCertificate struct {
    CertificatePEM []byte
    ChainPEM       []byte
    CAPEM          []byte
    PrivateKeyPEM  []byte
    NotBefore      time.Time
    NotAfter       time.Time
    DNSNames       []string
    IPAddresses    []string
    URIs           []string
    Emails         []string
    Thumbprint     string
}
```

Add methods to `Interface`:

```go
SearchExistingCertificates(
    zone string,
    cn string,
    sans []string,
    minRemaining time.Duration,
) ([]ExistingCertificate, error)

RetrieveExistingCertificate(
    dn string,
    privateKeyPassword string,
) (*RetrievedCertificate, error)
```

The existing `connector` interface already wraps `RequestCertificate` and `RetrieveCertificate`. Add `SearchCertificates` if using `tpp.Connector` through the instrumented client.

Implementation notes:

- The zone comes from `issuer.GetSpec().Venafi.Zone`; for a `ClusterIssuer`, read it from the `ClusterIssuer` spec.
- `SearchExistingCertificates` should call TPP search with `ParentDn` and `CN`/`SAN-DNS` filters.
- Filter results locally for exact SAN sets, CA DN, expiry, disabled/error state, and ownership.
- `RetrieveExistingCertificate` should request `IncludePrivateKey=true`, `IncludeChain=true`, and `RootFirstOrder=false`.
- Decrypt the private key before returning it.
- Set a timeout, for example 60 seconds.

Update the fake implementation in `pkg/issuer/venafi/client/fake/venafi.go` with function fields so controller tests can stub search and retrieval.

### 8.3 Validation helpers

Create a package or file, for example:

```text
pkg/controller/certificates/venafi-adoption/validate.go
```

Functions:

```go
func validateAdoption(
    crt *cmapi.Certificate,
    cert *x509.Certificate,
    pk crypto.Signer,
    chain []*x509.Certificate,
    tppCADN string,
) error
```

Checks:

1. Private key matches certificate:
   ```go
   pki.PublicKeysEqual(cert.PublicKey, pk.Public())
   ```

2. Key spec matches:
   ```go
   violations := pki.PrivateKeyMatchesSpec(pk, crt.Spec)
   ```

3. CN and SANs match `Certificate.spec`:
   - common name
   - DNS names
   - IP addresses
   - URIs
   - email addresses
   - other names, if supported

4. Validity:
   - `cert.NotBefore <= now`
   - `cert.NotAfter > now + renewBefore + safetyMargin`

5. CA:
   - `tppCADN == ""` or `tppCADN == certCADN`
   - the issuing chain is valid

6. Usages:
   - key usages and extended key usages match the Certificate spec
   - `cert.IsCA == crt.Spec.IsCA`

7. Revocation/state:
   - TPP certificate is not disabled, in error, or pending workflow
   - not revoked, if TPP exposes that state

8. Ownership:
   - explicit namespace/secret mapping, or
   - a TPP custom field/owner tag, or
   - a policy-controlled zone restriction

Return a typed error or reason so the controller can set the condition reason.

### 8.4 Secret builder

Create:

```text
pkg/controller/certificates/venafi-adoption/secret.go
```

Build a `corev1.Secret`:

```go
secret := &corev1.Secret{
    ObjectMeta: metav1.ObjectMeta{
        Name:      crt.Spec.SecretName,
        Namespace: crt.Namespace,
        Labels: map[string]string{
            cmapi.PartOfCertManagerControllerLabelKey: "true",
        },
        Annotations: map[string]string{
            cmapi.VenafiCertificateDNAnnotationKey:         existing.DN,
            cmapi.VenafiCertificateGUIDAnnotationKey:       existing.GUID,
            cmapi.VenafiCertificateThumbprintAnnotationKey: existing.Thumbprint,
        },
    },
    Type: corev1.SecretTypeTLS,
    Data: map[string][]byte{
        corev1.TLSCertKey:       certPEM,
        corev1.TLSPrivateKeyKey: keyPEM,
        "ca.crt":                caPEM,
    },
}
```

Set an owner reference to the Certificate when the Certificate UID is available.

For a bulk migration, it is acceptable to create the Secret before the Certificate and patch the owner reference afterwards.

### 8.5 Adoption controller

Create:

```text
pkg/controller/certificates/venafi-adoption/controller.go
pkg/controller/certificates/venafi-adoption/controller_test.go
pkg/controller/certificates/venafi-adoption/validate.go
pkg/controller/certificates/venafi-adoption/secret.go
```

Controller name:

```go
const ControllerName = "certificates-venafi-adoption"
```

Register in `init()`:

```go
controllerpkg.Register(ControllerName, func(ctx *controllerpkg.ContextFactory) (controllerpkg.Interface, error) {
    return controllerpkg.NewBuilder(ctx, ControllerName).
        For(&controller{...}).
        Complete()
})
```

Reconcile logic:

```text
1. Get Certificate.
2. If deletion timestamp is set, return.
3. If annotation adopt-existing != "true", return.
4. If condition VenafiAdoption reason is Adopted/AlreadyPresent, return.
5. If this is a renewal (status.revision != nil and Issuing=True), set Skipped and return.
6. If target Secret exists and contains a valid cert/key matching spec:
       set AlreadyPresent and return.
7. Set Pending condition.
8. Build Venafi client from the issuer.
9. Search TPP in the issuer zone.
10. Filter candidates.
11. If none: set Skipped or Failed according to policy and return.
12. If multiple ambiguous: set Failed/Ambiguous and return.
13. Retrieve certificate chain and private key.
14. Validate.
15. Create or update Secret.
16. Set Adopted condition with source DN/thumbprint.
```

The controller must be idempotent. On restart it should detect an existing valid Secret and set `AlreadyPresent`, not retrieve again unnecessarily.

### 8.6 Keymanager gate

File:

```text
pkg/controller/certificates/keymanager/keymanager_controller.go
```

At the start of key processing, if the Certificate has the opt-in annotation:

```go
cond := apiutil.GetCertificateCondition(crt, "VenafiAdoption")
if cond == nil || cond.Reason == "Pending" {
    log.V(logf.DebugLevel).Info("Waiting for Venafi certificate adoption")
    return nil
}
if cond.Reason == "Failed" {
    // Wait and retry; do not generate a new key and create a duplicate certificate.
    return nil
}
```

Proceed when the reason is:

```text
Adopted
AlreadyPresent
Skipped
```

If the administrator wants to bypass adoption after a failure, they can remove:

```yaml
venafi.cert-manager.io/adopt-existing: "true"
```

A one-time migration that creates Secrets before Certificates does not need this gate, but the gate is required for automatic runtime adoption.

### 8.7 Venafi issuer reuse

File:

```text
pkg/controller/certificaterequests/venafi/venafi.go
```

In `Sign()`, before:

```go
pickupID, err = client.RequestCertificate(...)
```

add a reuse check:

```text
1. Only attempt reuse when the CertificateRequest revision is 1.
2. Search TPP in the issuer zone by CN/SAN.
3. Filter valid candidates.
4. Retrieve the candidate certificate.
5. Compare the candidate certificate public key with the CSR public key.
6. If they match, return the certificate and CA as IssueResponse.
7. If they do not match, log and continue with RequestCertificate.
```

Pseudo-code:

```go
if reuseEnabled(cr) {
    existing, err := client.FindReusableCertificate(zone, cr.Spec.Request)
    if err == nil && existing != nil {
        return &issuerpkg.IssueResponse{
            Certificate: existing.ChainPEM,
            CA:          existing.CAPEM,
        }, nil
    }
}
```

To compare keys:

```go
csr, err := pki.DecodeX509CertificateRequestBytes(cr.Spec.Request)
...
ok, err := pki.PublicKeysEqual(cert.PublicKey, csr.PublicKey)
```

For renewal, skip the candidate if:

- the CertificateRequest revision is greater than 1
- the candidate thumbprint equals the current certificate in the Secret
- the candidate `NotAfter` is not later than the current certificate
- the candidate is inside the renewal window

This avoids re-adopting the current certificate forever.

### 8.8 Controller registration

File:

```text
internal/apis/config/controller/v1alpha1/defaults.go
```

Add:

```go
venafiadoption.ControllerName
```

to both:

```go
AllControllers
DefaultEnabledControllers
```

The controller package must be imported so its `init()` runs. The defaults file already imports other certificate controllers; add the new package there.

No new RBAC is normally required. The controller already needs to read Certificates, Secrets, and Issuer resources, and create/update Secrets. Verify the generated controller ClusterRole includes the required verbs.

### 8.9 Events, metrics, and logging

Events:

```text
Normal  Adopted             Adopted Venafi certificate <DN>
Normal  AdoptionSkipped     No adoptable Venafi certificate found
Warning AdoptionFailed      Failed to retrieve Venafi certificate
Warning PrivateKeyMissing   TPP certificate has no stored private key
Warning KeyMismatch         Existing certificate key does not match Certificate spec
Warning AmbiguousMatch      Multiple candidate Venafi certificates found
```

Metrics (optional):

```text
certmanager_venafi_adoption_total{result="adopted|skipped|failed"}
certmanager_venafi_adoption_duration_seconds
```

Logs must never contain private-key material or TPP retrieval passwords.

### 8.10 API and CRD impact

Annotation-only implementation:

| Change | Required |
|---|---|
| `pkg/apis` constant | Yes |
| `internal/apis` | No |
| CRD update | No |
| webhook rebuild | No |
| controller rebuild | Yes |
| Helm chart change | No; only the controller image tag/value |
| generated conversion/deepcopy | No |

If an issuer-level setting is added instead of an annotation, for example:

```yaml
spec:
  venafi:
    tpp:
      adoptExisting: true
```

then the change touches both `pkg/apis` and `internal/apis`, conversions, deepcopy, OpenAPI, CRDs, and the webhook. The annotation approach is recommended for the first version.

### 8.11 Files changed

Expected files:

```text
pkg/apis/certmanager/v1/types.go
pkg/issuer/venafi/client/venaficlient.go
pkg/issuer/venafi/client/request.go
pkg/issuer/venafi/client/fake/venafi.go
pkg/controller/certificaterequests/venafi/venafi.go
pkg/controller/certificates/keymanager/keymanager_controller.go
pkg/controller/certificates/venafi-adoption/controller.go
pkg/controller/certificates/venafi-adoption/controller_test.go
pkg/controller/certificates/venafi-adoption/secret.go
pkg/controller/certificates/venafi-adoption/validate.go
internal/apis/config/controller/v1alpha1/defaults.go
docs/venafi-existing-certificate-adoption.md
```

## 9. Sequence

```text
User creates Certificate with adopt-existing=true
    |
    v
Adoption controller sees annotation
    |
    +--> Secret already valid? -> AlreadyPresent, done
    |
    +--> search TPP
            |
            +--> no candidate -> Skipped, normal issuance
            |
            +--> candidate
                    |
                    +--> retrieve cert + chain + key
                    +--> validate
                    +--> create Secret
                    +--> set Adopted
    |
    v
keymanager sees Secret + rotationPolicy Never
    |
    v
keymanager creates next-private-key Secret from existing key
    |
    v
requestmanager creates CertificateRequest with CSR from existing key
    |
    v
Venafi issuer Sign()
    |
    +--> search TPP
    +--> candidate public key == CSR public key?
            |
            +--> yes: return existing certificate + CA
            +--> no: request a new certificate
    |
    v
certificate controller writes final Secret and status
    |
    v
trigger controller schedules renewal from actual notAfter
```

## 10. Error handling and retry

| Situation | Behavior |
|---|---|
| TPP search timeout/5xx | Set `SearchFailed`, requeue with backoff, do not issue a duplicate |
| TPP permission denied | Set `PermissionDenied`, requeue, require administrator action |
| No matching certificate | Set `Skipped`, allow normal issuance |
| Certificate found but no private key | Set `PrivateKeyUnavailable`, allow reissue only if policy says so |
| Key algorithm/size mismatch | Set `KeyMismatch`, wait for user to correct spec or remove annotation |
| SAN/CN mismatch | Set `IdentityMismatch`, wait |
| CA/CADN mismatch | Set `CAMismatch`, skip |
| Expired certificate | Set `Expired`, allow normal issuance |
| Multiple candidates | Set `Ambiguous`, wait for manual selection |
| Secret already has a newer cert | Set `AlreadyPresent`, do not overwrite |
| Retrieval returns encrypted key that cannot be decrypted | Set `RetrieveFailed`, retry or require key password policy fix |
| Controller restart | Reconcile existing Secret and set `AlreadyPresent`; no duplicate |

Policy decision: on search/retrieval failure, prefer **not** requesting a new certificate automatically, because that can create duplicates. Only fall back to normal issuance when the failure is definitive (no certificate, no key, expired) or when an administrator enables fallback.

## 11. Security

- TPP `Private Key Read` is a powerful permission. Restrict the cert-manager TPP identity to the required policy folders.
- Use a dedicated TPP user/token for cert-manager.
- Enable Kubernetes Secret encryption at rest and restrict Secret read access.
- Never log private keys, decrypted key material, or TPP retrieval passwords.
- Use an ephemeral random password for each TPP retrieval; do not store it in Kubernetes.
- Require explicit ownership mapping or a TPP custom field before adopting a certificate. Matching only by hostname is not sufficient across teams.
- Audit adoption with the source TPP DN, GUID, thumbprint, and Kubernetes namespace/name.
- Do not adopt revoked, disabled, expired, or policy-noncompliant certificates.
- Limit adoption to the configured zone and, if set, the configured CADN.

## 12. Testing

### 12.1 Unit tests

Add tests for:

1. Search result filtering:
   - exact zone
   - exact CN/SAN set
   - expired certificate
   - disabled/in-error certificate
   - CA/CADN mismatch
   - multiple candidates

2. Validation:
   - cert/key match
   - key algorithm/size mismatch
   - SAN/CN mismatch
   - expired/inside renewal window
   - CA mismatch
   - wrong usages/isCA

3. Secret construction:
   - `tls.crt` leaf first
   - `tls.key` unencrypted
   - `ca.crt`
   - labels/annotations/ownerRef

4. Controller state machine:
   - no annotation -> no action
   - no Secret -> pending -> adopted
   - existing valid Secret -> already present
   - no candidate -> skipped
   - no private key -> skipped/private key unavailable
   - retrieval error -> failed/retry
   - renewal -> skipped

5. Keymanager gate:
   - pending -> no key generated
   - adopted/already present/skipped -> key processing continues
   - failed -> no new key

6. Venafi issuer reuse:
   - matching public key -> returns existing certificate
   - mismatched public key -> requests a new certificate
   - revision > 1 -> does not reuse
   - expired/inside renewal -> does not reuse

Use the existing fake Venafi client and controller test helpers.

### 12.2 Integration tests

Use a fake TPP client that returns:

- one valid certificate with matching key
- certificate with no key
- certificate with mismatched key
- expired certificate
- multiple candidates
- permission error

Verify the controller creates/does not create Secrets and sets the correct conditions.

### 12.3 Cluster prerequisites

- OpenShift cluster with the upstream cert-manager Helm chart, not the OpenShift cert-manager Operator.
- Internal registry access or mirrored images.
- TPP reachable from the cluster.
- TPP test zone and a TPP certificate created by TPP with `Private Key Stored: Yes`.
- TPP identity with `Read` and `Private Key Read`.
- A test namespace, for example `team-a`.
- `oc`, `helm`, `openssl`, and optionally `cmctl` installed.

Record the TPP certificate before testing:

```text
DN:         \VED\Policy\TeamA\app.example.com
GUID:       {...}
Thumbprint: ...
NotBefore:  ...
NotAfter:   ...
Key:        RSA 2048 / ECDSA P-256 / ...
CA:         \VED\Policy\CAs\...
```

### 12.4 Build and push the controller image

Only the controller changes for the annotation-based design.

```bash
export VERSION=v1.21.0-venafi-adopt.1

make VERSION="$VERSION" \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz

docker load -i _bin/containers/cert-manager-controller-linux-amd64.tar.gz
```

Push to the OpenShift internal registry:

```bash
REGISTRY_HOST=$(oc get route default-route \
  -n openshift-image-registry \
  -o jsonpath='{.spec.host}')

docker login "$REGISTRY_HOST" \
  -u "$(oc whoami)" \
  -p "$(oc whoami -t)"

docker tag \
  "cert-manager-controller-amd64:$VERSION" \
  "$REGISTRY_HOST/cert-manager/cert-manager-controller:venafi-adopt"

docker push \
  "$REGISTRY_HOST/cert-manager/cert-manager-controller:venafi-adopt"
```

If the default route does not exist:

```bash
oc create route reencrypt \
  --service=image-registry \
  -n openshift-image-registry
```

### 12.5 Deploy

If cert-manager is already installed with Helm:

```bash
helm upgrade --install cert-manager "_bin/cert-manager-$VERSION.tgz" \
  --namespace cert-manager \
  --reuse-values \
  --set image.repository=image-registry.openshift-image-registry.svc:5000/cert-manager/cert-manager-controller \
  --set image.tag=venafi-adopt
```

Check the rollout:

```bash
oc rollout status deploy/cert-manager -n cert-manager

oc get deploy cert-manager -n cert-manager \
  -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

No CRD update is required for the annotation-only design.

If the design is changed to add an issuer API field, apply the new CRDs before upgrading:

```bash
oc apply -f _bin/yaml/cert-manager.crds.yaml
```

### 12.6 Test A: manual Secret seed and issuer reuse

This isolates the keymanager and issuer-reuse logic before testing the adoption controller.

1. Create the Secret from the existing TPP certificate and private key.

   You can use the TPP UI:

   ```text
   Certificate > Download
     Include Private Key: yes
     Include Root Chain: yes
     Format: Base64 (PKCS #8)
   ```

   If TPP returns a single PEM bundle, split it into:

   ```text
   tls.crt = leaf certificate + intermediate chain
   tls.key = private key (decrypted if necessary)
   ca.crt  = root/CA chain
   ```

   Decrypt the private key if the export is encrypted:

   ```bash
   openssl pkcs8 \
     -in tls.key.enc \
     -passin pass:"$KEY_PASSWORD" \
     -out tls.key
   ```

   Create the Secret:

   ```bash
   oc create secret tls app-tls \
     -n team-a \
     --cert=tls.crt \
     --key=tls.key

   oc annotate secret app-tls -n team-a \
     venafi.cert-manager.io/certificate-dn='\VED\Policy\TeamA\app.example.com'

   # Add ca.crt
   oc patch secret app-tls -n team-a --type merge \
     -p "{\"data\":{\"ca.crt\":\"$(base64 < ca.crt | tr -d '\n')\"}}"
   ```

   If you are running the commands on macOS, `base64 -d` may need to be `base64 -D` depending on the macOS version. The commands in this document assume GNU coreutils, which is normally available in the OpenShift/Linux shell.

2. Create the Certificate with `rotationPolicy: Never` and the detected key algorithm/size.

   ```yaml
   apiVersion: cert-manager.io/v1
   kind: Certificate
   metadata:
     name: app
     namespace: team-a
   spec:
     secretName: app-tls
     issuerRef:
       name: venafi-tpp
       kind: ClusterIssuer
     commonName: app.example.com
     dnsNames:
       - app.example.com
     privateKey:
       rotationPolicy: Never
       algorithm: RSA
       size: 2048
   ```

3. Verify.

   ```bash
   oc wait --for=condition=Ready certificate/app -n team-a --timeout=5m
   oc get certificate app -n team-a -o yaml
   oc get certificaterequest -n team-a
   oc describe certificate app -n team-a
   ```

   Expected:

   - `Certificate` becomes `Ready=True`.
   - `status.revision` is set.
   - `status.notAfter` matches the TPP certificate.
   - `status.renewalTime` is set.
   - `CertificateRequest` has `Ready=True`, reason `Issued`.
   - The Secret private key thumbprint is unchanged.
   - No new TPP certificate was created.

4. Verify the certificate and key match.

   ```bash
   oc get secret app-tls -n team-a \
     -o jsonpath='{.data.tls\.crt}' | base64 -d > /tmp/tls.crt
   oc get secret app-tls -n team-a \
     -o jsonpath='{.data.tls\.key}' | base64 -d > /tmp/tls.key

   openssl x509 -in /tmp/tls.crt -noout -pubkey | openssl sha256
   openssl pkey -in /tmp/tls.key -pubout | openssl sha256
   ```

   The two hashes must match.

5. Verify no duplicate TPP certificate.

   Capture the TPP baseline before creating the Certificate, then query again after it becomes Ready:

   ```bash
   tpp_search() {
     curl -sG "https://$TPP_HOST/vedsdk/certificates/" \
       -H "Authorization: Bearer $TPP_TOKEN" \
       --data-urlencode 'ParentDn=\VED\Policy\TeamA' \
       --data-urlencode 'CN=app.example.com' \
       | jq '.Certificates[] | {DN, Guid, Thumbprint: .X509.Thumbprint, ValidTo: .X509.ValidTo}'
   }

   tpp_search > /tmp/tpp-before.json
   # after the Certificate is Ready:
   tpp_search > /tmp/tpp-after.json

   diff -u /tmp/tpp-before.json /tmp/tpp-after.json
   ```

   For initial adoption, the TPP certificate DN/GUID/thumbprint should be the one you adopted and the diff should be empty. If you did not capture a baseline, compare the current record with the TPP certificate you recorded in section 12.3 and check the TPP certificate history for an unexpected issuance.

### 12.7 Test B: automatic adoption controller

1. Delete the test Certificate and Secret from Test A, or use a second host.

2. Create the Certificate with the opt-in annotation:

   ```yaml
   apiVersion: cert-manager.io/v1
   kind: Certificate
   metadata:
     name: app-auto
     namespace: team-a
     annotations:
       venafi.cert-manager.io/adopt-existing: "true"
   spec:
     secretName: app-auto-tls
     issuerRef:
       name: venafi-tpp
       kind: ClusterIssuer
     commonName: app2.example.com
     dnsNames:
       - app2.example.com
     privateKey:
       rotationPolicy: Never
       algorithm: RSA
       size: 2048
   ```

3. Watch the adoption condition and Secret:

   ```bash
   oc get certificate app-auto -n team-a -w
   oc get secret app-auto-tls -n team-a -w
   ```

   Expected condition sequence:

   ```text
   VenafiAdoption=False Reason=Pending
   VenafiAdoption=True  Reason=Adopted
   ```

   Then normal cert-manager conditions:

   ```text
   Ready=True
   ```

   Wait for readiness:

   ```bash
   oc wait --for=condition=Ready certificate/app-auto -n team-a --timeout=5m
   ```

4. Verify the Secret has the correct data:

   ```bash
   oc get secret app-auto-tls -n team-a -o yaml
   ```

5. Verify the CertificateRequest was issued from the existing certificate:

   ```bash
   oc get certificaterequest -n team-a -o yaml | \
     grep -E 'revision|Issued|Certificate'
   ```

6. Check controller logs:

   ```bash
   oc logs deploy/cert-manager -n cert-manager --since=15m | \
     grep -i -E 'venafi|adopt|certificate'
   ```

   The logs must not contain private-key PEM blocks or retrieval passwords.

### 12.8 Renewal test

After the initial adoption, force a renewal. If `cmctl` is available:

```bash
cmctl renew app -n team-a
```

Watch:

```bash
oc get certificate app -n team-a -w
oc get certificaterequest -n team-a -w
oc get secret app-tls -n team-a -w
```

Expected:

- `status.revision` increments.
- A new CertificateRequest is created.
- The issuer does not return the old certificate.
- The Secret certificate serial/thumbprint changes.
- TPP records a new issuance/renewal or a new certificate object, depending on TPP policy.
- The adoption controller does not re-adopt the old certificate.

If `cmctl` is not available, an alternative is to shorten the renewal window or use a dedicated short-lived test certificate, but do not change production certificates just to test.

### 12.9 Negative tests

Run at least these cases:

| Test | Setup | Expected |
|---|---|---|
| No private key | TPP certificate created with user-provided CSR and no uploaded key | `VenafiAdoption=False Reason=PrivateKeyUnavailable`; no Secret adopted; normal reissue or manual action |
| Key mismatch | Certificate spec says RSA 2048, TPP key is ECDSA P-256 | `VenafiAdoption=False Reason=KeyMismatch`; no Secret created |
| Identity mismatch | TPP cert has different SANs | `VenafiAdoption=False Reason=IdentityMismatch`; no Secret |
| CA mismatch | TPP cert issued by a different CA/CADN | `VenafiAdoption=False Reason=CAMismatch`; no Secret |
| Expired cert | TPP cert NotAfter in the past | `VenafiAdoption=False Reason=Expired`; normal issuance |
| Ambiguous match | Two valid certs for the same host in the zone | `VenafiAdoption=False Reason=Ambiguous`; no Secret; manual selection |
| TPP permission denied | Token without Private Key Read | `VenafiAdoption=False Reason=PermissionDenied`; no duplicate issuance |
| TPP unavailable | Network/5xx | `VenafiAdoption=False Reason=SearchFailed/RetrieveFailed`; retry with backoff |
| Existing Secret | Secret already contains the adopted cert/key | `VenafiAdoption=True Reason=AlreadyPresent`; no retrieval |
| Controller restart | Restart controller after adoption | No change; condition remains Adopted/AlreadyPresent |
| Renewal | Force renewal | New cert requested; old cert not re-adopted |

### 12.10 Security checks

```bash
# Ensure private keys are not in logs
oc logs deploy/cert-manager -n cert-manager --since=1h | \
  grep -E 'BEGIN (RSA |EC |ENCRYPTED |)PRIVATE KEY' || true

# Inspect Secret access
oc auth can-i get secrets -n team-a --as=system:serviceaccount:cert-manager:cert-manager
```

Additionally:

- Confirm Kubernetes Secret encryption at rest is enabled where required.
- Confirm the TPP identity is not a shared administrator account.
- Confirm the TPP identity can only read the intended policy folders.
- Confirm adoption cannot cross namespaces without an explicit mapping.

### 12.11 Evidence to collect

```bash
oc get certificate app -n team-a -o yaml > certificate.yaml
oc get certificaterequest -n team-a -o yaml > certificaterequests.yaml
oc get secret app-tls -n team-a -o yaml > secret.yaml
oc get events -n team-a --sort-by=.lastTimestamp > events.txt
oc logs deploy/cert-manager -n cert-manager --since=30m > controller.log
```

Also capture:

- TPP search result before/after
- TPP certificate DN/GUID/thumbprint
- `openssl` public-key hashes
- Certificate `status.revision`, `notAfter`, `renewalTime`
- CertificateRequest Ready condition

### 12.12 Cleanup

```bash
oc delete certificate app -n team-a
oc delete certificate app-auto -n team-a
oc delete secret app-tls -n team-a
oc delete secret app-auto-tls -n team-a
```

Do not delete TPP certificates unless the test zone owner approves.

## 13. Rollout and rollback

### 13.1 Rollout

1. Deploy the controller with adoption disabled by default (annotation opt-in).
2. Run a read-only inventory against TPP:
   - search
   - retrieve metadata
   - attempt private-key retrieval
   - produce a report of adoptable and non-adoptable certificates
3. Test manual Secret seeding and issuer reuse on one non-production host.
4. Enable automatic adoption for one namespace/team.
5. Monitor conditions, logs, and TPP issuance counts.
6. Expand to more namespaces.

### 13.2 Rollback

- Remove the opt-in annotation from Certificates.
- Roll back the controller image with Helm.
- Keep the adopted Secrets. Do not delete them.
- If the old controller does not have issuer reuse, it may issue a new certificate at the next renewal; that is normal cert-manager behavior, but it may create a new TPP object.
- No CRD rollback is needed for the annotation-only design.

## 14. Definition of done

- [ ] A valid TPP certificate and private key are retrieved successfully.
- [ ] The private key is decrypted and stored only in the Kubernetes Secret.
- [ ] `Certificate.spec.privateKey` matches the existing key.
- [ ] `rotationPolicy: Never` is set for adoption.
- [ ] The target Secret contains `tls.crt`, `tls.key`, and `ca.crt`.
- [ ] The Certificate becomes `Ready=True`.
- [ ] No duplicate TPP certificate is requested during initial adoption.
- [ ] The CertificateRequest is issued from the existing certificate.
- [ ] Renewal works and does not re-adopt the current certificate.
- [ ] Negative tests produce the expected conditions.
- [ ] No private key material appears in logs.
- [ ] Rollout and rollback procedures are documented and tested.
- [ ] The TPP identity uses least privilege.

## Appendix A: Example TPP search

```bash
curl -sG "https://$TPP_HOST/vedsdk/certificates/" \
  -H "Authorization: Bearer $TPP_TOKEN" \
  --data-urlencode 'ParentDn=\VED\Policy\TeamA' \
  --data-urlencode 'CN=app.example.com' \
  --data-urlencode 'ValidToGreater=2026-10-18T00:00:00Z' \
  --data-urlencode 'OptionalFields=KeyAlgorithm,KeySize,Subject,Issuer' \
  | jq '.Certificates[] | {
      DN,
      Guid,
      CN: .X509.CN,
      SANS: .X509.SANS,
      KeyAlgorithm: .X509.KeyAlgorithm,
      KeySize: .X509.KeySize,
      ValidFrom: .X509.ValidFrom,
      ValidTo: .X509.ValidTo,
      Thumbprint: .X509.Thumbprint
    }'
```

## Appendix B: Example TPP retrieval

```bash
curl -s -X POST "https://$TPP_HOST/vedsdk/certificates/retrieve" \
  -H "Authorization: Bearer $TPP_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "CertificateDN": "\\VED\\Policy\\TeamA\\app.example.com",
    "Format": "Base64 (PKCS #8)",
    "IncludePrivateKey": true,
    "IncludeChain": true,
    "RootFirstOrder": false,
    "Password": "'"$EPHEMERAL_PASSWORD"'"
  }' \
  | jq -r '.CertificateData' \
  | base64 -d > bundle.pem
```

The bundle contains the certificate, chain, and encrypted private key. Use the adoption tool or a small Go helper to split and decrypt it; do not parse it with ad-hoc shell scripts in production.

## Appendix C: Troubleshooting

| Symptom | Likely cause |
|---|---|
| `Failed to look up private key vault ID` | TPP has no private key for the certificate; user-provided CSR or discovery |
| `Permissions error ... private key` | Missing `Private Key Read` permission |
| `VenafiAdoption` stuck in `Pending` | Adoption controller not running, annotation missing, or keymanager gate waiting |
| Certificate stuck with key warning | `privateKey.algorithm`/`size` does not match the existing key |
| Issuer returns "public key does not match CSR" | Secret contains a different key than the adopted certificate, or rotation policy changed to `Always` too early |
| Duplicate TPP certificate created | Issuer reuse check is missing or the candidate did not match the CSR public key |
| Secret overwritten with a new certificate | Normal renewal occurred; verify `status.revision` and whether adoption was incorrectly re-enabled |
| ECDSA/Ed25519 retrieval fails | vcert format selection or PKCS#8 decryption; use explicit TPP REST retrieval |

## References

- [Venafi TPP: POST Certificates/Retrieve](https://docs.venafi.com/Docs/current/TopNav/Content/SDK/WebSDK/r-SDK-POST-Certificates-retrieve.php)
- [Venafi TPP: GET Certificates](https://docs.venafi.com/Docs/current/TopNav/Content/SDK/WebSDK/r-SDK-GET-Certificates.php)
- [Venafi TPP: Downloading certificates, private keys, and root chains](https://docs.venafi.com/Docs/current/TopNav/Content/Certificates/t-certs-privatekeys-rootchains-downloading.php)
- [Venafi TPP: Certificate object settings](https://docs.venafi.com/Docs/25.1/TopNav/Content/Certificates/r-cert-object-settings-webadmin.php)
- [Venafi TPP: Permissions and abilities](https://docs.venafi.com/Docs/24.3/TopNav/Content/Permissions/r_permissions-and-abilities.php)
- [vcert TPP connector](https://github.com/Venafi/vcert/blob/master/pkg/venafi/tpp/connector.go)
