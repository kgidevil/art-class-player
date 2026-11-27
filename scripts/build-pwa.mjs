import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import path from 'node:path'
import sharp from 'sharp'
const dist=path.resolve('dist')
await mkdir(path.join(dist,'icons'),{recursive:true})
const logo=await sharp(path.join(dist,'sai-logo.jpg')).resize(370,210,{fit:'contain',background:'#111010'}).png().toBuffer()
const icon=await sharp({create:{width:512,height:512,channels:3,background:'#111010'}}).composite([{input:logo,gravity:'centre'}]).png().toBuffer()
for(const [name,size] of [['icon-192.png',192],['icon-512.png',512],['icon-maskable.png',512]])await sharp(icon).resize(size,size).png().toFile(path.join(dist,'icons',name))
async function walk(dir){const entries=await readdir(dir,{withFileTypes:true});const list=[];for(const e of entries){const p=path.join(dir,e.name);if(e.isDirectory())list.push(...await walk(p));else if(e.name!=='sw.js')list.push(p)}return list}
const paths=(await walk(dist)).sort()
const hash=createHash('sha256')
hash.update(await readFile(new URL(import.meta.url)))
for(const p of paths){hash.update(path.relative(dist,p).replaceAll('\\','/'));hash.update(await readFile(p))}
const version=hash.digest('hex').slice(0,16)
const assets=paths.map(p=>'./'+path.relative(dist,p).replaceAll('\\','/'))
const sw=`
const PREFIX='sai-art-player-';
const CACHE=PREFIX+'${version}';
const ASSETS=${JSON.stringify(assets)};
const STATIC=new Set(ASSETS.map(asset=>new URL(asset,self.registration.scope).href));
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(asset=>new Request(new URL(asset,self.registration.scope),{cache:'reload'})))));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim()})());
});
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const request=event.request;const url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 if(request.mode==='navigate'){
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(new URL('index.html',self.registration.scope).href,{ignoreVary:true}))||fetch(request)));return;
 }
 if(STATIC.has(url.href))event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(url.href,{ignoreVary:true}))||fetch(request)));
});
`;
await writeFile(path.join(dist,'sw.js'),sw)
console.log('PWA precache '+version+': '+assets.length+' assets')
