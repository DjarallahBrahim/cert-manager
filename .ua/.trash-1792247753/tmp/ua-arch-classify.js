#!/usr/bin/env node
'use strict';
const fs = require('fs');
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3];

const layers = [
  { id: 'layer:api', name: 'Kubernetes API & Generated Clients' },
  { id: 'layer:controllers', name: 'Controller Reconciliation' },
  { id: 'layer:issuers', name: 'Certificate Issuers & ACME' },
  { id: 'layer:webhook', name: 'Admission Webhook & CA Injector' },
  { id: 'layer:commands', name: 'Command-Line Binaries' },
  { id: 'layer:runtime', name: 'Shared Runtime Libraries' },
  { id: 'layer:testing', name: 'Test Suites & Fixtures' },
  { id: 'layer:deployment', name: 'Deployment & Packaging' },
  { id: 'layer:build', name: 'Build, CI & Repository Tooling' },
  { id: 'layer:documentation', name: 'Documentation & Design Records' },
];

const rootDocs = new Set([
  'README.md', 'CONTRIBUTING.md', 'GOVERNANCE.md', 'ROADMAP.md', 'SECURITY.md',
  'SECURITY_CONTACTS.md', 'USERS.md', 'CODE_OF_CONDUCT.md', 'RELEASE.md',
]);

const rootBuild = new Set([
  'Makefile', 'go.mod', 'go.sum', 'klone.yaml', '.golangci.yaml', '.clomonitor.yml',
  '.trivyignore', 'LICENSES', 'OWNERS', 'OWNERS_ALIASES',
]);

function classify(p) {
  const seg = p.split('/');
  const top = seg.length > 1 ? seg[0] : null;

  // documentation
  if (top === 'design' || top === 'docs' || top === 'logo') return 'layer:documentation';
  if (!top && rootDocs.has(p)) return 'layer:documentation';

  // tests
  if (top === 'test') return 'layer:testing';
  if (p.startsWith('pkg/controller/test/')) return 'layer:testing';
  if (p.startsWith('internal/test/')) return 'layer:testing';
  if (p.startsWith('internal/vault/fake/')) return 'layer:testing';
  if (p.startsWith('pkg/issuer/fake/')) return 'layer:testing';
  if (p.startsWith('pkg/scheduler/test/')) return 'layer:testing';

  // deployment
  if (top === 'deploy' || top === 'gcb') return 'layer:deployment';
  if (p.startsWith('hack/containers/')) return 'layer:deployment';

  // build / CI
  if (top === 'make' || top === '.github' || top === 'hack' || top === 'tools') return 'layer:build';
  if (!top && rootBuild.has(p)) return 'layer:build';

  // commands
  if (top === 'cmd') return 'layer:commands';

  // webhook & cainjector
  if (p.startsWith('pkg/webhook/') || p.startsWith('internal/webhook/')) return 'layer:webhook';
  if (p.startsWith('pkg/cainjector/') || p.startsWith('internal/cainjector/')) return 'layer:webhook';
  if (p.startsWith('pkg/controller/cainjector/')) return 'layer:webhook';

  // issuers / acme
  if (p.startsWith('pkg/issuer/') || p.startsWith('pkg/acme/')) return 'layer:issuers';
  if (p.startsWith('internal/vault/')) return 'layer:issuers';
  if (p.startsWith('third_party/forked/acme/')) return 'layer:issuers';

  // API
  if (p.startsWith('pkg/apis/') || p.startsWith('pkg/client/') || p.startsWith('pkg/api/')) return 'layer:api';
  if (p.startsWith('internal/apis/') || p.startsWith('internal/generated/')) return 'layer:api';

  // controllers
  if (p.startsWith('internal/controller/') || p.startsWith('internal/informers/')) return 'layer:controllers';
  if (p.startsWith('pkg/controller/')) return 'layer:controllers';

  // runtime
  if (p.startsWith('pkg/')) return 'layer:runtime';
  if (p.startsWith('internal/')) return 'layer:runtime';

  // third_party misc
  if (top === 'third_party') return 'layer:issuers';

  return 'UNASSIGNED';
}

const assign = new Map(layers.map(l => [l.id, []]));
const unassigned = [];
for (const n of d.fileNodes) {
  const p = n.filePath.replace(/\\/g, '/');
  const l = classify(p);
  if (l === 'UNASSIGNED') unassigned.push(p);
  else assign.get(l).push(n.id);
}

const result = layers.map(l => ({ ...l, nodeIds: assign.get(l.id) }));
const total = result.reduce((a, l) => a + l.nodeIds.length, 0);
for (const l of result) console.error(l.id.padEnd(24), String(l.nodeIds.length).padStart(4));
console.error('total', total, 'nodes', d.fileNodes.length, 'unassigned', unassigned.length);
if (unassigned.length) console.error(unassigned.slice(0, 40).join('\n'));

if (process.argv[4] === '--write') {
  fs.writeFileSync(out, JSON.stringify(result, null, 2));
  console.error('wrote', out);
}
