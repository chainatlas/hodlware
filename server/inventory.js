export async function availability(env){
 if(env.PLATE4_ENABLED!=='true' || !/^price_/.test(env.STRIPE_PRICE_ID_PLATE4||'') || env.STRIPE_PRICE_ID_PLATE4===env.STRIPE_PRICE_ID)return {available:false,quantity:0};
 try{
  const row=await env.ORDERS.prepare(`SELECT stock-COALESCE((SELECT SUM(quantity) FROM stock_reservations WHERE product_id='recoveryplate4' AND state IN ('held','paid')),0) AS remaining FROM product_inventory WHERE product_id='recoveryplate4'`).first();
  return {available:Number.isInteger(row?.remaining)&&row.remaining>0,quantity:Math.max(0,row?.remaining||0)};
 }catch{return {available:false,quantity:0};}
}
export async function reserve(env,key,n){
 // One atomic INSERT ... SELECT prevents concurrent overselling. Retrying the
 // same cart uses the same reservation and Stripe idempotency key.
 await env.ORDERS.prepare(`INSERT OR IGNORE INTO stock_reservations(reservation_id,product_id,quantity,created_at)
 SELECT ?,'recoveryplate4',?,? FROM product_inventory WHERE product_id='recoveryplate4'
 AND stock-COALESCE((SELECT SUM(quantity) FROM stock_reservations WHERE product_id='recoveryplate4' AND state IN ('held','paid')),0)>=?`).bind(key,n,Math.floor(Date.now()/1000),n).run();
 const row=await env.ORDERS.prepare('SELECT * FROM stock_reservations WHERE reservation_id=?').bind(key).first();
 if(!row || row.quantity!==n || row.state!=='held' || Date.now()/1000-row.created_at>1800)throw Error('stock');
 return row;
}
export async function bindReservation(env,key,sessionId){
 await env.ORDERS.prepare(`UPDATE stock_reservations SET session_id=? WHERE reservation_id=? AND (session_id IS NULL OR session_id=?)`).bind(sessionId,key,sessionId).run();
}
export async function inventoryStatement(db,s,state){
 const key=s.metadata?.reservation;
 if(!key || !/^[a-f0-9]{64}$/.test(key))throw Error('reservation');
 const row=await db.prepare('SELECT * FROM stock_reservations WHERE reservation_id=?').bind(key).first();
 const n=JSON.parse(s.metadata.items).find(item=>item.id==='recoveryplate4')?.quantity;
 if(!row || row.product_id!=='recoveryplate4' || row.quantity!==n || (row.session_id && row.session_id!==s.id) || (state==='paid' && row.state==='released'))throw Error('reservation');
 // Never release stock merely on a browser cancellation or a timer. Stripe
 // must confirm expiry or async failure. Paid is terminal, including retries.
 const next=state==='paid'?'paid':['expired','failed'].includes(state)?'released':'held';
 return db.prepare(`UPDATE stock_reservations SET session_id=?,state=CASE WHEN state='paid' THEN 'paid' WHEN ?='paid' THEN 'paid' WHEN state='released' THEN 'released' ELSE ? END WHERE reservation_id=?`).bind(s.id,next,next,key);
}
