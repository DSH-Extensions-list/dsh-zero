import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,rm,cp,readFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {Context} from '@deepseek-ai/cordis';
import {mountAgentLoopTestDependencies,mountAgentLoopTestHarness} from '@deepseek-ai/dsh-agent-loop-testkit';
import {defineTool} from '@deepseek-ai/dsh-tools';
import {createUserMessage,expandAssistantStream} from '@deepseek-ai/dsh-llm';
import * as PiAi from '@deepseek-ai/dsh-llm-pi-ai';
import * as Retry from '@deepseek-ai/dsh-llm-retry';
import Fs from '@deepseek-ai/dsh-fs-sandbox';
import SandboxPolicy from '@deepseek-ai/dsh-sandbox-policy';
import Spill from '@deepseek-ai/dsh-spill-local';
import * as FsTools from '@deepseek-ai/dsh-tool-fs';
import * as Zero from '../lib/host.js';
import {decodeText} from '../src/codec.js';
import {estimateText} from '../src/selection.js';

const defaultOutput='warning: repeated\r\ninfo: 반복🙂\r\n'.repeat(1000)+'UNIQUE_DIAGNOSTIC: ZERO_FIXTURE_PASSED';
function relativeFile(root,path){const target=resolve(root,path),rel=relative(root,target);if(isAbsolute(rel)||rel==='..'||rel.startsWith('../'))throw Error('Fixture file must stay in the copied workspace');return target;}

/** Local HTTP/SSE fixture drives the real pi-ai adapter and agent loop. */
async function fixtureServer(original,requests,failOnce=false){
 const server=createServer(async(req,res)=>{
  try{
   let body='';for await(const part of req)body+=part;const request=JSON.parse(body);requests.push(request);
   if(failOnce&&requests.length===1){res.writeHead(400,{'content-type':'application/json'});res.end(JSON.stringify({error:{message:'rate limit fixture failure'}}));return;}
   const toolMessage=request.messages.findLast(m=>m.role==='tool');
   const response=toolMessage?{role:'assistant',content:'ZERO_FIXTURE_PASSED'}:{role:'assistant',tool_calls:[{index:0,id:'fixture-call',type:'function',function:{name:'fixture_output',arguments:'{}'}}]};
   if(toolMessage){
    const content=typeof toolMessage.content==='string'?toolMessage.content:toolMessage.content.map(b=>b.text??'').join('');
    if(content.includes('DSH-ZERO/1\n'))assert.equal(decodeText(content.slice(content.indexOf('DSH-ZERO/1\n'))),original);else assert.equal(content,original);
   }
   res.setHeader('content-type','text/event-stream');
   res.write(`data: ${JSON.stringify({id:'fixture',model:request.model,choices:[{index:0,delta:response,finish_reason:null}]})}\n\n`);
   res.write(`data: ${JSON.stringify({choices:[{index:0,delta:{},finish_reason:toolMessage?'stop':'tool_calls'}],usage:{prompt_tokens:estimateText(JSON.stringify(request.messages)),completion_tokens:10}})}\n\n`);res.end('data: [DONE]\n\n');
  }catch(error){res.writeHead(500);res.end(JSON.stringify({error:{message:error.message}}));}
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));return server;
}

