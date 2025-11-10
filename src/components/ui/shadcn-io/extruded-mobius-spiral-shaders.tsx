import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface ExtrudedMobiusSpiralShadersProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  shape?: number;
  rowOffset?: number;
  faceDecoration?: number;
  doubleSpiral?: number;
  holes?: number;
  raised?: number;
  ridges?: number;
  vertLines?: number;
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

vec2 scale = vec2(1./8.);
const vec2 rDim = vec2(1, 2.*.8660254);
const float FAR = 20.0;

float objID;

mat2 rot2(in float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float hash21(vec2 p){ 
    return fract(sin(dot(p, vec2(27.617, 57.743)))*43758.5453); 
}

float opExtrusion(in float sdf, in float pz, in float h){
    vec2 w = vec2( sdf, abs(pz) - h );
      return min(max(w.x, w.y), 0.) + length(max(w, 0.));
}

float sHexS(in vec2 p, float r, in float sf){
  const vec3 k = vec3(.5, -.8660254, .57735);
  p = abs(p); 
  p -= 2.*min(dot(k.xy, p), 0.)*k.xy;
  r -= sf;
  return length(p - vec2(r, clamp(p.y, -k.z*r, k.z*r)))*sign(p.x - r) - sf;
}

float hm(in vec2 p){ 
  return (sin(6.2831*(p.y*2. + p.x) + iTime*2.)*.5 + .5); 
}

float sBoxS(in vec2 p, in vec2 b, in float sf){
  vec2 d = abs(p) - b + sf;
  return min(max(d.x, d.y), 0.) + length(max(d, 0.)) - sf;
}

vec2 gP; 
float tempR;

vec4 blocks(vec3 q3){
    vec2 l = scale;
    vec2 s = scale*2.;
    
    float minSc = min(scale.x, scale.y);
    
    float d = 1e5;
    vec2 p, ip;
    
    vec2 id = vec2(0); 
    
    #ifdef ROW_OFFSET
    vec2 ps4_0 = vec2(-.25, .25);
    vec2 ps4_1 = vec2(.25);
    vec2 ps4_2 = vec2(.5, -.25);
    vec2 ps4_3 = vec2(0, -.25);
    #else
    vec2 ps4_0 = vec2(-.25, .25);
    vec2 ps4_1 = vec2(.25);
    vec2 ps4_2 = vec2(.25, -.25);
    vec2 ps4_3 = vec2(-.25);
    #endif
    
    float data = 0.;
    
    for(int i = 0; i<4; i++){
        p = q3.xy;
        vec2 ps4_i = i == 0 ? ps4_0 : (i == 1 ? ps4_1 : (i == 2 ? ps4_2 : ps4_3));
        ip = floor(p/s - ps4_i);
        
        vec2 idi = (ip + .5 + ps4_i)*s;
        
        p -= idi;
 
        vec2 index = mod(idi, rDim.yx)/rDim.yx; 
        
        float h = hm(index)*tempR*.1;
        
        // Always use hexagon shape for simplicity
        float di2D = sHexS(p, minSc/1.732 - .0035, .015);
        float di = opExtrusion(di2D, (q3.z + h - 1.), h + 1.);
        if(di<d){
            d = di;
            id = idi;         
            data = di2D;
            
            gP = p;
        }
    }
    
    return vec4(d, id, data);
}

vec2 cMul(vec2 z, vec2 w){ return mat2(z, -z.y, z.x)*w; }

vec2 cInv(vec2 z){ return vec2(z.x, -z.y)/dot(z, z); }

vec2 cDiv(vec2 z, vec2 w){ return cMul(z, cInv(w)); }

vec2 cLog(vec2 z){ return vec2(log(length(z)), atan(z.y, z.x)); }

vec2 caTanh(vec2 z, float sc) {
    return cLog(cDiv(vec2(sc, 0) + z, vec2(sc, 0) - z));
}

vec4 gID;
 
float map(vec3 p){
    float fl = -p.z + .01;
    
    vec2 z = rot2(-sin(iTime/3.)*.65)*p.xy;
    const float sc = 1.5;
    float r = min(length(z - vec2(sc, 0)), length(z - vec2(-sc, 0)));
    tempR = r;
    z = caTanh(-z, sc)/6.2831;
 
    // Double spiral
    vec2 z2 = rot2(-cos(iTime/3.)*.65*2.)*p.xy;    
    const float sc2 = .75;
    float r2 = min(length(z2.xy - vec2(sc2, 0)), length(z2.xy - vec2(-sc2, 0)));
    tempR = min(tempR, r2);
    z += caTanh(z2, sc2)/6.2831;
    
    tempR = smoothstep(.1, .5, tempR);
    z.y = fract(z.y + iTime*.1);
    z = cMul(rDim, z);
 
    p.xy = z;
  
    vec4 d4 = blocks(p);
    gID = d4;
   
    objID = d4.x < fl? 0. : 1.;
    
    return min(d4.x, fl);
}

float trace(in vec3 ro, in vec3 rd){
    float t = 0., d;
    
    for(int i = 0; i<128; i++){
        d = map(ro + rd*t);
        if(abs(d)<.001 || t>FAR) break;
        
        t += d*.8; 
    }
    return min(t, FAR);
}

vec3 getNormal(in vec3 p, float t) {
    float sgn = 1.;
    vec3 e = vec3(.001, 0, 0), mp = e.zzz;
    for(int i = 0; i<6; i++){
        mp.x += map(p + sgn*e)*sgn;
        sgn = -sgn;
        if(mod(float(i), 2.) == 1.){ mp = mp.yzx; e = e.zxy; }
    }
    
    return normalize(mp);
}

float softShadow(vec3 ro, vec3 lp, vec3 n, float k){
    const int maxIterationsShad = 32; 
    
    ro += n*.0015;
    vec3 rd = lp - ro;
    float shade = 1.;
    float t = 0.; 
    float end = max(length(rd), .0001);
    rd /= end;
    for (int i = 0; i<maxIterationsShad; i++){
        float d = map(ro + rd*t);
        shade = min(shade, k*d/t);
        t += clamp(d, .01, .1); 
        
        if (d<0. || t>end) break; 
    }
    return max(shade, 0.); 
}

float calcAO(vec3 p, vec3 n){
    float occ = 1.;
    float ds = .01;          
    float k = .05/ds;
    float dst = ds*2.;          
    
    for(int i = 0; i<5; i++){
        occ -= (dst - map(p + n*dst))*k;
        dst += ds;
        k *= .5;
    }
    
    return clamp(occ, 0., 1.);
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = (fragCoord - iResolution.xy*.5)/iResolution.y;
    
    scale *= vec2(2./1.732, 1);
    
    vec3 ro = vec3(0, -1, -2.2);
    vec3 lk = ro + vec3(0, .1, .25);
 
     vec3 lp = ro + vec3(-.5, 1, 1);
    float FOV = 1.333;
    vec3 fwd = normalize(lk-ro);
    vec3 rgt = normalize(vec3(fwd.z, 0., -fwd.x )); 
    vec3 up = cross(fwd, rgt); 
    vec3 rd = normalize(uv.x*rgt + uv.y*up + fwd/FOV);
    
    rd.xy *= rot2( sin(iTime*u_speed)/32. );
    
    float t = trace(ro, rd);
    
    vec4 svGID = gID;
    
    float svObjID = objID;
    
    float svTempR = tempR;
    
    vec2 svP = gP;
  
    vec3 col = vec3(0);
    
    if(t < FAR){
        vec3 sp = ro + rd*t;
        vec3 sn = getNormal(sp, t);
        
        vec3 ld = lp - sp;
        float lDist = max(length(ld), .001);
        
        ld /= lDist;
        float sh = softShadow(sp, lp, sn, 16.);
        float ao = calcAO(sp, sn);
        
        float atten = 1./(1. + lDist*.05);
        float diff = max( dot(sn, ld), 0.);
        
        float spec = pow(max(dot(reflect(ld, sn), rd ), 0.), 32.); 
        
        float fre = pow(clamp(1. - abs(dot(sn, rd))*.5, 0., 1.), 2.);
        
        float Schlick = pow( 1. - max(dot(rd, normalize(rd + ld)), 0.), 5.);
        float freS = mix(.15, 1., Schlick);
        
        vec3 texCol = vec3(.6);   
        if(svObjID<.5){
            vec2 index = mod(svGID.yz, rDim.yx)/rDim.yx; 
            vec3 col1 = .5 + .45*cos(6.2831*index.y + vec3(0, 1, 2)*2.);
            vec3 col2 = .5 + .45*cos(6.2831*index.y + 3.14159/2.5 + vec3(0, 1, 2)*1.35);
            texCol = col1;
            
            float di2D = svGID.w;
            float tmp = map(sp - vec3(3./450., 0, 0));
            float di2DX = gID.w;
            tmp = map(sp - vec3(0, 3./450., 0));
            float di2DY = gID.w;
            
            vec3 dF = (vec3(di2DX, di2DY, 1e5) - di2D);
            float sf = length(dF.xy);
            // Vertical lines for hexagon
            const float aNum = 6.;
            vec2 zLines = rot2(3.14159/aNum)*svP; 
            float a = mod(atan(zLines.x, zLines.y), 6.2831)/6.2831;
            a = (floor(a*aNum) + .5)/aNum;
            zLines *= rot2(a*6.2831);
            texCol = mix(texCol, vec3(0), (1. - smoothstep(0., sf, abs(zLines.x) - .001))*.95);
            
            // Face decoration
            float rim = .04 / .8660254;
            texCol = mix(texCol, vec3(0), (1. - smoothstep(0., sf, svGID.w + rim))*.95);
            texCol = mix(texCol, col2, (1. - smoothstep(0., sf, svGID.w + rim + .005)));
            float h = hm(index);
            float lw = .0035;
            float dS = abs(svGID.w) - lw/2.;
            texCol = mix(texCol, texCol/3., (1. - smoothstep(0., sf, dS)));
            dS = max(dS, abs(sp.z + h*.1*svTempR*2.) - lw/2.);
            texCol = mix(texCol, vec3(0), (1. - smoothstep(0., sf, dS))*.95);
        }
        else {
            texCol = vec3(.05);
        }
       
        col = texCol*(diff*sh + .3 + vec3(.25, .5, 1)*fre*0. + vec3(1, .97, .92)*spec*freS*2.*sh);
      
        col *= ao*atten;
    }
    
    gl_FragColor = vec4(sqrt(max(col, 0.)), 1.0);
}
`;

export default function ExtrudedMobiusSpiralShaders({
  speed = 1.0,
  shape = 2,
  rowOffset = 1,
  faceDecoration = 1,
  doubleSpiral = 1,
  holes = 0,
  raised = 0,
  ridges = 0,
  vertLines = 0,
  className,
  children,
  ...props
}: ExtrudedMobiusSpiralShadersProps) {
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
      console.error("Vertex shader error:", gl.getShaderInfoLog(vs));
      return;
    }

    gl.shaderSource(fs, fragmentShader);
    gl.compileShader(fs);
    
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error("Fragment shader error:", gl.getShaderInfoLog(fs));
      return;
    }

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
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

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      timeRef.current += 0.016 * speed;

      gl.uniform2f(iResolution, canvas.width, canvas.height);
      gl.uniform1f(iTime, timeRef.current);
      if (u_speedLoc) gl.uniform1f(u_speedLoc, speed);

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
  }, [speed]);

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

export { ExtrudedMobiusSpiralShaders };
