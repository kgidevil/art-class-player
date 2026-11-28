import {useEffect,useRef,useState} from 'react'
import type {ReactNode} from 'react'
const paths={
 move:'M8 13V6a2 2 0 0 1 4 0v5 V4a2 2 0 0 1 4 0v7 V7a2 2 0 0 1 4 0v8c0 4-3 7-7 7h-1c-3 0-5-2-7-5l-2-3a2 2 0 0 1 3-2l2 2',
 pen:'M12 19 4 21l2-8L17 2l5 5L12 19z M14 5l5 5 M6 13l6 6',
 eraser:'M5 15 15 4a2 2 0 0 1 3 0l4 4a2 2 0 0 1 0 3L12 21H9l-4-4a2 2 0 0 1 0-2z M9 11l8 8 M12 21h10',
 undo:'M9 5 L3 11l6 6 M3 11h11a6 6 0 0 1 6 6v2',
 redo:'M15 5 l6 6-6 6 M21 11H10a6 6 0 0 0-6 6v2',
 settings:'M4 7h16 M4 17h16 M8 4v6 M16 14v6',
 demo:'M3 3h18v14H3z M8 22l4-5 4 5 M8 13l7-7 M13 6l2 2',
 close:'M6 6l12 12M18 6 6 18',
 image:'M3 4h18v16H3z M3 17l6-6 4 4 3-3 5 5 M16 8h.01',
 contrast:'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18 M12 3v18',
 tone:'M3 5h18v14H3z M9 5v14 M15 5v14',
 outline:'M3 20c4-2 5-8 9-9s5-5 9-7 M3 4h3 M18 20h3',
 grid:'M3 3h18v18H3z M9 3v18 M15 3v18 M3 9h18 M3 15h18',
 paper:'M3 4h18v16H3z M4 19 20 5 M4 13l8-8 M12 19l8-8'
} as const
export type ToolIconName=keyof typeof paths
export function ToolIcon({name}:{name:ToolIconName}){return <svg viewBox="0 0 24 24" className="slim-icon" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>}
export function ToolButton({icon,label,children,pressed,expanded,controls,disabled,onClick}:{icon?:ToolIconName;label:string;children?:ReactNode;pressed?:boolean;expanded?:boolean;controls?:string;disabled?:boolean;onClick:()=>void}){
 return <button type="button" className="slim-button" aria-label={label} title={label} aria-pressed={pressed} aria-expanded={expanded} aria-controls={controls} disabled={disabled} onClick={onClick}>{icon&&<ToolIcon name={icon}/>} {children}</button>
}
export function useToolPopup<T extends string>(){
 const [popup,setPopup]=useState<T|null>(null)
 const root=useRef<HTMLElement>(null)
 // Pointer down on the stage dismisses a popover without consuming the drawing event.
 useEffect(()=>{if(!popup)return
  const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!root.current?.contains(event.target))setPopup(null)}
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setPopup(null)}}
  document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',escape,true)
  return()=>{document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',escape,true)}
 },[popup])
 return {popup,root,closePopup:()=>setPopup(null),togglePopup:(next:T)=>setPopup(p=>p===next?null:next)}
}
