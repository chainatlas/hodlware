import {SEED_STOCK_VERSION,seedMode,seedplateAvailability,reservationItems,legacySeedReview} from './seedplate-inventory.js';
import {CATALOG,cartItems,sessionItems,subtotal,shipping,physicalItems} from './catalog.js';
import {availability,reserve,bindReservation,inventoryStatement} from './inventory.js';
import {CONTRACT_VERSION,ACCESSORY_CONTRACT_VERSION} from './contract-text.js';
import {queueOrder} from './order-mail.js';
import {mailConfigured,deliver} from './mail.js';
import Stripe from 'stripe';
import {reserveAccessories,bindAccessories,accessoryStatements,accessoryAvailability} from './accessory-inventory.js';
export const APP='hodlware-sandbox-v1', PRICE=7900, SHIPPING=619;
export function json(data,status=200,headers={}) { return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}}); }
// Internal validation only; configuration details are never returned publicly.
function configurationIssue(env) {
 if(!env.STRIPE_SECRET_KEY)return 'MISSING_STRIPE_SECRET_KEY';
 if(typeof env.STRIPE_SECRET_KEY!=='string' || !/^(sk|rk)_(test|live)_/.test(env.STRIPE_SECRET_KEY))return 'INVALID_STRIPE_SECRET_KEY_FORMAT';
 if(!env.STRIPE_WEBHOOK_SECRET)return 'MISSING_WEBHOOK_SECRET';
 if(!env.STRIPE_PRICE_ID)return 'MISSING_PRICE_ID';
 if(typeof env.STRIPE_PRICE_ID!=='string' || !env.STRIPE_PRICE_ID.startsWith('price_'))return 'INVALID_PRICE_ID_FORMAT';
 if(!env.SITE_URL)return 'MISSING_SITE_URL';
 try {
  const url=new URL(env.SITE_URL);
  if(url.pathname!=='/' || url.search || url.hash || url.username || url.password || (url.protocol!=='https:' && !(url.protocol==='http:' && ['localhost','127.0.0.1'].includes(url.hostname))))return 'INVALID_SITE_URL';
 }catch{return 'INVALID_SITE_URL';}
 if(!env.ORDERS)return 'MISSING_ORDERS_BINDING';
 return null;
}
export function config(env) {
 if(configurationIssue(env))throw Error('configuration');
 const url=new URL(env.SITE_URL);
 return {stripe:new Stripe(env.STRIPE_SECRET_KEY,{httpClient:Stripe.createFetchHttpClient(),maxNetworkRetries:2}),origin:url.origin,livemode:/^(sk|rk)_live_/.test(env.STRIPE_SECRET_KEY)};
}
export function owner(req) { return /(?:^|;\s*)hwcheckout=([a-f0-9-]{36})(?:;|$)/.exec(req.headers.get('cookie')||'')?.[1]; }
export async function digest(s) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join(''); }
async function readLimited(req,limit) {
 const reader=req.body?.getReader();if(!reader)return '';
 const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw Error('request size');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return new TextDecoder().decode(bytes);
}
export async function body(req,origin) {
 if(req.method!=='POST' || req.headers.get('origin')!==origin || !req.headers.get('content-type')?.startsWith('application/json')) throw Error('request');
 return JSON.parse(await readLimited(req,2048));
}
export function quantity(data) {
 if(!data || Object.keys(data).join()!=='items' || !Array.isArray(data.items) || data.items.length!==1) throw Error('cart');
 const item=data.items[0]; if(!item || Object.keys(item).sort().join()!=='id,quantity' || item.id!=='seedplate' || !Number.isInteger(item.quantity) || item.quantity<1 || item.quantity>99) throw Error('cart');
 return item.quantity;
}
export function parameters(env,n,hash) { const items=Array.isArray(n)?cartItems({items:n}):[{id:'seedplate',quantity:n}]; return {mode:'payment',submit_type:'pay',customer_creation:'always',billing_address_collection:'required',shipping_address_collection:{allowed_countries:['DE']},line_items:items.map(item=>({price:env[CATALOG[item.id].priceEnv],quantity:item.quantity})),shipping_options:[{shipping_rate_data:{type:'fixed_amount',fixed_amount:{amount:shipping(items),currency:'eur'},display_name:shipping(items)===110?'Briefversand Deutschland · Basis-Sendungsverfolgung':'DHL Standardversand Deutschland'}}],allow_promotion_codes:true,invoice_creation:{enabled:true,invoice_data:{footer:'Für diese Lieferung gilt die Steuerbefreiung für Kleinunternehmer gemäß § 19 UStG. Es wird keine Umsatzsteuer berechnet.',custom_fields:[{name:'Rechnungsaussteller',value:'HODLWARE – Steffen Reizner'}]}},automatic_tax:{enabled:false},custom_text:{submit:{message:'Lieferzeit: 2–4 Werktage nach erfolgreicher Zahlung. Gemäß § 19 UStG ohne Ausweis der Umsatzsteuer.'}},metadata:{app:APP,owner:hash,quantity:String(items.reduce((n,item)=>n+item.quantity,0)),...(Array.isArray(n)?{items:JSON.stringify(items)}:{}),contractVersion:physicalItems(items).length?ACCESSORY_CONTRACT_VERSION:CONTRACT_VERSION},success_url:`${env.SITE_URL.replace(/\/$/,'')}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${env.SITE_URL.replace(/\/$/,'')}/checkout-cancel.html`}; }
export function verified(s,livemode=false) {
 const items=sessionItems(s);
 if(s.livemode!==livemode || s.metadata?.app!==APP || s.currency!=='eur' || s.amount_subtotal!==subtotal(items)) throw Error('session');
 if(s.metadata?.items!==undefined){
  const lines=s.line_items?.data;
  if(s.mode!=='payment'||!Array.isArray(lines)||s.line_items.has_more||lines.length!==items.length)throw Error('items');
  const remaining=[...lines];for(const item of items){const index=remaining.findIndex(line=>line.quantity===item.quantity&&line.price?.unit_amount===item.unitPrice&&line.price.currency==='eur'&&line.price.livemode===livemode&&line.amount_subtotal===item.unitPrice*item.quantity);if(index<0)throw Error('items');remaining.splice(index,1);}
 }
 if(s.status==='complete') {
  const country=(s.collected_information?.shipping_details || s.shipping_details)?.address?.country;
  if(country!=='DE' || s.total_details?.amount_shipping!==shipping(items) || s.total_details?.amount_tax!==0 || !Number.isInteger(s.total_details?.amount_discount) || s.total_details.amount_discount<0 || s.total_details.amount_discount>s.amount_subtotal || s.amount_total!==s.amount_subtotal-s.total_details.amount_discount+shipping(items)) throw Error('session');
 }
 return s.status==='complete' && s.payment_status==='paid' ? 'paid' : s.status==='expired'?'expired':'pending';
}
export async function context({request,env}) {
 try {
 const {origin}=config(env); if(new URL(request.url).origin!==origin) return json({error:'Nicht verfügbar.'},403);
 const id=owner(request)||crypto.randomUUID(); const products=env.PLATE4_ENABLED==='true'?{products:{recoveryplate4:{available:(await availability(env)).available}}}:{}; if(env.ACCESSORIES_ENABLED==='true'){products.products||={};for(const [id,p] of Object.entries(CATALOG))if(p.stockId)products.products[id]={available:await accessoryAvailability(env,p.stockId,p.units)};} products.products||={};products.products.seedplate={available:await seedplateAvailability(env)}; return json({ready:true,...products},200,{'Set-Cookie':`hwcheckout=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${origin.startsWith('https:')?'; Secure':''}`});
 }catch{return json({error:'Der Checkout ist derzeit nicht verfügbar.'},503);}
}
export async function create({request,env}) {
 let c; try{c=config(env);}catch{return json({error:'Der Checkout ist derzeit nicht verfügbar.'},503);}
 let items,id,key; try{items=cartItems(await body(request,c.origin));id=owner(request);key=request.headers.get('x-checkout-request');if(!id || !/^[a-f0-9-]{36}$/.test(key||''))throw Error();}catch{return json({error:'Ungültiger Warenkorb. Bitte erneut öffnen.'},400);}
 try {
 const accessories=physicalItems(items);
 const hasSeed=items.some(item=>item.id==='seedplate');const mode=seedMode(env);if(hasSeed&&!['legacy','managed'].includes(mode))throw Error('unavailable');
 const version=hasSeed&&mode==='managed'?SEED_STOCK_VERSION:undefined;const stockItems=reservationItems(items,version);
 if(accessories.length && (env.ACCESSORIES_ENABLED!=='true' || env.ACCESSORIES_PRICES_APPROVED!=='true' || env.ACCESSORIES_STOCK_CONFIRMED!=='true'))throw Error('unavailable');
 const hasNew=items.some(item=>item.id==='recoveryplate4');
 if(hasNew && (env.PLATE4_ENABLED!=='true' || !/^price_/.test(env.STRIPE_PRICE_ID_PLATE4||'') || env.STRIPE_PRICE_ID_PLATE4===env.STRIPE_PRICE_ID))throw Error('unavailable');
 for(const item of items){
  const product=CATALOG[item.id];const price=await c.stripe.prices.retrieve(env[product.priceEnv]);
  if(price.livemode!==c.livemode || !price.active || price.currency!=='eur' || price.unit_amount!==product.price || price.recurring || price.type!=='one_time')throw Error('price');
 }
 const hash=await digest(id),reservation=await digest(`${hash}:${key}:${JSON.stringify(items)}${version?":"+version:""}`);
 const params=parameters(env,items,hash);
 if(stockItems.length || hasNew){const plate=items.find(item=>item.id==='recoveryplate4')?.quantity||0;const held=stockItems.length?await reserveAccessories(env,reservation,stockItems,plate):await reserve(env,reservation,plate);params.metadata.reservation=reservation;params.expires_at=held.created_at+3600;}
 if(version)params.metadata.stockVersion=version;
 const session=await c.stripe.checkout.sessions.create(params,{idempotencyKey:reservation});
 if(session.livemode!==c.livemode || !session.url || new URL(session.url).origin!=='https://checkout.stripe.com')throw Error('session');
 if(stockItems.length)await bindAccessories(env,reservation,session.id);
 if(hasNew)await bindReservation(env,reservation,session.id);
 return json({url:session.url,sessionId:session.id});
 }catch{return json({error:'Checkout konnte nicht gestartet werden. Bitte später erneut versuchen.'},503);}
}
export async function status({request,env}) {
 try {
 const c=config(env),data=await body(request,c.origin),id=owner(request);
 if(!id || Object.keys(data).join()!=='sessionId' || !new RegExp(`^cs_${c.livemode?'live':'test'}_[A-Za-z0-9]{8,240}$`).test(data.sessionId||'')) return json({error:'Keine gültige Bestellung.'},400);
 const s=await c.stripe.checkout.sessions.retrieve(data.sessionId,{expand:['invoice','line_items.data.price']});
 if(s.metadata?.owner!==await digest(id)) return json({error:'Bestellung nicht verfügbar.'},404);
 const state=verified(s,c.livemode); if(state!=='paid') return json({state});
 const invoice=s.invoice?.hosted_invoice_url; let invoiceUrl=null;
 if(invoice){const u=new URL(invoice);if(u.protocol==='https:' && u.hostname==='invoice.stripe.com' && !u.username && !u.password)invoiceUrl=u.href;}
 let confirmationQueued=false;
 if(env.ORDER_EMAILS_ENABLED==='true'){try{confirmationQueued=!!await env.ORDERS.prepare('SELECT session_id FROM order_confirmations WHERE session_id=?').bind(s.id).first();}catch{}}
 return json({state,confirmationQueued,items:sessionItems(s),quantity:sessionItems(s).reduce((n,item)=>n+item.quantity,0),subtotal:s.amount_subtotal,shipping:s.total_details.amount_shipping,discount:s.total_details.amount_discount,total:s.amount_total,invoiceUrl});
 }catch{return json({error:'Zahlungsstatus derzeit nicht verifizierbar.'},503);}
}
export async function record(db,event,s,state) {
 // Atomic D1 batch: unique session/event IDs; paid is terminal, even for out-of-order retries.
 const items=s.metadata?.items!==undefined?sessionItems(s):[];
 const stock=items.some(item=>item.id==='recoveryplate4')?[await inventoryStatement(db,s,state)]:[];
 await db.batch([
 ...await legacyReviewStatements(db,s,state),
 db.prepare(`INSERT INTO checkout_orders(session_id,state,updated_at) VALUES(?,?,?) ON CONFLICT(session_id) DO UPDATE SET state=CASE WHEN checkout_orders.state='paid' THEN 'paid' WHEN excluded.state='paid' THEN 'paid' WHEN checkout_orders.state IN ('failed','expired') THEN checkout_orders.state ELSE excluded.state END,updated_at=excluded.updated_at`).bind(s.id,state,new Date().toISOString()),
 db.prepare('INSERT OR IGNORE INTO checkout_events(event_id,session_id) VALUES(?,?)').bind(event.id,s.id),
 ...items.map(item=>db.prepare('INSERT OR IGNORE INTO checkout_order_items(session_id,product_id,name,unit_price,quantity,currency) VALUES(?,?,?,?,?,?)').bind(s.id,item.id,item.name,item.unitPrice,item.quantity,'eur')),
 ...stock,
 ...await accessoryStatements(db,s,state)
 ]);
}
export async function webhook({request,env}) {
 let c;try{c=config(env);}catch{return json({error:'Unavailable'},503);}
 let event;try {const raw=await readLimited(request,1048576);event=await c.stripe.webhooks.constructEventAsync(raw,request.headers.get('stripe-signature'),env.STRIPE_WEBHOOK_SECRET,300,Stripe.createSubtleCryptoProvider());}catch{return json({error:'Invalid signature'},400);}
 if(event.livemode!==c.livemode)return json({error:'Mode mismatch'},400);
 if(!['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'].includes(event.type))return json({received:true});
 if(event.data.object.metadata?.app!==APP)return json({received:true});
 try {const s=await c.stripe.checkout.sessions.retrieve(event.data.object.id,{expand:['line_items.data.price']});let state=verified(s,c.livemode);if(state!=='paid' && event.type==='checkout.session.async_payment_failed')state='failed';await record(env.ORDERS,event,s,state);
 if(state==='paid' && env.ORDER_EMAILS_ENABLED==='true'){
  if(!mailConfigured(env)||env.MAIL_WORKER_READY!=='true')throw Error('mail configuration');
  const existing=await env.ORDERS.prepare('SELECT order_number FROM order_confirmations WHERE session_id=?').bind(s.id).first();
  if(!existing){
   const intent=await c.stripe.paymentIntents.retrieve(s.payment_intent,{expand:['payment_method']});
   if(intent.livemode!==c.livemode || intent.status!=='succeeded' || intent.amount_received!==s.amount_total || intent.currency!=='eur')throw Error('payment');
   await queueOrder(env,s,intent.payment_method?.type);
  }
  for(const who of ['customer','operator']){try{await deliver(env,'order-'+s.id+'-'+who);}catch{/* Durable queue retries independently. */}}
 }
 return json({received:true});}catch{return json({error:'Retry required'},503);}
}

async function legacyReviewStatements(db,s,state){const row=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='inventory_controls'").first();return row?legacySeedReview(db,s,state):[];}
