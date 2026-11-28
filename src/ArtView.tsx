import {memo,useEffect,useLayoutEffect,useRef,useState} from 'react'
import type {PointerEvent as ReactPointerEvent} from 'react'
import {clamp,fitRect,needsCanvas,panLimit,processPixels} from './art-tools'
import type {ArtSettings} from './art-tools'
import InkLayer from './InkLayer'
import type {InkAction,InkSettings} from './ink'
type InkProps={ink:InkSettings;actions:InkAction[];commit:(action:InkAction)=>void;undo:()=>void;redo:()=>void}
type Point={x:number;y:number}
const zero={x:0,y:0}
function ArtView({src,name,settings,onError,ink,actions,commit,undo,redo}:{src:string;name:string;settings:ArtSettings;onError:()=>void}&InkProps){
 return <div className={'art-view'+(settings.compare?' art-compare':'')}>
   {settings.compare&&<div className="art-pane art-original-pane"><span className="art-pane-label">원본</span><img src={src} alt={name+' 원본 비교'} draggable={false}/></div>}
   <div className="art-pane art-work-pane">{settings.compare&&<span className="art-pane-label">분석 이미지</span>}<WorkImage key={src} src={src} name={name} settings={settings} onError={onError} ink={ink} actions={actions} commit={commit} undo={undo} redo={redo}/></div>
 </div>
}
function WorkImage({src,name,settings,onError,ink,actions,commit,undo,redo}:{src:string;name:string;settings:ArtSettings;onError:()=>void}&InkProps){
 const view=useRef<HTMLDivElement>(null),img=useRef<HTMLImageElement>(null),canvas=useRef<HTMLCanvasElement>(null)
 const [size,setSize]=useState({width:0,height:0})
 const [natural,setNatural]=useState({width:0,height:0})
 const [pan,setPan]=useState<Point>(zero)
 const [processed,setProcessed]=useState('')
 const [failure,setFailure]=useState(false)
 const drag=useRef<{pointer:number;x:number;y:number;start:Point}|null>(null)
 const {mode,brightness,contrast,saturation,grid,flipX,flipY,zoom}=settings
 const canvasMode=needsCanvas(mode)
 const key=[mode,brightness,contrast,natural.width,natural.height].join(':')
 const ready=canvasMode&&processed===key&&!failure
 const fit=fitRect(size.width,size.height,natural.width,natural.height)
 const maxX=panLimit(size.width,fit.width,zoom),maxY=panLimit(size.height,fit.height,zoom)
 const safePan={x:clamp(pan.x,-maxX,maxX),y:clamp(pan.y,-maxY,maxY)}
 useLayoutEffect(()=>{
  const el=view.current;if(!el)return
  const measure=()=>{const r=el.getBoundingClientRect();setSize({width:r.width,height:r.height})}
  measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect()
 },[])
 useEffect(()=>{if(zoom===1)setPan(zero);else setPan(p=>({x:clamp(p.x,-maxX,maxX),y:clamp(p.y,-maxY,maxY)}))},[zoom,maxX,maxY])
 useEffect(()=>{
  if(!canvasMode||!natural.width||!natural.height)return
  const source=img.current,target=canvas.current;if(!source||!target)return
  let cancelled=false
  const frame=requestAnimationFrame(()=>{
   if(cancelled)return
   try{
    const scale=Math.min(1,1600/Math.max(natural.width,natural.height))
    const w=Math.max(1,Math.round(natural.width*scale)),h=Math.max(1,Math.round(natural.height*scale))
    target.width=w;target.height=h
    const ctx=target.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Canvas unavailable')
    ctx.drawImage(source,0,0,w,h)
    const data=ctx.getImageData(0,0,w,h);data.data.set(processPixels(data.data,w,h,{...settings,mode,brightness,contrast}));ctx.putImageData(data,0,0)
    setFailure(false);setProcessed(key)
   }catch{setFailure(true);setProcessed('')}
  })
  return()=>{cancelled=true;cancelAnimationFrame(frame)}
 },[key,canvasMode])
 function down(e:ReactPointerEvent<HTMLDivElement>){
  if(zoom<=1||e.button!==0||(ink.visible&&ink.tool!=='move'))return
  e.currentTarget.setPointerCapture(e.pointerId);drag.current={pointer:e.pointerId,x:e.clientX,y:e.clientY,start:safePan}
 }
 function move(e:ReactPointerEvent<HTMLDivElement>){const d=drag.current;if(d?.pointer!==e.pointerId)return;setPan({x:clamp(d.start.x+e.clientX-d.x,-maxX,maxX),y:clamp(d.start.y+e.clientY-d.y,-maxY,maxY)})}
 function stop(e:ReactPointerEvent<HTMLDivElement>){if(drag.current?.pointer===e.pointerId)drag.current=null}
 const filter='brightness('+brightness+'%) contrast('+contrast+'%) saturate('+saturation+'%)'+(mode==='gray'?' grayscale(100%)':'')
 return <div ref={view} className={'art-work-viewport'+(zoom>1?' art-zoomed':'')} data-testid="art-viewport" onPointerDown={down} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}>
  <div className="art-image-frame" data-testid="art-frame" style={{width:fit.width||'100%',height:fit.height||'100%',transform:'translate('+safePan.x+'px,'+safePan.y+'px) scale('+zoom+')'}}>
   <div className="art-image-layer" style={{transform:'scale('+ (flipX?-1:1)+','+(flipY?-1:1)+')'}}>
    <img ref={img} className="reference" src={src} alt={name} draggable={false} onLoad={e=>{const el=e.currentTarget;setNatural({width:el.naturalWidth,height:el.naturalHeight})}} onError={onError} style={{filter,visibility:ready?'hidden':'visible'}}/>
    {canvasMode&&<canvas ref={canvas} className="art-canvas" role="img" aria-label={name+' 분석 이미지'} data-testid="art-canvas" style={{visibility:ready?'visible':'hidden'}}/>}
    {natural.width>0&&<InkLayer width={natural.width} height={natural.height} flipX={flipX} flipY={flipY} settings={ink} actions={actions} commit={commit} undo={undo} redo={redo}/>}
   </div>
   {grid>0&&<div className="art-grid" data-testid="art-grid" aria-hidden="true">{Array.from({length:grid-1},(_,i)=><i key={'v'+i} className="art-grid-v" style={{left:((i+1)*100/grid)+'%'}}/>)}{Array.from({length:grid-1},(_,i)=><i key={'h'+i} className="art-grid-h" style={{top:((i+1)*100/grid)+'%'}}/>)}</div>}
  </div>
  {canvasMode&&failure&&<span className="art-view-warning" role="status">분석 이미지 처리 실패 · 원본 표시</span>}
 </div>
}

export default memo(ArtView)
