import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface CosmicWavesShadersProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  amplitude?: number;
  frequency?: number;
  starDensity?: number;
  colorShift?: number;
}

export function CosmicWavesShaders({
  speed = 1.0,
  amplitude = 1.0,
  frequency = 1.0,
  starDensity = 1.0,
  colorShift = 1.0,
  className,
  ...props
}: CosmicWavesShadersProps) {
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

    // Fragment shader with cosmic waves
    const fragmentShaderSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_speed;
      uniform float u_amplitude;
      uniform float u_frequency;
      uniform float u_starDensity;
      uniform float u_colorShift;

      // Hash function for pseudo-random numbers
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      // Fractal noise
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

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          value += amplitude * noise(p);
          p *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= u_resolution.x / u_resolution.y;

        float time = u_time * u_speed * 0.5;

        // Multi-layer wave synthesis
        float wave1 = sin(p.x * u_frequency * 2.0 + time) * u_amplitude * 0.3;
        float wave2 = sin(p.x * u_frequency * 3.0 - time * 1.5) * u_amplitude * 0.2;
        float wave3 = sin(p.x * u_frequency * 4.0 + time * 0.8) * u_amplitude * 0.15;
        float waves = wave1 + wave2 + wave3;

        // Apply waves to y-coordinate
        float y = p.y - waves;

        // Fractal noise for organic texture
        vec2 noiseCoord = vec2(p.x * 2.0, y * 2.0 + time * 0.2);
        float noiseValue = fbm(noiseCoord);

        // Base cosmic gradient
        float gradient = smoothstep(-1.0, 1.0, y);
        gradient = mix(gradient, noiseValue, 0.3);

        // Dynamic color cycling
        vec3 color1 = vec3(0.1, 0.2, 0.5);
        vec3 color2 = vec3(0.6, 0.2, 0.8);
        vec3 color3 = vec3(0.2, 0.5, 0.9);
        
        float colorCycle = sin(time * u_colorShift * 0.5) * 0.5 + 0.5;
        vec3 baseColor = mix(mix(color1, color2, gradient), color3, colorCycle);

        // Add wave intensity glow
        float waveGlow = exp(-abs(y) * 2.0) * 0.5;
        baseColor += vec3(waveGlow * 0.3, waveGlow * 0.5, waveGlow * 0.8);

        // Procedural starfield
        vec2 starCoord = uv * 50.0;
        float stars = 0.0;
        for (int i = 0; i < 3; i++) {
          vec2 cell = floor(starCoord);
          vec2 cellFract = fract(starCoord);
          float starHash = hash(cell + float(i) * 10.0);
          
          if (starHash > 0.98) {
            vec2 starPos = vec2(hash(cell + 0.1), hash(cell + 0.2));
            float dist = length(cellFract - starPos);
            float twinkle = sin(u_time * u_speed + starHash * 100.0) * 0.5 + 0.5;
            stars += smoothstep(0.05, 0.0, dist) * twinkle * u_starDensity;
          }
          starCoord *= 1.5;
        }

        baseColor += vec3(stars) * 0.8;

        // Radial glow from center
        float centerGlow = 1.0 - length(p) * 0.3;
        centerGlow = max(centerGlow, 0.0);
        baseColor *= centerGlow;

        // Vignette effect
        float vignette = smoothstep(1.5, 0.3, length(p));
        baseColor *= vignette;

        gl_FragColor = vec4(baseColor, 1.0);
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
    const amplitudeLocation = gl.getUniformLocation(program, "u_amplitude");
    const frequencyLocation = gl.getUniformLocation(program, "u_frequency");
    const starDensityLocation = gl.getUniformLocation(program, "u_starDensity");
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
      gl.uniform1f(amplitudeLocation, amplitude);
      gl.uniform1f(frequencyLocation, frequency);
      gl.uniform1f(starDensityLocation, starDensity);
      gl.uniform1f(colorShiftLocation, colorShift);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [speed, amplitude, frequency, starDensity, colorShift]);

  return (
    <div className={cn("relative w-full h-full", className)} {...props}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
