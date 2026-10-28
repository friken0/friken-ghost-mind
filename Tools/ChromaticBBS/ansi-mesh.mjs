import {ansiScene,ansiSceneProgram} from './ansi-scenes.mjs';
import {mountAnsiTerminal} from './ansi-terminal.mjs';
/* ANSI++ weighted sprite meshes. The original terminal cells remain source.
 * Capture a completed painting; deform a pinned quad grid with authored bones.
 * Linear blend skinning evaluates at most four influences per vertex.
 * Each bone is a rest segment and a short cyclic endpoint-key playlist.
 * Bind space maps to posed space through segment rotation and axial stretch.
 * A residual identity weight prevents rubber-sheet motion outside the rig.
 * Presets share one interpolation law and expose bounded amplitude/period.
 * The existing host clock owns capture, pose, draw and visibility.
 * No story randomness, hit-region mutation, timer or extra render loop.
 * Reduced motion draws the original capture; hidden sprites do no work. */
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export const ansiMeshEffects=Object.freeze(['blink','breathe','serpent','flame','water','ripple','flutter','hover','recoil','faces']);
function distance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
const key=(t,a,b)=>({t,a,b});
function bone(a,b,radius,keys){return {a,b,radius,keys};}
export function ansiMeshRig(effect,{period=6,amplitude=1}={}){
 if(!ansiMeshEffects.includes(effect)||!Number.isFinite(period)||period<.5||period>60||!Number.isFinite(amplitude)||amplitude<0||amplitude>1.5)throw Error('Bounded ANSI sprite rig required');
 let bones=[];
 if(effect==='blink'){
  // Two V-shaped lids, their corners fixed. Centre closes first; holds briefly.
  const left=[.055,.5],right=[.945,.5],top=[.5,.30],bottom=[.5,.70];
  for(const [corner,mid]of [[left,top],[right,top],[left,bottom],[right,bottom]])bones.push(bone(corner,mid,.17,[key(0,corner,mid),key(.72,corner,mid),key(.79,corner,[.5,.5]),key(.82,corner,[.5,.5]),key(.90,corner,mid),key(1,corner,mid)]));
 }else if(effect==='faces'){
  // Only the bronze and hooded faces have mesh bones. Steel uses source cells.
  for(const [x,y,r,kind]of [[.45,.395,.035,'lid'],[.55,.395,.035,'lid'],[.5,.57,.065,'jaw'],[.79,.35,.04,'brow'],[.88,.35,.04,'brow'],[.835,.57,.055,'jaw']]){
   const a=[x,y-.035],b=[x,y+.035],keys=[];
   for(const [t,k]of [[0,0],[.44,0],[.48,1],[.50,1],[.56,0],[.76,.45],[1,0]]){const delta=kind==='lid'?.025*k:kind==='brow'?-.008*k:.018*k;keys.push(key(t,[x,a[1]+(kind==='lid'?delta:0)],[x,b[1]+(kind==='lid'?-delta:delta)]));}
   bones.push({...bone(a,b,r,keys),axial:true,region:x<.7?[.34,.15,.66,.9]:[.69,.15,.97,.9]});
  }
 }else if(effect==='serpent'||effect==='flame'){
  const points=effect==='flame'?[[.5,.94],[.5,.65],[.5,.34],[.5,.06]]:[.90,.65,.40,.18].map(v=>[.5+.17*Math.sin((v-.18)*9),v]);
  for(let i=0;i<3;i++){const a=points[i],b=points[i+1],s=(i+1)*(effect==='serpent'?.05:.025),keys=[];for(let k=0;k<=8;k++){const t=k/8,phase=t*Math.PI*2;keys.push(key(t,[a[0]+Math.sin(phase-i*.8)*s*.45,a[1]],[b[0]+Math.sin(phase-(i+1)*.8)*s,b[1]-(effect==='flame'?.015*Math.sin(phase*2):.01*Math.cos(phase))]));}bones.push(bone(a,b,.21,keys));}
 }else if(effect==='water'){
  for(let i=0;i<4;i++){const a=[i*.25,.88],b=[(i+1)*.25,.88],keys=[];for(let k=0;k<=8;k++){const t=k/8;keys.push(key(t,[a[0],a[1]+.018*Math.sin(t*Math.PI*2+i*.9)],[b[0],b[1]+.018*Math.sin(t*Math.PI*2+(i+1)*.9)]));}bones.push(bone(a,b,.12,keys));}
 }else if(effect==='ripple'){
  for(let i=0;i<4;i++){const angle=i*Math.PI/2,a=[.5,.5],b=[.5+Math.cos(angle)*.35,.5+Math.sin(angle)*.35];bones.push(bone(a,b,.22,[key(0,a,b),key(.5,a,[.5+(b[0]-.5)*1.06,.5+(b[1]-.5)*1.06]),key(1,a,b)]));}
 }else if(effect==='flutter'){
  for(const side of [-1,1]){const a=[.5,.55],b=[.5+side*.36,.33];bones.push(bone(a,b,.23,[key(0,a,b),key(.25,a,[b[0]-.02*side,b[1]-.045]),key(.5,a,b),key(.75,a,[b[0]+.01*side,b[1]+.025]),key(1,a,b)]));}
 }else{
  const a=[.5,.72],b=[.5,.28],keys=effect==='breathe'?[key(0,a,b),key(.5,[.5,.73],[.5,.25]),key(1,a,b)]:effect==='hover'?[key(0,a,b),key(.5,[.51,.70],[.51,.26]),key(1,a,b)]:[key(0,a,b),key(.12,[.51,.74],[.49,.31]),key(.3,a,b),key(1,a,b)];bones=[bone(a,b,.4,keys)];
 }
 return {effect,period,amplitude,bones};
}
export function ansiBonePose(bone,phase){const p=((phase%1)+1)%1,keys=bone.keys;let i=0;while(i<keys.length-2&&p>keys[i+1].t)i++;const a=keys[i],b=keys[i+1],t=clamp((p-a.t)/(b.t-a.t)),s=t*t*(3-2*t);return {a:a.a.map((v,j)=>v+(b.a[j]-v)*s),b:a.b.map((v,j)=>v+(b.b[j]-v)*s)};}
export function createAnsiMesh(rig,{columns=12,rows=12}={}){
 if(!rig?.bones?.length||rig.bones.length>12||!Number.isInteger(columns)||columns<2||columns>24||!Number.isInteger(rows)||rows<2||rows>24)throw Error('Bounded ANSI mesh required');
 const vertices=[];for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){const u=x/columns,v=y/rows,p=[u,v],pin=x===0||x===columns||y===0||y===rows?0:Math.pow(Math.sin(u*Math.PI)*Math.sin(v*Math.PI),.4),weights=rig.bones.map((b,i)=>({i,w:b.region&&(u<b.region[0]||v<b.region[1]||u>b.region[2]||v>b.region[3])?0:Math.exp(-((distance(p,b.a,b.b)/b.radius)**2)*2)})).sort((a,b)=>b.w-a.w).slice(0,4),sum=weights.reduce((s,w)=>s+w.w,0),gain=Math.min(.985,sum)*pin;vertices.push({u,v,weights:weights.map(w=>({i:w.i,w:sum?w.w/sum*gain:0}))});}
 const triangles=[];for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){const a=y*(columns+1)+x,b=a+1,c=a+columns+1,d=c+1;triangles.push([a,b,d],[a,d,c]);}
 return {rig,vertices,triangles};
}
export function poseAnsiMesh(mesh,seconds=0,{held=false}={}){
 if(!Number.isFinite(seconds)||seconds<0)throw Error('Nonnegative ANSI mesh clock required');const phase=seconds/mesh.rig.period,poses=mesh.rig.bones.map(b=>ansiBonePose(b,phase));
 return mesh.vertices.map(v=>{let x=v.u,y=v.v;if(!held)for(const {i,w}of v.weights){const b=mesh.rig.bones[i],p=poses[i],dx=b.b[0]-b.a[0],dy=b.b[1]-b.a[1],len=Math.hypot(dx,dy),nx=(p.b[0]-p.a[0])/len,ny=(p.b[1]-p.a[1])/len,ax=((v.u-b.a[0])*dx+(v.v-b.a[1])*dy)/len,ay=(-(v.u-b.a[0])*dy+(v.v-b.a[1])*dx)/len;const stretch=b.axial?Math.max(.001,Math.hypot(nx,ny)):1;const tx=p.a[0]+nx*ax-ny/stretch*ay,ty=p.a[1]+ny*ax+nx/stretch*ay;x+=(tx-v.u)*w*mesh.rig.amplitude;y+=(ty-v.v)*w*mesh.rig.amplitude;}if(!held&&mesh.rig.effect==='blink'){const close=clamp((poses[0].b[1]-.30)/.20)*Math.min(1,mesh.rig.amplitude),weight=Math.sin(Math.PI*v.u)*4*v.v*(1-v.v);x=v.u;y=v.v+(.5-v.v)*close*.97*weight;}return {x,y,u:v.u,v:v.v};});
}
/** Coherent music deformation: bass opens petals, mids sway stems/leaves.
 * One smooth field per plant; never independent random cell displacement. */
