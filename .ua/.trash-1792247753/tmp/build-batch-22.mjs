import fs from 'fs';

const prompt = JSON.parse(fs.readFileSync('.ua/tmp/prompts/batch-22.json', 'utf8'));

let nodes = [];
let edges = [];
let byFile = new Map();

function fileNode(path, summary, tags, complexity) {
  const n = { id: `file:${path}`, type: 'file', name: path.split('/').pop(), filePath: path, summary, tags, complexity };
  nodes.push(n);
  byFile.set(path, [n]);
  return n;
}
function sub(path, kind, name, lineRange, summary, tags, complexity, exported = false) {
  const n = {
    id: `${kind}:${path}:${name}`,
    type: kind,
    name,
    filePath: path,
    lineRange,
    summary,
    tags,
    complexity,
  };
  nodes.push(n);
  byFile.get(path).push(n);
  if (exported) {
    edges.push({ source: `file:${path}`, target: n.id, type: 'exports', direction: 'forward', weight: 0.8 });
  }
  edges.push({ source: `file:${path}`, target: n.id, type: 'contains', direction: 'forward', weight: 1.0 });
  return n;
}

// ---------- Part 1 ----------
const p1 = 'pkg/acme/accounts/client.go';
fileNode(p1,
  'Constructs cert-manager ACME clients from issuer options, wiring TLS configuration, custom CA bundles, retry backoff, and logging middleware.',
  ['acme', 'client-factory', 'tls', 'networking'], 'moderate');
sub(p1, 'function', 'NewClient', [52, 60],
  'Returns a NewClientFunc that builds a metrics-instrumented ACME client for the supplied metrics registry and user agent.',
  ['factory', 'acme', 'client'], 'simple', true);
sub(p1, 'function', 'buildHTTPClientWithCABundle', [77, 111],
  'Creates an instrumented HTTP client with optional custom CA bundle, TLS verification settings, and tuned connection pooling for ACME requests.',
  ['http-client', 'tls', 'metrics', 'networking'], 'moderate');

const p2 = 'pkg/acme/accounts/registry.go';
fileNode(p2,
  'In-memory registry that caches ACME clients per issuer UID and rebuilds them only when the server URL, TLS options, or account key change.',
  ['acme', 'registry', 'cache', 'concurrency'], 'moderate');
sub(p2, 'class', 'Registry', [36, 50],
  'Interface for storing, retrieving, and invalidating cached ACME clients keyed by issuer UID.',
  ['acme', 'interface', 'registry'], 'simple', true);
sub(p2, 'class', 'Getter', [53, 64],
  'Read-only view of the ACME client registry exposing client lookup and listing.',
  ['acme', 'interface', 'read-only'], 'simple', true);
sub(p2, 'class', 'registry', [75, 82],
  'Mutex-protected map implementation of Registry that stores clients alongside the stable options used to build them.',
  ['registry', 'concurrency', 'cache'], 'moderate');
sub(p2, 'function', 'NewDefaultRegistry', [67, 72],
  'Creates the default Registry implementation backed by a mutex-protected map keyed by issuer UID.',
  ['factory', 'registry'], 'simple', true);
sub(p2, 'function', 'newStableOptions', [101, 115],
  'Hashes the account private key and captures server URL, skip-TLS-verify, and CA bundle into a comparable options struct used as a cache key.',
  ['hashing', 'options', 'cache-key'], 'simple');
sub(p2, 'function', 'ensureClient', [137, 156],
  'Creates or replaces the cached ACME client for an issuer UID when its stable options differ from the stored ones.',
  ['registry', 'cache', 'concurrency'], 'moderate');
sub(p2, 'function', 'AddClient', [127, 130],
  'Ensures the registry holds an up-to-date ACME client for the given issuer UID.',
  ['registry', 'cache'], 'simple', true);
sub(p2, 'function', 'GetClient', [161, 169],
  'Returns the cached ACME client for the given issuer UID, or ErrNotFound when absent.',
  ['registry', 'lookup'], 'simple', true);
sub(p2, 'function', 'RemoveClient', [173, 180],
  'Deletes the cached ACME client associated with the given issuer UID.',
  ['registry', 'cleanup'], 'simple', true);
sub(p2, 'function', 'ListClients', [186, 195],
  'Returns a snapshot map of all registered ACME clients keyed by issuer UID, stripping internal metadata.',
  ['registry', 'enumeration'], 'simple', true);
sub(p2, 'function', 'IsKeyCheckSumCached', [200, 218],
  'Compares the SHA-256 checksum of the supplied private key with a previously recorded hash to detect account key rotation.',
  ['validation', 'hashing', 'key-management'], 'moderate', true);

const p3 = 'pkg/acme/accounts/test/registry.go';
fileNode(p3,
  'Test double implementing the accounts.Registry interface with injectable function fields for unit tests.',
  ['test', 'mock', 'registry', 'acme'], 'simple');
sub(p3, 'class', 'FakeRegistry', [29, 35],
  'Fake registry whose methods delegate to caller-supplied functions, letting tests stub ACME client storage and lookup.',
  ['test', 'mock', 'registry'], 'simple', true);

