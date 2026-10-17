import json, os, math

ROOT = "/Users/samtyga/Desktop/work/cert-manager"
UA = os.path.join(ROOT, ".ua")
prompt = json.load(open(os.path.join(UA, "tmp/prompts/batch-20.json")))
imports = prompt["batchImportData"]

files = sorted(f["path"] for f in prompt["files"])

nodes = []
edges = []


def fnode(path, summary, tags, complexity, notes=None):
    n = {
        "id": "file:" + path,
        "type": "file",
        "name": os.path.basename(path),
        "filePath": path,
        "summary": summary,
        "tags": tags,
        "complexity": complexity,
    }
    if notes:
        n["languageNotes"] = notes
    nodes.append(n)


def sub(kind, path, name, line_range, summary, tags, complexity):
    n = {
        "id": "%s:%s:%s" % (kind, path, name),
        "type": kind,
        "name": name,
        "filePath": path,
        "lineRange": list(line_range),
        "summary": summary,
        "tags": tags,
        "complexity": complexity,
    }
    nodes.append(n)
    edges.append({
        "source": "file:" + path,
        "target": n["id"],
        "type": "contains",
        "direction": "forward",
        "weight": 1.0,
    })
    edges.append({
        "source": "file:" + path,
        "target": n["id"],
        "type": "exports",
        "direction": "forward",
        "weight": 0.8,
    })


# ---- File nodes ----
fnode("internal/apis/config/controller/zz_generated.deepcopy.go",
      "Generated deepcopy implementations for the internal controller configuration API types, covering ControllerConfiguration and its nested IngressShim, ACME HTTP01/DNS01 and leader election structs.",
      ["code-generation", "deepcopy", "data-model", "controller-config"], "moderate",
      "Kubernetes code-generator output; each type gets DeepCopyInto/DeepCopy plus DeepCopyObject for runtime.Object types.")

fnode("internal/apis/config/shared/doc.go",
      "Package documentation for the shared internal configuration API, declaring the package-level deepcopy generation marker.",
      ["documentation", "package-definition", "deepcopy", "configuration"], "simple")

fnode("internal/apis/config/shared/types_leaderelection.go",
      "Defines the internal LeaderElectionConfig type shared by cert-manager components for leader election tuning.",
      ["data-model", "configuration", "leader-election", "type-definition"], "simple")

fnode("internal/apis/config/shared/types_tlsconfig.go",
      "Defines internal TLS serving configuration types plus helpers that detect whether filesystem-based or dynamic (CA-generated) serving credentials have been configured.",
      ["data-model", "tls", "configuration", "validation-helper"], "moderate")

fnode("internal/apis/config/shared/v1alpha1/conversion.go",
      "Hand-written conversion functions between the internal shared config types and their v1alpha1 API representations, including pointer and duration helpers used by generated conversions.",
      ["conversion", "api-versioning", "tls", "leader-election"], "moderate",
      "Uses k8s apimachinery conversion conventions (Convert_<from>_<to> signatures with scope) so generated registries can wire them up.")

fnode("internal/apis/config/shared/v1alpha1/defaults.go",
      "Provides defaulting functions for shared v1alpha1 configuration, filling in dynamic serving leaf duration and leader election timing defaults.",
      ["defaulting", "api-versioning", "configuration", "leader-election"], "simple")

fnode("internal/apis/config/shared/v1alpha1/doc.go",
      "Package documentation for the shared v1alpha1 configuration API, declaring conversion, deepcopy and defaulting generation markers.",
      ["documentation", "package-definition", "api-versioning", "code-generation"], "simple")

fnode("internal/apis/config/shared/v1alpha1/register.go",
      "Registers the shared v1alpha1 configuration scheme builder by aliasing the controller v1alpha1 SchemeBuilder so shared types join the same scheme.",
      ["registration", "api-versioning", "scheme", "barrel"], "simple")

fnode("internal/apis/config/shared/v1alpha1/zz_generated.conversion.go",
      "Generated conversion registry and auto-conversion routines wiring shared internal config types to v1alpha1, including TLS, dynamic/filesystem serving and leader election structs.",
      ["code-generation", "conversion", "api-versioning", "tls"], "complex")

fnode("internal/apis/config/shared/v1alpha1/zz_generated.defaults.go",
      "Generated defaulting registration that installs the shared v1alpha1 defaulting functions into the scheme.",
      ["code-generation", "defaulting", "api-versioning", "registration"], "simple")

fnode("internal/apis/config/shared/validation/validation.go",
      "Validation helpers for shared configuration: enforces mutually exclusive filesystem/dynamic TLS sources with required fields and sane leader election timings.",
      ["validation", "tls", "leader-election", "configuration"], "moderate")

