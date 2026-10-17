import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync('.ua/tmp/prompts/batch-4.json','utf8'));
const files = new Set(d.files.map(f=>f.path));
const allowedFiles = new Set(files);
for (const arr of Object.values(d.batchImportData)) arr.forEach(p=>allowedFiles.add(p));
for (const p of Object.keys(d.neighborMap)) allowedFiles.add(p);
for (const arr of Object.values(d.neighborMap)) arr.forEach(n=>allowedFiles.add(n.path));
const allowedSymbols = new Set();
for (const [p, arr] of Object.entries(d.neighborMap)) for (const n of arr) for (const s of n.symbols) { allowedSymbols.add(`function:${n.path}:${s}`); allowedSymbols.add(`class:${n.path}:${s}`); }

let allNodes=[], allEdges=[];
for (let i=1;i<=10;i++){
  const f=`.ua/intermediate/batch-4-part-${i}.json`;
  const g=JSON.parse(fs.readFileSync(f,'utf8'));
  allNodes.push(...g.nodes); allEdges.push(...g.edges);
}
const ids = new Set(); const errs=[];
for (const n of allNodes){
  if (ids.has(n.id)) errs.push('dup id '+n.id); ids.add(n.id);
  const m = n.id.match(/^(file|function|class|config|document|service|table|endpoint|pipeline|schema|resource):(.+)$/);
  if(!m) errs.push('bad id '+n.id);
  for (const k of ['type','name','summary','tags','complexity']) if(!n[k]) errs.push('missing '+k+' in '+n.id);
  if (!Array.isArray(n.tags)||n.tags.length<3||n.tags.length>5) errs.push('bad tags '+n.id);
  if (!['simple','moderate','complex'].includes(n.complexity)) errs.push('bad complexity '+n.id);
  if (['file','config','document','service','pipeline','schema','resource'].includes(n.type) && !n.filePath) errs.push('missing filePath '+n.id);
  if (['function','class'].includes(n.type) && (!n.lineRange||n.lineRange.length!==2)) errs.push('missing lineRange '+n.id);
  if (['file','function','class'].includes(n.type)) {
    const p = n.filePath;
    if (!files.has(p)) errs.push('node for non-batch file '+n.id);
  }
}
const importCount = {};
for (const e of allEdges){
  if(!['contains','imports','calls','inherits','implements','exports','depends_on','tested_by','configures','documents','deploys','migrates','triggers','defines_schema','serves','provisions','routes','related'].includes(e.type)) errs.push('bad edge type '+e.type);
  if(e.direction!=='forward') errs.push('bad direction '+e.source);
  if(e.source===e.target) errs.push('self edge '+e.source);
  for (const side of ['source','target']) {
    const v=e[side];
    if (ids.has(v)) continue;
    const m=v.match(/^(file|function|class):(.+)$/);
    if(m){
      const p=m[2].split(':')[0];
      if(m[1]==='file' && (allowedFiles.has(p)||allowedFiles.has(m[2]))) continue;
      if((m[1]==='function'||m[1]==='class') && allowedFiles.has(p) && allowedSymbols.has(v)) continue;
      // symbol within same batch path but function not emitted
      if (m[1]!=='file' && files.has(p)) { errs.push('dangling local symbol edge '+v); continue; }
    }
    errs.push('dangling '+side+' '+v+' (edge '+e.type+' from '+e.source+')');
  }
  if(e.type==='imports') importCount[e.source]=(importCount[e.source]||0)+1;
}
for (const f of files){
  if(!allNodes.find(n=>(n.type==='file'||n.type===f.fileCategory) && n.filePath===f));
}
const nodeFiles = new Set(allNodes.filter(n=>!['function','class'].includes(n.type)).map(n=>n.filePath));
for (const f of files) if(!nodeFiles.has(f)) errs.push('missing file node '+f);
let expected=0;
for (const [f,arr] of Object.entries(d.batchImportData)) { expected+=arr.length; const actual=importCount['file:'+f]||0; if(actual!==arr.length) errs.push(`import mismatch ${f}: ${actual}/${arr.length}`); }
const typeCounts={}; for(const n of allNodes) typeCounts[n.type]=(typeCounts[n.type]||0)+1;
console.log(JSON.stringify({nodes:allNodes.length,edges:allEdges.length,importsExpected:expected,typeCounts,errors:errs},null,2));