const p4 = 'pkg/acme/client/fake.go';
fileNode(p4,
  'FakeACME implements the ACME client Interface with per-method callback hooks, enabling controller tests without a real ACME server.',
  ['test', 'mock', 'acme', 'client'], 'moderate');
sub(p4, 'class', 'FakeACME', [30, 47],
  "Configurable mock ACME client whose methods invoke optional Fake* callbacks and return 'not implemented' errors when unset.",
  ['test', 'mock', 'acme'], 'moderate', true);

const p5 = 'pkg/acme/client/http.go';
fileNode(p5,
  'Custom round tripper that instruments every ACME HTTP request with Prometheus duration and count metrics.',
  ['http-client', 'metrics', 'middleware', 'acme'], 'moderate');
sub(p5, 'function', 'NewInstrumentedClient', [52, 68],
  'Wraps an http.Client transport with the instrumented ACME round tripper, falling back to http.DefaultClient when nil.',
  ['http-client', 'metrics', 'factory'], 'simple', true);
sub(p5, 'function', 'RoundTrip', [72, 103],
  'Measures request latency and records ACME duration and count metrics labeled by scheme, host, action, method, and status code.',
  ['metrics', 'http-client', 'observability'], 'moderate');

// ---------- Part 2 ----------
const q1 = 'pkg/acme/client/interfaces.go';
fileNode(q1,
  "Defines cert-manager's ACME client Interface covering RFC 8555 order, authorization, challenge, and account operations.",
  ['acme', 'interface', 'type-definition', 'api-contract'], 'moderate');
sub(q1, 'class', 'Interface', [31, 59],
  'ACME client contract used by controllers and middleware, implemented by the forked acme.Client and FakeACME.',
  ['acme', 'interface', 'api-contract'], 'moderate', true);

const q2 = 'pkg/acme/client/middleware/logger.go';
fileNode(q2,
  'Logging middleware that decorates ACME client calls with trace logs and an operation label used as a Prometheus metric dimension.',
  ['middleware', 'logging', 'acme', 'observability'], 'moderate');
sub(q2, 'function', 'NewLogger', [29, 34],
  'Constructs a Logger middleware around the supplied ACME client.',
  ['middleware', 'factory', 'logging'], 'simple', true);
sub(q2, 'class', 'Logger', [39, 42],
  'Wraps a client.Interface, logging each ACME operation and injecting an AcmeActionLabel into the request context.',
  ['middleware', 'logging', 'acme'], 'moderate', true);

const q3 = 'pkg/acme/util/util.go';
fileNode(q3,
  'Provides the ACME client retry backoff that retries badNonce (HTTP 400) responses with capped exponential backoff and jitter.',
  ['utility', 'retry', 'acme', 'backoff'], 'moderate');
sub(q3, 'function', 'RetryBackoff', [33, 63],
  'Returns a jittered exponential backoff for badNonce responses, giving up after six retries or when the response is not a 400.',
  ['retry', 'backoff', 'acme'], 'moderate', true);

const q4 = 'pkg/controller/acmechallenges/sync.go';
fileNode(q4,
  'Core reconciliation logic for ACME Challenge resources: presents solvers, checks propagation, accepts challenges with the ACME server, and records final state.',
  ['controller', 'acme', 'reconciliation', 'challenge'], 'complex');
sub(q4, 'class', 'solver', [52, 61],
  'Interface for challenge solvers that present, self-check, and clean up HTTP-01 or DNS-01 challenge values.',
  ['acme', 'interface', 'solver'], 'simple');
sub(q4, 'function', 'Sync', [65, 193],
  'Main reconcile loop that manages challenge finalizers, selects a solver, presents and checks the challenge, accepts it, and updates status.',
  ['controller', 'reconciliation', 'acme'], 'complex', true);
sub(q4, 'function', 'handleError', [198, 231],
  'Maps ACME API errors to Errored or Expired challenge states and absorbs expected client errors.',
  ['error-handling', 'acme'], 'moderate');
sub(q4, 'function', 'handleFinalizer', [235, 271],
  'Runs solver cleanup when a Challenge is deleted, then removes the cert-manager finalizers.',
  ['finalizer', 'cleanup', 'solver'], 'moderate');
sub(q4, 'function', 'syncChallengeStatus', [276, 333],
  "Fetches the parent authorization to read the challenge's current state and error detail, avoiding direct challenge POST-as-GET calls.",
  ['acme', 'status', 'authorization'], 'moderate');
sub(q4, 'function', 'acceptChallenge', [340, 380],
  'Accepts the challenge with the ACME server and waits for the authorization to reach a final state under a two-minute timeout.',
  ['acme', 'challenge', 'authorization'], 'moderate');
sub(q4, 'function', 'handleAuthorizationError', [382, 401],
  'Marks the challenge Invalid when authorization fails, emits a warning event, and swallows the domain validation failure.',
  ['error-handling', 'acme', 'events'], 'simple');

