import fs from 'fs';

const root = '/Users/samtyga/Desktop/work/cert-manager';
const dispatch = JSON.parse(fs.readFileSync(`${root}/.ua/tmp/prompts/batch-11.json`, 'utf8'));
const ext = JSON.parse(fs.readFileSync(`${root}/.ua/tmp/ua-file-extract-results-11.json`, 'utf8'));

const files = {
 'pkg/controller/acmeorders/selectors/selector.go': {
  summary: 'Defines the Selector interface used by the ACME orders controller to match challenge solvers against certificates and DNS names.',
  tags: ['acme', 'solver-selection', 'interface', 'type-definition'], complexity: 'simple' },
 'pkg/controller/acmeorders/util.go': {
  summary: 'Shared helpers for the ACME Orders controller that build partial Challenge resources and track challenge lifecycle state.',
  tags: ['acme', 'orders', 'challenge', 'helper'], complexity: 'moderate' },
 'pkg/controller/certificaterequests/acme/acme.go': {
  summary: 'ACME issuer implementation for CertificateRequest resources that creates ACME Orders and waits for certificates to be issued.',
  tags: ['acme', 'issuer', 'certificate-request', 'controller'], complexity: 'complex' },
 'pkg/controller/certificatesigningrequests/acme/acme.go': {
  summary: 'ACME issuer for Kubernetes CertificateSigningRequests, bridging CSRs into ACME Orders and reflected status conditions.',
  tags: ['acme', 'issuer', 'csr', 'controller'], complexity: 'complex' },
 'pkg/issuer/acme/dns/acmedns/acmedns.go': {
  summary: 'DNS-01 provider that delegates challenge presentation to an external acme-dns service.',
  tags: ['dns01', 'acme-dns', 'provider', 'dns'], complexity: 'simple' },
 'pkg/issuer/acme/dns/akamai/akamai.go': {
  summary: 'Akamai EdgeDNS provider for ACME DNS-01 challenges, managing challenge TXT records through the Open EdgeGrid API.',
  tags: ['dns01', 'akamai', 'provider', 'dns'], complexity: 'complex' },
 'pkg/issuer/acme/dns/azuredns/azuredns.go': {
  summary: 'Azure DNS provider for ACME DNS-01 challenges supporting service principal, ambient, and managed identity authentication.',
  tags: ['dns01', 'azure', 'provider', 'dns'], complexity: 'complex' },
 'pkg/issuer/acme/dns/clouddns/clouddns.go': {
  summary: 'Google Cloud DNS provider for ACME DNS-01 challenges with ambient and service-account credentials.',
  tags: ['dns01', 'gcp', 'clouddns', 'provider'], complexity: 'complex' },
 'pkg/issuer/acme/dns/cloudflare/cloudflare.go': {
  summary: 'Cloudflare DNS provider for ACME DNS-01 challenges using the Cloudflare v4 API.',
  tags: ['dns01', 'cloudflare', 'provider', 'dns'], complexity: 'complex' },
 'pkg/issuer/acme/dns/digitalocean/digitalocean.go': {
  summary: 'DigitalOcean DNS provider for ACME DNS-01 challenges.',
  tags: ['dns01', 'digitalocean', 'provider', 'dns'], complexity: 'moderate' },
 'pkg/issuer/acme/dns/dns.go': {
  summary: 'Core DNS-01 solver that resolves issuer solver configuration, instantiates DNS providers, and drives challenge presentation and cleanup.',
  tags: ['dns01', 'solver', 'acme', 'provider-factory'], complexity: 'complex' },
 'pkg/issuer/acme/dns/rfc2136/provider.go': {
  summary: 'RFC 2136 dynamic DNS update solver for ACME DNS-01 challenges, loading nameserver and TSIG settings from secrets.',
  tags: ['dns01', 'rfc2136', 'provider', 'dns'], complexity: 'moderate' },
 'pkg/issuer/acme/dns/rfc2136/tsig.go': {
  summary: 'TSIG signing and verification helpers used by the RFC 2136 dynamic DNS provider.',
  tags: ['dns', 'tsig', 'rfc2136', 'security'], complexity: 'moderate' },
 'pkg/issuer/acme/dns/route53/route53.go': {
  summary: 'AWS Route53 DNS provider for ACME DNS-01 challenges with IAM, ambient, and web identity credentials.',
  tags: ['dns01', 'route53', 'aws', 'provider'], complexity: 'complex' },
 'pkg/issuer/acme/dns/util/dns.go': {
  summary: 'DNS helper utilities for resolving challenge FQDNs with optional CNAME following.',
  tags: ['dns01', 'dns', 'utility', 'lookup'], complexity: 'simple' },
 'pkg/issuer/acme/dns/util/wait.go': {
  summary: 'DNS propagation utilities that query authoritative nameservers until challenge TXT records become visible.',
  tags: ['dns01', 'propagation', 'dns', 'wait'], complexity: 'complex' },
 'pkg/issuer/acme/dns/webhook/webhook.go': {
  summary: 'DNS-01 solver that delegates challenge presentation and cleanup to an external webhook service.',
  tags: ['dns01', 'webhook', 'solver', 'external-integration'], complexity: 'moderate' },
 'pkg/issuer/acme/http/httproute.go': {
  summary: 'Manages Gateway API HTTPRoutes so HTTP-01 challenge requests reach the solver service.',
  tags: ['http01', 'gateway-api', 'httproute', 'kubernetes'], complexity: 'moderate' },
 'pkg/issuer/acme/http/ingress.go': {
  summary: 'Ingress-based HTTP-01 solver that creates and patches Ingresses to serve ACME challenge paths.',
  tags: ['http01', 'ingress', 'solver', 'kubernetes'], complexity: 'complex' },
 'pkg/issuer/acme/http/pod.go': {
  summary: 'Builds, reconciles, and cleans up the solver pods that serve HTTP-01 challenge responses.',
  tags: ['http01', 'pod', 'solver', 'kubernetes'], complexity: 'complex' },
 'pkg/issuer/acme/http/service.go': {
  summary: 'Creates and cleans up the Service that exposes HTTP-01 solver pods.',
  tags: ['http01', 'service', 'solver', 'kubernetes'], complexity: 'moderate' },
 'pkg/util/solverpicker/solverpicker.go': {
  summary: 'Selects the challenge solver that matches a domain and challenge set, honouring issuer solver ordering and fallback.',
  tags: ['solver-selection', 'acme', 'matching', 'utility'], complexity: 'moderate' },
 'test/acme/fixture.go': {
  summary: 'End-to-end ACME conformance test fixture that exercises challenge solvers against a live test server.',
  tags: ['test', 'integration-testing', 'acme', 'fixture'], complexity: 'moderate' },
 'test/acme/options.go': {
  summary: 'Configuration options, defaults, and validation for the ACME conformance test fixture.',
  tags: ['test', 'configuration', 'acme', 'options'], complexity: 'moderate' },
 'test/acme/util.go': {
  summary: 'Shared helpers for ACME conformance tests covering namespaces, webhook payloads, and DNS propagation checks.',
  tags: ['test', 'helper', 'acme', 'integration-testing'], complexity: 'moderate' },
 'test/apiserver/apiserver.go': {
  summary: 'Helper that starts a bare Kubernetes API server for integration tests.',
  tags: ['test', 'kubernetes', 'api-server', 'infrastructure'], complexity: 'simple' },
 'test/apiserver/envs.go': {
  summary: 'Environment helpers that locate and expose the envtest binaries required by API server tests.',
  tags: ['test', 'envtest', 'configuration', 'helper'], complexity: 'simple' },
 'test/unit/gen/challenge.go': {
  summary: 'Builder helpers that generate Challenge resources with varied fields for unit tests.',
  tags: ['test', 'factory', 'challenge', 'fixtures'], complexity: 'moderate' },
 'test/unit/gen/order.go': {
  summary: 'Builder helpers that generate Order resources with varied fields for unit tests.',
  tags: ['test', 'factory', 'order', 'fixtures'], complexity: 'moderate' },
 'test/unit/listers/order.go': {
  summary: 'Fake Order listers used by unit tests to stub lister behaviour.',
  tags: ['test', 'fake', 'lister', 'fixtures'], complexity: 'simple' },
};

