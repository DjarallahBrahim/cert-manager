import fs from 'fs';

const UA = '/Users/samtyga/Desktop/work/cert-manager/.ua';
const input = JSON.parse(fs.readFileSync(`${UA}/tmp/ua-file-analyzer-input-6.json`, 'utf8'));

const nodes = [];
const file = (path, summary, tags, complexity, extra = {}) =>
  nodes.push({ id: `file:${path}`, type: 'file', name: path.split('/').pop(), filePath: path, summary, tags, complexity, ...extra });

const fn = (path, name, range, summary, tags, complexity, exported = true) =>
  nodes.push({ id: `function:${path}:${name}`, type: 'function', name, filePath: path, lineRange: range, summary, tags, complexity, __exported: exported });

const cl = (path, name, range, summary, tags, complexity, exported = true) =>
  nodes.push({ id: `class:${path}:${name}`, type: 'class', name, filePath: path, lineRange: range, summary, tags, complexity, __exported: exported });

/* ------------------------------- file nodes ------------------------------- */
file('internal/apis/acme/v1/conversion.go', 'Declares explicit conversion entry points between the internal ACMEIssuer type and its public v1 representation, working around conversion-gen limitations when types cross API groups.', ['api-types', 'conversion', 'internal-api', 'codegen'], 'simple');
file('internal/apis/acme/v1/defaults.go', 'Registers and applies defaults for ACME Challenge and Order objects, filling in issuerRef kind "Issuer" and group "cert-manager.io" when unset.', ['api-types', 'defaulting', 'validation', 'internal-api'], 'moderate');
file('internal/apis/acme/v1/register.go', 'Registers the internal acme/v1 group version with the runtime scheme and exposes a Resource helper that builds GroupResource identifiers.', ['api-types', 'registration', 'scheme', 'internal-api'], 'simple');
file('internal/cmd/util/exit.go', 'Records process exit codes in a package-level channel, mapping nil/canceled contexts to success, deadlines to 124, and other errors to 1.', ['utility', 'exit-code', 'error-handling', 'cli'], 'simple');
file('internal/cmd/util/signal.go', 'Installs a process-wide shutdown handler that cancels a context on the first SIGINT/SIGTERM and force-exits with code 130 on the second, exposing an exit function that honours recorded exit codes.', ['utility', 'signal-handling', 'graceful-shutdown', 'cli'], 'moderate');
file('internal/cmd/util/signal_posix.go', 'Build-tag-gated declaration that lists SIGINT and SIGTERM as the shutdown signals on non-Windows platforms.', ['utility', 'signal-handling', 'platform-specific', 'build-tags'], 'simple');
file('internal/cmd/util/signal_windows.go', 'Windows build variant of the shutdown signal list, limited to os.Interrupt.', ['utility', 'signal-handling', 'platform-specific', 'windows'], 'simple');
file('internal/collectors/acme_collector.go', 'Prometheus collector that reads ACME Challenges from an informer lister and exports their state as cert-manager challenge status metrics.', ['metrics', 'prometheus', 'collector', 'acme'], 'moderate');
file('internal/controller/challenges/apply.go', 'Server-side apply helpers that patch ACME Challenge objects and their status through the cert-manager clientset with a fixed field manager.', ['controller', 'server-side-apply', 'acme', 'kubernetes-client'], 'moderate');
file('internal/controller/orders/apply.go', 'Server-side apply helper that patches the status of ACME Order resources through the generated cert-manager clientset.', ['controller', 'server-side-apply', 'acme', 'status'], 'moderate');
file('internal/test/paths/paths.go', 'Test helper that derives repository-relative filesystem paths (module root, bin dirs, generated CRDs) and validates that a named CRD file exists.', ['test', 'utility', 'filesystem-paths', 'crd'], 'moderate');
file('make/config/samplewebhook/sample/main.go', 'Reference external ACME DNS01 solver webhook that implements the Solver interface and hands process startup to the cert-manager webhook library.', ['example', 'webhook', 'acme', 'dns01', 'entry-point'], 'moderate');
file('pkg/acme/util.go', 'Small ACME helpers that classify challenge/order states as final or failing and that default private key secret selectors to tls.key.', ['utility', 'acme', 'state-machine', 'defaulting'], 'simple');
file('pkg/acme/webhook/apis/acme/doc.go', 'Package documentation for the ACME webhook API group used by external DNS01 solver implementations.', ['documentation', 'api-types', 'webhook', 'acme'], 'simple');
file('pkg/acme/webhook/apis/acme/v1alpha1/doc.go', 'Package documentation for the v1alpha1 ACME webhook solver API, noting the API group name and version registration.', ['documentation', 'api-types', 'webhook', 'v1alpha1'], 'simple');
file('pkg/acme/webhook/apis/acme/v1alpha1/register.go', 'Registers ACME webhook v1alpha1 types (ChallengePayload) with the scheme, sets the group version, and exposes the Resource helper.', ['api-types', 'registration', 'scheme', 'webhook'], 'simple');
file('pkg/acme/webhook/apis/acme/v1alpha1/types.go', 'Defines ChallengePayload, ChallengeRequest, ChallengeResponse, and ChallengeAction - the wire contract exchanged between cert-manager and external DNS01 solver webhooks.', ['api-types', 'data-model', 'webhook', 'acme'], 'moderate');
file('pkg/acme/webhook/apis/acme/v1alpha1/zz_generated.deepcopy.go', 'Generated deep-copy and DeepCopyObject implementations for the ACME webhook v1alpha1 API types.', ['generated', 'deepcopy', 'api-types', 'boilerplate'], 'moderate');
file('pkg/acme/webhook/apiserver/apiserver.go', 'Builds a Kubernetes generic API server that exposes one ChallengePayload API group per registered ACME solver and runs solver Initialize post-start hooks.', ['apiserver', 'webhook', 'kubernetes', 'server-bootstrap'], 'complex');
file('pkg/acme/webhook/cmd/cmd.go', 'Process entry point for the webhook server that wires logging, signal/exit handling, GOMAXPROCS, and the Cobra start command.', ['cli', 'entry-point', 'webhook', 'cobra'], 'simple');
file('pkg/acme/webhook/cmd/server/start.go', 'Cobra command plus options struct for launching the ACME solver webhook apiserver, including option completion, validation, config assembly, and run.', ['cli', 'webhook', 'apiserver', 'options'], 'moderate');
file('pkg/acme/webhook/openapi/doc.go', 'Package documentation for the generated OpenAPI definitions exposed by the ACME webhook apiserver.', ['documentation', 'openapi', 'api-schema', 'webhook'], 'simple');
file('pkg/acme/webhook/openapi/zz_generated.openapi.go', 'Generated OpenAPI v2 definitions for the ACME webhook types and the Kubernetes apimachinery types they reference, assembled into a definition map by GetOpenAPIDefinitions.', ['generated', 'openapi', 'api-schema', 'boilerplate'], 'complex');
file('pkg/acme/webhook/registry/challengepayload/challenge_payload.go', 'REST storage handler that accepts ChallengePayload create requests and dispatches Present or CleanUp actions to the configured solver.', ['api-handler', 'webhook', 'rest-storage', 'acme'], 'moderate');
file('pkg/acme/webhook/webhook.go', 'Defines the Solver interface (Name, Present, CleanUp, Initialize) that external ACME DNS01 webhook implementations must satisfy.', ['type-definition', 'webhook', 'acme', 'interface'], 'simple');
file('pkg/apis/acme/doc.go', 'Package documentation for the public ACME API package, describing the cert-manager ACME resource group.', ['documentation', 'api-types', 'acme'], 'simple');
file('pkg/apis/acme/v1/const.go', 'Defines the legacy and current ACME finalizer names used by cert-manager controllers.', ['api-types', 'constants', 'acme', 'finalizers'], 'simple');
file('pkg/apis/acme/v1/doc.go', 'Package documentation for the public acme.cert-manager.io/v1 API, including the group name and generated-code markers.', ['documentation', 'api-types', 'acme', 'v1'], 'simple');
file('pkg/apis/acme/v1/register.go', 'Registers the public acme.cert-manager.io/v1 group version and its Challenge and Order types with the Kubernetes scheme.', ['api-types', 'registration', 'scheme', 'acme'], 'simple');
file('pkg/apis/acme/v1/types.go', 'Defines annotation, label, and kind constants shared by the ACME controllers, including HTTP01 ingress overrides and solver pod labels.', ['api-types', 'constants', 'annotations', 'acme'], 'simple');
file('pkg/apis/acme/v1/types_challenge.go', 'Defines the Challenge and ChallengeList resources with their spec (type, solver, issuerRef, authz URL) and status (state, reason, timestamps).', ['api-types', 'data-model', 'acme', 'challenge'], 'moderate');
file('pkg/apis/acme/v1/types_issuer.go', 'Defines the public ACME issuer configuration types: solver selection, HTTP01 ingress/gateway options, and all supported DNS01 providers.', ['api-types', 'data-model', 'acme', 'issuer', 'dns01'], 'complex');

