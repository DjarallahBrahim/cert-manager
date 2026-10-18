# cert-manager container images on OpenShift

This document explains:

1. The five container images cert-manager builds.
2. What each Containerfile contains and which part of cert-manager it runs.
3. How the Makefile builds the images.
4. Which image(s) must be rebuilt for common changes.
5. A complete worked example: adding a `caDN` field to `Certificate` and using it with the Venafi TPP issuer.
6. How to build, publish to the OpenShift internal registry, deploy, and test that change.

---

## 1. Quick reference

cert-manager builds five images. Each image contains exactly one Go binary.

| Image | Entrypoint | Containerfile | Helm values prefix | Main responsibility |
|---|---|---|---|---|
| `cert-manager-controller` | `cmd/controller` | `hack/containers/Containerfile.controller` | `image.*` | Reconciles Certificates, CertificateRequests, Orders, Challenges, Issuers |
| `cert-manager-webhook` | `cmd/webhook` | `hack/containers/Containerfile.webhook` | `webhook.image.*` | Admission validation, defaulting, mutation, and CRD conversion |
| `cert-manager-cainjector` | `cmd/cainjector` | `hack/containers/Containerfile.cainjector` | `cainjector.image.*` | Injects CA bundles into webhook and CRD conversion configurations |
| `cert-manager-acmesolver` | `cmd/acmesolver` | `hack/containers/Containerfile.acmesolver` | `acmesolver.image.*` | Solves ACME HTTP01 challenges in short-lived pods |
| `cert-manager-startupapicheck` | `cmd/startupapicheck` | `hack/containers/Containerfile.startupapicheck` | `startupapicheck.image.*` | Post-install Job that waits for the API and webhook to become ready |

There is no single "cert-manager" image. All five are separate workloads with separate binaries.

---

## 2. What is inside every image

All five Containerfiles follow the same pattern. For example,
`hack/containers/Containerfile.controller`:

```dockerfile
ARG BASE_IMAGE

FROM $BASE_IMAGE

LABEL org.opencontainers.image.source="https://github.com/cert-manager/cert-manager"

USER 1000

COPY controller /app/cmd/controller/controller
COPY cert-manager.license /licenses/LICENSE
COPY cert-manager.licenses_notice /licenses/LICENSES

ENTRYPOINT ["/app/cmd/controller/controller"]
```

### Base image

The default is Google's distroless static image:

```text
gcr.io/distroless/static-debian12
```

The exact digest for each architecture is pinned in `make/base_images.mk`.

- `CGO_ENABLED=0` (the default) uses `static-debian12`.
- `CGO_ENABLED=1` uses `base-debian12` (`BASE_IMAGE_TYPE=DYNAMIC`).

### Contents

Each image contains only:

- One statically linked Go binary.
- `LICENSE` and license-notice files.
- A non-root `USER 1000`.
- An `ENTRYPOINT`.

There is no shell, package manager, or debugging tool inside. To inspect it:

```bash
tar xfO _bin/containers/cert-manager-controller-linux-amd64.tar manifest.json | jq
docker run --rm --entrypoint /app/cmd/controller/controller \
  cert-manager-controller-amd64:<VERSION> --help
```

---

## 3. The five images in detail

### 3.1 `cert-manager-controller`

- **Containerfile:** `hack/containers/Containerfile.controller`
- **Binary:** `cmd/controller`
- **Chart value:** `image.repository` / `image.tag`
- **Runs as:** a Deployment (`cert-manager`).

This is the main control-plane process. It contains the reconcilers for:

- `Certificate` and `CertificateRequest`
- `Issuer` and `ClusterIssuer`
- ACME `Order` and `Challenge`
- Certificate signing requests
- The issuance scheduler
- Venafi, ACME, CA, Vault, SelfSigned and external issuer clients

It also creates `CertificateRequest` objects, stores signed certificates in Secrets, handles renewal, and exposes controller metrics.