const q5 = 'pkg/controller/acmeorders/sync.go';
fileNode(q5,
  'Reconciliation logic for ACME Order resources, driving order creation, authorization metadata, challenge lifecycle, finalization, and certificate storage.',
  ['controller', 'acme', 'reconciliation', 'order'], 'complex');
sub(q5, 'function', 'Sync', [63, 260],
  'Orchestrates the Order state machine: creates the ACME order, ensures challenges exist, finalizes when ready, and stores issued certificates.',
  ['controller', 'reconciliation', 'state-machine'], 'complex', true);
sub(q5, 'function', 'isRetryableError', [262, 278],
  'Classifies ACME errors as retryable unless they relate to unsupported profiles or are 4xx responses.',
  ['error-handling', 'acme'], 'simple');
sub(q5, 'function', 'createOrder', [280, 330],
  'Submits a new order to the ACME server using DNS and IP identifiers plus optional duration and profile settings.',
  ['acme', 'order', 'creation'], 'moderate');
sub(q5, 'function', 'updateOrderStatusFromACMEOrder', [341, 361],
  'Copies URL, finalize URL, state, and authorizations from the ACME order into the Order status.',
  ['status', 'acme', 'order'], 'simple');
sub(q5, 'function', 'fetchMetadataForAuthorizations', [397, 430],
  'Fetches each authorization from the ACME server once to populate identifier, wildcard, challenge, and initial state metadata.',
  ['acme', 'authorization', 'metadata'], 'moderate');
sub(q5, 'function', 'anyRequiredChallengesDoNotExist', [432, 443],
  'Checks whether any challenge required by the order is missing from the cluster.',
  ['challenge', 'validation', 'cache'], 'simple');
sub(q5, 'function', 'createRequiredChallenges', [445, 457],
  'Creates missing Challenge resources in the API server and emits Created events.',
  ['challenge', 'kubernetes', 'creation'], 'simple');
sub(q5, 'function', 'deleteLeftoverChallenges', [468, 481],
  'Deletes Challenge resources that are no longer required by the order.',
  ['challenge', 'cleanup'], 'simple');
sub(q5, 'function', 'deleteAllChallenges', [483, 496],
  'Removes every Challenge resource owned by the order when it reaches a terminal state.',
  ['challenge', 'cleanup'], 'simple');
sub(q5, 'function', 'determineLeftoverChallenges', [498, 518],
  'Computes the set of owned challenges that are not part of the required challenge list.',
  ['challenge', 'set-operations'], 'moderate');
sub(q5, 'function', 'listOwnedChallenges', [520, 535],
  'Lists Challenge resources owned by the Order using label selectors.',
  ['challenge', 'kubernetes', 'lookup'], 'simple');
sub(q5, 'function', 'finalizeOrder', [537, 632],
  'Finalizes the ACME order with the CSR (accepting legacy DER input) and stores the returned certificate and URL.',
  ['acme', 'order', 'certificate', 'finalize'], 'complex');
sub(q5, 'function', 'storeCertificateOnStatus', [634, 652],
  'Encodes the issued certificate chain and stores it on the Order status.',
  ['certificate', 'status'], 'simple');
sub(q5, 'function', 'syncCertificateData', [656, 676],
  'Retrieves the ACME order and, when valid, downloads and stores the certificate on the Order.',
  ['certificate', 'acme', 'status'], 'moderate');
sub(q5, 'function', 'syncCertificateDataWithOrder', [678, 714],
  'Fetches the certificate bundle for a valid ACME order, honors a preferred chain, and persists it.',
  ['certificate', 'acme', 'chain'], 'moderate');
sub(q5, 'function', 'getACMEOrder', [717, 731],
  'Fetches the latest ACME order state from the server using the stored order URL.',
  ['acme', 'order', 'lookup'], 'simple');
sub(q5, 'function', 'getPreferredCertChain', [733, 802],
  'Selects the certificate chain matching the preferred issuer chain, falling back to alternates when needed.',
  ['certificate', 'chain', 'selection'], 'complex');
sub(q5, 'function', 'updateOrApplyStatus', [807, 817],
  'Applies status changes to the Order through the API or status applier.',
  ['status', 'kubernetes'], 'simple');

// ---------- Part 3 ----------
const r1 = 'pkg/issuer/acme/setup.go';
fileNode(r1,
  'ACME issuer setup that loads or generates the account key, registers or verifies the ACME account, and configures the shared client registry.',
  ['issuer', 'acme', 'setup', 'kubernetes'], 'complex');
sub(r1, 'function', 'Setup', [72, 84],
  'Entry point that sets up the ACME account for an issuer and translates the result into issuer status conditions and events.',
  ['issuer', 'acme', 'entry-point'], 'simple', true);
sub(r1, 'function', 'setup', [94, 432],
  'Validates issuer configuration, resolves the account private key Secret, creates the ACME client, and registers or verifies the account.',
  ['issuer', 'acme', 'account', 'orchestration'], 'complex');
