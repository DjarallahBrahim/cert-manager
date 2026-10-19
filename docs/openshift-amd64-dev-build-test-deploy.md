# OpenShift amd64 development runbook

This document is the repeatable workflow to run after changing code under
`internal/`, `pkg/`, or `cmd/` when the target is a Linux OpenShift cluster
using `amd64` nodes.

It covers:

1. Formatting and linting.
2. Unit and integration tests.
3. Code and CRD generation when required.
4. Building Linux `amd64` binaries.
5. Building the five cert-manager images.
6. Pushing to the OpenShift internal registry.
7. Deploying with the upstream Helm chart.
8. Verifying the rollout and smoke-testing the feature.
9. Running E2E tests.
10. Committing and pushing the change.

Related documents:

- [`docs/cert-manager-images-and-cadn.md`](cert-manager-images-and-cadn.md)
- [`docs/openshift-base-images.md`](openshift-base-images.md)

---

## 0. Assumptions and one-time setup

This runbook assumes:

- Linux workstation.
- GNU Make 4.4 or newer.
- Go 1.25.x, or the Go version downloaded by `make vendor-go`.
- Docker or Podman.
- `oc` logged in to the target OpenShift cluster.
- Helm 3.
- Target OpenShift nodes are `linux/amd64`.

Check the tools:

```bash
make --version
go version
docker version
oc version
helm version
```

Check the cluster architecture:

```bash
oc get nodes \
  -o jsonpath='{range .items[*]}{.status.nodeInfo.architecture}{"\n"}{end}' \
  | sort -u
```

Expected for this runbook:

```text
amd64
```

Use the Go version expected by the project:

```bash
make vendor-go
export PATH="$PWD/_bin/tools:$PATH"
export GOROOT="$PWD/_bin/tools/goroot"
```

If you do not want the vendored Go, make will use the system Go.

### Set variables for the current shell

```bash
cd /path/to/cert-manager

export VERSION="v1.19.6-ocp.$(date +%Y%m%d%H%M)"
export NS="cert-manager"
export IMAGE_NS="cert-manager"
```

`VERSION` is used for:

- the binary version string,
- the image tag,
- the Helm chart version.

Keep the image tag and chart version identical.

---

## 1. Review the change

```bash
git status --short
git diff --stat
git diff --check
```

`git diff --check` catches trailing whitespace and conflict markers.

---

## 2. Format and lint

```bash
make fix-golangci-lint
make verify-golangci-lint
```

For a very small change, formatting only the modified files is also possible:

```bash
gofmt -w $(git diff --name-only --diff-filter=ACM -- '*.go')
```

`make fix-golangci-lint` is preferred because it applies the project's
golangci-lint formatting rules across all Go modules.

---

## 3. Update Go modules only if dependencies changed

Run this if you changed `go.mod`, `go.sum`, or added/removed imports:

```bash
make generate-go-mod-tidy
```

`make generate-go-mod-tidy` runs `go mod tidy` in every Go module in the
repository, including the separate modules under `cmd/`.

---

## 4. Regenerate code only when required

Run generation when the change touches:

- `pkg/apis/...`
- `internal/apis/...`
- CRD types
- defaulting or conversion code
- generated clients or apply configurations
- Helm values or templates
- dependencies that affect license files

```bash
make generate-all
make generate-all \
  shared_generate_targets="generate-go-mod-tidy generate-base generate-govulncheck generate-golangci-lint-config generate-helm-docs generate-helm-schema generate-crds"
make generate-licenses
```

Then inspect what changed:

```bash
git status --short
git diff --stat
```

Commit generated files together with the source change.

### Cases where generation is not required

You can skip `make generate-all` when the change is limited to:

- controller reconciliation logic,
- issuer client logic,
- annotations that do not add API fields,
- Venafi, ACME, Vault, or CA issuer implementation logic,
- tests only.

---

## 5. Run targeted tests

### For `pkg/` and `internal/`

```bash
make unit-test-core-module
```

This runs:

```text
./pkg/...
./internal/...
```

For a single package:

```bash
go test ./pkg/controller/certificates/...
go test ./internal/controller/certificates/...
```

### For `cmd/`

```bash
make unit-test-controller
make unit-test-webhook
make unit-test-cainjector
make unit-test-acmesolver
```

