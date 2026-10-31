import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import Stripe from 'stripe';
import {CATALOG,cartItems,sessionItems,subtotal,shipping,physicalItems} from '../server/catalog.js';
import {availability,reserve} from '../server/inventory.js';
import {context,APP,parameters,verified,record,create,webhook,status,digest} from '../server/checkout.js';
const cookie='11111111-1111-4111-8111-111111111111';
function setup(){
 const sql=new DatabaseSync(':memory:');
 for(const file of ['0001_checkout.sql','0002_communications.sql','0003_product_inventory.sql','0004_accessory_inventory.sql'])sql.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
 const db={prepare(query){return {async first(){return sql.prepare(query).get()||null;},bind(...args){return {query,args,async first(){return sql.prepare(query).get(...args)||null;},async run(){return sql.prepare(query).run(...args);}};}};},async batch(items){sql.exec('BEGIN');try{for(const item of items)sql.prepare(item.query).run(...item.args);sql.exec('COMMIT');}catch(e){sql.exec('ROLLBACK');throw e;}}};
 sql.exec("UPDATE product_inventory SET stock=100 WHERE product_id='void-stickers'");
 return {sql,env:{ORDERS:db,SITE_URL:'https://example.test',STRIPE_SECRET_KEY:'rk_test_unit_test_only',STRIPE_WEBHOOK_SECRET:'whsec_unit_test_only',STRIPE_PRICE_ID:'price_old_fixture',STRIPE_PRICE_ID_PLATE4:'price_new_fixture',PLATE4_ENABLED:'true',ACCESSORIES_ENABLED:'true',ACCESSORIES_PRICES_APPROVED:'true',ACCESSORIES_STOCK_CONFIRMED:'true',STRIPE_PRICE_ID_VOID_1:'price_void_1',STRIPE_PRICE_ID_VOID_5:'price_void_5',STRIPE_PRICE_ID_VOID_10:'price_void_10',STRIPE_PRICE_ID_VOID_25:'price_void_25',ORDER_EMAILS_ENABLED:'true',COMMUNICATIONS_ENABLED:'true',MAIL_WORKER_READY:'true',RESEND_API_KEY:'unit-test-fixture',MAIL_FROM:'shop@example.test'}};
}
function session(items,key='a'.repeat(64)){
 items=cartItems({items});const sum=subtotal(items);
 return {id:'cs_test_product2123',livemode:false,mode:'payment',status:'complete',payment_status:'paid',currency:'eur',metadata:{app:APP,items:JSON.stringify(items),reservation:key,contractVersion:'2026-10-31-accessories'},amount_subtotal:sum,amount_total:sum+shipping(items),total_details:{amount_discount:0,amount_tax:0,amount_shipping:shipping(items)},line_items:{has_more:false,data:sessionItems({metadata:{items:JSON.stringify(items)}}).map(i=>({quantity:i.quantity,amount_subtotal:i.unitPrice*i.quantity,price:{unit_amount:i.unitPrice,currency:'eur',livemode:false}}))},customer_details:{email:'customer@example.test'},shipping_details:{name:'Testperson',address:{line1:'Teststraße 1',postal_code:'00000',city:'Teststadt',country:'DE'}},payment_intent:'pi_fixture'};
}
async function mockStripe(fn,run){const old=Stripe.createFetchHttpClient;Stripe.createFetchHttpClient=()=>old(async(url,init)=>Response.json(await fn(url,init)));try{await run();}finally{Stripe.createFetchHttpClient=old;}}
function request(env,data,key='22222222-2222-4222-8222-222222222222'){return new Request(env.SITE_URL,{method:'POST',headers:{origin:env.SITE_URL,'content-type':'application/json',cookie:'hwcheckout='+cookie,'x-checkout-request':key},body:JSON.stringify(data)});}


import {queueOrder} from '../server/order-mail.js';
import {reserveAccessories,accessoryAvailability} from '../server/accessory-inventory.js';

