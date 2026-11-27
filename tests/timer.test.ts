import test from 'node:test'
import assert from 'node:assert/strict'
import {start,left,tick,move,toggle,extend,restart,formatTime,shuffle} from '../src/timer.ts'
test('deadline and automatic next',()=>{const c=start(3,5000,100);assert.equal(left(c,1100),4000);assert.equal(tick(c,5099).index,0);const n=tick(c,5100);assert.equal(n.index,1);assert.equal(n.deadline,10100)})
test('pause freezes and resume retains remaining',()=>{let c=toggle(start(2,5000,0),2000);assert.equal(left(c,100000),3000);c=toggle(c,100000);assert.equal(c.deadline,103000)})
test('extend both paused and running',()=>{let c=extend(start(2,5000,0),60000,1000);assert.equal(c.deadline,65000);c=toggle(c,2000);assert.equal(extend(c,30000,8000).remaining,93000)})
test('late tick does not silently skip images',()=>{const c=tick(start(4,5000,0),500000);assert.equal(c.index,1);assert.equal(left(c,500000),5000)})
test('end and previous and restart',()=>{let c=move(start(1,5000,0),1,100);assert.equal(c.finished,true);assert.equal(left(c,100),0);c=restart(c,200);assert.equal(c.finished,false);assert.equal(c.remaining,5000);assert.equal(move(c,-1,200).index,0)})
test('shuffle preserves every item and source',()=>{const a=[1,2,3,4];const b=shuffle(a,()=>0);assert.deepEqual(a,[1,2,3,4]);assert.deepEqual([...b].sort(),a)})
test('time formatting and invalid sessions',()=>{assert.equal(formatTime(299999),'05:00');assert.equal(formatTime(0),'00:00');assert.throws(()=>start(0,5000,0));assert.throws(()=>start(1,0,0))})
