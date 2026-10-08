export const CODEC_HEADER = 'DSH-ZERO/1\n';

/** Ordered [repeat count, literal text] records; literals retain line terminators. */
export function encodeText(text) {
 const lines=text.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g).filter(Boolean), records=[];
 let literal='';
 const flush=()=>{if(literal){records.push([1,literal]);literal='';}};
 for(let i=0;i<lines.length;){
  let best={width:0,count:0,gain:0};
  for(let width=1;width<=8&&i+width*2<=lines.length;width++){
   let count=1;
   outer: while(i+(count+1)*width<=lines.length){
    for(let j=0;j<width;j++)if(lines[i+j]!==lines[i+count*width+j])break outer;
    count++;
   }
   if(count>1){const block=lines.slice(i,i+width).join(''),gain=block.length*(count-1)-16;if(gain>best.gain)best={width,count,gain};}
  }
  if(best.width){flush();records.push([best.count,lines.slice(i,i+best.width).join('')]);i+=best.width*best.count;}
  else literal+=lines[i++];
 }
 flush();return CODEC_HEADER+JSON.stringify(records);
}

/** Decode with a byte cap before allocation. */
export function decodeText(encoded,{maxBytes=64*1024*1024}={}) {
 if(!Number.isSafeInteger(maxBytes)||maxBytes<0)throw Error('Invalid expansion cap');
 if(!encoded.startsWith(CODEC_HEADER))throw Error('Unknown codec');
 const records=JSON.parse(encoded.slice(CODEC_HEADER.length));if(!Array.isArray(records))throw Error('Invalid records');
 let bytes=0;const output=[];
 for(const row of records){
  if(!Array.isArray(row)||row.length!==2||!Number.isSafeInteger(row[0])||row[0]<1||typeof row[1]!=='string'||row[1].length===0)throw Error('Invalid codec record');
  const added=Buffer.byteLength(row[1])*row[0];if(!Number.isSafeInteger(added)||added>maxBytes-bytes)throw Error('Expansion cap exceeded');
  bytes+=added;output.push(row[1].repeat(row[0]));
 }
 return output.join('');
}
