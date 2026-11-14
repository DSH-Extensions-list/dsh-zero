import test from 'node:test';
import assert from 'node:assert/strict';
import {validateManifest} from '../scripts/benchmark-config.mjs';
const valid=()=>({fixture:true,repetitions:1,routes:[{provider:'fixture-a',model:'model-a'},{provider:'fixture-b',model:'model-b'}],budget:{maxCalls:3,maxOutputTokens:1024,timeoutMs:10000},tasks:[{name:'diagnostic',prompt:'Read fixture_output.',success:{contains:'ZERO_FIXTURE_PASSED'}}]});
test('benchmark requires explicit finite budgets and success criteria',()=>{
 assert.equal(validateManifest(valid()).repetitions,1);
 for(const modify of [m=>{delete m.budget;},m=>{m.budget.maxCalls=Infinity;},m=>{m.repetitions=0;},m=>{delete m.tasks[0].success;},m=>{m.tasks[0].success.contains='';}]){const m=valid();modify(m);assert.throws(()=>validateManifest(m));}
});
test('live routes require explicit API profiles and token capacities',()=>{
 const m=valid();m.fixture=false;assert.throws(()=>validateManifest(m));
 m.routes=m.routes.map(r=>({...r,profile:{api:'openai-completions',baseURL:'https://example.test/v1',apiKeyEnv:'TASK_API_KEY',models:[{id:r.model,contextWindow:32768,maxTokens:1024}]}}));assert.equal(validateManifest(m).fixture,false);
 m.routes[0].profile.baseURL='https://secret@example.test';assert.throws(()=>validateManifest(m));
});
test('success file checks cannot escape the copied workspace',()=>{
 const m=valid();m.tasks[0].success.files=[{path:'../../protected',contains:'x'}];assert.throws(()=>validateManifest(m));
});
