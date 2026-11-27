import {readFile,writeFile,rename} from 'node:fs/promises'
import sharp from 'sharp'
import {validateCatalog,checkItem,checkLive,sourceKey,imageKey,mergeCatalog,maxBytes,digest} from './content-core.mjs'
const catalogPath='public/content/catalog.json',queuePath='content/approved.json'
const c=validateCatalog(JSON.parse(await readFile(catalogPath,'utf8')))
const q=JSON.parse(await readFile(queuePath,'utf8'))
if(q.schema!==1||!Array.isArray(q.items)||q.items.length>500)throw Error('invalid approval queue')
const userAgent='SAI-Art-Class-Player/0.5 (https://github.com/kgidevil/art-class-player)'
const headers={'User-Agent':userAgent}
const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date())
const existing=new Map(c.items.map(i=>[i.id,i]))
const seenSources=new Set(c.items.map(i=>sourceKey(i.source)))
const seenImages=new Set(c.items.map(i=>imageKey(i.image)))
const sha1s=new Set(c.items.flatMap(i=>i.commonsSha1?[i.commonsSha1]:[]))
const hashes=new Set(c.items.flatMap(i=>i.sha256?[i.sha256]:[]))
const queueIds=new Set(), pending=[]
for(const i of q.items){
 checkItem(i,true)
 if(queueIds.has(i.id))throw Error('duplicate queue id '+i.id)
 queueIds.add(i.id)
 if(existing.has(i.id)){if(sourceKey(existing.get(i.id).source)!==sourceKey(i.source))throw Error('ID reused '+i.id);continue}
 if(seenSources.has(sourceKey(i.source))||seenImages.has(imageKey(i.image)))throw Error('duplicate approval source '+i.id)
 pending.push(i)
}
if(!pending.length){console.log('No approved unpublished references.');process.exit(0)}
async function infoFor(titles){
 const map=new Map()
 for(let n=0;n<titles.length;n+=35){
  const u=new URL('https://commons.wikimedia.org/w/api.php')
  u.search=new URLSearchParams({action:'query',format:'json',formatversion:'2',prop:'imageinfo',iiprop:'url|size|mime|sha1|extmetadata',titles:titles.slice(n,n+35).join('|')})
  const res=await fetch(u,{headers,signal:AbortSignal.timeout(30000)})
  if(!res.ok)throw Error('Commons metadata HTTP '+res.status)
  const data=await res.json();if(data.error||!Array.isArray(data.query?.pages))throw Error('Commons metadata response invalid')
  for(const p of data.query.pages){if(p.imageinfo?.[0])map.set(p.title.replaceAll('_',' ').normalize('NFC'),p.imageinfo[0])}
 }
 return map
}
const metadata=await infoFor([...new Set([...c.items,...pending].map(i=>sourceKey(i.source)))])
for(const item of c.items){const info=metadata.get(sourceKey(item.source));if(info?.sha1)sha1s.add(info.sha1)}
const accepted=[],rejected=[]
for(const item of pending.slice(0,45)){
 try{
  const info=metadata.get(sourceKey(item.source))
  checkLive(item,info)
  if(seenSources.has(sourceKey(item.source))||seenImages.has(imageKey(item.image))||sha1s.has(info.sha1))throw Error('duplicate source or SHA1')
  const res=await fetch(item.image,{headers,redirect:'error',signal:AbortSignal.timeout(60000)})
  if(!res.ok||!['image/jpeg','image/png','image/webp'].includes((res.headers.get('content-type')||'').split(';')[0]))throw Error('original download failed')
  const reader=res.body.getReader();let length=0;const chunks=[]
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>maxBytes){await reader.cancel();throw Error('too large')}chunks.push(Buffer.from(value))}
  const bytes=Buffer.concat(chunks);if(bytes.length!==info.size)throw Error('original size changed')
  const meta=await sharp(bytes,{limitInputPixels:80000000,failOn:'error'}).metadata()
  if(meta.width!==info.width||meta.height!==info.height)throw Error('decoded dimensions mismatch')
  await sharp(bytes,{limitInputPixels:80000000,failOn:'error'}).resize(64,64,{fit:'inside'}).png().toBuffer()
  const sha256=digest(bytes);if(hashes.has(sha256))throw Error('duplicate bytes')
  accepted.push({...item,added:today,commonsSha1:info.sha1,sha256,verifiedAt:today})
  seenSources.add(sourceKey(item.source));seenImages.add(imageKey(item.image));sha1s.add(info.sha1);hashes.add(sha256)
 }catch(e){rejected.push({id:item.id,reason:String(e)});console.warn('REJECT',item.id,String(e))}
}
console.log(JSON.stringify({approved:pending.length,accepted:accepted.map(i=>i.id),rejected},null,2))
if(!accepted.length)throw Error('No candidate passed live verification; catalog unchanged')
const next=mergeCatalog(c,accepted,today)
if(process.argv.includes('--dry-run')){console.log('Dry run: would publish catalog v'+next.version);process.exit(0)}
await writeFile(catalogPath+'.tmp',JSON.stringify(next,null,2)+'\n');await rename(catalogPath+'.tmp',catalogPath)
console.log('Catalog v'+next.version+': '+next.items.length+' references')
