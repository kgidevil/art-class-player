import { useEffect, useRef, useState } from 'react'
import { start, left, tick, move, toggle, extend, restart, formatTime, shuffle } from './timer'
import type { Clock } from './timer'

type Photo = { id: number; name: string; url: string }
const presets = [30,60,120,180,300,600,900,1200]
const durationLabel = (s: number) => s < 60 ? s + '초' : s/60 + '분'
const logo = import.meta.env.BASE_URL + 'sai-logo.jpg'
function Brand() {
  const [failed,setFailed] = useState(false)
  return <div className="brand">{failed ? <span className="brand-fallback">SAI</span> : <img src={logo} alt="사이컴퍼니 SAI 로고" onError={()=>setFailed(true)}/>}<div><strong>ART CLASS PLAYER</strong><small>SAI COMPANY · ART EDUCATION</small></div></div>
}
export default function App() {
  const [photos,setPhotos] = useState<Photo[]>([])
  const urls = useRef(new Set<string>())
  const serial = useRef(0)
  const [busy,setBusy] = useState(false)
  const [notice,setNotice] = useState('')
  const [seconds,setSeconds] = useState(300)
  const [custom,setCustom] = useState('')
  const [random,setRandom] = useState(false)
  const [sound,setSound] = useState(true)
  const [showTimer,setShowTimer] = useState(true)
  const [background,setBackground] = useState('black')
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

  useEffect(()=>{ const owned = urls.current; return ()=>{owned.forEach(u=>URL.revokeObjectURL(u));owned.clear(); void audio.current?.close().catch(()=>{})} },[])
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
    if(!files || busy)return
    setBusy(true);setNotice('')
    const accepted: Photo[]=[];let bad=0
    for(const file of Array.from(files)){
      if(!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i.test(file.name)){bad++;continue}
      const url=URL.createObjectURL(file)
      try { const img=new Image();img.src=url;await img.decode();const id=++serial.current;urls.current.add(url);accepted.push({id,name:file.name,url}) }
      catch{URL.revokeObjectURL(url);bad++}
    }
    setPhotos(p=>[...p,...accepted]);setNotice(accepted.length+'장 추가'+(bad ? ' · '+bad+'장은 지원되지 않거나 손상된 이미지입니다.' : ''));setBusy(false)
  }
  function remove(id:number){const p=photos.find(p=>p.id===id);if(p){URL.revokeObjectURL(p.url);urls.current.delete(p.url)}setPhotos(p=>p.filter(i=>i.id!==id))}
  function clear(){photos.forEach(p=>{URL.revokeObjectURL(p.url);urls.current.delete(p.url)});setPhotos([]);setNotice('')}
  function begin(){if(!photos.length||!valid||busy)return;const t=Date.now();const ordered=random?shuffle(photos):[...photos];setQueue(ordered);setNow(t);setClock(start(ordered.length,Math.round(effective*1000),t));prevIndex.current=-1;try{if(sound){audio.current??=new AudioContext();void audio.current.resume().catch(()=>{})}}catch{/* sound is optional */}}
  function command(fn:(c:Clock,t:number)=>Clock){const t=Date.now();setNow(t);setClock(c=>c?fn(c,t):c)}
  async function present(){setPresentation(true);try{if(stage.current?.requestFullscreen)await stage.current.requestFullscreen()}catch{/* CSS presentation remains available */}}
  function exitPresent(){setPresentation(false);if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{})}
  function end(){if(clock && !clock.finished && !window.confirm('수업을 종료하고 준비 화면으로 돌아갈까요?'))return;exitPresent();setClock(null);setQueue([])}
  if(clock && active)return <main ref={stage} className={'player '+(presentation?'presentation ':'')+'bg-'+background}>
    <header className="player-top"><Brand/><span className="counter">{clock.index+1} / {queue.length}</span><button onClick={presentation?exitPresent:present}>{presentation?'발표 종료':'발표 화면'}</button><button onClick={end}>수업 종료</button></header>
    <section className="visual"><div className="photo-area">{imageError?<div className="image-error">이미지를 표시할 수 없습니다. 다음 사진으로 이동해 주세요.</div>:<img className="reference" src={active.url} alt={active.name} onError={()=>setImageError(true)}/>}</div>
      {showTimer&&<aside className={'clock '+(!clock.finished&&remaining<=30000?'urgent':'')}><span>{clock.finished?'수업 완료':clock.deadline===null?'일시정지':remaining<=5000?'곧 전환됩니다':'남은 시간'}</span><strong data-testid="timer">{formatTime(remaining)}</strong><div className="progress"><i style={{width:Math.min(100,remaining/Math.max(clock.duration,remaining)*100)+'%'}}/></div>{!clock.finished&&remaining<=30000&&remaining>5000&&<small>30초 이내 다음 사진</small>}</aside>}
      {clock.finished&&<div className="finished"><h2>수업이 완료되었습니다.</h2><p>{queue.length}장의 이미지 재생을 마쳤습니다.</p><button className="primary" onClick={end}>준비 화면으로</button><button onClick={begin}>다시 시작</button></div>}
    </section>
    <footer className="controls"><div className="filename">{active.name}</div><div className="control-row"><button disabled={clock.index===0} onClick={()=>command((c,t)=>move(c,-1,t))}>이전</button><button className="primary" disabled={clock.finished} onClick={()=>command(toggle)}>{clock.deadline===null?'재생':'일시정지'}</button><button disabled={clock.finished} onClick={()=>command((c,t)=>move(c,1,t))}>다음</button><button onClick={()=>command(restart)}>다시 시작</button><button disabled={clock.finished} onClick={()=>command((c,t)=>extend(c,30000,t))}>+30초</button><button disabled={clock.finished} onClick={()=>command((c,t)=>extend(c,60000,t))}>+1분</button><button disabled={clock.finished} onClick={()=>command((c,t)=>extend(c,300000,t))}>+5분</button><button onClick={()=>setShowTimer(v=>!v)}>{showTimer?'시간 숨기기':'시간 표시'}</button></div></footer>
  </main>
  return <main className="shell"><header className="top"><Brand/><span className="version">ART 1A · v0.2</span></header>
    <section className="intro"><div className="eyebrow">SAI COMPANY / DRAWING STUDIO</div><h1>그림을 바라보는 시간.</h1><p>사진을 선택하고 시간을 정하면 자동으로 다음 그림으로 넘어갑니다.</p></section>
    <div className="setup-grid"><section className="panel"><div className="section-head"><h2>01. 수업 이미지</h2><span>{photos.length}장</span></div>
      <label className="import-zone"><strong>{busy?'이미지 확인 중…':'사진 여러 장 가져오기'}</strong><small>JPG, PNG, WebP 등 · 사진은 서버로 전송되지 않습니다.</small><input aria-label="사진 가져오기" type="file" accept="image/*" multiple disabled={busy} onChange={e=>{void importPhotos(e.target.files);e.target.value=''}}/></label>
      <p role="status" className="notice">{notice}</p>
      {photos.length>0&&<><div className="thumbs">{photos.map((p,i)=><article key={p.id}><img src={p.url} alt={p.name} loading="lazy"/><div><small>{i+1}. {p.name}</small><button aria-label={p.name+' 삭제'} onClick={()=>remove(p.id)}>삭제</button></div></article>)}</div><button onClick={clear} disabled={busy}>전체 삭제</button></>}
    </section><section className="panel"><div className="section-head"><h2>02. 수업 시간</h2></div><p className="muted">사진 한 장당 시간</p><div className="presets">{presets.map(s=><button key={s} aria-pressed={custom===''&&seconds===s} className={custom===''&&seconds===s?'selected':''} onClick={()=>{setSeconds(s);setCustom('')}}>{durationLabel(s)}</button>)}</div>
    <label className="custom">직접 입력 (분)<input type="number" min={.1} max={120} step="any" placeholder="예: 7.5" value={custom} onChange={e=>setCustom(e.target.value)}/></label>{!valid&&<p role="alert">5초 이상 120분 이하로 설정해 주세요.</p>}
    <div className="options"><label><input type="checkbox" checked={random} onChange={e=>setRandom(e.target.checked)}/> 무작위 순서</label><label><input type="checkbox" checked={sound} onChange={e=>setSound(e.target.checked)}/> 전환 알림음</label><label><input type="checkbox" checked={showTimer} onChange={e=>setShowTimer(e.target.checked)}/> 남은 시간 표시</label><label>발표 배경<select value={background} onChange={e=>setBackground(e.target.value)}><option value="black">검정</option><option value="gray">회색</option><option value="white">흰색</option></select></label></div>
    <div className="total"><span>예상 수업 시간</span><strong>{valid?formatTime(photos.length*effective*1000):'--:--'}</strong></div><button className="primary start" disabled={!photos.length||!valid||busy} onClick={begin}>수업 시작</button></section></div>
    <footer className="bottom">Developed by SAI COMPANY · 사진은 이번 실행 중에만 유지됩니다. 오프라인 저장은 ART 1B에서 구현합니다.</footer>
  </main>
}
