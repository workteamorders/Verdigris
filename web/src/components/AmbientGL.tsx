'use client';

import { useEffect, useRef } from 'react';
import { attachInput, createFrameWatch } from '@/lib/ambient-input';
import { tokenRgb, useMotion } from '@/lib/motion';
import styles from './Ambient.module.css';

/** Out of the page flow from the very first frame, whether or not the stylesheet has arrived yet. */
const FIXED = { position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' } as const;

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

// Verdigris growth: warped noise thresholded into patches, rim-lit at the edges, with fine speckle inside.
// The cursor pulls the field and warms it; a click sends a ring through it.
const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uLens;
uniform float uScroll;
uniform vec4 uRip[3];
uniform vec3 uBronze;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uBright;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 q0 = vec2(uv.x * asp, uv.y);
  vec2 m = vec2(uMouse.x * asp, uMouse.y);
  float d = distance(q0, m);

  vec2 p = q0 * 2.4;
  p.y -= uScroll * 0.22;
  // The lens drags the sampling point toward the cursor.
  vec2 pull = (m - q0) * exp(-d * d * 9.0) * uLens * 0.9;
  p += pull;

  vec2 w = vec2(fbm(p + vec2(0.0, uTime * 0.035)), fbm(p + vec2(5.2, 1.3) - vec2(uTime * 0.03, 0.0)));
  float f = fbm(p + 2.1 * w + vec2(uTime * 0.018, 0.0));

  float lens = exp(-d * d * 22.0) * uLens;
  f += lens * 0.10;

  for (int i = 0; i < 3; i++){
    vec4 r = uRip[i];
    if (r.w > 0.5){
      float rd = distance(q0, vec2(r.x * asp, r.y));
      float ring = exp(-pow((rd - r.z * 0.9) * 11.0, 2.0)) * (1.0 - r.z);
      f += ring * 0.22;
    }
  }

  float body = smoothstep(0.50, 0.60, f);
  float rim = smoothstep(0.46, 0.52, f) - smoothstep(0.55, 0.64, f);
  float grain = noise(q0 * 140.0);
  float speck = smoothstep(0.80, 0.96, grain) * body;

  vec3 col = uDeep * body * 0.26 + uMid * rim * 0.22 + uBright * speck * 0.12;
  col += uBronze * lens * 0.10;
  col = clamp(col, 0.0, 1.0);
  float a = max(col.r, max(col.g, col.b));
  gl_FragColor = vec4(col, a);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

const to01 = (c: [number, number, number]): [number, number, number] => [c[0] / 255, c[1] / 255, c[2] / 255];

/** Full tier only. Falls back to the 2D layer through `onFail` if WebGL is missing, fails to compile, or is lost. */
export default function AmbientGL({ onFail }: { onFail: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { degrade } = useMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
    if (!gl) {
      onFail();
      return;
    }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) {
      onFail();
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      onFail();
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u('uRes');
    const uTime = u('uTime');
    const uMouse = u('uMouse');
    const uLens = u('uLens');
    const uScroll = u('uScroll');
    const uRip = u('uRip');
    gl.uniform3fv(u('uBronze'), to01(tokenRgb('--patina-0', [201, 138, 75])));
    gl.uniform3fv(u('uDeep'), to01(tokenRgb('--patina-deep', [31, 90, 88])));
    gl.uniform3fv(u('uMid'), to01(tokenRgb('--patina', [63, 143, 126])));
    gl.uniform3fv(u('uBright'), to01(tokenRgb('--patina-text', [127, 203, 182])));

    const SCALE = 0.5;
    const resize = () => {
      canvas.width = Math.max(2, Math.round(window.innerWidth * SCALE));
      canvas.height = Math.max(2, Math.round(window.innerHeight * SCALE));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();

    const { input, detach } = attachInput();
    let lens = 0;
    let mx = 0.5;
    let my = 0.6;
    let t = 0;
    let last = 0;
    let raf = 0;
    const watch = createFrameWatch(22);
    const rip = new Float32Array(12);

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const rawDt = last === 0 ? 16 : now - last;
      last = now;
      if (watch(rawDt, now)) degrade();
      const dt = Math.min(0.05, rawDt / 1000);
      t += dt;
      const tx = input.x / window.innerWidth;
      const ty = 1 - input.y / window.innerHeight;
      const k = Math.min(1, dt * 5);
      mx += (tx - mx) * k;
      my += (ty - my) * k;
      lens += ((input.active ? 1 : 0) - lens) * Math.min(1, dt * 4);

      input.ripples = input.ripples.filter((r) => now - r.t0 < 1600);
      rip.fill(0);
      input.ripples.slice(-3).forEach((r, i) => {
        rip[i * 4] = r.x / window.innerWidth;
        rip[i * 4 + 1] = 1 - r.y / window.innerHeight;
        rip[i * 4 + 2] = Math.min(1, Math.max(0, (now - r.t0) / 1600));
        rip[i * 4 + 3] = 1;
      });

      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, mx, my);
      gl.uniform1f(uLens, lens);
      gl.uniform1f(uScroll, window.scrollY / Math.max(1, window.innerHeight));
      gl.uniform4fv(uRip, rip);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const start = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVis = () => (document.hidden ? stop() : start());
    const onLost = (e: Event) => {
      e.preventDefault();
      stop();
      onFail();
    };

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVis);
    canvas.addEventListener('webglcontextlost', onLost);
    start();
    return () => {
      stop();
      detach();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [degrade, onFail]);

  return <canvas ref={ref} className={styles.canvas} style={FIXED} aria-hidden="true" />;
}
