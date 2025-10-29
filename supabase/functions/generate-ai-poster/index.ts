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

// Model configuration for Lovable AI
const MODEL_CONFIGS: Record<string, any> = {
  'gemini-2.5-flash': {
    model: 'google/gemini-2.5-flash',
    maxTokens: 4096,
  },
  'gemini-2.5-pro': {
    model: 'google/gemini-2.5-pro',
    maxTokens: 4096,
  },
  'gemini-2.5-flash-lite': {
    model: 'google/gemini-2.5-flash-lite',
    maxTokens: 4096,
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

// Enhanced design system prompt with professional design principles
const DESIGN_SYSTEM_PROMPT = `You are a world-class poster designer creating magazine-quality, award-winning designs.

🎨 ADVANCED COLOR THEORY:
- Complementary colors (opposite on wheel): High energy, maximum contrast
- Analogous colors (adjacent): Harmonious, cohesive feel
- Triadic schemes (120° apart): Bold, balanced vibrancy
- 60-30-10 rule: 60% dominant, 30% secondary, 10% accent pop
- WCAG AAA contrast: 7:1 for body text, 4.5:1 for large text
- Color psychology: Red=energy, Blue=trust, Yellow=optimism, Purple=luxury

CURATED COLOR PALETTES:
${Object.entries(COLOR_PALETTES).map(([mood, colors]) => `- ${mood}: ${colors.join(', ')}`).join('\n')}

📐 LAYOUT MASTERY:
- Rule of thirds: Place key elements at intersection points (33%, 66%)
- Golden ratio (1.618): Natural, aesthetically pleasing proportions
- Z-pattern reading: Top-left → Top-right → Bottom-left → Bottom-right
- F-pattern reading: Titles left, body text flowing right
- Visual weight balance: Heavy top-left needs light bottom-right
- Negative space as design element: Whitespace guides the eye
- 8pt grid system: All spacing in multiples of 8 (16, 24, 32, 48, 64, 80)

✍️ TYPOGRAPHY EXCELLENCE:
- Display titles: 80-120px, ExtraBold (800-900), tight tracking (-0.03em)
- Headlines: 56-72px, Bold (700), tight tracking (-0.02em)
- Subheadings: 36-48px, SemiBold (600), normal tracking
- Body text: 24-32px, Regular (400-500), relaxed line-height (1.6-1.8)
- Captions: 18-24px, Regular (400), slightly loose tracking (0.01em)
- Never use more than 2 font families
- Pair geometric sans (modern) with serif (elegant) OR monospace (tech)

🎯 VISUAL HIERARCHY:
1. Primary focus (largest, highest contrast, top-third)
2. Secondary elements (medium size, support primary)
3. Tertiary details (smaller, subtle, bottom-third)
- Size contrast ratio: Minimum 2:1 between levels
- Use color, size, AND position to establish hierarchy

📏 SPACING & RHYTHM:
- Micro: 8px (tight grouping)
- Small: 16px (related items)
- Medium: 24-32px (section spacing)
- Large: 48-64px (major divisions)
- XLarge: 80-120px (canvas margins, dramatic space)
- Consistent rhythm creates professional feel

🎭 DESIGN STYLES:
- Modern Minimal: 90% whitespace, 1-2 bold colors, geometric shapes, sans-serif
- Swiss International: Grid-based, flush-left text, limited colors, helvetica-style fonts
- Brutalist: Oversized bold typography, asymmetric layouts, raw geometric shapes
- Art Deco: Luxurious golds, geometric patterns, elegant symmetry, sophisticated
- Contemporary: Vibrant gradients, overlapping elements, mixed typography, experimental

🏆 PROFESSIONAL QUALITY STANDARDS:
✓ Immediate focal point (eye lands in <0.5 seconds)
✓ Clear visual path (guides viewer through content)
✓ High contrast (WCAG AAA: 7:1 minimum)
✓ Harmonious palette (3-4 colors maximum)
✓ Perfect alignment (every element grid-snapped)
✓ Generous whitespace (minimum 60px margins)
✓ Intentional asymmetry (not accidental imbalance)
✓ Typography scale (clear size differences)
✓ Professional polish (no amateurish mistakes)

💡 CREATIVE TECHNIQUES:
- Overlap shapes for depth and dimension
- Use circles for focus, rectangles for structure
- Diagonal elements add energy and movement
- Icons reinforce message (lucide-react library)
- Strategic color blocking creates impact
- Gradients add modern sophistication
- Large numbers/dates as design elements
- Decorative shapes (circles, lines) frame content`;

// Few-shot learning with professional examples
const DESIGN_EXAMPLES = `
EXAMPLE 1 - Sports Championship (Bold & Dynamic):
{
  "title": "Championship Finals",
  "backgroundColor": "#1a1a2e",
  "elements": [
    {"type": "shape", "x": 600, "y": 100, "width": 350, "height": 350, "color": "#00d9ff", "borderRadius": "50%", "shape": "circle"},
    {"type": "text", "content": "CHAMPIONSHIP", "x": 80, "y": 200, "width": 640, "height": 90, "fontSize": 88, "fontWeight": "900", "color": "#FFFFFF"},
    {"type": "text", "content": "FINALS", "x": 80, "y": 300, "width": 640, "height": 110, "fontSize": 108, "fontWeight": "900", "color": "#00d9ff"},
    {"type": "shape", "x": 80, "y": 430, "width": 480, "height": 6, "color": "#00d9ff", "borderRadius": "0", "shape": "rectangle"},
    {"type": "text", "content": "MARCH 15-17, 2025", "x": 80, "y": 470, "width": 640, "height": 45, "fontSize": 32, "fontWeight": "600", "color": "#FFFFFF"},
    {"type": "text", "content": "City Sports Arena", "x": 80, "y": 520, "width": 640, "height": 35, "fontSize": 26, "fontWeight": "400", "color": "#a8a8a8"},
    {"type": "icon", "iconName": "trophy", "iconFamily": "lucide", "x": 90, "y": 900, "width": 70, "height": 70, "color": "#ffd700"},
    {"type": "icon", "iconName": "star", "iconFamily": "lucide", "x": 180, "y": 900, "width": 70, "height": 70, "color": "#ffd700"}
  ]
}
WHY IT WORKS: Oversized typography creates impact, circular shape adds energy, accent line creates structure, golden icons add prestige, dark background makes colors pop.

EXAMPLE 2 - Concert Experience (Vibrant & Modern):
{
  "title": "Summer Music Fest",
  "backgroundColor": "#FF6B35",
  "elements": [
    {"type": "shape", "x": 0, "y": 0, "width": 800, "height": 400, "color": "#F7931E", "borderRadius": "0", "shape": "rectangle"},
    {"type": "text", "content": "SUMMER", "x": 80, "y": 150, "width": 640, "height": 95, "fontSize": 92, "fontWeight": "900", "color": "#FFFFFF"},
    {"type": "text", "content": "MUSIC FEST", "x": 80, "y": 250, "width": 640, "height": 75, "fontSize": 72, "fontWeight": "700", "color": "#FDC830"},
    {"type": "shape", "x": 300, "y": 500, "width": 200, "height": 200, "color": "#FFFFFF", "borderRadius": "50%", "shape": "circle"},
    {"type": "icon", "iconName": "music", "iconFamily": "lucide", "x": 350, "y": 550, "width": 100, "height": 100, "color": "#FF6B35"},
    {"type": "text", "content": "JULY 20-22 • OPEN AIR VENUE", "x": 80, "y": 850, "width": 640, "height": 40, "fontSize": 28, "fontWeight": "600", "color": "#FFFFFF"}
  ]
}
WHY IT WORKS: Energetic orange gradients, massive bold typography, circular focal point with icon, clear date info, vibrant color scheme creates excitement.

EXAMPLE 3 - Tech Product Launch (Minimal & Sophisticated):
{
  "title": "Product Launch",
  "backgroundColor": "#0F1419",
  "elements": [
    {"type": "shape", "x": 100, "y": 300, "width": 600, "height": 400, "color": "#16213E", "borderRadius": "32px", "shape": "rectangle"},
    {"type": "text", "content": "NEXT", "x": 150, "y": 450, "width": 500, "height": 80, "fontSize": 76, "fontWeight": "300", "color": "#FFFFFF"},
    {"type": "text", "content": "GENERATION", "x": 150, "y": 540, "width": 500, "height": 100, "fontSize": 96, "fontWeight": "800", "color": "#00F0FF"},
    {"type": "icon", "iconName": "zap", "iconFamily": "lucide", "x": 650, "y": 200, "width": 80, "height": 80, "color": "#00F0FF"},
    {"type": "text", "content": "Launch Event • March 2025", "x": 150, "y": 850, "width": 500, "height": 35, "fontSize": 24, "fontWeight": "400", "color": "#888888"}
  ]
}
WHY IT WORKS: Dark minimalist aesthetic, contrast between light/bold typography, neon accent color, rounded rectangle creates modern feel, strategic whitespace.

EXAMPLE 4 - Elegant Event (Luxury & Clean):
{
  "title": "Gala Evening",
  "backgroundColor": "#FAFAFA",
  "elements": [
    {"type": "text", "content": "ANNUAL", "x": 100, "y": 250, "width": 600, "height": 50, "fontSize": 44, "fontWeight": "300", "color": "#333333"},
    {"type": "text", "content": "GALA", "x": 100, "y": 310, "width": 600, "height": 120, "fontSize": 112, "fontWeight": "700", "color": "#1A1A2E"},
    {"type": "text", "content": "EVENING", "x": 100, "y": 440, "width": 600, "height": 70, "fontSize": 64, "fontWeight": "700", "color": "#1A1A2E"},
    {"type": "shape", "x": 300, "y": 600, "width": 200, "height": 6, "color": "#D4AF37", "borderRadius": "0", "shape": "rectangle"},
    {"type": "text", "content": "Black Tie Optional", "x": 100, "y": 700, "width": 600, "height": 35, "fontSize": 28, "fontWeight": "400", "color": "#666666"},
    {"type": "text", "content": "December 31, 2025", "x": 100, "y": 750, "width": 600, "height": 35, "fontSize": 28, "fontWeight": "400", "color": "#666666"}
  ]
}
WHY IT WORKS: Light elegant background, sophisticated typography hierarchy, gold accent line adds luxury, generous whitespace, refined color palette.`;

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
      model = 'gemini-2.5-flash', // Default model
      colorPalette // Optional color palette preference
    } = await req.json();
    
    console.log('AI Poster Generation with Lovable AI - Model:', model, 'Type:', analysisType);
    console.log('Canvas dimensions:', canvasWidth, 'x', canvasHeight);
    
    // Validate model
    const modelConfig = MODEL_CONFIGS[model];
    if (!modelConfig) {
      throw new Error(`Unsupported model: ${model}. Available: ${Object.keys(MODEL_CONFIGS).join(', ')}`);
    }

    // Get Lovable API key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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

    // Make API call to Lovable AI Gateway
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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelConfig.model,
        messages: messages,
        max_tokens: modelConfig.maxTokens,
        stream: true, // Enable streaming for all Lovable AI models
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limits exceeded. Please try again later or reduce request frequency.');
      }
      if (response.status === 402) {
        throw new Error('Credits exhausted. Please add credits to your Lovable workspace in Settings → Usage.');
      }
      if (response.status === 400) {
        // Try to parse error details
        try {
          const errorData = JSON.parse(errorText);
          const errorMsg = errorData.error?.message || errorText;
          throw new Error(`Lovable AI error: ${errorMsg}`);
        } catch {
          throw new Error(`Lovable AI error (400): ${errorText}`);
        }
      }
      
      throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
    }

    // Handle streaming response from Lovable AI
    {
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
                  const text = parsed.choices?.[0]?.delta?.content || '';
                  
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
    }

  } catch (error) {
    console.error('Error in generate-ai-poster:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
