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
  
  // Drawing properties (pen tool)
  pathData?: string;
  
  // Common properties
  opacity?: number;
  cornerRadius?: number;
  blendMode?: string;
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
  backgroundImage?: string;
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
