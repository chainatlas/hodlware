// Shared by homepage cards, Recovery Plate detail pages and accessories.
// Only existing original-photo URLs are selected; no cropping or image transforms.
(() => {
 let lightbox=null,enlarged=null,previousOverflow='',returnFocus=null;
 function open(image){
  if(!lightbox){
   lightbox=document.createElement('dialog');lightbox.className='product-lightbox';lightbox.setAttribute('aria-label','Vergrößerte Produktansicht');
   const close=document.createElement('button');close.type='button';close.className='lightbox-close';close.textContent='×';close.setAttribute('aria-label','Bildansicht schließen');
   enlarged=document.createElement('img');lightbox.append(close,enlarged);document.body.append(lightbox);
   close.onclick=()=>lightbox.close();lightbox.onclick=event=>{if(event.target===lightbox)lightbox.close();};
   lightbox.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;returnFocus?.focus();});
  }
  enlarged.src=image.src;enlarged.alt=image.alt;previousOverflow=document.body.style.overflow;returnFocus=image;lightbox.showModal();document.body.style.overflow='hidden';lightbox.querySelector('button').focus();
 }
 window.initProductGalleries=(root=document)=>{
  const galleries=[...(root.matches?.('.product-gallery')?[root]:[]),...root.querySelectorAll('.product-gallery')];
  for(const gallery of galleries){
   if(gallery.dataset.galleryReady)continue;
   const image=gallery.querySelector('.gallery-main'),thumbs=[...gallery.querySelectorAll('.gallery-thumb')];if(!image||!thumbs.length)continue;
   gallery.dataset.galleryReady='true';
   const select=button=>{
    image.removeAttribute('srcset');image.src=button.dataset.image;image.alt=button.dataset.alt;
    if(button.dataset.small)image.srcset=button.dataset.small+' '+(button.dataset.smallWidth||640)+'w, '+button.dataset.image+' '+(button.dataset.width||1536)+'w';
    if(button.dataset.height){image.width=Number(button.dataset.width);image.height=Number(button.dataset.height);}
    thumbs.forEach(thumb=>thumb.setAttribute('aria-pressed',String(thumb===button)));
    const caption=gallery.querySelector('[data-gallery-caption]');if(caption)caption.textContent=button.dataset.caption||button.getAttribute('aria-label');
   };
   thumbs.forEach(button=>button.addEventListener('click',()=>select(button)));
   const move=delta=>{const index=thumbs.findIndex(b=>b.getAttribute('aria-pressed')==='true');const next=thumbs[(index+delta+thumbs.length)%thumbs.length];select(next);return next;};
   gallery.querySelector('.gallery-prev')?.addEventListener('click',()=>move(-1));gallery.querySelector('.gallery-next')?.addEventListener('click',()=>move(1));
   gallery.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)&&event.target.closest('.gallery-main,.gallery-thumb,.visual,.gallery-prev,.gallery-next')){event.preventDefault();const next=move(event.key==='ArrowRight'?1:-1);if(event.target.closest('.gallery-thumb'))next.focus();}});
   let start=null,suppressUntil=0;
   image.draggable=false;image.style.touchAction='pan-y';
   image.addEventListener('pointerdown',event=>{if(event.button!==0)return;start={x:event.clientX,y:event.clientY};image.setPointerCapture(event.pointerId);});
   image.addEventListener('pointerup',event=>{if(!start)return;const dx=event.clientX-start.x,dy=event.clientY-start.y;start=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){suppressUntil=Date.now()+500;move(dx<0?1:-1);}});
   image.addEventListener('pointercancel',()=>{start=null;});
   image.tabIndex=0;image.setAttribute('role','button');image.setAttribute('aria-label','Produktbild vergrößern');image.setAttribute('aria-haspopup','dialog');
   image.addEventListener('click',event=>{if(Date.now()<suppressUntil){event.preventDefault();return;}open(image);});
   image.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open(image);}});
  }
 };
})();
