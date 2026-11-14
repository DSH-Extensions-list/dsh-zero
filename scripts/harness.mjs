import {registerHooks} from 'node:module';
import {globSync,readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

/** Test-only package resolution against one built checkout; no profile mutations. */
export function connectHarness(root){
 if(!root)throw Error('Set DSH_SOURCE to a built DeepSeek Harness checkout.');root=resolve(root);
 const packages=new Map();
 for(const file of [...globSync('packages/*/*/package.json',{cwd:root}),...globSync('vendor/*/package.json',{cwd:root})]){
  const manifest=JSON.parse(readFileSync(join(root,file),'utf8'));if(manifest.name)packages.set(manifest.name,{dir:join(root,file.slice(0,-13)),manifest});
 }
 const target=(entry)=>typeof entry==='string'?entry:entry?.default??entry?.import??entry?.node;
 registerHooks({resolve(specifier,context,next){
  const parts=specifier.split('/'),name=specifier.startsWith('@')?parts.slice(0,2).join('/'):parts[0],sub=specifier.slice(name.length),row=packages.get(name);
  if(row){let entry=target(row.manifest.exports?.[sub?'.'+sub:'.']);if(!entry&&!sub)entry=row.manifest.main;
   if(entry){const path=join(row.dir,entry);if(!existsSync(path))throw Error(`Build Harness first: missing ${path}`);return{url:pathToFileURL(path).href,shortCircuit:true};}
  }
  return next(specifier,context);
 }});
 return {root,importFile:relative=>import(pathToFileURL(join(root,relative)).href),packagePath:name=>packages.get(name)?.dir};
}
