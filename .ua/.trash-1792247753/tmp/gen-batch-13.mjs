import fs from 'node:fs'

const projectRoot = '/Users/samtyga/Desktop/work/cert-manager'
const prompt = JSON.parse(fs.readFileSync(projectRoot + '/.ua/tmp/prompts/batch-13.json', 'utf8'))
const batchFiles = prompt.files
const batchImportData = prompt.batchImportData

const T = {
  test: 'test',
  e2e: 'e2e',
  helper: 'helper',
  validation: 'validation',
  certs: 'certificates',
  cr: 'certificate-request',
  csr: 'certificate-signing-request',
  framework: 'framework',
  ginkgo: 'ginkgo',
  k8s: 'kubernetes',
  assertion: 'assertions',
  conformance: 'conformance',
}

// kind: f = function, c = class; exported flag drives `exports` edge
const files = {
  'test/e2e/framework/helper/kubectl.go': {
    summary:
      'Wraps kubectl execution with the test namespace, kubeconfig and context, and formats describe output used when e2e tests fail.',
    tags: ['test', 'helper', 'kubectl', 'e2e', 'debugging'],
    subs: [
      { kind: 'c', name: 'Kubectl', range: [27, 32], exported: true,
        summary: 'Holds the namespace, kubectl binary and kubeconfig/context used to invoke kubectl inside e2e tests.',
        tags: ['test', 'helper', 'kubectl', 'struct'] },
      { kind: 'f', name: 'Describe', range: [34, 37], exported: true,
        summary: 'Returns kubectl describe output for the test namespace environment for failure diagnostics.',
        tags: ['test', 'helper', 'kubectl', 'diagnostics'] },
      { kind: 'f', name: 'DescribeResource', range: [39, 41], exported: true,
        summary: 'Returns kubectl describe output for a named resource as a kind/name string.',
        tags: ['test', 'helper', 'kubectl', 'diagnostics'] },
      { kind: 'f', name: 'Kubectl', range: [43, 50], exported: true,
        summary: 'Builds a Kubectl runner bound to a namespace using the framework kubeconfig and current context.',
        tags: ['test', 'helper', 'kubectl', 'factory'] },
      { kind: 'f', name: 'Run', range: [52, 64], exported: true,
        summary: 'Runs kubectl with the configured namespace, kubeconfig and context, returning combined output for assertions.',
        tags: ['test', 'helper', 'kubectl', 'command-execution'] },
    ],
  },
  'test/e2e/framework/helper/secret.go': {
    summary:
      'Polls a Kubernetes Secret until cert-manager has populated its certificate data, so e2e tests can assert on issued material.',
    tags: ['test', 'helper', 'secret', 'polling', 'kubernetes'],
    subs: [
      { kind: 'f', name: 'WaitForSecretCertificateData', range: [33, 59], exported: true,
        summary: 'Waits for the named Secret to contain non-empty certificate data, failing the test once the timeout expires.',
        tags: ['test', 'helper', 'secret', 'polling', 'wait'] },
    ],
  },
  'test/e2e/framework/helper/validate.go': {
    summary:
      'Helper methods that fetch issued Secrets and run validation function sets against Certificates, CertificateRequests and CertificateSigningRequests.',
    tags: ['test', 'helper', 'validation', 'e2e', 'certificates'],
    subs: [
      { kind: 'f', name: 'ValidateCertificate', range: [37, 62], exported: true,
        summary: "Fetches the Certificate's target Secret and applies every validation function, aggregating failures with resource descriptions.",
        tags: ['test', 'validation', 'certificates', 'assertions'] },
      { kind: 'f', name: 'ValidateCertificateRequest', range: [65, 83], exported: true,
        summary: 'Fetches the issued CertificateRequest material and applies every validation function, aggregating errors.',
        tags: ['test', 'validation', 'certificate-request', 'assertions'] },
      { kind: 'f', name: 'ValidateCertificateSigningRequest', range: [86, 103], exported: true,
        summary: 'Fetches the signed CertificateSigningRequest material and applies every validation function, aggregating errors.',
        tags: ['test', 'validation', 'certificate-signing-request', 'assertions'] },
    ],
  },
  'test/e2e/framework/helper/validation/certificaterequests/certificaterequests.go': {
    summary:
      'Empty-package assertions that verify an issued CertificateRequest matches its requested subject, SANs, key usages, conditions and duration.',
    tags: ['test', 'validation', 'certificate-request', 'assertions', 'e2e'],
    subs: [
      { kind: 'f', name: 'ExpectValidCertificate', range: [40, 43], exported: true,
        summary: 'Asserts the CertificateRequest carries a non-empty issued certificate.',
        tags: ['test', 'validation', 'certificate', 'assertions'] },
      { kind: 'f', name: 'ExpectCertificateOrganizationToMatch', range: [47, 63], exported: true,
        summary: "Asserts the issued certificate's organization fields match the CertificateRequest spec.",
        tags: ['test', 'validation', 'subject', 'assertions'] },
      { kind: 'f', name: 'ExpectValidPrivateKeyData', range: [67, 95], exported: true,
        summary: 'Decodes the private key and verifies it matches the certificate public key and requested key algorithm.',
        tags: ['test', 'validation', 'private-key', 'assertions'] },
      { kind: 'f', name: 'ExpectCertificateDNSNamesToMatch', range: [100, 116], exported: true,
        summary: 'Asserts the certificate DNS SANs exactly match the CertificateRequest spec.',
        tags: ['test', 'validation', 'dns', 'assertions'] },
      { kind: 'f', name: 'ExpectCertificateURIsToMatch', range: [120, 137], exported: true,
        summary: 'Asserts the certificate URI SANs match the CertificateRequest spec.',
        tags: ['test', 'validation', 'uri', 'assertions'] },
      { kind: 'f', name: 'ExpectCertificateIPsToMatch', range: [141, 158], exported: true,
        summary: 'Asserts the certificate IP address SANs match the CertificateRequest spec.',
        tags: ['test', 'validation', 'ip-address', 'assertions'] },
      { kind: 'f', name: 'ExpectValidCommonName', range: [161, 183], exported: true,
        summary: 'Asserts the certificate common name matches the CertificateRequest spec.',
        tags: ['test', 'validation', 'common-name', 'assertions'] },
      { kind: 'f', name: 'ExpectKeyUsageExtKeyUsageServerAuth', range: [187, 197], exported: true,
        summary: 'Asserts the certificate includes the server authentication extended key usage.',
        tags: ['test', 'validation', 'key-usage', 'assertions'] },
      { kind: 'f', name: 'ExpectKeyUsageExtKeyUsageClientAuth', range: [201, 211], exported: true,
        summary: 'Asserts the certificate includes the client authentication extended key usage.',
        tags: ['test', 'validation', 'key-usage', 'assertions'] },
      { kind: 'f', name: 'ExpectEmailsToMatch', range: [214, 229], exported: true,
        summary: 'Asserts the certificate email SANs match the CertificateRequest spec.',
        tags: ['test', 'validation', 'email', 'assertions'] },
      { kind: 'f', name: 'ExpectValidBasicConstraints', range: [232, 246], exported: true,
        summary: 'Asserts the certificate basic constraints (CA flag and path length) are as expected.',
        tags: ['test', 'validation', 'basic-constraints', 'assertions'] },
      { kind: 'f', name: 'ExpectConditionApproved', range: [250, 256], exported: true,
        summary: 'Asserts the CertificateRequest has an Approved condition set to True.',
        tags: ['test', 'validation', 'conditions', 'assertions'] },
      { kind: 'f', name: 'ExpectConditionNotDenied', range: [260, 266], exported: true,
        summary: 'Asserts the CertificateRequest has no Denied condition.',
        tags: ['test', 'validation', 'conditions', 'assertions'] },
      { kind: 'f', name: 'ExpectDurationToMatch', range: [269, 272], exported: true,
        summary: "Asserts the issued certificate duration matches the request's requested duration within the allowed fuzz.",
        tags: ['test', 'validation', 'duration', 'assertions'] },
      { kind: 'f', name: 'ExpectDuration', range: [274, 298], exported: true,
        summary: 'Computes whether the observed certificate lifetime falls within the expected duration plus or minus fuzz seconds.',
        tags: ['test', 'validation', 'duration', 'utility'] },
    ],
  },
  'test/e2e/framework/helper/validation/certificates/certificates.go': {
    summary:
      'Empty-package assertions that verify the Secret issued for a Certificate matches its spec, including SANs, key usages, trust chain and additional output formats.',
    tags: ['test', 'validation', 'certificates', 'assertions', 'secret'],
    subs: [
      { kind: 'f', name: 'ExpectValidKeysInSecret', range: [43, 58], exported: true,
        summary: 'Asserts the target Secret contains the private key and certificate entries cert-manager is expected to write.',
        tags: ['test', 'validation', 'secret', 'assertions'] },
      { kind: 'f', name: 'ExpectValidAnnotations', range: [61, 72], exported: true,
        summary: "Asserts the Secret's annotations include those defined by the Certificate secret template.",
        tags: ['test', 'validation', 'annotations', 'assertions'] },
      { kind: 'f', name: 'ExpectValidPrivateKeyData', range: [75, 91], exported: true,
        summary: 'Decodes the private key from the Secret and verifies it matches the certificate public key and requested algorithm.',
        tags: ['test', 'validation', 'private-key', 'assertions'] },
      { kind: 'f', name: 'ExpectValidCertificate', range: [94, 106], exported: true,
        summary: 'Parses the issued certificate and asserts it is valid for the requested DNS name and not expired.',
        tags: ['test', 'validation', 'certificate', 'assertions'] },
      { kind: 'f', name: 'ExpectCertificateOrganizationToMatch', range: [109, 141], exported: true,
        summary: "Asserts the certificate's subject organization entries match the Certificate spec.",
        tags: ['test', 'validation', 'subject', 'assertions'] },
      { kind: 'f', name: 'ExpectCertificateDNSNamesToMatch', range: [144, 157], exported: true,
        summary: "Asserts the certificate's DNS SANs match the Certificate spec exactly.",
        tags: ['test', 'validation', 'dns', 'assertions'] },
      { kind: 'f', name: 'ExpectCertificateURIsToMatch', range: [160, 173], exported: true,
        summary: "Asserts the certificate's URI SANs match the Certificate spec.",
        tags: ['test', 'validation', 'uri', 'assertions'] },
      { kind: 'f', name: 'ExpectCertificateIPsToMatch', range: [176, 189], exported: true,
        summary: "Asserts the certificate's IP address SANs match the Certificate spec.",
        tags: ['test', 'validation', 'ip-address', 'assertions'] },
      { kind: 'f', name: 'ExpectValidCommonName', range: [192, 210], exported: true,
        summary: "Asserts the certificate's common name matches the Certificate spec.",
        tags: ['test', 'validation', 'common-name', 'assertions'] },
      { kind: 'f', name: 'ExpectValidNotAfterDate', range: [213, 227], exported: true,
        summary: "Asserts the certificate's notAfter falls within the Certificate's requested duration window.",
        tags: ['test', 'validation', 'expiry', 'assertions'] },
      { kind: 'f', name: 'ExpectKeyUsageExtKeyUsageServerAuth', range: [230, 240], exported: true,
        summary: 'Asserts the certificate includes the server authentication extended key usage.',
        tags: ['test', 'validation', 'key-usage', 'assertions'] },
      { kind: 'f', name: 'ExpectKeyUsageExtKeyUsageClientAuth', range: [243, 253], exported: true,
        summary: 'Asserts the certificate includes the client authentication extended key usage.',
        tags: ['test', 'validation', 'key-usage', 'assertions'] },
      { kind: 'f', name: 'ExpectKeyUsageUsageDigitalSignature', range: [256, 271], exported: true,
        summary: 'Asserts the certificate key usage includes digital signature.',
        tags: ['test', 'validation', 'key-usage', 'assertions'] },
      { kind: 'f', name: 'ExpectKeyUsageUsageDataEncipherment', range: [274, 289], exported: true,
        summary: 'Asserts the certificate key usage includes data encipherment.',
        tags: ['test', 'validation', 'key-usage', 'assertions'] },
      { kind: 'f', name: 'ExpectEmailsToMatch', range: [292, 303], exported: true,
        summary: "Asserts the certificate's email SANs match the Certificate spec.",
        tags: ['test', 'validation', 'email', 'assertions'] },
      { kind: 'f', name: 'ExpectCorrectTrustChain', range: [306, 338], exported: true,
        summary: "Asserts the issued certificate verifies against the CA bundle stored in the Secret's ca.crt entry.",
        tags: ['test', 'validation', 'trust-chain', 'assertions'] },
      { kind: 'f', name: 'ExpectCARootCertificate', range: [341, 351], exported: true,
        summary: 'Asserts the CA certificate in the Secret is a valid root for the issued certificate.',
        tags: ['test', 'validation', 'trust-chain', 'assertions'] },
      { kind: 'f', name: 'ExpectConditionReadyObservedGeneration', range: [356, 365], exported: true,
        summary: "Asserts the Certificate's Ready condition reports the current observed generation.",
        tags: ['test', 'validation', 'conditions', 'assertions'] },
      { kind: 'f', name: 'ExpectValidBasicConstraints', range: [368, 381], exported: true,
        summary: 'Asserts the certificate basic constraints (CA flag and path length) are as expected.',
        tags: ['test', 'validation', 'basic-constraints', 'assertions'] },
      { kind: 'f', name: 'ExpectValidAdditionalOutputFormats', range: [385, 418], exported: true,
        summary: 'Asserts the Secret contains the requested additional output formats (combined PEM, DER) of the certificate and key.',
        tags: ['test', 'validation', 'additional-output-formats', 'assertions'] },
      { kind: 'f', name: 'ExpectDurationToMatch', range: [421, 424], exported: true,
        summary: 'Asserts the certificate duration matches the Certificate spec within the allowed fuzz.',
        tags: ['test', 'validation', 'duration', 'assertions'] },
      { kind: 'f', name: 'ExpectDuration', range: [427, 451], exported: true,
        summary: 'Computes whether the observed certificate lifetime falls within the expected duration plus or minus fuzz seconds.',
        tags: ['test', 'validation', 'duration', 'utility'] },
    ],
  },
  'test/e2e/framework/helper/validation/certificatesigningrequests/certificatesigningrequests.go': {
    summary:
      'Empty-package assertions that verify a signed CertificateSigningRequest matches its requested subject, SANs, key usages, conditions and duration.',
    tags: ['test', 'validation', 'certificate-signing-request', 'assertions', 'e2e'],
    subs: [
      { kind: 'f', name: 'ExpectValidCertificate', range: [42, 45], exported: true,
        summary: 'Asserts the CertificateSigningRequest carries a non-empty issued certificate.',
        tags: ['test', 'validation', 'certificate', 'assertions'] },
      { kind: 'f', name: 'ExpectCertificateOrganizationToMatch', range: [49, 65], exported: true,
        summary: "Asserts the signed certificate's organization fields match the CertificateSigningRequest spec.",
        tags: ['test', 'validation', 'subject', 'assertions'] },
      { kind: 'f', name: 'ExpectValidPrivateKeyData', range: [69, 97], exported: true,
        summary: 'Verifies the private key and issued certificate public keys match, honouring the requested key algorithm.',
        tags: ['test', 'validation', 'private-key', 'assertions'] },
      { kind: 'f', name: 'ExpectCertificateDNSNamesToMatch', range: [102, 118], exported: true,
        summary: 'Asserts the certificate DNS SANs exactly match the CertificateSigningRequest spec.',
        tags: ['test', 'validation', 'dns', 'assertions'] },
      { kind: 'f', name: 'ExpectCertificateURIsToMatch', range: [122, 139], exported: true,
        summary: 'Asserts the certificate URI SANs match the CertificateSigningRequest spec.',
        tags: ['test', 'validation', 'uri', 'assertions'] },
      { kind: 'f', name: 'ExpectCertificateIPsToMatch', range: [143, 160], exported: true,
        summary: 'Asserts the certificate IP address SANs match the CertificateSigningRequest spec.',
        tags: ['test', 'validation', 'ip-address', 'assertions'] },
      { kind: 'f', name: 'ExpectValidCommonName', range: [163, 185], exported: true,
        summary: 'Asserts the certificate common name matches the CertificateSigningRequest spec.',
        tags: ['test', 'validation', 'common-name', 'assertions'] },
      { kind: 'f', name: 'ExpectDurationToMatch', range: [188, 194], exported: true,
        summary: 'Asserts the signed certificate duration matches the request duration within the allowed fuzz.',
        tags: ['test', 'validation', 'duration', 'assertions'] },
      { kind: 'f', name: 'ExpectDuration', range: [197, 217], exported: true,
        summary: 'Computes whether the observed certificate lifetime falls within the expected duration plus or minus fuzz seconds.',
        tags: ['test', 'validation', 'duration', 'utility'] },
      { kind: 'f', name: 'ExpectKeyUsageExtKeyUsageServerAuth', range: [221, 231], exported: true,
        summary: 'Asserts the certificate includes the server authentication extended key usage.',
        tags: ['test', 'validation', 'key-usage', 'assertions'] },
      { kind: 'f', name: 'ExpectKeyUsageExtKeyUsageClientAuth', range: [235, 245], exported: true,
        summary: 'Asserts the certificate includes the client authentication extended key usage.',
        tags: ['test', 'validation', 'key-usage', 'assertions'] },
      { kind: 'f', name: 'ExpectKeyUsageUsageDigitalSignature', range: [249, 265], exported: true,
        summary: 'Asserts the certificate key usage includes digital signature.',
        tags: ['test', 'validation', 'key-usage', 'assertions'] },
      { kind: 'f', name: 'ExpectKeyUsageUsageDataEncipherment', range: [269, 285], exported: true,
        summary: 'Asserts the certificate key usage includes data encipherment.',
        tags: ['test', 'validation', 'key-usage', 'assertions'] },
      { kind: 'f', name: 'ExpectEmailsToMatch', range: [288, 303], exported: true,
        summary: 'Asserts the certificate email SANs match the CertificateSigningRequest spec.',
        tags: ['test', 'validation', 'email', 'assertions'] },
      { kind: 'f', name: 'ExpectValidBasicConstraints', range: [306, 322], exported: true,
        summary: 'Asserts the certificate basic constraints (CA flag and path length) are as expected.',
        tags: ['test', 'validation', 'basic-constraints', 'assertions'] },
      { kind: 'f', name: 'ExpectConditionApproved', range: [326, 332], exported: true,
        summary: 'Asserts the CertificateSigningRequest has an Approved condition set to True.',
        tags: ['test', 'validation', 'conditions', 'assertions'] },
      { kind: 'f', name: 'ExpectConditionNotDenied', range: [336, 342], exported: true,
        summary: 'Asserts the CertificateSigningRequest has no Denied condition.',
        tags: ['test', 'validation', 'conditions', 'assertions'] },
      { kind: 'f', name: 'ExpectConditionNotFailed', range: [346, 352], exported: true,
        summary: 'Asserts the CertificateSigningRequest has no Failed condition.',
        tags: ['test', 'validation', 'conditions', 'assertions'] },
    ],
  },
  'test/e2e/framework/helper/validation/validation.go': {
    summary:
      'Builds the validator lists used by e2e tests, skipping checks for certificate features the target issuer does not support.',
    tags: ['test', 'validation', 'feature-set', 'e2e', 'configuration'],
    subs: [
      { kind: 'f', name: 'CertificateSetForUnsupportedFeatureSet', range: [26, 72], exported: true,
        summary: 'Returns the Certificate validators to run, omitting checks whose features the issuer does not support.',
        tags: ['test', 'validation', 'certificates', 'feature-set'] },
      { kind: 'f', name: 'CertificateRequestSetForUnsupportedFeatureSet', range: [74, 108], exported: true,
        summary: 'Returns the CertificateRequest validators to run for the given unsupported feature set.',
        tags: ['test', 'validation', 'certificate-request', 'feature-set'] },
      { kind: 'f', name: 'CertificateSigningRequestSetForUnsupportedFeatureSet', range: [110, 147], exported: true,
        summary: 'Returns the CertificateSigningRequest validators to run for the given unsupported feature set.',
        tags: ['test', 'validation', 'certificate-signing-request', 'feature-set'] },
    ],
  },
  'test/e2e/framework/log/log.go': {
    summary:
      'Thin logging facade over the Ginkgo writer that adds timestamps and offers an exponential-backoff logger for noisy polling loops.',
    tags: ['test', 'logging', 'helper', 'ginkgo', 'utility'],
    subs: [
      { kind: 'f', name: 'Logf', range: [38, 40], exported: true,
        summary: 'Writes a timestamped, level-tagged formatted log line to the configured writer.',
        tags: ['test', 'logging', 'formatting'] },
      { kind: 'f', name: 'LogBackoff', range: [53, 83], exported: true,
        summary: 'Returns a logger that drops repeated messages while an exponential backoff timer is active.',
        tags: ['test', 'logging', 'backoff', 'rate-limiting'] },
    ],
  },
  'test/e2e/framework/matcher/have_condition_matcher.go': {
    summary:
      'Gomega matcher that waits for a resource to report a given condition, mapping typed conditions (Certificate, Issuer, etc.) through generic accessors.',
    tags: ['test', 'matcher', 'gomega', 'conditions', 'e2e'],
    subs: [
      { kind: 'c', name: 'conditionMatcher', range: [91, 94], exported: false,
        summary: 'Gomega matcher holding the expected condition and resource-to-condition extractor.',
        tags: ['test', 'matcher', 'gomega', 'struct'] },
      { kind: 'f', name: 'HaveCondition', range: [32, 37], exported: true,
        summary: 'Builds a matcher asserting a resource eventually reports the expected condition.',
        tags: ['test', 'matcher', 'gomega', 'factory'] },
      { kind: 'f', name: 'toGenericCondition', range: [42, 53], exported: false,
        summary: 'Normalises a typed condition into a generic type/status/reason struct.',
        tags: ['test', 'matcher', 'conditions', 'normalization'] },
      { kind: 'f', name: 'getUpToDateResource', range: [55, 66], exported: false,
        summary: 'Re-fetches the object being matched so the matcher evaluates the latest condition state.',
        tags: ['test', 'matcher', 'kubernetes', 'refresh'] },
      { kind: 'f', name: 'extractConditionSlice', range: [68, 87], exported: false,
        summary: 'Uses reflection to pull the Conditions slice out of a typed cert-manager resource.',
        tags: ['test', 'matcher', 'reflection', 'conditions'] },
      { kind: 'f', name: 'Match', range: [120, 147], exported: true,
        summary: 'Implements the Gomega matcher, polling until a condition matches or the timeout elapses.',
        tags: ['test', 'matcher', 'gomega', 'polling'] },
      { kind: 'f', name: 'matches', range: [149, 166], exported: false,
        summary: 'Compares expected and actual generic conditions, honouring unspecified fields.',
        tags: ['test', 'matcher', 'conditions', 'comparison'] },
      { kind: 'f', name: 'buildGenericCondition', range: [168, 180], exported: false,
        summary: 'Constructs a generic condition from a condition type, status and reason.',
        tags: ['test', 'matcher', 'conditions', 'factory'] },
      { kind: 'f', name: 'FailureMessage', range: [182, 199], exported: true,
        summary: 'Renders the failure message describing the conditions actually observed.',
        tags: ['test', 'matcher', 'diagnostics', 'gomega'] },
      { kind: 'f', name: 'NegatedFailureMessage', range: [201, 218], exported: true,
        summary: 'Renders the failure message for a negated condition assertion.',
        tags: ['test', 'matcher', 'diagnostics', 'gomega'] },
    ],
  },
  'test/e2e/framework/matcher/san_matchers.go': {
    summary:
      'Gomega matchers that compare the SAN extension of an issued certificate against expected DNS, IP, URI and email entries.',
    tags: ['test', 'matcher', 'san', 'gomega', 'certificates'],
    subs: [
      { kind: 'c', name: 'SANMatcher', range: [50, 52], exported: true,
        summary: 'Gomega matcher holding the expected subject alternative name extension.',
        tags: ['test', 'matcher', 'san', 'struct'] },
      { kind: 'f', name: 'HaveSameSANsAs', range: [35, 37], exported: true,
        summary: 'Builds a matcher comparing a certificate against the SANs of another certificate.',
        tags: ['test', 'matcher', 'san', 'factory'] },
      { kind: 'f', name: 'SANEquals', range: [40, 48], exported: true,
        summary: 'Builds a matcher comparing a certificate SAN extension against an expected extension.',
        tags: ['test', 'matcher', 'san', 'factory'] },
      { kind: 'f', name: 'Match', range: [55, 95], exported: true,
        summary: 'Parses the certificate and compares its SAN extension with the expected one, order-independently.',
        tags: ['test', 'matcher', 'san', 'comparison'] },
      { kind: 'f', name: 'sortGeneralNamesByTagBytes', range: [99, 114], exported: false,
        summary: 'Sorts ASN.1 general names by tag and bytes so SAN comparisons are order-insensitive.',
        tags: ['test', 'matcher', 'san', 'sorting'] },
      { kind: 'f', name: 'extractSANsFromCertificate', range: [127, 142], exported: false,
        summary: 'Parses a DER certificate and extracts its subject alternative name extension.',
        tags: ['test', 'matcher', 'x509', 'parsing'] },
    ],
  },
  'test/e2e/framework/testenv.go': {
    summary:
      'Provisioning helpers that create and delete per-test Kubernetes namespaces and apply resource quotas to them.',
    tags: ['test', 'helper', 'kubernetes', 'namespace', 'provisioning'],
    subs: [
      { kind: 'f', name: 'CreateKubeNamespace', range: [37, 45], exported: true,
        summary: 'Creates a uniquely named namespace for a test and registers cleanup.',
        tags: ['test', 'kubernetes', 'namespace', 'provisioning'] },
      { kind: 'f', name: 'CreateKubeResourceQuota', range: [49, 67], exported: true,
        summary: 'Creates a resource quota in the test namespace to bound resource consumption during e2e runs.',
        tags: ['test', 'kubernetes', 'resource-quota', 'provisioning'] },
      { kind: 'f', name: 'DeleteKubeNamespace', range: [70, 72], exported: true,
        summary: 'Deletes the given namespace, ignoring not-found errors.',
        tags: ['test', 'kubernetes', 'namespace', 'cleanup'] },
    ],
  },
  'test/e2e/framework/util.go': {
    summary:
      'Shared e2e test utilities for failing and skipping tests, gating on feature gates, and checking RBAC access to resources.',
    tags: ['test', 'helper', 'utility', 'rbac', 'e2e'],
    subs: [
      { kind: 'f', name: 'Failf', range: [40, 44], exported: true,
        summary: 'Fails the current test with a timestamped formatted message.',
        tags: ['test', 'utility', 'failure', 'logging'] },
      { kind: 'f', name: 'Skipf', range: [46, 50], exported: true,
        summary: 'Skips the current test with a timestamped formatted message.',
        tags: ['test', 'utility', 'skip', 'logging'] },
      { kind: 'f', name: 'RequireFeatureGate', range: [52, 56], exported: true,
        summary: 'Skips the test when the required feature gate is not enabled in the feature set.',
        tags: ['test', 'utility', 'feature-gate', 'skip'] },
      { kind: 'f', name: 'RbacClusterRoleHasAccessToResource', range: [59, 114], exported: true,
        summary: 'Uses SelfSubjectAccessReview to assert a ClusterRole grants the given verb on a resource.',
        tags: ['test', 'utility', 'rbac', 'authorization'] },
    ],
  },
  'test/e2e/framework/util/config.go': {
    summary:
      'Loads the e2e kubeconfig and derives a REST client configuration for a named context.',
    tags: ['test', 'configuration', 'kubeconfig', 'client', 'utility'],
    subs: [
      { kind: 'f', name: 'RestclientConfig', range: [27, 39], exported: true,
        summary: 'Builds a rest.Config from the given client config and context, defaulting fields as needed.',
        tags: ['test', 'kubeconfig', 'client-config', 'utility'] },
      { kind: 'f', name: 'LoadConfig', range: [41, 47], exported: true,
        summary: 'Loads the kubeconfig from disk and returns the REST config for the requested context.',
        tags: ['test', 'kubeconfig', 'configuration', 'utility'] },
    ],
  },
  'test/e2e/framework/util/errors/errors.go': {
    summary:
      'Defines the skip error type shared by e2e tests and addons so they can signal that a test should be skipped.',
    tags: ['test', 'errors', 'skip', 'utility'],
    subs: [
      { kind: 'f', name: 'IsSkip', range: [25, 30], exported: true,
        summary: 'Reports whether an error is a skip error and returns the underlying cause.',
        tags: ['test', 'errors', 'skip', 'predicate'] },
      { kind: 'f', name: 'NewSkip', range: [32, 34], exported: true,
        summary: 'Wraps an error in a skip error so callers can request that a test be skipped.',
        tags: ['test', 'errors', 'skip', 'factory'] },
    ],
  },
  'test/e2e/suite/certificaterequests/approval/approval.go': {
    summary:
      'Ginkgo suite covering CertificateRequest approval: signer identity checks, policy violations against approved/denied requests, and approver RBAC.',
    tags: ['test', 'e2e', 'certificate-request', 'approval', 'ginkgo'],
    subs: [
      { kind: 'f', name: 'createCRD', range: [448, 477], exported: false,
        summary: 'Creates a test CRD cert-manager can issue for, used to exercise approval of unknown resource kinds.',
        tags: ['test', 'setup', 'crd', 'kubernetes'] },
      { kind: 'f', name: 'bindServiceAccountToApprove', range: [479, 513], exported: false,
        summary: 'Grants a service account permission to approve CertificateRequests for a specific resource name.',
        tags: ['test', 'setup', 'rbac', 'approval'] },
    ],
  },
  'test/e2e/suite/certificaterequests/approval/userinfo.go': {
    summary:
      'Ginkgo test verifying that UserInfo fields on CertificateRequests are populated correctly and rejected when modified.',
    tags: ['test', 'e2e', 'certificate-request', 'userinfo', 'ginkgo'],
    subs: [],
  },
  'test/e2e/suite/certificaterequests/doc.go': {
    summary:
      'Package documentation for the CertificateRequest e2e suite, importing its approval and self-signed sub-suites.',
    tags: ['test', 'e2e', 'documentation', 'certificate-request', 'suite'],
    subs: [],
  },
  'test/e2e/suite/certificaterequests/selfsigned/secret.go': {
    summary:
      'Ginkgo test ensuring a self-signed CertificateRequest is still signed when its private key Secret is created after the request.',
    tags: ['test', 'e2e', 'self-signed', 'certificate-request', 'secret'],
    subs: [],
  },
  'test/e2e/suite/certificates/additionaloutputformats.go': {
    summary:
      'Ginkgo test verifying Certificate additionalOutputFormats are written to the target Secret and reconciled when the Certificate is modified.',
    tags: ['test', 'e2e', 'certificates', 'additional-output-formats', 'ginkgo'],
    subs: [],
  },
  'test/e2e/suite/certificates/duplicatesecretname.go': {
    summary:
      'Ginkgo test ensuring Certificates sharing a spec.secretName in one namespace enter a blocking state that prevents CertificateRequest runaway.',
    tags: ['test', 'e2e', 'certificates', 'secret-name', 'ginkgo'],
    subs: [],
  },
  'test/e2e/suite/certificates/foregrounddeletion.go': {
    summary:
      'Ginkgo test verifying that foreground deletion of a Certificate does not recreate its CertificateRequest or Secret.',
    tags: ['test', 'e2e', 'certificates', 'deletion', 'ginkgo'],
    subs: [],
  },
  'test/e2e/suite/certificates/literalsubjectrdns.go': {
    summary:
      'Ginkgo test covering parsing of literal subject RDNs into the issued certificate subject.',
    tags: ['test', 'e2e', 'certificates', 'literal-subject', 'ginkgo'],
    subs: [],
  },
  'test/e2e/suite/certificates/othernamesan.go': {
    summary:
      'Ginkgo test covering OtherName subject alternative names on Certificates and their encoding in issued certificates.',
    tags: ['test', 'e2e', 'certificates', 'san', 'ginkgo'],
    subs: [],
  },
  'test/e2e/suite/certificates/secrettemplate.go': {
    summary:
      'Ginkgo test verifying Certificate secretTemplate labels and annotations are applied to the target Secret and reconciled on change.',
    tags: ['test', 'e2e', 'certificates', 'secret-template', 'ginkgo'],
    subs: [],
  },
  'test/e2e/suite/certificatesigningrequests/doc.go': {
    summary:
      'Package documentation for the CertificateSigningRequest e2e suite, importing its self-signed sub-suite.',
    tags: ['test', 'e2e', 'documentation', 'certificate-signing-request', 'suite'],
    subs: [],
  },
  'test/e2e/suite/certificatesigningrequests/selfsigned/selfsigned.go': {
    summary:
      'Ginkgo test ensuring a self-signed CertificateSigningRequest is signed even when its private key Secret is created afterwards.',
    tags: ['test', 'e2e', 'self-signed', 'certificate-signing-request', 'secret'],
    subs: [],
  },
  'test/e2e/suite/conformance/certificates/acme/acme.go': {
    summary:
      'Conformance certificate test suite for ACME issuers, provisioning HTTP-01 (Ingress and Gateway) and DNS-01 issuers against staging and in-cluster ACME servers.',
    tags: ['test', 'conformance', 'acme', 'certificates', 'issuers'],
    subs: [
      { kind: 'c', name: 'acmeIssuerProvisioner', range: [169, 172], exported: false,
        summary: 'Provisioner that creates and deletes ACME Issuers/ClusterIssuers and their supporting secrets for conformance tests.',
        tags: ['test', 'acme', 'issuer', 'struct'] },
      { kind: 'f', name: 'runACMEIssuerTests', range: [48, 167], exported: false,
        summary: 'Registers the ACME conformance tests, wiring solver and server variants into the shared certificate test definitions.',
        tags: ['test', 'conformance', 'acme', 'suite-registration'] },
      { kind: 'f', name: 'delete', range: [174, 184], exported: false,
        summary: 'Deletes the referenced issuer object and logs any error.',
        tags: ['test', 'acme', 'cleanup', 'kubernetes'] },
      { kind: 'f', name: 'createHTTP01IngressIssuer', range: [192, 216], exported: false,
        summary: 'Creates a namespaced ACME Issuer using the HTTP-01 Ingress solver.',
        tags: ['test', 'acme', 'http-01', 'issuer'] },
      { kind: 'f', name: 'createHTTP01IngressClusterIssuer', range: [218, 242], exported: false,
        summary: 'Creates a cluster-scoped ACME ClusterIssuer using the HTTP-01 Ingress solver.',
        tags: ['test', 'acme', 'http-01', 'cluster-issuer'] },
      { kind: 'f', name: 'createHTTP01GatewayIssuer', range: [244, 278], exported: false,
        summary: 'Creates a namespaced ACME Issuer using the HTTP-01 Gateway API solver.',
        tags: ['test', 'acme', 'http-01', 'gateway-api'] },
      { kind: 'f', name: 'createPublicACMEServerStagingHTTP01Issuer', range: [280, 310], exported: false,
        summary: 'Creates an issuer pointed at the public ACME staging server using the HTTP-01 Ingress solver.',
        tags: ['test', 'acme', 'staging', 'issuer'] },
      { kind: 'f', name: 'createHTTP01GatewayClusterIssuer', range: [312, 346], exported: false,
        summary: 'Creates a cluster-scoped ACME ClusterIssuer using the HTTP-01 Gateway API solver.',
        tags: ['test', 'acme', 'http-01', 'gateway-api'] },
      { kind: 'f', name: 'createHTTP01IngressIssuerSpec', range: [348, 373], exported: false,
        summary: 'Builds the ACME Issuer spec for the HTTP-01 Ingress solver against the given server URL.',
        tags: ['test', 'acme', 'issuer-spec', 'factory'] },
      { kind: 'f', name: 'createHTTP01GatewayIssuerSpec', range: [375, 406], exported: false,
        summary: 'Builds the ACME Issuer spec for the HTTP-01 Gateway solver with the given server URL and solver labels.',
        tags: ['test', 'acme', 'issuer-spec', 'gateway-api'] },
      { kind: 'f', name: 'createDNS01Issuer', range: [408, 431], exported: false,
        summary: 'Creates a namespaced ACME Issuer using the DNS-01 solver against the configured DNS server.',
        tags: ['test', 'acme', 'dns-01', 'issuer'] },
      { kind: 'f', name: 'createDNS01ClusterIssuer', range: [433, 456], exported: false,
        summary: 'Creates a cluster-scoped ACME ClusterIssuer using the DNS-01 solver.',
        tags: ['test', 'acme', 'dns-01', 'cluster-issuer'] },
      { kind: 'f', name: 'createDNS01IssuerSpec', range: [458, 482], exported: false,
        summary: 'Builds the ACME Issuer spec for the DNS-01 solver with the given server URL and DNS server.',
        tags: ['test', 'acme', 'issuer-spec', 'dns-01'] },
      { kind: 'f', name: 'ensureEABSecret', range: [484, 513], exported: false,
        summary: 'Creates or updates the External Account Binding secret required by the ACME server when configured.',
        tags: ['test', 'acme', 'external-account-binding', 'secret'] },
    ],
  },
  'test/e2e/suite/conformance/certificates/ca/ca.go': {
    summary:
      'Conformance certificate test suite for CA issuers, generating a root CA key pair Secret and wiring it into Issuer and ClusterIssuer objects.',
    tags: ['test', 'conformance', 'ca-issuer', 'certificates', 'issuers'],
    subs: [
      { kind: 'c', name: 'ca', range: [50, 52], exported: false,
        summary: 'Provisioner holding the root CA Secret name used to build CA issuers for conformance tests.',
        tags: ['test', 'ca-issuer', 'struct'] },
      { kind: 'f', name: 'createCAIssuer', range: [54, 81], exported: false,
        summary: 'Creates a namespaced CA Issuer referencing the generated root CA Secret.',
        tags: ['test', 'ca-issuer', 'issuer', 'kubernetes'] },
      { kind: 'f', name: 'createCAClusterIssuer', range: [83, 110], exported: false,
        summary: 'Creates a cluster-scoped CA ClusterIssuer backed by a root CA Secret in the cluster resource namespace.',
        tags: ['test', 'ca-issuer', 'cluster-issuer', 'kubernetes'] },
      { kind: 'f', name: 'deleteCAClusterIssuer', range: [112, 120], exported: false,
        summary: 'Deletes the referenced ClusterIssuer, logging failures.',
        tags: ['test', 'ca-issuer', 'cleanup', 'kubernetes'] },
      { kind: 'f', name: 'createCAIssuerSpec', range: [122, 130], exported: false,
        summary: 'Builds the CA Issuer spec pointing at the given root certificate Secret name.',
        tags: ['test', 'ca-issuer', 'issuer-spec', 'factory'] },
      { kind: 'f', name: 'newSigningKeypairSecret', range: [184, 194], exported: false,
        summary: 'Generates a self-signed CA key pair and returns it as a Kubernetes TLS Secret.',
        tags: ['test', 'ca-issuer', 'secret', 'key-generation'] },
    ],
  },
  'test/e2e/suite/conformance/certificates/external/external.go': {
    summary:
      'Conformance suite for externally managed issuers: derives namespaced and cluster-scoped Issuers from a prototype supplied by the test.',
    tags: ['test', 'conformance', 'external-issuer', 'certificates', 'fixtures'],
    subs: [
      { kind: 'c', name: 'issuerBuilder', range: [69, 72], exported: false,
        summary: 'Builder that holds a prototype issuer and the cluster resource namespace used to materialise test issuers.',
        tags: ['test', 'external-issuer', 'builder', 'struct'] },
      { kind: 'f', name: 'newIssuerBuilder', range: [74, 87], exported: false,
        summary: 'Creates an issuer builder for the given issuer kind using the framework cluster resource namespace.',
        tags: ['test', 'external-issuer', 'builder', 'factory'] },
      { kind: 'f', name: 'nameForTestObject', range: [89, 98], exported: false,
        summary: 'Derives a unique, DNS-safe object name for the current test.',
        tags: ['test', 'fixtures', 'naming', 'utility'] },
      { kind: 'f', name: 'secretAndIssuerForTest', range: [100, 117], exported: false,
        summary: 'Produces the secret and issuer pair to create for the current test from the prototype.',
        tags: ['test', 'external-issuer', 'fixtures', 'builders'] },
      { kind: 'f', name: 'create', range: [119, 138], exported: false,
        summary: 'Creates the test Secret and Issuer/ClusterIssuer and registers cleanup actions.',
        tags: ['test', 'external-issuer', 'kubernetes', 'setup'] },
      { kind: 'f', name: 'delete', range: [140, 153], exported: false,
        summary: 'Deletes the created Issuer/ClusterIssuer and Secret, logging failures.',
        tags: ['test', 'external-issuer', 'cleanup', 'kubernetes'] },
    ],
  },
  'test/e2e/suite/conformance/certificates/selfsigned/selfsigned.go': {
    summary:
      'Conformance certificate test suite for self-signed issuers, creating namespaced and cluster-scoped issuers without external dependencies.',
    tags: ['test', 'conformance', 'self-signed', 'certificates', 'issuers'],
    subs: [
      { kind: 'f', name: 'createSelfSignedIssuer', range: [47, 68], exported: false,
        summary: 'Creates a namespaced self-signed Issuer and registers cleanup.',
        tags: ['test', 'self-signed', 'issuer', 'kubernetes'] },
      { kind: 'f', name: 'deleteSelfSignedClusterIssuer', range: [70, 73], exported: false,
        summary: 'Deletes the referenced self-signed ClusterIssuer, ignoring not-found errors.',
        tags: ['test', 'self-signed', 'cleanup', 'kubernetes'] },
      { kind: 'f', name: 'createSelfSignedClusterIssuer', range: [75, 96], exported: false,
        summary: 'Creates a cluster-scoped self-signed ClusterIssuer and registers cleanup.',
        tags: ['test', 'self-signed', 'cluster-issuer', 'kubernetes'] },
      { kind: 'f', name: 'createSelfSignedIssuerSpec', range: [98, 104], exported: false,
        summary: 'Returns the minimal self-signed Issuer spec used by the conformance suite.',
        tags: ['test', 'self-signed', 'issuer-spec', 'factory'] },
    ],
  },
}

