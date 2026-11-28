import test from 'node:test'
import assert from 'node:assert/strict'
import {normalizePoint,appendInk,undoInk,lessonProgress,MAX_ACTIONS,pressureWidth,defaultInk,emptyInkHistory,commitInkHistory,undoInkHistory,redoInkHistory} from '../src/ink.ts'
test('normalized drawing positions remain anchored through flipped scaled photo',()=>{const rect={left:100,top:50,width:200,height:400};assert.deepEqual(normalizePoint(150,150,rect,false,false,.8,true),{x:.25,y:.25,pressure:.8});assert.deepEqual(normalizePoint(150,150,rect,true,true,0,false),{x:.75,y:.75,pressure:.5});assert.equal(normalizePoint(0,1000,rect,false,false,0,false).y,1)})
test('drawing history supports undo and bounded actions',()=>{const empty=[];const next=appendInk(empty,{kind:'clear'});assert.equal(empty.length,0);assert.equal(next.length,1);assert.deepEqual(undoInk(next),[]);const full=Array.from({length:MAX_ACTIONS},()=>({kind:'clear'} as const));assert.equal(appendInk(full,{kind:'clear'}),full)})
test('step-based progress is bounded and completion reaches 100',()=>{assert.equal(lessonProgress(0,2,10000,10000,false),0);assert.equal(lessonProgress(1,2,10000,5000,false),75);assert.equal(lessonProgress(1,2,10000,20000,false),50);assert.equal(lessonProgress(1,2,10000,0,true),100)})

test('pen pressure keeps valid zero and has a visibly wider response range',()=>{
 const r={left:0,top:0,width:100,height:100}
 assert.equal(normalizePoint(20,20,r,false,false,0,true).pressure,0)
 assert.equal(normalizePoint(20,20,r,false,false,NaN,true).pressure,.5)
 assert.equal(normalizePoint(20,20,r,false,false,.9,false).pressure,.5)
 assert.ok(pressureWidth(10,.1,true)<4)
 assert.ok(pressureWidth(10,.9,true)>16)
 assert.equal(pressureWidth(10,.5,true),10)
 assert.equal(pressureWidth(10,.1,false),10)
 assert.equal(pressureWidth(10,.9,false),10)
 assert.equal(defaultInk().pressureEnabled,true)
})

test('undo and redo history restores actions in order and clears future after new drawing',()=>{
 const a={kind:'clear'} as const,b={kind:'stroke',tool:'pen',color:'#fff',width:5,opacity:100,points:[{x:.5,y:.5,pressure:.5}]} as const
 const stroke={...b,points:[...b.points]}
 let h=commitInkHistory(commitInkHistory(emptyInkHistory(),stroke),a)
 h=undoInkHistory(h);assert.deepEqual(h.past,[stroke])
 h=undoInkHistory(h);assert.deepEqual(h.past,[])
 h=redoInkHistory(h);assert.deepEqual(h.past,[stroke])
 h=redoInkHistory(h);assert.deepEqual(h.past,[stroke,a])
 h=undoInkHistory(h);h=commitInkHistory(h,stroke);assert.deepEqual(h.future,[])
 assert.equal(redoInkHistory(h),h)
})
