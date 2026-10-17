import fs from 'fs';

const input = JSON.parse(fs.readFileSync('.ua/tmp/ua-file-analyzer-input-7.json', 'utf8'));
const importData = input.batchImportData;
const files = input.batchFiles.map(f => f.path).sort();

const F = {};

function file(path, summary, tags, complexity, languageNotes) {
  F[path] = { summary, tags, complexity, languageNotes, subs: [] };
}
function cls(path, name, start, end, summary, tags, complexity = 'simple', exported = true) {
  F[path].subs.push({ kind: 'class', name, start, end, summary, tags, complexity, exported });
}
function fn(path, name, start, end, summary, tags, complexity = 'simple', exported = true) {
  F[path].subs.push({ kind: 'function', name, start, end, summary, tags, complexity, exported });
}

/* ---------------- part 1 files ---------------- */

file('pkg/apis/acme/v1/types_order.go',
  'Defines the ACME v1 API types for Orders, their spec and status, plus the authorization and challenge structures returned by an ACME server.',
  ['api-types', 'acme', 'order', 'kubernetes-crd', 'data-model'], 'complex',
  'Kubernetes API types carrying kubebuilder markers that drive CRD generation, printer columns and the status subresource.');

cls('pkg/apis/acme/v1/types_order.go', 'Order', 36, 43,
  'Top-level namespaced Order resource representing a certificate order with an ACME server.', ['api-type', 'order', 'acme', 'resource'], 'simple');
cls('pkg/apis/acme/v1/types_order.go', 'OrderList', 48, 53,
  'List wrapper used by the Kubernetes API for Order collections.', ['api-type', 'order', 'list', 'kubernetes'], 'simple');
cls('pkg/apis/acme/v1/types_order.go', 'OrderSpec', 55, 97,
  'Desired Order state: DER-encoded CSR, issuer reference, common name, DNS names, IP addresses, duration and ACME profile.', ['api-type', 'order', 'spec', 'acme'], 'moderate');
cls('pkg/apis/acme/v1/types_order.go', 'OrderStatus', 99, 140,
  'Observed Order state including ACME URLs, authorizations, issued certificate, state, reason and failure time.', ['api-type', 'order', 'status', 'acme'], 'moderate');
cls('pkg/apis/acme/v1/types_order.go', 'ACMEAuthorization', 145, 179,
  'An ACME authorization that must be completed to validate a DNS name, including the offered challenge types.', ['api-type', 'authorization', 'acme', 'validation'], 'moderate');
cls('pkg/apis/acme/v1/types_order.go', 'ACMEChallenge', 184, 199,
  'A challenge offered by the ACME server for an authorization, identified by URL, token and challenge type.', ['api-type', 'challenge', 'acme'], 'simple');

file('pkg/apis/acme/v1/zz_generated.deepcopy.go',
  'Generated deep-copy implementations for every ACME v1 API type, providing the runtime.Object cloning required by Kubernetes clients and informer caches.',
  ['generated-code', 'deepcopy', 'kubernetes', 'acme', 'serialization'], 'complex',
  'deepcopy-gen boilerplate: every exported type gets DeepCopyInto/DeepCopy, and runtime.Objects additionally get DeepCopyObject.');

file('pkg/client/applyconfigurations/acme/v1/acmeauthorization.go',
  'Generated declarative apply configuration for ACMEAuthorization, with chainable setters used by server-side apply clients.',
  ['generated-code', 'apply-configuration', 'acme', 'authorization', 'builder'], 'moderate');

cls('pkg/client/applyconfigurations/acme/v1/acmeauthorization.go', 'ACMEAuthorizationApplyConfiguration', 27, 33,
  'Declarative mirror of ACMEAuthorization whose pointer fields distinguish unset values during server-side apply.', ['apply-configuration', 'acme', 'authorization', 'data-model'], 'simple');

file('pkg/client/applyconfigurations/acme/v1/acmechallengesolverdns01.go',
  'Generated apply configuration for ACMEChallengeSolverDNS01 exposing setters for every supported DNS-01 provider, including Akamai, CloudDNS, Cloudflare, Route53 and AzureDNS.',
  ['generated-code', 'apply-configuration', 'acme', 'dns01', 'solver'], 'moderate');

