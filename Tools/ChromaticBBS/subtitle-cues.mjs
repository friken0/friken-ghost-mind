/* Fixed subtitle pages, compiled once from original UTF-16 speech offsets.
 * The caller supplies actual playback progress; this module owns no clock,
 * playback estimate, renderer or automatic advance. */
const abbreviations=new Set(['mr.','mrs.','ms.','dr.','prof.','sr.','jr.','st.','vs.','etc.','e.g.','i.e.','a.m.','p.m.']);
const safeGlyph=char=>/[\x00-\x1f\x7f]/.test(char)?' ':char;
const clampIndex=(text,index)=>{
 let at=Math.max(0,Math.min(text.length,Number.isFinite(index)?Math.floor(index):0));
 if(at>0&&/[\uDC00-\uDFFF]/.test(text[at]||''))at--;
 return at;
};

function phrases(text){
 const ranges=[];let start=0,tokenStart=0;
 const flush=end=>{if(/\S/.test(text.slice(start,end)))ranges.push({start,end});start=end;};
 for(let i=0;i<text.length;i++){
  const char=text[i];
  if(/\s/.test(char))tokenStart=i+1;
  if(char==='\n'){
   const gap=/^\n[\t \r]*\n(?:\s*)/.exec(text.slice(i));
   if(gap){flush(i);i+=gap[0].length-1;start=i+1;tokenStart=start;}
   continue;
  }
  if(!/[.!?…]/.test(char))continue;
  let end=i+1;while(end<text.length&&/[.!?…"'”’\])}]/.test(text[end]))end++;
  if(end<text.length&&!/\s/.test(text[end]))continue;
  if(char==='.'){
   const token=text.slice(tokenStart,i+1).replace(/^[“"'([{]+/,'').toLowerCase();
   if(abbreviations.has(token)||/^(?:[a-z]\.){2,}$/.test(token)||/^[a-z]\.$/.test(token))continue;
  }
  flush(end);i=end-1;
 }
 flush(text.length);return ranges;
}

function wrapRange(text,range,columns){
 const lines=[];let cells=[];
 const flush=()=>{if(cells.length){lines.push({start:cells[0].start,end:cells.at(-1).end,text:cells.map(c=>c.glyph).join(''),offsets:cells.map(c=>c.end)});cells=[];}};
 for(const token of text.slice(range.start,range.end).matchAll(/\S+/gu)){
  const start=range.start+token.index;let offset=start;
  const word=Array.from(token[0],glyph=>{const cell={glyph:safeGlyph(glyph),start:offset,end:offset+glyph.length};offset=cell.end;return cell;});
  if(cells.length&&cells.length+1+word.length>columns)flush();
  if(cells.length)cells.push({glyph:' ',start:cells.at(-1).end,end:start});
  for(const cell of word){if(cells.length===columns)flush();cells.push(cell);}
 }
 flush();return lines;
}

export function compileSubtitleCues(text,{columns=76,rows=3,phraseBreaks=true}={}){
 if(typeof text!=='string'||text.length>32000)throw Error('Subtitle source must be a string of at most32000 characters');
 if(!Number.isInteger(columns)||columns<16||columns>76||!Number.isInteger(rows)||rows<1||rows>3)throw Error('Subtitle grid must fit16..76 columns and1..3 rows');
 const cues=[];
 for(const range of phraseBreaks?phrases(text):[{start:0,end:text.length}]){
  const lines=wrapRange(text,range,columns);
  for(let i=0;i<lines.length;i+=rows){const page=lines.slice(i,i+rows);cues.push({start:page[0].start,end:page.at(-1).end,lines:page});}
 }
 return {text,columns,rows,cues};
}

export function subtitleFrame(compiled,index,{speaker='GHOST',field='ghost',state='speaking'}={}){
 const at=clampIndex(compiled.text,index),cues=compiled.cues;
 let lo=0,hi=cues.length;
 // An index is the number of heard source characters. At the first character
 // of the next phrase (not yet heard), keep the preceding phrase in place.
 while(lo<hi){const mid=(lo+hi)>>1;if(cues[mid].start<at)lo=mid+1;else hi=mid;}
 const cueIndex=cues.length?Math.max(0,lo-1):-1,cue=cues[cueIndex]||null;
 const lines=(cue?.lines||[]).map(line=>{let spoken=0;while(spoken<line.offsets.length&&line.offsets[spoken]<=at)spoken++;return {...line,spoken};});
 return {speaker,field,state,index:at,cueIndex,cue,lines,complete:state==='complete'};
}

/** Waiting/failure preserves the last heard page. Only actual speaking can
 * admit a new source/role. Complete belongs to the currently admitted source. */
export function createSubtitleTrack(options){
 let compiled=null,source=null,snapshot=null;
 return {
  update({text,field='ghost',speaker='GHOST',index=0,state='speaking'}={}){
   if(!['speaking','complete','waiting'].includes(state))throw Error('Unknown subtitle playback state');
   if(state==='waiting')return snapshot;
   if(typeof text!=='string')throw Error('Exact subtitle source required');
   const same=source?.text===text&&source.field===field&&source.speaker===speaker;
   if(state==='complete'&&!same)return snapshot;
   const at=clampIndex(text,index),restart=state==='speaking'&&same&&at===0&&(snapshot?.index||0)>0;
   if(!same||restart){compiled=compileSubtitleCues(text,options);source={text,field,speaker};snapshot=null;}
   const nextIndex=Math.max(snapshot?.index||0,at);
   if(snapshot?.index===nextIndex&&snapshot.state===state)return snapshot;
   snapshot=subtitleFrame(compiled,nextIndex,{speaker,field,state});return snapshot;
  },
  clear(){compiled=source=snapshot=null;},
  get frame(){return snapshot;},
  get compiled(){return compiled;}
 };
}

/** One immutable current line, with its completed predecessor above it. */
export function createRollingSubtitleTrack({columns=76}={}){
 const base=createSubtitleTrack({columns,rows:1,phraseBreaks:false});
 return {update(input){const frame=base.update(input);if(!frame)return null;const previous=base.compiled.cues[frame.cueIndex-1]?.lines[0];return {...frame,lines:[previous?{...previous,spoken:Array.from(previous.text).length}:null,frame.lines[0]||null]};},clear(){base.clear();},get frame(){return base.frame;}};
}
