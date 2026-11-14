import {isAbsolute} from 'node:path';
const positive=(n,label,max=Number.MAX_SAFE_INTEGER)=>{if(!Number.isSafeInteger(n)||n<1||n>max)throw Error(`Invalid ${label}`);};
const string=(s,label)=>{if(typeof s!=='string'||!s.trim())throw Error(`Missing ${label}`);};
const localPath=p=>{string(p,'relative file path');if(isAbsolute(p)||p.split(/[\\/]/).includes('..'))throw Error('File path must stay in workspace');};
export function validateManifest(m){
 if(!m||typeof m.fixture!=='boolean')throw Error('Explicit fixture flag required');
 positive(m.repetitions,'repetitions',100);if(!m.budget)throw Error('Explicit budget required');
 positive(m.budget.maxCalls,'call budget',100);positive(m.budget.maxOutputTokens,'output budget',65536);positive(m.budget.timeoutMs,'time budget',3600000);
 if(!Array.isArray(m.routes)||!m.routes.length||!Array.isArray(m.tasks)||!m.tasks.length)throw Error('Routes and tasks required');
 for(const r of m.routes){string(r.provider,'provider');string(r.model,'model');if(!m.fixture){
  const p=r.profile;if(!p)throw Error('Live API profile required');string(p.api,'API');string(p.apiKeyEnv,'API key environment name');if(!/^[A-Z_][A-Z0-9_]*$/i.test(p.apiKeyEnv))throw Error('Invalid environment name');
  const url=new URL(p.baseURL);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error('Invalid API URL');
  if(!Array.isArray(p.models)||!p.models.some(v=>v.id===r.model))throw Error('Explicit model profile required');
  for(const v of p.models){string(v.id,'model ID');positive(v.contextWindow,'context window');positive(v.maxTokens,'model output capacity');}
 }}
 for(const t of m.tasks){string(t.name,'task name');string(t.prompt,'task prompt');string(t.success?.contains,'success marker');if(t.outputFile)localPath(t.outputFile);for(const f of t.success.files??[]){localPath(f.path);string(f.contains,'file success marker');}}
 return m;
}
