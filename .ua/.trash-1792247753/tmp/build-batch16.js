const fs = require('fs');
const path = require('path');

const root = '/Users/samtyga/Desktop/work/cert-manager';
const dispatch = JSON.parse(fs.readFileSync(path.join(root, '.ua/tmp/prompts/batch-16.json'), 'utf8'));
const extract = JSON.parse(fs.readFileSync(path.join(root, '.ua/tmp/ua-file-extract-results-16.json'), 'utf8'));
const outDir = path.join(root, '.ua/intermediate');

const fileMeta = {
  'internal/apis/meta/doc.go': ['Package documentation for cert-manager\'s internal meta API group, enabling deepcopy generation and declaring the meta.cert-manager.io group name.', ['api-group', 'internal-api', 'documentation', 'code-generation'], 'simple'],
  'internal/apis/meta/install/install.go': ['Registers the internal and v1 meta API types with a Kubernetes runtime scheme so shared reference types can be encoded and decoded.', ['api-installation', 'scheme-registration', 'initialization', 'utility'], 'simple'],
  'internal/apis/meta/register.go': ['Defines scheme registration entry points for the internal meta API group and a helper for building qualified GroupResource names.', ['scheme-registration', 'api-group', 'type-registration'], 'simple'],
  'internal/apis/meta/types.go': ['Defines internal meta API types — object and issuer references, secret key selectors, condition statuses, and the TLS CA data key — shared across cert-manager API groups.', ['data-model', 'type-definition', 'api-types', 'references'], 'moderate'],
  'internal/apis/meta/v1/conversion.go': ['Hand-written conversion functions between internal and v1 meta reference types, working around conversion-gen limitations for cross-group types.', ['conversion', 'api-versioning', 'serialization'], 'moderate'],
  'internal/apis/meta/v1/defaults.go': ['Registers defaulting functions for the v1 meta API with the shared scheme builder.', ['defaulting', 'scheme-registration', 'api-versioning'], 'simple'],
  'internal/apis/meta/v1/doc.go': ['Package documentation and code-generation markers for the v1 meta API, driving conversion, deepcopy, and defaulter generation.', ['documentation', 'code-generation', 'api-versioning'], 'simple'],
  'internal/apis/meta/v1/register.go': ['Registers the v1 meta API group version, exposes resource helpers, and wires defaulting functions into the shared scheme builder.', ['scheme-registration', 'api-versioning', 'initialization'], 'simple'],
  'internal/apis/meta/v1/zz_generated.conversion.go': ['Generated conversion registrations and auto-conversion helpers translating between v1 and internal meta reference types.', ['code-generation', 'conversion', 'api-versioning', 'serialization'], 'moderate'],
  'internal/apis/meta/v1/zz_generated.defaults.go': ['Generated defaulting registration that wires the meta v1 defaulting functions into the API scheme.', ['code-generation', 'defaulting', 'scheme-registration'], 'simple'],
  'internal/apis/meta/zz_generated.deepcopy.go': ['Generated deep-copy implementations for meta reference types, ensuring safe copying of API objects.', ['code-generation', 'deepcopy', 'api-types'], 'moderate'],
  'internal/kube/config.go': ['Builds Kubernetes REST client configuration from an explicit API server host or kubeconfig file, falling back to in-cluster configuration.', ['kubernetes-client', 'configuration', 'bootstrap'], 'moderate'],
  'internal/webhook/admission/certificaterequest/approval/certificaterequest_approval.go': ['Admission plugin that authorizes changes to CertificateRequest Approved/Denied conditions by checking RBAC approve permissions on the referenced signer resource.', ['admission-webhook', 'authorization', 'rbac', 'certificaterequest', 'security'], 'complex'],
  'internal/webhook/admission/certificaterequest/identity/certificaterequest_identity.go': ['Admission plugin that stamps the requesting identity onto CertificateRequests and enforces that uid, username, groups, and extra fields cannot be altered.', ['admission-webhook', 'mutation', 'validation', 'identity', 'security'], 'moderate'],
  'internal/webhook/admission/resourcevalidation/resourcevalidation.go': ['Admission plugin dispatching create and update requests to the per-resource validation functions for cert-manager and ACME API types.', ['admission-webhook', 'validation', 'dispatch', 'api-types'], 'moderate'],
  'internal/webhook/webhook.go': ['Constructs the cert-manager webhook server: builds the Kubernetes client, installs API schemes, assembles the admission plugin chain, and selects the TLS certificate source.', ['entry-point', 'webhook', 'bootstrap', 'tls', 'composition-root'], 'moderate'],
  'pkg/apis/meta/doc.go': ['Declares the public meta API group name (meta.cert-manager.io) and documents the shared meta types package.', ['api-group', 'documentation', 'constants'], 'simple'],
  'pkg/issuer/acme/dns/rfc2136/rfc2136.go': ['DNS-01 solver implementing RFC 2136 dynamic DNS updates with optional TSIG authentication, used to create and remove ACME TXT challenge records.', ['dns-provider', 'acme', 'dns01', 'integration'], 'moderate'],
  'pkg/server/listener.go': ['Creates TCP listeners with optional TLS wrapping, configurable certificate source, cipher suites, and minimum TLS version.', ['networking', 'tls', 'listener', 'configuration'], 'moderate'],
  'pkg/server/tls/file_source.go': ['TLS certificate source that periodically reloads certificate and key files from disk, caching them for the HTTPS server and reporting health.', ['tls', 'certificate-management', 'file-watch', 'hot-reload'], 'moderate'],
  'pkg/server/tls/source.go': ['Defines the CertificateSource interface (GetCertificate, Start, Healthy) and the ErrNotAvailable sentinel used by TLS certificate providers.', ['interface', 'tls', 'certificate-management', 'type-definition'], 'simple'],
  'pkg/util/profiling/profiling.go': ['Registers Go pprof profiling endpoints on an HTTP ServeMux with a redirect from /debug/pprof.', ['profiling', 'http', 'observability', 'utility'], 'simple'],
  'pkg/webhook/admission/chain.go': ['PluginChain type that fans admission requests out to a sequence of admission plugins, aggregating warnings and errors.', ['admission-webhook', 'middleware', 'plugin-chain', 'aggregation'], 'moderate'],
  'pkg/webhook/admission/custom_decoder.go': ['Decoders that convert admission request raw extensions into typed internal objects or unstructured objects, preserving GroupVersionKind information.', ['admission-webhook', 'decoding', 'serialization', 'utility'], 'moderate'],
  'pkg/webhook/admission/custom_mutation_webhook.go': ['Adapts cert-manager mutation plugins to controller-runtime\'s admission webhook, decoding requests and returning JSON patches.', ['admission-webhook', 'mutation', 'adapter', 'http-handler'], 'moderate'],
  'pkg/webhook/admission/custom_validator_webhook.go': ['Adapts cert-manager validation plugins to controller-runtime\'s admission webhook for create, update, and delete operations, including warning propagation.', ['admission-webhook', 'validation', 'adapter', 'http-handler'], 'moderate'],
  'pkg/webhook/admission/handler.go': ['Base admission handler that tracks which admission operations a plugin handles and provides a constructor for that operation set.', ['admission-webhook', 'base-class', 'operation-dispatch', 'utility'], 'simple'],
  'pkg/webhook/admission/interfaces.go': ['Defines the base, validation, and mutation admission interfaces that all cert-manager webhook plugins implement.', ['interface', 'type-definition', 'admission-webhook', 'contracts'], 'simple'],
  'pkg/webhook/server/server.go': ['Generic webhook HTTP server that runs the controller-runtime manager, secure webhook listener, healthz/livez endpoints, metrics, and optional pprof with graceful shutdown.', ['webhook', 'http-server', 'tls', 'observability', 'entry-point'], 'complex'],
};

