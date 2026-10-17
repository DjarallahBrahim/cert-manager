import json, math, os
from collections import OrderedDict

ROOT = "/Users/samtyga/Desktop/work/cert-manager"
res = json.load(open(f"{ROOT}/.ua/tmp/ua-file-extract-results-10.json"))
dispatch = json.load(open(f"{ROOT}/.ua/tmp/prompts/batch-10.json"))
importData = dispatch["batchImportData"]
outdir = f"{ROOT}/.ua/intermediate"
os.makedirs(outdir, exist_ok=True)

META = {
 "pkg/client/applyconfigurations/acme/v1/route53auth.go": (
   "Generated apply configuration for the ACME Route53Auth type, exposing a builder for the Kubernetes-based Route53 authentication setting.",
   ["apply-configuration", "generated", "kubernetes", "acme", "builder"]),
 "pkg/client/applyconfigurations/acme/v1/route53kubernetesauth.go": (
   "Generated apply configuration for the ACME Route53KubernetesAuth type, which references the service account used to authenticate to Route53.",
   ["apply-configuration", "generated", "kubernetes", "acme", "security"]),
 "pkg/client/applyconfigurations/acme/v1/serviceaccountref.go": (
   "Generated apply configuration for the ACME ServiceAccountRef type, carrying the service account name and token audiences used by DNS-01 providers.",
   ["apply-configuration", "generated", "kubernetes", "acme", "dns01"]),
 "pkg/client/applyconfigurations/certmanager/v1/caissuer.go": (
   "Generated apply configuration for the CAIssuer type, exposing the signing secret plus CRL, OCSP, and issuing-certificate URL fields.",
   ["apply-configuration", "generated", "kubernetes", "issuer", "certificate"]),
 "pkg/client/applyconfigurations/certmanager/v1/certificate.go": (
   "Generated server-side apply configuration for the cert-manager Certificate resource, providing metadata helpers, spec/status builders, and Extract* converters for field-manager workflows.",
   ["apply-configuration", "generated", "kubernetes", "certificate", "api-client"]),
 "pkg/client/applyconfigurations/certmanager/v1/certificateadditionaloutputformat.go": (
   "Generated apply configuration for CertificateAdditionalOutputFormat, exposing the output type used for additional certificate encodings.",
   ["apply-configuration", "generated", "kubernetes", "certificate", "data-model"]),
 "pkg/client/applyconfigurations/certmanager/v1/certificatekeystores.go": (
   "Generated apply configuration for CertificateKeystores, wiring the JKS and PKCS12 keystore sub-configurations of a Certificate.",
   ["apply-configuration", "generated", "kubernetes", "certificate", "keystore"]),
 "pkg/client/applyconfigurations/certmanager/v1/certificateprivatekey.go": (
   "Generated apply configuration for CertificatePrivateKey, exposing rotation policy, encoding, algorithm, and key size fields.",
   ["apply-configuration", "generated", "kubernetes", "certificate", "private-key"]),
 "pkg/client/applyconfigurations/certmanager/v1/certificaterequest.go": (
   "Generated server-side apply configuration for the CertificateRequest resource, with metadata helpers, spec/status builders, and Extract* converters for field-manager workflows.",
   ["apply-configuration", "generated", "kubernetes", "certificate-request", "api-client"]),
 "pkg/client/applyconfigurations/certmanager/v1/certificaterequestspec.go": (
   "Generated apply configuration for CertificateRequestSpec, exposing duration, issuer reference, CSR bytes, usages, and requester identity fields.",
   ["apply-configuration", "generated", "kubernetes", "certificate-request", "data-model"]),
 "pkg/client/applyconfigurations/certmanager/v1/certificaterequeststatus.go": (
   "Generated apply configuration for CertificateRequestStatus, exposing conditions, the issued certificate, the CA bundle, and failure time.",
   ["apply-configuration", "generated", "kubernetes", "certificate-request", "status"]),
 "pkg/client/applyconfigurations/certmanager/v1/certificatesecrettemplate.go": (
   "Generated apply configuration for CertificateSecretTemplate, carrying the annotations and labels copied onto the issued Secret.",
   ["apply-configuration", "generated", "kubernetes", "certificate", "secret"]),
 "pkg/client/applyconfigurations/certmanager/v1/certificatespec.go": (
   "Generated apply configuration for CertificateSpec, the large builder covering subject, SANs, secret name, keystores, issuer reference, usages, private key, and name constraints.",
   ["apply-configuration", "generated", "kubernetes", "certificate", "data-model"]),
 "pkg/client/applyconfigurations/certmanager/v1/certificatestatus.go": (
   "Generated apply configuration for CertificateStatus, exposing conditions, renewal timestamps, revision, and issuance failure metadata.",
   ["apply-configuration", "generated", "kubernetes", "certificate", "status"]),
 "pkg/client/applyconfigurations/certmanager/v1/clusterissuer.go": (
   "Generated server-side apply configuration for the cluster-scoped ClusterIssuer resource, with metadata helpers, spec/status builders, and Extract* converters.",
   ["apply-configuration", "generated", "kubernetes", "cluster-issuer", "api-client"]),
 "pkg/client/applyconfigurations/certmanager/v1/issuer.go": (
   "Generated server-side apply configuration for the namespaced Issuer resource, with metadata helpers, spec/status builders, and Extract* converters.",
   ["apply-configuration", "generated", "kubernetes", "issuer", "api-client"]),
 "pkg/client/applyconfigurations/certmanager/v1/issuerconfig.go": (
   "Generated apply configuration for IssuerConfig, wiring the ACME, CA, Vault, SelfSigned, and Venafi issuer backends into one builder.",
   ["apply-configuration", "generated", "kubernetes", "issuer", "data-model"]),
 "pkg/client/applyconfigurations/certmanager/v1/issuerspec.go": (
   "Generated apply configuration for IssuerSpec, the spec surface that carries an IssuerConfig for an Issuer or ClusterIssuer.",
   ["apply-configuration", "generated", "kubernetes", "issuer", "data-model"]),
 "pkg/client/applyconfigurations/certmanager/v1/issuerstatus.go": (
   "Generated apply configuration for IssuerStatus, exposing issuer conditions and ACME account status.",
   ["apply-configuration", "generated", "kubernetes", "issuer", "status"]),
 "pkg/client/applyconfigurations/certmanager/v1/jkskeystore.go": (
   "Generated apply configuration for JKSKeystore, exposing create, alias, and password options for JKS output.",
   ["apply-configuration", "generated", "kubernetes", "keystore", "certificate"]),
 "pkg/client/applyconfigurations/certmanager/v1/nameconstraintitem.go": (
   "Generated apply configuration for NameConstraintItem, exposing permitted or excluded DNS, IP, email, and URI name constraints.",
   ["apply-configuration", "generated", "kubernetes", "certificate", "x509"]),
 "pkg/client/applyconfigurations/certmanager/v1/nameconstraints.go": (
   "Generated apply configuration for NameConstraints, toggling criticality and the permitted and excluded constraint sets.",
   ["apply-configuration", "generated", "kubernetes", "certificate", "x509"]),
 "pkg/client/applyconfigurations/certmanager/v1/othername.go": (
   "Generated apply configuration for OtherName, representing the X.509 otherName subject alternative name extension.",
   ["apply-configuration", "generated", "kubernetes", "certificate", "x509"]),
 "pkg/client/applyconfigurations/certmanager/v1/pkcs12keystore.go": (
   "Generated apply configuration for PKCS12Keystore, exposing create, profile, and password options for PKCS#12 output.",
   ["apply-configuration", "generated", "kubernetes", "keystore", "certificate"]),
 "pkg/client/applyconfigurations/certmanager/v1/selfsignedissuer.go": (
   "Generated apply configuration for SelfSignedIssuer, exposing CRL distribution points for self-signed certificates.",
   ["apply-configuration", "generated", "kubernetes", "issuer", "self-signed"]),
 "pkg/client/applyconfigurations/certmanager/v1/serviceaccountref.go": (
   "Generated apply configuration for the cert-manager ServiceAccountRef type, exposing the service account name and token audiences used by Vault Kubernetes auth.",
   ["apply-configuration", "generated", "kubernetes", "vault", "security"]),
 "pkg/client/applyconfigurations/certmanager/v1/vaultapprole.go": (
   "Generated apply configuration for VaultAppRole, exposing the mount path, role ID, and secret reference for AppRole authentication.",
   ["apply-configuration", "generated", "kubernetes", "vault", "security"]),
 "pkg/client/applyconfigurations/certmanager/v1/vaultauth.go": (
   "Generated apply configuration for VaultAuth, wiring token secret, AppRole, client certificate, and Kubernetes authentication methods.",
   ["apply-configuration", "generated", "kubernetes", "vault", "security"]),
 "pkg/client/applyconfigurations/certmanager/v1/vaultclientcertificateauth.go": (
   "Generated apply configuration for VaultClientCertificateAuth, exposing the mount path and client certificate secret used for Vault authentication.",
   ["apply-configuration", "generated", "kubernetes", "vault", "security"]),
 "pkg/client/applyconfigurations/certmanager/v1/vaultissuer.go": (
   "Generated apply configuration for VaultIssuer, exposing auth, server, path, namespace, CA bundle, and client certificate/key secret references.",
   ["apply-configuration", "generated", "kubernetes", "vault", "issuer"]),
}

