import {physicalItems} from './catalog.js';
export const SEED_STOCK_VERSION='seedplate-v1';
export const seedMode=env=>env.SEEDPLATE_STOCK_MODE||'legacy';
export function reservationItems(items,version){const result=physicalItems(items);if(version===SEED_STOCK_VERSION){const seed=items.find(i=>i.id==='seedplate');if(seed)result.push({id:'seedplate',quantity:seed.quantity});}return result;}
export async function seedplateAvailability(env){
 const mode=seedMode(env);if(mode==='legacy')return true;if(mode!=='managed')return false;
 try{const row=await env.ORDERS.prepare("SELECT i.stock-COALESCE((SELECT SUM(quantity) FROM accessory_reservations WHERE product_id='seedplate' AND state IN ('held','paid')),0) AS remaining FROM product_inventory i JOIN inventory_controls c USING(product_id) WHERE i.product_id='seedplate' AND c.state='ready' AND c.legacy_sessions_cleared=1").first();return Number.isSafeInteger(row?.remaining)&&row.remaining>0;}catch{return false;}
}
// Unknown late legacy commitments are not silently subtracted from a fresh count.
// Preserve order processing, but stop new sales until reconciled. Paid retries don't count twice.
export function legacySeedReview(db,s,state){
 const items=s.metadata?.items?JSON.parse(s.metadata.items):[{id:'seedplate',quantity:Number(s.metadata?.quantity)}];
 if(s.metadata?.stockVersion===SEED_STOCK_VERSION||!items.some(i=>i.id==='seedplate')||!['paid','pending'].includes(state))return [];
 return [db.prepare("UPDATE inventory_controls SET state='review' WHERE product_id='seedplate' AND state='ready' AND NOT EXISTS(SELECT 1 FROM checkout_orders WHERE session_id=? AND state='paid')").bind(s.id)];
}
