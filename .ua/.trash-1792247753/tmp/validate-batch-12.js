const fs = require('fs');
const path = require('path');

const dir = '/Users/samtyga/Desktop/work/cert-manager/.ua/intermediate';
const batch = JSON.parse(fs.readFileSync('/Users/samtyga/Desktop/work/cert-manager/.ua/tmp/prompts/batch-12.json', 'utf8'));
const extract = JSON.parse(fs.readFileSync('/Users/samtyga/Desktop/work/cert-manager/.ua/tmp/ua-file-extract-results-12.json', 'utf8'));
const partFiles = fs.readdirSync(dir).filter((f) => /^batch-12-part-\d+\.json$/.test(f)).sort();
const files = batch.files.map((f) => f.path);

const knownFiles = new Set(files);
for (const v of Object.values(batch.batchImportData)) for (const p of v) knownFiles.add(p);
for (const n of Object.values(batch.neighborMap)) for (const x of n) knownFiles.add(x.path);
const knownSymbols = new Set();
for (const [fp, n] of Object.entries(batch.neighborMap)) {
  for (const x of n) {
    for (const s of x.symbols || []) {
      knownSymbols.add('function:' + x.path + ':' + s);
      knownSymbols.add('class:' + x.path + ':' + s);
      knownSymbols.add(x.path + ':' + s);
    }
  }
}

const allNodes = [];
const allEdges = [];
const errors = [];
const partStats = [];

for (const pf of partFiles) {
  const raw = fs.readFileSync(path.join(dir, pf), 'utf8');
  let data;
  try { data = JSON.parse(raw); } catch (e) { errors.push(pf + ': invalid JSON ' + e.message); continue; }
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) { errors.push(pf + ': missing nodes/edges arrays'); continue; }
  const pIds = new Set(data.nodes.map((n) => n.id));
  partStats.push({ file: pf, nodes: data.nodes.length, edges: data.edges.length });
  if (data.nodes.length > 60) errors.push(pf + ': >60 nodes');
  if (data.edges.length > 120) errors.push(pf + ': >120 edges');
  for (const n of data.nodes) {
    allNodes.push(n);
    for (const k of ['id', 'type', 'name', 'summary', 'tags', 'complexity']) {
      if (n[k] === undefined || n[k] === null || (Array.isArray(n[k]) && !n[k].length) || n[k] === '') errors.push(pf + ': node missing ' + k + ' ' + n.id);
    }
    if (!['file', 'function', 'class', 'config', 'document', 'service', 'table', 'endpoint', 'pipeline', 'schema', 'resource'].includes(n.type)) errors.push(pf + ': bad node type ' + n.id);
    if (['file', 'config', 'document', 'service', 'pipeline', 'schema', 'resource'].includes(n.type) && !n.filePath) errors.push(pf + ': missing filePath ' + n.id);
    if (['function', 'class'].includes(n.type) && (!Array.isArray(n.lineRange) || n.lineRange.length !== 2)) errors.push(pf + ': missing lineRange ' + n.id);
    if (!Array.isArray(n.tags) || n.tags.length < 3 || n.tags.length > 5) errors.push(pf + ': tag count ' + n.id + ' ' + JSON.stringify(n.tags));
    if (n.tags && n.tags.some((t) => t !== t.toLowerCase())) errors.push(pf + ': non-lowercase tag ' + n.id);
    if (n.filePath && !knownFiles.has(n.filePath)) errors.push(pf + ': unknown filePath ' + n.filePath);
  }
  for (const e of data.edges) {
    allEdges.push(e);
    if (!['contains', 'imports', 'calls', 'exports', 'depends_on', 'tested_by'].includes(e.type)) errors.push(pf + ': bad edge type ' + e.type);
    if (e.direction !== 'forward') errors.push(pf + ': bad direction');
    const w = { contains: 1.0, imports: 0.7, calls: 0.8, exports: 0.8, depends_on: 0.6, tested_by: 0.5 }[e.type];
    if (e.weight !== w) errors.push(pf + ': bad weight ' + e.type + ' ' + e.weight);
    if (e.source === e.target) errors.push(pf + ': self edge');
    if (!pIds.has(e.source)) errors.push(pf + ': edge source not in part ' + e.source);
    if (!pIds.has(e.target)) {
      if (e.target.startsWith('file:') && knownFiles.has(e.target.slice(5))) continue;
      if ((e.target.startsWith('function:') || e.target.startsWith('class:')) && knownSymbols.has(e.target)) continue;
      // allow target nodes in other parts of this same batch
      if (allNodes.some((n) => n.id === e.target)) continue;
      errors.push(pf + ': unresolved edge target ' + e.target);
    }
  }
}

const ids = allNodes.map((n) => n.id);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dup.length) errors.push('duplicate node ids: ' + [...new Set(dup)].join(','));
const nodeIdSet = new Set(ids);

// Every batch file must have exactly one node
for (const f of files) {
  const count = allNodes.filter((n) => n.filePath === f && ['file'].includes(n.type)).length;
  if (count !== 1) errors.push('file node count ' + f + '=' + count);
}

// Imports must equal batchImportData exactly, per file
const importTotal = Object.values(batch.batchImportData).reduce((a, b) => a + b.length, 0);
const importEdges = allEdges.filter((e) => e.type === 'imports');
if (importEdges.length !== importTotal) errors.push('import edge total ' + importEdges.length + ' != ' + importTotal);
for (const [fp, targets] of Object.entries(batch.batchImportData)) {
  const got = importEdges.filter((e) => e.source === 'file:' + fp).map((e) => e.target).sort();
  const want = targets.map((t) => 'file:' + t).sort();
  if (JSON.stringify(got) !== JSON.stringify(want)) errors.push('import mismatch for ' + fp);
}

// Node lineRanges/existence must match extraction
const extraction = new Map(extract.results.map((r) => [r.path, r]));
for (const n of allNodes) {
  if (!['function', 'class'].includes(n.type)) continue;
  const r = extraction.get(n.filePath);
  if (!r) { errors.push('no extraction for ' + n.filePath); continue; }
  const list = n.type === 'function' ? r.functions : r.classes;
  const hit = (list || []).find((x) => x.name === n.name && x.startLine === n.lineRange[0] && x.endLine === n.lineRange[1]);
  if (!hit) errors.push('symbol not in extraction: ' + n.id + ' ' + JSON.stringify(n.lineRange));
}

// contains edges for every function/class node
for (const n of allNodes) {
  if (!['function', 'class'].includes(n.type)) continue;
  if (!allEdges.some((e) => e.type === 'contains' && e.target === n.id)) errors.push('no contains edge for ' + n.id);
}

console.log(JSON.stringify({
  parts: partStats,
  totalNodes: allNodes.length,
  totalEdges: allEdges.length,
  nodeTypes: allNodes.reduce((a, n) => (a[n.type] = (a[n.type] || 0) + 1, a), {}),
  edgeTypes: allEdges.reduce((a, e) => (a[e.type] = (a[e.type] || 0) + 1, a), {}),
  filesCovered: files.length,
  errors,
}, null, 2));
if (errors.length) process.exit(1);
