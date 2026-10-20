# Venafi CADN Annotation Feature - Implementation Analysis

## Executive Summary

The workflow in `docs/venafi-cadn-annotation.md` is **correct and complete**. It follows established cert-manager patterns for Venafi annotations (`custom-fields`, `pickup-id`) and requires only controller changes (no CRD, no webhook, no internal APIs).

---

## 1. Files to Change

### Core Implementation (Required)

| File | Change Type | Description |
|------|-------------|-------------|
| `pkg/apis/certmanager/v1/types.go` | Add constant | `VenafiCADNAnnotationKey = "venafi.cert-manager.io/ca-dn"` |
| `pkg/controller/certificaterequests/venafi/venafi.go` | Modify `Sign()` | Read annotation, trim, pass to `client.RequestCertificate(csr, duration, customFields, cadn)` |
| `pkg/issuer/venafi/client/venaficlient.go` | Update interface | Add `cadn string` parameter to `RequestCertificate()` |
| `pkg/issuer/venafi/client/request.go` | Modify `buildVReq()` | Set `vreq.CADN = cadn` |
| `pkg/issuer/venafi/client/fake/venafi.go` | Update fake | Match new interface signature |

### Optional Enhancements

| File | Purpose |
|------|---------|
| `pkg/controller/certificates/requestmanager/requestmanager_controller.go` | Explicit copy if custom `--copied-annotation-prefixes` used |
| `pkg/controller/certificates/venafi-adoption/controller.go` | Filter adoption by CADN |
| `pkg/controller/certificates/venafi-adoption/validate.go` | Validate adoption CA match |

### Tests (Required)

| File | Purpose |
|------|---------|
| `pkg/controller/certificaterequests/venafi/venafi_test.go` | Controller tests with fake client |
| `pkg/issuer/venafi/client/request_test.go` | Client unit tests for CADN handling |

---

## 2. Implementation Workflow (Step by Step)

### Phase 1: Add Annotation Constant
```go
// pkg/apis/certmanager/v1/types.go
const (
    VenafiCustomFieldsAnnotationKey = "venafi.cert-manager.io/custom-fields"
    VenafiPickupIDAnnotationKey     = "venafi.cert-manager.io/pickup-id"
    VenafiCADNAnnotationKey         = "venafi.cert-manager.io/ca-dn"  // NEW
)
```

### Phase 2: Update Venafi Client Interface
```go
// pkg/issuer/venafi/client/venaficlient.go
type Interface interface {
    RequestCertificate(
        csrPEM []byte,
        duration time.Duration,
        customFields []api.CustomField,
        cadn string,  // NEW
    ) (string, error)
    
    RetrieveCertificate(...)  // unchanged
}
```

### Phase 3: Implement RequestCertificate with CADN
```go
// pkg/issuer/venafi/client/request.go
func (v *Venafi) RequestCertificate(csrPEM []byte, duration time.Duration, customFields []api.CustomField, cadn string) (string, error) {
    vreq, err := v.buildVReq(csrPEM, duration, customFields, cadn)
    // ...
}

func (v *Venafi) buildVReq(csrPEM []byte, duration time.Duration, customFields []api.CustomField, cadn string) (*certificate.Request, error) {
    // ...
    vreq.CADN = cadn  // NEW: Set CADN on vcert request
    // ...
}

// RetrieveCertificate passes empty CADN
func (v *Venafi) RetrieveCertificate(...) {
    vreq, err := v.buildVReq(csrPEM, duration, customFields, "")
    // ...
}
```

### Phase 4: Read Annotation in Controller
```go
// pkg/controller/certificaterequests/venafi/venafi.go
func (v *Venafi) Sign(ctx context.Context, cr *cmapi.CertificateRequest, ...) ([]byte, error) {
    cadn := strings.TrimSpace(cr.GetAnnotations()[cmapi.VenafiCADNAnnotationKey])
    
    customFields := parseCustomFields(cr)  // existing logic
    
    pickupID, err := v.client.RequestCertificate(cr.Spec.Request, duration, customFields, cadn)
    // ...
}
```

