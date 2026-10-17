import fs from 'fs';
import path from 'path';

const ROOT = '/Users/samtyga/Desktop/work/cert-manager';
const UA = path.join(ROOT, '.ua');
const prompt = JSON.parse(fs.readFileSync(path.join(UA, 'tmp/prompts/batch-3.json'), 'utf8'));
const extract = JSON.parse(fs.readFileSync(path.join(UA, 'tmp/ua-file-extract-results-3.json'), 'utf8'));
const byPath = new Map(extract.results.map(r => [r.path, r]));

const meta = {
  'pkg/controller/builder.go': {
    summary: 'Provides the controller Builder and its constructor, letting controller packages register an implementation, optional duration logic and run the controller through the shared context.',
    tags: ['controller', 'builder', 'registration', 'kubernetes'],
    complexity: 'moderate',
  },
  'pkg/controller/cainjector/indexers.go': {
    summary: 'Defines field indexers and mapping functions that translate Secrets and certificate-bearing resources into reconcile requests for the cainjector controllers.',
    tags: ['cainjector', 'indexer', 'kubernetes', 'event-handler'],
    complexity: 'complex',
    notes: 'Uses controller-runtime field indexes because annotation-based filtering cannot be expressed as a list/watch selector.',
  },
  'pkg/controller/cainjector/injectables.go': {
    summary: 'Implements the injectable target abstractions for mutating/validating webhooks, APIServices and CRD conversion webhooks, including server-side-apply patch builders for injecting CA bundles.',
    tags: ['cainjector', 'ca-injection', 'webhook', 'patch', 'kubernetes'],
    complexity: 'complex',
    notes: 'Patch structs mirror the Kubernetes API shape so SSA can update only the caBundle field.',
  },
  'pkg/controller/cainjector/reconciler.go': {
    summary: 'Implements the cainjector reconciler that resolves a CA data source for an annotated resource and writes the resulting bundle into the injectable target.',
    tags: ['cainjector', 'reconciler', 'controller-runtime', 'certificates'],
    complexity: 'moderate',
  },
  'pkg/controller/cainjector/setup.go': {
    summary: 'Registers all cainjector controllers with the controller-runtime manager, wiring watches, field indexes and target kinds according to feature gates and setup options.',
    tags: ['cainjector', 'setup', 'controller-runtime', 'feature-gate'],
    complexity: 'complex',
  },
  'pkg/controller/cainjector/sources.go': {
    summary: 'Implements the CA data sources cainjector reads from: the root CA Secret, kubeconfig, Certificate resources and Secrets owned by a Certificate.',
    tags: ['cainjector', 'ca-source', 'certificates', 'kubernetes'],
    complexity: 'moderate',
  },
  'pkg/controller/certificate-shim/gateways/controller.go': {
    summary: 'Registers and runs the Gateway shim controller that creates Certificates for Gateway TLS listeners and re-enqueues Gateways when those Certificates change.',
    tags: ['controller', 'gateway-api', 'shim', 'certificates'],
    complexity: 'moderate',
  },
  'pkg/controller/certificate-shim/helper.go': {
    summary: 'Translates ingress and Gateway annotations into Certificate spec fields and per-issuer configuration overrides.',
    tags: ['shim', 'annotations', 'translation', 'certificates'],
    complexity: 'complex',
    notes: 'Annotation parsing uses CSV splitting with escaping and validates each value before mutating the Certificate spec.',
  },
  'pkg/controller/certificate-shim/ingresses/controller.go': {
    summary: 'Registers and runs the Ingress shim controller that synchronizes Certificates from Ingress TLS blocks.',
    tags: ['controller', 'ingress', 'shim', 'certificates'],
    complexity: 'moderate',
  },
  'pkg/controller/certificate-shim/sync.go': {
    summary: 'Core synchronization logic for the certificate shims: validates Ingress/Gateway resources, builds and updates Certificates, and deletes shim-managed Certificates that are no longer needed.',
    tags: ['shim', 'sync', 'certificates', 'validation', 'reconciler'],
    complexity: 'complex',
  },
  'pkg/controller/certificaterequests/approver/approver.go': {
    summary: 'Controller that watches CertificateRequests and runs the approval policy chain, approving or denying requests based on configured policy.',
    tags: ['controller', 'certificaterequest', 'approval', 'policy'],
    complexity: 'moderate',
  },
  'pkg/controller/certificaterequests/approver/sync.go': {
    summary: 'Applies approval decisions to CertificateRequests by updating their conditions and status, using server-side apply when enabled.',
    tags: ['certificaterequest', 'approval', 'status', 'sync'],
    complexity: 'moderate',
  },
  'pkg/controller/certificaterequests/ca/ca.go': {
    summary: 'CA issuer implementation that signs CertificateRequests with a CA key pair stored in a Secret.',
    tags: ['issuer', 'ca', 'signing', 'certificaterequest'],
    complexity: 'moderate',
  },
  'pkg/controller/certificaterequests/checks.go': {
    summary: 'Event handler helpers that enqueue CertificateRequests when a generic Issuer they reference changes.',
    tags: ['controller', 'event-handler', 'issuer', 'certificaterequest'],
    complexity: 'moderate',
  },
  'pkg/controller/certificaterequests/controller.go': {
    summary: 'Generic CertificateRequest controller framework that owns the work queue and informers and delegates signing to an issuer-specific implementation.',
    tags: ['controller', 'certificaterequest', 'framework', 'kubernetes'],
    complexity: 'complex',
  },
  'pkg/controller/certificaterequests/fake/fake.go': {
    summary: 'Fake issuer implementation used in tests to stub CertificateRequest signing with a caller-provided function.',
    tags: ['test', 'fake', 'issuer', 'certificaterequest'],
    complexity: 'simple',
  },
  'pkg/controller/certificaterequests/selfsigned/checks.go': {
    summary: 'Event handlers that map Secret changes to CertificateRequests referencing them for the self-signed issuer.',
    tags: ['controller', 'event-handler', 'self-signed', 'certificaterequest'],
    complexity: 'moderate',
  },
  'pkg/controller/certificaterequests/selfsigned/selfsigned.go': {
    summary: 'Self-signed issuer implementation that generates a private key and self-signed certificate for CertificateRequests and registers its Secret informer handler.',
    tags: ['issuer', 'self-signed', 'signing', 'certificaterequest'],
    complexity: 'complex',
  },
  'pkg/controller/certificaterequests/sync.go': {
    summary: 'Shared CertificateRequest sync routine that validates approval and issuer state, invokes the issuer backend and records conditions.',
    tags: ['certificaterequest', 'sync', 'signing', 'status'],
    complexity: 'complex',
  },
  'pkg/controller/certificaterequests/util/reporter.go': {
    summary: 'Reporter helper that records CertificateRequest conditions and events for pending, failed, denied, invalid and ready states.',
    tags: ['utility', 'reporter', 'conditions', 'certificaterequest'],
    complexity: 'moderate',
  },
  'pkg/controller/certificaterequests/vault/vault.go': {
    summary: 'Vault issuer implementation that authenticates to Vault and signs CertificateRequests through the Vault PKI backend.',
    tags: ['issuer', 'vault', 'signing', 'certificaterequest'],
    complexity: 'moderate',
  },
  'pkg/controller/certificaterequests/venafi/venafi.go': {
    summary: 'Venafi issuer implementation that requests and retrieves certificates from Venafi TPP or Venafi Cloud.',
    tags: ['issuer', 'venafi', 'signing', 'certificaterequest'],
    complexity: 'moderate',
  },
  'pkg/controller/certificates/informers.go': {
    summary: 'Informer event handler that enqueues Certificates matching a predicate set when related resources change.',
    tags: ['controller', 'informer', 'event-handler', 'certificates'],
    complexity: 'moderate',
  },
  'pkg/controller/certificates/issuing/internal/keystore.go': {
    summary: 'Encodes PEM private keys and certificate chains into JKS and PKCS#12 keystores and truststores for Certificate Secrets.',
    tags: ['keystore', 'encoding', 'jks', 'pkcs12', 'certificates'],
    complexity: 'moderate',
    notes: 'Supports both modern and legacy PKCS#12 profiles to stay compatible with older Java clients.',
  },
  'pkg/controller/certificates/issuing/internal/secret.go': {
    summary: 'Manages the lifecycle of Certificate Secret data, including keystores, additional output formats, owner references and server-side apply updates.',
    tags: ['secret', 'certificates', 'apply', 'keystore'],
    complexity: 'complex',
  },
  'pkg/controller/certificates/issuing/issuing_controller.go': {
    summary: 'Main issuing controller that drives Certificate issuance, request validation, failure handling and status updates.',
    tags: ['controller', 'certificates', 'issuing', 'reconciler'],
    complexity: 'complex',
  },
  'pkg/controller/certificates/issuing/secret_manager.go': {
    summary: 'Ensures the Certificate Secret exists, matches the Certificate and is evaluated by post-issuance policy checks.',
    tags: ['certificates', 'secret', 'policy', 'helper'],
    complexity: 'moderate',
  },
  'pkg/controller/certificates/issuing/temporary.go': {
    summary: 'Issues and annotates temporary certificates for Certificates that are still awaiting issuance.',
    tags: ['certificates', 'temporary-certificate', 'issuing', 'helper'],
    complexity: 'moderate',
  },
  'pkg/controller/certificates/keymanager/keymanager_controller.go': {
    summary: 'Key manager controller that creates, tracks and rotates the private key Secrets used by Certificates.',
    tags: ['controller', 'certificates', 'private-key', 'rotation'],
    complexity: 'complex',
  },
  'pkg/controller/certificates/listers.go': {
    summary: 'Predicate-based listing helpers for Certificates, CertificateRequests and Secrets shared by the certificate controllers.',
    tags: ['utility', 'lister', 'predicate', 'certificates'],
    complexity: 'moderate',
  },
  'pkg/controller/certificates/metrics/certificates.go': {
    summary: 'Controller that exports Prometheus metrics describing Certificate resources.',
    tags: ['controller', 'metrics', 'prometheus', 'certificates'],
    complexity: 'moderate',
  },
  'pkg/controller/certificates/readiness/readiness_controller.go': {
    summary: 'Readiness controller that evaluates the certificate policy chain and updates the Certificate Ready condition.',
    tags: ['controller', 'certificates', 'readiness', 'policy'],
    complexity: 'complex',
  },
  'pkg/controller/certificates/requestmanager/requestmanager_controller.go': {
    summary: 'Request manager controller that creates, cleans up and tracks CertificateRequests on behalf of Certificates.',
    tags: ['controller', 'certificates', 'certificaterequest', 'lifecycle'],
    complexity: 'complex',
  },
};

