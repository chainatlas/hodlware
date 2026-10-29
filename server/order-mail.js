import {CATALOG,sessionItems} from './catalog.js';
import {OPERATOR,emailOK} from './mail.js';
import {CONTRACTS} from './contract-text.js';
const euro=n=>(n/100).toFixed(2).replace('.',',')+' EUR';
export async function queueOrder(env,s,paymentMethod){
 const prior=await env.ORDERS.prepare('SELECT order_number FROM order_confirmations WHERE session_id=?').bind(s.id).first();if(prior)return prior.order_number;
 const legal=CONTRACTS[s.metadata?.contractVersion];if(!legal)throw Error('unversioned contract');
 const ship=s.collected_information?.shipping_details||s.shipping_details;
 const email=s.customer_details?.email;
 if(!emailOK(email)||!ship?.address||!ship.name||!paymentMethod)throw Error('incomplete order');
 const number='HW-'+crypto.randomUUID().toUpperCase();
 const address=[ship.name,ship.address.line1,ship.address.line2,[ship.address.postal_code,ship.address.city].filter(Boolean).join(' '),ship.address.country].filter(Boolean).join('\n');
 const items=sessionItems(s);
 const lines=items.map(item=>`${item.name}\n${CATALOG[item.id].description}\nArtikel: ${item.id}\nMenge: ${item.quantity}\nEinzelpreis: ${euro(item.unitPrice)}`).join('\n\n');
 const text=`Bestell- und Vertragsbestätigung\nBestellnummer: ${number}\nHODLWARE – Steffen Reizner, Einzelunternehmen\nBreite Str. 4, 91166 Georgensgmünd, Deutschland\n${OPERATOR}\n\n${lines}\nZwischensumme: ${euro(s.amount_subtotal)}\nRabatt: ${euro(s.total_details.amount_discount)}\nDHL Versand: ${euro(s.total_details.amount_shipping)}\nGesamt: ${euro(s.amount_total)}\nGemäß § 19 UStG ohne Ausweis der Umsatzsteuer.\nZahlungsart: ${paymentMethod}\nLieferzeit: 2–4 Werktage nach erfolgreicher Zahlung.\nLieferanschrift:\n${address}\n\nDeine Zahlung wurde erfolgreich bestätigt.\n\nAllgemeine Geschäftsbedingungen und Widerrufsunterlagen (${s.metadata.contractVersion}):\n${legal}`;
 const now=new Date().toISOString();
 // Both recipients and the immutable contract snapshot enter D1 in the same transaction.
 await env.ORDERS.batch([
  env.ORDERS.prepare('INSERT OR IGNORE INTO order_confirmations(session_id,order_number,snapshot,created_at) VALUES(?,?,?,?)').bind(s.id,number,JSON.stringify({email,text,items}),now),
  ...[{suffix:'customer',to:email},{suffix:'operator',to:OPERATOR}].map(({suffix,to})=>env.ORDERS.prepare('INSERT OR IGNORE INTO mail_outbox(id,payload,created_at) SELECT ?,?,? FROM order_confirmations WHERE session_id=? AND order_number=?').bind('order-'+s.id+'-'+suffix,JSON.stringify({from:env.MAIL_FROM,to:[to],reply_to:OPERATOR,subject:'HODLWARE: Bestellbestätigung '+number,text}),Date.now(),s.id,number))
 ]);
 return (await env.ORDERS.prepare('SELECT order_number FROM order_confirmations WHERE session_id=?').bind(s.id).first()).order_number;
}