fnode("internal/apis/config/shared/zz_generated.deepcopy.go",
      "Generated deepcopy implementations for shared internal config types such as TLSConfig, DynamicServingConfig, FilesystemServingConfig and LeaderElectionConfig.",
      ["code-generation", "deepcopy", "data-model", "tls"], "moderate")

fnode("internal/apis/config/webhook/doc.go",
      "Package documentation for the internal webhook component configuration API, marking the package for deepcopy generation.",
      ["documentation", "package-definition", "deepcopy", "webhook"], "simple")

fnode("internal/apis/config/webhook/fuzzer/fuzzer.go",
      "Fuzzer functions for the webhook configuration API that fill pprof and metrics addresses and install recommended logging settings during round-trip fuzz tests.",
      ["testing", "fuzzing", "webhook", "configuration"], "simple",
      "Uses sigs.k8s.io/randfill FillNoCustom to avoid recursive fuzzing of the custom fill function.")

fnode("internal/apis/config/webhook/install/install.go",
      "Adds the internal and v1alpha1 webhook configuration types to a runtime scheme, used when decoding webhook component config files.",
      ["registration", "scheme", "webhook", "configuration"], "simple")

fnode("internal/apis/config/webhook/register.go",
      "Registers the internal webhook configuration group version and known types with the Kubernetes runtime scheme, exposing the Resource helper and AddToScheme builder.",
      ["registration", "scheme", "webhook", "api-versioning"], "simple")

fnode("internal/apis/config/webhook/scheme/scheme.go",
      "Builds a runtime scheme and codec factory containing the webhook configuration types so component config can be decoded and defaulted.",
      ["scheme", "serialization", "webhook", "configuration"], "simple")

fnode("internal/apis/config/webhook/types.go",
      "Defines the internal WebhookConfiguration type describing webhook listener ports, TLS settings, kubeconfig, logging, feature gates and metrics options.",
      ["data-model", "configuration", "webhook", "type-definition"], "moderate")

fnode("internal/apis/config/webhook/v1alpha1/defaults.go",
      "Defaulting logic for the v1alpha1 webhook configuration, setting secure/healthz ports to 6443/6080 and applying recommended logging defaults.",
      ["defaulting", "webhook", "api-versioning", "configuration"], "simple")

fnode("internal/apis/config/webhook/v1alpha1/doc.go",
      "Package documentation for the webhook v1alpha1 configuration API, declaring conversion, deepcopy and defaulting generation markers.",
      ["documentation", "package-definition", "api-versioning", "code-generation"], "simple")

fnode("internal/apis/config/webhook/v1alpha1/register.go",
      "Registers the webhook v1alpha1 group version and wires the hand-written defaulting functions into the scheme builder.",
      ["registration", "api-versioning", "scheme", "webhook"], "simple")

fnode("internal/apis/config/webhook/v1alpha1/zz_generated.conversion.go",
      "Generated conversion functions between the v1alpha1 and internal WebhookConfiguration, delegating TLS config conversion to the shared conversion helpers.",
      ["code-generation", "conversion", "api-versioning", "webhook"], "moderate")

fnode("internal/apis/config/webhook/v1alpha1/zz_generated.defaults.go",
      "Generated defaulting registration for WebhookConfiguration, invoking the webhook defaults and nested dynamic serving config defaults.",
      ["code-generation", "defaulting", "api-versioning", "webhook"], "simple")

fnode("internal/apis/config/webhook/validation/validation.go",
      "Validates the webhook component configuration: logging config, TLS settings and port ranges for the healthz and secure listeners.",
      ["validation", "webhook", "configuration", "tls"], "simple")

fnode("internal/apis/config/webhook/zz_generated.deepcopy.go",
      "Generated deepcopy implementations for the internal WebhookConfiguration, including its TLS, logging, feature gate and metrics TLS fields.",
      ["code-generation", "deepcopy", "webhook", "data-model"], "moderate")

# ---- Sub-file nodes ----
sub("class", "internal/apis/config/shared/types_leaderelection.go", "LeaderElectionConfig", (21, 44),
    "Internal leader election configuration controlling whether leader election is enabled plus namespace, lease duration, renew deadline and retry period.",
    ["data-model", "leader-election", "configuration"], "simple")

sub("class", "internal/apis/config/shared/types_tlsconfig.go", "TLSConfig", (23, 43),
    "TLS serving configuration allowing either filesystem certificate/key files or CA-generated dynamic serving credentials, with cipher suite and minimum version controls.",
    ["data-model", "tls", "configuration"], "simple")

