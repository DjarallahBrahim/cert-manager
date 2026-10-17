import json, math, os

disp = json.load(open('.ua/tmp/prompts/batch-18.json'))
ext = json.load(open('.ua/tmp/ua-file-extract-results-18.json'))
imp = disp['batchImportData']
neighbor = disp['neighborMap']

def F(p, name, summary, tags, cx, notes=None):
    n = {"id": "file:"+p, "type": "file", "name": name, "filePath": p,
         "summary": summary, "tags": tags, "complexity": cx}
    if notes: n["languageNotes"] = notes
    return n

def FN(p, name, lr, summary, tags, cx):
    return {"id": f"function:{p}:{name}", "type": "function", "name": name,
            "filePath": p, "lineRange": lr, "summary": summary,
            "tags": tags, "complexity": cx}

def CL(p, name, lr, summary, tags, cx):
    return {"id": f"class:{p}:{name}", "type": "class", "name": name,
            "filePath": p, "lineRange": lr, "summary": summary,
            "tags": tags, "complexity": cx}

P = "test/e2e/suite/issuers/"
nodes = []
nodes += [
 F(P+"acme/dnsproviders/rfc2136.go", "rfc2136.go",
   "Defines the RFC2136 addon used by ACME e2e tests to expose an RFC2136 DNS-01 challenge solver whose nameserver is taken from the ACME server test configuration.",
   ["test", "e2e", "acme", "dns01", "addon"], "simple"),
 F(P+"acme/doc.go", "doc.go",
   "Package documentation and blank-import barrel that registers the ACME certificate and CertificateRequest e2e suites with the shared framework.",
   ["test", "barrel", "entry-point", "acme"], "simple"),
 F(P+"acme/issuer.go", "issuer.go",
   "Ginkgo suite covering ACME Issuer lifecycle behaviour: account registration, readiness conditions, secret key handling and reconciliation of issuer changes.",
   ["test", "e2e", "acme", "issuer", "integration"], "complex"),
 F(P+"ca/certificate.go", "certificate.go",
   "End-to-end tests for Certificates issued by CA Issuers, validating generated keys, DNS names, subject fields, chain validity and certificate rotation.",
   ["test", "e2e", "ca-issuer", "certificate", "validation"], "complex"),
 F(P+"ca/certificaterequest.go", "certificaterequest.go",
   "End-to-end tests for CertificateRequests signed by CA Issuers, checking IPs, URIs, key usages, approval conditions and private key output.",
   ["test", "e2e", "ca-issuer", "certificate-request", "validation"], "moderate"),
 F(P+"ca/clusterissuer.go", "clusterissuer.go",
   "Verifies that CA ClusterIssuers become Ready from a signing keypair stored in the cluster resource namespace and surface validation errors.",
   ["test", "e2e", "ca-issuer", "clusterissuer", "validation"], "moderate"),
 F(P+"ca/fixtures.go", "fixtures.go",
   "Provides hardcoded CA root and intermediate keypair/certificate fixtures plus helpers that wrap them into Kubernetes Secrets for the CA issuer tests.",
   ["test", "fixtures", "ca-issuer", "certificate", "secrets"], "complex",
   "Large inline PEM blocks hold pre-generated certificate chains that must match the embedded signing keys."),
 F(P+"ca/issuer.go", "issuer.go",
   "Checks that a CA Issuer is created, reports Ready from a valid signing keypair, and fails when the referenced secret is missing or malformed.",
   ["test", "e2e", "ca-issuer", "issuer", "validation"], "moderate"),
 F("test/e2e/suite/issuers/doc.go", "doc.go",
   "Blank-import barrel that pulls in the ACME, CA, SelfSigned, Vault and Venafi issuer test suites so they register with Ginkgo.",
   ["test", "barrel", "entry-point", "issuers"], "simple"),
 F(P+"selfsigned/certificate.go", "certificate.go",
   "End-to-end tests for Certificates issued by a SelfSigned Issuer, verifying keypairs, DNS names, durations and regeneration behaviour.",
   ["test", "e2e", "selfsigned", "certificate", "validation"], "moderate"),
 F(P+"selfsigned/certificaterequest.go", "certificaterequest.go",
   "End-to-end tests for CertificateRequests served by a SelfSigned Issuer, covering signing, durations, key usages and stored private keys.",
   ["test", "e2e", "selfsigned", "certificate-request", "validation"], "moderate"),
 F(P+"selfsigned/fixtures.go", "fixtures.go",
   "Holds hardcoded RSA, ECDSA and Ed25519 private keys, decodes them at init time and offers CSR/secret helpers for the SelfSigned test suite.",
   ["test", "fixtures", "key-generation", "csr", "selfsigned"], "moderate"),
 F(P+"vault/certificate/approle.go", "approle.go",
   "Parameterised Vault AppRole e2e suite that issues Certificates from Vault Issuers and ClusterIssuers with and without root CA saving.",
   ["test", "e2e", "vault", "approle", "certificate"], "complex"),
 F(P+"vault/certificate/cert_auth.go", "cert_auth.go",
   "Parameterised Vault client-certificate-auth e2e suite issuing Certificates from Issuers and ClusterIssuers with optional root CA saving.",
   ["test", "e2e", "vault", "client-auth", "certificate"], "complex"),
 F(P+"vault/certificaterequest/approle.go", "approle.go",
   "Vault AppRole e2e tests for CertificateRequests, asserting issued contents, approval state and renewal durations from Vault-backed issuers.",
   ["test", "e2e", "vault", "approle", "certificate-request"], "complex"),
 F(P+"vault/import.go", "import.go",
   "Blank-import barrel registering the Vault certificate and CertificateRequest test packages.",
   ["test", "barrel", "entry-point", "vault"], "simple"),
 F(P+"vault/issuer.go", "issuer.go",
   "Exercises Vault Issuer configuration end to end: AppRole and Kubernetes auth, secret references, readiness conditions and error reporting.",
   ["test", "e2e", "vault", "issuer", "authentication"], "complex"),
 F(P+"vault/mtls.go", "mtls.go",
   "Tests Vault Issuers configured for enforced mutual TLS, including client certificate secrets, auth mounts and certificate issuance.",
   ["test", "e2e", "vault", "mtls", "issuer"], "complex"),
 F(P+"venafi/cloud/setup.go", "setup.go",
   "Validates a properly configured Venafi Cloud Issuer becomes Ready and defines the CloudDescribe helper wrapping the shared framework.",
   ["test", "e2e", "venafi", "cloud", "issuer"], "moderate"),
 F(P+"venafi/import.go", "import.go",
   "Blank-import barrel registering the Venafi Cloud and TPP issuer test suites.",
   ["test", "barrel", "entry-point", "venafi"], "simple"),
 F(P+"venafi/tpp/certificate.go", "certificate.go",
   "End-to-end tests issuing Certificates through a properly configured Venafi TPP Issuer and validating the resulting TLS secret.",
   ["test", "e2e", "venafi", "tpp", "certificate"], "moderate"),
 F(P+"venafi/tpp/certificaterequest.go", "certificaterequest.go",
   "End-to-end tests submitting CertificateRequests to a Venafi TPP Issuer and checking the signed certificate contents.",
   ["test", "e2e", "venafi", "tpp", "certificate-request"], "moderate"),
 F(P+"venafi/tpp/doc.go", "doc.go",
   "Package documentation for the Venafi TPP test suite and the TPPDescribe helper that delegates to the shared framework.",
   ["test", "venafi", "tpp", "documentation"], "simple"),
 F(P+"venafi/tpp/setup.go", "setup.go",
   "Verifies a properly configured Venafi TPP Issuer is created and becomes Ready, with cleanup of the issuer and addon afterwards.",
   ["test", "e2e", "venafi", "tpp", "issuer"], "moderate"),
 F("test/e2e/suite/serving/cainjector.go", "cainjector.go",
   "End-to-end cainjector tests that inject CA bundles into webhook configurations, APIServices and CRD conversion webhooks and check propagation.",
   ["test", "e2e", "cainjector", "ca-injection", "serving"], "complex"),
 F("test/e2e/util/domains.go", "domains.go",
   "Provides helpers that generate random subdomains of a base domain for e2e test hostnames.",
   ["test", "utility", "domains", "randomization"], "simple"),
 F("test/e2e/util/util.go", "util.go",
   "Shared e2e utility library with issuer condition waiters, certificate/ingress/gateway builders, finalizer helpers and generic list predicates.",
   ["test", "utility", "kubernetes", "waiters", "test-helpers"], "complex"),
]

