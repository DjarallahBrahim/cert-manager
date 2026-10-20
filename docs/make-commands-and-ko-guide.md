# Make Commands Reference and ko-images-push Guide

This document provides a comprehensive reference for cert-manager's Makefile commands and details on the experimental `ko-images-push` workflow.

## Main Make Commands

### Build Commands

| Command | Description |
|---------|-------------|
| `make server-binaries` | Build all server binaries for all architectures |
| `make controller` | Build controller binary (all arches) |
| `make webhook` | Build webhook binary (all arches) |
| `make cainjector` | Build cainjector binary (all arches) |
| `make acmesolver` | Build acmesolver binary (all arches) |
| `make startupapicheck` | Build startupapicheck binary (all arches) |
| `make tidy` | Run `go mod tidy` |

### Container/Image Commands

| Command | Description |
|---------|-------------|
| `make all-containers` | Build all container images for all arches (amd64, arm64, s390x, ppc64le, arm) |
| `make cert-manager-controller-linux` | Build controller container (all arches) |
| `make cert-manager-webhook-linux` | Build webhook container (all arches) |
| `make cert-manager-cainjector-linux` | Build cainjector container (all arches) |
| `make cert-manager-acmesolver-linux` | Build acmesolver container (all arches) |
| `make cert-manager-startupapicheck-linux` | Build startupapicheck container (all arches) |
| `make ko-images-push` | Build/push images using ko (experimental) |
| `make ko-deploy-certmanager` | Deploy cert-manager using ko-built images |

### Release Commands

| Command | Description |
|---------|-------------|
| `make release-artifacts` | Build all release artifacts (no signing) |
| `make release-artifacts-signed` | Build all release artifacts + sign Helm chart |
| `make release` | Create complete signed release |
| `make upload-release` | Upload release to GCS (requires `RELEASE_TARGET_BUCKET`) |
| `make release-containers` | Build release container bundles + metadata |
| `make release-manifests` | Build YAML manifests + helm chart (unsigned) |
| `make release-manifests-signed` | Build manifests + helm chart with signature |

### Manifest/Helm Commands

| Command | Description |
|---------|-------------|
| `make helm-chart` | Build Helm chart package |
| `make helm-chart-signature` | Sign Helm chart (requires `CMREL_KEY`) |
| `make static-manifests` | Generate static YAML manifests |
| `make generate-crds` | Generate CRD manifests from code |
| `make generate-helm-docs` | Generate Helm chart README from values.yaml |
| `make generate-helm-schema` | Generate Helm chart values.schema.json |
| `make verify-helm-values` | Lint Helm chart values |

### Test Commands

| Command | Description |
|---------|-------------|
| `make test` | Run unit + integration tests (use `WHAT=./pkg/...` to filter) |
| `make test-ci` | Run tests with JUnit output for CI |
| `make unit-test` | Run only unit tests (no k8s/etcd deps) |
| `make unit-test-core-module` | Run unit tests for core modules |
| `make integration-test` | Run only integration tests |
| `make livedns-test` | Run live DNS tests |
| `make e2e` | Run end-to-end tests (requires `make e2e-setup` first) |
| `make e2e-ci` | Run E2E tests in CI mode |
| `make e2e-build` | Build E2E test binary |
| `make test-upgrade` | Run upgrade tests |

### E2E Setup Commands

| Command | Description |
|---------|-------------|
| `make e2e-setup-kind` | Create Kind cluster |
| `make e2e-setup` | Install cert-manager + all E2E dependencies |
| `make e2e-setup-certmanager` | Install cert-manager |
| `make e2e-setup-vault` | Install Vault |
| `make e2e-setup-bind` | Install BIND for DNS01 tests |
| `make e2e-setup-ingressnginx` | Install NGINX Ingress |
| `make e2e-setup-projectcontour` | Install Contour for GatewayAPI tests |
| `make e2e-setup-pebble` | Install Pebble ACME server |
| `make e2e-setup-samplewebhook` | Install sample webhook |
| `make e2e-setup-sampleexternalissuer` | Install sample external issuer |
| `make e2e-setup-kyverno` | Install Kyverno (for best-practice tests) |
| `make kind-logs` | Export Kind cluster logs |

### Generate/Verify Commands

| Command | Description |
|---------|-------------|
| `make generate` | Run all generate targets |
| `make generate-all` | Update CRDs, codegen, licenses |
| `make generate-codegen` | Generate Kubernetes client/informer/lister code |
| `make generate-licenses` | Generate license files |
| `make update-licenses` | Update license files |
| `make verify-licenses` | Verify license files |
| `make verify` | Run all verify targets |
| `make verify-modules` | Validate Go modules |
| `make verify-chart` | Verify Helm chart version |
| `make verify-errexit` | Verify error handling |

### Scan/Security Commands

| Command | Description |
|---------|-------------|
| `make trivy-scan-all` | Scan all containers with Trivy |
| `make trivy-scan-controller` | Scan controller container |
| `make trivy-scan-webhook` | Scan webhook container |
| `make trivy-scan-cainjector` | Scan cainjector container |
| `make trivy-scan-acmesolver` | Scan acmesolver container |
| `make trivy-scan-startupapicheck` | Scan startupapicheck container |

