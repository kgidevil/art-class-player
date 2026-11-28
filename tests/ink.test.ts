import test from 'node:test'
import assert from 'node:assert/strict'
import {normalizePoint,appendInk,undoInk,lessonProgress,MAX_ACTIONS} from '../src/ink.ts'
test('normalized drawing positions remain anchored through flipped scaled photo',()=>{const rect={left:100,top:50,width:200,height:400};assert.deepEqual(normalizePoint(150,150,rect,false,false,.8,true),{x:.25,y:.25,pressure:.8});assert.deepEqual(normalizePoint(150,150,rect,true,true,0,false),{x:.75,y:.75,pressure:.5});assert.equal(normalizePoint(0,1000,rect,false,false,0,false).y,1)})
test('drawing history supports undo and bounded actions',()=>{const empty=[];const next=appendInk(empty,{kind:'clear'});assert.equal(empty.length,0);assert.equal(next.length,1);assert.deepEqual(undoInk(next),[]);const full=Array.from({length:MAX_ACTIONS},()=>({kind:'clear'} as const));assert.equal(appendInk(full,{kind:'clear'}),full)})
test('step-based progress is bounded and completion reaches 100',()=>{assert.equal(lessonProgress(0,2,10000,10000,false),0);assert.equal(lessonProgress(1,2,10000,5000,false),75);assert.equal(lessonProgress(1,2,10000,20000,false),50);assert.equal(lessonProgress(1,2,10000,0,true),100)})
