const accessoryGroups=Object.groupBy(P.filter(p=>p.category==='accessories'),p=>p.productId);
for(const variants of Object.values(accessoryGroups)){
 const article=document.createElement('article');article.className='accessory-card';
 article.innerHTML='<div class="photo-placeholder" role="img" aria-label="Originalproduktfotos fehlen">PRODUKTFOTO FOLGT<br><small>Klar gekennzeichneter Platzhalter</small></div><small>MANIPULATIONSERKENNUNG</small><h2>HODLWARE VOID-Manipulationssticker</h2><p class="accessory-description">Ein sichtbares VOID-Muster beim Ablösen kann auf einen möglichen Manipulationsversuch hinweisen.</p><fieldset><legend>Mengenpaket auswählen</legend></fieldset><button class="accessory-add">In den Warenkorb →</button><p class="detail-feedback" role="status"></p>';
 article.querySelector('h2').textContent=variants[0].productName;
 article.querySelector('.accessory-description').textContent=variants[0].description;
 if(variants[0].tagline){const tagline=document.createElement('p');tagline.className='accessory-tagline';tagline.textContent=variants[0].tagline;article.querySelector('h2').after(tagline);}
 if(variants[0].features?.length){const heading=document.createElement('h3'),list=document.createElement('ul');heading.textContent='Produkteigenschaften';for(const feature of variants[0].features){const item=document.createElement('li');item.textContent=feature;list.append(item);}article.querySelector('fieldset').before(heading,list);}
 if(variants[0].image){const image=document.createElement('img');image.className='accessory-photo';image.src=variants[0].image;image.alt=variants[0].productName;article.querySelector('.photo-placeholder').replaceWith(image);}
 const field=article.querySelector('fieldset');
 for(const [i,v] of variants.entries()){
 const label=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name='variant-'+variants[0].id;input.value=v.id;input.checked=i===0;
 label.append(input,document.createTextNode(`${v.units} Stück · ${euro(v.price)} pro Paket (${euro(v.price/v.units)} / Sticker)`));field.append(label);
 }
 article.querySelector('button').onclick=()=>{const id=field.querySelector(':checked').value;if(canAdd(id)){cart.push(id);save();article.querySelector('[role=status]').textContent='Zum Warenkorb hinzugefügt.';}else article.querySelector('[role=status]').textContent='Derzeit nicht verfügbar. Verkauf noch nicht aktiviert.';};
 const button=article.querySelector('button');
 const updateAvailability=()=>{const id=field.querySelector(':checked').value;button.disabled=!canAdd(id);button.textContent=stockState[id]?.available?'In den Warenkorb →':'Derzeit nicht verfügbar';};
 field.addEventListener('change',updateAvailability);window.addEventListener('hwcartchange',updateAvailability);updateAvailability();
 document.getElementById('accessory-grid').append(article);
}
