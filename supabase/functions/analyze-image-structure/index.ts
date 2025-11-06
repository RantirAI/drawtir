import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    
    if (!imageUrl) {
      throw new Error("Image URL is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing image structure with AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert at analyzing poster and graphic designs. Extract all visual elements from images and provide their positions, sizes, colors, and content in a structured format. Be precise about positioning and styling.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Convert this image into SVG vector format. Trace all visual elements (shapes, text, images) and return them as SVG paths and elements. Return a JSON object with this structure:
{
  "frame": {
    "width": number (in pixels),
    "height": number (in pixels),
    "backgroundColor": "hex color"
  },
  "svgElements": [
    {
      "type": "path" | "rect" | "ellipse" | "text" | "polygon",
      "svgData": "SVG path data string (e.g. 'M 10 10 L 20 20 Z') or shape attributes",
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "fill": "hex color",
      "stroke": "hex color",
      "strokeWidth": number,
      "opacity": number (0-1),
      "content": "text content if type is text",
      "fontSize": number (if text),
      "fontWeight": string (if text)
    }
  ]
}

Trace the image accurately and convert all visual elements to SVG vectors. Include paths for shapes, text elements, and any visual components.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "vectorize_image",
              description: "Convert image to SVG vectors",
              parameters: {
                type: "object",
                properties: {
                  frame: {
                    type: "object",
                    properties: {
                      width: { type: "number" },
                      height: { type: "number" },
                      backgroundColor: { type: "string" }
                    },
                    required: ["width", "height", "backgroundColor"]
                  },
                  svgElements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["path", "rect", "ellipse", "text", "polygon"] },
                        svgData: { type: "string" },
                        x: { type: "number" },
                        y: { type: "number" },
                        width: { type: "number" },
                        height: { type: "number" },
                        fill: { type: "string" },
                        stroke: { type: "string" },
                        strokeWidth: { type: "number" },
                        opacity: { type: "number" },
                        content: { type: "string" },
                        fontSize: { type: "number" },
                        fontWeight: { type: "string" }
                      },
                      required: ["type", "x", "y"]
                    }
                  }
                },
                required: ["frame", "svgElements"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "vectorize_image" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const structuredData = JSON.parse(toolCall.function.arguments);
    console.log("Extracted structure:", structuredData);

    return new Response(
      JSON.stringify(structuredData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error analyzing image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
