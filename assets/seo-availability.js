// Read-only projection of the existing shop availability; no extra requests or stock writes.
(() => {
 const node=document.querySelector('script[data-seo-products]');if(!node)return;
 const sync=()=>{
  const data=JSON.parse(node.textContent);
  const visit=value=>{
   if(!value||typeof value!=='object')return;
   if(value['@type']==='Product'&&value.offers){
    const p=HODL_PRODUCTS.find(p=>p.id===value.sku);
    const available=p?.managedStock?(typeof stockState==='object'?stockState[p.id]?.available:undefined):p?.visible!==false&&p?.price!=null;
    if(typeof available==='boolean')value.offers.availability='https://schema.org/'+(available?'InStock':'OutOfStock');
    else delete value.offers.availability;
   }
   for(const child of Object.values(value)){if(Array.isArray(child))child.forEach(visit);else if(child&&typeof child==='object')visit(child);}
  };visit(data);node.textContent=JSON.stringify(data);
 };window.addEventListener('hwcartchange',sync);sync();
})();
