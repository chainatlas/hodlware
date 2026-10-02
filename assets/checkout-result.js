(() => {
const title=document.querySelector('[data-result-title]');if(!title)return;
const message=document.querySelector('[data-result-message]'),summary=document.querySelector('[data-order-summary]'),invoice=document.querySelector('[data-invoice]'),retry=document.querySelector('[data-recheck]');
const badge=document.querySelector('[data-test-badge]'),successIcon=document.querySelector('[data-success-icon]'),confirmedCopy=document.querySelector('[data-confirmed-copy]');
const productList=document.querySelector('[data-order-products]');
function renderProducts(data){
 // The existing single-product API allowlists seedplate. Future verified item
 // IDs can reuse this renderer; catalog data supplies names/images, never totals.
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
 // This API currently verifies sandbox sessions only; a future live response
 // must explicitly supply livemode=true. Never infer mode from browser storage.
 const live=data.livemode===true;
 message.textContent=live?'Deine Zahlung wurde erfolgreich bestätigt.':'Deine Testzahlung wurde erfolgreich von Stripe bestätigt.';
 badge.hidden=live;successIcon.hidden=false;confirmedCopy.hidden=false;retry.hidden=true;
 renderProducts(data);summary.replaceChildren();summary.hidden=false;
 for(const [label,value] of [['Zwischensumme',euro(data.subtotal/100)],['Rabatt',euro(data.discount/100)],['DHL Versand',euro(data.shipping/100)],['Gesamt',euro(data.total/100)]]){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');if(label==='Gesamt')row.className='confirmation-total';dt.textContent=label;dd.textContent=value;row.append(dt,dd);summary.append(row);}
 if(data.invoiceUrl){invoice.href=data.invoiceUrl;invoice.hidden=false;}
 try{const attempt=JSON.parse(sessionStorage.getItem('hwcheckout-attempt'));if(attempt?.sessionId===sessionId && attempt.quantity===data.quantity && cart.length===data.quantity){cart=[];save();}if(attempt?.sessionId===sessionId)sessionStorage.removeItem('hwcheckout-attempt');}catch{}
 }catch(error){title.textContent='Zahlung nicht bestätigt.';message.textContent=error.message;}finally{retry.disabled=false;}}
retry.onclick=check;check();
})();
