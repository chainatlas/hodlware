import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import Stripe from 'stripe';
import {cartItems,sessionItems,subtotal} from '../server/catalog.js';
import {availability,reserve} from '../server/inventory.js';
import {context,APP,parameters,verified,record,create,webhook,status,digest} from '../server/checkout.js';
const cookie='11111111-1111-4111-8111-111111111111';
function setup(){
 const sql=new DatabaseSync(':memory:');
 for(const file of ['0001_checkout.sql','0002_communications.sql','0003_product_inventory.sql'])sql.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
 const db={prepare(query){return {async first(){return sql.prepare(query).get()||null;},bind(...args){return {query,args,async first(){return sql.prepare(query).get(...args)||null;},async run(){return sql.prepare(query).run(...args);}};}};},async batch(items){sql.exec('BEGIN');try{for(const item of items)sql.prepare(item.query).run(...item.args);sql.exec('COMMIT');}catch(e){sql.exec('ROLLBACK');throw e;}}};
 return {sql,env:{ORDERS:db,SITE_URL:'https://example.test',STRIPE_SECRET_KEY:'rk_test_unit_test_only',STRIPE_WEBHOOK_SECRET:'whsec_unit_test_only',STRIPE_PRICE_ID:'price_old_fixture',STRIPE_PRICE_ID_PLATE4:'price_new_fixture',PLATE4_ENABLED:'true',ORDER_EMAILS_ENABLED:'true',COMMUNICATIONS_ENABLED:'true',MAIL_WORKER_READY:'true',RESEND_API_KEY:'unit-test-fixture',MAIL_FROM:'shop@example.test'}};
}
function session(items,key='a'.repeat(64)){
 items=cartItems({items});const sum=subtotal(items);
 return {id:'cs_test_product2123',livemode:false,mode:'payment',status:'complete',payment_status:'paid',currency:'eur',metadata:{app:APP,items:JSON.stringify(items),reservation:key,contractVersion:'2026-10-11'},amount_subtotal:sum,amount_total:sum+619,total_details:{amount_discount:0,amount_tax:0,amount_shipping:619},line_items:{has_more:false,data:sessionItems({metadata:{items:JSON.stringify(items)}}).map(i=>({quantity:i.quantity,amount_subtotal:i.unitPrice*i.quantity,price:{unit_amount:i.unitPrice,currency:'eur',livemode:false}}))},customer_details:{email:'customer@example.test'},shipping_details:{name:'Testperson',address:{line1:'Teststraße 1',postal_code:'00000',city:'Teststadt',country:'DE'}},payment_intent:'pi_fixture'};
}
async function mockStripe(fn,run){const old=Stripe.createFetchHttpClient;Stripe.createFetchHttpClient=()=>old(async(url,init)=>Response.json(await fn(url,init)));try{await run();}finally{Stripe.createFetchHttpClient=old;}}
function request(env,data,key='22222222-2222-4222-8222-222222222222'){return new Request(env.SITE_URL,{method:'POST',headers:{origin:env.SITE_URL,'content-type':'application/json',cookie:'hwcheckout='+cookie,'x-checkout-request':key},body:JSON.stringify(data)});}

