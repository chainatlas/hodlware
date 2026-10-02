import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';import Stripe from 'stripe';
import {APP,quantity,parameters,verified,record,body,config,context,webhook,create,status} from '../server/checkout.js';
const env={SITE_URL:'http://127.0.0.1:8788',STRIPE_PRICE_ID:'price_example'};
for(const n of [1,2,99])test(`quantity ${n}, shipping once`,()=>{assert.equal(quantity({items:[{id:'seedplate',quantity:n}]}),n);const p=parameters(env,n,'hash');assert.equal(p.line_items[0].quantity,n);assert.equal(p.shipping_options.length,1);assert.equal(p.shipping_options[0].shipping_rate_data.fixed_amount.amount,619);assert.deepEqual(p.shipping_address_collection.allowed_countries,['DE']);assert.equal(p.allow_promotion_codes,true);assert.equal(p.payment_method_types,undefined);assert.equal(p.invoice_creation.enabled,true);assert.equal(p.automatic_tax.enabled,false);});
for(const data of [null,{}, {items:[]},{items:[{id:'nomad',quantity:1}]},...[0,-1,1.5,100,'2',null].map(quantity=>({items:[{id:'seedplate',quantity}]})),{items:[{id:'seedplate',quantity:1,price:1}]},{items:[{id:'seedplate',quantity:1}],price:1}])test(`reject tampering ${JSON.stringify(data)}`,()=>assert.throws(()=>quantity(data)));
const paid={id:'cs_test_example',livemode:false,metadata:{app:APP,quantity:'2'},currency:'eur',amount_subtotal:15800,amount_total:16419,total_details:{amount_shipping:619,amount_tax:0,amount_discount:0},collected_information:{shipping_details:{address:{country:'DE'}}},status:'complete',payment_status:'paid'};
test('only confirmed payment succeeds',()=>{assert.equal(verified(paid),'paid');assert.equal(verified({...paid,payment_status:'unpaid'}),'pending');assert.throws(()=>verified({...paid,livemode:true}));});
test('verified Stripe discount excludes shipping',()=>assert.equal(verified({...paid,amount_total:14839,total_details:{...paid.total_details,amount_discount:1580}}),'paid'));
test('reject foreign shipping and incorrect totals',()=>{assert.throws(()=>verified({...paid,collected_information:{shipping_details:{address:{country:'AT'}}}}));assert.throws(()=>verified({...paid,amount_total:1}));});
test('Origin and JSON required',async()=>{await assert.rejects(body(new Request(env.SITE_URL,{method:'POST',headers:{origin:'https://evil.example','content-type':'application/json'},body:'{}'}),env.SITE_URL));});
test('missing and incomplete configuration fail closed',async()=>{assert.throws(()=>config({}));assert.throws(()=>config({STRIPE_SECRET_KEY:'sk_live_example'}));assert.equal((await create({env:{},request:new Request(env.SITE_URL)})).status,503);assert.equal((await status({env:{},request:new Request(env.SITE_URL)})).status,503);});
test('official SDK signature validates; modified payload rejected',async()=>{const secret='whsec_unit_test_only';const payload=JSON.stringify({id:'evt_test',livemode:false});const signature=Stripe.webhooks.generateTestHeaderString({payload,secret});assert.equal((await Stripe.webhooks.constructEventAsync(payload,signature,secret,300,Stripe.createSubtleCryptoProvider())).id,'evt_test');await assert.rejects(Stripe.webhooks.constructEventAsync(payload+' ',signature,secret,300,Stripe.createSubtleCryptoProvider()));});
test('webhook rejects forged signature before processing',async()=>{const response=await webhook({env:{...env,STRIPE_SECRET_KEY:'sk_test_unit_test_only',STRIPE_WEBHOOK_SECRET:'whsec_unit_test_only',ORDERS:{}},request:new Request(env.SITE_URL,{method:'POST',body:'{}',headers:{'stripe-signature':'forged'}})});assert.equal(response.status,400);});
test('atomic ledger handles duplicate events, retry and out-of-order payment',async()=>{const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../migrations/0001_checkout.sql',import.meta.url),'utf8'));const db={prepare(sql){return {bind(...args){return ()=>sqlite.prepare(sql).run(...args);}}},async batch(statements){sqlite.exec('BEGIN');try{for(const statement of statements)statement();sqlite.exec('COMMIT');}catch(error){sqlite.exec('ROLLBACK');throw error;}}};await record(db,{id:'evt_1'},paid,'pending');await record(db,{id:'evt_2'},paid,'paid');await record(db,{id:'evt_2'},paid,'paid');await record(db,{id:'evt_1'},paid,'pending');assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM checkout_orders').get().n,1);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM checkout_events').get().n,2);assert.equal(sqlite.prepare('SELECT state FROM checkout_orders').get().state,'paid');sqlite.close();});