// key: `${path}|${kind}|${name}`
const syms = {
 'pkg/controller/acmeorders/selectors/selector.go|class|Selector': [
  'Interface for solver selector predicates that report whether a solver matches an order.', ['interface', 'predicate', 'solver-selection'], 'simple'],
 'pkg/controller/acmeorders/util.go|function|buildPartialRequiredChallenges': [
  'Builds the set of partial Challenge objects required to satisfy an ACME order\'s authorizations.', ['challenge', 'order', 'builder'], 'moderate'],
 'pkg/controller/acmeorders/util.go|function|buildPartialChallenge': [
  'Constructs a single partial Challenge for an authorization using the selected solver.', ['challenge', 'builder', 'solver'], 'moderate'],
 'pkg/controller/acmeorders/util.go|function|partialChallengeSpecForAuthorization': [
  'Derives a Challenge spec with type, token, solver, and DNS name from an ACME authorization.', ['challenge', 'spec', 'acme'], 'complex'],
 'pkg/controller/acmeorders/util.go|function|challengeType': [
  'Maps an ACME authorization identifier type to the corresponding ACME challenge type.', ['mapping', 'challenge', 'acme'], 'simple'],
 'pkg/controller/acmeorders/util.go|function|applyIngressParameterAnnotationOverrides': [
  'Applies issuer-level ingress annotation overrides to HTTP-01 solver configuration.', ['ingress', 'annotation', 'override'], 'moderate'],
 'pkg/controller/acmeorders/util.go|function|ensureKeysForChallenges': [
  'Ensures challenge records are keyed by namespace and name in the map used for diffing.', ['helper', 'collection', 'challenge'], 'moderate'],

 'pkg/controller/certificaterequests/acme/acme.go|class|ACME': [
  'CertificateRequest issuer backed by an ACME client and Order lister.', ['acme', 'issuer', 'controller'], 'moderate'],
 'pkg/controller/certificaterequests/acme/acme.go|function|init': [
  'Registers the ACME CertificateRequest issuer with the issuer registry at package init time.', ['initialization', 'registration', 'issuer'], 'moderate'],
 'pkg/controller/certificaterequests/acme/acme.go|function|NewACME': [
  'Builds an ACME CertificateRequest issuer from the controller context.', ['factory', 'issuer', 'acme'], 'simple'],
 'pkg/controller/certificaterequests/acme/acme.go|function|Sign': [
  'Signs a CertificateRequest by creating an ACME Order and polling until the certificate is issued.', ['signing', 'order', 'acme'], 'complex'],
 'pkg/controller/certificaterequests/acme/acme.go|function|buildOrder': [
  'Builds the ACME Order resource for a CertificateRequest including DNS names, CSR, duration, and profile.', ['order', 'builder', 'acme'], 'complex'],

 'pkg/controller/certificatesigningrequests/acme/acme.go|class|ACME': [
  'CertificateSigningRequest issuer that fulfils CSRs through ACME Orders.', ['acme', 'issuer', 'csr'], 'moderate'],
 'pkg/controller/certificatesigningrequests/acme/acme.go|function|controllerBuilder': [
  'Builds the controller registration used to reconcile CertificateSigningRequests through the ACME issuer.', ['controller', 'registration', 'builder'], 'moderate'],
 'pkg/controller/certificatesigningrequests/acme/acme.go|function|NewACME': [
  'Builds the ACME CertificateSigningRequest issuer from the controller context.', ['factory', 'issuer', 'acme'], 'simple'],
 'pkg/controller/certificatesigningrequests/acme/acme.go|function|Sign': [
  'Signs a CertificateSigningRequest by creating an ACME Order and waiting for the issued certificate.', ['signing', 'order', 'csr'], 'complex'],
 'pkg/controller/certificatesigningrequests/acme/acme.go|function|buildOrder': [
  'Builds the ACME Order for a CertificateSigningRequest from the CSR, duration, and profile settings.', ['order', 'builder', 'csr'], 'complex'],

 'pkg/issuer/acme/dns/acmedns/acmedns.go|class|DNSProvider': [
  'acme-dns provider client holding account credentials and nameservers used for DNS-01 challenges.', ['dns01', 'provider', 'client'], 'simple'],
 'pkg/issuer/acme/dns/acmedns/acmedns.go|function|NewDNSProviderHostBytes': [
  'Creates an acme-dns provider from a host and raw account JSON credentials.', ['factory', 'credentials', 'provider'], 'moderate'],

 'pkg/issuer/acme/dns/akamai/akamai.go|class|OpenEdgegridDNSService': [
  'Interface abstracting the EdgeGrid record operations used by the Akamai provider.', ['interface', 'akamai', 'dns'], 'simple'],
 'pkg/issuer/acme/dns/akamai/akamai.go|class|OpenDNSClient': [
  'EdgeGrid-backed implementation of the Akamai DNS record operations.', ['client', 'akamai', 'dns'], 'simple'],
 'pkg/issuer/acme/dns/akamai/akamai.go|class|DNSProvider': [
  'Akamai DNS-01 provider that creates and removes TXT records for challenges.', ['dns01', 'provider', 'akamai'], 'moderate'],
 'pkg/issuer/acme/dns/akamai/akamai.go|function|NewDNSProvider': [
  'Creates an Akamai DNS provider from EdgeGrid service credentials.', ['factory', 'credentials', 'akamai'], 'moderate'],
 'pkg/issuer/acme/dns/akamai/akamai.go|function|Present': [
  'Presents a DNS-01 TXT record for the challenge in the matching Akamai hosted domain.', ['dns01', 'txt-record', 'present'], 'complex'],
 'pkg/issuer/acme/dns/akamai/akamai.go|function|CleanUp': [
  'Removes the TXT records created for a challenge from Akamai EdgeDNS.', ['dns01', 'txt-record', 'cleanup'], 'complex'],
 'pkg/issuer/acme/dns/akamai/akamai.go|function|GetRecord': [
  'Fetches a DNS record of a given type from an Akamai zone.', ['dns', 'record', 'lookup'], 'moderate'],

 'pkg/issuer/acme/dns/azuredns/azuredns.go|class|DNSProvider': [
  'Azure DNS provider that manages challenge TXT records in a configured DNS zone.', ['dns01', 'provider', 'azure'], 'moderate'],
 'pkg/issuer/acme/dns/azuredns/azuredns.go|class|NormalizedError': [
  'Error wrapper that surfaces the underlying Azure SDK cause in a stable form.', ['error-handling', 'azure', 'type-definition'], 'simple'],
 'pkg/issuer/acme/dns/azuredns/azuredns.go|function|NewDNSProviderCredentials': [
  'Creates an Azure DNS provider from environment, tenant, and credential configuration.', ['factory', 'credentials', 'azure'], 'moderate'],
 'pkg/issuer/acme/dns/azuredns/azuredns.go|function|getAuthorization': [
  'Resolves an Azure authorizer using ambient credentials, managed identity, or a client secret.', ['authentication', 'azure', 'credentials'], 'complex'],
 'pkg/issuer/acme/dns/azuredns/azuredns.go|function|Present': [
  'Creates or updates the TXT record for a DNS-01 challenge in Azure DNS.', ['dns01', 'txt-record', 'present'], 'moderate'],
 'pkg/issuer/acme/dns/azuredns/azuredns.go|function|CleanUp': [
  'Removes the TXT records created for a DNS-01 challenge from Azure DNS.', ['dns01', 'cleanup', 'azure'], 'moderate'],
 'pkg/issuer/acme/dns/azuredns/azuredns.go|function|getHostedZoneName': [
  'Finds the longest matching Azure DNS zone for a fully qualified domain name.', ['dns', 'zone-lookup', 'azure'], 'moderate'],
 'pkg/issuer/acme/dns/azuredns/azuredns.go|function|updateTXTRecord': [
  'Applies create, update, or delete operations to a TXT record set in Azure DNS.', ['dns', 'record-update', 'azure'], 'complex'],
 'pkg/issuer/acme/dns/azuredns/azuredns.go|function|Error': [
  'Formats an Azure DNS API error with status code and request details.', ['error-handling', 'formatting', 'azure'], 'moderate'],

 'pkg/issuer/acme/dns/clouddns/clouddns.go|class|DNSProvider': [
  'Cloud DNS provider that manages challenge TXT records in a managed zone.', ['dns01', 'provider', 'gcp'], 'moderate'],
 'pkg/issuer/acme/dns/clouddns/clouddns.go|function|NewDNSProvider': [
  'Creates a Cloud DNS provider, choosing service-account or ambient credentials.', ['factory', 'credentials', 'gcp'], 'moderate'],
 'pkg/issuer/acme/dns/clouddns/clouddns.go|function|NewDNSProviderCredentials': [
  'Creates a Cloud DNS provider relying on ambient Google credentials.', ['factory', 'credentials', 'gcp'], 'moderate'],
 'pkg/issuer/acme/dns/clouddns/clouddns.go|function|NewDNSProviderServiceAccount': [
  'Creates a Cloud DNS provider from a service-account JSON file.', ['factory', 'service-account', 'gcp'], 'moderate'],
 'pkg/issuer/acme/dns/clouddns/clouddns.go|function|NewDNSProviderServiceAccountBytes': [
  'Creates a Cloud DNS provider from raw service-account JSON bytes.', ['factory', 'service-account', 'gcp'], 'moderate'],
 'pkg/issuer/acme/dns/clouddns/clouddns.go|function|Present': [
  'Publishes the DNS-01 TXT record in the matching Cloud DNS managed zone.', ['dns01', 'txt-record', 'present'], 'complex'],
 'pkg/issuer/acme/dns/clouddns/clouddns.go|function|CleanUp': [
  'Deletes the TXT records associated with a DNS-01 challenge from Cloud DNS.', ['dns01', 'cleanup', 'gcp'], 'complex'],
 'pkg/issuer/acme/dns/clouddns/clouddns.go|function|getHostedZone': [
  'Resolves the Cloud DNS managed zone that hosts the given domain.', ['dns', 'zone-lookup', 'gcp'], 'complex'],
 'pkg/issuer/acme/dns/clouddns/clouddns.go|function|findTxtRecords': [
  'Lists TXT records in a zone that match the challenge FQDN.', ['dns', 'record-lookup', 'gcp'], 'moderate'],

 'pkg/issuer/acme/dns/cloudflare/cloudflare.go|class|DNSProviderType': [
  'Interface describing the Cloudflare HTTP request helper used by the provider.', ['interface', 'cloudflare', 'http-client'], 'simple'],
 'pkg/issuer/acme/dns/cloudflare/cloudflare.go|class|DNSProvider': [
  'Cloudflare provider that creates and removes challenge TXT records via the v4 API.', ['dns01', 'provider', 'cloudflare'], 'moderate'],
 'pkg/issuer/acme/dns/cloudflare/cloudflare.go|function|NewDNSProviderCredentials': [
  'Creates a Cloudflare provider from an API token or email and key credentials.', ['factory', 'credentials', 'cloudflare'], 'moderate'],
 'pkg/issuer/acme/dns/cloudflare/cloudflare.go|function|FindNearestZoneForFQDN': [
  'Finds the most specific Cloudflare zone containing the given FQDN, following CNAMEs.', ['dns', 'zone-lookup', 'cloudflare'], 'complex'],
 'pkg/issuer/acme/dns/cloudflare/cloudflare.go|function|Present': [
  'Creates or updates the TXT record for a DNS-01 challenge in Cloudflare DNS.', ['dns01', 'txt-record', 'present'], 'complex'],
 'pkg/issuer/acme/dns/cloudflare/cloudflare.go|function|CleanUp': [
  'Removes the challenge TXT records from Cloudflare DNS.', ['dns01', 'cleanup', 'cloudflare'], 'moderate'],
 'pkg/issuer/acme/dns/cloudflare/cloudflare.go|function|findTxtRecord': [
  'Searches Cloudflare DNS for a TXT record matching the FQDN and content.', ['dns', 'record-lookup', 'cloudflare'], 'complex'],
 'pkg/issuer/acme/dns/cloudflare/cloudflare.go|function|makeRequest': [
  'Executes an authenticated Cloudflare API request with retries and response decoding.', ['http-client', 'api', 'cloudflare'], 'complex'],

 'pkg/issuer/acme/dns/digitalocean/digitalocean.go|class|DNSProvider': [
  'DigitalOcean provider that manages challenge TXT records.', ['dns01', 'provider', 'digitalocean'], 'simple'],
 'pkg/issuer/acme/dns/digitalocean/digitalocean.go|function|NewDNSProviderCredentials': [
  'Creates a DigitalOcean DNS provider from an API token.', ['factory', 'credentials', 'digitalocean'], 'simple'],
 'pkg/issuer/acme/dns/digitalocean/digitalocean.go|function|Present': [
  'Creates or updates the TXT record for a DNS-01 challenge in DigitalOcean DNS.', ['dns01', 'txt-record', 'present'], 'moderate'],
 'pkg/issuer/acme/dns/digitalocean/digitalocean.go|function|CleanUp': [
  'Deletes the challenge TXT records from DigitalOcean DNS.', ['dns01', 'cleanup', 'digitalocean'], 'moderate'],
 'pkg/issuer/acme/dns/digitalocean/digitalocean.go|function|findTxtRecord': [
  'Looks up TXT records for an FQDN in DigitalOcean DNS.', ['dns', 'record-lookup', 'digitalocean'], 'moderate'],

 'pkg/issuer/acme/dns/dns.go|class|solver': [
  'Minimal interface implemented by DNS-01 challenge solvers.', ['interface', 'solver', 'dns01'], 'simple'],
 'pkg/issuer/acme/dns/dns.go|class|dnsProviderConstructors': [
  'Holds constructor functions for the built-in DNS-01 providers.', ['provider-factory', 'registry', 'dns01'], 'simple'],
 'pkg/issuer/acme/dns/dns.go|class|Solver': [
  'DNS-01 solver orchestrating provider selection, secret loading, and challenge present and cleanup.', ['dns01', 'solver', 'orchestration'], 'moderate'],
 'pkg/issuer/acme/dns/dns.go|function|Present': [
  'Presents a DNS-01 challenge using the provider selected for the issuer solver configuration.', ['dns01', 'present', 'acme'], 'moderate'],
 'pkg/issuer/acme/dns/dns.go|function|Check': [
  'Checks whether the DNS-01 challenge record has propagated to authoritative nameservers.', ['dns01', 'propagation', 'check'], 'moderate'],
 'pkg/issuer/acme/dns/dns.go|function|CleanUp': [
  'Cleans up DNS records associated with a challenge using the configured provider.', ['dns01', 'cleanup', 'acme'], 'moderate'],
 'pkg/issuer/acme/dns/dns.go|function|solverForChallenge': [
  'Selects and configures the DNS provider for a challenge from issuer settings and credential secrets.', ['solver-selection', 'credentials', 'dns01'], 'complex'],
 'pkg/issuer/acme/dns/dns.go|function|prepareChallengeRequest': [
  'Builds the provider configuration payload for a challenge, loading referenced secrets.', ['configuration', 'secrets', 'dns01'], 'moderate'],
 'pkg/issuer/acme/dns/dns.go|function|dns01SolverForConfig': [
  'Instantiates a DNS provider from a DNS-01 solver configuration block.', ['factory', 'dns01', 'provider'], 'moderate'],
 'pkg/issuer/acme/dns/dns.go|function|NewSolver': [
  'Creates the DNS-01 solver with secret listing and webhook solver support from the controller context.', ['factory', 'solver', 'dns01'], 'moderate'],
 'pkg/issuer/acme/dns/dns.go|function|loadSecretData': [
  'Loads and decodes secret data selected by key.', ['secrets', 'kubernetes', 'helper'], 'simple'],
 'pkg/issuer/acme/dns/dns.go|function|createToken': [
  'Requests a projected service-account token for the given audiences and namespace.', ['kubernetes', 'service-account', 'token'], 'simple'],

 'pkg/issuer/acme/dns/rfc2136/provider.go|class|Solver': [
  'RFC 2136 solver that loads nameserver and TSIG configuration and presents TXT records.', ['dns01', 'solver', 'rfc2136'], 'moderate'],
 'pkg/issuer/acme/dns/rfc2136/provider.go|function|Present': [
  'Presents the DNS-01 TXT record using an RFC 2136 dynamic update.', ['dns01', 'present', 'rfc2136'], 'moderate'],
 'pkg/issuer/acme/dns/rfc2136/provider.go|function|CleanUp': [
  'Removes the DNS-01 TXT record with an RFC 2136 dynamic update.', ['dns01', 'cleanup', 'rfc2136'], 'moderate'],
 'pkg/issuer/acme/dns/rfc2136/provider.go|function|Initialize': [
  'Initializes shared informers and lister state used by the RFC 2136 solver.', ['initialization', 'informer', 'rfc2136'], 'moderate'],
 'pkg/issuer/acme/dns/rfc2136/provider.go|function|loadSecretKeySelector': [
  'Loads a value from a Kubernetes SecretKeySelector, applying a default key.', ['secrets', 'helper', 'kubernetes'], 'moderate'],
 'pkg/issuer/acme/dns/rfc2136/provider.go|function|buildDNSProvider': [
  'Builds an RFC 2136 DNS provider from challenge configuration and referenced secrets.', ['factory', 'provider', 'rfc2136'], 'moderate'],

 'pkg/issuer/acme/dns/rfc2136/tsig.go|function|Generate': [
  'Generates a TSIG signature over a DNS message for the configured key.', ['tsig', 'signing', 'dns'], 'moderate'],
 'pkg/issuer/acme/dns/rfc2136/tsig.go|function|Verify': [
  'Verifies a TSIG signature on a DNS message against the configured key.', ['tsig', 'verification', 'dns'], 'moderate'],

 'pkg/issuer/acme/dns/route53/route53.go|class|DNSProvider': [
  'Route53 provider that changes challenge TXT records in a hosted zone.', ['dns01', 'provider', 'route53'], 'simple'],
 'pkg/issuer/acme/dns/route53/route53.go|class|sessionProvider': [
  'Describes how an AWS session is obtained: static keys, ambient credentials, role, or web identity.', ['authentication', 'aws', 'type-definition'], 'simple'],
 'pkg/issuer/acme/dns/route53/route53.go|class|StsClient': [
  'Narrow interface over the AWS STS client used to assume roles.', ['interface', 'aws', 'sts'], 'simple'],
 'pkg/issuer/acme/dns/route53/route53.go|function|GetSession': [
  'Builds an AWS session for Route53, assuming roles or web identity when configured.', ['authentication', 'aws', 'session'], 'complex'],
 'pkg/issuer/acme/dns/route53/route53.go|function|newSessionProvider': [
  'Creates the session provider describing static, ambient, or web identity credentials.', ['factory', 'credentials', 'aws'], 'moderate'],
 'pkg/issuer/acme/dns/route53/route53.go|function|NewDNSProvider': [
  'Creates a Route53 DNS provider with credentials and hosted zone settings.', ['factory', 'provider', 'route53'], 'moderate'],
 'pkg/issuer/acme/dns/route53/route53.go|function|changeRecord': [
  'Submits a Route53 change batch to create or delete a TXT record and waits for it to apply.', ['dns', 'record-change', 'route53'], 'complex'],
 'pkg/issuer/acme/dns/route53/route53.go|function|getHostedZoneID': [
  'Finds the Route53 hosted zone matching the challenge FQDN.', ['dns', 'zone-lookup', 'route53'], 'complex'],
 'pkg/issuer/acme/dns/route53/route53.go|function|newTXTRecordSet': [
  'Builds a Route53 TXT resource record set for a challenge value.', ['dns', 'record-set', 'route53'], 'moderate'],
 'pkg/issuer/acme/dns/route53/route53.go|function|removeReqID': [
  'Strips request IDs from Route53 error strings for stable messages.', ['error-handling', 'route53', 'helper'], 'moderate'],

 'pkg/issuer/acme/dns/util/dns.go|function|DNS01LookupFQDN': [
  'Resolves the effective FQDN for a DNS-01 challenge, optionally following CNAMEs.', ['dns', 'lookup', 'cname'], 'moderate'],
 'pkg/issuer/acme/dns/util/dns.go|function|FindBestMatch': [
  'Finds the longest matching DNS zone for an FQDN from a list of zone names.', ['dns', 'zone-lookup', 'utility'], 'moderate'],

 'pkg/issuer/acme/dns/util/wait.go|function|getNameservers': [
  'Reads the resolver nameserver list from resolv.conf, applying defaults.', ['dns', 'configuration', 'resolver'], 'moderate'],
 'pkg/issuer/acme/dns/util/wait.go|function|followCNAMEs': [
  'Follows CNAME chains for an FQDN and returns the final target.', ['dns', 'cname', 'lookup'], 'moderate'],
 'pkg/issuer/acme/dns/util/wait.go|function|checkDNSPropagation': [
  'Checks challenge record propagation across the given nameservers.', ['dns01', 'propagation', 'check'], 'moderate'],
 'pkg/issuer/acme/dns/util/wait.go|function|checkAuthoritativeNss': [
  'Queries authoritative nameservers to confirm the expected TXT value.', ['dns', 'authoritative', 'check'], 'moderate'],
 'pkg/issuer/acme/dns/util/wait.go|function|DNSQuery': [
  'Performs a DNS query of a given record type against specified nameservers.', ['dns', 'query', 'network'], 'complex'],
 'pkg/issuer/acme/dns/util/wait.go|function|Exchange': [
  'Performs a DNS message exchange over UDP with TCP fallback and retries.', ['dns', 'network', 'exchange'], 'complex'],
 'pkg/issuer/acme/dns/util/wait.go|function|lookupNameservers': [
  'Finds the authoritative nameservers for a zone.', ['dns', 'nameserver', 'lookup'], 'moderate'],
 'pkg/issuer/acme/dns/util/wait.go|function|FindZoneByFqdn': [
  'Determines the DNS zone containing an FQDN by querying SOA records recursively.', ['dns', 'zone-lookup', 'soa'], 'complex'],
 'pkg/issuer/acme/dns/util/wait.go|function|WaitFor': [
  'Polls a condition at a fixed interval until it succeeds or the timeout expires.', ['polling', 'timeout', 'utility'], 'moderate'],

 'pkg/issuer/acme/dns/webhook/webhook.go|class|Webhook': [
  'Webhook-based DNS-01 solver that calls a remote challenge API.', ['dns01', 'webhook', 'solver'], 'simple'],
 'pkg/issuer/acme/dns/webhook/webhook.go|function|Present': [
  'Sends a present request for a challenge to the configured webhook service.', ['dns01', 'webhook', 'present'], 'complex'],
 'pkg/issuer/acme/dns/webhook/webhook.go|function|CleanUp': [
  'Sends a cleanup request for a challenge to the configured webhook service.', ['dns01', 'webhook', 'cleanup'], 'complex'],
 'pkg/issuer/acme/dns/webhook/webhook.go|function|Initialize': [
  'Initializes the webhook solver with Kubernetes REST configuration.', ['initialization', 'webhook', 'kubernetes'], 'moderate'],
 'pkg/issuer/acme/dns/webhook/webhook.go|function|buildPayload': [
  'Builds the challenge request payload sent to the webhook service.', ['payload', 'webhook', 'serialization'], 'moderate'],

 'pkg/issuer/acme/http/httproute.go|function|ensureGatewayHTTPRoute': [
  'Ensures an HTTPRoute exists and routes the challenge path to the solver service.', ['http01', 'httproute', 'ensure'], 'moderate'],
 'pkg/issuer/acme/http/httproute.go|function|getGatewayHTTPRoute': [
  'Retrieves the HTTPRoute owned by a challenge, if present.', ['http01', 'httproute', 'lookup'], 'moderate'],
 'pkg/issuer/acme/http/httproute.go|function|createGatewayHTTPRoute': [
  'Creates the HTTPRoute resource for a challenge.', ['http01', 'httproute', 'create'], 'moderate'],
 'pkg/issuer/acme/http/httproute.go|function|checkAndUpdateGatewayHTTPRoute': [
  'Reconciles an existing HTTPRoute with the desired challenge routing.', ['http01', 'httproute', 'reconcile'], 'moderate'],
 'pkg/issuer/acme/http/httproute.go|function|generateHTTPRouteSpec': [
  'Generates the HTTPRoute spec that routes the challenge path to the solver service.', ['http01', 'httproute', 'spec'], 'moderate'],

 'pkg/issuer/acme/http/ingress.go|function|getIngressesForChallenge': [
  'Lists the Ingresses owned by a challenge, filtering out completed ones as needed.', ['http01', 'ingress', 'lookup'], 'moderate'],
 'pkg/issuer/acme/http/ingress.go|function|ensureIngress': [
  'Ensures an Ingress exists for the challenge and contains the solver path rule.', ['http01', 'ingress', 'ensure'], 'moderate'],
 'pkg/issuer/acme/http/ingress.go|function|createIngress': [
  'Creates a solver Ingress for the challenge.', ['http01', 'ingress', 'create'], 'moderate'],
 'pkg/issuer/acme/http/ingress.go|function|buildIngressResource': [
  'Builds the solver Ingress resource from challenge options and templates.', ['http01', 'ingress', 'builder'], 'complex'],
 'pkg/issuer/acme/http/ingress.go|function|mergeIngressObjectMetaWithIngressResourceTemplate': [
  'Merges pod template metadata and annotations into the generated Ingress resource.', ['http01', 'ingress', 'template'], 'moderate'],
 'pkg/issuer/acme/http/ingress.go|function|addChallengePathToIngress': [
  'Adds the challenge path rule to an existing Ingress and prunes stale rules.', ['http01', 'ingress', 'routing'], 'complex'],
 'pkg/issuer/acme/http/ingress.go|function|cleanupIngresses': [
  'Removes challenge path rules from Ingresses and deletes solver-created Ingresses when unused.', ['http01', 'ingress', 'cleanup'], 'complex'],
 'pkg/issuer/acme/http/ingress.go|function|ingressPath': [
  'Builds the path rule for a challenge token and solver service.', ['http01', 'ingress', 'routing'], 'moderate'],

 'pkg/issuer/acme/http/pod.go|function|podLabels': [
  'Computes the labels identifying the solver pod for a challenge.', ['http01', 'pod', 'labels'], 'moderate'],
 'pkg/issuer/acme/http/pod.go|function|ensurePod': [
  'Ensures a solver pod exists for the challenge, creating it when missing.', ['http01', 'pod', 'ensure'], 'moderate'],
 'pkg/issuer/acme/http/pod.go|function|getPodsForChallenge': [
  'Lists the solver pods belonging to a challenge.', ['http01', 'pod', 'lookup'], 'moderate'],
 'pkg/issuer/acme/http/pod.go|function|cleanupPods': [
  'Deletes solver pods no longer required by the challenge.', ['http01', 'pod', 'cleanup'], 'moderate'],
 'pkg/issuer/acme/http/pod.go|function|buildPod': [
  'Builds the solver pod, preferring a user-provided pod template.', ['http01', 'pod', 'builder'], 'moderate'],
 'pkg/issuer/acme/http/pod.go|function|buildDefaultPod': [
  'Builds the default solver pod spec including the challenge container and security settings.', ['http01', 'pod', 'builder'], 'complex'],
 'pkg/issuer/acme/http/pod.go|function|mergePodObjectMetaWithPodTemplate': [
  'Merges object metadata and security context from a pod template into the solver pod.', ['http01', 'pod', 'template'], 'complex'],

 'pkg/issuer/acme/http/service.go|function|ensureService': [
  'Ensures the solver Service exists for a challenge.', ['http01', 'service', 'ensure'], 'moderate'],
 'pkg/issuer/acme/http/service.go|function|getServicesForChallenge': [
  'Lists Services owned by a challenge and filters out stale ones.', ['http01', 'service', 'lookup'], 'moderate'],
 'pkg/issuer/acme/http/service.go|function|buildService': [
  'Builds the solver Service targeting the challenge pod labels.', ['http01', 'service', 'builder'], 'moderate'],
 'pkg/issuer/acme/http/service.go|function|cleanupServices': [
  'Deletes solver Services that are no longer needed by the challenge.', ['http01', 'service', 'cleanup'], 'moderate'],

 'pkg/util/solverpicker/solverpicker.go|function|Pick': [
  'Selects the first solver whose selector matches the domain, falling back to a default solver when none match.', ['solver-selection', 'matching', 'acme'], 'complex'],

 'test/acme/fixture.go|class|fixture': [
  'Conformance fixture holding test server configuration, clients, and DNS settings.', ['test', 'fixture', 'acme'], 'moderate'],
 'test/acme/fixture.go|function|RunConformance': [
  'Runs the full ACME conformance suite against the configured solver.', ['test', 'conformance', 'acme'], 'simple'],
 'test/acme/fixture.go|function|setup': [
  'Starts the test environment, solver, and API clients required for conformance runs.', ['test', 'setup', 'fixture'], 'moderate'],

 'test/acme/options.go|function|NewFixture': [
  'Creates a conformance fixture for the given solver type.', ['factory', 'test', 'fixture'], 'simple'],
 'test/acme/options.go|function|applyDefaults': [
  'Applies default values to unset fixture options.', ['configuration', 'defaults', 'test'], 'moderate'],
 'test/acme/options.go|function|validate': [
  'Validates the fixture configuration required to run the conformance suite.', ['validation', 'test', 'configuration'], 'moderate'],

 'test/acme/util.go|function|setupNamespace': [
  'Creates an isolated namespace and starting resources for a conformance run.', ['test', 'kubernetes', 'setup'], 'moderate'],
 'test/acme/util.go|function|buildChallengeRequest': [
  'Builds a webhook challenge request payload for the test DNS server.', ['test', 'payload', 'webhook'], 'moderate'],
 'test/acme/util.go|function|allConditions': [
  'Returns all challenge conditions used by test assertion helpers.', ['test', 'helper', 'conditions'], 'moderate'],
 'test/acme/util.go|function|recordHasBeenDeletedCheck': [
  'Polls until the challenge DNS record has been removed.', ['test', 'dns', 'polling'], 'moderate'],

 'test/apiserver/apiserver.go|function|RunBareControlPlane': [
  'Starts a bare Kubernetes control plane for a test and registers cleanup.', ['test', 'api-server', 'setup'], 'moderate'],

 'test/apiserver/envs.go|function|maybeSetEnv': [
  'Sets an environment variable to the located binary path when it is unset.', ['test', 'environment', 'configuration'], 'moderate'],
 'test/apiserver/envs.go|function|getPath': [
  'Finds an envtest binary in the configured asset directories.', ['test', 'filesystem', 'lookup'], 'moderate'],

 'test/unit/gen/challenge.go|function|Challenge': [
  'Creates a minimal Challenge resource for tests.', ['factory', 'test', 'challenge'], 'simple'],
 'test/unit/gen/challenge.go|function|ChallengeFrom': [
  'Copies an existing Challenge into a new test fixture object.', ['factory', 'test', 'challenge'], 'simple'],

 'test/unit/gen/order.go|function|Order': [
  'Creates a minimal Order resource for tests.', ['factory', 'test', 'order'], 'simple'],
 'test/unit/gen/order.go|function|OrderFrom': [
  'Copies an existing Order into a new test fixture object.', ['factory', 'test', 'order'], 'simple'],

 'test/unit/listers/order.go|class|FakeOrderLister': [
  'Fake lister exposing function hooks for Order list operations in tests.', ['test', 'fake', 'lister'], 'simple'],
 'test/unit/listers/order.go|class|FakeOrderNamespaceLister': [
  'Fake namespace-scoped lister for Order resources in tests.', ['test', 'fake', 'lister'], 'simple'],
 'test/unit/listers/order.go|function|NewFakeOrderLister': [
  'Creates a fake Order lister backed by the provided list function.', ['factory', 'test', 'lister'], 'moderate'],
 'test/unit/listers/order.go|function|NewFakeOrderNamespaceLister': [
  'Creates a fake namespace-scoped Order lister backed by the provided functions.', ['factory', 'test', 'lister'], 'moderate'],
};

