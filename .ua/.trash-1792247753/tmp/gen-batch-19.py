import json, math, os

ROOT = "/Users/samtyga/Desktop/work/cert-manager"
OUT = os.path.join(ROOT, ".ua/intermediate")
dispatch = json.load(open(os.path.join(ROOT, ".ua/tmp/prompts/batch-19.json")))
batch_index = dispatch["batchIndex"]
import_data = dispatch["batchImportData"]

FILES = [
    ("internal/apis/config/cainjector/doc.go", "file", "simple",
     "Package-level documentation for the internal cainjector configuration API group, declaring the group name and deepcopy code-generation markers.",
     ["package-doc", "api-group", "code-generation", "internal-api"]),
    ("internal/apis/config/cainjector/fuzzer/fuzzer.go", "file", "simple",
     "Provides randfill fuzzer functions for the internal cainjector configuration, seeding defaults so API round-trip tests do not mutate values.",
     ["testing", "fuzzing", "round-trip", "api-group"]),
    ("internal/apis/config/cainjector/install/install.go", "file", "simple",
     "Registers the cainjector internal and v1alpha1 configuration types into a runtime scheme via a single exported Install helper.",
     ["scheme-registration", "initialization", "api-group", "entry-point"]),
    ("internal/apis/config/cainjector/register.go", "file", "simple",
     "Defines the internal cainjector config GroupVersion, Resource helper and known-type registration for the scheme.",
     ["api-group", "registration", "type-definition", "configuration"]),
    ("internal/apis/config/cainjector/scheme/scheme.go", "file", "simple",
     "Builds a runtime scheme and codec factory preloaded with the internal and v1alpha1 cainjector configuration types.",
     ["scheme", "serialization", "factory", "api-group"]),
    ("internal/apis/config/cainjector/types.go", "file", "moderate",
     "Defines the internal CAInjectorConfiguration type plus the data-source and injectable-resource enablement sub-configs consumed by the cainjector binary.",
     ["data-model", "configuration", "api-group", "type-definition"]),
    ("internal/apis/config/cainjector/v1alpha1/defaults.go", "file", "moderate",
     "Implements defaulting for the cainjector v1alpha1 configuration, filling logging, metrics and watch-enablement fields when unset.",
     ["defaulting", "configuration", "api-group", "validation"]),
    ("internal/apis/config/cainjector/v1alpha1/doc.go", "file", "simple",
     "Versioned package documentation for cainjector config v1alpha1 that declares the conversion, defaulter and group-name code-generation directives.",
     ["package-doc", "api-group", "code-generation", "versioning"]),
    ("internal/apis/config/cainjector/v1alpha1/register.go", "file", "simple",
     "Registers the cainjector config v1alpha1 GroupVersion, its Resource helper and the local scheme builder used for conversions and defaulting.",
     ["api-group", "registration", "scheme", "versioning"]),
    ("internal/apis/config/cainjector/v1alpha1/zz_generated.conversion.go", "file", "complex",
     "Generated conversion functions translating between the v1alpha1 and internal cainjector configuration types, delegating shared TLS and leader-election fields to the shared conversions package.",
     ["code-generation", "conversion", "serialization", "api-group"]),
    ("internal/apis/config/cainjector/v1alpha1/zz_generated.defaults.go", "file", "simple",
     "Generated defaulting registration that wires the cainjector configuration defaulter, including shared leader-election and serving-TLS defaults, into the scheme.",
     ["code-generation", "defaulting", "api-group", "registration"]),
    ("internal/apis/config/cainjector/validation/validation.go", "file", "simple",
     "Validates the cainjector configuration, delegating logging and leader-election checks to shared validators and aggregating field errors.",
     ["validation", "configuration", "api-group", "error-handling"]),
    ("internal/apis/config/cainjector/zz_generated.deepcopy.go", "file", "moderate",
     "Generated DeepCopy implementations for the internal cainjector configuration types, deep-copying slices, maps and nested logging/TLS structs.",
     ["code-generation", "deepcopy", "api-group", "serialization"]),
    ("internal/apis/config/controller/doc.go", "file", "simple",
     "Package-level documentation for the internal controller configuration API group, declaring the group name and deepcopy code-generation markers.",
     ["package-doc", "api-group", "code-generation", "internal-api"]),
    ("internal/apis/config/controller/fuzzer/fuzzer.go", "file", "moderate",
     "Provides randfill fuzzer functions for the internal controller configuration, populating every defaulted field so API round-trip tests stay stable.",
     ["testing", "fuzzing", "round-trip", "api-group"]),
    ("internal/apis/config/controller/install/install.go", "file", "simple",
     "Registers the controller internal and v1alpha1 configuration types into a runtime scheme via a single exported Install helper.",
     ["scheme-registration", "initialization", "api-group", "entry-point"]),
    ("internal/apis/config/controller/register.go", "file", "simple",
     "Defines the internal controller config GroupVersion, Resource helper and known-type registration for the scheme.",
     ["api-group", "registration", "type-definition", "configuration"]),
    ("internal/apis/config/controller/scheme/scheme.go", "file", "simple",
     "Builds a runtime scheme and codec factory preloaded with the internal and v1alpha1 controller configuration types.",
     ["scheme", "serialization", "factory", "api-group"]),
    ("internal/apis/config/controller/types.go", "file", "complex",
     "Defines the internal ControllerConfiguration type together with its leader-election, ingress-shim, ACME HTTP01 and ACME DNS01 sub-configurations.",
     ["data-model", "configuration", "api-group", "type-definition"]),
    ("internal/apis/config/controller/v1alpha1/defaults.go", "file", "complex",
     "Implements defaulting for the controller v1alpha1 configuration, applying cert-manager's default addresses, controller list, worker counts and ACME solver settings.",
     ["defaulting", "configuration", "api-group", "acme"]),
    ("internal/apis/config/controller/v1alpha1/doc.go", "file", "simple",
     "Versioned package documentation for controller config v1alpha1 that declares the conversion, defaulter and group-name code-generation directives.",
     ["package-doc", "api-group", "code-generation", "versioning"]),
    ("internal/apis/config/controller/v1alpha1/register.go", "file", "simple",
     "Registers the controller config v1alpha1 GroupVersion, its Resource helper and the local scheme builder used for conversions and defaulting.",
     ["api-group", "registration", "scheme", "versioning"]),
    ("internal/apis/config/controller/v1alpha1/zz_generated.conversion.go", "file", "complex",
     "Generated conversion functions translating every v1alpha1 controller configuration type to and from its internal counterpart, delegating shared TLS and leader-election fields.",
     ["code-generation", "conversion", "serialization", "api-group"]),
    ("internal/apis/config/controller/v1alpha1/zz_generated.defaults.go", "file", "simple",
     "Generated defaulting registration that chains the controller, leader-election, ingress-shim and ACME solver defaulters into the scheme.",
     ["code-generation", "defaulting", "api-group", "registration"]),
    ("internal/apis/config/controller/validation/validation.go", "file", "moderate",
     "Validates the controller configuration, checking logging, metrics TLS, leader election, ingress-shim defaults and ACME HTTP01/DNS01 solver fields.",
     ["validation", "configuration", "api-group", "acme"]),
]