async function mockStripe(reply,run){const original=Stripe.createFetchHttpClient;Stripe.createFetchHttpClient=()=>original(async(url,init)=>new Response(JSON.stringify(await reply(url,init)),{status:200,headers:{'content-type':'application/json'}}));try{await run();}finally{Stripe.createFetchHttpClient=original;}}
const configured={...env,STRIPE_SECRET_KEY:'sk_test_unit_test_only',STRIPE_WEBHOOK_SECRET:'whsec_unit_test_only',ORDERS:{}};
const cookie='11111111-1111-4111-8111-111111111111';
function request(path,data){return new Request(env.SITE_URL+path,{method:'POST',headers:{origin:env.SITE_URL,'content-type':'application/json',cookie:`hwcheckout=${cookie}`,'x-checkout-request':'22222222-2222-4222-8222-222222222222'},body:JSON.stringify(data)});}
test('checkout handler sends only server catalog and fixed shipping to SDK (simulated Stripe)',async()=>{let calls=0;await mockStripe(async(url,init)=>{calls++;if(url.includes('/prices/'))return {livemode:false,active:true,currency:'eur',unit_amount:7900,type:'one_time',recurring:null};const params=new URLSearchParams(init.body);assert.equal(params.get('line_items[0][price]'),'price_example');assert.equal(params.get('line_items[0][quantity]'),'2');assert.equal(params.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'),'619');return {id:'cs_test_example',livemode:false,url:'https://checkout.stripe.com/c/pay/cs_test_example'};},async()=>{const r=await create({env:configured,request:request('/api/create-checkout-session',{items:[{id:'seedplate',quantity:2}]})});assert.equal(r.status,200);assert.equal(calls,2);});});
test('price injection rejected before Stripe call',async()=>{await mockStripe(()=>{throw Error('Must not call Stripe');},async()=>{assert.equal((await create({env:configured,request:request('/api/create-checkout-session',{items:[{id:'seedplate',quantity:1,price:1}]})})).status,400);});});
test('paid status returns minimal verified data and rejects another owner (simulated Stripe)',async()=>{const {digest}=await import('../server/checkout.js');const hash=await digest(cookie);await mockStripe(()=>({...paid,metadata:{...paid.metadata,owner:hash},customer_details:{email:'not-returned@example.invalid'},invoice:{hosted_invoice_url:'https://invoice.stripe.com/i/test'}}),async()=>{const response=await status({env:configured,request:request('/api/checkout-status',{sessionId:'cs_test_example123'})});assert.equal(response.status,200);const data=await response.json();assert.equal(data.state,'paid');assert.equal(data.total,16419);assert.equal(data.customer_details,undefined);assert.equal(data.invoiceUrl,'https://invoice.stripe.com/i/test');});await mockStripe(()=>({...paid,metadata:{...paid.metadata,owner:'different'}}),async()=>{assert.equal((await status({env:configured,request:request('/api/checkout-status',{sessionId:'cs_test_example123'})})).status,404);});});
test('signed webhook failure returns retryable response (simulated Stripe)',async()=>{const event={id:'evt_retry',livemode:false,type:'checkout.session.async_payment_succeeded',data:{object:paid}};const payload=JSON.stringify(event);const signature=Stripe.webhooks.generateTestHeaderString({payload,secret:configured.STRIPE_WEBHOOK_SECRET});await mockStripe(()=>paid,async()=>{const response=await webhook({env:configured,request:new Request(env.SITE_URL,{method:'POST',headers:{'stripe-signature':signature},body:payload})});assert.equal(response.status,503);});});

const liveConfigured={...configured,STRIPE_SECRET_KEY:'sk_live_unit_test_only'};
test('configured mode is derived from server key; sessions must match',()=>{
 assert.equal(config(liveConfigured).livemode,true);assert.equal(config(configured).livemode,false);
 assert.throws(()=>config({...configured,STRIPE_SECRET_KEY:'invalid'}));
 assert.equal(verified({...paid,livemode:true},true),'paid');assert.throws(()=>verified(paid,true));
});
for(const [priceMode,sessionMode,expected] of [[true,true,200],[false,true,503],[true,false,503]])test(`live checkout mode matching ${priceMode}/${sessionMode}`,async()=>{
 await mockStripe(url=>url.includes('/prices/')?{livemode:priceMode,active:true,currency:'eur',unit_amount:7900,type:'one_time',recurring:null}:{id:'cs_live_example123',livemode:sessionMode,url:'https://checkout.stripe.com/c/pay/cs_live_example123'},async()=>{
 assert.equal((await create({env:liveConfigured,request:request('/api/create-checkout-session',{items:[{id:'seedplate',quantity:1}]})})).status,expected);
 });
});
test('live status verifies session and rejects test IDs and mode mismatch',async()=>{
 const {digest}=await import('../server/checkout.js');const hash=await digest(cookie);
 for(const mode of [true,false])await mockStripe(()=>({...paid,livemode:mode,metadata:{...paid.metadata,owner:hash}}),async()=>{
 const r=await status({env:liveConfigured,request:request('/api/checkout-status',{sessionId:'cs_live_example123'})});assert.equal(r.status,mode?200:503);if(mode)assert.equal((await r.json()).state,'paid');
 });
 await mockStripe(()=>{throw Error('Must not call Stripe');},async()=>{assert.equal((await status({env:liveConfigured,request:request('/api/checkout-status',{sessionId:'cs_test_example123'})})).status,400);});
});
test('live signed webhook requires matching event and retrieved session modes before recording',async()=>{
 for(const [eventMode,sessionMode,expected] of [[true,true,200],[false,true,400],[true,false,503]]){
 let recorded=false;const db={prepare(){return {bind(){return {};}}},async batch(){recorded=true;}};
 const payload=JSON.stringify({id:'evt_live_fixture',livemode:eventMode,type:'checkout.session.completed',data:{object:paid}});
 const signature=Stripe.webhooks.generateTestHeaderString({payload,secret:configured.STRIPE_WEBHOOK_SECRET});
 await mockStripe(()=>({...paid,livemode:sessionMode}),async()=>{const r=await webhook({env:{...liveConfigured,ORDERS:db},request:new Request(env.SITE_URL,{method:'POST',headers:{'stripe-signature':signature},body:payload})});assert.equal(r.status,expected);assert.equal(recorded,expected===200);});
 }
});

for(const [field,value,code] of [
 ['STRIPE_SECRET_KEY',undefined,'MISSING_STRIPE_SECRET_KEY'],
 ['STRIPE_SECRET_KEY','private-invalid-fixture','INVALID_STRIPE_SECRET_KEY_FORMAT'],
 ['STRIPE_WEBHOOK_SECRET','', 'MISSING_WEBHOOK_SECRET'],
 ['STRIPE_PRICE_ID',undefined,'MISSING_PRICE_ID'],
 ['STRIPE_PRICE_ID','private-price-fixture','INVALID_PRICE_ID_FORMAT'],
 ['SITE_URL',undefined,'MISSING_SITE_URL'],
 ...['invalid','https://example.com/path','https://example.com/?secret=fixture','https://example.com/#fixture','https://user:password@example.com','http://example.com'].map(value=>['SITE_URL',value,'INVALID_SITE_URL']),
 ['ORDERS',undefined,'MISSING_ORDERS_BINDING']
])test(`context returns generic error for: ${code} ${field}`,async()=>{
 const response=await context({env:{...liveConfigured,[field]:value},request:new Request(env.SITE_URL)});
 assert.equal(response.status,503);assert.deepEqual(await response.json(),{error:'Der Checkout ist derzeit nicht verfügbar.'});assert.equal(response.headers.get('cache-control'),'no-store');
});
test('context accepts live and test configuration without exposing values',async()=>{
 for(const settings of [configured,liveConfigured]){const response=await context({env:settings,request:new Request(env.SITE_URL)});assert.equal(response.status,200);assert.deepEqual(await response.json(),{ready:true});}
 const response=await context({env:liveConfigured,request:new Request('https://other.example')});assert.equal(response.status,403);
});
test('context runtime exception cannot expose raw exception or credential values',async()=>{
 const original=Stripe.createFetchHttpClient;
 Stripe.createFetchHttpClient=()=>{throw Error('private-runtime-fixture');};
 try{const response=await context({env:liveConfigured,request:new Request(env.SITE_URL)});assert.equal(response.status,503);assert.deepEqual(await response.json(),{error:'Der Checkout ist derzeit nicht verfügbar.'});}finally{Stripe.createFetchHttpClient=original;}
});

for(const mode of ['live','test'])test(`restricted ${mode} key preserves mode validation (simulated Stripe)`,async()=>{
 const settings={...configured,STRIPE_SECRET_KEY:`rk_${mode}_unit_test_only`};const live=mode==='live';
 assert.equal(config(settings).livemode,live);
 const response=await context({env:settings,request:new Request(env.SITE_URL)});assert.equal(response.status,200);assert.deepEqual(await response.json(),{ready:true});
 assert.equal(verified({...paid,livemode:live},config(settings).livemode),'paid');assert.throws(()=>verified({...paid,livemode:!live},config(settings).livemode));
 for(const [priceMode,sessionMode,expected] of [[live,live,200],[!live,live,503],[live,!live,503]])await mockStripe(url=>url.includes('/prices/')?{livemode:priceMode,active:true,currency:'eur',unit_amount:7900,type:'one_time',recurring:null}:{id:`cs_${mode}_example123`,livemode:sessionMode,url:`https://checkout.stripe.com/c/pay/cs_${mode}_example123`},async()=>{
 assert.equal((await create({env:settings,request:request('/api/create-checkout-session',{items:[{id:'seedplate',quantity:1}]})})).status,expected);
 });
});
