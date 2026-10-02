import {mkdir,copyFile,writeFile,rm} from 'node:fs/promises';
// Only this fixed generated directory is removed; never source files.
await rm(new URL('../dist/',import.meta.url),{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const f of ['index.html','impressum.html','datenschutz.html','widerruf.html','agb.html','versand.html','versand-zahlung.html','steel-seed-phrase-recovery.html','checkout-success.html','checkout-cancel.html']) await copyFile(f,`dist/${f}`);
await mkdir('dist/assets/images',{recursive:true});
for(const f of ['app.js','checkout.js','checkout-result.js','products.js','style.css','withdrawal.js','images/hodlware-icon.png','images/info-scenes.png','images/seed-recovery-hero.png','images/steel-recovery-detail.png','images/steel-recovery-open.jpg','images/steel-recovery-set.png'])await copyFile(`assets/${f}`,`dist/assets/${f}`);
await writeFile('dist/_routes.json',JSON.stringify({version:1,include:['/api/*'],exclude:[]}));
await writeFile('dist/_headers','/checkout-*\n  Cache-Control: no-store\n  Referrer-Policy: no-referrer\n/*\n  X-Content-Type-Options: nosniff\n');