def complexity(lines):
    if lines < 50: return "simple"
    if lines <= 200: return "moderate"
    return "complex"

RESOURCE_CONSTRUCTORS = {"Certificate", "CertificateRequest", "ClusterIssuer", "Issuer"}

def const_summary(name):
    article = "an" if name[0].lower() in "aeiou" else "a"
    if name in RESOURCE_CONSTRUCTORS:
        return f"Creates {article} {name} apply configuration pre-populated with the resource name, namespace, kind, and API version."
    return f"Constructs an empty {name} apply configuration for use with Kubernetes server-side apply."

def setter_summary(field):
    return f"Sets the {field} field on the apply configuration and returns the receiver for fluent chaining."

def getter_summary(field):
    return f"Returns the {field} value from the apply configuration."

def fn_summary(name, cls):
    if name == "IsApplyConfiguration":
        return "Marker method that identifies this struct as a Kubernetes apply configuration."
    if name.startswith("Extract"):
        base = name[7:]
        if base.endswith("Status"):
            return f"Extracts the status-subresource apply configuration for a field manager from a live {base[:-6]} object."
        return f"Extracts the applied configuration owned by a field manager from a live {base} object for extract/modify-in-place/apply workflows."
    if name.startswith("extract"):
        t = name[7:]
        return f"Shared helper that converts a {t} object into its apply configuration, optionally targeting the status subresource."
    if name.startswith("With"):
        field = name[4:]
        return setter_summary(field)
    if name.startswith("Get"):
        return getter_summary(name[3:])
    return const_summary(name)