const symbolMeta = {
  'internal/apis/meta/install/install.go': {
    Install: ['Registers both internal and v1 meta API types in the supplied runtime scheme, panicking on registration errors.', ['scheme-registration', 'api-installation', 'initialization']],
  },
  'internal/apis/meta/register.go': {
    Resource: ['Returns the fully qualified GroupResource for an unqualified meta resource name.', ['utility', 'api-group', 'resource-naming']],
  },
  'internal/apis/meta/types.go': {
    LocalObjectReference: ['Reference to a same-namespace object by name, used for secrets and shared meta references.', ['data-model', 'reference', 'api-types']],
    IssuerReference: ['Reference to an issuer by name, kind, and group, identifying which issuer signed a request.', ['data-model', 'reference', 'issuer', 'api-types']],
    SecretKeySelector: ['Selector for a specific key inside a Secret, embedding a local object reference.', ['data-model', 'secret', 'reference', 'api-types']],
  },
  'internal/apis/meta/v1/conversion.go': {
    Convert_meta_LocalObjectReference_To_v1_LocalObjectReference: ['Converts an internal LocalObjectReference to its v1 representation via the generated auto-conversion helper.', ['conversion', 'api-versioning', 'utility']],
    Convert_v1_LocalObjectReference_To_meta_LocalObjectReference: ['Converts a v1 LocalObjectReference to its internal representation via the generated auto-conversion helper.', ['conversion', 'api-versioning', 'utility']],
    Convert_meta_IssuerReference_To_v1_IssuerReference: ['Converts an internal IssuerReference to its v1 representation via the generated auto-conversion helper.', ['conversion', 'api-versioning', 'utility']],
    Convert_v1_IssuerReference_To_meta_IssuerReference: ['Converts a v1 IssuerReference to its internal representation via the generated auto-conversion helper.', ['conversion', 'api-versioning', 'utility']],
    Convert_meta_SecretKeySelector_To_v1_SecretKeySelector: ['Converts an internal SecretKeySelector to its v1 representation via the generated auto-conversion helper.', ['conversion', 'api-versioning', 'utility']],
    Convert_v1_SecretKeySelector_To_meta_SecretKeySelector: ['Converts a v1 SecretKeySelector to its internal representation via the generated auto-conversion helper.', ['conversion', 'api-versioning', 'utility']],
  },
  'internal/apis/meta/v1/register.go': {
    Resource: ['Returns the fully qualified GroupResource for a v1 meta resource name.', ['utility', 'api-versioning', 'resource-naming']],
  },
  'internal/apis/meta/v1/zz_generated.conversion.go': {
    RegisterConversions: ['Registers bidirectional conversion functions between v1 and internal meta reference types with the conversion scheme.', ['conversion', 'registration', 'code-generation']],
  },
  'internal/apis/meta/v1/zz_generated.defaults.go': {
    RegisterDefaults: ['Registers the meta v1 defaulting functions with the given scheme.', ['defaulting', 'registration', 'code-generation']],
  },
  'internal/kube/config.go': {
    BuildClientConfig: ['Returns a REST config from explicit API server host and kubeconfig values, or the in-cluster config when neither is set.', ['kubernetes-client', 'configuration', 'factory']],
    getKubeConfigGetter: ['Builds a lazy kubeconfig getter that loads the given file, returning an empty config when no path is provided.', ['kubernetes-client', 'configuration', 'file-loading']],
  },
  'internal/webhook/admission/certificaterequest/approval/certificaterequest_approval.go': {
    NewPlugin: ['Creates the CertificateRequest approval admission plugin with an authorizer and discovery client, handling updates only.', ['factory', 'admission-webhook', 'authorization']],
    Validate: ['Checks whether the requesting user may add Approved or Denied conditions by authorizing the approve verb on derived signer names.', ['validation', 'authorization', 'certificaterequest', 'rbac']],
    apiResourceForGroupKind: ['Resolves the API resource descriptor for an issuer GroupKind, using a cache and falling back to API discovery.', ['discovery', 'caching', 'api-resource']],
    cacheAPIResource: ['Stores a resolved API resource descriptor in the plugin GroupKind cache under a write lock.', ['caching', 'concurrency', 'discovery']],
    signerNamesForAPIResource: ['Builds the wildcard and fully qualified signer names used for RBAC authorization of a CertificateRequest.', ['authorization', 'rbac', 'naming']],
    userInfoForRequest: ['Converts admission request user info into an authorizer-compatible user.Info value.', ['adapter', 'authorization', 'user-info']],
    isAuthorizedForSignerNames: ['Returns true if the authorizer allows the approve verb on any of the candidate signer names.', ['authorization', 'rbac', 'decision']],
    buildAttributes: ['Builds authorizer attributes for an approve request against cert-manager signer resources.', ['authorization', 'attributes', 'rbac']],
    ValidateInitialization: ['Verifies the plugin has an authorizer and discovery client and that discovery is reachable.', ['initialization', 'validation', 'health-check']],
    certificateRequestApproval: ['Admission plugin struct holding the authorizer, discovery client, and a concurrency-safe GroupKind-to-resource cache.', ['admission-webhook', 'authorization', 'caching', 'stateful']],
  },
  'internal/webhook/admission/certificaterequest/identity/certificaterequest_identity.go': {
    NewPlugin: ['Creates the CertificateRequest identity plugin handling create and update operations.', ['factory', 'admission-webhook', 'identity']],
    Mutate: ['Stamps the requesting user uid, username, groups, and extra fields into a new CertificateRequest spec.', ['mutation', 'identity', 'certificaterequest']],
    Validate: ['Dispatches CertificateRequest identity validation to create or update handlers based on the admission operation.', ['validation', 'dispatch', 'identity']],
    validateUpdate: ['Rejects updates that change uid, username, groups, or extra identity fields on a CertificateRequest.', ['validation', 'immutability', 'identity']],
    validateCreate: ['Rejects creates whose identity fields do not match the requesting user identity.', ['validation', 'identity', 'certificaterequest']],
    extrasMatch: ['Compares CertificateRequest extra identity values against admission request extras ignoring order.', ['comparison', 'identity', 'utility']],
    certificateRequestIdentity: ['Admission plugin that both mutates and validates CertificateRequest requester identity.', ['admission-webhook', 'mutation', 'validation', 'identity']],
  },
  'internal/webhook/admission/resourcevalidation/resourcevalidation.go': {
    NewPlugin: ['Creates the resource validation admission plugin handling create and update operations.', ['factory', 'admission-webhook', 'validation']],
    Validate: ['Looks up the validation pair for the requested GVR and runs the matching create or update validators, aggregating errors.', ['validation', 'dispatch', 'api-types']],
  },
  'internal/webhook/webhook.go': {
    NewCertManagerWebhookServer: ['Builds a fully configured webhook server with client config, admission chain, API schemes, and TLS certificate sources.', ['factory', 'bootstrap', 'webhook', 'tls']],
    buildAdmissionChain: ['Creates the authorizer and assembles the identity, approval, and resource-validation admission plugins into a chain.', ['composition', 'admission-webhook', 'authorization']],
    buildCertificateSource: ['Selects a filesystem or dynamic TLS certificate source from configuration, returning nil for insecure serving.', ['tls', 'configuration', 'factory']],
  },
  'pkg/issuer/acme/dns/rfc2136/rfc2136.go': {
    WithNetwork: ['Provider option that sets the DNS transport network, defaulting to UDP and normalizing to lowercase.', ['configuration', 'option', 'dns']],
    NewDNSProviderCredentials: ['Validates the nameserver and TSIG settings and constructs an RFC 2136 DNS provider, logging masked credentials.', ['factory', 'validation', 'tsig', 'dns']],
    Present: ['Creates a TXT record for the ACME DNS-01 challenge via a dynamic DNS update.', ['acme', 'dns01', 'dns-update']],
    CleanUp: ['Removes the TXT record created for the ACME DNS-01 challenge.', ['acme', 'dns01', 'cleanup']],
    changeRecord: ['Builds and sends an RFC 2136 update message inserting or removing a TXT record, optionally TSIG-signed.', ['dns-update', 'tsig', 'networking']],
    Nameserver: ['Returns the configured nameserver address.', ['accessor', 'dns', 'configuration']],
    TSIGAlgorithm: ['Returns the configured TSIG algorithm.', ['accessor', 'tsig', 'configuration']],
    DNSProvider: ['RFC 2136 DNS provider holding nameserver, network, and TSIG credentials for dynamic TXT record updates.', ['dns-provider', 'acme', 'stateful']],
  },
  'pkg/server/listener.go': {
    Listen: ['Creates a TCP listener and optionally wraps it in TLS using the supplied listener options.', ['listener', 'tls', 'networking']],
    WithCertificateSource: ['Listener option enabling TLS and sourcing certificates from the given CertificateSource.', ['tls', 'configuration', 'option']],
    WithTLSCipherSuites: ['Listener option converting configured cipher suite names into Go TLS cipher suite IDs.', ['tls', 'configuration', 'option']],
    WithTLSMinVersion: ['Listener option converting a minimum TLS version string into the Go TLS constant.', ['tls', 'configuration', 'option']],
  },
  'pkg/server/tls/file_source.go': {
    Start: ['Loads the certificate immediately then reloads it on a ticker, failing after too many consecutive read errors.', ['lifecycle', 'hot-reload', 'tls']],
    GetCertificate: ['Returns the cached certificate under lock or ErrNotAvailable if none has been loaded.', ['tls', 'accessor', 'concurrency']],
    Healthy: ['Reports whether a certificate has been successfully loaded.', ['health-check', 'tls', 'accessor']],
    updateCertificateFromDisk: ['Reads key and certificate files, compares them with the cache, and reloads the TLS key pair when changed.', ['hot-reload', 'file-io', 'tls']],
    FileCertificateSource: ['Periodically reloading TLS certificate source backed by certificate and key files on disk.', ['tls', 'certificate-management', 'hot-reload', 'stateful']],
  },
  'pkg/server/tls/source.go': {
    CertificateSource: ['Interface for TLS certificate providers used by the server, exposing certificate retrieval, lifecycle start, and health reporting.', ['interface', 'tls', 'certificate-management', 'contracts']],
  },
  'pkg/util/profiling/profiling.go': {
    Install: ['Registers pprof index, profile, symbol, and trace handlers on the given ServeMux.', ['profiling', 'http', 'observability']],
  },
  'pkg/webhook/admission/chain.go': {
    Handles: ['Returns true if any plugin in the chain handles the given admission operation.', ['dispatch', 'admission-webhook', 'utility']],
    Validate: ['Runs all validation-capable plugins that handle the operation, collecting warnings and aggregating errors.', ['validation', 'aggregation', 'plugin-chain']],
    Mutate: ['Runs all mutation-capable plugins that handle the operation, stopping at the first error.', ['mutation', 'plugin-chain', 'error-handling']],
  },
  'pkg/webhook/admission/custom_decoder.go': {
    DecodeRaw: ['Decodes raw admission bytes into a typed object and converts it to the internal API version.', ['decoding', 'serialization', 'api-versioning']],
    DecodeRawUnstructured: ['Decodes raw admission bytes into an unstructured object, defaulting its GroupVersionKind when absent.', ['decoding', 'unstructured', 'utility']],
  },
  'pkg/webhook/admission/custom_mutation_webhook.go': {
    NewCustomMutationWebhook: ['Wraps a MutationInterface in a controller-runtime admission webhook handler.', ['factory', 'adapter', 'mutation']],
    Handle: ['Decodes the request object, applies mutation plugins, and returns a JSON patch or denial response.', ['http-handler', 'mutation', 'admission-webhook']],
  },
  'pkg/webhook/admission/custom_validator_webhook.go': {
    NewCustomValidationWebhook: ['Wraps a ValidationInterface with a scheme-backed decoder in a controller-runtime admission webhook.', ['factory', 'adapter', 'validation']],
    Handle: ['Decodes create, update, and delete payloads, invokes validation, and returns allowed or denied responses with warnings.', ['http-handler', 'validation', 'admission-webhook']],
  },
  'pkg/webhook/admission/handler.go': {
    Handles: ['Reports whether the handler operation set contains the given admission operation.', ['dispatch', 'admission-webhook', 'utility']],
    NewHandler: ['Creates a Handler configured for the supplied admission operations.', ['factory', 'admission-webhook', 'configuration']],
  },
  'pkg/webhook/admission/interfaces.go': {
    Interface: ['Base admission plugin contract requiring an operation-handling predicate.', ['interface', 'contracts', 'type-definition']],
    ValidationInterface: ['Contract for admission plugins that validate create, update, or delete requests and may return warnings.', ['interface', 'validation', 'contracts']],
    MutationInterface: ['Contract for admission plugins that mutate the incoming unstructured object.', ['interface', 'mutation', 'contracts']],
  },
  'pkg/webhook/server/server.go': {
    Run: ['Starts the controller-runtime manager, webhook listener, healthz endpoints, metrics, and optional pprof with graceful shutdown.', ['lifecycle', 'http-server', 'tls', 'observability']],
    freePort: ['Finds an available TCP port on the loopback interface for the webhook listener.', ['networking', 'port-allocation', 'utility']],
    Port: ['Returns the port the webhook listener is using, or ErrNotListening if unset.', ['accessor', 'networking', 'webhook']],
    handleHealthz: ['HTTP handler reporting unhealthy when the certificate source has no certificate.', ['health-check', 'http-handler', 'tls']],
    handleLivez: ['HTTP liveness handler that always returns 200 OK.', ['health-check', 'http-handler', 'liveness']],
    Server: ['Webhook server configuration and lifecycle manager with TLS, health, metrics, and profiling settings.', ['webhook', 'http-server', 'configuration', 'stateful']],
  },
};

