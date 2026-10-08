import z from '@deepseek-ai/schemastery';
import {ZeroService} from './service.ts';
import {ServiceState} from './service-state.js';
import {createCounters,estimateText} from './selection.js';
import {createPolicy,DEFAULT_CONFIG} from './policy.js';
import {LEAN_GUIDE} from './lean.js';
import {TYPERT} from './remote.js';

export const name='dsh-zero';
export const inject=['tools'];
export const Config=z.object({
 mode:z.union(['off','safe','lean']).default('safe').description('Safe compresses recoverable output; Lean also adds concise working guidance.'),
 counting:z.union(['estimated','exact-only']).default('estimated').description('Estimated works with any model. Exact-only preserves original output unless a matching tokenizer is registered.'),
 minimumReduction:z.number().min(0).max(1).default(0.2),
 minimumBytes:z.number().step(1).min(1).default(4096),
 maximumBytes:z.number().step(1).min(4096).max(64*1024*1024).default(16*1024*1024),
 maxArtifacts:z.number().step(1).min(1).max(10000).default(1000),
});

/** Stream only the requested byte window through the composed native filesystem. */
async function readRange(ctx,identities,locator,offset,length,signal){
 const fs=ctx.get('fs');if(!fs)throw Error('Native filesystem unavailable');
 const identity=identities.get(locator);if(!identity)throw Error('Unknown saved artifact');
 const target=await fs.resolve(locator,{signal});const info=await fs.stat(target,signal);
 if(target.targetKey!==identity.key||info?.version!==identity.version||info?.type!=='file')throw Error('Saved artifact changed or expired');
 const stream=await fs.streamText(target,signal);const parts=[];let position=0,remaining=length;
 for await(const text of stream){
  const bytes=Buffer.from(text),start=Math.max(0,offset-position);
  if(start<bytes.length&&remaining>0){const part=bytes.subarray(start,Math.min(bytes.length,start+remaining));parts.push(part);remaining-=part.length;}
  position+=bytes.length;if(!remaining)break;
 }
 const after=await fs.stat(target,signal);if(after?.version!==identity.version)throw Error('Saved artifact changed while reading');
 return Buffer.concat(parts);
}

export function apply(ctx,config){
 const cfg=config??DEFAULT_CONFIG;if(cfg.minimumBytes>cfg.maximumBytes)throw Error('minimumBytes exceeds maximumBytes');
 const identities=new Map(),pending=new WeakMap(),counters=createCounters();
 const state=new ServiceState({maxArtifacts:cfg.maxArtifacts,readRange:(...args)=>readRange(ctx,identities,...args)});
 new ZeroService(ctx,state);
 ctx.provide('dshZeroCounters',counters);
 ctx.inject(['typert'],scope=>scope.effect(()=>scope.typert.register(TYPERT),'DSH Zero Remote descriptors'));
 if(cfg.mode==='off')return;
 const resolveCounter=exec=>{
  const header=exec.agent?.session.requestHeader?.()?.config;
  return counters.resolve(header?.provider??exec.agent?.options.provider,header?.model??exec.agent?.options.model);
 };
 const saveOriginal=async(exec,original)=>{
  const store=ctx.get('spillStore'),fs=ctx.get('fs');if(!store||!fs)throw Error('Native spill storage or filesystem unavailable');
  const ref=await store.saveText({owner:{sessionId:exec.agent.session.header.id},source:{kind:'tool',toolName:exec.name,callId:exec.callId,label:'dsh-zero-original'},suggestedName:'dsh-zero-original.txt',content:original});
  const locator=fs.processPathFromHostPath(ref.locator);if(!locator)throw Error('Saved output unavailable in tool execution world');
  const target=await fs.resolve(locator,{signal:exec.signal}),info=await fs.stat(target,exec.signal);
  if(info?.type!=='file'||info.size!==ref.bytes)throw Error('Original artifact could not be verified');
  identities.set(locator,{key:target.targetKey,version:info.version});
  const artifact=state.addArtifact({sessionId:exec.agent.session.header.id,locator,bytes:ref.bytes,toolName:exec.name});
  // Bound identity metadata together with the public artifact registry.
  for(const key of identities.keys())if(!state.findByLocator(key))identities.delete(key);
  return {id:artifact.id,locator,retrievalHint:ref.retrievalHint};
 };
 const record=entry=>{if(entry.selected)pending.set(entry.exec.token,entry);else state.record(entry);};
 ctx.on('tools/post-execute',createPolicy({config:cfg,saveOriginal,record,resolveCounter}),{prepend:true});
 ctx.on('tools/result',(exec,result)=>{
  const entry=pending.get(exec.token);if(entry){pending.delete(exec.token);if(result.content.length===1&&result.content[0].type==='text'&&result.content[0].text===entry.candidate)state.record(entry);else state.record({selected:false,reason:'superseded-projection'});}
  if(exec.name!=='read'||result.isError)return;
  const artifact=state.findByLocator(exec.args?.file_path);if(!artifact)return;
  const text=result.content.filter(b=>b.type==='text').map(b=>b.text).join('');const counter=resolveCounter(exec);
  let basis='estimated',count=estimateText(text);if(counter){try{const value=counter(text);if(Number.isSafeInteger(value)&&value>=0){basis='exact';count=value;}}catch{/* Counter failure is labeled estimated, never exact. */}}
  state.recordRecovery({basis,count,bytes:Buffer.byteLength(text),source:'model'});
 });
 if(cfg.mode==='lean')ctx.inject(['systemPrompt'],scope=>scope.systemPrompt.section({name:'dsh-zero:lean',order:scope.systemPrompt.getSectionOrder('DELIVERABLE_FILE_REFERENCES')+2,text:LEAN_GUIDE,interpolate:false}));
}