cls('pkg/client/applyconfigurations/acme/v1/acmechallengesolverdns01.go', 'ACMEChallengeSolverDNS01ApplyConfiguration', 27, 38,
  'Declarative DNS-01 solver configuration holding one optional provider block per supported DNS provider.', ['apply-configuration', 'solver', 'dns01', 'data-model'], 'simple');

file('pkg/client/applyconfigurations/acme/v1/challengestatus.go',
  'Generated apply configuration for ChallengeStatus with setters for processing, presented, reason and state.',
  ['generated-code', 'apply-configuration', 'acme', 'challenge', 'status'], 'moderate');

cls('pkg/client/applyconfigurations/acme/v1/challengestatus.go', 'ChallengeStatusApplyConfiguration', 27, 32,
  'Declarative mirror of ChallengeStatus used when applying status updates to Challenge resources.', ['apply-configuration', 'challenge', 'status', 'data-model'], 'simple');

file('pkg/client/applyconfigurations/acme/v1/orderstatus.go',
  'Generated apply configuration for OrderStatus covering the order URL, finalize URL, authorizations, certificate bytes, state, reason and failure time.',
  ['generated-code', 'apply-configuration', 'acme', 'order', 'status'], 'moderate');

cls('pkg/client/applyconfigurations/acme/v1/orderstatus.go', 'OrderStatusApplyConfiguration', 28, 36,
  'Declarative mirror of OrderStatus used when applying status updates to Order resources.', ['apply-configuration', 'order', 'status', 'data-model'], 'simple');

file('pkg/client/clientset/versioned/clientset.go',
  'Constructs the versioned cert-manager clientset, wiring the acme/v1 and certmanager/v1 typed clients onto a shared REST configuration with rate limiting and user agent defaults.',
  ['client-library', 'kubernetes', 'clientset', 'factory', 'api-client'], 'moderate');

cls('pkg/client/clientset/versioned/clientset.go', 'Interface', 32, 36,
  'Aggregate clientset interface exposing the AcmeV1, CertmanagerV1 and Discovery clients.', ['interface', 'clientset', 'api-client'], 'simple');
cls('pkg/client/clientset/versioned/clientset.go', 'Clientset', 39, 43,
  'Concrete clientset holding the generated API group clients and discovery client.', ['clientset', 'api-client', 'kubernetes'], 'simple');
fn('pkg/client/clientset/versioned/clientset.go', 'NewForConfig', 68, 82,
  'Builds a Clientset from a rest.Config, applying default rate limits and constructing each API group client.', ['factory', 'clientset', 'configuration'], 'moderate');
fn('pkg/client/clientset/versioned/clientset.go', 'NewForConfigAndClient', 88, 113,
  'Builds a Clientset from a rest.Config and an explicit HTTP client, leaving transport ownership to the caller.', ['factory', 'clientset', 'configuration'], 'complex');
fn('pkg/client/clientset/versioned/clientset.go', 'NewForConfigOrDie', 117, 123,
  'Wraps NewForConfig and panics on error, for use during process startup.', ['factory', 'clientset', 'startup'], 'simple');

file('pkg/client/clientset/versioned/fake/register.go',
  'Registers the cert-manager API schemes, codecs and parameter codecs used by the fake clientset in unit tests.',
  ['generated-code', 'test', 'fake-client', 'registration', 'kubernetes'], 'simple');

/* ---------------- part 2 files ---------------- */

file('pkg/client/clientset/versioned/scheme/register.go',
  'Scheme registration for the versioned clientset, adding acme/v1 and certmanager/v1 types together with their codecs and parameter codecs.',
  ['generated-code', 'scheme', 'registration', 'kubernetes', 'serialization'], 'simple');

file('pkg/client/clientset/versioned/typed/acme/v1/acme_client.go',
  'Generated typed client for the acme/v1 API group, exposing Challenge and Order accessors and constructing REST clients from shared configuration.',
  ['generated-code', 'api-client', 'clientset', 'acme', 'kubernetes'], 'moderate');

cls('pkg/client/clientset/versioned/typed/acme/v1/acme_client.go', 'AcmeV1Interface', 29, 33,
  'Interface for the acme/v1 API group exposing Challenge and Order clients plus the underlying REST client.', ['interface', 'api-client', 'acme'], 'simple');
