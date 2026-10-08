import {randomUUID} from 'node:crypto';

const bucket=()=>({original:0,retained:0,grossReduction:0,recovery:0,netProjectionReduction:0});
export class ServiceState {
 constructor({readRange,maxArtifacts=1000}){
  this.readRange=readRange;this.maxArtifacts=maxArtifacts;this.artifacts=new Map();this.startedAt=new Date().toISOString();
  this.stats={scope:'host-activation',startedAt:this.startedAt,selected:0,originalBytes:0,retainedBytes:0,viewerBytes:0,modelRecoveryBytes:0,estimated:bucket(),exact:bucket(),bypass:{}};
 }
 addArtifact({sessionId,locator,bytes,toolName}){
  const item={id:randomUUID(),sessionId,locator,bytes,toolName,createdAt:new Date().toISOString()};this.artifacts.set(item.id,item);
  while(this.artifacts.size>this.maxArtifacts){this.artifacts.delete(this.artifacts.keys().next().value);if(this.stats.selected)this.incomparable=true;}
  return item;
 }
 record(entry){
  if(!entry.selected){const reason=entry.reason??'unknown';this.stats.bypass[reason]=(this.stats.bypass[reason]??0)+1;return;}
  this.stats.selected++;this.stats.originalBytes+=entry.originalBytes;this.stats.retainedBytes+=entry.retainedBytes;
  const b=this.stats[entry.basis];b.original+=entry.originalCount;b.retained+=entry.retainedCount;b.grossReduction=b.original-b.retained;b.netProjectionReduction=b.grossReduction-b.recovery;
 }
 recordRecovery({basis,count,bytes,source,comparable=true}){
  if(source==='viewer'){this.stats.viewerBytes+=bytes;return;}
  if(!comparable)this.incomparable=true;
  this.stats.modelRecoveryBytes+=bytes;const b=this.stats[basis];b.recovery+=count;b.netProjectionReduction=b.grossReduction-b.recovery;
 }
 snapshot(){const view=structuredClone(this.stats);if(this.incomparable){view.exact.netProjectionReduction=null;view.estimated.netProjectionReduction=null;}return view;}
 listArtifacts(sessionId='',cursor=0){
  if(typeof sessionId!=='string'||!Number.isSafeInteger(cursor)||cursor<0)throw Error('Invalid artifact listing');
  const entries=[...this.artifacts.values()].filter(a=>!sessionId||a.sessionId===sessionId).reverse();
  const items=entries.slice(cursor,cursor+50).map(({locator,...item})=>item);
  return {items,nextCursor:cursor+items.length<entries.length?cursor+items.length:null};
 }
 findByLocator(locator){return [...this.artifacts.values()].find(a=>a.locator===locator);}
 async readArtifact(sessionId,id,offset,length,signal){
  const a=this.artifacts.get(id);if(!a||a.sessionId!==sessionId)throw Error('Unknown artifact for this session');
  if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(length)||length<4||length>65536)throw Error('Invalid byte range (length 4–65536)');
  if(signal?.aborted)throw Error('Read cancelled');
  const bytes=await this.readRange(a.locator,offset,length,signal);if(signal?.aborted)throw Error('Read cancelled');
  if(!(bytes instanceof Uint8Array)||bytes.length>length)throw Error('Invalid range result');
  if(bytes.length&&bytes[0]>=0x80&&bytes[0]<0xC0)throw Error('Offset is not a UTF-8 boundary');
  let text,end=bytes.length;
  for(let trim=0;trim<=3;trim++){
   try{text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes.subarray(0,end));break;}catch(error){if(trim===3||end===0)throw error;end--;}
  }
  if(bytes.length&&end===0)throw Error('Invalid UTF-8 artifact');
  this.recordRecovery({bytes:end,source:'viewer'});
  return {text,nextOffset:offset+end,eof:offset+end>=a.bytes,totalBytes:a.bytes,sessionId:a.sessionId};
 }
}