export function poseAnsiGarden(mesh,seconds,{bands=[],rms=0,aspect=1,held=false}={}){
 if(!Number.isFinite(seconds)||seconds<0||!Number.isFinite(aspect)||aspect<=0||aspect>8)throw Error('Bounded garden clock/aspect required');
 const bass=held?0:clamp(Number(bands[0])||0),mid=held?0:clamp(Number(bands[1])||0),plants=[[.5,.36,.28],[.18,.53,.15],[.82,.52,.15]];
 return mesh.vertices.map(v=>{let x=v.u,y=v.v;const pin=Math.sin(Math.PI*v.u)*Math.sin(Math.PI*v.v);for(const [i,[cx,cy,size]]of plants.entries()){
  const dx=(v.u-cx)*aspect,dy=v.v-cy,r=Math.hypot(dx,dy),flower=Math.exp(-((r/(size*1.3))**4)),open=bass*.085,angle=mid*.045*Math.sin(seconds*1.7+i*.3),co=Math.cos(angle),si=Math.sin(angle);
  x+=((dx*co-dy*si)*(1+open)-dx)/aspect*flower*pin;y+=((dx*si+dy*co)*(1+open)-dy)*flower*pin;
  const stem=Math.exp(-(((v.u-cx)*aspect/.17)**2))*clamp((v.v-cy)/.13)*clamp((.96-v.v)/.5);
  x+=Math.sin(seconds*1.5+i*.35)*mid*.025*stem*pin;
 }return {x,y,u:v.u,v:v.v};});
}
function triangle(ctx,image,a,b,c,w,h){const sx=[a.u*w,b.u*w,c.u*w],sy=[a.v*h,b.v*h,c.v*h],dx=[a.x*w,b.x*w,c.x*w],dy=[a.y*h,b.y*h,c.y*h],den=sx[0]*(sy[1]-sy[2])+sx[1]*(sy[2]-sy[0])+sx[2]*(sy[0]-sy[1]);if(Math.abs(den)<1e-9)return;const coef=z=>[(z[0]*(sy[1]-sy[2])+z[1]*(sy[2]-sy[0])+z[2]*(sy[0]-sy[1]))/den,(z[0]*(sx[2]-sx[1])+z[1]*(sx[0]-sx[2])+z[2]*(sx[1]-sx[0]))/den,(z[0]*(sx[1]*sy[2]-sx[2]*sy[1])+z[1]*(sx[2]*sy[0]-sx[0]*sy[2])+z[2]*(sx[0]*sy[1]-sx[1]*sy[0]))/den],x=coef(dx),y=coef(dy);ctx.save();ctx.beginPath();ctx.moveTo(dx[0],dy[0]);ctx.lineTo(dx[1],dy[1]);ctx.lineTo(dx[2],dy[2]);ctx.closePath();ctx.clip();ctx.transform(x[0],y[0],x[1],y[1],x[2],y[2]);ctx.drawImage(image,0,0);ctx.restore();}
export function mountAnsiMeshSprite(root,{host}={}){
 if(!root?.ownerDocument||!host?.canvas)throw Error('ANSI sprite host required');const doc=root.ownerDocument,canvas=doc.createElement('canvas'),texture=doc.createElement('canvas'),ctx=canvas.getContext('2d'),ink=texture.getContext('2d');canvas.className='native-ansi-mesh';canvas.setAttribute('aria-hidden','true');canvas.style.cssText='position:absolute;z-index:2;pointer-events:none;display:none;';root.append(canvas);let key='',mesh=null,artTerminal=null,start=0,last=-1,priorHeld=null,wasComplete=false,gardenBands=[0,0],gardenClock=0;
 return {canvas,update(item,visible,clock,held=false,energy=null){if(!item){canvas.style.display='none';return;}const {revealOffsets,...identity}=item,id=JSON.stringify(identity);if(id!==key){key=id;mesh=item.effect==='none'?null:createAnsiMesh(ansiMeshRig(item.effect,{period:item.period||6,amplitude:item.amplitude??1}),{columns:item.effect==='faces'?24:10,rows:item.effect==='faces'?20:10});start=clock;last=-1;priorHeld=null;wasComplete=false;
   if(item.source){const columns=80,rows=Math.min(50,Math.max(8,Math.round(item.height*columns/item.width))),scene=ansiScene(item.source.kind,{width:columns,height:rows,seed:item.source.seed,stage:item.source.stage});artTerminal??=mountAnsiTerminal({canvas:texture,cursor:false});artTerminal.setGrid(columns,rows,{preserve:false});const program=ansiSceneProgram(scene,{columns,rows});artTerminal.setProgram(program.text,{animation:program.animation});canvas.width=columns*16;canvas.height=rows*32;}
   else{artTerminal=null;canvas.width=texture.width=item.width*16;canvas.height=texture.height=item.height*32;}}
  const fit=host.rect(),base=root.getBoundingClientRect();canvas.style.display='block';Object.assign(canvas.style,{left:fit.left-base.left+(item.column-1)*fit.cellWidth+'px',top:fit.top-base.top+(item.row-1)*fit.cellHeight+'px',width:item.width*fit.cellWidth+'px',height:item.height*fit.cellHeight+'px'});const theme=host.terminal?.colourTheme||'ansi',changedTheme=artTerminal&&artTerminal.colourTheme!==theme;if(artTerminal)artTerminal.setPalette(theme);if(visible&&held&&priorHeld===true&&last>=0&&!changedTheme)return;if(visible&&!wasComplete)start=clock;wasComplete=visible;const begin=performance.now();if(artTerminal)artTerminal.update(0,{reveal:true,time:Math.max(0,clock-start),reducedMotion:held||!visible,energy:visible?energy:null});else{ink.clearRect(0,0,texture.width,texture.height);ink.drawImage(host.canvas,(item.column-1)*16,(item.row-1)*32,texture.width,texture.height,0,0,texture.width,texture.height);}ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;if(!visible&&item.revealOffsets){const bytes=Number(host.canvas.dataset.serialBytes)||0,cw=canvas.width/item.width,ch=canvas.height/item.height;ctx.save();ctx.beginPath();for(let row=0;row<item.height;row++){let shown=0;for(let col=0;col<item.width;col++)if(item.revealOffsets[row*item.width+col]<=bytes)shown++;else break;if(shown)ctx.rect(0,row*ch,shown*cw,ch);}ctx.clip();ctx.drawImage(texture,0,0);ctx.restore();canvas.dataset.serialPhase='drawing';canvas.dataset.sourceColumns=String(artTerminal?80:item.width);return;}canvas.dataset.serialPhase='animated';const garden=item.source?.kind==='trip';if(garden){const dt=Math.min(.15,Math.max(0,clock-gardenClock));gardenClock=clock;for(let i=0;i<2;i++){const target=held?0:clamp(Number(energy?.bands?.[i])||0),tau=target>gardenBands[i] ? .12 : .38;gardenBands[i]+=(target-gardenBands[i])*(1-Math.exp(-dt/tau));}}const pose=mesh?(garden?poseAnsiGarden(mesh,Math.max(0,clock-start),{held,aspect:canvas.width/canvas.height,bands:gardenBands}):poseAnsiMesh(mesh,clock-start,{held})):null;canvas.dataset.cymaticMode=garden?'coherent-plant-mesh':'cell-material';if(garden)canvas.dataset.gardenEnergy=gardenBands.map(n=>n.toFixed(3)).join(',');if(held||!mesh)ctx.drawImage(texture,0,0);else for(const t of mesh.triangles)triangle(ctx,texture,...t.map(i=>pose[i]),canvas.width,canvas.height);last=clock;priorHeld=held;canvas.dataset.effect=item.effect;canvas.dataset.sourceColumns=String(artTerminal?80:item.width);canvas.dataset.cymaticCells=artTerminal?.canvas.dataset.cymaticCells||'0';canvas.dataset.phase=((clock-start)/(item.period||6)%1).toFixed(3);canvas.dataset.triangles=String(mesh?.triangles.length||0);canvas.dataset.paintMs=(performance.now()-begin).toFixed(2);},destroy(){canvas.remove();mesh=null;}};
}
