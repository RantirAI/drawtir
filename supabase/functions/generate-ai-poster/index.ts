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
const DESIGN_SYSTEM_PROMPT = `You are an award-winning poster designer with 20 years of experience creating magazine-quality, visually stunning designs.

🎨 COLOR MASTERY:
- Use bold, high-contrast color combinations for impact
- Apply 60-30-10 rule: 60% dominant, 30% secondary, 10% accent
- Ensure WCAG AAA contrast (7:1 minimum for readability)
- Color psychology: Red=energy/urgency, Blue=trust/calm, Yellow=optimism/warmth, Purple=luxury/creativity, Green=growth/nature

CURATED COLOR PALETTES (use these!):
${Object.entries(COLOR_PALETTES).map(([mood, colors]) => `- ${mood}: ${colors.join(', ')}`).join('\n')}

📐 LAYOUT PRINCIPLES:
- Rule of thirds: Place key elements at 33% or 66% positions
- Golden ratio (1.618): Create naturally pleasing proportions
- Visual hierarchy: Largest → Medium → Smallest elements guide the eye
- Whitespace: Minimum 60-80px margins, generous breathing room
- Grid system: Use 8pt grid (16, 24, 32, 48, 64, 80px spacing)
- Balance: Asymmetric layouts with intentional weight distribution

✍️ TYPOGRAPHY RULES:
- Display titles: 80-120px, weight 800-900, tight letter-spacing (-0.03em)
- Headlines: 56-80px, weight 700-800, tight letter-spacing (-0.02em)
- Subheadings: 36-56px, weight 600-700, normal spacing
- Body text: 24-36px, weight 400-500, relaxed line-height (1.6)
- Use maximum 2 font families per design
- Create clear size hierarchy (minimum 2:1 ratio between levels)

🎯 DESIGN ELEMENTS:
- Strategic shapes: Circles for focus/softness, rectangles for structure/stability
- Icons from lucide-react: Use sparingly for visual interest (music, star, heart, trophy, sparkles, zap, award, crown)
- Layering: Overlap shapes and text for depth
- Alignment: Everything must snap to grid - no random positioning
- Contrast: High contrast between text and background (never gray on gray)

💡 PROFESSIONAL TECHNIQUES:
1. Create immediate focal point (viewer's eye lands in <0.5 seconds)
2. Use diagonal elements for energy and movement
3. Strategic color blocking for visual impact
4. Large bold numbers/dates as design elements
5. Decorative shapes frame important content
6. Overlap elements for depth and sophistication
7. Generous whitespace makes designs breathe
8. Consistent visual rhythm throughout

🏆 QUALITY CHECKLIST:
✓ Clear visual hierarchy (obvious what to read first)
✓ High contrast text (easily readable)
✓ Harmonious color palette (3-4 colors max)
✓ Perfect alignment (grid-snapped positioning)
✓ Generous whitespace (not cramped)
✓ Professional polish (no amateur mistakes)
✓ Intentional composition (every element has purpose)`;

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
      colorPalette, // Optional color palette preference
      generationTypes = [] // Array of generation types (e.g., ["generate-image", "create"])
    } = await req.json();
    
    console.log('AI Poster Generation - Model:', model, 'Type:', analysisType, 'Generation types:', generationTypes);
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

    // Step 1: Generate image if "generate-image" type is selected
    let generatedImageBase64: string | null = null;
    if (generationTypes.includes('generate-image') && prompt) {
      console.log('Generating image with AI first...');
      
      const imageGenResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
              content: `Create a high-quality, professional image for a poster with this theme: ${prompt}. 
              
Style it appropriately for a poster - vibrant, eye-catching, and visually appealing. 
The image should be suitable as a main visual element in a poster design.
Aspect ratio should be roughly ${canvasWidth}x${canvasHeight} (${(canvasWidth/canvasHeight).toFixed(2)}:1).`
            }
          ],
          modalities: ['image', 'text']
        })
      });

      if (!imageGenResponse.ok) {
        console.error('Image generation failed:', imageGenResponse.status);
        throw new Error('Failed to generate image with AI');
      }

      const imageData = await imageGenResponse.json();
      const generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (generatedImage) {
        generatedImageBase64 = generatedImage;
        console.log('Successfully generated image with AI');
      } else {
        console.warn('No image returned from AI generation');
      }
    }

    // Handle images (uploaded + generated)
    let images: string[] = [];
    if (imageBase64) {
      if (Array.isArray(imageBase64)) {
        images = imageBase64.filter(img => img && typeof img === 'string');
      } else if (typeof imageBase64 === 'string') {
        images = [imageBase64];
      }
    }
    
    // Add generated image if exists
    if (generatedImageBase64) {
      images = [generatedImageBase64, ...images];
    }
    
    console.log('Total images for poster design:', images.length, '(generated:', generatedImageBase64 ? 1 : 0, ', uploaded:', images.length - (generatedImageBase64 ? 1 : 0), ')');

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

TASK: Create a stunning poster featuring ${images.length > 1 ? `these ${images.length} images` : 'this image'}.
USER REQUEST: "${prompt || 'Create an eye-catching poster with great visual impact'}"

