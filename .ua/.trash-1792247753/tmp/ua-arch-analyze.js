#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const inPath = process.argv[2];
const outPath = process.argv[3];
if (!inPath || !outPath) {
  console.error('Usage: node ua-arch-analyze.js <input.json> <output.json>');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(inPath, 'utf8'));
} catch (e) {
  console.error('Failed to read input: ' + e.message);
  process.exit(1);
}

const fileNodes = data.fileNodes || [];
const importEdges = data.importEdges || [];
const allEdges = data.allEdges || [];

const idToNode = new Map();
for (const n of fileNodes) idToNode.set(n.id, n);

function typeOf(id) {
  const n = idToNode.get(id);
  if (n && n.type) return n.type;
  const i = id.indexOf(':');
  return i > 0 ? id.slice(0, i) : 'unknown';
}

function pathOf(id) {
  const n = idToNode.get(id);
  if (n && n.filePath) return n.filePath.replace(/\\/g, '/');
  const i = id.indexOf(':');
  return i > 0 ? id.slice(i + 1) : id;
}

// ---------- A. Directory grouping ----------
const paths = fileNodes.map(n => (n.filePath || '').replace(/\\/g, '/'));
const splitPaths = paths.map(p => p.split('/'));

// longest common directory prefix across all files (segment-wise)
function commonPrefix(segLists) {
  if (!segLists.length) return [];
  let prefix = segLists[0].slice(0, -1); // exclude filename
  for (const segs of segLists.slice(1)) {
    const dirs = segs.slice(0, -1);
    let i = 0;
    while (i < prefix.length && i < dirs.length && prefix[i] === dirs[i]) i++;
    prefix = prefix.slice(0, i);
    if (!prefix.length) break;
  }
  return prefix;
}

const prefixSegs = commonPrefix(splitPaths);
const prefixStr = prefixSegs.length ? prefixSegs.join('/') + '/' : '';

function groupFor(filePath) {
  const p = filePath;
  let rel = p;
  if (prefixSegs.length && p.startsWith(prefixStr)) rel = p.slice(prefixStr.length);
  const segs = rel.split('/');
  if (segs.length > 1) return segs[0];
  return 'root';
}

const directoryGroups = {};
const groupOfId = new Map();
for (const n of fileNodes) {
  const fp = (n.filePath || n.id).replace(/\\/g, '/');
  const g = groupFor(fp);
  (directoryGroups[g] = directoryGroups[g] || []).push(n.id);
  groupOfId.set(n.id, g);
}

// ---------- B. Node type grouping ----------
const nodeTypeGroups = {};
for (const n of fileNodes) {
  (nodeTypeGroups[n.type] = nodeTypeGroups[n.type] || []).push(n.id);
}

// ---------- C. Import adjacency ----------
const fanOut = {};
const fanIn = {};
for (const id of idToNode.keys()) { fanOut[id] = 0; fanIn[id] = 0; }
const outAdj = new Map();
const inAdj = new Map();
for (const e of importEdges) {
  if (!idToNode.has(e.source) || !idToNode.has(e.target)) continue;
  if (e.source === e.target) continue;
  fanOut[e.source] = (fanOut[e.source] || 0) + 1;
  fanIn[e.target] = (fanIn[e.target] || 0) + 1;
  if (!outAdj.has(e.source)) outAdj.set(e.source, new Set());
  outAdj.get(e.source).add(e.target);
  if (!inAdj.has(e.target)) inAdj.set(e.target, new Set());
  inAdj.get(e.target).add(e.source);
}

// group-level adjacency from imports
const interGroupCount = new Map(); // "a\u0000b" -> count
const groupInternal = {};
const groupTotalEdges = {};
for (const g of Object.keys(directoryGroups)) { groupInternal[g] = 0; groupTotalEdges[g] = 0; }

for (const e of importEdges) {
  const gs = groupOfId.get(e.source);
  const gt = groupOfId.get(e.target);
  if (!gs || !gt) continue;
  if (gs === gt) {
    groupInternal[gs] += 1;
  } else {
    const k = gs + '\u0000' + gt;
    interGroupCount.set(k, (interGroupCount.get(k) || 0) + 1);
  }
  groupTotalEdges[gs] += 1;
  groupTotalEdges[gt] += 1;
}

