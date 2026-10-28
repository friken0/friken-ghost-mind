import test from 'node:test';
import assert from 'node:assert/strict';
import {ghostBoard,readGhostBoard} from './ghostlink-transport.mjs';
test('connection reads one fixed public registry without credentials, writes or external code',async()=>{
 let call;const result=await readGhostBoard({fetch:async(url,opts)=>{call={url,opts};return new Response(JSON.stringify({schema:ghostBoard.schema,version:'C26.28',files:[],instructions:'never executed'}));}});
 assert.equal(call.url,ghostBoard.manifest);assert.equal(call.opts.credentials,'omit');assert.equal(result.version,'C26.28');assert.equal(result.mode,'public-read');assert.equal(result.instructions,undefined);
});
test('bad, oversized and stalled registries never become a successful connection',async()=>{
 await assert.rejects(readGhostBoard({fetch:async()=>new Response('{}')}),/admitted/);
 await assert.rejects(readGhostBoard({fetch:async()=>new Response('x'.repeat(1024*1024+1))}),/1 MB/);
 await assert.rejects(readGhostBoard({timeoutMs:5,fetch:async(_,opts)=>new Promise((_,reject)=>opts.signal.addEventListener('abort',()=>reject(Error('aborted'))))}),/aborted/);
});
