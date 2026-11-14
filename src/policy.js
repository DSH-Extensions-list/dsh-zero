import {encodeText,decodeText,CODEC_HEADER} from './codec.js';
import {selectCandidate} from './selection.js';

export const DEFAULT_CONFIG={mode:'safe',counting:'estimated',minimumReduction:0.2,minimumBytes:4096,maximumBytes:16*1024*1024,maxArtifacts:1000};
const prepared=text=>text.includes(CODEC_HEADER)||/verbatim.*(?:saved at|copy)|\[spill:|spill locator|full.*(?:saved at|stored at)/i.test(text);

/** Policy owns only the text projection; the registry keeps values and identity. */
export function createPolicy({saveOriginal,record,resolveCounter,config}){
 return async function postExecute(exec,result,next){
  const decision=await next();
  const bypass=reason=>{record({reason,selected:false});return decision;};
  if(decision.kind!=='accept'||Object.hasOwn(decision,'value'))return decision;
  if(config.mode==='off')return decision;
  if(exec.signal.aborted)return bypass('aborted');
  if(exec.name==='read'||exec.name.startsWith('dsh_zero_'))return bypass('recovery-tool');
  if(exec.parent!==undefined)return bypass('nested-call');
  const owner=exec.agent?.session.header.id;if(owner===undefined)return bypass('missing-owner');
  const content=decision.content??result.content;
  if(content.length!==1||content[0].type!=='text')return bypass('unsupported-content');
  const original=content[0].text,bytes=Buffer.byteLength(original);
  if(prepared(original))return bypass('already-projected');
  if(bytes<config.minimumBytes||bytes>config.maximumBytes)return bypass('size-limit');
  // UTF-8 artifacts cannot retain unpaired UTF-16 surrogates literally.
  if(Buffer.from(original).toString('utf8')!==original)return bypass('invalid-unicode');
  const counter=resolveCounter(exec);
  if(config.counting==='exact-only'&&!counter)return bypass('missing-tokenizer');
  try{
   const encoded=encodeText(original);
   if(encoded.length>=original.length)return bypass('not-smaller');
   if(decodeText(encoded,{maxBytes:config.maximumBytes})!==original)return bypass('codec-mismatch');
   const artifact=await saveOriginal(exec,original);
   if(exec.signal.aborted)return bypass('aborted');
   const notice=`[DSH Zero: reversible [repeat count, literal text] records in original order. Full original: ${JSON.stringify(artifact.locator)}. ${artifact.retrievalHint}]\n`;
   const candidate=notice+encoded;
   const selection=selectCandidate({original,candidate,countTokens:counter,counting:config.counting,minimumReduction:config.minimumReduction});
   record({...selection,artifactId:artifact.id,sessionId:owner,originalBytes:bytes,retainedBytes:Buffer.byteLength(candidate),candidate,exec});
   if(!selection.selected)return decision;
   return {...decision,content:[{...content[0],text:candidate}]};
  }catch(error){return bypass(error?.code==='ENOSPC'?'storage-full':'projection-failed');}
 };
}
