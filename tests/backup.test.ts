import test from 'node:test'
import assert from 'node:assert/strict'
import {packBackup,unpackBackup,sha256,verifyPhoto,validateHeader} from '../src/backup-format.ts'
import type {BackupHeader} from '../src/backup-format.ts'
import {startSequence,tick,left,toggle} from '../src/timer.ts'
const photo=new Blob([new Uint8Array([1,2,3,4])],{type:'image/png'})
async function fixture(){const header:BackupHeader={schema:1,created:'2026-11-28T00:00:00.000Z',state:{a:null},photos:[{id:1,name:'그림.png',type:'image/png',size:photo.size,sha256:await sha256(photo)}]};return {header,file:await packBackup(header,[photo])}}
test('binary backup roundtrip preserves metadata and photo bytes',async()=>{const {header,file}=await fixture();const r=await unpackBackup(file);assert.deepEqual(r.header,header);await verifyPhoto(r.blobs[0],header.photos[0]);assert.deepEqual(new Uint8Array(await r.blobs[0].arrayBuffer()),new Uint8Array([1,2,3,4]))})
test('manifest and payload corruption, truncation and duplicate IDs rejected',async()=>{const {header,file}=await fixture();const bytes=new Uint8Array(await file.arrayBuffer());const corrupted=bytes.slice();corrupted[45]^=1;await assert.rejects(()=>unpackBackup(new Blob([corrupted])));const payload=bytes.slice();payload[payload.length-1]^=1;const r=await unpackBackup(new Blob([payload]));await assert.rejects(()=>verifyPhoto(r.blobs[0],header.photos[0]));await assert.rejects(()=>unpackBackup(file.slice(0,file.size-1)));assert.throws(()=>validateHeader({...header,photos:[...header.photos,...header.photos]}))})
test('three-hour simulated lesson advances every step without drift',()=>{const durations=Array(36).fill(300000);let c=startSequence(durations,0);for(let i=1;i<=36;i++){c=tick(c,i*300000);if(i<36){assert.equal(c.index,i);assert.equal(left(c,i*300000),300000)}}assert.equal(c.finished,true);let p=startSequence([300000],0);p=toggle(p,100000);p=toggle(p,200000);assert.equal(left(p,300000),100000)})
