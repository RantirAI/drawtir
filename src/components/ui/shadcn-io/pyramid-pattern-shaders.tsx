import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const fragmentShader = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform float u_speed;
uniform float u_scale;
uniform float u_offsetRows;
uniform float u_bumpStrength;
uniform float u_hatchIntensity;
uniform float u_lightMovement;

#define PI 3.14159265359

mat2 rot2(in float a){ 
  float c = cos(a), s = sin(a); 
  return mat2(c, -s, s, c); 
}

float hash21(vec2 p){  
  return fract(sin(dot(p, vec2(27.619, 57.583)))*43758.5453); 
}

vec2 cellID;

vec2 hash22B(vec2 p) { 
  float n = sin(dot(p, vec2(41.0, 289.0)));
  return fract(vec2(262144.0, 32768.0)*n)*2.0 - 1.0; 
}

float n2D3G(in vec2 p){
  vec2 i = floor(p); 
  p -= i;
  
  vec4 v;
  v.x = dot(hash22B(i), p);
  v.y = dot(hash22B(i + vec2(1.0, 0.0)), p - vec2(1.0, 0.0));
  v.z = dot(hash22B(i + vec2(0.0, 1.0)), p - vec2(0.0, 1.0));
  v.w = dot(hash22B(i + 1.0), p - 1.0);
  p = p*p*(3.0 - 2.0*p);
  
  return mix(mix(v.x, v.y, p.x), mix(v.z, v.w, p.x), p.y);
}

float fBm(vec2 p){ 
  return n2D3G(p)*0.66 + n2D3G(p*2.0)*0.34; 
}

float bMap(vec2 p){
  p *= rot2(-PI/5.0);
  
  if (u_offsetRows > 0.5) {
    if(mod(floor(p.y), 2.0) < 0.5) p.x += 0.5;
  }
  
  vec2 ip = floor(p);
  p -= ip + 0.5;
  
  cellID = ip;
  float ang = -PI*3.0/5.0 + (fBm(ip/8.0 + iTime/3.0*u_speed))*6.2831*2.0;
  vec2 offs = vec2(cos(ang), sin(ang))*0.35;
  
  if(p.x < offs.x)  p.x = 1.0 - (p.x + 0.5)/abs(offs.x + 0.5);
  else p.x = (p.x - offs.x)/(0.5 - offs.x);
  if(p.y < offs.y) p.y = 1.0 - (p.y + 0.5)/abs(offs.y + 0.5);
  else p.y = (p.y - offs.y)/(0.5 - offs.y);
  
  return 1.0 - max(p.x, p.y);
}

vec3 doBumpMap(in vec2 p, in vec3 n, float bumpfactor, inout float edge){
  vec2 e = vec2(0.025, 0.0);
  
  float f = bMap(p);
  float fx = bMap(p - e.xy);
  float fy = bMap(p - e.yx);
  float fx2 = bMap(p + e.xy);
  float fy2 = bMap(p + e.yx);
  
  vec3 grad = (vec3(fx - fx2, fy - fx2, 0.0))/e.x/2.0;
  
  edge = length(vec2(fx, fy) + vec2(fx2, fy2) - f*2.0);
  edge = smoothstep(0.0, 1.0, edge/e.x);
  
  grad -= n*dot(n, grad);
  
  return normalize(n + grad*bumpfactor);
}

float doHatch(vec2 p, float res){
  p *= res/16.0;
  float hatch = clamp(sin((p.x - p.y)*PI*200.0)*2.0 + 0.5, 0.0, 1.0);
  float hRnd = hash21(floor(p*6.0) + 0.73);
  if(hRnd > 0.66) hatch = hRnd;
  return hatch;
}

void main(){
  vec2 fragCoord = gl_FragCoord.xy;
  float iRes = min(iResolution.y, 800.0);
  vec2 uv = (fragCoord - iResolution.xy*0.5)/iRes;
  
  vec3 rd = normalize(vec3(uv, 0.5));
  
  const float gSc = 10.0;
  vec2 p = uv*gSc*u_scale + vec2(0.0, iTime/2.0*u_speed);
  vec2 oP = p;
  
  float m = bMap(p);
  
  vec2 svID = cellID;
  
  vec3 n = vec3(0.0, 0.0, -1.0);
  
  float edge = 0.0;
  float bumpFactor = 0.25*u_bumpStrength;
  n = doBumpMap(p, n, bumpFactor, edge);
  
  vec3 lp = vec3(-0.0 + sin(iTime*u_lightMovement)*0.3, 0.0 + cos(iTime*1.3*u_lightMovement)*0.3, -1.0) - vec3(uv, 0.0);
  
  float lDist = max(length(lp), 0.001);
  vec3 ld = lp/lDist;
  
  float diff = max(dot(n, ld), 0.0);
  diff = pow(diff, 4.0);
  float spec = pow(max(dot(reflect(-ld, n), -rd), 0.0), 16.0);
  float fre = min(pow(max(1.0 + dot(n, rd), 0.0), 4.0), 3.0);
  
  vec3 col = vec3(0.15)*(diff + 0.251 + spec*vec3(1.0, 0.7, 0.3)*9.0 + fre*vec3(0.1, 0.3, 1.0)*12.0);
  
  float rf = smoothstep(0.0, 0.35, bMap(reflect(rd, n).xy*2.0)*fBm(reflect(rd, n).xy*3.0) + 0.1);
  col += col*col*rf*rf*vec3(1.0, 0.1, 0.1)*15.0;
  
  float shade = m*0.83 + 0.17;
  col *= shade;
  
  col *= 1.0 - edge*0.8;
  
  float hatch = doHatch(oP/gSc, iRes);
  col *= hatch*0.5*u_hatchIntensity + (1.0 - u_hatchIntensity*0.5);
  
  gl_FragColor = vec4(sqrt(max(col, 0.0)), 1.0);
}
`;

const vertexShader = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

interface PyramidPatternShadersProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  scale?: number;
  offsetRows?: number;
  bumpStrength?: number;
  hatchIntensity?: number;
  lightMovement?: number;
}

export default function PyramidPatternShaders({
  speed = 1.0,
  scale = 1.0,
  offsetRows = 1,
  bumpStrength = 1.0,
  hatchIntensity = 1.0,
  lightMovement = 1.0,
  className,
  children,
  ...props
}: PyramidPatternShadersProps) {
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
    const u_scale = gl.getUniformLocation(program, "u_scale");
    const u_offsetRows = gl.getUniformLocation(program, "u_offsetRows");
    const u_bumpStrength = gl.getUniformLocation(program, "u_bumpStrength");
    const u_hatchIntensity = gl.getUniformLocation(program, "u_hatchIntensity");
    const u_lightMovement = gl.getUniformLocation(program, "u_lightMovement");

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
      gl.uniform1f(u_scale, scale);
      gl.uniform1f(u_offsetRows, offsetRows);
      gl.uniform1f(u_bumpStrength, bumpStrength);
      gl.uniform1f(u_hatchIntensity, hatchIntensity);
      gl.uniform1f(u_lightMovement, lightMovement);

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
  }, [speed, scale, offsetRows, bumpStrength, hatchIntensity, lightMovement]);

  return (
    <div className={cn("relative w-full h-full", className)} {...props}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}

export { PyramidPatternShaders };