/* --------------------------- function/class nodes ------------------------- */
const A = 'internal/apis/acme/v1/defaults.go';
fn(A, 'SetObjectDefaults_Challenge', [33, 40], 'Defaults the issuerRef kind and group of a Challenge to Issuer and cert-manager.io.', ['defaulting', 'acme', 'challenge'], 'simple');
fn(A, 'SetObjectDefaults_ChallengeList', [42, 47], 'Applies Challenge defaults to every item in a ChallengeList.', ['defaulting', 'acme', 'list-handling'], 'simple');
fn(A, 'SetObjectDefaults_Order', [49, 56], 'Defaults the issuerRef kind and group of an Order to Issuer and cert-manager.io.', ['defaulting', 'acme', 'order'], 'simple');
fn(A, 'SetObjectDefaults_OrderList', [58, 63], 'Applies Order defaults to every item in an OrderList.', ['defaulting', 'acme', 'list-handling'], 'simple');

const B = 'internal/apis/acme/v1/register.go';
fn(B, 'Resource', [30, 32], 'Returns the GroupResource for a named resource in the internal acme/v1 group.', ['utility', 'registration', 'acme'], 'simple');

const C = 'internal/cmd/util/exit.go';
fn(C, 'SetExitCode', [25, 34], 'Maps an error to an exit code: ignores nil and canceled contexts, uses 124 for timeouts, and 1 otherwise.', ['error-handling', 'exit-code', 'cli'], 'simple');
fn(C, 'SetExitCodeValue', [37, 46], 'Records a non-zero exit code in the shared channel unless one has already been set.', ['error-handling', 'exit-code', 'cli'], 'simple');