const calls = [
 ['pkg/controller/acmeorders/util.go', 'pkg/util/solverpicker/solverpicker.go', 'Pick', 'function'],
 ['pkg/issuer/acme/dns/dns.go', 'pkg/issuer/acme/dns/util/wait.go', 'FindZoneByFqdn', 'function'],
 ['pkg/issuer/acme/dns/dns.go', 'pkg/issuer/acme/dns/util/wait.go', 'DNSQuery', 'function'],
 ['pkg/issuer/acme/dns/dns.go', 'pkg/issuer/acme/dns/util/dns.go', 'DNS01LookupFQDN', 'function'],
 ['pkg/issuer/acme/dns/akamai/akamai.go', 'pkg/issuer/acme/dns/util/wait.go', 'FindZoneByFqdn', 'function'],
 ['pkg/issuer/acme/dns/akamai/akamai.go', 'pkg/issuer/acme/dns/util/dns.go', 'DNS01LookupFQDN', 'function'],
 ['pkg/issuer/acme/dns/azuredns/azuredns.go', 'pkg/issuer/acme/dns/util/wait.go', 'FindZoneByFqdn', 'function'],
 ['pkg/issuer/acme/dns/azuredns/azuredns.go', 'pkg/issuer/acme/dns/util/dns.go', 'DNS01LookupFQDN', 'function'],
 ['pkg/issuer/acme/dns/clouddns/clouddns.go', 'pkg/issuer/acme/dns/util/wait.go', 'FindZoneByFqdn', 'function'],
 ['pkg/issuer/acme/dns/clouddns/clouddns.go', 'pkg/issuer/acme/dns/util/dns.go', 'DNS01LookupFQDN', 'function'],
 ['pkg/issuer/acme/dns/cloudflare/cloudflare.go', 'pkg/issuer/acme/dns/util/wait.go', 'FindZoneByFqdn', 'function'],
 ['pkg/issuer/acme/dns/cloudflare/cloudflare.go', 'pkg/issuer/acme/dns/util/dns.go', 'DNS01LookupFQDN', 'function'],
 ['pkg/issuer/acme/dns/digitalocean/digitalocean.go', 'pkg/issuer/acme/dns/util/wait.go', 'FindZoneByFqdn', 'function'],
 ['pkg/issuer/acme/dns/route53/route53.go', 'pkg/issuer/acme/dns/util/wait.go', 'FindZoneByFqdn', 'function'],
 ['test/acme/util.go', 'pkg/issuer/acme/dns/util/wait.go', 'DNSQuery', 'function'],
 ['test/acme/util.go', 'pkg/issuer/acme/dns/util/dns.go', 'DNS01LookupFQDN', 'function'],
];

