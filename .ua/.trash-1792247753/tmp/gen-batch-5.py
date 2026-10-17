import json, math, os

ROOT = "/Users/samtyga/Desktop/work/cert-manager"
DISPATCH = os.path.join(ROOT, ".ua/tmp/prompts/batch-5.json")
OUT = os.path.join(ROOT, ".ua/intermediate")

with open(DISPATCH) as f:
    dispatch = json.load(f)

import_data = dispatch["batchImportData"]

FILES = {
    "pkg/issuer/factory.go": (
        "Implements the global issuer constructor registry and the Factory that resolves a GenericIssuer to a concrete issuer implementation.",
        ["issuer", "factory", "registry", "dispatch", "plugin"],
        "moderate",
        [
            ("class", "Factory", 51, 53, "Interface for resolving a GenericIssuer to a concrete issuer implementation.", ["issuer", "interface", "factory"]),
            ("function", "RegisterIssuer", 42, 46, "Registers an issuer constructor under a unique name for later lookup by the factory.", ["registry", "issuer", "factory"]),
            ("function", "NewFactory", 62, 64, "Creates the default Factory bound to a controller Context.", ["factory", "constructor", "issuer"]),
            ("function", "IssuerFor", 71, 84, "Resolves the issuer kind and name to a registered constructor and instantiates it, returning an error for unknown issuers.", ["factory", "dispatch", "error-handling"]),
        ],
    ),
    "pkg/issuer/fake/factory.go": (
        "Test fake implementing the issuer Factory interface with a pluggable IssuerForFunc.",
        ["test-double", "issuer", "factory", "fake"],
        "simple",
        [
            ("class", "Factory", 24, 26, "Configurable fake of the issuer Factory interface.", ["test-double", "factory", "issuer"]),
            ("function", "IssuerFor", 30, 32, "Delegates issuer resolution to IssuerForFunc so tests can stub the result.", ["test-double", "delegation", "factory"]),
        ],
    ),
    "pkg/issuer/fake/helper.go": (
        "Test fake implementing the issuer Helper interface via a configurable GetGenericIssuerFunc.",
        ["test-double", "issuer", "helper", "fake"],
        "simple",
        [
            ("class", "Helper", 25, 27, "Configurable fake of the issuer Helper interface.", ["test-double", "helper", "issuer"]),
            ("function", "GetGenericIssuer", 31, 33, "Delegates issuer lookup to GetGenericIssuerFunc for stubbing in tests.", ["test-double", "delegation", "lookup"]),
        ],
    ),
    "pkg/issuer/fake/issuer.go": (
        "Test fake implementing the issuer Interface with injectable Setup and Issue functions.",
        ["test-double", "issuer", "fake", "setup"],
        "simple",
        [
            ("class", "Issuer", 26, 29, "Configurable fake of the issuer Interface with injectable setup and issue hooks.", ["test-double", "issuer", "fake"]),
            ("function", "Setup", 36, 38, "Delegates issuer setup to SetupFunc.", ["test-double", "delegation", "setup"]),
            ("function", "Issue", 42, 44, "Delegates certificate issuance to IssueFunc.", ["test-double", "delegation", "issuance"]),
        ],
    ),
    "pkg/issuer/helper.go": (
        "Provides a Helper that looks up Issuer or ClusterIssuer resources by IssuerReference and namespace.",
        ["issuer", "lookup", "helper", "kubernetes", "lister"],
        "moderate",
        [
            ("class", "Helper", 29, 31, "Interface for resolving IssuerReferences to Issuer or ClusterIssuer resources.", ["issuer", "interface", "lookup"]),
            ("function", "NewHelper", 45, 50, "Constructs a Helper backed by the provided Issuer and ClusterIssuer listers.", ["helper", "constructor", "lister"]),
            ("function", "GetGenericIssuer", 57, 74, "Looks up the referenced Issuer in the namespace or the ClusterIssuer for cluster-scoped references.", ["lookup", "issuer", "kubernetes", "error-handling"]),
        ],
    ),
    "pkg/issuer/issuer.go": (
        "Defines the issuer Interface contract and IssueResponse payload shared by all issuer implementations.",
        ["issuer", "interface", "type-definition", "contracts"],
        "simple",
        [
            ("class", "Interface", 25, 30, "Contract every issuer implementation must satisfy via Setup.", ["issuer", "interface", "contracts"]),
            ("class", "IssueResponse", 32, 49, "Issued certificate, private key, and CA bytes to persist into the target Secret.", ["issuer", "type-definition", "certificate", "secret"]),
        ],
    ),
    "pkg/issuer/selfsigned/selfsigned.go": (
        "SelfSigned issuer implementation that registers itself with the issuer factory and wires the secret lister.",
        ["issuer", "self-signed", "registration", "factory"],
        "simple",
        [
            ("class", "SelfSigned", 28, 32, "Issuer implementation that self-signs certificates using the controller context.", ["issuer", "self-signed", "certificate"]),
            ("function", "NewSelfSigned", 34, 41, "Builds a SelfSigned issuer and wires the Kubernetes secret lister.", ["constructor", "issuer", "secrets"]),
        ],
    ),
    "pkg/issuer/selfsigned/setup.go": (
        "Marks SelfSigned issuers Ready unconditionally, since no external service needs bootstrapping.",
        ["issuer", "setup", "conditions", "self-signed"],
        "simple",
        [
            ("function", "Setup", 31, 34, "Sets a Ready condition on the issuer without any external checks.", ["setup", "conditions", "issuer"]),
        ],
    ),
    "pkg/issuer/vault/setup.go": (
        "Validates Vault issuer configuration, builds the Vault client, and reports readiness conditions for auth and seal state.",
        ["issuer", "vault", "validation", "conditions"],
        "moderate",
        [
            ("function", "Setup", 54, 149, "Validates Vault auth settings and connectivity, then sets Ready or Failed conditions on the issuer.", ["vault", "validation", "conditions", "authentication"]),
        ],
    ),
    "pkg/issuer/vault/vault.go": (
        "Vault issuer implementation that wires secret and service-account token access and registers with the issuer factory.",
        ["issuer", "vault", "registration", "factory"],
        "simple",
        [
            ("class", "Vault", 28, 35, "Vault issuer implementation holding the secret lister and service-account token factory.", ["issuer", "vault", "secrets"]),
            ("function", "NewVault", 38, 46, "Constructs a Vault issuer and its service-account token creation hook.", ["constructor", "vault", "authentication"]),
        ],
    ),
    "pkg/issuer/venafi/client/api/customfield.go": (
        "Defines the Venafi custom field type and value struct passed on certificate requests.",
        ["venafi", "type-definition", "api", "custom-fields"],
        "simple",
        [
            ("class", "CustomField", 26, 30, "Venafi custom field with a type, name, and value.", ["venafi", "type-definition", "custom-fields"]),
        ],
    ),
    "pkg/issuer/venafi/client/fake/venafi.go": (
        "In-memory fake of the Venafi client Interface with function fields for each operation.",
        ["test-double", "venafi", "fake", "client"],
        "simple",
        [
            ("class", "Venafi", 27, 33, "Fake Venafi client exposing function fields for every operation.", ["test-double", "venafi", "client"]),
            ("function", "Ping", 35, 37, "Delegates the connectivity check to PingFn.", ["test-double", "delegation", "ping"]),
            ("function", "RequestCertificate", 39, 41, "Delegates certificate requests to RequestCertificateFn.", ["test-double", "delegation", "certificate"]),
            ("function", "RetrieveCertificate", 43, 45, "Delegates certificate retrieval to RetrieveCertificateFn.", ["test-double", "delegation", "certificate"]),
            ("function", "ReadZoneConfiguration", 47, 49, "Delegates zone configuration reads to ReadZoneConfigurationFn.", ["test-double", "delegation", "configuration"]),
            ("function", "VerifyCredentials", 54, 60, "Delegates credential verification to VerifyCredentialsFn.", ["test-double", "delegation", "authentication"]),
        ],
    ),
    "pkg/issuer/venafi/client/instrumentedvenaficlient.go": (
        "Decorator around a Venafi connector that logs calls and records request duration metrics.",
        ["venafi", "instrumentation", "metrics", "observability", "decorator"],
        "moderate",
        [
            ("class", "instrumentedConnector", 30, 34, "Connector decorator adding trace logging and request duration metrics.", ["venafi", "decorator", "instrumentation"]),
            ("function", "ReadZoneConfiguration", 46, 53, "Wraps zone configuration reads with trace logging and duration metrics.", ["venafi", "metrics", "logging"]),
            ("function", "RequestCertificate", 55, 62, "Wraps certificate requests with trace logging and duration metrics.", ["venafi", "metrics", "logging"]),
            ("function", "RetrieveCertificate", 64, 71, "Wraps certificate retrieval with trace logging and duration metrics.", ["venafi", "metrics", "logging"]),
            ("function", "Ping", 73, 80, "Wraps connectivity checks with trace logging and duration metrics.", ["venafi", "metrics", "logging"]),
            ("function", "RenewCertificate", 82, 89, "Wraps certificate renewal with trace logging and duration metrics.", ["venafi", "metrics", "logging"]),
        ],
    ),
    "pkg/issuer/venafi/client/request.go": (
        "Implements Venafi TPP certificate request and retrieval flows, converting CSR data into vcert requests and custom fields.",
        ["venafi", "tpp", "certificate-request", "vcert", "serialization"],
        "moderate",
        [
            ("class", "ErrCustomFieldsType", 35, 37, "Error type reported when custom field types are unsupported.", ["errors", "venafi", "type-definition"]),
            ("function", "Error", 39, 41, "Formats the unsupported custom field type error.", ["errors", "formatting"]),
            ("function", "RequestCertificate", 49, 83, "Submits a certificate request to Venafi TPP, resetting the certificate on recoverable vcert errors.", ["venafi", "tpp", "request", "error-handling"]),
            ("function", "RetrieveCertificate", 85, 105, "Polls Venafi for the issued certificate and assembles the PEM chain.", ["venafi", "tpp", "retrieval", "pem"]),
            ("function", "buildVReq", 107, 161, "Builds and validates a vcert request from the CSR, zone configuration, and custom fields.", ["venafi", "vcert", "validation", "request"]),
            ("function", "convertCustomFieldsToVcert", 163, 184, "Converts cert-manager custom fields into vcert custom field values.", ["venafi", "conversion", "custom-fields"]),
            ("function", "newVRequest", 186, 203, "Creates a vcert request for the certificate and requested duration.", ["venafi", "vcert", "request"]),
            ("function", "getVcertFriendlyName", 205, 222, "Derives a Venafi friendly name from the certificate URI, IP, or DNS names.", ["venafi", "naming", "certificate"]),
        ],
    ),
    "pkg/issuer/venafi/client/venaficlient.go": (
        "Builds Venafi TPP and Cloud clients from Issuer specs, including HTTP transport, CA bundles, and credential verification.",
        ["venafi", "client", "configuration", "authentication", "tls"],
        "complex",
        [
            ("class", "Interface", 59, 66, "Venafi client operations used by the issuer.", ["venafi", "interface", "client"]),
            ("class", "Venafi", 69, 80, "Venafi client implementation backed by a vcert connector.", ["venafi", "client", "vcert"]),
            ("class", "connector", 84, 91, "Abstraction over the vcert connector operations used by the client.", ["venafi", "vcert", "abstraction"]),
            ("class", "httpClientForVcertOptions", 240, 249, "Options controlling the HTTP client created for vcert.", ["venafi", "http", "configuration", "type-definition"]),
            ("function", "New", 95, 151, "Builds a Venafi client for the given issuer, wiring credentials, metrics, and logging.", ["venafi", "constructor", "client", "configuration"]),
            ("function", "configForIssuer", 155, 236, "Translates Venafi TPP or Cloud issuer configuration and referenced secrets into vcert configuration.", ["venafi", "configuration", "secrets", "conversion"]),
            ("function", "httpClientForVcert", 302, 348, "Builds an instrumented HTTP client honoring CA bundles, proxy, and timeout settings.", ["venafi", "http", "tls", "instrumentation"]),
            ("function", "caBundleForVcertTPP", 356, 390, "Loads a custom CA bundle from a ConfigMap or Secret reference for TPP connections.", ["venafi", "tls", "configmap", "secrets"]),
            ("function", "Ping", 392, 394, "Checks connectivity to the Venafi endpoint.", ["venafi", "health-check", "client"]),
            ("function", "ReadZoneConfiguration", 396, 398, "Reads the Venafi zone configuration.", ["venafi", "configuration", "client"]),
            ("function", "SetClient", 400, 402, "Replaces the underlying vcert client, primarily for testing.", ["venafi", "client", "testing"]),
            ("function", "VerifyCredentials", 405, 464, "Verifies the configured Venafi credentials and reports actionable errors.", ["venafi", "authentication", "validation"]),
        ],
    ),
    "pkg/issuer/venafi/setup.go": (
        "Pings the Venafi endpoint and verifies credentials during issuer setup, recording Ready conditions.",
        ["venafi", "setup", "conditions", "validation"],
        "moderate",
        [
            ("function", "Setup", 31, 69, "Builds the client, pings the API, and verifies credentials while setting issuer conditions.", ["venafi", "setup", "conditions", "authentication"]),
        ],
    ),
    "pkg/issuer/venafi/venafi.go": (
        "Venafi issuer implementation wiring the client builder, secret lister, and user agent; registers with the issuer factory.",
        ["venafi", "issuer", "registration", "factory"],
        "simple",
        [
            ("class", "Venafi", 31, 42, "Venafi issuer implementation with a client builder, logger, and user agent.", ["venafi", "issuer", "client"]),
            ("function", "NewVenafi", 44, 52, "Constructs the Venafi issuer from the controller context.", ["venafi", "constructor", "issuer"]),
        ],
    ),
    "pkg/logs/logs.go": (
        "Central logging package built on klog and logr: flag handling, context injection, and resource-scoped loggers.",
        ["logging", "observability", "context", "configuration", "utility"],
        "moderate",
        [
            ("class", "LogWithFormat", 175, 177, "Logr wrapper exposing an Infof-style formatting helper.", ["logging", "wrapper", "utility"]),
            ("function", "InitLogs", 52, 56, "Initializes klog logging with the configured options.", ["logging", "initialization"]),
            ("function", "AddFlagsNonDeprecated", 58, 68, "Registers only the non-deprecated logging flags.", ["logging", "flags", "configuration"]),
            ("function", "AddFlags", 70, 86, "Registers the full logging flag set and deprecation shims.", ["logging", "flags", "configuration"]),
            ("function", "ValidateAndApply", 88, 90, "Validates the logging configuration and applies it.", ["logging", "validation", "configuration"]),
            ("function", "FlushLogs", 93, 95, "Flushes buffered log output.", ["logging", "lifecycle"]),
            ("function", "WithResource", 109, 125, "Adds resource name, namespace, kind, and group to a logger.", ["logging", "kubernetes", "context"]),
            ("function", "WithRelatedResource", 127, 143, "Adds a related object's identifying fields to a logger.", ["logging", "kubernetes", "context"]),
            ("function", "WithRelatedResourceName", 145, 151, "Adds a related resource identified by name, namespace, and kind.", ["logging", "kubernetes", "context"]),
            ("function", "FromContext", 153, 162, "Retrieves the logger stored in a context, falling back when absent.", ["logging", "context"]),
            ("function", "NewContext", 164, 169, "Returns a context carrying the given logger.", ["logging", "context"]),
            ("function", "WithInfof", 179, 181, "Wraps a logger so Infof can be called with a format string.", ["logging", "formatting", "wrapper"]),
            ("function", "Infof", 184, 186, "Formats and logs a message at info level.", ["logging", "formatting"]),
        ],
    ),
    "pkg/metrics/acme.go": (
        "Metric helpers that observe ACME request durations and increment ACME request counters.",
        ["metrics", "acme", "observability", "prometheus"],
        "simple",
        [
            ("function", "ObserveACMERequestDuration", 24, 26, "Observes an ACME request duration in seconds with the given labels.", ["metrics", "acme", "observability"]),
            ("function", "IncrementACMERequestCount", 29, 31, "Increments the ACME request counter with the given labels.", ["metrics", "acme", "observability"]),
        ],
    ),
    "pkg/metrics/metrics.go": (
        "Defines the Metrics registry and HTTP server, wiring Prometheus collectors for ACME, certificates, and controller sync counts.",
        ["metrics", "prometheus", "observability", "collectors", "server"],
        "complex",
        [
            ("class", "Metrics", 55, 68, "Holds registered Prometheus metrics and the metrics HTTP server.", ["metrics", "prometheus", "registry"]),
            ("function", "New", 71, 195, "Registers cert-manager metrics and returns a Metrics instance.", ["metrics", "constructor", "prometheus", "registration"]),
            ("function", "SetupACMECollector", 197, 199, "Registers the ACME informer collector with the metrics registry.", ["metrics", "collectors", "acme"]),
            ("function", "SetupCertificateCollector", 201, 203, "Registers the certificate lister collector with the metrics registry.", ["metrics", "collectors", "certificate"]),
            ("function", "ACMERequestCounter", 205, 207, "Returns the ACME request counter metric.", ["metrics", "acme", "accessor"]),
            ("function", "NewServer", 210, 239, "Creates the HTTP server that serves the metrics endpoint.", ["metrics", "server", "http"]),
            ("function", "IncrementSyncCallCount", 242, 244, "Increments the sync call counter for the named controller.", ["metrics", "controller", "observability"]),
            ("function", "IncrementSyncErrorCount", 247, 249, "Increments the sync error counter for the named controller.", ["metrics", "controller", "observability"]),
        ],
    ),
    "pkg/metrics/venafi.go": (
        "Metric helper recording Venafi client request durations by label.",
        ["metrics", "venafi", "observability", "prometheus"],
        "simple",
        [
            ("function", "ObserveVenafiRequestDuration", 24, 26, "Observes a Venafi client request duration in seconds with the given labels.", ["metrics", "venafi", "observability"]),
        ],
    ),
    "pkg/scheduler/scheduler.go": (
        "Generic scheduled work queue that delays reprocessing of objects using a mockable clock.",
        ["scheduler", "work-queue", "concurrency", "utility"],
        "moderate",
        [
            ("class", "ScheduledWorkQueue", 62, 70, "Interface for adding and forgetting delayed work items.", ["scheduler", "interface", "work-queue"]),
            ("class", "scheduledWorkQueue", 72, 80, "Clock-backed implementation of ScheduledWorkQueue.", ["scheduler", "work-queue", "concurrency"]),
            ("function", "afterFunc", 28, 54, "Mockable equivalent of time.AfterFunc with a concurrency-safe cancel function.", ["scheduler", "timer", "concurrency"]),
            ("function", "NewScheduledWorkQueue", 83, 92, "Creates a work queue driven by the given clock and processing function.", ["scheduler", "constructor", "work-queue"]),
            ("function", "Add", 97, 110, "Schedules processing of an object after the given duration.", ["scheduler", "work-queue", "timer"]),
            ("function", "Forget", 113, 121, "Cancels any pending processing for an object.", ["scheduler", "work-queue", "lifecycle"]),
        ],
    ),
    "pkg/scheduler/test/fake.go": (
        "Test fake for the scheduler ScheduledWorkQueue interface backed by injectable functions.",
        ["test-double", "scheduler", "fake", "work-queue"],
        "simple",
        [
            ("class", "FakeScheduler", 30, 33, "Fake ScheduledWorkQueue using injectable Add and Forget functions.", ["test-double", "scheduler", "work-queue"]),
            ("function", "Add", 35, 37, "Records scheduled work by delegating to AddFunc.", ["test-double", "delegation", "scheduler"]),
            ("function", "Forget", 39, 41, "Forgets objects by delegating to ForgetFunc.", ["test-double", "delegation", "scheduler"]),
        ],
    ),
    "pkg/server/tls/authority/authority.go": (
        "DynamicAuthority manages the CA used to sign webhook serving certificates, regenerating it from a Secret and notifying rotation watchers.",
        ["tls", "certificate-authority", "rotation", "kubernetes", "security"],
        "complex",
        [
            ("class", "DynamicAuthority", 54, 96, "CA authority that loads or creates a signing key pair and notifies rotation watchers.", ["tls", "certificate-authority", "rotation"]),
            ("function", "Run", 102, 183, "Starts the informer loop, ensures the CA exists, and processes Secret events until shutdown.", ["tls", "controller", "informer", "lifecycle"]),
            ("function", "Sign", 188, 232, "Signs a certificate template with the current CA key.", ["tls", "signing", "certificate-authority"]),
            ("function", "WatchRotation", 238, 244, "Registers a channel that receives new CA material when it rotates.", ["tls", "rotation", "notification"]),
            ("function", "StopWatchingRotation", 246, 257, "Unregisters a rotation notification channel.", ["tls", "rotation", "lifecycle"]),
            ("function", "ensureCA", 259, 277, "Loads the CA from its Secret or generates it when missing.", ["tls", "certificate-authority", "secrets"]),
            ("function", "notifyWatches", 279, 306, "Sends the new certificate and key to all rotation watchers.", ["tls", "rotation", "notification"]),
            ("function", "caRequiresRegeneration", 310, 342, "Determines whether the stored CA is invalid, expiring, or otherwise needs regeneration.", ["tls", "validation", "rotation"]),
            ("function", "regenerateCA", 347, 418, "Generates a new CA key pair and persists it to the backing Secret.", ["tls", "certificate-authority", "rotation", "secrets"]),
            ("function", "handleAdd", 420, 425, "Handles Secret add events by checking whether the CA needs regeneration.", ["tls", "event-handler", "informer"]),
            ("function", "handleUpdate", 427, 432, "Handles Secret update events by checking whether the CA needs regeneration.", ["tls", "event-handler", "informer"]),
            ("function", "handleDelete", 434, 439, "Handles Secret deletion by triggering CA regeneration.", ["tls", "event-handler", "informer"]),
        ],
    ),
    "pkg/server/tls/dynamic_source.go": (
        "Dynamic TLS certificate source for the webhook server that loads, watches, and regenerates serving certificates via the Authority.",
        ["tls", "certificate-source", "rotation", "webhook", "kubernetes"],
        "complex",
        [
            ("class", "Authority", 38, 54, "Interface for signing certificates and observing CA rotation.", ["tls", "interface", "certificate-authority"]),
            ("class", "DynamicSource", 58, 71, "TLS certificate source that serves a certificate and rotates it before expiry.", ["tls", "certificate-source", "rotation"]),
            ("function", "Start", 76, 196, "Runs the certificate load and regeneration loop until the context is cancelled.", ["tls", "lifecycle", "rotation", "informer"]),
            ("function", "NeedLeaderElection", 199, 201, "Reports that the certificate source requires leader election.", ["tls", "lifecycle", "leader-election"]),
            ("function", "GetCertificate", 203, 210, "Returns the current TLS certificate, regenerating it if needed.", ["tls", "certificate-source", "accessor"]),
            ("function", "Healthy", 212, 216, "Reports whether a certificate is currently loaded.", ["tls", "health-check"]),
            ("function", "tryRegenerateCertificate", 218, 227, "Attempts regeneration when the renewal deadline has passed.", ["tls", "rotation", "renewal"]),
            ("function", "regenerateCertificate", 231, 256, "Signs a new serving certificate with the Authority.", ["tls", "signing", "rotation"]),
            ("function", "updateCertificate", 258, 292, "Stores the new key pair and schedules the next renewal.", ["tls", "rotation", "renewal"]),
        ],
    ),
    "pkg/util/cmapichecker/cmapichecker.go": (
        "Checks whether the cert-manager API is installed and serving expected resources, translating discovery errors into actionable messages.",
        ["kubernetes", "api-discovery", "health-check", "validation"],
        "complex",
        [
            ("class", "Interface", 66, 68, "API checker contract exposing Check.", ["kubernetes", "interface", "health-check"]),
            ("class", "cmapiChecker", 70, 75, "Discovery-backed checker verifying cert-manager API availability.", ["kubernetes", "api-discovery", "health-check"]),
            ("function", "New", 78, 85, "Creates a checker from a REST config and namespace.", ["kubernetes", "constructor", "api-discovery"]),
            ("function", "NewForConfigAndClient", 87, 161, "Builds a checker with the given REST config and HTTP client.", ["kubernetes", "constructor", "api-discovery"]),
            ("function", "Check", 170, 203, "Verifies that the cert-manager API group and resources are served.", ["kubernetes", "health-check", "api-discovery"]),
            ("function", "TranslateToSimpleError", 221, 248, "Converts discovery errors into concise, actionable messages.", ["kubernetes", "errors", "diagnostics"]),
        ],
    ),
    "pkg/util/errors/errors.go": (
        "Defines a sentinel invalid-data error wrapper and helpers to create and detect it.",
        ["errors", "utility", "type-definition"],
        "simple",
        [
            ("function", "NewInvalidData", 23, 25, "Creates a wrapped error marking input data as invalid.", ["errors", "factory", "validation"]),
            ("function", "IsInvalidData", 27, 32, "Reports whether an error was created by NewInvalidData.", ["errors", "validation", "utility"]),
        ],
    ),
    "pkg/util/feature/feature_gate.go": (
        "Exposes the shared mutable Kubernetes feature gate used across cert-manager components.",
        ["feature-gates", "configuration", "kubernetes", "build-system"],
        "simple",
        [],
    ),
    "pkg/util/kube/pki.go": (
        "Reads TLS keys, certificates, and CA bundles from Kubernetes Secrets using informer listers.",
        ["kubernetes", "secrets", "tls", "pki", "utility"],
        "moderate",
        [
            ("function", "SecretTLSKeyRef", 35, 47, "Reads a specific key from a Secret referenced by a SecretKeySelector.", ["kubernetes", "secrets", "pki"]),
            ("function", "SecretTLSKey", 52, 54, "Reads the default TLS private key from a named Secret.", ["kubernetes", "secrets", "pki"]),
            ("function", "ParseTLSKeyFromSecret", 58, 70, "Extracts and validates a TLS private key from a Secret.", ["kubernetes", "secrets", "parsing"]),
            ("function", "SecretTLSCertChain", 72, 89, "Reads and parses the certificate chain from a Secret.", ["kubernetes", "secrets", "certificate"]),
            ("function", "SecretTLSKeyPairAndCA", 94, 115, "Reads the key pair and CA bundle from a Secret.", ["kubernetes", "secrets", "certificate", "ca"]),
            ("function", "SecretTLSKeyPair", 117, 142, "Reads the certificate and private key pair from a Secret.", ["kubernetes", "secrets", "certificate"]),
            ("function", "SecretTLSCert", 144, 151, "Reads the leaf certificate from a Secret.", ["kubernetes", "secrets", "certificate"]),
        ],
    ),
    "pkg/util/pki/asn1_util.go": (
        "ASN.1 helpers for parsing OIDs and marshalling and unmarshalling universal values used in certificate extensions.",
        ["asn1", "pki", "serialization", "parsing"],
        "moderate",
        [
            ("class", "UniversalValue", 60, 65, "ASN.1 universal value carrying a tag and byte content.", ["asn1", "type-definition", "pki"]),
            ("function", "ParseObjectIdentifier", 31, 49, "Parses a dotted OID string into an ASN.1 object identifier.", ["asn1", "parsing", "oid"]),
            ("function", "Type", 67, 85, "Returns the ASN.1 universal tag type for the value.", ["asn1", "accessor"]),
            ("function", "MarshalUniversalValue", 87, 111, "Marshals a universal value to DER bytes.", ["asn1", "serialization"]),
            ("function", "marshalRawString", 113, 122, "Marshals a raw ASN.1 string with the given tag.", ["asn1", "serialization"]),
            ("function", "UnmarshalUniversalValue", 124, 155, "Parses a universal value from DER bytes.", ["asn1", "parsing"]),
            ("function", "isIA5String", 158, 167, "Reports whether all characters are valid IA5 characters.", ["asn1", "validation"]),
            ("function", "isPrintable", 172, 199, "Reports whether all characters are printable ASCII.", ["asn1", "validation"]),
        ],
    ),
    "pkg/util/pki/basicconstraints.go": (
        "Marshals and unmarshals X.509 basic constraints extension values outside the standard library path.",
        ["pki", "x509", "asn1", "extensions"],
        "moderate",
        [
            ("function", "MarshalBasicConstraints", 37, 49, "Marshals an X.509 basic constraints extension value for the given CA and path length.", ["pki", "x509", "serialization"]),
            ("function", "UnmarshalBasicConstraints", 52, 68, "Parses basic constraints from X.509 extension bytes.", ["pki", "x509", "parsing"]),
        ],
    ),
    "pkg/util/pki/certificatetemplate.go": (
        "Builds and validates x509 certificate templates from Certificates, CSRs, and CertificateRequests, applying issuer overrides.",
        ["pki", "x509", "certificate-template", "validation"],
        "complex",
        [
            ("function", "hasExtension", 37, 51, "Checks whether a certificate request already contains a given extension.", ["pki", "x509", "validation"]),
            ("function", "CertificateTemplateOverrideDuration", 55, 61, "Returns the requested duration or the default when unset.", ["pki", "duration", "defaults"]),
            ("function", "CertificateTemplateValidateAndOverrideBasicConstraints", 65, 95, "Validates and applies CA and basic-constraint settings to a certificate template.", ["pki", "x509", "validation", "certificate"]),
            ("function", "CertificateTemplateValidateAndOverrideKeyUsages", 99, 121, "Validates and applies key usages and extended key usages to a template.", ["pki", "x509", "validation", "key-usage"]),
            ("function", "String", 125, 141, "Renders the template subject for error messages.", ["pki", "formatting", "subject"]),
            ("function", "CertificateTemplateFromCSR", 145, 268, "Builds an x509 certificate template from a parsed certificate signing request.", ["pki", "csr", "x509", "certificate"]),
            ("function", "CertificateTemplateFromCSRPEM", 272, 283, "Parses a PEM CSR and builds a certificate template from it.", ["pki", "csr", "pem", "certificate"]),
            ("function", "CertificateTemplateFromCertificate", 287, 305, "Builds a certificate template from an existing x509 certificate.", ["pki", "x509", "certificate"]),
            ("function", "CertificateTemplateFromCertificateRequest", 309, 322, "Builds a certificate template from a cert-manager CertificateRequest.", ["pki", "certificate", "kubernetes"]),
            ("function", "CertificateTemplateFromCertificateSigningRequest", 326, 345, "Builds a certificate template from a Kubernetes CertificateSigningRequest.", ["pki", "certificate", "kubernetes"]),
        ],
    ),
    "pkg/util/pki/csr.go": (
        "Core PKI helpers for generating CSRs, signing certificates, encoding chains, and deriving signature algorithms.",
        ["pki", "csr", "x509", "signing", "encoding"],
        "complex",
        [
            ("function", "IPAddressesToString", 43, 49, "Formats a list of IP addresses as strings.", ["pki", "formatting", "ip-address"]),
            ("function", "IPAddressesFromStrings", 51, 65, "Parses a list of IP address strings, ignoring invalid entries.", ["pki", "parsing", "ip-address"]),
            ("function", "URLsToString", 67, 78, "Formats a list of URLs as strings.", ["pki", "formatting", "urls"]),
            ("function", "SubjectForCertificate", 81, 87, "Builds an x509 subject from a Certificate's subject fields.", ["pki", "certificate", "subject"]),
            ("function", "KeyUsagesForCertificateOrCertificateRequest", 89, 114, "Resolves key usages for a Certificate or CertificateRequest, applying CA defaults.", ["pki", "key-usage", "certificate"]),
            ("function", "WithEncodeBasicConstraintsInRequest", 128, 132, "Configures CSR generation to encode basic constraints.", ["pki", "csr", "options"]),
            ("function", "WithNameConstraints", 134, 138, "Configures CSR generation to include name constraints.", ["pki", "csr", "options"]),
            ("function", "WithOtherNames", 140, 144, "Configures CSR generation to include otherName SANs.", ["pki", "csr", "options"]),
            ("function", "WithUseLiteralSubject", 146, 150, "Configures CSR generation to use a literal subject.", ["pki", "csr", "options"]),
            ("function", "GenerateCSR", 156, 337, "Generates a certificate signing request for a Certificate, honoring SAN and usage options.", ["pki", "csr", "generation"]),
            ("function", "SignCertificate", 345, 400, "Signs a certificate template with an issuer certificate and signing key.", ["pki", "signing", "certificate"]),
            ("function", "SignCSRTemplate", 406, 424, "Signs a CSR-derived template and returns the certificate chain.", ["pki", "signing", "csr"]),
            ("function", "EncodeCSR", 428, 435, "Encodes a CSR and private key as PEM.", ["pki", "encoding", "csr", "pem"]),
            ("function", "EncodeX509", 438, 446, "Encodes a certificate as PEM.", ["pki", "encoding", "certificate", "pem"]),
            ("function", "EncodeX509Chain", 454, 473, "Encodes a certificate chain as concatenated PEM blocks.", ["pki", "encoding", "certificate", "pem"]),
            ("function", "SignatureAlgorithm", 493, 552, "Determines the signature algorithm for a Certificate based on its key and algorithm settings.", ["pki", "signing", "algorithm"]),
            ("function", "signatureAlgorithmFromPublicKey", 562, 614, "Infers a default signature algorithm from the signer's public key.", ["pki", "signing", "algorithm"]),
        ],
    ),
}

