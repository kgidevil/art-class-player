import {ToolButton,useToolPopup} from './ToolIcons'
import {defaultArt} from './art-tools'
import type {ArtSettings,Mode} from './art-tools'
const tones:{id:Mode;count:number}[]=[{id:'tone2',count:2},{id:'tone3',count:3},{id:'tone5',count:5}]
export default function ArtToolbar({settings,change,close}:{settings:ArtSettings;change:(value:ArtSettings)=>void;close:()=>void}){
 const {popup,root,closePopup,togglePopup}=useToolPopup<'tone'|'grid'|'advanced'>()
 const set=(patch:Partial<ArtSettings>)=>change({...settings,...patch})
 const mode=(value:Mode)=>{set({mode:value});closePopup()}
 const tone=tones.find(t=>t.id===settings.mode)
 return <section ref={root} className="art-toolbar slim-tools" aria-label="미술 보조 도구">
  <div className="slim-strip" role="group" aria-label="이미지 분석">
   <ToolButton icon="image" label="원본" pressed={settings.mode==='original'} onClick={()=>mode('original')}/>
   <ToolButton icon="contrast" label="흑백" pressed={settings.mode==='gray'} onClick={()=>mode('gray')}/>
   <ToolButton icon="tone" label="명암 단계 선택" pressed={!!tone} expanded={popup==='tone'} controls="art-tone-popup" onClick={()=>togglePopup('tone')}>{tone&&<span className="slim-value">{tone.count}</span>}</ToolButton>
   <ToolButton icon="outline" label="윤곽선" pressed={settings.mode==='outline'} onClick={()=>mode('outline')}/>
   <ToolButton icon="grid" label="격자 설정" pressed={settings.grid>0} expanded={popup==='grid'} controls="art-grid-popup" onClick={()=>togglePopup('grid')}>{settings.grid>0&&<span className="slim-value">{settings.grid}</span>}</ToolButton>
   <span className="slim-separator" aria-hidden="true"/>
   <ToolButton icon="settings" label={popup==='advanced'?'상세 접기':'상세 설정'} expanded={popup==='advanced'} controls="art-advanced" onClick={()=>togglePopup('advanced')}/>
   <ToolButton icon="close" label="도구 닫기" onClick={close}/>
  </div>
  <div id="art-tone-popup" className="slim-popup" hidden={popup!=='tone'}>
   <strong>명암 단계</strong><div className="slim-tone-choices">{tones.map(t=><button key={t.id} type="button" aria-label={t.count+'단계 명암'} aria-pressed={settings.mode===t.id} onClick={()=>mode(t.id)}><span className="slim-tone-sample">{Array.from({length:t.count},(_,i)=><i key={i} style={{background:'rgb('+Array(3).fill(Math.round(i*255/(t.count-1))).join(',')+')'}}/>)}</span>{t.count}단계</button>)}</div>
  </div>
  <div id="art-grid-popup" className="slim-popup" hidden={popup!=='grid'}>
   <strong>격자선</strong><label className="slim-grid-label">격자<select aria-label="격자선" value={settings.grid} onChange={e=>{set({grid:Number(e.target.value)});closePopup()}}>{[0,3,4,6,8].map(n=><option key={n} value={n}>{n?n+' × '+n:'없음'}</option>)}</select></label>
  </div>
  <div id="art-advanced" className="slim-popup" hidden={popup!=='advanced'}>
   <strong>미술 도구 설정</strong>
   <div className="slim-choice"><button aria-pressed={settings.flipX} onClick={()=>set({flipX:!settings.flipX})}>좌우 반전</button><button aria-pressed={settings.flipY} onClick={()=>set({flipY:!settings.flipY})}>상하 반전</button><button aria-pressed={settings.compare} onClick={()=>set({compare:!settings.compare})}>원본 비교</button></div>
   {([{key:'brightness',label:'밝기',min:50,max:150},{key:'contrast',label:'대비',min:50,max:200},{key:'saturation',label:'채도',min:0,max:200}] as const).map(p=><label className="slim-range" key={p.key}><span>{p.label}</span><input aria-label={p.label} type="range" min={p.min} max={p.max} step={5} value={settings[p.key]} onChange={e=>set({[p.key]:Number(e.target.value)})}/><output>{settings[p.key]}%</output></label>)}
   <small>확대 · 드래그하여 이동</small><div className="slim-choice">{[1,1.5,2,3].map(z=><button key={z} aria-pressed={settings.zoom===z} onClick={()=>set({zoom:z})}>{z===1?'맞춤':z+'배'}</button>)}</div>
   <button onClick={()=>{change(defaultArt());closePopup()}}>전체 초기화</button>
   <small>원본 사진은 변경되지 않습니다.</small>
  </div>
 </section>
}
