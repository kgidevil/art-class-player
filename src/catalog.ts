export const categories=['크로키','풍경화','인물화','정물화','동물화','꽃과 식물','건축','기타'] as const
export const levels=['기초','중급','고급'] as const
export type CatalogItem={id:string;title:string;category:string;tag:string;level:string;author:string;license:string;source:string;image:string;added:string}
export type Catalog={schema:1;version:number;updated:string;items:CatalogItem[]}
export const licenses:Record<string,string>={'CC0-1.0':'https://creativecommons.org/publicdomain/zero/1.0/','CC-BY-2.0':'https://creativecommons.org/licenses/by/2.0/','CC-BY-4.0':'https://creativecommons.org/licenses/by/4.0/','CC-BY-SA-4.0':'https://creativecommons.org/licenses/by-sa/4.0/'}
export function validateCatalog(value:unknown):Catalog {
 const v=value as Catalog
 if(!v||v.schema!==1||!Number.isSafeInteger(v.version)||v.version<1||!/^\d{4}-\d{2}-\d{2}$/.test(v.updated)||!Array.isArray(v.items)||v.items.length>5000)throw Error('Invalid catalog')
 const ids=new Set<string>()
 for(const i of v.items){
  if(!i||!['id','title','category','tag','level','author','license','source','image','added'].every(k=>typeof i[k as keyof CatalogItem]==='string'&&i[k as keyof CatalogItem].length>0))throw Error('Invalid item')
  if(!/^[a-z0-9-]{1,80}$/.test(i.id)||ids.has(i.id)||!categories.some(c=>c===i.category)||!levels.some(l=>l===i.level)||!Object.hasOwn(licenses,i.license)||!/^\d{4}-\d{2}-\d{2}$/.test(i.added))throw Error('Invalid metadata')
  const image=new URL(i.image),source=new URL(i.source)
  if(image.protocol!=='https:'||image.hostname!=='upload.wikimedia.org'||!image.pathname.startsWith('/wikipedia/commons/')||source.protocol!=='https:'||source.hostname!=='commons.wikimedia.org'||!source.pathname.startsWith('/wiki/File:'))throw Error('Invalid source')
  ids.add(i.id)
 }
 return v
}
const KEY='sai.catalog.v1'
export function readCatalog():Catalog|null{try{return validateCatalog(JSON.parse(localStorage.getItem(KEY)??'null'))}catch{return null}}
export const REMOTE_CATALOG='https://raw.githubusercontent.com/kgidevil/art-class-player/main/public/content/catalog.json'
export async function fetchCatalog():Promise<Catalog>{
 const candidates:Catalog[]=[]
 const prior=readCatalog();if(prior)candidates.push(prior)
 const urls=[import.meta.env.BASE_URL+'content/catalog.json',REMOTE_CATALOG]
 const results=await Promise.allSettled(urls.map(async url=>{
  const res=await fetch(url,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(12000)})
  if(!res.ok)throw Error('Catalog unavailable')
  return validateCatalog(await res.json())
 }))
 for(const r of results)if(r.status==='fulfilled')candidates.push(r.value)
 if(!candidates.length)throw Error('Catalog unavailable')
 const fresh=candidates.reduce((a,b)=>b.version>a.version?b:a)
 try{localStorage.setItem(KEY,JSON.stringify(fresh))}catch{/* still usable this session */}
 return fresh
}
export async function downloadReference(item:CatalogItem):Promise<Blob>{
 const response=await fetch(item.image,{mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(45000)})
 if(!response.ok)throw Error('Download failed')
 const blob=await response.blob()
 if(!['image/jpeg','image/png','image/webp'].includes(blob.type)||!blob.size||blob.size>25*1024*1024)throw Error('Invalid image')
 return blob
}