CL = "internal/apis/config/cainjector"
CT = "internal/apis/config/controller"

CLASSES = [
    (f"{CL}/types.go", "CAInjectorConfiguration", 28, 72,
     "Root internal cainjector configuration object holding kubeconfig, namespace scope, leader election, logging, feature gates and metrics TLS settings.",
     ["data-model", "configuration", "root-object", "api-group"]),
    (f"{CL}/types.go", "EnableDataSourceConfig", 74, 78,
     "Flags which cert-manager resources cainjector watches as sources of CA data.",
     ["data-model", "configuration", "cainjector"]),
    (f"{CL}/types.go", "EnableInjectableConfig", 80, 100,
     "Selects which resource kinds (webhook configurations, CRDs, APIServices) cainjector injects CA data into.",
     ["data-model", "configuration", "cainjector"]),
    (f"{CT}/types.go", "ControllerConfiguration", 30, 136,
     "Root internal controller configuration object covering API server access, controller enablement, leader election, metrics, feature gates and ACME settings.",
     ["data-model", "configuration", "root-object", "api-group"]),
    (f"{CT}/types.go", "LeaderElectionConfig", 138, 144,
     "Extends the shared leader-election configuration with a healthz timeout used while the lease is valid.",
     ["data-model", "configuration", "leader-election"]),
    (f"{CT}/types.go", "IngressShimConfig", 146, 167,
     "Holds the default issuer name, kind, group and annotation filters used by the ingress-shim controller.",
     ["data-model", "configuration", "ingress-shim"]),
    (f"{CT}/types.go", "ACMEHTTP01Config", 169, 200,
     "Configures the ACME HTTP01 solver image, resource requests/limits, nameservers and non-root execution.",
     ["data-model", "configuration", "acme", "http01"]),
    (f"{CT}/types.go", "ACMEDNS01Config", 202, 225,
     "Configures ACME DNS01 self-checks: recursive nameservers, nameserver-only mode and propagation retry period.",
     ["data-model", "configuration", "acme", "dns01"]),
]

