(() => {
const panel=document.getElementById('drawer');
panel.querySelector('h3').remove();panel.querySelector('.disabled').remove();
const controls=document.createElement('div');controls.className='checkout-controls';
controls.innerHTML=`<dl><div><dt>Zwischensumme</dt><dd data-subtotal></dd></div><div><dt>Versand · Deutschland</dt><dd data-shipping></dd></div><div><dt>Gesamt</dt><dd id="total"></dd></div></dl><p>Lieferzeit: 2–4 Werktage nach erfolgreicher Zahlung.</p><p>Preise gemäß § 19 UStG ohne Ausweis der Umsatzsteuer.</p><p><a href="agb.html">AGB</a> · <a href="widerruf.html">Widerruf</a> · <a href="datenschutz.html">Datenschutz</a> · <a href="versand-zahlung.html">Versand &amp; Zahlung</a></p><button type="button" class="checkout-start">Zur Kasse →</button><p class="checkout-message" role="status"></p>`;
panel.append(controls);
const button=controls.querySelector('button'),message=controls.querySelector('.checkout-message');let busy=false;
function render(){
 const n=cart.length,lines=cartItems(),items=panel.querySelector('#cartitems');items.replaceChildren();
 for(const item of lines){
  const product=P.find(p=>p.id===item.id),line=document.createElement('div');line.className='cartline';
  const name=document.createElement('p');name.textContent=product.name;line.append(name);
  const price=document.createElement('p');price.textContent=`${euro(product.price)} pro Stück`;line.append(price);
  const label=document.createElement('label');label.textContent='Menge ';const input=document.createElement('input');input.type='number';input.min='1';input.max=String(99-(n-item.quantity));input.step='1';input.value=String(item.quantity);input.setAttribute('aria-label','Menge: '+product.name);input.disabled=busy;
  input.addEventListener('change',()=>{const count=Number(input.value);if(Number.isInteger(count)&&count>=1&&count<=Number(input.max)){cart=cart.filter(id=>id!==item.id).concat(Array(count).fill(item.id));save();}else input.value=String(item.quantity);});label.append(input);line.append(label);
  const remove=document.createElement('button');remove.type='button';remove.textContent='Entfernen';remove.disabled=busy;remove.onclick=()=>{cart=cart.filter(id=>id!==item.id);save();};line.append(remove);items.append(line);
 }
 if(!n)items.textContent='Dein Warenkorb ist leer.';
 const subtotal=lines.reduce((sum,item)=>sum+Math.round(P.find(p=>p.id===item.id).price*100)*item.quantity,0);
 controls.querySelector('[data-subtotal]').textContent=euro(subtotal/100);controls.querySelector('[data-shipping]').textContent=euro(n?(lines.some(i=>P.find(p=>p.id===i.id).shippingClass!=="letter")?6.19:1.10):0);controls.querySelector('#total').textContent=euro((subtotal+(n?(lines.some(i=>P.find(p=>p.id===i.id).shippingClass!=="letter")?619:110):0))/100);button.disabled=!n||busy||lines.some(item=>P.find(p=>p.id===item.id).managedStock&&!stockState[item.id]?.available);
}
window.addEventListener('hwcartchange',render);render();
button.onclick=async()=>{
 if(busy||!cart.length)return;busy=true;render();message.textContent='Sicherer Checkout wird geöffnet …';
 try{
  const context=await fetch('/api/checkout-context',{cache:'no-store'});if(!context.ok)throw Error('Der Checkout ist derzeit nicht verfügbar.');
  const items=cartItems(),fingerprint=JSON.stringify(items);let previous;try{previous=JSON.parse(sessionStorage.getItem('hwcheckout-attempt'));}catch{}
  const attempt=previous?.fingerprint===fingerprint && Date.now()-previous.createdAt<1800000?previous:{fingerprint,items,key:crypto.randomUUID(),createdAt:Date.now()};
  sessionStorage.setItem('hwcheckout-attempt',JSON.stringify(attempt));
  const response=await fetch('/api/create-checkout-session',{method:'POST',headers:{'Content-Type':'application/json','X-Checkout-Request':attempt.key},body:JSON.stringify({items})});
  const data=await response.json();if(!response.ok)throw Error(data.error||'Checkout derzeit nicht verfügbar.');
  if(new URL(data.url).origin!=='https://checkout.stripe.com')throw Error('Ungültige Checkout-Adresse.');
  sessionStorage.setItem('hwcheckout-attempt',JSON.stringify({...attempt,sessionId:data.sessionId}));
  location.assign(data.url);
 }catch(error){message.textContent=error.message;busy=false;render();}
};
document.querySelector('[data-return-cart]')?.addEventListener('click',()=>document.querySelector('[data-cart]').click());
})();
