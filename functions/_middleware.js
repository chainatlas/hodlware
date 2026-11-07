import {CATALOG} from '../server/catalog.js';
import {LAUNCH_PRICE,launchPrice,launchComparisonApproved,seedplatePaused} from '../server/launch.js';

const four = '/steel-seed-phrase-recovery-plate';
const eight = '/steel-seed-phrase-recovery';

export async function onRequestGet({request,env,next}) {
 const path = new URL(request.url).pathname;
 const launch = launchPrice(env);
 const paused = seedplatePaused(env);
 const response = await next();
 if(!['/',four,eight].includes(path)||(!launch&&!paused)||response.status!==200||
    !response.headers.get('content-type')?.includes('text/html'))return response;

 let html=await response.text();
 if(launch&&path===four){
  const price=(LAUNCH_PRICE/100).toFixed(2).replace('.',',')+' €';
  const regular=(CATALOG.recoveryplate4.price/100).toFixed(2).replace('.',',')+' €';
  const comparison=launchComparisonApproved(env);
  const previous=comparison
   ? '<del class="launch-comparison" aria-label="Vorheriger Preis: '+regular+'">'+regular+'</del>' : '';
  html=html.replace(/<div data-detail-price="recoveryplate4"><strong>[^<]*<\/strong><\/div>/,
   '<div data-detail-price="recoveryplate4" class="launch-price">'+
   (comparison?'<span class="launch-badge">Launch-Angebot</span>':'')+
   '<span class="launch-amounts"><strong>'+price+'</strong>'+previous+'</span>'+
   (comparison?'<small>Einführungspreis bis 30.11.2026</small>':'')+'</div>');
 }
 if(paused&&path===eight){
  html=html.replace(/(<button class="add" data-id="seedplate" disabled>)[^<]*/, '$1Ausverkauft');
 }
 html=html.replace(/(<script[^>]*data-seo-products[^>]*>)([\s\S]*?)(<\/script>)/,(_,open,json,close)=>{
  const schema=JSON.parse(json);
  const update=value=>{
   if(!value||typeof value!=='object')return;
   if(value['@type']==='Product'&&value.offers){
    if(launch&&value.sku==='recoveryplate4')value.offers.price=(LAUNCH_PRICE/100).toFixed(2);
    if(paused&&value.sku==='seedplate')value.offers.availability='https://schema.org/OutOfStock';
   }
   Object.values(value).forEach(update);
  };
  update(schema);
  return open+JSON.stringify(schema).replaceAll('<','\\u003c')+close;
 });
 const headers=new Headers(response.headers);
 for(const name of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(name);
 headers.set('Cache-Control','no-store');
 return new Response(html,{headers});
}
