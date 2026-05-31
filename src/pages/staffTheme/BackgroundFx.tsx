import { useMemo, useEffect, useRef } from "react";
import { useStaffTheme } from "./StaffThemeContext";

export default function BackgroundFx() {
  const { theme } = useStaffTheme();
  const style = theme.bg_style;

  const items = useMemo(() => {
    const count = 28;
    return Array.from({ length: count }, (_, i) => ({
      i,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      dur: 6 + Math.random() * 10,
      size: 6 + Math.random() * 14,
      drift: (Math.random() - 0.5) * 80,
    }));
  }, [style]);

  if (!theme.enabled || style === "default") return null;

  if (style === "webgl") return <WebGLShader accent={theme.accent_color} />;

  if (style === "neon-grid") {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(${theme.accent_color}22 1px, transparent 1px), linear-gradient(90deg, ${theme.accent_color}22 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
        maskImage: "radial-gradient(ellipse at center, black 20%, transparent 80%)",
      }} />
    );
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <style>{`
        @keyframes fxFall { 0% { transform: translate3d(0,-10vh,0) rotate(0deg); opacity: 0 } 10% { opacity: 1 } 90% { opacity: 1 } 100% { transform: translate3d(var(--drift,0px),110vh,0) rotate(360deg); opacity: 0 } }
        @keyframes fxRise { 0% { transform: translate3d(0,110vh,0); opacity: 0 } 10% { opacity: .7 } 100% { transform: translate3d(var(--drift,0px),-10vh,0); opacity: 0 } }
        @keyframes fxTwinkle { 0%,100% { opacity: 0.3; transform: scale(1) } 50% { opacity: 1; transform: scale(1.4) } }
      `}</style>
      {items.map(p => {
        const common: React.CSSProperties = {
          position: "absolute",
          left: `${p.left}%`,
          width: p.size,
          height: p.size,
          // @ts-expect-error CSS var
          "--drift": `${p.drift}px`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.dur}s`,
          animationIterationCount: "infinite",
          animationTimingFunction: "linear",
        };

        if (style === "sakura") {
          return <span key={p.i} style={{
            ...common, top: 0,
            animationName: "fxFall",
            background: "#FFB7D5",
            borderRadius: "60% 0 60% 0",
            boxShadow: "0 0 6px #FF8FB5aa",
          }} />;
        }
        if (style === "stars") {
          return <span key={p.i} style={{
            ...common,
            top: `${Math.random() * 100}%`,
            width: 3 + Math.random() * 3,
            height: 3 + Math.random() * 3,
            background: theme.accent_color,
            borderRadius: "50%",
            boxShadow: `0 0 8px ${theme.accent_color}`,
            animationName: "fxTwinkle",
            animationDuration: `${2 + Math.random() * 3}s`,
          }} />;
        }
        if (style === "rain") {
          return <span key={p.i} style={{
            ...common,
            top: 0,
            width: 2,
            height: 18,
            background: "linear-gradient(to bottom, transparent, #7DD3FC)",
            animationName: "fxFall",
            animationDuration: `${1 + Math.random() * 1.5}s`,
            opacity: 0.6,
          }} />;
        }
        if (style === "bubbles") {
          return <span key={p.i} style={{
            ...common,
            bottom: 0,
            top: "auto",
            background: "transparent",
            border: `1px solid ${theme.accent_color}77`,
            borderRadius: "50%",
            animationName: "fxRise",
          }} />;
        }
        return null;
      })}
    </div>
  );
}

// ── WebGL шейдер ─────────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

const VERT = `attribute vec2 a_pos; void main(){gl_Position=vec4(a_pos,0,1);}`;
const FRAG = `
precision mediump float;
uniform float u_time;
uniform vec2  u_res;
uniform vec3  u_accent;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0.,a=.5;
  for(int i=0;i<5;i++){v+=a*noise(p);p*=2.1;a*=.5;}
  return v;
}
void main(){
  vec2 uv=(gl_FragCoord.xy/u_res)-.5;
  uv.x*=u_res.x/u_res.y;
  float t=u_time*.18;

  vec2 q=vec2(fbm(uv+t),fbm(uv+vec2(1.3,4.7)+t));
  vec2 r=vec2(fbm(uv+3.*q+vec2(1.7,.9)+t*.5),fbm(uv+3.*q+vec2(8.3,2.8)+t*.5));
  float f=fbm(uv+3.*r);

  float val=clamp(f*f*3.5,0.,1.);

  vec3 base=vec3(.02,.02,.04);
  vec3 mid=u_accent*.25;
  vec3 bright=u_accent*.6;
  vec3 col=mix(base,mid,val*.7)+bright*pow(val,3.)*1.2;

  // виньетка
  float vign=1.-smoothstep(.5,.95,length(uv*vec2(.9,1.1)));
  col*=vign;

  gl_FragColor=vec4(col,1.);
}`;

function WebGLShader({ accent }: { accent: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s); return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes  = gl.getUniformLocation(prog, "u_res");
    const uAccent = gl.getUniformLocation(prog, "u_accent");

    const rgb = hexToRgb(accent);

    const resize = () => {
      canvas.width  = Math.floor(window.innerWidth  * 0.5);
      canvas.height = Math.floor(window.innerHeight * 0.5);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const start = performance.now();
    const loop = () => {
      const t = (performance.now() - start) / 1000;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform3f(uAccent, rgb[0], rgb[1], rgb[2]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(prog);
    };
  }, [accent]);

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ width: "100%", height: "100%", imageRendering: "pixelated", opacity: 0.85 }}
    />
  );
}