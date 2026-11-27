import {createHash} from 'node:crypto'
export const licenses={'CC0-1.0':'https://creativecommons.org/publicdomain/zero/1.0/','CC-BY-2.0':'https://creativecommons.org/licenses/by/2.0/','CC-BY-4.0':'https://creativecommons.org/licenses/by/4.0/','CC-BY-SA-4.0':'https://creativecommons.org/licenses/by-sa/4.0/'}
const categories=['크로키','풍경화','인물화','정물화','동물화','꽃과 식물','건축','기타']
const levels=['기초','중급','고급']
const date=/^\d{4}-\d{2}-\d{2}$/
export const maxBytes=25*1024*1024
export function sourceKey(s){const u=new URL(s);if(u.protocol!=='https:'||u.hostname!=='commons.wikimedia.org'||u.port||u.username||u.password||u.search||u.hash||!u.pathname.startsWith('/wiki/File:'))throw Error('invalid source URL');return decodeURIComponent(u.pathname.slice(6)).replaceAll('_',' ').normalize('NFC')}
export function imageKey(s){const u=new URL(s);if(u.protocol!=='https:'||u.hostname!=='upload.wikimedia.org'||u.port||u.username||u.password||u.search||u.hash||!/^\/wikipedia\/commons\/[a-f0-9]\/[a-f0-9]{2}\//.test(u.pathname))throw Error('invalid original URL');return decodeURIComponent(u.pathname).normalize('NFC')}
export function checkItem(i,review=false){
 if(!i||!['id','title','category','tag','level','author','license','source','image','added'].every(k=>typeof i[k]==='string'&&i[k].trim()))throw Error('missing metadata')
 if(!/^[a-z0-9-]{1,80}$/.test(i.id)||!categories.includes(i.category)||!levels.includes(i.level)||!Object.hasOwn(licenses,i.license)||!date.test(i.added))throw Error('invalid item')
 const key=sourceKey(i.source),image=imageKey(i.image)
 if(key.slice(5)!==image.split('/').at(-1).replaceAll('_',' '))throw Error('filename mismatch')
 if(review){const r=i.review;if(!r||r.visual!==true||!date.test(r.date)||typeof r.note!=='string'||r.note.trim().length<5||!Number.isInteger(r.width)||!Number.isInteger(r.height)||Math.min(r.width,r.height)<800||Math.max(r.width,r.height)<1200)throw Error('visual review or resolution missing')}
 if(i.sha256!==undefined&&!/^[a-f0-9]{64}$/.test(i.sha256))throw Error('invalid SHA256')
 if(i.commonsSha1!==undefined&&!/^[a-z0-9]{1,40}$/.test(i.commonsSha1))throw Error('invalid Commons SHA1')
}
export function validateCatalog(c){
 if(!c||c.schema!==1||!Number.isSafeInteger(c.version)||c.version<1||!date.test(c.updated)||!Array.isArray(c.items)||c.items.length>5000)throw Error('invalid catalog')
 const ids=new Set(),sources=new Set(),images=new Set(),hashes=new Set(),sha1s=new Set()
 for(const i of c.items){checkItem(i);const s=sourceKey(i.source),m=imageKey(i.image);if(ids.has(i.id)||sources.has(s)||images.has(m)||(i.sha256&&hashes.has(i.sha256))||(i.commonsSha1&&sha1s.has(i.commonsSha1)))throw Error('duplicate catalog item: '+i.id);ids.add(i.id);sources.add(s);images.add(m);if(i.sha256)hashes.add(i.sha256);if(i.commonsSha1)sha1s.add(i.commonsSha1)}
 return c
}
export function checkLive(item,info){
 checkItem(item,true)
 if(!info||imageKey(info.url)!==imageKey(item.image)||!['image/jpeg','image/png','image/webp'].includes(info.mime)||!Number.isInteger(info.size)||info.size<1||info.size>maxBytes||info.width!==item.review.width||info.height!==item.review.height)throw Error('live file differs from review or exceeds limits')
 const license=info.extmetadata?.LicenseUrl?.value
 if(typeof license!=='string'||license.replace(/^http:/,'https:').replace(/\/deed\.[a-z-]+$/,'/').replace(/\/?$/,'/')!==licenses[item.license])throw Error('license mismatch')
 if(!info.extmetadata?.Artist?.value?.trim()||!info.sha1||!/^[a-z0-9]{1,40}$/.test(info.sha1))throw Error('live author or hash missing')
}
export function digest(bytes){return createHash('sha256').update(bytes).digest('hex')}
export function mergeCatalog(c,items,today){
 validateCatalog(c)
 if(!items.length)return c
 const next={...c,version:c.version+1,updated:today,items:[...c.items,...items]}
 return validateCatalog(next)
}
