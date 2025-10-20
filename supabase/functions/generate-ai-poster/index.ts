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
    const { prompt, imageBase64, analysisType, canvasWidth = 800, canvasHeight = 1200 } = await req.json();
    
    console.log('AI Poster Generation - Type:', analysisType);
    console.log('Canvas dimensions:', canvasWidth, 'x', canvasHeight);
    console.log('Image data type:', typeof imageBase64, Array.isArray(imageBase64) ? `Array(${imageBase64.length})` : 'Not array');
    
    // Handle multiple images - ensure we convert to array properly
    let images: string[] = [];
    if (imageBase64) {
      if (Array.isArray(imageBase64)) {
        images = imageBase64.filter(img => img && typeof img === 'string');
      } else if (typeof imageBase64 === 'string') {
        images = [imageBase64];
      }
    }
    console.log('Processed images count:', images.length);

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
    
    if (analysisType === 'replicate' && images.length > 0) {
      // Replicate an existing design - support multiple images for multi-frame generation
      const imageContents = images.map(img => ({
        type: 'image',
        source: {
          type: 'base64',
          media_type: getMediaType(img),
          data: img.split(',')[1] || img,
        },
      }));
      
      messages.push({
        role: 'user',
        content: [
          ...imageContents,
          {
            type: 'text',
            text: `Analyze this poster design with EXTREME PRECISION and provide exact specifications to replicate it.

CRITICAL REPLICATION REQUIREMENTS:
1. Target canvas: ${canvasWidth}px × ${canvasHeight}px
2. Measure the SOURCE image dimensions first
3. Calculate scaling factors: scaleX = ${canvasWidth}/sourceWidth, scaleY = ${canvasHeight}/sourceHeight
4. Apply scaling to ALL measurements:
   - x_new = x_original × scaleX
   - y_new = y_original × scaleY
   - width_new = width_original × scaleX
   - height_new = height_original × scaleY
   - fontSize_new = fontSize_original × Math.min(scaleX, scaleY)

MEASUREMENT PRECISION:

ANALYSIS REQUIREMENTS:
1. MEASURE SOURCE DIMENSIONS:
   - First, estimate the source image dimensions (width × height)
   - Calculate scale factors to fit ${canvasWidth}×${canvasHeight}:
     * scaleX = ${canvasWidth} / sourceWidth
     * scaleY = ${canvasHeight} / sourceHeight
   
2. SCALE ALL MEASUREMENTS:
   - x_new = x_original × scaleX
   - y_new = y_original × scaleY  
   - width_new = width_original × scaleX
   - height_new = height_original × scaleY
   - fontSize_new = fontSize_original × min(scaleX, scaleY)
   
3. COLOR EXTRACTION:
   - Extract EXACT hex colors from every element
   - Background color must be precise
   - Text colors, shape fills, icon colors - all must be exact
   
3. TEXT ANALYSIS:
   - Copy the EXACT text content (word for word)
   - Measure font sizes and scale them appropriately
   - Identify font weight: normal, bold, 600, 700, etc.
   
4. SHAPES & ICONS:
   - For rectangles: borderRadius = "0"
   - For rounded rectangles: scale corner radius proportionally
   - For circles: width MUST equal height, borderRadius = "50%"
   - Match icons to lucide-react names
   
5. LAYERING:
   - Note which elements are in front/behind others
   - Bottom elements should appear first in the array

IMPORTANT RULES FOR REPLICATION:
- DO NOT create nested frames - output all elements in a flat "elements" array
- DO NOT include a "frames" property in your response
- Position all elements relative to the canvas (0,0 is top-left)
- Be pixel-perfect with measurements
- Match colors exactly

Return a JSON object with this structure (NO frames property):
{
  "title": "Replicated: [original design name]",
  "backgroundColor": "#exacthexcolor",
  "elements": [
    {
      "type": "text|shape|icon",
      "content": "exact text",
      "x": precise_x_position,
      "y": precise_y_position,
      "width": exact_width,
      "height": exact_height,
      "color": "#exacthexcolor",
      "fontSize": exact_size (for text),
      "fontWeight": "normal|bold|600" (for text),
      "borderRadius": "0|12px|50%" (for shapes),
      "shape": "rectangle|circle" (for shapes),
      "iconName": "heart|star|etc" (for icons),
      "iconFamily": "lucide" (for icons)
    }
  ],
  "style": "exact visual style description",
  "mood": "mood of the design"
}


BE PIXEL-PERFECT. The goal is an EXACT replica.`
          }
        ]
      });
    } else if (analysisType === 'create' && images.length > 0) {
      // Create poster using uploaded images
      const imageContents = images.map(img => ({
        type: 'image',
        source: {
          type: 'base64',
          media_type: getMediaType(img),
          data: img.split(',')[1] || img,
        },
      }));
      
      messages.push({
        role: 'user',
        content: [
          ...imageContents,
          {
            type: 'text',
            text: `Create a professional poster design using ${images.length > 1 ? `these ${images.length} images` : 'this image'}. User request: "${prompt || 'Create an eye-catching poster'}"

CRITICAL: The canvas size is ${canvasWidth}x${canvasHeight} pixels. ALL element positions and sizes MUST fit within these dimensions.

${images.length > 1 ? `Create ${images.length} separate frames, one for each image provided.` : ''}

Analyze the image${images.length > 1 ? 's' : ''} and design a poster with:
- Strategic placement of the image
- Complementary text overlays
- Color scheme that matches the image
- Professional layout with auto-layout where appropriate
- Relevant icons to enhance the design

AVAILABLE ICONS (from lucide-react):
Common: heart, star, circle, square, triangle, sparkles, zap, flame, sun, moon, cloud, music
Social: facebook, twitter, instagram, linkedin, youtube, github
UI: bell, bookmark, calendar, camera, clock, download, edit, eye, file, folder, image, lock, mail, message, phone, share, shopping-cart, thumbs-up, trash, upload, video, wifi
Arrows: arrow-right, arrow-left, arrow-up, arrow-down, chevron-right, chevron-left
Actions: plus, minus, x, check, settings, search, menu, refresh, maximize, minimize

USE ICONS THOUGHTFULLY:
- Select icons that match the poster theme and content
- Use appropriate sizes (typically 24-48px)
- Match icon colors to the design palette

AUTO LAYOUT USAGE:
- Group related elements in frames with autoLayout: true
- Use flexDirection: "row" for horizontal layouts, "column" for vertical
- Set appropriate gap values (8-24px typically)
- Use justifyContent and alignItems for proper alignment

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
      "type": "icon",
      "content": "description of icon purpose",
      "x": position,
      "y": position,
      "width": size,
      "height": size,
      "color": "#hexcolor",
      "iconName": "heart|star|etc",
      "iconFamily": "lucide"
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
  "frames": [
    {
      "x": position,
      "y": position,
      "width": size,
      "height": size,
      "backgroundColor": "#hexcolor",
      "autoLayout": true,
      "flexDirection": "row|column",
      "gap": 12,
      "padding": 16,
      "justifyContent": "center",
      "alignItems": "center",
      "elements": [nested elements]
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

CRITICAL CANVAS CONSTRAINTS:
- Canvas dimensions: ${canvasWidth}px × ${canvasHeight}px
- ALL elements MUST be positioned within these bounds
- X coordinates: 0 to ${canvasWidth}
- Y coordinates: 0 to ${canvasHeight}
- Scale your design proportionally to fit this canvas size

DESIGN REQUIREMENTS:
1. Create a visually striking poster with balanced composition
2. Use the full canvas space effectively
3. Choose colors that work well together
4. Add text with appropriate sizing (scale fonts to canvas size)
5. Include relevant icons to enhance the message
6. Consider visual hierarchy and spacing

IMPORTANT SIZING GUIDELINES:
- Titles: ${Math.floor(canvasHeight * 0.06)}-${Math.floor(canvasHeight * 0.08)}px
- Subtitles: ${Math.floor(canvasHeight * 0.04)}-${Math.floor(canvasHeight * 0.05)}px  
- Body text: ${Math.floor(canvasHeight * 0.02)}-${Math.floor(canvasHeight * 0.03)}px
- Icons: ${Math.floor(canvasHeight * 0.05)}-${Math.floor(canvasHeight * 0.08)}px
- Spacing: Use ${Math.floor(canvasHeight * 0.02)}-${Math.floor(canvasHeight * 0.04)}px margins

AVAILABLE ICONS (from lucide-react):
Common: heart, star, circle, square, triangle, sparkles, zap, flame, sun, moon, cloud, music, crown, gift, award, trophy
Social: facebook, twitter, instagram, linkedin, youtube, github, twitch
UI: bell, bookmark, calendar, camera, clock, download, edit, eye, file, folder, image, lock, mail, message, phone, share, shopping-cart, thumbs-up, trash, upload, video, wifi, battery, bluetooth, cast
Arrows: arrow-right, arrow-left, arrow-up, arrow-down, chevron-right, chevron-left, move, external-link
Actions: plus, minus, x, check, settings, search, menu, refresh, maximize, minimize, play, pause, skip-forward, volume

USE ICONS STRATEGICALLY:
- Choose icons that enhance the poster's message
- Size icons appropriately (24-64px typically)
- Use icon colors that complement the design

AUTO LAYOUT & NESTED FRAMES:
- Group related elements in frames with autoLayout enabled
- Use flexDirection: "row" for horizontal, "column" for vertical
- Set gap for spacing between children (8-32px)
- Apply padding to frames (12-24px typically)
- Nest frames inside frames for complex layouts

IMPORTANT: For shapes, set borderRadius correctly:
- Circles: use borderRadius of "50%" (width and height MUST be equal!)
- Rectangles: use borderRadius of "0"
- Rounded rectangles: use borderRadius between "8px" and "16px"

ELEMENT POSITIONING RULES:
- Ensure no elements are cut off at canvas edges
- Leave appropriate margins (at least ${Math.floor(canvasWidth * 0.05)}px from edges)
- Center important content vertically and horizontally
- Use the full canvas height effectively

Return a JSON object with this structure:
{
  "title": "Poster title",
  "backgroundColor": "#hexcolor",
  "elements": [
    {
      "type": "text|shape|icon",
      "content": "text content or description",
      "x": position (0-${canvasWidth}),
      "y": position (0-${canvasHeight}),
      "width": size,
      "height": size (must equal width for circles!),
      "color": "#hexcolor",
      "fontSize": size (scale to canvas),
      "fontWeight": "normal|bold",
      "borderRadius": "0|8px|16px|50%" (use 50% for circles!),
      "shape": "rectangle|circle" (if type is shape),
      "iconName": "heart|star|sparkles|etc" (if type is icon),
      "iconFamily": "lucide" (if type is icon)
    }
  ],
  "frames": [
    {
      "x": position,
      "y": position,
      "width": size,
      "height": size,
      "backgroundColor": "#hexcolor or transparent",
      "autoLayout": true,
      "flexDirection": "row|column",
      "gap": spacing_value,
      "padding": padding_value,
      "justifyContent": "flex-start|center|flex-end|space-between",
      "alignItems": "flex-start|center|flex-end|stretch",
      "cornerRadius": 0-24,
      "elements": [array of nested elements],
      "frames": [array of nested frames if needed]
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