CALLS = [
    ("function:pkg/issuer/factory.go:IssuerFor", "function:pkg/api/util/issuers.go:NameForIssuer"),
    ("function:pkg/issuer/selfsigned/setup.go:Setup", "function:pkg/api/util/conditions.go:SetIssuerCondition"),
    ("function:pkg/issuer/vault/setup.go:Setup", "function:internal/vault/vault.go:New"),
    ("function:pkg/issuer/vault/setup.go:Setup", "function:pkg/api/util/conditions.go:SetIssuerCondition"),
    ("function:pkg/metrics/metrics.go:New", "function:internal/collectors/acme_collector.go:NewACMECollector"),
    ("function:pkg/metrics/metrics.go:New", "function:internal/collectors/certificate_collector.go:NewCertificateCollector"),
    ("function:pkg/scheduler/scheduler.go:NewScheduledWorkQueue", "function:pkg/scheduler/scheduler.go:afterFunc"),
    ("function:pkg/scheduler/scheduler.go:Add", "function:pkg/scheduler/scheduler.go:afterFunc"),
    ("function:pkg/server/tls/authority/authority.go:regenerateCA", "function:pkg/util/pki/generate.go:GeneratePrivateKeyForCertificate"),
    ("function:pkg/util/kube/pki.go:ParseTLSKeyFromSecret", "function:pkg/util/pki/parse.go:DecodePrivateKeyBytes"),
    ("function:pkg/util/kube/pki.go:SecretTLSCertChain", "function:pkg/util/pki/parse.go:DecodeX509CertificateChainBytes"),
    ("function:pkg/server/tls/dynamic_source.go:tryRegenerateCertificate", "function:pkg/server/tls/dynamic_source.go:regenerateCertificate"),
    ("function:pkg/server/tls/dynamic_source.go:regenerateCertificate", "function:pkg/server/tls/dynamic_source.go:updateCertificate"),
    ("function:pkg/util/pki/certificatetemplate.go:CertificateTemplateFromCSRPEM", "function:pkg/util/pki/certificatetemplate.go:CertificateTemplateFromCSR"),
    ("function:pkg/util/pki/csr.go:SignatureAlgorithm", "function:pkg/util/pki/csr.go:signatureAlgorithmFromPublicKey"),
]

