import type { Clock } from './timer'
import type { CatalogItem } from './catalog'
export type StoredPhoto = { id: number; name: string; blob: Blob; reference?: CatalogItem }
export type Settings = { seconds:number; custom:string; random:boolean; sound:boolean; showTimer:boolean; background:string }
export type SavedSession = { ids:number[]; clock:Clock; savedAt:number }
const DB='sai-art-class-player'
const STORE='photos'
const SETTINGS='sai.settings.v1'
const SESSION='sai.session.v1'
export function openPhotos():Promise<IDBDatabase>{
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB,1)
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'})}
    req.onsuccess=()=>{req.result.onversionchange=()=>req.result.close();resolve(req.result)}
    req.onerror=()=>reject(req.error)
    req.onblocked=()=>reject(new Error('다른 창에서 저장소를 사용 중입니다.'))
  })
}
export async function readPhotos():Promise<StoredPhoto[]>{
  const db=await openPhotos()
  try{return await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).getAll()
    tx.oncomplete=()=>resolve(req.result as StoredPhoto[])
    tx.onabort=tx.onerror=()=>reject(tx.error??req.error)
  })}finally{db.close()}
}
async function write(fn:(s:IDBObjectStore)=>void){
  const db=await openPhotos()
  try{await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite')
    tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error)
    try{fn(tx.objectStore(STORE))}catch(e){tx.abort();reject(e)}
  })}finally{db.close()}
}
export const addPhotos=(photos:StoredPhoto[])=>write(s=>photos.forEach(p=>s.add(p)))
export const deletePhoto=(id:number)=>write(s=>{s.delete(id)})
export const clearPhotos=()=>write(s=>{s.clear()})
export function readSettings():Partial<Settings>{
  try{
    const v=JSON.parse(localStorage.getItem(SETTINGS)??'{}') as Partial<Settings>
    if(!v||typeof v!=='object')return {}
    return { ...(typeof v.seconds==='number'&&v.seconds>=5&&v.seconds<=7200?{seconds:v.seconds}:{}),...(typeof v.custom==='string'?{custom:v.custom}:{}),...(typeof v.random==='boolean'?{random:v.random}:{}),...(typeof v.sound==='boolean'?{sound:v.sound}:{}),...(typeof v.showTimer==='boolean'?{showTimer:v.showTimer}:{}),...(typeof v.background==='string'&&['black','gray','white'].includes(v.background)?{background:v.background}:{}) }
  }catch{return {}}
}
export function saveSettings(s:Settings){localStorage.setItem(SETTINGS,JSON.stringify(s))}
export function readSession():SavedSession|null{
  try{
    const v=JSON.parse(localStorage.getItem(SESSION)??'null') as SavedSession|null
    if(!v||!Array.isArray(v.ids)||!v.ids.length||!v.ids.every(Number.isSafeInteger)||new Set(v.ids).size!==v.ids.length)return null
    const c=v.clock
    if(!c||c.finished||c.count!==v.ids.length||!Number.isInteger(c.index)||c.index<0||c.index>=c.count||!Number.isFinite(c.duration)||c.duration<=0||!Number.isFinite(c.remaining)||c.remaining<0)return null
    return {...v,clock:{...c,deadline:null}}
  }catch{return null}
}
export function saveSession(s:SavedSession|null){if(s)localStorage.setItem(SESSION,JSON.stringify(s));else localStorage.removeItem(SESSION)}
