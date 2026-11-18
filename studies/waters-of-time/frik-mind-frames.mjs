// Workers share short row jobs. A complete sheet is published atomically;
// transferable stripe buffers return to the same worker for its next job.
export function createFrikMindFrames(doc,onFrame){
 const limit=Math.min(4,Math.max(2,(navigator.hardwareConcurrency||4)-2));
 const workers=Array.from({length:limit},()=>new Worker(
  new URL('./frik-mind-worker.mjs?v=lancing-2',import.meta.url),{type:'module'}));
 const slots=Array.from({length:2},()=>{
  const raster=doc.createElement('canvas');
  return {raster,context:raster.getContext('2d',{alpha:false})};
 });
 let active,latest,front,failed;
 function dispatch(worker,buffer){
  if(active.nextRow>=active.spec.rows)return;
  const first=active.nextRow, last=Math.min(active.spec.rows,first+24);
  active.nextRow=last;
  active.running++;
  worker.postMessage({spec:active.spec,first,last,buffer},buffer?[buffer]:[]);
 }
 function pump(){
  if(active||failed||!latest||latest.stamp===front?.spec.stamp)return;
  const spec=latest, slot=slots.find(slot=>slot.raster!==front?.raster);
  if(slot.raster.width!==spec.columns)slot.raster.width=spec.columns;
  if(slot.raster.height!==spec.rows)slot.raster.height=spec.rows;
  active={spec,...slot,nextRow:0,running:0,startedAt:performance.now(),workerMs:0};
  for(const worker of workers)dispatch(worker);
 }
 for(const worker of workers){
  worker.onmessage=({data:{first,last,pixels,ms}})=>{
   if(!active)return;
   const {spec,context}=active;
   const bytes=new Uint8ClampedArray(pixels.buffer,0,pixels.length*4);
   context.putImageData(new ImageData(bytes,spec.columns,last-first),0,first);
   active.workerMs+=ms;
   active.running--;
   dispatch(worker,pixels.buffer);
   if(active.running)return;
   if(latest&&spec.revision===latest.revision&&spec.pass===latest.pass&&
     spec.columns===latest.columns&&spec.rows===latest.rows){
    front={spec,raster:active.raster,ms:performance.now()-active.startedAt,workerMs:active.workerMs};
    onFrame();
   }
   active=undefined;
   pump();
  };
  worker.onerror=event=>{
   failed=event.message;
   onFrame();
  };
 }
 return {
  dispose(){failed='disposed';latest=undefined;active=undefined;for(const worker of workers)worker.terminate();},
  get error(){return failed;},
  use(spec){
   latest=spec;
   pump();
   return front?.spec.revision===spec.revision&&front.spec.pass===spec.pass&&
    front.spec.columns===spec.columns&&front.spec.rows===spec.rows?front:undefined;
  },
 };
}
