import test from 'node:test';
import assert from 'node:assert/strict';
import {compileSubtitleCues,subtitleFrame,createSubtitleTrack} from './subtitle-cues.mjs';

test('fixed phrase cues preserve decimal targets, abbreviations and source punctuation',()=>{
 const text='Dr. Else sets the target to19.54. “Who gets to choose?”\n\nFriken.Ghost replies: you do, mofker!';
 const compiled=compileSubtitleCues(text),cues=compiled.cues;
 assert.equal(cues.length,3);
 assert.equal(cues[0].lines[0].text,'Dr. Else sets the target to19.54.');
 assert.equal(cues[1].lines[0].text,'“Who gets to choose?”');
 assert.equal(cues[2].lines[0].text,'Friken.Ghost replies: you do, mofker!');
 for(const cue of cues){assert.equal(text[cue.start],cue.lines[0].text[0]);assert.equal(text.slice(cue.start,cue.end).replace(/\s+/g,' '),cue.lines.map(l=>l.text).join(' '));}
});

test('every visible glyph keeps its original UTF16 offset without repeats or missing long words',()=>{
 const text='   First\tword '+('longword'.repeat(42))+' 🙂 final\n\nSecond phrase.';
 const compiled=compileSubtitleCues(text,{columns:32,rows:3});
 assert.ok(compiled.cues.length>4);
 const visible=compiled.cues.flatMap(c=>c.lines).map(l=>l.text).join('').replace(/\s/g,'');
 assert.equal(visible,text.replace(/\s/g,''));
 let last=0;
 for(const cue of compiled.cues){assert.ok(cue.start>=last);last=cue.end;assert.ok(cue.lines.length<=3);for(const line of cue.lines){const glyphs=Array.from(line.text);assert.ok(glyphs.length<=32);assert.equal(glyphs.length,line.offsets.length);for(let i=0;i<glyphs.length;i++){assert.ok(line.offsets[i]>=line.start&&line.offsets[i]<=line.end);if(glyphs[i]!==' ')assert.equal(text.slice(line.offsets[i]-glyphs[i].length,line.offsets[i]),glyphs[i]);}}}
 const emoji=text.indexOf('🙂');assert.equal(subtitleFrame(compiled,emoji+1).index,emoji,'never highlight half of a surrogate pair');
});

test('a phrase is held through its punctuation and whitespace until the next phrase is actually heard',()=>{
 const text='First sentence.  Second sentence!';
 const c=compileSubtitleCues(text),next=c.cues[1].start;
 assert.equal(subtitleFrame(c,0).cueIndex,0);
 assert.equal(subtitleFrame(c,c.cues[0].end).cueIndex,0);
 assert.equal(subtitleFrame(c,next).cueIndex,0);
 assert.equal(subtitleFrame(c,next+1).cueIndex,1);
 assert.equal(subtitleFrame(c,text.length).lines[0].spoken,'Second sentence!'.length);
});

test('long-sentence pages never rewrap or move a glyph as playback advances through them',()=>{
 const text=Array.from({length:85},(_,i)=>'word'+i).join(' ')+'.';
 const compiled=compileSubtitleCues(text,{columns:28,rows:3});assert.ok(compiled.cues.length>=5);
 const positions=new Map();let previous=-1;
 for(let n=0;n<=text.length;n++){
  const f=subtitleFrame(compiled,n);assert.ok(f.cueIndex>=previous);previous=f.cueIndex;
  const key=f.cueIndex,layout=f.lines.map(l=>({text:l.text,start:l.start,end:l.end}));
  if(positions.has(key))assert.deepEqual(layout,positions.get(key));else positions.set(key,layout);
  for(const line of f.lines)assert.equal(line.spoken,line.offsets.filter(end=>end<=n).length);
 }
 assert.equal(positions.size,compiled.cues.length);
});

test('waiting/failure cannot replace the heard page or advance an unheard source/role',()=>{
 const track=createSubtitleTrack(),text='Keep this sentence. Do not erase it while I load.';
 assert.equal(track.update({text,index:0,state:'waiting'}),null);
 const first=track.update({text,index:0,state:'speaking'}),compiled=track.compiled;
 assert.equal(first.lines[0].spoken,0);
 const heard=track.update({text,index:19,state:'speaking'});
 assert.equal(track.compiled,compiled,'source is compiled once, not per progress update');
 assert.equal(track.update({text:'Unheard replacement.',speaker:'ELSE',field:'companion',index:19,state:'waiting'}),heard);
 assert.equal(track.update({text:'Unheard replacement.',speaker:'ELSE',field:'companion',index:20,state:'complete'}),heard);
 assert.equal(track.update({text,index:2,state:'speaking'}).index,heard.index,'late progress cannot rewind');
 const final=track.update({text,index:text.length,state:'complete'});
 assert.equal(track.update({text,index:0,state:'waiting'}),final,'queue preparation keeps completed cue');
 const elseFrame=track.update({text:'My turn now.',speaker:'ELSE',field:'companion',index:0,state:'speaking'});
 assert.equal(elseFrame.speaker,'ELSE');assert.equal(elseFrame.lines[0].spoken,0);
 assert.equal(track.update({text,index:text.length,state:'complete'}),elseFrame,'late old-speaker finish cannot steal the display');
});

test('an actual replay resets the same source, duplicate progress is stable and clear revokes old completion',()=>{
 const track=createSubtitleTrack(),text='Again, with feeling.';
 track.update({text,state:'speaking',index:0});const final=track.update({text,state:'complete',index:text.length});
 assert.equal(track.update({text,state:'complete',index:text.length}),final);
 const replay=track.update({text,state:'speaking',index:0});assert.equal(replay.index,0);assert.equal(replay.lines[0].spoken,0);
 track.clear();assert.equal(track.frame,null);assert.equal(track.update({text,state:'complete',index:text.length}),null);
});

test('admission and maximum-length work are bounded without timers or automatic progress',()=>{
 assert.throws(()=>compileSubtitleCues('a'.repeat(32001)),/32000/);
 assert.throws(()=>compileSubtitleCues('bounded',{columns:77}),/grid/);
 assert.throws(()=>compileSubtitleCues('bounded',{rows:4}),/grid/);
 assert.throws(()=>createSubtitleTrack().update({text:'x',state:'invented'}),/Unknown/);
 const source=('Word '.repeat(6399)+'end.').slice(0,32000),compiled=compileSubtitleCues(source);
 assert.ok(compiled.cues.length<200);assert.ok(compiled.cues.every(c=>c.lines.length<=3&&c.lines.every(l=>l.offsets.length<=76)));
 assert.equal(subtitleFrame(compiled,0).index,0);
});

test('rolling captions keep the heard predecessor above one anchored current line and hold during waits',async()=>{
 const {createRollingSubtitleTrack}=await import('./subtitle-cues.mjs'),t=createRollingSubtitleTrack({columns:24}),text='The first line stays here. The second line arrives. Then the third.';
 const first=t.update({text,index:1});assert.equal(first.lines[0],null);assert.ok(first.lines[1].text.startsWith('The first'));
 const next=t.update({text,index:32});assert.equal(next.lines[0].text,first.lines[1].text);assert.equal(next.lines[0].spoken,first.lines[1].text.length);assert.notEqual(next.lines[1].text,first.lines[1].text);
 const wait=t.update({text:'unheard',index:100,state:'waiting'});assert.deepEqual(wait.lines,next.lines);assert.equal(wait.index,next.index);
});
