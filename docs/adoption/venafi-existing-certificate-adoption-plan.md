# Venafi TPP Existing Certificate Adoption - Implementation Plan

Status: Draft
Target: cert-manager 1.19.6 tree
Scope: Venafi TPP only (not Venafi Cloud)
Prerequisite: `spec.privateKey.rotationPolicy: Never`
CADN: intentionally ignored

## 1. Goal

Before cert-manager generates a local private key and CSR, ask Venafi TPP whether a suitable certificate already exists for the host. If it does, adopt its private key and let cert-manager reuse it, then return the existing certificate instead of creating a new one in TPP.

If TPP has no certificate, no private key, or returns a problem, cert-manager follows its normal issuance path.

The feature is opt-in and does not change behavior for Certificates that do not use the annotation.

## 2. Design summary

Two cooperating parts:

1. **Adoption controller** - runs before keymanager. Searches TPP, retrieves the certificate and private key, validates them, and writes only `tls.key` to the target Secret.
2. **Issuer reuse check** - runs in the Venafi issuer `Sign()`. Searches TPP for a certificate whose public key matches the CSR. If found, returns it without calling `RequestCertificate`.

Why only `tls.key`:

- The Venafi issuer can return only certificate + CA, never a private key.
- The issuing controller requires `certificate.PublicKey == CSR.PublicKey`.
- Therefore the CSR must be built from the adopted key.
- Writing only the key keeps the Secret incomplete, so the trigger controller starts the normal issuance flow, which sets `status.revision`, `notAfter`, and `renewalTime`.

## 3. End-to-end flow

```text
Certificate (opted in, rotationPolicy: Never)
  |
  v
Adoption controller
  +--> validate opt-in, issuer, rotationPolicy
  +--> search TPP by zone + host
  +--> retrieve cert + private key
  +--> validate cert/key/SANs/validity/usages
  +--> write ONLY tls.key to spec.secretName
  +--> set VenafiAdoption condition
  |
  v
Keymanager gate
  +--> Pending/Failed: wait
  +--> Adopted/AlreadyPresent/Skipped: continue
  |
  v
Keymanager with Never
  +--> reuse adopted key, or generate a new key if adoption was skipped
  |
  v
Requestmanager -> CSR
  |
  v
Venafi issuer Sign()
  +--> revision 1: search TPP for matching public key
  |      +--> match: return existing certificate
  |      +--> no match: RequestCertificate
  |      +--> TPP error: retry, do not request
  +--> revision > 1: skip reuse, RequestCertificate
  |
  v
Issuing controller -> final Secret + status
```

## 4. Phases

### Phase 0 - Baseline

Goal: confirm the tree builds and tests pass before changes.

Actions:

```bash
git status
go test ./pkg/issuer/venafi/... ./pkg/controller/certificaterequests/venafi/...
```

Files: none.

Tests: none.

---

### Phase 1 - API annotation and condition constants

Goal: define the opt-in annotations and the adoption condition without changing the CRD.

Files:

- `pkg/apis/certmanager/v1/types.go`
- `pkg/apis/certmanager/v1/types_certificate.go`

Changes:

In `types.go`, under `Issuer specific Annotations`, add:

```go
VenafiAdoptExistingAnnotationKey         = "venafi.cert-manager.io/adopt-existing"
VenafiCertificateDNAnnotationKey         = "venafi.cert-manager.io/certificate-dn"
VenafiCertificateGUIDAnnotationKey       = "venafi.cert-manager.io/certificate-guid"
VenafiCertificateThumbprintAnnotationKey = "venafi.cert-manager.io/certificate-thumbprint"
```

In `types_certificate.go`, near the condition types, add:

```go
CertificateConditionVenafiAdoption CertificateConditionType = "VenafiAdoption"
```

Imports: none.

CRD/deepcopy/conversion: none. These are string constants only.

Tests: no test file required for constants.

---

### Phase 2 - Venafi client search, retrieval, and reuse helpers

Goal: expose the TPP operations needed by adoption and issuer reuse.

New files:

- `pkg/issuer/venafi/client/api/adoption.go`
- `pkg/issuer/venafi/client/adoption.go`

Files to modify:

- `pkg/issuer/venafi/client/venaficlient.go`
- `pkg/issuer/venafi/client/instrumentedvenaficlient.go`
- `pkg/issuer/venafi/client/fake/venafi.go`
- `pkg/issuer/venafi/client/fake/connector.go`

