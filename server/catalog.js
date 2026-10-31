// Server-owned catalog. Prices and identities never come from the browser.
export const CATALOG=Object.freeze({
 ...Object.fromEntries([1,5,10,25].map((units,i)=>[`void-${units}`,Object.freeze({name:`HODLWARE VOID-Manipulationssticker · ${units} Stück`,price:[99,349,599,1199][i],priceEnv:`STRIPE_PRICE_ID_VOID_${units}`,category:"accessories",productId:"void-stickers",productName:"HODLWARE VOID-Manipulationssticker",image:null,dimensions:Object.freeze({widthCm:5,heightCm:1}),profile:'Besonders dünn, trägt kaum auf',tagline:'Manipulationsversuche sichtbar machen – dünn, kompakt und unauffällig.',features:Object.freeze(['Abmessungen: 5 × 1 cm pro Sticker','Ausführung: Besonders dünn, trägt kaum auf','Manipulationsindikator: Sichtbares VOID-Muster beim Ablösen','Anwendung: Auf geeigneten glatten Oberflächen','Paketgrößen: 1, 5, 10 oder 25 Stück']),notice:"VOID-Sticker sind Manipulationsindikatoren und kein garantierter Schutz vor unbefugtem Zugriff. Die Wirkung kann von der Oberfläche und den Umgebungsbedingungen abhängen.",seo:{title:"HODLWARE VOID-Manipulationssticker",description:"Besonders dünne VOID-Manipulationssticker, 5 × 1 cm pro Sticker. Unauffällig auf geeigneten glatten Oberflächen."},stockId:"void-stickers",units,shippingClass:"letter",description:"Die HODLWARE VOID-Manipulationssticker sind eine praktische Ergänzung für die Aufbewahrung deiner Sicherheitsprodukte. Dank ihrer besonders dünnen Ausführung tragen sie kaum auf und lassen sich unauffällig auf geeigneten glatten Oberflächen anbringen. Beim Ablösen wird ein VOID-Muster sichtbar. Dieses kann darauf hinweisen, dass ein Sticker entfernt oder ein Manipulationsversuch unternommen wurde. VOID-Sticker sind Manipulationsindikatoren und kein garantierter Schutz vor unbefugtem Zugriff. Die Wirkung kann von der Oberfläche und den Umgebungsbedingungen abhängen."})])),
 seedplate:Object.freeze({name:'Steel Seed Phrase Recovery Plate (8 Digits per Word)',price:7900,priceEnv:'STRIPE_PRICE_ID',description:'8 Zeichen pro Wort; 12/18/24 Seed-Wörter; Edelstahl. Set mit Plate, Metallbuchstaben, Schraubenzieher, Befestigungsteilen, Tasche und Void-Sticker.'}),
 recoveryplate4:Object.freeze({name:'Steel Seed Phrase Recovery Plate (4 Digit - BIP39)',price:7900,priceEnv:'STRIPE_PRICE_ID_PLATE4',description:'Erste 4 Buchstaben pro Wort; 12 oder 24 Wörter der englischen BIP39-Wortliste; Edelstahl 304 / V2A; 10,5 × 6 × 0,6 cm; 217 g. Mit Metallbuchstaben, Schraubendreher, 3 VOID-Sicherheitsstickern und BIP39-Anleitung.'})
});
export function cartItems(data){
 if(!data || Object.keys(data).join()!=='items' || !Array.isArray(data.items) || !data.items.length || data.items.length>Object.keys(CATALOG).length)throw Error('cart');
 const seen=new Set();
 return data.items.map(item=>{
  if(!item || Object.keys(item).sort().join()!=='id,quantity' || !Object.hasOwn(CATALOG,item.id) || seen.has(item.id) || !Number.isInteger(item.quantity) || item.quantity<1 || item.quantity>99)throw Error('cart');
  seen.add(item.id);return {id:item.id,quantity:item.quantity};
 }).sort((a,b)=>a.id.localeCompare(b.id));
}
export function sessionItems(s){
 const items=s.metadata?.items!==undefined?cartItems({items:JSON.parse(s.metadata.items)}):cartItems({items:[{id:'seedplate',quantity:Number(s.metadata?.quantity)}]});
 return items.map(item=>({...item,name:CATALOG[item.id].name,unitPrice:CATALOG[item.id].price}));
}
export const subtotal=items=>items.reduce((sum,item)=>sum+CATALOG[item.id].price*item.quantity,0);

export const SHIPPING_CLASSES=Object.freeze({letter:{amount:110,priority:1},parcel:{amount:619,priority:2}});
export const shipping=items=>items.length?items.map(i=>SHIPPING_CLASSES[CATALOG[i.id].shippingClass||'parcel']).reduce((a,b)=>a.priority>=b.priority?a:b).amount:0;
export const physicalItems=items=>Object.entries(items.reduce((out,i)=>{const p=CATALOG[i.id];if(p.stockId)out[p.stockId]=(out[p.stockId]||0)+p.units*i.quantity;return out;},{})).map(([id,quantity])=>({id,quantity}));
