import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { start, startSequence, left, tick, move, toggle, extend, restart, formatTime, shuffle } from './timer'
import type { Clock } from './timer'
import { addPhotos,readPhotos,deletePhoto,clearPhotos,readSettings,saveSettings,readSession,saveSession } from './storage'
import type { StoredPhoto,SavedSession } from './storage'
import {usePwa,useScreenWake} from './pwa'
import Library,{Credits} from './Library'
import {categories,downloadReference} from './catalog'
import type {CatalogItem} from './catalog'
import LessonPanel from './LessonPanel'
import BackupPanel from './BackupPanel'
import ArtView from './ArtView'
import ArtToolbar from './ArtToolbar'
import {defaultArt} from './art-tools'
import {defaultInk,emptyInkHistory,commitInkHistory,undoInkHistory,redoInkHistory,lessonProgress} from './ink'
import type {InkAction,InkHistory} from './ink'
import {InkToolbar,InstructorPreview} from './InstructorTools'
const EMPTY_INK:InkAction[]=[]
import {readLessons,writeLessons,prioritize,uid,upsertHistory} from './lesson'
import type {Entry,Lessons,SessionMeta} from './lesson'

type Photo = { id: number; name: string; url: string; reference?:CatalogItem; bytes:number; isBreak?:boolean }
const photoKey=(p:Photo)=>p.reference?'sai:'+p.reference.id:'local:'+p.id+':'+p.name
const breakPhoto=(id:number):Photo=>({id,name:'휴식 시간',url:'',bytes:0,isBreak:true})
const presets = [30,60,120,180,300,600,900,1200]
const durationLabel = (s: number) => s < 60 ? s + '초' : s/60 + '분'
const logo = import.meta.env.BASE_URL + 'sai-logo.jpg'
function Brand() {
  const [failed,setFailed] = useState(false)
  return <div className="brand">{failed ? <span className="brand-fallback">SAI</span> : <img src={logo} alt="사이컴퍼니 SAI 로고" onError={()=>setFailed(true)}/>}<div><strong>ART CLASS PLAYER</strong><small>SAI COMPANY · ART EDUCATION</small></div></div>
}
export default function App() {
  const [photos,setPhotos] = useState<Photo[]>([])
  const [lessons,setLessons]=useState(readLessons)
  const lessonRef=useRef(lessons)
  const meta=useRef<SessionMeta|null>(null)
  const logged=useRef('')
  const [source,setSource]=useState('전체')
  const [topic,setTopic]=useState('전체')
  const eligible=useMemo(()=>photos.filter(p=>(source==='전체'||(source==='제공 자료'?!!p.reference:!p.reference))&&(topic==='전체'||p.reference?.category===topic)),[photos,source,topic])
  const candidates=useMemo(()=>prioritize(eligible.map(p=>({id:p.id,name:p.name,key:photoKey(p)})),lessons.history,lessons.group,lessons.preferUnused),[eligible,lessons])
  const downloaded=useMemo(()=>new Map(photos.filter(p=>p.reference).map(p=>[p.reference!.id,p.url])),[photos])
  const [thumbLimit,setThumbLimit]=useState(60)
  useEffect(()=>{setThumbLimit(60)},[source,topic])
  const urls = useRef(new Set<string>())
  const serial = useRef(0)
  const [busy,setBusy] = useState(false)
  const [backupBusy,setBackupBusy]=useState(false)
  const restoring=useRef(false)
  const [loaded,setLoaded] = useState(false)
  const [storageError,setStorageError] = useState('')
  const [recovery,setRecovery] = useState<SavedSession|null>(null)
  const [storageStatus,setStorageStatus] = useState('기기 저장소')
  const [quota,setQuota]=useState<{usage?:number;quota?:number}>({})
  const [downloadProgress,setDownloadProgress]=useState('')
  const totalBytes=useMemo(()=>photos.reduce((n,p)=>n+p.bytes,0),[photos])
  const mb=(n:number)=>(n/1048576).toFixed(1)+' MB'
  useEffect(()=>{void navigator.storage?.estimate?.().then(setQuota).catch(()=>{})},[photos.length])
  const pwa=usePwa()
  const [notice,setNotice] = useState('')
  const [seconds,setSeconds] = useState(()=>readSettings().seconds??300)
  const [custom,setCustom] = useState(()=>readSettings().custom??'')
  const [random,setRandom] = useState(()=>readSettings().random??false)
  const [sound,setSound] = useState(()=>readSettings().sound??true)
  const [showTimer,setShowTimer] = useState(()=>readSettings().showTimer??true)
  const [background,setBackground] = useState(()=>readSettings().background??'black')
  const [queue,setQueue] = useState<Photo[]>([])
  const [clock,setClock] = useState<Clock|null>(null)
  const [now,setNow] = useState(Date.now())
  const [presentation,setPresentation] = useState(false)
  const [focusMode,setFocusMode] = useState(false)
  const [transportMore,setTransportMore] = useState(false)
  const [art,setArt]=useState(defaultArt)
  const [artOpen,setArtOpen]=useState(false)
  const [ink,setInk]=useState(defaultInk)
  const [inkOpen,setInkOpen]=useState(false)
  const [instructor,setInstructor]=useState(false)
  const [inkByPhoto,setInkByPhoto]=useState<Record<number,InkHistory>>({})
  const audio = useRef<AudioContext|null>(null)
  const prevIndex = useRef(-1)
  const stage = useRef<HTMLElement|null>(null)
  const effective = custom === '' ? seconds : Number(custom)*60
  const valid = Number.isFinite(effective) && effective >= 5 && effective <= 7200
  const remaining = clock ? left(clock,now) : 0
  const active = clock ? queue[clock.index] : undefined
  const nextPhoto=clock&&!clock.finished?queue[clock.index+1]:undefined
  const overall=clock?lessonProgress(clock.index,clock.count,clock.duration,remaining,clock.finished):0
  const scheduledRemaining=clock&&!clock.finished?remaining+(clock.durations?.slice(clock.index+1).reduce((a,b)=>a+b,0)??(clock.count-clock.index-1)*clock.duration):0
  const history=active?inkByPhoto[active.id]:undefined
  const actions=history?.past??EMPTY_INK
  const commitInk=useCallback((action:InkAction)=>{if(!active||active.isBreak||clock?.finished)return;const id=active.id;setInkByPhoto(m=>({...m,[id]:commitInkHistory(m[id]??emptyInkHistory(),action)}))},[active,clock?.finished])
  const undoDrawing=useCallback(()=>{if(!active||active.isBreak||clock?.finished)return;const id=active.id;setInkByPhoto(m=>({...m,[id]:undoInkHistory(m[id]??emptyInkHistory())}))},[active,clock?.finished])
  const redoDrawing=useCallback(()=>{if(!active||active.isBreak||clock?.finished)return;const id=active.id;setInkByPhoto(m=>({...m,[id]:redoInkHistory(m[id]??emptyInkHistory())}))},[active,clock?.finished])
  function clearDrawing(){commitInk({kind:'clear'})}
  function resetInstructor(){setTransportMore(false);setInk(defaultInk());setInkOpen(false);setInkByPhoto({});setInstructor(false)}
  const [imageError,setImageError] = useState(false)
  const onImageError=useCallback(()=>setImageError(true),[])
  const wakeStatus=useScreenWake(!!clock&&!clock.finished)
  const snapshot=useRef<SavedSession|null>(null)
  const lastSaved=useRef('')
  if(clock&&active&&!active.isBreak&&!clock.finished&&meta.current&&!meta.current.viewed.some(v=>v.key===photoKey(active)))meta.current={...meta.current,viewed:[...meta.current.viewed,{id:active.id,name:active.name,key:photoKey(active),duration:clock.duration}]}
  const savedClock=clock&&!clock.finished?{...clock,deadline:null,remaining:left(clock,now)}:null
  snapshot.current=savedClock?{ids:queue.map(p=>p.id),clock:savedClock,savedAt:now,meta:meta.current??undefined}:recovery


  useEffect(()=>{ const owned = urls.current; return ()=>{owned.forEach(u=>URL.revokeObjectURL(u));owned.clear(); void audio.current?.close().catch(()=>{})} },[])
  useEffect(()=>{
    let alive=true
    void readPhotos().then(records=>{
      if(!alive)return
      const restored=records.map(p=>{const url=URL.createObjectURL(p.blob);urls.current.add(url);return {id:p.id,name:p.name,url,reference:p.reference,bytes:p.blob.size}})
      serial.current=records.reduce((max,p)=>Math.max(max,p.id),Date.now())
      setPhotos(restored)
      const previous=readSession()
      if(previous&&previous.ids.every(id=>id<0||restored.some(p=>p.id===id)))setRecovery(previous)
      else if(previous){setNotice('이전 수업의 이미지가 누락되어 복구할 수 없습니다.');try{saveSession(null)}catch{/* warning below on next write */}}
      setLoaded(true)
    }).catch(()=>{if(alive)setStorageError('사진 저장소를 열 수 없습니다. 브라우저 저장소 설정을 확인한 후 새로고침해 주세요.')})
    return()=>{alive=false}
  },[])
  useEffect(()=>{if(!loaded||restoring.current)return;try{saveSettings({seconds,custom,random,sound,showTimer,background})}catch{setStorageError('설정을 저장할 수 없습니다. 브라우저 저장 공간을 확인해 주세요.')}},[loaded,seconds,custom,random,sound,showTimer,background])
  useEffect(()=>{
    if(!loaded||restoring.current)return
    const s=snapshot.current
    const key=s?JSON.stringify([s.ids,s.clock.index,s.clock.duration,Math.ceil(s.clock.remaining/1000),clock?.deadline===null,s.meta?.id,s.meta?.viewed.length]):'none'
    if(key===lastSaved.current)return
    try{saveSession(s);lastSaved.current=key}catch{setStorageError('수업 상태를 저장하지 못했습니다. 저장 공간을 확인해 주세요.')}
  },[loaded,clock,now,recovery,queue])
  useEffect(()=>{
    if(!loaded)return
    const persist=()=>{if(restoring.current)return;try{saveSession(snapshot.current)}catch{/* page may be closing */}}
    window.addEventListener('pagehide',persist)
    return()=>window.removeEventListener('pagehide',persist)
  },[loaded])
  function saveLesson(next:Lessons){
    try{writeLessons(next);lessonRef.current=next;setLessons(next);return true}
    catch{setStorageError('수업 프로그램 또는 기록을 저장하지 못했습니다.');return false}
  }
  function logLesson(status:'complete'|'ended'){
    const m=meta.current;if(!m||logged.current===m.id)return true
    const next=upsertHistory(lessonRef.current,{...m,ended:Date.now(),status,note:'',total:queue.filter(p=>!p.isBreak).length})
    if(!saveLesson(next))return false
    logged.current=m.id;return true
  }
  useEffect(()=>{if(clock?.finished)logLesson('complete')},[clock?.finished])
  async function requestStorage(){
    try{if(!navigator.storage?.persist){setStorageStatus('저장 유지 요청 미지원');return}
      const granted=await navigator.storage.persist();setStorageStatus(granted?'저장 유지 승인됨':'기본 저장 · 브라우저가 삭제할 수 있음')
    }catch{setStorageStatus('저장 유지 요청 실패')}
  }
  function discardRecovery(){try{saveSession(null);snapshot.current=null;setRecovery(null)}catch{setStorageError('이전 수업 기록을 삭제하지 못했습니다.')}}
  function resumeRecovery(){
    if(!recovery)return
    const byId=new Map(photos.map(p=>[p.id,p]))
    const ordered=recovery.ids.map(id=>id<0?breakPhoto(id):byId.get(id)).filter((p):p is Photo=>!!p)
    if(ordered.length!==recovery.ids.length){setNotice('이미지가 누락되었습니다.');return}
    const t=Date.now()
    meta.current=recovery.meta??{id:uid(),group:lessons.group,title:'복구된 수업',started:recovery.savedAt,viewed:[]};logged.current='';setQueue(ordered);setNow(t);setClock({...recovery.clock,deadline:null});setRecovery(null);prevIndex.current=-1
  }
  useEffect(()=>{ if(!clock || clock.deadline === null || clock.finished) return
    const timer=window.setInterval(()=>{const t=Date.now();setNow(t);setClock(c=>c ? tick(c,t) : c)},100)
    return ()=>window.clearInterval(timer)
  },[clock?.deadline,clock?.finished])
  useEffect(()=>{const onVisibility=()=>{if(document.hidden){const t=Date.now();setNow(t);setClock(c=>c && c.deadline!==null ? toggle(c,t):c)}};document.addEventListener('visibilitychange',onVisibility);return ()=>document.removeEventListener('visibilitychange',onVisibility)},[])
  useEffect(()=>{setImageError(false);setArt(a=>a.zoom===1?a:{...a,zoom:1})},[active?.id])
  useEffect(()=>{if(!clock){prevIndex.current=-1;return} const marker=clock.finished ? clock.count : clock.index
    if(prevIndex.current>=0 && marker!==prevIndex.current && sound && audio.current?.state==='running'){
      const a=audio.current;const osc=a.createOscillator();const gain=a.createGain();osc.frequency.value=660;gain.gain.setValueAtTime(.08,a.currentTime);gain.gain.exponentialRampToValueAtTime(.001,a.currentTime+.22);osc.connect(gain).connect(a.destination);osc.start();osc.stop(a.currentTime+.24)
    }prevIndex.current=marker
  },[clock?.index,clock?.finished,sound])
  useEffect(()=>{const handler=(e:KeyboardEvent)=>{if(!clock || clock.finished || e.repeat || (e.target instanceof HTMLElement && /INPUT|BUTTON|SELECT|TEXTAREA/.test(e.target.tagName)))return;const t=Date.now();if(e.code==='Space'){e.preventDefault();setNow(t);setClock(c=>c?toggle(c,t):c)}else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();setNow(t);setClock(c=>c?move(c,e.key==='ArrowRight'?1:-1,t):c)}else if(e.key==='Escape'){setFocusMode(false);setPresentation(false);if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{})}};window.addEventListener('keydown',handler);return ()=>window.removeEventListener('keydown',handler)},[clock])
  useEffect(()=>{const handler=()=>{if(!document.fullscreenElement){setFocusMode(false);setPresentation(false)}};document.addEventListener('fullscreenchange',handler);return ()=>document.removeEventListener('fullscreenchange',handler)},[])

  async function importPhotos(files: FileList|null) {
    if(!files || busy || backupBusy || !loaded || recovery)return
    setBusy(true);setNotice('')
    const accepted: Photo[]=[];const records:StoredPhoto[]=[];let bad=0
    for(const file of Array.from(files)){
      if(!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i.test(file.name)){bad++;continue}
      const url=URL.createObjectURL(file)
      try { const img=new Image();img.src=url;await img.decode();const id=++serial.current;urls.current.add(url);accepted.push({id,name:file.name,url,bytes:file.size});records.push({id,name:file.name,blob:file}) }
      catch{URL.revokeObjectURL(url);bad++}
    }
    try{if(records.length)await addPhotos(records);setPhotos(p=>[...p,...accepted]);setNotice(accepted.length+'장 추가'+(bad ? ' · '+bad+'장은 지원되지 않거나 손상된 이미지입니다.' : ''))}
    catch{accepted.forEach(p=>{URL.revokeObjectURL(p.url);urls.current.delete(p.url)});setNotice('사진을 저장하지 못했습니다. 저장 공간을 확인해 주세요. 기존 사진은 유지됩니다.')}
    finally{setBusy(false)}
  }
  async function receive(items:CatalogItem[]){
    if(busy||backupBusy||!loaded||recovery)return
    setBusy(true);setNotice('')
    const records:StoredPhoto[]=[];const accepted:Photo[]=[];let failures=0
    const seen=new Set(photos.flatMap(p=>p.reference?[p.reference.id]:[]))
    for(const [position,item] of items.entries()){
      setDownloadProgress((position+1)+' / '+items.length+'장 다운로드 중')
      if(seen.has(item.id))continue
      let url=''
      try{const blob=await downloadReference(item);url=URL.createObjectURL(blob);const img=new Image();img.src=url;await img.decode();const id=++serial.current;seen.add(item.id);urls.current.add(url);records.push({id,name:item.title,blob,reference:item});accepted.push({id,name:item.title,url,reference:item,bytes:blob.size})}
      catch{if(url)URL.revokeObjectURL(url);failures++}
    }
    try{if(records.length)await addPhotos(records);setPhotos(p=>[...p,...accepted]);setNotice('제공 자료 '+accepted.length+'장 저장'+(failures?' · '+failures+'장 다운로드 실패, 다시 시도해 주세요.':''));if(accepted.length){setSource('제공 자료');setTopic('전체')}}
    catch{accepted.forEach(p=>{URL.revokeObjectURL(p.url);urls.current.delete(p.url)});setNotice('제공 자료를 저장하지 못했습니다. 기존 사진은 유지됩니다.')}
    finally{setBusy(false);setDownloadProgress('')}
  }
  async function remove(id:number){if(busy||backupBusy||recovery||!loaded)return;setBusy(true);try{await deletePhoto(id);const p=photos.find(p=>p.id===id);if(p){URL.revokeObjectURL(p.url);urls.current.delete(p.url)}setPhotos(p=>p.filter(i=>i.id!==id));setNotice('사진을 삭제했습니다.')}catch{setNotice('사진 삭제에 실패했습니다.')}finally{setBusy(false)}}
  async function clear(){if(busy||backupBusy||recovery||!loaded||!window.confirm('기기에 저장된 모든 수업 사진을 삭제할까요?'))return;setBusy(true);try{await clearPhotos();photos.forEach(p=>{URL.revokeObjectURL(p.url);urls.current.delete(p.url)});setPhotos([]);setNotice('모든 사진을 삭제했습니다.')}catch{setNotice('사진 삭제에 실패했습니다.')}finally{setBusy(false)}}
  function openLesson(ordered:Photo[],durations:number[],title:string){
    if(!ordered.length||busy||backupBusy||!loaded||recovery)return
    const t=Date.now();setArt(defaultArt());setArtOpen(false);resetInstructor();meta.current={id:uid(),group:lessons.group,title,started:t,viewed:[]};logged.current=''
    setQueue(ordered);setNow(t);setClock(startSequence(durations,t));prevIndex.current=-1
    try{if(sound){audio.current??=new AudioContext();void audio.current.resume().catch(()=>{})}}catch{/* sound is optional */}
  }
  function begin(){if(!eligible.length||!valid||busy||!loaded||recovery)return;const byId=new Map(eligible.map(p=>[p.id,p]));const sorted=prioritize(random?shuffle(candidates):candidates,lessons.history,lessons.group,lessons.preferUnused);const ordered=sorted.map(p=>byId.get(p.id)!);openLesson(ordered,ordered.map(()=>Math.round(effective*1000)),topic==='전체'?'일반 드로잉':topic)}
  function beginProgram(entries:Entry[],title:string){const byId=new Map(eligible.map(p=>[p.id,p]));const ordered=entries.map(e=>e.id<0?breakPhoto(e.id):byId.get(e.id));if(ordered.some(p=>!p)){setNotice('사진 목록이 변경되었습니다. 순서를 다시 확인해 주세요.');return}openLesson(ordered as Photo[],entries.map(e=>e.duration),title)}
  function repeatLesson(){if(!clock||!logLesson('complete'))return;resetInstructor();const t=Date.now();meta.current={id:uid(),group:meta.current?.group??lessons.group,title:meta.current?.title??'일반 드로잉',started:t,viewed:[]};logged.current='';setNow(t);setClock(clock.durations?startSequence(clock.durations,t):start(queue.length,clock.duration,t));prevIndex.current=-1}
  function command(fn:(c:Clock,t:number)=>Clock){if(fn===toggle&&sound){try{audio.current??=new AudioContext();void audio.current.resume().catch(()=>{})}catch{/* optional */}}const t=Date.now();setNow(t);setClock(c=>c?fn(c,t):c)}
  async function present(){setTransportMore(false);setPresentation(true);setFocusMode(true);setArtOpen(false);setInkOpen(false);setInk(a=>({...a,tool:'move'}));try{if(stage.current?.requestFullscreen)await stage.current.requestFullscreen()}catch{/* CSS presentation remains available */}}
  function exitPresent(){setPresentation(false);setFocusMode(false);if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{})}
  function end(){if(clock && !clock.finished && !window.confirm('수업을 종료하고 준비 화면으로 돌아갈까요?'))return;if(!logLesson(clock?.finished?'complete':'ended'))return;try{saveSession(null);snapshot.current=null}catch{setStorageError('수업 종료 기록을 저장하지 못했습니다.')}meta.current=null;setArt(defaultArt());setArtOpen(false);resetInstructor();exitPresent();setClock(null);setQueue([])}
  if(clock && active)return <main ref={stage} className={'player '+(presentation?'presentation ':'')+(presentation&&focusMode&&!clock.finished?'focus-mode ':'')+'bg-'+background}>
    <header className="player-top"><Brand/><span className="counter"><span className="counter-group" title={meta.current?.group}>{meta.current?.group}</span><span className="counter-index">{clock.index+1} / {queue.length}</span></span><button disabled={active.isBreak||clock.finished} aria-pressed={artOpen} onClick={()=>{setArtOpen(v=>!v);setInkOpen(false);setInk(a=>({...a,tool:'move'}))}}>미술 도구</button><button disabled={active.isBreak||clock.finished} aria-pressed={inkOpen} onClick={()=>{setArtOpen(false);setInkOpen(v=>!v);setInk(a=>({...a,tool:inkOpen?'move':'pen',visible:true}))}}>드로잉</button><button disabled={clock.finished} aria-pressed={instructor&&!presentation} onClick={()=>setInstructor(v=>!v)} className="instructor-toggle">강사 모드</button>{presentation&&<button className="focus-toggle" aria-pressed={focusMode} onClick={()=>{if(!focusMode){setTransportMore(false);setArtOpen(false);setInkOpen(false);setInk(a=>({...a,tool:'move'}))}setFocusMode(v=>!v)}}>{focusMode?'조작 표시':'집중 보기'}</button>}<button className="present-toggle" onClick={presentation?exitPresent:present}>{presentation?'발표 종료':'발표 화면'}</button><button onClick={end}>수업 종료</button></header>
    <section className="visual"><div className="photo-area">{active.isBreak?<div className="break-screen"><h1>휴식 시간</h1><p>잠시 쉬어 가세요.</p></div>:imageError?<div className="image-error">이미지를 표시할 수 없습니다. 다음 사진으로 이동해 주세요.</div>:<ArtView src={active.url} name={active.name} settings={art} onError={onImageError} ink={ink} actions={actions} commit={commitInk} undo={undoDrawing} redo={redoDrawing}/>}</div>
      {showTimer&&<aside className={'clock '+(!clock.finished&&remaining<=30000?'urgent':'')}><span>{clock.finished?'수업 완료':clock.deadline===null?'일시정지':remaining<=5000?'곧 전환됩니다':'남은 시간'}</span><strong data-testid="timer">{formatTime(remaining)}</strong><div className="progress"><i style={{width:Math.min(100,remaining/Math.max(clock.duration,remaining)*100)+'%'}}/></div>{!clock.finished&&remaining<=30000&&remaining>5000&&<small>30초 이내 다음 사진</small>}</aside>}
      {instructor&&!presentation&&!clock.finished&&<InstructorPreview next={nextPhoto} remaining={formatTime(scheduledRemaining)} percent={overall} index={clock.index+1} count={queue.length}/>}
      {clock.finished&&<div className="finished"><h2>수업이 완료되었습니다.</h2><p>{queue.filter(p=>!p.isBreak).length}장의 이미지로 구성된 수업을 마쳤습니다.</p><button className="primary" onClick={end}>준비 화면으로</button><button onClick={repeatLesson}>다시 시작</button></div>}
    </section>
    {artOpen&&!active.isBreak&&!clock.finished&&<ArtToolbar settings={art} change={setArt} close={()=>setArtOpen(false)}/>}
    {inkOpen&&!active.isBreak&&!clock.finished&&<InkToolbar settings={ink} change={setInk} actions={actions} undo={undoDrawing} redo={redoDrawing} canRedo={!!history?.future.length} clear={clearDrawing} close={()=>{setInkOpen(false);setInk(a=>({...a,tool:'move'}))}}/>}
    <footer className="controls"><div className="filename">{active.name} · {wakeStatus}{active.reference&&<> · <Credits item={active.reference}/></>}{storageError?' · '+storageError:''}</div><div className="control-row"><button disabled={clock.finished||clock.index===0} onClick={()=>command((c,t)=>move(c,-1,t))}>이전</button><button className="primary" disabled={clock.finished} onClick={()=>command(toggle)}>{clock.deadline===null?'재생':'일시정지'}</button><button disabled={clock.finished} onClick={()=>command((c,t)=>move(c,1,t))}>다음</button><button disabled={clock.finished} onClick={()=>command((c,t)=>extend(c,60000,t))}>+1분</button><button onClick={()=>setShowTimer(v=>!v)}>{showTimer?'시간 숨기기':'시간 표시'}</button><button aria-expanded={transportMore} aria-controls="transport-extra" onClick={()=>setTransportMore(v=>!v)}>{transportMore?'접기':'더 보기'}</button></div><div id="transport-extra" className="transport-extra" hidden={!transportMore}><button disabled={clock.finished} onClick={()=>command(restart)}>다시 시작</button><button disabled={clock.finished} onClick={()=>command((c,t)=>extend(c,30000,t))}>+30초</button><button disabled={clock.finished} onClick={()=>command((c,t)=>extend(c,300000,t))}>+5분</button></div></footer>
  </main>
  return <main className="shell"><header className="top"><Brand/><span className="version">ART 5B · v1.0.0 RC1</span></header>
    <nav className="dashboard-nav" aria-label="주요 메뉴"><a href="#today">오늘의 수업</a><a href="#materials">미술자료</a><a href="#lessons">수업 관리</a><a href="#settings">설정</a></nav>
    <section className="intro" id="today"><div className="dashboard-intro-line"><div className="eyebrow">SAI / DRAWING STUDIO</div><a className="dashboard-ready" href="#settings">{pwa.ready?'오프라인 준비 완료':'오프라인 준비 확인'}</a></div><h1>오늘의 수업</h1><div className="dashboard-summary"><label>오늘의 강의실<select aria-label="오늘의 강의실" value={lessons.group} onChange={e=>saveLesson({...lessons,group:e.target.value})}>{lessons.groups.map(g=><option key={g}>{g}</option>)}</select></label><div><span>재생할 사진</span><strong>{eligible.length}장</strong></div><div><span>사진당 시간</span><strong>{valid?formatTime(effective*1000):'--:--'}</strong></div></div></section>
    {storageError&&<p role="alert" className="warning">{storageError}</p>}
    {recovery&&<section className="recovery" role="region" aria-label="이전 수업 복구"><div><strong>이전 수업을 이어서 진행할까요?</strong><p>{recovery.clock.index+1} / {recovery.ids.length}장 · 남은 시간 {formatTime(recovery.clock.remaining)} · 일시정지 상태로 복구</p></div><button className="primary" onClick={resumeRecovery}>이전 수업 복구</button><button onClick={discardRecovery}>기록 삭제하고 새 수업</button></section>}
    {pwa.update&&<section className="dashboard-update" role="status">새 버전이 준비되었습니다. <a href="#settings">설정에서 적용</a></section>}
    <section className="quick-start" aria-label="수업 시작 요약"><div className="quick-start-total"><span>예상 수업 시간</span><strong>{valid?formatTime(eligible.length*effective*1000):'--:--'}</strong></div><button className="primary start" disabled={!eligible.length||!valid||busy||backupBusy||!loaded||!!recovery} onClick={begin}>수업 시작</button></section>
    <div className="setup-grid dashboard-setup"><section className="panel"><div className="section-head"><h2>01. 수업 이미지</h2><span>{eligible.length} / {photos.length}장</span></div>
      <div className="catalog-filters"><label>수업 자료<select aria-label="재생 자료 범위" value={source} onChange={e=>{setSource(e.target.value);setTopic('전체')}}>{['전체','제공 자료','내 사진'].map(s=><option key={s}>{s}</option>)}</select></label><label>주제<select aria-label="재생 주제" disabled={source==='내 사진'} value={topic} onChange={e=>setTopic(e.target.value)}>{['전체',...categories].map(c=><option key={c}>{c}</option>)}</select></label></div>
      <label className="import-zone"><strong>{busy?'이미지 확인 중…':'사진 여러 장 가져오기'}</strong><small>JPG, PNG, WebP 등 · 사진은 서버로 전송되지 않습니다.</small><input aria-label="사진 가져오기" type="file" accept="image/*" multiple disabled={busy||backupBusy||!loaded||!!recovery} onChange={e=>{void importPhotos(e.target.files);e.target.value=''}}/></label>
      <p role="status" className="notice">{notice}</p>
      {photos.length>0&&<><div className="thumbs">{eligible.slice(0,thumbLimit).map((p,i)=><article key={p.id}><img src={p.url} alt={p.name} loading="lazy" decoding="async"/><div><small>{i+1}. {p.name}{p.reference?' · SAI':''}</small><button aria-label={p.name+' 삭제'} disabled={busy||backupBusy||!!recovery} onClick={()=>void remove(p.id)}>삭제</button></div></article>)}</div>{eligible.length>thumbLimit&&<button onClick={()=>setThumbLimit(n=>n+60)}>사진 60장 더 보기 ({thumbLimit} / {eligible.length}장)</button>}<button onClick={()=>void clear()} disabled={busy||backupBusy||!!recovery}>전체 삭제</button></>}
    </section><section className="panel"><div className="section-head"><h2>02. 수업 시간</h2></div><p className="muted">사진 한 장당 시간</p><div className="presets">{presets.map(s=><button key={s} aria-pressed={custom===''&&seconds===s} className={custom===''&&seconds===s?'selected':''} onClick={()=>{setSeconds(s);setCustom('')}}>{durationLabel(s)}</button>)}</div>
    <label className="custom">직접 입력 (분)<input type="number" min={.1} max={120} step="any" placeholder="예: 7.5" value={custom} onChange={e=>setCustom(e.target.value)}/></label>{!valid&&<p role="alert">5초 이상 120분 이하로 설정해 주세요.</p>}
    <div className="options"><label><input type="checkbox" checked={random} onChange={e=>setRandom(e.target.checked)}/> 무작위 순서</label><label><input type="checkbox" checked={sound} onChange={e=>setSound(e.target.checked)}/> 전환 알림음</label><label><input type="checkbox" checked={showTimer} onChange={e=>setShowTimer(e.target.checked)}/> 남은 시간 표시</label><label>발표 배경<select value={background} onChange={e=>setBackground(e.target.value)}><option value="black">검정</option><option value="gray">회색</option><option value="white">흰색</option></select></label></div>
    </section></div>
    <section id="materials" className="dashboard-section"><h2 className="dashboard-section-title">미술자료</h2>
    <Library downloaded={downloaded} onDownload={receive} busy={busy} disabled={!loaded||!!recovery||backupBusy} online={pwa.online}/>
    </section>
    <section id="lessons" className="dashboard-section"><h2 className="dashboard-section-title">수업 관리</h2>
    <LessonPanel data={lessons} save={saveLesson} pool={candidates} startBlocked={!loaded?'사진 저장소를 불러오는 중입니다.':recovery?'이전 수업을 복구하거나 기록을 삭제한 뒤 새 수업을 시작할 수 있습니다.':busy||backupBusy?'사진 저장 작업이 끝나면 수업을 시작할 수 있습니다.':''} onStart={beginProgram}/>
    </section>
    <section id="settings" className="dashboard-section"><h2 className="dashboard-section-title">설정 및 백업</h2>
    <section className="status-strip" aria-label="앱 상태">
      <span data-testid="offline-status">{pwa.ready?'오프라인 사용 준비 완료':pwa.error||'오프라인 준비 전 · 배포 버전에서 사용'}</span><span>{pwa.online?'온라인':'오프라인'}</span><span>{loaded?storageStatus:storageError?'저장소 오류':'사진 불러오는 중…'}</span>
      <button disabled={!loaded||busy} onClick={()=>void requestStorage()}>저장 유지 요청</button>
      {pwa.update&&<button className="primary" disabled={busy||backupBusy||!loaded} onClick={pwa.apply}>새 버전 적용</button>}
    </section>
    <section className="status-strip" aria-label="저장 공간"><strong>사진 저장 공간 {mb(totalBytes)}</strong><span>개인 사진 {mb(photos.filter(p=>!p.reference).reduce((n,p)=>n+p.bytes,0))} · 제공 자료 {mb(photos.filter(p=>p.reference).reduce((n,p)=>n+p.bytes,0))}</span>{quota.quota!==undefined&&quota.usage!==undefined&&<span>브라우저 추정 사용량 {mb(quota.usage)} / {mb(quota.quota)}</span>}{downloadProgress&&<span role="status">{downloadProgress}</span>}</section>
    <BackupPanel disabled={!loaded||busy} onLock={setBackupBusy} onRestore={()=>{restoring.current=true}}/>
    </section>
    <footer className="bottom">Developed by SAI COMPANY · 사진은 이 브라우저의 기기 저장소에만 보관됩니다. 사이트 데이터 삭제 시 사라질 수 있으며 데이터 백업 및 이전에서 정기적으로 백업해 주세요. 여러 탭 동시 편집은 피해주세요.</footer>
  </main>
}