const D = 'internal/cmd/util/signal.go';
fn(D, 'SetupExitHandler', [52, 80], 'Registers the shutdown signal handler, returns a cancelable context, and returns an exit function that applies any recorded exit code.', ['signal-handling', 'graceful-shutdown', 'context'], 'moderate');

const E = 'internal/collectors/acme_collector.go';
cl(E, 'ACMECollector', [34, 37], 'Prometheus collector holding a Challenge lister and the challenge status metric descriptor.', ['metrics', 'collector', 'prometheus'], 'simple');
fn(E, 'NewACMECollector', [39, 44], 'Constructs an ACMECollector from the ACME informer factory.', ['factory', 'metrics', 'acme'], 'simple');
fn(E, 'Collect', [50, 78], 'Lists all Challenges and emits one status metric per challenge keyed by name, namespace, and type.', ['metrics', 'prometheus', 'acme'], 'moderate');

const F = 'internal/controller/challenges/apply.go';
fn(F, 'Apply', [36, 46], 'Applies the Challenge spec via a server-side apply patch using a fixed field manager.', ['server-side-apply', 'controller', 'acme'], 'moderate');
fn(F, 'ApplyStatus', [53, 63], 'Applies only the Challenge status subresource via a server-side apply patch.', ['server-side-apply', 'controller', 'status'], 'moderate');
fn(F, 'serializeApply', [70, 82], 'Serializes the Challenge type metadata and spec into the JSON payload required for apply patches.', ['serialization', 'server-side-apply', 'utility'], 'moderate', false);
fn(F, 'serializeApplyStatus', [89, 101], 'Serializes the Challenge type metadata and status into a JSON apply payload.', ['serialization', 'server-side-apply', 'utility'], 'moderate', false);

