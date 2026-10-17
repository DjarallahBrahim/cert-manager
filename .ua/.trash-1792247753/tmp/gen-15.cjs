const fs = require('fs');

const results = JSON.parse(fs.readFileSync('.ua/tmp/ua-file-extract-results-15.json', 'utf8'));
const prompt = JSON.parse(fs.readFileSync('.ua/tmp/prompts/batch-15.json', 'utf8'));

const fileMeta = {
  'internal/apis/acme/doc.go': {
    summary: 'Package documentation for the internal (unversioned) ACME API group, declaring deepcopy generation and the acme.cert-manager.io group name.',
    tags: ['documentation', 'api-group', 'acme', 'package-doc'], complexity: 'simple'
  },
  'internal/apis/acme/fuzzer/fuzzer.go': {
    summary: 'Registers randfill fuzzer functions for internal ACME Order and Challenge types, defaulting issuer references and JSON payloads for round-trip serialization tests.',
    tags: ['test', 'fuzzer', 'api-group', 'serialization'], complexity: 'simple'
  },
  'internal/apis/acme/install/install.go': {
    summary: 'Registers the internal ACME API group together with its v1 and meta versions into a Kubernetes runtime scheme.',
    tags: ['entry-point', 'api-group', 'registration', 'kubernetes'], complexity: 'simple'
  },
  'internal/apis/acme/register.go': {
    summary: 'Defines the internal ACME GroupVersion, scheme builder, and resource helper used to register Order and Challenge types.',
    tags: ['api-group', 'registration', 'kubernetes', 'type-definition'], complexity: 'simple'
  },
  'internal/apis/acme/types_challenge.go': {
    summary: 'Internal API types for ACME Challenge resources, including the challenge spec (URL, DNS name, token, solver) and its presented/processing status.',
    tags: ['data-model', 'api-type', 'acme', 'challenge'], complexity: 'moderate'
  },
  'internal/apis/acme/types_issuer.go': {
    summary: 'Internal API types describing ACME issuer configuration, including server and account settings, HTTP-01/DNS-01 challenge solvers, and credentials for every supported DNS provider.',
    tags: ['data-model', 'api-type', 'acme', 'issuer'], complexity: 'complex'
  },
  'internal/apis/acme/types_order.go': {
    summary: 'Internal API types for ACME Order resources plus the authorizations and challenges returned by an ACME server.',
    tags: ['data-model', 'api-type', 'acme', 'order'], complexity: 'moderate'
  },
  'internal/apis/acme/v1/doc.go': {
    summary: 'Package documentation for the internal acme/v1 API version, enabling conversion and deepcopy generation.',
    tags: ['documentation', 'api-group', 'acme', 'package-doc'], complexity: 'simple'
  },
  'internal/apis/acme/v1/zz_generated.conversion.go': {
    summary: 'Generated conversion functions translating between internal ACME types and the public v1 API types, including scheme registration.',
    tags: ['serialization', 'conversion', 'generated', 'api-group'], complexity: 'complex'
  },
  'internal/apis/acme/v1/zz_generated.defaults.go': {
    summary: 'Generated registration of defaulting functions for the internal acme/v1 API group.',
    tags: ['configuration', 'defaults', 'generated', 'api-group'], complexity: 'simple'
  },
  'internal/apis/acme/validation/challenge.go': {
    summary: 'Admission validation for Challenge resources, enforcing that the challenge spec is immutable after creation.',
    tags: ['validation', 'admission', 'acme', 'challenge'], complexity: 'simple'
  },
  'internal/apis/acme/validation/order.go': {
    summary: 'Admission validation for Order resources, enforcing immutability of the request, URLs, certificate, and authorization fields on update.',
    tags: ['validation', 'admission', 'acme', 'order'], complexity: 'moderate'
  },
  'internal/apis/acme/zz_generated.deepcopy.go': {
    summary: 'Generated deepcopy implementations for every internal ACME API type, supporting safe object caching and scheme registration.',
    tags: ['generated', 'deepcopy', 'api-group', 'acme'], complexity: 'complex'
  },
  'internal/apis/certmanager/doc.go': {
    summary: 'Package documentation for the internal (unversioned) cert-manager API group.',
    tags: ['documentation', 'api-group', 'cert-manager', 'package-doc'], complexity: 'simple'
  },
  'internal/apis/certmanager/fuzzer/fuzzer.go': {
    summary: 'Registers fuzzer functions for internal Certificate and CertificateRequest types, extending the ACME fuzzers with sensible defaults for issuer references and durations.',
    tags: ['test', 'fuzzer', 'api-group', 'certificate'], complexity: 'simple'
  },
  'internal/apis/certmanager/generic_issuer.go': {
    summary: 'Defines the GenericIssuer interface and accessor helpers that abstract uniformly over Issuer and ClusterIssuer objects.',
    tags: ['interface', 'utility', 'issuer', 'api-type'], complexity: 'moderate'
  },
  'internal/apis/certmanager/install/install.go': {
    summary: 'Registers the internal cert-manager API group with its internal, v1, and meta versions into a Kubernetes runtime scheme.',
    tags: ['entry-point', 'api-group', 'registration', 'kubernetes'], complexity: 'simple'
  },
  'internal/apis/certmanager/register.go': {
    summary: 'Defines the internal cert-manager GroupVersion, scheme builder, and resource helper for Certificate, CertificateRequest, Issuer, and ClusterIssuer.',
    tags: ['api-group', 'registration', 'kubernetes', 'type-definition'], complexity: 'simple'
  },
  'internal/apis/certmanager/types.go': {
    summary: 'Declares annotation keys, resource kind constants, key usage values, and signature algorithm constants shared across the internal cert-manager APIs.',
    tags: ['constants', 'api-type', 'cert-manager', 'annotations'], complexity: 'moderate'
  },
  'internal/apis/certmanager/types_certificate.go': {
    summary: 'Internal API types for Certificate resources, covering the certificate spec, private key settings, keystores, name constraints, status, and conditions.',
    tags: ['data-model', 'api-type', 'certificate', 'cert-manager'], complexity: 'complex'
  },
  'internal/apis/certmanager/types_certificaterequest.go': {
    summary: 'Internal API types for CertificateRequest resources, including the CSR spec, status, and approval/denial conditions.',
    tags: ['data-model', 'api-type', 'certificaterequest', 'cert-manager'], complexity: 'moderate'
  },
  'internal/apis/certmanager/types_issuer.go': {
    summary: 'Internal API types for Issuer and ClusterIssuer resources and their backends, including ACME, CA, Vault, Venafi, and self-signed configurations.',
    tags: ['data-model', 'api-type', 'issuer', 'cert-manager'], complexity: 'complex'
  },
  'internal/apis/certmanager/v1/zz_generated.conversion.go': {
    summary: 'Generated conversion functions translating between internal cert-manager types and the public v1 API types, including scheme registration.',
    tags: ['serialization', 'conversion', 'generated', 'api-group'], complexity: 'complex'
  },
  'internal/apis/certmanager/validation/clusterissuer.go': {
    summary: 'Admission validation entry points for ClusterIssuer resources that delegate to the shared issuer spec validation.',
    tags: ['validation', 'admission', 'issuer', 'clusterissuer'], complexity: 'simple'
  },
  'internal/apis/certmanager/validation/issuer.go': {
    summary: 'Comprehensive validation of Issuer and ClusterIssuer specs, covering ACME, CA, self-signed, Vault, and Venafi configurations and their credentials.',
    tags: ['validation', 'admission', 'issuer', 'acme'], complexity: 'complex'
  },
  'internal/apis/certmanager/validation/util/conditions.go': {
    summary: 'Utility helper for locating a CertificateRequest condition by its condition type.',
    tags: ['utility', 'conditions', 'certificaterequest', 'validation'], complexity: 'simple'
  },
  'internal/apis/certmanager/validation/util/nameserver.go': {
    summary: 'Validates and normalizes RFC2136 nameserver addresses into host:port form, defaulting the port to 53.',
    tags: ['utility', 'validation', 'dns', 'rfc2136'], complexity: 'moderate'
  },
  'internal/apis/certmanager/validation/warnings.go': {
    summary: 'Defines the warning message constants emitted by the cert-manager validating webhook, including ACME EAB deprecation and private key rotation policy notices.',
    tags: ['constants', 'validation', 'admission', 'warnings'], complexity: 'simple'
  },
  'internal/apis/certmanager/zz_generated.deepcopy.go': {
    summary: 'Generated deepcopy implementations for every internal cert-manager API type, supporting safe object caching and scheme registration.',
    tags: ['generated', 'deepcopy', 'api-group', 'cert-manager'], complexity: 'complex'
  }
};

