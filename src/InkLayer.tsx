import {useEffect,useRef,useState} from 'react'
import type {PointerEvent as ReactPointerEvent} from 'react'
import {MAX_ACTIONS,MAX_POINTS,normalizePoint,renderInk,paintStroke} from './ink'
import type {InkAction,InkSettings,Stroke} from './ink'
export default function InkLayer({width,height,flipX,flipY,settings,actions,commit,undo,redo}:{width:number;height:number;flipX:boolean;flipY:boolean;settings:InkSettings;actions:InkAction[];commit:(action:InkAction)=>void;undo:()=>void;redo:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null)
 const draft=useRef<{pointer:number;stroke:Stroke}|null>(null)
 const touches=useRef(new Map<number,{x:number;y:number}>())
 const tap=useRef({start:0,peak:0,invalid:false,released:false})
 const [drawing,setDrawing]=useState(false)
 const frame=useRef<number|null>(null)
 const scale=Math.min(1,1600/Math.max(1,width,height))
 const w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale))
 function redraw(){const ctx=canvas.current?.getContext('2d');if(!ctx)return;renderInk(ctx,actions,w,h);if(draft.current)paintStroke(ctx,draft.current.stroke,w,h)}
 function schedule(){if(frame.current!==null)return;frame.current=requestAnimationFrame(()=>{frame.current=null;redraw()})}
 useEffect(()=>{redraw()},[actions,w,h])
 useEffect(()=>()=>{if(frame.current!==null)cancelAnimationFrame(frame.current)},[])
 useEffect(()=>{if(settings.tool==='move'||!settings.visible){draft.current=null;touches.current.clear();tap.current.invalid=true;setDrawing(false);redraw()}},[settings.tool,settings.visible])
 function point(e:PointerEvent,el:HTMLCanvasElement){return normalizePoint(e.clientX,e.clientY,el.getBoundingClientRect(),flipX,flipY,e.pressure,e.pointerType==='pen')}
 function cancelDraft(){draft.current=null;setDrawing(false);redraw()}
 function down(e:ReactPointerEvent<HTMLCanvasElement>){
  if(settings.tool==='move'||!settings.visible)return
  if(e.pointerType==='touch'){
   e.stopPropagation();e.preventDefault()
   const t=touches.current,g=tap.current
   if(!t.size){g.start=performance.now();g.peak=0;g.invalid=!!draft.current&&draft.current.stroke.pointerType!=='touch';g.released=false}
   if(g.released||performance.now()-g.start>350)g.invalid=true
   t.set(e.pointerId,{x:e.clientX,y:e.clientY});g.peak=Math.max(g.peak,t.size)
   try{e.currentTarget.setPointerCapture(e.pointerId)}catch{/* synthetic events */}
   if(g.peak>1){if(draft.current?.stroke.pointerType==='touch')cancelDraft();return}
   if(g.invalid||settings.penOnly)return
  }else if(touches.current.size){tap.current.invalid=true;if(draft.current?.stroke.pointerType==='touch')cancelDraft()}
  if(settings.tool==='move'||!settings.visible||draft.current||actions.length>=MAX_ACTIONS||e.button!==0||!e.isPrimary||(settings.penOnly&&e.pointerType!=='pen'))return
  e.stopPropagation();e.preventDefault()
  try{e.currentTarget.setPointerCapture(e.pointerId)}catch{/* synthetic events and older browsers */}
  draft.current={pointer:e.pointerId,stroke:{kind:'stroke',tool:settings.tool,color:settings.color,width:settings.width,opacity:settings.opacity,pointerType:e.pointerType,pressureEnabled:settings.pressureEnabled,points:[point(e.nativeEvent,e.currentTarget)]}}
  setDrawing(true);redraw()
 }
 function move(e:ReactPointerEvent<HTMLCanvasElement>){
  if(e.pointerType==='touch'){
   const start=touches.current.get(e.pointerId)
   if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>18)tap.current.invalid=true
   if(tap.current.peak>1){e.stopPropagation();e.preventDefault();return}
  }
  const d=draft.current;if(!d||d.pointer!==e.pointerId)return
  e.stopPropagation();e.preventDefault()
  const native=e.nativeEvent;let events:PointerEvent[]=[];try{events=native.getCoalescedEvents?.()??[]}catch{/* browser fallback */}
  for(const p of events.length?events:[native]){
   if(d.stroke.points.length>=MAX_POINTS)break
   const next=point(p,e.currentTarget),last=d.stroke.points.at(-1)!
   if(Math.hypot(next.x-last.x,next.y-last.y)>.001||Math.abs(next.pressure-last.pressure)>.015)d.stroke.points.push(next)
  }
  schedule()
 }
 function finish(e:ReactPointerEvent<HTMLCanvasElement>,save:boolean){
  if(e.pointerType==='touch'&&touches.current.has(e.pointerId)){
   const t=touches.current,g=tap.current,start=t.get(e.pointerId)!
   if(!save||Math.hypot(e.clientX-start.x,e.clientY-start.y)>18)g.invalid=true
   t.delete(e.pointerId);g.released=true
   if(g.peak>1){
    e.stopPropagation();e.preventDefault()
    if(!t.size&&save&&!g.invalid&&!draft.current&&performance.now()-g.start<=350){
     if(g.peak===2)undo()
     else if(g.peak===3)redo()
    }
    return
   }
  }
  const d=draft.current;if(!d||d.pointer!==e.pointerId)return
  e.stopPropagation();e.preventDefault();if(frame.current!==null){cancelAnimationFrame(frame.current);frame.current=null}draft.current=null;setDrawing(false)
  if(save)commit(d.stroke);else redraw()
 }
 return <canvas ref={canvas} width={w} height={h} data-testid="ink-layer" data-drawing={drawing} aria-label="사진 위 드로잉 영역" className={'ink-layer'+(settings.tool!=='move'&&settings.visible?' ink-active':'')} style={{visibility:settings.visible?'visible':'hidden'}} onPointerDown={down} onPointerMove={move} onPointerUp={e=>finish(e,true)} onPointerCancel={e=>finish(e,false)} onLostPointerCapture={e=>finish(e,false)}/>
}