const G = 'internal/controller/orders/apply.go';
fn(G, 'ApplyStatus', [37, 49], 'Applies the Order status subresource via a server-side apply patch with a fixed field manager.', ['server-side-apply', 'controller', 'status'], 'moderate');
fn(G, 'serializeApplyStatus', [56, 67], 'Serializes the Order type metadata and status into a JSON apply payload.', ['serialization', 'server-side-apply', 'utility'], 'moderate', false);

const H = 'internal/test/paths/paths.go';
fn(H, 'PathForCRD', [51, 69], 'Resolves and validates the YAML file path for a named CRD, failing the test if it is missing or a directory.', ['test', 'utility', 'crd'], 'moderate');
fn(H, 'CRDDirectory', [72, 82], 'Returns the generated CRD directory produced by the Makefile build.', ['test', 'utility', 'crd'], 'simple');
fn(H, 'makefileCRDDirectory', [84, 93], 'Wraps CRD directory lookup with an existence and type check.', ['test', 'utility', 'filesystem-paths'], 'simple', false);
fn(H, 'checkCRDDirectory', [95, 106], 'Verifies that a path exists and is a directory, returning a descriptive error otherwise.', ['test', 'validation', 'filesystem-paths'], 'simple', false);

const I = 'make/config/samplewebhook/sample/main.go';
cl(I, 'customDNSProviderSolver', [52, 60], 'Example Solver implementation that demonstrates the hooks an external DNS provider webhook must provide.', ['example', 'webhook', 'acme', 'solver'], 'simple', false);
fn(I, 'main', [33, 46], 'Validates GROUP_NAME and starts the webhook server with the example solver registered.', ['entry-point', 'webhook', 'example'], 'simple', false);
fn(I, 'Present', [101, 112], 'Decodes the challenge configuration and logs it where the real DNS record creation would happen.', ['example', 'webhook', 'dns01'], 'simple');
fn(I, 'CleanUp', [120, 123], 'Placeholder cleanup hook where a real solver would delete the challenge TXT record.', ['example', 'webhook', 'dns01'], 'simple');
fn(I, 'Initialize', [134, 147], 'Post-start hook stub documenting how to build a Kubernetes clientset for the solver.', ['example', 'webhook', 'initialization'], 'simple');
fn(I, 'loadConfig', [151, 162], 'Unmarshals the raw solver JSON config into the example config struct, tolerating a nil config.', ['utility', 'serialization', 'example'], 'simple', false);

const J = 'pkg/acme/util.go';
fn(J, 'IsFinalState', [30, 35], 'Reports whether an ACME state is terminal, treating Valid as final and delegating failure detection.', ['acme', 'state-machine', 'validation'], 'simple');
fn(J, 'IsFailureState', [37, 44], 'Reports whether an ACME state is Invalid, Expired, or Errored.', ['acme', 'state-machine', 'validation'], 'simple');
fn(J, 'PrivateKeySelector', [48, 53], 'Defaults the secret key selector to tls.key when no key is specified.', ['acme', 'defaulting', 'utility'], 'simple');

const K = 'pkg/acme/webhook/apis/acme/v1alpha1/register.go';
fn(K, 'Resource', [31, 33], 'Returns the GroupResource for a named resource in the webhook acme/v1alpha1 group.', ['utility', 'registration', 'webhook'], 'simple');