sub("function", "internal/apis/config/shared/types_tlsconfig.go", "FilesystemConfigProvided", (45, 50),
    "Reports whether a filesystem certificate or key file path has been set on the TLS configuration.",
    ["tls", "utility", "predicate"], "simple")

sub("function", "internal/apis/config/shared/types_tlsconfig.go", "DynamicConfigProvided", (52, 57),
    "Reports whether dynamic serving has been configured by checking the secret namespace, secret name and DNS names.",
    ["tls", "utility", "predicate"], "simple")

sub("class", "internal/apis/config/shared/types_tlsconfig.go", "DynamicServingConfig", (61, 75),
    "Configuration for CA-generated dynamic serving certificates, naming the Secret that stores the CA and controlling DNS names and leaf certificate duration.",
    ["data-model", "tls", "configuration"], "simple")

sub("class", "internal/apis/config/shared/types_tlsconfig.go", "FilesystemServingConfig", (79, 85),
    "Configuration pointing at a certificate chain file and private key file on the local filesystem for TLS serving.",
    ["data-model", "tls", "configuration"], "simple")

conv_funcs = [
    ("Convert_shared_TLSConfig_To_v1alpha1_TLSConfig", (32, 34),
     "Converts an internal shared TLSConfig into its v1alpha1 representation via the generated auto-conversion.",
     ["conversion", "tls", "api-versioning"]),
    ("Convert_v1alpha1_TLSConfig_To_shared_TLSConfig", (38, 40),
     "Converts a v1alpha1 TLSConfig back into the internal shared TLSConfig representation.",
     ["conversion", "tls", "api-versioning"]),
    ("Convert_shared_LeaderElectionConfig_To_v1alpha1_LeaderElectionConfig", (44, 46),
     "Converts the internal leader election config into the v1alpha1 API type.",
     ["conversion", "leader-election", "api-versioning"]),
    ("Convert_v1alpha1_LeaderElectionConfig_To_shared_LeaderElectionConfig", (50, 52),
     "Converts a v1alpha1 leader election config into the internal shared type.",
     ["conversion", "leader-election", "api-versioning"]),
    ("Convert_Pointer_float32_To_float32", (54, 61),
     "Dereferences an optional float32 pointer, returning zero when nil, for use in generated conversions.",
     ["conversion", "utility", "pointer"], "simple"),
    ("Convert_float32_To_Pointer_float32", (63, 67),
     "Wraps a float32 value in a newly allocated pointer for API conversion.",
     ["conversion", "utility", "pointer"]),
    ("Convert_Pointer_int32_To_int", (69, 76),
     "Dereferences an optional int32 pointer into an int, returning zero when nil.",
     ["conversion", "utility", "pointer"]),
    ("Convert_int_To_Pointer_int32", (78, 86),
     "Converts an int to an int32 pointer, rejecting values that overflow int32 with an error.",
     ["conversion", "utility", "pointer", "validation"]),
    ("Convert_Pointer_v1alpha1_Duration_To_time_Duration", (88, 95),
     "Converts an optional v1alpha1 Duration pointer into a time.Duration, returning zero when unset.",
     ["conversion", "duration", "utility"]),
    ("Convert_time_Duration_To_Pointer_v1alpha1_Duration", (97, 100),
     "Converts a time.Duration into an optional v1alpha1 Duration pointer using DurationFromTime.",
     ["conversion", "duration", "utility"]),
]
for item in conv_funcs:
    name, lr, summary, tags = item[:4]
    cx = item[4] if len(item) > 4 else "simple"
    sub("function", "internal/apis/config/shared/v1alpha1/conversion.go", name, lr, summary, tags, cx)

sub("function", "internal/apis/config/shared/v1alpha1/defaults.go", "SetDefaults_DynamicServingConfig", (35, 39),
    "Defaults the dynamic serving leaf duration to one year when it has not been set.",
    ["defaulting", "tls", "duration"], "simple")

sub("function", "internal/apis/config/shared/v1alpha1/defaults.go", "SetDefaults_LeaderElectionConfig", (41, 61),
    "Applies default lease duration, renew deadline and retry period values to leader election configuration when unset.",
    ["defaulting", "leader-election", "configuration"], "simple")

sub("function", "internal/apis/config/shared/validation/validation.go", "ValidateTLSConfig", (25, 54),
    "Ensures exactly one TLS source is configured, requiring certificate/key files for filesystem serving and secret/DNS details for dynamic serving.",
    ["validation", "tls", "configuration"], "moderate")

