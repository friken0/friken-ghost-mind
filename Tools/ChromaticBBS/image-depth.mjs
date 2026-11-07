// The field textures encode relative relief, white toward the viewer.
export function depthAngles(focus, degrees = 12) {
  const length = Math.max(1, Math.hypot(...focus));
  const angle = degrees * Math.PI / 180 / length;
  return [-focus[1] * angle, focus[0] * angle];
}

export function mountImageDepth(canvas, assets) {
  const gl = canvas.getContext('webgl2', {alpha:false, antialias:false});
  if (!gl || gl.isContextLost()) return null;
  const program = gl.createProgram(), shaders = [], textures = [];
  const mesh = gl.createBuffer(), indices = gl.createBuffer();
  function destroy() {
    for (const texture of textures) gl.deleteTexture(texture);
    gl.deleteBuffer(mesh);
    gl.deleteBuffer(indices);
    gl.deleteProgram(program);
  }
  function shader(type, source) {
    const compiled = gl.createShader(type);
    shaders.push(compiled);
    gl.shaderSource(compiled, source);
    gl.compileShader(compiled);
    if (!gl.getShaderParameter(compiled, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(compiled));
    gl.attachShader(program, compiled);
  }
  function texture(image, depth = false) {
    const result = gl.createTexture();
    textures.push(result);
    gl.bindTexture(gl.TEXTURE_2D, result);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, depth ? gl.NONE : gl.BROWSER_DEFAULT_WEBGL);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !depth);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return result;
  }
  try {
    shader(gl.VERTEX_SHADER, `#version 300 es
      layout(location=0) in vec2 point;
      uniform sampler2D relief, ground;
      uniform vec2 viewport, origin, extent, angle, limits;
      uniform float groundFrom;
      out vec2 uv;
      void main() {
        uv = point;
        float side = min(extent.x, extent.y);
        float d = mix(limits.x, limits.y, texture(relief, uv).r);
        if (groundFrom > 0. && limits.x > 0. && uv.y > groundFrom - .16) {
          float contact = smoothstep(groundFrom - .16, groundFrom, uv.y);
          d = mix(d, .25 * texture(ground, uv).r, contact);
        }
        float z = (d - .25) * .32;
        // Remove perspective stretch from the resting photo. Only a tilted
        // camera reveals the relief, so the portrait stays exact head-on.
        const float strength = .20;
        vec3 p = vec3((uv - .5) * extent / side * (1. - z * strength), z);
        vec2 s = sin(angle), c = cos(angle);
        p.yz = mat2(c.x, s.x, -s.x, c.x) * p.yz;
        p.xz = mat2(c.y, -s.y, s.y, c.y) * p.xz;
        float perspective = 1. - p.z * strength;
        vec2 center = 2. * (origin + extent * .5) / viewport - 1.;
        vec2 ndc = center + 2. * p.xy * side / (viewport * perspective);
        gl_Position = vec4(ndc.x * perspective, -ndc.y * perspective, 0., perspective);
      }`);
    shader(gl.FRAGMENT_SHADER, `#version 300 es
      precision mediump float;
      uniform sampler2D photo;
      in vec2 uv;
      out vec4 color;
      void main() { color = texture(photo, uv); }
    `);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
    const steps = 96, vertices = [], order = [];
    for (let y = 0; y <= steps; y++) for (let x = 0; x <= steps; x++) vertices.push(x / steps, y / steps);
    for (let y = 0; y < steps; y++) for (let x = 0; x < steps; x++) {
      const a = y * (steps + 1) + x, b = a + steps + 1;
      order.push(a, b, a + 1, a + 1, b, b + 1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(order), gl.STATIC_DRAW);
    const planes = [
      [texture(assets.background), texture(assets.backgroundDepth, true), 0, .25],
      [texture(assets.subject), texture(assets.subjectDepth, true), .25, 1],
    ];
    const uniforms = Object.fromEntries(
      ['viewport','origin','extent','angle','limits','photo','relief','ground','groundFrom'].map(name => [name, gl.getUniformLocation(program, name)])
    );
    gl.useProgram(program);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(uniforms.photo, 0);
    gl.uniform1i(uniforms.relief, 1);
    gl.uniform1i(uniforms.ground, 2);
    gl.uniform1f(uniforms.groundFrom, assets.groundFrom ?? -1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, planes[0][1]);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(.025, .047, .07, 1);
    return {
      paint(frame, angles) {
        if (gl.isContextLost()) return false;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(uniforms.viewport, canvas.width, canvas.height);
        gl.uniform2f(uniforms.origin, frame.x, frame.y);
        gl.uniform2f(uniforms.extent, frame.w, frame.h);
        gl.uniform2fv(uniforms.angle, angles);
        for (const [photo, relief, far, near] of planes) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, photo);
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, relief);
          gl.uniform2f(uniforms.limits, far, near);
          gl.drawElements(gl.TRIANGLES, order.length, gl.UNSIGNED_SHORT, 0);
        }
        return true;
      },
      destroy,
    };
  } catch {
    destroy();
    return null;
  } finally {
    for (const compiled of shaders) gl.deleteShader(compiled);
  }
}
