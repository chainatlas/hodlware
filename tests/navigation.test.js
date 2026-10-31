import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const root=new URL('../',import.meta.url);
test('all shop and guide pages use the required navigation order exactly once and valid targets',()=>{
 const pages=[...readdirSync(root).filter(p=>p.endsWith('.html')),...readdirSync(new URL('ratgeber/',root)).filter(p=>p.endsWith('.html')).map(p=>'ratgeber/'+p)];
 const required=['Shop','Zubehör','Über uns','Ratgeber','FAQ','Vertrag widerrufen'];
 for(const file of pages){
  const html=readFileSync(new URL(file,root),'utf8'),navigation=html.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/);assert.ok(navigation,file);
  const links=[...navigation[1].matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)];assert.deepEqual(links.map(m=>m[2]),required,file);assert.equal(new Set(links.map(m=>m[2])).size,6,file);
  for(const link of links){const url=new URL(link[1],'https://hodlware.de/');assert.equal(url.origin,'https://hodlware.de',file);if(link[2]==='Zubehör')assert.equal(url.pathname,'/zubehoer');if(link[2]==='Vertrag widerrufen')assert.equal(url.hash,'#vertrag-widerrufen');}
 }
});