There is no `unit-test-startupapicheck` target in this tree. Run it directly:

```bash
cd cmd/startupapicheck
go test ./...
cd ../..
```

### Run all unit tests

```bash
make unit-test
```

---

## 6. Run the root-module unit and integration tests

```bash
make test
```

`make test` runs the root-module tests selected by `WHAT` (by default
`./pkg/...`, `./internal/...`, `./test/...`, and the JUnit helper). It does not
run the separate Go modules under `cmd/`; use `make unit-test` for the all-module
unit test run. It automatically downloads and uses the required `etcd`,
`kube-apiserver`, `kubectl`, and `gotestsum`.

Integration tests only:

```bash
make integration-test
```

Focused test run:

```bash
make test WHAT=./pkg/controller/certificates/...
```

---

## 7. Verify the repository

Before committing or opening a pull request:

```bash
make verify
```

`make verify` is the same check used by CI presubmit.

For a faster local check during development:

```bash
make verify-golangci-lint
```

If the Helm chart changed:

```bash
make verify-chart
```

---

## 8. Build the Linux `amd64` binaries

Build only the components affected by the change:

```bash
make _bin/server/controller-linux-amd64
make _bin/server/webhook-linux-amd64
make _bin/server/cainjector-linux-amd64
make _bin/server/acmesolver-linux-amd64
make _bin/server/startupapicheck-linux-amd64
```

Or build every component for every supported architecture:

```bash
make server-binaries
```

`server-binaries` builds all five components for:

```text
amd64
arm64
s390x
ppc64le
arm (GOARM=7)
```

For OpenShift `amd64`, the direct file targets are faster and produce only what
is needed.

Outputs:

```text
_bin/server/controller-linux-amd64
_bin/server/webhook-linux-amd64
_bin/server/cainjector-linux-amd64
_bin/server/acmesolver-linux-amd64
_bin/server/startupapicheck-linux-amd64
```

The binaries are statically linked by default (`CGO_ENABLED=0`), stripped
(`-w -s`), built with `-trimpath`, and include the version and Git commit.

---

## 9. Build the five `amd64` images

```bash
make VERSION="$VERSION" \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz \
  _bin/containers/cert-manager-webhook-linux-amd64.tar.gz \
  _bin/containers/cert-manager-cainjector-linux-amd64.tar.gz \
  _bin/containers/cert-manager-acmesolver-linux-amd64.tar.gz \
  _bin/containers/cert-manager-startupapicheck-linux-amd64.tar.gz
```

Outputs:

```text
_bin/containers/cert-manager-controller-linux-amd64.tar.gz
_bin/containers/cert-manager-webhook-linux-amd64.tar.gz
_bin/containers/cert-manager-cainjector-linux-amd64.tar.gz
_bin/containers/cert-manager-acmesolver-linux-amd64.tar.gz
_bin/containers/cert-manager-startupapicheck-linux-amd64.tar.gz
```

Each tarball contains one single-architecture image, for example:

```text
cert-manager-controller-amd64:v1.19.6-ocp.202610191530
```

### Using Podman

```bash
make CTR=podman VERSION="$VERSION" \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz \
  _bin/containers/cert-manager-webhook-linux-amd64.tar.gz \
  _bin/containers/cert-manager-cainjector-linux-amd64.tar.gz \
  _bin/containers/cert-manager-acmesolver-linux-amd64.tar.gz \
  _bin/containers/cert-manager-startupapicheck-linux-amd64.tar.gz
```

### Artifactory or blocked `gcr.io`

The default base image is pinned in `make/base_images.mk`:

```text
gcr.io/distroless/static-debian12@sha256:...
```

If OpenShift nodes cannot reach `gcr.io`, override the `amd64` base image:

```bash
make VERSION="$VERSION" \
  STATIC_BASE_IMAGE_amd64='artifactory.example.com/gcr/distroless/static-debian12@sha256:b669b9df05a88a085fefed6520c6d2268aabacf3008b149ddf877e752ae89400' \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz
```

Add the same override to the other four image targets.

---

## 10. Load the images locally

With Docker:

```bash
for c in controller webhook cainjector acmesolver startupapicheck; do
  docker load -i "_bin/containers/cert-manager-${c}-linux-amd64.tar.gz"
done
```