# --- sub-file nodes -----------------------------------------------------------
RFC = P+"acme/dnsproviders/rfc2136.go"
nodes += [
 CL(RFC, "RFC2136", [27,30],
   "Addon type that captures the ACME test server nameserver and produces an RFC2136 DNS-01 solver configuration.",
   ["test", "addon", "dns01", "acme"], "simple"),
 FN(RFC, "Setup", [32,35],
   "Stores the configured ACME DNS server as the RFC2136 nameserver to use during provisioning.",
   ["test", "setup", "addon", "configuration"], "simple"),
 FN(RFC, "Provision", [40,48],
   "Builds the RFC2136 DNS-01 provider config and base domain returned to ACME tests.",
   ["test", "provisioning", "dns01", "acme"], "simple"),
 FN(RFC, "Deprovision", [50,52],
   "No-op teardown for the RFC2136 addon since no external resources are created.",
   ["test", "teardown", "addon"], "simple"),
 FN(RFC, "Details", [54,56],
   "Returns the accumulated addon details including the RFC2136 provider config and base domain.",
   ["test", "accessor", "addon"], "simple"),
 FN(RFC, "SupportsGlobal", [58,60],
   "Reports that the RFC2136 addon cannot be shared globally across test namespaces.",
   ["test", "addon", "capability"], "simple"),
]