// function/class selections: [kind, name, summary, tags, complexity?]
const sel = {
  'pkg/controller/builder.go': [
    ['function', 'NewBuilder', 'Creates a Builder bound to the controller context and a controller name, deferring implementation selection to For.', ['factory', 'controller', 'builder']],
    ['function', 'For', 'Sets the controller implementation the Builder will start and returns the Builder for chaining.', ['builder', 'fluent-api', 'controller']],
    ['function', 'With', 'Registers a function that reports how long the controller loop should wait between runs.', ['builder', 'scheduling', 'controller']],
    ['function', 'Complete', 'Starts the controller implementation and runs its registered duration functions until shutdown.', ['builder', 'lifecycle', 'controller']],
    ['class', 'Builder', 'Fluent builder that assembles a controller implementation and its run duration functions before starting it.', ['builder', 'factory', 'controller']],
  ],
  'pkg/controller/cainjector/indexers.go': [
    ['function', 'certFromSecretToInjectableMapFuncBuilder', 'Builds a mapping function that resolves Secrets to injectable objects whose certificate annotation matches the Secret.', ['cainjector', 'indexer', 'secret', 'mapping']],
    ['function', 'certToInjectableMapFuncBuilder', 'Builds a mapping function that resolves Certificate resources to injectables referencing them by annotation.', ['cainjector', 'indexer', 'certificate', 'mapping']],
    ['function', 'secretForInjectableMapFuncBuilder', 'Builds a mapping function that finds the Secret holding the certificate referenced by an injectable.', ['cainjector', 'indexer', 'secret', 'mapping']],
    ['function', 'injectableCAFromIndexer', 'Extracts the injectable object referenced by a field index lookup on a Certificate event.', ['cainjector', 'indexer', 'extraction']],
    ['function', 'injectableCAFromSecretIndexer', 'Extracts the injectable object referenced by a field index lookup on a Secret event.', ['cainjector', 'indexer', 'extraction']],
    ['function', 'hasInjectableAnnotation', 'Reports whether an object carries the cainjector injectable annotation.', ['cainjector', 'annotation', 'predicate']],
  ],
  'pkg/controller/cainjector/injectables.go': [
    ['class', 'InjectTarget', 'Interface describing an injectable object that can be fetched, converted to an SSA apply object and have its CA updated.', ['interface', 'cainjector', 'ca-injection']],
    ['class', 'mutatingWebhookTarget', 'Injectable target wrapping a MutatingWebhookConfiguration and patching each webhook client config CA bundle.', ['cainjector', 'webhook', 'ca-injection']],
    ['class', 'validatingWebhookTarget', 'Injectable target wrapping a ValidatingWebhookConfiguration and patching its webhook CA bundles.', ['cainjector', 'webhook', 'ca-injection']],
    ['class', 'apiServiceTarget', 'Injectable target wrapping an APIService and patching its CA bundle through server-side apply.', ['cainjector', 'apiservice', 'ca-injection']],
    ['class', 'crdConversionTarget', 'Injectable target wrapping a CustomResourceDefinition conversion webhook and patching its client config CA bundle.', ['cainjector', 'crd', 'ca-injection']],
  ],
  'pkg/controller/cainjector/reconciler.go': [
    ['function', 'Reconcile', 'Reconciles an injectable target by selecting its configured CA source and injecting the resulting bundle.', ['reconciler', 'cainjector', 'ca-injection']],
    ['function', 'caDataSourceFor', 'Selects the CA data source implementation appropriate for an object based on its annotations.', ['cainjector', 'factory', 'annotation']],
    ['function', 'dropNotFound', 'Suppresses Kubernetes NotFound errors so missing referenced resources are treated as no-ops.', ['error-handling', 'utility', 'kubernetes']],
    ['function', 'owningCertForSecret', 'Returns the Certificate that owns a Secret through its controller reference.', ['secret', 'ownership', 'certificate']],
    ['function', 'splitNamespacedName', 'Splits a namespaced name annotation into its namespace and name components.', ['utility', 'parsing', 'annotation']],
    ['class', 'reconciler', 'Cainjector reconciler holding the target factory, CA sources and field manager used to inject bundles.', ['reconciler', 'cainjector', 'controller-runtime']],
  ],
  'pkg/controller/cainjector/setup.go': [
    ['function', 'RegisterAllInjectors', 'Registers a cainjector controller for each enabled target kind, wiring watches, predicates and field indexes.', ['setup', 'cainjector', 'controller-runtime']],
    ['function', 'dataFromSliceOrFile', 'Reads CA data either from an inline byte slice or from a file path.', ['utility', 'configuration', 'io']],
    ['class', 'SetupOptions', 'Options controlling namespace scoping, certificate data sources and which reconcilers are enabled.', ['configuration', 'cainjector', 'options']],
  ],
  'pkg/controller/cainjector/sources.go': [
    ['class', 'caDataSource', 'Interface for CA data sources that report whether they are configured and read a CA bundle.', ['interface', 'cainjector', 'ca-source']],
    ['class', 'kubeconfigDataSource', 'CA source that returns the CA bundle embedded in the controller kubeconfig.', ['cainjector', 'kubeconfig', 'ca-source']],
    ['class', 'certificateDataSource', 'CA source that reads the CA from a Certificate and its Secret.', ['cainjector', 'certificate', 'ca-source']],
    ['class', 'secretDataSource', 'CA source that reads the CA from a Secret referenced by the injectable.', ['cainjector', 'secret', 'ca-source']],
  ],
  'pkg/controller/certificate-shim/gateways/controller.go': [
    ['function', 'Register', 'Registers the Gateway shim controller with the shared controller context and sets up Gateway and Certificate informers.', ['controller', 'gateway-api', 'registration']],
    ['function', 'ProcessItem', 'Processes a queued Gateway key, skipping deleted Gateways and invoking the shim sync function.', ['controller', 'queue', 'gateway-api']],
    ['function', 'certificateHandler', 'Informer event handler that enqueues the owning Gateway when a shim-managed Certificate changes.', ['event-handler', 'gateway-api', 'queue']],
    ['class', 'controller', 'Gateway shim controller holding the Gateway lister and the sync function used to reconcile TLS listeners.', ['controller', 'gateway-api', 'shim']],
  ],
  'pkg/controller/certificate-shim/helper.go': [
    ['function', 'translateAnnotations', 'Parses cert-manager annotations on Ingress/Gateway resources and applies them to a Certificate spec.', ['annotations', 'parsing', 'certificates']],
  ],
  'pkg/controller/certificate-shim/ingresses/controller.go': [
    ['function', 'Register', 'Registers the Ingress shim controller with the shared context and wires Ingress and Certificate informers.', ['controller', 'ingress', 'registration']],
    ['function', 'ProcessItem', 'Processes a queued Ingress key, skipping deleted Ingresses and invoking the shim sync function.', ['controller', 'queue', 'ingress']],
    ['function', 'certificateHandler', 'Informer event handler that enqueues the owning Ingress when a shim-managed Certificate changes.', ['event-handler', 'ingress', 'queue']],
    ['class', 'controller', 'Ingress shim controller holding the Ingress lister and the sync function used to reconcile TLS blocks.', ['controller', 'ingress', 'shim']],
  ],
  'pkg/controller/certificate-shim/sync.go': [
    ['function', 'SyncFnFor', 'Builds the shim sync function that creates, updates and deletes Certificates derived from Ingress/Gateway resources.', ['shim', 'sync', 'certificates']],
    ['function', 'validateIngressLike', 'Validates the TLS configuration of an Ingress-like resource and returns an aggregate error.', ['validation', 'shim', 'ingress']],
    ['function', 'checkForDuplicateSecretNames', 'Rejects TLS blocks that reuse the same secret name across hosts.', ['validation', 'secret', 'shim']],
    ['function', 'validateIngressTLSBlock', 'Validates a single TLS block, requiring declared hosts and a secret name.', ['validation', 'tls', 'shim']],
    ['function', 'validateGatewayListenerBlock', 'Validates a Gateway listener TLS block and its hostname configuration.', ['validation', 'gateway-api', 'tls']],
    ['function', 'buildCertificates', 'Builds Certificate resources for each TLS block, merging annotations and issuer defaults.', ['shim', 'certificates', 'factory']],
    ['function', 'findCertificatesToBeRemoved', 'Returns shim-managed Certificates that no longer correspond to a current TLS block.', ['shim', 'cleanup', 'certificates']],
    ['function', 'mergeAnnotations', 'Merges two annotation maps, with values from the second map taking precedence.', ['utility', 'annotations', 'merge']],
    ['function', 'secretNameUsedIn', 'Reports whether a secret name is still referenced by any TLS block of the resource.', ['utility', 'secret', 'shim']],
    ['function', 'certNeedsUpdate', 'Compares a desired Certificate with the existing one to decide whether an update is required.', ['certificates', 'comparison', 'shim']],
    ['function', 'setIssuerSpecificConfig', 'Copies issuer-specific annotations from the Ingress-like object into the Certificate spec.', ['shim', 'issuer', 'annotation']],
    ['function', 'hasShimAnnotation', 'Reports whether the resource carries the shim annotation and is therefore managed.', ['shim', 'annotation', 'predicate']],
    ['function', 'extractExtraAnnotations', 'Extracts non-shim annotations that should be copied onto the generated Certificate.', ['shim', 'annotation', 'extraction']],
    ['function', 'isDeletedInForeground', 'Detects resources awaiting foreground deletion so the shim can skip them.', ['shim', 'deletion', 'predicate']],
    ['function', 'issuerForIngressLike', 'Resolves the issuer name, kind and group for an Ingress-like resource from annotations and defaults.', ['shim', 'issuer', 'resolution']],
  ],
  'pkg/controller/certificaterequests/approver/approver.go': [
    ['function', 'Register', 'Registers the approval controller, creating its queue and CertificateRequest informer handlers.', ['controller', 'approval', 'registration']],
    ['function', 'ProcessItem', 'Dequeues a CertificateRequest key and runs the approval sync for it.', ['controller', 'queue', 'approval']],
    ['class', 'Controller', 'Approval controller with a CertificateRequest lister, client, recorder and rate-limited work queue.', ['controller', 'approval', 'certificaterequest']],
  ],
  'pkg/controller/certificaterequests/approver/sync.go': [
    ['function', 'Sync', 'Approves or denies a CertificateRequest according to the configured approval policy.', ['approval', 'certificaterequest', 'policy']],
    ['function', 'updateStatusOrApply', 'Persists CertificateRequest status using server-side apply or UpdateStatus depending on feature gates.', ['status', 'apply', 'certificaterequest']],
  ],
  'pkg/controller/certificaterequests/ca/ca.go': [
    ['function', 'NewCA', 'Constructs the CA issuer with the Secret lister, reporter and default certificate signing function.', ['factory', 'issuer', 'ca']],
    ['class', 'CA', 'CA issuer that signs CertificateRequests with a CA key pair read from a Secret.', ['issuer', 'ca', 'signing']],
  ],
  'pkg/controller/certificaterequests/checks.go': [
    ['function', 'handleGenericIssuer', 'Event handler that enqueues CertificateRequests when a referenced generic Issuer changes.', ['event-handler', 'issuer', 'certificaterequest']],
    ['function', 'certificatesRequestsForGenericIssuer', 'Lists CertificateRequests that reference the given generic issuer.', ['list', 'issuer', 'certificaterequest']],
  ],
  'pkg/controller/certificaterequests/controller.go': [
    ['function', 'New', 'Creates a CertificateRequest controller bound to a specific issuer type and issuer constructor.', ['factory', 'controller', 'certificaterequest']],
    ['function', 'Register', 'Registers the generic CertificateRequest controller with informers, queue and the issuer implementation.', ['controller', 'registration', 'certificaterequest']],
    ['function', 'ProcessItem', 'Dequeues a CertificateRequest key and delegates handling to the controller sync.', ['controller', 'queue', 'certificaterequest']],
    ['class', 'Issuer', 'Interface implemented by issuer backends that sign CertificateRequests.', ['interface', 'issuer', 'signing']],
    ['class', 'Controller', 'Generic CertificateRequest controller wiring listers, client, recorder and issuer backend.', ['controller', 'certificaterequest', 'framework']],
  ],
  'pkg/controller/certificaterequests/fake/fake.go': [
    ['class', 'Issuer', 'Test issuer whose signing behaviour is supplied by a FakeSign callback.', ['test', 'fake', 'issuer']],
  ],
  'pkg/controller/certificaterequests/selfsigned/checks.go': [
    ['function', 'handleSecretReferenceWorkFunc', 'Event handler that maps Secret changes to CertificateRequests referencing the Secret.', ['event-handler', 'secret', 'certificaterequest']],
    ['function', 'certificateRequestsForSecret', 'Lists CertificateRequests whose self-signed issuer references the given Secret.', ['list', 'secret', 'certificaterequest']],
  ],
  'pkg/controller/certificaterequests/selfsigned/selfsigned.go': [
    ['function', 'init', 'Registers the self-signed issuer controller and its Secret informer event handler.', ['registration', 'self-signed', 'controller']],
    ['function', 'NewSelfSigned', 'Constructs the self-signed issuer with the Secret lister, reporter, recorder and signing function.', ['factory', 'issuer', 'self-signed']],
    ['class', 'SelfSigned', 'Self-signed issuer that generates keys and certificates for CertificateRequests.', ['issuer', 'self-signed', 'signing']],
  ],
  'pkg/controller/certificaterequests/sync.go': [
    ['function', 'Sync', 'Main CertificateRequest sync: validates approval and issuer state, signs the request and records conditions.', ['certificaterequest', 'sync', 'signing']],
    ['function', 'updateCertificateRequestStatusAndAnnotations', 'Persists status and annotation changes, aggregating errors from the update.', ['status', 'update', 'certificaterequest']],
    ['function', 'updateOrApply', 'Updates or server-side applies a CertificateRequest depending on feature gates.', ['update', 'apply', 'certificaterequest']],
    ['function', 'updateStatusOrApply', 'Updates CertificateRequest status via apply or UpdateStatus.', ['status', 'apply', 'certificaterequest']],
  ],
  'pkg/controller/certificaterequests/util/reporter.go': [
    ['function', 'NewReporter', 'Creates a Reporter with the given clock and event recorder.', ['factory', 'reporter', 'certificaterequest']],
    ['function', 'Failed', 'Marks a CertificateRequest as failed with a reason and message and emits an event.', ['status', 'failure', 'certificaterequest']],
    ['function', 'Denied', 'Marks a CertificateRequest as denied.', ['status', 'denial', 'certificaterequest']],
    ['function', 'InvalidRequest', 'Marks a CertificateRequest as having an invalid request along with the reason.', ['status', 'validation', 'certificaterequest']],
    ['function', 'Pending', 'Marks a CertificateRequest as pending with a reason and message.', ['status', 'pending', 'certificaterequest']],
    ['function', 'Ready', 'Marks a CertificateRequest as ready.', ['status', 'ready', 'certificaterequest']],
    ['class', 'Reporter', 'Records CertificateRequest conditions and Kubernetes events for lifecycle transitions.', ['reporter', 'conditions', 'certificaterequest']],
  ],
  'pkg/controller/certificaterequests/vault/vault.go': [
    ['function', 'NewVault', 'Constructs the Vault issuer with token creation, Secret lister and Vault client builder.', ['factory', 'issuer', 'vault']],
    ['class', 'Vault', 'Vault issuer that authenticates to Vault and signs requests through its PKI backend.', ['issuer', 'vault', 'signing']],
  ],
  'pkg/controller/certificaterequests/venafi/venafi.go': [
    ['function', 'NewVenafi', 'Constructs the Venafi issuer with its client builder, metrics and user agent.', ['factory', 'issuer', 'venafi']],
    ['class', 'Venafi', 'Venafi issuer that requests and retrieves certificates from TPP or Venafi Cloud.', ['issuer', 'venafi', 'signing']],
  ],
  'pkg/controller/certificates/informers.go': [
    ['function', 'EnqueueCertificatesForResourceUsingPredicates', 'Enqueues Certificates matching a predicate set when a related resource event occurs.', ['informer', 'queue', 'certificates']],
  ],
  'pkg/controller/certificates/issuing/internal/keystore.go': [
    ['function', 'encodePKCS12Keystore', 'Encodes a private key and certificate chain into a PKCS#12 keystore using the requested profile.', ['keystore', 'pkcs12', 'encoding']],
    ['function', 'encodePKCS12Truststore', 'Encodes CA certificates into a PKCS#12 truststore using the requested profile.', ['keystore', 'pkcs12', 'encoding']],
    ['function', 'encodeJKSKeystore', 'Encodes a private key and certificate chain into a JKS keystore.', ['keystore', 'jks', 'encoding']],
    ['function', 'encodeJKSTruststore', 'Encodes CA certificates into a JKS truststore.', ['keystore', 'jks', 'encoding']],
    ['function', 'addCAsToJKSStore', 'Adds CA certificates parsed from PEM data to an existing JKS store.', ['keystore', 'jks', 'utility']],
  ],
  'pkg/controller/certificates/issuing/internal/secret.go': [
    ['function', 'NewSecretsManager', 'Creates a SecretsManager for a Secret client, lister and field manager.', ['factory', 'secret', 'manager']],
    ['function', 'UpdateData', 'Applies Certificate secret data, owner references and metadata to the target Secret.', ['secret', 'apply', 'certificates']],
    ['function', 'setValues', 'Populates Secret data from Certificate data, including keystores and additional output formats.', ['secret', 'serialization', 'certificates']],
    ['function', 'getCertificateSecret', 'Retrieves the Certificate target Secret or returns an empty placeholder when it is absent.', ['secret', 'lookup', 'certificates']],
    ['function', 'setKeystores', 'Generates configured JKS and PKCS#12 keystores and adds them to the Secret data.', ['keystore', 'secret', 'certificates']],
    ['function', 'setAdditionalOutputFormats', 'Writes additional output formats such as combined PEM into the Secret data.', ['secret', 'output-format', 'certificates']],
    ['class', 'SecretsManager', 'Manages updates to Certificate Secrets, including server-side apply, keystores and output formats.', ['secret', 'manager', 'certificates']],
    ['class', 'SecretData', 'Aggregates the private key, certificate chain and issuer metadata written to a Certificate Secret.', ['data-model', 'secret', 'certificates']],
  ],
  'pkg/controller/certificates/issuing/issuing_controller.go': [
    ['function', 'NewController', 'Constructs the issuing controller, wiring informers, the secret manager and the post-issuance policy chain.', ['controller', 'certificates', 'constructor']],
    ['function', 'ProcessItem', 'Main reconcile loop for a Certificate: validates state, manages requests and drives issuance.', ['controller', 'certificates', 'issuing']],
    ['function', 'failIssueCertificate', 'Marks a Certificate Issuing condition as failed based on the request condition.', ['certificates', 'failure', 'status']],
    ['function', 'issueCertificate', 'Stores a signed certificate, CA and private key and updates the Certificate status.', ['certificates', 'issuing', 'secret']],
    ['function', 'updateOrApplyStatus', 'Updates or server-side applies Certificate status depending on feature gates.', ['status', 'apply', 'certificates']],
    ['function', 'Register', 'Registers the issuing controller with the controller context.', ['registration', 'controller', 'certificates']],
    ['class', 'controller', 'Issuing controller holding listers, client, secret manager and policy chain.', ['controller', 'certificates', 'issuing']],
    ['class', 'controllerWrapper', 'Thin wrapper exposing Register for the issuing controller.', ['wrapper', 'controller', 'registration']],
  ],
  'pkg/controller/certificates/issuing/secret_manager.go': [
    ['function', 'ensureSecretData', 'Ensures the Certificate Secret exists, matches the Certificate and passes post-issuance policies.', ['secret', 'certificates', 'policy']],
  ],
  'pkg/controller/certificates/issuing/temporary.go': [
    ['function', 'ensureTemporaryCertificate', 'Issues a temporary certificate when policy requires one and writes it to the Certificate Secret.', ['certificates', 'temporary-certificate', 'issuing']],
    ['function', 'certificateHasTemporaryCertificateAnnotation', 'Reports whether the Certificate carries the temporary certificate annotation.', ['annotation', 'predicate', 'certificates']],
  ],
  'pkg/controller/certificates/keymanager/keymanager_controller.go': [
    ['function', 'NewController', 'Constructs the key manager controller with certificate and Secret informers and a rate-limited queue.', ['controller', 'certificates', 'constructor']],
    ['function', 'ProcessItem', 'Reconciles the private key Secret lifecycle for a Certificate.', ['controller', 'certificates', 'private-key']],
    ['function', 'createNextPrivateKeyRotationPolicyNever', 'Handles the Never rotation policy by reusing or creating the next private key Secret.', ['private-key', 'rotation', 'certificates']],
    ['function', 'createAndSetNextPrivateKey', 'Creates a next private key and records its Secret name on the Certificate.', ['private-key', 'certificates', 'secret']],
    ['function', 'deleteSecretResources', 'Deletes the given private key Secrets, ignoring not-found errors.', ['cleanup', 'secret', 'private-key']],
    ['function', 'setNextPrivateKeySecretName', 'Sets the next private key Secret name on the Certificate.', ['annotation', 'private-key', 'certificates']],
    ['function', 'updateOrApplyStatus', 'Updates or applies Certificate status through the API client.', ['status', 'apply', 'certificates']],
    ['function', 'createNewPrivateKeySecret', 'Creates a new Secret containing an encoded private key and ownership metadata.', ['secret', 'private-key', 'creation']],
    ['function', 'Register', 'Registers the key manager controller with the controller context.', ['registration', 'controller', 'certificates']],
    ['class', 'controller', 'Key manager controller that creates and rotates private keys for Certificates.', ['controller', 'private-key', 'certificates']],
    ['class', 'controllerWrapper', 'Wrapper exposing Register for the key manager controller.', ['wrapper', 'controller', 'registration']],
  ],
  'pkg/controller/certificates/listers.go': [
    ['function', 'ListCertificateRequestsMatchingPredicates', 'Lists CertificateRequests matching the predicate selector.', ['lister', 'predicate', 'certificaterequest']],
    ['function', 'ListCertificatesMatchingPredicates', 'Lists Certificates matching the predicate selector.', ['lister', 'predicate', 'certificates']],
    ['function', 'ListSecretsMatchingPredicates', 'Lists Secrets matching the predicate selector.', ['lister', 'predicate', 'secret']],
  ],
  'pkg/controller/certificates/metrics/certificates.go': [
    ['function', 'NewController', 'Constructs the metrics controller and its Certificate informer handler.', ['controller', 'metrics', 'certificates']],
    ['function', 'Register', 'Registers the metrics controller with the controller context.', ['registration', 'metrics', 'controller']],
    ['class', 'controllerWrapper', 'Wrapper exposing Register for the Certificate metrics controller.', ['wrapper', 'metrics', 'registration']],
    ['class', 'controller', 'Metrics controller that observes Certificate resources.', ['controller', 'metrics', 'certificates']],
  ],
  'pkg/controller/certificates/readiness/readiness_controller.go': [
    ['function', 'NewController', 'Constructs the readiness controller with the policy chain, gatherer and informers.', ['controller', 'readiness', 'certificates']],
    ['function', 'ProcessItem', 'Evaluates the certificate policy chain for a Certificate and updates its Ready condition.', ['controller', 'readiness', 'policy']],
    ['function', 'updateOrApplyStatus', 'Updates or applies Certificate status depending on feature gates.', ['status', 'apply', 'certificates']],
    ['function', 'BuildReadyConditionFromChain', 'Builds a Ready condition from the result of a policy chain evaluation.', ['readiness', 'policy', 'conditions']],
    ['function', 'Register', 'Registers the readiness controller with the controller context.', ['registration', 'controller', 'certificates']],
    ['class', 'controller', 'Readiness controller holding the policy chain, listers, gatherer and evaluator.', ['controller', 'certificates', 'readiness']],
    ['class', 'controllerWrapper', 'Wrapper exposing Register for the readiness controller.', ['wrapper', 'controller', 'registration']],
  ],
  'pkg/controller/certificates/requestmanager/requestmanager_controller.go': [
    ['function', 'NewController', 'Constructs the request manager controller with certificate, request and Secret informers.', ['controller', 'certificates', 'constructor']],
    ['function', 'ProcessItem', 'Reconciles CertificateRequests for a Certificate, creating new requests as needed.', ['controller', 'certificates', 'certificaterequest']],
    ['function', 'deleteCurrentFailedRequests', 'Deletes failed CertificateRequests belonging to the current revision.', ['cleanup', 'certificaterequest', 'certificates']],
    ['function', 'deleteRequestsWithoutRevision', 'Deletes CertificateRequests that have no revision annotation.', ['cleanup', 'certificaterequest', 'certificates']],
    ['function', 'requestsWithRevision', 'Filters CertificateRequests to those carrying the given revision.', ['utility', 'certificaterequest', 'filtering']],
    ['function', 'deleteRequestsNotMatchingSpec', 'Deletes CertificateRequests whose spec no longer matches the Certificate.', ['cleanup', 'certificaterequest', 'validation']],
    ['function', 'createNewCertificateRequest', 'Creates a CertificateRequest for the next revision using the provided private key.', ['certificaterequest', 'creation', 'certificates']],
    ['function', 'waitForCertificateRequestToExist', 'Waits until a newly created CertificateRequest is visible through the lister.', ['certificaterequest', 'wait', 'lister']],
    ['function', 'Register', 'Registers the request manager controller with the controller context.', ['registration', 'controller', 'certificates']],
    ['class', 'controller', 'Request manager controller holding listers, client, clock and annotation copying configuration.', ['controller', 'certificaterequest', 'certificates']],
    ['class', 'controllerWrapper', 'Wrapper exposing Register for the request manager controller.', ['wrapper', 'controller', 'registration']],
  ],
};

