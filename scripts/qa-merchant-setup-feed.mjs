import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {CATALOG} from '../server/catalog.js';
import {SETUP_EXCLUDED_DESTINATIONS,MERCHANT_SETUP_POLICY} from '../server/merchant-setup-feed.js';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const out='artifacts/merchant-setup-import',base='http://127.0.0.1:8797',checks=[];
const check=(name,pass)=>{assert.ok(pass,name);checks.push(name)};
await mkdir(out,{recursive:true});
const server=spawn(process.execPath,['scripts/preview-merchant-feed.mjs'],{stdio:'pipe',env:{...process.env,MERCHANT_PREVIEW_PORT:'8797',MERCHANT_PREVIEW_MODE:'setup'}});let browser;
try{
 await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no)});
 const response=await fetch(base+MERCHANT_SETUP_POLICY.path),body=await response.text();
 check('setup fixture HTTP 200',response.status===200);check('setup XML UTF-8',response.headers.get('content-type')==='application/xml; charset=utf-8');check('no login cookie',!response.headers.get('set-cookie'));check('no response caching',response.headers.get('cache-control')==='no-store');check('XML noindex header',response.headers.get('x-robots-tag').includes('noindex'));
 browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();
 await page.goto(base+MERCHANT_SETUP_POLICY.path);
 const parsed=await page.evaluate(text=>{const d=new DOMParser().parseFromString(text,'application/xml'),ns='http://base.google.com/ns/1.0';return {errors:d.querySelectorAll('parsererror').length,offers:[...d.querySelectorAll('item')].map(i=>({id:i.getElementsByTagNameNS(ns,'id')[0]?.textContent,price:i.getElementsByTagNameNS(ns,'price')[0]?.textContent,label:i.getElementsByTagNameNS(ns,'shipping_label')[0]?.textContent,availability:i.getElementsByTagNameNS(ns,'availability')[0]?.textContent,exclusions:[...i.getElementsByTagNameNS(ns,'excluded_destination')].map(e=>e.textContent),inclusions:i.getElementsByTagNameNS(ns,'included_destination').length,shippingOverrides:i.getElementsByTagNameNS(ns,'shipping').length,identifiers:i.getElementsByTagNameNS(ns,'identifier_exists')[0]?.textContent,link:i.getElementsByTagNameNS(ns,'link')[0]?.textContent,image:i.getElementsByTagNameNS(ns,'image_link')[0]?.textContent})),language:d.querySelector('language')?.textContent}},body);
 check('independent XML parser valid',parsed.errors===0);check('six offers exactly',parsed.offers.length===6);check('six unique IDs',new Set(parsed.offers.map(i=>i.id)).size===6);check('German content language',parsed.language==='de-DE');
 for(const o of parsed.offers){for(const dest of SETUP_EXCLUDED_DESTINATIONS)check(o.id+' excluded '+dest,o.exclusions.filter(x=>x===dest).length===1);check(o.id+' exactly nine exclusions',o.exclusions.length===9);check(o.id+' no inclusion',o.inclusions===0);check(o.id+' shipping label',o.label===(o.id.startsWith('void-')?'sticker_letter':'plate_parcel'));check(o.id+' central price',o.price===(CATALOG[o.id].price/100).toFixed(2)+' EUR');check(o.id+' real availability value',['in_stock','out_of_stock'].includes(o.availability));check(o.id+' no shipping override',o.shippingOverrides===0);check(o.id+' no invented identifier',o.identifiers==='no');check(o.id+' HTTPS product URL',o.link.startsWith('https://hodlware.de/'));check(o.id+' HTTPS image URL',o.image.startsWith('https://hodlware.de/assets/images/'));}
 check('normal feed stays blocked during setup',(await fetch(base+'/google-merchant-feed.xml')).status===503);
 check('query cannot select live output',(await fetch(base+MERCHANT_SETUP_POLICY.path+'?mode=live')).status===503);
 check('setup POST rejected',(await fetch(base+MERCHANT_SETUP_POLICY.path,{method:'POST'})).status===405);
 const head=await fetch(base+MERCHANT_SETUP_POLICY.path,{method:'HEAD'});check('setup HEAD has no body',head.status===200&&(await head.text())==='');
 await writeFile(out+'/fixture-only-setup.xml',body);
 await writeFile(out+'/import-policy.json',JSON.stringify({...MERCHANT_SETUP_POLICY,scope:'Operator configuration contract, NOT a Merchant API request and NOT proof of saved account settings.',fixturesNotForImport:true},null,2));
 await writeFile(out+'/xml-validation.json',JSON.stringify({checks,count:checks.length,parsed,scope:'LOCAL FIXTURES ONLY. No Google import, live stock query or production change.'},null,2));
 console.log('Setup XML QA:',checks.length,'checks passed. No product import.');
}finally{await browser?.close();server.kill()}
