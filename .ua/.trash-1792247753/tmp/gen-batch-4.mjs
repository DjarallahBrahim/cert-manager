import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/Users/samtyga/Desktop/work/cert-manager';
const dispatch = JSON.parse(fs.readFileSync(path.join(ROOT, '.ua/tmp/prompts/batch-4.json'), 'utf8'));
const extract = JSON.parse(fs.readFileSync(path.join(ROOT, '.ua/tmp/ua-file-extract-results-4.json'), 'utf8'));

const F = {
  'pkg/controller/certificates/revisionmanager/revisionmanager_controller.go': {
    s: 'Implements the certificates-revision-manager controller, which garbage-collects old CertificateRequest revisions once newer revisions have been issued for a Certificate.',
    t: ['controller', 'garbage-collection', 'certificate', 'revision', 'kubernetes'],
    c: 'moderate',
  },
  'pkg/controller/certificates/trigger/trigger_controller.go': {
    s: 'Implements the certificates-trigger controller, which compares Certificates and their Secrets against issuance policies and sets the Issuing condition when re-issuance is required.',
    t: ['controller', 'certificate-lifecycle', 'reissuance', 'policies', 'kubernetes'],
    c: 'complex',
  },
  'pkg/controller/certificatesigningrequests/ca/ca.go': {
    s: 'CA-backed signer for the CertificateSigningRequest controller that signs approved CSRs with the CA key pair referenced by a CA Issuer.',
    t: ['csr', 'signer', 'ca', 'certificate', 'issuance'],
    c: 'moderate',
  },
  'pkg/controller/certificatesigningrequests/checks.go': {
    s: 'Shared event-handler helpers that enqueue CertificateSigningRequests when the generic Issuers they reference change.',
    t: ['event-handler', 'csr', 'informer', 'controller', 'queue'],
    c: 'moderate',
  },
  'pkg/controller/certificatesigningrequests/controller.go': {
    s: 'Defines the shared CertificateSigningRequest controller base that validates, authorizes and dispatches CSRs to pluggable Signer implementations.',
    t: ['controller', 'csr', 'orchestration', 'signer', 'kubernetes'],
    c: 'moderate',
  },
  'pkg/controller/certificatesigningrequests/fake/fake.go': {
    s: 'Test fake implementation of the CSR Signer interface that delegates signing to an injectable function.',
    t: ['test', 'fake', 'signer', 'csr', 'mock'],
    c: 'simple',
  },
  'pkg/controller/certificatesigningrequests/selfsigned/checks.go': {
    s: 'Event handlers that map Secret changes back to the CertificateSigningRequests whose self-signed issuer references them.',
    t: ['event-handler', 'secret', 'csr', 'selfsigned', 'informer'],
    c: 'moderate',
  },
  'pkg/controller/certificatesigningrequests/selfsigned/selfsigned.go': {
    s: 'Self-signed CSR signer that issues certificates generated from the request\u2019s own public key, backing the SelfSigned issuer type.',
    t: ['signer', 'selfsigned', 'csr', 'certificate', 'issuance'],
    c: 'moderate',
  },
  'pkg/controller/certificatesigningrequests/sync.go': {
    s: 'Core sync loop for CertificateSigningRequests: validates the signer reference, approval state and RBAC before delegating signing to the configured signer.',
    t: ['sync', 'csr', 'authorization', 'validation', 'controller'],
    c: 'moderate',
  },
  'pkg/controller/certificatesigningrequests/util/apply.go': {
    s: 'Shared helper for server-side applying CertificateSigningRequest status updates with a consistent field manager.',
    t: ['utility', 'status-update', 'server-side-apply', 'csr'],
    c: 'moderate',
  },
  'pkg/controller/certificatesigningrequests/util/conditions.go': {
    s: 'Helpers for reading and setting CertificateSigningRequest condition types such as Approved, Denied and Failed.',
    t: ['utility', 'conditions', 'csr', 'status'],
    c: 'moderate',
  },
  'pkg/controller/certificatesigningrequests/util/signername.go': {
    s: 'Parses Kubernetes signerName strings into Issuer references and maps issuer type segments back to issuer kinds.',
    t: ['utility', 'signer-name', 'parsing', 'issuer', 'csr'],
    c: 'moderate',
  },
  'pkg/controller/certificatesigningrequests/vault/vault.go': {
    s: 'Vault-backed CSR signer that authenticates to Vault with the issuer\u2019s configured auth method and signs approved CertificateSigningRequests.',
    t: ['signer', 'vault', 'csr', 'issuance', 'security'],
    c: 'moderate',
  },
  'pkg/controller/certificatesigningrequests/venafi/venafi.go': {
    s: 'Venafi-backed CSR signer that requests certificates from Venafi TPP or Cloud and writes the result into the CSR status.',
    t: ['signer', 'venafi', 'csr', 'issuance', 'external-ca'],
    c: 'moderate',
  },
  'pkg/controller/clusterissuers/checks.go': {
    s: 'Event-handler predicate that maps Secret changes to the ClusterIssuers referencing them.',
    t: ['event-handler', 'clusterissuer', 'secret', 'informer'],
    c: 'moderate',
  },
  'pkg/controller/clusterissuers/controller.go': {
    s: 'Controller that reconciles ClusterIssuer resources by watching Secrets and enqueuing the affected cluster-scoped issuers.',
    t: ['controller', 'clusterissuer', 'reconciliation', 'kubernetes'],
    c: 'moderate',
  },
  'pkg/controller/clusterissuers/sync.go': {
    s: 'Sync logic that verifies ClusterIssuer configuration, runs issuer-specific setup and updates its status conditions.',
    t: ['sync', 'clusterissuer', 'status', 'validation'],
    c: 'moderate',
  },
  'pkg/controller/context.go': {
    s: 'Defines the shared controller Context and its options, plus the factory that builds Kubernetes clients, informers, metrics and ACME registries for every controller.',
    t: ['context', 'dependency-injection', 'kubernetes', 'clients', 'factory'],
    c: 'complex',
    n: 'Groups typed option structs and builds a per-component Context so each controller can select its own listers while sharing clients.',
  },
  'pkg/controller/controller.go': {
    s: 'Generic queueing controller providing the shared Run/worker loop, metrics and duration hooks used by cert-manager controllers.',
    t: ['controller', 'workqueue', 'concurrency', 'framework', 'kubernetes'],
    c: 'moderate',
  },
  'pkg/controller/globals/timeout.go': {
    s: 'Package-level constant defining the default per-sync context timeout applied to issuer controllers.',
    t: ['constants', 'timeout', 'configuration'],
    c: 'simple',
  },
  'pkg/controller/helper.go': {
    s: 'Helpers that resolve the resource namespace and ambient credential settings for Issuer and ClusterIssuer objects.',
    t: ['utility', 'issuer', 'namespace', 'credentials'],
    c: 'moderate',
  },
  'pkg/controller/issuers/checks.go': {
    s: 'Event-handler predicate that maps Secret changes to the namespaced Issuers referencing them.',
    t: ['event-handler', 'issuer', 'secret', 'informer'],
    c: 'moderate',
  },
  'pkg/controller/issuers/controller.go': {
    s: 'Controller that reconciles namespaced Issuer resources by watching Secrets and enqueuing the affected issuers.',
    t: ['controller', 'issuer', 'reconciliation', 'kubernetes'],
    c: 'moderate',
  },
  'pkg/controller/issuers/sync.go': {
    s: 'Sync logic that verifies Issuer configuration, runs issuer-specific setup and updates its status conditions.',
    t: ['sync', 'issuer', 'status', 'validation'],
    c: 'moderate',
  },
  'pkg/controller/register.go': {
    s: 'Controller registry that lets controllers register constructors by name and the runner instantiate them from a ContextFactory.',
    t: ['registry', 'controller', 'framework', 'entry-point'],
    c: 'simple',
  },
  'pkg/controller/test/context_builder.go': {
    s: 'Configurable fake controller Context builder used by unit tests to simulate Kubernetes clients, informers, actions and events.',
    t: ['test', 'fake', 'builder', 'context', 'kubernetes'],
    c: 'complex',
    n: 'Uses client-go fake clientsets and reactors to record expected actions and events for controller unit tests.',
  },
  'pkg/controller/util.go': {
    s: 'Shared controller utilities including workqueue rate limiters, owner-reference event handlers and Secret annotation copying.',
    t: ['utility', 'workqueue', 'event-handler', 'rate-limiter', 'kubernetes'],
    c: 'complex',
  },
  'pkg/issuer/acme/acme.go': {
    s: 'ACME issuer implementation that wires account registration, secret-backed account keys and the HTTP-01 solver into the issuer interface.',
    t: ['issuer', 'acme', 'certificate', 'factory'],
    c: 'moderate',
  },
  'pkg/issuer/acme/http/http.go': {
    s: 'HTTP-01 challenge solver that creates and cleans up solver pods, services and Ingress/HTTPRoute resources and verifies challenge reachability.',
    t: ['acme', 'http01', 'solver', 'kubernetes', 'networking'],
    c: 'complex',
  },
  'pkg/issuer/acme/http/solver/constants.go': {
    s: 'Constants defining the well-known HTTP path used for ACME HTTP-01 challenge responses.',
    t: ['constants', 'acme', 'http01', 'solver'],
    c: 'simple',
  },
  'pkg/issuer/acme/http/solver/solver.go': {
    s: 'Minimal in-cluster HTTP server that serves ACME HTTP-01 challenge tokens for a single domain and key pair.',
    t: ['acme', 'http01', 'solver', 'http-server'],
    c: 'moderate',
  },
  'pkg/issuer/ca/ca.go': {
    s: 'CA issuer implementation that signs certificate requests with a CA key pair stored in a Kubernetes Secret.',
    t: ['issuer', 'ca', 'certificate', 'signing'],
    c: 'simple',
  },
  'pkg/issuer/ca/setup.go': {
    s: 'Setup routine that validates the CA issuer\u2019s signing key pair and marks the Issuer ready or failed.',
    t: ['issuer', 'ca', 'validation', 'status'],
    c: 'moderate',
  },
};

