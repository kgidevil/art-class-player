
import {useEffect,useRef,useState} from 'react'
export function usePwa(){
 const [ready,setReady]=useState(false)
 const [update,setUpdate]=useState(false)
 const [online,setOnline]=useState(navigator.onLine)
 const [error,setError]=useState('')
 const reg=useRef<ServiceWorkerRegistration|null>(null)
 const applying=useRef(false)
 useEffect(()=>{
  const connectivity=()=>setOnline(navigator.onLine)
  window.addEventListener('online',connectivity);window.addEventListener('offline',connectivity)
  return()=>{window.removeEventListener('online',connectivity);window.removeEventListener('offline',connectivity)}
 },[])
 useEffect(()=>{
  if(!import.meta.env.PROD||!('serviceWorker' in navigator))return
  let alive=true
  const controller=()=>{if(!alive)return;setReady(!!navigator.serviceWorker.controller);if(applying.current)location.reload()}
  navigator.serviceWorker.addEventListener('controllerchange',controller)
  void navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js',{scope:import.meta.env.BASE_URL}).then(r=>{
   if(!alive)return
   reg.current=r
   const check=()=>{if(alive)setUpdate(!!r.waiting&&!!navigator.serviceWorker.controller)}
   check();setReady(!!navigator.serviceWorker.controller)
   r.addEventListener('updatefound',()=>{r.installing?.addEventListener('statechange',check)})
   void navigator.serviceWorker.ready.then(()=>{if(alive)setReady(!!navigator.serviceWorker.controller)})
   void r.update().catch(()=>{})
  }).catch(()=>{if(alive)setError('오프라인 앱 설치 실패. 인터넷 연결 후 다시 열어 주세요.')})
  const visible=()=>{if(!document.hidden&&navigator.onLine)void reg.current?.update().catch(()=>{})}
  document.addEventListener('visibilitychange',visible)
  return()=>{alive=false;document.removeEventListener('visibilitychange',visible);navigator.serviceWorker.removeEventListener('controllerchange',controller)}
 },[])
 return {ready,update,online,error,apply(){if(reg.current?.waiting){applying.current=true;reg.current.waiting.postMessage({type:'ACTIVATE_UPDATE'})}}}
}
export function useScreenWake(active:boolean){
 const [status,setStatus]=useState('대기')
 useEffect(()=>{
  if(!active){setStatus('대기');return}
  if(!('wakeLock' in navigator)){setStatus('미지원 · 기기 설정 확인');return}
  let disposed=false;let lock:WakeLockSentinel|null=null;let pending=false
  async function acquire(){
   if(disposed||document.hidden||pending||(lock&&!lock.released))return
   pending=true
   try{
    const acquired=await navigator.wakeLock.request('screen')
    if(disposed||document.hidden){await acquired.release();return}
    lock=acquired;setStatus('화면 켜짐 유지 중')
    acquired.addEventListener('release',()=>{if(!disposed)setStatus('해제됨 · 기기 설정 확인')})
   }catch{if(!disposed)setStatus('사용 불가 · 기기 설정 확인')}finally{pending=false}
  }
  const change=()=>{if(!document.hidden)void acquire()}
  void acquire();document.addEventListener('visibilitychange',change)
  return()=>{disposed=true;document.removeEventListener('visibilitychange',change);if(lock&&!lock.released)void lock.release().catch(()=>{})}
 },[active])
 return status
}
