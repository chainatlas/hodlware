(() => {
const title=document.querySelector('[data-result-title]');if(!title)return;
const message=document.querySelector('[data-result-message]'),summary=document.querySelector('[data-order-summary]'),invoice=document.querySelector('[data-invoice]'),retry=document.querySelector('[data-recheck]');
const sessionId=new URLSearchParams(location.search).get('session_id');history.replaceState(null,'',location.pathname);
async function check(){retry.disabled=true;try{
 if(!sessionId)throw Error('Keine gültige Checkout-Session vorhanden.');
 const response=await fetch('/api/checkout-status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId})});const data=await response.json();if(!response.ok)throw Error(data.error||'Status nicht verfügbar.');
 if(data.state!=='paid'){title.textContent='Zahlung noch nicht bestätigt.';message.textContent='Bei verzögerten Zahlungsarten kann die Bestätigung später eintreffen. Bitte prüfe den Status erneut.';return;}
 title.textContent='Vielen Dank für deine Bestellung.';message.textContent='Deine Testzahlung wurde von Stripe bestätigt.';summary.replaceChildren();summary.hidden=false;
 for(const [label,value] of [['Menge',data.quantity],['Zwischensumme',euro(data.subtotal/100)],['Rabatt',euro(data.discount/100)],['Versand',euro(data.shipping/100)],['Gesamt',euro(data.total/100)]]){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);summary.append(row);}
 if(data.invoiceUrl){invoice.href=data.invoiceUrl;invoice.hidden=false;}
 try{const attempt=JSON.parse(sessionStorage.getItem('hwcheckout-attempt'));if(attempt?.sessionId===sessionId && attempt.quantity===data.quantity && cart.length===data.quantity){cart=[];save();}if(attempt?.sessionId===sessionId)sessionStorage.removeItem('hwcheckout-attempt');}catch{}
 }catch(error){title.textContent='Zahlung nicht bestätigt.';message.textContent=error.message;}finally{retry.disabled=false;}}
retry.onclick=check;check();
})();
