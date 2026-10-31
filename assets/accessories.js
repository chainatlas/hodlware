const accessoryGroups=Object.groupBy(P.filter(p=>p.category==='accessories'),p=>p.productId);
for(const variants of Object.values(accessoryGroups)){
 const article=document.createElement('article');article.className='accessory-card';
 article.innerHTML='<small>MANIPULATIONSERKENNUNG</small><h2>HODLWARE VOID-Manipulationssticker</h2><p class="accessory-description">Ein sichtbares VOID-Muster beim Ablösen kann auf einen möglichen Manipulationsversuch hinweisen.</p><fieldset><legend>Mengenpaket auswählen</legend></fieldset><button class="accessory-add">In den Warenkorb →</button><p class="detail-feedback" role="status"></p>';
 article.querySelector('h2').textContent=variants[0].productName;
 article.querySelector('.accessory-description').textContent=variants[0].description;
 if(variants[0].tagline){const tagline=document.createElement('p');tagline.className='accessory-tagline';tagline.textContent=variants[0].tagline;article.querySelector('h2').after(tagline);}
 if(variants[0].features?.length){const heading=document.createElement('h3'),list=document.createElement('ul');heading.textContent='Produkteigenschaften';for(const feature of variants[0].features){const item=document.createElement('li');item.textContent=feature;list.append(item);}article.querySelector('fieldset').before(heading,list);}
 const photos=variants[0].images||[];
 if(photos.length){
  const figure=document.createElement('figure');figure.className='accessory-gallery';
  const image=document.createElement('img');image.className='accessory-photo';image.id='photo-'+variants[0].productId;image.loading='eager';image.decoding='async';
  image.sizes='(max-width:600px) calc(100vw - 74px), 544px';
  const caption=document.createElement('figcaption'),controls=document.createElement('div');controls.className='accessory-thumbnails';controls.setAttribute('role','group');controls.setAttribute('aria-label','Produktansichten');
  const select=index=>{const photo=photos[index];image.src=photo.src;image.srcset=photo.small+' 720w, '+photo.src+' '+photo.width+'w';image.alt=photo.alt;image.width=photo.width;image.height=photo.height;caption.textContent=photo.label;for(const [i,button] of [...controls.children].entries())button.setAttribute('aria-pressed',String(i===index));};
  for(const [index,photo] of photos.entries()){
   const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',photo.label);button.setAttribute('aria-controls',image.id);button.onclick=()=>select(index);
   const thumbnail=document.createElement('img');thumbnail.src=photo.thumb;thumbnail.alt='';thumbnail.width=90;thumbnail.height=60;thumbnail.loading='lazy';button.append(thumbnail);controls.append(button);
   button.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const next=(index+(event.key==='ArrowRight'?1:-1)+photos.length)%photos.length;select(next);controls.children[next].focus();}});
  }
  figure.append(image,caption,controls);article.prepend(figure);select(0);
 }
 const field=article.querySelector('fieldset');
 for(const [i,v] of variants.entries()){
 const label=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name='variant-'+variants[0].id;input.value=v.id;input.checked=i===0;
 label.append(input,document.createTextNode(`${v.units} Stück · ${euro(v.price)} pro Paket (${euro(v.price/v.units)} / Sticker)`));field.append(label);
 }
 article.querySelector('.accessory-add').onclick=()=>{const id=field.querySelector(':checked').value;if(canAdd(id)){cart.push(id);save();article.querySelector('[role=status]').textContent='Zum Warenkorb hinzugefügt.';}else article.querySelector('[role=status]').textContent='Derzeit nicht verfügbar. Verkauf noch nicht aktiviert.';};
 const button=article.querySelector('.accessory-add');
 const updateAvailability=()=>{const id=field.querySelector(':checked').value;button.disabled=!canAdd(id);button.textContent=stockState[id]?.available?'In den Warenkorb →':'Derzeit nicht verfügbar';};
 field.addEventListener('change',updateAvailability);window.addEventListener('hwcartchange',updateAvailability);updateAvailability();
 document.getElementById('accessory-grid').append(article);
}
