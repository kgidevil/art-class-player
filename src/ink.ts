export type InkPoint={x:number;y:number;pressure:number}
export type InkTool='move'|'pen'|'eraser'
export type InkSettings={tool:InkTool;color:string;width:number;opacity:number;penOnly:boolean;visible:boolean;pressureEnabled:boolean}
export type Stroke={kind:'stroke';tool:'pen'|'eraser';color:string;width:number;opacity:number;points:InkPoint[];pointerType?:string;pressureEnabled?:boolean}
export type InkAction=Stroke|{kind:'clear'}
export const defaultInk=():InkSettings=>({tool:'move',color:'#ff793c',width:5,opacity:100,penOnly:false,visible:true,pressureEnabled:true})
export const MAX_ACTIONS=250, MAX_POINTS=2000
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v))
export function normalizePoint(x:number,y:number,rect:{left:number;top:number;width:number;height:number},flipX:boolean,flipY:boolean,pressure:number,pen:boolean):InkPoint{
 const u=clamp((x-rect.left)/Math.max(1,rect.width),0,1),v=clamp((y-rect.top)/Math.max(1,rect.height),0,1)
 return {x:flipX?1-u:u,y:flipY?1-v:v,pressure:pen&&Number.isFinite(pressure)?clamp(pressure,0,1):.5}
}
export function appendInk(actions:InkAction[],action:InkAction):InkAction[]{
 if(actions.length>=MAX_ACTIONS)return actions
 return [...actions,action]
}
export function undoInk(actions:InkAction[]){return actions.slice(0,-1)}
export type InkHistory={past:InkAction[];future:InkAction[]}
export const emptyInkHistory=():InkHistory=>({past:[],future:[]})
export function commitInkHistory(h:InkHistory,action:InkAction):InkHistory{
 const past=action.kind==='clear'?[...h.past.slice(-(MAX_ACTIONS-1)),action]:appendInk(h.past,action)
 return past===h.past?h:{past,future:[]}
}
export function undoInkHistory(h:InkHistory):InkHistory{
 if(!h.past.length)return h
 return {past:h.past.slice(0,-1),future:[...h.future,h.past.at(-1)!]}
}
export function redoInkHistory(h:InkHistory):InkHistory{
 if(!h.future.length||h.past.length>=MAX_ACTIONS)return h
 return {past:[...h.past,h.future.at(-1)!],future:h.future.slice(0,-1)}
}

export function renderInk(ctx:CanvasRenderingContext2D,actions:InkAction[],w:number,h:number){
 ctx.clearRect(0,0,w,h)
 for(const action of actions){
  if(action.kind==='clear'){ctx.clearRect(0,0,w,h);continue}
  paintStroke(ctx,action,w,h)
 }
}
export function pressureWidth(base:number,pressure:number,enabled:boolean){return Math.max(.35,base*(enabled?.15+1.7*clamp(Number.isFinite(pressure)?pressure:.5,0,1):1))}
export function paintStroke(ctx:CanvasRenderingContext2D,s:Stroke,w:number,h:number){
 if(!s.points.length)return
 ctx.save()
 ctx.globalCompositeOperation=s.tool==='eraser'?'destination-out':'source-over'
 ctx.globalAlpha=s.tool==='eraser'?1:s.opacity/100
 ctx.strokeStyle=ctx.fillStyle=s.color
 ctx.lineCap='round';ctx.lineJoin='round'
 const base=s.width*Math.min(w,h)/600*(s.tool==='eraser'?2:1)
 const width=(p:InkPoint)=>pressureWidth(base,p.pressure,s.tool==='pen'&&s.pointerType==='pen'&&s.pressureEnabled!==false)
 const a=s.points[0]
 ctx.beginPath();ctx.arc(a.x*w,a.y*h,width(a)/2,0,Math.PI*2);ctx.fill()
 for(let i=1;i<s.points.length;i++){
  const p=s.points[i-1],q=s.points[i]
  ctx.lineWidth=(width(p)+width(q))/2;ctx.beginPath();ctx.moveTo(p.x*w,p.y*h);ctx.lineTo(q.x*w,q.y*h);ctx.stroke()
 }
 ctx.restore()
}
export function lessonProgress(index:number,count:number,duration:number,remaining:number,finished:boolean){
 if(count<=0)return 0
 if(finished)return 100
 return clamp((index+clamp(1-remaining/Math.max(1,duration),0,1))/count*100,0,100)
}