Changes:

In `client/api/adoption.go`, add:

```go
type ExistingCertificate struct {
    DN, GUID, CN string
    DNSNames, IPAddresses, URIs, Emails []string
    NotBefore, NotAfter time.Time
    Thumbprint, CADN string
    KeyAlgorithm string
    KeySize int
}

type RetrievedCertificate struct {
    CertificatePEM []byte
    ChainPEM       []byte
    CAPEM          []byte
    PrivateKeyPEM  []byte
}
```

In `venaficlient.go`, extend `Interface`:

```go
SearchExistingCertificates(zone, cn string, sans []string, minRemaining time.Duration) ([]api.ExistingCertificate, error)
RetrieveExistingCertificate(dn, password string) (*api.RetrievedCertificate, error)
FindReusableCertificate(zone string, csrPEM []byte, minRemaining time.Duration) (*api.RetrievedCertificate, error)
```

Extend the internal `connector` interface:

```go
SearchCertificates(req *certificate.SearchRequest) (*certificate.CertSearchResponse, error)
RetrieveCertificateMetaData(dn string) (*certificate.CertificateMetaData, error)
```

In `adoption.go`, implement:

- `SearchExistingCertificates`
  - normalize the issuer zone to a TPP policy DN,
  - search with `ParentDn`, `CN`, `SAN-DNS`, `ValidToGreater`,
  - retrieve metadata for each candidate,
  - return candidates.
- `RetrieveExistingCertificate`
  - build a vcert `certificate.Request` with `PickupID=dn`, `FetchPrivateKey=true`, `KeyPassword`, `ChainOption=RootLast`, `Timeout=60s`,
  - call `RetrieveCertificate`,
  - decrypt `ENCRYPTED PRIVATE KEY` using `vcertutil.DecryptPkcs8PrivateKey`,
  - parse leaf, chain, and CA.
- `FindReusableCertificate`
  - parse the CSR,
  - search by CN/SAN,
  - retrieve candidate certificates without private keys,
  - compare public key and SANs,
  - return the matching certificate.
- `generateEphemeralPassword`
  - at least 12 characters, at least three of lowercase/uppercase/digits/special.

Implementation notes:

- `SearchCertificates` returns only DN and GUID (`certificate.CertSeachInfo`). It does not return SANs, validity, or key metadata. The helper must call `RetrieveCertificateMetaData` and/or retrieve the certificate to obtain those values before filtering.
- Normalize zones consistently with vcert: a zone that does not start with `\VED\` must be prefixed with `\VED\Policy\`.
- Leave `certificate.Request.KeyType` at its zero value (`KeyTypeRSA`) when retrieving so vcert selects the `Base64 (PKCS #8)` format for all key types.
- Detect encryption by the PEM block type. Decrypt only `ENCRYPTED PRIVATE KEY`; use already-unencrypted keys as-is.
- Return a distinct "no match" result from a TPP error so the issuer can decide whether to proceed.

In `fake/venafi.go`, add function fields and methods for the three new `Interface` methods:

```go
SearchExistingCertificatesFn func(zone, cn string, sans []string, minRemaining time.Duration) ([]api.ExistingCertificate, error)
RetrieveExistingCertificateFn func(dn, password string) (*api.RetrievedCertificate, error)
FindReusableCertificateFn func(zone string, csrPEM []byte, minRemaining time.Duration) (*api.RetrievedCertificate, error)
```

In `fake/connector.go`, add `SearchCertificatesFunc` and `RetrieveCertificateMetaDataFunc` with methods.

In `instrumentedvenaficlient.go`, add pass-through wrappers for the two new connector methods.

Imports:

- `crypto/rand`, `crypto/x509`, `encoding/pem`, `fmt`, `math/big`, `net/url`, `strings`, `time`
- vcert: `github.com/Venafi/vcert/v5/pkg/certificate`, `github.com/Venafi/vcert/v5/pkg/util`
- cert-manager: `pkg/issuer/venafi/client/api`, `pkg/util/pki`

Tests:

- New: `pkg/issuer/venafi/client/adoption_test.go`
- Check/update: `pkg/issuer/venafi/client/request_test.go`, `venaficlient_test.go` (fake interface changes may require compile fixes)
- Existing fakes are updated, not the tests themselves.

---

### Phase 3 - Adoption validation helpers

Goal: validate a TPP certificate/key pair before writing anything to Kubernetes.

New files:

- `pkg/controller/certificates/venafi-adoption/validate.go`
- `pkg/controller/certificates/venafi-adoption/validate_test.go`

Changes:

Implement:

```go
func validateAdoption(crt *cmapi.Certificate, cert *x509.Certificate, chain []*x509.Certificate, pk crypto.Signer) error
```

Checks:

- certificate public key equals private key public key,
- `pki.PrivateKeyMatchesSpec(pk, crt.Spec)`,
- CN and all SANs match the Certificate spec,
- `NotBefore <= now`,
- `NotAfter > now + renewBefore + safetyMargin`,
- key usages and extended key usages match,
- `cert.IsCA == crt.Spec.IsCA`,
- chain validates.

Return a typed error carrying a condition reason.

Imports:

- `crypto`, `crypto/x509`, `fmt`, `time`
- `cmapi`, `pkg/util/pki`

Tests:

- New: `validate_test.go` with table-driven cases:
  - valid,
  - cert/key mismatch,
  - key spec mismatch,
  - CN/SAN mismatch,
  - expired,
  - not yet valid,
  - usage mismatch,
  - `IsCA` mismatch,
  - invalid chain.

---

### Phase 4 - Adoption controller and key-only Secret seeding

Goal: search TPP before keymanager and seed only `tls.key`.

New files:

- `pkg/controller/certificates/venafi-adoption/controller.go`
- `pkg/controller/certificates/venafi-adoption/secret.go`
- `pkg/controller/certificates/venafi-adoption/controller_test.go`
- `pkg/controller/certificates/venafi-adoption/secret_test.go`

Controller responsibilities:

1. Get the Certificate; skip deletion.
2. If `venafi.cert-manager.io/adopt-existing` is not `"true"`, return.
3. If `VenafiAdoption` is `Adopted` or `AlreadyPresent`, return, unless the target `tls.key` is missing (then re-adopt).
4. If `status.revision` is set, set `Skipped/Renewal` and return.
5. Resolve the issuer with `issuer.NewHelper(...).GetGenericIssuer(...)`.
6. If the issuer is not Venafi TPP, set `Skipped/NotApplicable` and return.
7. If `rotationPolicy != Never`, set `Failed/RequiresRotationPolicyNever` and return.
8. If the target Secret contains a valid cert/key matching the TPP candidate, set `AlreadyPresent` and return. If it contains a different valid key/cert, set `Failed/Conflict` and return.
9. Set `Pending`.
10. Build the Venafi client with the existing `VenafiClientBuilder`.
11. Search TPP.
12. No candidate -> `Skipped/NotFound`.
13. Multiple candidates -> choose newest by `NotAfter`; if ambiguous -> `Failed/Ambiguous`.
14. Retrieve certificate + private key.
15. Validate.
16. Write only `tls.key` to the target Secret.
17. Set `Adopted` and record DN/GUID/thumbprint annotations.

Error policy (fail-safe):

- TPP search/retrieve/permission/decrypt errors -> set `Failed/...` and return the error so the controller retries. Do not issue.
- No cert, no key, expired, not issuable -> set `Skipped/...` and return nil so normal issuance proceeds.
- Key/identity/chain mismatch -> set `Failed/...` and wait.

Secret builder (`secret.go`):

- Type `kubernetes.io/tls`.
- Data: only `tls.key`.
- Labels: `controller.cert-manager.io/fao=true`.
- Annotations: `cert-manager.io/certificate-name`, source DN/GUID/thumbprint, and `spec.secretTemplate` annotations.
- Owner reference to the Certificate.
- Create if absent, patch/update only `tls.key` if present.
- Do not write `tls.crt` or `ca.crt` at this stage.

Imports for `controller.go`:

- `context`, `fmt`, `time`
- `corev1`, `apierrors`, `metav1`, `types`, `labels`, `record`, `clock`, `cache`, `workqueue`
- `internalinformers`, `apiutil`, `cmapi`, `cmmeta`, `clientset`, `cmlisters`, `controllerpkg`, `pkg/issuer`, `venaficlient`, `metrics`, `logf`, `pki`

Controller registration uses the standard wrapper pattern:

```text
controllerWrapper.Register -> NewController -> builder.For(...).Complete()
```

Tests:

- `controller_test.go`: no annotation, non-TPP issuer, `rotationPolicy != Never`, no candidate, no private key, expired, multiple candidates, key mismatch, identity mismatch, TPP search error, permission error, retrieve error, successful adoption, renewal, existing valid Secret, conflict.
- `secret_test.go`: key-only data, type, labels, annotations, ownerRef, `secretTemplate`, update preserves other keys.

---

### Phase 5 - Keymanager gate

Goal: prevent keymanager from generating a key while adoption is still deciding or failed.

File:

- `pkg/controller/certificates/keymanager/keymanager_controller.go`

Change:

After runtime defaults are applied, if the Certificate has `venafi.cert-manager.io/adopt-existing: "true"`:

- condition missing or reason `Pending`, `Failed`, `RequiresRotationPolicyNever`, `SearchFailed`, `PermissionDenied`, `RetrieveFailed`, `KeyMismatch`, `IdentityMismatch`, `Ambiguous` -> return without generating a key,
- reason `Adopted`, `AlreadyPresent`, `Skipped` -> continue.

Imports: already has `apiutil` and `cmmeta`; no new package expected.

Tests:

- Update `pkg/controller/certificates/keymanager/keymanager_controller_test.go`:
  - Pending -> no key generated,
  - Failed -> no key generated,
  - Adopted/AlreadyPresent/Skipped -> proceeds,
  - no annotation -> unchanged behavior.

---

### Phase 6 - Issuer reuse in CertificateRequest

Goal: return the existing TPP certificate instead of calling `RequestCertificate` when the CSR public key matches.

File:

- `pkg/controller/certificaterequests/venafi/venafi.go`

Change:

In `Sign()`, before `client.RequestCertificate(...)`:

1. Only when the issuer is TPP.
2. Only when the revision annotation is `1`.
3. Call `FindReusableCertificate(zone, cr.Spec.Request, minRemaining)`.
4. If a match is found, parse it and return `IssueResponse{Certificate: chain, CA: ca}`.
5. If no match, continue to `RequestCertificate`.
6. If TPP returns an error, report `Failed/ReuseError` and return the error; do not call `RequestCertificate`.
7. For revision greater than 1, skip reuse and call `RequestCertificate`.

`minRemaining`: use one third of the requested duration, or a conservative constant (for example 5 minutes) if duration is not set.

Imports: `strconv` for the revision annotation; existing `utilpki`, `cmapi`, `logf`.

Tests:

- Update `pkg/controller/certificaterequests/venafi/venafi_test.go`:
  - matching public key returns the existing certificate,
  - mismatched public key calls `RequestCertificate`,
  - SAN mismatch does not reuse,
  - revision > 1 does not reuse,
  - TPP search error retries and does not request.
- Check `fuzz_test.go` compiles with the new fake fields.

---

### Phase 7 - Optional CSR API reuse

Goal: reuse an existing TPP certificate for the Kubernetes `CertificateSigningRequest` path when the CSR public key matches. No private-key adoption is possible there.

File:

- `pkg/controller/certificatesigningrequests/venafi/venafi.go`

Change: same reuse check before `RequestCertificate`. No revision guard exists for this path.

Tests:

- Update `pkg/controller/certificatesigningrequests/venafi/venafi_test.go`.

Mark this phase optional if the scope is limited to `Certificate` resources.

---

### Phase 8 - Controller registration

Goal: enable the adoption controller in the default controller set.

File:

- `internal/apis/config/controller/v1alpha1/defaults.go`

Changes:

- Import `venafiadoptioncontroller "github.com/cert-manager/cert-manager/pkg/controller/certificates/venafi-adoption"`.
- Add `venafiadoptioncontroller.ControllerName` to `AllControllers`.
- Add `venafiadoptioncontroller.ControllerName` to `DefaultEnabledControllers`.

No CRD, webhook, or RBAC change is expected. Verify the generated controller ClusterRole already allows reading Certificates/Secrets/Issuers and creating/updating Secrets.

Tests:

- Update `internal/apis/config/controller/v1alpha1/defaults_test.go` if it asserts the controller lists.

---

### Phase 9 - Unit test sweep

Goal: verify all changed packages.

Commands:

```bash
go test ./pkg/issuer/venafi/...
go test ./pkg/controller/certificaterequests/venafi/...
go test ./pkg/controller/certificatesigningrequests/venafi/...
go test ./pkg/controller/certificates/keymanager/...
go test ./pkg/controller/certificates/venafi-adoption/...
go test ./internal/apis/config/controller/v1alpha1/...
make verify
```

If the repository uses a different lint command, run the one defined in the Makefile.

---

### Phase 10 - Documentation

Goal: update the existing design doc and add this plan.

Files:

- `docs/adoption/venafi-existing-certificate-adoption-plan.md` (this file)
- `docs/venafi-existing-certificate-adoption.md`

Update the existing doc to match the final decisions:

- TPP only,
- opt-in annotation,
- `rotationPolicy: Never`,
- CADN ignored,
- adoption writes only `tls.key`,
- fail-safe error policy,
- issuer reuse.

---

### Phase 11 - Build the controller image

Goal: produce a deployable controller image.

```bash
export VERSION=v1.19.6-venafi-adopt.1

make VERSION="$VERSION" \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz

docker load -i _bin/containers/cert-manager-controller-linux-amd64.tar.gz

docker tag cert-manager-controller-amd64:"$VERSION" \
  <REGISTRY>/<REPO>:"$VERSION"

docker push <REGISTRY>/<REPO>:"$VERSION"
```

If the cluster is OpenShift and uses the internal registry:

```bash
REGISTRY_HOST=$(oc get route default-route \
  -n openshift-image-registry \
  -o jsonpath='{.spec.host}')

docker login "$REGISTRY_HOST" \
  -u "$(oc whoami)" \
  -p "$(oc whoami -t)"

docker tag cert-manager-controller-amd64:"$VERSION" \
  "$REGISTRY_HOST/cert-manager/cert-manager-controller:$VERSION"

docker push \
  "$REGISTRY_HOST/cert-manager/cert-manager-controller:$VERSION"
```

No CRD image is required.

---

### Phase 12 - Deploy with Helm

Goal: roll out the controller.

```bash
helm upgrade --install <RELEASE> <CHART> \
  --namespace <NAMESPACE> \
  --reuse-values \
  --set image.repository=<REGISTRY>/<REPO> \
  --set image.tag=<TAG>
```

Verify:

```bash
kubectl rollout status deployment/cert-manager -n <NAMESPACE>
kubectl get deployment cert-manager -n <NAMESPACE> \
  -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

On OpenShift, use `oc` instead of `kubectl`.

No CRD update is required. If a future revision adds a CRD field, apply `_bin/yaml/cert-manager.crds.yaml` first.

---

### Phase 13 - Cluster test scenarios

Preconditions:

- TPP reachable from the cluster.
- A TPP certificate for the test host created in the TPP UI with a TPP-generated private key.
- TPP identity with `Read` and `Private Key Read`.
- A test namespace and a Venafi TPP `Issuer` or `ClusterIssuer`.

#### Test A - Successful adoption

1. Create the Certificate:

```yaml
metadata:
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

2. Verify:

```bash
kubectl get certificate app -n team-a -o yaml
kubectl get secret app-tls -n team-a -o yaml
```

Expected:

- `VenafiAdoption=True Reason=Adopted`
- Secret contains `tls.crt`, `tls.key`, `ca.crt`
- `openssl` public-key hashes match
- `status.revision`, `notAfter`, `renewalTime` are set
- no new TPP certificate is created

3. Verify no duplicate in TPP with the TPP search API before/after.

#### Test B - No TPP certificate

Expected:

- `VenafiAdoption=False Reason=Skipped`
- normal issuance creates a new certificate
- Certificate becomes `Ready=True`

#### Test C - TPP certificate without private key

Expected:

- `VenafiAdoption=False Reason=PrivateKeyUnavailable`
- normal issuance creates a new certificate

#### Test D - Expired TPP certificate

Expected:

- `VenafiAdoption=False Reason=Expired`
- normal issuance creates a new certificate

#### Test E - Key spec mismatch

Example: TPP key is ECDSA P-256, Certificate spec is RSA 2048.

Expected:

- `VenafiAdoption=False Reason=KeyMismatch`
- no key written
- no issuance until the user fixes the spec or removes the annotation

#### Test F - Identity mismatch

Expected:

- `VenafiAdoption=False Reason=IdentityMismatch`
- no key written
- no issuance

#### Test G - TPP temporarily unavailable

Expected:

- `VenafiAdoption=False Reason=SearchFailed`
- controller retries
- no certificate is requested while TPP is unavailable
- after TPP recovers, adoption completes

#### Test H - Multiple candidates

Expected:

- newest valid candidate is adopted,
- if ambiguous, `Reason=Ambiguous` and no issuance.

#### Test I - Existing Secret

Expected:

- `VenafiAdoption=True Reason=AlreadyPresent`
- no retrieval
- existing key reused

#### Test J - Renewal

```bash
cmctl renew app -n team-a
```

Expected:

- `status.revision` increments,
- a new CertificateRequest is created,
- the issuer does not reuse the old certificate,
- TPP issues a new certificate with the same key,
- adoption is not repeated.

#### Test K - Two clusters, same host

Deploy the same Certificate to two clusters pointing at the same TPP zone.

Expected:

- both clusters adopt the same TPP certificate and key,
- neither calls `RequestCertificate`,
- no duplicate TPP certificate.

#### Test L - Security

```bash
kubectl logs deployment/cert-manager -n cert-manager --since=1h | \
  grep -E 'BEGIN (RSA |EC |ENCRYPTED |)PRIVATE KEY' || true
```

Expected: no output.

## 5. File change map

| File | Change | Test file |
|---|---|---|
| `pkg/apis/certmanager/v1/types.go` | annotation constants | none |
| `pkg/apis/certmanager/v1/types_certificate.go` | condition constant | none |
| `pkg/issuer/venafi/client/api/adoption.go` | new types | indirect |
| `pkg/issuer/venafi/client/venaficlient.go` | extend `Interface` and `connector` | compile |
| `pkg/issuer/venafi/client/adoption.go` | search/retrieve/reuse helpers | `adoption_test.go` |
| `pkg/issuer/venafi/client/fake/venafi.go` | fake methods | used by tests |
| `pkg/issuer/venafi/client/fake/connector.go` | fake connector methods | used by tests |
| `pkg/issuer/venafi/client/instrumentedvenaficlient.go` | instrument wrappers | compile |
| `pkg/controller/certificates/venafi-adoption/validate.go` | validation | `validate_test.go` |
| `pkg/controller/certificates/venafi-adoption/secret.go` | key-only Secret builder | `secret_test.go` |
| `pkg/controller/certificates/venafi-adoption/controller.go` | adoption controller | `controller_test.go` |
| `pkg/controller/certificates/keymanager/keymanager_controller.go` | gate | `keymanager_controller_test.go` |
| `pkg/controller/certificaterequests/venafi/venafi.go` | reuse check | `venafi_test.go` |
| `pkg/controller/certificatesigningrequests/venafi/venafi.go` | optional reuse | `venafi_test.go` |
| `internal/apis/config/controller/v1alpha1/defaults.go` | register controller | `defaults_test.go` if needed |
| `docs/venafi-existing-certificate-adoption.md` | update design | n/a |
| `docs/adoption/venafi-existing-certificate-adoption-plan.md` | this plan | n/a |

## 6. Unit test scenarios

Client:

- search returns candidates,
- search returns none,
- TPP 5xx,
- permission denied,
- metadata failure,
- multiple DNs,
- retrieve RSA/ECDSA/Ed25519,
- encrypted and unencrypted keys,
- wrong password,
- no private key,
- chain order,
- reuse matching public key + SANs,
- reuse mismatched public key,
- reuse mismatched SANs,
- ephemeral password complexity.

Validation:

- valid cert/key,
- key/cert mismatch,
- key spec mismatch,
- CN mismatch,
- DNS/IP/URI/email SAN mismatch,
- expired,
- not yet valid,
- usage mismatch,
- `IsCA` mismatch,
- invalid chain.

Secret:

- key-only Secret,
- type `kubernetes.io/tls`,
- owner reference,
- labels,
- source annotations,
- `secretTemplate`,
- update preserves existing keys.

Controller:

- no annotation,
- non-TPP issuer,
- `rotationPolicy != Never`,
- no candidate,
- no private key,
- expired,
- multiple candidates,
- ambiguous,
- key mismatch,
- identity mismatch,
- TPP search error,
- permission denied,
- retrieve error,
- successful adoption,
- renewal,
- existing valid Secret,
- conflict,
- idempotent reconcile.

Keymanager:

- `Pending` waits,
- `Failed` waits,
- `RequiresRotationPolicyNever` waits,
- `Adopted` proceeds,
- `AlreadyPresent` proceeds,
- `Skipped` proceeds,
- no annotation unchanged.

Issuer reuse:

- matching public key returns certificate,
- mismatched public key requests new,
- SAN mismatch does not reuse,
- revision > 1 does not reuse,
- TPP error retries and does not request.

## 7. Situations table

| # | Situation | Detection | Condition | Secret written? | Next step |
|---|---|---|---|---|---|
| 1 | `rotationPolicy != Never` | spec check | `RequiresRotationPolicyNever` | No | Wait |
| 2 | Issuer not Venafi TPP | issuer check | `Skipped/NotApplicable` | No | Normal issuance |
| 3 | Annotation absent | annotation check | none | No | Existing behavior |
| 4 | Target Secret valid and matches TPP | compare | `AlreadyPresent` | No | Keymanager proceeds |
| 5 | Target Secret conflict | compare | `Conflict` | No | Wait |
| 6 | No TPP certificate | search | `Skipped/NotFound` | No | Normal issuance |
| 7 | Expired TPP certificate | parse | `Expired`/`Skipped` | No | Normal issuance |
| 8 | Not-yet-valid TPP certificate | parse | `Skipped/NotYetValid` | No | Retry/issue |
| 9 | TPP certificate without private key | retrieve error | `PrivateKeyUnavailable` | No | Normal issuance |
| 10 | Key spec mismatch | validate | `KeyMismatch` | No | Wait |
| 11 | CN/SAN mismatch | validate | `IdentityMismatch` | No | Wait |
| 12 | Invalid chain | validate | `CAMismatch` | No | Wait |
| 13 | Usage/`IsCA` mismatch | validate | `UsageMismatch` | No | Wait |
| 14 | TPP cert disabled/in error/pending | search/metadata | `Skipped/NotIssuable` | No | Normal issuance |
| 15 | Multiple candidates | search | newest or `Ambiguous` | No | Adopt newest/wait |
| 16 | TPP timeout/5xx | error | `SearchFailed` | No | Retry; no issuance |
| 17 | Permission denied | error | `PermissionDenied` | No | Retry; no issuance |
| 18 | Retrieve/decrypt failure | error | `RetrieveFailed` | No | Retry; no issuance |
| 19 | Successful adoption | validate | `Adopted` | `tls.key` only | Keymanager reuses; issuer returns cert |
| 20 | Renewal | `status.revision` set | `Skipped/Renewal` | No | Normal issuance |
| 21 | Keymanager gate | condition | Pending/Failed | No | Wait |
| 22 | Keymanager gate | condition | Adopted/AlreadyPresent/Skipped | - | Proceed |
| 23 | Issuer reuse match | search + pubkey | - | - | Return existing cert |
| 24 | Issuer reuse no match | search + pubkey | - | - | `RequestCertificate` |
| 25 | Issuer reuse TPP error | error | CR pending | - | Retry; no request |
| 26 | ECDSA/Ed25519 | parse | - | - | PKCS#8 retrieval + decrypt |
| 27 | Key spec changed after adoption | keymanager | - | - | Stall; user rotates/deletes |
| 28 | Secret key deleted after adoption | reconcile | re-adopt/`Skipped` | `tls.key` | Re-fetch or normal |
| 29 | Two clusters same host | both search | `Adopted` | `tls.key` | Same cert/key; intended |

## 8. Rollback

- Remove the opt-in annotation from Certificates.
- Keep adopted Secrets.
- Roll back the controller image with Helm.
- No CRD rollback is required.
- If the old controller cannot reuse TPP certificates, the next renewal may create a new TPP certificate; this is normal cert-manager behavior.

## 9. Definition of done

- [ ] All phases implemented.
- [ ] Unit tests pass.
- [ ] `make verify` passes.
- [ ] Controller image builds and pushes.
- [ ] Helm deployment succeeds.
- [ ] Successful adoption creates no duplicate TPP certificate.
- [ ] No-certificate, no-key, and expired cases fall back to normal issuance.
- [ ] TPP errors retry without issuing.
- [ ] Renewal works and does not re-adopt.
- [ ] Two clusters adopt the same TPP certificate.
- [ ] No private key material appears in logs.
- [ ] Documentation updated.