def fn_tags(name):
    if name == "IsApplyConfiguration":
        return ["marker", "apply-configuration", "type-definition"]
    if name.startswith("Extract"):
        return ["conversion", "apply-configuration", "serialization"]
    if name.startswith("extract"):
        return ["conversion", "apply-configuration", "internal-helper"]
    if name.startswith("With"):
        return ["field-setter", "builder", "apply-configuration"]
    if name.startswith("Get"):
        return ["accessor", "apply-configuration", "metadata"]
    return ["constructor", "apply-configuration", "builder"]

nodes = []
edges = []
own_ids = set()
per_file_edges = {}

for r in res["results"]:
    path = r["path"]
    summary, tags = META[path]
    exports = {e["name"] for e in r.get("exports", [])}
    file_id = f"file:{path}"
    notes = None
    if "apply-configuration" in tags:
        notes = "Follows the generated client-go applyconfiguration pattern: With* builders mutate and return the receiver, Extract* converts live objects."
    node = {
        "id": file_id, "type": "file", "name": os.path.basename(path), "filePath": path,
        "summary": summary, "tags": tags, "complexity": complexity(r.get("nonEmptyLines", 0)),
    }
    if notes:
        node["languageNotes"] = notes
    nodes.append(node); own_ids.add(file_id)

    for c in r.get("classes", []):
        cid = f"class:{path}:{c['name']}"
        props = c.get("properties", [])
        methods = c.get("methods", [])
        csum = (f"Declarative apply-configuration struct for {c['name'].replace('ApplyConfiguration','')} "
                f"with {len(methods)} builder/accessor method{'s' if len(methods) != 1 else ''} and fields: {', '.join(props) if props else 'none'}.")
        cplx = complexity(c["endLine"] - c["startLine"] + 1)
        if cplx == "simple" and len(methods) > 5:
            cplx = "moderate"
        nodes.append({
            "id": cid, "type": "class", "name": c["name"], "filePath": path,
            "lineRange": [c["startLine"], c["endLine"]], "summary": csum,
            "tags": ["apply-configuration", "data-model", "kubernetes", "generated"],
            "complexity": cplx,
        })
        own_ids.add(cid)
        edges.append({"source": file_id, "target": cid, "type": "contains", "direction": "forward", "weight": 1.0})
        if c["name"] in exports:
            edges.append({"source": file_id, "target": cid, "type": "exports", "direction": "forward", "weight": 0.8})

    for f in r.get("functions", []):
        name = f["name"]
        is_exported = name in exports
        nlines = f["endLine"] - f["startLine"] + 1
        # significance filter: exported, or 10+ lines (private helpers)
        if not is_exported and nlines < 10:
            continue
        if name.startswith("ensureObjectMeta"):
            continue
        fid = f"function:{path}:{name}"
        if fid in own_ids:
            continue
        nodes.append({
            "id": fid, "type": "function", "name": name, "filePath": path,
            "lineRange": [f["startLine"], f["endLine"]],
            "summary": fn_summary(name, None),
            "tags": fn_tags(name),
            "complexity": "moderate" if nlines > 30 else "simple",
        })
        own_ids.add(fid)
        edges.append({"source": file_id, "target": fid, "type": "contains", "direction": "forward", "weight": 1.0})
        if is_exported:
            edges.append({"source": file_id, "target": fid, "type": "exports", "direction": "forward", "weight": 0.8})

    # imports (1:1 with batchImportData)
    for target in importData.get(path, []):
        edges.append({"source": file_id, "target": f"file:{target}", "type": "imports", "direction": "forward", "weight": 0.7})

