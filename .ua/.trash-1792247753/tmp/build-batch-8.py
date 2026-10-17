#!/usr/bin/env python3
import json, math, os

ROOT = "/Users/samtyga/Desktop/work/cert-manager"
UA = os.path.join(ROOT, ".ua")
EXTRACT = os.path.join(UA, "tmp/ua-file-extract-results-8.json")
DISPATCH = os.path.join(UA, "tmp/prompts/batch-8.json")
OUTDIR = os.path.join(UA, "intermediate")

ex = json.load(open(EXTRACT))
disp = json.load(open(DISPATCH))
imports = disp["batchImportData"]

FILES = {
 "pkg/util/pki/generate.go": {
  "summary": "Generates and encodes private keys for cert-manager Certificate resources, covering RSA, ECDSA and Ed25519 key creation plus PEM encoding helpers.",
  "tags": ["cryptography", "key-generation", "pki", "utility"],
  "complexity": "complex",
  "notes": "Uses Go's crypto.Signer abstraction so callers can sign with RSA, ECDSA or Ed25519 keys interchangeably.",
 },
 "pkg/util/pki/keyusage.go": {
  "summary": "Marshals and unmarshals X.509 key usage and extended key usage extensions to and from ASN.1 BIT STRING values.",
  "tags": ["cryptography", "x509", "asn1", "key-usage", "pki"],
  "complexity": "moderate",
 },
 "pkg/util/pki/kube.go": {
  "summary": "Bridges cert-manager PKI types to Kubernetes CSR key usages and parses CertificateSigningRequest expiration durations.",
  "tags": ["kubernetes", "pki", "key-usage", "compatibility"],
  "complexity": "simple",
 },
 "pkg/util/pki/match.go": {
  "summary": "Verifies that private keys, CSRs and X.509 certificates match a Certificate spec, including SAN, issuer and otherName comparisons.",
  "tags": ["pki", "validation", "x509", "matching"],
  "complexity": "complex",
 },
 "pkg/util/pki/nameconstraints.go": {
  "summary": "Implements ASN.1 marshal and unmarshal support for the X.509 NameConstraints extension across DNS, IP, email and URI constraint types.",
  "tags": ["cryptography", "x509", "asn1", "name-constraints", "pki"],
  "complexity": "complex",
  "notes": "Hand-written ASN.1 encoding adapted from crypto/x509 because Go's standard library does not expose name constraint encoding.",
 },
 "pkg/util/pki/parse.go": {
  "summary": "Decodes PEM-encoded private keys, certificate chains, certificate sets and CSRs into Go crypto types with cert-manager error wrapping.",
  "tags": ["pki", "parsing", "pem", "x509", "utility"],
  "complexity": "moderate",
 },
 "pkg/util/pki/parse_certificate_chain.go": {
  "summary": "Parses a certificate chain into leaf, chain and CA PEM bundles by building an issuer graph and locating the self-signed root.",
  "tags": ["pki", "certificate-chain", "parsing", "x509"],
  "complexity": "complex",
 },
 "pkg/util/pki/renewaltime.go": {
  "summary": "Computes certificate renewal times from notBefore and notAfter, supporting both fixed renewal windows and percentage-based renewal.",
  "tags": ["pki", "renewal", "scheduling", "utility"],
  "complexity": "moderate",
 },
 "pkg/util/pki/sans.go": {
  "summary": "Marshals and unmarshals X.509 Subject Alternative Name extensions, including DNS, IP, email, URI, otherName and EDI party names.",
  "tags": ["cryptography", "x509", "asn1", "san", "pki"],
  "complexity": "complex",
  "notes": "Uses cryptobyte for precise ASN.1 encoding of GeneralNames, which the standard library cannot fully represent.",
 },
 "pkg/util/pki/subject.go": {
  "summary": "Converts between X.509 subject strings or DER bytes and pkix RDN sequences, and extracts common names for certificates and CSRs.",
  "tags": ["pki", "x509", "subject", "asn1", "parsing"],
  "complexity": "moderate",
 },
 "pkg/util/pki/temporarycertificate.go": {
  "summary": "Generates a short-lived, locally signed temporary certificate using a throwaway CA while real certificate issuance is pending.",
  "tags": ["pki", "certificate", "temporary", "self-signed"],
  "complexity": "moderate",
 },
 "pkg/util/predicate/certificate.go": {
  "summary": "Provides index predicates mapping Certificate objects to their target secret name and next private key secret name.",
  "tags": ["kubernetes", "predicate", "indexer", "certificate"],
  "complexity": "simple",
 },
 "pkg/util/predicate/certificaterequest.go": {
  "summary": "Provides an index predicate mapping CertificateRequest objects to their revision number annotation.",
  "tags": ["kubernetes", "predicate", "indexer", "certificate-request"],
  "complexity": "simple",
 },
 "pkg/util/predicate/generic.go": {
  "summary": "Generic ownership predicates for filtering Kubernetes objects by their owning resource.",
  "tags": ["kubernetes", "predicate", "ownership", "utility"],
  "complexity": "simple",
 },
 "pkg/util/predicate/predicate.go": {
  "summary": "Defines the base predicate interface and evaluation helpers used by controller index functions.",
  "tags": ["kubernetes", "predicate", "interface", "utility"],
  "complexity": "simple",
 },
 "pkg/util/useragent.go": {
  "summary": "Builds cert-manager user-agent strings and applies them to Kubernetes REST clients through a round tripper.",
  "tags": ["kubernetes", "user-agent", "http", "client"],
  "complexity": "simple",
 },
 "pkg/util/util.go": {
  "summary": "Order-insensitive slice equality helpers plus CSV join and split utilities that honor backslash escaping.",
  "tags": ["utility", "comparison", "csv", "collections"],
  "complexity": "moderate",
 },
 "pkg/util/version.go": {
  "summary": "Defines the build version struct and populates it from linker-injected variables and Go runtime information.",
  "tags": ["versioning", "build-info", "utility"],
  "complexity": "simple",
 },
 "test/acme/server/rfc2136.go": {
  "summary": "Test DNS handler that answers RFC 2136-style queries for the ACME DNS01 integration test zone.",
  "tags": ["test", "dns", "acme", "rfc2136", "test-server"],
  "complexity": "moderate",
 },
 "test/acme/server/server.go": {
  "summary": "Minimal DNS server wrapper used by ACME integration tests to serve authoritative answers on a local address.",
  "tags": ["test", "dns", "test-server", "acme"],
  "complexity": "moderate",
 },
 "test/unit/crypto/crypto.go": {
  "summary": "Test helpers that build cryptographically consistent certificate bundles containing a private key, CSR, certificate and chain.",
  "tags": ["test", "cryptography", "fixtures", "pki"],
  "complexity": "complex",
 },
 "test/unit/discovery/discovery.go": {
  "summary": "Fake Kubernetes discovery client used in unit tests, with configurable server groups, resources and legacy behavior.",
  "tags": ["test", "kubernetes", "fake-client", "discovery"],
  "complexity": "moderate",
 },
 "test/unit/gen/certificate.go": {
  "summary": "Functional-option test builders for constructing cert-manager Certificate objects and mutating their spec, metadata and status.",
  "tags": ["test", "fixtures", "builder", "certificate"],
  "complexity": "complex",
  "notes": "Follows the functional-options pattern so each helper returns a mutation that can be composed when building fixtures.",
 },
 "test/unit/gen/certificaterequest.go": {
  "summary": "Functional-option builders for cert-manager CertificateRequest fixtures, covering spec, metadata, annotations and status conditions.",
  "tags": ["test", "fixtures", "builder", "certificate-request"],
  "complexity": "moderate",
 },
 "test/unit/gen/certificatesigningrequest.go": {
  "summary": "Functional-option builders for Kubernetes CertificateSigningRequest fixtures used by unit tests.",
  "tags": ["test", "fixtures", "builder", "kubernetes"],
  "complexity": "moderate",
 },
 "test/unit/gen/conditions.go": {
  "summary": "Helpers for building and mutating cert-manager IssuerCondition fixtures in tests.",
  "tags": ["test", "fixtures", "builder", "conditions"],
  "complexity": "simple",
 },
 "test/unit/gen/csr.go": {
  "summary": "Builds X.509 certificate signing requests for tests, with helpers to set SANs, common name, IPs, URIs and emails.",
  "tags": ["test", "fixtures", "csr", "x509"],
  "complexity": "complex",
 },
 "test/unit/gen/doc.go": {
  "summary": "Package documentation for the test object generator helpers.",
  "tags": ["test", "fixtures", "documentation", "package"],
  "complexity": "simple",
 },
 "test/unit/gen/issuer.go": {
  "summary": "Functional-option builders for Issuer and ClusterIssuer fixtures, covering ACME, CA, Vault, SelfSigned and Venafi configurations.",
  "tags": ["test", "fixtures", "builder", "issuer"],
  "complexity": "complex",
 },
 "test/unit/gen/objectmeta.go": {
  "summary": "Builds Kubernetes ObjectMeta fixtures with generated names for tests.",
  "tags": ["test", "fixtures", "kubernetes", "objectmeta"],
  "complexity": "simple",
 },
 "test/unit/gen/secret.go": {
  "summary": "Functional-option builders for Kubernetes Secret fixtures used in unit tests.",
  "tags": ["test", "fixtures", "builder", "secret"],
  "complexity": "simple",
 },
 "test/webhook/testwebhook.go": {
  "summary": "Starts an in-process cert-manager webhook server with generated TLS assets for integration tests.",
  "tags": ["test", "webhook", "tls", "test-server"],
  "complexity": "complex",
 },
}

