import test from 'node:test'
import assert from 'node:assert/strict'
import {defaultArt,fitRect,panLimit,quantize,processPixels} from '../src/art-tools.ts'
test('contain geometry preserves aspect ratio, zoom pan bounded',()=>{assert.deepEqual(fitRect(800,600,400,800),{width:300,height:600});assert.equal(panLimit(800,300,2),0);assert.equal(panLimit(800,600,2),200);assert.deepEqual(fitRect(0,600,400,800),{width:0,height:0})})
test('quantized values use exact 2, 3 and 5 levels',()=>{for(const n of [2,3,5])assert.equal(new Set(Array.from({length:256},(_,i)=>quantize(i,n))).size,n);assert.equal(quantize(128,3),128)})
test('pixel processing preserves input and alpha and quantizes grayscale',()=>{const a=new Uint8ClampedArray([20,20,20,255,120,120,120,180,240,240,240,255]);const before=[...a];const out=processPixels(a,3,1,{...defaultArt(),mode:'tone3'});assert.deepEqual([...out],[0,0,0,255,128,128,128,180,255,255,255,255]);assert.deepEqual([...a],before)})
test('outline highlights contrast and flat region stays white',()=>{const a=new Uint8ClampedArray([0,0,0,255,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255]);const out=processPixels(a,5,1,{...defaultArt(),mode:'outline'});assert.equal(out[0],255);assert.equal(out[4],0);assert.equal(out[8],0);assert.equal(out[16],255)})