COMPLEXITY = {
    "simple": "simple",
}

def complexity_for(start, end):
    span = end - start + 1
    if span < 20:
        return "simple"
    if span <= 60:
        return "moderate"
    return "complex"

nodes = []
edges = []
node_ids = set()

def add_node(node):
    if node["id"] in node_ids:
        raise SystemExit("duplicate node id: " + node["id"])
    node_ids.add(node["id"])
    nodes.append(node)

for path in sorted(FILES):
    summary, tags, complexity, subs = FILES[path]
    name = os.path.basename(path)
    add_node({
        "id": "file:" + path,
        "type": "file",
        "name": name,
        "filePath": path,
        "summary": summary,
        "tags": tags,
        "complexity": complexity,
    })
    for kind, sname, start, end, ssummary, stags in subs:
        nid = ("%s:%s:%s" % (kind, path, sname))
        add_node({
            "id": nid,
            "type": kind,
            "name": sname,
            "filePath": path,
            "lineRange": [start, end],
            "summary": ssummary,
            "tags": stags,
            "complexity": complexity_for(start, end),
        })
        edges.append({
            "source": "file:" + path,
            "target": nid,
            "type": "contains",
            "direction": "forward",
            "weight": 1.0,
        })
        if sname[0].isupper():
            edges.append({
                "source": "file:" + path,
                "target": nid,
                "type": "exports",
                "direction": "forward",
                "weight": 0.8,
            })