const L = 'pkg/acme/webhook/apis/acme/v1alpha1/types.go';
cl(L, 'ChallengePayload', [29, 39], 'Request/response envelope submitted to a solver webhook, carrying optional request and response fields.', ['api-types', 'data-model', 'webhook'], 'simple');
cl(L, 'ChallengeRequest', [43, 112], 'Describes a solver request: action, challenge type, DNS name, key, resolved FQDN/zone, and provider config.', ['api-types', 'data-model', 'webhook', 'dns01'], 'moderate');
cl(L, 'ChallengeResponse', [126, 139], 'Solver response carrying the request UID, a success flag, and optional failure status.', ['api-types', 'data-model', 'webhook'], 'simple');

const M = 'pkg/acme/webhook/apiserver/apiserver.go';
cl(M, 'Config', [63, 66], 'Combines the generic recommended apiserver config with webhook-specific extra config.', ['apiserver', 'configuration', 'webhook'], 'simple');
cl(M, 'ExtraConfig', [68, 75], 'Holds the solver API group name and the list of registered solvers.', ['apiserver', 'configuration', 'webhook'], 'simple');
cl(M, 'ChallengeServer', [78, 80], 'Wraps the generic API server that serves the challenge payload API.', ['apiserver', 'webhook', 'service'], 'simple');
fn(M, 'Complete', [95, 105], 'Completes the generic apiserver configuration, adding default OpenAPI configs and effective version.', ['apiserver', 'configuration', 'initialization'], 'moderate');
fn(M, 'New', [111, 171], 'Builds the challenge server, installs an API group per solver, and registers solver Initialize post-start hooks.', ['apiserver', 'factory', 'webhook'], 'complex');
fn(M, 'appendUniqueGroupVersion', [182, 195], 'Appends a GroupVersion to a slice only when it is not already present.', ['utility', 'slice-handling', 'apiserver'], 'simple', false);

const N = 'pkg/acme/webhook/cmd/cmd.go';
fn(N, 'RunWebhookServer', [38, 57], 'Sets up logging and exit handling, tunes GOMAXPROCS, and executes the webhook server command.', ['cli', 'entry-point', 'logging'], 'moderate');

const O = 'pkg/acme/webhook/cmd/server/start.go';
cl(O, 'WebhookServerOptions', [35, 42], 'Options for the webhook apiserver: logging, recommended generic options, solver group, and solvers.', ['cli', 'configuration', 'options'], 'simple');
fn(O, 'NewWebhookServerOptions', [44, 61], 'Creates webhook server options, disabling etcd, admission, and priority-and-fairness defaults.', ['factory', 'configuration', 'options'], 'moderate');
fn(O, 'NewCommandStartWebhookServer', [63, 91], 'Builds the Cobra command whose RunE completes, validates, and runs the webhook server.', ['cli', 'cobra', 'entry-point'], 'moderate');
fn(O, 'Validate', [93, 103], 'Applies logging flags and validates the recommended apiserver options.', ['validation', 'cli', 'configuration'], 'moderate');
fn(O, 'Config', [112, 131], 'Generates self-signed serving certificates and assembles the webhook apiserver config.', ['configuration', 'apiserver', 'tls'], 'moderate');
fn(O, 'RunWebhookServer', [135, 146], 'Completes the config, creates the apiserver, and runs it until the context is canceled.', ['apiserver', 'lifecycle', 'cli'], 'moderate');

const P = 'pkg/acme/webhook/openapi/zz_generated.openapi.go';
fn(P, 'GetOpenAPIDefinitions', [31, 117], 'Returns the map of generated OpenAPI definitions for all webhook and apimachinery types.', ['openapi', 'api-schema', 'generated'], 'moderate');