const nonEmpty = Object.fromEntries(batchFiles.map((f) => [f.path, null]))
const complexityFor = (n) => (n > 200 ? 'complex' : n >= 50 ? 'moderate' : 'simple')
const subComplexity = (range) => {
  const n = range[1] - range[0] + 1
  return n > 60 ? 'complex' : n >= 20 ? 'moderate' : 'simple'
}
const base = (p) => p.split('/').pop()

const nodes = []
const edges = []
const seen = new Set()
const addNode = (n) => {
  if (seen.has(n.id)) throw new Error('dup node ' + n.id)
  seen.add(n.id)
  nodes.push(n)
}

// derive non-empty line counts from extraction results for complexity
const extract = JSON.parse(fs.readFileSync(projectRoot + '/.ua/tmp/ua-file-extract-results-13.json', 'utf8'))
const lineMap = Object.fromEntries(extract.results.map((r) => [r.path, r.nonEmptyLines]))

for (const f of batchFiles) {
  const spec = files[f.path]
  if (!spec) throw new Error('missing spec for ' + f.path)
  const fileId = 'file:' + f.path
  addNode({
    id: fileId,
    type: 'file',
    name: base(f.path),
    filePath: f.path,
    summary: spec.summary,
    tags: spec.tags,
    complexity: complexityFor(lineMap[f.path] ?? f.sizeLines),
  })
  for (const s of spec.subs) {
    const id = (s.kind === 'c' ? 'class:' : 'function:') + f.path + ':' + s.name
    addNode({
      id,
      type: s.kind === 'c' ? 'class' : 'function',
      name: s.name,
      filePath: f.path,
      lineRange: s.range,
      summary: s.summary,
      tags: s.tags,
      complexity: subComplexity(s.range),
    })
    edges.push({ source: fileId, target: id, type: 'contains', direction: 'forward', weight: 1.0 })
    if (s.exported) {
      edges.push({ source: fileId, target: id, type: 'exports', direction: 'forward', weight: 0.8 })
    }
  }
  for (const target of batchImportData[f.path] || []) {
    edges.push({ source: fileId, target: 'file:' + target, type: 'imports', direction: 'forward', weight: 0.7 })
  }
}

