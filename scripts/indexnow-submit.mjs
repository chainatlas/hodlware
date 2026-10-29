// Deployment-only tool: no shop runtime, Cloudflare credentials or customer data.
import {writeFile,appendFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {ORIGIN,KEY,KEY_PATH,sitemapURLs,indexable,changedURLs} from './indexnow-manifest.mjs';
const branch='indexnow-state',repo='chainatlas/hodlware';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function waitForDeployment(sha,{fetcher=fetch,pause=sleep,attempts=24}={}){
 for(let i=0;i<attempts;i++){
  const head=await fetcher(`https://api.github.com/repos/${repo}/git/ref/heads/main`,{headers:{'User-Agent':'HODLWARE-IndexNow'}});
  if(!head.ok)throw Error('Cannot verify production branch');
  if((await head.json()).object.sha!==sha)return null; // Superseded commit: never submit it.
  try{const r=await fetcher(`${ORIGIN}/indexnow-manifest.json?deployment=${sha}`,{cache:'no-store',redirect:'error'});if(r.ok&&r.headers.get('content-type')?.includes('application/json')){const m=await r.json();if(m.version===1&&m.commit===sha)return m;}}catch{}
  if(i+1<attempts)await pause(30000);
 }
 throw Error('Production deployment not verified; no IndexNow request sent');
}
export async function submitURLs(urls,{fetcher=fetch}={}){
 if(!urls.length)return null;
 const r=await fetcher('https://api.indexnow.org/indexnow',{method:'POST',redirect:'error',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify({host:'hodlware.de',key:KEY,keyLocation:ORIGIN+KEY_PATH,urlList:urls}),signal:AbortSignal.timeout(30000)});
 if(![200,202].includes(r.status))throw Error(`IndexNow HTTP ${r.status}; no automatic retry`);
 return r.status;
}
async function main(){
 if(process.env.GITHUB_REPOSITORY!==repo||process.env.GITHUB_REF!=='refs/heads/main')throw Error('Production main only');
 const sha=process.env.GITHUB_SHA,token=process.env.GITHUB_TOKEN;
 if(!/^[a-f0-9]{40}$/.test(sha||'')||!token)throw Error('Missing workflow context');
 const api=async(route,method='GET',body)=>{
  const r=await fetch(`https://api.github.com/repos/${repo}/${route}`,{method,headers:{Authorization:`Bearer ${token}`,'User-Agent':'HODLWARE-IndexNow','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},...(body?{body:JSON.stringify(body)}:{})});
  if(r.status===404&&method==='GET')return null;
  if(!r.ok)throw Error(`GitHub state ${method} HTTP ${r.status}`);
  return r.json();
 };
 const manifest=await waitForDeployment(sha);if(!manifest){console.log('Superseded deployment; skipped');return;}
 const key=await fetch(ORIGIN+KEY_PATH,{cache:'no-store',redirect:'error'});
 if(key.status!==200||await key.text()!==KEY)throw Error('Public key verification failed');
 const map=await fetch(ORIGIN+'/sitemap.xml',{cache:'no-store',redirect:'error'});
 if(!map.ok||!/(?:application|text)\/xml/.test(map.headers.get('content-type')||''))throw Error('Invalid production sitemap');
 const allowed=new Set(sitemapURLs(await map.text()));
 if(Object.keys(manifest.pages).some(url=>!allowed.has(url)))throw Error('Manifest URL outside sitemap');
 let existing=await api(`contents/state.json?ref=${branch}`);
 if(!existing){
  // A tiny persistent state branch avoids cache expiry and duplicate re-submissions.
  // Cloudflare explicitly honors the [skip ci] prefix; this creates no Pages build.
  const blob=await api('git/blobs','POST',{content:'{}',encoding:'utf-8'});
  const tree=await api('git/trees','POST',{tree:[{path:'state.json',mode:'100644',type:'blob',sha:blob.sha}]});
  const commit=await api('git/commits','POST',{message:'[skip ci] Initialize IndexNow submission state',tree:tree.sha,parents:[]});
  await api('git/refs','POST',{ref:`refs/heads/${branch}`,sha:commit.sha});
  existing=await api(`contents/state.json?ref=${branch}`);
 }
 const previous=JSON.parse(Buffer.from(existing.content,'base64').toString('utf8'));
 const urls=changedURLs(manifest.pages,previous.pages);
 for(const url of urls){
  const r=await fetch(url,{cache:'no-store',redirect:'error'});
  if(r.status!==200||!r.headers.get('content-type')?.includes('text/html')||/noindex|none/i.test(r.headers.get('x-robots-tag')||'')||!indexable(await r.text(),url))throw Error(`URL not publicly indexable: ${url}`);
 }
 // Recheck after all validation: a newer rollout must never inherit this batch.
 const current=await fetch(`${ORIGIN}/indexnow-manifest.json?verify=${sha}`,{cache:'no-store',redirect:'error'});
 if(!current.ok||(await current.json()).commit!==sha)throw Error('Production changed before submission');
 const status=await submitURLs(urls);
 const result={commit:sha,httpStatus:status,urls,checkedAt:new Date().toISOString()};
 console.log(JSON.stringify(result,null,2));
 await writeFile('indexnow-result.json',JSON.stringify(result,null,2));
 if(status!==null){
  await api('contents/state.json','PUT',{branch,message:'[skip ci] Record accepted IndexNow URLs',sha:existing.sha,content:Buffer.from(JSON.stringify({...manifest,lastSubmission:result},null,2)).toString('base64')});
 }
 if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`## IndexNow\nCommit: ${sha}\n\nHTTP: ${status??'Keine Änderungen – keine Meldung'}\n\n${urls.map(u=>'- '+u).join('\n')}\n`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
