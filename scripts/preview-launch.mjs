import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {context} from '../server/checkout.js';
import {merchantFeed} from '../server/merchant-feed.js';
import {onRequestGet} from '../functions/_middleware.js';
import {LAUNCH_START} from '../server/launch.js';

// Local design preview, using the production renderers with fixed time and read-only fixtures.
const showComparison=process.argv.includes('--comparison');
const port=showComparison?8796:8795;
const origin='http://127.0.0.1:'+port;
const root=resolve('dist');
const env={
 SITE_URL:origin, STRIPE_SECRET_KEY:'sk_test_preview_only', STRIPE_WEBHOOK_SECRET:'whsec_preview_only',
 STRIPE_PRICE_ID:'price_preview_seed', STRIPE_PRICE_ID_PLATE4:'price_preview_regular',
 STRIPE_PRICE_ID_PLATE4_LAUNCH:'price_preview_launch', PLATE4_ENABLED:'true',
 PLATE4_LAUNCH_APPROVED:'true', PLATE4_LAUNCH_COMPARISON_APPROVED:showComparison?'true':'false', SEEDPLATE_SALES_PAUSED:'true', SEEDPLATE_STOCK_MODE:'managed',
 ACCESSORIES_ENABLED:'true', ACCESSORIES_PRICES_APPROVED:'true', ACCESSORIES_STOCK_CONFIRMED:'true',
 MERCHANT_FEED_ENABLED:'true', MERCHANT_SHIPPING_REVIEWED:'true',
 ...Object.fromEntries([1,5,10,25].map(n=>['STRIPE_PRICE_ID_VOID_'+n,'price_preview_void_'+n])),
 ORDERS:{prepare(query){return {
  bind(){return this;},
  async first(){return query.includes('legacy_sessions_cleared')?{state:'ready',legacy_sessions_cleared:1}:{remaining:100};},
  async all(){return {results:['seedplate','recoveryplate4','void-stickers'].map(product_id=>({product_id,remaining:100}))};}
 };}}
};
Date.now=()=>LAUNCH_START;
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'};
async function page(path){
 const relative=path==='/'?'index.html':path.slice(1)+(extname(path)?'':'.html');
 const file=resolve(root,relative);
 if(!file.startsWith(root+sep))return new Response(null,{status:404});
 try{return new Response(await readFile(file),{headers:{'Content-Type':types[extname(file)]||'application/octet-stream'}});}
 catch{return new Response(null,{status:404});}
}
createServer(async(req,res)=>{
 try{
  if(req.method!=='GET'){res.writeHead(405).end();return;}
  const url=new URL(req.url,origin),request=new Request(url,{headers:req.headers});
  const result=url.pathname==='/api/checkout-context'?await context({request,env}):
   url.pathname==='/google-merchant-feed.xml'?await merchantFeed({request,env}):
   await onRequestGet({request,env,next:()=>page(url.pathname)});
  res.writeHead(result.status,{...Object.fromEntries(result.headers),'X-Robots-Tag':'noindex, nofollow'});
  res.end(Buffer.from(await result.arrayBuffer()));
 }catch{res.writeHead(500).end();}
}).listen(port,'127.0.0.1',()=>console.log('Launch-Vorschau: '+origin+' (16.11.2026, lokale Testdaten)'));