# (name, kind) in display order
SYMS = {
 "pkg/util/pki/generate.go": [
  ("GeneratePrivateKeyForCertificate", "function"), ("GenerateRSAPrivateKey", "function"),
  ("GenerateECPrivateKey", "function"), ("GenerateEd25519PrivateKey", "function"),
  ("EncodePrivateKey", "function"), ("EncodePKCS1PrivateKey", "function"),
  ("EncodePKCS8PrivateKey", "function"), ("EncodeECPrivateKey", "function"),
  ("PublicKeyForPrivateKey", "function"), ("PublicKeyMatchesCertificate", "function"),
  ("PublicKeyMatchesCSR", "function"), ("PublicKeysEqual", "function"),
 ],
 "pkg/util/pki/keyusage.go": [
  ("OIDFromExtKeyUsage", "function"), ("ExtKeyUsageFromOID", "function"),
  ("asn1BitLength", "function"), ("MarshalKeyUsage", "function"),
  ("UnmarshalKeyUsage", "function"), ("MarshalExtKeyUsage", "function"),
  ("UnmarshalExtKeyUsage", "function"),
 ],
 "pkg/util/pki/kube.go": [
  ("DurationFromCertificateSigningRequest", "function"), ("BuildKeyUsagesKube", "function"),
 ],
 "pkg/util/pki/match.go": [
  ("PrivateKeyMatchesSpec", "function"), ("rsaPrivateKeyMatchesSpec", "function"),
  ("ecdsaPrivateKeyMatchesSpec", "function"), ("RequestMatchesSpec", "function"),
  ("matchOtherNames", "function"), ("FuzzyX509AltNamesMatchSpec", "function"),
  ("extractSANExtension", "function"),
 ],
 "pkg/util/pki/nameconstraints.go": [
  ("NameConstraints", "class"), ("IsEmpty", "function"), ("MarshalNameConstraints", "function"),
  ("parseCIDRs", "function"), ("UnmarshalNameConstraints", "function"), ("isValidIPMask", "function"),
 ],
 "pkg/util/pki/parse.go": [
  ("DecodePrivateKeyBytes", "function"), ("decodeMultipleCerts", "function"),
  ("DecodeX509CertificateChainBytes", "function"), ("DecodeX509CertificateSetBytes", "function"),
  ("DecodeX509CertificateBytes", "function"), ("DecodeX509CertificateRequestBytes", "function"),
 ],
 "pkg/util/pki/parse_certificate_chain.go": [
  ("PEMBundle", "class"), ("chainNode", "class"), ("ParseSingleCertificateChainPEM", "function"),
  ("ParseSingleCertificateChain", "function"), ("toBundleAndCA", "function"), ("tryMergeChain", "function"),
 ],
 "pkg/util/pki/renewaltime.go": [
  ("RenewalTime", "function"), ("RenewBefore", "function"),
 ],
 "pkg/util/pki/sans.go": [
  ("OtherName", "class"), ("EDIPartyName", "class"), ("GeneralNames", "class"),
  ("Empty", "function"), ("UnmarshalSANs", "function"), ("forEachSAN", "function"), ("MarshalSANs", "function"),
 ],
 "pkg/util/pki/subject.go": [
  ("UnmarshalSubjectStringToRDNSequence", "function"), ("IsASN1SubjectEmpty", "function"),
  ("MarshalRDNSequenceToRawDERBytes", "function"), ("UnmarshalRawDerBytesToRDNSequence", "function"),
  ("ExtractCommonNameFromRDNSequence", "function"),
 ],
 "pkg/util/pki/temporarycertificate.go": [
  ("GenerateLocallySignedTemporaryCertificate", "function"),
 ],
 "pkg/util/predicate/certificate.go": [
  ("CertificateSecretName", "function"), ("CertificateNextPrivateKeySecretName", "function"),
 ],
 "pkg/util/predicate/certificaterequest.go": [
  ("CertificateRequestRevision", "function"),
 ],
 "pkg/util/predicate/generic.go": [
  ("ResourceOwnedBy", "function"), ("ResourceOwnerOf", "function"),
 ],
 "pkg/util/predicate/predicate.go": [
  ("Evaluate", "function"), ("ExtractResourceName", "function"),
 ],
 "pkg/util/useragent.go": [
  ("RestConfigWithUserAgent", "function"), ("PrefixFromUserAgent", "function"), ("RoundTrip", "function"),
 ],
 "pkg/util/util.go": [
  ("genericEqualUnsorted", "function"), ("EqualUnsorted", "function"), ("EqualURLsUnsorted", "function"),
  ("EqualOtherNamesUnsorted", "function"), ("EqualIPsUnsorted", "function"),
  ("EqualKeyUsagesUnsorted", "function"), ("JoinWithEscapeCSV", "function"), ("SplitWithEscapeCSV", "function"),
 ],
 "pkg/util/version.go": [
  ("Version", "class"), ("VersionInfo", "function"), ("version", "function"),
 ],
 "test/acme/server/rfc2136.go": [
  ("rfc2136Handler", "class"), ("ServeDNS", "function"),
 ],
 "test/acme/server/server.go": [
  ("BasicServer", "class"), ("Run", "function"), ("RunWithAddress", "function"),
  ("ListenAddr", "function"), ("Shutdown", "function"),
 ],
 "test/unit/crypto/crypto.go": [
  ("CryptoBundle", "class"), ("MustCreateCryptoBundle", "function"), ("CreateCryptoBundle", "function"),
  ("generateCSRImpl", "function"), ("MustGenerateCSRImpl", "function"),
  ("MustCreatePEMPrivateKey", "function"), ("MustCreateCertWithNotBeforeAfter", "function"),
  ("MustCreateCert", "function"),
 ],
 "test/unit/discovery/discovery.go": [
  ("Discovery", "class"), ("NewDiscovery", "function"),
 ],
 "test/unit/gen/certificate.go": [
  ("Certificate", "function"), ("CertificateFrom", "function"), ("SetCertificateIssuer", "function"),
  ("SetCertificateDNSNames", "function"), ("SetCertificateCommonName", "function"),
  ("SetCertificateIPs", "function"), ("SetCertificateOtherNames", "function"),
  ("SetCertificateEmails", "function"), ("SetCertificateURIs", "function"),
  ("SetCertificateIsCA", "function"), ("SetCertificateKeyAlgorithm", "function"),
  ("SetCertificateKeySize", "function"), ("SetCertificateKeyEncoding", "function"),
  ("SetCertificateSecretName", "function"), ("SetCertificateSecretTemplate", "function"),
  ("SetCertificateDuration", "function"), ("SetCertificateRenewBefore", "function"),
  ("SetCertificateNextPrivateKeySecretName", "function"), ("SetCertificateStatusCondition", "function"),
  ("SetCertificateLastFailureTime", "function"), ("SetCertificateIssuanceAttempts", "function"),
  ("SetCertificateNotAfter", "function"), ("SetCertificateNotBefore", "function"),
  ("SetCertificateRenewalTime", "function"), ("SetCertificateOrganization", "function"),
  ("SetCertificateNamespace", "function"), ("SetCertificateKeyUsages", "function"),
  ("SetCertificateRevision", "function"), ("SetCertificateUID", "function"),
  ("SetCertificateGeneration", "function"), ("SetCertificateCreationTimestamp", "function"),
  ("AddCertificateAnnotations", "function"), ("AddCertificateLabels", "function"),
  ("CertificateRef", "function"), ("SetCertificateRevisionHistoryLimit", "function"),
  ("SetCertificateAdditionalOutputFormats", "function"), ("SetCertificateKeystore", "function"),
 ],
 "test/unit/gen/certificaterequest.go": [
  ("CertificateRequest", "function"), ("CertificateRequestFrom", "function"),
  ("SetCertificateRequestIssuer", "function"), ("SetCertificateRequestCSR", "function"),
  ("SetCertificateRequestIsCA", "function"), ("SetCertificateRequestDuration", "function"),
  ("SetCertificateRequestCA", "function"), ("SetCertificateRequestCertificate", "function"),
  ("SetCertificateRequestStatusCondition", "function"), ("AddCertificateRequestStatusCondition", "function"),
  ("SetCertificateRequestNamespace", "function"), ("SetCertificateRequestName", "function"),
  ("SetCertificateRequestGenerateName", "function"), ("SetCertificateRequestKeyUsages", "function"),
  ("AddCertificateRequestAnnotations", "function"), ("AddCertificateRequestOwnerReferences", "function"),
  ("SetCertificateRequestAnnotations", "function"), ("DeleteCertificateRequestAnnotation", "function"),
  ("SetCertificateRequestFailureTime", "function"), ("SetCertificateRequestTypeMeta", "function"),
  ("SetCertificateRequestUsername", "function"), ("SetCertificateRequestGroups", "function"),
  ("SetCertificateRequestRevision", "function"),
 ],
 "test/unit/gen/certificatesigningrequest.go": [
  ("CertificateSigningRequest", "function"), ("CertificateSigningRequestWithRandomName", "function"),
  ("CertificateSigningRequestFrom", "function"), ("SetCertificateSigningRequestIsCA", "function"),
  ("SetCertificateSigningRequestRequest", "function"), ("AddCertificateSigningRequestAnnotations", "function"),
  ("SetCertificateSigningRequestSignerName", "function"),
  ("SetCertificateSigningRequestExpirationSeconds", "function"),
  ("SetCertificateSigningRequestDuration", "function"),
  ("SetCertificateSigningRequestCertificate", "function"),
  ("SetCertificateSigningRequestStatusCondition", "function"),
  ("SetCertificateSigningRequestUsername", "function"), ("SetCertificateSigningRequestGroups", "function"),
  ("SetCertificateSigningRequestUID", "function"), ("SetCertificateSigningRequestExtra", "function"),
  ("SetCertificateSigningRequestUsages", "function"),
 ],
 "test/unit/gen/conditions.go": [
  ("IssuerCondition", "function"), ("IssuerConditionFrom", "function"), ("SetIssuerConditionStatus", "function"),
  ("SetIssuerConditionLastTransitionTime", "function"), ("SetIssuerConditionReason", "function"),
  ("SetIssuerConditionMessage", "function"),
 ],
 "test/unit/gen/csr.go": [
  ("CSRForCertificate", "function"), ("CSRWithSignerForCertificate", "function"), ("CSR", "function"),
  ("CSRWithSigner", "function"), ("SetCSRDNSNames", "function"), ("SetCSRIPAddresses", "function"),
  ("SetCSRIPAddressesFromStrings", "function"), ("SetCSRURIs", "function"),
  ("SetCSRURIsFromStrings", "function"), ("SetCSRCommonName", "function"), ("SetCSREmails", "function"),
 ],
 "test/unit/gen/doc.go": [],
 "test/unit/gen/issuer.go": [
  ("ClusterIssuer", "function"), ("ClusterIssuerFrom", "function"), ("ClusterIssuerWithRandomName", "function"),
  ("Issuer", "function"), ("IssuerFrom", "function"), ("IssuerWithRandomName", "function"),
  ("SetIssuerACME", "function"), ("SetIssuerACMEPreferredChain", "function"), ("SetIssuerACMEURL", "function"),
  ("SetIssuerACMEEmail", "function"), ("SetIssuerACMEProfile", "function"),
  ("SetIssuerACMEPrivKeyRef", "function"), ("SetIssuerACMESolvers", "function"),
  ("SetIssuerACMEDuration", "function"), ("SetIssuerACMESkipTLSVerify", "function"),
  ("SetIssuerACMEDisableAccountKeyGeneration", "function"), ("SetIssuerACMEEAB", "function"),
  ("SetIssuerACMEEABWithKeyAlgorithm", "function"), ("SetIssuerACMEAccountURL", "function"),
  ("SetIssuerACMELastRegisteredEmail", "function"), ("SetIssuerACMELastPrivateKeyHash", "function"),
  ("SetIssuerCA", "function"), ("SetIssuerCASecretName", "function"), ("SetIssuerVault", "function"),
  ("SetIssuerVaultURL", "function"), ("SetIssuerVaultPath", "function"), ("SetIssuerVaultCABundle", "function"),
  ("SetIssuerVaultCABundleSecretRef", "function"), ("SetIssuerVaultClientCertSecretRef", "function"),
  ("SetIssuerVaultClientKeySecretRef", "function"), ("SetIssuerVaultTokenAuth", "function"),
  ("SetIssuerVaultAppRoleAuth", "function"), ("SetIssuerVaultClientCertificateAuth", "function"),
  ("SetIssuerVaultKubernetesAuthSecret", "function"),
  ("SetIssuerVaultKubernetesAuthServiceAccount", "function"), ("SetIssuerSelfSigned", "function"),
  ("SetIssuerVenafi", "function"), ("AddIssuerCondition", "function"), ("SetIssuerNamespace", "function"),
 ],
 "test/unit/gen/objectmeta.go": [
  ("ObjectMeta", "function"),
 ],
 "test/unit/gen/secret.go": [
  ("Secret", "function"), ("SecretFrom", "function"), ("SetSecretNamespace", "function"),
  ("SetSecretAnnotations", "function"), ("SetSecretData", "function"),
 ],
 "test/webhook/testwebhook.go": [
  ("ServerOptions", "class"), ("StartWebhookServer", "function"), ("generateTLSAssets", "function"),
 ],
}

