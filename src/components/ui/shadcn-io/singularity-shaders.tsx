import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SingularityShadersProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  intensity?: number;
  size?: number;
  waveStrength?: number;
  colorShift?: number;
}

export function SingularityShaders({
  speed = 1.0,
  intensity = 1.0,
  size = 1.0,
  waveStrength = 1.0,
  colorShift = 1.0,
  className,
  children,
  ...props
}: SingularityShadersProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment shader with singularity effects
    const fragmentShaderSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_speed;
      uniform float u_intensity;
      uniform float u_size;
      uniform float u_waveStrength;
      uniform float u_colorShift;

      #define PI 3.14159265359

      // Hash function
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      // Rotate 2D
      mat2 rotate2D(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = (uv * 2.0 - 1.0);
        p.x *= u_resolution.x / u_resolution.y;

        float time = u_time * u_speed;

        // Distance from center (singularity)
        float dist = length(p);

        // Gravitational lensing - spacetime curvature
        float gravityField = 1.0 / (1.0 + dist * dist * (2.0 / u_size));
        vec2 lensedP = p * gravityField;

        // Logarithmic spiral coordinates (blackhole physics)
        float angle = atan(lensedP.y, lensedP.x);
        float spiral = log(dist + 0.1) * 0.5;
        
        // Rotate with time for accretion disk rotation
        angle += time * 0.5 + spiral * 2.0;

        // Accretion disk simulation with wave accumulation
        float diskPattern = 0.0;
        for (int i = 0; i < 5; i++) {
          float freq = float(i + 1) * 2.0;
          float waveAngle = angle * freq + time * float(i + 1) * 0.3;
          float waveDist = sin(spiral * freq * 3.0 - time * float(i + 1) * 0.5);
          diskPattern += sin(waveAngle) * waveDist * u_waveStrength;
        }
        diskPattern = diskPattern * 0.2 + 0.5;

        // Event horizon darkness - distance-based attenuation
        float eventHorizon = u_size * 0.15;
        float horizonFade = smoothstep(eventHorizon, eventHorizon * 2.5, dist);

        // Photon sphere highlighting - rim lighting
        float photonSphere = u_size * 0.25;
        float photonGlow = exp(-abs(dist - photonSphere) * 8.0) * 2.0;

        // Perspective warping near singularity
        float warp = 1.0 - smoothstep(0.0, u_size * 0.5, dist);
        diskPattern += warp * 0.3;

        // Exponential gradient for brightness falloff
        float brightness = exp(-dist * 1.5) * u_intensity;
        brightness += photonGlow * u_intensity * 0.5;

        // Red/blue shifting - Doppler effects
        float doppler = sin(angle * 3.0 + time) * 0.5 + 0.5;
        vec3 blueShift = vec3(0.3, 0.5, 1.0);
        vec3 redShift = vec3(1.0, 0.3, 0.1);
        vec3 dopplerColor = mix(blueShift, redShift, doppler);

        // Base singularity colors
        vec3 innerColor = vec3(0.0, 0.0, 0.0);
        vec3 diskColor = vec3(1.0, 0.6, 0.2) * u_colorShift;
        vec3 outerColor = vec3(0.2, 0.4, 1.0) * u_colorShift;

        // Combine colors based on disk pattern and Doppler
        vec3 accretionColor = mix(diskColor, outerColor, diskPattern);
        accretionColor = mix(accretionColor, dopplerColor, 0.3);

        // Apply brightness and horizon fade
        vec3 finalColor = accretionColor * brightness * horizonFade;

        // Add photon sphere rim
        finalColor += vec3(photonGlow) * vec3(0.8, 0.9, 1.0) * horizonFade;

        // Event horizon center darkness
        finalColor = mix(innerColor, finalColor, horizonFade);

        // Outer glow
        float outerGlow = exp(-dist * 0.5) * 0.2;
        finalColor += outerGlow * dopplerColor * u_intensity;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // Create and compile shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Create program
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Set up geometry
    const positions = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      1, 1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const speedLocation = gl.getUniformLocation(program, "u_speed");
    const intensityLocation = gl.getUniformLocation(program, "u_intensity");
    const sizeLocation = gl.getUniformLocation(program, "u_size");
    const waveStrengthLocation = gl.getUniformLocation(program, "u_waveStrength");
    const colorShiftLocation = gl.getUniformLocation(program, "u_colorShift");

    // Set resolution
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    // Animation loop
    let animationId: number;
    let startTime = Date.now();

    const render = () => {
      const currentTime = (Date.now() - startTime) / 1000;

      gl.uniform1f(timeLocation, currentTime);
      gl.uniform1f(speedLocation, speed);
      gl.uniform1f(intensityLocation, intensity);
      gl.uniform1f(sizeLocation, size);
      gl.uniform1f(waveStrengthLocation, waveStrength);
      gl.uniform1f(colorShiftLocation, colorShift);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [speed, intensity, size, waveStrength, colorShift]);

  return (
    <div className={cn("relative w-full h-full", className)} {...props}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}