const Q = 'pkg/acme/webhook/registry/challengepayload/challenge_payload.go';
cl(Q, 'REST', [32, 34], 'REST storage implementation that adapts the Solver interface to a Kubernetes create endpoint.', ['api-handler', 'rest-storage', 'webhook'], 'simple');
fn(Q, 'NewREST', [41, 45], 'Constructs a REST handler around the given solver.', ['factory', 'api-handler', 'webhook'], 'simple');
fn(Q, 'Create', [62, 76], 'Validates the incoming payload and dispatches it to the solver, filling in the response.', ['api-handler', 'validation', 'webhook'], 'moderate');
fn(Q, 'callSolver', [80, 106], 'Invokes Present or CleanUp on the solver based on the requested action and maps errors into a Status result.', ['webhook', 'dispatch', 'acme'], 'moderate', false);

const R = 'pkg/acme/webhook/webhook.go';
cl(R, 'Solver', [30, 48], 'Interface implemented by ACME challenge solvers: Name, Present, CleanUp, and Initialize.', ['type-definition', 'interface', 'webhook', 'acme'], 'simple');

const S = 'pkg/apis/acme/v1/register.go';
fn(S, 'Resource', [31, 33], 'Returns the GroupResource for a named resource in the public acme.cert-manager.io/v1 group.', ['utility', 'registration', 'acme'], 'simple');
fn(S, 'addKnownTypes', [49, 58], 'Adds Challenge and Order types plus list metadata to the public ACME scheme.', ['registration', 'scheme', 'acme'], 'simple', false);

const T = 'pkg/apis/acme/v1/types_challenge.go';
cl(T, 'Challenge', [36, 43], 'Kubernetes resource representing an ACME challenge to be solved by a solver implementation.', ['data-model', 'acme', 'challenge', 'api-types'], 'simple');
cl(T, 'ChallengeList', [48, 53], 'List wrapper for Challenge resources used by the Kubernetes API.', ['data-model', 'acme', 'list-handling'], 'simple');
cl(T, 'ChallengeSpec', [55, 101], 'Challenge specification: type, authorization URL, DNS name, token/key, solver config, and issuer reference.', ['data-model', 'acme', 'challenge'], 'moderate');
cl(T, 'ChallengeStatus', [117, 145], 'Challenge status including processing flag, presented flag, state, reason, and timestamps.', ['data-model', 'acme', 'status'], 'moderate');