const acmeIssuerTags = ['data-model', 'api-type', 'acme', 'issuer'];
const acmeSolverTags = ['data-model', 'api-type', 'acme', 'solver'];
const acmeDNSTags = ['data-model', 'api-type', 'acme', 'dns'];
const acmeChallengeTags = ['data-model', 'api-type', 'acme', 'challenge'];
const acmeOrderTags = ['data-model', 'api-type', 'acme', 'order'];
const cmCertTags = ['data-model', 'api-type', 'certificate', 'cert-manager'];
const cmCRTags = ['data-model', 'api-type', 'certificaterequest', 'cert-manager'];
const cmIssuerTags = ['data-model', 'api-type', 'issuer', 'cert-manager'];

const classMeta = {
  'internal/apis/acme/types_challenge.go': [
    ['Challenge', 'Challenge resource representing a single ACME challenge request and its current state.', acmeChallengeTags],
    ['ChallengeList', 'List wrapper for Challenge resources.', acmeChallengeTags],
    ['ChallengeSpec', 'Desired challenge properties: ACME URLs, DNS name, wildcard flag, challenge type, token, key, solver, and issuer reference.', acmeChallengeTags],
    ['ChallengeStatus', 'Observed challenge state including whether it is being processed, presented, and its current ACME state.', acmeChallengeTags]
  ],
  'internal/apis/acme/types_issuer.go': [
    ['ACMEIssuer', 'ACME issuer configuration: server URL, account email, private key secret, external account binding, solvers, and status.', acmeIssuerTags],
    ['ACMEExternalAccountBinding', 'External account binding credentials (key ID, key secret, and algorithm) used when registering an ACME account.', acmeIssuerTags],
    ['ACMEChallengeSolver', 'Challenge solver entry combining a DNS name selector with HTTP-01 or DNS-01 solver configuration.', acmeSolverTags],
    ['CertificateDNSNameSelector', 'Selects the DNS names and wildcard patterns to which a challenge solver applies.', acmeSolverTags],
    ['ACMEChallengeSolverHTTP01', 'HTTP-01 solver configuration, choosing between ingress and Gateway API HTTPRoute based solving.', acmeSolverTags],
    ['ACMEChallengeSolverHTTP01Ingress', 'Ingress-based HTTP-01 solver options including ingress class, service type, and pod template customizations.', acmeSolverTags],
    ['ACMEChallengeSolverHTTP01GatewayHTTPRoute', 'Gateway API HTTPRoute-based HTTP-01 solver settings such as parent references, labels, and annotations.', acmeSolverTags],
    ['ACMEChallengeSolverHTTP01IngressPodTemplate', 'Pod template customizations applied to the pods created by the HTTP-01 solver.', acmeSolverTags],
    ['ACMEChallengeSolverHTTP01IngressPodObjectMeta', 'Labels and annotations applied to HTTP-01 solver pods.', acmeSolverTags],
    ['ACMEChallengeSolverHTTP01IngressPodSpec', 'Pod spec overrides for HTTP-01 solver pods including affinity, tolerations, priority class, and node selector.', acmeSolverTags],
    ['ACMEChallengeSolverHTTP01IngressTemplate', 'Template customizations applied to the ingress created by the HTTP-01 solver.', acmeSolverTags],
    ['ACMEChallengeSolverHTTP01IngressObjectMeta', 'Labels and annotations applied to HTTP-01 solver ingresses.', acmeSolverTags],
    ['ACMEChallengeSolverDNS01', 'DNS-01 solver configuration holding credentials for each supported DNS provider.', acmeSolverTags],
    ['ACMEChallengeSolverHTTP01IngressPodSecurityContext', 'Security context overrides for HTTP-01 solver pods.', acmeSolverTags],
    ['ACMEChallengeSolverHTTP01IngressPodResources', 'Resource requests and limits for HTTP-01 solver pods.', acmeSolverTags],
    ['ACMEIssuerDNS01ProviderAkamai', 'Akamai FastDNS credentials and settings for DNS-01 solving.', acmeDNSTags],
    ['ACMEIssuerDNS01ProviderCloudDNS', 'Google Cloud DNS project and service account credentials for DNS-01 solving.', acmeDNSTags],
    ['ACMEIssuerDNS01ProviderCloudflare', 'Cloudflare API credentials and optional email for DNS-01 solving.', acmeDNSTags],
    ['ACMEIssuerDNS01ProviderDigitalOcean', 'DigitalOcean API token for DNS-01 solving.', acmeDNSTags],
    ['ACMEIssuerDNS01ProviderRoute53', 'AWS Route53 credentials, region, hosted zone, and role settings for DNS-01 solving.', acmeDNSTags],
    ['Route53Auth', 'Authentication configuration for Route53 DNS-01 solving.', acmeDNSTags],
    ['Route53KubernetesAuth', 'Kubernetes service account based authentication for Route53.', acmeDNSTags],
    ['ServiceAccountRef', 'Reference to a Kubernetes service account used by DNS providers for authentication.', acmeDNSTags],
    ['ACMEIssuerDNS01ProviderAzureDNS', 'Azure DNS credentials, subscription, resource group, and managed identity settings.', acmeDNSTags],
    ['AzureManagedIdentity', 'Azure managed identity configuration including client, resource, and tenant IDs.', acmeDNSTags],
    ['ACMEIssuerDNS01ProviderAcmeDNS', 'acme-dns service account credentials for DNS-01 solving.', acmeDNSTags],
    ['ACMEIssuerDNS01ProviderRFC2136', 'RFC2136 dynamic DNS update settings including nameserver, TSIG credentials, and zone.', acmeDNSTags],
    ['ACMEIssuerDNS01ProviderWebhook', 'Webhook-based DNS provider configuration with solver name, group, and raw payload.', acmeDNSTags],
    ['ACMEIssuerStatus', 'Observed ACME issuer state, including the ACME directory URL and per-solver status.', acmeIssuerTags]
  ],
  'internal/apis/acme/types_order.go': [
    ['Order', 'Order resource representing an ACME order and its progress towards certificate issuance.', acmeOrderTags],
    ['OrderList', 'List wrapper for Order resources.', acmeOrderTags],
    ['OrderSpec', 'Desired order properties: DER-encoded CSR, issuer reference, common name, DNS names, IPs, duration, and profile.', acmeOrderTags],
    ['OrderStatus', 'Observed order state: URL, finalize URL, issued certificate, state, reason, authorizations, and failure time.', acmeOrderTags],
    ['ACMEAuthorization', 'Authorization returned by the ACME server describing an identifier that must be validated and its challenges.', acmeOrderTags],
    ['ACMEChallenge', 'Challenge offered by the ACME server for an authorization, identified by URL, token, and type.', acmeOrderTags]
  ],
  'internal/apis/certmanager/generic_issuer.go': [
    ['GenericIssuer', 'Interface abstracting Issuer and ClusterIssuer so controllers can read and write specs, statuses, and object metadata uniformly.', ['interface', 'api-type', 'issuer', 'abstraction']]
  ],
  'internal/apis/certmanager/types_certificate.go': [
    ['Certificate', 'Certificate resource requesting an X.509 certificate and storing the resulting key pair in a Secret.', cmCertTags],
    ['CertificateList', 'List wrapper for Certificate resources.', cmCertTags],
    ['CertificateSpec', 'Desired certificate properties: subject and SANs, issuer reference, duration, renewal, private key, keystores, and output formats.', cmCertTags],
    ['OtherName', 'Additional subject alternative name encoded as an OID and value pair.', cmCertTags],
    ['CertificatePrivateKey', 'Private key algorithm, size, encoding, rotation policy, and re-use settings for issued certificates.', cmCertTags],
    ['CertificateAdditionalOutputFormat', 'Additional output format (for example PKCS#12 or JKS) requested for the issued certificate.', cmCertTags],
    ['X509Subject', 'X.509 subject fields such as organization, country, locality, and serial number.', cmCertTags],
    ['CertificateKeystores', 'Keystore outputs (JKS and PKCS#12) generated alongside the certificate.', cmCertTags],
    ['JKSKeystore', 'JKS keystore configuration including the password secret reference, alias, and creation policy.', cmCertTags],
    ['PKCS12Keystore', 'PKCS#12 keystore configuration including the password secret reference, profile, and creation policy.', cmCertTags],
    ['CertificateStatus', 'Observed certificate state: conditions, renewal time, revision, and failure information.', cmCertTags],
    ['CertificateCondition', 'A single condition describing the lifecycle state of a Certificate.', cmCertTags],
    ['CertificateSecretTemplate', 'Annotations and labels applied to the Secret that holds the issued certificate.', cmCertTags],
    ['NameConstraints', 'X.509 name constraints listing permitted and excluded DNS names and IP ranges.', cmCertTags],
    ['NameConstraintItem', 'A single permitted or excluded name-constraint entry.', cmCertTags]
  ],
  'internal/apis/certmanager/types_certificaterequest.go': [
    ['CertificateRequest', 'CertificateRequest resource carrying a certificate signing request for an issuer to sign.', cmCRTags],
    ['CertificateRequestList', 'List wrapper for CertificateRequest resources.', cmCRTags],
    ['CertificateRequestSpec', 'Signing request details: CSR bytes, issuer reference, duration, key usages, and username/groups.', cmCRTags],
    ['CertificateRequestStatus', 'Observed request state: conditions, issued certificate, CA flag, and failure time.', cmCRTags],
    ['CertificateRequestCondition', 'A single condition on a CertificateRequest such as approved, denied, or ready.', cmCRTags]
  ],
  'internal/apis/certmanager/types_issuer.go': [
    ['ClusterIssuer', 'Cluster-scoped issuer resource that can sign certificate requests for any namespace.', cmIssuerTags],
    ['ClusterIssuerList', 'List wrapper for ClusterIssuer resources.', cmIssuerTags],
    ['Issuer', 'Namespaced issuer resource that signs certificate requests.', cmIssuerTags],
    ['IssuerList', 'List wrapper for Issuer resources.', cmIssuerTags],
    ['IssuerSpec', 'Issuer specification holding the selected issuer backend configuration.', cmIssuerTags],
    ['IssuerConfig', 'Union of supported issuer backends: ACME, CA, Vault, Venafi, and self-signed.', cmIssuerTags],
    ['VenafiIssuer', 'Venafi issuer configuration selecting either the TPP or Cloud backend.', cmIssuerTags],
    ['VenafiTPP', 'Venafi TPP endpoint and access credentials.', cmIssuerTags],
    ['VenafiCloud', 'Venafi Cloud endpoint and access credentials.', cmIssuerTags],
    ['SelfSignedIssuer', 'Self-signed issuer configuration, which requires no additional fields.', cmIssuerTags],
    ['VaultIssuer', 'HashiCorp Vault issuer configuration including server, path, namespace, and authentication.', cmIssuerTags],
    ['VaultAuth', 'Union of Vault authentication methods: token secret, AppRole, Kubernetes, or client certificate.', cmIssuerTags],
    ['VaultAppRole', 'Vault AppRole authentication credentials with role ID and secret reference.', cmIssuerTags],
    ['VaultClientCertificateAuth', 'Vault client certificate authentication with mount path and secret reference.', cmIssuerTags],
    ['VaultKubernetesAuth', 'Vault Kubernetes authentication using a service account and role.', cmIssuerTags],
    ['ServiceAccountRef', 'Reference to a Kubernetes service account used for authentication.', cmIssuerTags],
    ['CAIssuer', 'CA issuer configuration with a signing secret and optional CRL distribution points.', cmIssuerTags],
    ['IssuerStatus', 'Observed issuer state and conditions.', cmIssuerTags],
    ['IssuerCondition', 'A single condition describing the readiness of an Issuer.', cmIssuerTags]
  ]
};