CANVAS: ${canvasWidth}px × ${canvasHeight}px (${(canvasWidth/canvasHeight).toFixed(2)}:1 aspect ratio)
${styleGuidance}${paletteGuidance}

CRITICAL SIZING GUIDELINES:
- Display Title: ${Math.floor(canvasHeight * 0.08)}-${Math.floor(canvasHeight * 0.10)}px, weight 800-900
- Headline: ${Math.floor(canvasHeight * 0.05)}-${Math.floor(canvasHeight * 0.07)}px, weight 700
- Body Text: ${Math.floor(canvasHeight * 0.02)}-${Math.floor(canvasHeight * 0.025)}px, weight 400
- Icons: ${Math.floor(canvasHeight * 0.06)}-${Math.floor(canvasHeight * 0.08)}px
- Margins: ${Math.floor(canvasWidth * 0.08)}px minimum

DESIGN REQUIREMENTS FOR IMAGE POSTERS:
1. Position the image prominently (consider full-bleed or feature placement)
2. Overlay text with high contrast (use solid color shapes behind text if needed)
3. Choose colors that complement the image
4. Add 2-3 strategic shapes for visual interest
5. Include 1-2 relevant icons
6. Create clear visual hierarchy
7. Use generous spacing
8. Ensure all text is readable with 7:1 contrast

IMAGE POSITIONING STRATEGIES:
- Full-bleed: Image spans entire canvas (x: 0, y: 0, width: ${canvasWidth}, height: ${canvasHeight})
- Hero: Image in top 60% (y: 0, height: ${Math.floor(canvasHeight * 0.6)})
- Feature: Image positioned strategically with text overlay

Return complete JSON:
{
  "title": "Poster title",
  "backgroundColor": "#hex",
  "elements": [
    {"type": "image", "content": "user-uploaded-image", "x": 0, "y": 0, "width": ${canvasWidth}, "height": ${Math.floor(canvasHeight * 0.6)}},
    {"type": "text", "content": "BOLD TITLE", "x": 64, "y": ${Math.floor(canvasHeight * 0.65)}, "width": ${canvasWidth - 128}, "height": 100, "color": "#FFFFFF", "fontSize": 96, "fontWeight": "900"},
    {"type": "shape", ...},
    {"type": "icon", ...}
  ],
  "style": "Modern with striking visuals",
  "mood": "Bold and engaging"
}`;
    } else {
      userPrompt = `${DESIGN_SYSTEM_PROMPT}

${DESIGN_EXAMPLES}

TASK: Create a stunning, professional poster design that stands out.
USER REQUEST: "${prompt}"

CANVAS: ${canvasWidth}px × ${canvasHeight}px (${(canvasWidth/canvasHeight).toFixed(2)}:1 aspect ratio)
${styleGuidance}${paletteGuidance}

CRITICAL SIZING GUIDELINES (follow exactly):
- Display Title: ${Math.floor(canvasHeight * 0.08)}-${Math.floor(canvasHeight * 0.10)}px, weight 800-900
- Headline: ${Math.floor(canvasHeight * 0.05)}-${Math.floor(canvasHeight * 0.07)}px, weight 700
- Subheading: ${Math.floor(canvasHeight * 0.03)}-${Math.floor(canvasHeight * 0.04)}px, weight 600
- Body Text: ${Math.floor(canvasHeight * 0.02)}-${Math.floor(canvasHeight * 0.025)}px, weight 400
- Icons: ${Math.floor(canvasHeight * 0.06)}-${Math.floor(canvasHeight * 0.08)}px
- Canvas Margins: ${Math.floor(canvasWidth * 0.08)}px (left/right), ${Math.floor(canvasHeight * 0.06)}px (top/bottom)
- Element Spacing: 32-48px between major sections, 16-24px between related items

MANDATORY DESIGN REQUIREMENTS:
1. Choose ONE curated color palette that matches the mood (${Object.keys(COLOR_PALETTES).join(', ')})
2. Create dramatic visual hierarchy (title must be 2-3x larger than body)
3. Use 8pt grid spacing (all x, y, width, height must be multiples of 8 or 16)
4. Add 2-4 strategic shapes for visual interest (circles, rectangles with borderRadius)
5. Include 1-3 relevant icons from lucide-react library
6. Follow rule of thirds for element placement (33%, 66% positions)
7. Ensure high contrast (7:1 minimum) between text and background
8. Use generous whitespace - don't crowd elements

POPULAR ICONS (use these): sparkles, star, heart, trophy, award, crown, zap, flame, music, gift, calendar, camera, sun, moon, circle-dot, square-check, triangle

COMPOSITION TIPS:
- Main title: Top third (y around ${Math.floor(canvasHeight * 0.2)})
- Supporting content: Middle third
- Details/footer: Bottom third (y around ${Math.floor(canvasHeight * 0.75)})
- Background shapes: Can span full canvas for impact
- Text must always be readable with proper contrast

