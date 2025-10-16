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
    const { description, imageContext, imageBase64 } = await req.json();
    console.log('Generating caption for description:', description);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert marketing copywriter specializing in creating engaging, attention-grabbing poster captions. 
Your task is to create compelling marketing copy that is:
- Concise but impactful (2-4 short lines max)
- Emotionally engaging
- Action-oriented
- Perfect for visual posters
- Professional yet creative

Format the response as plain text with line breaks. Do not use markdown or special formatting.`;

    let userPrompt = `Create a compelling marketing caption for a poster about: ${description}

${imageContext ? `Context about the image: The poster will feature ${imageContext}` : ''}

Create 3-4 short, punchy lines that would work perfectly on a marketing poster. Make it memorable and impactful.`;

    // Build messages array for API call
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // If image is provided, include it in the message
    if (imageBase64) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: userPrompt
          },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64
            }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: userPrompt
      });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const caption = data.choices?.[0]?.message?.content;

    if (!caption) {
      throw new Error('No caption generated');
    }

    console.log('Successfully generated caption');
    return new Response(
      JSON.stringify({ caption }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-poster-caption:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
