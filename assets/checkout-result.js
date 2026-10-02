(() => {
const title=document.querySelector('[data-result-title]');if(!title)return;
const message=document.querySelector('[data-result-message]'),summary=document.querySelector('[data-order-summary]'),invoice=document.querySelector('[data-invoice]'),retry=document.querySelector('[data-recheck]');
const badge=document.querySelector('[data-test-badge]'),successIcon=document.querySelector('[data-success-icon]'),confirmedCopy=document.querySelector('[data-confirmed-copy]');
const sessionId=new URLSearchParams(location.search).get('session_id');history.replaceState(null,'',location.pathname);
async function check(){retry.disabled=true;try{
 if(!sessionId)throw Error('Keine gÃ¼ltige Checkout-Session vorhanden.');
 const response=await fetch('/api/checkout-status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId})});const data=await response.json();if(!response.ok)throw Error(data.error||'Status nicht verfÃ¼gbar.');
 if(data.state!=='paid'){title.textContent='Zahlung noch nicht bestÃ¤tigt.';message.textContent='Bei verzÃ¶gerten Zahlungsarten kann die BestÃ¤tigung spÃ¤ter eintreffen. Bitte prÃ¼fe den Status erneut.';return;}
 title.textContent='Vielen Dank fÃ¼r deine Bestellung.';message.textContent='Deine Testzahlung wurde von Stripe bestÃ¤tigt.';summary.replaceChildren();summary.hidden=false;
 for(const [label,value] of [['Menge',data.quantity],['Zwischensumme',euro(data.subtotal/100)],['Rabatt',euro(data.discount/100)],['DHL Versand',euro(data.shipping/100)],['Gesamt',euro(data.total/100)]]){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');if(label==='Gesamt')row.className='confirmation-total';dt.textContent=label;dd.textContent=value;row.append(dt,dd);summary.append(row);}
 if(data.invoiceUrl){invoice.href=data.invoiceUrl;invoice.hidden=false;}
 try{const attempt=JSON.parse(sessionStorage.getItem('hwcheckout-attempt'));if(attempt?.sessionId===sessionId && attempt.quantity===data.quantity && cart.length===data.quantity){cart=[];save();}if(attempt?.sessionId===sessionId)sessionStorage.removeItem('hwcheckout-attempt');}catch{}
 }catch(error){title.textContent='Zahlung nicht bestÃ¤tigt.';message.textContent=error.message;}finally{retry.disabled=false;}}
retry.onclick=check;check();
})();