const call = (fromFile, fromFn, toFile, toFn) =>
  edges.push({
    source: 'function:' + fromFile + ':' + fromFn,
    target: 'function:' + toFile + ':' + toFn,
    type: 'calls',
    direction: 'forward',
    weight: 0.8,
  })

const V = 'test/e2e/framework/helper/validation/validation.go'
const CRV = 'test/e2e/framework/helper/validation/certificaterequests/certificaterequests.go'
const CERTV = 'test/e2e/framework/helper/validation/certificates/certificates.go'
const CSRV = 'test/e2e/framework/helper/validation/certificatesigningrequests/certificatesigningrequests.go'
const VAL = 'test/e2e/framework/helper/validate.go'
const LOG = 'test/e2e/framework/log/log.go'

// validate.go delegates to the feature-set aware validator lists and the logger
call(VAL, 'ValidateCertificate', V, 'CertificateSetForUnsupportedFeatureSet')
call(VAL, 'ValidateCertificateRequest', V, 'CertificateRequestSetForUnsupportedFeatureSet')
call(VAL, 'ValidateCertificateSigningRequest', V, 'CertificateSigningRequestSetForUnsupportedFeatureSet')
call(VAL, 'ValidateCertificate', LOG, 'Logf')
call(VAL, 'ValidateCertificateRequest', LOG, 'Logf')
call(VAL, 'ValidateCertificateSigningRequest', LOG, 'Logf')

