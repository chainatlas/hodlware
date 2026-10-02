(() => {
const panel=document.getElementById('drawer');
panel.querySelector('h3').remove();panel.querySelector('.disabled').remove();
const controls=document.createElement('div');controls.className='checkout-controls';
controls.innerHTML=`<dl><div><dt>Zwischensumme</dt><dd data-subtotal></dd></div><div><dt>DHL Versand · Deutschland</dt><dd data-shipping></dd></div><div><dt>Gesamt</dt><dd id="total"></dd></div></dl><p>Preise gemäß § 19 UStG ohne Ausweis der Umsatzsteuer.</p><p><a href="agb.html">AGB</a> · <a href="widerruf.html">Widerruf</a> · <a href="datenschutz.html">Datenschutz</a> · <a href="versand-zahlung.html">Versand &amp; Zahlung</a></p><p>Stripe-Testmodus – keine echte Zahlung. Gutscheine können bei Stripe eingegeben werden.</p><button type="button" class="checkout-start">Zur Kasse →</button><p class="checkout-message" role="status"></p>`;
panel.append(controls);
const button=controls.querySelector('button'),message=controls.querySelector('.checkout-message');let busy=false;
function render(){
 const n=cart.length;const items=panel.querySelector('#cartitems');items.replaceChildren();
 if(n){const line=document.createElement('div');line.className='cartline';const name=document.createElement('p');name.textContent=P.find(p=>p.id==='seedplate').name;line.append(name);
 const label=document.createElement('label');label.textContent='Menge ';const input=document.createElement('input');input.type='number';input.min='1';input.max='99';input.step='1';input.value=String(n);input.setAttribute('aria-label','Produktmenge');input.disabled=busy;input.addEventListener('change',()=>{const count=Number(input.value);if(Number.isInteger(count)&&count>=1&&count<=99){cart=Array(count).fill('seedplate');save();}else input.value=String(cart.length);});label.append(input);line.append(label);
 const remove=document.createElement('button');remove.type='button';remove.textContent='Entfernen';remove.disabled=busy;remove.onclick=()=>{cart=[];save();};line.append(remove);items.append(line);
 }else items.textContent='Dein Warenkorb ist leer.';
 controls.querySelector('[data-subtotal]').textContent=euro(n*79);controls.querySelector('[data-shipping]').textContent=euro(n?6.19:0);controls.querySelector('#total').textContent=euro((n*7900+(n?619:0))/100);button.disabled=!n||busy;
}
window.addEventListener('hwcartchange',render);render();
button.onclick=async()=>{
 if(busy||!cart.length)return;busy=true;render();message.textContent='Test-Checkout wird geöffnet …';
 try{
  const context=await fetch('/api/checkout-context',{cache:'no-store'});if(!context.ok)throw Error('Der Test-Checkout ist noch nicht eingerichtet.');
  const n=cart.length;let previous;try{previous=JSON.parse(sessionStorage.getItem('hwcheckout-attempt'));}catch{}
  const attempt=previous?.quantity===n && Date.now()-previous.createdAt<1800000?previous:{quantity:n,key:crypto.randomUUID(),createdAt:Date.now()};
  sessionStorage.setItem('hwcheckout-attempt',JSON.stringify(attempt));
  const response=await fetch('/api/create-checkout-session',{method:'POST',headers:{'Content-Type':'application/json','X-Checkout-Request':attempt.key},body:JSON.stringify({items:[{id:'seedplate',quantity:n}]})});
  const data=await response.json();if(!response.ok)throw Error(data.error||'Checkout derzeit nicht verfügbar.');
  if(new URL(data.url).origin!=='https://checkout.stripe.com')throw Error('Ungültige Checkout-Adresse.');
  sessionStorage.setItem('hwcheckout-attempt',JSON.stringify({...attempt,sessionId:data.sessionId}));
  location.assign(data.url);
 }catch(error){message.textContent=error.message;busy=false;render();}
};
document.querySelector('[data-return-cart]')?.addEventListener('click',()=>document.querySelector('[data-cart]').click());
})();
