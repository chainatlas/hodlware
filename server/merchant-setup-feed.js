import {CATALOG} from './catalog.js';
import {merchantAvailability,renderMerchantFeed} from './merchant-feed.js';

// Reviewed Google XML values (2026-11-01). Never accepted from a request or environment.
export const SETUP_EXCLUDED_DESTINATIONS=Object.freeze([
 'Shopping_ads','Display_ads','Local_inventory_ads','Free_listings','Free_local_listings',
 'Cloud_retail','Local_cloud_retail','Youtube_affiliate','Youtube_merchandise'
]);
const OFFER_IDS=Object.freeze(['seedplate','recoveryplate4','void-1','void-5','void-10','void-25']);
export const MERCHANT_SETUP_POLICY=Object.freeze({
 targetCountries:Object.freeze(['DE']),contentLanguage:'de',feedLabel:'DE',
 path:'/google-merchant-setup-feed.xml',excludedDestinations:SETUP_EXCLUDED_DESTINATIONS
});

export function renderMerchantSetupFeed(states,options={}){
 const catalog=options.catalog||CATALOG;
 // New offers require review; no silently partial or enlarged setup import.
 if(Object.keys(catalog).length!==OFFER_IDS.length||OFFER_IDS.some(id=>!Object.hasOwn(catalog,id)))throw Error('setup catalog not reviewed');
 const body=renderMerchantFeed(states,options);
 if(body.includes('<g:included_destination>')||body.includes('<g:excluded_destination>'))throw Error('unexpected destination policy');
 const items=body.match(/<item>[\s\S]*?<\/item>/g)||[];
 if(items.length!==OFFER_IDS.length||OFFER_IDS.some(id=>items.filter(i=>i.includes('<g:id>'+id+'</g:id>')).length!==1))throw Error('setup offer mismatch');
 const exclusions=SETUP_EXCLUDED_DESTINATIONS.map(d=>'<g:excluded_destination>'+d+'</g:excluded_destination>').join('');
 // The shared renderer owns every product field. Add only the immutable setup restrictions.
 return body.replaceAll('<item>','<item>'+exclusions);
}

export async function merchantSetupFeed({request,env}){
 const headers={'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive','X-HODLWARE-Feed-Mode':'setup'};
 if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{...headers,Allow:'GET, HEAD'}});
 try{
  // Independent, explicit release. Country is an operator attestation, NOT remote account enforcement.
  if(env.MERCHANT_SETUP_FEED_ENABLED!=='true'||env.MERCHANT_SETUP_COUNTRY_CONFIRMED!=='DE'||
   env.MERCHANT_FEED_ENABLED!=='false'||env.MERCHANT_SHIPPING_REVIEWED!=='false')throw Error('setup not released');
  if(new URL(request.url).search)throw Error('setup parameters not supported');
  const body=renderMerchantSetupFeed(await merchantAvailability(env));
  return new Response(request.method==='HEAD'?null:body,{status:200,headers});
 }catch{
  return new Response(request.method==='HEAD'?null:'<?xml version="1.0" encoding="UTF-8"?><error>Einrichtungsfeed derzeit nicht verfügbar.</error>',{status:503,headers:{...headers,'Retry-After':'3600'}});
 }
}
