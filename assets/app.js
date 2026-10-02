let P=HODL_PRODUCTS,cart=[];
try {const stored=JSON.parse(localStorage.getItem('hwcart')||'[]');if(Array.isArray(stored))cart=stored.filter(id=>id==='seedplate').slice(0,99);}catch{}
let euro=n=>n==null?'Preis folgt':n.toLocaleString('de-DE',{style:'currency',currency:'EUR'});
function save(){try{localStorage.setItem('hwcart',JSON.stringify(cart));}catch{} update();}
function update(){document.querySelector('[data-cart] b').textContent=cart.length;window.dispatchEvent(new Event('hwcartchange'));}
if(document.getElementById("products"))products.innerHTML=P.filter(p=>p.visible!==false).map(p=>`<article class="product">${p.image?`<div class="product-gallery"><div class="visual"><img class="gallery-main" id="product-image-${p.id}" src="${p.image}" alt="${p.imageAlt||p.name}" loading="lazy" width="1536" height="1024"></div>${p.images?`<div class="gallery-thumbs" aria-label="Produktansichten">${p.images.map((img,i)=>`<button type="button" class="gallery-thumb" data-image="${img.src}" data-alt="${img.alt}" aria-controls="product-image-${p.id}" aria-pressed="${i===0}" aria-label="${img.label}"><img src="${img.src}" alt="" width="90" height="60" loading="lazy"></button>`).join("")}</div>`:""}</div>`:""}<div class="copy"><small>${p.tag}</small><h3>${p.id==="seedplate"?`<a href="steel-seed-phrase-recovery.html">${p.name}</a>`:p.name}</h3><p>${p.desc}</p>${p.id==="seedplate"?`<a class="product-details-link" href="steel-seed-phrase-recovery.html">Produkt entdecken <span aria-hidden="true">↗</span></a>`:""}<ul class="product-features">${p.id==="seedsplit"?`<li><svg class="line-icon" viewBox="0 0 24 26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 11 6-11 6L1 8Zm-11 11 11 6 11-6M1 18l11 6 11-6"/></svg>Getrennte Lagerung</li>`:""}<li><svg class="line-icon" viewBox="0 0 24 26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 3 6v6c0 5 9 9 9 9s9-4 9-9V6Z"/></svg>Feuerfest</li><li><svg class="line-icon" viewBox="0 0 24 26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2S4 11 4 16a8 8 0 0 0 16 0c0-5-8-14-8-14Z"/></svg>Wasserfest</li><li><svg class="line-icon" viewBox="0 0 24 26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14 3 7 7-3 3-3-3L5 22l-3-3L13 8 10 5Z"/></svg>Extrem langlebig</li></ul><div class="buy"><b>${euro(p.price)}</b><button class="add" data-id="${p.id}" ${p.price==null?"disabled":""}>${p.price==null?"Bald verfügbar":"In den Warenkorb"}<span aria-hidden="true"> →</span></button></div></div></article>`).join("");document.querySelectorAll('.add').forEach(b=>b.onclick=()=>{if(b.dataset.id==='seedplate' && cart.length<99){cart.push('seedplate');save();}});
document.querySelector('[data-cart]').onclick=()=>{drawer.classList.add('open');shade.classList.add('open')};
document.querySelector('[data-close]').onclick=shade.onclick=()=>{drawer.classList.remove('open');shade.classList.remove('open')};
update();
const checkoutScript=document.createElement('script');checkoutScript.src='assets/checkout.js';document.head.append(checkoutScript);
// Gallery switches original product photos without altering their contents.
document.querySelectorAll('.gallery-thumb').forEach(button => {
  button.addEventListener('click', () => {
    const gallery = button.closest('.product-gallery');
    const image = gallery.querySelector('.gallery-main');
    image.src = button.dataset.image;
    image.alt = button.dataset.alt;
    gallery.querySelectorAll('.gallery-thumb').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  });
});

const detailPrice = document.querySelector('[data-detail-price]');
if (detailPrice) {
  detailPrice.textContent = euro(P.find(product => product.id === 'seedplate').price);
  document.querySelector('.product-detail .add').addEventListener('click', () => {
    document.querySelector('.detail-feedback').textContent = 'Zum Warenkorb hinzugefügt.';
  });
}
