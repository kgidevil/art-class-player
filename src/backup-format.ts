export const MAX_BACKUP=512*1024*1024
export const MAX_IMAGE=50*1024*1024
export const MAX_HEADER=8*1024*1024
export const MAX_PHOTOS=5000
const MAGIC=new TextEncoder().encode('SAIBKP01')
const PREFIX=44
export type PhotoHeader={id:number;name:string;type:string;size:number;sha256:string;reference?:unknown}
export type BackupHeader={schema:1;created:string;state:Record<string,string|null>;photos:PhotoHeader[]}
export async function sha256(blob:Blob){
 if(!globalThis.crypto?.subtle)throw Error('HTTPS 또는 localhost 환경에서 백업을 사용해 주세요.')
 const h=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())
 return Array.from(new Uint8Array(h),b=>b.toString(16).padStart(2,'0')).join('')
}
export function validateHeader(v:unknown):BackupHeader{
 const h=v as BackupHeader
 if(!h||h.schema!==1||typeof h.created!=='string'||!Number.isFinite(Date.parse(h.created))||!h.state||typeof h.state!=='object'||Array.isArray(h.state)||!Array.isArray(h.photos)||h.photos.length>MAX_PHOTOS)throw Error('지원하지 않는 백업 형식입니다.')
 if(Object.values(h.state).some(x=>x!==null&&typeof x!=='string'))throw Error('설정 목록이 손상되었습니다.')
 const ids=new Set<number>();let bytes=0
 for(const p of h.photos){
  if(!p||!Number.isSafeInteger(p.id)||p.id<=0||ids.has(p.id)||typeof p.name!=='string'||!p.name||p.name.length>1024||typeof p.type!=='string'||p.type.length>100||(!p.type.startsWith('image/')&&p.type!=='')||!Number.isSafeInteger(p.size)||p.size<1||p.size>MAX_IMAGE||!/^[a-f0-9]{64}$/.test(p.sha256))throw Error('사진 정보가 손상되었거나 백업 제한을 초과합니다.')
  ids.add(p.id);bytes+=p.size
 }
 if(bytes>MAX_BACKUP)throw Error('백업 용량 제한을 초과합니다.')
 return h
}
export async function packBackup(header:BackupHeader,blobs:Blob[]){
 validateHeader(header)
 if(blobs.length!==header.photos.length||blobs.some((b,i)=>b.size!==header.photos[i].size))throw Error('백업 사진 크기가 일치하지 않습니다.')
 const json=new Blob([JSON.stringify(header)],{type:'application/json'})
 if(json.size>MAX_HEADER||PREFIX+json.size+blobs.reduce((n,b)=>n+b.size,0)>MAX_BACKUP)throw Error('백업은 최대 512MiB입니다.')
 const prefix=new Uint8Array(PREFIX);prefix.set(MAGIC)
 new DataView(prefix.buffer).setUint32(8,json.size,false)
 const hash=await sha256(json)
 for(let i=0;i<32;i++)prefix[12+i]=parseInt(hash.slice(i*2,i*2+2),16)
 return new Blob([prefix,json,...blobs],{type:'application/octet-stream'})
}
export async function unpackBackup(file:Blob){
 if(file.size<PREFIX||file.size>MAX_BACKUP)throw Error('백업 파일 크기를 확인해 주세요.')
 const prefix=new Uint8Array(await file.slice(0,PREFIX).arrayBuffer())
 if(!MAGIC.every((b,i)=>prefix[i]===b))throw Error('SAI 백업 파일이 아닙니다.')
 const size=new DataView(prefix.buffer).getUint32(8,false)
 if(size<1||size>MAX_HEADER||PREFIX+size>file.size)throw Error('백업 목록 크기가 잘못되었습니다.')
 const json=file.slice(PREFIX,PREFIX+size)
 const expected=Array.from(prefix.slice(12),b=>b.toString(16).padStart(2,'0')).join('')
 if(await sha256(json)!==expected)throw Error('백업 목록 무결성 검사 실패')
 const header=validateHeader(JSON.parse(await json.text()))
 let offset=PREFIX+size;const blobs:Blob[]=[]
 for(const p of header.photos){if(offset+p.size>file.size)throw Error('백업 사진이 누락되었습니다.');blobs.push(file.slice(offset,offset+p.size,p.type));offset+=p.size}
 if(offset!==file.size)throw Error('백업 파일에 예상하지 못한 데이터가 있습니다.')
 return {header,blobs}
}
export async function verifyPhoto(blob:Blob,p:PhotoHeader){if(blob.size!==p.size||await sha256(blob)!==p.sha256)throw Error('사진 무결성 검사 실패: '+p.name)}
