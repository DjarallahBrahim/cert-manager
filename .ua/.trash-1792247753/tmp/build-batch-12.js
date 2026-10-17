const fs = require('fs');

const batch = JSON.parse(fs.readFileSync('/Users/samtyga/Desktop/work/cert-manager/.ua/tmp/prompts/batch-12.json', 'utf8'));

const D = [
  {
    path: 'test/e2e/e2e.go',
    summary: 'Ginkgo suite bootstrap for the cert-manager e2e tests: initializes, provisions, logs, and deprovisions the shared global addons across Ginkgo processes.',
    tags: ['test', 'entry-point', 'e2e', 'ginkgo', 'lifecycle'],
    complexity: 'moderate',
    notes: 'Uses Ginkgo SynchronizedBeforeSuite/SynchronizedAfterSuite to coordinate global addon state across parallel processes.',
    symbols: [],
  },
  {
    path: 'test/e2e/framework/addon/base/base.go',
    summary: 'Shared addon scaffolding that gives addon plugins a Kubernetes clientset and suite configuration through a reusable Base/Details pair.',
    tags: ['test', 'addon', 'dependency-injection', 'kubernetes'],
    complexity: 'moderate',
    symbols: [
      { kind: 'class', name: 'Base', lineRange: [33, 38], summary: 'Addon skeleton that implements the internal Addon interface and caches a Details value after setup.', tags: ['addon', 'test', 'base', 'struct'], complexity: 'simple', exported: true },
      { kind: 'class', name: 'Details', lineRange: [43, 53], summary: 'Carries the suite config plus a Kubernetes REST config and clientset that addon plugins use to provision resources.', tags: ['addon', 'kubernetes', 'configuration', 'struct'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'Setup', lineRange: [61, 83], summary: 'Loads the kubeconfig and builds a Kubernetes clientset, caching the resulting Details for later addon calls.', tags: ['setup', 'kubernetes', 'configuration'], complexity: 'moderate', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/addon/chart/addon.go',
    summary: 'Generic Helm chart addon that installs, inspects, and removes arbitrary charts in the e2e cluster using Helm CLI commands.',
    tags: ['test', 'addon', 'helm', 'deployment', 'e2e'],
    complexity: 'complex',
    notes: 'Shells out to the Helm binary with a per-addon temporary HOME instead of using the Helm Go SDK.',
    symbols: [
      { kind: 'class', name: 'Chart', lineRange: [37, 76], summary: 'Configurable Helm chart addon holding release metadata, repository, values, and CLI options.', tags: ['addon', 'helm', 'configuration', 'struct'], complexity: 'moderate', exported: true },
      { kind: 'class', name: 'Repo', lineRange: [80, 86], summary: 'Helm repository name and URL pair used when adding a chart repo.', tags: ['helm', 'configuration', 'struct'], complexity: 'simple', exported: true },
      { kind: 'class', name: 'StringTuple', lineRange: [89, 92], summary: 'Key/value pair used to build ordered Helm value maps.', tags: ['helm', 'value', 'struct'], complexity: 'simple', exported: true },
      { kind: 'class', name: 'Details', lineRange: [95, 101], summary: 'Release name and namespace of an installed chart.', tags: ['helm', 'deployment', 'struct'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'Setup', lineRange: [103, 117], summary: 'Stores suite config and prepares a temporary Helm home and namespace for the chart addon.', tags: ['setup', 'helm', 'configuration'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'Provision', lineRange: [120, 141], summary: 'Adds the chart repository, updates dependencies, and installs the release into the target namespace.', tags: ['deployment', 'helm', 'provisioning'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'runDepUpdate', lineRange: [143, 149], summary: 'Runs helm dep update for the configured chart.', tags: ['helm', 'dependency', 'chart'], complexity: 'simple', exported: false },
      { kind: 'function', name: 'runInstall', lineRange: [151, 170], summary: 'Builds and executes the helm install command with the configured values and variables.', tags: ['helm', 'deployment', 'install'], complexity: 'moderate', exported: false },
      { kind: 'function', name: 'buildHelmCmd', lineRange: [172, 181], summary: "Constructs a Helm exec.Cmd with the addon's HOME, kubeconfig, and namespace flags.", tags: ['helm', 'utility', 'command'], complexity: 'simple', exported: false },
      { kind: 'function', name: 'Deprovision', lineRange: [184, 206], summary: 'Uninstalls the Helm release, captures logs, and removes the temporary Helm home directory.', tags: ['helm', 'cleanup', 'deprovisioning'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'SupportsGlobal', lineRange: [219, 224], summary: 'Reports that chart addons can be shared globally under a well-known release name.', tags: ['addon', 'capability', 'global'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'Logs', lineRange: [226, 273], summary: "Collects current and previous container logs from the chart release's pods.", tags: ['logging', 'kubernetes', 'debugging'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'addRepo', lineRange: [275, 281], summary: 'Adds the configured Helm repository to the temporary Helm home.', tags: ['helm', 'setup', 'repository'], complexity: 'simple', exported: false },
    ],
  },
  {
    path: 'test/e2e/framework/addon/globals.go',
    summary: 'Defines the shared global addon instances and the primary/non-primary Ginkgo process lifecycle used to set up, provision, log, and deprovision them.',
    tags: ['test', 'addon', 'lifecycle', 'e2e', 'ginkgo'],
    complexity: 'moderate',
    symbols: [
      { kind: 'function', name: 'InitGlobals', lineRange: [60, 82], summary: 'Allocates the shared global addon singletons from the suite configuration.', tags: ['addon', 'initialization', 'globals'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'SetupGlobalsPrimary', lineRange: [90, 103], summary: 'Runs Setup for every global addon on Ginkgo process one and returns serializable transfer data.', tags: ['addon', 'setup', 'ginkgo', 'globals'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'SetupGlobalsNonPrimary', lineRange: [113, 124], summary: 'Re-runs addon Setup on non-primary Ginkgo processes using data transferred from process one.', tags: ['addon', 'setup', 'ginkgo', 'globals'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'ProvisionGlobals', lineRange: [134, 142], summary: 'Provisions every global addon on the primary Ginkgo process.', tags: ['addon', 'provisioning', 'globals'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'GlobalLogs', lineRange: [148, 169], summary: 'Gathers logs from every global addon that implements the loggable interface.', tags: ['addon', 'logging', 'globals'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'DeprovisionGlobals', lineRange: [175, 186], summary: 'Deprovisions global addons in reverse order and aggregates any errors.', tags: ['addon', 'cleanup', 'globals'], complexity: 'moderate', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/addon/internal/globals.go',
    summary: 'Defines the internal Addon interface that every e2e addon plugin implements, including transferable data for global addons.',
    tags: ['test', 'addon', 'interface', 'type-definition'],
    complexity: 'simple',
    symbols: [
      { kind: 'class', name: 'Addon', lineRange: [26, 42], summary: 'Interface every e2e addon implements, covering setup, provisioning, deprovisioning, and global support.', tags: ['interface', 'addon', 'lifecycle', 'type-definition'], complexity: 'simple', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/addon/vault/proxy.go',
    summary: 'Port-forwarding proxy that exposes an in-cluster Vault pod on a local port for e2e tests.',
    tags: ['test', 'vault', 'port-forward', 'networking', 'utility'],
    complexity: 'moderate',
    symbols: [
      { kind: 'class', name: 'proxy', lineRange: [34, 44], summary: 'Local port-forward proxy state for reaching an in-cluster Vault pod.', tags: ['vault', 'networking', 'struct'], complexity: 'simple', exported: false },
      { kind: 'function', name: 'newProxy', lineRange: [46, 67], summary: 'Allocates a free local port and constructs a proxy for the named Vault pod.', tags: ['vault', 'networking', 'factory'], complexity: 'moderate', exported: false },
      { kind: 'function', name: 'freePort', lineRange: [69, 78], summary: 'Finds an available TCP port by briefly listening on localhost.', tags: ['networking', 'utility', 'port'], complexity: 'simple', exported: false },
      { kind: 'function', name: 'start', lineRange: [80, 139], summary: 'Starts a SPDY port-forward with automatic reconnection until stopped.', tags: ['vault', 'port-forward', 'networking'], complexity: 'moderate', exported: false },
      { kind: 'function', name: 'stop', lineRange: [141, 161], summary: 'Signals the port-forwarder to stop and waits for it to finish.', tags: ['vault', 'networking', 'cleanup'], complexity: 'moderate', exported: false },
    ],
  },
  {
    path: 'test/e2e/framework/addon/vault/setup.go',
    summary: 'Vault PKI initializer that mounts root and intermediate PKI engines and configures AppRole, Kubernetes, and client-certificate auth for issuer tests.',
    tags: ['test', 'vault', 'pki', 'authentication', 'setup'],
    complexity: 'complex',
    notes: 'Each test scenario mounts and unmounts its own PKI paths on a shared Vault server.',
    symbols: [
      { kind: 'class', name: 'VaultInitializer', lineRange: [50, 66], summary: 'Stateful Vault PKI initializer that tracks mount points, roles, and auth paths for a test PKI.', tags: ['vault', 'pki', 'state', 'struct'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'NewVaultInitializerClientCertificate', lineRange: [68, 90], summary: 'Creates an initializer configured for client-certificate auth with randomized mount and role names.', tags: ['vault', 'factory', 'authentication'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'NewVaultInitializerAppRole', lineRange: [92, 114], summary: 'Creates an initializer configured for AppRole authentication.', tags: ['vault', 'factory', 'authentication'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'NewVaultInitializerKubernetes', lineRange: [116, 140], summary: 'Creates an initializer configured for Kubernetes service-account auth against the given API server.', tags: ['vault', 'factory', 'authentication', 'kubernetes'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'NewVaultInitializerAllAuth', lineRange: [142, 170], summary: 'Creates an initializer that configures AppRole, Kubernetes, and client-certificate auth together.', tags: ['vault', 'factory', 'authentication'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'Init', lineRange: [239, 312], summary: 'Builds a Vault client over the port-forward proxy and waits for the Vault server to become healthy.', tags: ['vault', 'client', 'initialization'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'Setup', lineRange: [315, 390], summary: 'Mounts root and intermediate PKI engines, generates a CA chain, imports the intermediate, and configures auth backends.', tags: ['vault', 'pki', 'setup'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'Clean', lineRange: [392, 401], summary: 'Unmounts the PKI and auth mounts created for the test.', tags: ['vault', 'cleanup', 'teardown'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'CreateAppRole', lineRange: [403, 432], summary: 'Creates an AppRole with a generated secret ID and returns the credential pair.', tags: ['vault', 'authentication', 'approle'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'CleanAppRole', lineRange: [434, 446], summary: 'Deletes the AppRole and its secret ID from Vault.', tags: ['vault', 'cleanup', 'approle'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'mountPKI', lineRange: [448, 461], summary: 'Enables and tunes a PKI secrets engine at the given mount point.', tags: ['vault', 'pki', 'mount'], complexity: 'simple', exported: false },
      { kind: 'function', name: 'generateRootCert', lineRange: [463, 475], summary: 'Generates a self-signed root CA inside the root PKI mount.', tags: ['vault', 'pki', 'certificate'], complexity: 'simple', exported: false },
      { kind: 'function', name: 'generateIntermediateSigningReq', lineRange: [477, 489], summary: 'Creates a CSR for an intermediate CA in the intermediate mount.', tags: ['vault', 'pki', 'certificate'], complexity: 'simple', exported: false },
      { kind: 'function', name: 'signCertificate', lineRange: [491, 503], summary: 'Signs a CSR with the root CA to produce an intermediate certificate.', tags: ['vault', 'pki', 'certificate'], complexity: 'simple', exported: false },
      { kind: 'function', name: 'importSignIntermediate', lineRange: [505, 514], summary: 'Imports the signed intermediate CA chain into the intermediate mount.', tags: ['vault', 'pki', 'certificate'], complexity: 'simple', exported: false },
      { kind: 'function', name: 'configureCert', lineRange: [516, 526], summary: 'Writes the CA chain and CRL URLs into the PKI mount configuration.', tags: ['vault', 'pki', 'configuration'], complexity: 'simple', exported: false },
      { kind: 'function', name: 'configureIntermediateRoles', lineRange: [528, 548], summary: 'Creates the intermediate signing role used for certificate issuance.', tags: ['vault', 'pki', 'role'], complexity: 'moderate', exported: false },
      { kind: 'function', name: 'setupAppRoleAuth', lineRange: [550, 567], summary: 'Enables the AppRole auth backend and wires it to the PKI mount.', tags: ['vault', 'authentication', 'approle'], complexity: 'moderate', exported: false },
      { kind: 'function', name: 'setupKubernetesBasedAuth', lineRange: [569, 596], summary: 'Enables and configures Kubernetes auth, including the token reviewer role.', tags: ['vault', 'authentication', 'kubernetes'], complexity: 'moderate', exported: false },
      { kind: 'function', name: 'CreateKubernetesRole', lineRange: [601, 631], summary: 'Creates a service account, role binding, and Vault Kubernetes auth role for a namespace.', tags: ['vault', 'authentication', 'kubernetes', 'rbac'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'CleanKubernetesRole', lineRange: [638, 655], summary: 'Removes a Vault Kubernetes auth role and its associated RBAC resources.', tags: ['vault', 'cleanup', 'kubernetes'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'RoleAndBindingForServiceAccountRefAuth', lineRange: [657, 689], summary: 'Builds the Role and RoleBinding allowing a service account to authenticate to Vault.', tags: ['vault', 'rbac', 'kubernetes'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'CreateKubernetesRoleForServiceAccountRefAuth', lineRange: [693, 705], summary: 'Creates RBAC for service-account-ref auth and registers the Vault role.', tags: ['vault', 'kubernetes', 'authentication'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'CleanKubernetesRoleForServiceAccountRefAuth', lineRange: [707, 717], summary: 'Deletes the Vault role and RBAC used by service-account-ref auth.', tags: ['vault', 'cleanup', 'kubernetes'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'setupClientCertAuth', lineRange: [719, 736], summary: 'Enables the cert auth backend and configures its CA certificate.', tags: ['vault', 'authentication', 'tls'], complexity: 'moderate', exported: false },
      { kind: 'function', name: 'CreateClientCertRole', lineRange: [738, 780], summary: 'Generates a client certificate and creates a cert-auth role bound to it.', tags: ['vault', 'authentication', 'tls'], complexity: 'moderate', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/addon/vault/vault.go',
    summary: 'Vault addon that deploys a Vault Helm chart, generates mTLS serving and client certificates, and exposes connection details to tests.',
    tags: ['test', 'addon', 'vault', 'deployment', 'tls'],
    complexity: 'complex',
    symbols: [
      { kind: 'class', name: 'Vault', lineRange: [56, 79], summary: 'Vault addon configuration embedding the chart addon plus mTLS and proxy state.', tags: ['vault', 'addon', 'configuration', 'struct'], complexity: 'moderate', exported: true },
      { kind: 'class', name: 'Details', lineRange: [83, 102], summary: 'Connection details (URLs, CA, client certificate) exposed to tests that use Vault.', tags: ['vault', 'configuration', 'tls', 'struct'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'convertInterfaceToDetails', lineRange: [104, 117], summary: 'Decodes transferred global addon data into concrete Vault details.', tags: ['vault', 'serialization', 'globals'], complexity: 'simple', exported: false },
      { kind: 'function', name: 'Setup', lineRange: [119, 313], summary: "Prepares Vault's namespace, certificates, chart values, and shared state, generating mTLS material as needed.", tags: ['vault', 'setup', 'tls', 'helm'], complexity: 'complex', exported: true },
      { kind: 'function', name: 'Provision', lineRange: [316, 415], summary: 'Deploys Vault via the chart addon and waits for the pod and port-forward proxy to be ready.', tags: ['vault', 'deployment', 'provisioning'], complexity: 'complex', exported: true },
      { kind: 'function', name: 'Deprovision', lineRange: [423, 435], summary: 'Stops the proxy and uninstalls the Vault Helm release.', tags: ['vault', 'cleanup', 'deprovisioning'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'generateVaultServingCert', lineRange: [445, 487], summary: 'Issues a serving certificate for the Vault service DNS name from the test CA.', tags: ['vault', 'tls', 'certificate'], complexity: 'simple', exported: false },
      { kind: 'function', name: 'generateVaultClientCert', lineRange: [489, 529], summary: 'Issues a client certificate for authenticating to Vault.', tags: ['vault', 'tls', 'certificate'], complexity: 'simple', exported: false },
      { kind: 'function', name: 'GenerateCA', lineRange: [531, 561], summary: 'Generates a self-signed CA and private key used to secure the Vault deployment.', tags: ['vault', 'tls', 'certificate', 'ca'], complexity: 'moderate', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/addon/venafi/cloud.go',
    summary: 'Venafi Cloud addon that provisions API credentials and builds Venafi Cloud Issuer and ClusterIssuer resources for e2e tests.',
    tags: ['test', 'addon', 'venafi', 'issuer', 'credentials'],
    complexity: 'moderate',
    symbols: [
      { kind: 'class', name: 'VenafiCloud', lineRange: [34, 44], summary: 'Venafi Cloud addon state including namespace, details, and the created credential secret.', tags: ['venafi', 'addon', 'configuration', 'struct'], complexity: 'simple', exported: true },
      { kind: 'class', name: 'CloudDetails', lineRange: [48, 50], summary: 'Holds the issuer template used to build Venafi Cloud issuers.', tags: ['venafi', 'issuer', 'struct'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'Setup', lineRange: [52, 71], summary: 'Loads suite config and prepares the namespace and issuer template for Venafi Cloud.', tags: ['venafi', 'setup', 'configuration'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'Provision', lineRange: [73, 103], summary: 'Creates the Venafi Cloud API key secret and issuer template resources.', tags: ['venafi', 'provisioning', 'credentials'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'BuildIssuer', lineRange: [117, 128], summary: 'Builds a namespaced Venafi Cloud Issuer from the stored template.', tags: ['venafi', 'issuer', 'factory'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'BuildClusterIssuer', lineRange: [130, 141], summary: 'Builds a cluster-scoped Venafi Cloud ClusterIssuer from the stored template.', tags: ['venafi', 'issuer', 'factory'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'SetAPIKey', lineRange: [144, 153], summary: 'Updates the stored secret with a new Venafi Cloud API key.', tags: ['venafi', 'credentials', 'secret'], complexity: 'simple', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/addon/venafi/doc.go',
    summary: 'Package documentation for the Venafi addon, describing how e2e tests obtain Venafi TPP credentials.',
    tags: ['test', 'documentation', 'venafi', 'addon'],
    complexity: 'simple',
    symbols: [],
  },
  {
    path: 'test/e2e/framework/addon/venafi/tpp.go',
    summary: 'Venafi TPP addon that provisions access tokens and builds TPP-backed Issuer and ClusterIssuer resources for e2e tests.',
    tags: ['test', 'addon', 'venafi', 'tpp', 'issuer'],
    complexity: 'moderate',
    symbols: [
      { kind: 'class', name: 'VenafiTPP', lineRange: [34, 44], summary: 'Venafi TPP addon state including namespace, details, and the created credential secret.', tags: ['venafi', 'addon', 'configuration', 'struct'], complexity: 'simple', exported: true },
      { kind: 'class', name: 'TPPDetails', lineRange: [48, 50], summary: 'Holds the issuer template used to build Venafi TPP issuers.', tags: ['venafi', 'issuer', 'struct'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'Setup', lineRange: [52, 80], summary: 'Loads suite config and prepares the namespace, TPP URL/zone, and issuer template.', tags: ['venafi', 'setup', 'configuration'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'Provision', lineRange: [82, 111], summary: 'Creates the TPP access-token secret and issuer template resources.', tags: ['venafi', 'provisioning', 'credentials'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'Deprovision', lineRange: [117, 123], summary: 'Removes the TPP secret and issuer resources.', tags: ['venafi', 'cleanup', 'deprovisioning'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'BuildIssuer', lineRange: [129, 140], summary: 'Builds a namespaced Venafi TPP Issuer from the stored template.', tags: ['venafi', 'issuer', 'factory'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'BuildClusterIssuer', lineRange: [142, 153], summary: 'Builds a cluster-scoped Venafi TPP ClusterIssuer from the stored template.', tags: ['venafi', 'issuer', 'factory'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'SetAccessToken', lineRange: [156, 165], summary: 'Updates the stored secret with a new Venafi TPP access token.', tags: ['venafi', 'credentials', 'secret'], complexity: 'simple', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/cleanup.go',
    summary: 'Registers and runs cleanup callbacks so e2e tests can tear down resources even when a run aborts.',
    tags: ['test', 'cleanup', 'lifecycle', 'utility'],
    complexity: 'simple',
    symbols: [
      { kind: 'function', name: 'AddCleanupAction', lineRange: [34, 40], summary: 'Registers a cleanup callback and returns a handle that can later remove it.', tags: ['cleanup', 'lifecycle', 'registration'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'RunCleanupActions', lineRange: [53, 66], summary: 'Snapshots and runs all registered cleanup callbacks without holding the lock.', tags: ['cleanup', 'lifecycle', 'utility'], complexity: 'simple', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/config/acme.go',
    summary: 'ACME server configuration and command-line flags for the e2e suite, covering endpoint, DNS server, challenge IPs, and test identities.',
    tags: ['configuration', 'test', 'acme', 'flags'],
    complexity: 'simple',
    symbols: [
      { kind: 'class', name: 'ACMEServer', lineRange: [23, 32], summary: 'Holds ACME server URL, DNS and ingress/gateway IPs, and test email/private-key values.', tags: ['acme', 'configuration', 'struct'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'AddFlags', lineRange: [34, 43], summary: 'Registers ACME endpoint, DNS, challenge IP, and test identity flags on the suite flag set.', tags: ['acme', 'flags', 'configuration'], complexity: 'simple', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/config/addons.go',
    summary: 'Aggregates configuration for all e2e addons and validates their combined settings.',
    tags: ['configuration', 'test', 'addons', 'validation'],
    complexity: 'moderate',
    symbols: [
      { kind: 'class', name: 'Addons', lineRange: [24, 49], summary: 'Nested addon configuration covering Helm, ACME, ingress, Gateway, Venafi, cert-manager, and the DNS01 webhook.', tags: ['addons', 'configuration', 'struct'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'Validate', lineRange: [61, 71], summary: 'Validates each nested addon configuration and aggregates the resulting errors.', tags: ['validation', 'addons', 'configuration'], complexity: 'simple', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/config/certmanager.go',
    summary: 'Configuration for the cert-manager deployment under test, including cluster resource namespace and service account name.',
    tags: ['configuration', 'test', 'cert-manager', 'deployment'],
    complexity: 'simple',
    symbols: [
      { kind: 'class', name: 'CertManager', lineRange: [23, 31], summary: 'Holds the cluster resource namespace and controller service account name of the cert-manager install.', tags: ['cert-manager', 'configuration', 'struct'], complexity: 'simple', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/config/config.go',
    summary: 'Root e2e configuration object plus flag registration and cross-field validation for the test suite.',
    tags: ['configuration', 'test', 'flags', 'validation', 'entry-point'],
    complexity: 'moderate',
    symbols: [
      { kind: 'class', name: 'Config', lineRange: [35, 50], summary: 'Root suite configuration aggregating Kubernetes, cleanup, repo-root, Ginkgo, addon, and suite settings.', tags: ['configuration', 'root', 'struct'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'Validate', lineRange: [52, 74], summary: 'Validates the root configuration, feature gates, and nested addon and suite settings.', tags: ['validation', 'configuration', 'feature-gate'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'AddFlags', lineRange: [77, 104], summary: 'Registers root, Kubernetes, and feature-gate flags and delegates to nested configurations.', tags: ['flags', 'configuration', 'kubernetes'], complexity: 'moderate', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/config/gateway.go',
    summary: 'Gateway API configuration (domain and HTTPRoute labels) used by ACME HTTP-01 solver tests.',
    tags: ['configuration', 'test', 'gateway-api', 'acme'],
    complexity: 'simple',
    symbols: [
      { kind: 'class', name: 'Gateway', lineRange: [21, 31], summary: 'Holds the Gateway API test domain and labels applied to solver HTTPRoutes.', tags: ['gateway-api', 'configuration', 'struct'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'AddFlags', lineRange: [33, 48], summary: 'Registers Gateway API domain and HTTPRoute label flags.', tags: ['gateway-api', 'flags', 'configuration'], complexity: 'simple', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/config/ginkgo.go',
    summary: 'Ginkgo report directory configuration for e2e test output.',
    tags: ['configuration', 'test', 'ginkgo', 'reporting'],
    complexity: 'simple',
    symbols: [
      { kind: 'class', name: 'Ginkgo', lineRange: [23, 25], summary: 'Holds the optional directory used for Ginkgo JUnit reports.', tags: ['ginkgo', 'configuration', 'reporting', 'struct'], complexity: 'simple', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/config/helm.go',
    summary: 'Helm binary path configuration and validation for e2e addon installs.',
    tags: ['configuration', 'test', 'helm', 'validation'],
    complexity: 'simple',
    symbols: [
      { kind: 'class', name: 'Helm', lineRange: [24, 27], summary: 'Holds the path to the Helm binary used by chart addons.', tags: ['helm', 'configuration', 'struct'], complexity: 'simple', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/config/ingress_controller.go',
    summary: 'Ingress controller domain and class configuration used by ACME HTTP-01 tests.',
    tags: ['configuration', 'test', 'ingress', 'acme'],
    complexity: 'simple',
    symbols: [
      { kind: 'class', name: 'IngressController', lineRange: [23, 32], summary: 'Holds the ingress domain and ingress class under test for HTTP-01 validation.', tags: ['ingress', 'configuration', 'struct'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'AddFlags', lineRange: [34, 38], summary: 'Registers ingress controller domain and class flags.', tags: ['ingress', 'flags', 'configuration'], complexity: 'simple', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/config/samplewebhook.go',
    summary: 'Configuration for the sample DNS-01 webhook addon, including API group and solver name.',
    tags: ['configuration', 'test', 'webhook', 'dns01'],
    complexity: 'simple',
    symbols: [
      { kind: 'class', name: 'DNS01Webhook', lineRange: [23, 29], summary: 'Holds the webhook API group and solver name used by DNS-01 tests.', tags: ['webhook', 'dns01', 'configuration', 'struct'], complexity: 'simple', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/config/suite.go',
    summary: 'Per-suite e2e configuration, currently nested ACME and Cloudflare credentials, with flag registration and validation.',
    tags: ['configuration', 'test', 'acme', 'cloudflare'],
    complexity: 'simple',
    symbols: [
      { kind: 'class', name: 'Suite', lineRange: [24, 26], summary: 'Top-level per-suite configuration that currently contains ACME settings.', tags: ['suite', 'configuration', 'struct'], complexity: 'simple', exported: true },
      { kind: 'class', name: 'ACME', lineRange: [28, 30], summary: 'ACME suite settings containing DNS provider credentials.', tags: ['acme', 'configuration', 'struct'], complexity: 'simple', exported: true },
      { kind: 'class', name: 'Cloudflare', lineRange: [32, 36], summary: 'Cloudflare domain, email, and API key used by ACME DNS-01 tests.', tags: ['cloudflare', 'credentials', 'configuration', 'struct'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'AddFlags', lineRange: [56, 63], summary: 'Registers Cloudflare domain, email, and API key flags.', tags: ['cloudflare', 'flags', 'configuration'], complexity: 'simple', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/config/venafi.go',
    summary: 'Venafi TPP and Cloud connection configuration with flag registration and validation for Venafi issuer tests.',
    tags: ['configuration', 'test', 'venafi', 'credentials'],
    complexity: 'moderate',
    symbols: [
      { kind: 'class', name: 'Venafi', lineRange: [25, 28], summary: 'Groups Venafi TPP and Cloud configuration for the e2e suite.', tags: ['venafi', 'configuration', 'struct'], complexity: 'simple', exported: true },
      { kind: 'class', name: 'VenafiTPPConfiguration', lineRange: [30, 36], summary: 'TPP URL, zone, username, password, and access token settings.', tags: ['venafi', 'tpp', 'configuration', 'struct'], complexity: 'simple', exported: true },
      { kind: 'class', name: 'VenafiCloudConfiguration', lineRange: [38, 41], summary: 'Venafi Cloud zone and API token settings.', tags: ['venafi', 'cloud', 'configuration', 'struct'], complexity: 'simple', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/framework.go',
    summary: 'Core e2e Framework that creates a namespace and Kubernetes/cert-manager clients per test, tracks required addons, and guarantees cleanup.',
    tags: ['test', 'framework', 'kubernetes', 'lifecycle', 'entry-point'],
    complexity: 'complex',
    notes: 'Registers Ginkgo BeforeEach/AfterEach hooks from the constructor and combines Kubernetes, cert-manager, apiextensions, and apiregistration schemes.',
    symbols: [
      { kind: 'class', name: 'Framework', lineRange: [52, 81], summary: 'Per-test e2e context holding config, clientsets, scheme, namespace, cleanup handle, and required addons.', tags: ['framework', 'kubernetes', 'lifecycle', 'struct'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'NewFramework', lineRange: [93, 111], summary: 'Creates the framework, builds a combined Kubernetes/cert-manager scheme, and hooks Ginkgo BeforeEach/AfterEach.', tags: ['framework', 'initialization', 'ginkgo'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'BeforeEach', lineRange: [114, 157], summary: 'Builds clients from the kubeconfig, creates a test namespace, and installs a cleanup action.', tags: ['framework', 'setup', 'kubernetes'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'AfterEach', lineRange: [160, 178], summary: 'Prints addon logs on failure, deletes the test namespace, and runs cleanup actions.', tags: ['framework', 'cleanup', 'kubernetes'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'printAddonLogs', lineRange: [180, 194], summary: 'Fetches addon logs and writes them to the Ginkgo writer when a test fails.', tags: ['framework', 'logging', 'debugging'], complexity: 'moderate', exported: false },
      { kind: 'function', name: 'RequireGlobalAddon', lineRange: [202, 208], summary: 'Asserts that a global addon was provisioned by the suite before the test runs.', tags: ['framework', 'addon', 'assertion'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'RequireAddon', lineRange: [216, 230], summary: 'Registers a per-test addon and ensures it is provisioned before the test runs.', tags: ['framework', 'addon', 'setup'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'CertManagerDescribe', lineRange: [237, 239], summary: 'Wraps Ginkgo Describe with cert-manager e2e suite conventions.', tags: ['framework', 'ginkgo', 'test-suite'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'ConformanceDescribe', lineRange: [241, 243], summary: 'Wraps Ginkgo Describe for conformance test suites.', tags: ['framework', 'ginkgo', 'conformance'], complexity: 'simple', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/helper/certificaterequests.go',
    summary: 'Helper routines that wait for and validate issued CertificateRequests, including expected key usage checks.',
    tags: ['test', 'helper', 'certificaterequest', 'validation'],
    complexity: 'complex',
    symbols: [
      { kind: 'function', name: 'WaitForCertificateRequestReady', lineRange: [47, 80], summary: 'Polls until the named CertificateRequest has a Ready condition and surfaces a Failed reason as an error.', tags: ['certificaterequest', 'wait', 'helper'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'ValidateIssuedCertificateRequest', lineRange: [86, 196], summary: 'Validates the issued certificate data against the request, issuer expectations, and expected key usages.', tags: ['certificaterequest', 'validation', 'certificate'], complexity: 'complex', exported: true },
      { kind: 'function', name: 'WaitCertificateRequestIssuedValid', lineRange: [198, 220], summary: 'Waits for CertificateRequest readiness and then validates the issued certificate.', tags: ['certificaterequest', 'wait', 'validation'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'WaitCertificateRequestIssuedValidTLS', lineRange: [222, 265], summary: 'Waits for readiness, validates issuance, and verifies the resulting TLS chain against the root CA.', tags: ['certificaterequest', 'tls', 'validation'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'computeExpectedKeyUsages', lineRange: [275, 320], summary: 'Derives expected key usages from the request, issuer spec, CA flag, and key algorithm.', tags: ['certificaterequest', 'key-usage', 'validation'], complexity: 'moderate', exported: false },
    ],
  },
  {
    path: 'test/e2e/framework/helper/certificates.go',
    summary: 'Helper routines that wait for Certificate and Issuer readiness and compare key usages for e2e assertions.',
    tags: ['test', 'helper', 'certificate', 'wait', 'validation'],
    complexity: 'complex',
    symbols: [
      { kind: 'function', name: 'WaitForCertificateToExist', lineRange: [39, 59], summary: 'Polls until the named Certificate exists in the namespace.', tags: ['certificate', 'wait', 'helper'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'waitForCertificateCondition', lineRange: [61, 96], summary: 'Polls a Certificate until the supplied condition check passes.', tags: ['certificate', 'wait', 'condition'], complexity: 'moderate', exported: false },
      { kind: 'function', name: 'WaitForCertificateReadyAndDoneIssuing', lineRange: [100, 137], summary: 'Waits for a Certificate to be Ready and finished issuing.', tags: ['certificate', 'wait', 'readiness'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'WaitForCertificateNotReadyAndDoneIssuing', lineRange: [141, 178], summary: 'Waits for a Certificate to be not Ready while issuing has completed.', tags: ['certificate', 'wait', 'readiness'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'waitForIssuerCondition', lineRange: [180, 200], summary: 'Polls a namespaced Issuer until the supplied condition check passes.', tags: ['issuer', 'wait', 'condition'], complexity: 'moderate', exported: false },
      { kind: 'function', name: 'WaitIssuerReady', lineRange: [204, 225], summary: 'Waits for a namespaced Issuer to become Ready.', tags: ['issuer', 'wait', 'readiness'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'waitForClusterIssuerCondition', lineRange: [227, 247], summary: 'Polls a ClusterIssuer until the supplied condition check passes.', tags: ['clusterissuer', 'wait', 'condition'], complexity: 'moderate', exported: false },
      { kind: 'function', name: 'WaitClusterIssuerReady', lineRange: [251, 271], summary: 'Waits for a ClusterIssuer to become Ready.', tags: ['clusterissuer', 'wait', 'readiness'], complexity: 'moderate', exported: true },
      { kind: 'function', name: 'keyUsagesMatch', lineRange: [273, 298], summary: 'Compares expected and actual key usage sets for certificate validation.', tags: ['key-usage', 'validation', 'certificate'], complexity: 'moderate', exported: false },
    ],
  },
  {
    path: 'test/e2e/framework/helper/certificatesigningrequests.go',
    summary: 'Helper that waits for a Kubernetes CertificateSigningRequest to be signed.',
    tags: ['test', 'helper', 'csr', 'wait'],
    complexity: 'simple',
    symbols: [
      { kind: 'function', name: 'WaitForCertificateSigningRequestSigned', lineRange: [34, 61], summary: 'Polls until the CertificateSigningRequest has a signed certificate attached.', tags: ['csr', 'wait', 'kubernetes'], complexity: 'moderate', exported: true },
    ],
  },
  {
    path: 'test/e2e/framework/helper/describe.go',
    summary: 'Serializes Kubernetes and cert-manager objects to YAML in the test log for debugging.',
    tags: ['test', 'helper', 'debugging', 'serialization'],
    complexity: 'simple',
    symbols: [],
  },
  {
    path: 'test/e2e/framework/helper/featureset/featureset.go',
    summary: 'Defines issuer feature flags and feature sets used to skip unsupported conformance tests.',
    tags: ['test', 'feature-flags', 'conformance', 'type-definition'],
    complexity: 'moderate',
    symbols: [],
  },
  {
    path: 'test/e2e/framework/helper/helper.go',
    summary: 'Shared helper container holding suite config plus Kubernetes and cert-manager clients for test utilities.',
    tags: ['test', 'helper', 'client', 'factory'],
    complexity: 'simple',
    symbols: [
      { kind: 'class', name: 'Helper', lineRange: [27, 32], summary: 'Holds suite config plus Kubernetes and cert-manager clients for helper methods.', tags: ['helper', 'client', 'struct'], complexity: 'simple', exported: true },
      { kind: 'function', name: 'NewHelper', lineRange: [34, 38], summary: 'Constructs a Helper bound to the given suite config.', tags: ['helper', 'factory', 'initialization'], complexity: 'simple', exported: true },
    ],
  },
];

const nodes = [];
const edges = [];
const fileNodeId = (d) => 'file:' + d.path;

for (const d of D) {
  nodes.push({
    id: fileNodeId(d),
    type: 'file',
    name: d.path.split('/').pop(),
    filePath: d.path,
    summary: d.summary,
    tags: d.tags,
    complexity: d.complexity,
    ...(d.notes ? { languageNotes: d.notes } : {}),
  });
  for (const s of d.symbols) {
    const id = s.kind + ':' + d.path + ':' + s.name;
    nodes.push({
      id,
      type: s.kind,
      name: s.name,
      filePath: d.path,
      lineRange: s.lineRange,
      summary: s.summary,
      tags: s.tags,
      complexity: s.complexity,
    });
    edges.push({ source: fileNodeId(d), target: id, type: 'contains', direction: 'forward', weight: 1.0 });
    if (s.exported) {
      edges.push({ source: fileNodeId(d), target: id, type: 'exports', direction: 'forward', weight: 0.8 });
    }
  }
}

// Import edges: exactly one per resolved path in batchImportData.
let importCount = 0;
for (const d of D) {
  const imports = batch.batchImportData[d.path] || [];
  for (const target of imports) {
    edges.push({ source: fileNodeId(d), target: 'file:' + target, type: 'imports', direction: 'forward', weight: 0.7 });
    importCount++;
  }
}

const fn = (p, n) => 'function:' + p + ':' + n;
const cls = (p, n) => 'class:' + p + ':' + n;
const CHART = 'test/e2e/framework/addon/chart/addon.go';
const VAULT = 'test/e2e/framework/addon/vault/vault.go';
const VSETUP = 'test/e2e/framework/addon/vault/setup.go';
const FW = 'test/e2e/framework/framework.go';
const HCR = 'test/e2e/framework/helper/certificaterequests.go';
const HCERT = 'test/e2e/framework/helper/certificates.go';

const callPairs = [
  // chart addon internal pipeline
  [fn(CHART, 'Provision'), fn(CHART, 'addRepo')],
  [fn(CHART, 'Provision'), fn(CHART, 'runDepUpdate')],
  [fn(CHART, 'Provision'), fn(CHART, 'runInstall')],
  [fn(CHART, 'runDepUpdate'), fn(CHART, 'buildHelmCmd')],
  [fn(CHART, 'runInstall'), fn(CHART, 'buildHelmCmd')],
  [fn(CHART, 'Deprovision'), fn(CHART, 'buildHelmCmd')],
  [fn(CHART, 'addRepo'), fn(CHART, 'buildHelmCmd')],
  // vault addon drives the chart addon
  [fn(VAULT, 'Setup'), fn(CHART, 'Setup')],
  [fn(VAULT, 'Provision'), fn(CHART, 'Provision')],
  [fn(VAULT, 'Deprovision'), fn(CHART, 'Deprovision')],
  [fn(VAULT, 'Setup'), fn(VAULT, 'GenerateCA')],
  [fn(VAULT, 'Setup'), fn(VAULT, 'generateVaultServingCert')],
  [fn(VAULT, 'Setup'), fn(VAULT, 'generateVaultClientCert')],
  // vault initializer pipeline
  [fn(VSETUP, 'Setup'), fn(VSETUP, 'mountPKI')],
  [fn(VSETUP, 'Setup'), fn(VSETUP, 'generateRootCert')],
  [fn(VSETUP, 'Setup'), fn(VSETUP, 'generateIntermediateSigningReq')],
  [fn(VSETUP, 'Setup'), fn(VSETUP, 'signCertificate')],
  [fn(VSETUP, 'Setup'), fn(VSETUP, 'importSignIntermediate')],
  [fn(VSETUP, 'Setup'), fn(VSETUP, 'configureIntermediateRoles')],
  [fn(VSETUP, 'Setup'), fn(VSETUP, 'setupAppRoleAuth')],
  [fn(VSETUP, 'Setup'), fn(VSETUP, 'setupKubernetesBasedAuth')],
  [fn(VSETUP, 'Setup'), fn(VSETUP, 'setupClientCertAuth')],
  [fn(VSETUP, 'CreateKubernetesRoleForServiceAccountRefAuth'), fn(VSETUP, 'RoleAndBindingForServiceAccountRefAuth')],
  // framework
  [fn(FW, 'NewFramework'), fn('test/e2e/framework/helper/helper.go', 'NewHelper')],
  [fn(FW, 'NewFramework'), fn(FW, 'BeforeEach')],
  [fn(FW, 'NewFramework'), fn(FW, 'AfterEach')],
  [fn(FW, 'NewFramework'), fn('test/e2e/framework/cleanup.go', 'AddCleanupAction')],
  [fn(FW, 'AfterEach'), fn(FW, 'printAddonLogs')],
  [fn(FW, 'RequireAddon'), fn(FW, 'BeforeEach')],
  [fn(FW, 'RequireGlobalAddon'), fn(FW, 'BeforeEach')],
  // certificate request helpers
  [fn(HCR, 'WaitCertificateRequestIssuedValid'), fn(HCR, 'WaitForCertificateRequestReady')],
  [fn(HCR, 'WaitCertificateRequestIssuedValid'), fn(HCR, 'ValidateIssuedCertificateRequest')],
  [fn(HCR, 'WaitCertificateRequestIssuedValidTLS'), fn(HCR, 'WaitCertificateRequestIssuedValid')],
  [fn(HCR, 'ValidateIssuedCertificateRequest'), fn(HCR, 'computeExpectedKeyUsages')],
  // certificate helpers
  [fn(HCERT, 'WaitForCertificateReadyAndDoneIssuing'), fn(HCERT, 'waitForCertificateCondition')],
  [fn(HCERT, 'WaitForCertificateNotReadyAndDoneIssuing'), fn(HCERT, 'waitForCertificateCondition')],
  [fn(HCERT, 'WaitIssuerReady'), fn(HCERT, 'waitForIssuerCondition')],
  [fn(HCERT, 'WaitClusterIssuerReady'), fn(HCERT, 'waitForClusterIssuerCondition')],
];

const nodeIds = new Set(nodes.map((n) => n.id));
for (const [source, target] of callPairs) {
  if (!nodeIds.has(source) || !nodeIds.has(target) || source === target) continue;
  edges.push({ source, target, type: 'calls', direction: 'forward', weight: 0.8 });
}

// Sanity checks
const ids = nodes.map((n) => n.id);
if (new Set(ids).size !== ids.length) throw new Error('duplicate node ids');
for (const e of edges) {
  if (e.source === e.target) throw new Error('self edge ' + e.source);
  if (!nodeIds.has(e.source)) throw new Error('missing edge source ' + e.source);
  if (!nodeIds.has(e.target) && !e.target.startsWith('file:')) throw new Error('missing edge target ' + e.target);
}
console.log(JSON.stringify({ nodes: nodes.length, edges: edges.length, importCount, callEdges: edges.filter((e) => e.type === 'calls').length }, null, 2));

// Partition: 5 alphabetically consecutive files per part, 6 parts.
const sorted = D.map((d) => d.path).sort();
const CHUNK = 5;
const parts = [];
for (let i = 0; i < sorted.length; i += CHUNK) parts.push(sorted.slice(i, i + CHUNK));

fs.mkdirSync('/Users/samtyga/Desktop/work/cert-manager/.ua/intermediate', { recursive: true });
parts.forEach((group, idx) => {
  const set = new Set(group);
  const pn = nodes.filter((n) => set.has(n.filePath));
  const pIds = new Set(pn.map((n) => n.id));
  const pe = edges.filter((e) => {
    if (!pIds.has(e.source)) return false;
    // Keep cross-part targets only for file-level edges, which validation allows
    // via batchImportData/neighborMap; drop function-level cross-part calls.
    if (e.type === 'calls' && !pIds.has(e.target)) return false;
    return true;
  });
  const out = '/Users/samtyga/Desktop/work/cert-manager/.ua/intermediate/batch-12-part-' + (idx + 1) + '.json';
  fs.writeFileSync(out, JSON.stringify({ nodes: pn, edges: pe }, null, 2));
  console.log(out, 'nodes=' + pn.length, 'edges=' + pe.length, 'files=' + group.length);
});
