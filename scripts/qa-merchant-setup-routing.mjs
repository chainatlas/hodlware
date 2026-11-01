import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import {existsSync} from 'node:fs';
const base=process.env.SETUP_PAGES_ORIGIN||'http://127.0.0.1:8796',checks=[];
const routes=JSON.parse(await readFile('dist/_routes.json','utf8'));
for(const path of ['/google-merchant-feed.xml','/google-merchant-setup-feed.xml']){
 assert.ok(routes.include.includes(path));assert.equal(existsSync('dist'+path),false);
 for(const method of ['GET','HEAD','POST']){const r=await fetch(base+path,{method});assert.equal(r.status,method==='POST'?405:503);assert.ok(r.headers.get('content-type').includes('application/xml'));assert.equal(r.headers.get('cache-control'),'no-store');assert.ok(!(await r.text()).includes('<item>'));checks.push({path,method,status:r.status})}
}
for(const path of ['/','/steel-seed-phrase-recovery','/steel-seed-phrase-recovery-plate','/zubehoer']){const r=await fetch(base+path);assert.equal(r.status,200);checks.push({path,status:r.status})}
const missing=await fetch(base+'/merchant-setup-does-not-exist');assert.equal(missing.status,404);checks.push({path:'/merchant-setup-does-not-exist',status:404});
await writeFile('artifacts/merchant-setup-import/pages-routing.json',JSON.stringify({checks,scope:'Fresh local Pages runtime, disabled feeds; no production requests.'},null,2));console.log('Setup Pages QA:',checks.length,'routing checks passed');
