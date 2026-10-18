# cert-manager folder guide

This guide explains the repository folder by folder and answers two questions:

1. **What lives where?**
2. **For a given change, which files and which container image(s) do I touch?**

It is based on the knowledge graph generated for this checkout:

- 972 analyzed files (Go test files were excluded from the graph)
- 3,790 nodes and 11,817 edges
- 10 architectural layers
- 885 Go files total in the repository, 195 of them `*_test.go`

For the image build mechanics, see
[`docs/cert-manager-images-and-cadn.md`](./cert-manager-images-and-cadn.md).

---

## 1. The mental model

cert-manager is organized around a few clear boundaries:

```text
cmd/            process entry points (5 binaries)
pkg/            production code intended to be reusable
internal/       production code private to this repository
deploy/         what actually runs in Kubernetes (CRDs + Helm chart)
test/           e2e, integration, and shared test support
make/           build system
hack/           code generation and release scripts
design/         historical design proposals
third_party/    forked upstream code
```

The most important rule:

> **`pkg/apis` defines the user-facing CRD schemas. `internal/apis` holds the internal hub types plus validation/defaulting/conversion. Controllers and issuers consume those types. `pkg/client` is generated and should not be edited by hand.**

Another important rule:

> **The Venafi/ACME/Vault/CA issuers never see a `Certificate`. They see a `CertificateRequest`. Any per-request field must be copied from `CertificateSpec` to `CertificateRequestSpec` by the controller.**

---

## 2. Repository at a glance

File counts below come from the knowledge graph, so they exclude `*_test.go` and the documentation guides added to `docs/` after the graph was generated.

| Top-level folder | Files | Main role |
|---|---:|---|
| `pkg/` | 392 | Production libraries: APIs, controllers, issuers, webhook, ACME, utilities |
| `test/` | 164 | End-to-end, integration, fixtures, test helpers |
| `internal/` | 149 | Private production code: internal API types, validation, webhook plugins, cainjector |
| `make/` | 85 | Modular GNU Make build system and local-cluster config |
| `deploy/` | 67 | CRDs, Helm chart, manifests |
| `cmd/` | 32 | Five binaries: controller, webhook, cainjector, acmesolver, startupapicheck |
| `hack/` | 22 | Containerfiles, code generation, boilerplate, release helpers |
| `design/` | 18 | Design proposals and historical decisions |
| `.github/` | 10 | CI workflows, issue templates, Renovate, Chainguard config |
| `third_party/` | 9 | Forked ACME client |
| `tools/` | 2 | Legacy compatibility wrapper |
| `docs/` | 1 | Pointer to the external documentation site |
| `gcb/` | 1 | Google Cloud Build release pipeline |
| `logo/` | 1 | Branding/license note |
| Root files | 19 | README, `go.mod`, `Makefile`, licenses, OWNERS, security docs |

### The 10 architectural layers

| Layer | Files | What it covers |
|---|---:|---|
| Kubernetes API & Generated Clients | 289 | CRD types, internal API types, validation, conversions, generated clients |
| Controller Reconciliation | 95 | Certificate, CertificateRequest, Order, Challenge, CSR reconcilers |
| Certificate Issuers & ACME | 80 | ACME, CA, Vault, Venafi, SelfSigned, ACME protocol client |
| Admission Webhook & CA Injector | 23 | Admission plugins, webhook server, cainjector |
| Command-Line Binaries | 32 | The five `cmd/` binaries |
| Shared Runtime Libraries | 52 | PKI, metrics, health, logging, TLS, scheduling, feature gates |
| Test Suites & Fixtures | 175 | E2E, integration, fakes, fixtures |
| Deployment & Packaging | 73 | Helm chart, CRDs, manifests |
| Build, CI & Repository Tooling | 124 | Make, GitHub Actions, `hack/`, root build config |
| Documentation & Design Records | 29 | README, governance, design docs |

Layers span folders. For example, the “Kubernetes API & Generated Clients” layer includes both `pkg/apis` and `internal/apis` and `pkg/client`.

---

## 3. Top-level folders in detail

### 3.1 `pkg/` — reusable production code

`pkg/` contains the bulk of cert-manager’s logic. It is the first place to look for behavior changes.

| Subfolder | Role | Typical changes |
|---|---|---|
| `pkg/apis/` | **User-facing API types** (`cert-manager.io`, `acme.cert-manager.io`) | Adding CRD fields, new issuer config, new status fields |
| `pkg/api/` | API scheme and helpers: conditions, durations, issuer refs, names, usages | Condition semantics, issuer display names, key-usage mapping |
| `pkg/controller/` | Kubernetes reconcilers | Certificate lifecycle, issuance, renewal, ACME orders/challenges, shims, CA injection |
| `pkg/issuer/` | Issuer implementations and the issuer factory | Venafi, ACME, CA, Vault, SelfSigned behavior |
| `pkg/acme/` | ACME client, account handling, external DNS01 webhook API server | ACME protocol behavior, external solver contract |
| `pkg/webhook/` | Generic admission webhook server, plugin chain, decoders | Webhook server behavior, admission plumbing |
| `pkg/client/` | **Generated** clientset, informers, listers, apply configurations | Never hand-edit; regenerate |
| `pkg/util/` | Shared utilities: PKI, Kubernetes helpers, feature gates, predicates, profiling | Certificate parsing, CSR generation, config loading |
| `pkg/scheduler/` | Delayed work queue used by controllers | Retry/backoff scheduling |
| `pkg/metrics/` | Prometheus metrics | New metrics, labels, collectors |
| `pkg/server/` | TCP/TLS listeners and dynamic serving-certificate sources | Webhook TLS and certificate rotation |
| `pkg/healthz/` | Health-check helpers | Readiness/liveness behavior |
| `pkg/logs/` | Logging helpers and context loggers | Logging changes |
| `pkg/cainjector/` | Cainjector config-file types | Cainjector configuration |

