export type Step={kind:'image'|'break';seconds:number;count:number}
export type LessonPreset={id:string;name:string;steps:Step[]}
export type Candidate={id:number;name:string;key:string}
export type Entry={id:number;name:string;key:string;duration:number}
export type SessionMeta={id:string;group:string;title:string;started:number;viewed:Entry[]}
export type History=SessionMeta&{ended:number;status:'complete'|'ended';note:string;total:number}
export type Lessons={groups:string[];group:string;presets:LessonPreset[];history:History[];preferUnused:boolean}
const KEY='sai.lessons.v1'
export const defaults=():Lessons=>({groups:['청운면 미술반','단월면 미술반'],group:'청운면 미술반',presets:[],history:[],preferUnused:true})
export const uid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)
export function validSteps(s:Step[]){
 return Array.isArray(s)&&s.length>0&&s.length<=30&&s.every(x=>x&&['image','break'].includes(x.kind)&&Number.isInteger(x.seconds)&&x.seconds>=5&&x.seconds<=7200&&Number.isInteger(x.count)&&x.count>=1&&x.count<=200&&(x.kind==='image'||x.count===1))&&s.some(x=>x.kind==='image')&&s.reduce((n,x)=>n+x.count,0)<=300
}
export function prioritize<T extends Candidate>(pool:T[],history:History[],group:string,prefer:boolean):T[]{
 if(!prefer)return [...pool]
 const used=new Map<string,number>()
 for(const h of history)if(h.group===group)for(const v of h.viewed)used.set(v.key,Math.max(used.get(v.key)??0,h.ended))
 return [...pool].sort((a,b)=>(used.get(a.key)??0)-(used.get(b.key)??0))
}
export function buildPlan(steps:Step[],pool:Candidate[]):Entry[]{
 if(!validSteps(steps))throw Error('시간은 5초~120분, 사진은 단계당 1~200장, 전체 300단계 이내로 설정해 주세요.')
 const count=steps.reduce((n,s)=>n+(s.kind==='image'?s.count:0),0)
 const unique=[...new Map(pool.map(p=>[p.key,p])).values()]
 if(count>unique.length)throw Error('사진이 부족합니다. 필요 '+count+'장 / 사용 가능 '+unique.length+'장. 사진을 더 저장하거나 장수를 줄여 주세요.')
 let cursor=0,breakId=-1
 return steps.flatMap(s=>s.kind==='break'?[{id:breakId--,name:'휴식 시간',key:'',duration:s.seconds*1000}]:unique.slice(cursor,cursor+=s.count).map(p=>({...p,duration:s.seconds*1000})))
}
export function readLessons():Lessons{
 try{const x=JSON.parse(localStorage.getItem(KEY)??'null') as Lessons
 if(!x||!Array.isArray(x.groups)||!x.groups.length||!x.groups.every(g=>typeof g==='string')||!x.groups.includes(x.group)||!Array.isArray(x.presets)||!Array.isArray(x.history))return defaults()
 return {...x,preferUnused:x.preferUnused!==false}
 }catch{return defaults()}
}
export function writeLessons(x:Lessons){localStorage.setItem(KEY,JSON.stringify(x))}
export function upsertHistory(data:Lessons,record:History):Lessons{
 return {...data,history:[record,...data.history.filter(h=>h.id!==record.id)].slice(0,500)}
}
