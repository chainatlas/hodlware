import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {submit,available} from '../server/forms.js';
import {deliver,mailInsert} from '../server/mail.js';
import {queueOrder} from '../server/order-mail.js';
import Stripe from 'stripe';
import {APP,webhook,parameters} from '../server/checkout.js';
function setup(){
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../migrations/0001_checkout.sql',import.meta.url),'utf8'));sql.exec(readFileSync(new URL('../migrations/0002_communications.sql',import.meta.url),'utf8'));
 const db={prepare(query){return {bind(...args){return {async first(){return sql.prepare(query).get(...args)||null;},async all(){return {results:sql.prepare(query).all(...args)};},async run(){return sql.prepare(query).run(...args);},query,args};},async first(){return sql.prepare(query).get()||null;}};},async batch(items){sql.exec('BEGIN');try{for(const item of items)sql.prepare(item.query).run(...item.args);sql.exec('COMMIT');}catch(e){sql.exec('ROLLBACK');throw e;}}};
 const env={ORDERS:db,SITE_URL:'https://example.test',COMMUNICATIONS_ENABLED:'true',FORMS_ENABLED:'true',ORDER_EMAILS_ENABLED:'true',MAIL_WORKER_READY:'true',RATE_LIMIT_SECRET:'unit-test-only-not-a-secret-000000000',RESEND_API_KEY:'unit-test-fixture',MAIL_FROM:'shop@example.test'};
 return {env,sql};
}
const input=()=>({name:'Testperson',email:'test@example.test',contractId:'unbekannte Bestellung / nur Artikel 1',website:'',requestId:crypto.randomUUID()});
function request(data,origin='https://example.test'){return new Request('https://example.test/api/withdrawals',{method:'POST',headers:{origin,'content-type':'application/json','CF-Connecting-IP':'192.0.2.1'},body:JSON.stringify(data)});}
async function withMail(response,fn){const old=globalThis.fetch;globalThis.fetch=response;try{await fn();}finally{globalThis.fetch=old;}}
test('forms fail closed before configuration and migration',async()=>{assert.equal(await available({}),false);const {env,sql}=setup();assert.equal(await available(env),true);assert.equal(await available({...env,MAIL_WORKER_READY:'false'}),false);sql.close();});
test('withdrawal accepts unknown contract, persists timestamp and sends both messages once',async()=>{
 const {env,sql}=setup();let sent=[];await withMail(async(url,opt)=>{sent.push(JSON.parse(opt.body));return Response.json({id:'mail-fixture'});},async()=>{
 const data=input(),r=await submit({env,request:request(data)},'withdrawal');assert.equal(r.status,200);const receipt=await r.json();assert.equal(receipt.received,true);assert.equal(sent.length,2);assert.ok(sent[1].text.includes(data.contractId));assert.ok(sent[1].text.includes(receipt.receivedAt));
 const duplicate=await submit({env,request:request(data)},'withdrawal');assert.equal((await duplicate.json()).receivedAt,receipt.receivedAt);assert.equal(sent.length,2);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM submissions').get().n,1);
 const conflict=await submit({env,request:request({...data,name:'Other'})},'withdrawal');assert.equal(conflict.status,409);
 });sql.close();
});
test('mail failure never discards received withdrawal and durable retry succeeds',async()=>{
 const {env,sql}=setup();await withMail(async()=>{throw Error('sensitive provider detail');},async()=>{const r=await submit({env,request:request(input())},'withdrawal');assert.equal(r.status,200);assert.equal((await r.json()).received,true);});
 const row=sql.prepare('SELECT * FROM mail_outbox LIMIT 1').get();assert.equal(row.state,'pending');assert.equal(await deliver(env,row.id,async()=>Response.json({id:'retry'}),row.next_attempt+1),true);sql.close();
});
test('forged origin, honeypot, invalid email and large body rejected before persistence',async()=>{
 const {env,sql}=setup();assert.equal((await submit({env,request:request(input(),'https://evil.test')},'withdrawal')).status,403);
 for(const bad of [{...input(),website:'spam'},{...input(),email:'bad\r\nBcc: x@y.test'},{...input(),name:''},{...input(),contractId:'x'.repeat(501)}])assert.equal((await submit({env,request:request(bad)},'withdrawal')).status,400);
 assert.equal((await submit({env,request:request({...input(),contractId:'x'.repeat(30000)})},'withdrawal')).status,413);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM submissions').get().n,0);sql.close();
});
test('rate limit is shared durable state, does not store raw IP',async()=>{
 const {env,sql}=setup();await withMail(async()=>Response.json({id:'fixture'}),async()=>{for(let i=0;i<20;i++)assert.equal((await submit({env,request:request(input())},'withdrawal')).status,200);assert.equal((await submit({env,request:request(input())},'withdrawal')).status,429);});
 const row=sql.prepare('SELECT key FROM form_limits').get();assert.equal(row.key.length,64);assert.ok(!row.key.includes('192.0.2.1'));sql.close();
});
test('contact mail is plain text, replies to sender, no HTML execution',async()=>{
 const {env,sql}=setup();await withMail(async(url,opt)=>{const p=JSON.parse(opt.body);assert.equal(p.html,undefined);assert.ok(p.text.includes('<script>'));assert.equal(p.reply_to,'test@example.test');assert.deepEqual(p.to,['steffenreizner@web.de']);return Response.json({id:'fixture'});},async()=>{const data=input();delete data.contractId;data.message='<script>alert(1)</script>';assert.equal((await submit({env,request:request(data)},'contact')).status,200);});sql.close();
});
test('expired provider idempotency window requires review, never resends blindly',async()=>{
 const {env,sql}=setup();await env.ORDERS.batch([mailInsert(env.ORDERS,'job',{text:'fixture'})]);sql.prepare('UPDATE mail_outbox SET first_attempt=?').run(Date.now()-24*3600000);assert.equal(await deliver(env,'job',()=>{throw Error('must not send');}),false);assert.equal(sql.prepare('SELECT state FROM mail_outbox').get().state,'review');sql.close();
});
test('concurrent workers cannot send same job twice',async()=>{
 const {env,sql}=setup();await env.ORDERS.batch([mailInsert(env.ORDERS,'job',{text:'fixture'})]);let calls=0;const send=async()=>{calls++;return Response.json({id:'fixture'});};await Promise.all([deliver(env,'job',send),deliver(env,'job',send)]);assert.equal(calls,1);sql.close();
});
test('atomic receipt rollback when outbox unavailable',async()=>{
 const {env,sql}=setup();sql.exec(`CREATE TRIGGER reject_mail BEFORE INSERT ON mail_outbox BEGIN SELECT RAISE(ABORT,'fixture failure'); END;`);assert.equal((await submit({env,request:request(input())},'withdrawal')).status,503);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM submissions').get().n,0);sql.close();
});
test('order snapshot includes contract and withdrawal docs; repeated and concurrent events have one order and two mails',async()=>{
 const {env,sql}=setup();const s={id:'cs_test_fixture',metadata:{quantity:'1',contractVersion:'2026-10-11'},customer_details:{email:'test@example.test'},shipping_details:{name:'Testperson',address:{line1:'Teststraße 1',postal_code:'00000',city:'Teststadt',country:'DE'}},amount_subtotal:7900,amount_total:7729,total_details:{amount_discount:790,amount_shipping:619}};
 await Promise.all([queueOrder(env,s,'card'),queueOrder(env,s,'card')]);await queueOrder(env,s,'card');assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM order_confirmations').get().n,1);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM mail_outbox').get().n,2);
 const p=JSON.parse(sql.prepare('SELECT payload FROM mail_outbox LIMIT 1').get().payload);assert.equal(p.reply_to,'steffenreizner@web.de');assert.ok(!p.text.includes('304 Edelstahl'));for(const value of ['77,29 EUR','6,19 EUR','Muster-Widerrufsformular','Allgemeine','Teststraße','card'])assert.ok(p.text.includes(value),value);
 await assert.rejects(queueOrder(env,{...s,id:'old',metadata:{quantity:'1'}},'card'));sql.close();
});
test('hosted checkout has delivery disclosure and immutable contract version',()=>{const p=parameters({SITE_URL:'https://example.test',STRIPE_PRICE_ID:'price_fixture'},1,'fixture');assert.ok(p.custom_text.submit.message.includes('2–4 Werktage'));assert.equal(p.metadata.contractVersion,'2026-10-11');});


