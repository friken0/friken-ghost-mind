export class GhostPortrait {
  constructor(canvas, vertex, onError = () => {}) {
    this.canvas = canvas;
    this.vertex = vertex;
    this.onError = onError;
    this.gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false, preserveDrawingBuffer: true });
    if (!this.gl) throw Error('WebGL unavailable. The rendered portraits still show every version.');
    this.programs = [];
    this.running = false;
    this.visible = false;
    this.motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.cymatics = [0, 0, 0, 0];
    this.time = 8;
    this.last = 0;
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
    this.version = version;
    try {
      for (const source of [version.bgShader, version.boltShader, version.shader]) this.programs.push(this.compile(source));
      this.canvas.dataset.version = version.id;
      this.canvas.dataset.state = 'ready';
      this.resize(); this.draw(this.time); this.schedule();
    } catch (error) {
      this.programs.forEach(pass => this.gl.deleteProgram(pass.program)); this.programs = [];
      this.canvas.dataset.state = 'failed'; this.onError('Face shader failed: ' + error.message); throw error;
    }
  }
  resize() {
    const size = Math.max(1, Math.min(768, Math.round(this.canvas.getBoundingClientRect().width * Math.min(devicePixelRatio, 1.5))));
    if (this.canvas.width !== size) this.canvas.width = this.canvas.height = size;
  }
  draw(time) {
    if (this.programs.length !== 3 || this.gl.isContextLost()) return;
    const graphics = this.gl, tune = this.version.defaults, size = this.canvas.width;
    const scalar = {
      time, hover: 0, talk: 0, blink: 0, smile: .25,
      faceGlow: tune.orbFaceGlow, eyeBright: tune.orbEyeBright, coronaW: tune.orbCoronaW,
      eyeSize: tune.orbEyeSize, mouthY: tune.orbMouthY, scanFreq: tune.orbScanFreq,
      skullSize: tune.orbSkullSize, scale: tune.orbScale,
      alphaBase: tune.bgAlphaBase, alphaScale: tune.bgAlphaScale, alphaMax: tune.bgAlphaMax,
      coreW: tune.boltCoreW, glowW: tune.boltGlowW, atmoW: tune.boltAtmoW,
      wideW: tune.boltWideW, flickBase: tune.boltFlicker, flashThresh: tune.boltFlashRate,
      boltMult: tune.boltMult, ...tune, ...(this.expression?.(time) || {})
    };
    const colors = {
      eyeColor: [tune.orbEyeR, tune.orbEyeG, tune.orbEyeB], skullColor: [tune.orbSkullR, tune.orbSkullG, tune.orbSkullB],
      tint: [tune.bgTintR, tune.bgTintG, tune.bgTintB], bgTint: [tune.bgTintR, tune.bgTintG, tune.bgTintB]
    };
    const vectors4 = { cymatics: this.cymatics };
    graphics.viewport(0, 0, size, size); graphics.clearColor(0, 0, 0, 0); graphics.clear(graphics.COLOR_BUFFER_BIT);
    graphics.enable(graphics.BLEND);
    this.programs.forEach((pass, passIndex) => {
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
      graphics.drawArrays(graphics.TRIANGLE_STRIP, 0, 4);
    });
    this.canvas.dataset.frames = String(Number(this.canvas.dataset.frames || 0) + 1);
  }
  stop() { cancelAnimationFrame(this.frame); this.frame = 0; this.running = false; this.last = 0; }
  schedule() {
    this.stop();
    if (!this.motion || !this.visible || document.hidden || this.programs.length !== 3 || this.gl.isContextLost()) return;
    this.running = true;
    const tick = now => {
      if (!this.running) return;
      try {
        if (!this.last || now - this.last >= 50) {
          this.time += this.last ? Math.min(.1, (now - this.last) / 1000) : 0;
          this.last = now; this.draw(this.time);
        }
        this.frame = requestAnimationFrame(tick);
      } catch (error) { this.stop(); this.onError(error.message); }
    };
    this.frame = requestAnimationFrame(tick);
  }
  destroy() {
    this.stop(); this.observer.disconnect(); this.resizer.disconnect();
    document.removeEventListener('visibilitychange', this.visibility);
    this.canvas.removeEventListener('webglcontextlost', this.lost);
    this.programs.forEach(pass => this.gl.deleteProgram(pass.program)); this.gl.deleteBuffer(this.quad);
  }
}
