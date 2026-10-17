#!/usr/bin/env node
/**
 * UA tour topology analyzer.
 * Usage: node ua-tour-analyze.js <input.json> <output.json>
 */
'use strict';

const fs = require('fs');

function fatal(msg) {
  console.error(msg);
  process.exit(1);
}

const inPath = process.argv[2];
const outPath = process.argv[3];
if (!inPath || !outPath) fatal('usage: node ua-tour-analyze.js <input.json> <output.json>');

let data;
try {
  data = JSON.parse(fs.readFileSync(inPath, 'utf8'));
} catch (e) {
  fatal('failed to read input: ' + e.message);
}

const nodes = Array.isArray(data.nodes) ? data.nodes : [];
const edges = Array.isArray(data.edges) ? data.edges : [];
const layers = Array.isArray(data.layers) ? data.layers : [];

const byId = new Map();
for (const n of nodes) {
  if (!n || typeof n.id !== 'string') continue;
  byId.set(n.id, n);
}

// Build adjacency, deduplicating targets per source.
const fanIn = new Map();
const fanOut = new Map();
const outAdj = new Map();
for (const n of nodes) {
  fanIn.set(n.id, 0);
  fanOut.set(n.id, 0);
}
const seenPair = new Set();
for (const e of edges) {
  if (!e || !byId.has(e.source) || !byId.has(e.target)) continue;
  const key = e.source + '\u0000' + e.target + '\u0000' + (e.type || '');
  if (seenPair.has(key)) continue;
  seenPair.add(key);
  fanIn.set(e.target, (fanIn.get(e.target) || 0) + 1);
  fanOut.set(e.source, (fanOut.get(e.source) || 0) + 1);
  if (!outAdj.has(e.source)) outAdj.set(e.source, []);
  outAdj.get(e.source).push({ target: e.target, type: e.type || '' });
}

const nameOf = (id) => (byId.get(id) && byId.get(id).name) || id;
const summaryOf = (id) => (byId.get(id) && byId.get(id).summary) || '';

// A. Fan-in ranking
const fanInRanking = [...fanIn.entries()]
  .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
  .slice(0, 20)
  .map(([id, v]) => ({ id, fanIn: v, name: nameOf(id), type: byId.get(id).type, summary: summaryOf(id) }));

// B. Fan-out ranking
const fanOutRanking = [...fanOut.entries()]
  .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
  .slice(0, 20)
  .map(([id, v]) => ({ id, fanOut: v, name: nameOf(id), type: byId.get(id).type, summary: summaryOf(id) }));

// Helpers for percentile thresholds.
const fanOutValues = [...fanOut.values()].sort((a, b) => a - b);
const fanInValues = [...fanIn.values()].sort((a, b) => a - b);
function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[idx];
}
const fanOutHigh = percentile(fanOutValues, 0.9);
const fanInLow = percentile(fanInValues, 0.25);

// C. Entry point candidates
const CODE_ENTRY_NAMES = new Set([
  'index.ts', 'index.js', 'main.ts', 'main.js', 'app.ts', 'app.js', 'server.ts', 'server.js',
  'mod.rs', 'main.go', 'main.py', 'main.rs', 'manage.py', 'app.py', 'wsgi.py', 'asgi.py',
  'run.py', '__main__.py', 'Application.java', 'Main.java', 'Program.cs', 'config.ru',
  'index.php', 'App.swift', 'Application.kt', 'main.cpp', 'main.c',
]);
const DOC_EXTS = /\.(md|mdx|markdown|rst|txt)$/i;

const entryPointCandidates = [];
for (const n of nodes) {
  const fp = n.filePath || '';
  const depth = fp.split('/').length - 1;
  let score = 0;
  const isDoc = n.type === 'document' || DOC_EXTS.test(fp);
  if (isDoc) {
    if (/(^|\/)README(\.md|\.markdown|\.mdx)?$/i.test(fp) && depth === 0) score += 5;
    else if (depth === 0) score += 2;
  } else {
    if (CODE_ENTRY_NAMES.has(n.name)) score += 3;
    // Project convention: deployable binaries live at cmd/<binary>/main.go.
    if (/^cmd\/[^/]+\/main\.go$/.test(fp)) score += 2;
    // The controller is cert-manager's primary reconciler binary.
    if (fp === 'cmd/controller/main.go') score += 1;
    if (depth <= 1) score += 1;
    if ((fanOut.get(n.id) || 0) >= fanOutHigh && fanOutHigh > 0) score += 1;
    if ((fanIn.get(n.id) || 0) <= fanInLow) score += 1;
  }
  if (score > 0) {
    entryPointCandidates.push({ id: n.id, score, name: n.name, type: n.type, filePath: fp, summary: n.summary || '' });
  }
}
entryPointCandidates.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
const topEntryPoints = entryPointCandidates.slice(0, 5);

// D. BFS from top code entry point over imports/calls
const BFS_EDGE_TYPES = new Set(['imports', 'calls']);
const codeEntry = entryPointCandidates.find((c) => {
  if (c.type === 'document') return false;
  if (DOC_EXTS.test(c.filePath || '')) return false;
  return true;
});

