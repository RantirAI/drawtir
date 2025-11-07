import type { Element } from "@/types/elements";

export interface ParsedSVGResult {
  width: number;
  height: number;
  elements: Element[];
}

export function parseSVGToElements(svgString: string): ParsedSVGResult {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
  const svgElement = svgDoc.querySelector("svg");

  if (!svgElement) {
    throw new Error("Invalid SVG");
  }

  const viewBox = svgElement.getAttribute("viewBox");
  let width = parseFloat(svgElement.getAttribute("width") || "800");
  let height = parseFloat(svgElement.getAttribute("height") || "600");

  if (viewBox) {
    const parts = viewBox.split(/\s+/);
    if (parts.length === 4) {
      width = parseFloat(parts[2]);
      height = parseFloat(parts[3]);
    }
  }

  const elements: Element[] = [];
  
  // Process all path elements (main vectorized content)
  const paths = svgElement.querySelectorAll("path");
  paths.forEach((path, index) => {
    const d = path.getAttribute("d");
    if (!d) return;

    const fill = path.getAttribute("fill") || "#000000";
    const stroke = path.getAttribute("stroke") || "transparent";
    const strokeWidth = parseFloat(path.getAttribute("stroke-width") || "0");
    const opacity = parseFloat(path.getAttribute("opacity") || "1");
    
    // Get bounding box to determine position
    try {
      const bbox = path.getBBox();
      
      elements.push({
        id: `vector-path-${Date.now()}-${index}`,
        type: "shape",
        name: `Vector Path ${index + 1}`,
        shapeType: "custom",
        pathData: d,
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
        fill: fill === "none" ? "transparent" : fill,
        fillOpacity: opacity * 100,
        stroke: stroke === "none" ? "transparent" : stroke,
        strokeWidth,
        opacity: opacity * 100,
      });
    } catch (e) {
      console.warn("Could not parse path bbox:", e);
    }
  });

  // Process rect elements
  const rects = svgElement.querySelectorAll("rect");
  rects.forEach((rect, index) => {
    const x = parseFloat(rect.getAttribute("x") || "0");
    const y = parseFloat(rect.getAttribute("y") || "0");
    const width = parseFloat(rect.getAttribute("width") || "100");
    const height = parseFloat(rect.getAttribute("height") || "100");
    const fill = rect.getAttribute("fill") || "#000000";
    const stroke = rect.getAttribute("stroke") || "transparent";
    const strokeWidth = parseFloat(rect.getAttribute("stroke-width") || "0");
    const opacity = parseFloat(rect.getAttribute("opacity") || "1");

    elements.push({
      id: `vector-rect-${Date.now()}-${index}`,
      type: "shape",
      name: `Rectangle ${index + 1}`,
      shapeType: "rectangle",
      x,
      y,
      width,
      height,
      fill: fill === "none" ? "transparent" : fill,
      fillOpacity: opacity * 100,
      stroke: stroke === "none" ? "transparent" : stroke,
      strokeWidth,
      opacity: opacity * 100,
    });
  });

  // Process circle/ellipse elements
  const circles = svgElement.querySelectorAll("circle, ellipse");
  circles.forEach((circle, index) => {
    const cx = parseFloat(circle.getAttribute("cx") || "0");
    const cy = parseFloat(circle.getAttribute("cy") || "0");
    const r = parseFloat(circle.getAttribute("r") || "50");
    const rx = parseFloat(circle.getAttribute("rx") || r.toString());
    const ry = parseFloat(circle.getAttribute("ry") || r.toString());
    const fill = circle.getAttribute("fill") || "#000000";
    const stroke = circle.getAttribute("stroke") || "transparent";
    const strokeWidth = parseFloat(circle.getAttribute("stroke-width") || "0");
    const opacity = parseFloat(circle.getAttribute("opacity") || "1");

    elements.push({
      id: `vector-circle-${Date.now()}-${index}`,
      type: "shape",
      name: `Circle ${index + 1}`,
      shapeType: "ellipse",
      x: cx - rx,
      y: cy - ry,
      width: rx * 2,
      height: ry * 2,
      fill: fill === "none" ? "transparent" : fill,
      fillOpacity: opacity * 100,
      stroke: stroke === "none" ? "transparent" : stroke,
      strokeWidth,
      opacity: opacity * 100,
    });
  });

  // Process polygon elements
  const polygons = svgElement.querySelectorAll("polygon");
  polygons.forEach((polygon, index) => {
    const points = polygon.getAttribute("points");
    if (!points) return;

    const fill = polygon.getAttribute("fill") || "#000000";
    const stroke = polygon.getAttribute("stroke") || "transparent";
    const strokeWidth = parseFloat(polygon.getAttribute("stroke-width") || "0");
    const opacity = parseFloat(polygon.getAttribute("opacity") || "1");

    // Convert points to path data
    const coords = points.trim().split(/\s+/).map(p => p.split(",").map(Number));
    const pathData = `M ${coords.map(c => c.join(" ")).join(" L ")} Z`;

    try {
      const bbox = polygon.getBBox();
      
      elements.push({
        id: `vector-polygon-${Date.now()}-${index}`,
        type: "shape",
        name: `Polygon ${index + 1}`,
        shapeType: "custom",
        pathData,
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
        fill: fill === "none" ? "transparent" : fill,
        fillOpacity: opacity * 100,
        stroke: stroke === "none" ? "transparent" : stroke,
        strokeWidth,
        opacity: opacity * 100,
      });
    } catch (e) {
      console.warn("Could not parse polygon bbox:", e);
    }
  });

  // Process text elements
  const texts = svgElement.querySelectorAll("text");
  texts.forEach((text, index) => {
    const x = parseFloat(text.getAttribute("x") || "0");
    const y = parseFloat(text.getAttribute("y") || "0");
    const content = text.textContent || "";
    const fill = text.getAttribute("fill") || "#000000";
    const fontSize = parseFloat(text.getAttribute("font-size") || "16");
    const fontWeight = text.getAttribute("font-weight") || "400";
    const opacity = parseFloat(text.getAttribute("opacity") || "1");

    elements.push({
      id: `vector-text-${Date.now()}-${index}`,
      type: "text",
      name: `Text ${index + 1}`,
      text: content,
      x,
      y,
      width: content.length * fontSize * 0.6, // Approximate width
      height: fontSize * 1.2,
      fontSize,
      fontWeight,
      color: fill === "none" ? "#000000" : fill,
      textAlign: "left",
      opacity: opacity * 100,
    });
  });

  return {
    width,
    height,
    elements,
  };
}
