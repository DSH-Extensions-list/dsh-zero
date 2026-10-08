import assert from 'node:assert/strict';
export async function checkRetries(runCase){
 const setup={mode:'safe',route:{provider:'fixture-retry',model:'fixture-retry'},task:{name:'retry',prompt:'Read fixture_output and report the unique diagnostic.',success:{contains:'ZERO_FIXTURE_PASSED'}},budget:{maxCalls:3,maxOutputTokens:1024,timeoutMs:10000},fixture:true,fixtureFailOnce:true};
 const recovered=await runCase(setup);assert.equal(recovered.success,true);assert.equal(recovered.retries,1);assert.equal(recovered.calls,3);
 const capped=await runCase({...setup,budget:{...setup.budget,maxCalls:2}});assert.equal(capped.success,false);assert.equal(capped.retries,1);assert.equal(capped.calls,2);assert.equal(capped.budgetExhausted,true);
 console.log('PASS native fail-once retry counted from durable events; call budget respected');
}