const nodes = [];
const edges = [];
const nodeIds = new Set();
const skipped = [];

function addNode(n) {
  if (nodeIds.has(n.id)) throw new Error('duplicate node ' + n.id);
  nodeIds.add(n.id);
  nodes.push(n);
}

for (const f of prompt.files) {
  const m = meta[f.path];
  if (!m) throw new Error('missing meta ' + f.path);
  const res = byPath.get(f.path);
  if (!res) { skipped.push(f.path); continue; }
  addNode({
    id: 'file:' + f.path,
    type: 'file',
    name: path.basename(f.path),
    filePath: f.path,
    summary: m.summary,
    tags: m.tags,
    complexity: m.complexity,
    ...(m.notes ? { languageNotes: m.notes } : {}),
  });

  for (const [kind, name, summary, tags, complexity] of (sel[f.path] || [])) {
    let range;
    if (kind === 'function') {
      const fn = (res.functions || []).find(x => x.name === name);
      if (!fn) throw new Error('missing function ' + name + ' in ' + f.path);
      range = [fn.startLine, fn.endLine];
    } else {
      const cl = (res.classes || []).find(x => x.name === name);
      if (!cl) throw new Error('missing class ' + name + ' in ' + f.path);
      range = [cl.startLine, cl.endLine];
    }
    const id = kind + ':' + f.path + ':' + name;
    const span = range[1] - range[0] + 1;
    addNode({
      id,
      type: kind,
      name,
      filePath: f.path,
      lineRange: range,
      summary,
      tags,
      complexity: complexity || (span < 20 ? 'simple' : span < 60 ? 'moderate' : 'complex'),
    });
    edges.push({ source: 'file:' + f.path, target: id, type: 'contains', direction: 'forward', weight: 1.0 });
    if (/^[A-Z]/.test(name)) {
      edges.push({ source: 'file:' + f.path, target: id, type: 'exports', direction: 'forward', weight: 0.8 });
    }
  }

  // imports: exact 1:1 from batchImportData
  for (const target of prompt.batchImportData[f.path]) {
    edges.push({ source: 'file:' + f.path, target: 'file:' + target, type: 'imports', direction: 'forward', weight: 0.7 });
  }
}

