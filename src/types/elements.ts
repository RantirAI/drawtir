export type ElementType = "frame" | "shape" | "text" | "richtext" | "image" | "drawing" | "icon" | "shader";
export type ShapeType = "rectangle" | "line" | "arrow" | "ellipse" | "polygon" | "star";
export type ToolType = "select" | "pen" | "shape" | "text" | "image" | "icon";

export interface Element {
  id: string;
  type: Exclude<ElementType, "frame">;
  x: number;
  y: number;
  width: number;
  height: number;
  sizeUnit?: "px" | "rem" | "%" | "em";
  rotation?: number;
  
  // Shape properties
  shapeType?: ShapeType;
  fill?: string;
  fillType?: "solid" | "image" | "gradient" | "pattern" | "video";
  fillImage?: string;
  fillImageFit?: "fill" | "contain" | "cover" | "crop";
  gradientType?: "linear" | "radial";
  gradientAngle?: number;
  gradientStops?: Array<{color: string, position: number, opacity?: number}>;
  patternFrameId?: string;
  videoUrl?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeWidthUnit?: "px" | "rem" | "%" | "em";
  strokeOpacity?: number;
  strokePosition?: "center" | "inside" | "outside";
  fillOpacity?: number;
  
  // Line-specific properties
  lineStyle?: "solid" | "dashed" | "dotted" | "dashdot";
  lineCap?: "butt" | "round" | "square";
  lineJoin?: "miter" | "round" | "bevel";
  dashArray?: string; // e.g., "5,5" or "10,5,2,5"
  controlPoints?: Array<{x: number, y: number}>; // For curved lines
  lineArrowStart?: "none" | "round" | "square" | "line" | "triangle" | "reversed-triangle" | "circle" | "diamond";
  lineArrowEnd?: "none" | "round" | "square" | "line" | "triangle" | "reversed-triangle" | "circle" | "diamond";
  
  // Text properties
  text?: string;
  richTextHtml?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  color?: string;
  
  // Image properties
  imageUrl?: string;
  imageFit?: "fill" | "contain" | "cover" | "crop";
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  
  // Drawing properties (pen tool)
  pathData?: string;
  
  // Icon properties
  iconName?: string;
  iconFamily?: string; // fa, md, hi, ai, bs, etc.
  iconColor?: string;
  iconSize?: number;
  
  // Shader properties
  shader?: {
    type: "ripple" | "distortion" | "particles" | "noise" | "waves" | "tunnel" | "plasma";
    speed?: number;
    intensity?: number;
    scale?: number;
    color1?: string;
    color2?: string;
    color3?: string;
  };
  
  // Common properties
  opacity?: number;
  cornerRadius?: number;
  cornerRadiusUnit?: "px" | "rem" | "%" | "em";
  blendMode?: string;
  isLocked?: boolean;
  
  // Animation properties
  animation?: "none" | "fade-in" | "fade-out" | "slide-in-from-top" | "slide-in-from-bottom" | "slide-in-from-left" | "slide-in-from-right" | "slide-out-to-top" | "slide-out-to-bottom" | "slide-out-to-left" | "slide-out-to-right" | "zoom-in" | "zoom-out" | "pulse" | "bounce" | "spin" | "ping";
  animationDuration?: string; // e.g. "0.5s"
  animationDelay?: string; // e.g. "0.2s"
  animationTimingFunction?: string; // e.g. "ease-out"
  animationIterationCount?: string; // e.g. "1" | "infinite"
  animationCategory?: "in" | "out" | "custom"; // Category for organizing animations
  
  // Nesting support
  children?: Element[];
}

export interface Frame {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sizeUnit?: "px" | "rem" | "%" | "em";
  rotation?: number;
  backgroundColor: string;
  backgroundType?: "solid" | "image" | "gradient" | "pattern" | "video";
  backgroundImage?: string;
  backgroundImageFit?: "fill" | "contain" | "cover" | "crop";
  gradientType?: "linear" | "radial";
  gradientAngle?: number;
  gradientStops?: Array<{color: string, position: number, opacity?: number}>;
  patternFrameId?: string;
  videoUrl?: string;
  image?: string | null;
  topCaption?: string;
  bottomCaption?: string;
  textColor?: string;
  textAlign?: "left" | "center" | "right";
  textSize?: number;
  textOpacity?: number;
  imageStyle?: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  linkText?: string;
  linkPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  gradientIntensity?: number;
  
  // Auto Layout properties
  autoLayout?: boolean;
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  gap?: number;
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  
  // Dynamic scaling properties
  initialWidth?: number;
  initialHeight?: number;
  enableDynamicScale?: boolean;
  
  elements?: Element[];
  frames?: Frame[]; // Nested frames support
  opacity?: number;
  fillOpacity?: number;
  cornerRadius?: number;
  cornerRadiusUnit?: "px" | "rem" | "%" | "em";
  blendMode?: string;
}