**Rebuild this image when:** you change reconciliation logic, issuer clients, Venafi request construction, issuance policy, or any API field that the controller reads or writes.

### 3.2 `cert-manager-webhook`

- **Containerfile:** `hack/containers/Containerfile.webhook`
- **Binary:** `cmd/webhook`
- **Chart value:** `webhook.image.repository` / `webhook.image.tag`
- **Runs as:** a Deployment plus a `ValidatingWebhookConfiguration`.

This component handles:

- Validation and defaulting for cert-manager API resources.
- Mutation of `Certificate`, `CertificateRequest`, `Issuer`, etc.
- CRD conversion.
- Conversion/defaulting code generated from `pkg/apis` and `internal/apis`.

**Rebuild this image when:** you add or change API fields, validation, defaulting, or conversion logic. If you change API types and regenerate conversions, rebuild the webhook even if you did not touch validation code.

### 3.3 `cert-manager-cainjector`

- **Containerfile:** `hack/containers/Containerfile.cainjector`
- **Binary:** `cmd/cainjector`
- **Chart value:** `cainjector.image.repository` / `cainjector.image.tag`
- **Runs as:** a Deployment.

The CA injector watches cert-manager's own serving certificate and injects the CA bundle into:

- `ValidatingWebhookConfiguration`
- `MutatingWebhookConfiguration`
- `APIService`
- CRD conversion webhook configuration

It does not issue certificates. It only distributes CA trust data.

**Rebuild this image when:** you change CA injection logic, injection targets, or the cainjector controller.

### 3.4 `cert-manager-acmesolver`

- **Containerfile:** `hack/containers/Containerfile.acmesolver`
- **Binary:** `cmd/acmesolver`
- **Chart value:** `acmesolver.image.repository` / `acmesolver.image.tag`
- **Runs as:** short-lived Pods created for ACME HTTP01 challenges.

This is not a long-running Deployment. When an ACME `Order` uses HTTP01, the controller creates a solver Pod from this image. The solver serves the challenge token, then exits.

**Rebuild this image when:** you change HTTP01 solver behavior, challenge serving, or the solver's command-line interface.

### 3.5 `cert-manager-startupapicheck`

- **Containerfile:** `hack/containers/Containerfile.startupapicheck`
- **Binary:** `cmd/startupapicheck`
- **Chart value:** `startupapicheck.image.repository` / `startupapicheck.image.tag`
- **Runs as:** a Helm post-install/post-upgrade Job.

It waits until the cert-manager API and webhook are reachable and ready. It is not part of the steady-state control plane.

**Rebuild this image when:** you change the startup readiness checks or the Job's CLI.

---

## 4. How the Makefile builds images

The relevant files are:

- `make/containers.mk` — image build rules.
- `make/server.mk` — cross-compilation of the five binaries.
- `make/base_images.mk` — pinned distroless base-image digests.
- `make/licenses.mk` — license files copied into images.
- `make/e2e-setup.mk` — building and loading images into Kind.
- `make/ko.mk` — experimental direct build-and-push with `ko`.

### Build flow

For each component and architecture:

1. Cross-compile the Go binary:

   ```text
   GOOS=linux GOARCH=<arch> CGO_ENABLED=0 go build ...
   -> _bin/server/<component>-linux-<arch>
   ```

2. Assemble a minimal build context:

   ```text
   _bin/scratch/build-context/cert-manager-<component>-linux-<arch>/
   ```

   It contains hard links to the binary and license files. This avoids a huge Docker build context.

3. Build the image:

   ```bash
   docker build \
     -f hack/containers/Containerfile.<component> \
     --build-arg BASE_IMAGE=<pinned-distroless-digest> \
     -t cert-manager-<component>-<arch>:<VERSION> \
     <build-context>
   ```

4. Save and compress:

   ```text
   _bin/containers/cert-manager-<component>-linux-<arch>.tar.gz
   ```

The result is a single-architecture image tarball, not a multi-arch manifest list.

