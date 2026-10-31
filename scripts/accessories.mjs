import {CATALOG} from '../server/catalog.js';
import {writeFile} from 'node:fs/promises';
const variants=Object.entries(CATALOG).filter(([,p])=>p.category==='accessories').map(([id,p])=>({id,productId:p.productId,productName:p.productName,description:p.description,image:p.image,seo:p.seo,name:p.name,price:p.price/100,units:p.units,category:p.category,shippingClass:p.shippingClass,visible:true,managedStock:true}));
await writeFile('assets/accessory-products.js',`window.HODL_PRODUCTS.push(...${JSON.stringify(variants)});`);
