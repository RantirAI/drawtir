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
}

export interface Frame {
  id: string;
  type: "frame";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  backgroundColor: string;
  backgroundImage?: string;
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  gap?: number;
  elements: Element[];
  opacity?: number;
  cornerRadius?: number;
}