### Supported architectures

```make
ARCHS = amd64 arm64 s390x ppc64le arm
BINS  = controller acmesolver cainjector webhook startupapicheck
```

### Useful targets

| Target | What it builds |
|---|---|
| `make all-containers` | All 5 components × all 5 architectures = 25 images |
| `make cert-manager-controller-linux` | Controller for all 5 architectures |
| `make cert-manager-webhook-linux` | Webhook for all 5 architectures |
| `make cert-manager-cainjector-linux` | Cainjector for all 5 architectures |
| `make cert-manager-acmesolver-linux` | Acmesolver for all 5 architectures |
| `make cert-manager-startupapicheck-linux` | Startupapicheck for all 5 architectures |
| `make _bin/containers/cert-manager-controller-linux-amd64.tar.gz` | One component, one architecture (fastest) |
| `make release-containers` | Bundles all five images per architecture for release tooling |
| `make release-artifacts` | All binaries, images, chart, and manifests (unsigned) |
| `make trivy-scan-controller` | Trivy scan of the controller image |
| `make trivy-scan-all` | Trivy scan of all five images |
| `make e2e-setup` | Builds images for `CRI_ARCH` and loads them into Kind |
| `make ko-images-push` | Builds and pushes images with `ko` |
| `make ko-deploy-certmanager` | Pushes with `ko` and deploys with Helm |

### Useful variables

| Variable | Default | Meaning |
|---|---|---|
| `CTR` | `docker` | Container engine; use `CTR=podman` for Podman |
| `VERSION` | `git describe ...` | Image tag and chart version |
| `CGO_ENABLED` | `0` | Set to `1` for libc-linked binaries |
| `BASE_IMAGE_TYPE` | `STATIC` | Set to `DYNAMIC` with `CGO_ENABLED=1` |
| `GOMAXPROCS` | system default | Limit Go parallelism |
| `GOBUILDPROCS` | empty | Passed to `GOMAXPROCS` during `go build` |
| `CRI_ARCH` | host architecture | Architecture used by `e2e-setup` |
| `KO_REGISTRY` | required for ko | Registry prefix |
| `KO_BINS` | all five | Components to build with ko |
| `KO_PLATFORM` | `linux/amd64` | Platform for ko images |

> `ARCHS=amd64` does not reduce `all-containers`, because the component targets hardcode all five architecture prerequisites. To build one architecture, use the direct `_bin/containers/...tar.gz` target.

---

## 5. Building for OpenShift and the internal registry

OpenShift nodes are usually `linux/amd64`. The simplest workflow is to build locally, push to the OpenShift internal registry, and deploy with the upstream Helm chart.

### 5.1 Build a single image

```bash
make VERSION=v1.21.0-cadn.1 \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz
```

### 5.2 Load it into your local container engine

```bash
docker load -i _bin/containers/cert-manager-controller-linux-amd64.tar.gz
# or: podman load -i ...
```

The image is tagged:

```text
cert-manager-controller-amd64:v1.21.0-cadn.1
```

### 5.3 Log in to the OpenShift internal registry

Get the external registry route:

```bash
oc get route default-route -n openshift-image-registry \
  -o jsonpath='{.spec.host}'
```

If no default route exists, create one:

```bash
oc create route reencrypt \
  --service=image-registry \
  -n openshift-image-registry
```

Log in:

```bash
REGISTRY_HOST=$(oc get route default-route -n openshift-image-registry \
  -o jsonpath='{.spec.host}')

docker login "$REGISTRY_HOST" \
  -u "$(oc whoami)" \
  -p "$(oc whoami -t)"
```

### 5.4 Tag and push

Push into the same namespace where cert-manager will run, for example `cert-manager`:

```bash
docker tag \
  cert-manager-controller-amd64:v1.21.0-cadn.1 \
  "$REGISTRY_HOST/cert-manager/cert-manager-controller:cadn"

docker push \
  "$REGISTRY_HOST/cert-manager/cert-manager-controller:cadn"
```