Return JSON (COMPLETE structure, NO nested frames):
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
            let sentElementCount = 0;
            let lastProgressSent = '';
            let backgroundColor = '';
            let hasContent = false;
            
            let streamComplete = false;
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                
                const data = line.slice(6);
                if (data === '[DONE]') {
                  streamComplete = true;
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  const text = parsed.choices?.[0]?.delta?.content || '';
                  
                  if (text) {
                    fullContent += text;
                    hasContent = true;
                    
                    // Stream background color immediately
                    if (!backgroundColor && fullContent.includes('"backgroundColor"')) {
                      const bgMatch = fullContent.match(/"backgroundColor"\s*:\s*"(#[0-9A-Fa-f]{6})"/);
                      if (bgMatch) {
                        backgroundColor = bgMatch[1];
                        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
                          type: 'background', 
                          color: backgroundColor 
                        })}\n\n`));
                      }
                    }
                    
                    // Try to extract and stream complete elements progressively
                    const elementRegex = /\{[^{}]*"type"\s*:\s*"(text|shape|icon|image)"[^{}]*\}/g;
                    const elementMatches = [...fullContent.matchAll(elementRegex)];
                    
                    // Send any new complete elements
                    if (elementMatches.length > sentElementCount) {
                      for (let i = sentElementCount; i < elementMatches.length; i++) {
                        try {
                          const elementJson = elementMatches[i][0];
                          const element = JSON.parse(elementJson);
                          
                          // Validate element has required fields
                          if (element.type && element.x !== undefined && element.y !== undefined) {
                            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
                              type: 'element', 
                              element: element,
                              index: i 
                            })}\n\n`));
                            sentElementCount++;
                          }
                        } catch (e) {
                          // Element not complete yet, will try again next iteration
                        }
                      }
                    }
                    
                    // Progress messages
                    let progressMessage = '';
                    
                    if (fullContent.includes('"title"') && !lastProgressSent.includes('title')) {
                      const titleMatch = fullContent.match(/"title"\s*:\s*"([^"]+)"/);
                      if (titleMatch) {
                        progressMessage = `Setting up design: "${titleMatch[1]}"`;
                      }
                    }
                    
                    if (backgroundColor && !lastProgressSent.includes('background')) {
                      progressMessage = 'Applying color palette...';
                    }
                    
                    const elementCountMatches = fullContent.match(/"type"\s*:\s*"(text|shape|icon|image)"/g);
                    if (elementCountMatches && elementCountMatches.length > elementCount) {
                      elementCount = elementCountMatches.length;
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
              
              // Break out of while loop if stream is complete
              if (streamComplete) break;
            }

            // Ensure we have content before parsing
            if (!hasContent || fullContent.length < 50) {
              console.error('Insufficient content received from AI');
              console.error('Full content received:', fullContent);
              throw new Error('AI did not generate enough content');
            }
            
            console.log('Stream complete, full content length:', fullContent.length);
            console.log('Content preview (first 500 chars):', fullContent.substring(0, 500));

            // Parse final result with robust error handling
            let designSpec;
            try {
              // Remove any markdown code blocks
              let cleanContent = fullContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              
              // Try to extract JSON object - be more lenient with incomplete JSON
              let jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
              if (!jsonMatch) {
                console.error('No JSON object found in response');
                console.error('Full content:', fullContent.substring(0, 1000));
                throw new Error('AI did not return a valid JSON object');
              }
              
              let jsonStr = jsonMatch[0];
              
              // Try to fix incomplete JSON by ensuring proper closing
              const openBraces = (jsonStr.match(/\{/g) || []).length;
              const closeBraces = (jsonStr.match(/\}/g) || []).length;
              const openBrackets = (jsonStr.match(/\[/g) || []).length;
              const closeBrackets = (jsonStr.match(/\]/g) || []).length;
              
              // Add missing closing brackets/braces
              if (openBrackets > closeBrackets) {
                jsonStr += ']'.repeat(openBrackets - closeBrackets);
              }
              if (openBraces > closeBraces) {
                jsonStr += '}'.repeat(openBraces - closeBraces);
              }
              
              // Clean up common JSON issues
              jsonStr = jsonStr
                .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
                .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Ensure property names are quoted
                .replace(/:\s*'([^']*)'/g, ': "$1"') // Convert single quotes to double quotes
                .replace(/\n/g, ' ') // Remove newlines
                .replace(/\s+/g, ' '); // Normalize whitespace
              
              console.log('Attempting to parse JSON (length:', jsonStr.length, ')');
              console.log('First 300 chars:', jsonStr.substring(0, 300));
              console.log('Last 300 chars:', jsonStr.substring(jsonStr.length - 300));
              
              designSpec = JSON.parse(jsonStr);
              
              // Validate required fields
              if (!designSpec.elements || !Array.isArray(designSpec.elements)) {
                throw new Error('Invalid design spec: missing elements array');
              }
              
              console.log('Successfully parsed design with', designSpec.elements.length, 'elements');
              
            } catch (e) {
              console.error('Failed to parse AI response:', e);
              console.error('Full response length:', fullContent.length);
              console.error('Response preview:', fullContent.substring(0, 1000));
              throw new Error(`AI generated invalid design specification: ${e instanceof Error ? e.message : 'Unknown error'}`);
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
