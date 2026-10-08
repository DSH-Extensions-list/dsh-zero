import test from 'node:test';
import assert from 'node:assert/strict';
import {createPolicy,DEFAULT_CONFIG} from '../src/policy.js';
import {decodeText} from '../src/codec.js';
const original='warning\ninfo\n'.repeat(1000)+'ERROR: unique\n';
function fixture(overrides={}){
 const events=[],saved=[];const config={...DEFAULT_CONFIG,...overrides.config};
 const policy=createPolicy({config,saveOriginal:async(exec,text)=>{saved.push(text);return {id:'saved-id',locator:'/private/artifact',retrievalHint:'Use read to recover.'};},record:e=>events.push(e),resolveCounter:()=>undefined,...overrides});
 const exec={name:'shell',callId:'call',agent:{session:{header:{id:'session'}}},signal:new AbortController().signal};
 const result={content:[{type:'text',text:original}],isError:true,meta:{exitCode:1},value:{raw:original}};
 return {policy,exec,result,events,saved};
}
test('stores full original then compresses with exact recovery locator',async()=>{
 const f=fixture(),decision=await f.policy(f.exec,f.result,async()=>({kind:'accept',additionalContexts:[{id:'context'}]}));
 assert.equal(f.saved[0],original);assert.equal(decision.kind,'accept');assert.deepEqual(decision.additionalContexts,[{id:'context'}]);
 const text=decision.content[0].text;assert.match(text,/\/private\/artifact/);assert.equal(decodeText(text.slice(text.indexOf('DSH-ZERO/1\n'))),original);
 assert.equal(f.result.meta.exitCode,1);assert.equal(f.result.isError,true);assert.equal(f.result.value.raw,original);assert.equal(f.events[0].reason,'selected');
});
for(const [name,modify,overrides] of [
 ['storage failure',()=>{}, {saveOriginal:async()=>{throw Error('ENOSPC')}}],
 ['abort',f=>{const c=new AbortController();c.abort();f.exec.signal=c.signal;}],
 ['missing owner',f=>{delete f.exec.agent;}],
 ['unsupported block',f=>{f.result.content.push({type:'image',attachment:{}});} ],
 ['recovery tool',f=>{f.exec.name='read';}],
 ['nested program value',f=>{f.exec.parent={};}],
 ['already spilled',f=>{f.result.content[0].text='[verbatim copy saved at "/file"]\n'+original;}],
 ['off',()=>{}, {config:{mode:'off'}}],
 ['strict unknown tokenizer',()=>{}, {config:{counting:'exact-only'}}],
])test(`bypass ${name}`,async()=>{
 const f=fixture(overrides);modify(f);const base={kind:'accept'};assert.equal(await f.policy(f.exec,f.result,async()=>base),base);
});
test('downstream block and value decisions remain authoritative',async()=>{
 const f=fixture();for(const base of [{kind:'block',feedback:[]},{kind:'accept',value:7}])assert.equal(await f.policy(f.exec,f.result,async()=>base),base);
 assert.equal(f.saved.length,0);
});
test('abort while storing cannot select compressed content',async()=>{
 const c=new AbortController(),f=fixture({saveOriginal:async()=>{c.abort();return{id:'x',locator:'/x',retrievalHint:'read'};}});f.exec.signal=c.signal;
 const base={kind:'accept'};assert.equal(await f.policy(f.exec,f.result,async()=>base),base);
});
test('complete candidate with notices is counted and route resolved per call',async()=>{
 let route='a';const seen=[],f=fixture({resolveCounter:()=>text=>{seen.push([route,text]);return text===original?10:11;}});
 const base={kind:'accept'};assert.equal(await f.policy(f.exec,f.result,async()=>base),base);route='b';await f.policy(f.exec,f.result,async()=>base);
 assert.ok(seen.some(([r,t])=>r==='b'&&t.includes('/private/artifact')));assert.equal(f.events.at(-1).reason,'not-smaller');
});
