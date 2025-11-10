import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const fragmentShader = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_speed;
uniform float u_glowIntensity;
uniform vec3 u_colorTint;

float hash(float p) {
  return fract(sin(p) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float time = u_time * u_speed;
  
  // Glitch displacement
  float glitchLine = floor(uv.y * 20.0 + time * 5.0);
  float glitchIntensity = step(0.9, hash(glitchLine));
  
  // Chromatic aberration
  vec2 offset = vec2(glitchIntensity * 0.05, 0.0);
  float r = step(0.5, uv.x + offset.x);
  float g = step(0.5, uv.x);
  float b = step(0.5, uv.x - offset.x);
  
  // Scan lines
  float scanline = sin(uv.y * 100.0 + time * 10.0) * 0.1 + 0.9;
  
  // Block corruption
  float blockX = floor(uv.x * 10.0);
  float blockY = floor(uv.y * 10.0);
  float block = step(0.95, hash(blockX + blockY + floor(time * 2.0)));
  
  // Combine effects
  vec3 color = vec3(
    r * u_colorTint.x,
    g * u_colorTint.y,
    b * u_colorTint.z
  );
  
  color *= scanline;
  color = mix(color, vec3(1.0), block * 0.5);
  color *= u_glowIntensity;
  
  gl_FragColor = vec4(color, 1.0);
}
`;

const vertexShader = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

interface GlitchProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  glowIntensity?: number;
  colorTint?: [number, number, number];
}

export default function Glitch({
  speed = 1.0,
  glowIntensity = 1.2,
  colorTint = [1.0, 0.0, 1.0],
  className,
  children,
  ...props
}: GlitchProps) {
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

export { Glitch };
