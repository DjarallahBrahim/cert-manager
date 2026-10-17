#!/usr/bin/env python3
import json, math, os

ROOT = "/Users/samtyga/Desktop/work/cert-manager"
UA = os.path.join(ROOT, ".ua")
with open(os.path.join(UA, "tmp/prompts/batch-17.json")) as f:
    prompt = json.load(f)
with open(os.path.join(UA, "tmp/ua-file-extract-results-17.json")) as f:
    extract = json.load(f)

files = [f["path"] for f in prompt["files"]]
imports = prompt["batchImportData"]

A = "pkg/client/applyconfigurations/certmanager/v1/"
M = "pkg/client/applyconfigurations/meta/v1/"
C = "pkg/client/clientset/versioned/typed/certmanager/v1/"
AC = "pkg/client/clientset/versioned/typed/acme/v1/"

file_meta = {
 A+"vaultkubernetesauth.go": ("Generated apply-configuration builder for the Vault Kubernetes auth method, exposing typed With* setters for mount path, role, SecretKeySelector and ServiceAccountRef.", ["generated-code","apply-configuration","vault","kubernetes-auth","data-model"], "moderate"),
 A+"venaficloud.go": ("Generated apply-configuration builder for Venafi Cloud issuer settings, carrying the Venafi Cloud URL and API token secret reference.", ["generated-code","apply-configuration","venafi","issuer-config","data-model"], "simple"),
 A+"venafiissuer.go": ("Generated apply-configuration builder for the Venafi issuer block, selecting between the TPP and Cloud connection settings and a zone.", ["generated-code","apply-configuration","venafi","issuer-config","data-model"], "simple"),
 A+"venafitpp.go": ("Generated apply-configuration builder for Venafi TPP connection settings, including URL, credentials secret reference and CA bundle fields.", ["generated-code","apply-configuration","venafi","tpp","data-model"], "moderate"),
 A+"x509subject.go": ("Generated apply-configuration builder for X.509 distinguished-name fields such as organizations, countries, localities and serial number.", ["generated-code","apply-configuration","x509","certificate-subject","data-model"], "moderate"),
 "pkg/client/applyconfigurations/internal/internal.go": ("Bundles the structured-merge-diff schema YAML for all cert-manager API types and exposes a lazily initialised typed.Parser used when converting typed objects for server-side apply.", ["generated-code","schema-definition","parser","server-side-apply"], "complex"),
 M+"issuerreference.go": ("Generated apply-configuration builder for an IssuerReference, capturing the referenced issuer name, kind and API group.", ["generated-code","apply-configuration","issuer-reference","meta","data-model"], "simple"),
 M+"localobjectreference.go": ("Generated apply-configuration builder for a LocalObjectReference, limited to the referenced object name.", ["generated-code","apply-configuration","object-reference","meta","data-model"], "simple"),
 M+"secretkeyselector.go": ("Generated apply-configuration builder for a SecretKeySelector, capturing the secret name and the key within it.", ["generated-code","apply-configuration","secret-reference","meta","data-model"], "simple"),
 "pkg/client/applyconfigurations/utils.go": ("Maps GroupVersionKinds to their generated apply-configuration types via ForKind and constructs the managed-fields type converter used by the fake clientset for field-managed apply testing.", ["generated-code","registry","type-conversion","server-side-apply"], "complex"),
 "pkg/client/clientset/versioned/fake/clientset_generated.go": ("Fake clientset backed by client-go object trackers, offering simple and field-managed constructors plus ACME v1 and cert-manager v1 client accessors for unit tests.", ["generated-code","fake-client","clientset","testing"], "moderate"),
 "pkg/client/clientset/versioned/scheme/doc.go": ("Package documentation for the generated scheme package that registers cert-manager clientset types and codecs.", ["generated-code","documentation","scheme","package-doc"], "simple"),
 AC+"challenge.go": ("Generated typed client for ACME Challenge resources, defining the getter and full CRUD/apply interface backed by a gentype client.", ["generated-code","api-client","acme","challenge"], "moderate"),
 AC+"fake/doc.go": ("Package documentation for the generated fake ACME v1 typed clients.", ["generated-code","documentation","fake-client","package-doc"], "simple"),
 AC+"fake/fake_challenge.go": ("Fake typed client implementation for ACME Challenge resources, wiring a gentype fake client with list and apply support.", ["generated-code","fake-client","acme","challenge"], "simple"),
 AC+"fake/fake_order.go": ("Fake typed client implementation for ACME Order resources, wiring a gentype fake client with list and apply support.", ["generated-code","fake-client","acme","order"], "simple"),
 AC+"order.go": ("Generated typed client for ACME Order resources, defining the getter and full CRUD/apply interface backed by a gentype client.", ["generated-code","api-client","acme","order"], "moderate"),
 C+"certificate.go": ("Generated typed client for cert-manager Certificate resources, defining the getter and CRUD/apply interface backed by a gentype client.", ["generated-code","api-client","cert-manager","certificate"], "moderate"),
 C+"certificaterequest.go": ("Generated typed client for cert-manager CertificateRequest resources, defining the getter and CRUD/apply interface including status subresource updates.", ["generated-code","api-client","cert-manager","certificate-request"], "moderate"),
 C+"clusterissuer.go": ("Generated typed client for cluster-scoped cert-manager ClusterIssuer resources, defining the getter and CRUD/apply interface.", ["generated-code","api-client","cert-manager","clusterissuer"], "moderate"),
 C+"doc.go": ("Package documentation for the generated cert-manager v1 typed clientset package.", ["generated-code","documentation","api-client","package-doc"], "simple"),
 C+"fake/doc.go": ("Package documentation for the generated fake cert-manager v1 typed clients.", ["generated-code","documentation","fake-client","package-doc"], "simple"),
 C+"fake/fake_certificate.go": ("Fake typed client implementation for cert-manager Certificate resources, wiring a gentype fake client with list and apply support.", ["generated-code","fake-client","cert-manager","certificate"], "simple"),
 C+"fake/fake_certificaterequest.go": ("Fake typed client implementation for cert-manager CertificateRequest resources, including status subresource handling.", ["generated-code","fake-client","cert-manager","certificate-request"], "simple"),
 C+"fake/fake_certmanager_client.go": ("Fake cert-manager v1 group client that returns fake typed clients for Certificates, CertificateRequests, ClusterIssuers and Issuers.", ["generated-code","fake-client","client-group","cert-manager"], "moderate"),
 C+"fake/fake_clusterissuer.go": ("Fake typed client implementation for cluster-scoped cert-manager ClusterIssuer resources.", ["generated-code","fake-client","cert-manager","clusterissuer"], "simple"),
 C+"fake/fake_issuer.go": ("Fake typed client implementation for cert-manager Issuer resources, wiring a gentype fake client with list and apply support.", ["generated-code","fake-client","cert-manager","issuer"], "simple"),
 C+"generated_expansion.go": ("Declares the empty expansion interfaces that client-gen uses as extension points for Certificate, CertificateRequest, ClusterIssuer and Issuer clients.", ["generated-code","type-definition","extension-point","api-client"], "simple"),
 C+"issuer.go": ("Generated typed client for namespaced cert-manager Issuer resources, defining the getter and CRUD/apply interface backed by a gentype client.", ["generated-code","api-client","cert-manager","issuer"], "moderate"),
}

