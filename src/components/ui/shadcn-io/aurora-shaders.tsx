import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AuroraShadersProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  intensity?: number;
  vibrancy?: number;
  frequency?: number;
  stretch?: number;
}

export default function AuroraShaders({
  speed = 1.0,
  intensity = 1.0,
  vibrancy = 1.0,
  frequency = 1.0,
  stretch = 1.0,
  className,
  ...props
}: AuroraShadersProps) {
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

    // Fragment shader with aurora effects
    const fragmentShaderSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_speed;
      uniform float u_intensity;
      uniform float u_vibrancy;
      uniform float u_frequency;
      uniform float u_stretch;

      // Hash function for pseudo-random numbers
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      // Fractal noise with multiple octaves
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
        for (int i = 0; i < 6; i++) {
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

        float time = u_time * u_speed * 0.3;

        // Apply vertical stretch to create aurora bands
        vec2 auroraCoord = vec2(p.x * u_frequency, p.y / u_stretch);

        // Multi-layer aurora with different timing
        float layer1 = fbm(auroraCoord * 2.0 + vec2(time * 0.5, 0.0));
        float layer2 = fbm(auroraCoord * 3.0 - vec2(time * 0.7, 0.2));
        float layer3 = fbm(auroraCoord * 4.0 + vec2(time * 0.3, 0.4));

        // Combine layers with wave distortion
        float wave1 = sin(auroraCoord.x * 3.0 + time) * 0.3;
        float wave2 = sin(auroraCoord.x * 5.0 - time * 1.5) * 0.2;
        float auroraPattern = layer1 + layer2 * 0.5 + layer3 * 0.3;
        auroraPattern += wave1 + wave2;

        // Vertical positioning - aurora bands at atmospheric levels
        float bandY = smoothstep(-0.5, 0.3, p.y) * smoothstep(0.8, 0.5, p.y);
        auroraPattern *= bandY;

        // Authentic aurora color zones
        vec3 green = vec3(0.1, 1.0, 0.3) * u_vibrancy;
        vec3 blue = vec3(0.2, 0.5, 1.0) * u_vibrancy;
        vec3 purple = vec3(0.8, 0.2, 1.0) * u_vibrancy;
        vec3 cyan = vec3(0.2, 0.9, 0.9) * u_vibrancy;

        // Color transitions based on pattern
        vec3 auroraColor = mix(green, blue, smoothstep(0.3, 0.6, auroraPattern));
        auroraColor = mix(auroraColor, purple, smoothstep(0.6, 0.8, auroraPattern));
        auroraColor = mix(auroraColor, cyan, smoothstep(0.8, 1.0, auroraPattern));

        // Apply intensity
        float aurораIntensity = smoothstep(0.3, 0.8, auroraPattern) * u_intensity;
        vec3 finalColor = auroraColor * aurораIntensity;

        // Atmospheric stars in dark areas
        vec2 starCoord = uv * 60.0;
        float stars = 0.0;
        for (int i = 0; i < 2; i++) {
          vec2 cell = floor(starCoord);
          vec2 cellFract = fract(starCoord);
          float starHash = hash(cell + float(i) * 10.0);
          
          if (starHash > 0.98) {
            vec2 starPos = vec2(hash(cell + 0.1), hash(cell + 0.2));
            float dist = length(cellFract - starPos);
            float twinkle = sin(u_time * 0.5 + starHash * 100.0) * 0.5 + 0.5;
            stars += smoothstep(0.03, 0.0, dist) * twinkle * 0.3;
          }
          starCoord *= 1.5;
        }

        // Add stars only in dark areas
        finalColor += vec3(stars) * (1.0 - aurораIntensity);

        // Horizon glow effect
        float horizonGlow = exp(-abs(p.y + 0.3) * 3.0) * 0.2;
        finalColor += vec3(horizonGlow * 0.2, horizonGlow * 0.5, horizonGlow * 0.3);

        // Subtle vignette
        float vignette = smoothstep(1.8, 0.5, length(p));
        finalColor *= vignette;

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
    const vibrancyLocation = gl.getUniformLocation(program, "u_vibrancy");
    const frequencyLocation = gl.getUniformLocation(program, "u_frequency");
    const stretchLocation = gl.getUniformLocation(program, "u_stretch");

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
      gl.uniform1f(vibrancyLocation, vibrancy);
      gl.uniform1f(frequencyLocation, frequency);
      gl.uniform1f(stretchLocation, stretch);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [speed, intensity, vibrancy, frequency, stretch]);

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
