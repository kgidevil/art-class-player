import { useEffect, useRef, useState } from 'react'
import { start, left, tick, move, toggle, extend, restart, formatTime, shuffle } from './timer'
import type { Clock } from './timer'
import { addPhotos,readPhotos,deletePhoto,clearPhotos,readSettings,saveSettings,readSession,saveSession } from './storage'
import type { StoredPhoto,SavedSession } from './storage'
import {usePwa,useScreenWake} from './pwa'
import Library,{Credits} from './Library'
import {categories,downloadReference} from './catalog'
import type {CatalogItem} from './catalog'

type Photo = { id: number; name: string; url: string; reference?:CatalogItem }
const presets = [30,60,120,180,300,600,900,1200]
const durationLabel = (s: number) => s < 60 ? s + '초' : s/60 + '분'
const logo = import.meta.env.BASE_URL + 'sai-logo.jpg'
function Brand() {
  const [failed,setFailed] = useState(false)
  return <div className="brand">{failed ? <span className="brand-fallback">SAI</span> : <img src={logo} alt="사이컴퍼니 SAI 로고" onError={()=>setFailed(true)}/>}<div><strong>ART CLASS PLAYER</strong><small>SAI COMPANY · ART EDUCATION</small></div></div>
}
export default function App() {
  const [photos,setPhotos] = useState<Photo[]>([])
  const [source,setSource]=useState('전체')
  const [topic,setTopic]=useState('전체')
  const eligible=photos.filter(p=>(source==='전체'||(source==='제공 자료'?!!p.reference:!p.reference))&&(topic==='전체'||p.reference?.category===topic))
  const downloaded=new Map(photos.filter(p=>p.reference).map(p=>[p.reference!.id,p.url]))
  const urls = useRef(new Set<string>())
  const serial = useRef(0)
  const [busy,setBusy] = useState(false)
  const [loaded,setLoaded] = useState(false)
  const [storageError,setStorageError] = useState('')
  const [recovery,setRecovery] = useState<SavedSession|null>(null)
  const [storageStatus,setStorageStatus] = useState('기기 저장소')
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
  const audio = useRef<AudioContext|null>(null)
  const prevIndex = useRef(-1)
  const stage = useRef<HTMLElement|null>(null)
  const effective = custom === '' ? seconds : Number(custom)*60
  const valid = Number.isFinite(effective) && effective >= 5 && effective <= 7200
  const remaining = clock ? left(clock,now) : 0
  const active = clock ? queue[clock.index] : undefined
  const [imageError,setImageError] = useState(false)
  const wakeStatus=useScreenWake(!!clock&&!clock.finished)
  const snapshot=useRef<SavedSession|null>(null)
  const lastSaved=useRef('')
  const savedClock=clock&&!clock.finished?{...clock,deadline:null,remaining:left(clock,now)}:null
  snapshot.current=savedClock?{ids:queue.map(p=>p.id),clock:savedClock,savedAt:now}:recovery


  useEffect(()=>{ const owned = urls.current; return ()=>{owned.forEach(u=>URL.revokeObjectURL(u));owned.clear(); void audio.current?.close().catch(()=>{})} },[])
  useEffect(()=>{
    let alive=true
    void readPhotos().then(records=>{
      if(!alive)return
      const restored=records.map(p=>{const url=URL.createObjectURL(p.blob);urls.current.add(url);return {id:p.id,name:p.name,url,reference:p.reference}})
      serial.current=records.reduce((max,p)=>Math.max(max,p.id),0)
      setPhotos(restored)
      const previous=readSession()
      if(previous&&previous.ids.every(id=>restored.some(p=>p.id===id)))setRecovery(previous)
      else if(previous){setNotice('이전 수업의 이미지가 누락되어 복구할 수 없습니다.');try{saveSession(null)}catch{/* warning below on next write */}}
      setLoaded(true)
    }).catch(()=>{if(alive)setStorageError('사진 저장소를 열 수 없습니다. 브라우저 저장소 설정을 확인한 후 새로고침해 주세요.')})
    return()=>{alive=false}
  },[])
  useEffect(()=>{if(!loaded)return;try{saveSettings({seconds,custom,random,sound,showTimer,background})}catch{setStorageError('설정을 저장할 수 없습니다. 브라우저 저장 공간을 확인해 주세요.')}},[loaded,seconds,custom,random,sound,showTimer,background])
  useEffect(()=>{
    if(!loaded)return
    const s=snapshot.current
    const key=s?JSON.stringify([s.ids,s.clock.index,s.clock.duration,Math.ceil(s.clock.remaining/1000),clock?.deadline===null]):'none'
    if(key===lastSaved.current)return
    try{saveSession(s);lastSaved.current=key}catch{setStorageError('수업 상태를 저장하지 못했습니다. 저장 공간을 확인해 주세요.')}
  },[loaded,clock,now,recovery,queue])
  useEffect(()=>{
    if(!loaded)return
    const persist=()=>{try{saveSession(snapshot.current)}catch{/* page may be closing */}}
    window.addEventListener('pagehide',persist)
    return()=>window.removeEventListener('pagehide',persist)
  },[loaded])
  async function requestStorage(){
    try{if(!navigator.storage?.persist){setStorageStatus('저장 유지 요청 미지원');return}
      const granted=await navigator.storage.persist();setStorageStatus(granted?'저장 유지 승인됨':'기본 저장 · 브라우저가 삭제할 수 있음')
    }catch{setStorageStatus('저장 유지 요청 실패')}
  }
  function discardRecovery(){try{saveSession(null);snapshot.current=null;setRecovery(null)}catch{setStorageError('이전 수업 기록을 삭제하지 못했습니다.')}}
  function resumeRecovery(){
    if(!recovery)return
    const byId=new Map(photos.map(p=>[p.id,p]))
    const ordered=recovery.ids.map(id=>byId.get(id)).filter((p):p is Photo=>!!p)
    if(ordered.length!==recovery.ids.length){setNotice('이미지가 누락되었습니다.');return}
    const t=Date.now()
    setQueue(ordered);setNow(t);setClock({...recovery.clock,deadline:null});setRecovery(null);prevIndex.current=-1
  }
  useEffect(()=>{ if(!clock || clock.deadline === null || clock.finished) return
    const timer=window.setInterval(()=>{const t=Date.now();setNow(t);setClock(c=>c ? tick(c,t) : c)},100)
    return ()=>window.clearInterval(timer)
  },[clock?.deadline,clock?.finished])
  useEffect(()=>{const onVisibility=()=>{if(document.hidden){const t=Date.now();setNow(t);setClock(c=>c && c.deadline!==null ? toggle(c,t):c)}};document.addEventListener('visibilitychange',onVisibility);return ()=>document.removeEventListener('visibilitychange',onVisibility)},[])
  useEffect(()=>{setImageError(false)},[active?.id])
  useEffect(()=>{if(!clock){prevIndex.current=-1;return} const marker=clock.finished ? clock.count : clock.index
    if(prevIndex.current>=0 && marker!==prevIndex.current && sound && audio.current?.state==='running'){
      const a=audio.current;const osc=a.createOscillator();const gain=a.createGain();osc.frequency.value=660;gain.gain.setValueAtTime(.08,a.currentTime);gain.gain.exponentialRampToValueAtTime(.001,a.currentTime+.22);osc.connect(gain).connect(a.destination);osc.start();osc.stop(a.currentTime+.24)
    }prevIndex.current=marker
  },[clock?.index,clock?.finished,sound])
  useEffect(()=>{const handler=(e:KeyboardEvent)=>{if(!clock || e.repeat || (e.target instanceof HTMLElement && /INPUT|BUTTON|SELECT|TEXTAREA/.test(e.target.tagName)))return;const t=Date.now();if(e.code==='Space'){e.preventDefault();setNow(t);setClock(c=>c?toggle(c,t):c)}else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();setNow(t);setClock(c=>c?move(c,e.key==='ArrowRight'?1:-1,t):c)}else if(e.key==='Escape'){setPresentation(false)}};window.addEventListener('keydown',handler);return ()=>window.removeEventListener('keydown',handler)},[clock])
  useEffect(()=>{const handler=()=>{if(!document.fullscreenElement)setPresentation(false)};document.addEventListener('fullscreenchange',handler);return ()=>document.removeEventListener('fullscreenchange',handler)},[])

  async function importPhotos(files: FileList|null) {
    if(!files || busy || !loaded || recovery)return
    setBusy(true);setNotice('')
    const accepted: Photo[]=[];const records:StoredPhoto[]=[];let bad=0
    for(const file of Array.from(files)){
      if(!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i.test(file.name)){bad++;continue}
      const url=URL.createObjectURL(file)
      try { const img=new Image();img.src=url;await img.decode();const id=++serial.current;urls.current.add(url);accepted.push({id,name:file.name,url});records.push({id,name:file.name,blob:file}) }
      catch{URL.revokeObjectURL(url);bad++}
    }
    try{if(records.length)await addPhotos(records);setPhotos(p=>[...p,...accepted]);setNotice(accepted.length+'장 추가'+(bad ? ' · '+bad+'장은 지원되지 않거나 손상된 이미지입니다.' : ''))}
    catch{accepted.forEach(p=>{URL.revokeObjectURL(p.url);urls.current.delete(p.url)});setNotice('사진을 저장하지 못했습니다. 저장 공간을 확인해 주세요. 기존 사진은 유지됩니다.')}
    finally{setBusy(false)}
  }
  async function receive(items:CatalogItem[]){
    if(busy||!loaded||recovery)return
    setBusy(true);setNotice('')
    const records:StoredPhoto[]=[];const accepted:Photo[]=[];let failures=0
    const seen=new Set(photos.flatMap(p=>p.reference?[p.reference.id]:[]))
    for(const item of items){
      if(seen.has(item.id))continue
      let url=''
      try{const blob=await downloadReference(item);url=URL.createObjectURL(blob);const img=new Image();img.src=url;await img.decode();const id=++serial.current;seen.add(item.id);urls.current.add(url);records.push({id,name:item.title,blob,reference:item});accepted.push({id,name:item.title,url,reference:item})}
      catch{if(url)URL.revokeObjectURL(url);failures++}
    }
    try{if(records.length)await addPhotos(records);setPhotos(p=>[...p,...accepted]);setNotice('제공 자료 '+accepted.length+'장 저장'+(failures?' · '+failures+'장 다운로드 실패, 다시 시도해 주세요.':''));if(accepted.length){setSource('제공 자료');setTopic('전체')}}
    catch{accepted.forEach(p=>{URL.revokeObjectURL(p.url);urls.current.delete(p.url)});setNotice('제공 자료를 저장하지 못했습니다. 기존 사진은 유지됩니다.')}
    finally{setBusy(false)}
  }
  async function remove(id:number){if(busy||recovery||!loaded)return;setBusy(true);try{await deletePhoto(id);const p=photos.find(p=>p.id===id);if(p){URL.revokeObjectURL(p.url);urls.current.delete(p.url)}setPhotos(p=>p.filter(i=>i.id!==id));setNotice('사진을 삭제했습니다.')}catch{setNotice('사진 삭제에 실패했습니다.')}finally{setBusy(false)}}
  async function clear(){if(busy||recovery||!loaded||!window.confirm('기기에 저장된 모든 수업 사진을 삭제할까요?'))return;setBusy(true);try{await clearPhotos();photos.forEach(p=>{URL.revokeObjectURL(p.url);urls.current.delete(p.url)});setPhotos([]);setNotice('모든 사진을 삭제했습니다.')}catch{setNotice('사진 삭제에 실패했습니다.')}finally{setBusy(false)}}
  function begin(){if(!eligible.length||!valid||busy||!loaded||recovery)return;const t=Date.now();const ordered=random?shuffle(eligible):[...eligible];setQueue(ordered);setNow(t);setClock(start(ordered.length,Math.round(effective*1000),t));prevIndex.current=-1;try{if(sound){audio.current??=new AudioContext();void audio.current.resume().catch(()=>{})}}catch{/* sound is optional */}}
  function command(fn:(c:Clock,t:number)=>Clock){if(fn===toggle&&sound){try{audio.current??=new AudioContext();void audio.current.resume().catch(()=>{})}catch{/* optional */}}const t=Date.now();setNow(t);setClock(c=>c?fn(c,t):c)}
  async function present(){setPresentation(true);try{if(stage.current?.requestFullscreen)await stage.current.requestFullscreen()}catch{/* CSS presentation remains available */}}
  function exitPresent(){setPresentation(false);if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{})}
  function end(){if(clock && !clock.finished && !window.confirm('수업을 종료하고 준비 화면으로 돌아갈까요?'))return;try{saveSession(null);snapshot.current=null}catch{setStorageError('수업 종료 기록을 저장하지 못했습니다.')}exitPresent();setClock(null);setQueue([])}
  if(clock && active)return <main ref={stage} className={'player '+(presentation?'presentation ':'')+'bg-'+background}>
    <header className="player-top"><Brand/><span className="counter">{clock.index+1} / {queue.length}</span><button onClick={presentation?exitPresent:present}>{presentation?'발표 종료':'발표 화면'}</button><button onClick={end}>수업 종료</button></header>
    <section className="visual"><div className="photo-area">{imageError?<div className="image-error">이미지를 표시할 수 없습니다. 다음 사진으로 이동해 주세요.</div>:<img className="reference" src={active.url} alt={active.name} onError={()=>setImageError(true)}/>}</div>
      {showTimer&&<aside className={'clock '+(!clock.finished&&remaining<=30000?'urgent':'')}><span>{clock.finished?'수업 완료':clock.deadline===null?'일시정지':remaining<=5000?'곧 전환됩니다':'남은 시간'}</span><strong data-testid="timer">{formatTime(remaining)}</strong><div className="progress"><i style={{width:Math.min(100,remaining/Math.max(clock.duration,remaining)*100)+'%'}}/></div>{!clock.finished&&remaining<=30000&&remaining>5000&&<small>30초 이내 다음 사진</small>}</aside>}
      {clock.finished&&<div className="finished"><h2>수업이 완료되었습니다.</h2><p>{queue.length}장의 이미지 재생을 마쳤습니다.</p><button className="primary" onClick={end}>준비 화면으로</button><button onClick={()=>{const t=Date.now();setNow(t);setClock(start(queue.length,clock.duration,t));prevIndex.current=-1}}>다시 시작</button></div>}
    </section>
    <footer className="controls"><div className="filename">{active.name} · {wakeStatus}{active.reference&&<> · <Credits item={active.reference}/></>}{storageError?' · '+storageError:''}</div><div className="control-row"><button disabled={clock.index===0} onClick={()=>command((c,t)=>move(c,-1,t))}>이전</button><button className="primary" disabled={clock.finished} onClick={()=>command(toggle)}>{clock.deadline===null?'재생':'일시정지'}</button><button disabled={clock.finished} onClick={()=>command((c,t)=>move(c,1,t))}>다음</button><button onClick={()=>command(restart)}>다시 시작</button><button disabled={clock.finished} onClick={()=>command((c,t)=>extend(c,30000,t))}>+30초</button><button disabled={clock.finished} onClick={()=>command((c,t)=>extend(c,60000,t))}>+1분</button><button disabled={clock.finished} onClick={()=>command((c,t)=>extend(c,300000,t))}>+5분</button><button onClick={()=>setShowTimer(v=>!v)}>{showTimer?'시간 숨기기':'시간 표시'}</button></div></footer>
  </main>
  return <main className="shell"><header className="top"><Brand/><span className="version">ART 2A · v0.4</span></header>
    <section className="intro"><div className="eyebrow">SAI COMPANY / DRAWING STUDIO</div><h1>그림을 바라보는 시간.</h1><p>사진을 선택하고 시간을 정하면 자동으로 다음 그림으로 넘어갑니다.</p></section>
    <section className="status-strip" aria-label="앱 상태">
      <span data-testid="offline-status">{pwa.ready?'오프라인 사용 준비 완료':pwa.error||'오프라인 준비 전 · 배포 버전에서 사용'}</span><span>{pwa.online?'온라인':'오프라인'}</span><span>{loaded?storageStatus:storageError?'저장소 오류':'사진 불러오는 중…'}</span>
      <button disabled={!loaded||busy} onClick={()=>void requestStorage()}>저장 유지 요청</button>
      {pwa.update&&<button className="primary" disabled={busy||!loaded} onClick={pwa.apply}>새 버전 적용</button>}
    </section>
    {storageError&&<p role="alert" className="warning">{storageError}</p>}
    {recovery&&<section className="recovery" role="region" aria-label="이전 수업 복구"><div><strong>이전 수업을 이어서 진행할까요?</strong><p>{recovery.clock.index+1} / {recovery.ids.length}장 · 남은 시간 {formatTime(recovery.clock.remaining)} · 일시정지 상태로 복구</p></div><button className="primary" onClick={resumeRecovery}>이전 수업 복구</button><button onClick={discardRecovery}>기록 삭제하고 새 수업</button></section>}
    <Library downloaded={downloaded} onDownload={receive} busy={busy} disabled={!loaded||!!recovery} online={pwa.online}/>
    <div className="setup-grid"><section className="panel"><div className="section-head"><h2>01. 수업 이미지</h2><span>{eligible.length} / {photos.length}장</span></div>
      <div className="catalog-filters"><label>수업 자료<select aria-label="재생 자료 범위" value={source} onChange={e=>{setSource(e.target.value);setTopic('전체')}}>{['전체','제공 자료','내 사진'].map(s=><option key={s}>{s}</option>)}</select></label><label>주제<select aria-label="재생 주제" disabled={source==='내 사진'} value={topic} onChange={e=>setTopic(e.target.value)}>{['전체',...categories].map(c=><option key={c}>{c}</option>)}</select></label></div>
      <label className="import-zone"><strong>{busy?'이미지 확인 중…':'사진 여러 장 가져오기'}</strong><small>JPG, PNG, WebP 등 · 사진은 서버로 전송되지 않습니다.</small><input aria-label="사진 가져오기" type="file" accept="image/*" multiple disabled={busy||!loaded||!!recovery} onChange={e=>{void importPhotos(e.target.files);e.target.value=''}}/></label>
      <p role="status" className="notice">{notice}</p>
      {photos.length>0&&<><div className="thumbs">{eligible.map((p,i)=><article key={p.id}><img src={p.url} alt={p.name} loading="lazy"/><div><small>{i+1}. {p.name}{p.reference?' · SAI':''}</small><button aria-label={p.name+' 삭제'} disabled={busy||!!recovery} onClick={()=>void remove(p.id)}>삭제</button></div></article>)}</div><button onClick={()=>void clear()} disabled={busy||!!recovery}>전체 삭제</button></>}
    </section><section className="panel"><div className="section-head"><h2>02. 수업 시간</h2></div><p className="muted">사진 한 장당 시간</p><div className="presets">{presets.map(s=><button key={s} aria-pressed={custom===''&&seconds===s} className={custom===''&&seconds===s?'selected':''} onClick={()=>{setSeconds(s);setCustom('')}}>{durationLabel(s)}</button>)}</div>
    <label className="custom">직접 입력 (분)<input type="number" min={.1} max={120} step="any" placeholder="예: 7.5" value={custom} onChange={e=>setCustom(e.target.value)}/></label>{!valid&&<p role="alert">5초 이상 120분 이하로 설정해 주세요.</p>}
    <div className="options"><label><input type="checkbox" checked={random} onChange={e=>setRandom(e.target.checked)}/> 무작위 순서</label><label><input type="checkbox" checked={sound} onChange={e=>setSound(e.target.checked)}/> 전환 알림음</label><label><input type="checkbox" checked={showTimer} onChange={e=>setShowTimer(e.target.checked)}/> 남은 시간 표시</label><label>발표 배경<select value={background} onChange={e=>setBackground(e.target.value)}><option value="black">검정</option><option value="gray">회색</option><option value="white">흰색</option></select></label></div>
    <div className="total"><span>예상 수업 시간</span><strong>{valid?formatTime(eligible.length*effective*1000):'--:--'}</strong></div><button className="primary start" disabled={!eligible.length||!valid||busy||!loaded||!!recovery} onClick={begin}>수업 시작</button></section></div>
    <footer className="bottom">Developed by SAI COMPANY · 사진은 이 브라우저의 기기 저장소에만 보관됩니다. 사이트 데이터 삭제 시 사라질 수 있으며 별도 백업은 추후 지원합니다. 여러 탭 동시 편집은 피해주세요.</footer>
  </main>
}
