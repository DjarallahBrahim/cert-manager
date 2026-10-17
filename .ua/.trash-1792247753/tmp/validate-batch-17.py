#!/usr/bin/env python3
import json, glob, os

ROOT = "/Users/samtyga/Desktop/work/cert-manager"
UA = os.path.join(ROOT, ".ua")
with open(os.path.join(UA, "tmp/prompts/batch-17.json")) as f:
    prompt = json.load(f)

all_ids = set()
nodes_all = []
edges_all = []
for path in sorted(glob.glob(os.path.join(UA, "intermediate/batch-17-part-*.json"))):
    with open(path) as f:
        g = json.load(f)
    assert isinstance(g["nodes"], list) and isinstance(g["edges"], list), path
    for n in g["nodes"]:
        for req in ("id","type","name","summary","tags","complexity"):
            assert req in n and n[req], (path, n.get("id"), req)
        assert n["type"] in {"file","function","class","config","document","service","table","endpoint","pipeline","schema","resource"}
        assert n["complexity"] in {"simple","moderate","complex"}
        assert 3 <= len(n["tags"]) <= 5, n["id"]
        if n["type"] in ("function","class"):
            assert n.get("lineRange") and len(n["lineRange"]) == 2, n["id"]
        if n["type"] in ("file",):
            assert n.get("filePath"), n["id"]
        assert n["id"] not in all_ids, n["id"]
        all_ids.add(n["id"])
        nodes_all.append(n)
    for e in g["edges"]:
        for req in ("source","target","type","direction","weight"):
            assert req in e, (path, e)
        assert e["direction"] == "forward"
        assert e["type"] in {"contains","imports","calls","inherits","implements","exports","depends_on","tested_by","configures","documents","deploys","migrates","triggers","defines_schema","serves","provisions","routes","related"}
        edges_all.append((os.path.basename(path), e))

known_file_paths = set(prompt["batchImportData"].keys())
for v in prompt["batchImportData"].values():
    known_file_paths.update(v)
neigh_syms = {}
for k, arr in prompt.get("neighborMap", {}).items():
    for nb in arr:
        known_file_paths.add(nb["path"])
        neigh_syms.setdefault(nb["path"], set()).update(nb["symbols"])

problems = []
for part, e in edges_all:
    if e["source"] not in all_ids:
        problems.append((part, "source missing", e["source"]))
    t = e["target"]
    if t in all_ids:
        continue
    if t.startswith("file:") and t[5:] in known_file_paths:
        continue
    if t.startswith(("function:", "class:")):
        _, p, sym = t.split(":", 2)
        if sym in neigh_syms.get(p, set()):
            continue
    problems.append((part, "target unresolved", t))

weights = {"contains":1.0,"imports":0.7,"calls":0.8,"inherits":0.9,"implements":0.9,"exports":0.8,
           "depends_on":0.6,"tested_by":0.5,"configures":0.6,"documents":0.5,"deploys":0.7,
           "migrates":0.7,"triggers":0.6,"defines_schema":0.8,"serves":0.7,"provisions":0.7,
           "routes":0.6,"related":0.5}
for part, e in edges_all:
    assert e["weight"] == weights[e["type"]], (part, e)

print("nodes", len(nodes_all), "edges", len(edges_all))
from collections import Counter
print(Counter(n["type"] for n in nodes_all))
print(Counter(e["type"] for _, e in edges_all))
print("problems", len(problems))
for p in problems[:20]:
    print(p)