This creates an ImageStream named `cert-manager-controller` in the `cert-manager` namespace.

### 5.5 Reference the image from inside the cluster

Inside OpenShift, use the internal registry service address, not the external route:

```text
image-registry.openshift-image-registry.svc:5000/cert-manager/cert-manager-controller:cadn
```

If the workload and the image are in the same namespace, the default service account can normally pull it. If they are in different namespaces, grant pull access:

```bash
oc adm policy add-role-to-group system:image-puller \
  system:serviceaccounts:cert-manager \
  -n <image-namespace>
```

Or create a pull secret and pass:

```bash
--set global.imagePullSecrets[0].name=internal-registry-pull
```

---

## 6. Which image must I rebuild?

| Change | Rebuild | Also required |
|---|---|---|
| Certificate/Issuer API field or reconciliation logic | `controller` | New CRDs and chart |
| API validation, defaulting, or conversion | `webhook` | New CRDs and chart |
| Venafi/ACME/Vault/CA issuer logic | `controller` | Nothing, unless CRDs changed |
| CA injection behavior | `cainjector` | Nothing |
| ACME HTTP01 solver behavior | `acmesolver` | Nothing |
| Startup readiness check | `startupapicheck` | Nothing |
| Helm chart templates/values only | no image | Rebuild chart |
| Base image, Go version, shared libraries | all five | Rebuild all |
| Metrics or controller-only behavior | `controller` | Nothing |
| `pkg/apis` / `internal/apis` changes | `controller` and `webhook` | New CRDs, conversion code, chart |

Rule of thumb: each image contains only its own binary. A change affects the image whose `cmd/<component>` transitively imports the changed package. API type changes usually affect both `controller` and `webhook`, because both compile the API packages and the webhook serves conversion.

---

## 7. Worked example: add `spec.caDN` for Venafi TPP

### 7.1 Goal

Add a new optional field:

```yaml
spec:
  caDN: '\VED\Policy\MyPolicy\MyCA'
```

The field is a Venafi TPP CA distinguished name. When cert-manager submits a certificate request to Venafi, it must set the vcert `CADN` field.

### 7.2 Why the field must reach `CertificateRequest`

The Venafi issuer does not receive the `Certificate`. The flow is:

```text
Certificate
    |
    | controller creates
    v
CertificateRequest  --->  Venafi issuer controller  --->  vcert Request.CADN
```

Therefore the field must be:

1. Added to `CertificateSpec`.
2. Added to `CertificateRequestSpec`.
3. Copied from the `Certificate` when the controller creates the `CertificateRequest`.
4. Passed from the Venafi issuer controller into the Venafi client.
5. Assigned to vcert's `certificate.Request.CADN`.

vcert already supports this field. In `github.com/Venafi/vcert/v5/pkg/certificate.Request`:

```go
type Request struct {
    CADN string
    ...
}
```

The TPP connector forwards it:

```go
tppReq.CADN = req.CADN
```

Venafi Cloud ignores `CADN`; this example is TPP-only.

### 7.3 API changes

#### `pkg/apis/certmanager/v1/types_certificate.go`

In `CertificateSpec`, near `CommonName`:

```go
// CADN is the distinguished name of the CA in Venafi TPP that should
// issue this certificate, for example `\VED\Policy\MyPolicy\MyCA`.
// Only used by the Venafi TPP issuer; ignored by other issuers.
// +optional
CADN string `json:"caDN,omitempty"`
```

#### `pkg/apis/certmanager/v1/types_certificaterequest.go`

In `CertificateRequestSpec`:

```go
// CADN is the Venafi TPP CA distinguished name to request issuance from.
// +optional
CADN string `json:"caDN,omitempty"`
```

#### Internal API types

Add the same field without JSON tags:

- `internal/apis/certmanager/types_certificate.go`
- `internal/apis/certmanager/types_certificaterequest.go`

```go
CADN string
```

