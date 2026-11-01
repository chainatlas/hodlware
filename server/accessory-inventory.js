import {reservationItems} from './seedplate-inventory.js';
import {physicalItems} from './catalog.js';
export async function accessoryAvailability(env,id,units){
 if(env.ACCESSORIES_PRICES_APPROVED!=='true'||env.ACCESSORIES_STOCK_CONFIRMED!=='true')return false;
 try{const row=await env.ORDERS.prepare("SELECT stock-COALESCE((SELECT SUM(quantity) FROM accessory_reservations WHERE product_id=? AND state IN ('held','paid')),0) AS remaining FROM product_inventory WHERE product_id=?").bind(id,id).first();return row?.remaining>=units;}catch{return false;}
}
export async function reserveAccessories(env,key,items,plate=0){
 const now=Math.floor(Date.now()/1000),db=env.ORDERS,statements=[];
 if(plate)statements.push(db.prepare(`INSERT OR IGNORE INTO stock_reservations(reservation_id,product_id,quantity,created_at) SELECT ?,'recoveryplate4',?,? FROM product_inventory WHERE product_id='recoveryplate4' AND stock-COALESCE((SELECT SUM(quantity) FROM stock_reservations WHERE product_id='recoveryplate4' AND state IN ('held','paid')),0)>=?`).bind(key,plate,now,plate));
 for(const item of items)statements.push(db.prepare('INSERT OR IGNORE INTO accessory_reservations(reservation_id,product_id,quantity,created_at,plate_quantity) VALUES(?,?,?,?,?)').bind(key,item.id,item.quantity,now,plate));
 await db.batch(statements);
 let result;
 for(const item of items){const row=await db.prepare('SELECT * FROM accessory_reservations WHERE reservation_id=? AND product_id=?').bind(key,item.id).first();if(!row||row.quantity!==item.quantity||row.plate_quantity!==plate||row.state!=='held'||now-row.created_at>1800)throw Error('stock');result=row;}
 return result;
}
export async function bindAccessories(env,key,id){await env.ORDERS.prepare('UPDATE accessory_reservations SET session_id=? WHERE reservation_id=? AND (session_id IS NULL OR session_id=?)').bind(id,key,id).run();}
export async function accessoryStatements(db,s,state){
 const items=reservationItems(JSON.parse(s.metadata?.items||'[]'),s.metadata?.stockVersion);if(!items.length)return [];
 const key=s.metadata.reservation;if(!/^[a-f0-9]{64}$/.test(key||''))throw Error('reservation');
 const statements=[];
 for(const item of items){const row=await db.prepare('SELECT * FROM accessory_reservations WHERE reservation_id=? AND product_id=?').bind(key,item.id).first();if(!row||row.quantity!==item.quantity||(row.session_id&&row.session_id!==s.id)||(state==='paid'&&row.state==='released'))throw Error('reservation');
 const next=state==='paid'?'paid':['expired','failed'].includes(state)?'released':'held';
 statements.push(db.prepare("UPDATE accessory_reservations SET session_id=?,state=CASE WHEN state='paid' THEN 'paid' WHEN ?='paid' THEN 'paid' WHEN state='released' THEN 'released' ELSE ? END WHERE reservation_id=? AND product_id=?").bind(s.id,next,next,key,item.id));}
 return statements;
}
