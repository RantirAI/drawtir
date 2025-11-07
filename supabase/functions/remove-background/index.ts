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
    const REMOVE_BG_API_KEY = Deno.env.get('REMOVE_BG_API_KEY');
    
    if (!REMOVE_BG_API_KEY) {
      throw new Error('REMOVE_BG_API_KEY is not configured');
    }

    console.log('Starting background removal with remove.bg API');

    // Fetch the image from the data URL or URL
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();

    // Create form data for remove.bg API
    const formData = new FormData();
    formData.append('image_file', imageBlob);
    formData.append('size', 'auto');

    // Call remove.bg API
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('remove.bg API error:', response.status, errorText);
      throw new Error(`remove.bg API error: ${response.status} - ${errorText}`);
    }

    console.log('Background removed successfully');

    // Get the result as a blob
    const resultBlob = await response.blob();
    const arrayBuffer = await resultBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    return new Response(
      JSON.stringify({ image: `data:image/png;base64,${base64}` }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in remove-background function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
