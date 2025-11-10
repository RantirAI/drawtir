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

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float time = u_time * u_speed;
  
  // Create columns of falling characters
  vec2 col = floor(uv * vec2(30.0, 50.0));
  float charTime = time + hash(col) * 10.0;
  float trail = fract(charTime * 0.3);
  
  // Character position in column
  float y = fract(uv.y * 50.0);
  float charPos = step(trail - 0.1, y) * step(y, trail);
  
  // Fade trail
  float fade = smoothstep(0.0, 0.1, trail - y);
  
  // Random character flicker
  float flicker = hash(col + floor(charTime));
  
  // Color with tint
  vec3 color = vec3(0.0);
  color.r = u_colorTint.x * charPos * fade * flicker;
  color.g = u_colorTint.y * charPos * fade * flicker;
  color.b = u_colorTint.z * charPos * fade * flicker;
  
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

interface MatrixProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  glowIntensity?: number;
  colorTint?: [number, number, number];
}

export default function Matrix({
  speed = 1.0,
  glowIntensity = 1.5,
  colorTint = [0.2, 1.0, 0.3],
  className,
  children,
  ...props
}: MatrixProps) {
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

export { Matrix };