### 7.4 Propagate Certificate to CertificateRequest

#### `pkg/controller/certificates/requestmanager/requestmanager_controller.go`

In the `CertificateRequestSpec` literal (around line 400):

```go
Spec: cmapi.CertificateRequestSpec{
    Duration:  crt.Spec.Duration,
    IssuerRef: crt.Spec.IssuerRef,
    Request:   csrPEM.Bytes(),
    IsCA:      crt.Spec.IsCA,
    Usages:    crt.Spec.Usages,
    CADN:      crt.Spec.CADN, // new
},
```

### 7.5 Pass the value to the Venafi client

#### `pkg/controller/certificaterequests/venafi/venafi.go`

In `Sign()`:

```go
cadn := cr.Spec.CADN

pickupID, err = client.RequestCertificate(
    cr.Spec.Request,
    duration,
    customFields,
    cadn,
)
...
certPem, err := client.RetrieveCertificate(
    pickupID,
    cr.Spec.Request,
    duration,
    customFields,
    cadn,
)
```

#### `pkg/issuer/venafi/client/venaficlient.go`

Update the `Interface`:

```go
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
    cadn string,
) ([]byte, error)
```

#### `pkg/issuer/venafi/client/request.go`

Thread `cadn` through the three functions and assign it to vcert:

```go
func (v *Venafi) RequestCertificate(
    csrPEM []byte,
    duration time.Duration,
    customFields []api.CustomField,
    cadn string,
) (string, error) {
    vreq, err := v.buildVReq(csrPEM, duration, customFields, cadn)
    ...
}

func (v *Venafi) RetrieveCertificate(
    pickupID string,
    csrPEM []byte,
    duration time.Duration,
    customFields []api.CustomField,
    cadn string,
) ([]byte, error) {
    vreq, err := v.buildVReq(csrPEM, duration, customFields, cadn)
    ...
}

func (v *Venafi) buildVReq(
    csrPEM []byte,
    duration time.Duration,
    customFields []api.CustomField,
    cadn string,
) (*certificate.Request, error) {
    ...
    vreq := newVRequest(tmpl, duration)
    vreq.CADN = cadn
    ...
}
```

#### Other call sites

- `pkg/issuer/venafi/client/fake/venafi.go` — update the fake signatures.
- `pkg/controller/certificatesigningrequests/venafi/venafi.go` — the Kubernetes CSR path has no `Certificate` spec. Pass `""` for now, or add an annotation such as `venafi.cert-manager.io/ca-dn` if CSR support is needed.

### 7.6 Regenerate code and CRDs

```bash
make generate-all
```

This regenerates:

- conversion code
- deepcopy code
- OpenAPI schema
- apply configurations
- CRDs (`deploy/crds` and Helm chart templates)
- Helm docs/schema
- licenses

Then verify:

```bash
make verify
# or
make ci-presubmit
```

### 7.7 Add tests

At minimum:

1. **Venafi client test** in `pkg/issuer/venafi/client/request_test.go`:
   capture the outgoing `*certificate.Request` and assert `req.CADN`.

   ```go
   var gotCADN string
   fakeConnector := internalfake.Connector{
       RequestCertificateFunc: func(req *certificate.Request) (string, error) {
           gotCADN = req.CADN
           return "pickup-id", nil
       },
   }.Default()
   ```

2. **Request manager test**:
   create a `Certificate` with `spec.caDN` and assert that the generated
   `CertificateRequest.Spec.CADN` matches.

3. **Conversion test**:
   run the API round-trip/fuzz tests.

```bash
make WHAT=./pkg/issuer/venafi/... test
make unit-test
```

### 7.8 Build the images

For this change, rebuild:

- `controller` — because it creates the CertificateRequest and calls Venafi.
- `webhook` — because API types and generated conversions changed.

```bash
make VERSION=v1.21.0-cadn.1 \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz \
  _bin/containers/cert-manager-webhook-linux-amd64.tar.gz
```