sub("function", "internal/apis/config/shared/validation/validation.go", "ValidateLeaderElectionConfig", (56, 74),
    "Checks that leader election lease duration, renew deadline and retry period values are positive and correctly ordered.",
    ["validation", "leader-election", "configuration"], "simple")

sub("function", "internal/apis/config/webhook/install/install.go", "Install", (30, 33),
    "Registers both the internal and v1alpha1 webhook configuration types into the supplied runtime scheme.",
    ["registration", "scheme", "webhook"], "simple")

sub("function", "internal/apis/config/webhook/register.go", "Resource", (35, 37),
    "Turns an unqualified resource name into a group-qualified GroupResource for the internal webhook config group version.",
    ["registration", "utility", "api-versioning"], "simple")

sub("function", "internal/apis/config/webhook/scheme/scheme.go", "NewSchemeAndCodecs", (30, 40),
    "Creates a runtime scheme with webhook config types registered and returns a matching codec factory for decoding component config.",
    ["scheme", "serialization", "webhook"], "simple")

sub("class", "internal/apis/config/webhook/types.go", "WebhookConfiguration", (28, 73),
    "Internal webhook component configuration covering secure and healthz ports, TLS and metrics TLS settings, kubeconfig, logging, feature gates and pprof options.",
    ["data-model", "configuration", "webhook"], "moderate")

sub("function", "internal/apis/config/webhook/v1alpha1/defaults.go", "SetDefaults_WebhookConfiguration", (33, 49),
    "Defaults the webhook secure port to 6443, healthz port to 6080 and applies recommended logging configuration.",
    ["defaulting", "webhook", "configuration"], "simple")

sub("function", "internal/apis/config/webhook/v1alpha1/register.go", "Resource", (30, 32),
    "Returns the group-qualified GroupResource for a webhook v1alpha1 resource name.",
    ["registration", "utility", "api-versioning"], "simple")

sub("function", "internal/apis/config/webhook/validation/validation.go", "ValidateWebhookConfiguration", (27, 41),
    "Validates webhook logging and TLS config and enforces that healthz and secure ports fall within the valid port range.",
    ["validation", "webhook", "configuration"], "simple")

# ---- Import edges ----
for path, targets in imports.items():
    for target in targets:
        edges.append({
            "source": "file:" + path,
            "target": "file:" + target,
            "type": "imports",
            "direction": "forward",
            "weight": 0.7,
        })

# ---- Cross-file call edges (high confidence, in-batch) ----
extra_edges = [
    ("function:internal/apis/config/webhook/validation/validation.go:ValidateWebhookConfiguration",
     "function:internal/apis/config/shared/validation/validation.go:ValidateTLSConfig"),
]
for src, tgt in extra_edges:
    edges.append({"source": src, "target": tgt, "type": "calls", "direction": "forward", "weight": 0.8})

# --- Deduplicate ---
seen = set()
uniq_nodes = []
for n in nodes:
    if n["id"] in seen:
        raise SystemExit("duplicate node id: " + n["id"])
    seen.add(n["id"])
    uniq_nodes.append(n)

seen_e = set()
uniq_edges = []
for e in edges:
    if e["source"] == e["target"]:
        raise SystemExit("self edge: " + e["source"])
    key = (e["source"], e["target"], e["type"])
    if key in seen_e:
        continue
    seen_e.add(key)
    uniq_edges.append(e)

nodes, edges = uniq_nodes, uniq_edges

node_count = len(nodes)
edge_count = len(edges)
parts = 1
if node_count > 60 or edge_count > 120:
    parts = math.ceil(max(node_count / 60, edge_count / 120))

print("nodes", node_count, "edges", edge_count, "parts", parts)

chunk = math.ceil(len(files) / parts) if parts > 1 else len(files)
outdir = os.path.join(UA, "intermediate")
os.makedirs(outdir, exist_ok=True)

for k in range(parts):
    part_files = set(files[k * chunk:(k + 1) * chunk])
    pnodes = [n for n in nodes if n.get("filePath") in part_files]
    pids = {n["id"] for n in pnodes}
    pedges = [e for e in edges if e["source"] in pids]
    fn = "batch-20.json" if parts == 1 else "batch-20-part-%d.json" % (k + 1)
    with open(os.path.join(outdir, fn), "w") as f:
        json.dump({"nodes": pnodes, "edges": pedges}, f, indent=2)
    print(fn, len(pnodes), len(pedges), len(part_files))

# Validation report
sum_imports = sum(len(v) for v in imports.values())
print("expected imports", sum_imports, "actual imports", sum(1 for e in edges if e["type"] == "imports"))
