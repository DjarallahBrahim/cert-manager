# cert-manager base images for OpenShift 4.18

This document lists every Docker/OCI base image used by the Containerfiles in this repository, so the platform team can configure an Artifactory Docker proxy and mirror the required images for an OpenShift 4.18 cluster.

Current tree:

```text
3989c1fe6 / v1.19.6-1-g3989c1fe6
```

## 1. Summary

All Containerfiles use the same pattern:

```dockerfile
ARG BASE_IMAGE
FROM $BASE_IMAGE
```

The actual value is selected in `make/base_images.mk`.

There are only **two upstream base-image repositories**:

| Repository | When used |
|---|---|
| `gcr.io/distroless/static-debian12` | Default build (`BASE_IMAGE_TYPE=STATIC`) |
| `gcr.io/distroless/base-debian12` | Dynamic/CGO build (`BASE_IMAGE_TYPE=DYNAMIC`) |

There are **no UBI, Alpine, BusyBox, or `scratch` base images** in this repository.

## 2. Default base image: `static-debian12`

This is what the project uses by default.

| Arch | Upstream tag | Exact `FROM` reference |
|---|---|---|
| amd64 | `latest-amd64` | `gcr.io/distroless/static-debian12@sha256:b669b9df05a88a085fefed6520c6d2268aabacf3008b149ddf877e752ae89400` |
| arm64 | `latest-arm64` | `gcr.io/distroless/static-debian12@sha256:82043e1cb4913437a9e90c2425b164d96031469894edc6011eed045001ba7181` |
| s390x | `latest-s390x` | `gcr.io/distroless/static-debian12@sha256:bb7e6734b3122c2156ea8a3d527010f6b904180efda010d39a494fd82cdff46b` |
| ppc64le | `latest-ppc64le` | `gcr.io/distroless/static-debian12@sha256:9dd359aafdd8b373641b8a439387ea7066a7c1aa45438515f64144db3f47dfce` |
| arm | `latest-arm` | `gcr.io/distroless/static-debian12@sha256:1b81481e75611d9c0fd12c3d57ef4e6e6ce6651ccb659b0b1ea5cf6bccaf7793` |

`arm` is the 32-bit ARM build supported by the upstream project. OpenShift 4.18 normally uses `amd64`, `arm64`, `ppc64le`, or `s390x`.

## 3. Optional dynamic base image: `base-debian12`

This is only needed if the build uses `CGO_ENABLED=1` and `BASE_IMAGE_TYPE=DYNAMIC`.

| Arch | Upstream tag | Exact `FROM` reference |
|---|---|---|
| amd64 | `latest-amd64` | `gcr.io/distroless/base-debian12@sha256:42b431c8f0d1d095b7d68ed682be7731c4555594fcd5d3cc25828fe1ed3d3c58` |
| arm64 | `latest-arm64` | `gcr.io/distroless/base-debian12@sha256:95d04d469989c6f5c19099fd10fad106f031dac47ca51a673cb7f6651b9e1973` |
| s390x | `latest-s390x` | `gcr.io/distroless/base-debian12@sha256:79a039034b4408ca6d7d93d63f9d075c3dea91e0dcb81cc81d440ee02c4f8b2f` |
| ppc64le | `latest-ppc64le` | `gcr.io/distroless/base-debian12@sha256:92b65113abc48cb127f5db7e0051d5b8460b00225faab6aa40539c457a2e6d9b` |
| arm | `latest-arm` | `gcr.io/distroless/base-debian12@sha256:f80795d3818a7dfd57b22dbe0b8759953fdb0b9b53ab4eb88cc46c04de130e2a` |

## 4. Containerfile mapping

All five product images use the same base image for a given architecture.

| Containerfile | Produced image |
|---|---|
| `hack/containers/Containerfile.controller` | `cert-manager-controller` |
| `hack/containers/Containerfile.webhook` | `cert-manager-webhook` |
| `hack/containers/Containerfile.cainjector` | `cert-manager-cainjector` |
| `hack/containers/Containerfile.acmesolver` | `cert-manager-acmesolver` |
| `hack/containers/Containerfile.startupapicheck` | `cert-manager-startupapicheck` |

Two test helper Containerfiles also use the controller base image:

| Containerfile | Purpose |
|---|---|
| `make/config/pebble/Containerfile.pebble` | Local Pebble ACME server for e2e tests |
| `make/config/samplewebhook/Containerfile.samplewebhook` | Webhook test helper |

For a normal OpenShift build, the platform team only needs to mirror:

```text
gcr.io/distroless/static-debian12
```

and, if dynamic builds are required:

```text
gcr.io/distroless/base-debian12
```

## 5. OpenShift 4.18 architecture check

Check the cluster architecture before deciding which digests to mirror:

```bash
oc get nodes \
  -o jsonpath='{range .items[*]}{.status.nodeInfo.architecture}{"\n"}{end}' \
  | sort -u
```

Typical results:

```text
amd64
```

or, on a multi-architecture cluster:

```text
amd64
arm64
ppc64le
s390x
```

Mirror only the architectures that the cluster actually uses.

## 6. Artifactory Docker proxy requirements

The Artifactory Docker remote repository should:

- Proxy `https://gcr.io`.
- Allow `distroless/static-debian12`.
- Allow `distroless/base-debian12` if dynamic builds are used.
- Support pulls by `@sha256:...` digest.

The build uses **digest references**, not `:latest-amd64` tags. Mirroring only the `latest-*` tags is not enough for reproducible builds.

Example rewrite:

```text
gcr.io/distroless/static-debian12@sha256:b669b9df05a88a085fefed6520c6d2268aabacf3008b149ddf877e752ae89400
    ->
artifactory.example.com/gcr/distroless/static-debian12@sha256:b669b9df05a88a085fefed6520c6d2268aabacf3008b149ddf877e752ae89400
```

## 7. Building with the mirrored image

### Option A: override the Make variable

```bash
make cert-manager-controller-linux-amd64 \
  STATIC_BASE_IMAGE_amd64='artifactory.example.com/gcr/distroless/static-debian12@sha256:b669b9df05a88a085fefed6520c6d2268aabacf3008b149ddf877e752ae89400'
```

### Option B: pass the base image directly to Docker

```bash
docker build \
  --build-arg BASE_IMAGE='artifactory.example.com/gcr/distroless/static-debian12@sha256:b669b9df05a88a085fefed6520c6d2268aabacf3008b149ddf877e752ae89400' \
  -f hack/containers/Containerfile.controller \
  -t cert-manager-controller:local .
```

Use the matching architecture digest when building for `arm64`, `ppc64le`, or `s390x`.

## 8. Important notes for OpenShift

- This repository uses **Debian 12 distroless** base images, not Red Hat UBI.
- If the security policy requires UBI base images, that is a Containerfile change, not just an Artifactory mirror.
- The images already run as `USER 1000`, which is compatible with OpenShift's restricted security context constraints.
- Distroless images do not contain a shell. Use `oc debug` with a separate debug image if shell access is needed.
- The OpenShift internal registry stores the **output** cert-manager images. It does not provide these base images unless they are mirrored separately.

## 9. Verifying the source of truth

The pinned digests are generated by:

```text
hack/latest-base-images.sh
```

and stored in:

```text
make/base_images.mk
```

If you build a different cert-manager release, check that release's `make/base_images.mk` rather than reusing the digests in this document.
