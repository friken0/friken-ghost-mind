import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {ansiFontData,ansiFontFamily,intersectAnsiRects,ansiVisibleClip} from './ansi-ui.mjs';
test('offline ANSI font is the exact licensed source WOFF rather than a missing runtime URL',()=>{
 const original=fs.readFileSync(new URL('./vendor/ansi-ui/WebPlus_IBM_VGA_8x16.woff',import.meta.url)),embedded=Buffer.from(ansiFontData.split(',')[1],'base64');assert.deepEqual(embedded,original);assert.equal(embedded.subarray(0,4).toString(),'wOFF');assert.equal(crypto.createHash('sha256').update(embedded).digest('hex'),'4823e093c7f2f69641eaafb6f3465185afa63877cda58d341b6b317fd53dfd1f');assert.equal(ansiFontFamily,'GhostVGA');assert.match(fs.readFileSync(new URL('./vendor/ansi-ui/LICENSE.TXT',import.meta.url),'utf8'),/Attribution-ShareAlike 4.0 International/);
});
test('nested scroll surfaces clip visible glyphs at both the node and its ancestors',()=>{
 const previous=globalThis.getComputedStyle,rect=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height}),node=(r,parent=null,extra={})=>({parentElement:parent,getBoundingClientRect:()=>r,style:{display:'block',visibility:'visible',opacity:'1',overflow:'visible',overflowX:'visible',overflowY:'visible',...extra}});
 try{globalThis.getComputedStyle=el=>el.style;const root=rect(0,0,800,600),scroll=node(rect(20,100,500,120),null,{overflowY:'auto'}),text=node(rect(10,50,600,300),scroll);assert.deepEqual(ansiVisibleClip(text,root),rect(20,100,500,120));scroll.style.visibility='hidden';assert.equal(ansiVisibleClip(text,root),null);scroll.style.visibility='visible';scroll.style.opacity='0';assert.equal(ansiVisibleClip(text,root),null);assert.equal(intersectAnsiRects(root,rect(900,0,10,10)),null);
 }finally{if(previous)globalThis.getComputedStyle=previous;else delete globalThis.getComputedStyle;}
});