sub(r1, 'function', 'ensureEmailUpToDate', [434, 463],
  'Updates the registered ACME account contact address when it differs from the issuer spec.',
  ['acme', 'account', 'update'], 'moderate');
sub(r1, 'function', 'registerAccount', [469, 495],
  'Registers a new ACME account or retrieves the existing account when the private key is already registered.',
  ['acme', 'account', 'registration'], 'moderate');
sub(r1, 'function', 'getEABKey', [497, 523],
  'Reads and base64-decodes the external account binding key from a Kubernetes Secret.',
  ['acme', 'kubernetes', 'secret', 'eab'], 'moderate');
sub(r1, 'function', 'createAccountPrivateKey', [527, 552],
  'Generates an RSA account key and persists it in a cert-manager managed Kubernetes Secret.',
  ['acme', 'key-management', 'kubernetes', 'secret'], 'moderate');

const r2 = 'third_party/forked/acme/acme.go';
fileNode(r2,
  'Forked golang.org/x/crypto/acme client implementing RFC 8555 discovery, accounts, authorizations, challenges, nonces, and TLS-ALPN certificate handling.',
  ['acme', 'vendor', 'client', 'rfc8555'], 'complex');
sub(r2, 'class', 'Client', [84, 134],
  'ACME client holding the account key, directory state, nonce cache, user agent, and retry/backoff configuration.',
  ['acme', 'client', 'state'], 'moderate', true);
sub(r2, 'function', 'accountKID', [145, 157],
  'Resolves the account key identifier from the cached account or by looking up the registered account.',
  ['acme', 'account', 'authentication'], 'moderate');
sub(r2, 'function', 'Discover', [166, 215],
  'Fetches and caches the ACME directory, validates RFC 8555 support, and records nonces from the response.',
  ['acme', 'discovery', 'directory'], 'moderate', true);
sub(r2, 'function', 'authorize', [353, 387],
  'Creates a new authorization for a domain or IP identifier and returns the resulting authorization URL.',
  ['acme', 'authorization'], 'moderate');
sub(r2, 'function', 'GetAuthorization', [393, 408],
  'Retrieves an authorization resource using POST-as-GET.',
  ['acme', 'authorization', 'lookup'], 'moderate', true);
sub(r2, 'function', 'RevokeAuthorization', [419, 439],
  'Deactivates an authorization by posting a deactivated status to its URL.',
  ['acme', 'authorization', 'revocation'], 'moderate', true);
sub(r2, 'function', 'WaitAuthorization', [448, 490],
  'Polls an authorization until it reaches a final state, honoring context cancellation and retryable transport errors.',
  ['acme', 'authorization', 'polling'], 'moderate', true);
sub(r2, 'function', 'GetChallenge', [495, 511],
  'Retrieves a challenge resource using POST-as-GET.',
  ['acme', 'challenge', 'lookup'], 'moderate', true);
sub(r2, 'function', 'Accept', [517, 540],
  'Notifies the ACME server that a challenge is ready for validation.',
  ['acme', 'challenge', 'validation'], 'moderate', true);
sub(r2, 'function', 'TLSALPN01ChallengeCert', [611, 642],
  'Builds a self-signed tls-alpn-01 challenge certificate for the identifier and token.',
  ['acme', 'tls-alpn', 'certificate', 'challenge'], 'moderate', true);
sub(r2, 'function', 'popNonce', [648, 668],
  'Returns and removes a cached nonce, fetching a fresh one from the directory or previous response when the cache is empty.',
  ['acme', 'nonce', 'replay-protection'], 'moderate');
sub(r2, 'function', 'addNonce', [678, 692],
  'Adds replay nonces from response headers to the bounded nonce cache.',
  ['acme', 'nonce', 'cache'], 'moderate');
sub(r2, 'function', 'fetchNonce', [694, 712],
  'Requests a new nonce from the ACME server using a HEAD request.',
  ['acme', 'nonce', 'http'], 'moderate');
sub(r2, 'function', 'linkHeader', [721, 736],
  'Parses HTTP Link headers and returns URLs matching the requested relation.',
  ['http', 'parsing', 'pagination'], 'moderate');
sub(r2, 'function', 'tlsChallengeCert', [767, 807],
  'Creates a tls-alpn-01 challenge certificate containing the acmeIdentifier extension using supplied key and template options.',
  ['acme', 'tls-alpn', 'certificate'], 'complex');

const r3 = 'third_party/forked/acme/http.go';
fileNode(r3,
  'HTTP transport layer for the forked ACME client, implementing retries, backoff, nonce-aware JWS POSTs, status validation, and structured error responses.',
  ['acme', 'http-client', 'retry', 'vendor'], 'complex');
sub(r3, 'class', 'retryTimer', [26, 32],
  "Tracks retry attempts and sleeps according to the client's backoff function.",
  ['retry', 'backoff'], 'simple');
sub(r3, 'function', 'backoff', [39, 52],
  'Sleeps for the configured backoff duration or returns an error when retries are exhausted or the context is cancelled.',
  ['retry', 'backoff', 'context'], 'moderate');