cls('pkg/client/clientset/versioned/typed/acme/v1/acme_client.go', 'AcmeV1Client', 36, 38,
  'Concrete acme/v1 client holding the shared REST client and rate limiter.', ['api-client', 'clientset', 'acme'], 'simple');
fn('pkg/client/clientset/versioned/typed/acme/v1/acme_client.go', 'NewForConfig', 51, 59,
  'Creates an acme/v1 client from a rest.Config, copying and tuning the configuration per resource.', ['factory', 'api-client', 'configuration'], 'moderate');
fn('pkg/client/clientset/versioned/typed/acme/v1/acme_client.go', 'NewForConfigAndClient', 63, 71,
  'Creates an acme/v1 client from a rest.Config and a caller-supplied HTTP client.', ['factory', 'api-client', 'configuration'], 'moderate');
fn('pkg/client/clientset/versioned/typed/acme/v1/acme_client.go', 'NewForConfigOrDie', 75, 81,
  'Panics if the acme/v1 client cannot be constructed, for startup-time wiring.', ['factory', 'api-client', 'startup'], 'simple');
fn('pkg/client/clientset/versioned/typed/acme/v1/acme_client.go', 'setConfigDefaults', 88, 97,
  'Applies the acme/v1 group version and negotiated serializer defaults to a copied rest.Config.', ['configuration', 'api-client', 'defaults'], 'moderate', false);

file('pkg/client/clientset/versioned/typed/acme/v1/doc.go',
  'Package documentation stub marking the typed acme/v1 client package as generated by client-gen.',
  ['generated-code', 'documentation', 'api-client', 'acme'], 'simple');

file('pkg/client/clientset/versioned/typed/acme/v1/fake/fake_acme_client.go',
  'Fake implementation of the acme/v1 typed client returning fake Challenge and Order clients backed by the testing object tracker.',
  ['generated-code', 'test', 'fake-client', 'acme', 'api-client'], 'simple');

cls('pkg/client/clientset/versioned/typed/acme/v1/fake/fake_acme_client.go', 'FakeAcmeV1', 27, 29,
  'Fake acme/v1 client exposing fake Challenge and Order clients for unit tests.', ['fake-client', 'test', 'acme', 'api-client'], 'simple');

file('pkg/client/clientset/versioned/typed/acme/v1/generated_expansion.go',
  'Marker interfaces that let external packages extend the generated acme/v1 Challenge and Order typed clients.',
  ['generated-code', 'extension-point', 'api-client', 'acme'], 'simple');

file('pkg/client/informers/externalversions/acme/interface.go',
  'Informer group entry point that exposes the acme/v1 informer interface through the shared informer factory.',
  ['generated-code', 'informer', 'acme', 'factory', 'kubernetes'], 'simple');

cls('pkg/client/informers/externalversions/acme/interface.go', 'Interface', 27, 30,
  'Interface for the acme API group giving access to its versioned informer interface.', ['interface', 'informer', 'acme'], 'simple');

file('pkg/client/informers/externalversions/acme/v1/challenge.go',
  'Generated shared informer and lister accessors for acme/v1 Challenge resources, with filtered and unfiltered constructors.',
  ['generated-code', 'informer', 'acme', 'challenge', 'cache'], 'moderate');

cls('pkg/client/informers/externalversions/acme/v1/challenge.go', 'ChallengeInformer', 37, 40,
  'Shared informer interface for Challenge resources exposing the informer and its lister.', ['informer', 'challenge', 'acme', 'interface'], 'simple');
fn('pkg/client/informers/externalversions/acme/v1/challenge.go', 'NewChallengeInformer', 51, 53,
  'Creates a Challenge informer that watches all namespaces.', ['factory', 'informer', 'challenge'], 'simple');
fn('pkg/client/informers/externalversions/acme/v1/challenge.go', 'NewFilteredChallengeInformer', 58, 90,
  'Creates a Challenge informer restricted to a namespace with optional list-option tweaks, indexing and a resync period.', ['factory', 'informer', 'challenge', 'filtering'], 'complex');

file('pkg/client/informers/externalversions/acme/v1/interface.go',
  'Informer version interface exposing Challenge and Order informers plus the version constructor.',
  ['generated-code', 'informer', 'acme', 'factory', 'interface'], 'simple');

