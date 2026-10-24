export class GhostPortrait {
  constructor(canvas, vertex, onError = () => {}) {
    this.canvas = canvas;
    this.vertex = vertex;
    this.onError = onError;
    this.gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false, preserveDrawingBuffer: true });
    if (!this.gl) throw Error('WebGL unavailable. The rendered portraits still show every version.');
    this.programs = [];
    this.bloom = null; this.bloomTexture = null; this.bloomTarget = null;
    this.historyTexture = null; this.historyReady = false; this.bloomReady = false; this.shiftSerial = 0;
    this.running = false;
    this.visible = false;
    this.timer = this.gl.getExtension('EXT_disjoint_timer_query');
    this.queries=[];this.gpuPasses=[0,0,0,0];this.gpuPassEdges=[0,0,0,0];this.profileSerial=0;this.gpuHistory=[];this.frameTimes=[];
    this.motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.cymatics = [0, 0, 0, 0];
    this.time = 8;
    this.last = 0;this.nextFrame=0;
    const graphics = this.gl;
    this.quad = graphics.createBuffer();
    graphics.bindBuffer(graphics.ARRAY_BUFFER, this.quad);
    graphics.bufferData(graphics.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), graphics.STATIC_DRAW);
    this.visibility = () => this.schedule();
    document.addEventListener('visibilitychange', this.visibility);
    this.observer = new IntersectionObserver(entries => { this.visible = entries[0].isIntersecting; this.schedule(); });
    this.observer.observe(canvas);
    this.resizer = new ResizeObserver(() => { this.resize(); this.draw(this.time); });
    this.resizer.observe(canvas);
    this.lost = event => { event.preventDefault(); this.stop(); canvas.dataset.state = 'lost'; onError('Graphics context interrupted. Reload to restore the live face; the archive portraits remain available.'); };
    canvas.addEventListener('webglcontextlost', this.lost);
  }
  compile(source) {
    const graphics = this.gl;
    const shaders = [];
    let program;
    try {
      for (const [type, text] of [[graphics.VERTEX_SHADER, this.vertex], [graphics.FRAGMENT_SHADER, source]]) {
        const shader = graphics.createShader(type); shaders.push(shader);
        graphics.shaderSource(shader, text); graphics.compileShader(shader);
        if (!graphics.getShaderParameter(shader, graphics.COMPILE_STATUS)) throw Error(graphics.getShaderInfoLog(shader));
      }
      program = graphics.createProgram();
      shaders.forEach(shader => graphics.attachShader(program, shader)); graphics.linkProgram(program);
      if (!graphics.getProgramParameter(program, graphics.LINK_STATUS)) throw Error(graphics.getProgramInfoLog(program));
      const uniforms = [];
      for (let index = 0; index < graphics.getProgramParameter(program, graphics.ACTIVE_UNIFORMS); index++) {
        const info = graphics.getActiveUniform(program, index);
        uniforms.push({ ...info, name: info.name, type: info.type, size: info.size, location: graphics.getUniformLocation(program, info.name) });
      }
      return { program, uniforms };
    } catch (error) { if (program) graphics.deleteProgram(program); throw error; }
    finally { shaders.forEach(shader => graphics.deleteShader(shader)); }
  }
  setVersion(version) {
    this.stop();
    this.programs.forEach(pass => this.gl.deleteProgram(pass.program)); this.programs = [];
    this.releaseBloom();
    for(const q of this.queries)this.timer?.deleteQueryEXT(q.query);this.queries=[];this.gpuHistory=[];this.gpuPasses=[0,0,0,0];
    this.version = version;
    try {
      this.splitGeometry=Array.isArray(version.geometryShaders);
      if(this.splitGeometry&&!this.gl.getExtension('EXT_frag_depth'))throw Error('Full-detail split geometry requires EXT_frag_depth');
      const geometry=this.splitGeometry?version.geometryShaders:[version.shader];
      for (const source of [version.bgShader, version.boltShader, ...geometry]) this.programs.push(this.compile(source));
      this.gpuPasses=Array(this.programs.length+1).fill(0);this.gpuPassEdges=[...this.gpuPasses];
      this.totalPass=this.programs.length+1;
      if(version.bloomShader){
        this.bloom=this.compile(version.bloomShader);
        this.bloomTexture=this.gl.createTexture();this.bloomTarget=this.gl.createFramebuffer();
        if(this.splitGeometry)this.depthTarget=this.gl.createRenderbuffer();
        this.gl.bindTexture(this.gl.TEXTURE_2D,this.bloomTexture);
        this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE);
        if(version.poseTrail){
          this.historyTexture=this.gl.createTexture();this.gl.bindTexture(this.gl.TEXTURE_2D,this.historyTexture);
          this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR);
          this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR);
          this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE);
          this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE);
        }
      }
      this.canvas.dataset.geometryPasses=String(geometry.length);
      this.canvas.dataset.bloom=this.bloom?'gold-threshold':'none';
      this.canvas.dataset.version = version.id;
      this.canvas.dataset.revision = version.revision || version.id;
      this.canvas.dataset.state = 'ready';
      this.resize(); this.draw(this.time); this.schedule();
    } catch (error) {
      this.releaseBloom();
      this.programs.forEach(pass => this.gl.deleteProgram(pass.program)); this.programs = [];
      this.canvas.dataset.state = 'failed'; this.onError('Face shader failed: ' + error.message); throw error;
    }
  }
  pollTimings(){
    const g=this.gl,t=this.timer;if(!t)return;
    while(this.queries.length&&t.getQueryObjectEXT(this.queries[0].query,t.QUERY_RESULT_AVAILABLE_EXT)){
      const sample=this.queries.shift();
      if(!g.getParameter(t.GPU_DISJOINT_EXT)){
        if(sample.pass<this.totalPass){this.gpuPasses[sample.pass]=t.getQueryObjectEXT(sample.query,t.QUERY_RESULT_EXT)/1e6;this.gpuPassEdges[sample.pass]=sample.edge;}
        if(sample.pass===this.totalPass){
          const total=t.getQueryObjectEXT(sample.query,t.QUERY_RESULT_EXT)/1e6;
          this.canvas.dataset.gpuPassEdges=JSON.stringify(this.gpuPassEdges);
          this.canvas.dataset.gpuPassMs=JSON.stringify(this.gpuPasses.map(n=>+n.toFixed(3)));
          this.canvas.dataset.gpuMs=total.toFixed(3);
          this.gpuHistory.push({edge:sample.edge,passes:this.gpuPasses.map(n=>+n.toFixed(3)),totalMs:+total.toFixed(3)});if(this.gpuHistory.length>24)this.gpuHistory.shift();this.canvas.dataset.gpuHistory=JSON.stringify(this.gpuHistory);
        }
      }
      t.deleteQueryEXT(sample.query);
    }
  }
  beginTiming(pass,enabled){if(!enabled||!this.timer)return null;const q=this.timer.createQueryEXT();this.timer.beginQueryEXT(this.timer.TIME_ELAPSED_EXT,q);return {query:q,pass,edge:this.canvas.width};}
  endTiming(sample){if(!sample)return;this.timer.endQueryEXT(this.timer.TIME_ELAPSED_EXT);this.queries.push(sample);}
  resize() {
    const requested=Math.max(1,Math.round(this.canvas.getBoundingClientRect().width*devicePixelRatio));
    const size=this.version?.renderPolicy?.fullResolution?requested:Math.max(1,Math.min(this.version?.maxRenderEdge||768,Math.round(this.canvas.getBoundingClientRect().width*Math.min(devicePixelRatio,1.5))));
    this.canvas.dataset.requestedEdge=String(requested);
    this.canvas.dataset.resolutionPolicy=this.version?.renderPolicy?.fullResolution?'native-device-pixels':'bounded';
    if (this.canvas.width !== size) this.canvas.width = this.canvas.height = size;
    this.canvas.dataset.renderBudget='full';
    if(this.bloom&&this.bloomSize!==size){
      const g=this.gl;this.bloomSize=size;g.bindTexture(g.TEXTURE_2D,this.bloomTexture);
      g.texImage2D(g.TEXTURE_2D,0,g.RGBA,size,size,0,g.RGBA,g.UNSIGNED_BYTE,null);
      g.bindFramebuffer(g.FRAMEBUFFER,this.bloomTarget);
      g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,this.bloomTexture,0);
      if(this.depthTarget){g.bindRenderbuffer(g.RENDERBUFFER,this.depthTarget);g.renderbufferStorage(g.RENDERBUFFER,g.DEPTH_COMPONENT16,size,size);g.framebufferRenderbuffer(g.FRAMEBUFFER,g.DEPTH_ATTACHMENT,g.RENDERBUFFER,this.depthTarget);g.bindRenderbuffer(g.RENDERBUFFER,null);}
      if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Gold bloom target incomplete');
      g.bindFramebuffer(g.FRAMEBUFFER,null);
      if(this.historyTexture){
        g.bindTexture(g.TEXTURE_2D,this.historyTexture);
        g.texImage2D(g.TEXTURE_2D,0,g.RGBA,size,size,0,g.RGBA,g.UNSIGNED_BYTE,null);
      }
      this.historyReady=false;this.bloomReady=false;
    }
  }
  draw(time) {
    if (this.programs.length < 3 || this.gl.isContextLost()) return;
    const cpuStart=performance.now(),expression=this.expression?.(time)||{};this.pollTimings();
    const profiling=!!this.version?.renderPolicy&&this.queries.length===0&&(this.profileSerial++%30===0);
    const profilePass=Math.floor(this.profileSerial/30)%(this.totalPass+1);
    const frameSample=this.beginTiming(this.totalPass,profiling&&profilePass===this.totalPass);
    const graphics = this.gl, tune = this.version.defaults, size = this.canvas.width;
    const scalar = {
      time, hover: 0, talk: 0, blink: 0, smile: .25,
      faceGlow: tune.orbFaceGlow, eyeBright: tune.orbEyeBright, coronaW: tune.orbCoronaW,
      eyeSize: tune.orbEyeSize, mouthY: tune.orbMouthY, scanFreq: tune.orbScanFreq,
      skullSize: tune.orbSkullSize, scale: tune.orbScale,
      alphaBase: tune.bgAlphaBase, alphaScale: tune.bgAlphaScale, alphaMax: tune.bgAlphaMax,
      coreW: tune.boltCoreW, glowW: tune.boltGlowW, atmoW: tune.boltAtmoW,
      wideW: tune.boltWideW, flickBase: tune.boltFlicker, flashThresh: tune.boltFlashRate,
      boltMult: tune.boltMult, ...tune, ...expression
    };
    const colors = {
      eyeColor: [tune.orbEyeR, tune.orbEyeG, tune.orbEyeB], skullColor: [tune.orbSkullR, tune.orbSkullG, tune.orbSkullB],
      tint: [tune.bgTintR, tune.bgTintG, tune.bgTintB], bgTint: [tune.bgTintR, tune.bgTintG, tune.bgTintB]
    };
    const vectors4 = { cymatics: this.cymatics };
    graphics.bindFramebuffer(graphics.FRAMEBUFFER,this.bloom?this.bloomTarget:null);
    if(this.historyTexture&&this.bloomReady&&scalar.shiftSerial!==this.shiftSerial){
      graphics.bindTexture(graphics.TEXTURE_2D,this.historyTexture);
      graphics.copyTexSubImage2D(graphics.TEXTURE_2D,0,0,0,0,0,size,size);
      this.historyReady=true;
      this.canvas.dataset.trailCaptures=String(Number(this.canvas.dataset.trailCaptures||0)+1);
    }
    this.shiftSerial=scalar.shiftSerial;
    graphics.viewport(0, 0, size, size); graphics.clearColor(0, 0, 0, 0); graphics.depthMask(true);graphics.clearDepth(1);graphics.clear(graphics.COLOR_BUFFER_BIT|(this.depthTarget?graphics.DEPTH_BUFFER_BIT:0));
    graphics.enable(graphics.BLEND);
    this.programs.forEach((pass, passIndex) => {
      const gpuSample=this.beginTiming(passIndex,profiling&&profilePass===passIndex);
      if(this.depthTarget&&passIndex>=2){graphics.enable(graphics.DEPTH_TEST);graphics.depthFunc(graphics.LESS);}else graphics.disable(graphics.DEPTH_TEST);
      graphics.useProgram(pass.program);
      if (passIndex === 1) graphics.blendFuncSeparate(graphics.SRC_ALPHA, graphics.ONE, graphics.ONE, graphics.ONE_MINUS_SRC_ALPHA);
      else graphics.blendFuncSeparate(passIndex === 2 ? graphics.ONE : graphics.SRC_ALPHA, graphics.ONE_MINUS_SRC_ALPHA, graphics.ONE, graphics.ONE_MINUS_SRC_ALPHA);
      for (const uniform of pass.uniforms) {
        const key = uniform.name.replace(/^u_/, '').replace(/\[0\]$/, '');
        if (/^arc(Start|End|Alpha|Color)$/.test(key)) {
          const components = key === 'arcColor' ? 3 : key === 'arcAlpha' ? 1 : 2;
          const values = new Float32Array(uniform.size * components);
          for (let index = 0; index < Math.min(3, uniform.size); index++) {
            const angle = index * Math.PI * 2 / 3 + .3;
            const value = key === 'arcStart' ? [size / 2, size / 2] : key === 'arcEnd' ? [size * (.5 + .44 * Math.cos(angle)), size * (.5 + .44 * Math.sin(angle))] : key === 'arcAlpha' ? [.3] : colors.eyeColor;
            values.set(value, index * components);
          }
          graphics['uniform' + components + 'fv'](uniform.location, values);
        } else if (key === 'arcCount') graphics.uniform1i(uniform.location, 3);
        else if (uniform.type === graphics.FLOAT) {
          if (!Number.isFinite(scalar[key])) throw Error('No value for actual shader uniform: ' + key);
          graphics.uniform1f(uniform.location, scalar[key]);
        } else if (key === 'resolution') graphics.uniform2f(uniform.location, size, size);
        else if (key === 'gaze') graphics.uniform2f(uniform.location, this.gaze?.[0] || 0, this.gaze?.[1] || 0);
        else if (vectors4[key]) graphics.uniform4fv(uniform.location, vectors4[key]);
        else if (colors[key]) graphics.uniform3fv(uniform.location, colors[key]);
        else throw Error('Unsupported actual shader uniform: ' + key);
      }
      graphics.bindBuffer(graphics.ARRAY_BUFFER, this.quad);
      const attribute = graphics.getAttribLocation(pass.program, 'a_pos');
      graphics.enableVertexAttribArray(attribute); graphics.vertexAttribPointer(attribute, 2, graphics.FLOAT, false, 0, 0);
      graphics.drawArrays(graphics.TRIANGLE_STRIP, 0, 4);this.endTiming(gpuSample);
    });
    if(this.bloom){
      const gpuSample=this.beginTiming(this.programs.length,profiling&&profilePass===this.programs.length);
      this.bloomReady=true;
      graphics.bindFramebuffer(graphics.FRAMEBUFFER,null);graphics.disable(graphics.DEPTH_TEST);graphics.disable(graphics.BLEND);
      graphics.useProgram(this.bloom.program);graphics.activeTexture(graphics.TEXTURE0);
      graphics.bindTexture(graphics.TEXTURE_2D,this.bloomTexture);
      if(this.historyTexture){graphics.activeTexture(graphics.TEXTURE1);graphics.bindTexture(graphics.TEXTURE_2D,this.historyTexture);graphics.activeTexture(graphics.TEXTURE0);}
      for(const uniform of this.bloom.uniforms){
        const key=uniform.name.replace(/^u_/,'');
        if(key==='source')graphics.uniform1i(uniform.location,0);
        else if(key==='history')graphics.uniform1i(uniform.location,1);
        else if(key==='historyReady')graphics.uniform1f(uniform.location,this.historyReady?1:0);
        else if(key==='shift')graphics.uniform1f(uniform.location,scalar.shift||0);
        else if(key==='shiftDirection')graphics.uniform2f(uniform.location,scalar.shiftX||0,scalar.shiftY||0);
        else if(key==='resolution')graphics.uniform2f(uniform.location,size,size);
        else if(key==='cymatics')graphics.uniform4fv(uniform.location,this.cymatics);
        else throw Error('Unsupported bloom uniform: '+key);
      }
      graphics.bindBuffer(graphics.ARRAY_BUFFER,this.quad);
      const attribute=graphics.getAttribLocation(this.bloom.program,'a_pos');
      graphics.enableVertexAttribArray(attribute);graphics.vertexAttribPointer(attribute,2,graphics.FLOAT,false,0,0);
      graphics.drawArrays(graphics.TRIANGLE_STRIP,0,4);this.endTiming(gpuSample);
      graphics.bindTexture(graphics.TEXTURE_2D,null);
      if(this.historyTexture){graphics.activeTexture(graphics.TEXTURE1);graphics.bindTexture(graphics.TEXTURE_2D,null);graphics.activeTexture(graphics.TEXTURE0);}
      this.canvas.dataset.poseTrail=this.historyReady&&(scalar.shift||0)>0?'fading':'clear';
    }
    this.endTiming(frameSample);
    this.canvas.dataset.cpuSubmitMs=(performance.now()-cpuStart).toFixed(3);
    this.canvas.dataset.frames = String(Number(this.canvas.dataset.frames || 0) + 1);
  }
  stop() { cancelAnimationFrame(this.frame); this.frame = 0; this.running = false; this.last = 0; this.nextFrame=0; }
  schedule() {
    this.stop();
    if (!this.motion || !this.visible || document.hidden || this.programs.length < 3 || this.gl.isContextLost()) return;
    this.running = true;
    const tick = now => {
      if (!this.running) return;
      try {
        const cadence=this.version?.renderPolicy?1000/this.version.renderPolicy.targetFps:50;
        if (!this.last || now+.5 >= this.nextFrame) {
          this.nextFrame=Math.max((this.nextFrame||now)+cadence,now);
          if(this.last){this.frameTimes.push(now-this.last);if(this.frameTimes.length>90)this.frameTimes.shift();this.canvas.dataset.renderFps=(1000/(this.frameTimes.reduce((a,b)=>a+b,0)/this.frameTimes.length)).toFixed(1);if(this.frameTimes.length%30===0){const sorted=[...this.frameTimes].sort((a,b)=>a-b);this.canvas.dataset.frameP50Ms=sorted[Math.floor((sorted.length-1)*.5)].toFixed(2);this.canvas.dataset.frameP95Ms=sorted[Math.floor((sorted.length-1)*.95)].toFixed(2);}}
          this.time += this.last ? Math.min(.1, (now - this.last) / 1000) : 0;
          this.last = now; this.draw(this.time);
        }
        this.frame = requestAnimationFrame(tick);
      } catch (error) { this.stop(); this.onError(error.message); }
    };
    this.frame = requestAnimationFrame(tick);
  }
  releaseBloom(){
    if(this.bloom)this.gl.deleteProgram(this.bloom.program);
    if(this.bloomTexture)this.gl.deleteTexture(this.bloomTexture);
    if(this.bloomTarget)this.gl.deleteFramebuffer(this.bloomTarget);
    if(this.depthTarget)this.gl.deleteRenderbuffer(this.depthTarget);this.depthTarget=null;
    if(this.historyTexture)this.gl.deleteTexture(this.historyTexture);
    this.bloom=null;this.bloomTexture=null;this.bloomTarget=null;this.bloomSize=0;
    this.historyTexture=null;this.historyReady=false;this.bloomReady=false;this.shiftSerial=0;
  }
  destroy() {
    this.stop();for(const q of this.queries)this.timer?.deleteQueryEXT(q.query);this.queries=[]; this.releaseBloom(); this.observer.disconnect(); this.resizer.disconnect();
    document.removeEventListener('visibilitychange', this.visibility);
    this.canvas.removeEventListener('webglcontextlost', this.lost);
    this.programs.forEach(pass => this.gl.deleteProgram(pass.program)); this.gl.deleteBuffer(this.quad);
  }
}