// curated calls edges (source function -> target function)
const calls = [
  ['pkg/controller/certificate-shim/gateways/controller.go', 'Register', 'pkg/controller/certificate-shim/sync.go', 'SyncFnFor'],
  ['pkg/controller/certificate-shim/ingresses/controller.go', 'Register', 'pkg/controller/certificate-shim/sync.go', 'SyncFnFor'],
  ['pkg/controller/certificate-shim/sync.go', 'SyncFnFor', 'pkg/controller/certificate-shim/sync.go', 'validateIngressLike'],
  ['pkg/controller/certificate-shim/sync.go', 'SyncFnFor', 'pkg/controller/certificate-shim/sync.go', 'buildCertificates'],
  ['pkg/controller/certificate-shim/sync.go', 'SyncFnFor', 'pkg/controller/certificate-shim/sync.go', 'findCertificatesToBeRemoved'],
  ['pkg/controller/certificate-shim/sync.go', 'SyncFnFor', 'pkg/controller/certificate-shim/sync.go', 'extractExtraAnnotations'],
  ['pkg/controller/certificate-shim/sync.go', 'SyncFnFor', 'pkg/controller/certificate-shim/sync.go', 'issuerForIngressLike'],
  ['pkg/controller/certificate-shim/sync.go', 'buildCertificates', 'pkg/controller/certificate-shim/sync.go', 'mergeAnnotations'],
  ['pkg/controller/certificate-shim/sync.go', 'buildCertificates', 'pkg/controller/certificate-shim/sync.go', 'setIssuerSpecificConfig'],
  ['pkg/controller/certificate-shim/sync.go', 'certNeedsUpdate', 'pkg/controller/certificate-shim/sync.go', 'mergeAnnotations'],
  ['pkg/controller/certificaterequests/approver/approver.go', 'ProcessItem', 'pkg/controller/certificaterequests/approver/sync.go', 'Sync'],
  ['pkg/controller/certificaterequests/approver/sync.go', 'Sync', 'pkg/controller/certificaterequests/approver/sync.go', 'updateStatusOrApply'],
  ['pkg/controller/certificaterequests/selfsigned/selfsigned.go', 'init', 'pkg/controller/certificaterequests/selfsigned/checks.go', 'handleSecretReferenceWorkFunc'],
  ['pkg/controller/certificaterequests/selfsigned/checks.go', 'handleSecretReferenceWorkFunc', 'pkg/controller/certificaterequests/selfsigned/checks.go', 'certificateRequestsForSecret'],
  ['pkg/controller/certificaterequests/controller.go', 'Register', 'pkg/controller/certificaterequests/util/reporter.go', 'NewReporter'],
  ['pkg/controller/certificaterequests/checks.go', 'handleGenericIssuer', 'pkg/controller/certificaterequests/checks.go', 'certificatesRequestsForGenericIssuer'],
  ['pkg/controller/certificaterequests/ca/ca.go', 'NewCA', 'pkg/controller/certificaterequests/util/reporter.go', 'NewReporter'],
  ['pkg/controller/certificaterequests/sync.go', 'Sync', 'pkg/controller/certificaterequests/sync.go', 'updateCertificateRequestStatusAndAnnotations'],
  ['pkg/controller/certificaterequests/sync.go', 'updateCertificateRequestStatusAndAnnotations', 'pkg/controller/certificaterequests/sync.go', 'updateOrApply'],
  ['pkg/controller/certificaterequests/sync.go', 'Sync', 'pkg/controller/certificaterequests/sync.go', 'updateStatusOrApply'],
  ['pkg/controller/certificaterequests/vault/vault.go', 'NewVault', 'pkg/controller/certificaterequests/util/reporter.go', 'NewReporter'],
  ['pkg/controller/certificaterequests/venafi/venafi.go', 'NewVenafi', 'pkg/controller/certificaterequests/util/reporter.go', 'NewReporter'],
  ['pkg/controller/certificates/issuing/internal/secret.go', 'setKeystores', 'pkg/controller/certificates/issuing/internal/keystore.go', 'encodePKCS12Keystore'],
  ['pkg/controller/certificates/issuing/internal/secret.go', 'setKeystores', 'pkg/controller/certificates/issuing/internal/keystore.go', 'encodePKCS12Truststore'],
  ['pkg/controller/certificates/issuing/internal/secret.go', 'setKeystores', 'pkg/controller/certificates/issuing/internal/keystore.go', 'encodeJKSKeystore'],
  ['pkg/controller/certificates/issuing/internal/secret.go', 'setKeystores', 'pkg/controller/certificates/issuing/internal/keystore.go', 'encodeJKSTruststore'],
  ['pkg/controller/certificates/issuing/internal/secret.go', 'setValues', 'pkg/controller/certificates/issuing/internal/secret.go', 'setKeystores'],
  ['pkg/controller/certificates/issuing/internal/secret.go', 'setValues', 'pkg/controller/certificates/issuing/internal/secret.go', 'setAdditionalOutputFormats'],
  ['pkg/controller/certificates/issuing/issuing_controller.go', 'NewController', 'pkg/controller/certificates/issuing/internal/secret.go', 'NewSecretsManager'],
  ['pkg/controller/certificates/issuing/issuing_controller.go', 'NewController', 'pkg/controller/certificates/informers.go', 'EnqueueCertificatesForResourceUsingPredicates'],
  ['pkg/controller/certificates/issuing/issuing_controller.go', 'ProcessItem', 'pkg/controller/certificates/issuing/secret_manager.go', 'ensureSecretData'],
  ['pkg/controller/certificates/issuing/issuing_controller.go', 'ProcessItem', 'pkg/controller/certificates/issuing/temporary.go', 'ensureTemporaryCertificate'],
  ['pkg/controller/certificates/issuing/issuing_controller.go', 'ProcessItem', 'pkg/controller/certificates/issuing/issuing_controller.go', 'issueCertificate'],
  ['pkg/controller/certificates/issuing/issuing_controller.go', 'ProcessItem', 'pkg/controller/certificates/issuing/issuing_controller.go', 'failIssueCertificate'],
  ['pkg/controller/certificates/issuing/issuing_controller.go', 'ProcessItem', 'pkg/controller/certificates/issuing/issuing_controller.go', 'updateOrApplyStatus'],
  ['pkg/controller/certificates/issuing/secret_manager.go', 'ensureSecretData', 'pkg/controller/certificates/issuing/internal/secret.go', 'UpdateData'],
  ['pkg/controller/certificates/issuing/temporary.go', 'ensureTemporaryCertificate', 'pkg/controller/certificates/issuing/internal/secret.go', 'UpdateData'],
  ['pkg/controller/certificates/issuing/temporary.go', 'ensureTemporaryCertificate', 'pkg/controller/certificates/issuing/temporary.go', 'certificateHasTemporaryCertificateAnnotation'],
  ['pkg/controller/certificates/keymanager/keymanager_controller.go', 'ProcessItem', 'pkg/controller/certificates/listers.go', 'ListSecretsMatchingPredicates'],
  ['pkg/controller/certificates/keymanager/keymanager_controller.go', 'ProcessItem', 'pkg/controller/certificates/keymanager/keymanager_controller.go', 'createNextPrivateKeyRotationPolicyNever'],
  ['pkg/controller/certificates/keymanager/keymanager_controller.go', 'ProcessItem', 'pkg/controller/certificates/keymanager/keymanager_controller.go', 'createAndSetNextPrivateKey'],
  ['pkg/controller/certificates/keymanager/keymanager_controller.go', 'ProcessItem', 'pkg/controller/certificates/keymanager/keymanager_controller.go', 'deleteSecretResources'],
  ['pkg/controller/certificates/keymanager/keymanager_controller.go', 'createAndSetNextPrivateKey', 'pkg/controller/certificates/keymanager/keymanager_controller.go', 'createNewPrivateKeySecret'],
  ['pkg/controller/certificates/keymanager/keymanager_controller.go', 'createAndSetNextPrivateKey', 'pkg/controller/certificates/keymanager/keymanager_controller.go', 'setNextPrivateKeySecretName'],
  ['pkg/controller/certificates/keymanager/keymanager_controller.go', 'NewController', 'pkg/controller/certificates/informers.go', 'EnqueueCertificatesForResourceUsingPredicates'],
  ['pkg/controller/certificates/readiness/readiness_controller.go', 'NewController', 'pkg/controller/certificates/informers.go', 'EnqueueCertificatesForResourceUsingPredicates'],
  ['pkg/controller/certificates/readiness/readiness_controller.go', 'ProcessItem', 'pkg/controller/certificates/readiness/readiness_controller.go', 'BuildReadyConditionFromChain'],
  ['pkg/controller/certificates/requestmanager/requestmanager_controller.go', 'NewController', 'pkg/controller/certificates/informers.go', 'EnqueueCertificatesForResourceUsingPredicates'],
  ['pkg/controller/certificates/requestmanager/requestmanager_controller.go', 'ProcessItem', 'pkg/controller/certificates/requestmanager/requestmanager_controller.go', 'deleteCurrentFailedRequests'],
  ['pkg/controller/certificates/requestmanager/requestmanager_controller.go', 'ProcessItem', 'pkg/controller/certificates/requestmanager/requestmanager_controller.go', 'deleteRequestsWithoutRevision'],
  ['pkg/controller/certificates/requestmanager/requestmanager_controller.go', 'ProcessItem', 'pkg/controller/certificates/requestmanager/requestmanager_controller.go', 'deleteRequestsNotMatchingSpec'],
  ['pkg/controller/certificates/requestmanager/requestmanager_controller.go', 'ProcessItem', 'pkg/controller/certificates/requestmanager/requestmanager_controller.go', 'createNewCertificateRequest'],
  ['pkg/controller/certificates/requestmanager/requestmanager_controller.go', 'deleteRequestsWithoutRevision', 'pkg/controller/certificates/requestmanager/requestmanager_controller.go', 'requestsWithRevision'],
  ['pkg/controller/certificates/requestmanager/requestmanager_controller.go', 'createNewCertificateRequest', 'pkg/controller/certificates/requestmanager/requestmanager_controller.go', 'waitForCertificateRequestToExist'],
];