const fc = (p) => 'file:' + p;
const fn = (p, n) => `function:${p}:${n}`;
const cl = (p, n) => `class:${p}:${n}`;

const syms = [
  // 1 revisionmanager
  { p: 'pkg/controller/certificates/revisionmanager/revisionmanager_controller.go', k: 'function', n: 'NewController', l: [60, 97], x: true, c: 'simple',
    s: 'Builds the revision-manager workqueue and informers and wires event handlers that enqueue affected Certificates.', t: ['controller-setup', 'informer', 'workqueue', 'certificate'] },
  { p: 'pkg/controller/certificates/revisionmanager/revisionmanager_controller.go', k: 'function', n: 'ProcessItem', l: [102, 160], x: true, c: 'moderate',
    s: 'Reconciles a Certificate by listing its CertificateRequests and deleting obsolete revisions that are no longer needed.', t: ['reconcile', 'garbage-collection', 'certificaterequest'] },
  { p: 'pkg/controller/certificates/revisionmanager/revisionmanager_controller.go', k: 'function', n: 'certificateRequestsToDelete', l: [166, 202], x: false, c: 'simple',
    s: 'Selects which CertificateRequests of a Certificate may be deleted while preserving the current and newest revisions.', t: ['garbage-collection', 'selection', 'revision'] },
  { p: 'pkg/controller/certificates/revisionmanager/revisionmanager_controller.go', k: 'function', n: 'Register', l: [210, 218], x: true, c: 'simple',
    s: 'Registers the revision-manager controller constructor with the controller registry.', t: ['registration', 'controller', 'entry-point'] },

  // 2 trigger
  { p: 'pkg/controller/certificates/trigger/trigger_controller.go', k: 'function', n: 'NewController', l: [86, 148], x: true, c: 'moderate',
    s: 'Creates the trigger controller, wiring certificate, request and secret informers plus the scheduled work queue.', t: ['controller-setup', 'informer', 'workqueue', 'certificate'] },
  { p: 'pkg/controller/certificates/trigger/trigger_controller.go', k: 'function', n: 'ProcessItem', l: [150, 235], x: true, c: 'moderate',
    s: 'Evaluates a Certificate against the re-issuance policies, marks it Issuing with a reason or applies its current status.', t: ['reconcile', 'reissuance', 'policy-evaluation', 'certificate'] },
  { p: 'pkg/controller/certificates/trigger/trigger_controller.go', k: 'function', n: 'updateOrApplyStatus', l: [240, 254], x: false, c: 'simple',
    s: 'Applies a Certificate status update, falling back to a regular Update when server-side apply is unavailable.', t: ['status-update', 'server-side-apply', 'certificate'] },
  { p: 'pkg/controller/certificates/trigger/trigger_controller.go', k: 'function', n: 'shouldBackoffReissuingOnFailure', l: [268, 333], x: false, c: 'moderate',
    s: 'Computes an exponential backoff delay for repeated issuance failures, capped at the maximum delay.', t: ['backoff', 'reissuance', 'failure-handling'] },
  { p: 'pkg/controller/certificates/trigger/trigger_controller.go', k: 'function', n: 'scheduleRecheckOfCertificateIfRequired', l: [340, 354], x: false, c: 'simple',
    s: 'Schedules the Certificate for a later recheck based on the time remaining until its renewal point.', t: ['scheduling', 'renewal', 'certificate'] },
  { p: 'pkg/controller/certificates/trigger/trigger_controller.go', k: 'function', n: 'Register', l: [362, 373], x: true, c: 'simple',
    s: 'Registers the trigger controller constructor with the controller registry.', t: ['registration', 'controller', 'entry-point'] },
  { p: 'pkg/controller/certificates/trigger/trigger_controller.go', k: 'class', n: 'controller', l: [67, 84], x: false, c: 'simple',
    s: 'Trigger controller state holding listers, clients, the scheduler and injectable policy hooks.', t: ['controller', 'state', 'certificate', 'policy'] },

  // 3 csr ca
  { p: 'pkg/controller/certificatesigningrequests/ca/ca.go', k: 'class', n: 'CA', l: [53, 67], x: true, c: 'simple',
    s: 'CA signer state storing issuer options, secret lister, cert-manager client and the signing function.', t: ['signer', 'ca', 'state', 'csr'] },
  { p: 'pkg/controller/certificatesigningrequests/ca/ca.go', k: 'function', n: 'NewCA', l: [78, 88], x: true, c: 'simple',
    s: 'Constructs a CA signer from the controller context and its secret lister.', t: ['factory', 'signer', 'ca', 'csr'] },
  { p: 'pkg/controller/certificatesigningrequests/ca/ca.go', k: 'function', n: 'Sign', l: [94, 155], x: true, c: 'moderate',
    s: 'Loads the CA key pair, signs the CSR with the configured duration and usages, and writes the certificate chain into the CSR status.', t: ['signing', 'ca', 'csr', 'certificate'] },

  // 4 csr checks
  { p: 'pkg/controller/certificatesigningrequests/checks.go', k: 'function', n: 'handleGenericIssuer', l: [32, 53], x: false, c: 'simple',
    s: 'Converts a generic issuer object into workqueue items for the CertificateSigningRequests that reference it.', t: ['event-handler', 'queue', 'issuer', 'csr'] },
  { p: 'pkg/controller/certificatesigningrequests/checks.go', k: 'function', n: 'certificateSigningRequestsForGenericIssuer', l: [55, 81], x: false, c: 'simple',
    s: 'Lists CertificateSigningRequests whose signerName points at the supplied generic issuer.', t: ['lookup', 'signer-name', 'csr', 'issuer'] },

  // 5 csr controller
  { p: 'pkg/controller/certificatesigningrequests/controller.go', k: 'class', n: 'Signer', l: [43, 45], x: true, c: 'simple',
    s: 'Interface implemented by signer backends that sign a CertificateSigningRequest for a generic issuer.', t: ['interface', 'signer', 'csr', 'extension-point'] },
  { p: 'pkg/controller/certificatesigningrequests/controller.go', k: 'class', n: 'Controller', l: [63, 95], x: true, c: 'simple',
    s: 'Shared CSR controller holding the issuer helper, CSR client and lister, authorization client and signer wiring.', t: ['controller', 'csr', 'state', 'orchestration'] },
  { p: 'pkg/controller/certificatesigningrequests/controller.go', k: 'function', n: 'New', l: [107, 113], x: true, c: 'simple',
    s: 'Creates a CSR Controller for a signer type using the supplied signer constructor.', t: ['factory', 'controller', 'csr', 'signer'] },
  { p: 'pkg/controller/certificatesigningrequests/controller.go', k: 'function', n: 'Register', l: [115, 193], x: true, c: 'moderate',
    s: 'Sets up CSR informers, event handlers, extra informers and the authorization client, then registers the controller with the run loop.', t: ['controller-setup', 'informer', 'registration', 'csr'] },
  { p: 'pkg/controller/certificatesigningrequests/controller.go', k: 'function', n: 'ProcessItem', l: [195, 211], x: true, c: 'simple',
    s: 'Fetches a CSR from the lister and runs Sync, reporting returned errors back to the workqueue.', t: ['reconcile', 'sync', 'csr', 'workqueue'] },

  // 6 fake
  { p: 'pkg/controller/certificatesigningrequests/fake/fake.go', k: 'class', n: 'Signer', l: [27, 29], x: true, c: 'simple',
    s: 'Fake signer whose FakeSign function field supplies the behaviour under test.', t: ['test', 'fake', 'signer', 'csr'] },
  { p: 'pkg/controller/certificatesigningrequests/fake/fake.go', k: 'function', n: 'Sign', l: [31, 33], x: true, c: 'simple',
    s: 'Delegates signing to the injected FakeSign function.', t: ['test', 'mock', 'signer', 'delegation'] },

  // 7 selfsigned checks
  { p: 'pkg/controller/certificatesigningrequests/selfsigned/checks.go', k: 'function', n: 'handleSecretReferenceWorkFunc', l: [44, 70], x: false, c: 'simple',
    s: 'Builds an event handler that maps Secret references to queued CertificateSigningRequests.', t: ['event-handler', 'queue', 'secret', 'csr'] },
  { p: 'pkg/controller/certificatesigningrequests/selfsigned/checks.go', k: 'function', n: 'certificateSigningRequestsForSecret', l: [77, 142], x: false, c: 'moderate',
    s: 'Finds CSRs that reference the given Secret through their self-signed issuer configuration.', t: ['lookup', 'secret', 'selfsigned', 'csr'] },

  // 8 selfsigned
  { p: 'pkg/controller/certificatesigningrequests/selfsigned/selfsigned.go', k: 'class', n: 'SelfSigned', l: [59, 72], x: true, c: 'simple',
    s: 'Self-signed signer state storing issuer options, secret lister and signing dependencies.', t: ['signer', 'selfsigned', 'state', 'csr'] },
  { p: 'pkg/controller/certificatesigningrequests/selfsigned/selfsigned.go', k: 'function', n: 'init', l: [74, 104], x: false, c: 'simple',
    s: 'Registers the self-signed signer with the CertificateSigningRequest controller during package initialisation.', t: ['registration', 'initialisation', 'signer', 'selfsigned'] },
  { p: 'pkg/controller/certificatesigningrequests/selfsigned/selfsigned.go', k: 'function', n: 'NewSelfSigned', l: [107, 116], x: true, c: 'simple',
    s: 'Constructs the self-signed signer from the controller context.', t: ['factory', 'signer', 'selfsigned', 'csr'] },
  { p: 'pkg/controller/certificatesigningrequests/selfsigned/selfsigned.go', k: 'function', n: 'Sign', l: [126, 224], x: true, c: 'moderate',
    s: 'Generates a self-signed certificate for the CSR\u2019s public key, validates the duration and writes the result into the CSR status.', t: ['signing', 'selfsigned', 'csr', 'certificate'] },

  // 9 csr sync
  { p: 'pkg/controller/certificatesigningrequests/sync.go', k: 'function', n: 'Sync', l: [39, 164], x: true, c: 'moderate',
    s: 'Validates the signer reference, approval state and RBAC, then invokes the configured signer and records failures on the CSR.', t: ['sync', 'validation', 'authorization', 'csr'] },
  { p: 'pkg/controller/certificatesigningrequests/sync.go', k: 'function', n: 'userCanReferenceSigner', l: [174, 208], x: false, c: 'simple',
    s: 'Uses a SubjectAccessReview to check whether the requesting user may reference the issuer encoded in the signerName.', t: ['authorization', 'subject-access-review', 'signer-name', 'security'] },

  // 10 apply
  { p: 'pkg/controller/certificatesigningrequests/util/apply.go', k: 'function', n: 'UpdateOrApplyStatus', l: [36, 64], x: true, c: 'simple',
    s: 'Server-side applies a CSR status condition update, falling back to Update when apply is disabled.', t: ['status-update', 'server-side-apply', 'csr', 'utility'] },

  // 11 conditions
  { p: 'pkg/controller/certificatesigningrequests/util/conditions.go', k: 'function', n: 'CertificateSigningRequestIsApproved', l: [32, 39], x: true, c: 'simple',
    s: 'Reports whether the CSR carries the Approved condition.', t: ['conditions', 'approval', 'csr', 'predicate'] },
  { p: 'pkg/controller/certificatesigningrequests/util/conditions.go', k: 'function', n: 'CertificateSigningRequestIsDenied', l: [41, 48], x: true, c: 'simple',
    s: 'Reports whether the CSR carries the Denied condition.', t: ['conditions', 'denial', 'csr', 'predicate'] },
  { p: 'pkg/controller/certificatesigningrequests/util/conditions.go', k: 'function', n: 'CertificateSigningRequestIsFailed', l: [50, 57], x: true, c: 'simple',
    s: 'Reports whether the CSR carries the Failed condition.', t: ['conditions', 'failure', 'csr', 'predicate'] },
  { p: 'pkg/controller/certificatesigningrequests/util/conditions.go', k: 'function', n: 'CertificateSigningRequestSetFailed', l: [59, 77], x: true, c: 'simple',
    s: 'Sets the Failed condition on a CSR with the supplied reason and message.', t: ['conditions', 'failure', 'status-update', 'csr'] },

  // 12 signername
  { p: 'pkg/controller/certificatesigningrequests/util/signername.go', k: 'class', n: 'SignerIssuerRef', l: [25, 28], x: true, c: 'simple',
    s: 'Parsed representation of a signerName split into namespace, name, type and group.', t: ['data-model', 'signer-name', 'issuer', 'csr'] },
  { p: 'pkg/controller/certificatesigningrequests/util/signername.go', k: 'function', n: 'SignerIssuerRefFromSignerName', l: [32, 71], x: true, c: 'moderate',
    s: 'Parses a signerName of the form <group>/<type>/<namespace>/<name> into a SignerIssuerRef, validating each segment.', t: ['parsing', 'signer-name', 'validation', 'issuer'] },
  { p: 'pkg/controller/certificatesigningrequests/util/signername.go', k: 'function', n: 'IssuerKindFromType', l: [75, 86], x: true, c: 'simple',
    s: 'Maps a signer type segment (issuer or clusterissuer) to the corresponding cert-manager kind.', t: ['mapping', 'signer-name', 'issuer', 'utility'] },

  // 13 vault
  { p: 'pkg/controller/certificatesigningrequests/vault/vault.go', k: 'class', n: 'Vault', l: [47, 59], x: true, c: 'simple',
    s: 'Vault signer state holding issuer options, the Kubernetes client, secret lister and Vault client builder.', t: ['signer', 'vault', 'state', 'csr'] },
  { p: 'pkg/controller/certificatesigningrequests/vault/vault.go', k: 'function', n: 'NewVault', l: [69, 79], x: true, c: 'simple',
    s: 'Constructs the Vault signer from the controller context.', t: ['factory', 'signer', 'vault', 'csr'] },
  { p: 'pkg/controller/certificatesigningrequests/vault/vault.go', k: 'function', n: 'Sign', l: [85, 142], x: true, c: 'moderate',
    s: 'Authenticates to Vault using the issuer\u2019s configured auth method and signs the CSR through the Vault PKI backend.', t: ['signing', 'vault', 'authentication', 'csr'] },

  // 14 venafi
  { p: 'pkg/controller/certificatesigningrequests/venafi/venafi.go', k: 'class', n: 'Venafi', l: [53, 68], x: true, c: 'simple',
    s: 'Venafi signer state storing issuer options, secret lister, client builder, metrics and user agent.', t: ['signer', 'venafi', 'state', 'csr'] },
  { p: 'pkg/controller/certificatesigningrequests/venafi/venafi.go', k: 'function', n: 'NewVenafi', l: [78, 89], x: true, c: 'simple',
    s: 'Constructs the Venafi signer from the controller context.', t: ['factory', 'signer', 'venafi', 'csr'] },
  { p: 'pkg/controller/certificatesigningrequests/venafi/venafi.go', k: 'function', n: 'Sign', l: [99, 224], x: true, c: 'complex',
    s: 'Requests a certificate from Venafi for the CSR, waits for completion and writes the issued certificate into the CSR status.', t: ['signing', 'venafi', 'external-ca', 'csr'] },

  // 15 clusterissuers checks
  { p: 'pkg/controller/clusterissuers/checks.go', k: 'function', n: 'issuersForSecret', l: [28, 105], x: false, c: 'moderate',
    s: 'Returns the ClusterIssuers whose configuration references the changed Secret.', t: ['lookup', 'clusterissuer', 'secret', 'event-handler'] },

  // 16 clusterissuers controller
  { p: 'pkg/controller/clusterissuers/controller.go', k: 'class', n: 'controller', l: [38, 65], x: false, c: 'simple',
    s: 'ClusterIssuer controller state holding listers, queue, client, factory and namespace configuration.', t: ['controller', 'clusterissuer', 'state', 'kubernetes'] },
  { p: 'pkg/controller/clusterissuers/controller.go', k: 'function', n: 'Register', l: [70, 112], x: true, c: 'moderate',
    s: 'Sets up ClusterIssuer and Secret informers and event handlers and registers the controller with the run loop.', t: ['controller-setup', 'informer', 'registration', 'clusterissuer'] },
  { p: 'pkg/controller/clusterissuers/controller.go', k: 'function', n: 'secretEvent', l: [115, 136], x: false, c: 'simple',
    s: 'Maps a Secret event to the ClusterIssuers that reference it and enqueues them.', t: ['event-handler', 'secret', 'clusterissuer', 'queue'] },
  { p: 'pkg/controller/clusterissuers/controller.go', k: 'function', n: 'ProcessItem', l: [138, 154], x: true, c: 'simple',
    s: 'Fetches a ClusterIssuer from the lister and runs Sync on it.', t: ['reconcile', 'sync', 'clusterissuer'] },

  // 17 clusterissuers sync
  { p: 'pkg/controller/clusterissuers/sync.go', k: 'function', n: 'Sync', l: [41, 68], x: true, c: 'simple',
    s: 'Runs issuer setup for a ClusterIssuer and updates its status conditions, adding backoff hints on failure.', t: ['sync', 'clusterissuer', 'setup', 'status'] },
  { p: 'pkg/controller/clusterissuers/sync.go', k: 'function', n: 'updateIssuerStatus', l: [70, 80], x: false, c: 'simple',
    s: 'Persists changed ClusterIssuer status when it differs from the stored object.', t: ['status-update', 'clusterissuer', 'persistence'] },

  // 18 context
  { p: 'pkg/controller/context.go', k: 'class', n: 'Context', l: [75, 130], x: true, c: 'moderate',
    s: 'Shared controller dependencies: clients, schemes, clock, metrics, recorder and informer factories.', t: ['context', 'dependency-injection', 'clients', 'informers'] },
  { p: 'pkg/controller/context.go', k: 'class', n: 'ContextOptions', l: [133, 158], x: true, c: 'simple',
    s: 'Options for creating a Context: API server connection, QPS/burst limits and namespace.', t: ['options', 'configuration', 'kubernetes', 'context'] },
  { p: 'pkg/controller/context.go', k: 'class', n: 'ConfigOptions', l: [160, 163], x: true, c: 'simple',
    s: 'Feature flags for optional API integrations, currently Gateway API support.', t: ['options', 'feature-flags', 'gateway-api'] },
  { p: 'pkg/controller/context.go', k: 'class', n: 'IssuerOptions', l: [165, 178], x: true, c: 'simple',
    s: 'Issuer-related settings: cluster resource namespace and ambient credential defaults.', t: ['options', 'issuer', 'namespace', 'credentials'] },
  { p: 'pkg/controller/context.go', k: 'class', n: 'ACMEOptions', l: [180, 214], x: true, c: 'simple',
    s: 'ACME solver settings including HTTP-01 resource limits, nameservers and DNS-01 retry behaviour.', t: ['options', 'acme', 'solver', 'configuration'] },
  { p: 'pkg/controller/context.go', k: 'class', n: 'IngressShimOptions', l: [219, 225], x: true, c: 'simple',
    s: 'Default issuer and annotation settings used by the ingress-shim controller.', t: ['options', 'ingress-shim', 'annotations', 'issuer'] },
  { p: 'pkg/controller/context.go', k: 'class', n: 'CertificateOptions', l: [227, 234], x: true, c: 'simple',
    s: 'Certificate controller settings controlling owner references and copied annotation prefixes.', t: ['options', 'certificate', 'annotations', 'configuration'] },
  { p: 'pkg/controller/context.go', k: 'class', n: 'SchedulerOptions', l: [236, 240], x: true, c: 'simple',
    s: 'Scheduler settings controlling the number of concurrent ACME challenges.', t: ['options', 'scheduler', 'concurrency', 'acme'] },
  { p: 'pkg/controller/context.go', k: 'class', n: 'ContextFactory', l: [244, 254], x: true, c: 'simple',
    s: 'Factory holding the base REST config and logger used to build per-component Contexts.', t: ['factory', 'context', 'dependency-injection', 'kubernetes'] },
  { p: 'pkg/controller/context.go', k: 'function', n: 'NewContextFactory', l: [260, 334], x: true, c: 'moderate',
    s: 'Creates a ContextFactory, normalising the REST config, settings defaults and initialising the clock and logger.', t: ['factory', 'configuration', 'kubernetes', 'context'] },
  { p: 'pkg/controller/context.go', k: 'function', n: 'Build', l: [338, 373], x: true, c: 'moderate',
    s: 'Builds a full Context for a component, creating clients, informer factories, metrics and the ACME account registry.', t: ['builder', 'dependency-injection', 'clients', 'context'] },
  { p: 'pkg/controller/context.go', k: 'function', n: 'buildClients', l: [386, 438], x: false, c: 'moderate',
    s: 'Creates the Kubernetes, cert-manager, Gateway API and metadata clients, optionally falling back when Gateway API is unavailable.', t: ['clients', 'kubernetes', 'gateway-api', 'factory'] },

  // 19 controller.go
  { p: 'pkg/controller/controller.go', k: 'class', n: 'queueingController', l: [43, 46], x: false, c: 'simple',
    s: 'Minimal interface for controllers that can register a workqueue and process queued items.', t: ['interface', 'controller', 'workqueue'] },
  { p: 'pkg/controller/controller.go', k: 'class', n: 'controller', l: [66, 90], x: false, c: 'simple',
    s: 'Generic controller state holding the name, sync handler, queue, metrics and run hooks.', t: ['controller', 'state', 'workqueue', 'framework'] },
  { p: 'pkg/controller/controller.go', k: 'function', n: 'NewController', l: [48, 64], x: true, c: 'simple',
    s: 'Creates a generic controller from a name, metrics, sync function, queue and duration hooks.', t: ['factory', 'controller', 'framework', 'workqueue'] },
  { p: 'pkg/controller/controller.go', k: 'function', n: 'Run', l: [93, 128], x: true, c: 'moderate',
    s: 'Runs the controller worker pool until the context is cancelled, executing startup hooks and waiting for clean shutdown.', t: ['concurrency', 'controller-loop', 'lifecycle', 'workqueue'] },
  { p: 'pkg/controller/controller.go', k: 'function', n: 'worker', l: [130, 169], x: false, c: 'moderate',
    s: 'Consumes queue items, invokes the sync handler with timeout and metrics and requeues failed items with rate limiting.', t: ['worker', 'workqueue', 'error-handling', 'metrics'] },

  // 21 helper
  { p: 'pkg/controller/helper.go', k: 'function', n: 'ResourceNamespace', l: [26, 32], x: true, c: 'simple',
    s: 'Returns the namespace in which an Issuer\u2019s referenced resources live, or the cluster resource namespace for ClusterIssuers.', t: ['namespace', 'issuer', 'clusterissuer', 'utility'] },
  { p: 'pkg/controller/helper.go', k: 'function', n: 'ResourceNamespaceRef', l: [39, 47], x: true, c: 'simple',
    s: 'Resolves the effective namespace for a secret reference, defaulting to the challenge namespace.', t: ['namespace', 'secret-reference', 'utility'] },
  { p: 'pkg/controller/helper.go', k: 'function', n: 'CanUseAmbientCredentials', l: [51, 59], x: true, c: 'simple',
    s: 'Reports whether an issuer may use ambient credentials, honouring per-issuer overrides and defaults.', t: ['credentials', 'issuer', 'configuration', 'predicate'] },
  { p: 'pkg/controller/helper.go', k: 'function', n: 'CanUseAmbientCredentialsFromRef', l: [66, 74], x: true, c: 'simple',
    s: 'Resolves ambient credential usage for a reference, applying the default when no override is set.', t: ['credentials', 'issuer-reference', 'configuration', 'predicate'] },

  // 22 issuers checks
  { p: 'pkg/controller/issuers/checks.go', k: 'function', n: 'issuersForSecret', l: [28, 107], x: false, c: 'moderate',
    s: 'Returns the namespaced Issuers whose configuration references the changed Secret.', t: ['lookup', 'issuer', 'secret', 'event-handler'] },

  // 23 issuers controller
  { p: 'pkg/controller/issuers/controller.go', k: 'class', n: 'controller', l: [38, 61], x: false, c: 'simple',
    s: 'Issuer controller state holding listers, queue, client, factory and recorder.', t: ['controller', 'issuer', 'state', 'kubernetes'] },
  { p: 'pkg/controller/issuers/controller.go', k: 'function', n: 'Register', l: [66, 107], x: true, c: 'moderate',
    s: 'Sets up Issuer and Secret informers and event handlers and registers the controller with the run loop.', t: ['controller-setup', 'informer', 'registration', 'issuer'] },
  { p: 'pkg/controller/issuers/controller.go', k: 'function', n: 'secretEvent', l: [110, 130], x: false, c: 'simple',
    s: 'Maps a Secret event to the namespaced Issuers that reference it and enqueues them.', t: ['event-handler', 'secret', 'issuer', 'queue'] },
  { p: 'pkg/controller/issuers/controller.go', k: 'function', n: 'ProcessItem', l: [132, 147], x: true, c: 'simple',
    s: 'Fetches an Issuer from the lister and runs Sync on it.', t: ['reconcile', 'sync', 'issuer'] },

  // 24 issuers sync
  { p: 'pkg/controller/issuers/sync.go', k: 'function', n: 'Sync', l: [41, 68], x: true, c: 'simple',
    s: 'Runs issuer setup for an Issuer and updates its status conditions, adding a backoff hint on failure.', t: ['sync', 'issuer', 'setup', 'status'] },
  { p: 'pkg/controller/issuers/sync.go', k: 'function', n: 'updateIssuerStatus', l: [70, 81], x: false, c: 'simple',
    s: 'Persists changed Issuer status when it differs from the stored object.', t: ['status-update', 'issuer', 'persistence'] },

  // 25 register
  { p: 'pkg/controller/register.go', k: 'class', n: 'Interface', l: [25, 32], x: true, c: 'simple',
    s: 'Interface for runnable controllers exposing a blocking Run method with a worker count.', t: ['interface', 'controller', 'lifecycle'] },
  { p: 'pkg/controller/register.go', k: 'function', n: 'Known', l: [43, 45], x: true, c: 'simple',
    s: 'Returns the map of controller constructors registered by name.', t: ['registry', 'lookup', 'controller'] },
  { p: 'pkg/controller/register.go', k: 'function', n: 'Register', l: [48, 50], x: true, c: 'simple',
    s: 'Registers a controller constructor under a name in the global registry.', t: ['registry', 'registration', 'controller'] },

  // 26 context_builder
  { p: 'pkg/controller/test/context_builder.go', k: 'class', n: 'Builder', l: [67, 93], x: true, c: 'moderate',
    s: 'Fluent test builder holding fake objects, expected actions and events, clock and cleanup hooks.', t: ['test', 'builder', 'fake', 'context'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'generateNameReactor', l: [95, 103], x: false, c: 'simple',
    s: 'Reactor that emulates API server generateName behaviour for create actions.', t: ['test', 'reactor', 'fake', 'kubernetes'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'Init', l: [114, 178], x: true, c: 'moderate',
    s: 'Initialises the fake context with fake clients, informers, reactors and a running informer factory.', t: ['test', 'initialisation', 'fake', 'context'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'InitWithRESTConfig', l: [182, 185], x: true, c: 'simple',
    s: 'Initialises the builder with an explicit REST config.', t: ['test', 'initialisation', 'configuration'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'FakeKubeClient', l: [187, 189], x: true, c: 'simple',
    s: 'Returns the fake Kubernetes clientset created for the test context.', t: ['test', 'accessor', 'fake-client'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'FakeKubeInformerFactory', l: [191, 193], x: true, c: 'simple',
    s: 'Returns the fake Kubernetes informer factory created for the test context.', t: ['test', 'accessor', 'informer'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'FakeCMClient', l: [195, 197], x: true, c: 'simple',
    s: 'Returns the fake cert-manager clientset created for the test context.', t: ['test', 'accessor', 'fake-client'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'FakeGWClient', l: [199, 201], x: true, c: 'simple',
    s: 'Returns the fake Gateway API clientset created for the test context.', t: ['test', 'accessor', 'fake-client'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'FakeCMInformerFactory', l: [203, 205], x: true, c: 'simple',
    s: 'Returns the fake cert-manager informer factory created for the test context.', t: ['test', 'accessor', 'informer'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'FakeMetadataClient', l: [207, 209], x: true, c: 'simple',
    s: 'Returns the fake metadata client created for the test context.', t: ['test', 'accessor', 'fake-client'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'FakeDiscoveryClient', l: [211, 213], x: true, c: 'simple',
    s: 'Returns the fake discovery client created for the test context.', t: ['test', 'accessor', 'discovery'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'CheckAndFinish', l: [218, 233], x: true, c: 'simple',
    s: 'Verifies expected actions and events and stops the fake informers when the test completes.', t: ['test', 'assertion', 'lifecycle'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'AllEventsCalled', l: [235, 243], x: true, c: 'simple',
    s: 'Asserts that every expected event was emitted by the code under test.', t: ['test', 'assertion', 'events'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'AllActionsExecuted', l: [246, 295], x: true, c: 'moderate',
    s: 'Asserts that every expected client action was executed, reporting the remaining actions on failure.', t: ['test', 'assertion', 'actions'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'Stop', l: [303, 312], x: true, c: 'simple',
    s: 'Stops the fake informer factories created by the builder.', t: ['test', 'lifecycle', 'informer'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'Start', l: [314, 322], x: true, c: 'simple',
    s: 'Starts the fake informer factories created by the builder.', t: ['test', 'lifecycle', 'informer'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'Sync', l: [332, 349], x: true, c: 'simple',
    s: 'Waits for the fake informer caches to sync, failing the test on error or timeout.', t: ['test', 'informer-sync', 'synchronisation'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'Events', l: [351, 357], x: true, c: 'simple',
    s: 'Records expected events that the test asserts were emitted.', t: ['test', 'events', 'assertion'] },
  { p: 'pkg/controller/test/context_builder.go', k: 'function', n: 'mustAllSync', l: [359, 367], x: false, c: 'simple',
    s: 'Blocks until all informer sync functions report synced or the timeout elapses.', t: ['test', 'informer-sync', 'helper'] },

  // 27 util.go
  { p: 'pkg/controller/util.go', k: 'function', n: 'DefaultItemBasedRateLimiter', l: [39, 41], x: true, c: 'simple',
    s: 'Returns an exponential rate limiter with a 5 second base delay and 5 minute maximum.', t: ['rate-limiter', 'workqueue', 'configuration'] },
  { p: 'pkg/controller/util.go', k: 'function', n: 'DefaultCertificateRateLimiter', l: [45, 47], x: true, c: 'simple',
    s: 'Returns an exponential rate limiter tuned for Certificate controllers with a 1 second base delay.', t: ['rate-limiter', 'workqueue', 'certificate'] },
  { p: 'pkg/controller/util.go', k: 'function', n: 'DefaultACMERateLimiter', l: [51, 53], x: true, c: 'simple',
    s: 'Returns an exponential rate limiter tuned for ACME controllers with a 5 second base delay and 30 minute maximum.', t: ['rate-limiter', 'workqueue', 'acme'] },
  { p: 'pkg/controller/util.go', k: 'class', n: 'QueuingEventHandler', l: [114, 116], x: true, c: 'simple',
    s: 'Informer event handler that enqueues every added or updated object without filtering.', t: ['event-handler', 'queue', 'informer'] },
  { p: 'pkg/controller/util.go', k: 'class', n: 'BlockingEventHandler', l: [156, 158], x: true, c: 'simple',
    s: 'Informer event handler that runs a custom work function synchronously for each event.', t: ['event-handler', 'informer', 'callback'] },
  { p: 'pkg/controller/util.go', k: 'function', n: 'HandleOwnedResourceNamespacedFunc', l: [58, 110], x: true, c: 'moderate',
    s: 'Returns an event handler that enqueues the owners of an object by resolving its owner references.', t: ['event-handler', 'owner-reference', 'workqueue', 'generics'] },
  { p: 'pkg/controller/util.go', k: 'function', n: 'BuildAnnotationsToCopy', l: [191, 214], x: true, c: 'simple',
    s: 'Selects annotations whose keys match the configured prefixes so they can be copied onto generated resources.', t: ['annotations', 'filtering', 'utility'] },
  { p: 'pkg/controller/util.go', k: 'function', n: 'ToSecret', l: [216, 234], x: true, c: 'simple',
    s: 'Converts an unstructured or typed object into a core Secret for informer-based lookups.', t: ['conversion', 'secret', 'utility'] },

  // 28 acme
  { p: 'pkg/issuer/acme/acme.go', k: 'class', n: 'Acme', l: [38, 53], x: true, c: 'simple',
    s: 'ACME issuer state holding the secret client, recorder, account registry, client builder and resource namespace.', t: ['issuer', 'acme', 'state', 'certificate'] },
  { p: 'pkg/issuer/acme/acme.go', k: 'function', n: 'New', l: [56, 69], x: true, c: 'simple',
    s: 'Constructs the ACME issuer from the controller context and registers its account key getter.', t: ['factory', 'issuer', 'acme', 'context'] },

  // 29 http
  { p: 'pkg/issuer/acme/http/http.go', k: 'class', n: 'Solver', l: [64, 74], x: true, c: 'simple',
    s: 'HTTP-01 solver embedded in the controller context with listers for pods, services, ingresses and HTTPRoutes.', t: ['acme', 'http01', 'solver', 'state'] },
  { p: 'pkg/issuer/acme/http/http.go', k: 'function', n: 'NewSolver', l: [79, 89], x: true, c: 'simple',
    s: 'Creates the HTTP-01 solver with generic pod/service listers, Ingress and HTTPRoute listers and a reachability test.', t: ['factory', 'acme', 'http01', 'solver'] },
  { p: 'pkg/issuer/acme/http/http.go', k: 'function', n: 'Present', l: [112, 144], x: true, c: 'moderate',
    s: 'Creates the solver pod, service and Ingress or HTTPRoute that expose the challenge token for the domain.', t: ['acme', 'http01', 'provisioning', 'kubernetes'] },
  { p: 'pkg/issuer/acme/http/http.go', k: 'function', n: 'Check', l: [146, 187], x: true, c: 'moderate',
    s: 'Polls the challenge URL until the expected key is served and reports whether the challenge has propagated.', t: ['acme', 'http01', 'reachability', 'polling'] },
  { p: 'pkg/issuer/acme/http/http.go', k: 'function', n: 'CleanUp', l: [191, 197], x: true, c: 'simple',
    s: 'Removes the solver resources created for an HTTP-01 challenge.', t: ['acme', 'http01', 'cleanup', 'kubernetes'] },
  { p: 'pkg/issuer/acme/http/http.go', k: 'function', n: 'buildChallengeUrl', l: [199, 211], x: true, c: 'simple',
    s: 'Builds the HTTP-01 challenge URL for a domain and token using the well-known challenge path.', t: ['acme', 'http01', 'url', 'utility'] },
  { p: 'pkg/issuer/acme/http/http.go', k: 'function', n: 'testReachability', l: [215, 333], x: false, c: 'complex',
    s: 'Performs repeated HTTP GET requests against the challenge URL with a bounded body size and custom DNS resolvers.', t: ['acme', 'http01', 'http-client', 'reachability'] },

  // 31 solver
  { p: 'pkg/issuer/acme/http/solver/solver.go', k: 'class', n: 'HTTP01Solver', l: [41, 49], x: true, c: 'simple',
    s: 'HTTP-01 solver configuration holding listen port, domain, challenge token and key.', t: ['acme', 'http01', 'solver', 'configuration'] },
  { p: 'pkg/issuer/acme/http/solver/solver.go', k: 'function', n: 'Listen', l: [51, 66], x: true, c: 'simple',
    s: 'Starts an HTTP server on the solver port and routes challenge requests to the handler.', t: ['acme', 'http01', 'http-server', 'solver'] },
  { p: 'pkg/issuer/acme/http/solver/solver.go', k: 'function', n: 'challengeHandler', l: [68, 117], x: false, c: 'moderate',
    s: 'Serves the challenge token when the request host and path match the configured domain and well-known path.', t: ['acme', 'http01', 'http-handler', 'validation'] },
  { p: 'pkg/issuer/acme/http/solver/solver.go', k: 'function', n: 'parseHost', l: [119, 131], x: false, c: 'simple',
    s: 'Strips the port from a Host header value, handling bracketed IPv6 addresses.', t: ['parsing', 'http', 'utility', 'host'] },

  // 32 issuer ca
  { p: 'pkg/issuer/ca/ca.go', k: 'class', n: 'CA', l: [29, 32], x: true, c: 'simple',
    s: 'CA issuer state holding the Secret lister used to load the signing key pair.', t: ['issuer', 'ca', 'state', 'certificate'] },
  { p: 'pkg/issuer/ca/ca.go', k: 'function', n: 'NewCA', l: [34, 41], x: true, c: 'simple',
    s: 'Constructs the CA issuer from the controller context.', t: ['factory', 'issuer', 'ca', 'context'] },

  // 33 ca setup
  { p: 'pkg/issuer/ca/setup.go', k: 'function', n: 'Setup', l: [43, 81], x: true, c: 'moderate',
    s: 'Loads the CA certificate and key from the referenced Secret, verifies the certificate is a CA and updates issuer conditions.', t: ['issuer', 'ca', 'validation', 'status'] },
];

const calls = [
  ['pkg/controller/certificates/revisionmanager/revisionmanager_controller.go:ProcessItem', 'pkg/controller/certificates/revisionmanager/revisionmanager_controller.go:certificateRequestsToDelete'],
  ['pkg/controller/certificates/trigger/trigger_controller.go:ProcessItem', 'pkg/controller/certificates/trigger/trigger_controller.go:updateOrApplyStatus'],
  ['pkg/controller/certificates/trigger/trigger_controller.go:ProcessItem', 'pkg/controller/certificates/trigger/trigger_controller.go:shouldBackoffReissuingOnFailure'],
  ['pkg/controller/certificates/trigger/trigger_controller.go:ProcessItem', 'pkg/controller/certificates/trigger/trigger_controller.go:scheduleRecheckOfCertificateIfRequired'],
  ['pkg/controller/certificatesigningrequests/controller.go:ProcessItem', 'pkg/controller/certificatesigningrequests/sync.go:Sync'],
  ['pkg/controller/certificatesigningrequests/sync.go:Sync', 'pkg/controller/certificatesigningrequests/util/apply.go:UpdateOrApplyStatus'],
  ['pkg/controller/certificatesigningrequests/sync.go:Sync', 'pkg/controller/certificatesigningrequests/util/signername.go:SignerIssuerRefFromSignerName'],
  ['pkg/controller/certificatesigningrequests/sync.go:Sync', 'pkg/controller/certificatesigningrequests/util/conditions.go:CertificateSigningRequestIsApproved'],
  ['pkg/controller/certificatesigningrequests/sync.go:Sync', 'pkg/controller/certificatesigningrequests/util/conditions.go:CertificateSigningRequestSetFailed'],
  ['pkg/controller/certificatesigningrequests/ca/ca.go:Sign', 'pkg/controller/certificatesigningrequests/util/conditions.go:CertificateSigningRequestSetFailed'],
  ['pkg/controller/certificatesigningrequests/selfsigned/selfsigned.go:Sign', 'pkg/controller/certificatesigningrequests/util/conditions.go:CertificateSigningRequestSetFailed'],
  ['pkg/controller/certificatesigningrequests/vault/vault.go:Sign', 'pkg/controller/certificatesigningrequests/util/conditions.go:CertificateSigningRequestSetFailed'],
  ['pkg/controller/certificatesigningrequests/venafi/venafi.go:Sign', 'pkg/controller/certificatesigningrequests/util/conditions.go:CertificateSigningRequestSetFailed'],
  ['pkg/controller/certificatesigningrequests/selfsigned/checks.go:handleSecretReferenceWorkFunc', 'pkg/controller/certificatesigningrequests/selfsigned/checks.go:certificateSigningRequestsForSecret'],
  ['pkg/controller/clusterissuers/controller.go:ProcessItem', 'pkg/controller/clusterissuers/sync.go:Sync'],
  ['pkg/controller/issuers/controller.go:ProcessItem', 'pkg/controller/issuers/sync.go:Sync'],
  ['pkg/controller/context.go:NewContextFactory', 'pkg/controller/context.go:buildClients'],
  ['pkg/controller/context.go:Build', 'pkg/controller/context.go:buildClients'],
  ['pkg/controller/controller.go:Run', 'pkg/controller/controller.go:worker'],
  ['pkg/issuer/acme/http/http.go:Present', 'pkg/issuer/acme/http/http.go:buildChallengeUrl'],
  ['pkg/issuer/acme/http/http.go:Check', 'pkg/issuer/acme/http/http.go:testReachability'],
  ['pkg/issuer/acme/http/solver/solver.go:Listen', 'pkg/issuer/acme/http/solver/solver.go:challengeHandler'],
];

const nodes = [];
const edges = [];
const seen = new Set();

for (const f of dispatch.files) {
  const p = f.path;
  const meta = F[p];
  if (!meta) throw new Error('missing file meta ' + p);
  const id = fc(p);
  if (seen.has(id)) throw new Error('dup ' + id);
  seen.add(id);
  const node = { id, type: f.fileCategory === 'code' ? 'file' : f.fileCategory, name: path.basename(p), filePath: p, summary: meta.s, tags: meta.t, complexity: meta.c };
  if (meta.n) node.languageNotes = meta.n;
  nodes.push(node);
}

for (const s of syms) {
  if (!nodes.find((n) => n.filePath === s.p)) throw new Error('symbol for unknown file ' + s.p);
  const id = s.k === 'class' ? cl(s.p, s.n) : fn(s.p, s.n);
  if (seen.has(id)) throw new Error('dup ' + id);
  seen.add(id);
  nodes.push({ id, type: s.k, name: s.n, filePath: s.p, lineRange: s.l, summary: s.s, tags: s.t, complexity: s.c });
  edges.push({ source: fc(s.p), target: id, type: 'contains', direction: 'forward', weight: 1.0 });
  if (s.x) edges.push({ source: fc(s.p), target: id, type: 'exports', direction: 'forward', weight: 0.8 });
}

let importEdges = 0;
for (const f of dispatch.files) {
  const imports = dispatch.batchImportData[f.path] || [];
  for (const tgt of imports) {
    if (tgt === f.path) throw new Error('self import ' + tgt);
    edges.push({ source: fc(f.path), target: fc(tgt), type: 'imports', direction: 'forward', weight: 0.7 });
    importEdges++;
  }
}

for (const [from, to] of calls) {
  const fromFile = from.split(':')[0];
  const toFile = to.split(':')[0];
  if (!nodes.find((n) => n.id === fn(fromFile, from.split(':')[1]))) throw new Error('missing call source ' + from);
  if (!nodes.find((n) => n.id === fn(toFile, to.split(':')[1]))) throw new Error('missing call target ' + to);
  edges.push({ source: fn(fromFile, from.split(':')[1]), target: fn(toFile, to.split(':')[1]), type: 'calls', direction: 'forward', weight: 0.8 });
}

// Partition by source file, greedy, keeping each part within limits.
const byPath = new Map();
for (const n of nodes) {
  const p = n.filePath;
  if (!byPath.has(p)) byPath.set(p, { nodes: [], edges: [] });
  byPath.get(p).nodes.push(n);
}
for (const e of edges) {
  const p = e.source.startsWith('function:') || e.source.startsWith('class:')
    ? e.source.split(':')[1]
    : e.source.startsWith('file:') ? e.source.slice(5) : e.source.split(':')[1];
  if (!byPath.has(p)) throw new Error('edge source file not in batch: ' + e.source);
  byPath.get(p).edges.push(e);
}

const sorted = [...byPath.keys()].sort();
const parts = [];
let cur = { files: [], nodes: [], edges: [] };
for (const p of sorted) {
  const g = byPath.get(p);
  const wouldNodes = cur.nodes.length + g.nodes.length;
  const wouldEdges = cur.edges.length + g.edges.length;
  if (cur.files.length > 0 && (wouldNodes > 60 || wouldEdges > 120)) {
    parts.push(cur);
    cur = { files: [], nodes: [], edges: [] };
  }
  cur.files.push(p);
  cur.nodes.push(...g.nodes);
  cur.edges.push(...g.edges);
}
parts.push(cur);

fs.mkdirSync(path.join(ROOT, '.ua/intermediate'), { recursive: true });
parts.forEach((part, i) => {
  const out = path.join(ROOT, `.ua/intermediate/batch-4-part-${i + 1}.json`);
  fs.writeFileSync(out, JSON.stringify({ nodes: part.nodes, edges: part.edges }, null, 2) + '\n');
});

console.log(JSON.stringify({
  nodes: nodes.length,
  edges: edges.length,
  importEdgesExpected: Object.values(dispatch.batchImportData).reduce((a, b) => a + b.length, 0),
  importEdges,
  contains: edges.filter((e) => e.type === 'contains').length,
  exports: edges.filter((e) => e.type === 'exports').length,
  calls: edges.filter((e) => e.type === 'calls').length,
  parts: parts.map((p) => ({ files: p.files.length, nodes: p.nodes.length, edges: p.edges.length })),
}, null, 2));