SUMS = {
 "pkg/util/pki/generate.go": {
  "GeneratePrivateKeyForCertificate": "Generates an RSA, ECDSA or Ed25519 private key honoring the Certificate's privateKey spec and defaults.",
  "GenerateRSAPrivateKey": "Generates an RSA private key after validating the requested size against the MinRSAKeySize and MaxRSAKeySize bounds.",
  "GenerateECPrivateKey": "Generates an ECDSA private key for the P-256, P-384 or P-521 curve selected by key size.",
  "GenerateEd25519PrivateKey": "Generates an Ed25519 private key using crypto/rand.",
  "EncodePrivateKey": "PEM-encodes a crypto.Signer using the PKCS#1, PKCS#8 or SEC1 encoding requested in the key spec.",
  "EncodePKCS1PrivateKey": "PEM-encodes an RSA key in PKCS#1 form with the RSA PRIVATE KEY block type.",
  "EncodePKCS8PrivateKey": "PEM-encodes any private key in PKCS#8 form with the PRIVATE KEY block type.",
  "EncodeECPrivateKey": "PEM-encodes an ECDSA key in SEC1 form with the EC PRIVATE KEY block type.",
  "PublicKeyForPrivateKey": "Returns the public key corresponding to a crypto.Signer, unwrapping the certificate if needed.",
  "PublicKeyMatchesCertificate": "Reports whether a signer's public key equals the public key in an X.509 certificate.",
  "PublicKeyMatchesCSR": "Reports whether a signer's public key equals the public key in a certificate request.",
  "PublicKeysEqual": "Compares two public keys, supporting RSA, ECDSA and Ed25519 key types.",
 },
 "pkg/util/pki/keyusage.go": {
  "OIDFromExtKeyUsage": "Maps an x509.ExtKeyUsage value to its ASN.1 object identifier.",
  "ExtKeyUsageFromOID": "Maps an ASN.1 object identifier back to an x509.ExtKeyUsage value.",
  "asn1BitLength": "Computes the number of significant bits in an ASN.1 bit string.",
  "MarshalKeyUsage": "Encodes x509.KeyUsage flags as an ASN.1 BIT STRING extension value.",
  "UnmarshalKeyUsage": "Decodes an ASN.1 BIT STRING extension value into x509.KeyUsage flags.",
  "MarshalExtKeyUsage": "Encodes extended key usage OIDs into an ASN.1 SEQUENCE, reporting unsupported usages separately.",
  "UnmarshalExtKeyUsage": "Decodes an ASN.1 SEQUENCE of OIDs into extended key usage values.",
 },
 "pkg/util/pki/kube.go": {
  "DurationFromCertificateSigningRequest": "Reads the cert-manager duration annotation from a Kubernetes CertificateSigningRequest and parses it as a duration.",
  "BuildKeyUsagesKube": "Converts cert-manager key usage strings into Kubernetes CSR key usage and extended key usage values.",
 },
 "pkg/util/pki/match.go": {
  "PrivateKeyMatchesSpec": "Checks that a private key's algorithm and size satisfy the Certificate private key spec.",
  "rsaPrivateKeyMatchesSpec": "Validates an RSA key's size against the requested spec, applying the default size when unset.",
  "ecdsaPrivateKeyMatchesSpec": "Validates an ECDSA key's curve against the requested key size.",
  "RequestMatchesSpec": "Compares a CSR's subject, SANs, key usages, duration and issuer attributes against a Certificate spec.",
  "matchOtherNames": "Compares the otherName SAN extension entries with the otherNames requested in the spec.",
  "FuzzyX509AltNamesMatchSpec": "Checks that an issued certificate's SANs cover all DNS, IP, email and URI names in the spec.",
  "extractSANExtension": "Finds and returns the raw subject alternative name extension from an extension list.",
 },
 "pkg/util/pki/nameconstraints.go": {
  "NameConstraints": "Represents the DNS, IP, email and URI permitted and excluded entries of an X.509 NameConstraints extension.",
  "IsEmpty": "Reports whether every permitted and excluded name constraint list is empty.",
  "MarshalNameConstraints": "Encodes NameConstraints into a pkix.Extension using ASN.1, optionally marking it critical.",
  "parseCIDRs": "Parses CIDR strings into net.IPNet values for IP name constraints.",
  "UnmarshalNameConstraints": "Decodes a raw NameConstraints extension value into DNS, IP, email and URI constraint lists.",
  "isValidIPMask": "Validates that an IP mask is contiguous and suitable for an ASN.1 name constraint.",
 },
 "pkg/util/pki/parse.go": {
  "DecodePrivateKeyBytes": "Decodes PEM private key blocks in PKCS#1, PKCS#8, SEC1 and encrypted forms into a crypto.Signer.",
  "decodeMultipleCerts": "Repeatedly decodes PEM blocks with the supplied decoder until the input is exhausted.",
  "DecodeX509CertificateChainBytes": "Decodes a PEM bundle into a slice of X.509 certificates, requiring at least one certificate.",
  "DecodeX509CertificateSetBytes": "Decodes a PEM bundle into an unordered set of X.509 certificates.",
  "DecodeX509CertificateBytes": "Decodes a PEM bundle that must contain exactly one certificate.",
  "DecodeX509CertificateRequestBytes": "Decodes a PEM-encoded PKCS#10 certificate request.",
 },
 "pkg/util/pki/parse_certificate_chain.go": {
  "PEMBundle": "Holds the PEM-encoded leaf chain and the optional CA certificate extracted from a bundle.",
  "chainNode": "Node in the issuer graph linking a certificate to the node that issued it.",
  "ParseSingleCertificateChainPEM": "Decodes a PEM bundle before parsing it into a single certificate chain and CA.",
  "ParseSingleCertificateChain": "Builds an issuer graph, selects the highest certificate as CA, and returns ordered chain PEM plus CA PEM.",
  "toBundleAndCA": "Walks a chain node to produce the PEM-encoded chain and CA, separating a self-signed root when present.",
  "tryMergeChain": "Attempts to attach a partial chain to the existing graph and reports whether it was merged.",
 },
 "pkg/util/pki/renewaltime.go": {
  "RenewalTime": "Calculates the renewal time from validity bounds using an explicit renewBefore or a percentage of lifetime.",
  "RenewBefore": "Resolves the effective renewBefore duration from either an explicit duration or a percentage of the certificate lifetime.",
 },
 "pkg/util/pki/sans.go": {
  "OtherName": "ASN.1 representation of an otherName GeneralName entry with a type ID and explicit value.",
  "EDIPartyName": "ASN.1 representation of an EDI party name SAN entry.",
  "GeneralNames": "Collection of SAN entries to be marshalled into a subject alternative name extension.",
  "Empty": "Reports whether the GeneralNames collection has no entries.",
  "UnmarshalSANs": "Decodes SANs from a raw extension value into DNS, IP, email, URI, otherName and EDI party name lists.",
  "forEachSAN": "Iterates the GeneralNames in an extension, invoking a callback with each ASN.1 tag and value.",
  "MarshalSANs": "Encodes DNS, IP, email, URI, otherName and EDI party names into an ASN.1 subject alternative name extension.",
 },
 "pkg/util/pki/subject.go": {
  "UnmarshalSubjectStringToRDNSequence": "Parses an RFC 2253 subject string into a pkix RDN sequence using the appropriate ASN.1 string types.",
  "IsASN1SubjectEmpty": "Reports whether an ASN.1 subject contains no attributes.",
  "MarshalRDNSequenceToRawDERBytes": "Marshals an RDN sequence into raw DER bytes.",
  "UnmarshalRawDerBytesToRDNSequence": "Unmarshals raw DER bytes into a pkix RDN sequence.",
  "ExtractCommonNameFromRDNSequence": "Finds and returns the common name attribute from an RDN sequence.",
 },
 "pkg/util/pki/temporarycertificate.go": {
  "GenerateLocallySignedTemporaryCertificate": "Creates a throwaway CA and uses it to sign a short-lived certificate matching the Certificate spec and supplied key.",
 },
 "pkg/util/predicate/certificate.go": {
  "CertificateSecretName": "Builds an index predicate returning the secret name targeted by a Certificate.",
  "CertificateNextPrivateKeySecretName": "Builds an index predicate returning the next private key secret name of a Certificate.",
 },
 "pkg/util/predicate/certificaterequest.go": {
  "CertificateRequestRevision": "Builds an index predicate returning the revision annotation value of a CertificateRequest.",
 },
 "pkg/util/predicate/generic.go": {
  "ResourceOwnedBy": "Builds a predicate that matches objects owned by the given owner reference.",
  "ResourceOwnerOf": "Returns the owning resource reference for an object, or nil when it has no controller owner.",
 },
 "pkg/util/predicate/predicate.go": {
  "Evaluate": "Applies a predicate to an object and reports whether it matches.",
  "ExtractResourceName": "Extracts the resource name portion from a namespaced or cluster-scoped object key.",
 },
 "pkg/util/useragent.go": {
  "RestConfigWithUserAgent": "Returns a copy of a Kubernetes REST config with the cert-manager user-agent round tripper installed.",
  "PrefixFromUserAgent": "Extracts the leading product prefix from a user-agent string, defaulting when it is empty.",
  "RoundTrip": "Adds the configured user-agent header to every outgoing HTTP request.",
 },
 "pkg/util/util.go": {
  "genericEqualUnsorted": "Compares two slices ignoring order using a caller-supplied comparison function.",
  "EqualUnsorted": "Reports whether two string slices contain the same elements regardless of order.",
  "EqualURLsUnsorted": "Reports whether two URL slices contain the same values regardless of order.",
  "EqualOtherNamesUnsorted": "Reports whether two otherName slices match regardless of order.",
  "EqualIPsUnsorted": "Reports whether two IP slices match regardless of order.",
  "EqualKeyUsagesUnsorted": "Reports whether two key usage slices match regardless of order.",
  "JoinWithEscapeCSV": "Joins strings with commas while escaping embedded commas and backslashes.",
  "SplitWithEscapeCSV": "Splits an escaped comma-separated string back into its individual values.",
 },
 "pkg/util/version.go": {
  "Version": "Build metadata struct exposed by the version command and API.",
  "VersionInfo": "Populates a Version struct from linker variables and the Go runtime.",
  "version": "Formats the version information into a human-readable multi-line string.",
 },
 "test/acme/server/rfc2136.go": {
  "rfc2136Handler": "DNS handler serving the fixed records required by the ACME DNS01 RFC 2136 test flow.",
  "ServeDNS": "Answers incoming DNS queries for the test zone and returns the matching A, TXT or SOA records.",
 },
 "test/acme/server/server.go": {
  "BasicServer": "Test DNS server wrapper holding the listener and server state.",
  "Run": "Starts the DNS server on the default test address.",
  "RunWithAddress": "Starts the DNS server on the supplied address and network, returning after it is ready.",
  "ListenAddr": "Returns the address the test DNS server is listening on.",
  "Shutdown": "Stops the test DNS server and releases its listener.",
 },
 "test/unit/crypto/crypto.go": {
  "CryptoBundle": "Bundle of private key, CSR and signed certificate data used by PKI unit tests.",
  "MustCreateCryptoBundle": "Creates a CryptoBundle or fails the test immediately on error.",
  "CreateCryptoBundle": "Generates a private key, CSR and self-signed certificate chain that satisfy the Certificate spec.",
  "generateCSRImpl": "Builds a certificate request for the Certificate spec using the supplied private key.",
  "MustGenerateCSRImpl": "Test wrapper around CSR generation that fails the test on error.",
  "MustCreatePEMPrivateKey": "Generates a fresh private key and returns its PEM encoding, failing the test on error.",
  "MustCreateCertWithNotBeforeAfter": "Signs a certificate with explicit notBefore and notAfter values for expiry tests.",
  "MustCreateCert": "Signs a certificate for the supplied spec and key, failing the test on error.",
 },
 "test/unit/discovery/discovery.go": {
  "Discovery": "Fake Kubernetes discovery client implementing the discovery interface for unit tests.",
  "NewDiscovery": "Creates a fake discovery client with configurable group and resource responses.",
 },
 "test/unit/gen/certificate.go": {
  "Certificate": "Creates a Certificate fixture with the supplied name and an empty spec.",
  "CertificateFrom": "Copies an existing Certificate as the base for further fixture mutation.",
  "SetCertificateIssuer": "Sets the issuer reference on the Certificate fixture.",
  "SetCertificateDNSNames": "Sets the DNS names in the Certificate spec.",
  "SetCertificateCommonName": "Sets the common name in the Certificate spec.",
  "SetCertificateIPs": "Sets the IP addresses in the Certificate spec.",
  "SetCertificateOtherNames": "Sets the otherName SAN entries in the Certificate spec.",
  "SetCertificateEmails": "Sets the email SANs in the Certificate spec.",
  "SetCertificateURIs": "Sets the URI SANs in the Certificate spec.",
  "SetCertificateIsCA": "Sets the isCA flag on the Certificate spec.",
  "SetCertificateKeyAlgorithm": "Sets the private key algorithm on the Certificate spec.",
  "SetCertificateKeySize": "Sets the private key size on the Certificate spec.",
  "SetCertificateKeyEncoding": "Sets the private key encoding on the Certificate spec.",
  "SetCertificateSecretName": "Sets the target secret name on the Certificate spec.",
  "SetCertificateSecretTemplate": "Sets secret template annotations and labels on the Certificate spec.",
  "SetCertificateDuration": "Sets the requested certificate duration.",
  "SetCertificateRenewBefore": "Sets the renewBefore window on the Certificate spec.",
  "SetCertificateNextPrivateKeySecretName": "Sets the next private key secret name used during key rotation.",
  "SetCertificateStatusCondition": "Replaces the Certificate status conditions with the supplied condition.",
  "SetCertificateLastFailureTime": "Sets the last failure time in the Certificate status.",
  "SetCertificateIssuanceAttempts": "Sets the issuance attempts counter in the Certificate status.",
  "SetCertificateNotAfter": "Sets the notAfter timestamp in the Certificate status.",
  "SetCertificateNotBefore": "Sets the notBefore timestamp in the Certificate status.",
  "SetCertificateRenewalTime": "Sets the renewal time in the Certificate status.",
  "SetCertificateOrganization": "Sets the organization subject field on the Certificate spec.",
  "SetCertificateNamespace": "Sets the Certificate namespace.",
  "SetCertificateKeyUsages": "Sets the key usages on the Certificate spec.",
  "SetCertificateRevision": "Sets the revision annotation on the Certificate.",
  "SetCertificateUID": "Sets the Certificate UID.",
  "SetCertificateGeneration": "Sets the Certificate generation.",
  "SetCertificateCreationTimestamp": "Sets the Certificate creation timestamp.",
  "AddCertificateAnnotations": "Merges the supplied annotations into the Certificate.",
  "AddCertificateLabels": "Merges the supplied labels into the Certificate.",
  "CertificateRef": "Builds an object reference pointing at the named Certificate.",
  "SetCertificateRevisionHistoryLimit": "Sets the revision history limit on the Certificate spec.",
  "SetCertificateAdditionalOutputFormats": "Sets additional output formats on the Certificate spec.",
  "SetCertificateKeystore": "Sets keystore configuration on the Certificate spec.",
 },
 "test/unit/gen/certificaterequest.go": {
  "CertificateRequest": "Creates a CertificateRequest fixture with the supplied name.",
  "CertificateRequestFrom": "Copies an existing CertificateRequest as the base for further fixture mutation.",
  "SetCertificateRequestIssuer": "Sets the issuer reference on the CertificateRequest.",
  "SetCertificateRequestCSR": "Sets the CSR bytes on the CertificateRequest spec.",
  "SetCertificateRequestIsCA": "Sets the isCA flag on the request spec.",
  "SetCertificateRequestDuration": "Sets the requested certificate duration.",
  "SetCertificateRequestCA": "Sets the CA certificate bytes in the request status.",
  "SetCertificateRequestCertificate": "Sets the issued certificate bytes in the request status.",
  "SetCertificateRequestStatusCondition": "Replaces the request status conditions with the supplied condition.",
  "AddCertificateRequestStatusCondition": "Appends a condition to the request status.",
  "SetCertificateRequestNamespace": "Sets the request namespace.",
  "SetCertificateRequestName": "Sets the request name.",
  "SetCertificateRequestGenerateName": "Sets the generateName prefix on the request.",
  "SetCertificateRequestKeyUsages": "Sets the key usages on the request spec.",
  "AddCertificateRequestAnnotations": "Merges annotations into the CertificateRequest.",
  "AddCertificateRequestOwnerReferences": "Adds owner references to the CertificateRequest.",
  "SetCertificateRequestAnnotations": "Replaces the request annotations.",
  "DeleteCertificateRequestAnnotation": "Removes an annotation from the request by key.",
  "SetCertificateRequestFailureTime": "Sets the failure time in the request status.",
  "SetCertificateRequestTypeMeta": "Sets the request TypeMeta.",
  "SetCertificateRequestUsername": "Sets the authenticating username on the request.",
  "SetCertificateRequestGroups": "Sets the authenticating groups on the request.",
  "SetCertificateRequestRevision": "Sets the revision annotation on the request.",
 },
 "test/unit/gen/certificatesigningrequest.go": {
  "CertificateSigningRequest": "Creates a Kubernetes CertificateSigningRequest fixture with the supplied name.",
  "CertificateSigningRequestWithRandomName": "Creates a CertificateSigningRequest fixture with a random name suffix.",
  "CertificateSigningRequestFrom": "Copies an existing CertificateSigningRequest as the base for mutation.",
  "SetCertificateSigningRequestIsCA": "Sets the isCA flag on the CSR spec.",
  "SetCertificateSigningRequestRequest": "Sets the PKCS#10 request bytes on the CSR spec.",
  "AddCertificateSigningRequestAnnotations": "Merges annotations into the CertificateSigningRequest.",
  "SetCertificateSigningRequestSignerName": "Sets the signer name on the CSR spec.",
  "SetCertificateSigningRequestExpirationSeconds": "Sets the expiration seconds on the CSR spec.",
  "SetCertificateSigningRequestDuration": "Sets the cert-manager duration annotation on the CSR.",
  "SetCertificateSigningRequestCertificate": "Sets the issued certificate bytes in the CSR status.",
  "SetCertificateSigningRequestStatusCondition": "Replaces the CSR status conditions with the supplied condition.",
  "SetCertificateSigningRequestUsername": "Sets the request username.",
  "SetCertificateSigningRequestGroups": "Sets the request groups.",
  "SetCertificateSigningRequestUID": "Sets the CertificateSigningRequest UID.",
  "SetCertificateSigningRequestExtra": "Sets extra request attributes on the CSR.",
  "SetCertificateSigningRequestUsages": "Sets the key usages on the CSR spec.",
 },
 "test/unit/gen/conditions.go": {
  "IssuerCondition": "Creates an IssuerCondition fixture of the supplied type.",
  "IssuerConditionFrom": "Copies an existing IssuerCondition for further mutation.",
  "SetIssuerConditionStatus": "Sets the condition status.",
  "SetIssuerConditionLastTransitionTime": "Sets the condition last transition time.",
  "SetIssuerConditionReason": "Sets the condition reason.",
  "SetIssuerConditionMessage": "Sets the condition message.",
 },
 "test/unit/gen/csr.go": {
  "CSRForCertificate": "Builds a CSR matching a Certificate spec using the Certificate's private key.",
  "CSRWithSignerForCertificate": "Builds a CSR for a Certificate spec signed by the supplied signer.",
  "CSR": "Creates a CSR fixture with the given key algorithm and default SANs.",
  "CSRWithSigner": "Creates a CSR with an existing signer and applies the supplied options.",
  "SetCSRDNSNames": "Sets DNS names on the CSR.",
  "SetCSRIPAddresses": "Sets IP address SANs from net.IP values.",
  "SetCSRIPAddressesFromStrings": "Parses and sets IP address SANs from strings.",
  "SetCSRURIs": "Sets URI SANs from url.URL values.",
  "SetCSRURIsFromStrings": "Parses and sets URI SANs from strings.",
  "SetCSRCommonName": "Sets the CSR subject common name.",
  "SetCSREmails": "Sets email SANs on the CSR.",
 },
 "test/unit/gen/doc.go": {},
 "test/unit/gen/issuer.go": {
  "ClusterIssuer": "Creates a ClusterIssuer fixture with the supplied name.",
  "ClusterIssuerFrom": "Copies an existing ClusterIssuer as the base for mutation.",
  "ClusterIssuerWithRandomName": "Creates a ClusterIssuer fixture with a random name suffix.",
  "Issuer": "Creates an Issuer fixture with the supplied name.",
  "IssuerFrom": "Copies an existing Issuer as the base for mutation.",
  "IssuerWithRandomName": "Creates an Issuer fixture with a random name suffix.",
  "SetIssuerACME": "Sets the ACME issuer configuration.",
  "SetIssuerACMEPreferredChain": "Sets the ACME preferred certificate chain.",
  "SetIssuerACMEURL": "Sets the ACME server URL.",
  "SetIssuerACMEEmail": "Sets the ACME account email.",
  "SetIssuerACMEProfile": "Sets the ACME profile name.",
  "SetIssuerACMEPrivKeyRef": "Sets the ACME account private key secret reference.",
  "SetIssuerACMESolvers": "Sets the ACME challenge solvers.",
  "SetIssuerACMEDuration": "Enables or disables the ACME duration feature.",
  "SetIssuerACMESkipTLSVerify": "Sets whether ACME skips TLS verification.",
  "SetIssuerACMEDisableAccountKeyGeneration": "Toggles automatic ACME account key generation.",
  "SetIssuerACMEEAB": "Configures ACME external account binding credentials.",
  "SetIssuerACMEEABWithKeyAlgorithm": "Configures external account binding credentials together with a key algorithm.",
  "SetIssuerACMEAccountURL": "Sets the registered ACME account URL in the issuer status.",
  "SetIssuerACMELastRegisteredEmail": "Sets the last registered ACME email in the issuer status.",
  "SetIssuerACMELastPrivateKeyHash": "Sets the last ACME private key hash in the issuer status.",
  "SetIssuerCA": "Sets the CA issuer configuration.",
  "SetIssuerCASecretName": "Sets the secret name used by the CA issuer.",
  "SetIssuerVault": "Sets the Vault issuer configuration.",
  "SetIssuerVaultURL": "Sets the Vault server URL.",
  "SetIssuerVaultPath": "Sets the Vault authentication path.",
  "SetIssuerVaultCABundle": "Sets the Vault CA bundle.",
  "SetIssuerVaultCABundleSecretRef": "Sets the secret reference holding the Vault CA bundle.",
  "SetIssuerVaultClientCertSecretRef": "Sets the secret reference holding the Vault client certificate.",
  "SetIssuerVaultClientKeySecretRef": "Sets the secret reference holding the Vault client key.",
  "SetIssuerVaultTokenAuth": "Configures token authentication for Vault.",
  "SetIssuerVaultAppRoleAuth": "Configures AppRole authentication for Vault.",
  "SetIssuerVaultClientCertificateAuth": "Configures client certificate authentication for Vault.",
  "SetIssuerVaultKubernetesAuthSecret": "Configures Vault Kubernetes authentication using a secret reference.",
  "SetIssuerVaultKubernetesAuthServiceAccount": "Configures Vault Kubernetes authentication using a service account.",
  "SetIssuerSelfSigned": "Sets the SelfSigned issuer configuration.",
  "SetIssuerVenafi": "Sets the Venafi issuer configuration.",
  "AddIssuerCondition": "Appends a condition to the issuer status.",
  "SetIssuerNamespace": "Sets the Issuer namespace.",
 },
 "test/unit/gen/objectmeta.go": {
  "ObjectMeta": "Builds an ObjectMeta fixture with the supplied name.",
 },
 "test/unit/gen/secret.go": {
  "Secret": "Creates a Secret fixture with the supplied name.",
  "SecretFrom": "Copies an existing Secret as the base for further mutation.",
  "SetSecretNamespace": "Sets the Secret namespace.",
  "SetSecretAnnotations": "Replaces the Secret annotations.",
  "SetSecretData": "Sets the Secret data map.",
 },
 "test/webhook/testwebhook.go": {
  "ServerOptions": "Options controlling the in-process webhook test server, including URL and client configuration.",
  "StartWebhookServer": "Generates TLS assets, starts the cert-manager webhook server, and returns a client connected to it.",
  "generateTLSAssets": "Writes a CA, serving certificate and kubeconfig into a temporary directory for the webhook server.",
 },
}

