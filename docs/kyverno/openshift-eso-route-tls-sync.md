# OpenShift Route TLS Sync with ESO and Kyverno

This document describes how to use Kyverno to copy a TLS certificate from an
External Secrets Operator (ESO) generated Secret into an OpenShift Route.

Target environment:

- OpenShift 4.18
- External Secrets Operator 0.13
- Kyverno 1.14.4
- Conjur available to every namespace
- Applications deployed with Argo CD

## Problem

Users deploy an `ExternalSecret` that fetches a TLS certificate from Conjur.
ESO writes the certificate and private key into a Kubernetes `Secret`.

OpenShift Routes normally carry the serving certificate and key inline:

```yaml
spec:
  tls:
    certificate: |
      -----BEGIN CERTIFICATE-----
      ...
    key: |
      -----BEGIN RSA PRIVATE KEY-----
      ...
```

The goal is to let Kyverno populate those two fields automatically after ESO
has populated the Secret, including on certificate rotation.

## Architecture

```text
Conjur
  |
  |  ESO sync (refreshInterval)
  v
ExternalSecret  --->  Secret (kubernetes.io/tls, labelled)
                          |
                          |  Kyverno ClusterPolicy
                          |  (mutate existing + Route admission)
                          v
                       Route.spec.tls.certificate
                       Route.spec.tls.key
```

Kyverno does not talk to Conjur and does not watch `ExternalSecret.status`.
The generated Secret is the readiness signal:

1. ESO syncs the certificate into a Secret.
2. Kyverno sees the Secret create/update event.
3. Kyverno patches the matching Route in the same namespace.
4. The OpenShift router picks up the updated Route certificate.

## How Kyverno works

Kyverno is a Kubernetes-native policy engine. It is installed once and runs as
cluster-wide controllers in the `kyverno` namespace.

The relevant components are:

- **Admission controller**: receives `AdmissionReview` requests from the
  Kubernetes API server through mutating and validating webhooks. It evaluates
  matching policies synchronously during resource create/update.
- **Background controller**: handles `generate` and `mutate existing` rules
  asynchronously through `UpdateRequest` resources. It is also responsible for
  periodic background scans.
- **Reports controller**: produces `PolicyReport` and `ClusterPolicyReport`
  resources.
- **Webhook controller and certificate renewer**: configure the webhooks and
  manage their serving certificates.

A normal mutation is applied inline to the resource being admitted. A
`mutate existing` rule is different: the resource in `match` is the trigger,
and the resource in `mutate.targets` is the resource that gets patched. This is
what allows a Secret event to update an existing Route.

`mutate existing` is asynchronous. By default Kyverno also reconciles those
rules approximately every hour. That interval can be changed with the
`BACKGROUND_SCAN_INTERVAL` environment variable on the background controller.

## Why one ClusterPolicy instead of one per namespace

Use **one `ClusterPolicy`** for the company-wide route TLS standard and select
participating namespaces with `namespaceSelector`.

Multiple namespaces are a selection problem, not a policy-count problem.
`namespaceSelector` keeps the policy:

- centrally owned and reviewed
- identical across all participating namespaces
- automatically applied to new namespaces that carry the label
- free of hardcoded namespace lists
- isolated from OpenShift and Kubernetes system namespaces

A separate `ClusterPolicy` should be created only when behavior differs, for
example:

- production and non-production require different rules
- different teams use different Route or Secret label conventions
- a use case must be enabled, disabled, or versioned independently

Use a namespaced `Policy` only when a tenant must self-manage a policy inside
its own namespace. Use `PolicyException` for individual exceptions rather than
cloning the policy.

## Step 1: Opt in namespaces

Label each namespace that should participate. The label should be managed by
the namespace manifest or Argo CD, not added manually.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: app1
  labels:
    tls-sync.example.com/enabled: "true"
```

`namespaceSelector` matches labels on the **Namespace object**, not labels on
the Secret or Route.

## Step 2: Make ESO label the generated Secret

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: myapp-tls
  namespace: app1
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: conjur
    kind: ClusterSecretStore
  target:
    name: myapp-tls
    creationPolicy: Owner
    template:
      type: kubernetes.io/tls
      metadata:
        labels:
          tls-sync.example.com/enabled: "true"
      data:
        tls.crt: "{{ .tlsCrt }}"
        tls.key: "{{ .tlsKey }}"
  data:
    - secretKey: tlsCrt
      remoteRef:
        key: myapp/tls
        property: tls.crt
    - secretKey: tlsKey
      remoteRef:
        key: myapp/tls
        property: tls.key
```

