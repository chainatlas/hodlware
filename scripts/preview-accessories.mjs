// Local, fixture-only preview. No credentials, D1, Stripe or email services are used.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://127.0.0.1').pathname;
 if(pathname.startsWith('/api/')){
  res.setHeader('Content-Type','application/json');
  if(pathname==='/api/checkout-context'){res.end(JSON.stringify({ready:true,products:Object.fromEntries(['recoveryplate4','void-1','void-5','void-10','void-25'].map(id=>[id,{available:true}]))}));return;}
  res.statusCode=503;res.end(JSON.stringify({error:'Lokale Demo: Keine Zahlung wird gestartet. Checkout wird ausschließlich mit simulierten Stripe-Antworten getestet.'}));return;
 }
 let file=pathname==='/'?'index.html':decodeURIComponent(pathname.slice(1));if(!path.extname(file))file+='.html';
 const target=path.resolve(root,file);if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{let data=await readFile(target);const type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon'}[path.extname(file)]||'application/octet-stream';res.setHeader('Content-Type',type);res.setHeader('Cache-Control','no-store');if(file.endsWith('.html'))data=data.toString().replace('<body>','<body><div style="background:#ff6500;color:#000;padding:12px;text-align:center">LOKALE DEMO · Bestand simuliert · Keine Zahlungen oder E-Mails</div>');if(file.endsWith('.html')&&process.env.HEADER_PREVIEW==='petrol')data=data.toString().replace('</head>',"<style>header{background:#244957;color:#fff;border-bottom:1px solid #3c6270;box-shadow:0 0 0 100vmax #244957;clip-path:inset(0 -100vmax)}header .brand,header nav,header nav a,header nav a.accessory-withdrawal{color:#fff}header .brand i{color:#ff8a00}header nav a:hover{text-decoration:underline;text-underline-offset:5px}header .cart{background:#ff6500;color:#111;border:0;border-radius:6px}header .cart b{color:#111}header :focus-visible{outline:2px solid #fff;outline-offset:4px}</style></head>");res.end(data);}catch{res.writeHead(404);res.end('Nicht gefunden');}
}).listen(Number(process.env.PREVIEW_PORT||8788),'127.0.0.1',()=>console.log(`Lokale Demo: http://127.0.0.1:${process.env.PREVIEW_PORT||8788}/zubehoer`));
