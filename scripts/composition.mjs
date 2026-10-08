import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {connectHarness} from './harness.mjs';
import {decodeText} from '../src/codec.js';
import {ZeroController} from '../src/controller.js';
const harness=connectHarness(process.env.DSH_SOURCE);
const {Context}=await import('@deepseek-ai/cordis');
const {default:Loader}=await import('@deepseek-ai/cordis-plugin-loader');
const {initProfile,mountRootInclude,readProfilePatches}=await import('@deepseek-ai/dsh-app-boot');
const {default:ConfigEditor}=await import('@deepseek-ai/dsh-config-editor');
const {default:Settings}=await import('@deepseek-ai/dsh-settings');
const {defineTool}=await import('@deepseek-ai/dsh-tools');
const {default:yaml}=await harness.importFile('node_modules/js-yaml/index.js');
const temp=await mkdtemp(join(tmpdir(),'dsh-zero-')),ctx=new Context();
const original='warning: 반복🙂\r\ninfo: repeat\r\n'.repeat(1000)+'ERROR: unique diagnostic';
const config={mode:'safe',counting:'estimated',minimumBytes:4096,maximumBytes:16*1024*1024,minimumReduction:0.2,maxArtifacts:1000};
const ok=async fn=>{try{return{ok:true,value:await fn()};}catch(error){return{ok:false,error:{message:error.message}};}};
try{
 const dir=join(temp,'profile');initProfile(dir,['zero-test']);const bundle=join(dir,'node_modules/zero-test');await mkdir(bundle,{recursive:true});
 await writeFile(join(temp,'package.json'),'{"name":"zero-test-root"}');await writeFile(join(bundle,'package.json'),JSON.stringify({name:'zero-test',version:'0.1.0',dsh:{bundle:{patch:'cordis.patch.yml'}}}));
 const rows=[
  {id:'prompt',name:'@deepseek-ai/dsh-system-prompt'},
  {id:'tools',name:'@deepseek-ai/dsh-tools'},
  {id:'fs-tools',name:'@deepseek-ai/dsh-tool-fs'},
  {id:'fs',name:'@deepseek-ai/dsh-fs-local',config:{cwd:temp}},
  {id:'spill',name:'@deepseek-ai/dsh-spill-local',config:{root:join(temp,'spill'),cleanupPeriodDays:0}},
  {id:'typert',name:'@deepseek-ai/dsh-typert-registry'},
  {id:'gateway',name:'@deepseek-ai/dsh-api-gateway'},
  {id:'zero',name:resolve(process.env.DSH_ZERO_PACKAGE_ROOT??'.','lib/host.js'),config},
 ];
 await writeFile(join(bundle,'cordis.patch.yml'),yaml.dump([{insert:rows}]));await writeFile(join(dir,'cordis.yml'),'[]\n');
 const profile={name:'test',startedBundles:['zero-test'],dir,patchPath:join(dir,'cordis.patch.yml'),installAnchor:join(temp,'package.json'),cwd:temp,home:temp,overlays:[]};
 ctx.baseUrl=pathToFileURL(temp+'/').href;await ctx.plugin(Loader);ctx.provide('profileContext',profile);await ctx.plugin(ConfigEditor);await ctx.plugin(Settings);
 await mountRootInclude(ctx,join(dir,'cordis.yml'),readProfilePatches('test',profile));await ctx.loader.await();
 assert.ok(ctx.get('dshZero'));assert.ok(ctx.get('tools'));assert.ok(ctx.get('spillStore'));
 ctx.tools.register(defineTool({name:'fixture_output',description:'Emit fixture output',parameters:{},output:{schema:{type:'string'},render:(_,value)=>[{type:'text',text:value}]},execute:async()=>original}));
 const agent={ctx,options:{provider:'fixture-a',model:'model-a'},session:{header:{id:'zero-session',cwd:temp},requestHeader:()=>({config:agent.options})}};
 const call=async(extras={})=>ctx.tools.execute({signal:new AbortController().signal,callId:'call-'+crypto.randomUUID(),name:'fixture_output',arguments:{},agent,...extras});
 const result=await call();assert.equal(result.isError,false);assert.equal(result.value,original);assert.match(result.content[0].text,/DSH-ZERO\/1/);assert.equal(decodeText(result.content[0].text.slice(result.content[0].text.indexOf('DSH-ZERO/1\n'))),original);
 const nativeLocator=JSON.parse(result.content[0].text.match(/Full original: (".*?"). /)[1]);
 const readResult=await ctx.tools.execute({signal:new AbortController().signal,callId:'recovery',name:'read',arguments:{file_path:nativeLocator,offset:1,limit:2},agent});assert.equal(readResult.isError,false,JSON.stringify(readResult.content));assert.ok(!readResult.content[0].text.includes('DSH-ZERO/1'));assert.ok(ctx.dshZero.snapshot().estimated.recovery>0);
 const snapshot=ctx.dshZero.snapshot();assert.equal(snapshot.selected,1);
 const artifacts=ctx.dshZero.listArtifacts('zero-session',0);assert.equal(artifacts.items.length,1);const artifact=artifacts.items[0];let recovered='',offset=0;
 for(;;){const chunk=await ctx.dshZero.readArtifact('zero-session',artifact.id,offset,65536,new AbortController().signal);recovered+=chunk.text;offset=chunk.nextOffset;if(chunk.eof)break;}
 assert.equal(recovered,original);console.log('PASS real Loader/tools/spill: compressed projection, canonical value, Unicode recovery');
 const invoke=(method,args)=>ctx.typertGateway.invoke({namespace:'dshZero',method,args});
 assert.equal((await invoke('snapshot',{})).selected,1);
 assert.equal((await invoke('readArtifact',{sessionId:'zero-session',id:artifact.id,offset:0,length:64})).sessionId,'zero-session');
 await assert.rejects(()=>invoke('readArtifact',{sessionId:'zero-session',id:'/etc/passwd',offset:0,length:64}));
 await assert.rejects(()=>invoke('readArtifact',{sessionId:'zero-session',id:artifact.id,offset:0,length:65537}));
 await assert.rejects(()=>invoke('snapshot',{extra:true}));console.log('PASS native strict gateway: real invocations and malformed request rejection');
 const remote={settings:{describe:()=>ok(()=>({writable:ctx.settings.writable,namespaces:ctx.settings.describe({redactSecrets:true})})),mutate:(...args)=>ok(()=>ctx.settings.mutate(...args))},dshZero:{snapshot:()=>ok(()=>invoke('snapshot',{})),listArtifacts:(sessionId,cursor)=>ok(()=>invoke('listArtifacts',{sessionId,cursor})),readArtifact:(sessionId,id,offset,length)=>ok(()=>invoke('readArtifact',{sessionId,id,offset,length}))}};
 const controller=new ZeroController(remote);await controller.load();await controller.save('off','estimated');await ctx.loader.await();assert.equal((await call()).content[0].text,original);assert.equal(ctx.dshZero.snapshot().selected,1);
 await controller.save('lean','estimated');await ctx.loader.await();const leanResult=await call();assert.ok(leanResult.content[0].text.includes('DSH-ZERO/1'),'lean compression');assert.match(JSON.stringify(await ctx.systemPrompt.assemble()),/targeted reads/);
 await controller.save('safe','exact-only');await ctx.loader.await();assert.equal((await call()).content[0].text,original);
 const unregister=ctx.dshZeroCounters.register('fixture-a','model-a',text=>Math.ceil(text.length/3));const exact=await call();assert.ok(exact.content[0].text.includes('DSH-ZERO/1'),'exact compression');
 agent.options={provider:'fixture-b',model:'model-b'};assert.equal((await call()).content[0].text,original);unregister();
 const cancelled=new AbortController();cancelled.abort();assert.equal((await call({signal:cancelled.signal})).isError,true);
 console.log('PASS live settings revisions, off/safe/lean reload, route-specific exact counting, cancellation');
 await controller.save('safe','estimated');await ctx.loader.await();
 const SpillPolicy=await import('@deepseek-ai/dsh-spill-policy');const spillFiber=ctx.plugin(SpillPolicy,{maxInlineTokens:500});await spillFiber;
 const spilled=await call();assert.ok(spilled.content[0].text.includes('DSH-ZERO/1'));assert.ok(!spilled.content[0].text.includes('Full formatted result stored at'));assert.equal(spilled.value,original);
 await controller.save('off','estimated');await controller.save('safe','estimated');await ctx.loader.await();assert.ok(!(await call()).content[0].text.includes('DSH-ZERO/1'));await spillFiber.dispose();
 const saved=ctx.spillStore.saveText;ctx.spillStore.saveText=async()=>{throw Error('Storage unavailable');};try{assert.equal((await call()).content[0].text,original);}finally{ctx.spillStore.saveText=saved;}
 const locator=JSON.parse(result.content[0].text.match(/Full original: (".*?"). /)[1]);await writeFile(locator,'changed');await assert.rejects(()=>ctx.dshZero.readArtifact('zero-session',artifact.id,0,64));
 console.log('PASS native spill-policy composition, storage failure fallback, changed-artifact refusal');
 // Use a fresh unchanged artifact for the native client read check.
 await call();const clientArtifact=ctx.dshZero.listArtifacts('zero-session',0).items[0];
 const {checkClient}=await import('./client-check.mjs');await checkClient(ctx,harness,clientArtifact);
 console.log('DSH_ZERO_COMPOSITION_OK');
}finally{await ctx.fiber.dispose();await rm(temp,{recursive:true,force:true});}