sub(r3, 'function', 'defaultBackoff', [68, 90],
  'Provides the default truncated exponential backoff with jitter for retried requests.',
  ['retry', 'backoff'], 'moderate');
sub(r3, 'function', 'retryAfter', [95, 104],
  'Parses a Retry-After header value into a duration.',
  ['http', 'parsing', 'retry'], 'simple');
sub(r3, 'function', 'wantStatus', [112, 121],
  'Returns a response validator that accepts only the listed HTTP status codes.',
  ['http', 'validation'], 'simple');
sub(r3, 'function', 'get', [128, 155],
  'Performs an HTTP GET with retry handling and returns the response after validating its status.',
  ['http', 'retry'], 'moderate');
sub(r3, 'function', 'post', [172, 200],
  'Signs and sends a JWS POST request with nonce handling and configurable retries.',
  ['http', 'jws', 'nonce', 'retry'], 'moderate');
sub(r3, 'function', 'postNoRetry', [214, 242],
  'Sends a signed JWS POST request exactly once without retrying.',
  ['http', 'jws'], 'moderate');
sub(r3, 'function', 'doNoRetry', [245, 262],
  'Executes an HTTP request once and maps transport failures to ACME errors.',
  ['http', 'error-handling'], 'moderate');
sub(r3, 'function', 'init', [275, 291],
  'Resolves the module version at startup for inclusion in the User-Agent header.',
  ['initialization', 'build-info'], 'simple');
sub(r3, 'function', 'responseError', [326, 341],
  'Converts an HTTP response into a structured ACME Error carrying problem details.',
  ['http', 'error-handling'], 'moderate');
sub(r3, 'function', 'userAgent', [295, 304],
  'Builds the User-Agent header from the forked package path, module version, and configured user agent.',
  ['http', 'user-agent'], 'simple');

const r4 = 'third_party/forked/acme/internal/acmeprobe/prober.go';
fileNode(r4,
  'Standalone ACME probing tool that exercises order and pre-authorization flows against a live CA using http-01, dns-01, or tls-alpn-01 challenges.',
  ['tool', 'acme', 'testing', 'cli'], 'complex');
sub(r4, 'class', 'prober', [137, 144],
  'Coordinates an ACME probe run, carrying flow options and an error callback.',
  ['acme', 'testing', 'orchestration'], 'simple');
sub(r4, 'function', 'main', [67, 135],
  'Parses command-line flags, configures a prober run, and executes the selected ACME flow.',
  ['cli', 'entry-point', 'acme'], 'moderate');
sub(r4, 'function', 'runOrder', [152, 209],
  'Runs a full order flow: creates an order, fulfills its challenges, finalizes it, and validates the certificate.',
  ['acme', 'order', 'testing'], 'complex');
sub(r4, 'function', 'runPreauthz', [211, 274],
  'Runs a pre-authorization flow, fulfilling each authorization and checking the resulting certificates.',
  ['acme', 'authorization', 'testing'], 'complex');
sub(r4, 'function', 'fulfill', [276, 299],
  'Dispatches challenge fulfillment to the tls-alpn-01, http-01, or dns-01 handler.',
  ['acme', 'challenge', 'dispatch'], 'moderate');
sub(r4, 'function', 'runTLSALPN01', [301, 328],
  'Serves the tls-alpn-01 challenge certificate and accepts challenge validation.',
  ['acme', 'tls-alpn', 'testing'], 'moderate');
sub(r4, 'function', 'runHTTP01', [330, 354],
  'Serves the http-01 key authorization token from a local HTTP server.',
  ['acme', 'http-01', 'testing'], 'moderate');
sub(r4, 'function', 'runDNS01', [356, 376],
  'Invokes an external script to provision the dns-01 TXT record.',
  ['acme', 'dns-01', 'testing'], 'moderate');
sub(r4, 'function', 'checkCert', [385, 410],
  'Verifies that a returned certificate chain is valid for the requested identifier.',
  ['certificate', 'validation', 'testing'], 'moderate');
sub(r4, 'function', 'newCSR', [412, 433],
  'Generates an ECDSA key and CSR covering the requested domain and IP identifiers.',
  ['csr', 'key-management', 'testing'], 'moderate');

const r5 = 'third_party/forked/acme/jws.go';
fileNode(r5,
  'Implements JWS signing for ACME requests, including JWK encoding, HMAC and asymmetric signing, and JWK thumbprints.',
  ['acme', 'jws', 'cryptography', 'vendor'], 'complex');
sub(r5, 'function', 'jwsEncodeJSON', [62, 118],
  'Builds a flattened JWS JSON object with protected headers, nonce, URL, and a signed claim set.',
  ['jws', 'cryptography', 'acme'], 'moderate');
sub(r5, 'function', 'jwsWithMAC', [123, 155],
  'Produces a JWS using a symmetric MAC key, used for external account binding.',
  ['jws', 'hmac', 'eab'], 'moderate');
sub(r5, 'function', 'jwkEncode', [160, 196],
  'Serializes an RSA or ECDSA public key as canonical JWK JSON.',
  ['jwk', 'serialization', 'cryptography'], 'moderate');
