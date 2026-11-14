import React,{useEffect,useRef,useState} from 'react';
import {ZeroController} from './controller.js';
import {TYPERT_REMOTE} from './remote.js';
import css from './style.js';

export const inject=['slots','remote','remote.settings'];
export function apply(ctx){
 ctx.effect(()=>{const style=document.createElement('style');style.dataset.plugin='dsh-zero';style.textContent=css;document.head.append(style);return()=>style.remove();});
 ctx.effect(async function*(){
  yield await ctx.remote.$mount(TYPERT_REMOTE);
  const fiber=ctx.inject(['remote.dshZero'],scope=>{scope.slots.inject('settings.section',()=>scope.slots.register({name:'settings.section',id:'dsh-zero',order:86,label:'DSH Zero',inject:()=>({controller:new ZeroController(scope.remote)})},ZeroPanel));});
  await fiber;yield()=>fiber.dispose();
 });
}
const number=n=>Number(n??0).toLocaleString();
const bytes=n=>n<1024?`${n} B`:n<1024*1024?`${(n/1024).toFixed(1)} KiB`:`${(n/1024/1024).toFixed(1)} MiB`;
export function ZeroPanel({controller}){
 const [view,setView]=useState(null),[mode,setMode]=useState('safe'),[counting,setCounting]=useState('estimated'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[viewer,setViewer]=useState(null);
 const alive=useRef(false),generation=useRef(0);
 useEffect(()=>{alive.current=true;const g=++generation.current;controller.load().then(v=>{if(alive.current&&g===generation.current){setView(v);setMode(v.config.mode);setCounting(v.config.counting);}}).catch(e=>{if(alive.current&&g===generation.current)setError(e.message);});return()=>{alive.current=false;generation.current++;};},[controller]);
 const run=async action=>{const g=++generation.current;setBusy(true);setError('');setNotice('');try{const commit=await action();if(alive.current&&g===generation.current)commit?.();}catch(e){if(alive.current&&g===generation.current)setError(e.message);}finally{if(alive.current&&g===generation.current)setBusy(false);}};
 const loadView=async()=>{const v=await controller.load();return()=>{setView(v);setMode(v.config.mode);setCounting(v.config.counting);};};
 const show=artifact=>run(async()=>{const page=await controller.read(artifact,0);return()=>setViewer({artifact,text:page.text,offset:page.nextOffset,eof:page.eof});});
 return <article className="dz-root">
  <header><div><h2>DSH Zero</h2><p>Keep useful output. Spend less context on repetition.</p></div><button disabled={busy} onClick={()=>run(loadView)}>Refresh</button></header>
  {error&&<p className="dz-error" role="alert">{error}</p>}{notice&&<p className="dz-notice" role="status">{notice}</p>}
  <section><h3>How it works</h3><form onSubmit={e=>{e.preventDefault();run(async()=>{const v=await controller.save(mode,counting);return()=>{setView(v);setNotice('Changes saved. New tool calls use this mode.');};});}}>
   <fieldset disabled={busy||!view||!view.writable}><div className="dz-controls">
    <label>Mode<select value={mode} onChange={e=>setMode(e.target.value)}><option value="off">Off</option><option value="safe">Safe</option><option value="lean">Lean</option></select></label>
    <label>Counting<select value={counting} onChange={e=>setCounting(e.target.value)}><option value="estimated">Estimated · any model</option><option value="exact-only">Exact only · known tokenizer</option></select></label>
    <button className="dz-primary" type="submit">Save changes</button></div>
   </fieldset>
   <p className="dz-help">Safe compresses repeated output and saves the original. Lean also encourages targeted reads and concise work. Exact only keeps the original when your model has no registered tokenizer.</p>
   {view&&!view.writable&&<p role="status">Settings are read-only on this host.</p>}
  </form></section>
  <section><h3>Context saved</h3>{!view?<p role="status">Loading savings…</p>:<>
   <p className="dz-stats-caption">Since this plugin started: {number(view.stats.selected)} results compressed. {bytes(view.stats.originalBytes)} became {bytes(view.stats.retainedBytes)}.</p>
   <table className="dz-table"><thead><tr><th>Measurement</th><th>Gross reduction</th><th>Recovery overhead</th><th>Net projection reduction</th></tr></thead><tbody>
    <tr><th>Estimated token reduction</th><td>{number(view.stats.estimated.grossReduction)}</td><td>{number(view.stats.estimated.recovery)}</td><td>{view.stats.estimated.netProjectionReduction===null?'Unavailable':number(view.stats.estimated.netProjectionReduction)}</td></tr>
    <tr><th>Exact token reduction</th><td>{number(view.stats.exact.grossReduction)}</td><td>{number(view.stats.exact.recovery)}</td><td>{view.stats.exact.netProjectionReduction===null?'Unavailable':number(view.stats.exact.netProjectionReduction)}</td></tr>
   </tbody></table>
   <p className="dz-help">These measure tool-output projections. Estimates use text length; they are not provider usage or billing savings. Cache cost and billed savings: unavailable. Viewer reads do not enter model context. Net is unavailable after recovery with a different counting basis or tokenizer.</p>
   <details><summary>Why some results stay unchanged</summary><ul>{Object.entries(view.stats.bypass).map(([reason,count])=><li key={reason}>{reason.replaceAll('-',' ')}: {number(count)}</li>)}</ul></details>
  </>}</section>
  <section><h3>Saved originals</h3><p className="dz-help">Originals from this plugin activation. Models can recover them with their normal file tools.</p>
   {view?.artifacts.items.length?<ul className="dz-artifacts">{view.artifacts.items.map(a=><li key={a.id}><span>{a.toolName}<small>{bytes(a.bytes)} · {a.createdAt}</small></span><button disabled={busy} onClick={()=>show(a)}>View original</button></li>)}</ul>:<p>No saved originals yet. Repetitive output will appear here when it is eligible for compression.</p>}
   {view?.artifacts.nextCursor!==null&&view?.artifacts.nextCursor!==undefined&&<button disabled={busy} onClick={()=>run(async()=>{const page=await controller.list(view.artifacts.nextCursor);return()=>setView({...view,artifacts:{items:[...view.artifacts.items,...page.items],nextCursor:page.nextCursor}});})}>More originals</button>}
   {viewer&&<div><div className="dz-view-heading"><h4>{viewer.artifact.toolName} original</h4><button onClick={()=>setViewer(null)}>Close output</button></div><pre tabIndex={0}>{viewer.text}</pre>{!viewer.eof&&<button disabled={busy} onClick={()=>run(async()=>{const page=await controller.read(viewer.artifact,viewer.offset);return()=>setViewer({...viewer,text:page.text,offset:page.nextOffset,eof:page.eof});})}>Next page</button>}<p className="dz-help">Read through byte {number(viewer.offset)}. Pages replace the view to keep large output manageable.</p></div>}
  </section>
 </article>;
}