TAGBASE = {
 "pkg/util/pki/generate.go": ["pki", "key-generation", "cryptography", "utility"],
 "pkg/util/pki/keyusage.go": ["pki", "x509", "asn1", "key-usage"],
 "pkg/util/pki/kube.go": ["pki", "kubernetes", "key-usage"],
 "pkg/util/pki/match.go": ["pki", "validation", "x509", "matching"],
 "pkg/util/pki/nameconstraints.go": ["pki", "x509", "asn1", "name-constraints"],
 "pkg/util/pki/parse.go": ["pki", "parsing", "pem", "x509"],
 "pkg/util/pki/parse_certificate_chain.go": ["pki", "certificate-chain", "parsing", "x509"],
 "pkg/util/pki/renewaltime.go": ["pki", "renewal", "scheduling"],
 "pkg/util/pki/sans.go": ["pki", "x509", "asn1", "san"],
 "pkg/util/pki/subject.go": ["pki", "x509", "subject", "asn1"],
 "pkg/util/pki/temporarycertificate.go": ["pki", "certificate", "temporary"],
 "pkg/util/predicate/certificate.go": ["kubernetes", "predicate", "indexer"],
 "pkg/util/predicate/certificaterequest.go": ["kubernetes", "predicate", "indexer"],
 "pkg/util/predicate/generic.go": ["kubernetes", "predicate", "ownership"],
 "pkg/util/predicate/predicate.go": ["kubernetes", "predicate", "interface"],
 "pkg/util/useragent.go": ["kubernetes", "user-agent", "client"],
 "pkg/util/util.go": ["utility", "comparison", "csv"],
 "pkg/util/version.go": ["versioning", "build-info", "utility"],
 "test/acme/server/rfc2136.go": ["test", "dns", "acme", "test-server"],
 "test/acme/server/server.go": ["test", "dns", "test-server"],
 "test/unit/crypto/crypto.go": ["test", "cryptography", "fixtures"],
 "test/unit/discovery/discovery.go": ["test", "kubernetes", "fake-client"],
 "test/unit/gen/certificate.go": ["test", "fixtures", "builder"],
 "test/unit/gen/certificaterequest.go": ["test", "fixtures", "builder"],
 "test/unit/gen/certificatesigningrequest.go": ["test", "fixtures", "builder"],
 "test/unit/gen/conditions.go": ["test", "fixtures", "builder"],
 "test/unit/gen/csr.go": ["test", "fixtures", "csr"],
 "test/unit/gen/doc.go": ["test", "fixtures", "documentation"],
 "test/unit/gen/issuer.go": ["test", "fixtures", "builder"],
 "test/unit/gen/objectmeta.go": ["test", "fixtures", "kubernetes"],
 "test/unit/gen/secret.go": ["test", "fixtures", "builder"],
 "test/webhook/testwebhook.go": ["test", "webhook", "tls"],
}

