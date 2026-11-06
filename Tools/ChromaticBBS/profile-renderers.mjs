import {spawn} from 'node:child_process';
import {writeFileSync,mkdirSync,readFileSync,existsSync} from 'node:fs';
import {createServer} from 'node:http';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
// Isolated GPU witness. No desktop automation or attachment to player tabs.
// node Tools/ChromaticBBS/profile-renderers.mjs /tmp/ghost-profile [auto|native]
const out=resolve(process.argv[2]||'/private/tmp/ghost-render-profile'),tag=process.argv[3]||'auto',adaptive=tag==='auto';
if(!['auto','native'].includes(tag))throw Error('Choose auto or native');
mkdirSync(out,{recursive:true});
const facesOnly=process.argv.includes('--face-only');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const server=createServer((req,res)=>{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path==='/'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><body></body>');}const file=resolve(root,'.'+path);if(!file.startsWith(root+'/Tools/')||!existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',['.mjs','.js'].includes(extname(file))?'text/javascript':'application/octet-stream');res.end(readFileSync(file));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--no-first-run','--no-default-browser-check',`--user-data-dir=${out}/chrome-profile`,'--remote-debugging-pipe'],{stdio:['ignore','ignore','pipe','pipe','pipe']});
let serial=0,partial=Buffer.alloc(0),sessionId;const pending=new Map();
chrome.stdio[4].on('data',chunk=>{partial=Buffer.concat([partial,chunk]);let end;while((end=partial.indexOf(0))>=0){const m=JSON.parse(partial.subarray(0,end).toString());partial=partial.subarray(end+1);const job=pending.get(m.id);if(job){pending.delete(m.id);m.error?job.reject(Error(JSON.stringify(m.error))):job.resolve(m.result);}}});
function send(method,params={},target=sessionId){const id=++serial;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});chrome.stdio[3].write(JSON.stringify({id,method,params,...(target?{sessionId:target}:{})})+'\0');});}
async function ev(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));const watchdog=setTimeout(()=>chrome.kill(),240000);
try{
 const t=await send('Target.createTarget',{url:base+'/'},null);sessionId=(await send('Target.attachToTarget',{targetId:t.targetId,flatten:true},null)).sessionId;await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Network.setBypassServiceWorker',{bypass:true});await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:2,mobile:false});await wait(500);
 await ev(`(async()=>{document.body.innerHTML='<canvas id="c" style="width:1280px;height:800px;display:block"></canvas>';document.body.style.cssText='margin:0;overflow:hidden;background:#101522';window.c=document.getElementById('c');window.bootModule=await import('/Tools/ChromaticBBS/boot-world.mjs');window.renderModule=await import('/Tools/InfiniEngineSite/ghost-renderer.js');window.face=await import('/Tools/ChromaticBBS/face-data.mjs');window.times=[];window.harvest=()=>[];})()`);
 const sys=await ev(`(()=>{const g=c.getContext('webgl'),d=g.getExtension('WEBGL_debug_renderer_info');return {renderer:d?g.getParameter(d.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER),vendor:d?g.getParameter(d.UNMASKED_VENDOR_WEBGL):null,dpr:devicePixelRatio,timer:!!g.getExtension('EXT_disjoint_timer_query'),userAgent:navigator.userAgent};})()`);console.log(JSON.stringify({system:sys}));
 if(/SwiftShader|llvmpipe/i.test(sys.renderer))throw Error('Software GPU; invalid M1 evidence');
 await ev('crypto.getRandomValues=a=>{a.fill(596564);return a;}');const results=[];
 async function sample(name,setup){await ev(setup);await wait(facesOnly?4000:7500);await ev('times=[]');const before=await ev('Number(c.dataset.frames||0)'),start=Date.now();await wait(facesOnly?3000:5000);const after=await ev('Number(c.dataset.frames||0)'),elapsed=Date.now()-start;await ev('window.world?.show(false);window.portrait?.stop()');await wait(100);const data=await ev(`({times:harvest(),dataset:{...c.dataset},size:[c.width,c.height]})`);if(['face','else'].includes(name)&&(data.dataset.fieldScale!=='1.0000'||data.dataset.fieldSize!==data.size.join('×')))throw Error('Portrait was downsampled: '+JSON.stringify(data.dataset));const sorted=data.times.map(s=>s.gpu).sort((a,b)=>a-b),cpu=data.times.map(s=>s.cpu).sort((a,b)=>a-b);const result={name,size:data.size,fps:(after-before)*1000/elapsed,samples:sorted.length,gpuP50:sorted[Math.floor(sorted.length*.5)],gpuP95:sorted[Math.floor(sorted.length*.95)],cpuP50:cpu[Math.floor(cpu.length*.5)],dataset:data.dataset};results.push(result);console.log(JSON.stringify(result));const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(out+'/'+tag+'-'+name+'.png',Buffer.from(shot.data,'base64'));}
 await ev(`window.world=bootModule.mountBootWorld(c,{pixelRatio:1,adaptive:${adaptive}});world.set({progress:.6,phase:1});`);
 for(const mode of facesOnly?[]:['wide','modem','portal','screen'])await sample('boot-'+mode,`world.focus('${mode}');world.show(true)`);
 await ev(`world.destroy();world=null;document.body.innerHTML='<canvas id="c" style="width:1280px;height:800px;display:block"></canvas>';window.c=document.getElementById('c');window.portrait=new renderModule.GhostPortrait(c,face.faceData.vertex,console.error,{viewport:'rect',pixelRatio:1,background:false,profileEvery:0});portrait.setVersion(face.faceData.version);portrait.motion=true;`);
 await sample('face',`portrait.expression=()=>({emergenceReveal:1});portrait.visible=true;portrait.schedule()`);
 await sample('else',`portrait.expression=()=>({emergenceReveal:1,companionFocus:1,companionTalk:.4});portrait.visible=true;portrait.schedule()`);
 writeFileSync(out+'/'+tag+'.json',JSON.stringify({system:sys,results},null,2));
}finally{clearTimeout(watchdog);chrome.kill();server.close();}
