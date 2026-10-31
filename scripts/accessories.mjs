import {CATALOG} from '../server/catalog.js';
import {writeFile} from 'node:fs/promises';
const variants=Object.entries(CATALOG).filter(([,p])=>p.category==='accessories').map(([id,p])=>({id,productId:p.productId,productName:p.productName,description:p.description,tagline:p.tagline,features:p.features,notice:p.notice,dimensions:p.dimensions,profile:p.profile,image:p.image,imageAlt:p.imageAlt,images:p.images,seo:p.seo,name:p.name,price:p.price/100,units:p.units,category:p.category,shippingClass:p.shippingClass,visible:true,managedStock:true}));
await writeFile('assets/accessory-products.js',`window.HODL_PRODUCTS.push(...${JSON.stringify(variants)});`);