results = {r["path"]: r for r in ex["results"]}
lines = {}
classes = {}
exports = {}
for p, r in results.items():
    for f in r.get("functions", []):
        lines[(p, f["name"])] = (f["startLine"], f["endLine"])
    for c in r.get("classes", []):
        classes[(p, c["name"])] = (c["startLine"], c["endLine"])
    exports[p] = {e["name"] for e in r.get("exports", [])}

def complexity(span):
    if span <= 50:
        return "simple"
    if span <= 150:
        return "moderate"
    return "complex"

nodes = []
for p in sorted(FILES):
    meta = FILES[p]
    nodes.append({
        "id": "file:" + p,
        "type": "file",
        "name": os.path.basename(p),
        "filePath": p,
        "summary": meta["summary"],
        "tags": meta["tags"],
        "complexity": meta["complexity"],
    })
    if meta.get("notes"):
        nodes[-1]["languageNotes"] = meta["notes"]

    for name, kind in SYMS[p]:
        if kind == "class":
            assert (p, name) in classes, (p, name)
            rng = classes[(p, name)]
        else:
            assert (p, name) in lines, (p, name)
            rng = lines[(p, name)]
        summary = SUMS[p].get(name)
        assert summary, (p, name)
        tags = list(TAGBASE[p])
        if kind == "class" and "type-definition" not in tags:
            tags.append("type-definition")
        tags = tags[:5]
        node = {
            "id": ("class:" if kind == "class" else "function:") + p + ":" + name,
            "type": kind,
            "name": name,
            "filePath": p,
            "lineRange": list(rng),
            "summary": summary,
            "tags": tags,
            "complexity": complexity(rng[1] - rng[0] + 1),
        }
        nodes.append(node)

