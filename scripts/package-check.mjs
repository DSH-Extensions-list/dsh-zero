import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile),temp=await mkdtemp(join(tmpdir(),'dsh-zero-package-'));
try{
 const archive=resolve(process.argv[2]??'arzvaak-dsh-zero-0.1.0.tgz');
 const install=await exec('npm',['install','--prefix',temp,'--omit=dev','--ignore-scripts','--no-audit','--no-fund',archive],{timeout:60000});console.log(install.stdout.trim());
 const root=join(temp,'node_modules/@arzvaak/dsh-zero'),manifest=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
 assert.equal(manifest.dsh.bundle.patch,'cordis.patch.yml');assert.equal(manifest.exports['.'],'./lib/host.js');assert.ok(manifest.dsh.client.inject.includes('@deepseek-ai/dsh-api-remotes'));
 for(const target of Object.values(manifest.exports))await access(join(root,target));
 const result=await exec(process.execPath,['--expose-internals','scripts/composition.mjs'],{env:{...process.env,DSH_ZERO_PACKAGE_ROOT:root},timeout:60000});console.log(result.stdout.trim());console.log('DSH_ZERO_PACKAGE_OK');
}finally{await rm(temp,{recursive:true,force:true});}
