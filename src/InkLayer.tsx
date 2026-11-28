import {useEffect,useRef,useState} from 'react'
import type {PointerEvent as ReactPointerEvent} from 'react'
import {MAX_ACTIONS,MAX_POINTS,normalizePoint,renderInk,paintStroke} from './ink'
import type {InkAction,InkSettings,Stroke} from './ink'
export default function InkLayer({width,height,flipX,flipY,settings,actions,commit}:{width:number;height:number;flipX:boolean;flipY:boolean;settings:InkSettings;actions:InkAction[];commit:(action:InkAction)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null)
 const draft=useRef<{pointer:number;stroke:Stroke}|null>(null)
 const [drawing,setDrawing]=useState(false)
 const scale=Math.min(1,1600/Math.max(1,width,height))
 const w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale))
 function redraw(){const ctx=canvas.current?.getContext('2d');if(!ctx)return;renderInk(ctx,actions,w,h);if(draft.current)paintStroke(ctx,draft.current.stroke,w,h)}
 useEffect(()=>{redraw()},[actions,w,h])
 useEffect(()=>{if(settings.tool==='move'||!settings.visible){draft.current=null;setDrawing(false);redraw()}},[settings.tool,settings.visible])
 function point(e:PointerEvent,el:HTMLCanvasElement){return normalizePoint(e.clientX,e.clientY,el.getBoundingClientRect(),flipX,flipY,e.pressure,e.pointerType==='pen')}
 function down(e:ReactPointerEvent<HTMLCanvasElement>){
  if(settings.tool==='move'||!settings.visible||draft.current||actions.length>=MAX_ACTIONS||e.button!==0||!e.isPrimary||(settings.penOnly&&e.pointerType!=='pen'))return
  e.stopPropagation();e.preventDefault()
  try{e.currentTarget.setPointerCapture(e.pointerId)}catch{/* synthetic events and older browsers */}
  draft.current={pointer:e.pointerId,stroke:{kind:'stroke',tool:settings.tool,color:settings.color,width:settings.width,opacity:settings.opacity,points:[point(e.nativeEvent,e.currentTarget)]}}
  setDrawing(true);redraw()
 }
 function move(e:ReactPointerEvent<HTMLCanvasElement>){
  const d=draft.current;if(!d||d.pointer!==e.pointerId)return
  e.stopPropagation();e.preventDefault()
  const native=e.nativeEvent;const events=native.getCoalescedEvents?.()??[]
  for(const p of events.length?events:[native]){
   if(d.stroke.points.length>=MAX_POINTS)break
   const next=point(p,e.currentTarget),last=d.stroke.points.at(-1)!
   if(Math.hypot(next.x-last.x,next.y-last.y)>.001)d.stroke.points.push(next)
  }
  redraw()
 }
 function finish(e:ReactPointerEvent<HTMLCanvasElement>,save:boolean){
  const d=draft.current;if(!d||d.pointer!==e.pointerId)return
  e.stopPropagation();e.preventDefault();draft.current=null;setDrawing(false)
  if(save)commit(d.stroke);else redraw()
 }
 return <canvas ref={canvas} width={w} height={h} data-testid="ink-layer" data-drawing={drawing} aria-label="사진 위 드로잉 영역" className={'ink-layer'+(settings.tool!=='move'&&settings.visible?' ink-active':'')} style={{visibility:settings.visible?'visible':'hidden'}} onPointerDown={down} onPointerMove={move} onPointerUp={e=>finish(e,true)} onPointerCancel={e=>finish(e,false)} onLostPointerCapture={e=>finish(e,false)}/>
}