edges = []
part_of_file = {}

for p in sorted(FILES):
    # imports: exactly batchImportData
    for target in imports.get(p, []):
        edges.append({"source": "file:" + p, "target": "file:" + target,
                      "type": "imports", "direction": "forward", "weight": 0.7})
    for name, kind in SYMS[p]:
        nid = ("class:" if kind == "class" else "function:") + p + ":" + name
        edges.append({"source": "file:" + p, "target": nid,
                      "type": "contains", "direction": "forward", "weight": 1.0})
        if name in exports[p]:
            edges.append({"source": "file:" + p, "target": nid,
                          "type": "exports", "direction": "forward", "weight": 0.8})

# Semantic calls / runtime dependencies (high confidence only)
edges.extend([
 {"source": "function:pkg/util/pki/parse_certificate_chain.go:ParseSingleCertificateChainPEM",
  "target": "function:pkg/util/pki/parse.go:DecodeX509CertificateChainBytes",
  "type": "calls", "direction": "forward", "weight": 0.8},
 {"source": "function:pkg/util/pki/temporarycertificate.go:GenerateLocallySignedTemporaryCertificate",
  "target": "function:pkg/util/pki/generate.go:GenerateECPrivateKey",
  "type": "calls", "direction": "forward", "weight": 0.8},
 {"source": "function:pkg/util/pki/temporarycertificate.go:GenerateLocallySignedTemporaryCertificate",
  "target": "function:pkg/util/pki/parse.go:DecodePrivateKeyBytes",
  "type": "calls", "direction": "forward", "weight": 0.8},
 {"source": "function:test/webhook/testwebhook.go:StartWebhookServer",
  "target": "function:internal/webhook/webhook.go:NewCertManagerWebhookServer",
  "type": "calls", "direction": "forward", "weight": 0.8},
 {"source": "file:test/unit/crypto/crypto.go",
  "target": "file:pkg/util/pki/certificatetemplate.go",
  "type": "depends_on", "direction": "forward", "weight": 0.6},
 {"source": "file:test/webhook/testwebhook.go",
  "target": "file:pkg/webhook/server/server.go",
  "type": "depends_on", "direction": "forward", "weight": 0.6},
])