You do **not** need to rebuild `cainjector`, `acmesolver`, or `startupapicheck` for this feature.

Load and push both:

```bash
docker load -i _bin/containers/cert-manager-controller-linux-amd64.tar.gz
docker load -i _bin/containers/cert-manager-webhook-linux-amd64.tar.gz

REGISTRY_HOST=$(oc get route default-route -n openshift-image-registry \
  -o jsonpath='{.spec.host}')

docker tag \
  cert-manager-controller-amd64:v1.21.0-cadn.1 \
  "$REGISTRY_HOST/cert-manager/cert-manager-controller:cadn"

docker tag \
  cert-manager-webhook-amd64:v1.21.0-cadn.1 \
  "$REGISTRY_HOST/cert-manager/cert-manager-webhook:cadn"

docker push "$REGISTRY_HOST/cert-manager/cert-manager-controller:cadn"
docker push "$REGISTRY_HOST/cert-manager/cert-manager-webhook:cadn"
```

### 7.9 Rebuild the chart and CRDs

```bash
make helm-chart
make static-manifests
```

Outputs:

```text
_bin/cert-manager-<VERSION>.tgz
_bin/yaml/cert-manager.crds.yaml
_bin/yaml/cert-manager.yaml
```

Apply the new CRDs before creating any `Certificate` with `caDN`:

```bash
oc apply -f _bin/yaml/cert-manager.crds.yaml
```

Without this, the API server will prune or reject `spec.caDN` because it is not in the CRD schema.

### 7.10 Deploy the new images

If cert-manager is installed with the upstream Helm chart:

```bash
helm upgrade --install cert-manager _bin/cert-manager-<VERSION>.tgz \
  --namespace cert-manager --create-namespace \
  --set crds.enabled=true \
  --set image.repository=image-registry.openshift-image-registry.svc:5000/cert-manager/cert-manager-controller \
  --set image.tag=cadn \
  --set webhook.image.repository=image-registry.openshift-image-registry.svc:5000/cert-manager/cert-manager-webhook \
  --set webhook.image.tag=cadn
```

If the other images are not mirrored into the internal registry and external registries are allowed, leave their values at the defaults. In an internal-registry-only environment, mirror all five images and set all five repositories and tags.

Check the rollout:

```bash
oc rollout status deploy/cert-manager -n cert-manager
oc rollout status deploy/cert-manager-webhook -n cert-manager

oc get deploy -n cert-manager \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.template.spec.containers[0].image}{"\n"}{end}'
```

### 7.11 Create Venafi TPP credentials and issuer

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: venafi-tpp-credentials
  namespace: cert-manager
type: Opaque
stringData:
  access-token: "<your-tpp-access-token>"
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: venafi-tpp
spec:
  venafi:
    zone: '\VED\Policy\MyPolicy\MyZone'
    tpp:
      url: https://tpp.example.com/vedsdk
      credentialsRef:
        name: venafi-tpp-credentials
```

Apply:

```bash
oc apply -f venafi-issuer.yaml
oc get clusterissuer venafi-tpp -o yaml
```

### 7.12 Create a test Certificate

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: cadn-test
  namespace: my-app
spec:
  secretName: cadn-test-tls
  commonName: cadn-test.apps.example.com
  dnsNames:
    - cadn-test.apps.example.com
  issuerRef:
    name: venafi-tpp
    kind: ClusterIssuer
  caDN: '\VED\Policy\MyPolicy\MyCA'
```

> Use single quotes. YAML single-quoted strings preserve the backslashes in the
> Venafi policy path. In a double-quoted YAML string you would need `\\`.

Apply and watch:

```bash
oc apply -f cadn-certificate.yaml

oc get certificate -n my-app cadn-test -w
oc describe certificate -n my-app cadn-test
```

### 7.13 Verify the field propagated

Check the generated `CertificateRequest`:

```bash
oc get certificaterequest -n my-app -o yaml | grep -i -A2 cadn
```

