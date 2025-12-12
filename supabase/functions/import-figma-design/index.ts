import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  backgroundColor?: { r: number; g: number; b: number; a: number };
  fills?: Array<{
    type: string;
    color?: { r: number; g: number; b: number; a: number };
    opacity?: number;
    imageRef?: string;
  }>;
  strokes?: Array<{
    type: string;
    color?: { r: number; g: number; b: number; a: number };
  }>;
  strokeWeight?: number;
  opacity?: number;
  cornerRadius?: number;
  characters?: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    textAlignHorizontal?: string;
  };
  children?: FigmaNode[];
}

function rgbaToHex(r: number, g: number, b: number, a = 1): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  if (a < 1) {
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a.toFixed(2)})`;
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function convertFigmaNodeToElement(node: FigmaNode, parentX = 0, parentY = 0): any {
  const bbox = node.absoluteBoundingBox;
  if (!bbox) return null;

  const baseElement = {
    id: `figma-${node.id.replace(/:/g, '-')}`,
    x: bbox.x - parentX,
    y: bbox.y - parentY,
    width: bbox.width,
    height: bbox.height,
    opacity: node.opacity ?? 1,
    cornerRadius: node.cornerRadius ?? 0,
  };

  // Get fill color
  let fill = '#cccccc';
  let fillOpacity = 1;
  if (node.fills && node.fills.length > 0) {
    const solidFill = node.fills.find(f => f.type === 'SOLID');
    if (solidFill?.color) {
      fill = rgbaToHex(solidFill.color.r, solidFill.color.g, solidFill.color.b);
      fillOpacity = solidFill.opacity ?? 1;
    }
  }

  // Get stroke
  let stroke: string | undefined;
  let strokeWidth = 0;
  if (node.strokes && node.strokes.length > 0) {
    const solidStroke = node.strokes.find(s => s.type === 'SOLID');
    if (solidStroke?.color) {
      stroke = rgbaToHex(solidStroke.color.r, solidStroke.color.g, solidStroke.color.b);
      strokeWidth = node.strokeWeight ?? 1;
    }
  }

  switch (node.type) {
    case 'TEXT':
      return {
        ...baseElement,
        type: 'text',
        name: node.name,
        text: node.characters || '',
        fill: fill,
        color: fill,
        fontSize: node.style?.fontSize ?? 16,
        fontFamily: node.style?.fontFamily ?? 'Inter',
        fontWeight: String(node.style?.fontWeight ?? 400),
        textAlign: (node.style?.textAlignHorizontal?.toLowerCase() ?? 'left') as 'left' | 'center' | 'right',
      };

    case 'RECTANGLE':
    case 'ROUNDED_RECTANGLE':
      return {
        ...baseElement,
        type: 'shape',
        name: node.name,
        shapeType: 'rectangle',
        fill,
        fillOpacity,
        stroke,
        strokeWidth,
      };

    case 'ELLIPSE':
      return {
        ...baseElement,
        type: 'shape',
        name: node.name,
        shapeType: 'ellipse',
        fill,
        fillOpacity,
        stroke,
        strokeWidth,
      };

    case 'LINE':
      return {
        ...baseElement,
        type: 'shape',
        name: node.name,
        shapeType: 'line',
        stroke: stroke || fill,
        strokeWidth: strokeWidth || 1,
      };

    case 'VECTOR':
    case 'STAR':
    case 'POLYGON':
      return {
        ...baseElement,
        type: 'shape',
        name: node.name,
        shapeType: 'rectangle', // Simplified - complex vectors become rectangles
        fill,
        fillOpacity,
        stroke,
        strokeWidth,
      };

    default:
      // For unsupported types, return a rectangle placeholder
      return {
        ...baseElement,
        type: 'shape',
        name: node.name,
        shapeType: 'rectangle',
        fill,
        fillOpacity,
        stroke,
        strokeWidth,
      };
  }
}

function extractFramesFromFigma(document: any): any[] {
  const frames: any[] = [];

  function processNode(node: FigmaNode, depth = 0) {
    console.log(`Processing node: type=${node.type}, name="${node.name}", depth=${depth}`);
    
    // Process frames/components at depth 1-3 (to handle sections/groups containing frames)
    const isFrameType = node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'COMPONENT_SET';
    const isValidDepth = depth >= 1 && depth <= 3;
    const hasValidSize = node.absoluteBoundingBox && node.absoluteBoundingBox.width >= 50 && node.absoluteBoundingBox.height >= 50;
    
    if (isFrameType && isValidDepth && hasValidSize) {
      const bbox = node.absoluteBoundingBox;
      if (!bbox) return;

      console.log(`Found frame: "${node.name}" at depth ${depth}, size ${bbox.width}x${bbox.height}`);

      let backgroundColor = '#ffffff';
      if (node.backgroundColor) {
        backgroundColor = rgbaToHex(
          node.backgroundColor.r,
          node.backgroundColor.g,
          node.backgroundColor.b
        );
      } else if (node.fills && node.fills.length > 0) {
        const solidFill = node.fills.find(f => f.type === 'SOLID');
        if (solidFill?.color) {
          backgroundColor = rgbaToHex(solidFill.color.r, solidFill.color.g, solidFill.color.b);
        }
      }

      const elements: any[] = [];
      
      // Process children as elements
      if (node.children) {
        for (const child of node.children) {
          if (child.type === 'FRAME' || child.type === 'GROUP') {
            // Recursively process nested frames/groups
            if (child.children) {
              for (const nestedChild of child.children) {
                const element = convertFigmaNodeToElement(nestedChild, bbox.x, bbox.y);
                if (element) elements.push(element);
              }
            }
            // Also add the frame/group itself as an element
            const element = convertFigmaNodeToElement(child, bbox.x, bbox.y);
            if (element) elements.push(element);
          } else {
            const element = convertFigmaNodeToElement(child, bbox.x, bbox.y);
            if (element) elements.push(element);
          }
        }
      }

      frames.push({
        id: `frame-${node.id.replace(/:/g, '-')}`,
        name: node.name,
        x: frames.length * (bbox.width + 50), // Arrange frames horizontally
        y: 100,
        width: bbox.width,
        height: bbox.height,
        backgroundColor,
        opacity: node.opacity ?? 1,
        cornerRadius: node.cornerRadius ?? 0,
        elements,
      });
      
      // Don't recurse into this frame's children for more frames
      return;
    }

    // Continue searching for frames in pages, canvases, sections, groups
    const shouldTraverse = node.type === 'CANVAS' || 
                          node.type === 'DOCUMENT' || 
                          node.type === 'SECTION' || 
                          node.type === 'GROUP' ||
                          depth === 0;
    
    if (node.children && (shouldTraverse || depth < 3)) {
      for (const child of node.children) {
        processNode(child, depth + 1);
      }
    }
  }

  processNode(document);
  console.log(`Total frames extracted: ${frames.length}`);
  return frames;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileKey, accessToken, nodeIds } = await req.json();

    if (!fileKey || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing fileKey or accessToken' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching Figma file: ${fileKey}`);

    // Fetch Figma file structure
    const figmaUrl = nodeIds 
      ? `https://api.figma.com/v1/files/${fileKey}?ids=${nodeIds}`
      : `https://api.figma.com/v1/files/${fileKey}`;

    const fileResponse = await fetch(figmaUrl, {
      headers: {
        'X-Figma-Token': accessToken,
      },
    });

    if (!fileResponse.ok) {
      const errorText = await fileResponse.text();
      console.error('Figma API error:', errorText);
      return new Response(
        JSON.stringify({ error: `Figma API error: ${fileResponse.status}` }),
        { status: fileResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const figmaData = await fileResponse.json();
    console.log('Figma file name:', figmaData.name);

    // Extract frames from Figma document
    const frames = extractFramesFromFigma(figmaData.document);
    console.log(`Extracted ${frames.length} frames`);

    if (frames.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No frames found in Figma file. Make sure the file contains at least one frame.',
          figmaFileName: figmaData.name 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the snapshot
    const snapshot = {
      version: '1.0',
      metadata: {
        title: figmaData.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      canvas: {
        backgroundColor: '#1a1a1a',
        zoom: 1,
        panOffset: { x: 0, y: 0 },
      },
      frames,
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        snapshot,
        figmaFileName: figmaData.name,
        frameCount: frames.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error importing Figma design:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
