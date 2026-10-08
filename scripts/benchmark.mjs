import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {validateManifest} from './benchmark-config.mjs';
import {connectHarness} from './harness.mjs';
const [manifestPath,outputPath='artifacts/benchmark.json']=process.argv.slice(2);
if(!manifestPath)throw Error('Usage: npm run benchmark -- manifest.json [report.json]');
const manifest=validateManifest(JSON.parse(await readFile(manifestPath,'utf8')));
// Validate the entire manifest before loading a provider or making any request.
connectHarness(process.env.DSH_SOURCE);const {runCase}=await import('./loop-case.mjs');
const cases=[];
for(let repetition=0;repetition<manifest.repetitions;repetition++)for(const route of manifest.routes)for(const task of manifest.tasks)for(const mode of ['off','safe','lean']){
 const resolvedTask={...task,fixtureWorkspace:task.fixtureWorkspace?resolve(dirname(resolve(manifestPath)),task.fixtureWorkspace):undefined};
 const result=await runCase({mode,route,task:resolvedTask,budget:manifest.budget,fixture:manifest.fixture});cases.push({...result,repetition});console.log(`${route.provider}/${route.model} ${task.name} ${mode}: ${result.success?'PASS':'FAIL'}`);
}
const report={schema:'dsh-zero-benchmark/1',createdAt:new Date().toISOString(),fixture:manifest.fixture,budget:manifest.budget,cases,limitations:['Fixture usage is synthetic; live usage is provider-reported.','Projection counts are not billing, cache or repeated-context savings.','Success markers and file checks require task-specific review.']};
await mkdir(dirname(resolve(outputPath)),{recursive:true});await writeFile(outputPath,JSON.stringify(report,null,2)+'\n');console.log(`Report: ${resolve(outputPath)}`);
if(cases.some(c=>!c.success))process.exitCode=1;
