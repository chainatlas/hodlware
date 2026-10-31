// Deterministic, proportional derivatives; never crop or modify the source photos.
import {createRequire} from 'node:module';import {writeFile,stat,mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url),sharp=require('sharp'),manifest=[];
await mkdir('artifacts/seo-phase-1',{recursive:true});
for(const series of ['steel-recovery-8-digits','steel-recovery-8-digits-silver'])for(let i=1;i<=8;i++){
 const stem=`assets/images/${series}-${String(i).padStart(2,'0')}`,source=stem+(series.endsWith('silver')?'.webp':'.png'),meta=await sharp(source).metadata();const outputs={};
 for(const [suffix,width] of [['-optimized',1280],['-640',640],['-thumb',160]]){const file=stem+suffix+'.webp';await sharp(source).resize({width,withoutEnlargement:true,fit:'inside'}).webp({quality:88,effort:6}).toFile(file);const m=await sharp(file).metadata();outputs[suffix]={file,width:m.width,height:m.height,bytes:(await stat(file)).size};}
 manifest.push({source,bytes:(await stat(source)).size,width:meta.width,height:meta.height,outputs});
}
await writeFile('artifacts/seo-phase-1/image-manifest.json',JSON.stringify(manifest,null,2));