const intraGroupDensity = {};
for (const g of Object.keys(directoryGroups)) {
  const total = groupTotalEdges[g] || 0;
  intraGroupDensity[g] = {
    internalEdges: groupInternal[g],
    totalEdges: total,
    density: total ? Number((groupInternal[g] / total).toFixed(3)) : 0,
  };
}

const interGroupImports = [...interGroupCount.entries()]
  .map(([k, count]) => { const [from, to] = k.split('\u0000'); return { from, to, count }; })
  .sort((a, b) => b.count - a.count);

// ---------- D. Cross-category dependency analysis ----------
const crossMap = new Map();
const nonCodeConnections = [];
for (const e of allEdges) {
  const ft = typeOf(e.source);
  const tt = typeOf(e.target);
  const k = ft + '\u0000' + tt + '\u0000' + (e.type || 'related');
  crossMap.set(k, (crossMap.get(k) || 0) + 1);
  if ((ft !== 'file' || tt !== 'file') && ft !== tt) {
    nonCodeConnections.push({ source: e.source, target: e.target, sourceType: ft, targetType: tt, edgeType: e.type });
  }
}
const crossCategoryEdges = [...crossMap.entries()]
  .map(([k, count]) => { const [fromType, toType, edgeType] = k.split('\u0000'); return { fromType, toType, edgeType, count }; })
  .sort((a, b) => b.count - a.count);

// ---------- G. Directory pattern matching ----------
const dirPatterns = [
  [/^(routes?|api|apis|controllers?|endpoints?|handlers?)$/i, 'api'],
  [/^(services?|core|lib|domain|logic)$/i, 'service'],
  [/^(models?|db|data|persistence|repository|entities)$/i, 'data'],
  [/^(components?|views?|pages?|ui|layouts?|screens?)$/i, 'ui'],
  [/^(middleware|plugins?|interceptors?|guards?)$/i, 'middleware'],
  [/^(utils?|helpers?|common|shared|tools?|hack)$/i, 'utility'],
  [/^(config|constants?|env|settings)$/i, 'config'],
  [/^(__tests__|tests?|specs?)$/i, 'test'],
  [/^(types?|interfaces?|schemas?|contracts|dtos?)$/i, 'types'],
  [/^hooks$/i, 'hooks'],
  [/^(store|state|reducers?|actions?|slices?)$/i, 'state'],
  [/^(assets?|static|public)$/i, 'assets'],
  [/^migrations$/i, 'data'],
  [/^(management|commands?)$/i, 'config'],
  [/^cmd$/i, 'entry'],
  [/^internal$/i, 'service'],
  [/^pkg$/i, 'utility'],
  [/^(dto|request|response)$/i, 'types'],
  [/^entity$/i, 'data'],
  [/^routers?$/i, 'api'],
  [/^composables$/i, 'service'],
  [/^(docs?|documentation|wiki|design)$/i, 'documentation'],
  [/^(deploy|deployment|infra|infrastructure)$/i, 'infrastructure'],
  [/^(k8s|kubernetes|helm|charts?)$/i, 'infrastructure'],
  [/^(terraform|tf)$/i, 'infrastructure'],
  [/^docker$/i, 'infrastructure'],
  [/^(sql|database|schema)$/i, 'data'],
  [/^(test|tests|e2e|integration)$/i, 'test'],
  [/^(bin|build|make)$/i, 'entry'],
];

function patternForGroup(g, files) {
  if (g === 'root') {
    // classify root group by dominant node type
    const counts = {};
    for (const id of files) { const t = typeOf(id); counts[t] = (counts[t] || 0) + 1; }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return 'root/' + (top ? top[0] : 'mixed');
  }
  for (const [re, label] of dirPatterns) if (re.test(g)) return label;
  return 'unknown';
}