cls('pkg/client/informers/externalversions/acme/v1/interface.go', 'Interface', 26, 31,
  'Accessor interface for acme/v1 Challenge and Order informers.', ['interface', 'informer', 'acme'], 'simple');

/* ---------------- part 3 files ---------------- */

file('pkg/client/informers/externalversions/acme/v1/order.go',
  'Generated shared informer and lister accessors for acme/v1 Order resources, with filtered and unfiltered constructors.',
  ['generated-code', 'informer', 'acme', 'order', 'cache'], 'moderate');

cls('pkg/client/informers/externalversions/acme/v1/order.go', 'OrderInformer', 37, 40,
  'Shared informer interface for Order resources exposing the informer and its lister.', ['informer', 'order', 'acme', 'interface'], 'simple');
fn('pkg/client/informers/externalversions/acme/v1/order.go', 'NewOrderInformer', 51, 53,
  'Creates an Order informer that watches all namespaces.', ['factory', 'informer', 'order'], 'simple');
fn('pkg/client/informers/externalversions/acme/v1/order.go', 'NewFilteredOrderInformer', 58, 90,
  'Creates an Order informer restricted to a namespace with optional list-option tweaks, indexing and a resync period.', ['factory', 'informer', 'order', 'filtering'], 'complex');

file('pkg/client/informers/externalversions/certmanager/interface.go',
  'Informer group entry point that exposes the certmanager/v1 informer interface through the shared informer factory.',
  ['generated-code', 'informer', 'certmanager', 'factory', 'kubernetes'], 'simple');

cls('pkg/client/informers/externalversions/certmanager/interface.go', 'Interface', 27, 30,
  'Interface for the certmanager API group giving access to its versioned informer interface.', ['interface', 'informer', 'certmanager'], 'simple');

file('pkg/client/informers/externalversions/certmanager/v1/interface.go',
  'Informer version interface exposing Certificate, CertificateRequest, ClusterIssuer and Issuer informers.',
  ['generated-code', 'informer', 'certmanager', 'factory', 'interface'], 'moderate');

cls('pkg/client/informers/externalversions/certmanager/v1/interface.go', 'Interface', 26, 35,
  'Accessor interface for the four certmanager/v1 resource informers.', ['interface', 'informer', 'certmanager'], 'simple');

file('pkg/client/informers/externalversions/factory.go',
  'Core shared informer factory that lazily builds, starts and synchronises informers for every cert-manager resource, with functional options for namespace scoping, resync periods and list-option tweaks.',
  ['generated-code', 'informer', 'factory', 'cache', 'kubernetes'], 'complex',
  'Uses functional options and an informer map guarded by a mutex so informers are created at most once per resource.');

cls('pkg/client/informers/externalversions/factory.go', 'sharedInformerFactory', 39, 57,
  'Concrete factory implementation holding the clientset, resync period, namespace filter, custom resync config and informer cache.', ['informer', 'factory', 'cache'], 'moderate', false);
cls('pkg/client/informers/externalversions/factory.go', 'SharedInformerFactory', 227, 260,
  'Public factory interface for starting informers and obtaining group-specific informer interfaces.', ['interface', 'informer', 'factory'], 'moderate');
fn('pkg/client/informers/externalversions/factory.go', 'NewSharedInformerFactoryWithOptions', 107, 123,
  'Constructs a shared informer factory from a clientset and functional options.', ['factory', 'informer', 'configuration'], 'moderate');
fn('pkg/client/informers/externalversions/factory.go', 'Start', 125, 147,
  'Starts every requested informer exactly once and waits for their caches to synchronise.', ['informer', 'lifecycle', 'cache'], 'moderate');
fn('pkg/client/informers/externalversions/factory.go', 'Shutdown', 149, 156,
  'Stops all informers owned by the factory.', ['informer', 'lifecycle', 'shutdown'], 'moderate');
fn('pkg/client/informers/externalversions/factory.go', 'WaitForCacheSync', 158, 177,
  'Blocks until all started informer caches are synchronised or the stop channel closes.', ['informer', 'cache', 'synchronisation'], 'moderate');
fn('pkg/client/informers/externalversions/factory.go', 'InformerFor', 181, 201,
  'Returns the informer for a resource, creating and wiring it on first use under a mutex.', ['informer', 'factory', 'cache'], 'moderate');

