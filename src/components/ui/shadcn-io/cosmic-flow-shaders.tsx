import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const fragmentShader = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform float u_speed;
uniform float u_amplitude;
uniform float u_frequency;
uniform float u_starDensity;
uniform float u_colorShift;

// Hash function for pseudo-random values
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Smooth noise function
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

// Fractal noise
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for(int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// Star field generation
float stars(vec2 p, float density) {
  vec2 grid = floor(p * density);
  vec2 local = fract(p * density);
  float h = hash(grid);
  if(h > 0.95) {
    float d = length(local - 0.5);
    float star = exp(-d * 20.0);
    return star * (0.5 + 0.5 * sin(iTime * 2.0 + h * 10.0));
  }
  return 0.0;
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 uv = fragCoord.xy / iResolution.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= iResolution.x / iResolution.y;
  
  float time = iTime * u_speed;
  
  // Create flowing wave patterns
  vec2 wavePos = p * u_frequency;
  wavePos.y += time * 0.3;
  
  // Multiple wave layers
  float wave1 = sin(wavePos.x + cos(wavePos.y + time) * 0.5) * u_amplitude;
  float wave2 = sin(wavePos.x * 1.3 - wavePos.y * 0.7 + time * 1.2) * u_amplitude * 0.7;
  float wave3 = sin(wavePos.x * 0.8 + wavePos.y * 1.1 - time * 0.8) * u_amplitude * 0.5;
  
  // Combine waves
  float waves = (wave1 + wave2 + wave3) * 0.3;
  
  // Add fractal noise for organic texture
  vec2 noisePos = p * 1.5 + vec2(time * 0.1, time * 0.05);
  float noiseValue = fbm(noisePos) * 0.4;
  
  // Combine waves and noise
  float pattern = waves + noiseValue;
  
  // Create flowing cosmic gradient
  float gradient = length(p) * 0.8;
  gradient += pattern;
  
  // Color cycling through cosmic spectrum
  vec3 color1 = vec3(0.1, 0.2, 0.8); // Deep blue
  vec3 color2 = vec3(0.6, 0.1, 0.9); // Purple
  vec3 color3 = vec3(0.1, 0.8, 0.9); // Cyan
  vec3 color4 = vec3(0.9, 0.3, 0.6); // Pink
  
  // Color interpolation based on pattern and time
  float colorTime = time * u_colorShift + pattern * 2.0;
  vec3 finalColor;
  float t = fract(colorTime * 0.2);
  if(t < 0.25) {
    finalColor = mix(color1, color2, t * 4.0);
  } else if(t < 0.5) {
    finalColor = mix(color2, color3, (t - 0.25) * 4.0);
  } else if(t < 0.75) {
    finalColor = mix(color3, color4, (t - 0.5) * 4.0);
  } else {
    finalColor = mix(color4, color1, (t - 0.75) * 4.0);
  }
  
  // Apply wave intensity
  finalColor *= (0.5 + pattern * 0.8);
  
  // Add star field
  float starField = stars(p + vec2(time * 0.02, time * 0.01), u_starDensity * 15.0);
  starField += stars(p * 1.5 + vec2(-time * 0.015, time * 0.008), u_starDensity * 12.0);
  finalColor += vec3(starField * 0.8);
  
  // Add subtle glow effect
  float glow = exp(-length(p) * 0.5) * 0.3;
  finalColor += glow * vec3(0.2, 0.4, 0.8);
  
  // Vignette effect
  float vignette = 1.0 - length(uv - 0.5) * 1.2;
  vignette = smoothstep(0.0, 1.0, vignette);
  finalColor *= vignette;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const vertexShader = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

interface CosmicFlowShadersProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  amplitude?: number;
  frequency?: number;
  starDensity?: number;
  colorShift?: number;
}

export default function CosmicFlowShaders({
  speed = 1.0,
  amplitude = 1.2,
  frequency = 0.8,
  starDensity = 1.0,
  colorShift = 1.0,
  className,
  children,
  ...props
}: CosmicFlowShadersProps) {
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

    const iResolution = gl.getUniformLocation(program, "iResolution");
    const iTime = gl.getUniformLocation(program, "iTime");
    const u_speed = gl.getUniformLocation(program, "u_speed");
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

      gl.uniform2f(iResolution, canvas.width, canvas.height);
      gl.uniform1f(iTime, timeRef.current);
      gl.uniform1f(u_speed, speed);
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
  }, [speed, amplitude, frequency, starDensity, colorShift]);

  return (
    <div className={cn("relative w-full h-full", className)} {...props}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}

export { CosmicFlowShaders };
