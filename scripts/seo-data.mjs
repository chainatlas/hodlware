import {CATALOG,SHIPPING_CLASSES} from '../server/catalog.js';
const origin='https://hodlware.de';
const seller={'@type':'Organization','@id':origin+'/#organization',name:'HODLWARE',url:origin+'/'};
export function productSchema(id,images,url){
 const p=CATALOG[id],accessory=p.category==='accessories';
 return {'@type':'Product','@id':url+'#product',name:p.name,sku:id,brand:{'@type':'Brand',name:'HODLWARE'},description:p.description,image:images.map(src=>origin+'/'+src),url,...(accessory?{size:p.units+' Stück',additionalProperty:[{'@type':'PropertyValue',name:'Sticker pro Paket',value:p.units},{'@type':'PropertyValue',name:'Abmessungen pro Sticker',value:'5 × 1 cm'}]}:{}),offers:{'@type':'Offer',url,price:(p.price/100).toFixed(2),priceCurrency:'EUR',itemCondition:'https://schema.org/NewCondition',seller,shippingDetails:{'@type':'OfferShippingDetails',shippingDestination:{'@type':'DefinedRegion',addressCountry:'DE'},shippingSettingsLink:origin+'/versand-zahlung',...(accessory?{description:'Nur Sticker: 1,10 € pro Bestellung mit Basis-Sendungsverfolgung. Mit mindestens einer Recovery Plate: einmalig 6,19 €.'}:{shippingRate:{'@type':'MonetaryAmount',value:(SHIPPING_CLASSES.parcel.amount/100).toFixed(2),currency:'EUR'}})}}};
}
export function seoSchema(path,products){
 const plate=path==='steel-seed-phrase-recovery.html'?'seedplate':path==='steel-seed-phrase-recovery-plate.html'?'recoveryplate4':null;
 if(plate)return {'@context':'https://schema.org',...productSchema(plate,products.find(p=>p.id===plate).images.map(i=>i.src),origin+'/'+path.replace('.html',''))};
 if(path==='zubehoer.html')return {'@context':'https://schema.org','@type':'CollectionPage',url:origin+'/zubehoer',name:'HODLWARE Zubehör',mainEntity:{'@type':'ProductGroup','@id':origin+'/zubehoer#void-stickers',name:'HODLWARE VOID-Manipulationssticker',productGroupID:'void-stickers',variesBy:'https://schema.org/size',brand:{'@type':'Brand',name:'HODLWARE'},description:CATALOG['void-1'].description,image:CATALOG['void-1'].images.map(i=>origin+'/'+i.src),hasVariant:[1,5,10,25].map(n=>productSchema('void-'+n,CATALOG['void-'+n].images.map(i=>i.src),origin+'/zubehoer?paket='+n))}};
 if(path==='index.html')return {'@context':'https://schema.org',...seller};
}
export function withSeoData(html,path,products){
 const schema=seoSchema(path,products);if(!schema)return html;
 html=html.split('<script defer src="/assets/seo-availability.js"></script>').join('');
 html=html.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g,'');
 return html.replace('</head>','<script type="application/ld+json" data-seo-products>'+JSON.stringify(schema).replaceAll('<','\\u003c')+'</script>'+(path==='index.html'?'':'<script defer src="/assets/seo-availability.js"></script>')+'</head>');
}
