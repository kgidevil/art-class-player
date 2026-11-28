import {useEffect,useRef,useState} from 'react'
import {inspectBackup,makeBackup} from './backup'
import {replaceFromBackup} from './storage'
export default function BackupPanel({disabled,onLock,onRestore}:{disabled:boolean;onLock:(value:boolean)=>void;onRestore:()=>void}){
 const [open,setOpen]=useState(false)
 const [message,setMessage]=useState('')
 const [working,setWorking]=useState(false)
 const [download,setDownload]=useState<{url:string;name:string}|null>(null)
 const [restore,setRestore]=useState<Awaited<ReturnType<typeof inspectBackup>>|null>(null)
 const dialog=useRef<HTMLDialogElement>(null)
 const urlRef=useRef('')
 useEffect(()=>()=>{if(urlRef.current)URL.revokeObjectURL(urlRef.current)},[])
 function show(){if(disabled)return;onLock(true);setOpen(true)}
 useEffect(()=>{if(open&&!dialog.current?.open)dialog.current?.showModal();else if(!open&&dialog.current?.open)dialog.current.close()},[open])
 function close(){if(working)return;setRestore(null);setOpen(false);onLock(false)}
 async function exportBackup(){
  setWorking(true);setRestore(null);setMessage('백업 준비 중…')
  try{const result=await makeBackup(setMessage);if(urlRef.current)URL.revokeObjectURL(urlRef.current);const url=URL.createObjectURL(result.file);urlRef.current=url;setDownload({url,name:'SAI-art-'+new Date().toISOString().slice(0,10)+'.saibackup'});setMessage('백업 생성 완료 · 사진 '+result.count+'장 · '+(result.file.size/1048576).toFixed(1)+' MiB. 아래 파일 저장을 눌러 주세요.')}
  catch(e){setMessage(e instanceof Error?e.message:'백업 생성 실패')}finally{setWorking(false)}
 }
 async function read(file:File){
  setWorking(true);setRestore(null);setMessage('백업 파일 검사 중…')
  try{const result=await inspectBackup(file,setMessage);setRestore(result);setMessage('검증 완료 · 사진 '+result.photos.length+'장 · '+new Date(result.created).toLocaleString('ko-KR')+'. 아직 기존 데이터는 변경하지 않았습니다.')}
  catch(e){setMessage('복원 검증 실패 · 기존 데이터 유지: '+(e instanceof Error?e.message:String(e)))}finally{setWorking(false)}
 }
 async function apply(){
  if(!restore||working)return
  if(!window.confirm('현재 기기의 모든 사진, 설정, 수업 기록을 이 백업으로 교체할까요? 기존 자료는 먼저 백업해 주세요.'))return
  setWorking(true);setMessage('검증된 자료를 저장하는 중…')
  try{await replaceFromBackup(restore.photos,restore.state);onRestore();setMessage('사진 복원 완료 · 설정 적용을 위해 다시 시작합니다.');location.reload()}
  catch(e){setMessage('복원 저장 실패 · 기존 사진 유지: '+(e instanceof Error?e.message:String(e)));setWorking(false)}
 }
 return <section className="status-strip backup-strip" aria-label="데이터 백업 및 이전"><div><strong>데이터 백업 및 이전</strong><p>사진·강의실·프로그램·기록을 파일 하나로 보관하거나 다른 기기로 옮기세요.</p></div><button onClick={show} disabled={disabled}>백업 및 복원 열기</button>
 <dialog ref={dialog} className="backup-dialog" onCancel={e=>{e.preventDefault();close()}} aria-label="백업 및 복원">
  <div className="catalog-heading"><h2>백업 및 복원</h2><button disabled={working} onClick={close}>닫기</button></div>
  <p>백업은 원본 사진, 환경설정, 즐겨찾기, 강의실, 수업 프로그램·기록, 이전 수업 상태를 포함합니다. 설명선은 포함하지 않습니다. 개인 정보가 있는 백업 파일은 안전하게 보관하세요.</p>
  <div className="backup-actions"><button className="primary" disabled={working} onClick={()=>void exportBackup()}>백업 파일 만들기</button>{download&&<a className="backup-download" href={download.url} download={download.name}>백업 파일 저장</a>}</div>
  <hr/><h3>다른 기기에서 가져오기</h3><p>복원은 합치기가 아니라 전체 교체입니다. 먼저 현재 기기의 백업을 저장하세요. 파일을 검사한 후 별도로 복원 여부를 선택합니다.</p>
  <label className="backup-file">백업 파일 선택<input aria-label="백업 파일 선택" type="file" accept=".saibackup,application/octet-stream" disabled={working} onChange={e=>{const file=e.target.files?.[0];if(file)void read(file);e.target.value=''}}/></label>
  {message&&<p role="status" className="backup-message">{message}</p>}
  {restore&&<button className="primary" disabled={working} onClick={()=>void apply()}>검증한 백업으로 교체</button>}
  <small>최대 512MiB / 사진당 50MiB / 5,000장 · HTTPS 또는 localhost · 기기 저장 공간 필요</small>
 </dialog></section>
}