FUNCS = [
    (f"{CL}/install/install.go", "Install", 30, 33,
     "Adds the cainjector internal and v1alpha1 configuration types to the supplied runtime scheme, panicking on registration errors.",
     ["scheme-registration", "initialization", "api-group"]),
    (f"{CL}/register.go", "Resource", 35, 37,
     "Returns the GroupResource for a cainjector config resource name under the internal group version.",
     ["api-group", "registration", "utility"]),
    (f"{CL}/scheme/scheme.go", "NewSchemeAndCodecs", 30, 40,
     "Constructs a runtime scheme populated with cainjector config types and returns it alongside a matching codec factory.",
     ["scheme", "factory", "serialization"]),
    (f"{CL}/v1alpha1/defaults.go", "SetDefaults_CAInjectorConfiguration", 33, 43,
     "Applies cainjector configuration defaults, notably the recommended logging configuration for the root object.",
     ["defaulting", "configuration", "api-group"]),
    (f"{CL}/v1alpha1/defaults.go", "SetDefaults_EnableDataSourceConfig", 45, 49,
     "Enables certificate watching by default for cainjector's data-source configuration.",
     ["defaulting", "configuration", "cainjector"]),
    (f"{CL}/v1alpha1/defaults.go", "SetDefaults_EnableInjectableConfig", 51, 64,
     "Enables webhook configurations, CRDs and APIServices as injection targets by default.",
     ["defaulting", "configuration", "cainjector"]),
    (f"{CL}/v1alpha1/register.go", "Resource", 30, 32,
     "Returns the GroupResource for a cainjector config resource name under the v1alpha1 group version.",
     ["api-group", "registration", "utility", "versioning"]),
    (f"{CL}/v1alpha1/zz_generated.conversion.go", "RegisterConversions", 41, 73,
     "Registers the generated cainjector v1alpha1/internal conversion functions on the supplied conversion scheme.",
     ["conversion", "registration", "code-generation"]),
    (f"{CL}/v1alpha1/zz_generated.conversion.go", "autoConvert_v1alpha1_CAInjectorConfiguration_To_cainjector_CAInjectorConfiguration", 75, 96,
     "Copies every field of the v1alpha1 cainjector configuration into the internal type, delegating shared TLS and leader-election conversions.",
     ["conversion", "serialization", "code-generation"]),
    (f"{CL}/v1alpha1/zz_generated.conversion.go", "autoConvert_cainjector_CAInjectorConfiguration_To_v1alpha1_CAInjectorConfiguration", 103, 124,
     "Copies every field of the internal cainjector configuration back into the v1alpha1 type using unsafe pointer casts for maps.",
     ["conversion", "serialization", "code-generation"]),
    (f"{CL}/v1alpha1/zz_generated.defaults.go", "RegisterDefaults", 33, 38,
     "Registers the cainjector configuration object defaulter with the scheme's defaulting registry.",
     ["defaulting", "registration", "code-generation"]),
    (f"{CL}/v1alpha1/zz_generated.defaults.go", "SetObjectDefaults_CAInjectorConfiguration", 40, 46,
     "Chains all cainjector defaulters - logging, shared leader election, data source, injectable targets and metrics TLS - for a configuration object.",
     ["defaulting", "configuration", "code-generation"]),
    (f"{CL}/validation/validation.go", "ValidateCAInjectorConfiguration", 27, 34,
     "Validates a cainjector configuration, aggregating logging and leader-election field errors into a single field.ErrorList.",
     ["validation", "configuration", "error-handling"]),
    (f"{CL}/zz_generated.deepcopy.go", "DeepCopyInto", 29, 45,
     "Generated deep-copy of a cainjector configuration into an existing object, duplicating feature-gate maps and nested logging/TLS structs; repeated for each config type in the file.",
     ["deepcopy", "code-generation", "serialization"]),
    (f"{CL}/zz_generated.deepcopy.go", "DeepCopy", 48, 55,
     "Generated deep-copy constructor returning a new cainjector configuration object; defined for several config types in this file.",
     ["deepcopy", "code-generation", "serialization"]),
    (f"{CL}/zz_generated.deepcopy.go", "DeepCopyObject", 58, 63,
     "Implements runtime.Object for the root cainjector configuration by returning a fresh deep copy.",
     ["deepcopy", "code-generation", "runtime-object"]),
    (f"{CT}/install/install.go", "Install", 30, 33,
     "Adds the controller internal and v1alpha1 configuration types to the supplied runtime scheme, panicking on registration errors.",
     ["scheme-registration", "initialization", "api-group"]),
    (f"{CT}/register.go", "Resource", 35, 37,
     "Returns the GroupResource for a controller config resource name under the internal group version.",
     ["api-group", "registration", "utility"]),
    (f"{CT}/scheme/scheme.go", "NewSchemeAndCodecs", 30, 40,
     "Constructs a runtime scheme populated with controller config types and returns it alongside a matching codec factory.",
     ["scheme", "factory", "serialization"]),
    (f"{CT}/v1alpha1/defaults.go", "SetDefaults_ControllerConfiguration", 186, 260,
     "Fills every unset controller configuration field - API server address, kubeconfig, QPS/burst, namespace, controller list, worker counts, metrics/healthz addresses, profiling and logging - with cert-manager defaults.",
     ["defaulting", "configuration", "api-group"]),
    (f"{CT}/v1alpha1/defaults.go", "SetDefaults_LeaderElectionConfig", 262, 266,
     "Defaults the leader-election healthz timeout from the shared duration helper when unset.",
     ["defaulting", "leader-election", "configuration"]),
    (f"{CT}/v1alpha1/defaults.go", "SetDefaults_IngressShimConfig", 268, 288,
     "Defaults the ingress-shim issuer name, kind, group and auto-certificate annotations used for TLS-enabled ingresses.",
     ["defaulting", "ingress-shim", "configuration"]),
    (f"{CT}/v1alpha1/defaults.go", "SetDefaults_ACMEHTTP01Config", 290, 318,
     "Defaults the ACME HTTP01 solver image, resource requests/limits and nameservers for challenge solver pods.",
     ["defaulting", "acme", "http01"]),
    (f"{CT}/v1alpha1/defaults.go", "SetDefaults_ACMEDNS01Config", 320, 332,
     "Defaults the ACME DNS01 check retry period and recursive nameservers used for propagation self-checks.",
     ["defaulting", "acme", "dns01"]),
    (f"{CT}/v1alpha1/register.go", "Resource", 30, 32,
     "Returns the GroupResource for a controller config resource name under the v1alpha1 group version.",
     ["api-group", "registration", "utility", "versioning"]),
    (f"{CT}/v1alpha1/zz_generated.conversion.go", "RegisterConversions", 41, 93,
     "Registers all generated controller v1alpha1/internal conversion functions on the supplied conversion scheme.",
     ["conversion", "registration", "code-generation"]),
    (f"{CT}/v1alpha1/zz_generated.conversion.go", "autoConvert_v1alpha1_ControllerConfiguration_To_controller_ControllerConfiguration", 163, 218,
     "Converts the full v1alpha1 controller configuration into the internal type, recursing into leader-election, ingress-shim and ACME solver sub-configs.",
     ["conversion", "serialization", "code-generation"]),
    (f"{CT}/v1alpha1/zz_generated.conversion.go", "autoConvert_controller_ControllerConfiguration_To_v1alpha1_ControllerConfiguration", 225, 280,
     "Converts the full internal controller configuration back into the v1alpha1 type, copying pointer and slice fields via unsafe casts where safe.",
     ["conversion", "serialization", "code-generation"]),
    (f"{CT}/v1alpha1/zz_generated.defaults.go", "RegisterDefaults", 33, 38,
     "Registers the controller configuration object defaulter with the scheme's defaulting registry.",
     ["defaulting", "registration", "code-generation"]),
    (f"{CT}/v1alpha1/zz_generated.defaults.go", "SetObjectDefaults_ControllerConfiguration", 40, 48,
     "Chains the controller, leader-election, ingress-shim and ACME HTTP01/DNS01 defaulters for a configuration object.",
     ["defaulting", "configuration", "code-generation"]),
    (f"{CT}/validation/validation.go", "ValidateControllerConfiguration", 33, 97,
     "Validates the controller configuration: logging, metrics TLS, leader election, ingress-shim issuer defaults, ACME HTTP01 solver settings and DNS01 retry/nameserver options.",
     ["validation", "configuration", "acme"]),
]