With Podman:

```bash
for c in controller webhook cainjector acmesolver startupapicheck; do
  podman load -i "_bin/containers/cert-manager-${c}-linux-amd64.tar.gz"
done
```

---

## 11. Push to the OpenShift internal registry

Create the namespace once:

```bash
oc new-project "$IMAGE_NS" 2>/dev/null || true
```

Get the external registry route:

```bash
REGISTRY_HOST=$(oc get route default-route \
  -n openshift-image-registry \
  -o jsonpath='{.spec.host}')

echo "$REGISTRY_HOST"
```

If the route does not exist:

```bash
oc create route reencrypt \
  --service=image-registry \
  -n openshift-image-registry
```

Log in:

```bash
docker login "$REGISTRY_HOST" \
  -u "$(oc whoami)" \
  -p "$(oc whoami -t)"
```

Tag and push all five:

```bash
for c in controller webhook cainjector acmesolver startupapicheck; do
  docker tag \
    "cert-manager-${c}-amd64:${VERSION}" \
    "${REGISTRY_HOST}/${IMAGE_NS}/cert-manager-${c}:${VERSION}"

  docker push \
    "${REGISTRY_HOST}/${IMAGE_NS}/cert-manager-${c}:${VERSION}"
done
```

With Podman, replace `docker` with `podman`.

Pushing creates five ImageStreams in the target namespace.

If cert-manager runs in a different namespace from the images, grant pull
access:

```bash
oc adm policy add-role-to-group system:image-puller \
  "system:serviceaccounts:${NS}" \
  -n "$IMAGE_NS"
```

---

## 12. Build the Helm chart

```bash
make VERSION="$VERSION" helm-chart
```

Output:

```text
_bin/cert-manager-${VERSION}.tgz
```

---

## 13. Deploy or upgrade on OpenShift

Use the internal registry service address, not the external route:

```bash
helm upgrade --install cert-manager "_bin/cert-manager-${VERSION}.tgz" \
  --namespace "$NS" \
  --create-namespace \
  --set crds.enabled=true \
  --set image.repository="image-registry.openshift-image-registry.svc:5000/${IMAGE_NS}/cert-manager-controller" \
  --set image.tag="$VERSION" \
  --set webhook.image.repository="image-registry.openshift-image-registry.svc:5000/${IMAGE_NS}/cert-manager-webhook" \
  --set webhook.image.tag="$VERSION" \
  --set cainjector.image.repository="image-registry.openshift-image-registry.svc:5000/${IMAGE_NS}/cert-manager-cainjector" \
  --set cainjector.image.tag="$VERSION" \
  --set acmesolver.image.repository="image-registry.openshift-image-registry.svc:5000/${IMAGE_NS}/cert-manager-acmesolver" \
  --set acmesolver.image.tag="$VERSION" \
  --set startupapicheck.image.repository="image-registry.openshift-image-registry.svc:5000/${IMAGE_NS}/cert-manager-startupapicheck" \
  --set startupapicheck.image.tag="$VERSION"
```

> Do not use the OpenShift cert-manager Operator for this workflow. The
> Operator manages images and CRDs itself. Use the upstream Helm chart when
> deploying custom images.

---

## 14. Verify the rollout

```bash
oc rollout status deploy/cert-manager -n "$NS"
oc rollout status deploy/cert-manager-webhook -n "$NS"
oc rollout status deploy/cert-manager-cainjector -n "$NS"

oc get pods -n "$NS"
oc get deploy -n "$NS"
```

Check the image actually running:

```bash
oc get deploy cert-manager -n "$NS" \
  -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

Check logs:

```bash
oc logs -n "$NS" deploy/cert-manager --tail=200
oc logs -n "$NS" deploy/cert-manager-webhook --tail=100
```

Check the CRDs:

```bash
oc get crd certificates.cert-manager.io
oc get crd certificaterequests.cert-manager.io
oc get crd issuers.cert-manager.io
oc get crd clusterissuers.cert-manager.io
```

---

## 15. Smoke-test the feature

Apply the test manifests for the feature:

```bash
oc apply -f <your-test-manifests>
```

Common checks:

```bash
oc get certificate -A
oc describe certificate -n <namespace> <name>
oc get certificaterequest -n <namespace>
oc get secret -n <namespace>
```

For a Venafi feature:

```bash
oc logs -n "$NS" deploy/cert-manager -f | grep -i venafi
```

For a webhook or validation feature:

```bash
oc logs -n "$NS" deploy/cert-manager-webhook --tail=200
```

For a cainjector feature:

```bash
oc logs -n "$NS" deploy/cert-manager-cainjector --tail=200
```

---

## 16. Optional E2E tests

### Local Kind E2E on Linux

```bash
make -j e2e-setup
make e2e
```

Run a focused test:

```bash
make e2e GINKGO_FOCUS='.*Certificate.*'
```

### E2E against OpenShift

`make e2e` expects a Kind cluster. For OpenShift, build the portable test binary
and run it with the OpenShift kubeconfig:

```bash
make e2e-build

KUBECONFIG="$KUBECONFIG" ./_bin/test/e2e.test \
  --repo-root=/dev/null \
  --ginkgo.focus='<your test focus>'
```

For Vault-related OpenShift tests:

```bash
E2E_OPENSHIFT=true KUBECONFIG="$KUBECONFIG" ./_bin/test/e2e.test \
  --repo-root=/dev/null \
  --ginkgo.focus='<your test focus>'
```

Most E2E tests require additional components such as an ingress controller, an
ACME server, or Vault. Use `--ginkgo.focus` and `--ginkgo.skip` to select the
tests that match the feature.

---

## 17. Commit and push

Review the final diff:

```bash
git status --short
git diff --stat
git diff --check
```

Stage the source and generated files:

```bash
git add internal pkg cmd
```

If `make generate-all` or `make generate-licenses` changed generated files,
include them as well:

```bash
git add pkg/client internal/apis deploy/charts docs
```

Commit and push:

```bash
git commit -m "feat: <describe the change>"
git push
```

---

## Which images must be rebuilt

| Changed area | Rebuild |
|---|---|
| `cmd/controller` | `controller` |
| `cmd/webhook` | `webhook` |
| `cmd/cainjector` | `cainjector` |
| `cmd/acmesolver` | `acmesolver` |
| `cmd/startupapicheck` | `startupapicheck` |
| `pkg/apis` or `internal/apis` | `controller` and `webhook`; also regenerate CRDs |
| `pkg/controller/...` | `controller` |
| `pkg/issuer/...` | `controller` |
| `internal/controller/...` | `controller` |
| `pkg/webhook/...` or validation/defaulting | `webhook` |
| Helm chart only | no image; rebuild the chart |
| Base image, Go version, or shared libraries | all five |

For a release or production deployment, rebuild all five images regardless of
the table above.

---

## Common failure checks

### Clean rebuild

If make appears to reuse stale artifacts:

```bash
make clean
```

Then rebuild the required targets.

### Image pull failures

Check the ImageStream and the pull policy:

```bash
oc get imagestream -n "$IMAGE_NS"
oc describe imagestream/cert-manager-controller -n "$IMAGE_NS"
oc describe pod -n "$NS" -l app.kubernetes.io/name=cert-manager
```

If the workload is in another namespace, add the image-puller role as shown in
section 11.

### Rollout failure

```bash
oc get pods -n "$NS"
oc describe pod -n "$NS" <pod-name>
oc logs -n "$NS" <pod-name> --all-containers
```

### Roll back the Helm release

```bash
helm history cert-manager -n "$NS"
helm rollback cert-manager -n "$NS"
```

---

## Short daily loop

For a small code change, the minimum useful sequence is:

```bash
make fix-golangci-lint
make unit-test-core-module
make unit-test-controller
make unit-test-webhook

make VERSION="$VERSION" \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz \
  _bin/containers/cert-manager-webhook-linux-amd64.tar.gz \
  _bin/containers/cert-manager-cainjector-linux-amd64.tar.gz \
  _bin/containers/cert-manager-acmesolver-linux-amd64.tar.gz \
  _bin/containers/cert-manager-startupapicheck-linux-amd64.tar.gz
```

Then load, push, deploy, and verify the rollout as described above.

Before pushing the branch, run the fuller checks:

```bash
make unit-test
make test
make verify
```