You should see:

```yaml
spec:
  caDN: \VED\Policy\MyPolicy\MyCA
```

Check the CRD schema:

```bash
oc get crd certificates.cert-manager.io -o jsonpath='
  {.spec.versions[?(@.name=="v1")].schema.openAPIV3Schema
   .properties.spec.properties.caDN}
'
```

Check controller logs:

```bash
oc logs -n cert-manager deploy/cert-manager -f | grep -i venafi
```

Check the issued certificate:

```bash
oc get secret -n my-app cadn-test-tls -o jsonpath='{.data.tls\.crt}' \
  | base64 -d \
  | openssl x509 -noout -issuer -subject -dates
```

Finally, confirm in Venafi TPP that:

- The request was created under the expected policy folder.
- The certificate was issued by the CA identified by `caDN`.
- The certificate chain matches that CA.

### 7.14 Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `spec.caDN` disappears after apply | CRD schema not updated | Apply new `cert-manager.crds.yaml` |
| `CertificateRequest` has no `caDN` | Old controller image | Verify Deployment image and restart rollout |
| Venafi request ignores the CA | Old controller image, or Cloud issuer | Use new controller image; `CADN` is TPP-only |
| `ImagePullBackOff` | Internal registry auth or cross-namespace pull | Add pull secret or `system:image-puller` binding |
| Certificate stays pending | Existing Venafi pickup ID | Delete the `CertificateRequest` to start a new request |
| New certificate not issued after editing `caDN` | Existing request revision reused | Delete the old `CertificateRequest` or trigger a new revision |
| Webhook rejects the new field | Old webhook image or old CRD | Rebuild/roll out webhook and apply new CRDs |

### 7.15 Important operational notes

1. **Changing `caDN` on an in-flight request does not change that request.**
   If the `CertificateRequest` already has the Venafi pickup-ID annotation,
   delete the `CertificateRequest` so cert-manager creates a new one.

2. **Venafi Cloud does not support `CADN`.** Only TPP uses it.

3. **OpenShift cert-manager Operator.** If cert-manager is installed through
   the OpenShift cert-manager Operator, the Operator manages images and CRDs.
   Swapping in custom images is not supported by simply changing a Deployment.
   Use the upstream Helm chart for testing a custom build, or build a custom
   Operator bundle.

4. **Internal registry only.** If the cluster cannot reach `quay.io`, mirror all
   five cert-manager images into the internal registry, not just the controller
   and webhook.

5. **CRDs are cluster-scoped.** Applying the updated `Certificate` and
   `CertificateRequest` CRDs requires cluster-admin or equivalent permissions.

---

## 8. Command cheat sheet

```bash
# Build one image for OpenShift amd64
make VERSION=v1.21.0-cadn.1 \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz

# Build controller + webhook
make VERSION=v1.21.0-cadn.1 \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz \
  _bin/containers/cert-manager-webhook-linux-amd64.tar.gz

# Build all five for one architecture
make VERSION=v1.21.0-cadn.1 \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz \
  _bin/containers/cert-manager-webhook-linux-amd64.tar.gz \
  _bin/containers/cert-manager-cainjector-linux-amd64.tar.gz \
  _bin/containers/cert-manager-acmesolver-linux-amd64.tar.gz \
  _bin/containers/cert-manager-startupapicheck-linux-amd64.tar.gz

# Build all components for all architectures (slow)
make all-containers

# Build with Podman
make CTR=podman \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz

# Regenerate code, CRDs, chart inputs
make generate-all

# Verify generated code and lint
make verify

# Build chart and static manifests
make helm-chart
make static-manifests

# Security scan
make trivy-scan-controller

# Build and load into Kind for e2e
make e2e-setup-kind
make -j e2e-setup

# Build and push with ko (experimental)
make go-workspace
make ko-images-push KO_REGISTRY=registry.example.com/myproject
make ko-deploy-certmanager KO_REGISTRY=registry.example.com/myproject
```
