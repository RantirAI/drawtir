import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Minimal JSON schema for OpenAI JSON mode
const DESIGN_JSON_SCHEMA = {
  name: 'design_spec',
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      backgroundColor: { type: 'string' },
      style: { type: 'string' },
      mood: { type: 'string' },
      elements: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            content: { type: 'string' },
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' },
            color: { type: 'string' },
            fontSize: { type: 'number' },
            fontWeight: { type: 'string' },
            borderRadius: { type: 'string' },
            shape: { type: 'string' },
            iconName: { type: 'string' },
            iconFamily: { type: 'string' },
          },
          additionalProperties: true,
        },
      },
    },
    required: [ 'elements' ],
    additionalProperties: true,
  },
  strict: false,
};

// Model configuration
const MODEL_CONFIGS: Record<string, any> = {
  'claude-sonnet-4-5': {
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    apiModel: 'claude-sonnet-4-5',
    maxTokens: 4096,
    supportsTemperature: true,
    supportsStreaming: true,
  },
  'claude-opus-4-1': {
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    apiModel: 'claude-opus-4-1-20250805',
    maxTokens: 4096,
    supportsTemperature: true,
    supportsStreaming: true,
  },
  'gpt-5': {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiModel: 'gpt-5-2025-08-07',
    maxCompletionTokens: 4096,
    supportsTemperature: false,
    supportsStreaming: false, // Streaming may require org verification
  },
  'gpt-5-mini': {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiModel: 'gpt-5-mini-2025-08-07',
    maxCompletionTokens: 4096,
    supportsTemperature: false,
    supportsStreaming: false,
  },
  'gpt-5-nano': {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiModel: 'gpt-5-nano-2025-08-07',
    maxCompletionTokens: 4096,
    supportsTemperature: false,
    supportsStreaming: false,
  },
  'o3': {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiModel: 'o3-2025-04-16',
    maxCompletionTokens: 4096,
    supportsTemperature: false,
    supportsStreaming: false,
  },
  'o4-mini': {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiModel: 'o4-mini-2025-04-16',
    maxCompletionTokens: 4096,
    supportsTemperature: false,
    supportsStreaming: false,
  },
};

// Curated color palettes
const COLOR_PALETTES: Record<string, string[]> = {
  energetic: ["#FF6B35", "#F7931E", "#FDC830", "#F37335"],
  calm: ["#89B0AE", "#BEE3DB", "#FFD6BA", "#FEEAFA"],
  professional: ["#2C3E50", "#34495E", "#7F8C8D", "#BDC3C7"],
  playful: ["#FF6B9D", "#C06C84", "#6C5B7B", "#355C7D"],
  elegant: ["#1A1A2E", "#16213E", "#0F3460", "#533483"],
  vibrant: ["#FF00FF", "#00FFFF", "#FFFF00", "#FF0080"],
  earth: ["#8B7355", "#C19A6B", "#D4AF37", "#B87333"],
  ocean: ["#006994", "#0582CA", "#00A6FB", "#7DCFB6"],
  sunset: ["#FF6F61", "#FF9068", "#FFB088", "#FFC3A0"],
  forest: ["#2D4B32", "#4A7C59", "#6FAE7C", "#8FBC8F"],
  neon: ["#39FF14", "#FF10F0", "#00F0FF", "#FFD700"],
  pastel: ["#FFB3BA", "#FFDFBA", "#FFFFBA", "#BAFFC9"],
};