sub(r5, 'function', 'jwsSign', [200, 226],
  'Signs a digest with RSA or ECDSA keys and returns the signature bytes.',
  ['jws', 'signing', 'cryptography'], 'moderate');
sub(r5, 'function', 'JWKThumbprint', [250, 257],
  "Computes the RFC 7638 SHA-256 thumbprint of a public key's JWK.",
  ['jwk', 'hashing', 'cryptography'], 'simple', true);

// ---------- Part 4 ----------
const s1 = 'third_party/forked/acme/rfc8555.go';
fileNode(s1,
  'Implements the RFC 8555 account, order, certificate, and revocation operations for the forked ACME client.',
  ['acme', 'rfc8555', 'protocol', 'vendor'], 'complex');
sub(s1, 'function', 'DeactivateReg', [25, 40],
  'Permanently deactivates the ACME account associated with the client key.',
  ['acme', 'account', 'deactivation'], 'moderate', true);
sub(s1, 'function', 'registerRFC', [44, 88],
  'Registers an RFC 8555 account, optionally including terms agreement and external account binding.',
  ['acme', 'account', 'registration'], 'moderate');
sub(s1, 'function', 'updateRegRFC', [102, 118],
  'Updates the ACME account contact information with a signed POST.',
  ['acme', 'account', 'update'], 'moderate');
sub(s1, 'function', 'getRegRFC', [122, 134],
  'Retrieves the current ACME account using POST-as-GET.',
  ['acme', 'account', 'lookup'], 'moderate');
sub(s1, 'function', 'responseAccount', [136, 151],
  'Parses an account response and extracts its URL from the Location header.',
  ['acme', 'account', 'parsing'], 'moderate');
sub(s1, 'function', 'accountKeyRollover', [155, 187],
  'Migrates the account to a new key using the RFC 8555 key-change flow.',
  ['acme', 'account', 'key-rotation'], 'moderate');
sub(s1, 'function', 'AuthorizeOrder', [198, 243],
  'Creates a new ACME order for the given identifiers with optional not-before, not-after, and profile settings.',
  ['acme', 'order', 'creation'], 'moderate', true);
sub(s1, 'function', 'GetOrder', [250, 261],
  'Fetches an order by URL using POST-as-GET.',
  ['acme', 'order', 'lookup'], 'moderate', true);
sub(s1, 'function', 'WaitOrder', [270, 305],
  'Polls an order until it reaches ready, valid, or invalid state and returns the final order.',
  ['acme', 'order', 'polling'], 'moderate', true);
sub(s1, 'function', 'responseOrder', [307, 339],
  'Parses an order response, resolving authorization and certificate URLs.',
  ['acme', 'order', 'parsing'], 'moderate');
sub(s1, 'function', 'CreateOrderCert', [352, 386],
  'Finalizes an order with a CSR and downloads the issued certificate chain.',
  ['acme', 'certificate', 'finalize'], 'moderate', true);
sub(s1, 'function', 'fetchCertRFC', [392, 434],
  'Downloads a PEM certificate chain, optionally including alternate chains, and decodes it.',
  ['acme', 'certificate', 'download'], 'moderate');
sub(s1, 'function', 'revokeCertRFC', [437, 455],
  'Revokes a certificate with the given reason code, treating already-revoked errors as success.',
  ['acme', 'certificate', 'revocation'], 'moderate');
sub(s1, 'function', 'ListCertAlternates', [468, 486],
  'Lists alternate certificate chain URLs from Link headers.',
  ['acme', 'certificate', 'pagination'], 'moderate', true);

const s2 = 'third_party/forked/acme/types.go';
fileNode(s2,
  'Data types and error models for the forked ACME client, covering accounts, directories, orders, authorizations, challenges, and certificate options.',
  ['acme', 'data-model', 'types', 'vendor'], 'complex');
sub(s2, 'class', 'Subproblem', [75, 89],
  'Represents a single sub-problem within an ACME error response.',
  ['acme', 'error', 'data-model'], 'simple', true);
sub(s2, 'class', 'Error', [102, 123],
  'ACME protocol error carrying type, detail, HTTP status, and sub-problems.',
  ['acme', 'error', 'data-model'], 'moderate', true);
sub(s2, 'class', 'AuthorizationError', [139, 149],
  'Error returned when an authorization fails, including the problematic challenge.',
  ['acme', 'error', 'authorization'], 'simple', true);
sub(s2, 'class', 'OrderError', [171, 176],
  'Error returned when an order cannot be completed, exposing the order URL.',
  ['acme', 'error', 'order'], 'simple', true);
sub(s2, 'class', 'Account', [205, 261],
  'ACME account resource with contact details, status, orders URL, and external account binding.',
  ['acme', 'account', 'data-model'], 'moderate', true);
sub(s2, 'class', 'ExternalAccountBinding', [266, 274],
  'Holds the key identifier and MAC key used for external account binding.',
  ['acme', 'eab', 'data-model'], 'simple', true);
