const fs = require('fs');
const dir = '/Users/samtyga/Desktop/work/cert-manager/.ua/intermediate';
const batches = [24, 25, 27];
let ok = true;
for (const b of batches) {
  const p = `${dir}/batch-${b}.json`;
  const g = JSON.parse(fs.readFileSync(p, 'utf8'));
  const ids = new Set();
  for (const n of g.nodes) {
    if (ids.has(n.id)) { console.log(`DUP NODE ${n.id}`); ok = false; }
    ids.add(n.id);
  }
  for (const e of g.edges) {
    if (e.source === e.target) { console.log(`SELF EDGE ${e.source}`); ok = false; }
    if (!ids.has(e.source)) { console.log(`MISSING SOURCE ${e.source}`); ok = false; }
    if (!ids.has(e.target)) { console.log(`MISSING TARGET ${e.target}`); ok = false; }
    if (!['contains','imports','calls','inherits','implements','exports','depends_on','tested_by','configures','documents','deploys','migrates','triggers','defines_schema','serves','provisions','routes','related'].includes(e.type)) { console.log(`BAD TYPE ${e.type}`); ok = false; }
  }
  const imports = g.edges.filter(e => e.type === 'imports').length;
  console.log(`batch-${b}: nodes=${g.nodes.length} edges=${g.edges.length} imports=${imports}`);
}
console.log(ok ? 'VALIDATION OK' : 'VALIDATION FAILED');
process.exit(ok ? 0 : 1);