### Phase 5: Update Fake Client
```go
// pkg/issuer/venafi/client/fake/venafi.go
type FakeVenafiClient struct {
    RequestCertificateFn func(csrPEM []byte, duration time.Duration, customFields []api.CustomField, cadn string) (string, error)
}

func (f *FakeVenafiClient) RequestCertificate(csrPEM []byte, duration time.Duration, customFields []api.CustomField, cadn string) (string, error) {
    return f.RequestCertificateFn(csrPEM, duration, customFields, cadn)
}
```

---

## 3. Testing Strategy

### Unit Tests (Run locally)
```bash
# Run Venafi controller tests
go test ./pkg/controller/certificaterequests/venafi/... -v

# Run Venafi client tests
go test ./pkg/issuer/venafi/client/... -v

# Run all tests
make test WHAT=./pkg/controller/certificaterequests/venafi/...
make test WHAT=./pkg/issuer/venafi/client/...
```

### Integration Tests (OpenShift Cluster)
**Prerequisites:**
- OpenShift cluster with cert-manager (upstream Helm, not Operator)
- Venafi TPP reachable
- Two CA templates: CorpCA-A (default), CorpCA-B (target)
- TPP identity with access to both CAs

**Test Cases from Document (Section 7):**

| Test | Description | Verification |
|------|-------------|--------------|
| **7.6 Test 1** | Explicit CADN used | TPP shows CA-B in CertificateAuthorityDN |
| **7.7 Test 2** | No annotation = policy default | TPP uses CA-A |
| **7.8 Test 3** | Invalid CADN fails | CertReq fails with TPP error |
| **7.9 Test 4** | Renewal keeps CADN | New CertReq has annotation, uses CA-B |
| **7.10 Test 5** | Adoption filters by CADN | Only matching CA adopted |
| **7.11 Test 6** | Custom-fields + CADN independent | Both work together |
| **7.12 Test 7** | Annotation change needs renew | No auto-reissue, `cmctl renew` works |

---

## 4. Build & Push Images to Artifactory (OpenShift amd64)

### Build Controller Image Only
```bash
# Set version with feature tag
export VERSION=v1.19.6-venafi-cadn.1

# Build only controller for amd64
make VERSION="$VERSION" \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz

# Load into local Docker
docker load -i _bin/containers/cert-manager-controller-linux-amd64.tar.gz
```

### Tag & Push to Artifactory
```bash
# Login to Artifactory
docker login <artifactory-host> -u <user> -p <token>

# Tag for artifactory
docker tag "cert-manager-controller-amd64:$VERSION" \
  "<artifactory-host>/cert-manager/cert-manager-controller:$VERSION"

# Push
docker push "<artifactory-host>/cert-manager/cert-manager-controller:$VERSION"

# Also push latest tag for testing
docker tag "cert-manager-controller-amd64:$VERSION" \
  "<artifactory-host>/cert-manager/cert-manager-controller:venafi-cadn-latest"
docker push "<artifactory-host>/cert-manager/cert-manager-controller:venafi-cadn-latest"
```

### Deploy to OpenShift for Testing
```bash
# Update Helm deployment to use artifactory image
helm upgrade --install cert-manager deploy/charts/cert-manager \
  --namespace cert-manager \
  --reuse-values \
  --set image.repository=<artifactory-host>/cert-manager/cert-manager-controller \
  --set image.tag=venafi-cadn-latest \
  --set image.pullPolicy=Always

# Wait for rollout
oc rollout status deploy/cert-manager -n cert-manager --timeout=5m
```

---

## 5. Production Image Generation

### Final Release Build (Multi-arch)
```bash
# Use proper semantic version for production
export VERSION=v1.19.7  # Next patch release

# Build ALL architectures (required for production)
make VERSION="$VERSION" all-containers

# This produces:
# _bin/containers/cert-manager-controller-linux-amd64.tar.gz
# _bin/containers/cert-manager-controller-linux-arm64.tar.gz
# _bin/containers/cert-manager-controller-linux-s390x.tar.gz
# _bin/containers/cert-manager-controller-linux-ppc64le.tar.gz
# _bin/containers/cert-manager-controller-linux-arm.tar.gz
```

