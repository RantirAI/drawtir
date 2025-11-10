import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const fragmentShader = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_speed;
uniform float u_glowIntensity;
uniform vec3 u_colorTint;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
  float time = u_time * u_speed;
  
  // Multiple rotating coordinate systems
  float angle1 = time * 0.3;
  float angle2 = time * 0.5;
  float angle3 = time * 0.7;
  
  vec2 uv1 = mat2(cos(angle1), -sin(angle1), sin(angle1), cos(angle1)) * uv;
  vec2 uv2 = mat2(cos(angle2), -sin(angle2), sin(angle2), cos(angle2)) * uv;
  vec2 uv3 = mat2(cos(angle3), -sin(angle3), sin(angle3), cos(angle3)) * uv;
  
  // Wave synthesis
  float pattern1 = sin(length(uv1) * 10.0 - time);
  float pattern2 = sin(length(uv2) * 15.0 + time);
  float pattern3 = sin(length(uv3) * 8.0 - time * 0.5);
  
  // Combine patterns
  float combined = (pattern1 + pattern2 + pattern3) / 3.0;
  
  // Create radial gradient for glow
  float dist = length(uv);
  float glow = 1.0 - smoothstep(0.0, 1.5, dist);
  
  // Color mixing
  vec3 color = vec3(
    0.5 + 0.5 * sin(combined * u_colorTint.x + time),
    0.5 + 0.5 * sin(combined * u_colorTint.y + time + 2.0),
    0.5 + 0.5 * sin(combined * u_colorTint.z + time + 4.0)
  );
  
  color *= glow * u_glowIntensity;
  
  gl_FragColor = vec4(color, 1.0);
}
`;

const vertexShader = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

interface KaleidoscopeProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  glowIntensity?: number;
  colorTint?: [number, number, number];
}

export default function Kaleidoscope({
  speed = 1.0,
  glowIntensity = 1.5,
  colorTint = [1.0, 2.0, 9.0],
  className,
  children,
  ...props
}: KaleidoscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    // Compile shaders
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

    // Setup geometry
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

    // Get uniform locations
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
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}

export { Kaleidoscope };
