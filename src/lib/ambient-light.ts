// One low-resolution fullscreen triangle. No textures, post-processing or libraries.
export function createAmbientLight(canvas: HTMLCanvasElement, host: HTMLElement): () => void {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false, depth: false, powerPreference: "low-power" });
  if (!gl) return () => {};
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  function release() {
    shaders.forEach(shader => gl!.deleteShader(shader));
    gl!.deleteBuffer(buffer);
    gl!.deleteProgram(program);
  }
  function shader(type: number, source: string) {
    const result = gl!.createShader(type);
    if (!result) return null;
    shaders.push(result);
    gl!.shaderSource(result, source);
    gl!.compileShader(result);
    return gl!.getShaderParameter(result, gl!.COMPILE_STATUS) ? result : null;
  }
  const vertex = shader(gl.VERTEX_SHADER, "attribute vec2 p; varying vec2 uv; void main(){uv=p*.5+.5; gl_Position=vec4(p,0.,1.);}");
  const fragment = shader(gl.FRAGMENT_SHADER, `precision mediump float;
    varying vec2 uv; uniform float time; uniform vec2 pointer;
    void main(){
      vec2 p=uv-vec2(.69,.51)-pointer*.025;
      p.x*=1.5;
      float a=atan(p.y,p.x), r=length(p);
      float wave=sin(a*3.+time*.17)*.018+sin(a*5.-time*.12)*.012;
      float halo=exp(-pow((r-.32-wave)*16.,2.));
      float glow=exp(-r*r*5.)*.16;
      float sheen=pow(max(0.,sin(a*2.+time*.15)),12.)*halo;
      vec3 blue=mix(vec3(.29,.75,.83),vec3(.89,.88,.98),sin(a+time*.09)*.5+.5);
      gl_FragColor=vec4(blue,halo*.22+sheen*.16+glow);
    }`);
  if (!program || !buffer || !vertex || !fragment) { release(); return () => {}; }
  gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { release(); return () => {}; }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const time = gl.getUniformLocation(program, "time"), pointer = gl.getUniformLocation(program, "pointer");
  let frame = 0, visible = false, last = -Infinity, elapsed = 0;
  let x = 0, y = 0, targetX = 0, targetY = 0;
  function resize() {
    canvas.width = Math.max(1, Math.round(host.clientWidth * .65));
    canvas.height = Math.max(1, Math.round(host.clientHeight * .65));
    gl!.viewport(0, 0, canvas.width, canvas.height);
  }
  function draw(now: number) {
    if (!visible || document.hidden) { frame = 0; return; }
    if (now - last >= 1000 / 30) {
      elapsed += Math.min((now - last) / 1000, .05); last = now;
      x += (targetX - x) * .08; y += (targetY - y) * .08;
      host.style.setProperty("--scene-x", `${x * 7}px`);
      host.style.setProperty("--scene-y", `${y * 5}px`);
      gl!.uniform1f(time, elapsed); gl!.uniform2f(pointer, x, y);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }
    frame = requestAnimationFrame(draw);
  }
  function resume() { if (visible && !document.hidden && !frame) { last = performance.now(); frame = requestAnimationFrame(draw); } }
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); }, { threshold: .01 });
  const size = new ResizeObserver(resize);
  function move(event: PointerEvent) {
    const rect = host.getBoundingClientRect();
    targetX = (event.clientX - rect.left) / rect.width * 2 - 1;
    targetY = (event.clientY - rect.top) / rect.height * 2 - 1;
  }
  function reset() { targetX = targetY = 0; }
  function lost() { visible = false; cancelAnimationFrame(frame); frame = 0; canvas.style.opacity = "0"; }
  resize(); observer.observe(host); size.observe(host);
  host.addEventListener("pointermove", move, { passive: true }); host.addEventListener("pointerleave", reset);
  document.addEventListener("visibilitychange", resume); canvas.addEventListener("webglcontextlost", lost);
  return () => {
    cancelAnimationFrame(frame); observer.disconnect(); size.disconnect();
    host.removeEventListener("pointermove", move); host.removeEventListener("pointerleave", reset);
    document.removeEventListener("visibilitychange", resume); canvas.removeEventListener("webglcontextlost", lost);
    host.style.removeProperty("--scene-x"); host.style.removeProperty("--scene-y");
    // Keep the canvas context reusable when the visitor resumes the atmosphere.
    release();
  };
}
