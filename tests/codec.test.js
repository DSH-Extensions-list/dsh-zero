import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeText,decodeText} from '../src/codec.js';

for (const [name,input] of Object.entries({empty:'',lf:'a\nb\n',crlf:'a\r\na\r\n',cr:'a\ra\r',unicode:'한글 🙂\n'.repeat(100),tail:'x\nx',marker:'DSH-ZERO/1\n[900,"anything"]\n',block:'alpha\nbeta\ngamma\n'.repeat(100),mixed:'a\r\nb\rc\nlast'})) {
  test(`round trip ${name}`,()=>assert.equal(decodeText(encodeText(input)),input));
}
test('repeated blocks compress and preserve a unique diagnostic',()=>{
 const input='warning: repeated\ninfo: repeated\n'.repeat(300)+'ERROR: unique diagnostic\n';
 const encoded=encodeText(input); assert.ok(encoded.length<input.length/10); assert.equal(decodeText(encoded),input);
});
test('malformed records and expansion limits are refused',()=>{
 for(const text of ['bad','DSH-ZERO/1\n[[0,"x"]]','DSH-ZERO/1\n[[1.1,"x"]]','DSH-ZERO/1\n[[2,7]]','DSH-ZERO/1\n[[9999999999999999,"x"]]'])assert.throws(()=>decodeText(text));
 assert.throws(()=>decodeText('DSH-ZERO/1\n[[1000,"x"]]',{maxBytes:99}));
});
