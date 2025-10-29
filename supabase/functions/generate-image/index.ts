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
    const { prompt } = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating image with Lovable AI (Nano banana) for poster:', prompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: `Create a high-quality, professional, visually stunning image suitable for a poster with this theme:

${prompt}

REQUIREMENTS:
- High visual impact and professional quality
- Vibrant colors and strong composition
- Suitable as a main visual element in a poster design
- Eye-catching and visually appealing
- Sharp details and good contrast
- Modern and polished aesthetic

Style: Professional poster-quality imagery with strong visual appeal.`
          }
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI image generation error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limits exceeded. Please try again later or reduce request frequency.');
      }
      if (response.status === 402) {
        throw new Error('Credits exhausted. Please add credits to your Lovable workspace in Settings → Usage.');
      }
      
      throw new Error(`Image generation failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('Lovable AI response structure:', JSON.stringify(result, null, 2).substring(0, 500));
    
    // Extract image from Lovable AI response
    // The image can be in different locations depending on the response format
    let imageUrl = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    // Alternative path if the first one doesn't work
    if (!imageUrl && result.choices?.[0]?.message?.content) {
      // Sometimes the image is embedded in the content
      const content = result.choices[0].message.content;
      if (typeof content === 'string' && content.startsWith('data:image')) {
        imageUrl = content;
      }
    }
    
    // Check if there's an image in a different structure
    if (!imageUrl && result.data?.[0]?.url) {
      imageUrl = result.data[0].url;
    }
    
    if (!imageUrl) {
      console.error('Could not find image in response. Full response:', JSON.stringify(result, null, 2));
      console.error('Choices array:', result.choices);
      console.error('First choice:', result.choices?.[0]);
      console.error('Message:', result.choices?.[0]?.message);
      throw new Error('No image data received from Lovable AI. Response structure may have changed.');
    }

    console.log('Image generated successfully with Lovable AI');

    // Save to media library if user is authenticated
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (authHeader) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.7.1');
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        );

        console.log('Attempting to get user...');
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError) {
          console.error('Error getting user:', userError);
        } else if (user) {
          console.log('User authenticated, saving to media library...');
          const fileName = `ai-generated-${Date.now()}.png`;
          const { error: insertError } = await supabaseClient.from('media_library').insert({
            user_id: user.id,
            file_name: fileName,
            file_url: imageUrl,
            file_type: 'image/png',
            source: 'ai-generated',
            metadata: { prompt }
          });
          
          if (insertError) {
            console.error('Error inserting to media library:', insertError);
          } else {
            console.log('✅ Successfully saved to media library for user:', user.id);
          }
        } else {
          console.log('No user found from auth header');
        }
      } catch (error) {
        console.error('Exception saving to media library:', error);
      }
    } else {
      console.log('No authorization header, skipping media library save');
    }

    return new Response(
      JSON.stringify({ 
        image: imageUrl,
        success: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-image:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