// Enhanced design system prompt
const DESIGN_SYSTEM_PROMPT = `You are an expert poster designer with deep knowledge of visual design principles.

COLOR THEORY:
- Use complementary colors for contrast and energy (opposite on color wheel)
- Analogous colors for harmony (adjacent on color wheel)
- Triadic schemes for balanced vibrancy (equidistant on wheel)
- Follow 60-30-10 rule: 60% dominant, 30% secondary, 10% accent
- Ensure WCAG AA contrast ratios (4.5:1 for text, 3:1 for large text)

MOOD-BASED COLOR PALETTES:
${Object.entries(COLOR_PALETTES).map(([mood, colors]) => `- ${mood}: ${colors.join(', ')}`).join('\n')}

TYPOGRAPHY HIERARCHY:
- Titles: 72-96px, bold (700+), tight letter-spacing (-0.02em)
- Subtitles: 48-60px, semibold (600), normal spacing
- Body: 24-32px, regular (400-500), line-height 1.5-1.8
- Captions: 16-20px, regular (400), looser spacing (0.02em)
- Max line length: 60-75 characters for readability

LAYOUT PRINCIPLES:
- Rule of thirds: Place focal points at 1/3 intersections
- Visual weight: Balance heavy elements with lighter ones
- Whitespace: Not empty - it's breathing room for design
- 8pt grid system: Use multiples of 8 for spacing (8, 16, 24, 32, 48, 64)
- Visual hierarchy: Most important → largest, highest contrast

SPACING SYSTEM:
- Tight: 8px (related items)
- Normal: 16px (grouped content)
- Comfortable: 24px (sections)
- Loose: 32-48px (major divisions)
- Canvas margins: Minimum 40-60px from edges

DESIGN STYLES:
- Modern Minimal: Clean lines, lots of whitespace, 2-3 colors, sans-serif
- Vintage: Muted palettes, textured shapes, serif fonts, ornamental elements
- Brutalist: Bold typography, high contrast, geometric shapes, asymmetry
- Swiss Design: Grid-based, sans-serif, objective photography, minimal color
- Contemporary: Gradients, overlapping elements, mixed typography, vibrant colors

QUALITY CHECKLIST:
✓ Clear focal point (where eyes land first)
✓ Sufficient contrast (WCAG AA minimum)
✓ Harmonious colors (max 4-5 colors)
✓ Readable text at all sizes
✓ Grid-aligned elements (8pt grid)
✓ Adequate whitespace (not cramped)
✓ Matches requested mood/style`;