file('pkg/client/informers/externalversions/generic.go',
  'Generic informer adapter that maps GroupVersionResource values to concrete cert-manager informers and listers.',
  ['generated-code', 'informer', 'generic', 'adapter', 'kubernetes'], 'moderate');

cls('pkg/client/informers/externalversions/generic.go', 'GenericInformer', 32, 35,
  'Generic informer interface exposing Informer and Lister without a concrete resource type.', ['interface', 'informer', 'generic'], 'simple');
fn('pkg/client/informers/externalversions/generic.go', 'ForResource', 54, 75,
  'Resolves a GroupVersionResource to the matching typed informer across acme/v1 and certmanager/v1 resources.', ['resolver', 'informer', 'generic'], 'complex');

file('pkg/client/informers/externalversions/internalinterfaces/factory_interfaces.go',
  'Shared internal interfaces and functional option types used by all generated informer packages.',
  ['generated-code', 'informer', 'interface', 'shared-types', 'kubernetes'], 'simple');

cls('pkg/client/informers/externalversions/internalinterfaces/factory_interfaces.go', 'SharedInformerFactory', 34, 37,
  'Minimal factory contract consumed by generated informer packages to obtain shared informers.', ['interface', 'informer', 'factory'], 'simple');

file('pkg/client/listers/acme/v1/challenge.go',
  'Generated read-only lister for acme/v1 Challenge objects, backed by an informer indexer with cluster-wide and namespace-scoped access.',
  ['generated-code', 'lister', 'acme', 'challenge', 'cache'], 'moderate');

cls('pkg/client/listers/acme/v1/challenge.go', 'ChallengeLister', 30, 37,
  'Cluster-wide read interface for listing and looking up Challenge objects from the cache.', ['lister', 'challenge', 'acme', 'interface'], 'simple');
cls('pkg/client/listers/acme/v1/challenge.go', 'ChallengeNamespaceLister', 56, 64,
  'Namespace-scoped lister for Challenge objects with list and get operations.', ['lister', 'challenge', 'namespace', 'interface'], 'simple');
fn('pkg/client/listers/acme/v1/challenge.go', 'NewChallengeLister', 45, 47,
  'Wraps a cache indexer in a ChallengeLister.', ['factory', 'lister', 'challenge'], 'simple');

file('pkg/client/listers/acme/v1/expansion_generated.go',
  'Marker expansion interfaces that let external packages extend the generated acme/v1 Challenge and Order listers.',
  ['generated-code', 'extension-point', 'lister', 'acme'], 'simple');

/* ---------------- part 4 files ---------------- */

file('pkg/client/listers/acme/v1/order.go',
  'Generated read-only lister for acme/v1 Order objects, backed by an informer indexer with cluster-wide and namespace-scoped access.',
  ['generated-code', 'lister', 'acme', 'order', 'cache'], 'moderate');

cls('pkg/client/listers/acme/v1/order.go', 'OrderLister', 30, 37,
  'Cluster-wide read interface for listing and looking up Order objects from the cache.', ['lister', 'order', 'acme', 'interface'], 'simple');
cls('pkg/client/listers/acme/v1/order.go', 'OrderNamespaceLister', 56, 64,
  'Namespace-scoped lister for Order objects with list and get operations.', ['lister', 'order', 'namespace', 'interface'], 'simple');
fn('pkg/client/listers/acme/v1/order.go', 'NewOrderLister', 45, 47,
  'Wraps a cache indexer in an OrderLister.', ['factory', 'lister', 'order'], 'simple');

file('pkg/controller/acmechallenges/finalizer.go',
  'Helpers that decide whether the ACME cleanup finalizer must be added to a Challenge and whether other finalizers still block its removal.',
  ['finalizer', 'challenge', 'cleanup', 'lifecycle', 'kubernetes'], 'simple');

file('pkg/controller/acmechallenges/scheduler/scheduler.go',
  'Implements the ACME challenge scheduler that selects which pending Challenges to process given concurrency limits, state priority and deduplication rules.',
  ['scheduler', 'challenge', 'acme', 'concurrency', 'controller'], 'complex');

