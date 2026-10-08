import test from 'node:test';
import assert from 'node:assert/strict';
import {ServiceState} from '../src/service-state.js';
function fixture(text='한글🙂'.repeat(1000)){
 const bytes=Buffer.from(text);const state=new ServiceState({maxArtifacts:2,readRange:async(_,offset,length)=>bytes.subarray(offset,offset+length)});
 const artifact=state.addArtifact({sessionId:'s',locator:'/private/saved',bytes:bytes.length,toolName:'shell'});return{state,artifact,text};
}
test('opaque artifact registry refuses forged IDs and wrong sessions',async()=>{
 const {state,artifact}=fixture();assert.equal(state.listArtifacts('other').items.length,0);assert.equal(state.listArtifacts('s').items[0].id,artifact.id);
 await assert.rejects(()=>state.readArtifact('other',artifact.id,0,64));await assert.rejects(()=>state.readArtifact('s','/etc/passwd',0,64));
 for(const [o,n] of [[-1,64],[0,65537],[0,1],[1.1,64]])await assert.rejects(()=>state.readArtifact('s',artifact.id,o,n));
});
test('bounded Unicode pages reassemble the exact original',async()=>{
 const {state,artifact,text}=fixture();let actual='',offset=0;
 for(;;){const page=await state.readArtifact('s',artifact.id,offset,63);assert.ok(Buffer.byteLength(page.text)<=63);actual+=page.text;offset=page.nextOffset;if(page.eof)break;}
 assert.equal(actual,text);await assert.rejects(()=>state.readArtifact('s',artifact.id,1,64));
});
test('bounded registry evicts metadata and preserves counters',()=>{
 const {state,artifact}=fixture();state.addArtifact({sessionId:'s',locator:'/2',bytes:2,toolName:'shell'});state.addArtifact({sessionId:'s',locator:'/3',bytes:2,toolName:'shell'});
 assert.equal(state.listArtifacts('s').items.length,2);assert.ok(!state.listArtifacts('s').items.some(a=>a.id===artifact.id));
 state.record({selected:true,basis:'estimated',originalBytes:1000,retainedBytes:100,originalCount:250,retainedCount:25});state.record({selected:false,reason:'size-limit'});
 state.recordRecovery({basis:'estimated',count:30,bytes:120,source:'model'});
 const view=state.snapshot();assert.equal(view.scope,'host-activation');assert.equal(view.estimated.grossReduction,225);assert.equal(view.estimated.recovery,30);assert.equal(view.estimated.netProjectionReduction,195);assert.equal(view.bypass['size-limit'],1);
});
test('viewer recovery is tracked separately from model-context overhead',async()=>{
 const {state,artifact}=fixture();await state.readArtifact('s',artifact.id,0,64);const view=state.snapshot();assert.ok(view.viewerBytes>0);assert.equal(view.estimated.recovery,0);
});
test('net projection reduction is unavailable when recovery uses a different basis',()=>{
 const {state}=fixture();state.record({selected:true,basis:'exact',originalBytes:1000,retainedBytes:100,originalCount:250,retainedCount:25});
 state.recordRecovery({basis:'estimated',count:30,bytes:120,source:'model',comparable:false});
 assert.equal(state.snapshot().exact.netProjectionReduction,null);assert.equal(state.snapshot().estimated.netProjectionReduction,null);
});
