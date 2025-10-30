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
        let userId: string | null = null;
        try {
          const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
          if (userError) {
            console.error('Error getting user via auth.getUser():', userError);
          } else if (user) {
            userId = user.id;
          }
        } catch (e) {
          console.error('auth.getUser() threw, attempting JWT decode fallback:', e);
        }

        // Fallback: decode JWT to extract user id when getUser fails
        if (!userId) {
          try {
            const token = authHeader.replace('Bearer ', '').trim();
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload?.sub || null;
          } catch (jwtErr) {
            console.error('Failed to decode JWT payload:', jwtErr);
          }
        }

        if (userId) {
          console.log('User authenticated, uploading image to storage...');

          // Prepare image blob
          let contentType = 'image/png';
          let blob: Blob;

          if (imageUrl.startsWith('data:')) {
            const [header, base64Data] = imageUrl.split(',');
            const mimeMatch = header.match(/data:(.*?);base64/);
            if (mimeMatch) contentType = mimeMatch[1];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            blob = new Blob([bytes], { type: contentType });
          } else {
            // If the AI ever returns a remote URL
            const fetched = await fetch(imageUrl);
            blob = await fetched.blob();
            contentType = blob.type || contentType;
          }

          const extension = (contentType.split('/')[1] || 'png').split(';')[0];
          const fileName = `ai-generated-${Date.now()}.${extension}`;
          const path = `${userId}/${fileName}`;

          const { error: uploadError } = await supabaseClient.storage
            .from('media')
            .upload(path, blob, { contentType, upsert: true });

          if (uploadError) {
            console.error('Error uploading image to storage:', uploadError);
          } else {
            const { data: pub } = supabaseClient.storage.from('media').getPublicUrl(path);
            const publicUrl = pub?.publicUrl ?? '';

            const { error: insertError } = await supabaseClient.from('media_library').insert({
              user_id: userId,
              file_name: fileName,
              file_url: publicUrl || path,
              file_type: contentType,
              file_size: blob.size ?? null,
              source: 'ai-generated',
              metadata: { prompt }
            });

            if (insertError) {
              console.error('Error inserting to media library:', insertError);
            } else {
              console.log('✅ Uploaded and saved to media library for user:', userId);
            }
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
