import {build} from 'esbuild';
import {readFile,mkdir} from 'node:fs/promises';
const pkg=JSON.parse(await readFile('package.json','utf8'));await mkdir('lib',{recursive:true});
await build({entryPoints:['src/host.ts'],outfile:'lib/host.js',bundle:true,format:'esm',platform:'node',target:'es2022',external:['@deepseek-ai/*','zod'],legalComments:'eof'});
await build({entryPoints:['src/remote.js'],outfile:'lib/remote.js',bundle:true,format:'esm',platform:'neutral',target:'es2022',external:['zod']});
await build({entryPoints:['src/client.tsx'],outfile:'lib/client.js',bundle:true,format:'cjs',platform:'browser',target:'es2022',jsx:'automatic',external:['react','react/jsx-runtime','react-dom'],legalComments:'eof',banner:{js:`window.__ModuleLoader__.load({id:${JSON.stringify(pkg.name)},factory(require){const module={exports:{}};const exports=module.exports;`},footer:{js:'return module.exports;}});'}});
console.log('Built native host, strict Remote contribution, and DSH client factory.');