CAF = P+"ca/fixtures.go"
nodes += [
 FN(CAF, "newSigningKeypairSecret", [87,97],
   "Builds a Secret containing the hardcoded root CA certificate and matching private key used as a CA issuer signing keypair.",
   ["test", "fixtures", "secrets", "ca-issuer"], "simple"),
 FN(CAF, "newSigningIssuer1KeypairSecret", [160,170],
   "Builds a Secret with the first intermediate issuer certificate chain and key for chained CA issuer tests.",
   ["test", "fixtures", "secrets", "intermediate-ca"], "simple"),
 FN(CAF, "newSigningIssuer2KeypairSecret", [233,243],
   "Builds a Secret with the second intermediate issuer certificate chain and key for chained CA issuer tests.",
   ["test", "fixtures", "secrets", "intermediate-ca"], "simple"),
]

SF = P+"selfsigned/fixtures.go"
nodes += [
 FN(SF, "init", [31,47],
   "Decodes the embedded RSA, ECDSA and Ed25519 private keys into crypto signers, panicking if a fixture cannot be parsed.",
   ["test", "fixtures", "initialization", "key-generation"], "simple"),
 FN(SF, "newPrivateKeySecret", [91,101],
   "Wraps a PEM encoded private key and optional certificate into a Kubernetes TLS Secret for selfsigned tests.",
   ["test", "fixtures", "secrets", "keys"], "simple"),
 FN(SF, "generateCSR", [130,142],
   "Creates a PEM encoded certificate signing request signed by the supplied key with the given common name and DNS names.",
   ["test", "csr", "key-generation", "utility"], "simple"),
]

VAP = P+"vault/certificate/approle.go"
VCA = P+"vault/certificate/cert_auth.go"
VCR = P+"vault/certificaterequest/approle.go"
nodes += [
 FN(VAP, "runVaultAppRoleTests", [58,279],
   "Runs the Vault AppRole certificate suite for a given issuer kind, provisioning Vault auth/roles and asserting issued certificate contents.",
   ["test", "e2e", "vault", "approle", "orchestration"], "complex"),
 FN(VCA, "runVaultClientCertAuthTest", [59,289],
   "Runs the Vault client-certificate authentication suite for a given issuer kind, creating client cert secrets and validating issued certificates.",
   ["test", "e2e", "vault", "client-auth", "orchestration"], "complex"),
 FN(VCR, "runVaultAppRoleTests", [49,278],
   "Runs the Vault AppRole CertificateRequest suite for a given issuer kind, checking signed request data and renewal durations.",
   ["test", "e2e", "vault", "approle", "orchestration"], "complex"),
]

VCLOUD = P+"venafi/cloud/setup.go"
VTPPDOC = P+"venafi/tpp/doc.go"
nodes += [
 FN(VCLOUD, "CloudDescribe", [34,36],
   "Thin wrapper that registers Venafi Cloud tests through the shared CertManagerDescribe helper.",
   ["test", "venafi", "cloud", "wrapper"], "simple"),
 FN(VTPPDOC, "TPPDescribe", [24,26],
   "Thin wrapper that registers Venafi TPP tests through the shared CertManagerDescribe helper.",
   ["test", "venafi", "tpp", "wrapper"], "simple"),
]

DOM = "test/e2e/util/domains.go"
nodes += [
 FN(DOM, "RandomSubdomain", [27,29],
   "Returns a random five-character subdomain of the supplied base domain.",
   ["test", "utility", "domains"], "simple"),
 FN(DOM, "RandomSubdomainLength", [34,36],
   "Returns a random subdomain of the supplied base domain with a configurable label length.",
   ["test", "utility", "domains", "randomization"], "simple"),
]