const nodes = [];
const edges = [];
const seen = new Set();
const nameOf = p => p.split('/').pop();

for (const r of ext.results) {
  const meta = files[r.path];
  if (!meta) throw new Error('missing file meta for ' + r.path);
  nodes.push({
    id: `file:${r.path}`, type: 'file', name: nameOf(r.path), filePath: r.path,
    summary: meta.summary, tags: meta.tags, complexity: meta.complexity,
  });
  const exported = new Set((r.exports || []).map(e => e.name));
  const sub = [
    ...(r.classes || []).map(c => ({ kind: 'class', name: c.name, start: c.startLine, end: c.endLine })),
    ...(r.functions || []).filter(f => !(r.classes || []).some(c => c.methods.includes(f.name) && f.startLine >= c.startLine && f.endLine <= c.endLine))
      .map(f => ({ kind: 'function', name: f.name, start: f.startLine, end: f.endLine })),
  ];
  for (const s of sub) {
    const key = `${r.path}|${s.kind}|${s.name}`;
    const m = syms[key];
    if (!m) continue; // below significance threshold / trivial helper
    const id = `${s.kind}:${r.path}:${s.name}`;
    if (seen.has(id)) { console.error('dup', id); continue; }
    seen.add(id);
    nodes.push({
      id, type: s.kind, name: s.name, filePath: r.path, lineRange: [s.start, s.end],
      summary: m[0], tags: m[1], complexity: m[2],
    });
    edges.push({ source: `file:${r.path}`, target: id, type: 'contains', direction: 'forward', weight: 1.0 });
    if (exported.has(s.name)) {
      edges.push({ source: `file:${r.path}`, target: id, type: 'exports', direction: 'forward', weight: 0.8 });
    }
  }
}

