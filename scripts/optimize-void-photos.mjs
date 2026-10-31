// Reproduce optimized originals; no cropping, compositing, retouching or generation.
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const require=createRequire(import.meta.url),sharp=require('sharp');
const sourceDirectory=process.argv[2];if(!sourceDirectory)throw Error('Pass the folder containing the three original PNG photos.');
const files=[['void only white.png','void-sticker-original'],['void white with hand.png','void-sticker-hand'],['void2.png','void-sticker-peeled']];
const directory='assets/images/void';await mkdir(directory,{recursive:true});const records=[];
for(const [source,name] of files){
 const input=await readFile(path.join(sourceDirectory,source)),metadata=await sharp(input).metadata(),outputs=[];
 for(const [suffix,width] of [['',1440],['-720',720],['-160',160]]){
  const file=`${directory}/${name}${suffix}.webp`;
  const info=await sharp(input).resize({width,withoutEnlargement:true}).webp({quality:90,effort:6,smartSubsample:true}).toFile(file);
  outputs.push({file,width:info.width,height:info.height,bytes:(await stat(file)).size});
 }
 records.push({source,sourceSha256:createHash('sha256').update(input).digest('hex'),sourceBytes:input.length,sourceWidth:metadata.width,sourceHeight:metadata.height,outputs});
}
await writeFile('artifacts/accessories-review/photo-manifest.json',JSON.stringify({method:'Proportional resize only; WebP quality 90. No cropping, retouching, color or product alterations.',photos:records},null,2));
console.log(JSON.stringify(records,null,2));
