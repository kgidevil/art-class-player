import {useState} from 'react'
import type {Candidate,Entry,Lessons,Step} from './lesson'
import {buildPlan,uid,validSteps} from './lesson'
import {formatTime} from './timer'
const minutePresets=[1,3,5,10,15,20]
function humanDuration(seconds:number){if(!Number.isFinite(seconds)||seconds<0)return '—';const whole=Math.round(seconds);const h=Math.floor(whole/3600),m=Math.floor(whole%3600/60),r=whole%60;return [h?h+'시간':'',m?m+'분':'',r?r+'초':''].filter(Boolean).join(' ')||'0분'}
export default function LessonPanel({data,save,pool,startBlocked,onStart}:{data:Lessons;save:(data:Lessons)=>boolean;pool:Candidate[];startBlocked:string;onStart:(entries:Entry[],title:string)=>void}){
 const [open,setOpen]=useState(false)
 const [title,setTitle]=useState('기초 크로키')
 const [steps,setSteps]=useState<Step[]>([{kind:'image',seconds:60,count:3},{kind:'image',seconds:300,count:3},{kind:'break',seconds:600,count:1},{kind:'image',seconds:600,count:3}])
 const [preview,setPreview]=useState<Entry[]|null>(null)
 const [previewKey,setPreviewKey]=useState('')
 const [error,setError]=useState('')
 const [groupName,setGroupName]=useState('')
 const [groupMessage,setGroupMessage]=useState('')
 const [presetMessage,setPresetMessage]=useState('')
 const required=steps.reduce((n,s)=>n+(s.kind==='image'?s.count:0),0)
 const totalBreak=steps.reduce((n,s)=>n+(s.kind==='break'?s.seconds:0),0)
 const valid=validSteps(steps)
 const duplicateGroup=data.groups.find(g=>g.trim().replace(/\s+/g,'')===groupName.trim().replace(/\s+/g,''))
 const [showHistory,setShowHistory]=useState(false)
 const signature=JSON.stringify([data.group,data.preferUnused,steps,pool.map(p=>p.key)])
 const current=previewKey===signature?preview:null
 const total=steps.reduce((n,s)=>n+s.seconds*s.count*1000,0)
 function edit(i:number,patch:Partial<Step>){setSteps(s=>s.map((x,j)=>i===j?{...x,...patch}:x));setPreview(null);setError('')}
 function reorder<T>(array:T[],i:number,delta:number){const a=[...array];const j=i+delta;if(j>=0&&j<a.length)[a[i],a[j]]=[a[j],a[i]];return a}
 function prepare(){try{setPreview(buildPlan(steps,pool));setPreviewKey(signature);setError('')}catch(e){setPreview(null);setError(e instanceof Error?e.message:'프로그램 구성 실패')}}
 function savePreset(){setPresetMessage('');if(!title.trim()||!validSteps(steps)){setPresetMessage('프로그램 이름, 시간, 장수를 확인해 주세요.');return}const existing=data.presets.find(p=>p.name===title.trim());if(existing&&!window.confirm('같은 이름의 프로그램을 덮어쓸까요?'))return
  if(save({...data,presets:[...data.presets.filter(p=>p.id!==existing?.id),{id:existing?.id??uid(),name:title.trim(),steps:steps.map(s=>({...s}))}]}))setPresetMessage('프로그램 저장 완료');else setPresetMessage('프로그램 저장 실패 · 기기 저장 공간을 확인해 주세요.')}
 function addGroup(){const g=groupName.trim();if(!g||g.length>50){setGroupMessage('강의실 이름을 입력해 주세요.');return}if(duplicateGroup){setGroupMessage('이미 등록된 강의실입니다: '+duplicateGroup);return}if(save({...data,groups:[...data.groups,g],group:g})){setGroupName('');setPreview(null);setGroupMessage(g+' 추가 완료')}else setGroupMessage('강의실 저장 실패 · 기기 저장 공간을 확인해 주세요.')}
 const history=data.history.filter(h=>h.group===data.group)
 return <section className="catalog-panel lesson-panel" aria-label="수업 프로그램 및 기록">
  <div className="catalog-heading"><div><span className="eyebrow">SAI LESSON STUDIO</span><h2>수업 프로그램 및 기록</h2><p>강의실별 사용 기록을 관리하고 시간과 휴식을 조합합니다.</p></div><div className="catalog-actions"><button onClick={()=>setShowHistory(v=>!v)}>{showHistory?'기록 접기':'수업 기록'}</button><button className="primary" onClick={()=>setOpen(v=>!v)}>{open?'프로그램 접기':'수업 프로그램 만들기'}</button></div></div>
  <div className="lesson-group-box">
    <div className="lesson-subhead"><strong>1. 강의실 선택</strong><span>이전 수업 {history.length}회</span></div>
    <div className="lesson-group-controls"><label className="lesson-field">현재 강의실<select aria-label="강의실 선택" value={data.group} onChange={e=>{if(save({...data,group:e.target.value})){setPreview(null);setGroupMessage('')}else setGroupMessage('강의실 선택을 저장하지 못했습니다.')}}>{data.groups.map(g=><option key={g}>{g}</option>)}</select></label>
      <div className="lesson-field"><label htmlFor="lesson-new-group">새 강의실</label><div className="lesson-add-group"><input id="lesson-new-group" aria-label="새 강의실 이름" placeholder="예: 괴산 미술반" maxLength={50} value={groupName} onChange={e=>{setGroupName(e.target.value);setGroupMessage('')}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addGroup()}}}/><button className="primary" disabled={!groupName.trim()||!!duplicateGroup} onClick={addGroup}>강의실 추가</button></div></div>
    </div>
    <label className="lesson-toggle"><input type="checkbox" checked={data.preferUnused} onChange={e=>{if(save({...data,preferUnused:e.target.checked}))setPreview(null)}}/> 이 강의실에서 아직 사용하지 않은 사진 우선</label>
    {(groupMessage||duplicateGroup)&&<p role="status" className="lesson-feedback">{groupMessage||'이미 등록된 강의실입니다: '+duplicateGroup}</p>}
  </div>
  {open&&<div className="lesson-editor">
  <div className="lesson-subhead"><strong>2. 수업 프로그램 구성</strong><span>시간은 분 단위 · 0.5분 = 30초</span></div>
  <div className="lesson-preset-row"><label className="lesson-field">프로그램 이름<input aria-label="프로그램 이름" maxLength={80} value={title} onChange={e=>{setTitle(e.target.value);setPresetMessage('')}}/></label><label className="lesson-field">저장한 프로그램<select aria-label="저장 프로그램 불러오기" value="" onChange={e=>{const p=data.presets.find(p=>p.id===e.target.value);if(p){setTitle(p.name);setSteps(p.steps.map(s=>({...s})));setPreview(null);setPresetMessage('프로그램 불러오기 완료')}}}><option value="">저장 프로그램 불러오기</option>{data.presets.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button className="primary" onClick={savePreset}>프로그램 저장</button></div>
  {presetMessage&&<p role="status" className="lesson-feedback">{presetMessage}</p>}
  <div className="lesson-steps">{steps.map((s,i)=><div className={'lesson-step '+(s.kind==='break'?'lesson-break':'')} key={i}>
    <div className="lesson-step-head"><span className="lesson-number">{i+1}</span><label className="lesson-field">단계 종류<select aria-label={'단계 '+(i+1)+' 종류'} value={s.kind} onChange={e=>edit(i,{kind:e.target.value as Step['kind'],count:1})}><option value="image">그림 연습</option><option value="break">휴식</option></select></label></div>
    <div className="lesson-time"><label className="lesson-field">{s.kind==='image'?'사진 한 장당 시간':'휴식 시간'}<div className="lesson-number-field"><input aria-label={'단계 '+(i+1)+' 시간(분)'} type="number" min={0.084} max={120} step="any" value={Number((s.seconds/60).toFixed(3))} onChange={e=>edit(i,{seconds:Math.round(Number(e.target.value)*60)})}/><span>분</span></div></label><div className="lesson-minute-presets" aria-label={'단계 '+(i+1)+' 빠른 시간 선택'}>{minutePresets.map(m=><button key={m} type="button" aria-label={'단계 '+(i+1)+' '+m+'분'} aria-pressed={s.seconds===m*60} onClick={()=>edit(i,{seconds:m*60})}>{m}분</button>)}</div></div>
    <div className="lesson-count">{s.kind==='image'?<label className="lesson-field">사진 수<div className="lesson-number-field"><input aria-label={'단계 '+(i+1)+' 사진 수'} type="number" min={1} max={200} value={s.count} onChange={e=>edit(i,{count:Number(e.target.value)})}/><span>장</span></div></label>:<span className="lesson-rest-tag">사진 없이 휴식</span>}</div>
    <div className="lesson-subtotal"><small>단계 소요 시간</small><strong>{humanDuration(s.seconds*s.count)}</strong></div>
    <div className="lesson-step-actions"><button aria-label={'단계 '+(i+1)+' 위로'} disabled={i===0} onClick={()=>{setSteps(a=>reorder(a,i,-1));setPreview(null)}}>↑</button><button aria-label={'단계 '+(i+1)+' 아래로'} disabled={i===steps.length-1} onClick={()=>{setSteps(a=>reorder(a,i,1));setPreview(null)}}>↓</button><button aria-label={'단계 '+(i+1)+' 삭제'} disabled={steps.length===1} onClick={()=>{setSteps(a=>a.filter((_,j)=>j!==i));setPreview(null)}}>삭제</button></div>
  </div>)}</div>
  <div className="catalog-actions lesson-add-actions"><button disabled={steps.length>=30} onClick={()=>{setSteps(s=>[...s,{kind:'image',seconds:300,count:1}]);setPreview(null)}}>+ 그림 단계</button><button disabled={steps.length>=30} onClick={()=>{setSteps(s=>[...s,{kind:'break',seconds:600,count:1}]);setPreview(null)}}>+ 휴식 단계</button></div>
  <div className="lesson-summary" aria-label="프로그램 요약"><div><small>필요 사진 / 사용 가능</small><strong>{required} / {pool.length}장</strong></div><div><small>휴식 합계</small><strong>{humanDuration(totalBreak)}</strong></div><div><small>예상 수업 시간</small><strong>{humanDuration(total/1000)}</strong></div></div>
  {!valid&&<p role="alert" className="lesson-feedback">시간은 약 0.083분(5초) 이상 120분 이하, 사진은 단계당 1~200장으로 설정해 주세요.</p>}
  {required>pool.length&&<p className="lesson-feedback">사진이 {required-pool.length}장 부족합니다. 수업 이미지 범위를 바꾸거나 사진을 더 저장해 주세요.</p>}
  <p className="muted">현재 재생 자료 범위를 사용하며, 같은 프로그램 안에서 사진을 반복하지 않습니다.</p>
  {startBlocked&&<p role="status" className="lesson-feedback">{startBlocked} 강의실과 프로그램 편집·저장은 가능합니다.</p>}
  <button className="primary" disabled={!valid||required>pool.length} onClick={prepare}>재생 순서 미리보기</button>{error&&<p role="status">{error}</p>}
  {current&&<div className="lesson-preview" aria-label="재생 순서"><div className="lesson-subhead"><strong>3. 재생 순서 확인</strong><span>{current.length}단계</span></div><ol>{current.map((e,i)=><li key={e.id}><span>{e.name} · {humanDuration(e.duration/1000)}</span><button aria-label={'재생 순서 '+(i+1)+' 위로'} disabled={i===0} onClick={()=>setPreview(a=>a?reorder(a,i,-1):a)}>↑</button><button aria-label={'재생 순서 '+(i+1)+' 아래로'} disabled={i===current.length-1} onClick={()=>setPreview(a=>a?reorder(a,i,1):a)}>↓</button></li>)}</ol><button className="primary" disabled={!!startBlocked||!title.trim()} onClick={()=>onStart(current,title.trim())}>프로그램 시작</button></div>}
  </div>}
  {showHistory&&<div className="lesson-history" aria-label="강의실 수업 기록">{history.length===0?<p>저장된 수업 기록이 없습니다.</p>:history.map(h=><article key={h.id}><strong>{h.title} · {h.status==='complete'?'완료':'중도 종료'}</strong><small>{new Date(h.started).toLocaleString('ko-KR')} · 사진 {h.viewed.length} / {h.total}장 · 경과 {formatTime(h.ended-h.started)} (휴식·정지 포함)</small><details><summary>사용 사진 및 설정 시간</summary><ul>{h.viewed.map(v=><li key={v.key}>{v.name} · {formatTime(v.duration)}</li>)}</ul></details><label>강사 메모<input aria-label={h.title+' 강사 메모'} maxLength={500} defaultValue={h.note} onBlur={e=>{const note=e.target.value;if(note!==h.note)save({...data,history:data.history.map(x=>x.id===h.id?{...x,note}:x)})}}/></label></article>)}</div>}
 </section>
}