test('two distinct products: authoritative prices, mixed cart and one DHL charge',()=>{
 const items=cartItems({items:[{id:'seedplate',quantity:1},{id:'recoveryplate4',quantity:2}]});assert.equal(subtotal(items),23700);
 const p=parameters({SITE_URL:'https://example.test',STRIPE_PRICE_ID:'price_old_fixture',STRIPE_PRICE_ID_PLATE4:'price_new_fixture'},items,'owner');assert.deepEqual(p.line_items,[{price:'price_new_fixture',quantity:2},{price:'price_old_fixture',quantity:1}]);assert.equal(p.shipping_options.length,1);assert.equal(p.shipping_options[0].shipping_rate_data.fixed_amount.amount,619);assert.equal(p.automatic_tax.enabled,false);assert.deepEqual(p.shipping_address_collection.allowed_countries,['DE']);
 for(const bad of [[{id:'recoveryplate4',quantity:1,price:1}],[{id:'seedplate',quantity:1},{id:'seedplate',quantity:1}],[{id:'toString',quantity:1}],[{id:'unknown',quantity:1}]])assert.throws(()=>cartItems({items:bad}));
});
for(const [items,discount,total] of [
 [[{id:'recoveryplate4',quantity:1}],0,8519],
 [[{id:'recoveryplate4',quantity:2}],1580,14839],
 [[{id:'seedplate',quantity:1},{id:'recoveryplate4',quantity:1}],1580,14839]
])test(`verified totals ${total}, including simulated ten percent discount`,()=>{
 const s=session(items);s.total_details.amount_discount=discount;s.amount_total=total;assert.equal(verified(s),'paid');assert.throws(()=>verified({...s,amount_total:total-1}));
});
test('verified sessions require actual Stripe line items, mode, quantity and price',()=>{
 const s=session([{id:'recoveryplate4',quantity:1}]);
 for(const changed of [{line_items:undefined},{mode:'subscription'},{livemode:true},{line_items:{...s.line_items,has_more:true}},{line_items:{data:[{...s.line_items.data[0],quantity:2}]}},{line_items:{data:[{...s.line_items.data[0],price:{...s.line_items.data[0].price,livemode:true}}]}}])assert.throws(()=>verified({...s,...changed}));
 assert.equal(verified({...s,status:'open',payment_status:'unpaid'}),'pending');assert.equal(verified({...s,status:'expired',payment_status:'unpaid'}),'expired');
});
test('confirmed stock 24; atomic competing reservations cannot oversell; retries reserve once',async()=>{
 const {env,sql}=setup();assert.deepEqual(await availability(env),{available:true,quantity:24});
 const results=await Promise.allSettled([reserve(env,'a'.repeat(64),13),reserve(env,'b'.repeat(64),13)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 await reserve(env,'a'.repeat(64),13);assert.equal((await availability(env)).quantity,11);assert.equal(sql.prepare('SELECT COUNT(*) n FROM stock_reservations').get().n,1);
 sql.exec(readFileSync(new URL('../migrations/0003_product_inventory.sql',import.meta.url),'utf8'));assert.equal((await availability(env)).quantity,11);sql.close();
});
test('new product fails closed without feature flag, distinct price or migrated inventory',async()=>{
 const {env,sql}=setup();assert.equal((await availability({...env,PLATE4_ENABLED:'false'})).available,false);assert.equal((await availability({...env,STRIPE_PRICE_ID_PLATE4:env.STRIPE_PRICE_ID})).available,false);
 await mockStripe(()=>{throw Error('must not call Stripe');},async()=>assert.equal((await create({env:{...env,PLATE4_ENABLED:'false'},request:request(env,{items:[{id:'recoveryplate4',quantity:1}]})})).status,503));
 sql.exec('DROP TABLE stock_reservations');assert.equal((await availability(env)).available,false);sql.close();
});
test('expired reservation releases once; paid reservations never release on late events',async()=>{
 const {env,sql}=setup();const s=session([{id:'recoveryplate4',quantity:2}]);await reserve(env,s.metadata.reservation,2);
 await record(env.ORDERS,{id:'evt_1'},s,'paid');await record(env.ORDERS,{id:'evt_2'},s,'expired');assert.equal((await availability(env)).quantity,22);
 const b=session([{id:'recoveryplate4',quantity:3}],'b'.repeat(64));b.id='cs_test_second123';await reserve(env,b.metadata.reservation,3);await record(env.ORDERS,{id:'evt_3'},b,'expired');await record(env.ORDERS,{id:'evt_3'},b,'expired');await record(env.ORDERS,{id:'evt_late_pending'},b,'pending');assert.equal((await availability(env)).quantity,22);
 await assert.rejects(record(env.ORDERS,{id:'evt_conflict'},b,'paid'));assert.equal(sql.prepare('SELECT state FROM checkout_orders WHERE session_id=?').get(b.id).state,'expired');sql.close();
});
test('mixed checkout validates each Stripe price before reserving or creating (SDK simulated)',async()=>{
 const {env,sql}=setup();let created=0,params,priceMode=false;const items=[{id:'seedplate',quantity:1},{id:'recoveryplate4',quantity:1}];
 await mockStripe((url,init)=>{if(url.includes('/prices/'))return {livemode:priceMode,active:true,currency:'eur',unit_amount:url.includes('new_fixture')?7900:7900,type:'one_time'};created++;params=new URLSearchParams(init.body);return {id:'cs_test_created123',livemode:false,url:'https://checkout.stripe.com/c/pay/fixture'};},async()=>{
  priceMode=true;assert.equal((await create({env,request:request(env,{items})})).status,503);assert.equal(created,0);assert.equal((await availability(env)).quantity,24);
  priceMode=false;assert.equal((await create({env,request:request(env,{items})})).status,200);assert.equal((await availability(env)).quantity,23);assert.equal(params.get('line_items[0][price]'),'price_new_fixture');assert.equal(params.get('line_items[1][price]'),'price_old_fixture');
  assert.equal((await create({env,request:request(env,{items})})).status,200);assert.equal((await availability(env)).quantity,23);
 });sql.close();
});
test('mixed paid webhook stores exact items and mails once; verified result contains both items',async()=>{
 const {env,sql}=setup(),s=session([{id:'seedplate',quantity:1},{id:'recoveryplate4',quantity:1}]);s.metadata.owner=await digest(cookie);await reserve(env,s.metadata.reservation,1);
 let mails=[];const fetchOriginal=globalThis.fetch;globalThis.fetch=async(url,options)=>{mails.push(JSON.parse(options.body));return Response.json({id:'mail-fixture'});};
 try{await mockStripe(url=>url.includes('/payment_intents/')?{livemode:false,status:'succeeded',amount_received:s.amount_total,currency:'eur',payment_method:{type:'card'}}:s,async()=>{
  const call=async type=>{const payload=JSON.stringify({id:'evt_'+type,livemode:false,type,data:{object:s}});return webhook({env,request:new Request(env.SITE_URL,{method:'POST',body:payload,headers:{'stripe-signature':Stripe.webhooks.generateTestHeaderString({payload,secret:env.STRIPE_WEBHOOK_SECRET})}})});};
  assert.equal((await call('checkout.session.completed')).status,200);assert.equal((await call('checkout.session.completed')).status,200);assert.equal((await call('checkout.session.async_payment_failed')).status,200);
  assert.equal(mails.length,2);for(const mail of mails)for(const value of ['Steel Seed Phrase Recovery Plate (8 Digits per Word)','Steel Seed Phrase Recovery Plate (4 Digit - BIP39)','79,00 EUR','79,00 EUR','6,19 EUR','VOID','Artikel: recoveryplate4'])assert.ok(mail.text.includes(value),value);
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM checkout_order_items').get().n,2);assert.deepEqual(sql.prepare('SELECT product_id,unit_price,quantity FROM checkout_order_items ORDER BY product_id').all().map(row=>({...row})),[{product_id:'recoveryplate4',unit_price:7900,quantity:1},{product_id:'seedplate',unit_price:7900,quantity:1}]);assert.equal((await availability(env)).quantity,23);
  const result=await status({env,request:request(env,{sessionId:s.id})});assert.equal(result.status,200);const data=await result.json();assert.equal(data.items.length,2);assert.equal(data.total,16419);assert.equal(data.customer_details,undefined);
 });}finally{globalThis.fetch=fetchOriginal;sql.close();}
});
test('signed expired and failed new-product webhooks release stock without order emails',async()=>{
 for(const [type,statusValue] of [['checkout.session.expired','expired'],['checkout.session.async_payment_failed','complete']]){
  const {env,sql}=setup(),s=session([{id:'recoveryplate4',quantity:1}]);s.status=statusValue;s.payment_status='unpaid';await reserve(env,s.metadata.reservation,1);
  await mockStripe(()=>s,async()=>{const payload=JSON.stringify({id:'evt_failure',livemode:false,type,data:{object:s}});const result=await webhook({env,request:new Request(env.SITE_URL,{method:'POST',body:payload,headers:{'stripe-signature':Stripe.webhooks.generateTestHeaderString({payload,secret:env.STRIPE_WEBHOOK_SECRET})}})});assert.equal(result.status,200);});
  assert.equal((await availability(env)).quantity,24);assert.equal(sql.prepare('SELECT COUNT(*) n FROM mail_outbox').get().n,0);assert.notEqual(sql.prepare('SELECT state FROM checkout_orders').get().state,'paid');sql.close();
 }
});
test('public catalog preserves original product and supplies distinct new page and four real photos',()=>{
 const ctx={window:{}};vm.runInNewContext(readFileSync(new URL('../assets/products.js',import.meta.url),'utf8'),ctx);const [old,next]=ctx.window.HODL_PRODUCTS.filter(p=>p.visible!==false);assert.equal(old.id,'seedplate');assert.equal(old.price,79);assert.equal(old.images.length,8);assert.equal(next.id,'recoveryplate4');assert.equal(next.price,79);assert.equal(next.images.length,4);assert.notEqual(old.url,next.url);
 for(const image of next.images)for(const file of [image.src,image.small,image.thumb])assert.ok(readFileSync(new URL('../'+file,import.meta.url)).length>0);
 const html=readFileSync(new URL('../steel-seed-phrase-recovery-plate.html',import.meta.url),'utf8');assert.equal((html.match(/<h1>/g)||[]).length,1);assert.ok(html.includes('3× VOID'));assert.ok(!html.includes('InStock'));assert.ok(html.includes('fetchpriority="high"'));
});


test('race: release between validation and atomic paid write rolls back the order',async()=>{
 const {env,sql}=setup(),s=session([{id:'recoveryplate4',quantity:1}]);await reserve(env,s.metadata.reservation,1);
 const original=env.ORDERS.batch;env.ORDERS.batch=async statements=>{sql.prepare("UPDATE stock_reservations SET state='released' WHERE reservation_id=?").run(s.metadata.reservation);return original(statements);};
 await assert.rejects(record(env.ORDERS,{id:'evt_race'},s,'paid'));assert.equal(sql.prepare('SELECT COUNT(*) n FROM checkout_orders').get().n,0);assert.equal(sql.prepare('SELECT COUNT(*) n FROM checkout_order_items').get().n,0);assert.equal((await availability(env)).quantity,24);sql.close();
});
test('uncertain Stripe response keeps a safe hold; same request retries the same reservation and expiry',async()=>{
 const {env,sql}=setup();let fail=true;const keys=[],expirations=[];
 await mockStripe((url,init)=>{
  if(url.includes('/prices/'))return {livemode:false,active:true,currency:'eur',unit_amount:7900,type:'one_time'};
  keys.push(new Headers(init.headers).get('idempotency-key'));expirations.push(new URLSearchParams(init.body).get('expires_at'));
  return fail?{id:'cs_test_unknown123',livemode:false}:{id:'cs_test_retry123',livemode:false,url:'https://checkout.stripe.com/c/pay/fixture'};
 },async()=>{const data={items:[{id:'recoveryplate4',quantity:1}]};assert.equal((await create({env,request:request(env,data)})).status,503);assert.equal((await availability(env)).quantity,23);fail=false;assert.equal((await create({env,request:request(env,data)})).status,200);assert.equal((await availability(env)).quantity,23);assert.equal(keys[0],keys[1]);assert.equal(expirations[0],expirations[1]);});sql.close();
});
test('order item storage and stock change are rolled back together on database failure',async()=>{
 const {env,sql}=setup(),s=session([{id:'recoveryplate4',quantity:1}]);await reserve(env,s.metadata.reservation,1);sql.exec("CREATE TRIGGER reject_line BEFORE INSERT ON checkout_order_items BEGIN SELECT RAISE(ABORT,'fixture'); END;");await assert.rejects(record(env.ORDERS,{id:'evt_rollback'},s,'paid'));assert.equal(sql.prepare('SELECT COUNT(*) n FROM checkout_orders').get().n,0);assert.equal(sql.prepare('SELECT state FROM stock_reservations').get().state,'held');sql.close();
});


test('public availability reveals no inventory counts, including sold-out and disabled cases',async()=>{
 const {env,sql}=setup();
 const get=async e=>{const response=await context({env:e,request:new Request(env.SITE_URL+'/api/checkout-context')});assert.equal(response.status,200);return response.json();};
 assert.deepEqual(await get(env),{ready:true,products:{recoveryplate4:{available:true}}});
 await reserve(env,'c'.repeat(64),24);
 assert.deepEqual(await get(env),{ready:true,products:{recoveryplate4:{available:false}}});
 assert.deepEqual(await get({...env,PLATE4_ENABLED:'false'}),{ready:true});sql.close();
});
