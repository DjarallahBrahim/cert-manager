# cert-manager release analysis: everything after v1.19.6

**Prepared for:** our OpenShift + Venafi TPP deployment (upstream Helm chart, custom image builds, internal registry)
**Current tree:** `v1.19.6-2-g5f0174bec` (Go 1.25.0, Containerfiles `USER 1000`)
**Data source:** GitHub Releases API, `cert-manager/cert-manager`, retrieved 2026-10-18
**Status:** living document — update when new patch releases ship

---

## 0. Scope

This document covers all stable releases numerically newer than v1.19.6.

Note the quirk: **v1.20.0–v1.20.2 were published *before* v1.19.6 in time** (cert-manager maintains parallel release branches), but they are newer versions, so they are included here.

**There is no v1.19.7.** v1.19.6 (2026-06-25) is the last release in the 1.19 line. See §7.1 for why this matters.

Prereleases (`1.20.0-alpha.*`, `1.20.0-beta.0`, `1.21.0-alpha.*`, `1.21.0-beta.0`) are excluded; only GA releases are analyzed.

---

## 1. Release inventory

| Version | Date | Type | Headline |
|---|---|---|---|
| 1.20.0 | 2026-03-10 | minor | ListenerSet alpha, Azure Private DNS, OtherNames→Beta, **Venafi custom-fields annotation**, Venafi→CyberArk rebrand, **UID→65532** |
| 1.20.1 | 2026-03-27 | patch | **OpenShift finalizer RBAC fix (unblocked 1.20.0 upgrade)** |
| 1.20.2 | 2026-04-11 | patch | Helm YAML fix (`webhook.config` + `webhook.volumes`), Go 1.26.2 |
| 1.20.3 | 2026-06-25 | patch | **GHSA-8rvj-mm4h-c258 (HIGH)**, challenge owner-ref removal |
| 1.20.4 | 2026-09-16 | patch | Large CVE batch, **distroless digests updated**, ingress-shim applyset fix |
| 1.21.0 | 2026-07-08 | minor | ARI, Vault AWS IAM, renewalPolicies, waitInsteadOfSelfCheck, **3 breaking Helm/RBAC changes** |
| 1.21.1 | 2026-07-29 | patch | Fixes 1.21.0 regressions (panic, log spam, stuck issuer) |
| 1.21.2 | 2026-09-11 | patch | Panics, data races, **ACME/Vault response-body disclosure hardening**, Go 1.26.8 |

---

## 2. CVE / security fixes

