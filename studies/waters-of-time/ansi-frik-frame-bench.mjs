import {createFrikMindFrames} from './frik-mind-frames.mjs?v=first-crossing-4';
const median=a=>a.slice().sort((a,b)=>a-b)[Math.floor(a.length/2)];
const p95=a=>a.slice().sort((a,b)=>a-b)[Math.min(a.length-1,Math.ceil(a.length*.95)-1)];
const next=()=>new Promise(resolve=>requestAnimationFrame(resolve));
// Explicit controlled benchmark only; the normal viewer never loads workers.
export async function benchFrikFrames(gpu,doc,grid,status){
 const poses=[...Array.from({length:7},(_,scene)=>({scene,centerX:.5,centerY:.5,zoom:0})),
  {scene:0,centerX:.49312,centerY:.128886,zoom:2.1},
  {scene:0,centerX:.49312,centerY:.128886,zoom:3.8}];
 let serial=0,accept,cpuSpec;
 const cpu=createFrikMindFrames(doc,()=>accept?.(cpu.use(cpuSpec)));
 const spec=(pose,effects=true,swing=.7)=>({...grid,shot:{...pose,trip:0,swing,motionSeed:1978,audio:[.2,.15,.1,.25,.04]},
  time:12.75,effects,pass:8,revision:0,stamp:'bench/'+serial++});
 const cpuRows=[];
 try{
  for(const pose of [poses[0],poses[3],poses[8]]){
   status.textContent='Benchmark · CPU reference · scene '+pose.scene+' / zoom '+pose.zoom;
   const times=[],work=[];
   for(let i=0;i<9;i++){
    cpuSpec=spec(pose);
    const frame=await new Promise(resolve=>{accept=resolve;cpu.use(cpuSpec);});
    if(i>2){times.push(frame.ms);work.push(frame.workerMs);}
   }
   cpuRows.push({...pose,wallMs:median(times),wallP95:p95(times),workerMs:median(work),samplesMs:times});
  }
 }finally{cpu.dispose();}
 const gpuRows=[];
 for(const pose of poses)for(const [kind,effects,swing] of [['settled',false,0],['motion',true,0],['parallax',true,.7]]){
  status.textContent='Benchmark · GPU · scene '+pose.scene+' / '+kind;
  const times=[],submits=[];
  for(let i=0;i<10;i++){
   const request=spec(pose,effects,swing),previous=gpu.stats.completed;
   let frame;
   for(let retry=0;retry<300;retry++){
    gpu.poll();frame=gpu.use(request);
    if(frame?.spec.stamp===request.stamp&&gpu.stats.completed>previous)break;
    await next();
   }
   if(frame?.spec.stamp!==request.stamp||gpu.stats.completed<=previous)throw Error('GPU benchmark completion timeout');
   if(i>1){times.push(gpu.stats.gpuMs);submits.push(gpu.stats.submitMs);}
  }
  gpuRows.push({...pose,kind,gpuMs:median(times),gpuP95:p95(times),submitMs:median(submits),samplesMs:times});
 }
 return {schema:'ansi.frik.render-bench.v1',at:new Date().toISOString(),...grid,pass:8,
  cpu:cpuRows,gpu:gpuRows,timerSupported:gpuRows.some(row=>row.gpuMs>0),
  scope:'Fixed art at identical selected grade and grid. GPU timer excludes 2D overlay/presentation; CPU wall includes stripe return and assembly.'};
}
