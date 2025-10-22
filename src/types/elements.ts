export type ElementType = "frame" | "shape" | "text" | "image" | "drawing" | "icon" | "shader";
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
  
  // Text properties
  text?: string;
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
  
  // Animation properties
  animation?: "none" | "fade-in" | "fade-out" | "scale-in" | "scale-out" | "slide-in-right" | "slide-out-right" | "accordion-down" | "accordion-up" | "pulse" | "bounce" | "spin" | "ping";
  animationDuration?: string;
  
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
