import {ToolButton,useToolPopup} from './ToolIcons'
import type {InkAction,InkSettings} from './ink'
import {MAX_ACTIONS} from './ink'
const colors=['#ff793c','#f8e24a','#ff4141','#32c6e9','#62dc80','#ffffff','#171717']
const colorNames=['주황','노랑','빨강','하늘','초록','흰색','검정']
export function InkToolbar({settings,change,photoOpacity,changePhotoOpacity,actions,undo,redo,canRedo,clear,demo,close}:{settings:InkSettings;change:(s:InkSettings)=>void;photoOpacity:number;changePhotoOpacity:(value:number)=>void;actions:InkAction[];undo:()=>void;redo:()=>void;canRedo:boolean;clear:()=>void;demo:()=>void;close:()=>void}){
 const {popup,root,closePopup,togglePopup}=useToolPopup<'colors'|'advanced'|'paper'>()
 const set=(p:Partial<InkSettings>)=>change({...settings,...p})
 const last=actions.at(-1)
 const sample=last?.kind==='stroke'?last:null
 const pressures=sample?.pointerType==='pen'?sample.points.map(p=>p.pressure):[]
 const low=pressures.length?Math.min(...pressures):null,high=pressures.length?Math.max(...pressures):null
 return <section ref={root} className="ink-toolbar slim-tools" aria-label="드로잉 도구">
  <div className="slim-strip" role="group" aria-label="기본 드로잉">
   {([{id:'move',name:'이동'},{id:'pen',name:'펜'},{id:'eraser',name:'지우개'}] as const).map(t=><ToolButton key={t.id} icon={t.id} label={t.name} pressed={settings.tool===t.id} onClick={()=>{set({tool:t.id,visible:true});closePopup()}}/>)}
   <ToolButton icon="undo" label="실행 취소" disabled={!actions.length} onClick={undo}/>
   <ToolButton icon="redo" label="다시 실행" disabled={!canRedo} onClick={redo}/>
   <span className="slim-separator" aria-hidden="true"/>
   <ToolButton label="펜 색상 선택" expanded={popup==='colors'} controls="ink-colors-popup" onClick={()=>togglePopup('colors')}><span className="slim-swatch" style={{background:settings.color}}/></ToolButton>
   <ToolButton icon="paper" label="사진 불투명도 설정" expanded={popup==='paper'} controls="ink-paper-popup" pressed={photoOpacity<100} onClick={()=>togglePopup('paper')}/>
   <ToolButton icon="settings" label={popup==='advanced'?'상세 접기':'상세 설정'} expanded={popup==='advanced'} controls="ink-advanced" onClick={()=>togglePopup('advanced')}/>
   <ToolButton icon="demo" label="시연" onClick={()=>{closePopup();demo()}}/>
   <ToolButton icon="close" label="드로잉 도구 접기" onClick={close}/>
   {(settings.penOnly||!settings.visible)&&<span className="slim-status" title={[settings.penOnly?'펜 전용':'',!settings.visible?'설명선 숨김':''].filter(Boolean).join(' · ')}>{settings.penOnly?'펜 전용':''}{!settings.visible?' 설명선 숨김':''}</span>}
  </div>
  <div id="ink-colors-popup" className="slim-popup slim-color-popup" hidden={popup!=='colors'}>
   <strong>펜 색상</strong><div className="slim-colors" role="group" aria-label="펜 색상">{colors.map((c,i)=><button type="button" key={c} title={colorNames[i]} aria-label={'펜 색상 '+colorNames[i]} aria-pressed={settings.color===c} onClick={()=>{set({color:c,tool:'pen',visible:true});closePopup()}}><span style={{background:c}}/></button>)}</div>
  </div>
  <div id="ink-paper-popup" className="slim-popup" hidden={popup!=='paper'}>
   <strong>사진 불투명도</strong><label className="slim-range"><span>사진</span><input aria-label="사진 불투명도" type="range" min={0} max={100} step={5} value={photoOpacity} onChange={e=>changePhotoOpacity(Number(e.target.value))}/><output>{photoOpacity}%</output></label>
   <button type="button" disabled={photoOpacity===100} onClick={()=>changePhotoOpacity(100)}>원본 표시</button><small>낮추면 흰 바탕에 사진만 옅어집니다.</small>
  </div>
  <div id="ink-advanced" className="slim-popup" hidden={popup!=='advanced'}>
   <strong>드로잉 설정</strong>
   <label className="slim-range"><span>굵기</span><input aria-label="펜 굵기" type="range" min={2} max={30} value={settings.width} onChange={e=>set({width:Number(e.target.value)})}/><output>{settings.width}</output></label>
   <label className="slim-range"><span>펜 불투명도</span><input aria-label="펜 불투명도" type="range" min={15} max={100} step={5} value={settings.opacity} onChange={e=>set({opacity:Number(e.target.value)})}/><output>{settings.opacity}%</output></label>
   <label className="slim-check"><input type="checkbox" checked={settings.penOnly} onChange={e=>set({penOnly:e.target.checked})}/> 펜 입력만</label>
   <label className="slim-check"><input type="checkbox" checked={settings.pressureEnabled} onChange={e=>set({pressureEnabled:e.target.checked})}/> 펜 필압 반영</label>
   <div className="slim-choice"><button aria-pressed={!settings.visible} onClick={()=>set({visible:!settings.visible})}>{settings.visible?'설명선 숨기기':'설명선 표시'}</button><button disabled={!actions.length} onClick={clear}>선 전체 지우기</button></div>
   <div className="ink-pressure-report" role="status" aria-label="필압 진단">{!sample?'필압 진단 · 펜으로 가볍게 시작해 점차 힘을 주며 한 획을 그려 보세요.':sample.pointerType!=='pen'?'필압 진단 · 마지막 획은 펜 입력으로 인식되지 않았습니다.':low===null||high===null?'필압 진단 · 측정값 없음':'필압 진단 · 펜 인식 · 최저 '+low.toFixed(3)+' / 최고 '+high.toFixed(3)+' · '+(high-low>=.05?'변화 감지':'변화 미미 · 힘을 달리하여 다시 확인')}</div>
   <small>두 손가락 탭: 취소 · 세 손가락 탭: 복원 · 두 손가락 이동/핀치: 이동/확대. 설명선은 사진별로 유지됩니다.</small>
  </div>
  {actions.length>=MAX_ACTIONS&&<span className="slim-limit" role="status">기록 한도 · 실행 취소 또는 전체 지우기</span>}
 </section>
}
export function InstructorPreview({next,remaining,percent,index,count}:{next?:{name:string;url:string;isBreak?:boolean};remaining:string;percent:number;index:number;count:number}){
 return <section className="instructor-preview" aria-label="강사 수업 진행"><div className="instructor-progress"><span>전체 진행</span><strong>{Math.floor(percent)}%</strong></div><progress aria-label="전체 수업 진행률" max={100} value={percent}/><small>{index} / {count}단계 · 예정 남은 시간 {remaining}</small><div className="next-preview"><strong>다음 단계</strong>{next?(next.isBreak?<div className="next-break">휴식 시간</div>:<><img src={next.url} alt="다음 사진 미리보기" draggable={false}/><small>{next.name}</small></>):<span>마지막 단계입니다.</span>}</div></section>
}