nodes = []
for p in files:
    summary, tags, complexity = file_meta[p]
    n = {"id": "file:"+p, "type": "file", "name": os.path.basename(p), "filePath": p,
         "summary": summary, "tags": tags, "complexity": complexity}
    if p.endswith("internal/internal.go"):
        n["languageNotes"] = "Schema YAML is embedded as a raw string and parsed once via sync.Once, so parser creation is concurrency-safe and cheap on repeat calls."
    if p.endswith("generated_expansion.go"):
        n["languageNotes"] = "Empty marker interfaces are a client-gen convention that leave room for hand-written methods without editing generated code."
    nodes.append(n)

def cls(file, name, rng, summary, tags, complexity, notes=None):
    n = {"id": f"class:{file}:{name}", "type": "class", "name": name, "filePath": file,
         "lineRange": rng, "summary": summary, "tags": tags, "complexity": complexity}
    if notes: n["languageNotes"] = notes
    nodes.append(n)

def fn(file, name, rng, summary, tags, complexity="simple", notes=None):
    n = {"id": f"function:{file}:{name}", "type": "function", "name": name, "filePath": file,
         "lineRange": rng, "summary": summary, "tags": tags, "complexity": complexity}
    if notes: n["languageNotes"] = notes
    nodes.append(n)

# apply configurations
cls(A+"vaultkubernetesauth.go", "VaultKubernetesAuthApplyConfiguration", [27,32],
    "Apply-configuration struct holding the Vault Kubernetes auth fields with fluent With* setters returning the receiver.",
    ["apply-configuration","builder","vault","kubernetes-auth"], "simple")
