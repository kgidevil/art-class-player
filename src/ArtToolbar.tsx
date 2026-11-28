import {defaultArt} from './art-tools'
import type {ArtSettings,Mode} from './art-tools'
const modes:{id:Mode;name:string}[]=[{id:'original',name:'원본'},{id:'gray',name:'흑백'},{id:'tone2',name:'2단계 명암'},{id:'tone3',name:'3단계 명암'},{id:'tone5',name:'5단계 명암'},{id:'outline',name:'윤곽선'}]
export default function ArtToolbar({settings,change,close}:{settings:ArtSettings;change:(value:ArtSettings)=>void;close:()=>void}){
 const set=(patch:Partial<ArtSettings>)=>change({...settings,...patch})
 return <section className="art-toolbar" aria-label="미술 보조 도구">
  <div className="art-toolbar-head"><strong>미술 보조 도구</strong><span>원본은 변경되지 않습니다.</span><button onClick={()=>change(defaultArt())}>전체 초기화</button><button onClick={close}>도구 닫기</button></div>
  <div className="art-toolbar-groups">
   <div className="art-tool-group"><span>이미지 분석</span><div className="art-tool-buttons">{modes.map(m=><button key={m.id} aria-pressed={settings.mode===m.id} onClick={()=>set({mode:m.id})}>{m.name}</button>)}</div></div>
   <div className="art-tool-group"><span>구도 및 비례</span><div className="art-tool-buttons"><label>격자<select aria-label="격자선" value={settings.grid} onChange={e=>set({grid:Number(e.target.value)})}>{[0,3,4,6,8].map(n=><option key={n} value={n}>{n?n+' × '+n:'없음'}</option>)}</select></label><button aria-pressed={settings.flipX} onClick={()=>set({flipX:!settings.flipX})}>좌우 반전</button><button aria-pressed={settings.flipY} onClick={()=>set({flipY:!settings.flipY})}>상하 반전</button><button aria-pressed={settings.compare} onClick={()=>set({compare:!settings.compare})}>원본 비교</button></div></div>
   <div className="art-tool-group art-adjustments"><span>색과 명암</span>{([{key:'brightness',label:'밝기',min:50,max:150},{key:'contrast',label:'대비',min:50,max:200},{key:'saturation',label:'채도',min:0,max:200}] as const).map(p=><label key={p.key}>{p.label}<input aria-label={p.label} type="range" min={p.min} max={p.max} step={5} value={settings[p.key]} onChange={e=>set({[p.key]:Number(e.target.value)})}/><output>{settings[p.key]}%</output></label>)}</div>
   <div className="art-tool-group"><span>확대 · 드래그하여 이동</span><div className="art-tool-buttons">{[1,1.5,2,3].map(z=><button key={z} aria-pressed={settings.zoom===z} onClick={()=>set({zoom:z})}>{z===1?'맞춤':z+'배'}</button>)}</div></div>
  </div>
 </section>
}
