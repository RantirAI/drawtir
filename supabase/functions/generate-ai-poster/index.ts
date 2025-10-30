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

// Curated color palettes - MODERN & VIBRANT
const COLOR_PALETTES: Record<string, string[]> = {
  neonPop: ["#FF006E", "#8338EC", "#3A86FF", "#FFBE0B"],
  cyberpunk: ["#FF00FF", "#00FFFF", "#FFFF00", "#FF0080"],
  modernGradient: ["#667EEA", "#764BA2", "#F093FB", "#F5576C"],
  tropical: ["#FF6B9D", "#FEC859", "#00DFA2", "#0079FF"],
  sunset: ["#FF6B35", "#F7931E", "#FDC830", "#37306B"],
  oceanWave: ["#00B4D8", "#0077B6", "#03045E", "#90E0EF"],
  forest: ["#52B788", "#40916C", "#2D6A4F", "#B7E4C7"],
  luxury: ["#FFD700", "#FF6B35", "#1A1A2E", "#E94560"],
  bubblegum: ["#FFB6D9", "#D864A9", "#5E17EB", "#00D9FF"],
  fire: ["#FF0080", "#FF4D00", "#FF8800", "#FFD600"],
  tech: ["#00F5FF", "#8B5CF6", "#EC4899", "#F59E0B"],
  nature: ["#10B981", "#059669", "#047857", "#D1FAE5"],
};

// Enhanced design system prompt with professional design principles
const DESIGN_SYSTEM_PROMPT = `You are an award-winning poster designer specialized in MODERN, VIBRANT, 2025-STYLE designs. Your designs must be INSTAGRAM-WORTHY and CONTEMPORARY.

🚨 CRITICAL RULES FOR 2025 DESIGN:
- NEVER use plain black (#000000) backgrounds - use deep colors, gradients, or rich tones
- ALWAYS use BOLD, SATURATED colors that POP on screen
- CREATE visual hierarchy with SIZE, not just color
- USE modern design trends: gradients, glassmorphism effects, bold typography
- DESIGNS must look like they're from 2025, not 2005!

🎨 MODERN COLOR MASTERY:
- Use VIBRANT, SATURATED colors that catch attention immediately
- Create STRONG contrast - make text JUMP off the background
- Apply gradients for depth (use 2-3 colors from same family)
- Popular 2025 schemes: Neon + Dark, Pastel + Bold Accent, Gradient Overlays
- NEVER use: plain gray, washed out colors, low-contrast combinations

MODERN COLOR PALETTES (CHOOSE ONE AND USE BOLDLY):
${Object.entries(COLOR_PALETTES).map(([mood, colors]) => `- ${mood}: ${colors.join(', ')}`).join('\n')}

📐 2025 LAYOUT PRINCIPLES:
- ASYMMETRIC layouts with intentional imbalance
- OVERLAPPING elements for depth and dynamism
- LARGE typography (80-120px headlines minimum!)
- Generous whitespace - let designs BREATHE
- Break the grid intentionally for visual interest
- Use DIAGONAL elements and angles

✍️ MODERN TYPOGRAPHY:
- Display titles: 100-140px, weight 800-900, BOLD and THICK
- Headlines: 64-96px, weight 700-800
- Subheads: 40-56px, weight 600-700  
- Body: 28-36px, weight 400-500
- Use UPPERCASE for headlines to maximize impact
- Mix font weights for visual interest

🎯 TRENDY DESIGN ELEMENTS:
- Geometric shapes: circles, rounded rectangles (32px+ radius)
- Colorful blobs and organic shapes
- Icons as accent elements (lucide-react: sparkles, zap, star, heart, award, crown, rocket, trending-up)
- Layered elements with transparency
- Decorative lines and dividers (8-12px thickness)

💡 2025 DESIGN TECHNIQUES:
1. GRADIENT backgrounds (2-3 colors, subtle or bold)
2. Large TYPOGRAPHY as the main visual element
3. Geometric shapes for structure and visual interest
4. Strategic use of bright accent colors
5. Overlapping layers create depth
6. Generous padding and margins (80-120px)
7. Bold color blocking
8. Dynamic angles and rotations

🏆 QUALITY CHECKLIST:
✓ Looks modern and fresh (2025 style, not dated)
✓ Uses VIBRANT, eye-catching colors
✓ LARGE, bold typography
✓ Strong visual hierarchy
✓ Creative use of shapes and layers
✓ Professional polish with contemporary feel
✓ Instagram-worthy aesthetic

❌ AVOID AT ALL COSTS:
- Plain black backgrounds
- Small, timid typography
- Dull, muted colors
- Centered, boring layouts
- Cramped spacing
- Generic corporate look
- Anything that looks "2002-ish"`;