nodes = []
for path, ntype, complexity, summary, tags in FILES:
    nodes.append({
        "id": f"{ntype}:{path}",
        "type": ntype,
        "name": os.path.basename(path),
        "filePath": path,
        "summary": summary,
        "tags": tags,
        "complexity": complexity,
    })

for path, name, start, end, summary, tags in CLASSES:
    nodes.append({
        "id": f"class:{path}:{name}",
        "type": "class",
        "name": name,
        "filePath": path,
        "lineRange": [start, end],
        "summary": summary,
        "tags": tags,
        "complexity": "complex" if (end - start) > 80 else "moderate",
    })

for path, name, start, end, summary, tags in FUNCS:
    span = end - start
    nodes.append({
        "id": f"function:{path}:{name}",
        "type": "function",
        "name": name,
        "filePath": path,
        "lineRange": [start, end],
        "summary": summary,
        "tags": tags,
        "complexity": "complex" if span > 50 else ("moderate" if span >= 15 else "simple"),
    })

edges = []
node_by_id = {n["id"]: n for n in nodes}
assert len(node_by_id) == len(nodes), "duplicate node ids"

for n in nodes:
    if n["type"] in ("function", "class"):
        edges.append({"source": f"file:{n['filePath']}", "target": n["id"], "type": "contains",
                      "direction": "forward", "weight": 1.0})
        edges.append({"source": f"file:{n['filePath']}", "target": n["id"], "type": "exports",
                      "direction": "forward", "weight": 0.8})

