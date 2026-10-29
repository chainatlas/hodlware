import {readFile,readdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
// Reject invalid UTF-8 and the Windows-1252/UTF-8 double-decoding seen in the catalog.
export function assertCleanEncoding(bytes,label='text'){
 const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 if(/[\u00c3\u00c2][\u0080-\u00bf]|\u00e2[\u0080-\u00bf\u20ac]|\ufffd/.test(text))throw Error(`Invalid text encoding: ${label}`);
 return text;
}
export async function checkProductEncoding(){
 const files=(await readdir(root)).filter(f=>f.endsWith('.html'));
 for(const folder of ['assets','server','functions/api','scripts','ratgeber']){
  for(const f of await readdir(new URL(folder+'/',root)))if(/\.(?:js|mjs|html)$/.test(f))files.push(folder+'/'+f);
 }
 for(const file of files)assertCleanEncoding(await readFile(new URL(file,root)),file);
 return files.length;
}