// Few-shot learning with MODERN, VIBRANT examples
const DESIGN_EXAMPLES = `
EXAMPLE 1 - Modern Business (Bold & Colorful):
{
  "title": "Business Innovation 2025",
  "backgroundColor": "#667EEA",
  "elements": [
    {"type": "shape", "x": 500, "y": -100, "width": 600, "height": 600, "color": "#F5576C", "borderRadius": "50%", "shape": "circle"},
    {"type": "text", "content": "INNOVATE", "x": 60, "y": 180, "width": 680, "height": 100, "fontSize": 96, "fontWeight": "900", "color": "#FFFFFF"},
    {"type": "text", "content": "GROW", "x": 60, "y": 290, "width": 680, "height": 100, "fontSize": 96, "fontWeight": "900", "color": "#FFD700"},
    {"type": "text", "content": "SUCCEED", "x": 60, "y": 400, "width": 680, "height": 100, "fontSize": 96, "fontWeight": "900", "color": "#FFFFFF"},
    {"type": "shape", "x": 60, "y": 530, "width": 200, "height": 200, "color": "#FFBE0B", "borderRadius": "32px", "shape": "rectangle"},
    {"type": "icon", "iconName": "rocket", "iconFamily": "lucide", "x": 100, "y": 580, "width": 120, "height": 120, "color": "#667EEA"},
    {"type": "text", "content": "BUSINESS SOLUTIONS", "x": 60, "y": 760, "width": 680, "height": 50, "fontSize": 36, "fontWeight": "700", "color": "#FFFFFF"}
  ]
}
WHY IT WORKS: Vibrant purple gradient background, oversized BOLD typography, bright yellow accent, large circular shape creates energy, modern rounded square with contrasting icon.

EXAMPLE 2 - Event Poster (Neon & Dynamic):
{
  "title": "Music Festival 2025",
  "backgroundColor": "#1A1A2E",
  "elements": [
    {"type": "shape", "x": 100, "y": 100, "width": 400, "height": 400, "color": "#FF00FF", "borderRadius": "50%", "shape": "circle"},
    {"type": "shape", "x": 500, "y": 300, "width": 350, "height": 350, "color": "#00FFFF", "borderRadius": "50%", "shape": "circle"},
    {"type": "text", "content": "SUMMER", "x": 80, "y": 500, "width": 640, "height": 110, "fontSize": 104, "fontWeight": "900", "color": "#FFFFFF"},
    {"type": "text", "content": "VIBES", "x": 80, "y": 620, "width": 640, "height": 110, "fontSize": 104, "fontWeight": "900", "color": "#FFFF00"},
    {"type": "shape", "x": 80, "y": 760, "width": 12, "height": 180, "color": "#FF00FF", "borderRadius": "0", "shape": "rectangle"},
    {"type": "text", "content": "JUNE 15-17", "x": 110, "y": 770, "width": 600, "height": 45, "fontSize": 32, "fontWeight": "700", "color": "#FFFFFF"},
    {"type": "icon", "iconName": "sparkles", "iconFamily": "lucide", "x": 110, "y": 850, "width": 60, "height": 60, "color": "#FFFF00"}
  ]
}
WHY IT WORKS: Dark background makes neon colors POP, overlapping circles create depth, huge typography dominates, bright accent stripe, electric yellow accent color.

EXAMPLE 3 - Product Launch (Gradient & Modern):
{
  "title": "Product Launch",  
  "backgroundColor": "#8B5CF6",
  "elements": [
    {"type": "shape", "x": -100, "y": 800, "width": 500, "height": 500, "color": "#EC4899", "borderRadius": "50%", "shape": "circle"},
    {"type": "shape", "x": 600, "y": -50, "width": 400, "height": 400, "color": "#F59E0B", "borderRadius": "50%", "shape": "circle"},
    {"type": "text", "content": "NEW", "x": 80, "y": 120, "width": 640, "height": 80, "fontSize": 72, "fontWeight": "600", "color": "#FFFFFF"},
    {"type": "text", "content": "ARRIVAL", "x": 80, "y": 210, "width": 640, "height": 130, "fontSize": 120, "fontWeight": "900", "color": "#FFFFFF"},
    {"type": "shape", "x": 80, "y": 370, "width": 320, "height": 320, "color": "#00F5FF", "borderRadius": "40px", "shape": "rectangle"},
    {"type": "text", "content": "2025", "x": 140, "y": 460, "width": 200, "height": 140, "fontSize": 128, "fontWeight": "900", "color": "#8B5CF6"},
    {"type": "icon", "iconName": "trending-up", "iconFamily": "lucide", "x": 80, "y": 750, "width": 80, "height": 80, "color": "#FFFFFF"}
  ]
}
WHY IT WORKS: Rich purple background, overlapping colorful circles at edges, massive "ARRIVAL" text, cyan square with year creates focal point, modern rounded corners.`;

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
        
        // Save to media library if user is authenticated
        const authHeader = req.headers.get('Authorization');
        if (authHeader) {
          try {
            const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.7.1');
            const supabaseClient = createClient(
              Deno.env.get('SUPABASE_URL') ?? '',
              Deno.env.get('SUPABASE_ANON_KEY') ?? '',
              { global: { headers: { Authorization: authHeader } } }
            );

            const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
            
            if (!userError && user) {
              const fileName = `ai-generated-poster-${Date.now()}.png`;
              const { error: insertError } = await supabaseClient.from('media_library').insert({
                user_id: user.id,
                file_name: fileName,
                file_url: generatedImage,
                file_type: 'image/png',
                source: 'ai-generated',
                metadata: { prompt, context: 'poster-generation' }
              });
              
              if (!insertError) {
                console.log('✅ Saved generated poster image to media library');
              } else {
                console.error('Error saving to media library:', insertError);
              }
            }
          } catch (error) {
            console.error('Exception saving to media library:', error);
          }
        }
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
              // Remove code fences and trim obvious wrappers
              let cleanContent = fullContent
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

              // Extract the first complete JSON object while ignoring braces inside strings
              const extractFirstJsonObject = (text: string): string | null => {
                let inString = false;
                let escaped = false;
                let depth = 0;
                let start = -1;
                for (let i = 0; i < text.length; i++) {
                  const ch = text[i];
                  if (inString) {
                    if (escaped) {
                      escaped = false;
                    } else if (ch === '\\') {
                      escaped = true;
                    } else if (ch === '"') {
                      inString = false;
                    }
                    continue;
                  }
                  if (ch === '"') {
                    inString = true;
                    continue;
                  }
                  if (ch === '{') {
                    if (depth === 0) start = i;
                    depth++;
                  } else if (ch === '}') {
                    depth--;
                    if (depth === 0 && start !== -1) {
                      return text.slice(start, i + 1);
                    }
                  }
                }
                return null;
              };

              // Narrow down to content starting at first '{' to reduce noise
              const firstBrace = cleanContent.indexOf('{');
              if (firstBrace > 0) cleanContent = cleanContent.slice(firstBrace);

              let jsonStr = extractFirstJsonObject(cleanContent) ?? '';
              if (!jsonStr) {
                console.error('Could not find complete JSON object');
                console.error('Full content (first 1000):', fullContent.substring(0, 1000));
                throw new Error('AI did not return a valid JSON object');
              }

              // Attempt parse; if it fails, try a light sanitization (trailing commas)
              const tryParse = (s: string) => {
                try { return JSON.parse(s); } catch { return null; }
              };

              designSpec = tryParse(jsonStr);
              if (!designSpec) {
                const sanitized = jsonStr
                  // remove trailing commas in objects/arrays
                  .replace(/,\s*(\}|\])/g, '$1')
                  .trim();
                designSpec = tryParse(sanitized);
                if (!designSpec) {
                  console.error('Sanitized JSON still failed to parse');
                  console.error('JSON snippet (first 300):', jsonStr.substring(0, 300));
                  console.error('JSON snippet (last 300):', jsonStr.substring(Math.max(0, jsonStr.length - 300)));
                  throw new Error('Unable to parse JSON even after sanitization');
                }
              }

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
