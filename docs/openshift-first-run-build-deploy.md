# OpenShift first-run build and deploy

Clean first-run workflow for cert-manager on Linux + OpenShift `amd64`:

1. Check the Go toolchain.
2. Prepare the Go workspace.
3. Run generation.
4. Build the five `amd64` images.
5. Push them to the OpenShift internal registry.
6. Deploy with Helm.
7. Smoke-test the deployment.

Assumptions:

- Linux workstation.
- GNU Make 4.4+.
- Go 1.25.x.
- Docker or Podman.
- `oc` logged in to the target cluster.
- Helm 3.
- OpenShift nodes are `linux/amd64`.

---

## 1. Clone and enter the repository

```bash
git clone https://github.com/DjarallahBrahim/cert-manager.git
cd cert-manager
git checkout 1.19.6
```

If you already cloned the repository, just enter it:

```bash
cd /path/to/cert-manager
```

Set the version and namespace used by this run:

```bash
export VERSION="v1.19.6-ocp.$(date +%Y%m%d%H%M)"
export NS="cert-manager"
export IMAGE_NS="cert-manager"
```

---

## 2. Check the toolchain

```bash
make --version
go version
docker version
oc version
helm version
```

Check which Go binary Make will use:

```bash
make which-go
```

The project expects Go 1.25.x. If the system Go is different, download the
vendored version:

```bash
make vendor-go
export PATH="$PWD/_bin/tools:$PATH"
export GOROOT="$PWD/_bin/tools/goroot"
make which-go
```

Check the OpenShift node architecture:

```bash
oc get nodes \
  -o jsonpath='{range .items[*]}{.status.nodeInfo.architecture}{"\n"}{end}' \
  | sort -u
```

Expected:

```text
amd64
```

---

## 3. Prepare the Go workspace

This creates a root `go.work` covering all Go modules:

```bash
make go-workspace
```

Check it:

```bash
go work edit -json
```

Do not commit `go.work` unless the repository explicitly tracks it.

---

## 4. Run generation

Run the normal generation pipeline:

```bash
make generate-all
```

This runs:

- `go mod tidy` for every module
- repository base files
- govulncheck workflow files
- `.golangci.yaml`
- license files
- Helm docs and schema
- CRDs
- generated clients, listers, informers, deepcopy, defaults, conversions, OpenAPI

### If license generation fails

License generation needs GitHub access. If the proxy or network blocks it, skip
licenses and run the rest:

```bash
make generate-all \
  shared_generate_targets="generate-go-mod-tidy generate-base generate-govulncheck generate-golangci-lint-config generate-helm-docs generate-helm-schema generate-crds"
```

Then run licenses separately only if needed:

```bash
make generate-licenses
```

If license generation fails and deletes the tracked files, restore them:

```bash
git restore LICENSES cmd/*/LICENSES
```

### Check the generated result

```bash
git status --short
git diff --stat
git diff --check
```

If the diff is empty, generation made no semantic changes.

---

## 5. Optional: run tests

```bash
make unit-test
```

Or run the full root-module unit and integration tests:

```bash
make test
```

---

## 6. Build the five `amd64` images

```bash
make \
  _bin/server/controller-linux-amd64 \
  _bin/server/webhook-linux-amd64 \
  _bin/server/cainjector-linux-amd64 \
  _bin/server/acmesolver-linux-amd64 \
  _bin/server/startupapicheck-linux-amd64

make VERSION="$VERSION" \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz \
  _bin/containers/cert-manager-webhook-linux-amd64.tar.gz \
  _bin/containers/cert-manager-cainjector-linux-amd64.tar.gz \
  _bin/containers/cert-manager-acmesolver-linux-amd64.tar.gz \
  _bin/containers/cert-manager-startupapicheck-linux-amd64.tar.gz

export PODMAN=/home/tooling/.local/bin/podman

make CTR="$PODMAN" VERSION="$VERSION" \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz \
  _bin/containers/cert-manager-webhook-linux-amd64.tar.gz \
  _bin/containers/cert-manager-cainjector-linux-amd64.tar.gz \
  _bin/containers/cert-manager-acmesolver-linux-amd64.tar.gz \
  _bin/containers/cert-manager-startupapicheck-linux-amd64.tar.gz
```

Output:

```text
_bin/containers/cert-manager-controller-linux-amd64.tar.gz
_bin/containers/cert-manager-webhook-linux-amd64.tar.gz
_bin/containers/cert-manager-cainjector-linux-amd64.tar.gz
_bin/containers/cert-manager-acmesolver-linux-amd64.tar.gz
_bin/containers/cert-manager-startupapicheck-linux-amd64.tar.gz
```

Verify:

```bash
ls -lh _bin/containers/*-linux-amd64.tar.gz
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

### Artifactory base image

If `gcr.io` is blocked, override the `amd64` base image:

```bash
make VERSION="$VERSION" \
  STATIC_BASE_IMAGE_amd64='artifactory.example.com/gcr/distroless/static-debian12@sha256:b669b9df05a88a085fefed6520c6d2268aabacf3008b149ddf877e752ae89400' \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz
```

Add the same override to the other four image targets.

---

## 7. Load the images locally

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
1. Read the secret and log in
Inspect the secret type:
oc get secret "$SECRET" -n "$NS" -o jsonpath='{.type}{"\n"}'
oc get secret "$SECRET" -n "$NS" -o json | jq '.data | keys'
If it is a dockerconfigjson secret
TMP=$(mktemp)

oc get secret "$SECRET" -n "$NS" -o json \
  | jq -r '.data[".dockerconfigjson"]' \
  | base64 -d > "$TMP"

AUTH=$(jq -r --arg r "$REGISTRY" \
  '.auths[$r].auth // .auths["https://"+$r].auth // empty' "$TMP")

USER=$(printf '%s' "$AUTH" | base64 -d | cut -d: -f1)
PASS=$(printf '%s' "$AUTH" | base64 -d | cut -d: -f2-)

"$PODMAN" login "$REGISTRY" -u "$USER" -p "$PASS"

rm -f "$TMP"
If it is a basic-auth secret
USER=$(oc get secret "$SECRET" -n "$NS" -o jsonpath='{.data.username}' | base64 -d)
PASS=$(oc get secret "$SECRET" -n "$NS" -o jsonpath='{.data.password}' | base64 -d)

"$PODMAN" login "$REGISTRY" -u "$USER" -p "$PASS"
2. Load, tag, and push the existing images
for c in controller webhook cainjector acmesolver startupapicheck; do
  "$PODMAN" load -i "_bin/containers/cert-manager-${c}-linux-amd64.tar.gz"

  "$PODMAN" tag \
    "cert-manager-${c}-amd64:${VERSION}" \
    "${REGISTRY}/${REPO}/cert-manager-${c}:${VERSION}"

  "$PODMAN" push \
    "${REGISTRY}/${REPO}/cert-manager-${c}:${VERSION}"
done
Result:
artifactory.example.com/docker-local/cert-manager/cert-manager-controller:v1.19.6-ocp.202610191352
artifactory.example.com/docker-local/cert-manager/cert-manager-webhook:v1.19.6-ocp.202610191352
artifactory.example.com/docker-local/cert-manager/cert-manager-cainjector:v1.19.6-ocp.202610191352
artifactory.example.com/docker-local/cert-manager/cert-manager-acmesolver:v1.19.6-ocp.202610191352
artifactory.example.com/docker-local/cert-manager/cert-manager-startupapicheck:v1.19.6-ocp.202610191352
That is the full local build → Artifactory push flow using the existing images and the namespace secret.

## 8. Push to the OpenShift internal registry

Create the namespace once:

```bash
oc new-project "$IMAGE_NS" 2>/dev/null || true
```

Get the registry route:

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

---

## 9. Build the Helm chart

```bash
make VERSION="$VERSION" helm-chart
```

Output:

```text
_bin/cert-manager-${VERSION}.tgz
```

---

## 10. Deploy on OpenShift

Use the internal registry service address:

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

Do not use the OpenShift cert-manager Operator for this workflow. It manages
images and CRDs itself.

---

## 11. Verify the deployment

```bash
oc rollout status deploy/cert-manager -n "$NS"
oc rollout status deploy/cert-manager-webhook -n "$NS"
oc rollout status deploy/cert-manager-cainjector -n "$NS"
```

Check pods:

```bash
oc get pods -n "$NS"
```

Check the running controller image:

```bash
oc get deploy cert-manager -n "$NS" \
  -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

Check logs:

```bash
oc logs -n "$NS" deploy/cert-manager --tail=200
oc logs -n "$NS" deploy/cert-manager-webhook --tail=100
```

---

## 12. Smoke-test

Apply your test manifest:

```bash
oc apply -f <your-test-manifest>
```

Check the result:

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

---

## Common fixes

Clean and rebuild:

```bash
make clean
```

If the image cannot be pulled:

```bash
oc get imagestream -n "$IMAGE_NS"
oc describe imagestream/cert-manager-controller -n "$IMAGE_NS"
oc describe pod -n "$NS" -l app.kubernetes.io/name=cert-manager
```

Rollback:

```bash
helm history cert-manager -n "$NS"
helm rollback cert-manager -n "$NS"
```

If license generation fails because of a proxy:

```bash
env | grep -i proxy
```

If the dead proxy is `127.0.0.1:3128`, unset it for the command:

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY \
    -u http_proxy -u https_proxy -u all_proxy \
    make generate-licenses
```
