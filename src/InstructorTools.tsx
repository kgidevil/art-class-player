import {useState} from 'react'
import type {InkAction,InkSettings} from './ink'
import {MAX_ACTIONS} from './ink'
const colors=['#ff793c','#f8e24a','#ff4141','#32c6e9','#62dc80','#ffffff','#171717']
const colorNames=['주황','노랑','빨강','하늘','초록','흰색','검정']
export function InkToolbar({settings,change,actions,undo,redo,canRedo,clear,demo,close}:{settings:InkSettings;change:(s:InkSettings)=>void;actions:InkAction[];undo:()=>void;redo:()=>void;canRedo:boolean;clear:()=>void;demo:()=>void;close:()=>void}){
 const [advanced,setAdvanced]=useState(false)
 const set=(p:Partial<InkSettings>)=>change({...settings,...p})
 const last=actions.at(-1)
 const sample=last?.kind==='stroke'?last:null
 const pressures=sample?.pointerType==='pen'?sample.points.map(p=>p.pressure):[]
 const low=pressures.length?Math.min(...pressures):null,high=pressures.length?Math.max(...pressures):null
 return <section className="ink-toolbar tool-dock" aria-label="드로잉 도구">
  <div className="tool-dock-main">
   <div className="ink-buttons" role="group" aria-label="기본 드로잉">
    {([{id:'move',name:'이동'},{id:'pen',name:'펜'},{id:'eraser',name:'지우개'}] as const).map(t=><button key={t.id} aria-pressed={settings.tool===t.id} onClick={()=>set({tool:t.id,visible:true})}>{t.name}</button>)}
    <button disabled={!actions.length} onClick={undo} title="두 손가락 탭">실행 취소</button><button disabled={!canRedo} onClick={redo} title="세 손가락 탭">다시 실행</button>
   </div>
   <div className="ink-colors" role="group" aria-label="펜 색상">{colors.map((c,i)=><button key={c} title={colorNames[i]} aria-label={'펜 색상 '+colorNames[i]} aria-pressed={settings.color===c} style={{'--ink-color':c} as React.CSSProperties} onClick={()=>set({color:c,tool:'pen',visible:true})}/>)}</div>
   <div className="tool-dock-actions"><button aria-expanded={advanced} aria-controls="ink-advanced" onClick={()=>setAdvanced(v=>!v)}>{advanced?'상세 접기':'상세 설정'}</button><button onClick={demo}>시연</button><button onClick={close} aria-label="드로잉 도구 접기">닫기</button></div>
  </div>
  {(settings.penOnly||!settings.visible)&&<div className="ink-status">{settings.penOnly&&<span className="tool-active-note">펜 전용</span>}{!settings.visible&&<span className="tool-active-note">설명선 숨김</span>}</div>}
  <div id="ink-advanced" className="tool-dock-detail" hidden={!advanced}>
   <div className="ink-quick-width"><label>굵기<input aria-label="펜 굵기" type="range" min={2} max={30} value={settings.width} onChange={e=>set({width:Number(e.target.value)})}/><output>{settings.width}</output></label></div>
   <div className="ink-options"><label>투명도<input aria-label="펜 불투명도" type="range" min={15} max={100} step={5} value={settings.opacity} onChange={e=>set({opacity:Number(e.target.value)})}/><output>{settings.opacity}%</output></label><label className="ink-pen-only"><input type="checkbox" checked={settings.penOnly} onChange={e=>set({penOnly:e.target.checked})}/> 펜 입력만</label><button aria-pressed={!settings.visible} onClick={()=>set({visible:!settings.visible})}>{settings.visible?'설명선 숨기기':'설명선 표시'}</button><button disabled={!actions.length} onClick={clear}>선 전체 지우기</button></div>
   <label className="ink-pressure-toggle"><input type="checkbox" checked={settings.pressureEnabled} onChange={e=>set({pressureEnabled:e.target.checked})}/> 펜 필압 반영</label>
   <div className="ink-pressure-report" role="status" aria-label="필압 진단">{!sample?'필압 진단 · 펜으로 가볍게 시작해 점차 힘을 주며 한 획을 그려 보세요.':sample.pointerType!=='pen'?'필압 진단 · 마지막 획은 펜 입력으로 인식되지 않았습니다.':low===null||high===null?'필압 진단 · 측정값 없음':'필압 진단 · 펜 인식 · 최저 '+low.toFixed(3)+' / 최고 '+high.toFixed(3)+' · '+(high-low>=.05?'변화 감지':'변화 미미 · 힘을 달리하여 다시 확인')}</div>
   <p className="tool-note">그림 위 두 손가락 탭: 실행 취소 · 세 손가락 탭: 다시 실행. 두 손가락으로 벌리거나 오므리면 확대·축소, 함께 움직이면 이동합니다. 시연을 누르면 모든 메뉴와 타이머가 숨겨지고, 시연 종료만 표시됩니다. 계속 그릴 수 있습니다. 펜을 화면에서 뗀 뒤 제스처를 사용하세요. 설명선은 사진별로 유지되며 원본은 변경되지 않습니다.</p>
  </div>
  {actions.length>=MAX_ACTIONS&&<p role="status">설명선 기록 한도에 도달했습니다. 실행 취소하거나 상세 설정에서 전체 지우기를 사용하세요.</p>}
 </section>
}
export function InstructorPreview({next,remaining,percent,index,count}:{next?:{name:string;url:string;isBreak?:boolean};remaining:string;percent:number;index:number;count:number}){
 return <section className="instructor-preview" aria-label="강사 수업 진행"><div className="instructor-progress"><span>전체 진행</span><strong>{Math.floor(percent)}%</strong></div><progress aria-label="전체 수업 진행률" max={100} value={percent}/><small>{index} / {count}단계 · 예정 남은 시간 {remaining}</small><div className="next-preview"><strong>다음 단계</strong>{next?(next.isBreak?<div className="next-break">휴식 시간</div>:<><img src={next.url} alt="다음 사진 미리보기" draggable={false}/><small>{next.name}</small></>):<span>마지막 단계입니다.</span>}</div></section>
}