const nodes = [];
const edges = [];
const nodeByFile = new Map();
const usedIds = new Set();

function addNode(node) {
  if (usedIds.has(node.id)) throw new Error('duplicate node id ' + node.id);
  usedIds.add(node.id);
  nodes.push(node);
  if (!nodeByFile.has(node.filePath)) nodeByFile.set(node.filePath, []);
  nodeByFile.get(node.filePath).push(node);
}

for (const f of dispatch.files) {
  const meta = fileMeta[f.path];
  addNode({
    id: 'file:' + f.path,
    type: 'file',
    name: path.basename(f.path),
    filePath: f.path,
    summary: meta[0],
    tags: meta[1],
    complexity: meta[2],
  });
}

const resultByPath = new Map(extract.results.map((r) => [r.path, r]));
for (const f of dispatch.files) {
  const r = resultByPath.get(f.path);
  if (!r) continue;
  const symMeta = symbolMeta[f.path] || {};
  const fileId = 'file:' + f.path;
  const addSub = (kind, sym, startLine, endLine) => {
    const m = symMeta[sym];
    if (!m) throw new Error('missing symbol meta ' + f.path + ' ' + sym);
    const id = kind + ':' + f.path + ':' + sym;
    addNode({
      id,
      type: kind,
      name: sym,
      filePath: f.path,
      lineRange: [startLine, endLine],
      summary: m[0],
      tags: m[1],
      complexity: (endLine - startLine + 1) > 100 ? 'complex' : (endLine - startLine + 1) >= 30 ? 'moderate' : 'simple',
    });
    edges.push({ source: fileId, target: id, type: 'contains', direction: 'forward', weight: 1.0 });
    if (/^[A-Z]/.test(sym)) {
      edges.push({ source: fileId, target: id, type: 'exports', direction: 'forward', weight: 0.8 });
    }
  };
  for (const fn of r.functions || []) {
    if (Object.prototype.hasOwnProperty.call(symMeta, fn.name)) addSub('function', fn.name, fn.startLine, fn.endLine);
  }
  for (const c of r.classes || []) {
    if (Object.prototype.hasOwnProperty.call(symMeta, c.name)) addSub('class', c.name, c.startLine, c.endLine);
  }
}

