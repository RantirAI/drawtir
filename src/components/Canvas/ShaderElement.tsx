import { useEffect, useRef } from "react";
import type { Element } from "@/types/elements";

interface ShaderElementProps {
  element: Element;
}

const SHADER_PRESETS = {
  ripple: {
    fragment: `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_speed;
      uniform float u_intensity;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        vec2 center = vec2(0.5, 0.5);
        float dist = length(uv - center);
        float ripple = sin(dist * 20.0 - u_time * u_speed) * 0.5 + 0.5;
        ripple *= (1.0 - dist) * u_intensity;
        vec3 color = mix(u_color1, u_color2, ripple);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  },
  distortion: {
    fragment: `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_speed;
      uniform float u_intensity;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        uv.x += sin(uv.y * 10.0 + u_time * u_speed) * 0.1 * u_intensity;
        uv.y += cos(uv.x * 10.0 + u_time * u_speed) * 0.1 * u_intensity;
        vec3 color = mix(u_color1, u_color2, uv.x);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  },
  particles: {
    fragment: `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_speed;
      uniform float u_scale;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float particles = 0.0;
        
        for(float i = 0.0; i < 50.0; i++) {
          vec2 pos = vec2(random(vec2(i, 0.0)), random(vec2(0.0, i)));
          pos.x = fract(pos.x + u_time * u_speed * 0.1);
          pos.y = fract(pos.y + u_time * u_speed * 0.15);
          float dist = distance(uv, pos);
          particles += smoothstep(0.02 * u_scale, 0.0, dist);
        }
        
        vec3 color = mix(u_color1, u_color2, particles);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  },
  noise: {
    fragment: `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_speed;
      uniform float u_scale;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float n = noise(uv * u_scale + u_time * u_speed * 0.5);
        vec3 color = mix(u_color1, u_color2, n);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  },
  waves: {
    fragment: `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_speed;
      uniform float u_intensity;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      uniform vec3 u_color3;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float wave1 = sin(uv.x * 10.0 + u_time * u_speed) * u_intensity;
        float wave2 = sin(uv.y * 10.0 + u_time * u_speed * 0.7) * u_intensity;
        float wave3 = sin((uv.x + uv.y) * 7.0 + u_time * u_speed * 1.3) * u_intensity;
        float combined = (wave1 + wave2 + wave3) * 0.5 + 0.5;
        vec3 color = mix(mix(u_color1, u_color2, combined), u_color3, combined * 0.5);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  },
  tunnel: {
    fragment: `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_speed;
      uniform float u_scale;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        vec2 center = uv - 0.5;
        float angle = atan(center.y, center.x);
        float radius = length(center);
        float tunnel = mod(1.0 / radius * u_scale + u_time * u_speed, 1.0);
        vec3 color = mix(u_color1, u_color2, tunnel);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  },
  plasma: {
    fragment: `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_speed;
      uniform float u_scale;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      uniform vec3 u_color3;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float plasma = sin(uv.x * u_scale + u_time * u_speed);
        plasma += sin(uv.y * u_scale + u_time * u_speed * 0.7);
        plasma += sin((uv.x + uv.y) * u_scale * 0.7 + u_time * u_speed * 1.3);
        plasma = (plasma + 3.0) / 6.0;
        vec3 color = mix(mix(u_color1, u_color2, plasma), u_color3, plasma * plasma);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  }
};

const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

export const ShaderElement: React.FC<ShaderElementProps> = ({ element }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }
    glRef.current = gl;

    const shaderType = element.shader?.type || "ripple";
    const fragmentShaderSource = SHADER_PRESETS[shaderType].fragment;

    // Compile shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) return;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) return;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Create program
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    programRef.current = program;

    // Set up geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Animation loop
    const animate = () => {
      if (!gl || !program) return;

      const time = (Date.now() - startTimeRef.current) / 1000;
      
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);

      // Set uniforms
      const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

      const timeLocation = gl.getUniformLocation(program, "u_time");
      gl.uniform1f(timeLocation, time);

      const speedLocation = gl.getUniformLocation(program, "u_speed");
      gl.uniform1f(speedLocation, element.shader?.speed || 1.0);

      const intensityLocation = gl.getUniformLocation(program, "u_intensity");
      gl.uniform1f(intensityLocation, element.shader?.intensity || 1.0);

      const scaleLocation = gl.getUniformLocation(program, "u_scale");
      gl.uniform1f(scaleLocation, element.shader?.scale || 10.0);

      // Colors
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 0, b: 0 };
      };

      const color1 = hexToRgb(element.shader?.color1 || "#ff0080");
      const color2 = hexToRgb(element.shader?.color2 || "#00ffff");
      const color3 = hexToRgb(element.shader?.color3 || "#ffff00");

      const color1Location = gl.getUniformLocation(program, "u_color1");
      gl.uniform3f(color1Location, color1.r, color1.g, color1.b);

      const color2Location = gl.getUniformLocation(program, "u_color2");
      gl.uniform3f(color2Location, color2.r, color2.g, color2.b);

      const color3Location = gl.getUniformLocation(program, "u_color3");
      gl.uniform3f(color3Location, color3.r, color3.g, color3.b);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [element.shader]);

  return (
    <canvas
      ref={canvasRef}
      width={element.width}
      height={element.height}
      style={{
        width: "100%",
        height: "100%",
        display: "block"
      }}
    />
  );
};
