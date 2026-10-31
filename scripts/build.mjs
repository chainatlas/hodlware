import './accessories.mjs';
import {CATALOG} from '../server/catalog.js';
import {writeIndexNowManifest} from './indexnow-manifest.mjs';
import {checkProductEncoding} from './check-product-encoding.mjs';
await checkProductEncoding();
import {createHash} from 'node:crypto';
import {mkdir,copyFile,writeFile,readFile,rm} from 'node:fs/promises';
// Only this fixed generated directory is removed; never source files.
await rm(new URL('../dist/',import.meta.url),{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const f of ['zubehoer.html','kontakt.html','index.html','impressum.html','datenschutz.html','widerruf.html','agb.html','versand.html','versand-zahlung.html','steel-seed-phrase-recovery.html','steel-seed-phrase-recovery-plate.html','checkout-success.html','checkout-cancel.html']) await copyFile(f,`dist/${f}`);
for(const f of ['sitemap.xml','robots.txt','_redirects','67c781f634734bc78b734802d795d817.txt','favicon.ico']) await copyFile(f,`dist/${f}`);
const guides=["ratgeber/seed-phrase-sicher-aufbewahren.html", "ratgeber/seed-phrase-papier-oder-metall.html", "ratgeber/seed-phrase-auf-metall-sichern.html"];
await mkdir('dist/ratgeber',{recursive:true});
for(const f of guides) await copyFile(f,`dist/${f}`);
await mkdir('dist/assets/images',{recursive:true});
for(const f of ['gallery.js','accessory-products.js','accessories.js','accessories.css','images/favicon-96.png','images/apple-touch-icon.png','app.js','checkout.js','checkout-result.js','products.js','seo-content.css','shop-products.css','style.css','desktop-width.css','forms.js','images/steel-recovery-silver-studio.webp','images/recovery-plate-4-digits-studio-01-640.webp','images/recovery-plate-4-digits-studio-01-thumb.webp','images/recovery-plate-4-digits-studio-02-640.webp','images/recovery-plate-4-digits-studio-02-thumb.webp','images/recovery-plate-4-digits-studio-03-640.webp','images/recovery-plate-4-digits-studio-03-thumb.webp','images/recovery-plate-4-digits-studio-04-640.webp','images/recovery-plate-4-digits-studio-04-thumb.webp','images/steel-recovery-8-digits-silver-01.webp','images/steel-recovery-8-digits-silver-02.webp','images/steel-recovery-8-digits-silver-03.webp','images/steel-recovery-8-digits-silver-04.webp','images/steel-recovery-8-digits-silver-05.webp','images/steel-recovery-8-digits-silver-06.webp','images/steel-recovery-8-digits-silver-07.webp','images/steel-recovery-8-digits-silver-08.webp','images/recovery-plate-4-digits-studio-01.webp','images/recovery-plate-4-digits-studio-02.webp','images/recovery-plate-4-digits-studio-03.webp','images/recovery-plate-4-digits-studio-04.webp','images/hodlware-icon.png','images/info-scenes.png','images/seed-recovery-hero.png','images/steel-recovery-ember-hero.png','images/steel-recovery-reflection-hero.png','images/steel-recovery-logo-reflection-hero.webp','images/steel-recovery-logo-hero-final.png','images/steel-recovery-logo-hero-block.webp','images/steel-recovery-detail.png','images/steel-recovery-open.jpg','images/steel-recovery-8-digits-01.png','images/steel-recovery-8-digits-02.png','images/steel-recovery-8-digits-03.png','images/steel-recovery-8-digits-04.png','images/steel-recovery-8-digits-05.png','images/steel-recovery-8-digits-06.png','images/steel-recovery-8-digits-07.png','images/steel-recovery-8-digits-08.png','images/steel-recovery-set.png','images/recovery-plate-4-digits-01.webp','images/recovery-plate-4-digits-01-640.webp','images/recovery-plate-4-digits-01-thumb.webp','images/recovery-plate-4-digits-02.webp','images/recovery-plate-4-digits-02-640.webp','images/recovery-plate-4-digits-02-thumb.webp','images/recovery-plate-4-digits-03.webp','images/recovery-plate-4-digits-03-640.webp','images/recovery-plate-4-digits-03-thumb.webp','images/recovery-plate-4-digits-04.webp','images/recovery-plate-4-digits-04-640.webp','images/recovery-plate-4-digits-04-thumb.webp'])await copyFile(`assets/${f}`,`dist/assets/${f}`);
// Accessory photos are declared by the catalog; do not hand-maintain per-product paths.
for(const photo of new Map(Object.values(CATALOG).flatMap(p=>p.images||[]).map(p=>[p.src,p])).values()){
 for(const file of [photo.src,photo.small,photo.thumb].filter(Boolean)){await mkdir('dist/'+file.slice(0,file.lastIndexOf('/')),{recursive:true});await copyFile(file,'dist/'+file);}
}
await writeFile('dist/_routes.json',JSON.stringify({version:1,include:['/api/*'],exclude:[]}));
await writeFile('dist/_headers','/67c781f634734bc78b734802d795d817.txt\n  Content-Type: text/plain; charset=utf-8\n/indexnow-manifest.json\n  Content-Type: application/json; charset=utf-8\n  Cache-Control: no-store\n/sitemap.xml\n  Content-Type: application/xml; charset=utf-8\n/robots.txt\n  Content-Type: text/plain; charset=utf-8\n/checkout-*\n  Cache-Control: no-store\n  Referrer-Policy: no-referrer\n/*\n  Cache-Control: no-cache\n  X-Content-Type-Options: nosniff\n');

// Content-version scripts, including the dynamically loaded checkout, per build.
const scripts=['gallery.js','accessory-products.js','accessories.js','app.js','checkout.js','checkout-result.js','products.js','forms.js'];
const version=createHash('sha256');
for(const file of scripts)version.update(await readFile(`assets/${file}`));
version.update(await readFile('assets/shop-products.css'));
version.update(await readFile('assets/accessories.css'));
version.update(await readFile('assets/style.css'));
const revision=version.digest('hex').slice(0,16);
const faviconLinks='<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48 64x64 128x128 256x256"><link rel="icon" type="image/png" href="/assets/images/favicon-96.png" sizes="96x96"><link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png" sizes="180x180">';
for(const file of [...guides,'zubehoer.html','kontakt.html','index.html','impressum.html','datenschutz.html','widerruf.html','agb.html','versand.html','versand-zahlung.html','steel-seed-phrase-recovery.html','steel-seed-phrase-recovery-plate.html','checkout-success.html','checkout-cancel.html','assets/app.js']){
 const path=`dist/${file}`;let source=await readFile(path,'utf8');
 if(file.endsWith('.html'))source=source.replace('</head>',faviconLinks+'</head>');
 source=source.replaceAll('assets/accessories.css','assets/accessories.css?v='+revision);
 source=source.replaceAll('assets/shop-products.css','assets/shop-products.css?v='+revision);
 for(const script of scripts)source=source.replaceAll(`assets/${script}`,`assets/${script}?v=${revision}`);
 await writeFile(path,source);
}

await writeIndexNowManifest();