// Few-shot learning examples
const DESIGN_EXAMPLES = `
EXAMPLE 1 - Concert Poster (Energetic):
{
  "title": "Summer Music Festival",
  "backgroundColor": "#FF6B35",
  "elements": [
    {"type": "text", "content": "SUMMER", "x": 100, "y": 100, "width": 600, "height": 120, "fontSize": 96, "fontWeight": "bold", "color": "#FFFFFF"},
    {"type": "text", "content": "MUSIC FESTIVAL", "x": 100, "y": 230, "width": 600, "height": 80, "fontSize": 60, "fontWeight": "600", "color": "#FDC830"},
    {"type": "shape", "x": 50, "y": 350, "width": 200, "height": 200, "color": "#F7931E", "borderRadius": "50%", "shape": "circle"},
    {"type": "icon", "iconName": "music", "iconFamily": "lucide", "x": 100, "y": 400, "width": 100, "height": 100, "color": "#FFFFFF"}
  ]
}
WHY IT WORKS: Bold typography dominates, energetic orange palette, circular shape adds dynamism, music icon reinforces theme.

EXAMPLE 2 - Product Poster (Minimal):
{
  "title": "Premium Coffee",
  "backgroundColor": "#F5F5F5",
  "elements": [
    {"type": "text", "content": "ARTISAN", "x": 100, "y": 800, "width": 600, "height": 60, "fontSize": 48, "fontWeight": "300", "color": "#2C3E50"},
    {"type": "text", "content": "COFFEE", "x": 100, "y": 870, "width": 600, "height": 80, "fontSize": 72, "fontWeight": "bold", "color": "#2C3E50"},
    {"type": "shape", "x": 250, "y": 200, "width": 300, "height": 400, "color": "#34495E", "borderRadius": "16px", "shape": "rectangle"}
  ]
}
WHY IT WORKS: Lots of whitespace, minimal color palette, elegant typography, centered composition, clean and professional.

EXAMPLE 3 - Tech Conference (Modern):
{
  "title": "Tech Summit 2025",
  "backgroundColor": "#0F3460",
  "elements": [
    {"type": "shape", "x": 50, "y": 50, "width": 700, "height": 500, "color": "#16213E", "borderRadius": "24px", "shape": "rectangle"},
    {"type": "text", "content": "TECH SUMMIT", "x": 100, "y": 200, "width": 600, "height": 100, "fontSize": 84, "fontWeight": "bold", "color": "#00FFFF"},
    {"type": "text", "content": "2025", "x": 100, "y": 310, "width": 600, "height": 60, "fontSize": 48, "fontWeight": "600", "color": "#FFFFFF"},
    {"type": "icon", "iconName": "zap", "iconFamily": "lucide", "x": 650, "y": 100, "width": 64, "height": 64, "color": "#00FFFF"}
  ]
}
WHY IT WORKS: Dark background with neon accents, geometric shapes, tech-forward aesthetic, icon adds visual interest.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      prompt, 
      imageBase64, 
      analysisType, 
      canvasWidth = 800, 
      canvasHeight = 1200,
      model = 'claude-sonnet-4-5', // Default model
      colorPalette // Optional color palette preference
    } = await req.json();
    
    console.log('AI Poster Generation - Model:', model, 'Type:', analysisType);
    console.log('Canvas dimensions:', canvasWidth, 'x', canvasHeight);
    
    // Validate model
    const modelConfig = MODEL_CONFIGS[model];
    if (!modelConfig) {
      throw new Error(`Unsupported model: ${model}`);
    }

    // Get API keys
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (modelConfig.provider === 'anthropic' && !ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    if (modelConfig.provider === 'openai' && !OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Handle images
    let images: string[] = [];
    if (imageBase64) {
      if (Array.isArray(imageBase64)) {
        images = imageBase64.filter(img => img && typeof img === 'string');
      } else if (typeof imageBase64 === 'string') {
        images = [imageBase64];
      }
    }
    console.log('Processed images count:', images.length);

    // Detect media type
    const getMediaType = (base64: string): string => {
      if (base64.startsWith('data:image/png')) return 'image/png';
      if (base64.startsWith('data:image/jpeg') || base64.startsWith('data:image/jpg')) return 'image/jpeg';
      if (base64.startsWith('data:image/webp')) return 'image/webp';
      if (base64.startsWith('data:image/gif')) return 'image/gif';
      return 'image/jpeg';
    };

    // Extract keywords from prompt for conditional styling
    const keywords = {
      professional: /professional|business|corporate|formal|elegant/i.test(prompt),
      energetic: /energetic|dynamic|bold|exciting|vibrant/i.test(prompt),
      vintage: /vintage|retro|classic|old|traditional/i.test(prompt),
      modern: /modern|contemporary|sleek|minimalist|clean/i.test(prompt),
      playful: /playful|fun|colorful|whimsical|cheerful/i.test(prompt),
    };

    // Apply palette preference if provided
    let paletteGuidance = '';
    if (colorPalette && COLOR_PALETTES[colorPalette]) {
      const colors = COLOR_PALETTES[colorPalette];
      paletteGuidance = `\n\nCOLOR PALETTE REQUIREMENT: Use ONLY these colors from the ${colorPalette} palette: ${colors.join(', ')}. These colors MUST be used in your design.`;
    }

    // Apply conditional style guidance
    let styleGuidance = '';
    if (keywords.professional) {
      styleGuidance = '\nSTYLE: Professional - Use minimal colors (2-3), clean sans-serif fonts, ample whitespace, subtle shapes.';
    } else if (keywords.energetic) {
      styleGuidance = '\nSTYLE: Energetic - Use bold colors from energetic palette, large dynamic typography, diagonal elements, high contrast.';
    } else if (keywords.vintage) {
      styleGuidance = '\nSTYLE: Vintage - Use earth/muted palettes, serif or display fonts, textured rectangles, classic composition.';
    } else if (keywords.modern) {
      styleGuidance = '\nSTYLE: Modern - Use gradients (via overlapping shapes), geometric shapes, contemporary fonts, asymmetric layout.';
    } else if (keywords.playful) {
      styleGuidance = '\nSTYLE: Playful - Use playful palette, mixed sizes, circles and rounded shapes, fun icons.';
    }

    // Build prompt based on type
    let userPrompt = '';
    
    if (analysisType === 'replicate' && images.length > 0) {
      userPrompt = `${DESIGN_SYSTEM_PROMPT}

TASK: Analyze and replicate this poster design with EXTREME PRECISION.

TARGET CANVAS: ${canvasWidth}px × ${canvasHeight}px

REPLICATION STEPS:
1. Estimate source image dimensions
2. Calculate scale factors: scaleX = ${canvasWidth}/sourceWidth, scaleY = ${canvasHeight}/sourceHeight
3. Scale ALL measurements: x_new = x_original × scaleX, y_new = y_original × scaleY, etc.
4. Extract EXACT colors (hex values)
5. Copy EXACT text content
6. Match shapes (rectangle: borderRadius="0", circle: borderRadius="50%" + equal width/height)
7. Match icons to lucide-react names

Return JSON:
{
  "title": "Replicated: [name]",
  "backgroundColor": "#hex",
  "elements": [{"type": "text|shape|icon", ...}],
  "style": "description",
  "mood": "mood"
}`;
    } else if (analysisType === 'create' && images.length > 0) {
      userPrompt = `${DESIGN_SYSTEM_PROMPT}

${DESIGN_EXAMPLES}

TASK: Create a professional poster using ${images.length > 1 ? `these ${images.length} images` : 'this image'}.
USER REQUEST: "${prompt || 'Create an eye-catching poster'}"

CANVAS: ${canvasWidth}px × ${canvasHeight}px
${styleGuidance}${paletteGuidance}