# imports: exactly batchImportData
for path, targets in import_data.items():
    for t in targets:
        edges.append({"source": f"file:{path}", "target": f"file:{t}", "type": "imports",
                      "direction": "forward", "weight": 0.7})

# cross-batch calls (targets confirmed in neighborMap symbol lists)
CALLS = [
    (f"{CL}/v1alpha1/zz_generated.defaults.go", "SetObjectDefaults_CAInjectorConfiguration",
     "internal/apis/config/shared/v1alpha1/defaults.go", "SetDefaults_LeaderElectionConfig"),
    (f"{CL}/v1alpha1/zz_generated.defaults.go", "SetObjectDefaults_CAInjectorConfiguration",
     "internal/apis/config/shared/v1alpha1/defaults.go", "SetDefaults_DynamicServingConfig"),
    (f"{CL}/validation/validation.go", "ValidateCAInjectorConfiguration",
     "internal/apis/config/shared/validation/validation.go", "ValidateLeaderElectionConfig"),
    (f"{CL}/v1alpha1/zz_generated.conversion.go", "autoConvert_v1alpha1_CAInjectorConfiguration_To_cainjector_CAInjectorConfiguration",
     "internal/apis/config/shared/v1alpha1/conversion.go", "Convert_v1alpha1_LeaderElectionConfig_To_shared_LeaderElectionConfig"),
    (f"{CL}/v1alpha1/zz_generated.conversion.go", "autoConvert_v1alpha1_CAInjectorConfiguration_To_cainjector_CAInjectorConfiguration",
     "internal/apis/config/shared/v1alpha1/conversion.go", "Convert_v1alpha1_TLSConfig_To_shared_TLSConfig"),
    (f"{CT}/v1alpha1/zz_generated.defaults.go", "SetObjectDefaults_ControllerConfiguration",
     "internal/apis/config/shared/v1alpha1/defaults.go", "SetDefaults_LeaderElectionConfig"),
    (f"{CT}/v1alpha1/zz_generated.defaults.go", "SetObjectDefaults_ControllerConfiguration",
     "internal/apis/config/shared/v1alpha1/defaults.go", "SetDefaults_DynamicServingConfig"),
    (f"{CT}/v1alpha1/defaults.go", "SetDefaults_LeaderElectionConfig",
     "pkg/apis/config/shared/v1alpha1/types_duration.go", "DurationFromTime"),
    (f"{CT}/v1alpha1/defaults.go", "SetDefaults_ACMEDNS01Config",
     "pkg/apis/config/shared/v1alpha1/types_duration.go", "DurationFromTime"),
    (f"{CT}/validation/validation.go", "ValidateControllerConfiguration",
     "internal/apis/config/shared/validation/validation.go", "ValidateTLSConfig"),
    (f"{CT}/validation/validation.go", "ValidateControllerConfiguration",
     "internal/apis/config/shared/validation/validation.go", "ValidateLeaderElectionConfig"),
]
for src_path, src_sym, tgt_path, tgt_sym in CALLS:
    edges.append({"source": f"function:{src_path}:{src_sym}",
                  "target": f"function:{tgt_path}:{tgt_sym}",
                  "type": "calls", "direction": "forward", "weight": 0.8})

