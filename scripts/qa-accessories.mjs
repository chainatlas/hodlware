// Run after the production build. Playwright may be resolved through NODE_PATH.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const port=Number(process.env.QA_PORT||8790),origin=`http://127.0.0.1:${port}`,out='artifacts/accessories-review';
await mkdir(out,{recursive:true});
const server=spawn(process.execPath,['scripts/preview-accessories.mjs'],{stdio:'pipe',env:{...process.env,PREVIEW_PORT:String(port)}});
const checks=[],errors=[],blockedRequests=[];
const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
const money=value=>(value/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'});
let browser;
try{
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Preview startup timed out')),10000);server.stdout.once('data',()=>{clearTimeout(timeout);resolve();});server.once('error',reject);server.once('exit',code=>reject(Error('Preview exit '+code)));});
 browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 for(const [label,width,height] of [['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740],['tablet',768,1024],['wide-mobile',600,900],['small-desktop',1024,900]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:width<=600,hasTouch:width<=600});
  await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){blockedRequests.push(route.request().url());return route.abort();}return route.continue();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(`${label}: ${e.message}`));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/api/create-checkout-session'))errors.push(`${label}: HTTP ${r.status()} ${r.url()}`);});
  await page.goto(origin+'/zubehoer');await page.waitForFunction(()=>document.querySelector('.accessory-add')?.disabled===false);
  check(`${label}: one accessory card`,await page.locator('.accessory-card').count()===1);
  check(`${label}: confirmed product dimensions and thin profile`,(await page.locator('.accessory-card').innerText()).includes('5 × 1 cm pro Sticker')&&(await page.locator('.accessory-card').innerText()).includes('Besonders dünn, trägt kaum auf'));
  check(`${label}: original product photos replace placeholder`,await page.locator('.photo-placeholder').count()===0&&await page.locator('.accessory-thumbnails button').count()===3);
  const photo=page.locator('.accessory-gallery .accessory-photo');await photo.waitFor();await page.waitForFunction(()=>document.querySelector('.accessory-photo').complete&&document.querySelector('.accessory-photo').naturalWidth>0);
  check(`${label}: withdrawal access stays available without covering photos`,await page.locator('header .accessory-withdrawal').isVisible()&&await page.locator('.withdrawal-access').count()===0);
  check(`${label}: responsive photo loads without cropping`,await photo.evaluate(image=>getComputedStyle(image).objectFit==='contain'&&image.currentSrc.endsWith('.webp')));
  await page.getByRole('button',{name:'VOID-Muster nach dem Ablösen',exact:true}).click();check(`${label}: peeled original selected`,(await photo.getAttribute('alt')).includes('Teilweise abgelöster'));
  await page.waitForFunction(()=>document.querySelector('.accessory-photo').complete&&document.querySelector('.accessory-photo').naturalWidth>0);await page.locator('.accessory-gallery').screenshot({animations:'disabled',path:out+'/'+label+'-void-pattern.png'});
  await page.getByRole('button',{name:'Sticker auf heller Oberfläche',exact:true}).click();await page.getByRole('button',{name:'Sticker auf heller Oberfläche',exact:true}).press('ArrowRight');check(`${label}: keyboard selects hand photo`,(await photo.getAttribute('alt')).includes('Fingern'));
  await page.getByRole('button',{name:'Sticker auf heller Oberfläche',exact:true}).click();
  check(`${label}: four package choices`,await page.getByRole('radio').count()===4);
  check(`${label}: navigation visible`,await page.locator('header nav').isVisible());
  check(`${label}: no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  check(`${label}: compact product card`,(await page.locator('.accessory-card').boundingBox()).width<=600);
  for(const [units,price] of [[1,99],[5,349],[10,599],[25,1199]]){
   const radio=page.locator(`input[value="void-${units}"]`);await radio.check();check(`${label}: ${units} pack price`,(await radio.locator('..').innerText()).includes(money(price)+' pro Paket'));
   await page.locator('.accessory-add').click();
  }
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({animations:'disabled',path:`${out}/${label}.png`,fullPage:true});
  await page.locator('[data-cart]').click();await page.waitForFunction(()=>{const r=document.getElementById('drawer').getBoundingClientRect();return Math.abs(r.right-innerWidth)<1&&r.left>=0;});await page.waitForSelector('#drawer.open .checkout-controls');
  check(`${label}: all four packages in cart`,await page.locator('.cartline').count()===4);
  check(`${label}: package subtotal`,await page.locator('[data-subtotal]').innerText()===money(2246));
  check(`${label}: sticker shipping once`,await page.locator('[data-shipping]').innerText()===money(110));
  check(`${label}: sticker total`,await page.locator('#total').innerText()===money(2356));
  for(const units of [1,5,10])await page.locator('.cartline').filter({hasText:`· ${units} Stück`}).getByRole('button',{name:'Entfernen'}).click();
  await page.locator('.cartline input').fill('2');await page.locator('.cartline input').dispatchEvent('change');
  check(`${label}: two 25-packs subtotal`,await page.locator('[data-subtotal]').innerText()===money(2398));
  check(`${label}: two 25-packs total`,await page.locator('#total').innerText()===money(2508));
  await page.locator('#drawer').screenshot({animations:'disabled',path:`${out}/${label}-sticker-cart.png`});
  await page.locator('[data-close]').click();await page.getByRole('link',{name:'Shop',exact:true}).click();await page.waitForSelector('#products .product');
  check(`${label}: homepage exactly two plate cards`,await page.locator('#products .product').count()===2);
  check(`${label}: homepage has no sticker product card`,await page.locator('.accessory-card,.accessory-add,.add[data-id^="void-"]').count()===0);
  check(`${label}: homepage accessory link visible`,await page.locator('header a[href="/zubehoer"]').isVisible());
  if(['desktop','mobile'].includes(label)){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({animations:'disabled',path:`${out}/${label}-homepage.png`,fullPage:true});}
  const addPlate=page.locator('.add[data-id="recoveryplate4"]');await page.waitForFunction(()=>!document.querySelector('.add[data-id="recoveryplate4"]').disabled);await addPlate.click();await page.locator('[data-cart]').click();await page.waitForFunction(()=>{const r=document.getElementById('drawer').getBoundingClientRect();return Math.abs(r.right-innerWidth)<1&&r.left>=0;});
  check(`${label}: mixed shipping once`,await page.locator('[data-shipping]').innerText()===money(619));
  check(`${label}: mixed total`,await page.locator('#total').innerText()===money(10917));
  const plateLine=page.locator('.cartline').filter({hasText:'(4 Digit - BIP39)'});await plateLine.locator('input').fill('2');await plateLine.locator('input').dispatchEvent('change');
  check(`${label}: two plates still one shipping charge`,await page.locator('[data-shipping]').innerText()===money(619));
  check(`${label}: two plates and two sticker packs total`,await page.locator('#total').innerText()===money(18817));
  await page.locator('#drawer').screenshot({animations:'disabled',path:`${out}/${label}-mixed-cart.png`});
  await page.locator('.checkout-start').click();await page.getByText('Lokale Demo: Keine Zahlung wird gestartet.',{exact:false}).waitFor();
  check(`${label}: local checkout safely blocked`,true);await page.locator('[data-close]').click();
  for(const path of ['/steel-seed-phrase-recovery','/steel-seed-phrase-recovery-plate']){
   await page.goto(origin+path);check(`${label}: ${path} has no accessory upsell`,await page.locator('.accessory-card,.accessory-add,.add[data-id^="void-"]').count()===0);
   check(`${label}: ${path} navigation works`,await page.locator('header a[href="/zubehoer"]').isVisible());await page.locator('header a[href="/zubehoer"]').click();await page.waitForSelector('.accessory-card');
  }
  await page.reload();await page.locator('[data-cart]').click();await page.waitForFunction(()=>{const r=document.getElementById('drawer').getBoundingClientRect();return Math.abs(r.right-innerWidth)<1&&r.left>=0;});await page.waitForSelector('.cartline');check(`${label}: cart persists across navigation`,await page.locator('.cartline').count()===2);
  await context.close();
 }
 const context=await browser.newContext();const page=await context.newPage();
 await page.route('**/api/checkout-context',route=>route.fulfill({json:{ready:true,products:{'void-1':{available:false},'void-5':{available:true}}}}));
 await page.goto(origin+'/zubehoer');check('sold-out pack cannot be added',await page.locator('.accessory-add').isDisabled());await page.locator('input[value="void-5"]').check();check('available alternate pack can be selected',await page.locator('.accessory-add').isEnabled());await context.close();
 check('no browser runtime or asset errors',errors.length===0);check('no external requests',blockedRequests.length===0);
 await writeFile(`${out}/results.json`,JSON.stringify({passed:checks.length,checks,errors,blockedRequests,viewports:[1440,390,320,768,600,1024],browser:await browser.version()},null,2));
 console.log(`Playwright: ${checks.length} checks passed; 6 viewport sizes; no external requests or runtime errors.`);
}finally{if(browser)await browser.close();server.kill();}