cls('pkg/controller/acmechallenges/scheduler/scheduler.go', 'Scheduler', 35, 39,
  'Challenge scheduler holding the challenge lister, logger and maximum concurrency setting.', ['scheduler', 'challenge', 'concurrency'], 'simple');
fn('pkg/controller/acmechallenges/scheduler/scheduler.go', 'New', 42, 45,
  'Constructs a Scheduler bound to a Challenge lister and a concurrency limit.', ['factory', 'scheduler', 'challenge'], 'simple');
fn('pkg/controller/acmechallenges/scheduler/scheduler.go', 'ScheduleN', 51, 59,
  'Lists all cached Challenges and returns at most N that should start processing.', ['scheduler', 'challenge', 'entry-point'], 'moderate');
fn('pkg/controller/acmechallenges/scheduler/scheduler.go', 'scheduleN', 61, 77,
  'Caps the requested batch size by the remaining concurrency budget before selecting candidates.', ['scheduler', 'concurrency', 'selection'], 'moderate', false);
fn('pkg/controller/acmechallenges/scheduler/scheduler.go', 'determineChallengeCandidates', 95, 135,
  'Filters out in-progress, complete and duplicate Challenges and returns the remaining candidates oldest-first.', ['scheduler', 'filtering', 'ordering'], 'complex', false);
fn('pkg/controller/acmechallenges/scheduler/scheduler.go', 'compareChallenges', 180, 202,
  'Orders Challenges by state priority and then by creation timestamp so older work is preferred.', ['ordering', 'comparison', 'challenge'], 'moderate', false);
fn('pkg/controller/acmechallenges/scheduler/scheduler.go', 'sortChallenges', 207, 225,
  'Stable sort of Challenges using the scheduler priority comparator.', ['ordering', 'sorting', 'challenge'], 'moderate', false);
fn('pkg/controller/acmechallenges/scheduler/scheduler.go', 'dedupeChallenges', 228, 242,
  'Removes duplicate Challenges that share the same authorization URL, keeping the oldest.', ['deduplication', 'challenge', 'scheduler'], 'moderate', false);

file('pkg/controller/acmechallenges/update.go',
  'Updates Challenge finalizers and status either through plain Update calls or server-side apply, depending on the ServerSideApply feature gate.',
  ['update', 'server-side-apply', 'challenge', 'feature-gate', 'controller'], 'moderate');

cls('pkg/controller/acmechallenges/update.go', 'objectUpdater', 44, 46,
  'Abstraction over the logic that reconciles an existing Challenge with a desired one.', ['interface', 'update', 'challenge'], 'simple', false);
cls('pkg/controller/acmechallenges/update.go', 'defaultObjectUpdater', 48, 50,
  'Updater that delegates the actual write to an objectUpdateClient implementation.', ['update', 'challenge', 'delegation'], 'simple', false);
cls('pkg/controller/acmechallenges/update.go', 'objectUpdateClientSSA', 137, 140,
  'Update client that writes Challenges and their status through server-side apply with a fixed field manager.', ['server-side-apply', 'update', 'challenge'], 'simple', false);
fn('pkg/controller/acmechallenges/update.go', 'newObjectUpdater', 52, 63,
  'Chooses between the plain update client and the server-side apply client based on the ServerSideApply feature gate.', ['factory', 'feature-gate', 'update'], 'moderate', false);
fn('pkg/controller/acmechallenges/update.go', 'updateObject', 75, 123,
  'Rejects changes outside finalizers and status, then applies both updates and aggregates their errors.', ['update', 'validation', 'error-handling'], 'complex', false);

file('pkg/controller/acmeorders/checks.go',
  'Event handler helpers that map Issuer and ClusterIssuer changes to the ACME Orders referencing them and enqueue those Orders for reconciliation.',
  ['event-handler', 'order', 'issuer', 'workqueue', 'controller'], 'moderate');

fn('pkg/controller/acmeorders/checks.go', 'handleGenericIssuerFunc', 32, 55,
  'Builds an event handler that resolves affected Orders for a changed Issuer and adds them to the work queue.', ['event-handler', 'workqueue', 'issuer'], 'moderate', false);
fn('pkg/controller/acmeorders/checks.go', 'ordersForGenericIssuer', 57, 83,
  'Lists all Orders and filters them by issuer kind, namespace and name to find those observing the given issuer.', ['filtering', 'order', 'issuer'], 'moderate', false);

