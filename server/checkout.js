import Stripe from 'stripe';
export const APP='hodlware-sandbox-v1', PRICE=7900, SHIPPING=619;
export function json(data,status=200,headers={}) { return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}}); }
export function config(env) {
 if(!/^sk_(test|live)_/.test(env.STRIPE_SECRET_KEY || '') || !env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_PRICE_ID?.startsWith('price_') || !env.ORDERS) throw Error('configuration');
 const url=new URL(env.SITE_URL);
 if(url.pathname!=='/' || url.search || url.hash || url.username || url.password || (url.protocol!=='https:' && !(url.protocol==='http:' && ['localhost','127.0.0.1'].includes(url.hostname)))) throw Error('configuration');
 return {stripe:new Stripe(env.STRIPE_SECRET_KEY,{httpClient:Stripe.createFetchHttpClient(),maxNetworkRetries:2}),origin:url.origin,livemode:env.STRIPE_SECRET_KEY.startsWith('sk_live_')};
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
export function parameters(env,n,hash) { return {mode:'payment',submit_type:'pay',customer_creation:'always',billing_address_collection:'required',shipping_address_collection:{allowed_countries:['DE']},line_items:[{price:env.STRIPE_PRICE_ID,quantity:n}],shipping_options:[{shipping_rate_data:{type:'fixed_amount',fixed_amount:{amount:SHIPPING,currency:'eur'},display_name:'DHL Standardversand Deutschland'}}],allow_promotion_codes:true,invoice_creation:{enabled:true},automatic_tax:{enabled:false},metadata:{app:APP,owner:hash,quantity:String(n)},success_url:`${env.SITE_URL.replace(/\/$/,'')}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${env.SITE_URL.replace(/\/$/,'')}/checkout-cancel.html`}; }
export function verified(s,livemode=false) {
 const n=Number(s.metadata?.quantity);
 if(s.livemode!==livemode || s.metadata?.app!==APP || !Number.isInteger(n) || n<1 || n>99 || s.currency!=='eur' || s.amount_subtotal!==n*PRICE) throw Error('session');
 if(s.status==='complete') {
  const country=(s.collected_information?.shipping_details || s.shipping_details)?.address?.country;
  if(country!=='DE' || s.total_details?.amount_shipping!==SHIPPING || s.total_details?.amount_tax!==0 || !Number.isInteger(s.total_details?.amount_discount) || s.total_details.amount_discount<0 || s.total_details.amount_discount>s.amount_subtotal || s.amount_total!==s.amount_subtotal-s.total_details.amount_discount+SHIPPING) throw Error('session');
 }
 return s.status==='complete' && s.payment_status==='paid' ? 'paid' : s.status==='expired'?'expired':'pending';
}
export async function context({request,env}) {
 try {const {origin}=config(env); if(new URL(request.url).origin!==origin) return json({error:'Nicht verfügbar.'},403);
 const id=owner(request)||crypto.randomUUID(); return json({ready:true},200,{'Set-Cookie':`hwcheckout=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${origin.startsWith('https:')?'; Secure':''}`});
 }catch{return json({error:'Der Checkout ist derzeit nicht verfügbar.'},503);}
}
export async function create({request,env}) {
 let c; try{c=config(env);}catch{return json({error:'Der Checkout ist derzeit nicht verfügbar.'},503);}
 let n,id,key; try{n=quantity(await body(request,c.origin));id=owner(request);key=request.headers.get('x-checkout-request');if(!id || !/^[a-f0-9-]{36}$/.test(key||''))throw Error();}catch{return json({error:'Ungültiger Warenkorb. Bitte erneut öffnen.'},400);}
 try {
 const price=await c.stripe.prices.retrieve(env.STRIPE_PRICE_ID);
 if(price.livemode!==c.livemode || !price.active || price.currency!=='eur' || price.unit_amount!==PRICE || price.recurring || price.type!=='one_time') throw Error('price');
 const hash=await digest(id);const session=await c.stripe.checkout.sessions.create(parameters(env,n,hash),{idempotencyKey:await digest(`${hash}:${key}:${n}`)});
 if(session.livemode!==c.livemode || !session.url || new URL(session.url).origin!=='https://checkout.stripe.com')throw Error('session');
 return json({url:session.url,sessionId:session.id});
 }catch{return json({error:'Checkout konnte nicht gestartet werden. Bitte später erneut versuchen.'},503);}
}
export async function status({request,env}) {
 try {
 const c=config(env),data=await body(request,c.origin),id=owner(request);
 if(!id || Object.keys(data).join()!=='sessionId' || !new RegExp(`^cs_${c.livemode?'live':'test'}_[A-Za-z0-9]{8,240}$`).test(data.sessionId||'')) return json({error:'Keine gültige Bestellung.'},400);
 const s=await c.stripe.checkout.sessions.retrieve(data.sessionId,{expand:['invoice']});
 if(s.metadata?.owner!==await digest(id)) return json({error:'Bestellung nicht verfügbar.'},404);
 const state=verified(s,c.livemode); if(state!=='paid') return json({state});
 const invoice=s.invoice?.hosted_invoice_url; let invoiceUrl=null;
 if(invoice){const u=new URL(invoice);if(u.protocol==='https:' && u.hostname==='invoice.stripe.com' && !u.username && !u.password)invoiceUrl=u.href;}
 return json({state,quantity:Number(s.metadata.quantity),subtotal:s.amount_subtotal,shipping:s.total_details.amount_shipping,discount:s.total_details.amount_discount,total:s.amount_total,invoiceUrl});
 }catch{return json({error:'Zahlungsstatus derzeit nicht verifizierbar.'},503);}
}
export async function record(db,event,s,state) {
 // Atomic D1 batch: unique session/event IDs; paid is terminal, even for out-of-order retries.
 await db.batch([
 db.prepare(`INSERT INTO checkout_orders(session_id,state,updated_at) VALUES(?,?,?) ON CONFLICT(session_id) DO UPDATE SET state=CASE WHEN checkout_orders.state='paid' THEN 'paid' WHEN excluded.state='paid' THEN 'paid' WHEN checkout_orders.state='failed' THEN 'failed' ELSE excluded.state END,updated_at=excluded.updated_at`).bind(s.id,state,new Date().toISOString()),
 db.prepare('INSERT OR IGNORE INTO checkout_events(event_id,session_id) VALUES(?,?)').bind(event.id,s.id)
 ]);
}
export async function webhook({request,env}) {
 let c;try{c=config(env);}catch{return json({error:'Unavailable'},503);}
 let event;try {const raw=await readLimited(request,1048576);event=await c.stripe.webhooks.constructEventAsync(raw,request.headers.get('stripe-signature'),env.STRIPE_WEBHOOK_SECRET,300,Stripe.createSubtleCryptoProvider());}catch{return json({error:'Invalid signature'},400);}
 if(event.livemode!==c.livemode)return json({error:'Mode mismatch'},400);
 if(!['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed'].includes(event.type))return json({received:true});
 if(event.data.object.metadata?.app!==APP)return json({received:true});
 try {const s=await c.stripe.checkout.sessions.retrieve(event.data.object.id);let state=verified(s,c.livemode);if(state!=='paid' && event.type==='checkout.session.async_payment_failed')state='failed';await record(env.ORDERS,event,s,state);return json({received:true});}catch{return json({error:'Retry required'},503);}
}
