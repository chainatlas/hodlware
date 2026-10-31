let P=HODL_PRODUCTS,cart=[];
try {const stored=JSON.parse(localStorage.getItem('hwcart')||'[]');if(Array.isArray(stored))cart=stored.filter(id=>P.some(p=>p.id===id&&p.visible!==false&&p.price!=null)).slice(0,99);}catch{}
let euro=n=>n==null?'Preis folgt':n.toLocaleString('de-DE',{style:'currency',currency:'EUR'});
function save(){try{localStorage.setItem('hwcart',JSON.stringify(cart));}catch{} update();}
function update(){document.querySelector('[data-cart] b').textContent=cart.length;window.dispatchEvent(new Event('hwcartchange'));}
// Homepage presentation uses optional shop-only photos; detail galleries remain unchanged.
if(document.getElementById('products')){
 const icon=path=>`<svg class="line-icon" viewBox="0 0 24 26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
 document.getElementById('products').innerHTML=P.filter(p=>p.visible!==false&&p.category!=="accessories").map(p=>{
  const images=p.shopImages||p.images||[],hero=images[0];
  const features=[
   [icon('<path d="M12 3 3 6v6c0 5 9 9 9 9s9-4 9-9V6Z"/>'),`${p.characters||8} Buchstaben / Wort`],
   [icon('<rect x="4" y="3" width="16" height="20" rx="2"/><path d="M9 8h7M9 13h7M9 18h7"/>'),'12–24 Wörter'],
   [icon('<rect x="3" y="10" width="18" height="13" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),'Edelstahl']
  ];
  return `<article class="product product-gallery ${p.managedStock?'plate-four':''}">
   <div class="visual"><span class="variant-badge">${p.characters||8}-DIGIT</span><img class="gallery-main" id="product-image-${p.id}" src="${hero?.src||p.image}" ${hero?.small?`srcset="${hero.small} 640w, ${hero.src} ${hero.width||1536}w" sizes="(max-width:900px) calc(100vw - 64px), 650px"`:''} alt="${hero?.alt||p.imageAlt||p.name}" width="1500" height="1000" loading="lazy" draggable="false"><button type="button" class="gallery-prev" aria-label="Vorheriges Produktbild">‹</button><button type="button" class="gallery-next" aria-label="Nächstes Produktbild">›</button><div class="gallery-dots" aria-label="Produktansichten">${images.map((img,i)=>`<button type="button" class="gallery-thumb" data-image="${img.src}" data-alt="${img.alt}" data-small="${img.small||''}" data-width="${img.width||1536}" aria-controls="product-image-${p.id}" aria-pressed="${i===0}" aria-label="${img.label}"></button>`).join('')}</div></div>
   <div class="copy"><h3><a href="${p.url}">Steel Seed Phrase Recovery Plate</a></h3><p class="product-variant-subtitle">${p.characters===8?'(8 Digits pro Wort)':'(4 Digits pro Wort – BIP39 Standard)'}</p><p class="product-description">${p.shopDesc||p.desc}</p>
    <ul class="product-features">${features.map(([icon,label])=>`<li>${icon}<span>${label}</span></li>`).join('')}</ul>
    <a class="product-details-link" href="${p.url}">Produktbeschreibung <span aria-hidden="true">↗</span></a>
    <div class="buy"><b>${euro(p.price)}</b><button class="add" data-id="${p.id}" ${p.price==null||p.managedStock?'disabled':''}>${p.price==null?'Bald verfügbar':p.managedStock?'Verfügbarkeit wird geprüft':'In den Warenkorb'} <span aria-hidden="true">→</span></button></div>
   </div>

  </article>`;
 }).join('');
}
function cartItems(){return [...new Set(cart)].sort().map(id=>({id,quantity:cart.filter(value=>value===id).length}));}
const stockState={};
function canAdd(id){const p=P.find(p=>p.id===id);return p&&p.visible!==false&&p.price!=null&&cart.length<99&&(!p.managedStock||(stockState[id]?.available));}
document.querySelectorAll('.add').forEach(button=>button.onclick=()=>{if(canAdd(button.dataset.id)){cart.push(button.dataset.id);save();const feedback=document.querySelector('.detail-feedback');if(feedback)feedback.textContent='Zum Warenkorb hinzugefügt.';}});
async function refreshStock(){
 const managed=P.filter(p=>p.managedStock);if(!managed.length)return;
 let data={};try{const response=await fetch('/api/checkout-context',{cache:'no-store'});if(response.ok)data=await response.json();}catch{}
 for(const p of managed){
  const state=data.products?.[p.id]||{available:false};stockState[p.id]=state;
  document.querySelectorAll(`[data-stock="${p.id}"]`).forEach(el=>el.textContent=state.available?'Verfügbar':'Derzeit nicht verfügbar');
  document.querySelectorAll(`.add[data-id="${p.id}"]`).forEach(button=>{button.disabled=!state.available;button.textContent=state.available?'In den Warenkorb →':'Derzeit nicht verfügbar';});
 }
 window.dispatchEvent(new Event('hwcartchange'));
}
refreshStock();
document.querySelector('[data-cart]').onclick=()=>{drawer.classList.add('open');shade.classList.add('open')};
document.querySelector('[data-close]').onclick=shade.onclick=()=>{drawer.classList.remove('open');shade.classList.remove('open')};
update();
const checkoutScript=document.createElement('script');checkoutScript.src='assets/checkout.js';document.head.append(checkoutScript);
// One gallery implementation for homepage cards, Plates and accessories.
initProductGalleries();
const detailPrice=document.querySelector('[data-detail-price]');
if(detailPrice)detailPrice.textContent=euro(P.find(product=>product.id===(detailPrice.dataset.detailPrice||'seedplate')).price);