The generated Secret must:

- be type `kubernetes.io/tls`
- contain non-empty `tls.crt` and `tls.key` values
- carry the `tls-sync.example.com/enabled` label

The `secretStoreRef` and `remoteRef` values depend on the existing Conjur
configuration.

## Step 3: Label the Route and omit certificate material

The Route identifies the Secret it should use. It must already define a TLS
termination type; Kyverno only updates the certificate and key.

```yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: myapp
  namespace: app1
  labels:
    tls-sync.example.com/enabled: "true"
    tls-sync.example.com/secret: myapp-tls
spec:
  host: myapp.apps.example.com
  to:
    kind: Service
    name: myapp
  port:
    targetPort: 8080
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
    # certificate and key are managed by Kyverno
```

Do not put the certificate or private key in Git.

The supported termination types for this flow are `edge` and `reencrypt`.
`passthrough` Routes are not handled because the router does not terminate TLS.

## Step 4: Grant Kyverno permission

Kyverno's background controller does not have write access to Routes by
default. Mutate-existing policies require additional permissions, and Kyverno
checks those permissions when the policy is installed.

The following aggregated ClusterRoles merge into Kyverno's controller roles
using Kyverno's aggregation labels. The label selection is independent of the
Helm release name.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: kyverno:route-tls-sync-background
  labels:
    rbac.kyverno.io/aggregate-to-background-controller: "true"
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["route.openshift.io"]
    resources: ["routes"]
    verbs: ["get", "list", "watch", "patch", "update"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: kyverno:route-tls-sync-admission
  labels:
    rbac.kyverno.io/aggregate-to-admission-controller: "true"
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list", "watch"]
```

The admission controller permission is only needed for the optional Route
admission rule that closes the "Route created after Secret" ordering gap.

If Kyverno is installed with Helm, the same permissions can be supplied through
the chart values instead:

```yaml
backgroundController:
  rbac:
    clusterRole:
      extraResources:
        - apiGroups: [""]
          resources: ["secrets"]
          verbs: ["get", "list", "watch"]
        - apiGroups: ["route.openshift.io"]
          resources: ["routes"]
          verbs: ["get", "list", "watch", "patch", "update"]

admissionController:
  rbac:
    clusterRole:
      extraResources:
        - apiGroups: [""]
          resources: ["secrets"]
          verbs: ["get", "list", "watch"]
```

## Step 5: Create the ClusterPolicy

The policy contains two rules:

1. **Secret-triggered mutate-existing**: reacts when ESO creates or updates the
   Secret, and patches the existing Route.
2. **Route admission mutation**: runs when the Route is created or updated, so
   a Route created after the Secret is still populated immediately.

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: route-tls-from-secret
spec:
  background: true
  failurePolicy: Ignore
  rules:
    - name: sync-route-tls-on-secret-change
      match:
        any:
          - resources:
              kinds: [Secret]
              operations: [CREATE, UPDATE]
              namespaceSelector:
                matchLabels:
                  tls-sync.example.com/enabled: "true"
              selector:
                matchLabels:
                  tls-sync.example.com/enabled: "true"
      preconditions:
        all:
          - key: '{{ request.object.type }}'
            operator: Equals
            value: kubernetes.io/tls
          - key: '{{ request.object.data."tls.crt" || "" }}'
            operator: NotEquals
            value: ""
          - key: '{{ request.object.data."tls.key" || "" }}'
            operator: NotEquals
            value: ""
      mutate:
        mutateExistingOnPolicyUpdate: true
        targets:
          - apiVersion: route.openshift.io/v1
            kind: Route
            namespace: '{{ request.object.metadata.namespace }}'
            selector:
              matchLabels:
                tls-sync.example.com/enabled: "true"
            preconditions:
              all:
                - key: '{{ target.metadata.labels."tls-sync.example.com/secret" || "" }}'
                  operator: Equals
                  value: '{{ request.object.metadata.name }}'
                - key: '{{ target.spec.tls.termination || "" }}'
                  operator: AnyIn
                  value: [edge, reencrypt]
        patchStrategicMerge:
          spec:
            tls:
              certificate: '{{ request.object.data."tls.crt" | base64_decode(@) }}'
              key: '{{ request.object.data."tls.key" | base64_decode(@) }}'

    - name: sync-route-tls-on-route-admission
      match:
        any:
          - resources:
              kinds: [Route]
              operations: [CREATE, UPDATE]
              namespaceSelector:
                matchLabels:
                  tls-sync.example.com/enabled: "true"
              selector:
                matchLabels:
                  tls-sync.example.com/enabled: "true"
      context:
        - name: tlsSecret
          apiCall:
            urlPath: '/api/v1/namespaces/{{ request.namespace }}/secrets?fieldSelector=metadata.name={{ request.object.metadata.labels."tls-sync.example.com/secret" }}'
            jmesPath: 'items[0].data || `{}`'
      preconditions:
        all:
          - key: '{{ request.object.metadata.labels."tls-sync.example.com/secret" || "" }}'
            operator: NotEquals
            value: ""
          - key: '{{ request.object.spec.tls.termination || "" }}'
            operator: AnyIn
            value: [edge, reencrypt]
          - key: '{{ tlsSecret."tls.crt" || "" }}'
            operator: NotEquals
            value: ""
          - key: '{{ tlsSecret."tls.key" || "" }}'
            operator: NotEquals
            value: ""
      mutate:
        patchStrategicMerge:
          spec:
            tls:
              certificate: '{{ tlsSecret."tls.crt" | base64_decode(@) }}'
              key: '{{ tlsSecret."tls.key" | base64_decode(@) }}'
```

Important properties of the policy:

- The target namespace is always the trigger namespace:
  `request.object.metadata.namespace`. A tenant cannot use a Secret label to
  request a patch in another namespace.
- The Route must carry `tls-sync.example.com/secret` equal to the Secret name.
- `tls-sync.example.com/enabled` is required on the Secret and on the Route.
- Secret data is decoded from base64 before it is written into the Route.
- `failurePolicy: Ignore` keeps ESO and Route creation from being blocked if
  Kyverno is unavailable. TLS population is then retried asynchronously.

`mutateExistingOnPolicyUpdate: true` causes Kyverno to evaluate existing
matching Secrets when the policy is installed or updated. This is useful for
the initial backfill, but can produce a burst of `UpdateRequest` resources in a
large cluster.

### Optional: validate the certificate before copying it

A precondition can use Kyverno's `x509_decode` filter to skip empty, malformed,
or expired certificates. Validate the exact expression against the Kyverno
version in use before enabling it.

## Step 6: Prevent Argo CD from reverting the certificate

Kyverno writes `spec.tls.certificate` and `spec.tls.key` after Argo CD has
applied the Route. With automated sync and `selfHeal`, Argo CD will see those
fields as drift and remove them. Kyverno will write them again, creating a
continuous loop.

Add `ignoreDifferences` and enable `RespectIgnoreDifferences`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
spec:
  ignoreDifferences:
    - group: route.openshift.io
      kind: Route
      jqPathExpressions:
        - .spec.tls.certificate
        - .spec.tls.key
  syncPolicy:
    syncOptions:
      - RespectIgnoreDifferences=true
    automated:
      prune: true
      selfHeal: true
```

For Argo CD 2.10 and later, `ServerSideDiff` with
`IncludeMutationWebhook=true` can help with normal admission mutations. It does
not replace `ignoreDifferences` for asynchronous `mutate existing` changes, so
keep both when using `selfHeal`.

## Step 7: Verify

Check the ExternalSecret and generated Secret:

```bash
oc get externalsecret -n app1 myapp-tls
oc get secret -n app1 myapp-tls -o jsonpath='{.type}'
oc get secret -n app1 myapp-tls -o jsonpath='{.metadata.labels}'
```

Check that Kyverno processed the change:

```bash
oc get updaterequest -n kyverno
oc describe clusterpolicy route-tls-from-secret
oc logs -n kyverno deploy/kyverno-background-controller
```

Check that the Route certificate matches the Secret certificate:

```bash
oc get secret myapp-tls -n app1 -o jsonpath='{.data.tls\.crt}' \
  | base64 -d | openssl x509 -noout -serial -subject -dates

oc get route myapp -n app1 -o jsonpath='{.spec.tls.certificate}' \
  | openssl x509 -noout -serial -subject -dates
```

The serial numbers and subjects should match.

Check the Route status and the router:

```bash
oc get route myapp -n app1
oc describe route myapp -n app1
```

## Step 8: Certificate rotation

The rotation flow is:

1. Conjur rotates the certificate.
2. ESO syncs the new value according to `refreshInterval`.
3. The Secret is updated.
4. Kyverno sees the Secret UPDATE and patches the Route.
5. The OpenShift router reloads the Route certificate.

With only the Secret-triggered rule, a Route created after the last Secret
update may wait for the next Kyverno background scan. The Route admission rule
in this policy removes that delay.

Deleting the Secret does not remove the certificate from the Route. Kyverno's
mutate-existing rules ignore DELETE by default unless DELETE is explicitly
added to the match operations.

## Multi-namespace operation

Kyverno is installed once and watches the whole cluster. Namespaces are
selected through `namespaceSelector`; they do not need separate Kyverno
installations or separate copies of the policy.

For each participating namespace:

1. Label the Namespace with `tls-sync.example.com/enabled=true`.
2. ESO labels the generated Secret with the same label.
3. The Route carries the same label plus `tls-sync.example.com/secret`.
4. The single `ClusterPolicy` handles all of them.

Use `PolicyException` for a namespace or application that must opt out without
changing the policy:

```yaml
apiVersion: kyverno.io/v2
kind: PolicyException
metadata:
  name: exclude-app1
  namespace: app1
spec:
  exceptions:
    - policyName: route-tls-from-secret
      ruleNames:
        - sync-route-tls-on-secret-change
        - sync-route-tls-on-route-admission
  match:
    any:
      - resources:
          kinds:
            - Secret
          namespaces:
            - app1
```

## Troubleshooting

### Policy is not ready

Check the policy status and events:

```bash
oc describe clusterpolicy route-tls-from-secret
oc get events -n kyverno --sort-by=.lastTimestamp
```

A failed permission check at policy creation usually means the background
controller cannot update Routes or read Secrets.

### UpdateRequest is Failed

```bash
oc get updaterequest -n kyverno
oc describe updaterequest -n kyverno <name>
```

Common causes:

- missing `get/list/watch` on Secrets
- missing `patch/update` on Routes
- target Route does not exist yet
- Route is in a different namespace than the Secret

### Route is not patched

Verify:

- Namespace has `tls-sync.example.com/enabled=true`
- Secret has the same label and type `kubernetes.io/tls`
- Secret has non-empty `tls.crt` and `tls.key`
- Route has `tls-sync.example.com/enabled=true`
- Route has `tls-sync.example.com/secret=<secret-name>`
- Route has `spec.tls.termination` set to `edge` or `reencrypt`

### Argo CD keeps removing the certificate

`ignoreDifferences` is missing or `RespectIgnoreDifferences=true` is not set.
See Step 6.

### Requests are blocked while Kyverno is down

The policy sets `failurePolicy: Ignore`. Confirm no other Kyverno policy in the
cluster is using `failurePolicy: Fail` for the same resources.

## Security considerations

This design copies the private key from the Secret into the Route object.
Anyone who can read Routes can then read the private key. In many OpenShift
environments the built-in `view` role can read Routes, which is a wider
audience than the users who can read Secrets.

Before adopting this pattern:

- audit who can `get` and `list` Routes in participating namespaces
- restrict Route read access where possible
- restrict Kyverno logs and `UpdateRequest` access, since patches can contain
  certificate material
- ensure successful `UpdateRequest` resources are cleaned up
- consider whether copying private keys into Route objects is acceptable for
  your security model

OpenShift has a `RouteExternalCertificate` feature that lets a Route reference
a Secret instead of inlining the key. In OpenShift 4.18 that feature is behind
the `RouteExternalCertificate` feature gate and is not enabled in the default
feature set. It is a better long-term option if the feature gate can be
enabled, but it is a Tech Preview trade-off and should be evaluated separately.

## Summary

- One cluster-scoped Kyverno `ClusterPolicy` is sufficient for all namespaces.
- Namespaces opt in with a label; `namespaceSelector` scopes the policy.
- ESO owns the Secret; Kyverno owns the Route certificate fields.
- `mutate existing` handles Secret updates and certificate rotation.
- A Route admission rule handles initial creation ordering.
- Argo CD must ignore the certificate fields or it will revert Kyverno.
- The main security trade-off is that the private key is stored in the Route.
