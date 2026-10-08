import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {JSDOM} from 'jsdom';
import {Context} from '@deepseek-ai/cordis';
import * as Registry from '@deepseek-ai/dsh-typert-registry';

export async function checkClient(host,harness,artifact){
 const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>'),ctx=new Context();let client;
 const require=createRequire(import.meta.url),priorDocument=globalThis.document;globalThis.document=dom.window.document;
 try{
  await ctx.plugin(Registry.default);
  ctx.provide('connection',{rpc:{call:async(_prefix,endpoint,payload,signal)=>{try{const [namespace,method]=endpoint.split('/');return{ok:true,value:await host.typertGateway.invoke({namespace,method,args:payload.args,signal})};}catch(error){return{ok:false,error:{message:error.message}};}},open:()=>{throw Error('Unexpected stream');}},registerGenerationSource:()=>()=>{},start:()=>({stop(){}})});
  const Gateway=await harness.importFile('packages/api/gateway/lib/types/client/index.js');await ctx.plugin(Gateway);
  // Settings service is outside this plugin; its real host path is tested in composition.
  ctx.provide('remote.settings',{});
  const {SlotRegistry}=await harness.importFile('packages/client/ui-renderer/lib/types/client/registry.js');new SlotRegistry(ctx);
  ctx.slots.register({name:'root',children:{'settings.section':{kind:'list',scope:'root'}}},()=>null);
  dom.window.__ModuleLoader__={load:({factory})=>{client=factory(require);}};
  runInNewContext(await readFile((process.env.DSH_ZERO_PACKAGE_ROOT??'.')+'/lib/client.js','utf8'),{window:dom.window,document:dom.window.document});
  for(let cycle=0;cycle<2;cycle++){
   const fiber=ctx.plugin(client);await fiber;
   for(let i=0;i<100&&!ctx.slots.entries('settings.section').length;i++)await new Promise(setImmediate);
   assert.equal(ctx.slots.entries('settings.section').length,1);assert.equal(dom.window.document.querySelectorAll('[data-plugin="dsh-zero"]').length,1);
   const reply=await ctx.remote.dshZero.readArtifact(artifact.sessionId,artifact.id,0,64);assert.equal(reply.ok,true);assert.ok(reply.value.text.length);
   await fiber.dispose();assert.equal(ctx.slots.entries('settings.section').length,0);assert.equal(dom.window.document.querySelectorAll('[data-plugin="dsh-zero"]').length,0);assert.equal(ctx.get('remote.dshZero'),undefined);
  }
  console.log('PASS native client Remote, settings slot, activation/disposal/reactivation');
 }finally{await ctx.fiber.dispose();globalThis.document=priorDocument;dom.window.close();}
}