fn(A+"vaultkubernetesauth.go", "VaultKubernetesAuth", [36,38],
    "Constructs an empty VaultKubernetesAuthApplyConfiguration for use in declarative apply requests.",
    ["constructor","apply-configuration","vault"], "simple")

cls(A+"venaficloud.go", "VenafiCloudApplyConfiguration", [27,30],
    "Apply-configuration struct for Venafi Cloud settings with setters for URL and API token secret reference.",
    ["apply-configuration","builder","venafi","cloud"], "simple")
fn(A+"venaficloud.go", "VenafiCloud", [34,36],
    "Constructs an empty VenafiCloudApplyConfiguration.",
    ["constructor","apply-configuration","venafi"], "simple")

cls(A+"venafiissuer.go", "VenafiIssuerApplyConfiguration", [23,27],
    "Apply-configuration struct for the Venafi issuer block, holding zone plus optional TPP and Cloud settings.",
    ["apply-configuration","builder","venafi","issuer-config"], "simple")
fn(A+"venafiissuer.go", "VenafiIssuer", [31,33],
    "Constructs an empty VenafiIssuerApplyConfiguration.",
    ["constructor","apply-configuration","venafi"], "simple")

cls(A+"venafitpp.go", "VenafiTPPApplyConfiguration", [27,32],
    "Apply-configuration struct for Venafi TPP settings, with URL, credentials reference and CA bundle setters.",
    ["apply-configuration","builder","venafi","tpp"], "simple")
fn(A+"venafitpp.go", "VenafiTPP", [36,38],
    "Constructs an empty VenafiTPPApplyConfiguration.",
    ["constructor","apply-configuration","venafi"], "simple")

cls(A+"x509subject.go", "X509SubjectApplyConfiguration", [23,32],
    "Apply-configuration struct covering the X.509 subject attributes, with slice setters that copy input values.",
    ["apply-configuration","builder","x509","certificate-subject"], "simple")
fn(A+"x509subject.go", "X509Subject", [36,38],
    "Constructs an empty X509SubjectApplyConfiguration.",
    ["constructor","apply-configuration","x509"], "simple")

# internal
fn("pkg/client/applyconfigurations/internal/internal.go", "Parser", [28,37],
    "Returns the shared structured-merge-diff typed parser, building it once from the embedded schema YAML and panicking if the schema is invalid.",
    ["parser","singleton","server-side-apply","schema-definition"], "simple",
    "sync.Once guards lazy initialisation, so the parser is built at most once per process.")

# meta v1
cls(M+"issuerreference.go", "IssuerReferenceApplyConfiguration", [23,27],
    "Apply-configuration struct for an issuer reference with name, kind and group setters.",
    ["apply-configuration","builder","issuer-reference","meta"], "simple")
fn(M+"issuerreference.go", "IssuerReference", [31,33],
    "Constructs an empty IssuerReferenceApplyConfiguration.",
    ["constructor","apply-configuration","issuer-reference"], "simple")

cls(M+"localobjectreference.go", "LocalObjectReferenceApplyConfiguration", [23,25],
    "Apply-configuration struct for a local object reference, carrying only the object name.",
    ["apply-configuration","builder","object-reference","meta"], "simple")
fn(M+"localobjectreference.go", "LocalObjectReference", [29,31],
    "Constructs an empty LocalObjectReferenceApplyConfiguration.",
    ["constructor","apply-configuration","object-reference"], "simple")

cls(M+"secretkeyselector.go", "SecretKeySelectorApplyConfiguration", [23,26],
    "Apply-configuration struct for selecting a key inside a Secret, with name and key setters.",
    ["apply-configuration","builder","secret-reference","meta"], "simple")
fn(M+"secretkeyselector.go", "SecretKeySelector", [30,32],
    "Constructs an empty SecretKeySelectorApplyConfiguration.",
    ["constructor","apply-configuration","secret-reference"], "simple")

# utils
fn("pkg/client/applyconfigurations/utils.go", "ForKind", [36,196],
    "Returns the generated apply-configuration type for a GroupVersionKind, or nil when no apply configuration exists for that kind.",
    ["registry","type-dispatch","server-side-apply","generated-code"], "complex",
    "A single large switch over SchemeGroupVersion.WithKind maps each cert-manager, ACME and meta kind to its apply configuration.")
fn("pkg/client/applyconfigurations/utils.go", "NewTypeConverter", [198,200],
    "Builds a managed-fields type converter from a runtime scheme and the shared structured-merge-diff parser.",
    ["factory","type-conversion","server-side-apply"], "simple")

