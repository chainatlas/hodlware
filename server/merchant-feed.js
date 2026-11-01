import {seedMode} from './seedplate-inventory.js';
import {CATALOG,SHIPPING_CLASSES} from './catalog.js';
import {MERCHANT_PRODUCTS} from './merchant-products.js';
const ORIGIN='https://hodlware.de';
export function xml(value){const s=String(value);if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ud800-\udfff]/u.test(s))throw Error('invalid XML character');return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');}
const tag=(key,value)=>'<g:'+key+'>'+xml(value)+'</g:'+key+'>';
export function validGtin(value){if(!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value))return false;const a=[...value].map(Number),last=a.pop();return (10-a.reverse().reduce((s,n,i)=>s+n*(i%2?1:3),0)%10)%10===last;}
function identifiers(meta){const i=meta.identifiers;if(i?.status==='unassigned'&&!i.gtin&&!i.mpn)return tag('identifier_exists','no');if(i?.status!=='assigned'||(!i.gtin&&!i.mpn))throw Error('identifiers not reviewed');if(i.gtin&&!validGtin(i.gtin))throw Error('invalid GTIN');if(i.mpn&&(typeof i.mpn!=='string'||!i.mpn.trim()||i.mpn.length>70))throw Error('invalid MPN');return tag('identifier_exists','yes')+(i.gtin?tag('gtin',i.gtin):'')+(i.mpn?tag('mpn',i.mpn):'');}
export function renderMerchantFeed(states,{catalog=CATALOG,metadata=MERCHANT_PRODUCTS}={}){
 const ids=Object.keys(catalog);if(!ids.length)throw Error('empty catalog');
 const items=ids.map(id=>{const p=catalog[id],m=metadata[id];if(!m||typeof p.name!=='string'||!p.name.trim()||typeof p.description!=='string'||!p.description.trim()||!Number.isSafeInteger(p.price)||p.price<=0||typeof states[id]!=='boolean'||!m.productType||!m.path?.startsWith('/')||m.path.startsWith('//'))throw Error('incomplete product');const link=new URL(m.path,ORIGIN);if(link.origin!==ORIGIN)throw Error('invalid link');const images=m.images||p.images?.map(i=>i.src);if(!images?.length||images.some(i=>!/^assets\/images\/[a-zA-Z0-9_./-]+\.(webp|png|jpg)$/.test(i)||i.includes('..')))throw Error('invalid images');
 let data=tag('id',id)+tag('title',m.title||p.name)+tag('description',p.description)+tag('link',link.href)+tag('image_link',ORIGIN+'/'+images[0])+images.slice(1,11).map(i=>tag('additional_image_link',ORIGIN+'/'+i)).join('')+tag('price',(p.price/100).toFixed(2)+' EUR')+tag('availability',states[id]?'in_stock':'out_of_stock')+tag('condition','new')+tag('brand','HODLWARE')+tag('product_type',m.productType)+identifiers(m);
 if(m.multipack){if(!Number.isInteger(m.multipack)||m.multipack<=1||m.multipack!==p.units)throw Error('invalid multipack');data+=tag('multipack',m.multipack);}
 // Account policies use these labels; no product-level price overrides.
 const label=p.shippingClass==='letter'?'sticker_letter':'plate_parcel';data+=tag('shipping_label',label);
 return '<item>'+data+'</item>';});
 return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><language>de-DE</language><title>HODLWARE Produktfeed Deutschland</title><link>'+ORIGIN+'</link><description>HODLWARE Produkte für Deutschland, Sprache Deutsch.</description>'+items.join('')+'</channel></rss>\n';
}
export async function merchantAvailability(env){
 if(!env.ORDERS?.prepare)throw Error('inventory unavailable');
 // One read-only SQL statement, using exactly the same held/paid semantics as checkout.
 const {results}=await env.ORDERS.prepare(`SELECT i.product_id,i.stock-CASE WHEN i.product_id='recoveryplate4' THEN COALESCE((SELECT SUM(quantity) FROM stock_reservations WHERE product_id=i.product_id AND state IN ('held','paid')),0) ELSE COALESCE((SELECT SUM(quantity) FROM accessory_reservations WHERE product_id=i.product_id AND state IN ('held','paid')),0) END AS remaining FROM product_inventory i WHERE product_id IN ('seedplate','recoveryplate4','void-stickers')`).all();
 const stocks=Object.fromEntries((results||[]).map(r=>[r.product_id,r.remaining]));for(const id of ['seedplate','recoveryplate4','void-stickers'])if(!Number.isSafeInteger(stocks[id])||stocks[id]<0)throw Error('inventory incomplete');
 if(seedMode(env)!=='managed')throw Error('seedplate stock mode not managed');
 const control=await env.ORDERS.prepare("SELECT state,legacy_sessions_cleared FROM inventory_controls WHERE product_id='seedplate'").first();if(!control||control.state==='uninitialized'||control.legacy_sessions_cleared!==1)throw Error('seedplate unconfirmed');
 const states={seedplate:control.state==='ready'&&stocks.seedplate>=1&&/^price_/.test(env.STRIPE_PRICE_ID||''),recoveryplate4:env.PLATE4_ENABLED==='true'&&/^price_/.test(env.STRIPE_PRICE_ID_PLATE4||'')&&env.STRIPE_PRICE_ID!==env.STRIPE_PRICE_ID_PLATE4&&stocks.recoveryplate4>=1};
 for(const [id,p] of Object.entries(CATALOG))if(p.stockId)states[id]=env.ACCESSORIES_ENABLED==='true'&&env.ACCESSORIES_PRICES_APPROVED==='true'&&env.ACCESSORIES_STOCK_CONFIRMED==='true'&&/^price_/.test(env[p.priceEnv]||'')&&stocks[p.stockId]>=p.units;
 return states;
}
export async function merchantFeed({request,env}){
 const headers={'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{...headers,Allow:'GET, HEAD'}});
 try{if(env.MERCHANT_FEED_ENABLED!=='true'||env.MERCHANT_SHIPPING_REVIEWED!=='true')throw Error('feed disabled or shipping unreviewed');const body=renderMerchantFeed(await merchantAvailability(env));return new Response(request.method==='HEAD'?null:body,{status:200,headers});}
 catch{return new Response(request.method==='HEAD'?null:'<?xml version="1.0" encoding="UTF-8"?><error>Produktfeed derzeit nicht verfügbar.</error>',{status:503,headers:{...headers,'Retry-After':'3600'}});}
}

export const merchantShippingPolicy=()=>({country:'DE',currency:'EUR',rates:{sticker_letter:SHIPPING_CLASSES.letter.amount,plate_parcel:SHIPPING_CLASSES.parcel.amount},checkoutComposition:'maximum_class_once',productPriceOverrides:false});
