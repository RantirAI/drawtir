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

    console.log("Downloading image...");
    
    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    console.log(`Image downloaded, size: ${imageBuffer.byteLength} bytes`);

    // Dynamic import to avoid bundling issues
    const vectorizer = await import("https://esm.sh/@neplex/vectorizer@1.2.0");
    
    console.log("Vectorizing image...");
    
    // Vectorize with smoother settings to reduce jagged edges
    const svg = await vectorizer.vectorize(new Uint8Array(imageBuffer), {
      colorMode: 'color',
      colorPrecision: 8,
      filterSpeckle: 8,
      spliceThreshold: 60,
      cornerThreshold: 120,
      hierarchical: 'stacked',
      mode: 'spline',
      layerDifference: 8,
      lengthThreshold: 2,
      maxIterations: 4,
      pathPrecision: 8,
    });

    console.log("Vectorization complete, SVG length:", svg.length);

    return new Response(
      JSON.stringify({ svg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error vectorizing image:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