# fake clientset
cls("pkg/client/clientset/versioned/fake/clientset_generated.go", "Clientset", [75,79],
    "Fake clientset embedding testing.Fake with discovery and object tracker fields, satisfying the real clientset interfaces.",
    ["fake-client","clientset","testing"], "simple",
    "Compile-time assertions below the struct verify it implements both clientset.Interface and testing.FakeClient.")
fn("pkg/client/clientset/versioned/fake/clientset_generated.go", "NewSimpleClientset", [44,70],
    "Builds a fake clientset around a plain object tracker without field management, serving create/update/delete and watch reactors as-is.",
    ["constructor","fake-client","testing","object-tracker"], "moderate")
fn("pkg/client/clientset/versioned/fake/clientset_generated.go", "NewClientset", [93,123],
    "Builds a fake clientset using a field-managed object tracker and apply-configuration type converter, enabling server-side apply tests.",
    ["constructor","fake-client","testing","server-side-apply"], "moderate")

# typed clients acme
cls(AC+"challenge.go", "ChallengesGetter", [35,37],
    "Interface exposing the Challenges accessor that group clients must implement.",
    ["interface","api-client","acme","challenge"], "simple")
cls(AC+"challenge.go", "ChallengeInterface", [40,55],
    "Full client interface for ACME Challenge resources covering CRUD, watch, patch, apply and status subresource operations.",
    ["interface","api-client","acme","challenge"], "moderate")
fn(AC+"challenge.go", "newChallenges", [63,74],
    "Constructs the gentype-backed challenges client for a namespace using the parent client's REST client and scheme codec.",
    ["constructor","api-client","acme","factory"], "simple")

cls(AC+"order.go", "OrdersGetter", [35,37],
    "Interface exposing the Orders accessor that group clients must implement.",
    ["interface","api-client","acme","order"], "simple")
cls(AC+"order.go", "OrderInterface", [40,55],
    "Full client interface for ACME Order resources covering CRUD, watch, patch, apply and status subresource operations.",
    ["interface","api-client","acme","order"], "moderate")
fn(AC+"order.go", "newOrders", [63,74],
    "Constructs the gentype-backed orders client for a namespace.",
    ["constructor","api-client","acme","factory"], "simple")

# fake acme
cls(AC+"fake/fake_challenge.go", "fakeChallenges", [29,32],
    "Fake Challenge client embedding a gentype fake client and the parent fake group client.",
    ["fake-client","acme","challenge","testing"], "simple")
fn(AC+"fake/fake_challenge.go", "newFakeChallenges", [34,49],
    "Wraps a gentype fake client as a ChallengeInterface, registering the resource and kind plus list conversion helpers.",
    ["constructor","fake-client","acme","factory"], "simple")

cls(AC+"fake/fake_order.go", "fakeOrders", [29,32],
    "Fake Order client embedding a gentype fake client and the parent fake group client.",
    ["fake-client","acme","order","testing"], "simple")
fn(AC+"fake/fake_order.go", "newFakeOrders", [34,49],
    "Wraps a gentype fake client as an OrderInterface with resource/kind registration and list conversion helpers.",
    ["constructor","fake-client","acme","factory"], "simple")

# typed certmanager
for fname, typename, fnname, res, label, summary_cls in [
    ("certificate.go", "Certificates", "newCertificates", "certificates", "certificate",
     "Full client interface for cert-manager Certificate resources covering CRUD, watch, patch, apply and status operations."),
    ("certificaterequest.go", "CertificateRequests", "newCertificateRequests", "certificaterequests", "certificate-request",
     "Full client interface for cert-manager CertificateRequest resources covering CRUD, watch, patch and apply operations."),
    ("clusterissuer.go", "ClusterIssuers", "newClusterIssuers", "clusterissuers", "clusterissuer",
     "Full client interface for cluster-scoped cert-manager ClusterIssuer resources covering CRUD, watch, patch and apply operations."),
    ("issuer.go", "Issuers", "newIssuers", "issuers", "issuer",
     "Full client interface for cert-manager Issuer resources covering CRUD, watch, patch, apply and status operations."),
]:
    getter = typename[:-1] + "Getter" if typename.endswith("s") else typename + "Getter"
    iface = typename[:-1] + "Interface" if typename.endswith("s") else typename + "Interface"
    # certificate -> CertificatesGetter/CertificateInterface
    getter = typename + "Getter"
    iface = typename.rstrip("s") + "Interface"
    cls(C+fname, getter, [35,37],
        f"Interface exposing the {typename} accessor that group clients must implement.",
        ["interface","api-client","cert-manager",label], "simple")
    cls(C+fname, iface, [40,55], summary_cls,
        ["interface","api-client","cert-manager",label], "moderate")
    fn(C+fname, fnname, [63,74],
        f"Constructs the gentype-backed {res} client for the given namespace (or cluster scope).",
        ["constructor","api-client","cert-manager","factory"], "simple")

