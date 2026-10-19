/* Carrier framework C26.3: reversible CRT ritual and ANSI cell assembly.
 * Presentation alone; no reducer, score, RNG, storage or network authority. */
export function mountCinema(root, {hold=()=>{}, ready=()=>{}, local=()=>false}={}) {
  const find=id=>root.querySelector('#cg-'+id);
  const screen=find('screen'),bay=find('power-bay'),canvas=find('boot-canvas');
  const context=canvas.getContext('2d');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let phase='ready',raf=0,token=0,start=0,lastCell=-1,elapsed=0,advance=null;
  const palette=['#00ffff','#ff66e8','#ffdb61','#75bcae'];
  const glyphs='░▒▓█╬╳01';
  function mode(value){phase=value;root.dataset.power=value;}
  function rows(){return [
    ['╔══════════════════════════════════════╗',0],
    ['║     F R I K E N . G H O S T          ║',0],
    ['║   CHROMATIC / HYPERSPACE CARRIER     ║',1],
    ['╠══════════════════════════════════════╣',0],
    ['> PHOSPHOR .............. WAKING UP',2],
    ['> FACE / GUEST LIGHT ..... v19 / 3 PASS',0],
    ['> WORLD SEED ............ SDF / LOCAL',0],
    ['> MEMORY ............... '+(local()?'LOCAL VAULT':'EXPORT REQUIRED'),2],
    ['> MODEL ................ NONE IN BROWSER',3],
    ['> GREATER MIND .......... BUNDLED MIRROR',1],
    ['╠══════════════════════════════════════╣',0],
    ['║       HOLD THE FKN LINE.             ║',2],
    ['╚══════════════════════════════════════╝',0]
  ];}
  function paint(progress){
    if(!context)return;
    const rect=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.max(1,Math.round(rect.width*ratio));canvas.height=Math.round(280*ratio);
    context.scale(ratio,ratio);context.fillStyle='#030809';context.fillRect(0,0,rect.width,280);
    // A 40-column terminal stays legible at 320px by showing fewer columns.
    const cols=Math.max(24,Math.min(40,Math.floor((rect.width-16)/7.3)));
    const all=rows().map(([line,color])=>{
      if('╔╠╚'.includes(line[0]))line=line[0]+'═'.repeat(cols-2)+({'╔':'╗','╠':'╣','╚':'╝'}[line[0]]);
      else if(line[0]==='║')line='║'+line.slice(1,-1).trimEnd().slice(0,cols-2).padEnd(cols-2)+'║';
      return [line.slice(0,cols),color];
    });
    const cells=all.reduce((sum,[line])=>sum+line.length,0),visible=Math.floor(progress*cells);
    context.font='12px "Courier New",monospace';context.textBaseline='top';
    let index=0;
    for(let y=0;y<all.length;y++){
      const [line,color]=all[y];
      for(let x=0;x<line.length;x++,index++){
        if(index>visible+cols*1.7)continue;
        const incoming=index>=visible;
        context.globalAlpha=incoming?.28:1;
        context.fillStyle=palette[incoming?1:color];
        context.fillText(incoming?glyphs[(x*13+y*7+Math.floor(progress*97))%glyphs.length]:line[x],Math.max(8,(rect.width-cols*7.3)/2)+x*7.3,12+y*19);
      }
    }
    context.globalAlpha=1;lastCell=visible;
    canvas.dataset.cells=String(lastCell);
  }
  function cancel(){token++;cancelAnimationFrame(raf);raf=0;}
  function finish(){
    cancel();mode('ready');bay.hidden=true;screen.hidden=false;screen.inert=false;
    screen.classList.remove('cg-crt-off','cg-arriving');
    hold(false);ready();
  }
  function standby(){
    cancel();mode('awaiting');screen.hidden=true;screen.inert=true;bay.hidden=false;
    canvas.hidden=false;paint(1);find('skip').hidden=true;find('pause').hidden=true;
    find('continue').hidden=false;find('reconnect').hidden=true;
    find('power-title').textContent='CARRIER FOUND / HOLDING FOR YOU';
    find('power-status').textContent='Take your time. Nothing advances until Continue.';
  }
  function enter(){
    if(phase!=='awaiting')return;
    cancel();mode('arriving');bay.hidden=true;screen.hidden=false;screen.inert=true;
    screen.classList.add('cg-arriving');
    if(reduced.matches){finish();return;}
    const own=token,arrival=performance.now();
    function reveal(now){if(own!==token)return;if(now-arrival>=900){finish();return;}raf=requestAnimationFrame(reveal);}
    raf=requestAnimationFrame(reveal);
  }
  function pause(){
    if(phase==='paused'){
      mode(elapsed<720?'igniting':'assembling');start=performance.now();
      find('pause').textContent='[ PAUSE / HOLD SCREEN ]';
      find('power-status').textContent='Space to pause · Esc to finish assembly';
      raf=requestAnimationFrame(advance);return;
    }
    if(phase!=='igniting'&&phase!=='assembling')return;
    elapsed+=performance.now()-start;cancelAnimationFrame(raf);raf=0;mode('paused');
    find('pause').textContent='[ RESUME ASSEMBLY ]';
    find('power-status').textContent='PAUSED. The phosphor can wait.';
  }
  function boot(){
    cancel();hold(true);mode('igniting');screen.inert=true;screen.hidden=true;
    screen.classList.remove('cg-crt-off','cg-arriving');
    bay.hidden=false;find('reconnect').hidden=true;find('skip').hidden=false;
    find('pause').hidden=false;find('continue').hidden=true;
    find('pause').textContent='[ PAUSE / HOLD SCREEN ]';
    find('power-title').textContent='SOMEBODY IS ANSWERING';
    find('power-status').textContent='Space to pause · Esc to finish assembly';
    canvas.hidden=false;paint(0);elapsed=0;start=performance.now();const own=token;
    if(reduced.matches){standby();return;}
    advance=now=>{
      if(own!==token)return;
      const age=elapsed+now-start;
      if(age<720)mode('igniting');
      else if(age<3075){mode('assembling');paint(Math.min(1,(age-720)/1980));}
      else{standby();return;}
      raf=requestAnimationFrame(advance);
    };
    raf=requestAnimationFrame(advance);
  }
  function disconnected(){
    mode('off');screen.hidden=true;bay.hidden=false;canvas.hidden=true;
    find('skip').hidden=true;find('pause').hidden=true;find('continue').hidden=true;find('reconnect').hidden=false;
    find('power-title').textContent='NO CARRIER';
    find('power-status').textContent='Session held. Your checkpoint has not advanced.';
  }
  function off(){
    if(phase!=='ready')return;
    cancel();hold(true);mode('collapsing');screen.inert=true;
    if(reduced.matches){disconnected();return;}
    screen.classList.add('cg-crt-off');start=performance.now();const own=token;
    function collapse(now){if(own!==token)return;if(now-start>=780){disconnected();return;}raf=requestAnimationFrame(collapse);}
    raf=requestAnimationFrame(collapse);
  }
  find('skip').addEventListener('click',standby);
  find('pause').addEventListener('click',pause);
  find('continue').addEventListener('click',enter);
  find('reboot').addEventListener('click',boot);
  find('power-off').addEventListener('click',off);
  find('reconnect').addEventListener('click',boot);
  root.addEventListener('keydown',event=>{
    if(phase==='ready'||phase==='off'||phase==='collapsing'||phase==='arriving')return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();standby();}
    else if(event.key===' '){event.preventDefault();event.stopImmediatePropagation();if(phase==='awaiting')enter();else pause();}
  },true);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&(phase==='igniting'||phase==='assembling'))pause();
    else if(document.hidden&&phase==='arriving')finish();
  });
  return {boot,off,finish,standby,enter,pause,get phase(){return phase;}};
}
