import { useEffect, useRef } from "react";
import * as THREE from "three";

interface WebGLShaderProps {
  className?: string;
  xScale?: number;
  yScale?: number;
  distortion?: number;
  colorR?: number;
  colorG?: number;
  colorB?: number;
}

export function WebGLShader({
  className = "",
  xScale = 1.0,
  yScale = 0.5,
  distortion = 0.05,
}: WebGLShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const refsRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    animationId: number | null;
    uniforms: Record<string, { value: unknown }> | null;
  }>({ renderer: null, animationId: null, uniforms: null });

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const refs = refsRef.current;

    const vertexShader = `
      attribute vec3 position;
      void main() { gl_Position = vec4(position, 1.0); }
    `;

    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform float xScale;
      uniform float yScale;
      uniform float distortion;
      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
        float d = length(p) * distortion;
        float rx = p.x * (1.0 + d);
        float gx = p.x;
        float bx = p.x * (1.0 - d);
        float r = 0.05 / abs(p.y + sin((rx + time) * xScale) * yScale);
        float g = 0.05 / abs(p.y + sin((gx + time) * xScale) * yScale);
        float b = 0.05 / abs(p.y + sin((bx + time) * xScale) * yScale);
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `;

    const scene = new THREE.Scene();
    refs.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    refs.renderer.setClearColor(new THREE.Color(0x000000));

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1);

    refs.uniforms = {
      resolution: { value: [canvas.offsetWidth, canvas.offsetHeight] },
      time: { value: 0.0 },
      xScale: { value: xScale },
      yScale: { value: yScale },
      distortion: { value: distortion },
    };

    const positions = new THREE.BufferAttribute(
      new Float32Array([-1,-1,0, 1,-1,0, -1,1,0, 1,-1,0, -1,1,0, 1,1,0]),
      3
    );
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", positions);

    const material = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: refs.uniforms,
      side: THREE.DoubleSide,
    });

    scene.add(new THREE.Mesh(geometry, material));

    const handleResize = () => {
      if (!refs.renderer || !refs.uniforms) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      refs.renderer.setSize(w, h, false);
      (refs.uniforms.resolution.value as number[]) = [w, h];
    };

    handleResize();

    const animate = () => {
      if (refs.uniforms) refs.uniforms.time.value = (refs.uniforms.time.value as number) + 0.01;
      refs.renderer?.render(scene, camera);
      refs.animationId = requestAnimationFrame(animate);
    };

    refs.animationId = requestAnimationFrame(animate);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (refs.animationId) cancelAnimationFrame(refs.animationId);
      refs.renderer?.dispose();
    };
  }, [xScale, yScale, distortion]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full block ${className}`}
    />
  );
}

export default WebGLShader;