DESIGN REQUIREMENTS:
- Choose a mood-based color palette that complements the image
- Create clear typography hierarchy (title 72-96px, body 24-32px)
- Use 8pt grid spacing (16, 24, 32, 48px)
- Add relevant lucide icons (heart, star, sparkles, trophy, etc.)
- Ensure adequate whitespace (min 40px margins)
- Apply quality checklist principles

Return JSON:
{
  "title": "Poster title",
  "backgroundColor": "#hex",
  "elements": [
    {"type": "image", "content": "user-uploaded-image", "x": 0, "y": 0, "width": 0, "height": 0},
    {"type": "text", "content": "text", "x": 0, "y": 0, "width": 0, "height": 0, "color": "#hex", "fontSize": 0, "fontWeight": "normal|bold"},
    {"type": "icon", "content": "desc", "x": 0, "y": 0, "width": 0, "height": 0, "color": "#hex", "iconName": "heart", "iconFamily": "lucide"},
    {"type": "shape", "content": "desc", "x": 0, "y": 0, "width": 0, "height": 0, "color": "#hex", "borderRadius": "0|16px|50%", "shape": "rectangle|circle"}
  ],
  "style": "description",
  "mood": "mood"
}`;
    } else {
      userPrompt = `${DESIGN_SYSTEM_PROMPT}

${DESIGN_EXAMPLES}

TASK: Create a professional poster design.
USER REQUEST: "${prompt}"

CANVAS: ${canvasWidth}px × ${canvasHeight}px
${styleGuidance}${paletteGuidance}

SIZING GUIDELINES:
- Titles: ${Math.floor(canvasHeight * 0.06)}-${Math.floor(canvasHeight * 0.08)}px
- Subtitles: ${Math.floor(canvasHeight * 0.04)}-${Math.floor(canvasHeight * 0.05)}px
- Body: ${Math.floor(canvasHeight * 0.02)}-${Math.floor(canvasHeight * 0.03)}px
- Icons: ${Math.floor(canvasHeight * 0.05)}-${Math.floor(canvasHeight * 0.08)}px
- Margins: ${Math.floor(canvasHeight * 0.04)}px minimum

DESIGN REQUIREMENTS:
- Select a mood-based palette (energetic, calm, professional, etc.)
- Create visual hierarchy with typography sizes
- Use 8pt grid spacing throughout
- Add strategic icons from lucide-react (music, star, award, trophy, heart, sparkles, etc.)
- Balance elements using rule of thirds
- Ensure whitespace and breathing room

AVAILABLE ICONS: heart, star, circle, square, triangle, sparkles, zap, flame, sun, moon, cloud, music, crown, gift, award, trophy, facebook, twitter, instagram, bell, bookmark, calendar, camera, clock, mail, phone, share, thumbs-up

