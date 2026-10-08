export const estimateText=text=>Math.ceil(text.length/4);

/** Compare complete payloads; exact-mode errors always preserve original output. */
export function selectCandidate({original,candidate,countTokens,counting='estimated',minimumReduction=0.2}) {
 const basis=countTokens?'exact':'estimated',counter=countTokens??estimateText;
 if(!countTokens&&counting==='exact-only')return {selected:false,basis,reason:'missing-tokenizer'};
 try{
  const originalCount=counter(original),retainedCount=counter(candidate);
  if(![originalCount,retainedCount].every(n=>Number.isSafeInteger(n)&&n>=0))throw Error('Invalid token count');
  const selected=originalCount>0&&retainedCount<originalCount&&(basis==='exact'||retainedCount<=originalCount*(1-minimumReduction));
  return {selected,basis,originalCount,retainedCount,reason:selected?'selected':'not-smaller'};
 }catch{return {selected:false,basis,reason:'tokenizer-failed'};}
}

/** Explicit tokenizer capability: no model-name guesses or fallback to another route. */
export function createCounters(){
 const entries=new Map(),key=(provider,model)=>JSON.stringify([provider,model]);
 return {
  register(provider,model,counter){
   if(typeof provider!=='string'||typeof model!=='string'||typeof counter!=='function')throw Error('Invalid tokenizer registration');
   const id=key(provider,model);if(entries.has(id))throw Error('Tokenizer already registered');entries.set(id,counter);
   return ()=>{if(entries.get(id)===counter)entries.delete(id);};
  },
  resolve(provider,model){return entries.get(key(provider,model));},
 };
}
