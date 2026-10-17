
<p align="center">
  <img src="./logo/logo-small.png" height="256" width="256" alt="cert-manager project logo" />
</p>
<!-- note that the cert-manager logo in this repo is referred to in other README files in the cert-manager org
     as well as in Helm charts, etc.
     if you change its location or name, you'll need to update several other repos too! -->

<p align="center"><a href="https://prow.infra.cert-manager.io/?job=ci-cert-manager-master-make-test">
<!-- prow build badge, godoc, and go report card-->
<img alt="Build Status" src="https://prow.infra.cert-manager.io/badge.svg?jobs=ci-cert-manager-master-make-test">
</a>
<a href="https://godoc.org/github.com/cert-manager/cert-manager"><img src="https://godoc.org/github.com/cert-manager/cert-manager?status.svg"></a>
<a href="https://goreportcard.com/report/github.com/cert-manager/cert-manager"><img alt="Go Report Card" src="https://goreportcard.com/badge/github.com/cert-manager/cert-manager" /></a>
<br />
<a href="https://artifacthub.io/packages/search?repo=cert-manager"><img alt="Artifact Hub" src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/cert-manager" /></a>
<a href="https://scorecard.dev/viewer/?uri=github.com/cert-manager/cert-manager"><img src="https://api.scorecard.dev/projects/github.com/cert-manager/cert-manager/badge" alt="Scorecard score"/></a>
<a href="https://clomonitor.io/projects/cncf/cert-manager"><img src="https://img.shields.io/endpoint?url=https://clomonitor.io/api/projects/cncf/cert-manager/badge" alt="CLOMonitor"/></a>
<br />
<a href="https://www.bestpractices.dev/projects/8079"><img src="https://www.bestpractices.dev/projects/8079/badge"></a>
</p>

# cert-manager

cert-manager adds certificates and certificate issuers as resource types in Kubernetes clusters, and simplifies the process of obtaining, renewing and using those certificates.

It supports issuing certificates from a variety of sources, including Let's Encrypt (ACME), HashiCorp Vault, and Venafi TPP / TLS Protect Cloud, as well as local in-cluster issuance.

cert-manager also ensures certificates remain valid and up to date, attempting to renew certificates at an appropriate time before expiry to reduce the risk of outages and remove toil.

![cert-manager high level overview diagram](https://cert-manager.io/images/high-level-overview.svg)

## Documentation

Documentation for cert-manager can be found at [cert-manager.io](https://cert-manager.io/docs/).

For the common use-case of automatically issuing TLS certificates for
Ingress resources, see the [cert-manager nginx-ingress quick start guide](https://cert-manager.io/docs/tutorials/acme/nginx-ingress/).

For a more comprehensive guide to issuing your first certificate, see our [getting started guide](https://cert-manager.io/docs/getting-started/).

### Installation

[Installation](https://cert-manager.io/docs/installation/) is documented on the website, with a variety of supported methods.

## Developing cert-manager

We acti