file('pkg/controller/acmeorders/selectors/dns_names.go',
  'DNS name selector used by ACME solver matching to accept certificates whose DNS names appear in the selector allow list.',
  ['selector', 'dns', 'solver', 'matching', 'acme'], 'simple');

fn('pkg/controller/acmeorders/selectors/dns_names.go', 'DNSNames', 27, 31,
  'Constructs a selector that matches the DNS names explicitly listed on a solver selector.', ['factory', 'selector', 'dns'], 'simple');
cls('pkg/controller/acmeorders/selectors/dns_names.go', 'dnsNamesSelector', 33, 35,
  'Selector implementation holding the allowed DNS names.', ['selector', 'dns', 'matching'], 'simple', false);
fn('pkg/controller/acmeorders/selectors/dns_names.go', 'Matches', 37, 47,
  'Returns true and a score of 1 when the DNS name is in the allow list, or true with score 0 when the list is empty.', ['matching', 'dns', 'scoring'], 'simple');

file('pkg/controller/acmeorders/selectors/dns_zones.go',
  'DNS zone selector that matches certificate DNS names against allowed zones using label-aware domain comparison.',
  ['selector', 'dns', 'zone', 'solver', 'acme'], 'simple');

fn('pkg/controller/acmeorders/selectors/dns_zones.go', 'DNSZones', 26, 30,
  'Constructs a selector that matches DNS names falling inside any configured zone.', ['factory', 'selector', 'dns'], 'simple');
cls('pkg/controller/acmeorders/selectors/dns_zones.go', 'dnsZonesSelector', 32, 34,
  'Selector implementation holding the allowed DNS zones.', ['selector', 'dns', 'zone'], 'simple', false);
fn('pkg/controller/acmeorders/selectors/dns_zones.go', 'Matches', 36, 54,
  'Uses label counting to find the most specific zone containing the DNS name and returns its label count as the score.', ['matching', 'dns', 'scoring'], 'moderate');

file('pkg/controller/acmeorders/selectors/labels.go',
  'Label selector that requires certificate metadata to carry all labels declared on an ACME challenge solver selector.',
  ['selector', 'labels', 'metadata', 'solver', 'acme'], 'simple');

fn('pkg/controller/acmeorders/selectors/labels.go', 'Labels', 25, 29,
  'Constructs a selector from the match labels declared on a solver selector.', ['factory', 'selector', 'labels'], 'simple');
cls('pkg/controller/acmeorders/selectors/labels.go', 'labelSelector', 31, 33,
  'Selector implementation holding the required label set.', ['selector', 'labels', 'matching'], 'simple', false);
fn('pkg/controller/acmeorders/selectors/labels.go', 'Matches', 35, 52,
  'Checks that every required label is present with the exact value and returns the number of matched labels.', ['matching', 'labels', 'scoring'], 'moderate');

/* ---------------- build nodes / edges ---------------- */

const nodes = [];
const edges = [];
const missing = files.filter(f => !F[f]);
if (missing.length) throw new Error('missing spec for: ' + missing.join(', '));
const extra = Object.keys(F).filter(f => !files.includes(f));
if (extra.length) throw new Error('spec for non-batch file: ' + extra.join(', '));

for (const path of files) {
  const spec = F[path];
  nodes.push({
    id: `file:${path}`,
    type: 'file',
    name: path.split('/').pop(),
    filePath: path,
    summary: spec.summary,
    tags: spec.tags,
    complexity: spec.complexity,
    ...(spec.languageNotes ? { languageNotes: spec.languageNotes } : {})
  });
  for (const sub of spec.subs) {
    const id = `${sub.kind}:${path}:${sub.name}`;
    nodes.push({
      id,
      type: sub.kind,
      name: sub.name,
      filePath: path,
      lineRange: [sub.start, sub.end],
      summary: sub.summary,
      tags: sub.tags,
      complexity: sub.complexity
    });
    edges.push({ source: `file:${path}`, target: id, type: 'contains', direction: 'forward', weight: 1.0 });
    if (sub.exported) {
      edges.push({ source: `file:${path}`, target: id, type: 'exports', direction: 'forward', weight: 0.8 });
    }
  }
}