Frequently edited `pkg/` locations:

```text
pkg/apis/certmanager/v1/types_certificate.go
pkg/apis/certmanager/v1/types_certificaterequest.go
pkg/apis/certmanager/v1/types_issuer.go
pkg/apis/acme/v1/
pkg/controller/certificates/requestmanager/
pkg/controller/certificaterequests/venafi/
pkg/issuer/venafi/client/request.go
pkg/issuer/acme/dns/
pkg/util/pki/
```

### 3.2 `pkg/apis/` — the CRD schemas users see

| Path | Contents |
|---|---|
| `pkg/apis/certmanager/v1/` | `Certificate`, `CertificateRequest`, `Issuer`, `ClusterIssuer` types and constants |
| `pkg/apis/acme/v1/` | `Order` and `Challenge` types |
| `pkg/apis/meta/v1/` | Shared metadata types such as issuer references and conditions |
| `pkg/apis/config/` | Component configuration file APIs (controller, webhook, cainjector) |
| `pkg/apis/experimental/v1alpha1/` | Experimental Kubernetes CSR integration types |

**Edit here when:** you add a field users should set in YAML, a new status condition, or a new issuer backend configuration.

After editing, the generated code, OpenAPI schema, and CRDs must be regenerated.

### 3.3 `pkg/controller/` — reconciliation loops

| Subfolder | Responsibility |
|---|---|
| `certificates/` | Certificate lifecycle. Sub-controllers: `keymanager`, `requestmanager`, `issuing`, `readiness`, `revisionmanager`, `trigger`, `metrics` |
| `certificaterequests/` | Per-issuer signing controllers: `acme`, `ca`, `selfsigned`, `vault`, `venafi`, plus `approver` and shared `util` |
| `certificatesigningrequests/` | The same idea for Kubernetes `certificates.k8s.io` CSRs |
| `acmeorders/` | Creates and advances ACME Orders |
| `acmechallenges/` | Creates solver resources and tracks Challenge status |
| `issuers/`, `clusterissuers/` | Issuer readiness and status |
| `certificate-shim/` | Creates Certificates from Ingress/Gateway resources (`ingresses/`, `gateways/`) |
| `cainjector/` | CA bundle injection reconciler |
| `globals/`, `configfile/`, `test/` | Shared controller context, config loading, test helpers |

**Edit here when:** you change *when* or *how* cert-manager reconciles an object. Examples:

- Renew earlier or later → `internal/controller/certificates/policies/`
- Change how a `CertificateRequest` is built → `pkg/controller/certificates/requestmanager/`
- Change how a Venafi request is signed → `pkg/controller/certificaterequests/venafi/`
- Change Ingress/Gateway shim behavior → `pkg/controller/certificate-shim/`

### 3.4 `pkg/issuer/` — issuer backends

| Path | Backend |
|---|---|
| `pkg/issuer/acme/` | ACME issuer, HTTP01 solver, DNS01 providers |
| `pkg/issuer/acme/dns/` | DNS providers: `route53`, `cloudflare`, `azuredns`, `clouddns`, `digitalocean`, `akamai`, `acmedns`, `rfc2136`, `webhook` |
| `pkg/issuer/acme/http/` | HTTP01 solver pod/service/Ingress/HTTPRoute creation |
| `pkg/issuer/ca/` | CA issuer backed by a Secret |
| `pkg/issuer/vault/` | HashiCorp Vault issuer |
| `pkg/issuer/venafi/` | Venafi TPP/Cloud issuer and `client/` vcert wrapper |
| `pkg/issuer/selfsigned/` | SelfSigned issuer |
| `pkg/issuer/factory.go` | Issuer registry resolving an Issuer/ClusterIssuer to an implementation |
| `pkg/issuer/fake/` | Test fakes |

**Edit here when:** you add or change an issuer backend, DNS provider, or ACME challenge solver.

### 3.5 `pkg/acme/` — ACME protocol and external solvers

- `pkg/acme/client/` — ACME client wrapper.
- `pkg/acme/accounts/` — account registration and key storage.
- `pkg/acme/webhook/` — API server and API types used by **external DNS01 solver webhooks**.
- `pkg/acme/util/` — small status/state helpers.

**Edit here when:** you change ACME account handling, order/challenge polling, or the external DNS01 webhook contract.

### 3.6 `pkg/webhook/` — admission plumbing (not validation rules)

- `admission/` — generic plugin chain, validators, mutators, custom decoders.
- `server/` — HTTPS webhook server, health endpoints, metrics, pprof.
- `configfile/` — webhook configuration file loading.
- `handlers/` — handler interfaces.

Actual validation rules live in `internal/apis/*/validation/` and `internal/webhook/admission/`.

### 3.7 `pkg/client/` — generated Kubernetes clients

Contains:

- `clientset/` — typed clients for cert-manager APIs
- `informers/` — shared informers
- `listers/` — listers
- `applyconfigurations/` — server-side apply builders

**Never edit by hand.** Run `make generate-all`.

### 3.8 `pkg/util/` — shared helpers

