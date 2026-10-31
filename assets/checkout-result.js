(() => {
const title=document.querySelector('[data-result-title]');if(!title)return;
const message=document.querySelector('[data-result-message]'),summary=document.querySelector('[data-order-summary]'),invoice=document.querySelector('[data-invoice]'),retry=document.querySelector('[data-recheck]');
const successIcon=document.querySelector('[data-success-icon]'),confirmedCopy=document.querySelector('[data-confirmed-copy]');
const productList=document.querySelector('[data-order-products]');
function renderProducts(data){
 // Verified server item IDs select catalog photos; totals come only from Stripe.
 const items=Array.isArray(data.items)?data.items:[{id:'seedplate',quantity:data.quantity}];
 productList.replaceChildren();
 for(const item of items){
  const product=HODL_PRODUCTS.find(product=>product.id===item.id);
  if(!product || !Number.isInteger(item.quantity) || item.quantity<1)continue;
  const row=document.createElement('div');row.className='confirmation-product';
  if(product.image){const frame=document.createElement('div'),image=document.createElement('img');frame.className='confirmation-product-image';image.src=product.image;image.alt=product.imageAlt||product.name;image.width=96;image.height=96;frame.append(image);row.append(frame);}
  const copy=document.createElement('div'),name=document.createElement('h2'),quantity=document.createElement('p');copy.className='confirmation-product-copy';name.textContent=product.name;quantity.textContent=`Menge: ${item.quantity}`;copy.append(name,quantity);row.append(copy);productList.append(row);
 }
 productList.hidden=!productList.childElementCount;
}
const sessionId=new URLSearchParams(location.search).get('session_id');history.replaceState(null,'',location.pathname);
async function check(){retry.disabled=true;try{
 if(!sessionId)throw Error('Keine gültige Checkout-Session vorhanden.');
 const response=await fetch('/api/checkout-status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId})});const data=await response.json();if(!response.ok)throw Error(data.error||'Status nicht verfügbar.');
 if(data.state!=='paid'){title.textContent='Zahlung noch nicht bestätigt.';message.textContent='Bei verzögerten Zahlungsarten kann die Bestätigung später eintreffen. Bitte prüfe den Status erneut.';return;}
 title.textContent='Vielen Dank für deine Bestellung.';
 message.textContent='Deine Zahlung wurde erfolgreich bestätigt.';
 const emailStatus=document.querySelector('[data-email-status]');if(emailStatus)emailStatus.textContent=data.confirmationQueued?'Deine Bestellbestätigung wird per E-Mail versendet.':'Bei Fragen zu deiner Bestellung kontaktiere uns bitte per E-Mail.';
 successIcon.hidden=false;confirmedCopy.hidden=false;retry.hidden=true;
 renderProducts(data);summary.replaceChildren();summary.hidden=false;
 for(const [label,value] of [['Zwischensumme',euro(data.subtotal/100)],['Rabatt',euro(data.discount/100)],['Versand',euro(data.shipping/100)],['Gesamt',euro(data.total/100)]]){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');if(label==='Gesamt')row.className='confirmation-total';dt.textContent=label;dd.textContent=value;row.append(dt,dd);summary.append(row);}
 if(data.invoiceUrl){invoice.href=data.invoiceUrl;invoice.hidden=false;}
 try{const attempt=JSON.parse(sessionStorage.getItem('hwcheckout-attempt'));if(attempt?.sessionId===sessionId && ((attempt.fingerprint && attempt.fingerprint===JSON.stringify(cartItems()) && attempt.fingerprint===JSON.stringify(data.items.map(({id,quantity})=>({id,quantity})))) || (!attempt.fingerprint && attempt.quantity===data.quantity && cart.every(id=>id==='seedplate') && cart.length===data.quantity))){cart=[];save();}if(attempt?.sessionId===sessionId)sessionStorage.removeItem('hwcheckout-attempt');}catch{}
 }catch(error){title.textContent='Zahlung nicht bestätigt.';message.textContent=error.message;}finally{retry.disabled=false;}}
retry.onclick=check;check();
})();