for path in sorted(FILES):
    for target in import_data.get(path, []):
        edges.append({
            "source": "file:" + path,
            "target": "file:" + target,
            "type": "imports",
            "direction": "forward",
            "weight": 0.7,
        })

for source, target in CALLS:
    if source not in node_ids:
        raise SystemExit("call source missing: " + source)
    edges.append({
        "source": source,
        "target": target,
        "type": "calls",
        "direction": "forward",
        "weight": 0.8,
    })

paths = sorted(FILES)
parts = 7
chunk = math.ceil(len(paths) / parts)
groups = [paths[i:i + chunk] for i in range(0, len(paths), chunk)]
if len(groups) != parts:
    raise SystemExit("unexpected group count %d" % len(groups))

os.makedirs(OUT, exist_ok=True)

total_nodes = 0
total_edges = 0
for k, group in enumerate(groups, start=1):
    gset = set(group)
    part_nodes = [n for n in nodes if (n.get("filePath") in gset)]
    ids = {n["id"] for n in part_nodes}
    part_edges = [e for e in edges if e["source"] in ids]
    out = {"nodes": part_nodes, "edges": part_edges}
    fn = os.path.join(OUT, "batch-5-part-%d.json" % k)
    with open(fn, "w") as f:
        json.dump(out, f, indent=2)
        f.write("\n")
    total_nodes += len(part_nodes)
    total_edges += len(part_edges)
    print("part %d: %d files, %d nodes, %d edges" % (k, len(group), len(part_nodes), len(part_edges)))

print("TOTAL nodes=%d edges=%d (expected edges incl. imports=%d)" % (
    total_nodes, total_edges,
    sum(len(import_data.get(p, [])) for p in FILES) + sum(1 for _ in edges if _["type"] != "imports")))
print("import edges emitted:", sum(1 for e in edges if e["type"] == "imports"))
print("import edges expected:", sum(len(import_data.get(p, [])) for p in FILES))
print("nodes not in any part:", [n["id"] for n in nodes if n["id"] not in {x["id"] for g in groups for x in nodes if x.get("filePath") in set(g)}])
