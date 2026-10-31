const accessoryGroups=Object.groupBy(P.filter(p=>p.category==='accessories'),p=>p.productId);
for(const variants of Object.values(accessoryGroups)){
 const product=variants[0],article=document.createElement('article');article.className='accessory-detail accessory-card';
 article.innerHTML='<div class="accessory-purchase"><small>MANIPULATIONSERKENNUNG</small><h2></h2><p class="accessory-description"></p><ul class="accessory-highlights"></ul><fieldset><legend>Mengenpaket auswählen</legend><div class="accessory-packages"></div></fieldset><div class="accessory-buy-row"><div><span class="price-label">Paketpreis</span><strong class="accessory-selected-price" aria-live="polite"></strong></div><button type="button" class="accessory-add">In den Warenkorb →</button></div><p class="accessory-shipping">Nur Sticker: <strong>1,10 €</strong> Standardbrief mit Basis-Sendungsverfolgung.<br>Mit Recovery Plate: <strong>6,19 €</strong> Versand. Innerhalb Deutschlands.</p><p class="accessory-tax">Preise gemäß § 19 UStG ohne Ausweis der Umsatzsteuer.</p><p class="detail-feedback" role="status"></p></div>';
 article.querySelector('h2').textContent=product.productName;
 article.querySelector('.accessory-description').textContent='Besonders dünne Manipulationssticker im Format 5 × 1 cm. Beim Ablösen wird ein sichtbares VOID-Muster hinterlassen – als Hinweis auf mögliche Manipulationsversuche.';
 for(const text of ['Besonders dünn und unauffällig','5 × 1 cm pro Sticker','Sichtbares VOID-Muster beim Ablösen']){const item=document.createElement('li');item.textContent=text;article.querySelector('.accessory-highlights').append(item);}
 const photos=product.images||[];
 if(photos.length){
  const figure=document.createElement('figure');figure.className='product-gallery accessory-gallery';
  const stage=document.createElement('div');stage.className='accessory-photo-stage';
  const image=document.createElement('img');image.className='gallery-main accessory-photo';image.id='photo-'+product.productId;image.loading='eager';image.decoding='async';image.fetchPriority='high';image.sizes='(max-width:800px) calc(100vw - 36px), (max-width:1200px) 52vw, 680px';
  Object.assign(image,{src:photos[0].src,alt:photos[0].alt,width:photos[0].width,height:photos[0].height});image.srcset=photos[0].small+' 720w, '+photos[0].src+' '+photos[0].width+'w';stage.append(image);
  const toolbar=document.createElement('div');toolbar.className='accessory-gallery-toolbar';
  const previous=document.createElement('button');previous.type='button';previous.className='gallery-prev';previous.textContent='‹';previous.setAttribute('aria-label','Vorheriges Produktbild');
  const next=document.createElement('button');next.type='button';next.className='gallery-next';next.textContent='›';next.setAttribute('aria-label','Nächstes Produktbild');
  const caption=document.createElement('figcaption');caption.dataset.galleryCaption='';caption.textContent=photos[0].label;toolbar.append(previous,caption,next);
  const controls=document.createElement('div');controls.className='gallery-thumbs accessory-thumbnails';controls.setAttribute('role','group');controls.setAttribute('aria-label','Produktansichten');
  for(const [index,photo] of photos.entries()){
   const button=document.createElement('button');button.type='button';button.className='gallery-thumb';button.setAttribute('aria-label',photo.label);button.setAttribute('aria-controls',image.id);button.setAttribute('aria-pressed',String(index===0));
   Object.assign(button.dataset,{image:photo.src,alt:photo.alt,small:photo.small,smallWidth:'720',width:String(photo.width),height:String(photo.height),caption:photo.label});
   const thumbnail=document.createElement('img');Object.assign(thumbnail,{src:photo.thumb,alt:'',width:90,height:60,loading:'lazy'});button.append(thumbnail);controls.append(button);
  }
  figure.append(stage,toolbar,controls);article.prepend(figure);
 }
 const field=article.querySelector('fieldset'),packages=article.querySelector('.accessory-packages');
 for(const [index,variant] of variants.entries()){
  const label=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name='variant-'+product.productId;input.value=variant.id;input.checked=index===0;
  const text=document.createElement('span'),count=document.createElement('strong'),price=document.createElement('span');count.textContent=variant.units+' Stück';price.textContent=euro(variant.price)+' pro Paket';text.append(count,price);label.append(input,text);packages.append(label);
 }
 const button=article.querySelector('.accessory-add'),feedback=article.querySelector('.detail-feedback');
 button.onclick=()=>{const id=field.querySelector(':checked').value;if(canAdd(id)){cart.push(id);save();feedback.textContent='Zum Warenkorb hinzugefügt.';}else feedback.textContent='Derzeit nicht verfügbar.';};
 const updateSelection=()=>{const id=field.querySelector(':checked').value,variant=variants.find(v=>v.id===id);article.querySelector('.accessory-selected-price').textContent=euro(variant.price);button.disabled=!canAdd(id);button.textContent=stockState[id]?.available?'In den Warenkorb →':'Derzeit nicht verfügbar';};
 field.addEventListener('change',()=>{feedback.textContent='';updateSelection();});window.addEventListener('hwcartchange',updateSelection);updateSelection();
 document.getElementById('accessory-grid').append(article);initProductGalleries(article);
}