expected_imports = sum(len(v) for v in import_data.values())
actual_imports = sum(1 for e in edges if e["type"] == "imports")
assert expected_imports == actual_imports, (expected_imports, actual_imports)

paths = sorted(p for p, *_ in FILES)
n_nodes = len(nodes)
n_edges = len(edges)
parts = 1
if n_nodes > 60 or n_edges > 120:
    parts = math.ceil(max(n_nodes / 60, n_edges / 120))

chunk = math.ceil(len(paths) / parts)
groups = [set(paths[i:i + chunk]) for i in range(0, len(paths), chunk)]

# node -> part by filePath
part_of_node = {}
for n in nodes:
    for idx, g in enumerate(groups):
        if n["filePath"] in g:
            part_of_node[n["id"]] = idx
            break
    else:
        raise SystemExit("unassigned node " + n["id"])

written = []
for k, g in enumerate(groups, start=1):
    pnodes = [n for n in nodes if n["filePath"] in g]
    pids = {n["id"] for n in pnodes}
    pedges = []
    for e in edges:
        if e["source"] not in part_of_node:
            continue
        # edge belongs to part only if its source node is in this part
        if part_of_node[e["source"]] != k - 1:
            continue
        pedges.append(e)
    frag = {"nodes": pnodes, "edges": pedges}
    name = f"batch-{batch_index}.json" if parts == 1 else f"batch-{batch_index}-part-{k}.json"
    fp = os.path.join(OUT, name)
    json.dump(frag, open(fp, "w"), indent=2)
    written.append((name, len(pnodes), len(pedges)))

print("nodes", n_nodes, "edges", n_edges, "parts", parts)
for w in written:
    print(w)
