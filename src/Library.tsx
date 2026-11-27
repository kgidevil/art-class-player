import {useEffect,useRef,useState} from 'react'
import {categories,levels,licenses,readCatalog,fetchCatalog} from './catalog'
import type {CatalogItem} from './catalog'
export function Credits({item}:{item:CatalogItem}){
 return <span className="credits"><a href={item.source} target="_blank" rel="noreferrer">{item.author} · 원본 출처</a> · <a href={licenses[item.license]} target="_blank" rel="noreferrer">{item.license}</a> · 원본 파일 그대로</span>
}
const AUTO='sai.catalog.auto.v1',FAV='sai.catalog.favorites.v1'
function getAuto(){try{return localStorage.getItem(AUTO)==='true'}catch{return false}}
function getFavorites():string[]{try{const v=JSON.parse(localStorage.getItem(FAV)??'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string'):[]}catch{return []}}
export default function Library({downloaded,onDownload,busy,disabled,online}:{downloaded:Map<string,string>;onDownload:(items:CatalogItem[])=>Promise<void>;busy:boolean;disabled:boolean;online:boolean}){
 const [catalog,setCatalog]=useState(readCatalog)
 const [expanded,setExpanded]=useState(false)
 const [category,setCategory]=useState('전체')
 const [level,setLevel]=useState('전체')
 const [query,setQuery]=useState('')
 const [checking,setChecking]=useState(false)
 const [message,setMessage]=useState('')
 const [auto,setAuto]=useState(getAuto)
 const [favorites,setFavorites]=useState(getFavorites)
 const [onlyFavorites,setOnlyFavorites]=useState(false)
 const [onlyNew,setOnlyNew]=useState(false)
 const attempts=useRef(new Set<string>())
 const fetching=useRef(false)
 async function refresh(){if(fetching.current)return;fetching.current=true;setChecking(true);try{const c=await fetchCatalog();setCatalog(c);setMessage('자료 목록 확인 완료')}catch{setMessage('목록 연결 실패 · 기존 자료는 유지됩니다.')}finally{fetching.current=false;setChecking(false)}}
 useEffect(()=>{if(!online)return;void refresh();const timer=window.setInterval(()=>{if(!document.hidden)void refresh()},15*60*1000);const visible=()=>{if(!document.hidden)void refresh()};document.addEventListener('visibilitychange',visible);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visible)}},[online])
 useEffect(()=>{
  if(!auto||!online||busy||disabled||checking||!catalog)return
  const pending=catalog.items.filter(i=>!downloaded.has(i.id)&&!attempts.current.has(i.id)).slice(0,20)
  if(!pending.length)return
  pending.forEach(i=>attempts.current.add(i.id));void onDownload(pending)
 },[auto,online,busy,disabled,checking,catalog,downloaded,onDownload])
 function changeAuto(value:boolean){try{localStorage.setItem(AUTO,String(value));setAuto(value);if(value)attempts.current.clear()}catch{setMessage('자동 다운로드 설정을 저장하지 못했습니다.')}}
 function favorite(id:string){const next=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];try{localStorage.setItem(FAV,JSON.stringify(next));setFavorites(next)}catch{setMessage('즐겨찾기를 저장하지 못했습니다.')}}
 const filtered=(catalog?.items??[]).filter(i=>(category==='전체'||i.category===category)&&(level==='전체'||i.level===level)&&(!onlyFavorites||favorites.includes(i.id))&&(!onlyNew||!downloaded.has(i.id))&&[i.title,i.tag,i.author].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
 const pending=filtered.filter(i=>!downloaded.has(i.id))
 const total=catalog?.items.length??0
 const newCount=(catalog?.items??[]).filter(i=>!downloaded.has(i.id)).length
 return <section className="catalog-panel" aria-label="SAI 제공 자료"><div className="catalog-heading"><div><span className="eyebrow">SAI REFERENCE LIBRARY</span><h2>SAI 제공 수업 자료</h2><p>새 자료 목록을 자동으로 확인합니다. 저장된 사진은 오프라인에서도 사용할 수 있습니다.</p></div><div className="catalog-actions"><button onClick={()=>{attempts.current.clear();void refresh()}} disabled={checking||!online||busy}>자료 업데이트 확인</button><button className="primary" onClick={()=>setExpanded(v=>!v)}>{expanded?'자료 접기':'자료 둘러보기'}</button></div></div>
 <div className="catalog-meta"><span>전체 {total}장 · 미저장 {newCount}장</span><span>{catalog?'자료팩 v'+catalog.version+' · '+catalog.updated:'자료 목록 준비 중'}</span><span role="status">{message}</span><label className="auto-option"><input type="checkbox" checked={auto} onChange={e=>changeAuto(e.target.checked)}/> 신규 자료 자동 다운로드</label>{busy&&<span>저장 작업 중…</span>}</div>
 {expanded&&<><div className="catalog-filters"><label>주제<select aria-label="제공 자료 주제" value={category} onChange={e=>setCategory(e.target.value)}>{['전체',...categories].map(c=><option key={c}>{c}</option>)}</select></label><label>난이도<select aria-label="제공 자료 난이도" value={level} onChange={e=>setLevel(e.target.value)}>{['전체',...levels].map(c=><option key={c}>{c}</option>)}</select></label><input aria-label="제공 자료 검색" placeholder="제목, 자세, 작가 검색" value={query} onChange={e=>setQuery(e.target.value)}/><label><input type="checkbox" checked={onlyFavorites} onChange={e=>setOnlyFavorites(e.target.checked)}/> 즐겨찾기만</label><label><input type="checkbox" checked={onlyNew} onChange={e=>setOnlyNew(e.target.checked)}/> 미저장만</label><button disabled={disabled||busy||!online||!pending.length} onClick={()=>void onDownload(pending.slice(0,20))}>선택 주제 미저장 {Math.min(20,pending.length)}장 받기</button></div>
 <div className="catalog-grid">{filtered.map(item=><article className="catalog-card" key={item.id}><img loading="lazy" referrerPolicy="no-referrer" src={downloaded.get(item.id)||item.image} alt={item.title}/><div><strong>{item.title}</strong><small>{item.category} · {item.tag} · {item.level}</small>{!downloaded.has(item.id)&&<small className="new-label">미저장 자료</small>}<Credits item={item}/><button aria-label={item.title+' 즐겨찾기'} aria-pressed={favorites.includes(item.id)} onClick={()=>favorite(item.id)}>{favorites.includes(item.id)?'★ 즐겨찾기':'☆ 즐겨찾기'}</button><button disabled={disabled||busy||!online||downloaded.has(item.id)} onClick={()=>void onDownload([item])}>{downloaded.has(item.id)?'기기 저장 완료':'기기에 저장'}</button></div></article>)}</div>{filtered.length===0&&<p className="muted">해당 조건의 자료가 없습니다.</p>}</>}
 </section>
}