const U = 'pkg/apis/acme/v1/types_issuer.go';
const issuerClasses = [
  ['ACMEIssuer', [31, 123], 'ACME issuer configuration: server, email, private key, external account binding, solvers, and skip-TLS-verify.', ['data-model', 'acme', 'issuer'], 'moderate'],
  ['ACMEExternalAccountBinding', [127, 145], 'External account binding credentials referencing a secret key selector.', ['data-model', 'acme', 'credentials'], 'simple'],
  ['ACMEChallengeSolver', [160, 180], 'Selects which challenges a solver handles and holds either HTTP01 or DNS01 configuration.', ['data-model', 'acme', 'solver'], 'simple'],
  ['CertificateDNSNameSelector', [186, 215], 'Restricts a solver to matching DNS names and name constraints.', ['data-model', 'acme', 'solver', 'validation'], 'simple'],
  ['ACMEChallengeSolverHTTP01', [223, 237], 'Container for HTTP01 solver settings, choosing ingress or gateway HTTPRoute.', ['data-model', 'acme', 'http01'], 'simple'],
  ['ACMEChallengeSolverHTTP01Ingress', [239, 277], 'Ingress-based HTTP01 solver settings including class, name, pod template, and service type.', ['data-model', 'acme', 'http01', 'ingress'], 'moderate'],
  ['ACMEChallengeSolverHTTP01GatewayHTTPRoute', [281, 304], 'Gateway API HTTPRoute settings for HTTP01 solving, including parent refs and labels.', ['data-model', 'acme', 'http01', 'gateway-api'], 'simple'],
  ['ACMEChallengeSolverHTTP01IngressPodTemplate', [306, 319], 'Pod template used when creating HTTP01 solver pods, with metadata and spec overrides.', ['data-model', 'acme', 'http01'], 'simple'],
  ['ACMEChallengeSolverHTTP01IngressPodObjectMeta', [321, 329], 'Additional annotations and labels applied to HTTP01 solver pods.', ['data-model', 'acme', 'http01'], 'simple'],
  ['ACMEChallengeSolverHTTP01IngressPodSpec', [331, 375], 'Pod spec customizations for HTTP01 solver pods such as affinity, tolerations, and priority.', ['data-model', 'acme', 'http01', 'kubernetes'], 'moderate'],
  ['ACMEChallengeSolverHTTP01IngressTemplate', [377, 384], 'Metadata template applied to generated HTTP01 ingress resources.', ['data-model', 'acme', 'http01'], 'simple'],
  ['ACMEChallengeSolverHTTP01IngressObjectMeta', [386, 394], 'Annotations and labels applied to the ingress created for HTTP01 challenges.', ['data-model', 'acme', 'http01'], 'simple'],
  ['ACMEChallengeSolverDNS01', [399, 443], 'Union of all supported DNS01 provider configurations plus provider selection fields.', ['data-model', 'acme', 'dns01'], 'moderate'],
  ['ACMEChallengeSolverHTTP01IngressPodSecurityContext', [445, 519], 'Subset of Kubernetes pod security context options exposed for HTTP01 solver pods.', ['data-model', 'acme', 'http01', 'security'], 'moderate'],
  ['ACMEChallengeSolverHTTP01IngressPodResources', [523, 534], 'CPU and memory requests/limits for HTTP01 solver pods.', ['data-model', 'acme', 'http01', 'resources'], 'simple'],
  ['ACMEIssuerDNS01ProviderAkamai', [557, 562], 'Akamai DNS01 provider credentials and options.', ['data-model', 'acme', 'dns01'], 'simple'],
  ['ACMEIssuerDNS01ProviderCloudDNS', [566, 576], 'Google Cloud DNS provider configuration including project and service account secret.', ['data-model', 'acme', 'dns01'], 'simple'],
  ['ACMEIssuerDNS01ProviderCloudflare', [581, 595], 'Cloudflare API token or key based DNS01 provider configuration.', ['data-model', 'acme', 'dns01'], 'simple'],
  ['ACMEIssuerDNS01ProviderDigitalOcean', [599, 601], 'DigitalOcean DNS01 provider configuration with an API token secret reference.', ['data-model', 'acme', 'dns01'], 'simple'],
  ['ACMEIssuerDNS01ProviderRoute53', [605, 668], 'AWS Route53 provider configuration including region, hosted zone, and auth options.', ['data-model', 'acme', 'dns01', 'aws'], 'moderate'],
  ['Route53Auth', [671, 675], 'Selects the authentication mechanism used for Route53.', ['data-model', 'acme', 'aws', 'credentials'], 'simple'],
  ['Route53KubernetesAuth', [679, 684], 'Route53 authentication via a Kubernetes service account reference.', ['data-model', 'acme', 'aws', 'credentials'], 'simple'],
  ['ServiceAccountRef', [688, 699], 'Reference to a Kubernetes service account, optionally in another namespace.', ['data-model', 'kubernetes', 'credentials'], 'simple'],
  ['ACMEIssuerDNS01ProviderAzureDNS', [703, 741], 'Azure DNS provider configuration including tenant, subscription, and managed identity options.', ['data-model', 'acme', 'dns01', 'azure'], 'moderate'],
  ['AzureManagedIdentity', [746, 759], 'Azure managed identity settings used to authenticate to Azure DNS.', ['data-model', 'acme', 'azure', 'credentials'], 'simple'],
  ['ACMEIssuerDNS01ProviderAcmeDNS', [773, 777], 'ACME-DNS provider configuration with account secret and host.', ['data-model', 'acme', 'dns01'], 'simple'],
  ['ACMEIssuerDNS01ProviderRFC2136', [781, 808], 'RFC2136 dynamic DNS update provider configuration including nameserver, TSIG credentials, and timeouts.', ['data-model', 'acme', 'dns01'], 'moderate'],
  ['ACMEIssuerDNS01ProviderWebhook', [822, 844], 'External webhook solver configuration: group name, solver name, and raw JSON config.', ['data-model', 'acme', 'dns01', 'webhook'], 'moderate'],
  ['ACMEIssuerStatus', [846, 863], 'ACME issuer status recording the discovered directory URL and last registered email.', ['data-model', 'acme', 'status'], 'simple'],
];
for (const [name, range, summary, tags, complexity] of issuerClasses) cl(U, name, range, summary, tags, complexity);