for(const [units,price] of [[1,99],[5,349],[10,599],[25,1199]])test(`VOID ${units}: package, shipping and physical quantity`,async()=>{
 const items=[{id:`void-${units}`,quantity:2}];assert.equal(subtotal(items),price*2);assert.equal(shipping(items),110);assert.deepEqual(physicalItems(items),[{id:'void-stickers',quantity:units*2}]);
 const {env,sql}=setup(),p=parameters(env,items,'owner');assert.equal(p.line_items[0].price,env[`STRIPE_PRICE_ID_VOID_${units}`]);assert.equal(p.shipping_options[0].shipping_rate_data.fixed_amount.amount,110);assert.equal(p.metadata.contractVersion,'2026-10-31-accessories');assert.equal(verified(session(items)),'paid');
 await reserveAccessories(env,'a'.repeat(64),physicalItems(items));assert.equal(sql.prepare('SELECT quantity FROM accessory_reservations').get().quantity,units*2);sql.close();
});
for(const plate of ['seedplate','recoveryplate4'])for(const quantity of [1,2])test(`mixed ${plate} x${quantity}: shipping only once`,()=>{const items=[{id:plate,quantity},{id:'void-25',quantity:2}];assert.equal(shipping(items),619);assert.equal(verified(session(items)),'paid');assert.throws(()=>verified({...session(items),total_details:{amount_shipping:110,amount_tax:0,amount_discount:0}}));});
test('all variants coexist, total is authoritative, tampering is rejected',()=>{
 const items=[1,5,10,25].map(n=>({id:`void-${n}`,quantity:1}));assert.equal(subtotal(items),2246);assert.deepEqual(physicalItems(items),[{id:'void-stickers',quantity:41}]);assert.equal(cartItems({items}).length,4);
 for(const bad of [{id:'void-25',quantity:1,price:1},{id:'void-25',quantity:1,units:1},{id:'void-25',quantity:0},{id:'void-25',quantity:1.5}])assert.throws(()=>cartItems({items:[bad]}));
});
test('zero stock and missing migration fail closed; migration never assumes 2000',async()=>{const {env,sql}=setup();sql.exec("UPDATE product_inventory SET stock=0 WHERE product_id='void-stickers'");assert.equal(await accessoryAvailability(env,'void-stickers',1),false);await assert.rejects(reserveAccessories(env,'a'.repeat(64),[{id:'void-stickers',quantity:1}]));assert.equal(sql.prepare('SELECT COUNT(*) n FROM accessory_reservations').get().n,0);sql.exec('DROP TABLE accessory_reservations');assert.equal(await accessoryAvailability(env,'void-stickers',1),false);sql.close();});
test('competing accessory carts cannot oversell; same request reserves once',async()=>{const {env,sql}=setup();const results=await Promise.allSettled(['a','b'].map(c=>reserveAccessories(env,c.repeat(64),[{id:'void-stickers',quantity:75}])));assert.equal(results.filter(r=>r.status==='fulfilled').length,1);await reserveAccessories(env,'a'.repeat(64),[{id:'void-stickers',quantity:75}]);assert.equal(sql.prepare('SELECT SUM(quantity) n FROM accessory_reservations').get().n,75);sql.close();});
test('mixed reservation rolls back both stocks if either stock is unavailable',async()=>{for(const [stock,plate] of [[0,1],[100,25]]){const {env,sql}=setup();sql.prepare("UPDATE product_inventory SET stock=? WHERE product_id='void-stickers'").run(stock);await assert.rejects(reserveAccessories(env,'a'.repeat(64),[{id:'void-stickers',quantity:1}],plate));assert.equal(sql.prepare('SELECT COUNT(*) n FROM stock_reservations').get().n,0);assert.equal(sql.prepare('SELECT COUNT(*) n FROM accessory_reservations').get().n,0);sql.close();}});
test('paid transitions deduplicate and late expiry never restores sold stickers',async()=>{const {env,sql}=setup(),s=session([{id:'recoveryplate4',quantity:1},{id:'void-25',quantity:2}]);await reserveAccessories(env,s.metadata.reservation,physicalItems(JSON.parse(s.metadata.items)),1);await record(env.ORDERS,{id:'evt_paid'},s,'paid');await record(env.ORDERS,{id:'evt_paid'},s,'paid');await record(env.ORDERS,{id:'evt_late'},s,'expired');assert.equal(sql.prepare('SELECT state FROM accessory_reservations').get().state,'paid');assert.equal(sql.prepare('SELECT state FROM stock_reservations').get().state,'paid');assert.equal(sql.prepare('SELECT COUNT(*) n FROM checkout_orders').get().n,1);assert.equal(sql.prepare('SELECT COUNT(*) n FROM checkout_order_items').get().n,2);sql.close();});
for(const state of ['expired','failed'])test(`confirmed ${state} releases sticker stock once`,async()=>{const {env,sql}=setup(),s=session([{id:'void-25',quantity:2}]);await reserveAccessories(env,s.metadata.reservation,[{id:'void-stickers',quantity:50}]);await record(env.ORDERS,{id:'evt_'+state},s,state);await record(env.ORDERS,{id:'evt_'+state},s,state);assert.equal(sql.prepare('SELECT state FROM accessory_reservations').get().state,'released');assert.equal(await accessoryAvailability(env,'void-stickers',100),true);await assert.rejects(record(env.ORDERS,{id:'evt_late_paid'},s,'paid'));sql.close();});
test('activation flags reject accessories before Stripe is called',async()=>{for(const flag of ['ACCESSORIES_ENABLED','ACCESSORIES_PRICES_APPROVED','ACCESSORIES_STOCK_CONFIRMED']){const {env,sql}=setup();await mockStripe(()=>{throw Error('must not call Stripe');},async()=>assert.equal((await create({env:{...env,[flag]:'false'},request:request(env,{items:[{id:'void-1',quantity:1}]})})).status,503));sql.close();}});
test('Stripe rejects incorrect sticker prices before reservations',async()=>{const {env,sql}=setup();await mockStripe(()=>({livemode:false,active:true,currency:'eur',unit_amount:1,type:'one_time'}),async()=>assert.equal((await create({env,request:request(env,{items:[{id:'void-25',quantity:1}]})})).status,503));assert.equal(sql.prepare('SELECT COUNT(*) n FROM accessory_reservations').get().n,0);sql.close();});
test('signed mixed paid webhooks mail exact packs and correct terms once',async()=>{
 const {env,sql}=setup(),s=session([{id:'recoveryplate4',quantity:1},{id:'void-25',quantity:2}]);await reserveAccessories(env,s.metadata.reservation,[{id:'void-stickers',quantity:50}],1);
 const original=globalThis.fetch,mails=[];globalThis.fetch=async(url,options)=>{mails.push(JSON.parse(options.body));return Response.json({id:'fixture'});};
 try{await mockStripe(url=>url.includes('/payment_intents/')?{livemode:false,status:'succeeded',amount_received:s.amount_total,currency:'eur',payment_method:{type:'card'}}:s,async()=>{
 for(const type of ['checkout.session.completed','checkout.session.completed','checkout.session.async_payment_succeeded']){const payload=JSON.stringify({id:'evt_'+type,livemode:false,type,data:{object:s}});assert.equal((await webhook({env,request:new Request(env.SITE_URL,{method:'POST',body:payload,headers:{'stripe-signature':Stripe.webhooks.generateTestHeaderString({payload,secret:env.STRIPE_WEBHOOK_SECRET})}})})).status,200);}
 });assert.equal(mails.length,2);for(const mail of mails)for(const text of ['25 Stück','Menge: 2','11,99 EUR','6,19 EUR','1,10 €','§ 19 UStG'])assert.ok(mail.text.includes(text),text);assert.equal(sql.prepare('SELECT COUNT(*) n FROM order_confirmations').get().n,1);assert.equal(sql.prepare('SELECT quantity FROM accessory_reservations').get().quantity,50);
 }finally{globalThis.fetch=original;sql.close();}
});
test('accessory page has SEO, original photos, shared cart; homepage filters accessories',()=>{const html=readFileSync(new URL('../zubehoer.html',import.meta.url),'utf8');for(const token of ['HODLWARE Zubehör','https://hodlware.de/zubehoer','accessory-grid','accessories.js','1,10 €','6,19 €'])assert.ok(html.includes(token),token);assert.ok(readFileSync(new URL('../assets/app.js',import.meta.url),'utf8').includes('p.category!=="accessories"'));assert.ok(!readFileSync(new URL('../index.html',import.meta.url),'utf8').includes('accessory-grid'));});