sub(s2, 'class', 'Directory', [282, 327],
  'ACME directory listing the service endpoints advertised by the certificate authority.',
  ['acme', 'directory', 'data-model'], 'moderate', true);
sub(s2, 'class', 'Order', [331, 385],
  'ACME order resource with identifiers, authorization URLs, finalize URL, and certificate URL.',
  ['acme', 'order', 'data-model'], 'moderate', true);
sub(s2, 'class', 'OrderOption', [388, 390],
  'Functional option for customizing order creation.',
  ['acme', 'options', 'order'], 'simple', true);
sub(s2, 'class', 'Authorization', [424, 458],
  'ACME authorization resource describing identifier ownership and its challenges.',
  ['acme', 'authorization', 'data-model'], 'moderate', true);
sub(s2, 'class', 'Challenge', [541, 574],
  'ACME challenge resource with type, token, URI, status, and validation error.',
  ['acme', 'challenge', 'data-model'], 'moderate', true);
sub(s2, 'class', 'CertOption', [630, 632],
  'Functional option for customizing certificate and challenge certificate creation.',
  ['acme', 'options', 'certificate'], 'simple', true);
sub(s2, 'function', 'RateLimit', [187, 201],
  'Wraps an ACME error to expose retry timing and rate-limit details.',
  ['acme', 'error', 'rate-limit'], 'moderate', true);
sub(s2, 'function', 'DomainIDs', [467, 473],
  'Converts domain names into ACME DNS identifier values.',
  ['acme', 'identifier', 'conversion'], 'simple', true);
sub(s2, 'function', 'IPIDs', [478, 484],
  'Converts IP addresses into ACME IP identifier values.',
  ['acme', 'identifier', 'conversion'], 'simple', true);

// ---------- Imports (exact from batchImportData) ----------
const codeFiles = new Set(prompt.batchImportData ? Object.keys(prompt.batchImportData) : []);
let importCount = 0;
for (const [f, imps] of Object.entries(prompt.batchImportData)) {
  for (const target of imps) {
    edges.push({ source: `file:${f}`, target: `file:${target}`, type: 'imports', direction: 'forward', weight: 0.7 });
    importCount++;
  }
}

// ---------- Extra semantic edges ----------
const extra = [
  // implements
  ['class', 'pkg/acme/accounts/registry.go', 'registry', 'class', 'pkg/acme/accounts/registry.go', 'Registry', 'implements', 0.9],
  ['class', 'pkg/acme/accounts/test/registry.go', 'FakeRegistry', 'class', 'pkg/acme/accounts/registry.go', 'Registry', 'implements', 0.9],
  ['class', 'pkg/acme/client/fake.go', 'FakeACME', 'class', 'pkg/acme/client/interfaces.go', 'Interface', 'implements', 0.9],
  ['class', 'pkg/acme/client/middleware/logger.go', 'Logger', 'class', 'pkg/acme/client/interfaces.go', 'Interface', 'implements', 0.9],
  // calls
  ['function', 'pkg/acme/accounts/client.go', 'buildHTTPClientWithCABundle', 'function', 'pkg/acme/client/http.go', 'NewInstrumentedClient', 'calls', 0.8],
  ['function', 'pkg/acme/client/http.go', 'RoundTrip', 'function', 'pkg/metrics/acme.go', 'ObserveACMERequestDuration', 'calls', 0.8],
  ['function', 'pkg/controller/acmeorders/sync.go', 'Sync', 'function', 'pkg/acme/util.go', 'IsFailureState', 'calls', 0.8],
  ['function', 'pkg/controller/acmeorders/sync.go', 'createOrder', 'function', 'third_party/forked/acme/types.go', 'DomainIDs', 'calls', 0.8],
  ['function', 'pkg/controller/acmeorders/sync.go', 'createOrder', 'function', 'third_party/forked/acme/types.go', 'IPIDs', 'calls', 0.8],
  ['function', 'pkg/controller/acmechallenges/sync.go', 'Sync', 'function', 'pkg/acme/util.go', 'IsFinalState', 'calls', 0.8],
  ['function', 'pkg/issuer/acme/setup.go', 'setup', 'function', 'pkg/acme/accounts/client.go', 'NewClient', 'calls', 0.8],
  ['function', 'pkg/issuer/acme/setup.go', 'createAccountPrivateKey', 'function', 'pkg/util/pki/generate.go', 'GenerateRSAPrivateKey', 'calls', 0.8],
  ['function', 'third_party/forked/acme/acme.go', 'Discover', 'function', 'third_party/forked/acme/http.go', 'get', 'calls', 0.8],
  ['function', 'third_party/forked/acme/acme.go', 'Discover', 'function', 'third_party/forked/acme/acme.go', 'addNonce', 'calls', 0.8],
  ['function', 'third_party/forked/acme/acme.go', 'authorize', 'function', 'third_party/forked/acme/http.go', 'post', 'calls', 0.8],
  ['function', 'third_party/forked/acme/acme.go', 'GetAuthorization', 'function', 'third_party/forked/acme/http.go', 'post', 'calls', 0.8],
  ['function', 'third_party/forked/acme/acme.go', 'WaitAuthorization', 'function', 'third_party/forked/acme/http.go', 'post', 'calls', 0.8],
  ['function', 'third_party/forked/acme/acme.go', 'Accept', 'function', 'third_party/forked/acme/http.go', 'post', 'calls', 0.8],
  ['function', 'third_party/forked/acme/acme.go', 'popNonce', 'function', 'third_party/forked/acme/acme.go', 'fetchNonce', 'calls', 0.8],
  ['function', 'third_party/forked/acme/acme.go', 'TLSALPN01ChallengeCert', 'function', 'third_party/forked/acme/acme.go', 'tlsChallengeCert', 'calls', 0.8],
  ['function', 'third_party/forked/acme/rfc8555.go', 'DeactivateReg', 'function', 'third_party/forked/acme/http.go', 'post', 'calls', 0.8],
  ['function', 'third_party/forked/acme/rfc8555.go', 'registerRFC', 'function', 'third_party/forked/acme/http.go', 'post', 'calls', 0.8],
  ['function', 'third_party/forked/acme/rfc8555.go', 'AuthorizeOrder', 'function', 'third_party/forked/acme/http.go', 'post', 'calls', 0.8],
  ['function', 'third_party/forked/acme/rfc8555.go', 'GetOrder', 'function', 'third_party/forked/acme/http.go', 'post', 'calls', 0.8],
  ['function', 'third_party/forked/acme/rfc8555.go', 'CreateOrderCert', 'function', 'third_party/forked/acme/http.go', 'post', 'calls', 0.8],
  ['function', 'third_party/forked/acme/rfc8555.go', 'fetchCertRFC', 'function', 'third_party/forked/acme/http.go', 'post', 'calls', 0.8],
  ['function', 'third_party/forked/acme/rfc8555.go', 'revokeCertRFC', 'function', 'third_party/forked/acme/http.go', 'post', 'calls', 0.8],
];
for (const [sk, sp, sn, tk, tp, tn, type, weight] of extra) {
  edges.push({ source: `${sk}:${sp}:${sn}`, target: `${tk}:${tp}:${tn}`, type, direction: 'forward', weight });
}