for (const r of ext.results) {
  for (const target of dispatch.batchImportData[r.path] || []) {
    if (target === r.path) continue;
    edges.push({ source: `file:${r.path}`, target: `file:${target}`, type: 'imports', direction: 'forward', weight: 0.7 });
  }
}
for (const [src, tgt, name, kind] of calls) {
  edges.push({ source: `file:${src}`, target: `${kind}:${tgt}:${name}`, type: 'calls', direction: 'forward', weight: 0.8 });
}

// sanity
const nodeIds = new Set(nodes.map(n => n.id));
const knownPaths = new Set([
  ...Object.keys(dispatch.batchImportData),
  ...Object.values(dispatch.batchImportData).flat(),
  ...Object.keys(dispatch.neighborMap || {}),
  ...Object.values(dispatch.neighborMap || {}).flat().map(n => n.path),
  ...ext.results.map(r => r.path),
]);
for (const e of edges) if (!nodeIds.has(e.source)) throw new Error('bad source ' + e.source);
for (const e of edges) {
  const t = e.target;
  if (t.startsWith('file:')) {
    if (!knownPaths.has(t.slice(5))) throw new Error('bad file target ' + t);
  } else if (!nodeIds.has(t)) {
    throw new Error('bad target ' + t);
  }
}

// partition
const sorted = [...ext.results].map(r => r.path).sort();
const importsCount = Object.values(dispatch.batchImportData).reduce((a, b) => a + b.length, 0);
const parts = Math.ceil(Math.max(nodes.length / 60, edges.length / 120));
const chunk = Math.ceil(sorted.length / parts);
const filePart = new Map();
for (let i = 0; i < sorted.length; i++) filePart.set(sorted[i], Math.floor(i / chunk) + 1);
const buckets = new Map();
for (const [f, p] of filePart) { if (!buckets.has(p)) buckets.set(p, { nodes: [], edges: [] }); }
for (const n of nodes) buckets.get(filePart.get(n.filePath)).nodes.push(n);
for (const e of edges) {
  const srcPath = e.source.startsWith('file:') ? e.source.slice(5) : e.source.split(':')[1];
  buckets.get(filePart.get(srcPath)).edges.push(e);
}
for (const [p, b] of [...buckets].sort((a, b) => a[0] - b[0])) {
  fs.writeFileSync(`${root}/.ua/intermediate/batch-11-part-${p}.json`, JSON.stringify(b, null, 2) + '\n');
  console.log(`part ${p}: files ${sorted.filter(f => filePart.get(f) === p).length} nodes ${b.nodes.length} edges ${b.edges.length}`);
}
console.log('TOTAL nodes', nodes.length, 'edges', edges.length, 'imports', importsCount, 'parts', parts);
