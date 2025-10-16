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
            text: `Analyze this poster design in EXTREME DETAIL. Your goal is to replicate it EXACTLY as shown.

CRITICAL: CAPTURE EVERY SINGLE ELEMENT
- Don't skip ANY text, no matter how small (labels, captions, buttons, dates, prices, etc.)
- Don't skip ANY shapes or decorative elements
- Don't skip ANY images or placeholders
- Every single visual element must be in the output

MEASUREMENT REQUIREMENTS:
1. POSITIONS: Measure x, y coordinates from top-left (0,0) of the poster
2. DIMENSIONS: Measure exact width and height in pixels
3. SPACING: Analyze gaps between elements (vertical and horizontal spacing)
4. PADDING: Measure internal spacing within grouped elements
5. ALIGNMENT: Note if elements are left-aligned, centered, or right-aligned
6. GROUPING: Identify which elements belong together visually

SHAPE SPECIFICATIONS:
- Circles: width MUST equal height, borderRadius = "50%"
- Rounded rectangles: borderRadius = "8px", "12px", "16px", or "24px"
- Sharp rectangles: borderRadius = "0"
- Ellipses: width ≠ height, borderRadius = "50%"

TEXT SPECIFICATIONS:
- Extract EXACT text content (including line breaks, punctuation)
- Measure font size precisely
- Identify font weight: "normal" (400), "600", "bold" (700)
- Note text color in hex
- Note text alignment: "left", "center", or "right"
- Measure line height and spacing

COLOR EXTRACTION:
- Background: precise hex color
- Each element: precise hex color
- Opacity if elements are semi-transparent

LAYOUT ANALYSIS:
- Top-to-bottom order: list elements in the order they appear
- Vertical spacing between sections
- Horizontal spacing and margins
- Container boundaries (if sections are grouped)

Return JSON with this EXACT structure (include ALL elements you see):
{
  "title": "Design title",
  "backgroundColor": "#hexcolor",
  "elements": [
    {
      "type": "text|shape|image",
      "content": "exact text content",
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "color": "#hexcolor",
      "fontSize": number,
      "fontWeight": "normal|600|bold",
      "textAlign": "left|center|right",
      "borderRadius": "0|8px|12px|16px|24px|50%",
      "shape": "rectangle|circle|ellipse"
    }
  ]
}

CRITICAL: List EVERY element you see. Missing elements = failure.`
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

IMPORTANT: For shapes, set borderRadius correctly:
- Circles: use borderRadius of "50%" or "9999px" (width and height MUST be equal for circles!)
- Rectangles: use borderRadius of "0"
- Rounded rectangles: use borderRadius between "8px" and "24px"

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
    },
    {
      "type": "shape",
      "content": "description",
      "x": position,
      "y": position,
      "width": size,
      "height": size (must equal width for circles!),
      "color": "#hexcolor",
      "borderRadius": "0|8px|16px|50%" (use 50% for circles!),
      "shape": "rectangle|circle"
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

IMPORTANT: For shapes, set borderRadius correctly:
- Circles: use borderRadius of "50%" (width and height MUST be equal for circles!)
- Rectangles: use borderRadius of "0"
- Rounded rectangles: use borderRadius between "8px" and "24px"

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
      "height": size (must equal width for circles!),
      "color": "#hexcolor",
      "fontSize": size (12-72),
      "fontWeight": "normal|bold",
      "borderRadius": "0|8px|16px|50%" (use 50% for circles!),
      "shape": "rectangle|circle" (if type is shape)
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
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    // Stream the response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    if (!reader) {
      throw new Error('No response body');
    }

    // Create a stream to send back to client
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let elementCount = 0;
          let lastProgressSent = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  
                  if (parsed.type === 'content_block_delta') {
                    const text = parsed.delta?.text || '';
                    fullContent += text;
                    
                    // Try to detect what's being generated
                    let progressMessage = '';
                    
                    // Detect title
                    if (fullContent.includes('"title"') && !lastProgressSent.includes('title')) {
                      const titleMatch = fullContent.match(/"title"\s*:\s*"([^"]+)"/);
                      if (titleMatch) {
                        progressMessage = `Setting up design: "${titleMatch[1]}"`;
                      }
                    }
                    
                    // Detect background color
                    if (fullContent.includes('"backgroundColor"') && !lastProgressSent.includes('background')) {
                      progressMessage = 'Setting background color...';
                    }
                    
                    // Detect elements being created
                    const elementMatches = fullContent.match(/"type"\s*:\s*"(text|shape|image)"/g);
                    if (elementMatches && elementMatches.length > elementCount) {
                      elementCount = elementMatches.length;
                      
                      // Try to get element description
                      const lastElementMatch = fullContent.match(/"type"\s*:\s*"([^"]+)"[^}]*"content"\s*:\s*"([^"]+)"/g);
                      if (lastElementMatch && lastElementMatch[elementCount - 1]) {
                        const typeMatch = lastElementMatch[elementCount - 1].match(/"type"\s*:\s*"([^"]+)"/);
                        const contentMatch = lastElementMatch[elementCount - 1].match(/"content"\s*:\s*"([^"]+)"/);
                        
                        if (typeMatch && contentMatch) {
                          const type = typeMatch[1];
                          const content = contentMatch[1];
                          progressMessage = `Adding ${type}: ${content}`;
                        }
                      }
                    }
                    
                    // Send progress update if we have a message
                    if (progressMessage && progressMessage !== lastProgressSent) {
                      lastProgressSent = progressMessage;
                      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
                        type: 'status', 
                        message: progressMessage 
                      })}\n\n`));
                    }
                    
                    // Also send raw text for debugging
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
                      type: 'progress', 
                      text 
                    })}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }

          // Parse final result
          let designSpec;
          try {
            const jsonMatch = fullContent.match(/```json\n([\s\S]*?)\n```/) || fullContent.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : fullContent;
            designSpec = JSON.parse(jsonStr);
          } catch (e) {
            console.error('Failed to parse AI response as JSON:', e);
            throw new Error('AI generated invalid design specification');
          }

          console.log('Successfully generated poster design');
          
          // Send final result
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
            type: 'complete', 
            designSpec,
            rawResponse: fullContent 
          })}\n\n`));
          
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Error in generate-ai-poster:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
