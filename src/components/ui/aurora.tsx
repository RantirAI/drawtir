import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const fragmentShader = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_speed;
uniform float u_glowIntensity;
uniform vec3 u_colorTint;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float time = u_time * u_speed;
  
  // Flowing aurora waves
  float wave1 = sin(uv.x * 5.0 + time) * 0.5 + 0.5;
  float wave2 = sin(uv.x * 3.0 - time * 1.5) * 0.5 + 0.5;
  
  // Add fractal noise for organic feel
  float n = noise(vec2(uv.x * 3.0, uv.y * 2.0 + time * 0.5));
  n += noise(vec2(uv.x * 6.0, uv.y * 4.0 - time)) * 0.5;
  
  // Vertical gradient for aurora shape
  float gradient = smoothstep(0.3, 0.7, uv.y);
  
  // Combine waves and noise
  float aurora = (wave1 + wave2) * n * gradient;
  
  // Aurora colors with tint
  vec3 color = vec3(
    0.5 + 0.5 * sin(aurora * u_colorTint.x + time),
    0.5 + 0.5 * sin(aurora * u_colorTint.y + time + 2.0),
    0.5 + 0.5 * sin(aurora * u_colorTint.z + time + 4.0)
  );
  
  color *= u_glowIntensity * aurora;
  
  gl_FragColor = vec4(color, 1.0);
}
`;

const vertexShader = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

interface AuroraProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  glowIntensity?: number;
  colorTint?: [number, number, number];
}

export default function Aurora({
  speed = 1.0,
  glowIntensity = 1.8,
  colorTint = [1.0, 3.0, 5.0],
  className,
  children,
  ...props
}: AuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    gl.shaderSource(vs, vertexShader);
    gl.compileShader(vs);
    gl.shaderSource(fs, fragmentShader);
    gl.compileShader(fs);

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const u_resolution = gl.getUniformLocation(program, "u_resolution");
    const u_time = gl.getUniformLocation(program, "u_time");
    const u_speed = gl.getUniformLocation(program, "u_speed");
    const u_glowIntensity = gl.getUniformLocation(program, "u_glowIntensity");
    const u_colorTint = gl.getUniformLocation(program, "u_colorTint");

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      timeRef.current += 0.016;

      gl.uniform2f(u_resolution, canvas.width, canvas.height);
      gl.uniform1f(u_time, timeRef.current);
      gl.uniform1f(u_speed, speed);
      gl.uniform1f(u_glowIntensity, glowIntensity);
      gl.uniform3f(u_colorTint, colorTint[0], colorTint[1], colorTint[2]);

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [speed, glowIntensity, colorTint]);

  return (
    <div className={cn("relative w-full h-full", className)} {...props}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}

export { Aurora };
