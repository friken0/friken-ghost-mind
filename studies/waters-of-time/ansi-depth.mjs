/** Optional depth metadata for retained ANSI foregrounds.
 * 0 is the art plane. Positive ink draws nearer, negative ink farther away.
 * The host supplies parallax in normalized artwork coordinates. */
export function createAnsiDepthQueue(offset=[0,0]){
 const commands=[];
 function add(depth,draw){
  if(!Number.isFinite(depth)||depth< -1||depth>1||typeof draw!=='function')
   throw Error('ANSI depth must be between -1 and 1');
  commands.push({depth,draw});
 }
 function flush(){
  commands.sort((a,b)=>a.depth-b.depth);
  for(const {depth,draw} of commands)draw(offset[0]*depth,offset[1]*depth);
  commands.length=0;
 }
 return {add,flush};
}