// Ensure every symbol metadata entry produced a node.
for (const [p, syms] of Object.entries(symbolMeta)) {
  for (const sym of Object.keys(syms)) {
    if (!usedIds.has('function:' + p + ':' + sym) && !usedIds.has('class:' + p + ':' + sym)) {
      throw new Error('symbol meta without node: ' + p + ' ' + sym);
    }
  }
}

let importEdgeCount = 0;
for (const f of dispatch.files) {
  for (const target of dispatch.batchImportData[f.path] || []) {
    edges.push({ source: 'file:' + f.path, target: 'file:' + target, type: 'imports', direction: 'forward', weight: 0.7 });
    importEdgeCount++;
  }
}

const calls = [
  ['internal/webhook/admission/certificaterequest/approval/certificaterequest_approval.go', 'Validate', 'function:internal/apis/certmanager/validation/util/conditions.go:GetCertificateRequestCondition'],
  ['internal/webhook/admission/certificaterequest/identity/certificaterequest_identity.go', 'validateUpdate', 'function:pkg/util/util.go:EqualUnsorted'],
  ['internal/webhook/admission/certificaterequest/identity/certificaterequest_identity.go', 'validateCreate', 'function:pkg/util/util.go:EqualUnsorted'],
  ['internal/webhook/admission/resourcevalidation/resourcevalidation.go', 'Validate', 'function:internal/apis/certmanager/validation/certificate.go:ValidateCertificate'],
  ['internal/webhook/admission/resourcevalidation/resourcevalidation.go', 'Validate', 'function:internal/apis/certmanager/validation/certificate.go:ValidateUpdateCertificate'],
  ['internal/webhook/admission/resourcevalidation/resourcevalidation.go', 'Validate', 'function:internal/apis/certmanager/validation/certificaterequest.go:ValidateCertificateRequest'],
  ['internal/webhook/admission/resourcevalidation/resourcevalidation.go', 'Validate', 'function:internal/apis/certmanager/validation/certificaterequest.go:ValidateUpdateCertificateRequest'],
  ['internal/webhook/admission/resourcevalidation/resourcevalidation.go', 'Validate', 'function:internal/apis/certmanager/validation/issuer.go:ValidateIssuer'],
  ['internal/webhook/admission/resourcevalidation/resourcevalidation.go', 'Validate', 'function:internal/apis/certmanager/validation/issuer.go:ValidateUpdateIssuer'],
  ['internal/webhook/admission/resourcevalidation/resourcevalidation.go', 'Validate', 'function:internal/apis/certmanager/validation/clusterissuer.go:ValidateClusterIssuer'],
  ['internal/webhook/admission/resourcevalidation/resourcevalidation.go', 'Validate', 'function:internal/apis/certmanager/validation/clusterissuer.go:ValidateUpdateClusterIssuer'],
  ['internal/webhook/admission/resourcevalidation/resourcevalidation.go', 'Validate', 'function:internal/apis/acme/validation/order.go:ValidateOrder'],
  ['internal/webhook/admission/resourcevalidation/resourcevalidation.go', 'Validate', 'function:internal/apis/acme/validation/order.go:ValidateOrderUpdate'],
  ['internal/webhook/admission/resourcevalidation/resourcevalidation.go', 'Validate', 'function:internal/apis/acme/validation/challenge.go:ValidateChallenge'],
  ['internal/webhook/admission/resourcevalidation/resourcevalidation.go', 'Validate', 'function:internal/apis/acme/validation/challenge.go:ValidateChallengeUpdate'],
  ['internal/webhook/webhook.go', 'NewCertManagerWebhookServer', 'function:internal/kube/config.go:BuildClientConfig'],
  ['internal/webhook/webhook.go', 'NewCertManagerWebhookServer', 'function:internal/webhook/webhook.go:buildAdmissionChain'],
  ['internal/webhook/webhook.go', 'NewCertManagerWebhookServer', 'function:internal/webhook/webhook.go:buildCertificateSource'],
  ['internal/webhook/webhook.go', 'buildAdmissionChain', 'function:internal/webhook/admission/certificaterequest/identity/certificaterequest_identity.go:NewPlugin'],
  ['internal/webhook/webhook.go', 'buildAdmissionChain', 'function:internal/webhook/admission/certificaterequest/approval/certificaterequest_approval.go:NewPlugin'],
  ['internal/webhook/webhook.go', 'buildAdmissionChain', 'function:internal/webhook/admission/resourcevalidation/resourcevalidation.go:NewPlugin'],
  ['pkg/issuer/acme/dns/rfc2136/rfc2136.go', 'NewDNSProviderCredentials', 'function:internal/apis/certmanager/validation/util/nameserver.go:ValidNameserver'],
  ['pkg/issuer/acme/dns/rfc2136/rfc2136.go', 'Present', 'function:pkg/issuer/acme/dns/rfc2136/rfc2136.go:changeRecord'],
  ['pkg/issuer/acme/dns/rfc2136/rfc2136.go', 'CleanUp', 'function:pkg/issuer/acme/dns/rfc2136/rfc2136.go:changeRecord'],
  ['pkg/server/tls/file_source.go', 'Start', 'function:pkg/server/tls/file_source.go:updateCertificateFromDisk'],
  ['pkg/webhook/server/server.go', 'Run', 'function:pkg/util/profiling/profiling.go:Install'],
  ['pkg/webhook/server/server.go', 'Run', 'function:pkg/webhook/admission/custom_mutation_webhook.go:NewCustomMutationWebhook'],
  ['pkg/webhook/server/server.go', 'Run', 'function:pkg/webhook/admission/custom_validator_webhook.go:NewCustomValidationWebhook'],
  ['pkg/webhook/server/server.go', 'Run', 'function:pkg/server/listener.go:Listen'],
  ['pkg/webhook/server/server.go', 'Run', 'function:pkg/webhook/server/server.go:freePort'],
];