// ---------- Partition ----------
const files = prompt.files.map(f => f.path).sort();
const partDefs = [
  files.slice(0, 5),
  files.slice(5, 10),
  files.slice(10, 15),
  files.slice(15),
];

const allIds = new Set(nodes.map(n => n.id));
const edgesBySourceFile = new Map();
for (const e of edges) {
  let file;
  if (e.source.startsWith('file:')) file = e.source.slice(5);
  else {
    const rest = e.source.slice(e.source.indexOf(':') + 1);
    file = rest.slice(0, rest.lastIndexOf(':'));
  }
  if (!edgesBySourceFile.has(file)) edgesBySourceFile.set(file, []);
  edgesBySourceFile.get(file).push(e);
}

const importTargets = new Set(Object.values(prompt.batchImportData).flat());
const neighborTargets = new Set();
for (const arr of Object.values(prompt.neighborMap || {})) {
  for (const nb of arr) {
    neighborTargets.add(`file:${nb.path}`);
    for (const s of nb.symbols) {
      neighborTargets.add(`function:${nb.path}:${s}`);
      neighborTargets.add(`class:${nb.path}:${s}`);
    }
  }
}

let totalNodes = 0, totalEdges = 0;
partDefs.forEach((partFiles, i) => {
  const partSet = new Set(partFiles);
  const pn = nodes.filter(n => partSet.has(n.filePath));
  const pnIds = new Set(pn.map(n => n.id));
  const pe = [];
  for (const f of partFiles) {
    for (const e of edgesBySourceFile.get(f) || []) pe.push(e);
  }
  // validate
  for (const e of pe) {
    if (e.source === e.target) throw new Error('self edge ' + e.source);
    if (!allIds.has(e.source)) throw new Error('bad source ' + e.source);
    const targetOk = allIds.has(e.target) || importTargets.has(e.target.replace(/^file:/, '')) ||
      neighborTargets.has(e.target) || (prompt.batchImportData[e.source.slice(5)] || []).includes(e.target.slice(5));
    if (!targetOk) throw new Error('bad target ' + e.target + ' from ' + e.source);
  }
  const out = { nodes: pn, edges: pe };
  fs.writeFileSync(`.ua/intermediate/batch-22-part-${i + 1}.json`, JSON.stringify(out, null, 2) + '\n');
  console.log(`part ${i + 1}: files=${partFiles.length} nodes=${pn.length} edges=${pe.length}`);
  totalNodes += pn.length; totalEdges += pe.length;
});

console.log(`TOTAL nodes=${totalNodes} edges=${totalEdges} imports=${importCount} batchImportSum=${Object.values(prompt.batchImportData).reduce((a, b) => a + b.length, 0)}`);
console.log('filesCovered=' + new Set(nodes.filter(n => n.type === 'file').map(n => n.filePath)).size);
