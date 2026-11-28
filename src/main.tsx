import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import {finishPendingRestore} from './storage'
import './style.css'
const root=ReactDOM.createRoot(document.getElementById('root')!)
async function boot(){
 try{await finishPendingRestore();root.render(<React.StrictMode><App/></React.StrictMode>)}
 catch{root.render(<main className="shell"><h1>기기 저장소를 확인해 주세요.</h1><p>저장소 접근 또는 이전 백업의 설정 적용이 완료되지 않았습니다. 사진을 삭제하지 말고 브라우저 저장 권한 및 여유 공간을 확인한 다음 다시 시도해 주세요.</p><button className="primary" onClick={()=>location.reload()}>다시 시도</button></main>)}
}
void boot()
