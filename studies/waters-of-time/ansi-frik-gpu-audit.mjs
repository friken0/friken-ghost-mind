import {crossingPort} from './lancing-route.mjs?v=lancing-2';
import {renderFrikMindRows} from './ansi-frik-mind.mjs?v=lancing-2';
// Explicit accuracy diagnostic. Its readback is deliberately outside playback.
export async function auditFrikGpu(gpu,artwork,{deep=false}={}){
 const rows=[],columns=deep?970:128,height=deep?564:74;let buffer;
 const poses=[...Array.from({length:7},(_,scene)=>({scene,centerX:.5,centerY:.5,zoom:0})),
  {scene:0,centerX:.49312,centerY:.128886,zoom:2.1},
  {scene:0,centerX:.49312,centerY:.128886,zoom:3.8},
  {scene:0,centerX:.728,centerY:.603,zoom:4},{scene:1,centerX:.182,centerY:.232,zoom:4},
  {scene:2,centerX:.232,centerY:.586,zoom:4},{scene:4,centerX:.797,centerY:.354,zoom:4},
  {scene:3,centerX:.599,centerY:.779,zoom:4},{scene:5,centerX:.19,centerY:.705,zoom:4},
  ...[0,1,3,6].map(prologue=>{
   const p=crossingPort(prologue,12.75);
   return {scene:0,prologue,centerX:p.x,centerY:p.y,zoom:-Math.log2(p.span),travel:1};
  }),
  ...[1.2,5.9,9.7,14.4,18].map(beatAge=>({scene:0,prologue:4,beatAge,zoom:1,centerX:.55,centerY:.4})),
  ...Array.from({length:8},(_,prologue)=>({scene:0,prologue,centerX:.5,centerY:.5,zoom:0}))];
 for(let trip=0;trip<3;trip++)for(const pose of poses.filter(p=>(p.prologue==null||trip===0)&&(!deep||[0,3,4].includes(p.scene))))for(const effects of deep?[true]:[false,true]){
  const spec={columns,rows:height,shot:{...pose,trip,roomAim:[.087,-.061],swing:effects?.7:0,motionSeed:1978,audio:[.2,.15,.1,.25,.04]},time:12.75,effects,pass:8,stamp:['audit',trip,pose.scene,pose.zoom,pose.prologue??-1,pose.beatAge??7,effects].join('/')};
  let frame;
  for(let retry=0;retry<120;retry++){
   gpu.poll();frame=gpu.use(spec);if(frame?.spec.stamp===spec.stamp)break;
   await new Promise(resolve=>requestAnimationFrame(resolve));
  }
  if(frame?.spec.stamp!==spec.stamp)throw Error('GPU accuracy diagnostic timed out');
  const actual=gpu.read(0,0,columns,height);
  const expected=renderFrikMindRows(artwork,spec,0,height,buffer);buffer=expected.buffer;
  const bytes=new Uint8Array(expected.buffer),errors=[];let sum=0,max=0,pixels=0;
  for(let y=0;y<height;y++)for(let x=0;x<columns;x++){
   let error=0;
   for(let c=0;c<3;c++){
    const delta=Math.abs(actual[((height-1-y)*columns+x)*4+c]-bytes[(y*columns+x)*4+c]);
    sum+=delta;max=Math.max(max,delta);error=Math.max(error,delta);
   }errors.push(error);if(error>4)pixels++;
  }
  errors.sort((a,b)=>a-b);
  rows.push({columns,rows:height,prologue:pose.prologue,scene:pose.scene,zoom:pose.zoom,trip,effects,mean:sum/(columns*height*3),p99:errors[Math.floor(errors.length*.99)],max,over4:pixels/(columns*height)});
 }
 gpu.poll();return rows;
}
