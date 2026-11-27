import {useEffect,useState} from 'react'
import {categories,levels,licenses,readCatalog,fetchCatalog} from './catalog'
import type {CatalogItem} from './catalog'
export function Credits({item}:{item:CatalogItem}){
 return <span className="credits"><a href={item.source} target="_blank" rel="noreferrer">{item.author} · 원본 출처</a> · <a href={licenses[item.license]} target="_blank" rel="noreferrer">{item.license}</a> · 원본 파일 그대로</span>
}
export default function Library({downloaded,onDownload,busy,disabled,online}:{downloaded:Map<string,string>;onDownload:(items:CatalogItem[])=>Promise<void>;busy:boolean;disabled:boolean;online:boolean}){
 const [catalog,setCatalog]=useState(readCatalog)
 const [expanded,setExpanded]=useState(false)
 const [category,setCategory]=useState('전체')
 const [level,setLevel]=useState('전체')
 const [query,setQuery]=useState('')
 const [checking,setChecking]=useState(false)
 const [message,setMessage]=useState('')
 async function refresh(){setChecking(true);try{const c=await fetchCatalog();setCatalog(c);setMessage('자료 목록 확인 완료')}catch{setMessage('목록 연결 실패 · 기존 자료는 유지됩니다.')}finally{setChecking(false)}}
 useEffect(()=>{if(online)void refresh()},[online])
 const filtered=(catalog?.items??[]).filter(i=>(category==='전체'||i.category===category)&&(level==='전체'||i.level===level)&&[i.title,i.tag,i.author].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
 const pending=filtered.filter(i=>!downloaded.has(i.id))
 const total=catalog?.items.length??0
 const newCount=(catalog?.items??[]).filter(i=>!downloaded.has(i.id)).length
 return <section className="catalog-panel" aria-label="SAI 제공 자료"><div className="catalog-heading"><div><span className="eyebrow">SAI REFERENCE LIBRARY</span><h2>SAI 제공 수업 자료</h2><p>직접 사진을 찾지 않아도 새 자료를 확인하고 기기에 저장할 수 있습니다.</p></div><div className="catalog-actions"><button onClick={()=>void refresh()} disabled={checking||!online||busy}>자료 업데이트 확인</button><button className="primary" onClick={()=>setExpanded(v=>!v)}>{expanded?'자료 접기':'자료 둘러보기'}</button></div></div>
 <div className="catalog-meta"><span>전체 {total}장 · 미저장 {newCount}장</span><span>{catalog?'자료팩 v'+catalog.version+' · '+catalog.updated:'자료 목록 준비 중'}</span><span role="status">{message}</span></div>
 {expanded&&<><div className="catalog-filters"><label>주제<select aria-label="제공 자료 주제" value={category} onChange={e=>setCategory(e.target.value)}>{['전체',...categories].map(c=><option key={c}>{c}</option>)}</select></label><label>난이도<select aria-label="제공 자료 난이도" value={level} onChange={e=>setLevel(e.target.value)}>{['전체',...levels].map(c=><option key={c}>{c}</option>)}</select></label><input aria-label="제공 자료 검색" placeholder="제목, 자세, 작가 검색" value={query} onChange={e=>setQuery(e.target.value)}/><button disabled={disabled||busy||!online||!pending.length} onClick={()=>void onDownload(pending)}>선택 주제 미저장 {pending.length}장 받기</button></div>
 <div className="catalog-grid">{filtered.map(item=><article className="catalog-card" key={item.id}><img loading="lazy" referrerPolicy="no-referrer" src={downloaded.get(item.id)||item.image} alt={item.title}/><div><strong>{item.title}</strong><small>{item.category} · {item.tag} · {item.level}</small><Credits item={item}/><button disabled={disabled||busy||!online||downloaded.has(item.id)} onClick={()=>void onDownload([item])}>{downloaded.has(item.id)?'기기 저장 완료':'기기에 저장'}</button></div></article>)}</div>{filtered.length===0&&<p className="muted">해당 조건의 자료가 없습니다.</p>}</>}
 </section>
}