print("nodes", len(nodes), "edges", len(edges))

# partition: sorted files, 7 contiguous groups balanced by edge weight
files_sorted = sorted(r["path"] for r in res["results"])
edge_count = {}
for e in edges:
    if e["source"].startswith("file:"):
        p = e["source"][5:]
        edge_count[p] = edge_count.get(p, 0) + 1
node_count = {}
for n in nodes:
    if n.get("filePath"):
        node_count[n["filePath"]] = node_count.get(n["filePath"], 0) + 1

npv = [node_count.get(p, 0) for p in files_sorted]
epv = [edge_count.get(p, 0) for p in files_sorted]
M = 7
N = len(files_sorted)
INF = 10**9
# dp[k][i] = min max part cost splitting first i files into k groups
dp = [[INF] * (N + 1) for _ in range(M + 1)]
prev = [[-1] * (N + 1) for _ in range(M + 1)]
dp[0][0] = 0
for k in range(1, M + 1):
    for i in range(1, N + 1):
        ne = 0; nn = 0
        for j in range(i, 0, -1):
            ne += epv[j - 1]; nn += npv[j - 1]
            cost = max(ne / 120.0, nn / 60.0)
            if dp[k - 1][j - 1] < INF:
                val = max(dp[k - 1][j - 1], cost)
                if val < dp[k][i]:
                    dp[k][i] = val
                    prev[k][i] = j - 1
bounds = []
i = N
for k in range(M, 0, -1):
    j = prev[k][i]
    bounds.append((j, i))
    i = j
bounds.reverse()
parts = [files_sorted[j:i] for j, i in bounds]
print("parts", [len(p) for p in parts])
print("part edges", [sum(edge_count.get(p, 0) for p in part) for part in parts])
print("part nodes", [sum(node_count.get(p, 0) for p in part) for part in parts])

file_to_nodes = {}
for n in nodes:
    if n.get("filePath"):
        file_to_nodes.setdefault(n["filePath"], []).append(n)
for e in edges:
    if not e["source"].startswith("file:"):
        raise SystemExit("unexpected non-file edge source")
    file_to_nodes.setdefault(e["source"][5:], [])

for k, part in enumerate(parts, 1):
    part_set = set(part)
    pnodes = [n for n in nodes if n.get("filePath") in part_set]
    pedges = [e for e in edges if e["source"][5:] in part_set]
    with open(f"{outdir}/batch-10-part-{k}.json", "w") as fh:
        json.dump({"nodes": pnodes, "edges": pedges}, fh, indent=2)
    print(f"part {k}: files={len(part)} nodes={len(pnodes)} edges={len(pedges)}")

print("total imports expected", sum(len(v) for v in importData.values()))
print("total imports written", sum(1 for e in edges if e["type"] == "imports"))
print("dupes", len(nodes) - len({n['id'] for n in nodes}))
print("sorted files", files_sorted)