const functionMeta = {
  'internal/apis/acme/install/install.go': [
    ['Install', 'Installs the internal ACME API group and its v1 and meta versions into the given runtime scheme.', ['entry-point', 'api-group', 'registration']]
  ],
  'internal/apis/acme/register.go': [
    ['Resource', 'Returns the fully qualified GroupResource for an ACME resource name.', ['utility', 'api-group', 'registration']],
    ['addKnownTypes', 'Registers Order and Challenge types with the internal ACME scheme group version.', ['registration', 'api-group', 'scheme']]
  ],
  'internal/apis/acme/v1/zz_generated.conversion.go': [
    ['RegisterConversions', 'Registers the generated conversion functions between internal and v1 ACME types with the conversion scheme.', ['serialization', 'conversion', 'generated']]
  ],
  'internal/apis/acme/v1/zz_generated.defaults.go': [
    ['RegisterDefaults', 'Registers the defaulting functions for Challenge and Order resources in the v1 scheme.', ['configuration', 'defaults', 'generated']]
  ],
  'internal/apis/acme/validation/challenge.go': [
    ['ValidateChallengeUpdate', 'Rejects updates that mutate an existing Challenge spec, keeping it immutable after creation.', ['validation', 'admission', 'acme']],
    ['ValidateChallenge', 'Accepts all Challenge create requests without additional validation.', ['validation', 'admission', 'acme']]
  ],
  'internal/apis/acme/validation/order.go': [
    ['ValidateOrderUpdate', 'Validates Order updates by delegating to spec and status immutability checks.', ['validation', 'admission', 'acme']],
    ['ValidateOrder', 'Accepts all Order create requests without additional validation.', ['validation', 'admission', 'acme']],
    ['ValidateOrderSpecUpdate', 'Rejects changes to the Order request bytes once they have been set.', ['validation', 'immutability', 'acme']],
    ['ValidateOrderStatusUpdate', 'Enforces immutability of Order status fields including URLs, certificate, and authorizations.', ['validation', 'immutability', 'acme']]
  ],
  'internal/apis/certmanager/generic_issuer.go': [
    ['ACMEStatus', 'Returns the ACME-specific status of an issuer so callers can access it through concrete issuer types.', ['utility', 'issuer', 'acme']]
  ],
  'internal/apis/certmanager/install/install.go': [
    ['Install', 'Installs the internal cert-manager API group, its v1 version, and meta v1 into the given runtime scheme.', ['entry-point', 'api-group', 'registration']]
  ],
  'internal/apis/certmanager/register.go': [
    ['Resource', 'Returns the fully qualified GroupResource for a cert-manager resource name.', ['utility', 'api-group', 'registration']],
    ['addKnownTypes', 'Registers Certificate, CertificateRequest, Issuer, and ClusterIssuer types with the internal scheme group version.', ['registration', 'api-group', 'scheme']]
  ],
  'internal/apis/certmanager/v1/zz_generated.conversion.go': [
    ['RegisterConversions', 'Registers the generated conversion functions between internal and v1 cert-manager API types with the conversion scheme.', ['serialization', 'conversion', 'generated']]
  ],
  'internal/apis/certmanager/validation/clusterissuer.go': [
    ['ValidateClusterIssuer', 'Validates a ClusterIssuer spec through the shared issuer spec validation.', ['validation', 'admission', 'clusterissuer']],
    ['ValidateUpdateClusterIssuer', 'Validates updates to a ClusterIssuer using the shared issuer spec validation.', ['validation', 'admission', 'clusterissuer']]
  ],
  'internal/apis/certmanager/validation/issuer.go': [
    ['ValidateIssuer', 'Entry point that validates an Issuer spec on admission.', ['validation', 'admission', 'issuer']],
    ['ValidateUpdateIssuer', 'Validates Issuer updates through the shared issuer spec validation.', ['validation', 'admission', 'issuer']],
    ['ValidateIssuerSpec', 'Validates an issuer specification by delegating to the selected issuer configuration validator.', ['validation', 'issuer', 'dispatch']],
    ['ValidateIssuerConfig', 'Checks that exactly one issuer backend is configured and dispatches to its dedicated validator.', ['validation', 'issuer', 'dispatch']],
    ['ValidateACMEIssuerConfig', 'Validates ACME issuer server, credentials, and challenge solver configuration.', ['validation', 'issuer', 'acme']],
    ['ValidateACMEIssuerChallengeSolverConfig', 'Validates a challenge solver selector and its HTTP-01 or DNS-01 configuration.', ['validation', 'acme', 'solver']],
    ['ValidateACMEIssuerChallengeSolverHTTP01Config', 'Validates HTTP-01 solver configuration, requiring exactly one of ingress or gateway.', ['validation', 'acme', 'http01']],
    ['ValidateACMEIssuerChallengeSolverHTTP01IngressConfig', 'Validates ingress-based HTTP-01 solver settings such as service type and ingress class.', ['validation', 'acme', 'http01']],
    ['ValidateACMEIssuerChallengeSolverHTTP01GatewayConfig', 'Validates Gateway API HTTPRoute-based HTTP-01 solver settings.', ['validation', 'acme', 'http01']],
    ['ValidateCAIssuerConfig', 'Validates CA issuer secret references and CRL distribution points.', ['validation', 'issuer', 'ca']],
    ['ValidateSelfSignedIssuerConfig', 'Accepts self-signed issuer configuration, which has no required fields.', ['validation', 'issuer', 'self-signed']],
    ['ValidateVaultIssuerConfig', 'Validates Vault issuer server, path, namespace, and authentication settings.', ['validation', 'issuer', 'vault']],
    ['ValidateVaultIssuerAuth', 'Validates that exactly one Vault authentication method is configured and that its required fields are present.', ['validation', 'vault', 'authentication']],
    ['ValidateVenafiTPP', 'Validates Venafi TPP URL and access credentials.', ['validation', 'issuer', 'venafi']],
    ['validateVenafiTPPCABundleUnique', 'Ensures a Venafi TPP CA bundle is not provided in more than one field.', ['validation', 'venafi', 'utility']],
    ['ValidateVenafiCloud', 'Accepts Venafi Cloud configuration for further validation by the shared Venafi validator.', ['validation', 'issuer', 'venafi']],
    ['ValidateVenafiIssuerConfig', 'Validates that exactly one Venafi backend (TPP or Cloud) is configured.', ['validation', 'issuer', 'venafi']],
    ['ValidateACMEChallengeSolverDNS01', 'Validates DNS-01 provider credentials and ensures only one provider is configured.', ['validation', 'acme', 'dns']],
    ['ValidateSecretKeySelector', 'Validates a secret key selector used for issuer credentials.', ['validation', 'secret', 'utility']],
    ['validateCABundleNotEmpty', 'Rejects an explicitly empty CA bundle value.', ['validation', 'utility', 'certificate']]
  ],
  'internal/apis/certmanager/validation/util/conditions.go': [
    ['GetCertificateRequestCondition', 'Returns the CertificateRequest condition matching the given type, or nil when it is absent.', ['utility', 'conditions', 'certificaterequest']]
  ],
  'internal/apis/certmanager/validation/util/nameserver.go': [
    ['ValidNameserver', 'Normalizes and validates an RFC2136 nameserver address, defaulting the port to 53 and returning host:port form.', ['utility', 'validation', 'dns']]
  ]
};

