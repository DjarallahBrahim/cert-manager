const fs = require('fs');

const dispatch = JSON.parse(fs.readFileSync('.ua/tmp/prompts/batch-14.json', 'utf8'));
const importData = dispatch.batchImportData;

const fileNodes = [
  {
    path: 'test/e2e/suite/conformance/certificates/suite.go',
    summary: 'Defines the reusable Certificate conformance suite structure, exposing issuer provisioning callbacks plus domain, IP and unsupported-feature knobs and the setup/validate/iterate helpers that drive the shared tests.',
    tags: ['test', 'conformance', 'test-harness', 'certificate', 'e2e'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/conformance/certificates/tests.go',
    summary: 'Implements the certificate conformance test matrix, covering issuance, renewal, SANs, durations, key usages, secret templates and HTTP01 ingress/gateway flows for any issuer implementation.',
    tags: ['test', 'conformance', 'certificate', 'e2e', 'test-harness'],
    complexity: 'complex',
  },
  {
    path: 'test/e2e/suite/conformance/certificates/vault/vault_approle.go',
    summary: 'Provisions a HashiCorp Vault AppRole-authenticated CA issuer and its PKI mounts to drive the certificate conformance suite against Vault.',
    tags: ['test', 'conformance', 'vault', 'certificate', 'issuer'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/conformance/certificates/venafi/venafi.go',
    summary: 'Runs the certificate conformance suite against a Venafi TPP issuer, creating and cleaning up the issuer and cluster issuer resources around each run.',
    tags: ['test', 'conformance', 'venafi', 'tpp', 'certificate'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/conformance/certificates/venaficloud/cloud.go',
    summary: 'Runs the certificate conformance suite against the Venafi Cloud (VaaS) issuer, provisioning issuer resources with the configured API credentials.',
    tags: ['test', 'conformance', 'venafi', 'cloud', 'certificate'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/conformance/certificatesigningrequests/acme/acme.go',
    summary: 'Registers the ACME CertificateSigningRequest conformance suites, wiring HTTP01 and DNS01 provisioners and ensuring External Account Binding secrets exist.',
    tags: ['test', 'conformance', 'acme', 'certificatesigningrequest', 'e2e'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/conformance/certificatesigningrequests/acme/dns01.go',
    summary: 'Builds ACME DNS01 Issuer and ClusterIssuer resources with solver configuration for the CertificateSigningRequest conformance suite.',
    tags: ['test', 'conformance', 'acme', 'dns01', 'certificatesigningrequest'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/conformance/certificatesigningrequests/acme/http01.go',
    summary: 'Builds ACME HTTP01 Issuer and ClusterIssuer resources with ingress solver configuration for the CertificateSigningRequest conformance suite.',
    tags: ['test', 'conformance', 'acme', 'http01', 'certificatesigningrequest'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/conformance/certificatesigningrequests/ca/ca.go',
    summary: 'Provisions a CA-backed signer for CertificateSigningRequest conformance tests, generating the signing key pair secret and the corresponding Issuer/ClusterIssuer resources.',
    tags: ['test', 'conformance', 'ca-issuer', 'certificatesigningrequest', 'signing'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/conformance/certificatesigningrequests/selfsigned/selfsigned.go',
    summary: 'Provides SelfSigned Issuer and ClusterIssuer lifecycle hooks used by the CertificateSigningRequest conformance suite.',
    tags: ['test', 'conformance', 'selfsigned', 'certificatesigningrequest', 'issuer'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/conformance/certificatesigningrequests/suite.go',
    summary: 'Defines the reusable CertificateSigningRequest conformance suite, including issuer, provisioning and cleanup callbacks plus the feature-set overrides and iteration helpers.',
    tags: ['test', 'conformance', 'test-harness', 'certificatesigningrequest', 'e2e'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/conformance/certificatesigningrequests/tests.go',
    summary: 'Implements the CertificateSigningRequest conformance test matrix, asserting approval, denial, signing outcomes, key usages, SANs and durations across issuer implementations.',
    tags: ['test', 'conformance', 'certificatesigningrequest', 'e2e', 'test-harness'],
    complexity: 'complex',
  },
  {
    path: 'test/e2e/suite/conformance/certificatesigningrequests/vault/approle.go',
    summary: 'Sets up a Vault AppRole-authenticated issuer, including PKI mounts and role bindings, for the CertificateSigningRequest conformance suite.',
    tags: ['test', 'conformance', 'vault', 'approle', 'certificatesigningrequest'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/conformance/certificatesigningrequests/vault/kubernetes.go',
    summary: 'Sets up a Vault issuer using Kubernetes service-account authentication for the CertificateSigningRequest conformance suite.',
    tags: ['test', 'conformance', 'vault', 'kubernetes-auth', 'certificatesigningrequest'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/conformance/certificatesigningrequests/venafi/cloud.go',
    summary: 'Provides the Venafi Cloud issuer lifecycle used by the CertificateSigningRequest conformance suite.',
    tags: ['test', 'conformance', 'venafi', 'cloud', 'certificatesigningrequest'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/conformance/certificatesigningrequests/venafi/tpp.go',
    summary: 'Provides the Venafi TPP issuer lifecycle used by the CertificateSigningRequest conformance suite.',
    tags: ['test', 'conformance', 'venafi', 'tpp', 'certificatesigningrequest'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/conformance/import.go',
    summary: 'Blank-import aggregator that pulls every certificate, CertificateSigningRequest and RBAC conformance package into the e2e test binary.',
    tags: ['entry-point', 'barrel', 'test', 'conformance', 'e2e'],
    complexity: 'simple',
  },
  {
    path: 'test/e2e/suite/conformance/rbac/certificate.go',
    summary: 'RBAC conformance tests asserting which verbs the built-in view, edit and admin ClusterRoles grant for Certificate resources.',
    tags: ['test', 'conformance', 'rbac', 'certificate', 'security'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/conformance/rbac/certificaterequest.go',
    summary: 'RBAC conformance tests asserting which verbs the built-in view, edit and admin ClusterRoles grant for CertificateRequest resources.',
    tags: ['test', 'conformance', 'rbac', 'certificaterequest', 'security'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/conformance/rbac/doc.go',
    summary: 'Declares the RBACDescribe Ginkgo helper used to label and skip RBAC conformance specs.',
    tags: ['test', 'conformance', 'rbac', 'test-harness', 'e2e'],
    complexity: 'simple',
  },
  {
    path: 'test/e2e/suite/conformance/rbac/issuer.go',
    summary: 'RBAC conformance tests asserting which verbs the built-in view, edit and admin ClusterRoles grant for Issuer resources.',
    tags: ['test', 'conformance', 'rbac', 'issuer', 'security'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/doc.go',
    summary: 'Root package aggregator that blank-imports all e2e suite subpackages so their Ginkgo specs are registered.',
    tags: ['entry-point', 'barrel', 'test', 'e2e', 'bootstrap'],
    complexity: 'simple',
  },
  {
    path: 'test/e2e/suite/issuers/acme/certificate/http01.go',
    summary: 'End-to-end ACME HTTP01 Certificate tests covering ingress annotation and redirect validation, blocked DNS names, failing certificate recovery and challenge pod recreation.',
    tags: ['test', 'e2e', 'acme', 'http01', 'certificate'],
    complexity: 'complex',
  },
  {
    path: 'test/e2e/suite/issuers/acme/certificate/notafter.go',
    summary: 'End-to-end ACME test verifying that short requested durations are honoured and reflected in the issued certificate notAfter date.',
    tags: ['test', 'e2e', 'acme', 'certificate', 'duration'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/issuers/acme/certificate/webhook.go',
    summary: 'End-to-end ACME test for the sample webhook DNS solver, asserting challenges are presented through the webhook provider, with helpers listing owned Orders and Challenges.',
    tags: ['test', 'e2e', 'acme', 'webhook', 'dns01'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/issuers/acme/certificaterequest/dns01.go',
    summary: 'End-to-end ACME DNS01 CertificateRequest tests parameterised over RFC2136 and other DNS providers for regular, wildcard and apex domains.',
    tags: ['test', 'e2e', 'acme', 'dns01', 'certificaterequest'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/issuers/acme/certificaterequest/http01.go',
    summary: 'End-to-end ACME HTTP01 CertificateRequest tests covering RSA and ECDSA keys, long domains, wildcard-plus-apex names, invalid domains and challenge pod recovery.',
    tags: ['test', 'e2e', 'acme', 'http01', 'certificaterequest'],
    complexity: 'complex',
  },
  {
    path: 'test/e2e/suite/issuers/acme/certificaterequest/profiles.go',
    summary: 'End-to-end tests for the ACME Profiles extension, checking profile-selected durations and actionable failure messages on CertificateRequests.',
    tags: ['test', 'e2e', 'acme', 'profiles', 'certificaterequest'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/issuers/acme/dnsproviders/cloudflare.go',
    summary: 'Cloudflare DNS provider addon that provisions a test zone and API token for ACME DNS01 end-to-end tests.',
    tags: ['test', 'addon', 'cloudflare', 'dns01', 'e2e'],
    complexity: 'moderate',
  },
  {
    path: 'test/e2e/suite/issuers/acme/dnsproviders/dnsproviders.go',
    summary: 'Shared Details transferable-data struct describing DNS provider endpoints and credentials for ACME DNS01 addons.',
    tags: ['test', 'addon', 'dns01', 'data-model', 'e2e'],
    complexity: 'simple',
  },
];

const symbolNodes = [
  // certificates/suite.go
  {
    id: 'class:test/e2e/suite/conformance/certificates/suite.go:Suite',
    type: 'class',
    name: 'Suite',
    filePath: 'test/e2e/suite/conformance/certificates/suite.go',
    lineRange: [33, 76],
    summary: 'Configurable conformance suite definition for Certificates, holding issuer lifecycle callbacks, shared IP address, domain suffix, HTTP01 test type and unsupported feature set.',
    tags: ['test-harness', 'conformance', 'certificate', 'data-model'],
    complexity: 'moderate',
  },
  // certificates/tests.go
  {
    id: 'function:test/e2e/suite/conformance/certificates/tests.go:Define',
    type: 'function',
    name: 'Define',
    filePath: 'test/e2e/suite/conformance/certificates/tests.go',
    lineRange: [62, 780],
    summary: 'Registers the full certificate conformance spec tree for a Suite, running setup, feature-gate filtering and dozens of issuance, renewal and validation scenarios against the configured issuer.',
    tags: ['test-harness', 'conformance', 'certificate', 'ginkgo'],
    complexity: 'complex',
  },
  // certificates/vault/vault_approle.go
  {
    id: 'function:test/e2e/suite/conformance/certificates/vault/vault_approle.go:createIssuer',
    type: 'function',
    name: 'createIssuer',
    filePath: 'test/e2e/suite/conformance/certificates/vault/vault_approle.go',
    lineRange: [90, 120],
    summary: 'Creates a namespaced Vault Issuer wired to the test Vault instance using AppRole authentication.',
    tags: ['vault', 'issuer', 'test-setup', 'conformance'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificates/vault/vault_approle.go:createClusterIssuer',
    type: 'function',
    name: 'createClusterIssuer',
    filePath: 'test/e2e/suite/conformance/certificates/vault/vault_approle.go',
    lineRange: [122, 152],
    summary: 'Creates a cluster-scoped Vault ClusterIssuer using AppRole credentials for conformance runs.',
    tags: ['vault', 'cluster-issuer', 'test-setup', 'conformance'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificates/vault/vault_approle.go:initVault',
    type: 'function',
    name: 'initVault',
    filePath: 'test/e2e/suite/conformance/certificates/vault/vault_approle.go',
    lineRange: [154, 171],
    summary: 'Initialises the Vault PKI mounts and AppRole roles required before issuing certificates.',
    tags: ['vault', 'pki', 'test-setup', 'authentication'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificates/vault/vault_approle.go:createIssuerSpec',
    type: 'function',
    name: 'createIssuerSpec',
    filePath: 'test/e2e/suite/conformance/certificates/vault/vault_approle.go',
    lineRange: [173, 195],
    summary: 'Builds the Vault issuer spec fragment containing server URL, CA bundle and AppRole auth settings.',
    tags: ['vault', 'issuer', 'configuration', 'test-setup'],
    complexity: 'simple',
  },
  // certificates/venafi/venafi.go
  {
    id: 'function:test/e2e/suite/conformance/certificates/venafi/venafi.go:createIssuer',
    type: 'function',
    name: 'createIssuer',
    filePath: 'test/e2e/suite/conformance/certificates/venafi/venafi.go',
    lineRange: [89, 118],
    summary: 'Creates a namespaced Venafi TPP Issuer for the certificate conformance suite.',
    tags: ['venafi', 'tpp', 'issuer', 'test-setup'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificates/venafi/venafi.go:createClusterIssuer',
    type: 'function',
    name: 'createClusterIssuer',
    filePath: 'test/e2e/suite/conformance/certificates/venafi/venafi.go',
    lineRange: [120, 149],
    summary: 'Creates a cluster-scoped Venafi TPP ClusterIssuer for the certificate conformance suite.',
    tags: ['venafi', 'tpp', 'cluster-issuer', 'test-setup'],
    complexity: 'moderate',
  },
  // certificates/venaficloud/cloud.go
  {
    id: 'function:test/e2e/suite/conformance/certificates/venaficloud/cloud.go:createIssuer',
    type: 'function',
    name: 'createIssuer',
    filePath: 'test/e2e/suite/conformance/certificates/venaficloud/cloud.go',
    lineRange: [89, 118],
    summary: 'Creates a namespaced Venafi Cloud Issuer using the configured API key for conformance runs.',
    tags: ['venafi', 'cloud', 'issuer', 'test-setup'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificates/venaficloud/cloud.go:createClusterIssuer',
    type: 'function',
    name: 'createClusterIssuer',
    filePath: 'test/e2e/suite/conformance/certificates/venaficloud/cloud.go',
    lineRange: [120, 149],
    summary: 'Creates a cluster-scoped Venafi Cloud ClusterIssuer for the certificate conformance suite.',
    tags: ['venafi', 'cloud', 'cluster-issuer', 'test-setup'],
    complexity: 'moderate',
  },
  // csr/acme/acme.go
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/acme/acme.go:runACMEIssuerTests',
    type: 'function',
    name: 'runACMEIssuerTests',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/acme/acme.go',
    lineRange: [44, 112],
    summary: 'Registers ACME CertificateSigningRequest conformance suites for HTTP01 and DNS01 solvers, wiring issuer creation and cleanup callbacks.',
    tags: ['acme', 'conformance', 'test-harness', 'certificatesigningrequest'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/acme/acme.go:ensureEABSecret',
    type: 'function',
    name: 'ensureEABSecret',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/acme/acme.go',
    lineRange: [133, 162],
    summary: 'Ensures the External Account Binding credentials secret exists in the test namespace, creating it from configured ACME EAB keys when missing.',
    tags: ['acme', 'eab', 'test-setup', 'secret'],
    complexity: 'simple',
  },
  // csr/acme/dns01.go
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/acme/dns01.go:createDNS01Issuer',
    type: 'function',
    name: 'createDNS01Issuer',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/acme/dns01.go',
    lineRange: [35, 54],
    summary: 'Creates a namespaced ACME Issuer configured with the DNS01 solver used by the CSR conformance suite.',
    tags: ['acme', 'dns01', 'issuer', 'test-setup'],
    complexity: 'simple',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/acme/dns01.go:createDNS01ClusterIssuer',
    type: 'function',
    name: 'createDNS01ClusterIssuer',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/acme/dns01.go',
    lineRange: [56, 75],
    summary: 'Creates a cluster-scoped ACME ClusterIssuer with DNS01 solver configuration.',
    tags: ['acme', 'dns01', 'cluster-issuer', 'test-setup'],
    complexity: 'simple',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/acme/dns01.go:createDNS01IssuerSpec',
    type: 'function',
    name: 'createDNS01IssuerSpec',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/acme/dns01.go',
    lineRange: [77, 101],
    summary: 'Assembles the ACME issuer spec including server URL, private key secret and DNS01 challenge solver selector.',
    tags: ['acme', 'dns01', 'configuration', 'test-setup'],
    complexity: 'moderate',
  },
  // csr/acme/http01.go
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/acme/http01.go:createHTTP01Issuer',
    type: 'function',
    name: 'createHTTP01Issuer',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/acme/http01.go',
    lineRange: [35, 55],
    summary: 'Creates a namespaced ACME Issuer configured with an HTTP01 ingress solver.',
    tags: ['acme', 'http01', 'issuer', 'test-setup'],
    complexity: 'simple',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/acme/http01.go:createHTTP01ClusterIssuer',
    type: 'function',
    name: 'createHTTP01ClusterIssuer',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/acme/http01.go',
    lineRange: [57, 77],
    summary: 'Creates a cluster-scoped ACME ClusterIssuer with HTTP01 solver configuration.',
    tags: ['acme', 'http01', 'cluster-issuer', 'test-setup'],
    complexity: 'simple',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/acme/http01.go:createHTTP01IssuerSpec',
    type: 'function',
    name: 'createHTTP01IssuerSpec',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/acme/http01.go',
    lineRange: [79, 104],
    summary: 'Assembles the ACME issuer spec including server URL and HTTP01 ingress solver settings.',
    tags: ['acme', 'http01', 'configuration', 'test-setup'],
    complexity: 'moderate',
  },
  // csr/ca/ca.go
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/ca/ca.go:createIssuer',
    type: 'function',
    name: 'createIssuer',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/ca/ca.go',
    lineRange: [59, 87],
    summary: 'Creates a namespaced CA Issuer backed by the generated signing key pair secret.',
    tags: ['ca-issuer', 'issuer', 'test-setup', 'conformance'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/ca/ca.go:createClusterIssuer',
    type: 'function',
    name: 'createClusterIssuer',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/ca/ca.go',
    lineRange: [89, 117],
    summary: 'Creates a cluster-scoped CA ClusterIssuer referencing the generated signing key pair.',
    tags: ['ca-issuer', 'cluster-issuer', 'test-setup', 'conformance'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/ca/ca.go:newSigningKeypairSecret',
    type: 'function',
    name: 'newSigningKeypairSecret',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/ca/ca.go',
    lineRange: [130, 159],
    summary: 'Generates a self-signed CA key pair and stores it in a Kubernetes secret for the CA issuer to sign with.',
    tags: ['ca-issuer', 'pki', 'keypair', 'test-setup'],
    complexity: 'moderate',
  },
  // csr/selfsigned
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/selfsigned/selfsigned.go:provision',
    type: 'function',
    name: 'provision',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/selfsigned/selfsigned.go',
    lineRange: [57, 83],
    summary: 'Provisions the SelfSigned issuer resources and returns the issuer reference used as the CSR signer name.',
    tags: ['selfsigned', 'issuer', 'test-setup', 'conformance'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/selfsigned/selfsigned.go:deProvision',
    type: 'function',
    name: 'deProvision',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/selfsigned/selfsigned.go',
    lineRange: [84, 94],
    summary: 'Cleans up the SelfSigned issuer resources after a conformance test run.',
    tags: ['selfsigned', 'cleanup', 'test-teardown', 'conformance'],
    complexity: 'simple',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/selfsigned/selfsigned.go:createSelfSignedIssuer',
    type: 'function',
    name: 'createSelfSignedIssuer',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/selfsigned/selfsigned.go',
    lineRange: [96, 117],
    summary: 'Creates a namespaced SelfSigned Issuer for CSR conformance tests.',
    tags: ['selfsigned', 'issuer', 'test-setup', 'conformance'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/selfsigned/selfsigned.go:createSelfSignedClusterIssuer',
    type: 'function',
    name: 'createSelfSignedClusterIssuer',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/selfsigned/selfsigned.go',
    lineRange: [119, 140],
    summary: 'Creates a cluster-scoped SelfSigned ClusterIssuer for CSR conformance tests.',
    tags: ['selfsigned', 'cluster-issuer', 'test-setup', 'conformance'],
    complexity: 'moderate',
  },
  // csr/suite.go
  {
    id: 'class:test/e2e/suite/conformance/certificatesigningrequests/suite.go:Suite',
    type: 'class',
    name: 'Suite',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/suite.go',
    lineRange: [35, 92],
    summary: 'Reusable CertificateSigningRequest conformance suite definition with issuer, provisioning and cleanup callbacks, feature-set overrides and validation state.',
    tags: ['test-harness', 'conformance', 'certificatesigningrequest', 'data-model'],
    complexity: 'moderate',
  },
  // csr/tests.go
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/tests.go:Define',
    type: 'function',
    name: 'Define',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/tests.go',
    lineRange: [51, 502],
    summary: 'Registers the CertificateSigningRequest conformance spec tree, iterating over key algorithms, SAN combinations and expected approval or denial outcomes for the configured signer.',
    tags: ['test-harness', 'conformance', 'certificatesigningrequest', 'ginkgo'],
    complexity: 'complex',
  },
  // csr/vault/approle.go
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/vault/approle.go:createIssuer',
    type: 'function',
    name: 'createIssuer',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/vault/approle.go',
    lineRange: [116, 142],
    summary: 'Creates a namespaced Vault Issuer authenticated with AppRole for CSR conformance tests.',
    tags: ['vault', 'approle', 'issuer', 'test-setup'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/vault/approle.go:createClusterIssuer',
    type: 'function',
    name: 'createClusterIssuer',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/vault/approle.go',
    lineRange: [144, 170],
    summary: 'Creates a cluster-scoped Vault ClusterIssuer using AppRole authentication.',
    tags: ['vault', 'approle', 'cluster-issuer', 'test-setup'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/vault/approle.go:initVault',
    type: 'function',
    name: 'initVault',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/vault/approle.go',
    lineRange: [172, 189],
    summary: 'Configures the Vault PKI mounts and AppRole policies needed for CSR signing.',
    tags: ['vault', 'approle', 'pki', 'test-setup'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/vault/approle.go:createIssuerSpec',
    type: 'function',
    name: 'createIssuerSpec',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/vault/approle.go',
    lineRange: [191, 213],
    summary: 'Builds the Vault issuer spec with server URL, CA bundle and AppRole secret references.',
    tags: ['vault', 'approle', 'configuration', 'test-setup'],
    complexity: 'moderate',
  },
  // csr/vault/kubernetes.go
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/vault/kubernetes.go:createIssuer',
    type: 'function',
    name: 'createIssuer',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/vault/kubernetes.go',
    lineRange: [78, 97],
    summary: 'Creates a namespaced Vault Issuer that authenticates via Kubernetes service-account tokens.',
    tags: ['vault', 'kubernetes-auth', 'issuer', 'test-setup'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/vault/kubernetes.go:createClusterIssuer',
    type: 'function',
    name: 'createClusterIssuer',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/vault/kubernetes.go',
    lineRange: [99, 117],
    summary: 'Creates a cluster-scoped Vault ClusterIssuer using Kubernetes service-account authentication.',
    tags: ['vault', 'kubernetes-auth', 'cluster-issuer', 'test-setup'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/vault/kubernetes.go:initVault',
    type: 'function',
    name: 'initVault',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/vault/kubernetes.go',
    lineRange: [138, 160],
    summary: 'Configures Vault Kubernetes auth roles and PKI mounts for CSR conformance signing.',
    tags: ['vault', 'kubernetes-auth', 'pki', 'test-setup'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/vault/kubernetes.go:issuerSpec',
    type: 'function',
    name: 'issuerSpec',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/vault/kubernetes.go',
    lineRange: [162, 183],
    summary: 'Builds the Vault issuer spec referencing the Kubernetes auth mount path and service account role.',
    tags: ['vault', 'kubernetes-auth', 'configuration', 'test-setup'],
    complexity: 'moderate',
  },
  // csr/venafi/cloud.go
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/venafi/cloud.go:createIssuer',
    type: 'function',
    name: 'createIssuer',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/venafi/cloud.go',
    lineRange: [90, 115],
    summary: 'Creates a namespaced Venafi Cloud Issuer for CSR conformance tests.',
    tags: ['venafi', 'cloud', 'issuer', 'test-setup'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/venafi/cloud.go:createClusterIssuer',
    type: 'function',
    name: 'createClusterIssuer',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/venafi/cloud.go',
    lineRange: [120, 145],
    summary: 'Creates a cluster-scoped Venafi Cloud ClusterIssuer for CSR conformance tests.',
    tags: ['venafi', 'cloud', 'cluster-issuer', 'test-setup'],
    complexity: 'moderate',
  },
  // csr/venafi/tpp.go
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/venafi/tpp.go:createIssuer',
    type: 'function',
    name: 'createIssuer',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/venafi/tpp.go',
    lineRange: [92, 112],
    summary: 'Creates a namespaced Venafi TPP Issuer for CSR conformance tests.',
    tags: ['venafi', 'tpp', 'issuer', 'test-setup'],
    complexity: 'moderate',
  },
  {
    id: 'function:test/e2e/suite/conformance/certificatesigningrequests/venafi/tpp.go:createClusterIssuer',
    type: 'function',
    name: 'createClusterIssuer',
    filePath: 'test/e2e/suite/conformance/certificatesigningrequests/venafi/tpp.go',
    lineRange: [114, 134],
    summary: 'Creates a cluster-scoped Venafi TPP ClusterIssuer for CSR conformance tests.',
    tags: ['venafi', 'tpp', 'cluster-issuer', 'test-setup'],
    complexity: 'moderate',
  },
  // rbac/doc.go
  {
    id: 'function:test/e2e/suite/conformance/rbac/doc.go:RBACDescribe',
    type: 'function',
    name: 'RBACDescribe',
    filePath: 'test/e2e/suite/conformance/rbac/doc.go',
    lineRange: [24, 26],
    summary: 'Ginkgo Describe wrapper that labels RBAC conformance specs and skips them when RBAC testing is disabled.',
    tags: ['test-harness', 'rbac', 'ginkgo', 'conformance'],
    complexity: 'simple',
  },
  // acme certificate http01
  {
    id: 'function:test/e2e/suite/issuers/acme/certificate/http01.go:findDNSNames',
    type: 'function',
    name: 'findDNSNames',
    filePath: 'test/e2e/suite/issuers/acme/certificate/http01.go',
    lineRange: [500, 520],
    summary: 'Parses the certificate stored in a TLS secret and returns its DNS subject alternative names.',
    tags: ['utility', 'x509', 'dns', 'test-helper'],
    complexity: 'moderate',
  },
  // webhook
  {
    id: 'function:test/e2e/suite/issuers/acme/certificate/webhook.go:listOwnedChallenges',
    type: 'function',
    name: 'listOwnedChallenges',
    filePath: 'test/e2e/suite/issuers/acme/certificate/webhook.go',
    lineRange: [177, 192],
    summary: 'Lists all ACME Challenges owned by a given Order via owner references.',
    tags: ['test-helper', 'acme', 'challenge', 'kubernetes-client'],
    complexity: 'simple',
  },
  {
    id: 'function:test/e2e/suite/issuers/acme/certificate/webhook.go:listOwnedOrders',
    type: 'function',
    name: 'listOwnedOrders',
    filePath: 'test/e2e/suite/issuers/acme/certificate/webhook.go',
    lineRange: [194, 210],
    summary: 'Lists all ACME Orders owned by a given Certificate via owner references.',
    tags: ['test-helper', 'acme', 'order', 'kubernetes-client'],
    complexity: 'simple',
  },
  // certificaterequest dns01
  {
    id: 'function:test/e2e/suite/issuers/acme/certificaterequest/dns01.go:testRFC2136DNSProvider',
    type: 'function',
    name: 'testRFC2136DNSProvider',
    filePath: 'test/e2e/suite/issuers/acme/certificaterequest/dns01.go',
    lineRange: [46, 169],
    summary: 'Registers the DNS01 CertificateRequest test context for the RFC2136 provider when credentials are configured, asserting issuance for regular, wildcard and apex domains.',
    tags: ['test-harness', 'acme', 'dns01', 'rfc2136'],
    complexity: 'complex',
  },
  // cloudflare
  {
    id: 'class:test/e2e/suite/issuers/acme/dnsproviders/cloudflare.go:Cloudflare',
    type: 'class',
    name: 'Cloudflare',
    filePath: 'test/e2e/suite/issuers/acme/dnsproviders/cloudflare.go',
    lineRange: [37, 46],
    summary: 'Cloudflare DNS provider addon implementing setup, provisioning, deprovisioning and details reporting for ACME DNS01 tests.',
    tags: ['addon', 'cloudflare', 'dns01', 'test-infrastructure'],
    complexity: 'simple',
  },
  {
    id: 'function:test/e2e/suite/issuers/acme/dnsproviders/cloudflare.go:Setup',
    type: 'function',
    name: 'Setup',
    filePath: 'test/e2e/suite/issuers/acme/dnsproviders/cloudflare.go',
    lineRange: [48, 66],
    summary: 'Prepares the Cloudflare addon namespaces and resolves configuration before provisioning the test zone.',
    tags: ['addon', 'cloudflare', 'setup', 'test-infrastructure'],
    complexity: 'simple',
  },
  {
    id: 'function:test/e2e/suite/issuers/acme/dnsproviders/cloudflare.go:Provision',
    type: 'function',
    name: 'Provision',
    filePath: 'test/e2e/suite/issuers/acme/dnsproviders/cloudflare.go',
    lineRange: [71, 103],
    summary: 'Creates the Cloudflare DNS zone and API token secret, waiting until the test zone is resolvable.',
    tags: ['addon', 'cloudflare', 'provisioning', 'dns01'],
    complexity: 'moderate',
  },
  // dnsproviders
  {
    id: 'class:test/e2e/suite/issuers/acme/dnsproviders/dnsproviders.go:Details',
    type: 'class',
    name: 'Details',
    filePath: 'test/e2e/suite/issuers/acme/dnsproviders/dnsproviders.go',
    lineRange: [33, 39],
    summary: 'Transferable-data struct carrying DNS provider API endpoints, zone names and credential secret references between addon lifecycle phases.',
    tags: ['data-model', 'addon', 'dns01', 'test-infrastructure'],
    complexity: 'simple',
  },
];

const nodes = [
  ...fileNodes.map((f) => {
    const isDoc = f.path.endsWith('doc.go');
    return {
      id: `file:${f.path}`,
      type: 'file',
      name: f.path.split('/').pop(),
      filePath: f.path,
      summary: f.summary,
      tags: f.tags,
      complexity: f.complexity,
      ...(isDoc ? { languageNotes: 'Go doc-only package file whose imports exist solely to register Ginkgo specs or expose helpers.' } : {}),
    };
  }),
  ...symbolNodes,
];

const edges = [];

for (const [filePath, imports] of Object.entries(importData)) {
  for (const target of imports) {
    edges.push({
      source: `file:${filePath}`,
      target: `file:${target}`,
      type: 'imports',
      direction: 'forward',
      weight: 0.7,
    });
  }
}

for (const sym of symbolNodes) {
  edges.push({
    source: `file:${sym.filePath}`,
    target: sym.id,
    type: 'contains',
    direction: 'forward',
    weight: 1.0,
  });
}

const exported = new Set([
  'class:test/e2e/suite/conformance/certificates/suite.go:Suite',
  'function:test/e2e/suite/conformance/certificates/tests.go:Define',
  'class:test/e2e/suite/conformance/certificatesigningrequests/suite.go:Suite',
  'function:test/e2e/suite/conformance/certificatesigningrequests/tests.go:Define',
  'function:test/e2e/suite/conformance/rbac/doc.go:RBACDescribe',
  'class:test/e2e/suite/issuers/acme/dnsproviders/cloudflare.go:Cloudflare',
  'function:test/e2e/suite/issuers/acme/dnsproviders/cloudflare.go:Setup',
  'function:test/e2e/suite/issuers/acme/dnsproviders/cloudflare.go:Provision',
  'class:test/e2e/suite/issuers/acme/dnsproviders/dnsproviders.go:Details',
]);

for (const sym of symbolNodes) {
  if (exported.has(sym.id)) {
    edges.push({
      source: `file:${sym.filePath}`,
      target: sym.id,
      type: 'exports',
      direction: 'forward',
      weight: 0.8,
    });
  }
}

const calls = [
  ['function:test/e2e/suite/conformance/certificates/tests.go:Define', 'function:test/e2e/framework/framework.go:NewDefaultFramework'],
  ['function:test/e2e/suite/conformance/certificates/tests.go:Define', 'function:test/e2e/framework/helper/featureset/featureset.go:NewFeatureSet'],
  ['function:test/e2e/suite/conformance/certificates/tests.go:Define', 'function:test/e2e/framework/helper/validation/validation.go:CertificateSetForUnsupportedFeatureSet'],
  ['function:test/e2e/suite/conformance/certificates/tests.go:Define', 'function:test/e2e/framework/matcher/have_condition_matcher.go:HaveCondition'],
  ['function:test/e2e/suite/conformance/certificates/tests.go:Define', 'function:test/e2e/framework/matcher/san_matchers.go:HaveSameSANsAs'],
  ['function:test/e2e/suite/conformance/certificates/vault/vault_approle.go:createIssuer', 'function:test/e2e/framework/addon/vault/setup.go:CreateAppRole'],
  ['function:test/e2e/suite/conformance/certificates/vault/vault_approle.go:initVault', 'function:test/e2e/framework/addon/vault/setup.go:Init'],
  ['function:test/e2e/suite/conformance/certificates/venafi/venafi.go:createIssuer', 'function:test/e2e/framework/addon/venafi/tpp.go:BuildIssuer'],
  ['function:test/e2e/suite/conformance/certificates/venaficloud/cloud.go:createIssuer', 'function:test/e2e/framework/addon/venafi/cloud.go:BuildIssuer'],
  ['function:test/e2e/suite/conformance/certificatesigningrequests/acme/acme.go:runACMEIssuerTests', 'function:test/e2e/framework/framework.go:NewDefaultFramework'],
  ['function:test/e2e/suite/conformance/certificatesigningrequests/acme/acme.go:runACMEIssuerTests', 'function:test/e2e/framework/helper/featureset/featureset.go:NewFeatureSet'],
  ['function:test/e2e/suite/conformance/certificatesigningrequests/tests.go:Define', 'function:test/e2e/framework/framework.go:NewDefaultFramework'],
  ['function:test/e2e/suite/conformance/certificatesigningrequests/tests.go:Define', 'function:test/e2e/framework/helper/validation/validation.go:CertificateSigningRequestSetForUnsupportedFeatureSet'],
  ['function:test/e2e/suite/conformance/certificatesigningrequests/tests.go:Define', 'function:test/e2e/framework/helper/validation/certificatesigningrequests/certificatesigningrequests.go:ExpectValidCertificate'],
  ['function:test/e2e/suite/conformance/certificatesigningrequests/vault/approle.go:initVault', 'function:test/e2e/framework/addon/vault/setup.go:CreateAppRole'],
];

for (const [source, target] of calls) {
  edges.push({ source, target, type: 'calls', direction: 'forward', weight: 0.8 });
}

// partition
const sortedFiles = [...fileNodes.map((f) => f.path)].sort();
const parts = 3;
const chunkSize = Math.ceil(sortedFiles.length / parts);
const outDir = dispatch.outputDir;

let totalNodes = 0;
let totalEdges = 0;

for (let k = 0; k < parts; k++) {
  const filesInPart = new Set(sortedFiles.slice(k * chunkSize, (k + 1) * chunkSize));
  const partNodes = nodes.filter((n) => filesInPart.has(n.filePath || ''));
  const partNodeIds = new Set(partNodes.map((n) => n.id));
  const partEdges = edges.filter((e) => partNodeIds.has(e.source));
  const outPath = `${outDir}/batch-14-part-${k + 1}.json`;
  fs.writeFileSync(outPath, JSON.stringify({ nodes: partNodes, edges: partEdges }, null, 2));
  totalNodes += partNodes.length;
  totalEdges += partEdges.length;
  console.log(outPath, 'nodes', partNodes.length, 'edges', partEdges.length, 'files', filesInPart.size);
}
console.log('TOTAL nodes', totalNodes, 'edges', totalEdges, 'importsExpected', Object.values(importData).reduce((a, b) => a + b.length, 0));
console.log('emitted imports', edges.filter((e) => e.type === 'imports').length);