test('signed paid webhook queues and sends one contract per recipient; retries and late events deduplicate',async()=>{
 const {env,sql}=setup();Object.assign(env,{STRIPE_SECRET_KEY:'sk_test_unit_test_only',STRIPE_WEBHOOK_SECRET:'whsec_unit_test_only',STRIPE_PRICE_ID:'price_fixture'});
 const session={id:'cs_test_fixture123',livemode:false,status:'complete',payment_status:'paid',currency:'eur',metadata:{app:APP,quantity:'1',contractVersion:'2026-10-11'},customer_details:{email:'test@example.test'},shipping_details:{name:'Testperson',address:{line1:'Teststraße 1',postal_code:'00000',city:'Teststadt',country:'DE'}},amount_subtotal:7900,amount_total:8519,total_details:{amount_discount:0,amount_shipping:619,amount_tax:0},payment_intent:'pi_fixture'};
 let intentMode=true,mailCalls=0,intentCalls=0;
 const original=Stripe.createFetchHttpClient;
 Stripe.createFetchHttpClient=()=>original(async url=>Response.json(url.includes('/payment_intents/')?(intentCalls++,{livemode:intentMode,status:'succeeded',amount_received:8519,currency:'eur',payment_method:{type:'card'}}):session));
 const call=async(type='checkout.session.completed')=>{const payload=JSON.stringify({id:'evt_fixture_'+type,livemode:false,type,data:{object:session}});return webhook({env,request:new Request(env.SITE_URL+'/api/stripe-webhook',{method:'POST',headers:{'stripe-signature':Stripe.webhooks.generateTestHeaderString({payload,secret:env.STRIPE_WEBHOOK_SECRET})},body:payload})});};
 try{await withMail(async()=>{mailCalls++;return Response.json({id:'simulated-mail'});},async()=>{
  assert.equal((await call()).status,503);assert.equal(mailCalls,0);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM order_confirmations').get().n,0);
  intentMode=false;env.MAIL_WORKER_READY='false';assert.equal((await call()).status,503);assert.equal(mailCalls,0);env.MAIL_WORKER_READY='true';
  assert.equal((await call()).status,200);assert.equal(mailCalls,2);assert.equal(intentCalls,2);
  assert.equal((await call()).status,200);assert.equal((await call('checkout.session.async_payment_failed')).status,200);assert.equal(mailCalls,2);assert.equal(intentCalls,2);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM checkout_orders').get().n,1);assert.equal(sql.prepare('SELECT state FROM checkout_orders').get().state,'paid');
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM order_confirmations').get().n,1);assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM mail_outbox WHERE state='sent'").get().n,2);
 });}finally{Stripe.createFetchHttpClient=original;sql.close();}
});
