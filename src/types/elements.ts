export type ElementType = "frame" | "shape" | "text" | "image" | "drawing";
export type ShapeType = "rectangle" | "line" | "arrow" | "ellipse" | "polygon" | "star";
export type ToolType = "select" | "pen" | "shape" | "text" | "image";

export interface Element {
  id: string;
  type: Exclude<ElementType, "frame">;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  
  // Shape properties
  shapeType?: ShapeType;
  fill?: string;
  fillType?: "solid" | "image" | "gradient" | "pattern" | "video";
  fillImage?: string;
  fillImageFit?: "fill" | "contain" | "cover" | "crop";
  gradientType?: "linear" | "radial";
  gradientAngle?: number;
  gradientStops?: Array<{color: string, position: number}>;
  patternFrameId?: string;
  videoUrl?: string;
  stroke?: string;
  strokeWidth?: number;
  
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
  
  // Common properties
  opacity?: number;
  cornerRadius?: number;
  blendMode?: string;
  
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
  rotation?: number;
  backgroundColor: string;
  backgroundType?: "solid" | "image" | "gradient" | "pattern" | "video";
  backgroundImage?: string;
  backgroundImageFit?: "fill" | "contain" | "cover" | "crop";
  gradientType?: "linear" | "radial";
  gradientAngle?: number;
  gradientStops?: Array<{color: string, position: number}>;
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
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  gap?: number;
  elements?: Element[];
  opacity?: number;
  cornerRadius?: number;
  blendMode?: string;
}
