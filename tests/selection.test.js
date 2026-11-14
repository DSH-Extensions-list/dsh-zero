import test from 'node:test';
import assert from 'node:assert/strict';
import {selectCandidate,createCounters} from '../src/selection.js';
test('exact selection compares the complete candidate',()=>{
 const countTokens=text=>text==='original'?10:text==='small'?9:10;
 assert.equal(selectCandidate({original:'original',candidate:'small',countTokens}).selected,true);
 assert.equal(selectCandidate({original:'original',candidate:'equal',countTokens}).selected,false);
 assert.equal(selectCandidate({original:'original',candidate:'huge',countTokens:()=>10}).selected,false);
});
test('counter failures and exact-only missing tokenizer bypass',()=>{
 assert.equal(selectCandidate({original:'a',candidate:'b',countTokens:()=>{throw Error('offline')}}).selected,false);
 for(const invalid of [NaN,Infinity,-1,1.2])assert.equal(selectCandidate({original:'a',candidate:'b',countTokens:()=>invalid}).selected,false);
 assert.equal(selectCandidate({original:'a'.repeat(100),candidate:'b',counting:'exact-only'}).selected,false);
});
test('estimate needs twenty percent including notice overhead',()=>{
 assert.equal(selectCandidate({original:'a'.repeat(100),candidate:'b'.repeat(81)}).selected,false);
 assert.equal(selectCandidate({original:'a'.repeat(100),candidate:'b'.repeat(80)}).selected,true);
});
test('counter registry uses explicit provider/model identity and disposal',()=>{
 const counters=createCounters();const dispose=counters.register('local','qwen',()=>5);
 assert.ok(counters.resolve('local','qwen'));assert.equal(counters.resolve('other','qwen'),undefined);assert.equal(counters.resolve('local','claude'),undefined);
 assert.throws(()=>counters.register('local','qwen',()=>6));dispose();assert.equal(counters.resolve('local','qwen'),undefined);
});
