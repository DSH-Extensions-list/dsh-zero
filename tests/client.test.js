import test from 'node:test';
import assert from 'node:assert/strict';
import {ZeroController} from '../src/controller.js';
import {snapshotSchema} from '../src/remote.js';
const ok=value=>({ok:true,value});
function fixture(){
 const calls=[];const section={ns:'zero-test',revision:3,value:{mode:'safe',counting:'estimated'}};
 const stats={scope:'host-activation',startedAt:'now',selected:1,originalBytes:10000,retainedBytes:1000,viewerBytes:0,modelRecoveryBytes:0,estimated:{original:2500,retained:250,grossReduction:2250,recovery:0,netProjectionReduction:2250},exact:{original:0,retained:0,grossReduction:0,recovery:0,netProjectionReduction:0},bypass:{}};
 const remote={settings:{describe:async()=>ok({writable:true,namespaces:[section]}),mutate:async(...args)=>{calls.push(args);return ok(null);}},dshZero:{snapshot:async()=>ok(stats),listArtifacts:async()=>ok({items:[],nextCursor:null}),readArtifact:async()=>ok({text:'<script>plain text</script>',nextOffset:20,eof:true,totalBytes:20,sessionId:'s'})}};
 return{remote,calls,section,stats};
}
test('controller identifies namespace by Config and saves with original revision',async()=>{
 const f=fixture(),controller=new ZeroController(f.remote);const view=await controller.load();assert.equal(view.config.mode,'safe');assert.equal(view.stats.scope,'host-activation');
 await controller.save('lean','exact-only');assert.equal(f.calls[0][0],'zero-test');assert.deepEqual(f.calls[0][1],[{op:'set',path:['mode'],value:'lean'},{op:'set',path:['counting'],value:'exact-only'}]);assert.equal(f.calls[0][2],3);
});
test('wire errors and stale revisions reach the user',async()=>{
 const f=fixture(),controller=new ZeroController(f.remote);await controller.load();f.remote.settings.mutate=async()=>({ok:false,error:{message:'Settings changed; reload first'}});
 await assert.rejects(()=>controller.save('lean','estimated'),/Settings changed/);
});
test('artifact paging uses session and opaque ID and preserves literal text',async()=>{
 const f=fixture(),controller=new ZeroController(f.remote);const artifact={sessionId:'s',id:'opaque'};let args;
 f.remote.dshZero.readArtifact=async(...a)=>{args=a;return ok({text:'<script>literal</script>',nextOffset:20,eof:true,totalBytes:20,sessionId:'s'});};
 assert.equal((await controller.read(artifact,0)).text,'<script>literal</script>');assert.deepEqual(args,['s','opaque',0,65536]);
});
test('Remote schemas reject incomplete or invalid metrics',()=>{
 const f=fixture();assert.equal(snapshotSchema.parse(f.stats).scope,'host-activation');assert.throws(()=>snapshotSchema.parse({...f.stats,selected:-1}));
});
