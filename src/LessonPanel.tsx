import {useState} from 'react'
import type {Candidate,Entry,Lessons,Step} from './lesson'
import {buildPlan,uid,validSteps} from './lesson'
import {formatTime} from './timer'
export default function LessonPanel({data,save,pool,disabled,onStart}:{data:Lessons;save:(data:Lessons)=>boolean;pool:Candidate[];disabled:boolean;onStart:(entries:Entry[],title:string)=>void}){
 const [open,setOpen]=useState(false)
 const [title,setTitle]=useState('기초 크로키')
 const [steps,setSteps]=useState<Step[]>([{kind:'image',seconds:60,count:3},{kind:'image',seconds:300,count:3},{kind:'break',seconds:600,count:1},{kind:'image',seconds:600,count:3}])
 const [preview,setPreview]=useState<Entry[]|null>(null)
 const [previewKey,setPreviewKey]=useState('')
 const [error,setError]=useState('')
 const [groupName,setGroupName]=useState('')
 const [showHistory,setShowHistory]=useState(false)
 const signature=JSON.stringify([data.group,data.preferUnused,steps,pool.map(p=>p.key)])
 const current=previewKey===signature?preview:null
 const total=steps.reduce((n,s)=>n+s.seconds*s.count*1000,0)
 function edit(i:number,patch:Partial<Step>){setSteps(s=>s.map((x,j)=>i===j?{...x,...patch}:x));setPreview(null)}
 function reorder<T>(array:T[],i:number,delta:number){const a=[...array];const j=i+delta;if(j>=0&&j<a.length)[a[i],a[j]]=[a[j],a[i]];return a}
 function prepare(){try{setPreview(buildPlan(steps,pool));setPreviewKey(signature);setError('')}catch(e){setPreview(null);setError(e instanceof Error?e.message:'프로그램 구성 실패')}}
 function savePreset(){if(!title.trim()||!validSteps(steps)){setError('프로그램 이름과 시간을 확인해 주세요.');return}const existing=data.presets.find(p=>p.name===title.trim());if(existing&&!window.confirm('같은 이름의 프로그램을 덮어쓸까요?'))return
  if(save({...data,presets:[...data.presets.filter(p=>p.id!==existing?.id),{id:existing?.id??uid(),name:title.trim(),steps:steps.map(s=>({...s}))}]}))setError('프로그램 저장 완료')}
 function addGroup(){const g=groupName.trim();if(!g||data.groups.includes(g)||g.length>50)return;if(save({...data,groups:[...data.groups,g],group:g})){setGroupName('');setPreview(null)}}
 const history=data.history.filter(h=>h.group===data.group)
 return <section className="catalog-panel lesson-panel" aria-label="수업 프로그램 및 기록">
  <div className="catalog-heading"><div><span className="eyebrow">SAI LESSON STUDIO</span><h2>수업 프로그램 및 기록</h2><p>강의실별 사용 기록을 관리하고 시간과 휴식을 조합합니다.</p></div><div className="catalog-actions"><button onClick={()=>setShowHistory(v=>!v)}>{showHistory?'기록 접기':'수업 기록'}</button><button className="primary" onClick={()=>setOpen(v=>!v)}>{open?'프로그램 접기':'수업 프로그램 만들기'}</button></div></div>
  <div className="catalog-filters"><label>강의실<select aria-label="강의실 선택" disabled={disabled} value={data.group} onChange={e=>{save({...data,group:e.target.value});setPreview(null)}}>{data.groups.map(g=><option key={g}>{g}</option>)}</select></label><label><input type="checkbox" checked={data.preferUnused} disabled={disabled} onChange={e=>{save({...data,preferUnused:e.target.checked});setPreview(null)}}/> 미사용 사진 우선</label><span className="muted">이전 수업 {history.length}회</span></div>
  <div className="catalog-filters"><input aria-label="새 강의실 이름" placeholder="새 강의실 이름" maxLength={50} value={groupName} onChange={e=>setGroupName(e.target.value)}/><button disabled={disabled||!groupName.trim()||data.groups.includes(groupName.trim())} onClick={addGroup}>강의실 추가</button></div>
  {open&&<div className="lesson-editor"><div className="catalog-filters"><input aria-label="프로그램 이름" maxLength={80} value={title} onChange={e=>setTitle(e.target.value)}/><select aria-label="저장 프로그램 불러오기" value="" onChange={e=>{const p=data.presets.find(p=>p.id===e.target.value);if(p){setTitle(p.name);setSteps(p.steps.map(s=>({...s})));setPreview(null)}}}><option value="">저장 프로그램 불러오기</option>{data.presets.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button disabled={disabled} onClick={savePreset}>프로그램 저장</button></div>
  {steps.map((s,i)=><div className="lesson-step" key={i}><strong>{i+1}.</strong><select aria-label={'단계 '+(i+1)+' 종류'} value={s.kind} onChange={e=>edit(i,{kind:e.target.value as Step['kind'],count:1})}><option value="image">그림</option><option value="break">휴식</option></select><label>초<input aria-label={'단계 '+(i+1)+' 시간(초)'} type="number" min={5} max={7200} value={s.seconds} onChange={e=>edit(i,{seconds:Number(e.target.value)})}/></label>{s.kind==='image'&&<label>장<input aria-label={'단계 '+(i+1)+' 사진 수'} type="number" min={1} max={200} value={s.count} onChange={e=>edit(i,{count:Number(e.target.value)})}/></label>}<small>{formatTime(s.seconds*s.count*1000)}</small><button aria-label={'단계 '+(i+1)+' 위로'} disabled={i===0} onClick={()=>{setSteps(a=>reorder(a,i,-1));setPreview(null)}}>↑</button><button aria-label={'단계 '+(i+1)+' 아래로'} disabled={i===steps.length-1} onClick={()=>{setSteps(a=>reorder(a,i,1));setPreview(null)}}>↓</button><button aria-label={'단계 '+(i+1)+' 삭제'} disabled={steps.length===1} onClick={()=>{setSteps(a=>a.filter((_,j)=>j!==i));setPreview(null)}}>삭제</button></div>)}
  <div className="catalog-actions"><button disabled={steps.length>=30} onClick={()=>{setSteps(s=>[...s,{kind:'image',seconds:300,count:1}]);setPreview(null)}}>그림 단계 추가</button><button disabled={steps.length>=30} onClick={()=>{setSteps(s=>[...s,{kind:'break',seconds:600,count:1}]);setPreview(null)}}>휴식 추가</button></div>
  <p className="muted">현재 재생 자료 범위 기준 · 사용 가능 {pool.length}장 · 예상 {formatTime(total)} · 같은 프로그램 안에서 중복 사진 없음</p>
  <button disabled={disabled} onClick={prepare}>재생 순서 미리보기</button>{error&&<p role="status">{error}</p>}
  {current&&<div className="lesson-preview" aria-label="재생 순서"><ol>{current.map((e,i)=><li key={e.id}><span>{e.name} · {formatTime(e.duration)}</span><button aria-label={'재생 순서 '+(i+1)+' 위로'} disabled={i===0} onClick={()=>setPreview(a=>a?reorder(a,i,-1):a)}>↑</button><button aria-label={'재생 순서 '+(i+1)+' 아래로'} disabled={i===current.length-1} onClick={()=>setPreview(a=>a?reorder(a,i,1):a)}>↓</button></li>)}</ol><button className="primary" disabled={disabled||!title.trim()} onClick={()=>onStart(current,title.trim())}>프로그램 시작</button></div>}
  </div>}
  {showHistory&&<div className="lesson-history" aria-label="강의실 수업 기록">{history.length===0?<p>저장된 수업 기록이 없습니다.</p>:history.map(h=><article key={h.id}><strong>{h.title} · {h.status==='complete'?'완료':'중도 종료'}</strong><small>{new Date(h.started).toLocaleString('ko-KR')} · 사진 {h.viewed.length} / {h.total}장 · 경과 {formatTime(h.ended-h.started)} (휴식·정지 포함)</small><details><summary>사용 사진 및 설정 시간</summary><ul>{h.viewed.map(v=><li key={v.key}>{v.name} · {formatTime(v.duration)}</li>)}</ul></details><label>강사 메모<input aria-label={h.title+' 강사 메모'} maxLength={500} defaultValue={h.note} onBlur={e=>{const note=e.target.value;if(note!==h.note)save({...data,history:data.history.map(x=>x.id===h.id?{...x,note}:x)})}}/></label></article>)}</div>}
 </section>
}