| Path | Purpose |
|---|---|
| `pkg/util/pki/` | X.509 templates, CSR generation/parsing, certificate chains, key helpers |
| `pkg/util/kube/` | Read TLS material from Kubernetes Secrets |
| `pkg/util/configfile/` | Config-file loading |
| `pkg/util/feature/` | Feature gates |
| `pkg/util/predicate/` | Controller-runtime predicates |
| `pkg/util/profiling/` | pprof handlers |
| `pkg/util/solverpicker/` | Selects an ACME solver |
| `pkg/util/cmapichecker/` | Checks whether cert-manager CRDs/webhooks are serving |
| `pkg/util/errors/` | Sentinel error types |

**Edit here when:** the change is about certificate cryptography, Kubernetes Secret access, feature gates, or shared controller predicates.

### 3.9 `internal/` — private production code

`internal/` is import-restricted by Go: only code under this module can import it.

| Subfolder | Role | Typical changes |
|---|---|---|
| `internal/apis/` | **Internal hub API types**, conversion, defaulting, validation, fuzzers, install | Add internal fields, validation rules, conversion logic |
| `internal/controller/` | Shared controller helpers and certificate policies | Renewal/issuance policy checks, server-side apply helpers |
| `internal/webhook/` | Admission plugins and webhook server assembly | Approval/identity/resource validation plugins |
| `internal/cainjector/` | Cainjector bundle and feature-gate code | CA bundle handling |
| `internal/informers/` | Shared and filtered informers, cache transformers | Memory reduction, Secret filtering |
| `internal/vault/` | Vault client and fakes | Vault API behavior |
| `internal/pem/` | PEM decoding helpers | Certificate/key parsing edge cases |
| `internal/kube/` | REST config construction | Client configuration |
| `internal/cmd/` | Shared CLI utilities | CLI plumbing used by multiple binaries |
| `internal/collectors/` | Prometheus collectors | Metrics collection |
| `internal/test/` | Test path helpers | Test support |
| `internal/generated/` | **Generated** OpenAPI definitions | Never edit; regenerate |

### 3.10 `internal/apis/` — where validation actually lives

This is the most important `internal/` folder for API changes.

```text
internal/apis/certmanager/
  types_certificate.go        # internal hub type, no JSON tags
  types_certificaterequest.go
  types_issuer.go
  v1/                         # conversion + defaults between internal and public v1
  validation/                 # admission validation rules
  fuzzer/                     # round-trip fuzz tests
  install/                    # scheme installation

internal/apis/acme/           # same pattern for Order/Challenge
internal/apis/config/         # component config APIs
```

**Rule:** if you add a field to `pkg/apis/certmanager/v1/types_certificate.go`, add the matching field to `internal/apis/certmanager/types_certificate.go`, and put validation in `internal/apis/certmanager/validation/certificate.go`.

### 3.11 `cmd/` — the five binaries

Each binary is its own Go module with `go.mod`, `main.go`, and `app/` wiring.

| Path | Binary | Startup / options |
|---|---|---|
| `cmd/controller/` | controller | `main.go` → `app/start.go` → `app/controller.go`, flags in `app/options/` |
| `cmd/webhook/` | webhook | `main.go` → `app/webhook.go` |
| `cmd/cainjector/` | cainjector | `main.go` → `app/cainjector.go` → `app/controller.go`, flags in `app/options/` |
| `cmd/acmesolver/` | acmesolver | `main.go` → `app/app.go` |
| `cmd/startupapicheck/` | startupapicheck | `main.go` → `pkg/check/`, `pkg/factory/` |

**Edit here when:** you add a CLI flag, a startup option, a new controller registration, or change process lifecycle/logging.

### 3.12 `deploy/` — what runs in the cluster

| Path | Contents |
|---|---|
| `deploy/crds/` | **Generated** CRD YAML for `Certificate`, `CertificateRequest`, `Issuer`, `ClusterIssuer`, `Order`, `Challenge` |
| `deploy/charts/cert-manager/` | Helm chart: `values.yaml`, `values.schema.json`, `templates/`, `Chart.template.yaml`, README template |
| `deploy/charts/cert-manager/templates/crd-*.yaml` | **Generated** CRDs embedded in the chart |
| `deploy/manifests/` | Namespace, helm-values overlay, README |
| `deploy/charts/cert-manager/templates/*-deployment.yaml` | Workloads for controller, webhook, cainjector, startupapicheck |
| `deploy/charts/cert-manager/templates/*-rbac.yaml` | ServiceAccounts, Roles, RoleBindings, ClusterRoles |
| `deploy/charts/cert-manager/templates/*-webhook*.yaml` | Webhook configuration and serving certificate wiring |

**Edit here when:** you change deployment shape, add a Helm value, change RBAC, ports, probes, resources, or the CRD manifests. For charts, no container image is needed; rebuild the chart.

### 3.13 `test/` — verification

| Path | Contents |
|---|---|
| `test/e2e/` | Ginkgo end-to-end suite: `suite/`, `framework/`, addons (Vault, pebble, ingress-nginx, etc.), `go.mod` |
| `test/integration/` | envtest-based integration tests per subsystem: certificates, certificaterequests, challenges, issuers, validation, webhook, ACME, RFC2136 |
| `test/unit/` | Shared unit-test helpers and generators (`gen/certificate.go`, crypto helpers, listers) |
| `test/acme/` | In-process ACME server used by tests |
| `test/fixtures/` | Upgrade fixtures |
| `test/apiserver/`, `test/webhook/` | Support servers for tests |

