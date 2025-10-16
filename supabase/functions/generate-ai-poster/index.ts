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
    const { prompt, imageBase64, analysisType } = await req.json();
    console.log('AI Poster Generation - Type:', analysisType);

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // Detect media type from base64 string
    const getMediaType = (base64: string): string => {
      if (base64.startsWith('data:image/png')) return 'image/png';
      if (base64.startsWith('data:image/jpeg') || base64.startsWith('data:image/jpg')) return 'image/jpeg';
      if (base64.startsWith('data:image/webp')) return 'image/webp';
      if (base64.startsWith('data:image/gif')) return 'image/gif';
      return 'image/jpeg'; // default fallback
    };

    // Build messages based on input type
    const messages: any[] = [];
    
    if (analysisType === 'replicate' && imageBase64) {
      // Replicate an existing design
      const mediaType = getMediaType(imageBase64);
      messages.push({
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64.split(',')[1] || imageBase64,
            },
          },
          {
            type: 'text',
            text: `Analyze this poster design in extreme detail and provide specifications to replicate it. Include:
- Layout structure (frame dimensions, element positions)
- Text elements (content, font sizes, colors, positions)
- Color scheme (background, text colors in hex)
- Visual elements (shapes, images, their positions and sizes)
- Style and mood

Return a JSON object with this structure:
{
  "title": "Poster title",
  "backgroundColor": "#hexcolor",
  "elements": [
    {
      "type": "text|shape|image",
      "content": "text content or description",
      "x": position,
      "y": position,
      "width": size,
      "height": size,
      "color": "#hexcolor",
      "fontSize": size,
      "fontWeight": "normal|bold",
      "shape": "rectangle|circle|triangle" (if type is shape)
    }
  ],
  "style": "description of overall style",
  "mood": "description of mood/feeling"
}`
          }
        ]
      });
    } else if (analysisType === 'create' && imageBase64) {
      // Create poster using uploaded image
      const mediaType = getMediaType(imageBase64);
      messages.push({
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64.split(',')[1] || imageBase64,
            },
          },
          {
            type: 'text',
            text: `Create a professional poster design using this image. User request: "${prompt || 'Create an eye-catching poster'}"

Analyze the image and design a poster with:
- Strategic placement of the image
- Complementary text overlays
- Color scheme that matches the image
- Professional layout

Return a JSON object with this structure:
{
  "title": "Poster title",
  "backgroundColor": "#hexcolor",
  "elements": [
    {
      "type": "image",
      "content": "user-uploaded-image",
      "x": position,
      "y": position,
      "width": size,
      "height": size
    },
    {
      "type": "text",
      "content": "text content",
      "x": position,
      "y": position,
      "width": size,
      "height": size,
      "color": "#hexcolor",
      "fontSize": size,
      "fontWeight": "normal|bold"
    }
  ],
  "style": "description",
  "mood": "description"
}`
          }
        ]
      });
    } else {
      // Generate from text description only
      messages.push({
        role: 'user',
        content: `Create a professional poster design based on this description: "${prompt}"

Design a complete poster with layout, colors, text, and visual elements.

Return a JSON object with this structure:
{
  "title": "Poster title",
  "backgroundColor": "#hexcolor",
  "elements": [
    {
      "type": "text|shape",
      "content": "text content or description",
      "x": position (0-800),
      "y": position (0-1000),
      "width": size,
      "height": size,
      "color": "#hexcolor",
      "fontSize": size (12-72),
      "fontWeight": "normal|bold",
      "shape": "rectangle|circle|triangle" (if type is shape)
    }
  ],
  "style": "description of overall style",
  "mood": "description of mood/feeling"
}`
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error('No content generated from AI');
    }

    console.log('AI Response:', content);

    // Extract JSON from response (handle markdown code blocks)
    let designSpec;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      designSpec = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      throw new Error('AI generated invalid design specification');
    }

    console.log('Successfully generated poster design');
    return new Response(
      JSON.stringify({ designSpec, rawResponse: content }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-ai-poster:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