### Create Multi-arch Manifest for Artifactory
```bash
# Load all arches
for arch in amd64 arm64 s390x ppc64le arm; do
  docker load -i _bin/containers/cert-manager-controller-linux-${arch}.tar.gz
done

# Create manifest
docker manifest create <artifactory-host>/cert-manager/cert-manager-controller:$VERSION \
  $(for arch in amd64 arm64 s390x ppc64le arm; do
    echo -n "<artifactory-host>/cert-manager/cert-manager-controller:$VERSION-$arch "
  done)

# Annotate arches
for arch in amd64 arm64 s390x ppc64le arm; do
  docker manifest annotate \
    <artifactory-host>/cert-manager/cert-manager-controller:$VERSION \
    <artifactory-host>/cert-manager/cert-manager-controller:$VERSION-$arch \
    --os linux --arch $arch
done

# Push manifest
docker manifest push <artifactory-host>/cert-manager/cert-manager-controller:$VERSION
```

### Production Helm Chart Update
```bash
# Package Helm chart with new version
make VERSION="$VERSION" helm-chart
# Output: _bin/cert-manager-v1.19.7.tgz

# Update image references in chart values or use --set at install time
```

---

## 6. Validation Checklist

### Pre-merge
- [ ] `make generate` passes (no generated code changes expected)
- [ ] `make verify` passes
- [ ] `make test` passes for Venafi packages
- [ ] `make unit-test` passes
- [ ] Code follows existing Venafi annotation patterns

### Post-deploy to Test Cluster
- [ ] Test 1: Explicit CADN → TPP uses target CA
- [ ] Test 2: No annotation → TPP uses policy default
- [ ] Test 3: Invalid CADN → Clear error in CertRequest
- [ ] Test 4: `cmctl renew` preserves CADN
- [ ] Test 5: Custom-fields + CADN work together
- [ ] Controller logs show no errors

### Pre-production Release
- [ ] All 5 architectures build successfully
- [ ] Multi-arch manifest pushed to artifactory
- [ ] Helm chart packages with correct version
- [ ] Security scan (Trivy) passes: `make trivy-scan-controller`
- [ ] RBAC/permissions reviewed for CADN selection

---

## 7. Key Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **Security: Users can select any CA** | Add allowlist on Issuer (future) or webhook validation |
| **Annotation change doesn't trigger reissue** | Document `cmctl renew` requirement |
| **Cloud issuer ignores CADN** | Add validation to reject/warn for Cloud issuers |
| **Custom `--copied-annotation-prefixes` breaks copy** | Explicit copy in requestmanager (optional, Section 5.2) |
| **Adoption picks wrong CA** | Filter by CertificateAuthorityDN metadata |

---

## 8. Commands Quick Reference

```bash
# Development build (amd64 only)
make VERSION=v1.19.6-venafi-cadn.1 _bin/containers/cert-manager-controller-linux-amd64.tar.gz

# Run unit tests
make test WHAT=./pkg/controller/certificaterequests/venafi/...
make test WHAT=./pkg/issuer/venafi/client/...

# Full multi-arch production build
make VERSION=v1.19.7 all-containers

# Security scan
make trivy-scan-controller

# Package Helm chart
make VERSION=v1.19.7 helm-chart

# Clean
make clean
```

---

## Conclusion

The document provides a **complete, production-ready implementation plan**. The workflow is correct:
1. Annotation → CertificateRequest (auto-copied)
2. Venafi issuer reads from CertificateRequest
3. Client passes CADN to vcert
4. vcert sends to TPP in `Certificates/Request`

**Only 6 files need changes** (plus tests), no CRD/webhook changes required. The OpenShift amd64 build/push/test workflow in Section 7.4-7.6 is accurate for internal registry. For production, use `make all-containers` + multi-arch manifest push to Artifactory.