### Development/Utility Commands

| Command | Description |
|---------|-------------|
| `make clean` | Clean all temporary files |
| `make generate-all` | Convenience target for PR prep |
| `make ci-presubmit` | Run all pre-submit checks |
| `make update-base-images` | Update base container images |
| `make update-third-party` | Update third_party/ dependencies |
| `make gitver` | Show version info |
| `make release-version` | Print version string |
| `make print-bindir` | Print binary directory |
| `make print-sources` | Print all Go source files |
| `make print-source-dirs` | Print source directories |

---

## ko-images-push: How It Works

### Prerequisites

- **Go Workspaces**: Must run `make go-workspaces` first (sets up `go.work`)
- **ko binary**: Installed via `NEEDS_KO` (from `make/_shared/tools/`)
- **yq**: For parsing ko output (via `NEEDS_YQ`)
- **KO_REGISTRY**: Required environment variable (e.g., `my-registry.com`)

### Step-by-Step Flow

```bash
make ko-images-push KO_REGISTRY=my-registry.com
```

#### 1. Prerequisites Check
Validates required tools and environment variables.

#### 2. Per-Binary Build Loop
For each binary in `KO_BINS` (controller, acmesolver, cainjector, webhook, startupapicheck):

```bash
export KO_DOCKER_REPO=my-registry.com/cert-manager-controller
ko build ./cmd/controller \
    --bare \
    --sbom=none \
    --platform=linux/amd64 \
    --tags=v1.15.0
```

#### 3. Output Capture
- `ko` outputs: `my-registry.com/cert-manager-controller:v1.15.0@sha256:abc123`
- `yq` extracts repository, tag, digest → saves to `_bin/scratch/ko/controller.yaml`

#### 4. Deployment (`ko-deploy-certmanager`)
- Reads all `.yaml` files from `_bin/scratch/ko/`
- Extracts digests/repositories via `yq`
- Runs `helm upgrade --install` with explicit image digests

---

## Experimental Status: Known Issues

| Problem | Details |
|---------|---------|
| **Go Workspaces Required** | Must run `make go-workspaces` first |
| **No Multi-arch by Default** | `KO_PLATFORM=linux/amd64` only; multi-arch needs `ko` v0.15+ with `--platform=all` |
| **No SBOM Support** | `KO_SBOM=none` hardcoded; SPDX/CycloneDX not tested |
| **Digest Pinning Only** | Uses `--bare` + digests; no tag mutation after push |
| **Helm Values Injection** | Manual `--set` for each image; no automated values.yaml generation |
| **Registry Auth** | Relies on `ko`'s credential helpers (docker config, gcr, ecr, ghcr) |
| **No Build Caching Across Runs** | `KOCACHE` helps but not persistent across CI runners |
| **Upstream `ko` Changes** | Breaking changes possible; cert-manager pins `ko` version in tools |

### Typical Failure Modes

```bash
# 1. Missing go.work
make go-workspaces  # Run this first

# 2. Registry auth
export KO_DOCKER_REPO=my-registry.com/cert-manager-controller
ko login my-registry.com  # Or configure ~/.docker/config.json

# 3. Platform mismatch (M1 Mac)
KO_PLATFORM=linux/amd64,linux/arm64 make ko-images-push  # Requires ko v0.15+

# 4. Workspace module path issues
# ko requires modules to be in workspace; vendor/ not supported
```

---

## Recommended Approach for OpenShift

For production OpenShift builds, prefer the standard container build:

```bash
# Multi-arch build (all 5 architectures)
make all-containers

# Push manually to OpenShift registry
skopeo copy docker-archive:_bin/containers/cert-manager-controller-linux-amd64.tar.gz \
    docker://registry.redhat.io/my-ns/cert-manager-controller:v1.15.0

# Or use crane/oc image mirror
oc image mirror docker-archive:_bin/containers/cert-manager-controller-linux-amd64.tar.gz \
    registry.redhat.io/my-ns/cert-manager-controller:v1.15.0
```

### Why Standard Build is Better for OpenShift

1. **Proper multi-arch manifests** - All 5 architectures (amd64, arm64, s390x, ppc64le, arm)
2. **Distroless base images** - Defined in `make/base_images.mk`, regularly updated
3. **Well-tested flow** - Used in cert-manager's own release process
4. **No Go workspace dependency** - Works with standard Go modules
5. **SBOM support** - Can be added via syft/cosign post-build
6. **OpenShift compatible** - Produces standard OCI images

---

## Related Files

- `Makefile` - Entry point, includes all make modules
- `make/00_mod.mk` - Variable definitions (BINS, ARCHS, etc.)
- `make/02_mod.mk` - Includes all feature makefiles
- `make/containers.mk` - Standard container build logic
- `make/ko.mk` - Experimental ko-based build
- `make/release.mk` - Release artifact creation
- `make/base_images.mk` - Distroless base image digests
- `make/server.mk` - Binary building
- `make/manifests.mk` - Helm chart and manifest generation