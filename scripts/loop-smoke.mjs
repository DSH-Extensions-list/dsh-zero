import assert from 'node:assert/strict';
import {connectHarness} from './harness.mjs';
connectHarness(process.env.DSH_SOURCE);
const {runCase}=await import('./loop-case.mjs');
for(const route of [{provider:'fixture-qwen',model:'fixture-qwen'},{provider:'fixture-claude',model:'fixture-claude'}]){
 for(const mode of ['off','safe','lean']){
  const result=await runCase({mode,route,task:{name:'diagnostic',prompt:'Read fixture_output and report the unique diagnostic.',success:{contains:'ZERO_FIXTURE_PASSED'}},budget:{maxCalls:3,maxOutputTokens:1024,timeoutMs:10000},fixture:true});
  assert.equal(result.success,true);assert.equal(result.calls,2);
  console.log(`PASS real AgentLoop + pi-ai HTTP: ${route.provider}/${mode}; ${result.calls} calls; durable request equality verified`);
 }
}
const {checkRetries}=await import('./retry-check.mjs');await checkRetries(runCase);
console.log('DSH_ZERO_LOOP_OK');
