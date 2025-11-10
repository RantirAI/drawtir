import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface Fire3DShadersProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  intensity?: number;
  height?: number;
  turbulence?: number;
  colorShift?: number;
}

const vertexShader = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float u_speed;
uniform float u_intensity;
uniform float u_height;
uniform float u_turbulence;
uniform float u_colorShift;

// Tanh approximation for tone mapping
vec4 tanhApprox(vec4 x) {
    vec4 x2 = x * x;
    return x * (3.0 + x2) / (3.0 + 3.0 * x2);
}

void main() {
    vec2 I = gl_FragCoord.xy;
    float t = iTime * u_speed;
    float i = 0.0;
    float z = 0.0;
    float d = 0.0;
    vec4 O = vec4(0.0);
    
    // Raymarching loop with 50 iterations
    for(float step = 0.0; step < 50.0; step++) {
        i = step;
        // Compute raymarch sample point
        vec3 p = z * normalize(vec3(I + I, 0) - vec3(iResolution.xy, iResolution.y));
        // Shift back and animate
        p.z += 5.0 + cos(t) * u_height;
        // Twist and rotate
        mat2 rotMat = mat2(cos(p.y * 0.5 + vec4(0, 33, 11, 0)));
        p.xz *= rotMat / max(p.y * 0.1 + 1.0, 0.1);
        // Turbulence loop (increase frequency)
        float freq = 2.0;
        for(int turbLoop = 0; turbLoop < 8; turbLoop++) {
            // Add a turbulence wave
            p += cos((p.yzx - vec3(t / 0.1, t, freq)) * freq * u_turbulence) / freq;
            freq = freq / 0.6;
        }
        // Sample approximate distance to hollow cone
        float dist = 0.01 + abs(length(p.xz) + p.y * 0.3 - 0.5) / 7.0;
        z += dist;
        d = dist;
        // Add color and glow attenuation
        vec4 color = (sin(z / 3.0 + vec4(7, 2, 3, 0) * u_colorShift) + 1.1) / d;
        O += color * u_intensity;
    }
    // Tanh tonemapping
    O = tanhApprox(O / 1000.0);
    
    gl_FragColor = O;
}
`;

export default function Fire3DShaders({
  speed = 1.0,
  intensity = 1.0,
  height = 1.0,
  turbulence = 1.0,
  colorShift = 1.0,
  className,
  children,
  ...props
}: Fire3DShadersProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.warn("WebGL not supported");
      return;
    }

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    gl.shaderSource(vs, vertexShader);
    gl.compileShader(vs);
    
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error("Fire3D vertex shader error:", gl.getShaderInfoLog(vs));
      return;
    }

    gl.shaderSource(fs, fragmentShader);
    gl.compileShader(fs);
    
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error("Fire3D fragment shader error:", gl.getShaderInfoLog(fs));
      return;
    }

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Fire3D program link error:", gl.getProgramInfoLog(program));
      return;
    }
    
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
    const iResolution = gl.getUniformLocation(program, "iResolution");
    const iTime = gl.getUniformLocation(program, "iTime");
    const u_speedLoc = gl.getUniformLocation(program, "u_speed");
    const u_intensityLoc = gl.getUniformLocation(program, "u_intensity");
    const u_heightLoc = gl.getUniformLocation(program, "u_height");
    const u_turbulenceLoc = gl.getUniformLocation(program, "u_turbulence");
    const u_colorShiftLoc = gl.getUniformLocation(program, "u_colorShift");

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
      if (u_speedLoc) gl.uniform1f(u_speedLoc, speed);
      if (u_intensityLoc) gl.uniform1f(u_intensityLoc, intensity);
      if (u_heightLoc) gl.uniform1f(u_heightLoc, height);
      if (u_turbulenceLoc) gl.uniform1f(u_turbulenceLoc, turbulence);
      if (u_colorShiftLoc) gl.uniform1f(u_colorShiftLoc, colorShift);

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
  }, [speed, intensity, height, turbulence, colorShift]);

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

export { Fire3DShaders };
