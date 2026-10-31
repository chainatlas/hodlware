// Optimize the originals; first photo uses the approved background-only 3:2 extension.
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const require=createRequire(import.meta.url),sharp=require('sharp');
const sourceDirectory=process.argv[2];if(!sourceDirectory)throw Error('Pass the folder containing the three original PNG photos.');
const files=[['void only white.png','void-sticker-original'],['void white with hand.png','void-sticker-hand'],['void2.png','void-sticker-peeled']];
const directory='assets/images/void';await mkdir(directory,{recursive:true});const records=[];
for(const [source,name] of files){
 const original=await readFile(path.join(sourceDirectory,source)),originalMetadata=await sharp(original).metadata();
 const editedSource=name==='void-sticker-original'?'assets/source/void-sticker-original-extended.png':null;
 const input=editedSource?await readFile(editedSource):original,metadata=await sharp(input).metadata(),outputs=[],outputName=name+(editedSource?'-extended':'');
 for(const [suffix,width] of [['',1440],['-720',720],['-160',160]]){
  const file=`${directory}/${outputName}${suffix}.webp`;
  const info=await sharp(input).resize({width,withoutEnlargement:true}).webp({quality:90,effort:6,smartSubsample:true}).toFile(file);
  outputs.push({file,width:info.width,height:info.height,bytes:(await stat(file)).size});
 }
 records.push({source,sourceSha256:createHash('sha256').update(original).digest('hex'),sourceBytes:original.length,sourceWidth:originalMetadata.width,sourceHeight:originalMetadata.height,...(editedSource?{editedSource,editedSourceSha256:createHash('sha256').update(input).digest('hex'),effectiveWidth:metadata.width,effectiveHeight:metadata.height,edit:'Background extended to 3:2. Protected original product band preserved exactly; see background-extension.json.'}:{}),outputs});
}
await writeFile('artifacts/accessories-review/photo-manifest.json',JSON.stringify({method:'WebP quality 90 with proportional resizing. First photo: approved background-only extension to 3:2; original product band preserved exactly. Other photos unchanged.',photos:records},null,2));
console.log(JSON.stringify(records,null,2));