**Add tests here when:** you change a controller, issuer, webhook, or CLI. Unit tests normally live next to the code as `*_test.go`; integration and e2e tests live under `test/`.

### 3.14 `make/` — build system

| Path | Purpose |
|---|---|
| `make/00_mod.mk` | Repository-specific variables included first |
| `make/_shared/` | Shared make modules (vendored) |
| `make/_shared_new/` | Newer shared modules (Helm CRDs) |
| `make/02_mod.mk` | Includes all repository make modules |
| `make/server.mk` | Cross-compiles the five binaries |
| `make/containers.mk` | Builds container image tarballs |
| `make/test.mk` | Unit, integration, e2e targets |
| `make/e2e-setup.mk` | Kind cluster, image loading, test addons |
| `make/manifests.mk` | Helm chart and static manifests |
| `make/release.mk` | Release bundles and metadata |
| `make/ci.mk` | Codegen, verify, CI presubmit |
| `make/ko.mk` | Experimental ko build/push |
| `make/config/` | Kind, pebble, bind, Contour, Kyverno configs |

**Edit here when:** you add a build target, change image build behavior, change test setup, or update tool versions. Do not hand-edit `make/_shared/` unless you are changing the shared module; the source of truth is external.

### 3.15 `hack/` — generators and release helpers

| Path | Purpose |
|---|---|
| `hack/containers/Containerfile.*` | The five Containerfiles |
| `hack/k8s-codegen.sh` | Runs all Kubernetes code generators |
| `hack/boilerplate-*.txt` | License headers for generated files |
| `hack/latest-base-images.sh` | Refreshes distroless base-image digests |
| `hack/latest-kind-images.sh` | Refreshes pinned Kind images |
| `hack/artifact-metadata.template.json` | Release metadata template |
| `hack/extractcrd/`, `hack/openapi_reports/`, `hack/prune-junit-xml/`, `hack/util/` | Specialized tooling |

**Edit here when:** you add a code generator, change a Containerfile, or change release metadata.

### 3.16 `design/` — historical design proposals

Numbered design documents explaining why major features exist, such as:

- CertificateRequest CRD
- Extensible certificate controller
- CertificateRequest identity
- Server-side apply
- Timeouts
- Exponential backoff

**Read here before:** changing controller architecture, CertificateRequest semantics, or issuer behavior. Add a new design doc here for large features.

### 3.17 `.github/` — CI

- `workflows/` — GitHub Actions (govulncheck, self-upgrade, Renovate, scorecards)
- `ISSUE_TEMPLATE/`, `PULL_REQUEST_TEMPLATE.md`
- `renovate.json5`, `chainguard/`

**Edit here when:** you change automated checks or dependency-update policy.

### 3.18 `third_party/` — forked ACME client

`third_party/forked/acme/` is a fork of `golang.org/x/crypto/acme` with cert-manager changes. Do not patch it casually.

- Update with `make update-third-party`.
- Read `third_party/README.md` before adding a new fork.

### 3.19 Smaller folders and root files