U = "test/e2e/util/util.go"
unodes = [
 ("CertificateOnlyValidForDomains", [57,62], "Reports whether a parsed certificate is valid only for the supplied common name and DNS names.", ["test", "validation", "certificate"], "simple"),
 ("WaitForIssuerStatusFunc", [64,72], "Polls an Issuer until the supplied status predicate succeeds or the context is cancelled.", ["test", "waiters", "issuer"], "simple"),
 ("WaitForIssuerCondition", [76,89], "Waits for an Issuer to reach a specific condition, logging API status while polling.", ["test", "waiters", "issuer"], "simple"),
 ("wrapErrorWithIssuerStatusCondition", [92,110], "Decorates a polling error with the Issuer's current status conditions for diagnostics.", ["test", "error-handling", "issuer", "diagnostics"], "simple"),
 ("WaitForClusterIssuerCondition", [114,127], "Waits for a ClusterIssuer to reach a specific condition, logging status while polling.", ["test", "waiters", "clusterissuer"], "simple"),
 ("wrapErrorWithClusterIssuerStatusCondition", [130,148], "Decorates a polling error with the ClusterIssuer's current status conditions for diagnostics.", ["test", "error-handling", "clusterissuer", "diagnostics"], "simple"),
 ("WaitForCRDToNotExist", [152,168], "Polls until the named CustomResourceDefinition is deleted, failing with the last observed status.", ["test", "waiters", "crd"], "simple"),
 ("NewCertManagerBasicCertificateRequest", [171,211], "Builds a CertificateRequest object with the supplied subject, DNS names, IPs, URIs, key usages and duration fields.", ["test", "factory", "certificate-request", "fixtures"], "moderate"),
 ("NewCertManagerVaultCertificate", [213,229], "Builds a Certificate bound to a Vault issuer with optional duration and renewBefore values.", ["test", "factory", "certificate", "vault"], "simple"),
 ("NewIngress", [231,269], "Creates a networking/v1 Ingress exposing TLS for the given secret and DNS names.", ["test", "factory", "networking", "ingress"], "moderate"),
 ("NewV1Beta1Ingress", [271,304], "Creates a networking/v1beta1 Ingress exposing TLS for the given secret and DNS names.", ["test", "factory", "networking", "ingress"], "moderate"),
 ("NewGateway", [315,351], "Builds a Gateway API Gateway with an HTTPS listener referencing the supplied TLS secret and hostnames.", ["test", "factory", "gateway-api", "networking"], "moderate"),
 ("HasIngresses", [355,366], "Checks via API discovery whether the target cluster serves the Ingress resource for a group version.", ["test", "discovery", "networking", "ingress"], "simple"),
 ("AddFinalizer", [370,377], "Adds a finalizer to an object through the controller-runtime client, updating and retrying on conflict.", ["test", "kubernetes", "finalizer", "utility"], "simple"),
 ("RemoveFinalizer", [383,394], "Removes a finalizer from an object through the controller-runtime client with conflict-safe updates.", ["test", "kubernetes", "finalizer", "utility"], "simple"),
 ("ListMatchingPredicates", [411,427], "Lists objects matching all supplied predicates and converts them to the requested pointer type using generics.", ["test", "generic", "predicates", "kubernetes"], "moderate"),
]
for name, lr, summ, tags, cx in unodes:
    nodes.append(FN(U, name, lr, summ, tags, cx))
nodes += [
 CL(U, "ObjectPtrConstraint", [398,401],
   "Generic type constraint describing a pointer type that can yield a typed object value.",
   ["test", "type-definition", "generic"], "simple"),
 CL(U, "ObjectListPtrConstraint", [405,408],
   "Generic type constraint describing a pointer to a list type that can yield typed list items.",
   ["test", "type-definition", "generic"], "simple"),
]

# --- edges --------------------------------------------------------------------
edges = []
for f in disp['files']:
    for tgt in imp[f['path']]:
        edges.append({"source": "file:"+f['path'], "target": "file:"+tgt,
                      "type": "imports", "direction": "forward", "weight": 0.7})

file_paths = {n['filePath'] for n in nodes if n['type'] == 'file'}
for n in nodes:
    if n['type'] in ('function', 'class'):
        edges.append({"source": "file:"+n['filePath'], "target": n['id'],
                      "type": "contains", "direction": "forward", "weight": 1.0})