const filePatterns = [
  [/(^|\/)[^/]*\.(test|spec)\.[^/]+$/i, 'test'],
  [/(^|\/)test_[^/]*\.py$/i, 'test'],
  [/(^|\/)[^/]*_test\.go$/i, 'test'],
  [/(^|\/)[^/]*(Test|Tests)\.(java|cs|php)$/, 'test'],
  [/(^|\/)[^/]*_spec\.rb$/, 'test'],
  [/(^|\/)[^/]*\.d\.ts$/, 'types'],
  [/(^|\/)(index\.(ts|js)|__init__\.py)$/, 'entry'],
  [/(^|\/)main\.go$/i, 'entry'],
  [/(^|\/)(main|lib)\.rs$/, 'entry'],
  [/(^|\/)(Application\.java|Program\.cs)$/, 'entry'],
  [/(^|\/)config\.ru$/, 'entry'],
  [/(^|\/)(Cargo\.toml|go\.mod|go\.sum|Gemfile|pom\.xml|build\.gradle|composer\.json|package\.json)$/, 'config'],
  [/(^|\/)(Dockerfile|docker-compose[^/]*)$/i, 'infrastructure'],
  [/\.tf(vars)?$/, 'infrastructure'],
  [/(^|\/)\.github\/workflows\//, 'ci-cd'],
  [/(^|\/)(\.gitlab-ci\.yml|Jenkinsfile)$/, 'ci-cd'],
  [/\.sql$/, 'data'],
  [/\.(graphql|gql|proto)$/, 'types'],
  [/\.(md|rst)$/i, 'documentation'],
  [/(^|\/)Makefile$/, 'infrastructure'],
  [/\.ya?ml$/i, 'config'],
  [/\.(sh|bash)$/i, 'script'],
];

function filePatternFor(fp) {
  for (const [re, label] of filePatterns) if (re.test(fp)) return label;
  return 'unknown';
}

const patternMatches = {};
for (const [g, ids] of Object.entries(directoryGroups)) {
  patternMatches[g] = patternForGroup(g, ids);
}

// group -> set of file-level pattern labels present
const groupFilePatterns = {};
for (const n of fileNodes) {
  const g = groupOfId.get(n.id);
  const fp = (n.filePath || '').replace(/\\/g, '/');
  const p = filePatternFor(fp);
  groupFilePatterns[g] = groupFilePatterns[g] || {};
  groupFilePatterns[g][p] = (groupFilePatterns[g][p] || 0) + 1;
}

// ---------- H. Deployment topology ----------
const dep = { hasDockerfile: false, hasCompose: false, hasK8s: false, hasTerraform: false, hasCI: false, infraFiles: [] };
for (const n of fileNodes) {
  const fp = (n.filePath || '').replace(/\\/g, '/');
  const low = fp.toLowerCase();
  if (/(^|\/)Dockerfile/.test(fp)) { dep.hasDockerfile = true; dep.infraFiles.push(n.id); }
  else if (/docker-compose/.test(low)) { dep.hasCompose = true; dep.infraFiles.push(n.id); }
  else if (/(^|\/)(deploy|charts?|helm|k8s|kubernetes)\//.test(fp) || /\.yaml$/.test(fp) && /(chart|deploy|k8s)/.test(low)) { dep.hasK8s = true; dep.infraFiles.push(n.id); }
  else if (/\.tf(vars)?$/.test(fp)) { dep.hasTerraform = true; dep.infraFiles.push(n.id); }
  else if (/(^|\/)\.github\/workflows\//.test(fp) || /(\.gitlab-ci\.yml|Jenkinsfile)$/.test(fp)) { dep.hasCI = true; dep.infraFiles.push(n.id); }
}

// ---------- I. Data pipeline detection ----------
const dataPipeline = { schemaFiles: [], migrationFiles: [], dataModelFiles: [], apiHandlerFiles: [] };
for (const n of fileNodes) {
  const fp = (n.filePath || '').replace(/\\/g, '/');
  if (/\.(sql|graphql|gql|proto|prisma)$/.test(fp)) dataPipeline.schemaFiles.push(n.id);
  if (/(^|\/)migrations?\//.test(fp) && /\.sql$/.test(fp)) dataPipeline.migrationFiles.push(n.id);
  if (/\.d\.ts$/.test(fp)) dataPipeline.dataModelFiles.push(n.id);
  const tags = (n.tags || []).map(t => String(t).toLowerCase());
  if (tags.some(t => t === 'api-handler' || t === 'http-handler' || t === 'webhook')) dataPipeline.apiHandlerFiles.push(n.id);
}

// ---------- J. Documentation coverage ----------
const docTypeSet = new Set(['document']);
const groupsWithDocSet = new Set();
for (const n of fileNodes) {
  const fp = (n.filePath || '').replace(/\\/g, '/');
  if (n.type === 'document' || /\.(md|rst)$/i.test(fp)) groupsWithDocSet.add(groupOfId.get(n.id));
}
const allGroups = Object.keys(directoryGroups);
const undocumentedGroups = allGroups.filter(g => !groupsWithDocSet.has(g));
const docCoverage = {
  groupsWithDocs: groupsWithDocSet.size,
  totalGroups: allGroups.length,
  coverageRatio: allGroups.length ? Number((groupsWithDocSet.size / allGroups.length).toFixed(2)) : 0,
  undocumentedGroups,
};

// ---------- K. Dependency direction ----------
const pairNet = new Map(); // "a|b" sorted -> net a->b
const seenPairs = new Set();
for (const { from, to, count } of interGroupImports) {
  const key = [from, to].sort().join('|');
  if (seenPairs.has(key)) continue;
  const ab = interGroupCount.get(from + '\u0000' + to) || 0;
  const ba = interGroupCount.get(to + '\u0000' + from) || 0;
  seenPairs.add(key);
  if (ab > ba) pairNet.set(key, { dependent: from, dependsOn: to, count: ab, reverse: ba });
  else if (ba > ab) pairNet.set(key, { dependent: to, dependsOn: from, count: ba, reverse: ab });
}
const dependencyDirection = [...pairNet.values()].sort((a, b) => b.count - a.count);

// ---------- file stats ----------
const filesPerGroup = {};
for (const [g, ids] of Object.entries(directoryGroups)) filesPerGroup[g] = ids.length;
const nodeTypeCounts = {};
for (const [t, ids] of Object.entries(nodeTypeGroups)) nodeTypeCounts[t] = ids.length;

function topN(obj, n) {
  return Object.fromEntries(Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n));
}

// group fan-in / fan-out aggregates
const groupFanIn = {};
const groupFanOut = {};
for (const [id, c] of Object.entries(fanIn)) {
  const g = groupOfId.get(id);
  if (g) groupFanIn[g] = (groupFanIn[g] || 0) + c;
}
for (const [id, c] of Object.entries(fanOut)) {
  const g = groupOfId.get(id);
  if (g) groupFanOut[g] = (groupFanOut[g] || 0) + c;
}

const result = {
  scriptCompleted: true,
  commonPrefix: prefixStr,
  directoryGroups,
  nodeTypeGroups,
  crossCategoryEdges,
  interGroupImports,
  intraGroupDensity,
  patternMatches,
  groupFilePatterns,
  deploymentTopology: dep,
  dataPipeline,
  docCoverage,
  dependencyDirection,
  fileStats: {
    totalFileNodes: fileNodes.length,
    filesPerGroup,
    nodeTypeCounts,
  },
  fileFanIn: topN(fanIn, 40),
  fileFanOut: topN(fanOut, 40),
  groupFanIn,
  groupFanOut,
  nonCodeConnectionSample: nonCodeConnections.slice(0, 60),
};

try {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
} catch (e) {
  console.error('Failed to write output: ' + e.message);
  process.exit(1);
}

const sumLayer = Object.values(directoryGroups).reduce((a, b) => a + b.length, 0);
if (sumLayer !== fileNodes.length) {
  console.error('Assignment mismatch: ' + sumLayer + ' vs ' + fileNodes.length);
  process.exit(1);
}
console.log('OK nodes=' + fileNodes.length + ' groups=' + allGroups.length);
process.exit(0);