for(const units of [1,5,10,25])test(`checkout ${units}: validates price, reserves units and binds session (mocked Stripe)`,async()=>{const {env,sql}=setup();let posted;await mockStripe((url,init)=>{if(url.includes('/prices/'))return {livemode:false,active:true,currency:'eur',unit_amount:({1:99,5:349,10:599,25:1199})[units],type:'one_time'};posted=new URLSearchParams(init.body);return {id:'cs_test_accessory123',livemode:false,url:'https://checkout.stripe.com/c/pay/fixture'};},async()=>assert.equal((await create({env,request:request(env,{items:[{id:`void-${units}`,quantity:2}]})})).status,200));assert.equal(posted.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'),'110');assert.equal(posted.get('line_items[0][quantity]'),'2');const row=sql.prepare('SELECT * FROM accessory_reservations').get();assert.equal(row.quantity,units*2);assert.equal(row.session_id,'cs_test_accessory123');sql.close();});
test('new contract leaves immutable old terms and legacy plate metadata intact',()=>{const old=parameters({SITE_URL:'https://example.test',STRIPE_PRICE_ID:'price_fixture'},1,'hash');assert.equal(old.metadata.contractVersion,'2026-10-11');assert.equal(old.shipping_options[0].shipping_rate_data.fixed_amount.amount,619);});

test('accessory paid race rolls back order and plate transition atomically',async()=>{
 const {env,sql}=setup(),s=session([{id:'recoveryplate4',quantity:1},{id:'void-25',quantity:2}]);await reserveAccessories(env,s.metadata.reservation,[{id:'void-stickers',quantity:50}],1);
 const batch=env.ORDERS.batch;env.ORDERS.batch=async statements=>{sql.exec("UPDATE accessory_reservations SET state='released'");return batch(statements);};
 await assert.rejects(record(env.ORDERS,{id:'evt_accessory_race'},s,'paid'));assert.equal(sql.prepare('SELECT COUNT(*) n FROM checkout_orders').get().n,0);assert.equal(sql.prepare('SELECT state FROM stock_reservations').get().state,'held');sql.close();
});
test('accessory migration is repeatable and preserves existing plate inventory and holds',async()=>{
 const {env,sql}=setup();sql.exec("UPDATE product_inventory SET stock=23 WHERE product_id='recoveryplate4'");await reserve(env,'b'.repeat(64),2);
 sql.exec(readFileSync(new URL('../migrations/0004_accessory_inventory.sql',import.meta.url),'utf8'));assert.equal(sql.prepare("SELECT stock FROM product_inventory WHERE product_id='recoveryplate4'").get().stock,23);assert.equal(sql.prepare('SELECT quantity FROM stock_reservations').get().quantity,2);assert.equal(sql.prepare("SELECT stock FROM product_inventory WHERE product_id='void-stickers'").get().stock,100);sql.close();
});

test('approved package prices and confirmed properties agree across server and public catalog',()=>{
 const ctx={window:{HODL_PRODUCTS:[]}};vm.runInNewContext(readFileSync(new URL('../assets/accessory-products.js',import.meta.url),'utf8'),ctx);
 for(const [units,price] of [[1,99],[5,349],[10,599],[25,1199]]){
  const id='void-'+units,product=CATALOG[id],publicProduct=ctx.window.HODL_PRODUCTS.find(p=>p.id===id);
  assert.equal(product.price,price);assert.equal(publicProduct.price,price/100);assert.equal(product.units,units);assert.equal(product.priceEnv,'STRIPE_PRICE_ID_VOID_'+units);
  assert.equal(product.dimensions.widthCm,5);assert.equal(product.dimensions.heightCm,1);assert.equal(publicProduct.dimensions.widthCm,5);assert.equal(publicProduct.dimensions.heightCm,1);
  for(const text of ['besonders dünnen','kaum auf','unauffällig','Oberfläche','Umgebungsbedingungen'])assert.ok(product.description.includes(text),text);
  assert.ok(product.features.includes('Abmessungen: 5 × 1 cm pro Sticker'));assert.equal(publicProduct.description,product.description);assert.equal(publicProduct.profile,product.profile);assert.ok(!/\d+[.,]?\d*\s*mm/.test(product.description));
  const items=[{id,quantity:2}];assert.equal(subtotal(items),price*2);assert.equal(sessionItems({metadata:{items:JSON.stringify(items)}})[0].unitPrice,price);
 }
});
test('price approval leaves the prepared sale configuration locked and Stripe IDs empty',()=>{
 const example=readFileSync(new URL('../.dev.vars.example',import.meta.url),'utf8');for(const flag of ['ACCESSORIES_ENABLED','ACCESSORIES_PRICES_APPROVED','ACCESSORIES_STOCK_CONFIRMED'])assert.ok(example.includes(flag+'="false"'));for(const n of [1,5,10,25])assert.ok(example.includes('STRIPE_PRICE_ID_VOID_'+n+'=""'));
});
test('storefront explicitly labels package prices and no longer requests price approval',()=>{
 const source=readFileSync(new URL('../assets/accessories.js',import.meta.url),'utf8');assert.ok(source.includes('pro Paket'));assert.ok(readFileSync(new URL('../assets/checkout.js',import.meta.url),'utf8').includes("product.category==='accessories'?'pro Paket':'pro Stück'"));const page=readFileSync(new URL('../zubehoer.html',import.meta.url),'utf8');assert.ok(page.includes('class="accessories-intro"'));assert.ok(source.includes('accessory-selected-price'));assert.ok(!page.includes('Verkauf weiterhin gesperrt'));assert.ok(!page.includes('vor Aktivierung abschließend geprüft'));assert.ok(!page.includes('Preise noch nicht freigegeben'));
});

const initializeConfirmedStock=sql=>sql.exec(readFileSync(new URL('../operations/initialize-void-stock.sql',import.meta.url),'utf8'));
test('confirmed initial stock is 1800 in one physical inventory; reserve 200 is excluded',()=>{
 const {sql}=setup();sql.exec("UPDATE product_inventory SET stock=0 WHERE product_id='void-stickers'");initializeConfirmedStock(sql);
 const stocks=sql.prepare("SELECT product_id,stock FROM product_inventory WHERE product_id LIKE 'void%'").all();assert.equal(stocks.length,1);assert.equal(stocks[0].product_id,'void-stickers');assert.equal(stocks[0].stock,1800);
 for(const n of [1,5,10,25]){assert.equal(CATALOG['void-'+n].stockId,'void-stickers');assert.equal(CATALOG['void-'+n].units,n);}sql.close();
});
test('all four variants consume the same 1800 units with no access to the 200 reserve',async()=>{
 const {env,sql}=setup();sql.exec("UPDATE product_inventory SET stock=0 WHERE product_id='void-stickers'");initializeConfirmedStock(sql);
 const items=[{id:'void-1',quantity:5},{id:'void-5',quantity:1},{id:'void-10',quantity:4},{id:'void-25',quantity:70}];assert.deepEqual(physicalItems(items),[{id:'void-stickers',quantity:1800}]);
 await reserveAccessories(env,'a'.repeat(64),physicalItems(items));assert.equal(sql.prepare('SELECT COUNT(*) n FROM accessory_reservations').get().n,1);assert.equal(sql.prepare('SELECT quantity FROM accessory_reservations').get().quantity,1800);
 for(const n of [1,5,10,25]){assert.equal(await accessoryAvailability(env,'void-stickers',n),false);await assert.rejects(reserveAccessories(env,String(n).padStart(64,'b'),physicalItems([{id:'void-'+n,quantity:1}])));}
 assert.equal(sql.prepare('SELECT SUM(quantity) n FROM accessory_reservations').get().n,1800);sql.close();
});
test('confirmed stock initialization is repeatable and preserves plate stock and active holds',async()=>{
 const {env,sql}=setup();sql.exec("UPDATE product_inventory SET stock=0 WHERE product_id='void-stickers';UPDATE product_inventory SET stock=23 WHERE product_id='recoveryplate4'");initializeConfirmedStock(sql);initializeConfirmedStock(sql);
 await reserveAccessories(env,'a'.repeat(64),[{id:'void-stickers',quantity:50}]);initializeConfirmedStock(sql);
 assert.equal(sql.prepare("SELECT stock FROM product_inventory WHERE product_id='void-stickers'").get().stock,1800);assert.equal(sql.prepare('SELECT quantity FROM accessory_reservations').get().quantity,50);assert.equal(sql.prepare("SELECT stock FROM product_inventory WHERE product_id='recoveryplate4'").get().stock,23);assert.equal(await accessoryAvailability(env,'void-stickers',1750),true);assert.equal(await accessoryAvailability(env,'void-stickers',1751),false);sql.close();
});
test('initialization refuses any existing nonzero inventory or reservation history',async()=>{
 const {env,sql}=setup();initializeConfirmedStock(sql);assert.equal(sql.prepare("SELECT stock FROM product_inventory WHERE product_id='void-stickers'").get().stock,100);
 await reserveAccessories(env,'a'.repeat(64),[{id:'void-stickers',quantity:25}]);sql.exec("UPDATE accessory_reservations SET state='released';UPDATE product_inventory SET stock=0 WHERE product_id='void-stickers'");initializeConfirmedStock(sql);assert.equal(sql.prepare("SELECT stock FROM product_inventory WHERE product_id='void-stickers'").get().stock,0);sql.close();
});
test('competing variant packages cannot reserve beyond the confirmed 1800 physical units',async()=>{
 const {env,sql}=setup();sql.exec("UPDATE product_inventory SET stock=0 WHERE product_id='void-stickers'");initializeConfirmedStock(sql);
 const outcomes=await Promise.allSettled([reserveAccessories(env,'a'.repeat(64),physicalItems([{id:'void-25',quantity:40}])),reserveAccessories(env,'b'.repeat(64),physicalItems([{id:'void-10',quantity:99}]))]);assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);assert.equal(sql.prepare('SELECT SUM(quantity) n FROM accessory_reservations').get().n,1000);sql.close();
});

test('three original photos have optimized responsive files, factual alt text and unchanged proportions',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../artifacts/accessories-review/photo-manifest.json',import.meta.url),'utf8'));
 assert.deepEqual(manifest.photos.map(p=>p.source),['void only white.png','void white with hand.png','void2.png']);
 const photos=CATALOG['void-1'].images;assert.equal(photos.length,3);
 for(const [index,photo] of photos.entries()){
  assert.ok(photo.alt.length>30);assert.ok(!photo.alt.includes('Platzhalter'));assert.match(manifest.photos[index].sourceSha256,/^[a-f0-9]{64}$/);
  for(const output of manifest.photos[index].outputs){const bytes=readFileSync(new URL('../'+output.file,import.meta.url));assert.equal(bytes.length,output.bytes);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.ok(Math.abs(output.width/output.height-manifest.photos[index].sourceWidth/manifest.photos[index].sourceHeight)<0.02);assert.ok(output.bytes<manifest.photos[index].sourceBytes/5);}
  for(const file of [photo.src,photo.small,photo.thumb])assert.ok(readFileSync(new URL('../'+file,import.meta.url)).length>0);
 }
 const source=readFileSync(new URL('../assets/accessories.js',import.meta.url),'utf8');assert.ok(!source.includes('photo-placeholder'));assert.ok(!source.includes('PRODUKTFOTO FOLGT'));
 const ctx={window:{HODL_PRODUCTS:[]}};vm.runInNewContext(readFileSync(new URL('../assets/accessory-products.js',import.meta.url),'utf8'),ctx);for(const variant of ctx.window.HODL_PRODUCTS){assert.equal(variant.images.length,3);assert.equal(variant.image,photos[0].src);assert.equal(variant.imageAlt,photos[0].alt);}
});
test('accessory SEO and sitemap identify the original photos without claiming active offers',()=>{
 const html=readFileSync(new URL('../zubehoer.html',import.meta.url),'utf8');assert.ok(html.includes('https://hodlware.de/zubehoer'));assert.ok(readFileSync(new URL('../sitemap.xml',import.meta.url),'utf8').includes('<loc>https://hodlware.de/zubehoer</loc>'));
 const data=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert.equal(data['@type'],'CollectionPage');const product=data.mainEntity.itemListElement[0].item;assert.equal(product.image.length,3);assert.equal(product.offers,undefined);assert.ok(!html.includes('InStock'));
});
test('sticker-only order mail has package price, confirmed shipping and legal notice once per recipient',async()=>{
 const {env,sql}=setup(),s=session([{id:'void-25',quantity:2}]);await queueOrder(env,s,'card');await queueOrder(env,s,'card');
 const rows=sql.prepare('SELECT payload FROM mail_outbox').all();assert.equal(rows.length,2);for(const row of rows){const mail=JSON.parse(row.payload);for(const text of ['25 Stück','Menge: 2','11,99 EUR','23,98 EUR','1,10 EUR','25,08 EUR','Basis-Sendungsverfolgung','§ 19 UStG'])assert.ok(mail.text.includes(text),text);assert.ok(!mail.text.includes('6,19 EUR'));assert.ok(!mail.text.includes('lückenloses Tracking'));}sql.close();
});
test('confirmed brief service label does not change the fixed shipping amounts',()=>{
 const {env,sql}=setup();const sticker=parameters(env,[{id:'void-1',quantity:1}],'fixture'),mixed=parameters(env,[{id:'void-1',quantity:1},{id:'seedplate',quantity:1}],'fixture');assert.equal(sticker.shipping_options[0].shipping_rate_data.fixed_amount.amount,110);assert.ok(sticker.shipping_options[0].shipping_rate_data.display_name.includes('Basis-Sendungsverfolgung'));assert.equal(mixed.shipping_options.length,1);assert.equal(mixed.shipping_options[0].shipping_rate_data.fixed_amount.amount,619);assert.equal(mixed.shipping_options[0].shipping_rate_data.display_name,'DHL Standardversand Deutschland');sql.close();
});