exported = {
 RFC: {"RFC2136","Setup","Provision","Deprovision","Details","SupportsGlobal"},
 VCLOUD: {"CloudDescribe"},
 VTPPDOC: {"TPPDescribe"},
 DOM: {"RandomSubdomain","RandomSubdomainLength"},
}
exported[U] = {x[0] for x in unodes if x[0] not in ("wrapErrorWithIssuerStatusCondition","wrapErrorWithClusterIssuerStatusCondition")} | {"ObjectPtrConstraint","ObjectListPtrConstraint"}
for n in nodes:
    if n['type'] in ('function','class') and n['name'] in exported.get(n['filePath'], set()):
        edges.append({"source": "file:"+n['filePath'], "target": n['id'],
                      "type": "exports", "direction": "forward", "weight": 0.8})

LOG = "function:test/e2e/framework/log/log.go:LogBackoff"
SETUP = "function:test/e2e/framework/addon/vault/setup.go:"
calls = [
 (f"function:{U}:WaitForIssuerCondition", LOG),
 (f"function:{U}:WaitForClusterIssuerCondition", LOG),
 (f"function:{U}:WaitForCRDToNotExist", LOG),
 (f"function:{VAP}:runVaultAppRoleTests", SETUP+"NewVaultInitializerAppRole"),
 (f"function:{VAP}:runVaultAppRoleTests", SETUP+"NewVaultAppRoleSecret"),
 (f"function:{VAP}:runVaultAppRoleTests", f"function:{U}:WaitForIssuerCondition"),
 (f"function:{VAP}:runVaultAppRoleTests", f"function:{U}:NewCertManagerVaultCertificate"),
 (f"function:{VCA}:runVaultClientCertAuthTest", SETUP+"NewVaultInitializerClientCertificate"),
 (f"function:{VCA}:runVaultClientCertAuthTest", f"function:{U}:WaitForIssuerCondition"),
 (f"function:{VCA}:runVaultClientCertAuthTest", f"function:{U}:NewCertManagerVaultCertificate"),
 (f"function:{VCR}:runVaultAppRoleTests", SETUP+"NewVaultInitializerAppRole"),
 (f"function:{VCR}:runVaultAppRoleTests", SETUP+"NewVaultAppRoleSecret"),
 (f"function:{VCR}:runVaultAppRoleTests", f"function:{U}:WaitForIssuerCondition"),
]
for s,t in calls:
    edges.append({"source": s, "target": t, "type": "calls", "direction": "forward", "weight": 0.8})

# --- validation ---------------------------------------------------------------
ids = [n['id'] for n in nodes]
assert len(ids) == len(set(ids)), "duplicate node ids"
assert len(ids) == 64, len(ids)
want_imports = sum(len(v) for v in imp.values())
got_imports = sum(1 for e in edges if e['type'] == 'imports')
assert got_imports == want_imports, (got_imports, want_imports)
valid_syms = {(nb['path'], s) for lst in neighbor.values() for nb in lst for s in nb['symbols']}
allowed_file_targets = {p for lst in neighbor.values() for nb in lst for p in [nb['path']]} | {p for v in imp.values() for p in v}
idset = set(ids)
for e in edges:
    assert e['source'] in idset, ("bad source", e)
    t = e['target']
    if t in idset: continue
    if t.startswith('file:') and t[5:] in allowed_file_targets: continue
    if t.startswith(('function:','class:')):
        rest = t.split(':',1)[1]
        p, sym = rest.rsplit(':',1)
        if (p, sym) in valid_syms: continue
    raise AssertionError(("bad target", e))
for e in edges:
    assert e['source'] != e['target'], e
print("nodes", len(nodes), "edges", len(edges), "imports", got_imports)

# --- partition ----------------------------------------------------------------
order = sorted(file_paths)
parts = math.ceil(max(len(nodes)/60, len(edges)/120))
size = math.ceil(len(order)/parts)
os.makedirs('.ua/intermediate', exist_ok=True)
for k in range(parts):
    chunk = set(order[k*size:(k+1)*size])
    pnodes = [n for n in nodes if n['filePath'] in chunk]
    pids = {n['id'] for n in pnodes}
    pedges = [e for e in edges if e['source'] in pids]
    out = f'.ua/intermediate/batch-18-part-{k+1}.json'
    json.dump({"nodes": pnodes, "edges": pedges}, open(out,'w'), indent=2)
    print(out, "nodes", len(pnodes), "edges", len(pedges), "files", len(chunk))