const callEdges = [
  ['internal/apis/acme/validation/order.go', 'ValidateOrderUpdate', 'ValidateOrderSpecUpdate'],
  ['internal/apis/acme/validation/order.go', 'ValidateOrderUpdate', 'ValidateOrderStatusUpdate'],
  ['internal/apis/certmanager/validation/clusterissuer.go', 'ValidateClusterIssuer', 'internal/apis/certmanager/validation/issuer.go', 'ValidateIssuerSpec'],
  ['internal/apis/certmanager/validation/clusterissuer.go', 'ValidateUpdateClusterIssuer', 'internal/apis/certmanager/validation/issuer.go', 'ValidateIssuerSpec'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateIssuer', 'ValidateIssuerSpec'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateUpdateIssuer', 'ValidateIssuerSpec'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateIssuerSpec', 'ValidateIssuerConfig'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateIssuerConfig', 'ValidateACMEIssuerConfig'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateIssuerConfig', 'ValidateCAIssuerConfig'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateIssuerConfig', 'ValidateSelfSignedIssuerConfig'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateIssuerConfig', 'ValidateVaultIssuerConfig'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateIssuerConfig', 'ValidateVenafiIssuerConfig'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateACMEIssuerConfig', 'ValidateACMEIssuerChallengeSolverConfig'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateACMEIssuerChallengeSolverConfig', 'ValidateACMEIssuerChallengeSolverHTTP01Config'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateACMEIssuerChallengeSolverConfig', 'ValidateACMEChallengeSolverDNS01'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateACMEIssuerChallengeSolverHTTP01Config', 'ValidateACMEIssuerChallengeSolverHTTP01IngressConfig'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateACMEIssuerChallengeSolverHTTP01Config', 'ValidateACMEIssuerChallengeSolverHTTP01GatewayConfig'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateVaultIssuerConfig', 'ValidateVaultIssuerAuth'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateVenafiIssuerConfig', 'ValidateVenafiTPP'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateVenafiIssuerConfig', 'ValidateVenafiCloud'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateVenafiTPP', 'validateVenafiTPPCABundleUnique'],
  ['internal/apis/certmanager/validation/issuer.go', 'ValidateACMEChallengeSolverDNS01', 'ValidateSecretKeySelector']
];

function complexityForLines(lines) {
  if (lines >= 80) return 'complex';
  if (lines >= 20) return 'moderate';
  return 'simple';
}
function fnComplexity(lines) {
  if (lines >= 40) return 'complex';
  if (lines >= 10) return 'moderate';
  return 'simple';
}

const nodes = [];
const nodeFile = new Map();

for (const f of results.results) {
  const meta = fileMeta[f.path];
  if (!meta) throw new Error('missing file meta ' + f.path);
  const id = 'file:' + f.path;
  nodes.push({
    id, type: 'file', name: f.path.split('/').pop(), filePath: f.path,
    summary: meta.summary, tags: meta.tags, complexity: meta.complexity
  });
  nodeFile.set(id, f.path);

  for (const c of (f.classes || [])) {
    const list = classMeta[f.path];
    if (!list) continue;
    const entry = list.find(e => e[0] === c.name);
    if (!entry) continue;
    const cid = 'class:' + f.path + ':' + c.name;
    nodes.push({
      id: cid, type: 'class', name: c.name, filePath: f.path,
      lineRange: [c.startLine, c.endLine], summary: entry[1], tags: entry[2],
      complexity: complexityForLines(c.endLine - c.startLine + 1)
    });
    nodeFile.set(cid, f.path);
  }

  for (const item of (functionMeta[f.path] || [])) {
    const [name, summary, tags] = item;
    const fn = (f.functions || []).find(x => x.name === name);
    if (!fn) throw new Error('function not found: ' + f.path + ':' + name);
    const fid = 'function:' + f.path + ':' + name;
    nodes.push({
      id: fid, type: 'function', name, filePath: f.path,
      lineRange: [fn.startLine, fn.endLine], summary, tags,
      complexity: fnComplexity(fn.endLine - fn.startLine + 1)
    });
    nodeFile.set(fid, f.path);
  }
}

const edges = [];

function addEdge(source, target, type, weight) {
  if (source === target) throw new Error('self edge ' + source);
  edges.push({ source, target, type, direction: 'forward', weight });
}

// imports: exactly batchImportData
for (const f of results.results) {
  for (const target of (prompt.batchImportData[f.path] || [])) {
    addEdge('file:' + f.path, 'file:' + target, 'imports', 0.7);
  }
}

// contains + exports
for (const n of nodes) {
  if (n.type === 'class' || n.type === 'function') {
    addEdge('file:' + n.filePath, n.id, 'contains', 1.0);
  }
}

const nonExported = new Set(['addKnownTypes', 'validateVenafiTPPCABundleUnique', 'validateCABundleNotEmpty']);
for (const n of nodes) {
  if (n.type === 'class') addEdge('file:' + n.filePath, n.id, 'exports', 0.8);
  if (n.type === 'function' && !nonExported.has(n.name)) addEdge('file:' + n.filePath, n.id, 'exports', 0.8);
}

// calls
for (const c of callEdges) {
  if (c.length === 3) {
    const [file, caller, callee] = c;
    addEdge('function:' + file + ':' + caller, 'function:' + file + ':' + callee, 'calls', 0.8);
  } else {
    const [file, caller, targetFile, callee] = c;
    addEdge('function:' + file + ':' + caller, 'function:' + targetFile + ':' + callee, 'calls', 0.8);
  }
}

// validate unique ids
const seen = new Set();
for (const n of nodes) {
  if (seen.has(n.id)) throw new Error('dup node ' + n.id);
  seen.add(n.id);
}
// validate edge endpoints
const knownFiles = new Set(results.results.map(f => f.path));
for (const f of results.results) for (const t of (prompt.batchImportData[f.path] || [])) knownFiles.add(t);
for (const k of Object.keys(prompt.neighborMap || {})) {
  knownFiles.add(k);
  for (const nb of prompt.neighborMap[k]) knownFiles.add(nb.path);
}
for (const e of edges) {
  for (const end of [e.source, e.target]) {
    if (!seen.has(end)) {
      if (end.startsWith('file:') && knownFiles.has(end.slice(5))) continue;
      if (end.startsWith('function:') || end.startsWith('class:')) {
        const rest = end.split(':');
        const p = rest.slice(1, -1).join(':');
        if (knownFiles.has(p)) continue;
      }
      throw new Error('dangling edge endpoint ' + end);
    }
  }
}

// partition
const filesSorted = results.results.map(f => f.path).sort();
const nodeCount = nodes.length;
const edgeCount = edges.length;
const parts = Math.ceil(Math.max(nodeCount / 60, edgeCount / 120));
const chunkSize = Math.ceil(filesSorted.length / parts);
const groups = [];
for (let i = 0; i < parts; i++) {
  groups.push(filesSorted.slice(i * chunkSize, (i + 1) * chunkSize));
}

const outDir = '.ua/intermediate';
let totalNodes = 0, totalEdges = 0;
groups.forEach((group, idx) => {
  const groupSet = new Set(group);
  const partNodes = nodes.filter(n => groupSet.has(n.filePath));
  const partNodeIds = new Set(partNodes.map(n => n.id));
  const partEdges = edges.filter(e => {
    const srcFile = nodeFile.get(e.source);
    return srcFile && groupSet.has(srcFile);
  });
  totalNodes += partNodes.length;
  totalEdges += partEdges.length;
  const out = { nodes: partNodes, edges: partEdges };
  fs.writeFileSync(`${outDir}/batch-15-part-${idx + 1}.json`, JSON.stringify(out, null, 2));
  console.log(`part ${idx + 1}: files=${group.length} nodes=${partNodes.length} edges=${partEdges.length}`);
});
console.log('TOTAL nodes', totalNodes, 'edges', totalEdges, 'parts', parts, 'importEdgesExpected', Object.values(prompt.batchImportData).reduce((a, b) => a + b.length, 0));
