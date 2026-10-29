import {mailConfigured,deliver,emailOK,OPERATOR} from './mail.js';
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function origin(env){const u=new URL(env.SITE_URL);if(u.pathname!=='/'||u.search||u.hash||u.username||u.password||(u.protocol!=='https:'&&!(u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname))))throw Error('config');return u.origin;}
export async function available(env){
 if(!mailConfigured(env)||env.FORMS_ENABLED!=='true'||typeof env.RATE_LIMIT_SECRET!=='string'||env.RATE_LIMIT_SECRET.length<32||env.MAIL_WORKER_READY!=='true')return false;
 try{origin(env);await env.ORDERS.prepare('SELECT id FROM submissions LIMIT 1').first();await env.ORDERS.prepare('SELECT id FROM mail_outbox LIMIT 1').first();await env.ORDERS.prepare('SELECT key FROM form_limits LIMIT 1').first();return true;}catch{return false;}
}
export async function formContext({env}){return reply({ready:await available(env)});}
export function validate(data,kind){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('input');
 const field=kind==='withdrawal'?'contractId':'message';
 if(Object.keys(data).some(k=>!['name','email',field,'website','requestId'].includes(k)))throw Error('input');
 if(typeof data.name!=='string'||!data.name.trim()||data.name.length>200||/[\x00-\x1f]/.test(data.name)||!emailOK(data.email)||typeof data[field]!=='string'||!data[field].trim()||data[field].length>(kind==='withdrawal'?500:5000)||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(data[field])||data.website!==''||!/^[-a-f0-9]{36}$/.test(data.requestId||''))throw Error('input');
 return {name:data.name.trim(),email:data.email.trim(),[field]:data[field].trim()};
}
async function hash(text){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
async function rate(env,request,kind){
 const ip=request.headers.get('CF-Connecting-IP');if(!ip)return false;
 const now=Date.now(),hour=Math.floor(now/3600000);
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.RATE_LIMIT_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const digest=[...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${kind}:${hour}:${ip}`)))].map(n=>n.toString(16).padStart(2,'0')).join('');
 const row=await env.ORDERS.prepare('INSERT INTO form_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<20 RETURNING count').bind(digest,now+7200000).first();return !!row;
}
export async function submit({request,env},kind){
 if(!await available(env))return reply({error:'Die elektronische Übermittlung ist derzeit nicht verfügbar. Bitte kontaktiere uns per E-Mail oder Post.'},503);
 let data,clean;
 try{
  if(request.method!=='POST'||request.headers.get('origin')!==origin(env)||!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'Ungültige Anfrage.'},403);
  const reader=request.body?.getReader();if(!reader)throw Error();let size=0,chunks=[];
  for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>24576){await reader.cancel();return reply({error:'Anfrage zu groß.'},413);}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}data=JSON.parse(new TextDecoder().decode(bytes));clean=validate(data,kind);
 }catch{return reply({error:'Bitte prüfe die Pflichtfelder und Eingabelängen.'},400);}
 try{
  if(!await rate(env,request,kind))return reply({error:'Zu viele Anfragen. Bitte versuche es später erneut oder nutze E-Mail bzw. Post.'},429);
  const id=kind+'-'+data.requestId, fingerprint=await hash(JSON.stringify(clean)), receivedAt=new Date().toISOString();
  const declaration=kind==='withdrawal'?`Hiermit widerrufe ich den folgenden Vertrag bzw. Vertragsteil: ${clean.contractId}`:clean.message;
  const payload={...clean,declaration};
  const text=`HODLWARE – ${kind==='withdrawal'?'Eingangsbestätigung deines Widerrufs':'Kontaktanfrage'}\nReferenz: ${id}\nEingang: ${receivedAt} (UTC)\nName: ${clean.name}\nE-Mail: ${clean.email}\n\n${declaration}\n\nSteffen Reizner · HODLWARE\nBreite Str. 4, 91166 Georgensgmünd, Deutschland\n${OPERATOR}`;
  const messages=[{id:id+'-operator',to:OPERATOR,subject:kind==='withdrawal'?'HODLWARE: Widerruf eingegangen':'HODLWARE: Kontaktanfrage',reply_to:clean.email}];
  if(kind==='withdrawal')messages.push({id:id+'-customer',to:clean.email,reply_to:OPERATOR,subject:'HODLWARE: Eingang deines Widerrufs'});
  // INSERT…SELECT uses the stored receipt, never a later retry timestamp or changed payload.
  await env.ORDERS.batch([
   env.ORDERS.prepare('INSERT OR IGNORE INTO submissions(id,kind,fingerprint,payload,received_at) VALUES(?,?,?,?,?)').bind(id,kind,fingerprint,JSON.stringify(payload),receivedAt),
   ...messages.map(m=>env.ORDERS.prepare('INSERT OR IGNORE INTO mail_outbox(id,payload,created_at) SELECT ?,?,? FROM submissions WHERE id=? AND fingerprint=? AND received_at=?').bind(m.id,JSON.stringify({from:env.MAIL_FROM,to:[m.to],subject:m.subject,text,...(m.reply_to?{reply_to:m.reply_to}:{})}),Date.now(),id,fingerprint,receivedAt))
  ]);
  const stored=await env.ORDERS.prepare('SELECT fingerprint,received_at FROM submissions WHERE id=?').bind(id).first();
  if(stored.fingerprint!==fingerprint)return reply({error:'Die Anfrage-ID wurde bereits verwendet. Bitte lade das Formular neu.'},409);
  let customerSent=false;
  for(const m of messages){try{const sent=await deliver(env,m.id);if(m.id.endsWith('-customer'))customerSent=sent;}catch{/* Durable outbox remains for the worker. */}}
  return reply({received:true,id,receivedAt:stored.received_at,message:kind==='withdrawal'?`Dein Widerruf ist bei uns eingegangen und gespeichert. ${customerSent?'Die Eingangsbestätigung wurde an den E-Mail-Dienst übergeben.':'Die Eingangsbestätigung wird per E-Mail versendet; der Versand ist noch ausstehend.'}`:'Deine Kontaktanfrage ist bei uns eingegangen und gespeichert.'});
 }catch{return reply({error:'Die Übermittlung konnte nicht bestätigt werden. Bitte erneut versuchen oder uns per E-Mail bzw. Post kontaktieren.'},503);}
}
