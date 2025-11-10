import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const fragmentShader = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_speed;
uniform float u_glowIntensity;
uniform vec3 u_colorTint;
uniform float u_amplitude;
uniform float u_frequency;
uniform float u_starDensity;
uniform float u_colorShift;

// Fractal noise function
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
  
  // Multi-layer wave synthesis with adjustable frequency and amplitude
  float wave1 = sin(uv.x * 10.0 * u_frequency + time) * cos(uv.y * 8.0 * u_frequency + time * 1.5) * u_amplitude;
  float wave2 = sin(uv.x * 15.0 * u_frequency - time * 1.2) * cos(uv.y * 12.0 * u_frequency - time) * u_amplitude;
  float wave3 = sin(uv.x * 8.0 * u_frequency + time * 0.8) * cos(uv.y * 6.0 * u_frequency + time * 0.6) * u_amplitude;
  
  // Add fractal noise for organic texture
  float n = noise(uv * 3.0 * u_frequency + time * 0.2);
  n += noise(uv * 6.0 * u_frequency - time * 0.15) * 0.5;
  
  float combined = (wave1 + wave2 + wave3) / 3.0 + n * 0.3;
  
  // Procedural starfield with multiple layers
  float stars1 = step(0.99 - u_starDensity * 0.01, hash(floor(uv * 300.0 + time * 0.1)));
  float stars2 = step(0.995 - u_starDensity * 0.005, hash(floor(uv * 500.0 - time * 0.15)));
  
  // Twinkling effect
  float twinkle = sin(time * 3.0 + hash(floor(uv * 300.0)) * 6.28) * 0.5 + 0.5;
  float stars = (stars1 + stars2 * 0.5) * twinkle * u_starDensity;
  
  // Dynamic color cycling with colorShift
  vec3 color = vec3(
    0.5 + 0.5 * sin(combined * u_colorTint.x + time * u_colorShift),
    0.5 + 0.5 * sin(combined * u_colorTint.y + time * u_colorShift + 2.0),
    0.5 + 0.5 * sin(combined * u_colorTint.z + time * u_colorShift + 4.0)
  );
  
  // Radial gradient for cosmic glow
  float dist = length(uv - 0.5);
  float glow = 1.0 - smoothstep(0.0, 1.0, dist);
  
  // Combine all effects
  color = color * (1.0 + glow * 0.5) + stars * 0.4;
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

interface CosmicWavesProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  glowIntensity?: number;
  colorTint?: [number, number, number];
  amplitude?: number;
  frequency?: number;
  starDensity?: number;
  colorShift?: number;
}

export default function CosmicWaves({
  speed = 1.0,
  glowIntensity = 1.4,
  colorTint = [2.0, 4.0, 6.0],
  amplitude = 1.0,
  frequency = 1.0,
  starDensity = 1.0,
  colorShift = 1.0,
  className,
  children,
  ...props
}: CosmicWavesProps) {
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
    const u_amplitude = gl.getUniformLocation(program, "u_amplitude");
    const u_frequency = gl.getUniformLocation(program, "u_frequency");
    const u_starDensity = gl.getUniformLocation(program, "u_starDensity");
    const u_colorShift = gl.getUniformLocation(program, "u_colorShift");

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
      gl.uniform1f(u_amplitude, amplitude);
      gl.uniform1f(u_frequency, frequency);
      gl.uniform1f(u_starDensity, starDensity);
      gl.uniform1f(u_colorShift, colorShift);

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
  }, [speed, glowIntensity, colorTint, amplitude, frequency, starDensity, colorShift]);

  return (
    <div className={cn("relative w-full h-full", className)} {...props}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}

export { CosmicWaves };
