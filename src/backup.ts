import {captureState,BACKUP_KEYS,parseSession,readPhotos} from './storage'
import type {BackupState,StoredPhoto} from './storage'
import {validateCatalog} from './catalog'
import type {CatalogItem} from './catalog'
import {validSteps} from './lesson'
import {MAX_BACKUP,MAX_IMAGE,MAX_PHOTOS,packBackup,unpackBackup,sha256,verifyPhoto} from './backup-format'
import type {BackupHeader,PhotoHeader} from './backup-format'
type Report=(message:string)=>void
const str=(x:unknown,max=1024):x is string=>typeof x==='string'&&x.length<=max
const num=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x)
const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x)
function entry(v:unknown){return obj(v)&&Number.isSafeInteger(v.id)&&str(v.name)&&str(v.key,2048)&&num(v.duration)&&v.duration>0}
function meta(v:unknown){return obj(v)&&str(v.id)&&str(v.group,50)&&str(v.title,80)&&num(v.started)&&Array.isArray(v.viewed)&&v.viewed.length<=MAX_PHOTOS&&v.viewed.every(entry)}
export function validateState(state:BackupState,ids:Set<number>){
 if(Object.keys(state).length!==BACKUP_KEYS.length||BACKUP_KEYS.some(k=>!Object.hasOwn(state,k)))throw Error('백업 설정 목록이 일치하지 않습니다.')
 for(const k of BACKUP_KEYS){
  const raw=state[k];if(raw===null)continue
  const v:unknown=JSON.parse(raw)
  let ok=false
  switch(k){
   case 'sai.settings.v1':ok=obj(v)&&num(v.seconds)&&v.seconds>=5&&v.seconds<=7200&&str(v.custom,100)&&['random','sound','showTimer'].every(p=>typeof v[p]==='boolean')&&['black','gray','white'].includes(String(v.background));break
   case 'sai.session.v1':{const s=parseSession(v);ok=!!s&&s.ids.every(id=>id<0||ids.has(id))&&(!s.meta||meta(s.meta));break}
   case 'sai.catalog.v1':validateCatalog(v);ok=true;break
   case 'sai.catalog.auto.v1':ok=typeof v==='boolean';break
   case 'sai.catalog.favorites.v1':ok=Array.isArray(v)&&v.length<=MAX_PHOTOS&&v.every(x=>str(x,80));break
   case 'sai.lessons.v1':ok=obj(v)&&Array.isArray(v.groups)&&v.groups.length>0&&v.groups.every(g=>str(g,50)&&!!g)&&new Set(v.groups).size===v.groups.length&&v.groups.includes(v.group)&&typeof v.preferUnused==='boolean'&&Array.isArray(v.presets)&&v.presets.length<=500&&v.presets.every(p=>obj(p)&&str(p.id)&&str(p.name,80)&&Array.isArray(p.steps)&&validSteps(p.steps))&&Array.isArray(v.history)&&v.history.length<=500&&v.history.every(h=>obj(h)&&meta(h)&&num(h.ended)&&['complete','ended'].includes(String(h.status))&&str(h.note,500)&&num(h.total)&&h.total>=0);break
  }
  if(!ok)throw Error('백업 설정 검증 실패: '+k)
 }
}
function reference(value:unknown):CatalogItem|undefined{
 if(value===undefined)return undefined
 return validateCatalog({schema:1,version:1,updated:'2026-11-28',items:[value]}).items[0]
}
export async function makeBackup(report:Report){
 const photos=await readPhotos(),state=captureState()
 if(photos.length>MAX_PHOTOS||photos.reduce((n,p)=>n+p.blob.size,0)>MAX_BACKUP||photos.some(p=>p.blob.size>MAX_IMAGE))throw Error('백업 제한: 전체 512MiB, 사진당 50MiB, 최대 5000장입니다.')
 validateState(state,new Set(photos.map(p=>p.id)))
 const headers:PhotoHeader[]=[]
 for(const [i,p] of photos.entries()){report('사진 검사 '+(i+1)+' / '+photos.length);headers.push({id:p.id,name:p.name,type:p.blob.type,size:p.blob.size,sha256:await sha256(p.blob),reference:reference(p.reference)})}
 const header:BackupHeader={schema:1,created:new Date().toISOString(),state,photos:headers}
 return {file:await packBackup(header,photos.map(p=>p.blob)),count:photos.length}
}
export async function inspectBackup(file:Blob,report:Report){
 const {header,blobs}=await unpackBackup(file)
 validateState(header.state,new Set(header.photos.map(p=>p.id)))
 const photos:StoredPhoto[]=[],references=new Set<string>()
 for(const [i,p] of header.photos.entries()){
  report('복원 검증 '+(i+1)+' / '+header.photos.length)
  const blob=blobs[i];await verifyPhoto(blob,p)
  const ref=reference(p.reference)
  if(ref&&references.has(ref.id))throw Error('제공 자료 중복: '+ref.id)
  if(ref)references.add(ref.id)
  const url=URL.createObjectURL(blob)
  try{const image=new Image();image.src=url;await image.decode();if(!image.naturalWidth||!image.naturalHeight)throw Error('사진 크기 오류')}catch{throw Error('이 기기에서 사진을 읽을 수 없습니다: '+p.name)}finally{URL.revokeObjectURL(url)}
  photos.push({id:p.id,name:p.name,blob,reference:ref})
 }
 return {photos,state:header.state,created:header.created}
}
