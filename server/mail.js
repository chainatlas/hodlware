export const OPERATOR='steffenreizner@web.de';
export const emailOK=value=>typeof value==='string' && value.length<=254 && /^[^\s<>@\r\n]+@[^\s<>@\r\n]+\.[^\s<>@\r\n]+$/.test(value);
export function mailConfigured(env){return env.COMMUNICATIONS_ENABLED==='true' && !!env.ORDERS && typeof env.RESEND_API_KEY==='string' && env.RESEND_API_KEY.length>0 && emailOK(env.MAIL_FROM);}
export function mailInsert(db,id,payload,now=Date.now()){
 return db.prepare('INSERT OR IGNORE INTO mail_outbox(id,payload,created_at) VALUES(?,?,?)').bind(id,JSON.stringify(payload),now);
}
// Payload is frozen in D1; lease + provider idempotency cover concurrent delivery and crash recovery.
export async function deliver(env,id,send=fetch,now=Date.now()){
 if(!mailConfigured(env))return false;
 const row=await env.ORDERS.prepare(`UPDATE mail_outbox SET state='sending',lease_until=?,first_attempt=COALESCE(first_attempt,?),attempts=attempts+1 WHERE id=? AND state IN ('pending','sending') AND lease_until<=? AND next_attempt<=? RETURNING *`).bind(now+60000,now,id,now,now).first();
 if(!row)return (await env.ORDERS.prepare('SELECT state FROM mail_outbox WHERE id=?').bind(id).first())?.state==='sent';
 // Resend deduplicates for 24h. Never blindly retry an ambiguous send beyond that window.
 if(now-row.first_attempt>=23*3600000){await env.ORDERS.prepare("UPDATE mail_outbox SET state='review',lease_until=0 WHERE id=?").bind(id).run();return false;}
 try{
  const response=await send('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':id},body:row.payload,signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('mail');
  const result=await response.json();if(typeof result.id!=='string')throw Error('mail');
  await env.ORDERS.prepare("UPDATE mail_outbox SET state='sent',provider_id=?,lease_until=0 WHERE id=?").bind(result.id,id).run();return true;
 }catch{
  await env.ORDERS.prepare("UPDATE mail_outbox SET state='pending',lease_until=0,next_attempt=? WHERE id=?").bind(now+Math.min(300000,30000*2**Math.min(row.attempts,4)),id).run();return false;
 }
}
export async function drain(env){
 if(!mailConfigured(env))return;
 const now=Date.now();
 const rows=await env.ORDERS.prepare("SELECT id FROM mail_outbox WHERE state IN ('pending','sending') AND next_attempt<=? AND lease_until<=? ORDER BY created_at LIMIT 20").bind(now,now).all();
 for(const row of rows.results)await deliver(env,row.id);
 await env.ORDERS.prepare('DELETE FROM form_limits WHERE expires<?').bind(now).run();
 // Counts only: no personal data or exceptions in operational logs.
 const health=await env.ORDERS.prepare("SELECT COUNT(*) AS total FROM mail_outbox WHERE state!='sent' AND created_at<?").bind(now-300000).first();
 if(health.total)console.warn('MAIL_BACKLOG',health.total);
}
