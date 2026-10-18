# Adding CADN as a Venafi Annotation

Status: Draft  
Applies to: cert-manager Venafi TPP issuer  
Scope: Allow a `Certificate` to select a Venafi TPP Certificate Authority Template (CADN) through an annotation, and send that value to TPP when cert-manager requests a certificate.  
Note: This is an implementation and test plan. The source changes described here are not part of the current tree.

## 1. Summary

Venafi TPP can select the Certificate Authority Template using the `CADN` field in `POST Certificates/Request`.

cert-manager will expose that value as an annotation on the `Certificate`:

```yaml
metadata:
  annotations:
    venafi.cert-manager.io/ca-dn: '\VED\Policy\CAs\CorpCA'
```

The flow is:

```text
Certificate annotation
    -> copied to CertificateRequest annotation
    -> Venafi issuer reads the annotation
    -> Venafi client sets certificate.Request.CADN
    -> vcert TPP connector sends "CADN" in Certificates/Request
    -> TPP uses the selected CA template
```

This is separate from the custom-fields annotation:

```yaml
metadata:
  annotations:
    venafi.cert-manager.io/ca-dn: '\VED\Policy\CAs\CorpCA'
    venafi.cert-manager.io/custom-fields: '[{"name":"Environment","value":"Production"}]'
```

CADN is a plain string. Custom fields are JSON. They are independent.

## 2. What TPP says about CADN

Venafi TPP `POST Certificates/Request` documents `CADN` as:

> **(Conditional) The Distinguished Name (DN) of the Certificate Authority Template. This value is not required if it is defined by policy.**

The request also has a separate `PolicyDN`, which is the policy folder/zone where the certificate object is created.

Example TPP request:

```json
{
  "PolicyDN": "\\VED\\Policy\\TeamA",
  "CADN": "\\VED\\Policy\\CAs\\CorpCA",
  "PKCS10": "-----BEGIN CERTIFICATE REQUEST-----..."
}
```

Important distinction:

| TPP field | Meaning | cert-manager source |
|---|---|---|
| `PolicyDN` | Policy folder/zone where the certificate object lives | `Issuer`/`ClusterIssuer` `spec.venafi.zone` |
| `CADN` | Certificate Authority Template that signs the certificate | `venafi.cert-manager.io/ca-dn` annotation |

TPP requirements for `Certificates/Request`:

- `Create` permission on the target `PolicyDN`.
- `Private Key Read` permission on the certificate object.
- token scope `Certificate:Manage`.

If `CADN` is omitted, TPP uses the CA template configured by policy. If no CA template is available, TPP can return an error such as:

```text
Need a certificate authority (CADN).
```

Reference:

- [Venafi TPP: POST Certificates/Request](https://docs.venafi.com/Docs/current/TopNav/Content/SDK/WebSDK/r-SDK-POST-Certificates-request.php)
- [Venafi TPP: Getting a certificate signing request enrolled](https://docs.venafi.com/Docs/current/TopNav/Content/SDK/WebSDK/ex-sdk-CreateSignedCertificate.php)

## 3. Annotation contract

### 3.1 Key and value

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: app
  namespace: team-a
  annotations:
    venafi.cert-manager.io/ca-dn: '\VED\Policy\CAs\CorpCA'
spec:
  secretName: app-tls
  issuerRef:
    name: venafi-tpp
    kind: ClusterIssuer
  commonName: app.example.com
  dnsNames:
    - app.example.com
```

Rules:

- Key: `venafi.cert-manager.io/ca-dn`
- Value: TPP CA template DN
- Empty or missing: do not set `CADN`; TPP policy decides
- Surrounding whitespace is trimmed
- The value is passed to TPP as-is; do not rewrite the DN
- TPP validates that the CA template exists and that the caller may use it

### 3.2 Why an annotation

- No CRD change.
- No `internal/apis` change.
- No webhook rebuild.
- Only the controller image changes.
- It matches the existing Venafi annotation style:
  - `venafi.cert-manager.io/custom-fields`
  - `venafi.cert-manager.io/pickup-id`
  - `venafi.cert-manager.io/ca-dn`

The trade-off is that Kubernetes does not validate the annotation value. TPP remains the source of truth.

## 4. End-to-end flow

```text
User creates Certificate with ca-dn annotation
        |
        v
requestmanager creates CertificateRequest
and copies annotations
        |
        v
Venafi issuer Sign()
        |
        v
read cr.Annotations["venafi.cert-manager.io/ca-dn"]
        |
        v
trim whitespace
        |
        v
client.RequestCertificate(csr, duration, customFields, cadn)
        |
        v
buildVReq sets vreq.CADN = cadn
        |
        v
vcert TPP connector prepareRequest:
    tppReq.CADN = req.CADN
        |
        v
POST /vedsdk/Certificates/Request
{
  "PolicyDN": "\\VED\\Policy\\TeamA",
  "CADN": "\\VED\\Policy\\CAs\\CorpCA",
  "PKCS10": "..."
}
        |
        v
TPP selects the CA template and issues the certificate
        |
        v
cert-manager retrieves the certificate normally
```

If the annotation is absent:

```text
cadn = ""
vreq.CADN = ""
vcert omits CADN because the JSON field is omitempty
TPP uses the policy default CA template
```

## 5. Implementation

### 5.1 Add the annotation constant

File:

```text
pkg/apis/certmanager/v1/types.go
```

Add:

```go
const (
    // VenafiCADNAnnotationKey selects the Venafi TPP Certificate Authority
    // Template (CADN) used when requesting a certificate.
    VenafiCADNAnnotationKey = "venafi.cert-manager.io/ca-dn"
)
```

Place it near the other Venafi annotations:

```go
VenafiCustomFieldsAnnotationKey = "venafi.cert-manager.io/custom-fields"
VenafiPickupIDAnnotationKey     = "venafi.cert-manager.io/pickup-id"
```

This is a constant only. No generated code and no CRD change.

### 5.2 Copy the annotation to the CertificateRequest

File:

```text
pkg/controller/certificates/requestmanager/requestmanager_controller.go
```

The requestmanager already calls:

```go
annotations := controllerpkg.BuildAnnotationsToCopy(
    crt.Annotations,
    c.copiedAnnotationPrefixes,
)
```

By default, the controller copies all annotations except the excluded prefixes. With the default `--copied-annotation-prefixes=*`, `venafi.cert-manager.io/ca-dn` is copied automatically from the `Certificate` to the `CertificateRequest`.

If the installation customizes `--copied-annotation-prefixes`, ensure the prefix is included. For reliability, explicitly copy CADN:

```go
annotations := controllerpkg.BuildAnnotationsToCopy(
    crt.Annotations,
    c.copiedAnnotationPrefixes,
)

if cadn, ok := crt.Annotations[cmapi.VenafiCADNAnnotationKey]; ok {
    annotations[cmapi.VenafiCADNAnnotationKey] = cadn
}
```

The Venafi issuer reads the value from the `CertificateRequest`, not from the `Certificate`.

### 5.3 Read CADN in the Venafi issuer

File:

```text
pkg/controller/certificaterequests/venafi/venafi.go
```

Inside `Sign()`:

```go
cadn := strings.TrimSpace(
    cr.GetAnnotations()[cmapi.VenafiCADNAnnotationKey],
)
```

Then pass it to the client:

```go
pickupID, err = client.RequestCertificate(
    cr.Spec.Request,
    duration,
    customFields,
    cadn,
)
```

Do not combine CADN with custom fields:

```go
// CADN is its own annotation.
cadn := cr.GetAnnotations()[cmapi.VenafiCADNAnnotationKey]

// Custom fields remain JSON.
var customFields []api.CustomField
if v, ok := cr.GetAnnotations()[cmapi.VenafiCustomFieldsAnnotationKey]; ok {
    json.Unmarshal([]byte(v), &customFields)
}
```

### 5.4 Update the Venafi client interface

File:

```text
pkg/issuer/venafi/client/venaficlient.go
```

Change:

```go
type Interface interface {
    RequestCertificate(
        csrPEM []byte,
        duration time.Duration,
        customFields []api.CustomField,
        cadn string,
    ) (string, error)

    RetrieveCertificate(
        pickupID string,
        csrPEM []byte,
        duration time.Duration,
        customFields []api.CustomField,
    ) ([]byte, error)

    // ...
}
```

`RetrieveCertificate` does not need CADN. CADN is used when creating a new certificate request, not when retrieving an already-created request.

If the shared `buildVReq` helper is used by both methods, keep a separate function or pass an empty CADN from retrieval:

```go
func (v *Venafi) RetrieveCertificate(...) ([]byte, error) {
    vreq, err := v.buildVReq(csrPEM, duration, customFields, "")
    // ...
}
```

### 5.5 Set `vreq.CADN`

File:

```text
pkg/issuer/venafi/client/request.go
```

Update:

```go
func (v *Venafi) RequestCertificate(
    csrPEM []byte,
    duration time.Duration,
    customFields []api.CustomField,
    cadn string,
) (string, error) {
    vreq, err := v.buildVReq(csrPEM, duration, customFields, cadn)
    // ...
}

func (v *Venafi) buildVReq(
    csrPEM []byte,
    duration time.Duration,
    customFields []api.CustomField,
    cadn string,
) (*certificate.Request, error) {
    // ...
    vreq := newVRequest(tmpl, duration)

    // Set the TPP Certificate Authority Template.
    vreq.CADN = cadn

    // Apply zone defaults and validate.
    zoneCfg.UpdateCertificateRequest(vreq)
    if err := zoneCfg.ValidateCertificateRequest(vreq); err != nil {
        return nil, err
    }

    // ...
}
```

`certificate.Request.CADN` is defined by vcert:

```go
type Request struct {
    CADN string
    // ...
}
```

### 5.6 vcert sends CADN to TPP

No cert-manager code changes are required inside vcert. The TPP connector maps the field in `prepareRequest`:

```go
tppReq.CADN = req.CADN
```

and the TPP request struct uses `omitempty`:

```go
CADN string `json:",omitempty"`
```

So:

```text
cadn == ""      -> CADN omitted from JSON -> TPP policy default
cadn != ""      -> "CADN" included in Certificates/Request
```

### 5.7 Update the fake client

File:

```text
pkg/issuer/venafi/client/fake/venafi.go
```

Update:

```go
RequestCertificateFn func(
    csrPEM []byte,
    duration time.Duration,
    customFields []api.CustomField,
    cadn string,
) (string, error)
```

and the method signature.

Update controller tests that construct the fake client.

### 5.8 Optional: CADN for Kubernetes CSR

If the Kubernetes `CertificateSigningRequest` integration must also support CADN, add a separate annotation constant:

```text
pkg/apis/experimental/v1alpha1/types.go
```

```go
const (
    CertificateSigningRequestVenafiCADNAnnotationKey =
        "venafi.experimental.cert-manager.io/ca-dn"
)
```

Read it in:

```text
pkg/controller/certificatesigningrequests/venafi/venafi.go
```

and pass it to `client.RequestCertificate(...)`.

This is separate from the `Certificate` annotation and should use its own experimental prefix.

### 5.9 Optional: use CADN when adopting existing certificates

If the certificate adoption feature is enabled, CADN should also filter which existing TPP certificate can be adopted.

Files:

```text
pkg/controller/certificates/venafi-adoption/controller.go
pkg/controller/certificates/venafi-adoption/validate.go
```

Flow:

```text
cadn := crt.Annotations[cmapi.VenafiCADNAnnotationKey]
search TPP candidates in zone
for each candidate:
    metadata := client.RetrieveCertificateMetaData(candidate.DN)
    if cadn != "" && metadata.CertificateAuthorityDN != cadn:
        skip candidate
```

If CADN is set, never adopt a certificate issued by a different CA template. If CADN is not set, require a unique candidate or use an explicit policy.

After a new certificate is issued, verify TPP metadata:

```text
certificate metadata CertificateAuthorityDN == requested CADN
```

If they do not match, report a failure rather than silently accepting the wrong CA.

### 5.10 API and build impact

| Change | Required |
|---|---|
| `pkg/apis/certmanager/v1/types.go` constant | Yes |
| `internal/apis` | No |
| CRD update | No |
| webhook rebuild | No |
| controller rebuild | Yes |
| Helm chart change | No; only the controller image tag/value |
| generated conversion/deepcopy | No |

### 5.11 Files changed

```text
pkg/apis/certmanager/v1/types.go
pkg/controller/certificates/requestmanager/requestmanager_controller.go   (optional explicit copy)
pkg/controller/certificaterequests/venafi/venafi.go
pkg/issuer/venafi/client/venaficlient.go
pkg/issuer/venafi/client/request.go
pkg/issuer/venafi/client/fake/venafi.go
pkg/controller/certificaterequests/venafi/venafi_test.go
pkg/issuer/venafi/client/request_test.go
```

If Kubernetes CSR support is included:

```text
pkg/apis/experimental/v1alpha1/types.go
pkg/controller/certificatesigningrequests/venafi/venafi.go
```

If adoption support is included:

```text
pkg/controller/certificates/venafi-adoption/controller.go
pkg/controller/certificates/venafi-adoption/validate.go
```

## 6. Validation, errors, and security

### 6.1 Empty CADN

If the annotation is absent or empty:

```text
cadn = ""
vreq.CADN = ""
```

TPP uses the CA template defined by policy. This preserves existing behavior.

### 6.2 Invalid CADN

TPP validates the DN and permissions. An invalid or unavailable CA template causes `Certificates/Request` to fail.

The Venafi issuer then reports a failed or pending CertificateRequest with a message such as:

```text
Failed to request venafi certificate
```

The exact TPP error should be preserved in the CertificateRequest condition message.

If desired, add a preflight check:

```text
GET /vedsdk/certificates/{guid}
POST Config/Read
```

or verify the CA template with the TPP configuration API before requesting. This avoids waiting for a failed enrollment, but TPP still remains the final authority.

### 6.3 CADN is security-sensitive

The annotation lets the creator of a `Certificate` choose which CA signs it. That may bypass an intended policy.

Recommendations:

- Restrict who may create `Certificate` resources in Venafi-enabled namespaces.
- Add a controller-side allowlist, for example:

  ```text
  venafi.cert-manager.io/allowed-ca-dns: '\VED\Policy\CAs\CorpCA,\VED\Policy\CAs\InternalCA'
  ```

  on the `Issuer`/`ClusterIssuer`, or a controller configuration flag.
- Or add webhook validation in `internal/apis/certmanager/validation/certificate.go`. This requires rebuilding the webhook.
- Do not rely on the annotation alone if TPP policy is supposed to enforce CA selection.

### 6.4 Annotation changes do not automatically trigger reissuance

cert-manager’s reissuance checks compare the Certificate spec and CertificateRequest, not arbitrary annotations.

Changing:

```yaml
venafi.cert-manager.io/ca-dn: '\VED\Policy\CAs\CA-A'
```

to:

```yaml
venafi.cert-manager.io/ca-dn: '\VED\Policy\CAs\CA-B'
```

will not necessarily trigger a new certificate immediately.

To apply the change:

```bash
cmctl renew app -n team-a
```

or change a field that cert-manager considers part of the desired state. The new CertificateRequest will carry the new annotation, and the next issuance will use the new CADN.

### 6.5 Venafi Cloud

CADN is a TPP concept. The vcert TPP connector sends it; Venafi Cloud does not use the same CA template model.

If the issuer is a Cloud issuer:

- reject the annotation with a clear condition, or
- ignore it with a warning.

Do not silently treat a Cloud issuance as if CADN was applied.

## 7. Testing

### 7.1 Unit tests

#### Annotation handling

- No annotation -> `cadn == ""`.
- Empty annotation -> `cadn == ""`.
- Whitespace-only annotation -> `cadn == ""`.
- Valid annotation -> exact value passed to the client.
- Annotation is read from `CertificateRequest`, not from the `Certificate`.

#### Client request construction

- `buildVReq(..., "\\VED\\Policy\\CAs\\CorpCA")` sets:

  ```go
  vreq.CADN == `\VED\Policy\CAs\CorpCA`
  ```

- `buildVReq(..., "")` leaves `vreq.CADN` empty.
- CADN does not affect custom fields.
- Retrieve path does not require CADN.

#### Controller

- Fake Venafi client receives the CADN value.
- A failed request reports the TPP error in the CertificateRequest condition.
- Renewal carries the annotation to the new CertificateRequest.

#### Adoption filter (if enabled)

- CADN matches `CertificateAuthorityDN` -> candidate accepted.
- CADN differs -> candidate skipped.
- No CADN and one candidate -> accepted.
- No CADN and multiple candidates -> ambiguous.

### 7.2 Integration tests

Use a fake Venafi client or a fake TPP connector that records the CADN passed to `RequestCertificate`.

Verify:

```text
Certificate annotation
    -> CertificateRequest annotation
    -> Venafi client cadn argument
    -> vreq.CADN
```

Also test the `--copied-annotation-prefixes` behavior:

- Default `*`: CADN copied.
- Custom prefixes without `venafi.cert-manager.io/`: explicit copy still works.

### 7.3 Cluster prerequisites

- OpenShift cluster with cert-manager installed through the upstream Helm chart, not the OpenShift cert-manager Operator.
- Venafi TPP reachable from the cluster.
- TPP policy folder for the issuer zone.
- At least two CA templates:

  ```text
  CA-A = \VED\Policy\CAs\CorpCA-A   (policy default)
  CA-B = \VED\Policy\CAs\CorpCA-B   (annotation target)
  ```

- TPP identity with permission to use both CA templates.
- Test namespace `team-a`.

Record the policy default CA before testing.

### 7.4 Build and push the controller image

Only the controller changes.

```bash
export VERSION=v1.21.0-venafi-cadn.1

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
  "$REGISTRY_HOST/cert-manager/cert-manager-controller:venafi-cadn"

docker push \
  "$REGISTRY_HOST/cert-manager/cert-manager-controller:venafi-cadn"
```

If the registry route does not exist:

```bash
oc create route reencrypt \
  --service=image-registry \
  -n openshift-image-registry
```

### 7.5 Deploy

```bash
helm upgrade --install cert-manager "_bin/cert-manager-$VERSION.tgz" \
  --namespace cert-manager \
  --reuse-values \
  --set image.repository=image-registry.openshift-image-registry.svc:5000/cert-manager/cert-manager-controller \
  --set image.tag=venafi-cadn
```

Check the rollout:

```bash
oc rollout status deploy/cert-manager -n cert-manager
```

No CRD update is required.

### 7.6 Test 1: explicit CADN is used

Create a Certificate with the CADN annotation:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: app-cadn-b
  namespace: team-a
  annotations:
    venafi.cert-manager.io/ca-dn: '\VED\Policy\CAs\CorpCA-B'
spec:
  secretName: app-cadn-b-tls
  issuerRef:
    name: venafi-tpp
    kind: ClusterIssuer
  commonName: app-cadn-b.example.com
  dnsNames:
    - app-cadn-b.example.com
```

Apply and wait:

```bash
oc apply -f app-cadn-b.yaml
oc wait --for=condition=Ready certificate/app-cadn-b -n team-a --timeout=10m
```

Verify:

```bash
oc describe certificate app-cadn-b -n team-a
oc get certificaterequest -n team-a -o yaml
```

Check TPP:

- Certificate object is in the issuer zone.
- CA Template / `CertificateAuthorityDN` is `\VED\Policy\CAs\CorpCA-B`.
- Not the policy default CA-A.

If your TPP API returns metadata in a JSON field, check it with:

```bash
curl -s "https://$TPP_HOST/vedsdk/certificates/$GUID" \
  -H "Authorization: Bearer $TPP_TOKEN" \
  | jq '.CertificateAuthorityDN'
```

The exact response field may vary by TPP version; the TPP UI Certificate > Settings > CA Template is authoritative.

### 7.7 Test 2: no annotation uses the policy default

Create the same Certificate without the annotation:

```yaml
metadata:
  name: app-default-ca
```

Expected:

- TPP uses the CA template configured on the policy folder.
- If the policy default is CA-A, the issued certificate uses CA-A.
- No `CADN` value is sent by cert-manager.

This verifies the annotation is optional and does not change existing behavior.

### 7.8 Test 3: invalid CADN fails clearly

Use a non-existent CA template:

```yaml
metadata:
  annotations:
    venafi.cert-manager.io/ca-dn: '\VED\Policy\CAs\DoesNotExist'
```

Expected:

- TPP rejects `Certificates/Request`.
- CertificateRequest becomes failed or pending with the TPP error.
- No certificate is issued.
- The error message includes the CADN value or the TPP error.

Check:

```bash
oc get certificaterequest -n team-a -o yaml
oc describe certificate app-invalid-cadn -n team-a
oc logs deploy/cert-manager -n cert-manager --since=10m | grep -i cadn
```

### 7.9 Test 4: renewal keeps the CADN

Force renewal:

```bash
cmctl renew app-cadn-b -n team-a
```

Expected:

- New CertificateRequest is created.
- The CADN annotation is present on the new CertificateRequest.
- New TPP certificate still uses CA-B.
- Certificate `status.revision` increments.

Verify the annotation on the new CertificateRequest:

```bash
oc get certificaterequest -n team-a \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.annotations.venafi\.cert-manager\.io/ca-dn}{"\n"}{end}'
```

### 7.10 Test 5: CADN with adoption

If the adoption feature is deployed:

1. Create a TPP certificate with CA-B.
2. Create a `Certificate` with:

   ```yaml
   annotations:
     venafi.cert-manager.io/adopt-existing: "true"
     venafi.cert-manager.io/ca-dn: '\VED\Policy\CAs\CorpCA-B'
   ```

3. Expected: the adoption controller finds the CA-B certificate and adopts it.

Then test with CA-A:

```yaml
venafi.cert-manager.io/ca-dn: '\VED\Policy\CAs\CorpCA-A'
```

Expected:

- The CA-B certificate is not adopted.
- The adoption controller skips it or reports `CAMismatch`.
- Normal issuance uses CA-A if policy permits.

This prevents cross-CA adoption.

### 7.11 Test 6: custom-fields and CADN are independent

Set both annotations:

```yaml
annotations:
  venafi.cert-manager.io/ca-dn: '\VED\Policy\CAs\CorpCA-B'
  venafi.cert-manager.io/custom-fields: '[{"name":"Environment","value":"Production"}]'
```

Expected:

- CA-B is used.
- Custom field `Environment=Production` is set.
- Neither annotation overwrites the other.

### 7.12 Test 7: annotation change does not trigger immediately

Change the annotation from CA-B to CA-A on an existing Certificate without changing the spec.

Expected:

- cert-manager may not reissue immediately.
- After `cmctl renew`, the new CertificateRequest carries CA-A and the new certificate uses CA-A.

This verifies the documented behavior and avoids surprising reissuance.

### 7.13 Evidence to collect

```bash
oc get certificate app-cadn-b -n team-a -o yaml > certificate.yaml
oc get certificaterequest -n team-a -o yaml > certificaterequests.yaml
oc get secret app-cadn-b-tls -n team-a -o yaml > secret.yaml
oc logs deploy/cert-manager -n cert-manager --since=30m > controller.log
```

Also capture:

- TPP certificate DN/GUID
- TPP CA Template / `CertificateAuthorityDN`
- CertificateRequest CADN annotation
- CertificateRequest Ready condition
- Certificate `status.revision` and `status.notAfter`

## 8. Rollout and rollback

### 8.1 Rollout

1. Deploy the controller with the annotation support.
2. Test with a non-production CA template and namespace.
3. Confirm the policy-default path still works without the annotation.
4. Confirm custom fields and CADN work together.
5. Optionally add an allowlist for permitted CADNs.
6. Expand to production namespaces.

### 8.2 Rollback

- Remove the annotation from Certificates to return to policy-default CA selection.
- Force renewal if the CADN change must take effect immediately.
- Roll back the controller image with Helm.
- No CRD rollback is required.
- Existing certificates remain valid; only future requests change.

## 9. Limitations

- CADN is TPP-specific; it does not apply to Venafi Cloud.
- The annotation is not CRD-validated.
- TPP is the final authority on whether the CA template exists and is permitted.
- Changing only the annotation does not necessarily trigger reissuance.
- If an allowlist is not implemented, any user who can create a `Certificate` may select any CA template the TPP identity can use.
- A CADN value must be the CA template DN, not the policy folder/zone DN.
- The policy folder/zone remains `Issuer.spec.venafi.zone`; CADN and zone are independent.

## 10. Definition of done

- [ ] `venafi.cert-manager.io/ca-dn` is defined in `pkg/apis`.
- [ ] The annotation is copied from `Certificate` to `CertificateRequest`.
- [ ] The Venafi issuer reads the annotation from the `CertificateRequest`.
- [ ] The Venafi client sets `certificate.Request.CADN`.
- [ ] vcert sends `CADN` in `Certificates/Request`.
- [ ] Missing/empty CADN preserves the policy-default behavior.
- [ ] Invalid CADN produces a clear failure.
- [ ] Renewal preserves the CADN annotation.
- [ ] Custom fields and CADN are independent.
- [ ] CADN filters adoption candidates when adoption is enabled.
- [ ] Only the controller image is rebuilt.
- [ ] Cluster tests confirm the TPP CA Template matches the requested CADN.
- [ ] An allowlist or equivalent policy control is in place if required.

## Appendix A: Example Certificate

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: app-cadn-b
  namespace: team-a
  annotations:
    venafi.cert-manager.io/ca-dn: '\VED\Policy\CAs\CorpCA-B'
spec:
  secretName: app-cadn-b-tls
  issuerRef:
    name: venafi-tpp
    kind: ClusterIssuer
  commonName: app-cadn-b.example.com
  dnsNames:
    - app-cadn-b.example.com
```

## Appendix B: Example TPP request body

cert-manager does not build this JSON directly; vcert does. The resulting TPP request is equivalent to:

```json
{
  "PolicyDN": "\\VED\\Policy\\TeamA",
  "CADN": "\\VED\\Policy\\CAs\\CorpCA-B",
  "PKCS10": "-----BEGIN CERTIFICATE REQUEST-----..."
}
```

## Appendix C: Troubleshooting

| Symptom | Likely cause |
|---|---|
| TPP uses the policy CA, not the annotation | Annotation was not copied to the CertificateRequest, or the issuer did not read it |
| `Need a certificate authority (CADN)` | TPP policy has no default CA, and no CADN was supplied |
| `Failed to request venafi certificate` | Invalid CADN, missing permission, or CA template unavailable |
| Annotation works on Certificate but not CertificateRequest | Custom `--copied-annotation-prefixes` excluded `venafi.cert-manager.io/`; add explicit copy |
| CADN change has no effect | Annotation changes do not necessarily trigger reissuance; run `cmctl renew` |
| Cloud issuer ignores CADN | CADN is TPP-only; reject or warn for Cloud issuers |
| Adoption picks the wrong CA | CADN metadata filter is missing; compare `CertificateAuthorityDN` before adopting |

## References

- [Venafi TPP: POST Certificates/Request](https://docs.venafi.com/Docs/current/TopNav/Content/SDK/WebSDK/r-SDK-POST-Certificates-request.php)
- [Venafi TPP: Getting a certificate signing request enrolled](https://docs.venafi.com/Docs/current/TopNav/Content/SDK/WebSDK/ex-sdk-CreateSignedCertificate.php)
- [Venafi TPP: Certificate object settings](https://docs.venafi.com/Docs/25.1/TopNav/Content/Certificates/r-cert-object-settings-webadmin.php)
- [vcert TPP connector](https://github.com/Venafi/vcert/blob/master/pkg/venafi/tpp/connector.go)