# ---- self checks
assert len({n["id"] for n in nodes}) == len(nodes), "duplicate node IDs"
imp_expected = sum(len(imports.get(p, [])) for p in FILES)
imp_actual = sum(1 for e in edges if e["type"] == "imports")
assert imp_expected == imp_actual, (imp_expected, imp_actual)
assert all(e["source"] != e["target"] for e in edges), "self edge"
node_ids = {n["id"] for n in nodes}
for e in edges:
    assert e["source"] in node_ids, e

imax = {"simple": 0, "moderate": 0, "complex": 0}
print("files", len(FILES), "nodes", len(nodes), "edges", len(edges), "imports", imp_actual)

# ---- partition sequentially, greedy by node/edge limits
counts_nodes = {}
counts_edges = {}
for p in sorted(FILES):
    n = 1 + len(SYMS[p])
    e = len(imports.get(p, [])) + sum(2 if (name in exports[p]) else 1 for name, k in SYMS[p])
    counts_nodes[p], counts_edges[p] = n, e
# add semantic edges to source file's count
for e in edges:
    if e["type"] not in ("imports", "contains", "exports"):
        src = e["source"]
        p = src[5:] if src.startswith("file:") else src.split(":", 2)[1]
        counts_edges[p] += 1

parts = []
cur = []
cn = ce = 0
for p in sorted(FILES):
    n, e = counts_nodes[p], counts_edges[p]
    if cur and (cn + n > 60 or ce + e > 120):
        parts.append(cur); cur = []; cn = ce = 0
    cur.append(p); cn += n; ce += e
if cur:
    parts.append(cur)

file_to_part = {}
for i, pfiles in enumerate(parts, 1):
    for p in pfiles:
        file_to_part[p] = i

nodes_by_part = {i: [] for i in range(1, len(parts) + 1)}
for n in nodes:
    nodes_by_part[file_to_part[n["filePath"]]].append(n)
edges_by_part = {i: [] for i in range(1, len(parts) + 1)}
for e in edges:
    src = e["source"]
    p = None
    if src.startswith("file:"):
        p = src[5:]
    else:
        p = src.split(":", 2)[1]
    edges_by_part[file_to_part[p]].append(e)

os.makedirs(OUTDIR, exist_ok=True)
for i, pfiles in enumerate(parts, 1):
    out = {"nodes": nodes_by_part[i], "edges": edges_by_part[i]}
    fname = os.path.join(OUTDIR, "batch-8-part-%d.json" % i)
    json.dump(out, open(fname, "w"), indent=2)
    print("part", i, "files", len(pfiles), "nodes", len(out["nodes"]), "edges", len(out["edges"]))
    for p in pfiles:
        print("   ", p)