// validation.go composes validator functions from the per-kind packages
for (const fn of [
  'ExpectValidCertificate',
  'ExpectValidPrivateKeyData',
  'ExpectValidNotAfterDate',
  'ExpectValidAnnotations',
  'ExpectValidAdditionalOutputFormats',
  'ExpectCorrectTrustChain',
  'ExpectCARootCertificate',
]) {
  call(V, 'CertificateSetForUnsupportedFeatureSet', CERTV, fn)
}
for (const fn of [
  'ExpectValidCertificate',
  'ExpectValidPrivateKeyData',
  'ExpectConditionApproved',
  'ExpectConditionNotDenied',
]) {
  call(V, 'CertificateRequestSetForUnsupportedFeatureSet', CRV, fn)
}
for (const fn of [
  'ExpectValidCertificate',
  'ExpectValidPrivateKeyData',
  'ExpectKeyUsageUsageDigitalSignature',
  'ExpectConditionApproved',
  'ExpectConditionNotDenied',
  'ExpectConditionNotFailed',
]) {
  call(V, 'CertificateSigningRequestSetForUnsupportedFeatureSet', CSRV, fn)
}

// conformance suites register themselves through the shared Suite type defined in another batch
const SUITE = 'test/e2e/suite/conformance/certificates/suite.go'
for (const f of [
  'test/e2e/suite/conformance/certificates/acme/acme.go',
  'test/e2e/suite/conformance/certificates/ca/ca.go',
  'test/e2e/suite/conformance/certificates/external/external.go',
  'test/e2e/suite/conformance/certificates/selfsigned/selfsigned.go',
]) {
  edges.push({
    source: 'file:' + f,
    target: 'class:' + SUITE + ':Suite',
    type: 'calls',
    direction: 'forward',
    weight: 0.8,
  })
}