/** One isolated paired case; only a manifest with an explicit call/output budget may use a live route. */
export async function runCase({mode,route,task,budget,fixture=false,fixtureFailOnce=false}){
 const temp=await mkdtemp(join(tmpdir(),'dsh-zero-case-')),workspace=join(temp,'workspace'),ctx=new Context(),requests=[];let server,timer,caseAgent;const priorFixtureKey=process.env.DSH_ZERO_FIXTURE_KEY;
 const start=performance.now();
 try{
  if(task.fixtureWorkspace)await cp(resolve(task.fixtureWorkspace),workspace,{recursive:true,errorOnExist:true});else await mkdir(workspace);
  const original=task.outputFile?await readFile(relativeFile(workspace,task.outputFile),'utf8'):defaultOutput;
  if(fixture)server=await fixtureServer(original,requests,fixtureFailOnce);
  await mountAgentLoopTestDependencies(ctx);await ctx.plugin(Retry);
  await ctx.plugin(SandboxPolicy,{mode:'workspace-write',workspaceRoot:workspace});await ctx.plugin(Fs,{cwd:workspace});await ctx.plugin(Spill,{root:join(temp,'spill'),cleanupPeriodDays:0});await ctx.plugin(FsTools);
  await ctx.plugin(Zero,{mode,counting:'estimated'});
  const profile=fixture?{api:'openai-completions',baseURL:`http://127.0.0.1:${server.address().port}/v1`,apiKeyEnv:'DSH_ZERO_FIXTURE_KEY',retryPolicy:{mode:'normal',maxRetries:1,retryableCodes:['RATE_LIMIT'],backoff:{initialDelayMs:1,maxDelayMs:1,jitterRatio:0}},models:[{id:route.model,contextWindow:65536,maxTokens:budget.maxOutputTokens}]}:route.profile;
  if(fixture)process.env.DSH_ZERO_FIXTURE_KEY='fixture-only';
  await ctx.plugin(PiAi,{providers:{[route.provider]:profile}});
  ctx.tools.register(defineTool({name:'fixture_output',description:'Read the task fixture diagnostic output in full.',parameters:{},output:{schema:{type:'string'},render:(_,value)=>[{type:'text',text:value}]},execute:async()=>original}));
  let calls=0,inputEstimate=0,recoveryReads=0,budgetExhausted=false;const captured=[];
  ctx.on('llm/stream',async function*(options,next){
   if(calls>=budget.maxCalls){budgetExhausted=true;caseAgent?.cancel({kind:'hook',reason:'Benchmark model-call budget exhausted'});throw Error('Benchmark model-call budget exhausted');}calls++;inputEstimate+=estimateText(JSON.stringify(options.messages));
   captured.push(structuredClone(options.messages));yield* next();
  });
  ctx.on('tools/result',(exec)=>{if(exec.name==='read')recoveryReads++;});
  const harness=await mountAgentLoopTestHarness(ctx);const agent=await harness.create('zero-case-'+crypto.randomUUID(),{provider:route.provider,model:route.model,maxTokens:budget.maxOutputTokens},{cwd:workspace});
  caseAgent=agent;timer=setTimeout(()=>agent.cancel({kind:'hook',reason:'Benchmark time budget exhausted'}),budget.timeoutMs);
  agent.followup(createUserMessage({content:[{type:'text',text:task.prompt}],source:{kind:'user'}}));await agent.whenIdle();clearTimeout(timer);
  const log=agent.session.snapshotEvents(),retries=log.filter(e=>e.type==='llm/retry-started').length,assistant=log.filter(e=>e.type==='assistant/message').at(-1);
  const output=assistant?.data.message.content.filter(b=>b.type==='text').map(b=>b.text).join('')??'';
  const usageByStep=new Map();
  for(const event of log){
   if(event.type==='assistant/message'&&event.data.usage)usageByStep.set(`${event.data.turn}/${event.data.step}`,event.data.usage);
   if(event.type==='assistant/attempt'){const usage=expandAssistantStream(event.data.stream).findLast(f=>f.chunk.type==='usage')?.chunk.usage;if(usage)usageByStep.set(`${event.data.turn}/${event.data.step}`,usage);}
  }
  const usage={};for(const value of usageByStep.values())for(const [key,count] of Object.entries(value))if(typeof count==='number')usage[key]=(usage[key]??0)+count;
  let success=output.includes(task.success.contains);const fileChecks=[];
  for(const check of task.success.files??[]){let passed=false;try{passed=(await readFile(relativeFile(workspace,check.path),'utf8')).includes(check.contains);}catch{/* Missing expected file is a failed task check. */}fileChecks.push({path:check.path,passed});success&&=passed;}
  const requestOutput=captured.at(-1)?.filter(m=>m.role==='tool').map(m=>m.content).flat().find(b=>b.type==='text')?.text;
  const durableOutput=log.find(e=>e.type==='tool/result'&&e.data.message.source?.callId==='fixture-call')?.data.message.content[0]?.text;
  if(fixture){assert.ok(calls<=budget.maxCalls);if(success){assert.equal(requestOutput,durableOutput);assert.equal(requestOutput?.includes('DSH-ZERO/1\n'),mode!=='off');}}
  return {task:task.name,mode,provider:route.provider,model:route.model,success,fileChecks,output,calls,retries,recoveryReads,budgetExhausted,durationMs:Math.round(performance.now()-start),providerUsage:usage,usageSource:fixture?'fixture-reported':'provider-reported',estimatedRequestTokens:inputEstimate,projection:ctx.dshZero.snapshot(),fixture,requestLogMatchesDurableResult:fixture?requestOutput===durableOutput:null};
 }finally{if(fixture){if(priorFixtureKey===undefined)delete process.env.DSH_ZERO_FIXTURE_KEY;else process.env.DSH_ZERO_FIXTURE_KEY=priorFixtureKey;}clearTimeout(timer);await ctx.fiber.dispose();if(server)await new Promise(r=>server.close(r));await rm(temp,{recursive:true,force:true});}
}