/* --------------------------------- edges ---------------------------------- */
const importData = input.batchImportData;
const edges = [];
const push = (source, target, type, weight) => edges.push({ source, target, type, direction: 'forward', weight });

for (const [src, targets] of Object.entries(importData)) {
  for (const t of targets) push(`file:${src}`, `file:${t}`, 'imports', 0.7);
}
for (const n of nodes) {
  if (n.type === 'function' || n.type === 'class') {
    push(`file:${n.filePath}`, n.id, 'contains', 1.0);
    if (n.__exported) push(`file:${n.filePath}`, n.id, 'exports', 0.8);
  }
}
// cross-file call / implementation edges
push(`file:${I}`, `function:pkg/acme/webhook/cmd/cmd.go:RunWebhookServer`, 'calls', 0.8);
push(`file:pkg/acme/webhook/cmd/cmd.go`, `function:${O}:NewCommandStartWebhookServer`, 'calls', 0.8);
push(`function:${O}:RunWebhookServer`, `function:${M}:New`, 'calls', 0.8);
push(`file:${M}`, `function:${Q}:NewREST`, 'calls', 0.8);
push(`function:${Q}:Create`, `function:${Q}:callSolver`, 'calls', 0.8);
push(`class:${I}:customDNSProviderSolver`, `class:${R}:Solver`, 'implements', 0.9);

/* ------------------------------- partition -------------------------------- */
const files = input.batchFiles.map((f) => f.path).sort();
const nodeCount = nodes.length;
const edgeCount = edges.length;
const parts = Math.ceil(Math.max(nodeCount / 60, edgeCount / 120));
const chunkSize = Math.ceil(files.length / parts);
const groups = [];
for (let i = 0; i < parts; i++) groups.push(files.slice(i * chunkSize, (i + 1) * chunkSize));

const clean = (n) => {
  const { __exported, ...rest } = n;
  return rest;
};

const partStats = [];
groups.forEach((group, idx) => {
  const set = new Set(group);
  const partNodes = nodes.filter((n) => set.has(n.filePath)).map(clean);
  const ids = new Set(partNodes.map((n) => n.id));
  const partEdges = edges.filter((e) => ids.has(e.source));
  fs.writeFileSync(`${UA}/intermediate/batch-6-part-${idx + 1}.json`, JSON.stringify({ nodes: partNodes, edges: partEdges }, null, 2));
  partStats.push({ part: idx + 1, files: group.length, nodes: partNodes.length, edges: partEdges.length });
});

// sanity checks
const ids = nodes.map((n) => n.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
const selfEdges = edges.filter((e) => e.source === e.target);
const importSum = Object.values(importData).reduce((a, b) => a + b.length, 0);
const importEdges = edges.filter((e) => e.type === 'imports').length;
const validTypes = new Set(['imports', 'calls', 'contains', 'exports', 'implements', 'inherits', 'depends_on', 'tested_by', 'configures', 'documents', 'deploys', 'migrates', 'triggers', 'defines_schema', 'serves', 'provisions', 'routes', 'related']);
const badType = edges.filter((e) => !validTypes.has(e.type));

console.log(JSON.stringify({ totalNodes: nodeCount, totalEdges: edgeCount, parts, importSum, importEdges, dupes, selfEdges: selfEdges.length, badType: badType.length, partStats }, null, 2));
