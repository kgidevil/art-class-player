import test from 'node:test'
import assert from 'node:assert/strict'
import {buildPlan,prioritize,defaults,upsertHistory,validSteps} from '../src/lesson.ts'
import {startSequence,move,tick,toggle,left,restart} from '../src/timer.ts'
import type {History} from '../src/lesson.ts'
const pool=[{id:1,name:'one',key:'one'},{id:2,name:'two',key:'two'},{id:3,name:'three',key:'three'}]
test('plan expands image and break with distinct durations and no repeats',()=>{const p=buildPlan([{kind:'image',seconds:60,count:1},{kind:'break',seconds:300,count:1},{kind:'image',seconds:600,count:2}],pool);assert.deepEqual(p.map(x=>x.id),[1,-1,2,3]);assert.deepEqual(p.map(x=>x.duration),[60000,300000,600000,600000])})
test('insufficient and duplicate photos rejected',()=>{assert.throws(()=>buildPlan([{kind:'image',seconds:60,count:4}],pool));assert.throws(()=>buildPlan([{kind:'image',seconds:60,count:2}],[pool[0],{...pool[0],id:9}]));assert.equal(validSteps([{kind:'break',seconds:60,count:1}]),false)})
test('variable timer transitions, paused previous and restart preserve correct duration',()=>{let c=startSequence([5000,10000,15000],0);c=tick(c,5000);assert.equal(c.duration,10000);assert.equal(c.deadline,15000);c=toggle(c,6000);c=move(c,1,6000);assert.equal(c.duration,15000);assert.equal(left(c,9000),15000);c=move(c,-1,9000);assert.equal(restart(c,9000).duration,10000)})
test('unused-first is group-specific and recent use ranks last',()=>{const h:History={id:'one',group:'청운면 미술반',title:'test',started:1,ended:2,status:'complete',note:'',total:1,viewed:[{...pool[0],duration:5000}]};assert.deepEqual(prioritize(pool,[h],h.group,true).map(x=>x.id),[2,3,1]);assert.deepEqual(prioritize(pool,[h],'단월면 미술반',true).map(x=>x.id),[1,2,3]);assert.equal(upsertHistory(upsertHistory(defaults(),h),h).history.length,1)})
