#!/usr/bin/env node
'use strict';
const fs = require('fs');

const draftPath = process.argv[2];
const inputPath = process.argv[3];
const outPath = process.argv[4];

const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const meta = {
  'layer:api': {
    name: 'Kubernetes API & Generated Clients',
    description: 'cert-manager CRD type definitions for cert-manager.io and acme.cert-manager.io, internal API versions with conversion/defaulting/validation, and the generated clientset, informers, and listers used to talk to the Kubernetes API.',
  },
  'layer:controllers': {
    name: 'Controller Reconciliation',
    description: 'Reconciliation loops for Certificates, CertificateRequests, Orders, Challenges, and CSRs, together with the shared controller framework, certificate policy checks, and filtered informer infrastructure.',
  },
  'layer:issuers': {
    name: 'Certificate Issuers & ACME',
    description: 'Issuer implementations (ACME, CA, Vault, Venafi, SelfSigned), the ACME client/account/webhook machinery, the Vault client, and the vendored ACME protocol library.',
  },
  'layer:webhook': {
    name: 'Admission Webhook & CA Injector',
    description: 'Admission webhook chain, validators and mutators, the TLS webhook server, and the cainjector reconciler that injects CA bundles into webhook and CRD configurations.',
  },
  'layer:commands': {
    name: 'Command-Line Binaries',
    description: 'Entry points and app wiring for the controller, webhook, cainjector, acmesolver, and startupapicheck binaries, including their per-binary Go module manifests.',
  },
  'layer:runtime': {
    name: 'Shared Runtime Libraries',
    description: 'Cross-cutting runtime support: X.509/PKI generation and parsing, metrics, health checks, logging, server listeners and TLS sources, predicate helpers, feature gates, and profiling utilities.',
  },
  'layer:testing': {
    name: 'Test Suites & Fixtures',
    description: 'End-to-end, integration, and unit test harnesses plus their fixtures, along with fake issuers, fake Vault, and controller test recorders used to exercise cert-manager behavior.',
  },
  'layer:deployment': {
    name: 'Deployment & Packaging',
    description: 'The cert-manager Helm chart and templates, generated CRD manifests, static install manifests, container definitions, and Google Cloud Build release configuration.',
  },
  'layer:build': {
    name: 'Build, CI & Repository Tooling',
    description: 'Make module system, GitHub Actions workflows and templates, hack scripts and code generators, tooling setup scripts, and root repository/build configuration such as go.mod and golangci settings.',
  },
  'layer:documentation': {
    name: 'Documentation & Design Records',
    description: 'Architecture design documents, the documentation index, project governance, security, support, and contribution guides, and logo/branding notes.',
  },
};

const out = draft.map(l => ({
  id: l.id,
  name: meta[l.id].name,
  description: meta[l.id].description,
  nodeIds: l.nodeIds,
}));

// validation
const allInputIds = new Set(input.fileNodes.map(n => n.id));
const seen = new Set();
let total = 0;
for (const l of out) {
  if (!/^layer:[a-z0-9-]+$/.test(l.id)) throw new Error('bad id ' + l.id);
  if (!l.nodeIds.length) throw new Error('empty layer ' + l.id);
  for (const id of l.nodeIds) {
    if (!allInputIds.has(id)) throw new Error('unknown node ' + id);
    if (seen.has(id)) throw new Error('duplicate node ' + id);
    seen.add(id);
  }
  total += l.nodeIds.length;
}
if (total !== input.fileNodes.length) throw new Error('count mismatch ' + total);
if (out.length < 3 || out.length > 10) throw new Error('layer count ' + out.length);

fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ layers: out.length, total, counts: out.map(l => [l.name, l.nodeIds.length]) }, null, 1));
