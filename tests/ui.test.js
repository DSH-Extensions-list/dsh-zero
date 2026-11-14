import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
test('UI shows honest counts, literal output, and ignores completed requests after unmount',async()=>{
 const result=await build({entryPoints:['src/client.tsx'],bundle:true,write:false,format:'esm',platform:'node',external:['react','react-dom','react/jsx-runtime']});
 // Use a temporary module under this project so React resolves to the same instance.
 const {writeFile,rm}=await import('node:fs/promises');await writeFile('tests/.client-fixture.mjs',result.outputFiles[0].text);
 const {ZeroPanel}=await import('./.client-fixture.mjs');
 const dom=new JSDOM('<div id="root"></div>');const previous={window:globalThis.window,document:globalThis.document,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
 const root=createRoot(document.getElementById('root'));let resolveLoad;
 const stats={scope:'host-activation',startedAt:'now',selected:1,originalBytes:10000,retainedBytes:1000,viewerBytes:0,modelRecoveryBytes:0,estimated:{grossReduction:2000,recovery:100,netProjectionReduction:1900},exact:{grossReduction:0,recovery:0,netProjectionReduction:0},bypass:{}};
 const controller={load:async()=>({config:{mode:'safe',counting:'estimated'},writable:true,stats,artifacts:{items:[{id:'id',sessionId:'s',toolName:'shell',bytes:100,createdAt:'now'}],nextCursor:null}}),read:async()=>({text:'<script>window.pwned=true</script>',nextOffset:35,eof:true})};
 try{
  await act(async()=>root.render(React.createElement(ZeroPanel,{controller})));
  assert.match(document.body.textContent,/Estimated token reduction/);assert.match(document.body.textContent,/Exact token reduction/);assert.match(document.body.textContent,/Since this plugin started/);
  await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='View original').click());assert.equal(document.querySelector('pre').textContent,'<script>window.pwned=true</script>');assert.equal(document.querySelector('script'),null);
  controller.load=()=>new Promise(resolve=>{resolveLoad=resolve;});await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Refresh').click());await act(async()=>root.unmount());await act(async()=>resolveLoad({config:{},stats,artifacts:{items:[]}}));
 }finally{dom.window.close();Object.assign(globalThis,previous);await rm('tests/.client-fixture.mjs',{force:true});}
});
