// Server-owned catalog. Prices and identities never come from the browser.
export const CATALOG=Object.freeze({
 seedplate:Object.freeze({name:'Steel Seed Phrase Recovery Plate (8 Digits per Word)',price:7900,priceEnv:'STRIPE_PRICE_ID',description:'8 Zeichen pro Wort; 12/18/24 Seed-Wörter; Edelstahl. Set mit Plate, Metallbuchstaben, Schraubenzieher, Befestigungsteilen, Tasche und Void-Sticker.'}),
 recoveryplate4:Object.freeze({name:'Steel Seed Phrase Recovery Plate (4 Digit - BIP39)',price:7900,priceEnv:'STRIPE_PRICE_ID_PLATE4',description:'Erste 4 Buchstaben pro Wort; 12 oder 24 Wörter der englischen BIP39-Wortliste; Edelstahl 304 / V2A; 10,5 × 6 × 0,6 cm; 217 g. Mit Metallbuchstaben, Schraubendreher, 3 VOID-Sicherheitsstickern und BIP39-Anleitung.'})
});
export function cartItems(data){
 if(!data || Object.keys(data).join()!=='items' || !Array.isArray(data.items) || !data.items.length || data.items.length>2)throw Error('cart');
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