// ---- partitioning ----
const paths = batchFiles.map((f) => f.path).slice().sort()
const nodeCount = nodes.length
const edgeCount = edges.length
const parts = Math.ceil(Math.max(nodeCount / 60, edgeCount / 120))
const chunks = []
const size = Math.ceil(paths.length / parts)
for (let i = 0; i < paths.length; i += size) chunks.push(new Set(paths.slice(i, i + size)))

const out = []
chunks.forEach((chunk, idx) => {
  const pn = nodes.filter((n) => chunk.has(n.filePath))
  const ids = new Set(pn.map((n) => n.id))
  const pe = edges.filter((e) => ids.has(e.source))
  out.push({ nodes: pn, edges: pe })
})

// ---- self-check ----
const importTotal = Object.values(batchImportData).reduce((a, b) => a + b.length, 0)
const emittedImports = edges.filter((e) => e.type === 'imports').length
if (emittedImports !== importTotal) throw new Error(`imports ${emittedImports} != ${importTotal}`)
const em = new Set(edges.map((e) => e.source + '|' + e.target + '|' + e.type))
if (em.size !== edges.length) throw new Error('duplicate edges')
for (const e of edges) if (e.source === e.target) throw new Error('self edge ' + e.source)

out.forEach((part, i) => {
  const p = `${projectRoot}/.ua/intermediate/batch-13-part-${i + 1}.json`
  fs.writeFileSync(p, JSON.stringify(part, null, 2) + '\n')
})
fs.writeFileSync(
  '/dev/stdout',
  JSON.stringify({
    parts: out.length,
    nodes: nodeCount,
    edges: edgeCount,
    imports: emittedImports,
    perPart: out.map((p) => ({ nodes: p.nodes.length, edges: p.edges.length })),
    files: paths.length,
  }) + '\n'
)