for (const path of files) {
  for (const target of importData[path]) {
    if (target === path) continue;
    edges.push({ source: `file:${path}`, target: `file:${target}`, type: 'imports', direction: 'forward', weight: 0.7 });
  }
}

const CALLS = [
  ['pkg/client/clientset/versioned/clientset.go', 'function:pkg/client/clientset/versioned/clientset.go:NewForConfigAndClient', 'function:pkg/client/clientset/versioned/typed/acme/v1/acme_client.go:NewForConfig'],
  ['pkg/client/clientset/versioned/clientset.go', 'function:pkg/client/clientset/versioned/clientset.go:NewForConfigAndClient', 'function:pkg/client/clientset/versioned/typed/certmanager/v1/certmanager_client.go:NewForConfig'],
  ['pkg/controller/acmechallenges/scheduler/scheduler.go', 'function:pkg/controller/acmechallenges/scheduler/scheduler.go:determineChallengeCandidates', 'function:pkg/acme/util.go:IsFinalState'],
  ['pkg/controller/acmechallenges/scheduler/scheduler.go', 'function:pkg/controller/acmechallenges/scheduler/scheduler.go:determineChallengeCandidates', 'function:pkg/acme/util.go:IsFailureState'],
  ['pkg/controller/acmechallenges/update.go', 'class:pkg/controller/acmechallenges/update.go:objectUpdateClientSSA', 'function:internal/controller/challenges/apply.go:Apply'],
  ['pkg/controller/acmechallenges/update.go', 'class:pkg/controller/acmechallenges/update.go:objectUpdateClientSSA', 'function:internal/controller/challenges/apply.go:ApplyStatus'],
  ['pkg/controller/acmeorders/checks.go', 'function:pkg/controller/acmeorders/checks.go:handleGenericIssuerFunc', 'function:pkg/controller/acmeorders/checks.go:ordersForGenericIssuer'],
];
for (const [src, source, target] of CALLS) {
  edges.push({ source, target, type: 'calls', direction: 'forward', weight: 0.8 });
}

/* ---------------- validate ---------------- */

const ids = new Set();
for (const n of nodes) {
  if (ids.has(n.id)) throw new Error('duplicate node id: ' + n.id);
  ids.add(n.id);
}
for (const e of edges) {
  if (e.source === e.target) throw new Error('self edge: ' + e.source);
}

const expectedImports = files.reduce((a, p) => a + importData[p].length, 0);
const actualImports = edges.filter(e => e.type === 'imports').length;
if (expectedImports !== actualImports) throw new Error(`imports mismatch ${actualImports} != ${expectedImports}`);

/* ---------------- partition & write ---------------- */

let parts = Math.ceil(Math.max(nodes.length / 60, edges.length / 120));
function buildChunks(p) {
  const size = Math.ceil(files.length / p);
  const out = [];
  for (let i = 0; i < files.length; i += size) out.push(new Set(files.slice(i, i + size)));
  return out;
}
let chunks = buildChunks(parts);
// Rebalance if sequential chunking leaves a part over the size limits.
for (;;) {
  const over = chunks.some(chunk => {
    const pids = new Set(nodes.filter(n => chunk.has(n.filePath)).map(n => n.id));
    return pids.size > 60 || edges.filter(e => pids.has(e.source)).length > 120;
  });
  if (!over || parts >= files.length) break;
  parts += 1;
  chunks = buildChunks(parts);
}

fs.mkdirSync('.ua/intermediate', { recursive: true });
let totalN = 0, totalE = 0;
chunks.forEach((chunk, idx) => {
  const pn = nodes.filter(n => chunk.has(n.filePath));
  const pids = new Set(pn.map(n => n.id));
  const pe = edges.filter(e => pids.has(e.source));
  const k = idx + 1;
  fs.writeFileSync(`.ua/intermediate/batch-7-part-${k}.json`, JSON.stringify({ nodes: pn, edges: pe }, null, 2));
  totalN += pn.length; totalE += pe.length;
  console.log(`part ${k}: files=${chunk.size} nodes=${pn.length} edges=${pe.length}`);
});
console.log(`TOTAL nodes=${nodes.length} edges=${edges.length} imports=${actualImports} parts=${parts} writtenN=${totalN} writtenE=${totalE}`);