for (const [sf, sfn, tf, tfn] of calls) {
  const s = 'function:' + sf + ':' + sfn;
  const t = 'function:' + tf + ':' + tfn;
  if (!nodeIds.has(s)) throw new Error('missing calls source ' + s);
  if (!nodeIds.has(t)) throw new Error('missing calls target ' + t);
  if (s === t) continue;
  edges.push({ source: s, target: t, type: 'calls', direction: 'forward', weight: 0.8 });
}

// dedupe edges by source|target|type
const seen = new Set();
const uniq = [];
for (const e of edges) {
  const k = e.source + '|' + e.target + '|' + e.type;
  if (seen.has(k)) continue;
  seen.add(k);
  uniq.push(e);
}

// ---- partition ----
const files = [...prompt.files.map(f => f.path)].sort();
const nodeFile = new Map(nodes.map(n => [n.id, n.filePath]));
const base = uniq.filter(e => e.type !== 'calls');
const callEdges = uniq.filter(e => e.type === 'calls');

const nodesByFile = new Map(files.map(f => [f, []]));
for (const n of nodes) nodesByFile.get(n.filePath).push(n);
const baseByFile = new Map(files.map(f => [f, []]));
for (const e of base) baseByFile.get(nodeFile.get(e.source)).push(e);

// greedy sequential grouping, <=60 nodes and <=120 edges per part
const makeGroup = (fs) => {
  const set = new Set(fs);
  const g = { files: fs, nodes: [], edges: [] };
  for (const f of fs) {
    g.nodes.push(...nodesByFile.get(f));
    g.edges.push(...baseByFile.get(f));
  }
  for (const e of callEdges) {
    if (set.has(nodeFile.get(e.source)) && set.has(nodeFile.get(e.target))) g.edges.push(e);
  }
  return g;
};