let bfsTraversal = { startNode: null, order: [], depthMap: {}, byDepth: {} };
if (codeEntry) {
  const start = codeEntry.id;
  const depthMap = { [start]: 0 };
  const order = [start];
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    const neigh = outAdj.get(cur) || [];
    for (const { target, type } of neigh) {
      if (!BFS_EDGE_TYPES.has(type)) continue;
      if (depthMap[target] !== undefined) continue;
      depthMap[target] = depthMap[cur] + 1;
      order.push(target);
      queue.push(target);
    }
  }
  const byDepth = {};
  for (const id of order) {
    const d = String(depthMap[id]);
    if (!byDepth[d]) byDepth[d] = [];
    byDepth[d].push(id);
  }
  bfsTraversal = { startNode: start, order, depthMap, byDepth };
}

// E. Non-code inventory
const nonCodeFiles = { documentation: [], infrastructure: [], data: [], config: [] };
for (const n of nodes) {
  const entry = { id: n.id, name: n.name, type: n.type, filePath: n.filePath || '', summary: n.summary || '' };
  if (n.type === 'document') nonCodeFiles.documentation.push(entry);
  else if (n.type === 'service' || n.type === 'pipeline' || n.type === 'resource') nonCodeFiles.infrastructure.push(entry);
  else if (n.type === 'table' || n.type === 'schema' || n.type === 'endpoint') nonCodeFiles.data.push(entry);
  else if (n.type === 'config') nonCodeFiles.config.push(entry);
}

// F. Tightly coupled clusters (bidirectional pairs, expanded)
const edgeSet = new Set();
const undirectedWeight = new Map();
for (const e of edges) {
  if (!byId.has(e.source) || !byId.has(e.target)) continue;
  if (e.source === e.target) continue;
  edgeSet.add(e.source + '\u0000' + e.target);
  const k = [e.source, e.target].sort().join('\u0000');
  undirectedWeight.set(k, (undirectedWeight.get(k) || 0) + 1);
}
const pairWeight = (a, b) => undirectedWeight.get([a, b].sort().join('\u0000')) || 0;

const bidir = [];
const seenBidir = new Set();
for (const e of edges) {
  if (!byId.has(e.source) || !byId.has(e.target)) continue;
  if (e.source === e.target) continue;
  const key = [e.source, e.target].sort().join('\u0000');
  if (seenBidir.has(key)) continue;
  if (edgeSet.has(e.source + '\u0000' + e.target) && edgeSet.has(e.target + '\u0000' + e.source)) {
    seenBidir.add(key);
    bidir.push({ a: e.source, b: e.target, weight: pairWeight(e.source, e.target) });
  }
}
bidir.sort((x, y) => y.weight - x.weight || x.a.localeCompare(y.a));

const clusters = [];
const usedSeed = new Set();
for (const seed of bidir) {
  if (clusters.length >= 10) break;
  const seedKey = seed.a + '\u0000' + seed.b;
  if (usedSeed.has(seedKey)) continue;
  const members = new Set([seed.a, seed.b]);
  usedSeed.add(seedKey);
  // Expand: add nodes connecting to 2+ existing members (up to 5 members).
  let changed = true;
  while (changed && members.size < 5) {
    changed = false;
    const candidates = new Map();
    for (const m of members) {
      for (const { target } of outAdj.get(m) || []) {
        if (members.has(target)) continue;
        candidates.set(target, (candidates.get(target) || 0) + 1);
      }
      // also inbound
      for (const e of edges) {
        if (e.target === m && byId.has(e.source) && !members.has(e.source)) {
          candidates.set(e.source, (candidates.get(e.source) || 0) + 1);
        }
      }
    }
    const best = [...candidates.entries()]
      .filter(([, c]) => c >= 2)
      .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))[0];
    if (best) {
      members.add(best[0]);
      changed = true;
    }
  }
  let edgeCount = 0;
  const arr = [...members];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) edgeCount += pairWeight(arr[i], arr[j]);
  }
  clusters.push({ nodes: arr, edgeCount });
}
clusters.sort((a, b) => b.edgeCount - a.edgeCount || b.nodes.length - a.nodes.length);

// H. Node summary index
const nodeSummaryIndex = {};
for (const n of nodes) {
  nodeSummaryIndex[n.id] = { name: n.name, type: n.type, filePath: n.filePath || '', summary: n.summary || '' };
}

const result = {
  scriptCompleted: true,
  entryPointCandidates: topEntryPoints,
  fanInRanking,
  fanOutRanking,
  bfsTraversal,
  nonCodeFiles,
  clusters,
  layers: { count: layers.length, list: layers },
  nodeSummaryIndex,
  totalNodes: nodes.length,
  totalEdges: edges.length,
};

try {
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
} catch (e) {
  fatal('failed to write output: ' + e.message);
}
console.log(`analyzed ${nodes.length} nodes, ${edges.length} edges -> ${outPath}`);