| Path | Purpose |
|---|---|
| `docs/` | Redirects to cert-manager.io; also contains this guide and the image guide |
| `gcb/` | Google Cloud Build release pipeline (`make upload-release`) |
| `logo/` | Branding assets and license |
| `tools/` | Legacy compatibility wrapper; may be removed |
| `Makefile` | Entry point for the modular make system |
| `go.mod`, `go.sum` | Root Go module and dependency pins |
| `LICENSES`, `LICENSE` | License inventory and project license |
| `OWNERS`, `OWNERS_ALIASES` | Kubernetes ownership metadata |
| `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, etc. | Project documentation |

---

## 4. Dependency flow

```text
cmd/<binary>
  |
  +--> pkg/controller/*            (controller binary)
  |       |
  |       +--> pkg/issuer/*        (ACME/CA/Vault/Venafi/SelfSigned)
  |       +--> pkg/acme/*          (ACME client and solver webhook)
  |       +--> pkg/apis + internal/apis (types, validation, conversion)
  |       +--> pkg/client          (generated Kubernetes clients)
  |       +--> pkg/util/*          (PKI, kube, predicates, feature gates)
  |
  +--> pkg/webhook/* + internal/webhook/*   (webhook binary)
  +--> pkg/controller/cainjector/*          (cainjector binary)
  +--> pkg/issuer/acme/http/solver/*        (acmesolver binary)
  +--> cmd/startupapicheck/*                (startupapicheck binary)
```

At runtime:

```text
Kubernetes API
   |
   v
CertificateRequest  --->  issuer controller  --->  Venafi / ACME / Vault / CA
   ^
   |
Certificate controller (requestmanager, issuing, readiness, trigger)
```

The `Certificate` controller creates `CertificateRequest` objects. The issuer-specific `CertificateRequest` controller signs them. The `issuing` controller stores the result in the target Secret. The `readiness` and `trigger` controllers decide whether a certificate is valid and when to renew.

---

## 5. Change recipes

### 5.1 Change matrix

| Change | Primary files/folders | Regenerate | Image(s) to rebuild |
|---|---|---|---|
| Add a `Certificate` field (e.g. `caDN`) | `pkg/apis/certmanager/v1/types_certificate.go`, `internal/apis/certmanager/types_certificate.go` | `make generate-all` | controller; webhook if validation/conversion changes |
| Add a `CertificateRequest` field | `pkg/apis/certmanager/v1/types_certificaterequest.go`, `internal/apis/certmanager/types_certificaterequest.go` | `make generate-all` | controller, webhook |
| Change certificate renewal policy | `internal/controller/certificates/policies/` | none | controller |
| Change CertificateRequest creation | `pkg/controller/certificates/requestmanager/` | none | controller |
| Change Venafi request behavior | `pkg/controller/certificaterequests/venafi/`, `pkg/issuer/venafi/client/` | none | controller |
| Change ACME DNS provider | `pkg/issuer/acme/dns/<provider>/`, `pkg/apis/certmanager/v1/types_issuer.go` | `make generate-all` if API changed | controller; webhook if validation changed |
| Add a new issuer backend | `pkg/issuer/<name>/`, `pkg/controller/certificaterequests/<name>/`, `pkg/apis/certmanager/v1/types_issuer.go`, `internal/apis/certmanager/types_issuer.go`, `cmd/controller/app/start.go`, `internal/apis/config/controller/v1alpha1/defaults.go` | `make generate-all` | controller, webhook |
| Add an admission validation | `internal/apis/certmanager/validation/`, `internal/webhook/admission/` | none | webhook |
| Change CA injection | `pkg/controller/cainjector/`, `internal/cainjector/` | none | cainjector |
| Change ACME HTTP01 solver | `pkg/issuer/acme/http/solver/`, `cmd/acmesolver/` | none | acmesolver |
| Change startup check | `cmd/startupapicheck/` | none | startupapicheck |
| Add a controller | `pkg/controller/<name>/`, `cmd/controller/app/` | none | controller |
| Add a CLI flag | `cmd/<binary>/app/options/` | none | that binary |
| Change component config API | `pkg/apis/config/`, `internal/apis/config/` | `make generate-all` | relevant binary(ies) |
| Change Helm chart | `deploy/charts/cert-manager/` | `make helm-chart` / `generate-helm-docs` | none |
| Change CRD schema | `pkg/apis/...` | `make generate-all` | controller + webhook |
| Upgrade Go/base image | `go.mod`, `make/base_images.mk` | `make generate-all` | all five |

### 5.2 Worked example: add `spec.caDN` for Venafi TPP

This is a complete example of adding a CRD field and plumbing it to an issuer.

#### Why it touches multiple folders

```text
pkg/apis (public field)
   -> internal/apis (hub field + conversion)
   -> pkg/controller/certificates/requestmanager (copy to CertificateRequest)
   -> pkg/apis CertificateRequestSpec + internal/apis (CR field)
   -> pkg/controller/certificaterequests/venafi (read the field)
   -> pkg/issuer/venafi/client (set vcert Request.CADN)
   -> deploy/crds + chart (schema)
```

#### Files to edit

| File | Change |
|---|---|
| `pkg/apis/certmanager/v1/types_certificate.go` | Add `CADN string \`json:"caDN,omitempty"\`` to `CertificateSpec` |
| `pkg/apis/certmanager/v1/types_certificaterequest.go` | Add the same field to `CertificateRequestSpec` |
| `internal/apis/certmanager/types_certificate.go` | Add `CADN string` |
| `internal/apis/certmanager/types_certificaterequest.go` | Add `CADN string` |
| `pkg/controller/certificates/requestmanager/requestmanager_controller.go` | `CADN: crt.Spec.CADN` in the `CertificateRequestSpec` literal |
| `pkg/controller/certificaterequests/venafi/venafi.go` | Read `cr.Spec.CADN`, pass it to the client |
| `pkg/issuer/venafi/client/venaficlient.go` | Add `cadn string` to the `Interface` methods |
| `pkg/issuer/venafi/client/request.go` | Thread `cadn` through and set `vreq.CADN = cadn` |
| `pkg/issuer/venafi/client/fake/venafi.go` | Update fake method signatures |
| `pkg/controller/certificatesigningrequests/venafi/venafi.go` | Pass `""` (or add a CSR annotation) |
| Venafi tests | Assert `req.CADN` is set |

#### Code snippets

In `CertificateSpec`:

```go
// CADN is the distinguished name of the CA in Venafi TPP that should
// issue this certificate, for example `\VED\Policy\MyPolicy\MyCA`.
// Only used by the Venafi TPP issuer; ignored by other issuers.
// +optional
CADN string `json:"caDN,omitempty"`
```

In the request manager:

```go
Spec: cmapi.CertificateRequestSpec{
    Duration:  crt.Spec.Duration,
    IssuerRef: crt.Spec.IssuerRef,
    Request:   csrPEM.Bytes(),
    IsCA:      crt.Spec.IsCA,
    Usages:    crt.Spec.Usages,
    CADN:      crt.Spec.CADN,
},
```

In the Venafi client:

```go
vreq := newVRequest(tmpl, duration)
vreq.CADN = cadn
```

vcert already has `CADN string` on `certificate.Request`, and the TPP connector forwards it. Venafi Cloud ignores it.

#### Regenerate and test

```bash
make generate-all
make verify

# Focused tests
make WHAT=./pkg/issuer/venafi/... test
make WHAT=./pkg/controller/certificaterequests/venafi/... test
make WHAT=./pkg/controller/certificates/requestmanager/... test

# Full unit suite
make unit-test
```

The generated files you should expect to change:

```text
internal/apis/certmanager/v1/zz_generated.conversion.go
pkg/apis/certmanager/v1/zz_generated.deepcopy.go
internal/apis/certmanager/zz_generated.deepcopy.go
internal/generated/openapi/zz_generated.openapi.go
pkg/client/applyconfigurations/certmanager/v1/certificatespec.go
pkg/client/applyconfigurations/certmanager/v1/certificaterequestspec.go
deploy/crds/cert-manager.io_certificates.yaml
deploy/crds/cert-manager.io_certificaterequests.yaml
deploy/charts/cert-manager/templates/crd-cert-manager.io_certificates.yaml
deploy/charts/cert-manager/templates/crd-cert-manager.io_certificaterequests.yaml
```

#### Build images

API and controller changes mean rebuild:

- `controller` — copies `caDN` from Certificate to CertificateRequest and sends it to Venafi.
- `webhook` — serves conversion/defaulting/validation and compiles the regenerated API conversions.

```bash
make VERSION=v1.21.0-cadn.1 \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz \
  _bin/containers/cert-manager-webhook-linux-amd64.tar.gz
```

`cainjector`, `acmesolver`, and `startupapicheck` do not need rebuilding.

#### Publish to the OpenShift internal registry

```bash
docker load -i _bin/containers/cert-manager-controller-linux-amd64.tar.gz
docker load -i _bin/containers/cert-manager-webhook-linux-amd64.tar.gz

REGISTRY_HOST=$(oc get route default-route -n openshift-image-registry \
  -o jsonpath='{.spec.host}')

docker login "$REGISTRY_HOST" -u "$(oc whoami)" -p "$(oc whoami -t)"

docker tag cert-manager-controller-amd64:v1.21.0-cadn.1 \
  "$REGISTRY_HOST/cert-manager/cert-manager-controller:cadn"
docker tag cert-manager-webhook-amd64:v1.21.0-cadn.1 \
  "$REGISTRY_HOST/cert-manager/cert-manager-webhook:cadn"

docker push "$REGISTRY_HOST/cert-manager/cert-manager-controller:cadn"
docker push "$REGISTRY_HOST/cert-manager/cert-manager-webhook:cadn"
```

#### Deploy on OpenShift

```bash
make helm-chart
make static-manifests

# CRDs first: otherwise the API server prunes spec.caDN
oc apply -f _bin/yaml/cert-manager.crds.yaml

helm upgrade --install cert-manager _bin/cert-manager-<VERSION>.tgz \
  --namespace cert-manager --create-namespace \
  --set crds.enabled=true \
  --set image.repository=image-registry.openshift-image-registry.svc:5000/cert-manager/cert-manager-controller \
  --set image.tag=cadn \
  --set webhook.image.repository=image-registry.openshift-image-registry.svc:5000/cert-manager/cert-manager-webhook \
  --set webhook.image.tag=cadn
```

#### Test in the cluster

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

```bash
oc apply -f cadn-certificate.yaml

oc get certificate -n my-app cadn-test -w
oc get certificaterequest -n my-app -o yaml | grep -i -A2 cadn
oc logs -n cert-manager deploy/cert-manager -f | grep -i venafi

oc get secret -n my-app cadn-test-tls -o jsonpath='{.data.tls\.crt}' \
  | base64 -d | openssl x509 -noout -issuer -subject
```

Check in Venafi TPP that the request was created under the expected CA.

**Important:** if the `CertificateRequest` already has the Venafi pickup-ID annotation, changing `caDN` will not affect that in-flight request. Delete the `CertificateRequest` to start a new one.

The complete image/build/testing version of this example is in
[`docs/cert-manager-images-and-cadn.md`](./cert-manager-images-and-cadn.md).

### 5.3 Other change recipes

#### Add a new issuer backend

1. **API config:** add a new struct and field to `pkg/apis/certmanager/v1/types_issuer.go` (and `internal/apis/certmanager/types_issuer.go`).
2. **Validation:** add rules in `internal/apis/certmanager/validation/issuer.go`.
3. **Issuer implementation:** create `pkg/issuer/<name>/` implementing `Setup`.
4. **CertificateRequest signing:** create `pkg/controller/certificaterequests/<name>/` implementing `Sign`.
5. **Registration:**
   - Register the issuer package with `issuer.RegisterIssuer` and blank-import it in `cmd/controller/app/start.go`.
   - Register the CertificateRequest controller with `controllerpkg.Register` and add its `ControllerName` to both `AllControllers` and `DefaultEnabledControllers` in `internal/apis/config/controller/v1alpha1/defaults.go`.
   - Register the webhook validation plugin in `internal/webhook/webhook.go` if needed.
6. **Generated code:** `make generate-all`.
7. **Tests:** unit tests next to the code, plus `test/integration/issuers/` and `test/e2e/suite/issuers/<name>/`.
8. **Images:** controller + webhook.

#### Add a DNS01 provider

1. Create `pkg/issuer/acme/dns/<provider>/` implementing `Present` and `CleanUp`.
2. Wire it into `pkg/issuer/acme/dns/dns.go`.
3. Add provider config fields to `pkg/apis/certmanager/v1/types_issuer.go` and `internal/apis/certmanager/types_issuer.go`.
4. Add validation in `internal/apis/certmanager/validation/issuer.go`.
5. Add dependencies to the root `go.mod` (and any binary `go.mod` that needs them).
6. `make generate-all`, then unit tests and `test/e2e/suite/issuers/acme/dnsproviders/`.
7. **Image:** controller. Rebuild webhook only if validation rules changed.

#### Add an admission validation

1. Add the rule to `internal/apis/<group>/validation/<resource>.go`.
2. Add table-driven tests in the matching `*_test.go`.
3. If the rule needs a new admission plugin, add it under `internal/webhook/admission/` and register it in `internal/webhook/webhook.go`.
4. **Image:** webhook. No CRD change unless the API schema changed.

#### Change certificate renewal or issuance policy

1. Edit `internal/controller/certificates/policies/checks.go` and `policies.go`.
2. Add tests in the same package.
3. **Image:** controller.

#### Add or change a controller

1. Create `pkg/controller/<name>/`.
2. Implement the controller and its informers/listers, and register it with `controllerpkg.Register`.
3. Blank-import it in `cmd/controller/app/start.go`.
4. Add its `ControllerName` to `AllControllers` and `DefaultEnabledControllers` in `internal/apis/config/controller/v1alpha1/defaults.go`.
5. Add unit tests next to it.
6. **Image:** controller.

#### Add a CLI flag

1. Edit `cmd/<binary>/app/options/options.go` (and the config API under `pkg/apis/config/` + `internal/apis/config/` if the flag is also a config-file field).
2. Update `cmd/<binary>/app/*.go` to consume it.
3. `make generate-all` if a config API changed.
4. **Image:** that binary only; plus webhook if the webhook config API changed.

#### Change the Helm chart

1. Edit `deploy/charts/cert-manager/values.yaml` and `templates/*.yaml`.
2. Run `make generate-helm-docs` and `make generate-helm-schema` if values changed.
3. `make helm-chart` and `make verify-helm-values`.
4. **Images:** none. Rebuild the chart only.

#### Change metrics

1. Add or edit `pkg/metrics/*.go`.
2. Call the metric from the relevant controller or issuer.
3. Update tests and dashboards if applicable.
4. **Image:** controller (or whichever component emits the metric).

#### Change cainjector

1. Edit `pkg/controller/cainjector/` or `internal/cainjector/`.
2. Update `internal/cainjector/feature/` if a feature gate is involved.
3. **Image:** cainjector.

#### Change the ACME HTTP01 solver

1. Edit `pkg/issuer/acme/http/solver/` and/or `pkg/issuer/acme/http/`.
2. Edit `cmd/acmesolver/app/app.go` if the solver CLI changes.
3. **Image:** acmesolver (and controller if solver creation changed).

#### Change startup checks

1. Edit `cmd/startupapicheck/`.
2. **Image:** startupapicheck.

#### Upgrade Go or the distroless base image

1. Update `go.mod` / `go.sum` and `make/base_images.mk` (the latter via `make update-base-images`).
2. Run `make generate-all` and `make verify`.
3. **Images:** all five.

---

## 6. “Where do I edit?” lookup table

| I want to change… | Go to |
|---|---|
| `Certificate` YAML fields | `pkg/apis/certmanager/v1/types_certificate.go` + `internal/apis/certmanager/types_certificate.go` |
| `CertificateRequest` YAML fields | `pkg/apis/certmanager/v1/types_certificaterequest.go` + `internal/apis/certmanager/types_certificaterequest.go` |
| Issuer/ClusterIssuer config | `pkg/apis/certmanager/v1/types_issuer.go` + `internal/apis/certmanager/types_issuer.go` |
| CRD validation rules | `internal/apis/certmanager/validation/`, `internal/apis/acme/validation/` |
| Conversion/defaulting | `internal/apis/*/v1/` (generated conversion + handwritten defaults) |
| Certificate renewal policy | `internal/controller/certificates/policies/` |
| CertificateRequest creation | `pkg/controller/certificates/requestmanager/` |
| Certificate issuance/storage | `pkg/controller/certificates/issuing/` |
| Certificate readiness | `pkg/controller/certificates/readiness/` |
| Revision history | `pkg/controller/certificates/revisionmanager/` |
| Venafi behavior | `pkg/controller/certificaterequests/venafi/` + `pkg/issuer/venafi/client/` |
| ACME order/challenge behavior | `pkg/controller/acmeorders/`, `pkg/controller/acmechallenges/`, `pkg/issuer/acme/` |
| ACME DNS providers | `pkg/issuer/acme/dns/<provider>/` |
| ACME HTTP01 solver | `pkg/issuer/acme/http/` + `cmd/acmesolver/` |
| Vault behavior | `pkg/issuer/vault/` + `internal/vault/` |
| CA issuer | `pkg/issuer/ca/` |
| SelfSigned issuer | `pkg/issuer/selfsigned/` |
| Ingress/Gateway shim | `pkg/controller/certificate-shim/` |
| Webhook admission plugins | `internal/webhook/admission/` + `internal/webhook/webhook.go` |
| Webhook TLS/server | `pkg/server/`, `pkg/webhook/server/` |
| CA injection | `pkg/controller/cainjector/` + `internal/cainjector/` |
| Feature gates | `internal/controller/feature/`, `internal/webhook/feature/`, `pkg/util/feature/` |
| Metrics | `pkg/metrics/` |
| Health/readiness | `pkg/healthz/`, `cmd/*/app/` |
| Kubernetes clients/informers | `pkg/client/` (generated) |
| CRD YAML | `deploy/crds/` (generated) |
| Helm values/templates | `deploy/charts/cert-manager/` |
| Static manifests | `make static-manifests` → `_bin/yaml/` |
| Containerfiles | `hack/containers/` |
| Image build rules | `make/containers.mk`, `make/server.mk`, `make/base_images.mk` |
| Make/test/e2e targets | `make/test.mk`, `make/e2e-setup.mk` |
| Code generation | `hack/k8s-codegen.sh`, `make generate-all` |
| CI checks | `.github/workflows/`, `make ci-presubmit` |
| E2E tests | `test/e2e/suite/` |
| Integration tests | `test/integration/` |
| Design rationale | `design/` |

---

## 7. Generated vs handwritten code

### Do not edit these by hand

| Path | Generated by |
|---|---|
| `**/zz_generated.*.go` | `deepcopy-gen`, `conversion-gen`, `defaulter-gen`, `openapi-gen` |
| `pkg/client/clientset/` | `client-gen` |
| `pkg/client/informers/` | `informer-gen` |
| `pkg/client/listers/` | `lister-gen` |
| `pkg/client/applyconfigurations/` | `applyconfiguration-gen` |
| `internal/generated/openapi/` | `openapi-gen` |
| `deploy/crds/*.yaml` | `controller-gen` |
| `deploy/charts/cert-manager/templates/crd-*.yaml` | `generate-crds` |
| `deploy/charts/cert-manager/values.schema.json` | `generate-helm-schema` |
| `deploy/charts/cert-manager/README.md` | `generate-helm-docs` |
| `LICENSES`, `cmd/*/LICENSES` | `generate-go-licenses` |
| `make/kind_images.sh` | `hack/latest-kind-images.sh` |
| `make/base_images.mk` | `hack/latest-base-images.sh` |
| `go.sum` | `go mod tidy` / `make generate-go-mod-tidy` |

### Regeneration commands

```bash
make generate-all        # everything below
make generate-codegen    # clients, deepcopy, conversion, openapi, applyconfigs
make generate-crds       # CRD YAML + chart CRD templates
make generate-helm-docs  # chart README
make generate-helm-schema
make generate-licenses
make generate-go-mod-tidy
```

Verify generated files are current:

```bash
make verify
# or the CI-equivalent without Go tests
make ci-presubmit
```

---

## 8. Testing map

| Test type | Location | Command |
|---|---|---|
| Unit tests | Next to the code, `*_test.go` | `make unit-test` or `make WHAT=./pkg/... test` |
| Integration tests | `test/integration/<area>/` | `make integration-test` |
| End-to-end tests | `test/e2e/suite/` | `make e2e-setup` then `make e2e` |
| Fuzz tests | `internal/apis/*/fuzzer/`, `pkg/**/fuzz_test.go`, `test/integration/fuzz/` | `make test` / focused `go test` |
| API round-trip | `internal/apis/*/fuzzer/` | `make WHAT=./internal/apis/... test` |
| Chart validation | `deploy/charts/cert-manager/` | `make verify-helm-values`, `make verify-helm-lint` |
| Generated-code freshness | repo-wide | `make verify` |
| Vulnerabilities | repo-wide | `make verify-govulncheck` |

Focused examples:

```bash
# Venafi client
make WHAT=./pkg/issuer/venafi/... test

# Certificate request manager
make WHAT=./pkg/controller/certificates/requestmanager/... test

# Admission validation
make WHAT=./internal/apis/certmanager/validation/... test

# Webhook plugins
make WHAT=./internal/webhook/... test
```

For e2e tests, add specs under the relevant suite:

```text
test/e2e/suite/issuers/venafi/
test/e2e/suite/issuers/acme/dnsproviders/
test/e2e/suite/conformance/
```

---

## 9. OpenShift and the internal registry

The cluster runs the five images built from `cmd/`. For OpenShift:

1. Build the required component for `linux/amd64`.
2. Push it to the OpenShift internal registry.
3. Deploy with the Helm chart and set the per-component image repository/tag.

Minimal example:

```bash
make VERSION=v1.21.0-custom \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz

docker load -i _bin/containers/cert-manager-controller-linux-amd64.tar.gz

REGISTRY_HOST=$(oc get route default-route -n openshift-image-registry \
  -o jsonpath='{.spec.host}')

docker login "$REGISTRY_HOST" -u "$(oc whoami)" -p "$(oc whoami -t)"
docker tag cert-manager-controller-amd64:v1.21.0-custom \
  "$REGISTRY_HOST/cert-manager/cert-manager-controller:custom"
docker push "$REGISTRY_HOST/cert-manager/cert-manager-controller:custom"
```

Use the in-cluster reference in Helm:

```text
image-registry.openshift-image-registry.svc:5000/cert-manager/cert-manager-controller:custom
```

If the OpenShift cert-manager Operator manages the installation, custom images are not simply swappable; use the upstream Helm chart or build a custom Operator bundle.

See [`docs/cert-manager-images-and-cadn.md`](./cert-manager-images-and-cadn.md) for the complete build/push/test workflow.

---

## 10. Quick command reference

```bash
# Understand the build
make help
make which-go

# Generate and verify
make generate-all
make verify
make ci-presubmit

# Test
make unit-test
make test
make integration-test
make WHAT=./pkg/issuer/venafi/... test

# Build binaries
make server-binaries

# Build one image for OpenShift amd64
make VERSION=v1.21.0-custom \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz

# Build all five for one architecture
make VERSION=v1.21.0-custom \
  _bin/containers/cert-manager-controller-linux-amd64.tar.gz \
  _bin/containers/cert-manager-webhook-linux-amd64.tar.gz \
  _bin/containers/cert-manager-cainjector-linux-amd64.tar.gz \
  _bin/containers/cert-manager-acmesolver-linux-amd64.tar.gz \
  _bin/containers/cert-manager-startupapicheck-linux-amd64.tar.gz

# Chart and manifests
make helm-chart
make static-manifests

# Everything except signed artifacts
make GOMAXPROCS=2 -j4 release-artifacts

# Local Kind cluster
make e2e-setup-kind
make -j e2e-setup
make e2e
```
