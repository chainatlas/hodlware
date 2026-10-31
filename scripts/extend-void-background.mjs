// Preserve the real product; blend only background edges into the outpainted canvas.
import {createRequire} from 'node:module';import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),sharp=require('sharp');
const originalPath=process.argv[2],backgroundPath=process.argv[3];if(!originalPath||!backgroundPath)throw Error('Pass original photo and generated background paths.');
const original=await readFile(originalPath),background=await readFile(backgroundPath),width=1536,height=1024,top=174,bandHeight=675,fade=72;
const {data,info}=await sharp(original).resize(width,bandHeight,{fit:'fill'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
for(let y=0;y<bandHeight;y++){const alpha=Math.min(1,y/fade,(bandHeight-1-y)/fade);for(let x=0;x<width;x++)data[(y*width+x)*4+3]=Math.round(255*alpha);}
const overlay=await sharp(data,{raw:{width,height:bandHeight,channels:4}}).png().toBuffer();
const output=await sharp(background).resize(width,height,{fit:'fill'}).composite([{input:overlay,left:0,top}]).png().toBuffer();
await writeFile('assets/source/void-sticker-original-extended.png',output);
// The entire source band between fade edges, containing the sticker, must match exactly.
const actual=await sharp(output).extract({left:0,top:top+fade,width,height:bandHeight-fade*2}).removeAlpha().raw().toBuffer();
const expected=await sharp(original).resize(width,bandHeight,{fit:'fill'}).extract({left:0,top:fade,width,height:bandHeight-fade*2}).removeAlpha().raw().toBuffer();
if(!actual.equals(expected))throw Error('Protected original photo band was altered');
await writeFile('artifacts/accessories-layout-review/background-extension.json',JSON.stringify({original:'void only white.png',originalSha256:createHash('sha256').update(original).digest('hex'),tool:'built-in image_gen',generationFile:backgroundPath.split(/[\\/]/).pop(),generationSha256:createHash('sha256').update(background).digest('hex'),output:'assets/source/void-sticker-original-extended.png',outputSha256:createHash('sha256').update(output).digest('hex'),width,height,originalBand:{top,height:bandHeight},backgroundEdgeFadePixels:fade,protectedOriginalBand:{top:top+fade,height:bandHeight-fade*2},protectedBandExactMatch:true,prompt:'Extend only the silver tabletop background above and below the original photo to 3:2; preserve the sticker, lettering, hologram, proportions, reflections and shadows; no white bars, borders or new objects.'},null,2));console.log('3:2 master created; protected original product band matches exactly.');
