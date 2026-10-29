import test from 'node:test';
import assert from 'node:assert/strict';
import {sitemapURLs,indexable,fingerprint,changedURLs,KEY} from '../scripts/indexnow-manifest.mjs';
import {waitForDeployment,submitURLs} from '../scripts/indexnow-submit.mjs';
const base='https://hodlware.de';
test('IndexNow accepts only unique public same-host sitemap URLs',()=>{
 const values=['/','/','/steel-seed-phrase-recovery','/steel-seed-phrase-recovery-plate','/checkout-success','/api/checkout-context','/admin','/warenkorb','/preview-dark','/test-page'];
 assert.deepEqual(sitemapURLs(values.map(v=>`<loc>${base+v}</loc>`).join('')+'<loc>https://other.test/</loc>'),[base+'/',base+'/steel-seed-phrase-recovery',base+'/steel-seed-phrase-recovery-plate']);
});
test('IndexNow excludes noindex and conflicting canonicals',()=>{
 assert.equal(indexable('<meta content="noindex,follow" name="robots">',base+'/'),false);
 assert.equal(indexable('<link rel="canonical" href="https://hodlware.de/other">',base+'/'),false);
 assert.equal(indexable('<meta name="robots" content="index,follow">',base+'/'),true);
});
test('IndexNow ignores cache revisions, detects shared asset and image changes',async()=>{
 const files={'index.html':'<script src="assets/app.js?v=aaa"></script>','assets/app.js':'const photo="assets/photo.webp";','assets/photo.webp':'original'};
 const read=async f=>{assert.ok(f in files,f);return Buffer.from(files[f]);};
 const first=await fingerprint('index.html',read);files['index.html']=files['index.html'].replace('aaa','bbb');assert.equal(await fingerprint('index.html',read),first);
 files['assets/photo.webp']='changed';assert.notEqual(await fingerprint('index.html',read),first);
 assert.deepEqual(changedURLs({a:'1',b:'2'},{a:'1',b:'2'}),[]);assert.deepEqual(changedURLs({a:'1',b:'3',c:'4'},{a:'1',b:'2'}),['b','c']);
});
test('IndexNow never accepts an old deployment and skips superseded commits',async()=>{
 const sha='a'.repeat(40);const head=()=>Response.json({object:{sha}});
 const fetcher=async url=>url.includes('api.github.com')?head():Response.json({version:1,commit:'old',pages:{}});
 await assert.rejects(waitForDeployment(sha,{fetcher,pause:async()=>{},attempts:2}),/not verified/);
 assert.equal(await waitForDeployment('b'.repeat(40),{fetcher,attempts:1}),null);
 const valid=async url=>url.includes('api.github.com')?head():Response.json({version:1,commit:sha,pages:{}});
 assert.equal((await waitForDeployment(sha,{fetcher:valid,attempts:1})).commit,sha);
});
test('IndexNow sends one batch, accepts 200/202 and skips unchanged pages',async()=>{
 let calls=0;const fetcher=async(url,options)=>{calls++;assert.equal(url,'https://api.indexnow.org/indexnow');const data=JSON.parse(options.body);assert.equal(data.key,KEY);assert.deepEqual(data.urlList,[base+'/']);return new Response('',{status:202});};
 assert.equal(await submitURLs([],{fetcher}),null);assert.equal(calls,0);assert.equal(await submitURLs([base+'/'],{fetcher}),202);assert.equal(calls,1);
 await assert.rejects(submitURLs([base+'/'],{fetcher:async()=>new Response('',{status:403})}),/HTTP 403/);
});
