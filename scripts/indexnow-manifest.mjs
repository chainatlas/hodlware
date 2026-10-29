import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

export const ORIGIN='https://hodlware.de';
export const KEY='67c781f634734bc78b734802d795d817';
export const KEY_PATH=`/${KEY}.txt`;
const blocked=/(?:^|\/)(?:api|admin|checkout[^/]*|cart|warenkorb|success|danke|test[^/]*|preview[^/]*)(?:\/|$)/i;
export function sitemapURLs(xml){
 return [...new Set([...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(m=>m[1].trim()))].filter(value=>{
  const u=new URL(value);return u.origin===ORIGIN&&!u.search&&!u.hash&&!blocked.test(u.pathname);
 }).sort();
}
export function indexable(html,url){
 const metas=html.match(/<meta\b[^>]*>/gi)||[];
 if(metas.some(m=>/name\s*=\s*["'](?:robots|bingbot)["']/i.test(m)&&/content\s*=\s*["'][^"']*\b(?:noindex|none)\b/i.test(m)))return false;
 const canonical=(html.match(/<link\b[^>]*>/gi)||[]).find(m=>/rel\s*=\s*["']canonical["']/i.test(m));
 return !canonical||new URL(/href\s*=\s*["']([^"']+)/i.exec(canonical)?.[1],url).href===url;
}
const normalized=s=>s.replace(/\?v=[a-zA-Z0-9_-]+/g,'').replace(/\r\n/g,'\n');
export async function fingerprint(file,read){
 const visited=new Set(),parts=[];
 async function visit(file){
  if(visited.has(file))return;visited.add(file);
  const bytes=await read(file),text=/\.(?:html|css|js|mjs)$/.test(file)?normalized(bytes.toString('utf8')):null;
  parts.push([file,createHash('sha256').update(text??bytes).digest('hex')]);
  if(text===null)return;
  const refs=new Set([...text.matchAll(/\bassets\/[^\s"'<>`)?#,;]+/g)].map(m=>m[0]));
  for(const m of text.matchAll(/url\(\s*["']?([^\s"')]+)|(?:from\s*|import\s*)["'](\.[^"']+)/g)){
   const ref=(m[1]||m[2]).split(/[?#]/)[0];if(ref.startsWith('data:')||/^https?:/.test(ref))continue;
   refs.add(path.posix.normalize(path.posix.join(path.posix.dirname(file),ref)));
  }
  for(const ref of [...refs].sort())if(ref.startsWith('assets/')&&!ref.includes('..'))await visit(ref);
 }
 await visit(file);return createHash('sha256').update(JSON.stringify(parts.sort())).digest('hex');
}
export async function writeIndexNowManifest(directory='dist'){
 const read=file=>readFile(path.join(directory,file));
 const urls=sitemapURLs(await readFile(path.join(directory,'sitemap.xml'),'utf8')),pages={};
 for(const url of urls){const pathname=new URL(url).pathname;const file=pathname==='/'?'index.html':pathname.slice(1)+'.html';const html=(await read(file)).toString('utf8');if(indexable(html,url))pages[url]=await fingerprint(file,read);}
 const commit=process.env.CF_PAGES_COMMIT_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 await writeFile(path.join(directory,'indexnow-manifest.json'),JSON.stringify({version:1,commit,pages}));
}
export const changedURLs=(current,previous={})=>Object.keys(current).filter(url=>current[url]!==previous[url]).sort();