| Where | Severity | Item |
|---|---|---|
| **1.19.6 (already deployed)** | **HIGH** | GHSA-8rvj-mm4h-c258 — removed `Challenge` `create` and `Order` `create/patch/update` from the `cert-manager-edit` aggregate ClusterRole |
| 1.20.0 | MODERATE | Controller panic on reordered cached DNS response → DoS (#8469) |
| 1.20.0 | — | Go 1.25.5: CVE-2025-61727, CVE-2025-61729 |
| 1.20.3 | — | Go 1.26.4: CVE-2026-27145, CVE-2026-42504, CVE-2026-42507 |
| 1.20.4 | — | Go 1.26.6 (crypto/tls, asn1, xml, html/template, net/http, net/url); `x/net` v0.58.0 (CVE-2026-46600); `x/text` v0.41.0 (CVE-2026-56852); `x/crypto` v0.55.0 (CVE-2026-56854); `grpc` v1.83.2 (CVE-2026-84304, CVE-2026-84445, CVE-2026-84303, GHSA-hrxh-6v49-42gf); `cel-go` v0.30.0 (GHSA-gcjh-h69q-9w9g); `go-pkcs12` v0.7.2 (GHSA-mpwr-8vm7-h73f) |
| 1.21.0 | — | Vault path traversal — webhook rejects `..` segments (#8930); DNS-over-HTTPS OOM capped at 128 KB (#8803) |
| 1.21.1 | — | `x/text` v0.40.0, `grpc` v1.82.1, `cel-go` v0.29.0, `otel` v1.44.0 |
| 1.21.2 | — | Go 1.26.8; `grpc` v1.83.2; `x/crypto` v0.56.0; **ACME/Vault response bodies no longer copied into status/Events** (#9239, #9262); ACME body cap 16 MiB (#9222); HTTP-01 self-check body no longer reflected in `Challenge.status.reason` (#9232); webhook panics on incomplete AdmissionReview + **validation now enforced on converted non-v1 API versions** (#9235); Vault ambient AWS creds restricted for namespaced `Issuer` (#9231) |

### ⚠️ Backport gap

The September 2026 CVE batch (`x/net`, `x/text`, `x/crypto`, `grpc`, `cel-go`, `pkcs12`, Go 1.26.6) shipped **only in 1.20.4 and 1.21.2** — there is **no 1.19 equivalent**. Staying on 1.19.6 leaves those CVEs present in our tree.

### Scanner noise note (1.20.4)

Three `x/crypto` findings — CVE-2026-56855, CVE-2026-78662, GO-2026-5932 — are **not** fixed in the 1.20 line, because the fix requires the Go 1.26 language version. None affects cert-manager (it never opens an SSH connection; `govulncheck` confirms the vulnerable functions are not called). cert-manager 1.21 uses `x/crypto` v0.56.0 and scans clean.

**This matters if our pipeline fails builds on Trivy/Grype HIGH findings** — in that case the 1.20 line cannot clear the gate and 1.21 is required.

---

## 3. Breaking changes

| Version | Change | Impact on us |
|---|---|---|
| 1.20.0 | Default container **UID 1000 → 65532**, **GID 0 → 65532** (#8408) | Our Containerfiles and `docs/openshift-base-images.md` explicitly assume `USER 1000` — see §7.3 |
| 1.20.0 | Metrics `app` label is now always `cert-manager` (previously namespace/release-derived) (#8162) | Breaks dashboards/alerts keying on the old label |
| 1.21.0 | Helm chart **no longer ships the default `tokenrequest` Role/RoleBinding** (`serviceaccounts/token: create`) (#8931) | Our chart still ships it — see §7.6 |
| 1.21.0 | `cert-manager-edit` no longer grants Challenge `create` / Order `create/patch/update` (GHSA-8rvj-mm4h-c258) | Already present in our 1.19.6 |
| 1.21.0 | **Removed** Helm values `prometheus.servicemonitor.targetPort`, `prometheus.servicemonitor.path`, `prometheus.podmonitor.path`; controller Service metrics port renamed `tcp-prometheus-servicemonitor` → `http-metrics` (#8952) | Chart schema uses `additionalProperties: false` → **upgrade fails** if these are set — see §7.5 |
| 1.21.0 | `enableGatewayAPI` / `enableGatewayAPIListenerSet` deprecated → `gatewayAPI.enabled` / `gatewayAPI.enableListenerSet` (#8732) | Update controller config (old fields still work) |
| 1.20.0 | `DefaultPrivateKeyRotationPolicyAlways` → GA, can no longer be disabled (#8287) | Only if we relied on disabling the gate |
| 1.21.0 | `CAInjectorMerging` → GA (unconditionally enabled); `ServerSideApply` gate deprecated, cainjector SSA unconditional (#8583, #8692) | Low risk unless we relied on toggling those gates |

---

## 4. Logic / behavior changes (non-breaking)

### 1.20.0
- Duration/RenewBefore annotation changes on Ingress and Gateway API resources now trigger certificate updates (#8232)
- ACME challenge TXT records cleaned up correctly with many CloudDNS records (#8456)
- DigitalOcean DNS-01 retry fix; detailed DNS-01 errors surfaced in Challenge events (#8221)
- Infinite re-issuance loop fixed when an issuer returns a cert whose public key doesn't match the CSR (#8403)
- HTTP-01 challenges fixed when the `Host` header contains an IPv6 address (#8424)
- HTTP-01 Gateway solver no longer creates invalid HTTPRoutes for IP-address DNS names (#8443)
- Reverted API defaults for `issuerRef` kind/group introduced in 0.19.0 (#8173); fixed 1.19.x spurious renewal (#8160)
- Challenge finalizer updates switched to server-side apply (#8519)

### 1.21.0
- ACME challenges no longer terminally fail on transient network errors (TLS timeouts, DNS failures, context cancellation) (#8760)
- Infinite re-issuance loop fixed when an issuer returns an already-expired certificate (#8610)
- **Integer overflow in `renewBeforePercentage`** for durations longer than ~3 years (#8947)
- Webhook serving certificate renews correctly after system suspend / VM live migration (#8464)
- CertificateRequest approval webhook performance: negative CRD-discovery results cached 30 s (#8651)
- DNS issuer secrets validated before the Issuer is marked Ready (#8255) — this is the cause of the known "stuck `InvalidSolver`" issue, fixed in 1.21.1
- cainjector `--ignore-namespaces` flag (#8614)
- ClusterIssuer metrics collector respects enabled-controllers config (#8822)
- Client-side rate-limiting disabled when API Priority & Fairness is enabled (#8757)
- cert-shim processes `cert-manager.io/alt-names` and `cert-manager.io/ip-sans` annotations (#8927)
- `nextPrivateKeySecretName` matching logic corrected (#8577)

### 1.21.1 — fixes 1.21.0 regressions
- Controller panic when `spec.renewal.policy: Disabled` (#9038)
- Log spam and dropped Secret informer events for non-cert-manager Secrets (#9037)
- Issuer/ClusterIssuer stuck at `Ready=False / InvalidSolver` after a missing ACME DNS-01 solver Secret is created (#9083)
- Commented Gateway API example in Helm values used invalid `gatewayAPI.enable` (#9012)

### 1.21.2
- HTTP-01 solver cleanup no longer fails with `NotFound` when resources are already deleted (#9278)
- `replaces` field populated on the wrong issuer when issuers change (#9236)
- Data race in the ACME HTTP-01 self-check with custom DNS servers (#9313)
- Panic in the certificates-issuing controller when a CertificateRequest has a failure time but no Ready condition (#9238)
- Race in `pkg/scheduler` where timer cleanup could cancel a newer timer (#9312)
- Feb-29 cron schedules across non-leap century years (#9240)
- De-duplicate `dnsNames` when multiple Gateway/ListenerSet listeners share a Secret (#9234)
- Ingress-shim no longer removes the applyset label from cached Ingress/Gateway objects (#9314)

---

## 5. New features

### 1.20.0
- NetworkPolicy flags for all deployed containers (#8370)
- CRD selectable fields for `.spec.issuerRef.{group,kind,name}` (#8256)
- `imagePullSecrets` in the `startupapicheck` Job template (#8186)
- `extraContainers` Helm value for arbitrary sidecars (#8355)
- `parentRef` override annotations on Certificate (#8518)
- Azure Private DNS zones for the DNS-01 issuer (#8494)
- Configurable PEM decoding size limits (#7642)
- `unhealthyPodEvictionPolicy` for the PodDisruptionBudget (#7728)
- **`venafi.cert-manager.io/custom-fields` on Issuer/ClusterIssuer as a base, with override/append at Certificate level (#8301)** — see §6
- Ingress annotation `acme.cert-manager.io/http01-ingress-ingressclassname` (#8244)
- `global.nodeSelector` now merges instead of replacing (#8195)
- Vault issuers include the Vault server address as a default service-account-token audience (#8228)
- Experimental `XListenerSets` feature gate (#8394); promoted to `ListenerSets` (#8501)
- `OtherNames` promoted to Beta and enabled by default (#8288)
- ACME client forked from `golang.org/x/crypto` (#8268)

### 1.21.0
- **ACME Renewal Information (ARI / RFC 9773)** behind the `ACMEUseARI` gate (#8798)
- `waitInsteadOfSelfCheck` solver option for split-horizon DNS / NAT hairpin (#8858)
- **Vault AWS IAM authentication**: IRSA, EKS Pod Identity, ambient EC2/ECS credentials (#8422)
- `renewalPolicies` field on Certificate (#8258)
- `certificateRequestMaximumBackoffDuration` / `--certificate-request-maximum-backoff-duration` (default 32h) (#8893)
- **Modern2026 PKCS#12 profile** (AES-256 + SHA-256, FIPS 140-3 compatible) (#8841)
- HTTP-01 ListenerSet `parentRef` fallback annotation (#8749)
- `cert-manager.io/ignore-tls-listeners` annotation (#8727)
- Configurable additional listener protocols for Gateway API (#8683)
- `runtimeClassName` for components and ACME HTTP-01 solver pods (#8791, #8976)
- `startupapicheck.ttlSecondsAfterFinished` (#8523)
- `--acme-http01-solver-extra-labels` (#8761)
- **Venafi OAuth token request observability + new `AuthFailed` Issuer condition reason (#8808)**
- **PANW NGTS supported as a Venafi/CyberArk backend (#8779)**

---

## 6. 🎯 Venafi-specific changes (consolidated)

| # | Version | PR | Change | Relevance |
|---|---|---|---|---|
| 1 | 1.20.0 | #8301 | `venafi.cert-manager.io/custom-fields` is now readable **on the Issuer/ClusterIssuer as a base**, with override/append at Certificate level | **Closest upstream analogue to our CADN annotation plan** — see §7.7 |
| 2 | 1.20.0 | #8215 | Venafi Issuer **rebranded to CyberArk** | Cosmetic (naming/docs/logs) — check anything grepping names or conditions |
| 3 | 1.21.0 | #8808 | Venafi OAuth token observability + new **`AuthFailed`** Issuer condition reason | Distinguishes bad credentials from transient errors; improves troubleshooting |
| 4 | 1.21.0 | #8843 | Fixes a **Venafi TPP setup/signing regression** introduced by #8808 (vcert connector auth restored in the client constructor) | Included in the 1.21.0 final release |
| 5 | 1.21.0 | #8779 | **PANW NGTS** supported as a Venafi backend | Only relevant if we migrate to NGTS |

**Invariant:** `CADN` remains **TPP-only**. Venafi Cloud and PANW NGTS do not use the CA-template model.

---

## 7. 🎯 Impact on our OpenShift + Venafi use case

### 7.1 We are effectively on an EOL patch line

No v1.19.7 exists. The September 2026 CVE batch went to 1.20.4 / 1.21.2 only. **To receive current security fixes we must move to ≥1.20.4 or 1.21.2.**

Given the 1.21.0 → 1.21.1 regression churn, recommended target: **1.21.2**, or **1.20.4** if we need to stay conservative.

### 7.2 ⛔ Do NOT deploy 1.20.0 on OpenShift

> "Add missing issuer finalizer RBAC to the order controller to support owner references. **This was preventing OpenShift users from being able to upgrade to v1.20.0.**" — #8655, fixed in 1.20.1

Go directly to ≥1.20.1. This is the single most OpenShift-relevant fix in the range.

### 7.3 Container user / SCC — direct conflict with our docs

- `hack/containers/Containerfile.*` all use `USER 1000`.
- `docs/openshift-base-images.md` states images "already run as `USER 1000`, which is compatible with OpenShift's restricted security context constraints."
- 1.20.0 changes this to **UID 65532 / GID 65532**.

On OpenShift, `restricted-v2` SCC normally assigns an arbitrary UID and GID 0, overriding the image `USER` — so runtime is often unaffected. **But verify:**

- [ ] Whether anything relies on GID 0 for file permissions (a GID change can break reads of injected files).
- [ ] Whether `runAsUser` / `runAsGroup` is pinned anywhere in our Helm values.
- [ ] Compare effective UID/GID in a non-prod namespace:
      `oc get pod -o jsonpath='{.spec.securityContext}{"\n"}{.spec.containers[*].securityContext}'`
- [ ] Our docs/patches that assume `USER 1000` must be rebased regardless.

### 7.4 Base-image digests / Artifactory mirroring

- 1.20.4 updates the distroless base images (#8991, #9024, #9055, #9325).
- 1.21.0 **moves base images to Debian 13** (#8849).
- `make/base_images.mk` pins exact `@sha256:` digests, and our Artifactory proxy allowlist mirrors them.

**All of these change.** `docs/openshift-base-images.md` already warns: *"If you build a different cert-manager release, check that release's `make/base_images.mk`."* Expect new digest families and confirm the proxy supports the new tags/digests. Note: our current pinned static amd64 digest is `sha256:b669b9df05a88a085fefed6520c6d2268aabacf3008b149ddf877e752ae89400` — this will not match the target release.

### 7.5 Helm upgrade will fail until we clean our values

Confirmed present in our `deploy/charts/cert-manager/values.yaml`:

- `prometheus.servicemonitor.targetPort` (line 550), `prometheus.servicemonitor.path`, `prometheus.podmonitor.path` → **removed in 1.21**
- The chart schema uses `additionalProperties: false` → **schema validation error on upgrade** if any value override still sets them
- `deploy/charts/cert-manager/templates/service.yaml:31` names the controller metrics port **`tcp-prometheus-servicemonitor`**; 1.21 renames it to **`http-metrics`**

**Before upgrading:**

- [ ] Remove those three keys from all `--set` / values override files.
- [ ] Update any OpenShift user-workload-monitoring `ServiceMonitor` / `PodMonitor` that targets the port **by name**.

### 7.6 `tokenrequest` RBAC removal

Our chart still ships the `-tokenrequest` Role/RoleBinding granting `serviceaccounts/token: create` (`deploy/charts/cert-manager/templates/rbac.yaml`). 1.21 removes it.

**If we use `serviceAccountRef.name` pointing at the controller ServiceAccount** (the undocumented Vault/Route53 pattern), we must either create our own Role/RoleBinding or migrate to a dedicated ServiceAccount. Otherwise token requests fail silently after upgrade. Relevant if we adopt the new Vault AWS IAM feature.

### 7.7 Our custom CADN patch — the biggest rebase risk

**Status in this tree:** the patch is **not implemented**. Verified:

- `VenafiCADNAnnotationKey` / `venafi.cert-manager.io/ca-dn` — absent from all `.go` files
- `pkg/controller/certificates/venafi-adoption/` — does not exist
- `pkg/issuer/venafi/client/venaficlient.go` still has the original 3-arg `RequestCertificate(csrPEM, duration, customFields)`
- `request.go` still has the original 3-arg `buildVReq`

So `docs/venafi-cadn-annotation.md` and `docs/cert-manager-images-and-cadn.md` are **plans**, not code. Only doc commits exist.

**Risks when implementing on a 1.20/1.21 base:**

1. The plan modifies `pkg/issuer/venafi/client/venaficlient.go` (`Interface.RequestCertificate` signature) and `request.go` (`buildVReq`). **Upstream refactored the Venafi client in 1.20.0 (#8301) and 1.21.0 (#8808, #8843)**, so the plan's line references ("around line 400", `request.go:107`) will drift and the merge surface is larger.
2. The signature change ripples into `pkg/controller/certificatesigningrequests/venafi/venafi.go` and `fake/venafi.go` — files upstream also touched.
3. Our **adoption** feature is not upstream; it will collide with upstream `pkg/controller/certificates/` changes (e.g. `renewalPolicies` in #8258 touched the trigger controller).

**Recommendation:** implement CADN by **extending upstream's #8301 annotation mechanism** (issuer-level base + Certificate-level override) rather than adding a parallel annotation path. It is the same shape, far more upstreamable, and reduces conflict surface. Our allowlist idea maps naturally onto the issuer-level base.

**Also:** account for the new **`AuthFailed`** condition reason (#8808) in error handling and in the troubleshooting table.

### 7.8 Other items that touch our environment

| Area | Change | Action |
|---|---|---|
| Long-lived certs | `renewBeforePercentage` overflow fix (#8947, 1.21.0) | If any Certificate duration >~3 years, its computed renewal time changes |
| Vault | Path traversal validation rejects `..` (#8930, 1.21.0) | Check all `spec.vault.path` values |
| Vault AWS IAM | Namespaced `Issuer` no longer uses controller ambient AWS creds unless `--issuer-ambient-credentials` (#9231, 1.21.2) | `ClusterIssuer` and explicit `serviceAccountRef` unaffected |
| Ingress/Gateway annotations | Duration/RenewBefore annotation changes now trigger reissue (#8232, 1.20.0) | Expect a renewal wave if we use those annotations |
| Metrics | `app` label now always `cert-manager` (#8162, 1.20.0) | Audit dashboards and alert rules |
| Non-v1 APIs | Webhook validation now enforced on converted non-v1 API versions (#9235, 1.21.2) | Audit any `v1alpha2` / `v1alpha3` usage |
| Gateway API config | `enableGatewayAPI` deprecated (#8732, 1.21.0) | Prefer `gatewayAPI.enabled` |
| cainjector | `CAInjectorMerging` GA, SSA unconditional (#8583, #8692) | Low risk |

---

## 8. Recommended action plan

1. **Target 1.21.2.** Avoid 1.20.0 and 1.21.0 as landing points.
2. **Pre-flight checklist before `helm upgrade`:**
   - [ ] Remove `prometheus.servicemonitor.targetPort`, `prometheus.servicemonitor.path`, `prometheus.podmonitor.path` from all value overrides
   - [ ] Update monitoring port name `tcp-prometheus-servicemonitor` → `http-metrics`
   - [ ] Audit `serviceAccountRef` usage against the `tokenrequest` RBAC removal
   - [ ] Validate the UID/GID change (1000 → 65532) and SCC behaviour in a non-prod namespace
   - [ ] Regenerate base-image digests from the target release's `make/base_images.mk`; update the Artifactory allowlist (expect Debian 13)
   - [ ] Verify nothing in our tooling creates Challenge/Order objects directly
   - [ ] Check `spec.vault.path` values for `..`
   - [ ] Decide how to handle the three 1.20-line `x/crypto` scanner findings (1.21 scans clean)
3. **Rebase the CADN/adoption docs onto 1.21 before coding**, and align CADN with upstream #8301's annotation model.
4. **Stage the rollout:** non-prod OpenShift namespace → validate Venafi TPP issuance with and without annotations → then promote.

---

## Appendix A — References

- v1.20.0: https://github.com/cert-manager/cert-manager/releases/tag/v1.20.0
- v1.20.1: https://github.com/cert-manager/cert-manager/releases/tag/v1.20.1
- v1.20.2: https://github.com/cert-manager/cert-manager/releases/tag/v1.20.2
- v1.20.3: https://github.com/cert-manager/cert-manager/releases/tag/v1.20.3
- v1.20.4: https://github.com/cert-manager/cert-manager/releases/tag/v1.20.4
- v1.21.0: https://github.com/cert-manager/cert-manager/releases/tag/v1.21.0
- v1.21.1: https://github.com/cert-manager/cert-manager/releases/tag/v1.21.1
- v1.21.2: https://github.com/cert-manager/cert-manager/releases/tag/v1.21.2
- GHSA-8rvj-mm4h-c258: https://github.com/cert-manager/cert-manager/security/advisories/GHSA-8rvj-mm4h-c258
- Related internal docs: `docs/openshift-base-images.md`, `docs/venafi-cadn-annotation.md`, `docs/cert-manager-images-and-cadn.md`, `docs/venafi-existing-certificate-adoption.md`