const groups = [];
let curFiles = [];
for (const f of files) {
  const trial = [...curFiles, f];
  const g = makeGroup(trial);
  if (curFiles.length && (g.nodes.length > 60 || g.edges.length > 120)) {
    groups.push(makeGroup(curFiles));
    curFiles = [f];
  } else {
    curFiles = trial;
  }
}
if (curFiles.length) groups.push(makeGroup(curFiles));

// split any group that still exceeds the edge cap
for (let i = 0; i < groups.length; i++) {
  const g = groups[i];
  if (g.files.length > 1 && (g.edges.length > 120 || g.nodes.length > 60)) {
    const last = g.files[g.files.length - 1];
    groups.splice(i, 1, makeGroup(g.files.slice(0, -1)), makeGroup([last]));
    i--;
  }
}

const parts = groups.length;
fs.mkdirSync(path.join(UA, 'intermediate'), { recursive: true });
let totalNodes = 0, totalEdges = 0;
groups.forEach((g, idx) => {
  const out = { nodes: g.nodes, edges: g.edges };
  const file = path.join(UA, 'intermediate', `batch-3-part-${idx + 1}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  totalNodes += out.nodes.length;
  totalEdges += out.edges.length;
  console.log(`part ${idx + 1}: nodes=${out.nodes.length} edges=${out.edges.length} files=${g.files.length} [${g.files.join(', ')}]`);
});

// checks
const importsExpected = Object.values(prompt.batchImportData).reduce((a, b) => a + b.length, 0);
const importsActual = uniq.filter(e => e.type === 'imports').length;
console.log('PARTS', parts, 'TOTAL nodes', totalNodes, 'edges', totalEdges, 'imports', importsActual + '/' + importsExpected, 'skipped', skipped.length);