for (const [p, caller, target] of calls) {
  const source = 'function:' + p + ':' + caller;
  if (!usedIds.has(source)) throw new Error('calls source missing: ' + source);
  edges.push({ source, target, type: 'calls', direction: 'forward', weight: 0.8 });
}

// sanity checks
for (const e of edges) {
  if (e.source === e.target) throw new Error('self edge ' + e.source);
}

const expectedImports = dispatch.files.reduce((a, f) => a + (dispatch.batchImportData[f.path] || []).length, 0);
if (importEdgeCount !== expectedImports) throw new Error('import edge mismatch ' + importEdgeCount + ' != ' + expectedImports);

// Partition
const sortedFiles = dispatch.files.map((f) => f.path).sort();
const parts = 6;
const chunkSize = Math.ceil(sortedFiles.length / parts);
const chunks = [];
for (let i = 0; i < sortedFiles.length; i += chunkSize) chunks.push(sortedFiles.slice(i, i + chunkSize));

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const fileToPart = new Map();
chunks.forEach((chunk, idx) => chunk.forEach((p) => fileToPart.set(p, idx)));
const partNodes = chunks.map(() => []);
const partEdges = chunks.map(() => []);
for (const n of nodes) {
  const idx = fileToPart.get(n.filePath);
  if (idx === undefined) throw new Error('node file not in any part: ' + n.filePath);
  partNodes[idx].push(n);
}
for (const e of edges) {
  const srcNode = nodes.find((n) => n.id === e.source);
  let idx;
  if (srcNode) idx = fileToPart.get(srcNode.filePath);
  else if (e.source.startsWith('file:')) idx = fileToPart.get(e.source.slice(5));
  if (idx === undefined) throw new Error('edge source not in any part: ' + e.source);
  partEdges[idx].push(e);
}

chunks.forEach((chunk, idx) => {
  const out = { nodes: partNodes[idx], edges: partEdges[idx] };
  const outPath = path.join(outDir, `batch-16-part-${idx + 1}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log(`part ${idx + 1}: files=${chunk.length} nodes=${out.nodes.length} edges=${out.edges.length} ${outPath}`);
});
console.log('TOTAL nodes=' + nodes.length + ' edges=' + edges.length + ' imports=' + importEdgeCount);