# fake certmanager
for fname, structname, fnname, typ, label, fnrange in [
    ("fake_certificate.go", "fakeCertificates", "newFakeCertificates", "Certificate", "certificate", [34,49]),
    ("fake_certificaterequest.go", "fakeCertificateRequests", "newFakeCertificateRequests", "CertificateRequest", "certificate-request", [34,53]),
    ("fake_clusterissuer.go", "fakeClusterIssuers", "newFakeClusterIssuers", "ClusterIssuer", "clusterissuer", [34,51]),
    ("fake_issuer.go", "fakeIssuers", "newFakeIssuers", "Issuer", "issuer", [34,49]),
]:
    cls(C+"fake/"+fname, structname, [29,32],
        f"Fake {typ} client embedding a gentype fake client and the parent fake group client.",
        ["fake-client","cert-manager",label,"testing"], "simple")
    fn(C+"fake/"+fname, fnname, fnrange,
        f"Wraps a gentype fake client as a {typ}Interface, registering the resource/kind and list conversion helpers.",
        ["constructor","fake-client","cert-manager","factory"], "simple")

cls(C+"fake/fake_certmanager_client.go", "FakeCertmanagerV1", [27,29],
    "Fake cert-manager v1 group client embedding testing.Fake and returning fake typed clients for each resource.",
    ["fake-client","client-group","cert-manager","testing"], "simple")

for nm, rng in [("CertificateExpansion",[21,21]),("CertificateRequestExpansion",[23,23]),
                ("ClusterIssuerExpansion",[25,25]),("IssuerExpansion",[27,27])]:
    cls(C+"generated_expansion.go", nm, rng,
        f"Empty expansion interface that lets hand-written {nm[:-9]} client methods be added without editing generated code.",
        ["interface","extension-point","api-client","generated-code"], "simple")

# ---------- edges ----------
edges = []
seen_file_nodes = {p for p in files}
for p in files:
    for target in imports[p]:
        edges.append({"source": "file:"+p, "target": "file:"+target, "type": "imports",
                      "direction": "forward", "weight": 0.7})

for n in nodes:
    if n["type"] in ("function", "class"):
        f = n["filePath"]
        edges.append({"source": "file:"+f, "target": n["id"], "type": "contains",
                      "direction": "forward", "weight": 1.0})
        if not n["name"].startswith("fake") and not n["name"].startswith("new"):
            edges.append({"source": "file:"+f, "target": n["id"], "type": "exports",
                          "direction": "forward", "weight": 0.8})

# fake group client functions call in-batch fake constructors; their methods are not
# emitted as standalone nodes in this batch, so no calls edges are recorded here.

# ---------- partition ----------
chunks = [
    files[0:9], files[9:10], files[10:14], files[14:16], files[16:18],
    files[18:20], files[20:24], files[24:27], files[27:29],
]
parts = []
for ci, chunk in enumerate(chunks, 1):
    cset = set(chunk)
    pnodes = [n for n in nodes if n.get("filePath") in cset]
    pids = {n["id"] for n in pnodes}
    pedges = [e for e in edges if e["source"] in pids]
    parts.append({"nodes": pnodes, "edges": pedges})
    print(f"part {ci}: files={len(chunk)} nodes={len(pnodes)} edges={len(pedges)}")
    assert len(pnodes) <= 60 and len(pedges) <= 120, (ci, len(pnodes), len(pedges))

# validation
all_ids = {n["id"] for n in nodes}
assert len(all_ids) == len(nodes), "duplicate node ids"
for e in edges:
    assert e["source"] != e["target"], e
exp_imports = sum(len(v) for v in imports.values())
act_imports = sum(1 for e in edges if e["type"] == "imports")
assert exp_imports == act_imports, (exp_imports, act_imports)
covered = {n.get("filePath") for n in nodes if n["type"] == "file"}
assert covered == seen_file_nodes, "missing file node"
print("TOTAL nodes", len(nodes), "edges", len(edges), "imports", act_imports)

for i, part in enumerate(parts, 1):
    out = os.path.join(UA, "intermediate", f"batch-17-part-{i}.json")
    with open(out, "w") as f:
        json.dump(part, f, indent=2)
        f.write("\n")
    print("wrote", out)