Return JSON (flat structure, NO nested frames):
{
  "title": "Poster title",
  "backgroundColor": "#hex",
  "elements": [
    {"type": "text|shape|icon", "content": "text or desc", "x": 0, "y": 0, "width": 0, "height": 0, "color": "#hex", "fontSize": 0, "fontWeight": "normal|bold", "borderRadius": "0|16px|50%", "shape": "rectangle|circle", "iconName": "icon", "iconFamily": "lucide"}
  ],
  "style": "Modern minimal with energetic palette",
  "mood": "Exciting and professional"
}`;
    }

    // Make API call based on provider
    let response: Response;
    
    if (modelConfig.provider === 'anthropic') {
      // Anthropic Claude API
      const messages: any[] = [];
      
      if (images.length > 0) {
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
          content: [...imageContents, { type: 'text', text: userPrompt }]
        });
      } else {
        messages.push({
          role: 'user',
          content: userPrompt
        });
      }

      response = await fetch(modelConfig.endpoint, {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: modelConfig.apiModel,
          max_tokens: modelConfig.maxTokens,
          messages: messages,
          stream: modelConfig.supportsStreaming,
        }),
      });
    } else {
      // OpenAI API
      const messages: any[] = [
        { 
          role: 'system', 
          content: DESIGN_SYSTEM_PROMPT + '\n\nIMPORTANT: Return ONLY valid JSON without any markdown formatting or code blocks. Your entire response must be a single JSON object.' 
        }
      ];
      
      if (images.length > 0) {
        const imageContents = images.map(img => ({
          type: 'image_url',
          image_url: { url: img }
        }));
        
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            ...imageContents
          ]
        });
      } else {
        messages.push({
          role: 'user',
          content: userPrompt
        });
      }

      const bodyParams: any = {
        model: modelConfig.apiModel,
        messages: messages,
        max_completion_tokens: modelConfig.maxCompletionTokens,
        response_format: { type: 'json_schema', json_schema: DESIGN_JSON_SCHEMA },
        stream: modelConfig.supportsStreaming,
      };

      response = await fetch(modelConfig.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY!}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyParams),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${modelConfig.provider} API error:`, response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('Payment required. Please add credits to continue.');
      }
      if (response.status === 400) {
        // Try to parse error details
        try {
          const errorData = JSON.parse(errorText);
          const errorMsg = errorData.error?.message || errorText;
          throw new Error(`${modelConfig.provider} API error: ${errorMsg}`);
        } catch {
          throw new Error(`${modelConfig.provider} API error (400): ${errorText}`);
        }
      }
      
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    // Handle streaming vs non-streaming responses
    if (modelConfig.supportsStreaming) {
      // Stream response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (!reader) {
        throw new Error('No response body');
      }

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
                if (!line.startsWith('data: ')) continue;
                
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  let text = '';
                  
                  if (modelConfig.provider === 'anthropic') {
                    if (parsed.type === 'content_block_delta') {
                      text = parsed.delta?.text || '';
                    }
                  } else {
                    // OpenAI
                    text = parsed.choices?.[0]?.delta?.content || '';
                  }
                  
                  if (text) {
                    fullContent += text;
                    
                    // Progress messages
                    let progressMessage = '';
                    
                    if (fullContent.includes('"title"') && !lastProgressSent.includes('title')) {
                      const titleMatch = fullContent.match(/"title"\s*:\s*"([^"]+)"/);
                      if (titleMatch) {
                        progressMessage = `Setting up design: "${titleMatch[1]}"`;
                      }
                    }
                    
                    if (fullContent.includes('"backgroundColor"') && !lastProgressSent.includes('background')) {
                      progressMessage = 'Applying color palette...';
                    }
                    
                    const elementMatches = fullContent.match(/"type"\s*:\s*"(text|shape|icon|image)"/g);
                    if (elementMatches && elementMatches.length > elementCount) {
                      elementCount = elementMatches.length;
                      progressMessage = `Adding element ${elementCount}...`;
                    }
                    
                    if (progressMessage && progressMessage !== lastProgressSent) {
                      lastProgressSent = progressMessage;
                      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
                        type: 'status', 
                        message: progressMessage 
                      })}\n\n`));
                    }
                  }
                } catch (e) {
                  // Skip invalid JSON
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
              console.error('Failed to parse AI response:', e);
              throw new Error('AI generated invalid design specification');
            }

            console.log('Successfully generated poster with model:', model);
            
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
              type: 'complete', 
              designSpec,
              model
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
    } else {
      // Non-streaming response (for OpenAI models)
      const responseData = await response.json();
      console.log('Non-streaming response received');
      console.log('Full OpenAI response:', JSON.stringify(responseData));
      
      // Prefer parsed JSON when using json_schema
      let designSpec = responseData.choices?.[0]?.message?.parsed;

      if (!designSpec) {
        // Fallback to content extraction
        let fullContent = '';
        const content = responseData.choices?.[0]?.message?.content;
        if (typeof content === 'string') {
          fullContent = content;
        } else if (Array.isArray(content)) {
          for (const part of content) {
            if (typeof part?.text === 'string') fullContent += part.text + '\n';
            else if (typeof part?.content === 'string') fullContent += part.content + '\n';
          }
        }

        try {
          if (fullContent.trim()) {
            console.log('Attempting direct JSON parse of concatenated content...');
            designSpec = JSON.parse(fullContent);
          } else {
            throw new Error('Empty content');
          }
        } catch (parseError) {
          console.error('Direct JSON parse failed:', parseError);
          // Fallback: try to extract JSON from markdown code blocks
          const jsonMatch = fullContent.match(/```json\n([\s\S]*?)\n```/) || fullContent.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : '';
          if (!jsonStr) {
            console.error('No JSON found in OpenAI content');
            throw new Error('AI generated invalid design specification');
          }
          designSpec = JSON.parse(jsonStr);
        }
      }

      console.log('Successfully generated poster with model:', model);

      // Return as SSE for consistency with streaming
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
            type: 'status', 
            message: 'Generating design...' 
          })}\n\n`));
          
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
            type: 'complete', 
            designSpec,
            model
          })}\n\n`));
          
          controller.close();
        }
      });

      // (duplicate stream block removed)

      return new Response(stream, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

  } catch (error) {
    console.error('Error in generate-ai-poster:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
