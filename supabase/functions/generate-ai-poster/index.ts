import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to determine if a color is light or dark
function isLightColor(color: string): boolean {
  // Convert color to RGB
  let r = 0, g = 0, b = 0;
  
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  } else if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      r = parseInt(matches[0]);
      g = parseInt(matches[1]);
      b = parseInt(matches[2]);
    }
  }
  
  // Calculate relative luminance using standard formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5; // Light if luminance > 50%
}

// Minimal JSON schema for OpenAI JSON mode
const DESIGN_JSON_SCHEMA = {
  name: 'design_spec',
  schema: {
    type: 'object',
    properties: {
      frames: {
        type: 'array',
        description: 'Array of frame objects, each with name, dimensions, background, and elements',
        items: {
          type: 'object',
          properties: {
            name: { 
              type: 'string',
              description: 'Descriptive name for the frame (e.g., "Summer Camp Adventure", "Music Festival Poster")'
            },
            backgroundColor: { 
              type: 'string',
              description: 'CSS color value (e.g., "#1A1A2E", "rgb(26,26,46)")'
            },
            width: { 
              type: 'number',
              description: 'Frame width in pixels'
            },
            height: { 
              type: 'number',
              description: 'Frame height in pixels'
            },
            elements: {
              type: 'array',
              description: 'Array of design elements (text, shapes, images, icons)',
              items: {
                type: 'object',
                properties: {
                  type: { 
                    type: 'string',
                    description: 'Element type: "text", "shape", "image", or "icon"'
                  },
                  content: { type: 'string' },
                  x: { type: 'number' },
                  y: { type: 'number' },
                  width: { type: 'number' },
                  height: { type: 'number' },
                  color: { type: 'string' },
                  fontSize: { type: 'number' },
                  fontWeight: { type: 'string' },
                  fontFamily: { type: 'string' },
                  borderRadius: { type: 'string' },
                  shape: { type: 'string' },
                  iconName: { type: 'string' },
                  iconFamily: { type: 'string' },
                },
                required: ['type', 'x', 'y', 'width', 'height'],
                additionalProperties: true,
              },
            },
          },
          required: ['name', 'backgroundColor', 'width', 'height', 'elements'],
          additionalProperties: true,
        },
      },
      style: { type: 'string' },
      mood: { type: 'string' },
    },
    required: [ 'frames' ],
    additionalProperties: true,
  },
  strict: false,
};

// Model configuration for Lovable AI
const MODEL_CONFIGS: Record<string, any> = {
  'gemini-2.5-flash': {
    model: 'google/gemini-2.5-flash',
    maxTokens: 8192,
  },
  'gemini-2.5-pro': {
    model: 'google/gemini-2.5-pro',
    maxTokens: 8192,
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

// Enhanced design system prompt with professional design principles and intelligent image transformation
const DESIGN_SYSTEM_PROMPT = `You are an award-winning poster designer specialized in MODERN, PROFESSIONAL, EVENT-QUALITY designs. Your designs must match the quality of professional concert posters, festival flyers, and high-end event marketing materials.

🚨 MANDATORY JSON FORMAT:
You MUST return valid JSON in this EXACT structure:
{
  "frames": [
    {
      "name": "Frame Title Here",
      "backgroundColor": "#HEX_COLOR",
      "width": 800,
      "height": 1200,
      "elements": [
        {"type": "text", "content": "...", "x": 0, "y": 0, "width": 100, "height": 50, "fontSize": 48, "fontWeight": "700", "color": "#000000"},
        {"type": "shape", "x": 0, "y": 0, "width": 100, "height": 50, "color": "#000000", "shape": "rectangle", "borderRadius": "8px"}
      ]
    }
  ],
  "style": "Design style description",
  "mood": "Design mood description"
}

CRITICAL JSON RULES:
- ALWAYS wrap design in "frames" array (even for single frame)
- Each frame MUST have: "name" (string), "backgroundColor" (string), "width" (number), "height" (number), "elements" (array)
- Each element MUST have: "type", "x", "y", "width", "height" (all required)
- NEVER duplicate property names (e.g., don't have "height" twice in same object)
- Use proper JSON syntax: no trailing commas, proper quotes, valid structure
- For multiple frames/posters, add multiple objects to the "frames" array

🎯 INTELLIGENT IMAGE TRANSFORMATION MODE:
When the user provides BOTH an uploaded image AND a descriptive prompt (e.g., "pillow on a blue chair with Christmas text"):
- UNDERSTAND the user wants to TRANSFORM or ENHANCE the uploaded image based on the prompt
- The uploaded image is the BASE/SUBJECT (e.g., "pillow")
- The prompt describes MODIFICATIONS/CONTEXT to add (e.g., "on a blue chair with Christmas text")
- CREATE a complete, professional design that incorporates BOTH the uploaded image AND the requested modifications
- GENERATE realistic additional elements matching the prompt (e.g., add a blue chair behind/under the pillow, add Christmas-themed text and decorations)
- MAINTAIN the uploaded image as the primary subject/hero element
- ENSURE the modifications feel natural and professionally integrated

Examples:
- Input: Image of a pillow + Prompt "pillow on a blue chair with Christmas text"
  → Output: Design with the pillow image positioned on a generated blue chair element, with festive Christmas typography and decorative elements
  
- Input: Image of a product + Prompt "floating on clouds with rainbow text"
  → Output: Design with the product image on cloud shapes/elements, with colorful rainbow-style text

- Input: Image of a person + Prompt "at a concert stage with neon lights"
  → Output: Design with the person image integrated into a concert stage scene with neon lighting effects

🚨 CRITICAL RULES FOR PROFESSIONAL DESIGN:
- CREATE realistic, complete event information (dates, times, venues, contact details)
- USE sophisticated photo integration with proper text overlays
- APPLY professional typography hierarchies (5 levels: Display, Title, Subtitle, Body, Caption)
- DESIGN with real-world event context in mind
- ENSURE all text is readable with proper contrast and backgrounds
- INTELLIGENTLY combine uploaded images with prompt instructions for transformations

🎨 PHOTO INTEGRATION MASTERY:
When working with images, use these proven patterns:

**Full-Bleed Background:**
- Position image at (0, 0) with full canvas dimensions
- Add semi-transparent overlay shapes (rgba with 0.3-0.6 opacity) for text readability
- Place text in content panels with solid or gradient backgrounds
- Example: {"type": "shape", "x": 0, "y": 800, "width": 800, "height": 400, "color": "rgba(0,0,0,0.7)"}

**Hero Photo Layout:**
- Image in top 50-70% of canvas
- Text section in bottom with solid background color
- Optional: overlap some elements between sections
- Ensure photo complements the event theme

**Framed Photo:**
- Image with geometric border/frame
- Offset positioning for visual interest
- Decorative shapes around the frame
- Text positioned strategically around image

**Split Layout:**
- Photo left or right 40-50% of canvas
- Text in opposite section with contrasting background
- Some elements can bridge both sections

**CRITICAL:** Always ensure text has proper contrast - use solid shapes behind text, dark overlays on photos, or complementary colors.

✍️ ADVANCED TYPOGRAPHY SYSTEM (5 LEVELS):

**Level 1 - Display (Main Message):**
- Size: 96-160px
- Weight: 800-900
- Style: UPPERCASE, bold impact
- Usage: Event name, main title
- Example: "SUMMER MUSIC FESTIVAL"

**Level 2 - Title (Secondary Message):**
- Size: 64-96px  
- Weight: 700-800
- Style: Mixed case or uppercase
- Usage: Subheadings, artist names
- Example: "Featuring Top Artists"

**Level 3 - Subtitle (Supporting Text):**
- Size: 36-56px
- Weight: 600-700
- Style: Sentence case or title case
- Usage: Dates, taglines, descriptions

**Level 4 - Body (Details):**
- Size: 24-32px
- Weight: 400-500
- Style: Sentence case
- Usage: Venue, time, additional info

**Level 5 - Caption (Fine Print):**
- Size: 18-22px
- Weight: 400
- Style: Sentence case
- Usage: URLs, social handles, disclaimers

**Typography Effects:**
- Apply text shadows for photos: "0 2px 8px rgba(0,0,0,0.6)" or "0 4px 12px rgba(0,0,0,0.8)"
- Mix font styles: pair bold sans-serif with script/handwriting for contrast
- Use color contrast: white text on dark backgrounds, dark text on light backgrounds

📋 REALISTIC EVENT CONTENT GUIDELINES:

Every poster must include COMPLETE, REALISTIC information:

**Essential Elements:**
- Event title (compelling, specific, relevant)
- Date: "JUNE 24, 2025" or "FRIDAY, JUNE 24" or "24TH JUNE"
- Time: "8:30 PM - 10:30 PM" or "DOORS OPEN 7:00 PM" or "9:00 PM START"
- Location: Full venue name and address or city
- Performers/speakers: If music/conference event
- Call-to-action: "BOOK NOW" "GET TICKETS" "REGISTER TODAY" "RSVP"
- Contact: Website (www.example.com) or social handles (@username)

**Content Examples:**
- Music: "LIVE IN CONCERT • DJ STELLAR • JUNE 15 • THE METRO • 9PM"
- Festival: "SUMMER VIBES FEST • JUNE 24-26 • CENTRAL PARK • 3-DAY PASS"
- Conference: "TECH SUMMIT 2025 • MARCH 15 • CONVENTION CENTER • 8:30AM"
- Community: "VOLUNTEER DAY • APRIL 10 • COMMUNITY CENTER • 9:00 AM"

🎨 MODERN COLOR PALETTES:
${Object.entries(COLOR_PALETTES).map(([mood, colors]) => `- ${mood}: ${colors.join(', ')}`).join('\n')}

📐 PROVEN POSTER LAYOUT PATTERNS:

**Pattern A - Event with Photo Background:**
- Background: full-bleed photo (x: 0, y: 0, full canvas size)
- Overlay: semi-transparent dark shape for text area (rgba(0,0,0,0.5))
- Content: centered or bottom-aligned panel with title, details, CTA
- Accents: decorative shapes, borders, or icons at edges
- Text: large display title + date/time/venue + CTA button

**Pattern B - Concert/Performance:**
- Background: dark solid color or gradient
- Hero: large photo of performer/venue (top 50-70%)
- Title: massive overlaying text (80-120px)
- Details: badges/labels for names, dates, venue
- Footer: website and booking info
- Accents: geometric shapes, lines, or patterns

**Pattern C - Split Design:**
- Top section: photo (50-70% height)
- Bottom section: solid color background (30-50%)
- Overlap: some elements bridge both sections
- Content: organized in bottom section with clear hierarchy
- Text: readable on solid background

**Pattern D - Framed Focus:**
- Background: vibrant gradient or solid color
- Center: large rounded rectangle frame (32-48px radius)
- Photo: inside or outside the frame
- Content: key info inside or beside frame
- Decorations: patterns, dots, icons, shapes outside frame

**Pattern E - Urban/Bold:**
- Photo: dominant element (can be B&W or color)
- Color accents: bright yellow, neon pink, cyan in geometric shapes
- Typography: mixed (bold sans + script)
- Overlays: geometric shapes with transparency
- Badge elements: circular or rectangular highlights

💎 GRADIENT TECHNIQUES:

Simulate gradients using overlapping semi-transparent circles:

**Two-Color Gradient (Top to Bottom):**
- Circle 1: (x: 400, y: 0, size: 1000×1000) primary color with opacity
- Circle 2: (x: 400, y: 1200, size: 1000×1000) secondary color with opacity

**Three-Color Gradient (Corners):**
- Circle 1: top-left (x: 0, y: 0) 
- Circle 2: top-right (x: 800, y: 0)
- Circle 3: bottom-center (x: 400, y: 1200)
Use rgba() colors with 0.4-0.7 opacity

**Photo-Complementary Colors:**
- Dark photos → bright accent colors (yellow, cyan, magenta)
- Bright photos → dark text or overlay shapes with semi-transparency
- Create contrast: warm photos use cool accents, cool photos use warm accents

🎯 CREATIVE CONTAINER & OPACITY TECHNIQUES:

**ALWAYS use containers/shapes creatively for professional depth:**

**Full-Width Containers:**
- Create full-width bars/strips: {"type": "shape", "x": 0, "y": 900, "width": 800, "height": 300, "color": "rgba(0,0,0,0.7)", "shape": "rectangle"}
- Use for text sections, footers, headers, or accent bands
- Span entire canvas width (x: 0, width: canvasWidth)

**Full-Height Containers:**
- Vertical sidebars or panels: {"type": "shape", "x": 0, "y": 0, "width": 300, "height": 1200, "color": "rgba(255,255,255,0.15)", "shape": "rectangle"}
- Great for split layouts or accent strips

**Opacity Layering (MANDATORY for sophisticated designs):**
- Background shapes: 0.05-0.2 opacity (subtle texture)
- Mid-layer containers: 0.3-0.5 opacity (visible but not overpowering)
- Text backing panels: 0.6-0.85 opacity (readable text support)
- Accent overlays: 0.1-0.3 opacity (color tinting)

**Creative Container Examples:**
1. **Bottom Text Panel:** {"type": "shape", "x": 0, "y": 800, "width": 800, "height": 400, "color": "rgba(0,0,0,0.75)", "shape": "rectangle", "borderRadius": "0px"}
2. **Top Gradient Bar:** {"type": "shape", "x": 0, "y": 0, "width": 800, "height": 200, "color": "rgba(255,100,150,0.4)", "shape": "rectangle"}
3. **Corner Accent:** {"type": "shape", "x": 600, "y": 0, "width": 200, "height": 300, "color": "rgba(100,200,255,0.25)", "shape": "rectangle", "borderRadius": "0 0 0 48px"}
4. **Floating Card:** {"type": "shape", "x": 50, "y": 600, "width": 700, "height": 500, "color": "rgba(255,255,255,0.95)", "shape": "rectangle", "borderRadius": "24px"}
5. **Subtle Overlay:** {"type": "shape", "x": 0, "y": 0, "width": 800, "height": 1200, "color": "rgba(0,0,50,0.15)", "shape": "rectangle"}

**ALWAYS include at least 2-3 container shapes with varied opacity for visual depth!**

🎯 DESIGN CONSTRAINTS & VALIDATION:

**Mandatory Requirements:**
1. Minimum 4 elements total (including text, shapes, icons)
2. Maximum 15 elements (avoid clutter)
3. Text must have 4.5:1 contrast minimum (use overlays/backgrounds)
4. All coordinates within canvas bounds (0 to width/height)
5. Elements must not unintentionally overlap text
6. Include contact info (website, social handle, or venue)
7. Headlines must be >60px font size
8. Body text must be >24px for readability
9. Use realistic, complete event information
10. **Include at least 2 container shapes with opacity for layered depth**

**Visual Hierarchy:**
- Main title: 2-3x larger than body text
- Clear information flow: title → date/time → venue → CTA
- Proper spacing between elements (24-48px)
- Background elements behind text elements

🏆 PROFESSIONAL QUALITY CHECKLIST:
✓ Complete, realistic event information
✓ Professional photo integration with proper overlays
✓ 5-level typography hierarchy implemented
✓ Strong contrast for all text (use backgrounds/shadows)
✓ Cohesive color palette from curated options
✓ Clear visual hierarchy and focal point
✓ Generous spacing and clean layout
✓ Contact information visible
✓ Call-to-action prominent
✓ Professional polish and attention to detail
✓ **Multiple container shapes with varied opacity for depth**
✓ **Full-width or full-height elements for structure**

❌ NEVER DO:
- Generic "Lorem Ipsum" or placeholder text
- Incomplete event information
- Poor text contrast (unreadable text)
- Tiny body text (<20px)
- Cramped layouts with no breathing room
- Text directly on busy photos without overlay/background
- Missing critical info (date, time, location)
- Unprofessional or amateurish appearance
- **Flat designs without layered containers/shapes**
- **Ignoring opacity - always use semi-transparent elements for depth**`;

// Professional event poster examples based on high-quality designs
const DESIGN_EXAMPLES = `
🚨 CRITICAL JSON FORMAT REQUIREMENTS:
- ALWAYS wrap design in a "frames" array, even for single posters
- Each frame MUST have: "name", "backgroundColor", "width", "height", "elements"
- Each element MUST have: "type", "x", "y", "width", "height"
- NEVER use duplicate property names in a single object
- ALWAYS use valid JSON syntax (no trailing commas, proper quotes)

EXAMPLE 1 - Single Frame Music Festival:
{
  "frames": [{
    "name": "Summer Vibes Festival 2025",
    "backgroundColor": "#1A1A2E",
    "width": 800,
    "height": 1200,
    "elements": [
      {"type": "image", "content": "user-uploaded-image", "x": 0, "y": 0, "width": 800, "height": 1200},
      {"type": "shape", "x": 0, "y": 700, "width": 800, "height": 500, "color": "rgba(0,0,0,0.75)", "borderRadius": "0", "shape": "rectangle"},
      {"type": "text", "content": "SUMMER VIBES", "fontFamily": "Inter", "x": 60, "y": 780, "width": 680, "height": 100, "fontSize": 88, "fontWeight": "900", "color": "#FFFFFF"},
      {"type": "text", "content": "MUSIC FESTIVAL", "fontFamily": "Inter", "x": 60, "y": 880, "width": 680, "height": 60, "fontSize": 48, "fontWeight": "700", "color": "#FFD700"},
    {"type": "text", "content": "JUNE 24-26, 2025", "fontFamily": "Inter", "x": 60, "y": 960, "width": 680, "height": 40, "fontSize": 32, "fontWeight": "600", "color": "#FFFFFF"},
    {"type": "text", "content": "Central Park • Gates Open 3PM", "fontFamily": "Inter", "x": 60, "y": 1010, "width": 680, "height": 35, "fontSize": 26, "fontWeight": "500", "color": "#E0E0E0"},
    {"type": "text", "content": "www.summervibes.com", "fontFamily": "Inter", "x": 60, "y": 1110, "width": 300, "height": 28, "fontSize": 22, "fontWeight": "400", "color": "#FFD700"}
  ]
}
WHY IT WORKS: Full-bleed photo with dark overlay for text readability, clear typography hierarchy (5 levels), complete event details, strong contrast, professional polish.

EXAMPLE 2 - Concert Poster with Bold Typography:
{
  "title": "DJ Stellar Live in Concert",
  "backgroundColor": "#0A0A0A",
  "elements": [
    {"type": "image", "content": "user-uploaded-image", "x": 100, "y": 150, "width": 600, "height": 500},
    {"type": "shape", "x": 0, "y": 0, "width": 800, "height": 1200, "color": "rgba(138, 43, 226, 0.2)", "borderRadius": "0", "shape": "rectangle"},
    {"type": "text", "content": "LIVE", "fontFamily": "Bebas Neue", "x": 60, "y": 700, "width": 680, "height": 90, "fontSize": 96, "fontWeight": "900", "color": "#FF00FF"},
    {"type": "text", "content": "IN CONCERT", "fontFamily": "Bebas Neue", "x": 60, "y": 800, "width": 680, "height": 80, "fontSize": 72, "fontWeight": "800", "color": "#FFFFFF"},
    {"type": "shape", "x": 60, "y": 910, "width": 300, "height": 80, "color": "#FF00FF", "borderRadius": "16px", "shape": "rectangle"},
    {"type": "text", "content": "DJ STELLAR", "fontFamily": "Bebas Neue", "x": 85, "y": 930, "width": 250, "height": 40, "fontSize": 36, "fontWeight": "800", "color": "#000000"},
    {"type": "text", "content": "FRIDAY, MARCH 15 • 9:00 PM", "fontFamily": "Inter", "x": 60, "y": 1020, "width": 680, "height": 36, "fontSize": 28, "fontWeight": "600", "color": "#FFFFFF"},
    {"type": "text", "content": "The Metro Club • 123 Music Ave", "fontFamily": "Inter", "x": 60, "y": 1065, "width": 680, "height": 32, "fontSize": 24, "fontWeight": "500", "color": "#E0E0E0"},
    {"type": "text", "content": "TICKETS: www.metro-club.com", "fontFamily": "Inter", "x": 60, "y": 1120, "width": 680, "height": 28, "fontSize": 22, "fontWeight": "600", "color": "#FF00FF"}
  ]
}
WHY IT WORKS: Dark background makes neon accents pop, photo with purple overlay, massive typography creates impact, badge element for artist name, complete venue/time info.

EXAMPLE 3 - Party/Club Event with Dramatic Photo:
{
  "title": "Neon Nights Party",
  "backgroundColor": "#000000",
  "elements": [
    {"type": "image", "content": "user-uploaded-image", "x": 50, "y": 200, "width": 700, "height": 600},
    {"type": "shape", "x": 0, "y": 0, "width": 800, "height": 180, "color": "#FF0080", "borderRadius": "0", "shape": "rectangle"},
    {"type": "text", "content": "NEON NIGHTS", "x": 60, "y": 40, "width": 680, "height": 100, "fontSize": 84, "fontWeight": "900", "color": "#FFFFFF"},
    {"type": "shape", "x": 0, "y": 850, "width": 800, "height": 350, "color": "rgba(255, 0, 128, 0.95)", "borderRadius": "0", "shape": "rectangle"},
    {"type": "text", "content": "SATURDAY APRIL 20", "x": 60, "y": 890, "width": 680, "height": 60, "fontSize": 48, "fontWeight": "800", "color": "#FFFFFF"},
    {"type": "text", "content": "10 PM - 4 AM", "x": 60, "y": 965, "width": 680, "height": 45, "fontSize": 36, "fontWeight": "700", "color": "#000000"},
    {"type": "text", "content": "DOWNTOWN NIGHTCLUB", "x": 60, "y": 1025, "width": 680, "height": 38, "fontSize": 30, "fontWeight": "600", "color": "#FFFFFF"},
    {"type": "text", "content": "VIP TABLES: 555-0123", "x": 60, "y": 1090, "width": 680, "height": 32, "fontSize": 24, "fontWeight": "500", "color": "#FFFF00"},
    {"type": "icon", "iconName": "Star1", "iconFamily": "iconsax", "x": 650, "y": 880, "width": 80, "height": 80, "color": "#FFFF00"}
  ]
}
WHY IT WORKS: Dramatic color blocking (hot pink), photo as main focal point, clear time/date/venue hierarchy, high energy neon accent color, professional event details.

EXAMPLE 4 - Summer Event with Gradient & Patterns:
{
  "title": "Summer Bright Festival",
  "backgroundColor": "#FF6B9D",
  "elements": [
    {"type": "shape", "x": 400, "y": -200, "width": 800, "height": 800, "color": "rgba(254, 200, 89, 0.6)", "borderRadius": "50%", "shape": "circle"},
    {"type": "shape", "x": -100, "y": 800, "width": 700, "height": 700, "color": "rgba(0, 223, 162, 0.5)", "borderRadius": "50%", "shape": "circle"},
    {"type": "shape", "x": 100, "y": 350, "width": 600, "height": 500, "color": "rgba(255, 255, 255, 0.95)", "borderRadius": "32px", "shape": "rectangle"},
    {"type": "text", "content": "SUMMER", "x": 150, "y": 420, "width": 500, "height": 90, "fontSize": 88, "fontWeight": "900", "color": "#FF6B9D"},
    {"type": "text", "content": "BRIGHT", "x": 150, "y": 520, "width": 500, "height": 80, "fontSize": 80, "fontWeight": "900", "color": "#FEC859"},
    {"type": "text", "content": "MUSIC & ARTS", "x": 150, "y": 620, "width": 500, "height": 44, "fontSize": 36, "fontWeight": "700", "color": "#00DFA2"},
    {"type": "text", "content": "JULY 15, 2025", "x": 150, "y": 680, "width": 500, "height": 36, "fontSize": 28, "fontWeight": "600", "color": "#333333"},
    {"type": "text", "content": "Riverside Park • 12 PM - 8 PM", "x": 150, "y": 725, "width": 500, "height": 30, "fontSize": 24, "fontWeight": "500", "color": "#666666"},
    {"type": "text", "content": "@summerbright", "x": 150, "y": 780, "width": 200, "height": 26, "fontSize": 20, "fontWeight": "500", "color": "#FF6B9D"},
    {"type": "icon", "iconName": "Sun1", "iconFamily": "iconsax", "x": 580, "y": 760, "width": 60, "height": 60, "color": "#FEC859"}
  ]
}
WHY IT WORKS: Vibrant gradient (overlapping circles), framed content area with white background for readability, colorful typography, complete event info, social handle included.

EXAMPLE 5 - Urban/Modern Event with Photo Overlay:
{
  "title": "Urban Beats Music Event",
  "backgroundColor": "#1A1A2E",
  "elements": [
    {"type": "image", "content": "user-uploaded-image", "x": 0, "y": 0, "width": 800, "height": 800},
    {"type": "shape", "x": 520, "y": 150, "width": 240, "height": 240, "color": "#FFFF00", "borderRadius": "24px", "shape": "rectangle"},
    {"type": "text", "content": "URBAN", "x": 60, "y": 850, "width": 680, "height": 90, "fontSize": 96, "fontWeight": "900", "color": "#FFFFFF", "textShadow": "0 4px 12px rgba(0,0,0,0.8)"},
    {"type": "text", "content": "BEATS", "x": 60, "y": 950, "width": 680, "height": 80, "fontSize": 84, "fontWeight": "900", "color": "#FFFF00", "textShadow": "0 4px 12px rgba(0,0,0,0.8)"},
    {"type": "text", "content": "LIVE MUSIC SERIES", "x": 60, "y": 1050, "width": 680, "height": 42, "fontSize": 32, "fontWeight": "700", "color": "#FFFFFF"},
    {"type": "text", "content": "Every Friday in May • 8 PM", "x": 60, "y": 1105, "width": 680, "height": 34, "fontSize": 26, "fontWeight": "600", "color": "#E0E0E0"},
    {"type": "text", "content": "City Center Plaza", "x": 60, "y": 1148, "width": 300, "height": 28, "fontSize": 22, "fontWeight": "500", "color": "#CCCCCC"}
  ]
}
WHY IT WORKS: Photo as dominant element, bold yellow geometric accent over photo, massive overlaying typography with text shadows for readability, clear event series info.

EXAMPLE 6 - Community/Volunteer Event:
{
  "title": "Community Volunteer Day",
  "backgroundColor": "#FFFFFF",
  "elements": [
    {"type": "image", "content": "user-uploaded-image", "x": 0, "y": 0, "width": 800, "height": 500},
    {"type": "shape", "x": 0, "y": 500, "width": 800, "height": 700, "color": "#0079FF", "borderRadius": "0", "shape": "rectangle"},
    {"type": "text", "content": "MAKE A", "x": 60, "y": 560, "width": 680, "height": 70, "fontSize": 64, "fontWeight": "700", "color": "#FFFFFF"},
    {"type": "text", "content": "DIFFERENCE", "x": 60, "y": 640, "width": 680, "height": 100, "fontSize": 96, "fontWeight": "900", "color": "#FFFFFF"},
    {"type": "text", "content": "Community Volunteer Day", "x": 60, "y": 770, "width": 680, "height": 48, "fontSize": 38, "fontWeight": "600", "color": "#FFD700"},
    {"type": "shape", "x": 60, "y": 850, "width": 8, "height": 120, "color": "#FFD700", "borderRadius": "0", "shape": "rectangle"},
    {"type": "text", "content": "Saturday, April 10, 2025", "x": 90, "y": 860, "width": 650, "height": 36, "fontSize": 28, "fontWeight": "600", "color": "#FFFFFF"},
    {"type": "text", "content": "9:00 AM - 3:00 PM", "x": 90, "y": 905, "width": 650, "height": 32, "fontSize": 24, "fontWeight": "500", "color": "#E0E0E0"},
    {"type": "text", "content": "Community Center • 456 Oak Street", "x": 90, "y": 945, "width": 650, "height": 28, "fontSize": 22, "fontWeight": "500", "color": "#CCCCCC"},
    {"type": "text", "content": "REGISTER: www.communityhelps.org", "x": 60, "y": 1050, "width": 680, "height": 32, "fontSize": 24, "fontWeight": "700", "color": "#FFD700"},
    {"type": "icon", "iconName": "Heart", "iconFamily": "iconsax", "x": 650, "y": 1100, "width": 70, "height": 70, "color": "#FFD700"}
  ]
}
WHY IT WORKS: Split layout (photo top, solid color bottom), clean typography hierarchy, accent line for visual organization, complete registration info, appropriate icon.

EXAMPLE 7 - Professional Conference:
{
  "title": "Tech Summit 2025",
  "backgroundColor": "#37306B",
  "elements": [
    {"type": "shape", "x": 600, "y": -100, "width": 600, "height": 600, "color": "rgba(247, 147, 30, 0.3)", "borderRadius": "50%", "shape": "circle"},
    {"type": "shape", "x": -100, "y": 900, "width": 500, "height": 500, "color": "rgba(255, 107, 53, 0.3)", "borderRadius": "50%", "shape": "circle"},
    {"type": "text", "content": "TECH SUMMIT", "x": 60, "y": 180, "width": 680, "height": 100, "fontSize": 92, "fontWeight": "900", "color": "#FFFFFF"},
    {"type": "text", "content": "2025", "x": 60, "y": 290, "width": 680, "height": 80, "fontSize": 88, "fontWeight": "900", "color": "#F7931E"},
    {"type": "shape", "x": 60, "y": 420, "width": 680, "height": 280, "color": "rgba(255, 255, 255, 0.1)", "borderRadius": "24px", "shape": "rectangle"},
    {"type": "text", "content": "Innovation • Technology • Future", "x": 90, "y": 460, "width": 620, "height": 40, "fontSize": 30, "fontWeight": "600", "color": "#FFFFFF"},
    {"type": "text", "content": "MARCH 15-17, 2025", "x": 90, "y": 520, "width": 620, "height": 50, "fontSize": 38, "fontWeight": "700", "color": "#F7931E"},
    {"type": "text", "content": "Convention Center", "x": 90, "y": 585, "width": 620, "height": 36, "fontSize": 28, "fontWeight": "600", "color": "#FFFFFF"},
    {"type": "text", "content": "8:30 AM - 6:00 PM Daily", "x": 90, "y": 630, "width": 620, "height": 32, "fontSize": 24, "fontWeight": "500", "color": "#E0E0E0"},
    {"type": "text", "content": "REGISTER NOW", "x": 60, "y": 800, "width": 300, "height": 60, "fontSize": 32, "fontWeight": "800", "color": "#FFD700"},
    {"type": "text", "content": "www.techsummit2025.com", "x": 60, "y": 880, "width": 680, "height": 32, "fontSize": 24, "fontWeight": "600", "color": "#FFFFFF"},
    {"type": "icon", "iconName": "Rocket", "iconFamily": "iconsax", "x": 60, "y": 1050, "width": 90, "height": 90, "color": "#F7931E"}
  ]
}
WHY IT WORKS: Professional gradient (overlapping circles), framed info section, clear conference details, strong call-to-action, appropriate tech icon.

EXAMPLE 8 - Product Launch with Bold Design:
{
  "title": "Product Launch 2025",
  "backgroundColor": "#8B5CF6",
  "elements": [
    {"type": "shape", "x": -150, "y": 850, "width": 600, "height": 600, "color": "rgba(236, 72, 153, 0.5)", "borderRadius": "50%", "shape": "circle"},
    {"type": "shape", "x": 550, "y": -100, "width": 550, "height": 550, "color": "rgba(245, 158, 11, 0.4)", "borderRadius": "50%", "shape": "circle"},
    {"type": "shape", "x": 80, "y": 300, "width": 640, "height": 400, "color": "#00F5FF", "borderRadius": "40px", "shape": "rectangle"},
    {"type": "text", "content": "NEW", "x": 120, "y": 180, "width": 560, "height": 70, "fontSize": 64, "fontWeight": "700", "color": "#FFFFFF"},
    {"type": "text", "content": "PRODUCT", "x": 120, "y": 250, "width": 560, "height": 60, "fontSize": 56, "fontWeight": "800", "color": "#FFD700"},
    {"type": "text", "content": "2025", "x": 180, "y": 410, "width": 440, "height": 160, "fontSize": 144, "fontWeight": "900", "color": "#8B5CF6"},
    {"type": "text", "content": "LAUNCH EVENT", "x": 80, "y": 750, "width": 640, "height": 60, "fontSize": 52, "fontWeight": "800", "color": "#FFFFFF"},
    {"type": "text", "content": "May 1, 2025 • 10:00 AM", "x": 80, "y": 840, "width": 640, "height": 40, "fontSize": 32, "fontWeight": "600", "color": "#FFFFFF"},
    {"type": "text", "content": "Innovation Hub • Downtown", "x": 80, "y": 895, "width": 640, "height": 34, "fontSize": 26, "fontWeight": "500", "color": "#E0E0E0"},
    {"type": "text", "content": "RSVP: launch@company.com", "x": 80, "y": 980, "width": 640, "height": 30, "fontSize": 24, "fontWeight": "600", "color": "#00F5FF"},
    {"type": "icon", "iconName": "TrendUp", "iconFamily": "iconsax", "x": 650, "y": 1080, "width": 80, "height": 80, "color": "#FFD700"}
  ]
}
WHY IT WORKS: Rich gradient background (overlapping circles), large cyan focal shape with contrasting year, bold typography hierarchy, complete launch event details.`;

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
      brandKitData, // Brand kit with colors, fonts, logos
      generationTypes = [], // Array of generation types (e.g., ["generate-image", "create", "search-unsplash"])
      conversationHistory = [], // Chat conversation history
      currentSnapshot = null, // Current canvas state
      targetFrameId = null, // Specific frame to generate in
      frameCount = 1 // Number of frames to generate (default: 1)
    } = await req.json();
    
    console.log('AI Poster Generation - Model:', model, 'Type:', analysisType, 'Generation types:', generationTypes);
    console.log('Canvas dimensions:', canvasWidth, 'x', canvasHeight);
    console.log('Target frame:', targetFrameId);
    console.log('Frame count:', frameCount);
    console.log('Brand kit data:', brandKitData ? 'provided' : 'none');
    
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

    // Step 1: Search Unsplash if "search-unsplash" type is selected
    let generatedImageBase64: string | null = null;
    let unsplashAttribution: any = null;
    
    console.log('Generation types check:', generationTypes, 'Prompt:', prompt ? 'exists' : 'missing');
    
    if (generationTypes.includes('search-unsplash')) {
      console.log('🔍 Starting Unsplash search...');
      
      if (!prompt || !prompt.trim()) {
        console.error('Cannot search Unsplash: prompt is empty');
        throw new Error('A description is required to search Unsplash for images');
      }
      
      try {
        const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY');
        if (!UNSPLASH_ACCESS_KEY) {
          const error = 'UNSPLASH_ACCESS_KEY is not configured in environment';
          console.error(error);
          throw new Error(error);
        }
        
        console.log('Unsplash API key found, extracting keywords from prompt...');
          // Extract keywords from prompt using AI
          const keywordExtractionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: "Extract 2-4 keywords for an Unsplash image search from the user's poster prompt. Return only the search query, nothing else. Focus on the main subject or theme."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
            }),
          });

          if (keywordExtractionResponse.ok) {
            const keywordData = await keywordExtractionResponse.json();
            const searchQuery = keywordData.choices[0]?.message?.content?.trim();
            if (!searchQuery) {
              throw new Error('Failed to extract search keywords from prompt');
            }
            console.log('✅ Extracted search query:', searchQuery);

            // Search Unsplash
            const unsplashResponse = await fetch(
              `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&page=1&per_page=5&orientation=landscape`,
              {
                headers: {
                  'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                },
              }
            );

            if (unsplashResponse.ok) {
              const unsplashData = await unsplashResponse.json();
              console.log('Unsplash API response:', unsplashData.results?.length || 0, 'results found');
              
              if (unsplashData.results && unsplashData.results.length > 0) {
                // Get the first (most relevant) image
                const selectedImage = unsplashData.results[0];
                console.log('✅ Selected Unsplash image:', selectedImage.id, 'by', selectedImage.user.name);

                // Store attribution info
                unsplashAttribution = {
                  photographer: selectedImage.user.name,
                  photographerUrl: selectedImage.user.links.html,
                  unsplashUrl: selectedImage.links.html
                };

                // Download the image and upload to storage (and immediately stream to client)
                const imageUrl = selectedImage.urls.regular;
                const imageResponse = await fetch(imageUrl);
                if (imageResponse.ok) {
                  const imageBlob = await imageResponse.blob();
                  
                  // Upload to media library if user is authenticated
                  const authHeader = req.headers.get('Authorization');
                  if (authHeader) {
                    try {
                      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.7.1');
                      const supabaseClient = createClient(
                        Deno.env.get('SUPABASE_URL') ?? '',
                        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
                        { global: { headers: { Authorization: authHeader } } }
                      );

                      let userId: string | null = null;
                      try {
                        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
                        if (!userError && user) {
                          userId = user.id;
                        }
                      } catch (e) {
                        console.error('auth.getUser() failed:', e);
                      }

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
                        const fileName = `unsplash-${Date.now()}.jpg`;
                        const path = `${userId}/${fileName}`;

                        const { error: uploadError } = await supabaseClient.storage
                          .from('media')
                          .upload(path, imageBlob, { contentType: 'image/jpeg', upsert: true });

                        if (uploadError) {
                          console.error('Error uploading Unsplash image to storage:', uploadError);
                        } else {
                          const { data: pub } = supabaseClient.storage.from('media').getPublicUrl(path);
                          const publicUrl = pub?.publicUrl ?? '';

                          const { error: insertError } = await supabaseClient.from('media_library').insert({
                            user_id: userId,
                            file_name: fileName,
                            file_url: publicUrl || path,
                            file_type: 'image/jpeg',
                            file_size: imageBlob.size ?? null,
                            source: 'unsplash',
                            metadata: { 
                              prompt, 
                              unsplash: {
                                photographer: selectedImage.user.name,
                                photographer_url: selectedImage.user.links.html,
                                photo_url: selectedImage.links.html
                              }
                            }
                          });

                          if (!insertError) {
                            console.log('✅ Uploaded Unsplash image to media library');
                            generatedImageBase64 = publicUrl;
                  console.log('✅ Using public URL for Unsplash image:', publicUrl);
                  
                  // Immediately stream the image URL to client so it can be set on the frame
                  // This ensures the image appears even if JSON parsing fails later
                  try {
                    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                      method: "POST",
                      headers: {
                        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        model: "google/gemini-2.5-flash",
                        messages: [{ role: "user", content: "Reply with exactly: IMAGE_READY" }],
                      }),
                    });
                    // Signal to start streaming immediately - client will apply image
                  } catch (e) {
                    console.log('Non-critical: Could not send image ready signal:', e);
                  }
                } else {
                            console.error('Error saving Unsplash image to media library:', insertError);
                            // Fallback to converting to base64
                            const imageBuffer = await imageBlob.arrayBuffer();
                            const base64Image = btoa(
                              new Uint8Array(imageBuffer).reduce(
                                (data, byte) => data + String.fromCharCode(byte),
                                ''
                              )
                            );
                            generatedImageBase64 = `data:image/jpeg;base64,${base64Image}`;
                          }
                        }
                      } else {
                        // No user, fallback to base64
                        const imageBuffer = await imageBlob.arrayBuffer();
                        const base64Image = btoa(
                          new Uint8Array(imageBuffer).reduce(
                            (data, byte) => data + String.fromCharCode(byte),
                            ''
                          )
                        );
                        generatedImageBase64 = `data:image/jpeg;base64,${base64Image}`;
                      }
                    } catch (error) {
                      console.error('Exception uploading Unsplash image:', error);
                      // Fallback to base64
                      const imageBuffer = await imageBlob.arrayBuffer();
                      const base64Image = btoa(
                        new Uint8Array(imageBuffer).reduce(
                          (data, byte) => data + String.fromCharCode(byte),
                          ''
                        )
                      );
                      generatedImageBase64 = `data:image/jpeg;base64,${base64Image}`;
                    }
                  } else {
                    // No auth header, use base64
                    const imageBuffer = await imageBlob.arrayBuffer();
                    const base64Image = btoa(
                      new Uint8Array(imageBuffer).reduce(
                        (data, byte) => data + String.fromCharCode(byte),
                        ''
                      )
                    );
                    generatedImageBase64 = `data:image/jpeg;base64,${base64Image}`;
                  }

                  // Trigger download for attribution (as per Unsplash API guidelines)
                  if (selectedImage.links.download_location) {
                    fetch(selectedImage.links.download_location, {
                      headers: {
                        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                      },
                    }).catch(err => console.error('Failed to trigger download:', err));
                  }
                } else {
                  console.error('❌ Failed to fetch Unsplash image from URL:', imageUrl);
                }
              } else {
                console.log('⚠️ No images found on Unsplash for query:', searchQuery);
              }
            } else {
              const errorText = await unsplashResponse.text();
              console.error('❌ Unsplash API error:', unsplashResponse.status, errorText);
              throw new Error(`Unsplash search failed: ${unsplashResponse.status}`);
            }
          } else {
            const errorText = await keywordExtractionResponse.text();
            console.error('❌ Keyword extraction failed:', keywordExtractionResponse.status, errorText);
            
            // Handle payment required error specifically
            if (keywordExtractionResponse.status === 402) {
              throw new Error('Credits exhausted. Please add credits to your Lovable workspace in Settings → Usage.');
            }
            
            throw new Error('Failed to extract keywords for Unsplash search');
          }
      } catch (error) {
        console.error('❌ Error in Unsplash search:', error);
        throw error; // Re-throw to let the outer handler deal with it
      }
    }
    
    // Step 2: Generate image with AI if "generate-image" type is selected and we don't have an image yet
    if (generationTypes.includes('generate-image') && prompt && !generatedImageBase64) {
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
              content: `CRITICAL: Generate ONLY a plain background image or photo - NO TEXT, NO LOGOS, NO GRAPHICS, NO WORDS of any kind.

Theme: ${prompt}

Requirements:
- Pure background image ONLY (photo, gradient, texture, scene, etc.)
- ABSOLUTELY NO text, titles, dates, event names, or any words
- NO logos, badges, or branding elements
- NO graphic overlays or design elements
- Think of this as a blank canvas background that will have text added on top later
- Focus on creating an atmospheric, visually appealing background scene
- Aspect ratio: ${canvasWidth}x${canvasHeight} (${(canvasWidth/canvasHeight).toFixed(2)}:1)

Examples of what to generate:
- Beach sunset scene (just the scenery)
- Abstract gradient background
- City skyline silhouette
- Nature landscape
- Textured background
- Color wash or bokeh effect

DO NOT generate: posters, flyers, event graphics, or anything with text/words.`
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

            let userId: string | null = null;
            try {
              const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
              if (!userError && user) {
                userId = user.id;
              } else if (userError) {
                console.error('Error getting user:', userError);
              }
            } catch (e) {
              console.error('auth.getUser() failed, attempting JWT decode fallback:', e);
            }

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
              const fileName = `ai-generated-poster-${Date.now()}.png`;

              // Convert base64 data URL to Blob
              let contentType = 'image/png';
              let blob: Blob;
              if (generatedImage.startsWith('data:')) {
                const [header, base64Data] = generatedImage.split(',');
                const mimeMatch = header.match(/data:(.*?);base64/);
                if (mimeMatch) contentType = mimeMatch[1];
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                blob = new Blob([bytes], { type: contentType });
              } else {
                const fetched = await fetch(generatedImage);
                blob = await fetched.blob();
                contentType = blob.type || contentType;
              }

              const extension = (contentType.split('/')[1] || 'png').split(';')[0];
              const finalFileName = fileName.replace('.png', `.${extension}`);
              const path = `${userId}/${finalFileName}`;

              const { error: uploadError } = await supabaseClient.storage
                .from('media')
                .upload(path, blob, { contentType, upsert: true });

              if (uploadError) {
                console.error('Error uploading generated image to storage:', uploadError);
              } else {
                const { data: pub } = supabaseClient.storage.from('media').getPublicUrl(path);
                const publicUrl = pub?.publicUrl ?? '';

                const { error: insertError } = await supabaseClient.from('media_library').insert({
                  user_id: userId,
                  file_name: finalFileName,
                  file_url: publicUrl || path,
                  file_type: contentType,
                  file_size: blob.size ?? null,
                  source: 'ai-generated',
                  metadata: { prompt, context: 'poster-generation' }
                });
                
                if (!insertError) {
                  console.log('✅ Uploaded and saved generated poster image to media library');
                  // Replace base64 with public URL for the design
                  generatedImageBase64 = publicUrl;
                  console.log('✅ Using public URL for image in design:', publicUrl);
                } else {
                  console.error('Error saving to media library:', insertError);
                }
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

    // Apply brand kit guidance if provided
    let brandKitGuidance = '';
    if (brandKitData) {
      const { colors = [], fonts = [], logos = [] } = brandKitData;
      
      if (colors.length > 0 || fonts.length > 0) {
        brandKitGuidance += `\n\n🎨 BRAND KIT GUIDELINES (for creative consistency):`;
      }
      
      if (colors.length > 0) {
        brandKitGuidance += `\n\n🎨 BRAND COLORS: ${colors.join(', ')}
- Primarily use these brand colors as your main palette
- You can use variations, tints, shades, or transparency (rgba) of these colors
- You can add complementary colors for accents if it enhances the design
- Be creative while keeping the brand colors as the primary focus`;
      }
      
      if (fonts.length > 0) {
        brandKitGuidance += `\n\n✍️ BRAND FONTS: ${fonts.join(', ')}
- Use these fonts as your primary typefaces for text elements
- You can mix and match these fonts for hierarchy (e.g., one for headings, another for body)
- Feel free to use font weights creatively within these families
- EXAMPLE: {"type": "text", "content": "Title", "fontFamily": "${fonts[0]}", "fontSize": 48, "fontWeight": "800", "color": "${colors[0] || '#000000'}"}`;
      }
      
      if (logos.length > 0) {
        brandKitGuidance += `\n\n🖼️ BRAND LOGOS: ${logos.length} logo(s) available to incorporate strategically in the design.`;
      }
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
7. Match icons using iconsax icon names (PascalCase like Heart, Star, Sun, Music)

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

🎯 MULTI-FRAME GENERATION:
${frameCount > 1 ? `- CREATE EXACTLY ${frameCount} DISTINCT FRAMES in the "frames" array` : '- Create 1 frame (single poster)'}
${frameCount > 1 ? `- Each frame MUST have unique content and layout variations` : ''}
${frameCount > 1 ? `- All ${frameCount} frames should follow a cohesive theme but with visual variety` : ''}

CANVAS: ${canvasWidth}px × ${canvasHeight}px (${(canvasWidth/canvasHeight).toFixed(2)}:1 aspect ratio)
${styleGuidance}${brandKitGuidance}

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

Return complete JSON (single frame - default):
{
  "frames": [{
    "name": "Poster with Image",
    "backgroundColor": "#hex",
    "width": 800,
    "height": 1200,
    "elements": [
      {"type": "image", "content": "user-uploaded-image", "x": 0, "y": 0, "width": 800, "height": 720},
      {"type": "text", "content": "BOLD TITLE", "x": 64, "y": 780, "width": 672, "height": 100, "color": "#FFFFFF", "fontSize": 96, "fontWeight": "900"},
      {"type": "shape", ...},
      {"type": "icon", ...}
    ]
  }],
  "style": "Modern with striking visuals",
  "mood": "Bold and engaging"
}`;
    } else {
      userPrompt = `${DESIGN_SYSTEM_PROMPT}

${DESIGN_EXAMPLES}

TASK: Create a stunning, professional poster design that stands out.
USER REQUEST: "${prompt}"

🎯 MULTI-FRAME GENERATION:
${frameCount > 1 ? `- CREATE EXACTLY ${frameCount} DISTINCT FRAMES in the "frames" array` : '- Create 1 frame (single poster)'}
${frameCount > 1 ? `- Each frame MUST have unique content and layout variations` : ''}
${frameCount > 1 ? `- All ${frameCount} frames should follow a cohesive theme but with visual variety` : ''}

CANVAS: ${canvasWidth}px × ${canvasHeight}px (${(canvasWidth/canvasHeight).toFixed(2)}:1 aspect ratio)
${styleGuidance}${brandKitGuidance}

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
3. Use 8pt grid spacing (all x, y, width, height should align to 8 or 16 pixel increments when possible)
4. Add 2-4 strategic shapes for visual interest (circles, rectangles with borderRadius)
5. Include 1-3 relevant icons from iconsax library (ALWAYS use iconFamily: "iconsax")
6. Follow rule of thirds for element placement when appropriate (33%, 66% positions)
7. 🚨 CRITICAL COLOR CONTRAST: NEVER use white text (#FFFFFF, #FFF, rgb(255,255,255)) on white backgrounds OR black text (#000000, #000, rgb(0,0,0)) on black backgrounds. Text must be clearly visible!
8. Use generous whitespace - don't crowd elements
9. 🚨 ALWAYS INCLUDE TEXT ELEMENTS: Every design must have at least 2-3 text elements (title, subtitle, or body text)
10. BE CREATIVE: Don't be afraid to experiment with layouts, overlapping elements, and bold compositions

🚨 COLOR CONTRAST RULES (STRICTLY ENFORCE):
- If background is light (white, cream, light gray), text MUST be dark (#000000, #1A1A1A, dark colors)
- If background is dark (black, navy, dark gray), text MUST be light (#FFFFFF, bright colors)
- For colored backgrounds, choose contrasting text colors from the palette
- When in doubt: Dark text on light backgrounds, Light text on dark backgrounds

POPULAR ICONSAX ICONS (use these with iconFamily: "iconsax"): Star1, Heart, Sun1, Moon, Music, Gift, Calendar, Camera, Award, Crown, Flash, Magicpen, Lamp, Location, Call, Message, Send2, Video, Microphone2, Play, Timer1, Clock, Ticket, Map, Bookmark, Category, Diagram, Graph, Cup, Medal, Like1, Lovely, TickCircle, ArrowRight2, ArrowUp2, Add, Minus, CloseCircle, SearchNormal1, Setting2, User, Profile2User, ShoppingCart, Bag2, Receipt21, Wallet2, MoneyRecive, CardPos, Chart, DocumentText, Gallery, VideoCircle, Brush2, ColorSwatch

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
    {"type": "text|shape|icon", "content": "text or desc", "x": 0, "y": 0, "width": 0, "height": 0, "color": "#hex", "fontSize": 0, "fontWeight": "normal|bold", "borderRadius": "0|16px|50%", "shape": "rectangle|circle", "iconName": "Heart", "iconFamily": "iconsax"}
  ],
  "style": "Modern minimal with energetic palette",
  "mood": "Exciting and professional"
}`;
    }

    // Make API call to Lovable AI Gateway
    const isIterative = conversationHistory && conversationHistory.length > 1;
    const hasExistingDesign = currentSnapshot && currentSnapshot.frames && currentSnapshot.frames.length > 0;
    
    // Find the target frame if specified
    let targetFrame = null;
    if (hasExistingDesign && targetFrameId) {
      targetFrame = currentSnapshot.frames.find((f: any) => f.id === targetFrameId);
      console.log('Target frame found:', targetFrame?.name || targetFrame?.id);
    }
    
    const messages: any[] = [
      { 
        role: 'system', 
        content: DESIGN_SYSTEM_PROMPT + `

${isIterative ? `
🔄 ITERATIVE MODE: You are continuing a conversation and building upon an existing design.

CRITICAL RULES FOR ITERATIVE UPDATES:
1. The user is asking you to MODIFY or ADD to the existing design, NOT replace it entirely
2. You MUST preserve existing elements that the user doesn't ask to change
3. If the user says "add X", ADD the new elements to the existing ones
4. If the user says "change Y", ONLY modify Y and keep everything else
5. If the user says "make it Z", interpret what they want changed and keep the rest
6. NEVER remove all elements and start fresh unless explicitly asked to "start over" or "create new"

${targetFrame ? `
🎯 TARGET FRAME: "${targetFrame.name || targetFrame.id}"
You are working ONLY on this specific frame. The user has multiple frames and wants to modify only this one.

CURRENT FRAME STATE:
${JSON.stringify(targetFrame, null, 2)}
` : hasExistingDesign ? `
CURRENT DESIGN STATE:
${JSON.stringify(currentSnapshot.frames[0], null, 2)}
` : ''}

When responding:
- Include ALL existing elements in your response
- Add or modify only what the user requests
- Maintain the same canvas dimensions and backgroundColor unless asked to change
- Keep element IDs when possible for continuity

CONVERSATION CONTEXT:
${conversationHistory.slice(0, -1).map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}
` : ''}

🚨 CRITICAL JSON FORMAT REQUIREMENTS - FOLLOW EXACTLY:
1. Your response MUST start with { (opening brace) as the VERY FIRST CHARACTER
2. Your response MUST end with } (closing brace) as the VERY LAST CHARACTER
3. Return ONLY the JSON object - absolutely NO text before or after
4. NO markdown code blocks (no \`\`\`json or \`\`\`)
5. NO explanatory text, comments, or notes
6. ALL property names in double quotes ("title", "elements", etc.)
7. ALL string values in double quotes
8. NO trailing commas anywhere in the JSON
9. Ensure all brackets [ ] and braces { } are perfectly balanced
10. The response must be directly parseable by JSON.parse() with ZERO preprocessing
11. 🚨 ALWAYS INCLUDE TEXT ELEMENTS: The "elements" array MUST contain at least 2-3 text elements with content
12. Keep the JSON concise - aim for 2000-4000 characters total to avoid truncation

Example of CORRECT format (single frame):
{"frames":[{"name":"Example Poster","backgroundColor":"#FFFFFF","width":800,"height":1200,"elements":[{"type":"text","content":"Title","x":50,"y":50,"width":300,"height":80,"fontSize":48,"fontWeight":"bold","color":"#000000"}]}],"style":"Modern","mood":"Professional"}

Example of CORRECT format (multiple frames):
{"frames":[{"name":"Slide 1","backgroundColor":"#FFFFFF","width":800,"height":1200,"elements":[{"type":"text","content":"Hello","x":50,"y":50,"width":300,"height":80,"fontSize":48,"fontWeight":"bold","color":"#000000"}]},{"name":"Slide 2","backgroundColor":"#000000","width":800,"height":1200,"elements":[{"type":"text","content":"World","x":50,"y":50,"width":300,"height":80,"fontSize":48,"fontWeight":"bold","color":"#FFFFFF"}]}],"style":"Modern","mood":"Professional"}

Example of WRONG format (DO NOT DO THIS):
\`\`\`json
{"title":"Example"}
\`\`\`
or
Here's the design: {"title":"Example"}
`
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
        response_format: { type: "json_object" } // Force JSON mode
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
            // Send image URL immediately if available
            if (generatedImageBase64) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
                type: 'image_ready', 
                imageUrl: generatedImageBase64,
                targetFrameId
              })}\n\n`));
              console.log('📸 Streamed image_ready event with URL');
            }
            
            let frameCount = 0;
            let elementCount = 0;
            let sentElementCount = 0;
            let lastProgressSent = '';
            let progressMessage = '';
            let hasContent = false;
            const sentFrameHashes = new Set<string>(); // Track sent frames
            const sentElementHashes = new Set<string>(); // Track sent elements to prevent duplicates
            
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
                    
                    // Try to extract and stream complete frames progressively
                    const frameRegex = /\{\s*"name"\s*:\s*"[^"]+"\s*,\s*"backgroundColor"\s*:\s*"[^"]+"\s*,\s*"width"\s*:\s*\d+\s*,\s*"height"\s*:\s*\d+\s*,\s*"elements"\s*:\s*\[[^\]]*\]\s*\}/g;
                    const frameMatches = [...fullContent.matchAll(frameRegex)];
                    
                    // Send any new complete frames (with deduplication)
                    for (const match of frameMatches) {
                      try {
                        const frameJson = match[0];
                        const frameHash = frameJson.trim();
                        
                        if (sentFrameHashes.has(frameHash)) {
                          continue;
                        }
                        
                        const frame = JSON.parse(frameJson);
                        
                        if (frame.name && frame.backgroundColor && frame.elements && Array.isArray(frame.elements)) {
                          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
                            type: 'frame', 
                            frame: frame,
                            index: frameCount 
                          })}\n\n`));
                          
                          sentFrameHashes.add(frameHash);
                          frameCount++;
                          console.log(`✅ Sent unique frame ${frameCount}: ${frame.name}`);
                          
                          progressMessage = `Creating frame ${frameCount}: ${frame.name}`;
                          lastProgressSent = progressMessage;
                          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
                            type: 'status', 
                            message: progressMessage
                          })}\n\n`));
                        }
                      } catch (e) {
                        // Frame not complete, skip
                      }
                    }
                    
                    // Try to extract and stream complete elements progressively (fallback for single-frame format)
                    const elementRegex = /\{[^{}]*"type"\s*:\s*"(text|shape|icon|image)"[^{}]*\}/g;
                    const elementMatches = [...fullContent.matchAll(elementRegex)];
                    
                    // Send any new complete elements (with deduplication)
                    for (const match of elementMatches) {
                      try {
                        const elementJson = match[0];
                        const elementHash = elementJson.trim();
                        
                        if (sentElementHashes.has(elementHash)) {
                          continue;
                        }
                        
                        const element = JSON.parse(elementJson);
                        
                        if (element.type && 
                            element.x !== undefined && 
                            element.y !== undefined &&
                            element.width !== undefined &&
                            element.height !== undefined &&
                            element.width > 0 &&
                            element.height > 0) {
                          
                          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
                            type: 'element', 
                            element: element,
                            index: sentElementCount 
                          })}\n\n`));
                          
                          sentElementHashes.add(elementHash);
                          sentElementCount++;
                          console.log(`✅ Sent unique element ${sentElementCount}: ${element.type}`);
                        }
                      } catch (e) {
                        // Element not complete or invalid JSON, skip
                      }
                    }
                    
                    // Progress messages
                    progressMessage = '';
                    
                    if (frameCount === 0 && fullContent.includes('"name"') && !lastProgressSent.includes('Setting up')) {
                      const nameMatch = fullContent.match(/"name"\s*:\s*"([^"]+)"/);
                      if (nameMatch) {
                        progressMessage = `Setting up: "${nameMatch[1]}"`;
                      }
                    }
                    
                    if (frameCount === 0 && fullContent.includes('"backgroundColor"') && !lastProgressSent.includes('palette')) {
                      progressMessage = 'Applying color palette...';
                    }
                    
                    if (sentElementCount > elementCount) {
                      elementCount = sentElementCount;
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
              // Log the full content for debugging
              console.log('Raw fullContent (first 200 chars):', fullContent.substring(0, 200));
              console.log('Raw fullContent (last 200 chars):', fullContent.substring(Math.max(0, fullContent.length - 200)));
              
              // Remove code fences and trim obvious wrappers
              let cleanContent = fullContent
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

              // If content doesn't start with {, try to find the start of JSON
              if (!cleanContent.startsWith('{')) {
                const firstBraceIdx = cleanContent.indexOf('{');
                if (firstBraceIdx > 0) {
                  console.log('Content did not start with {, found at index:', firstBraceIdx);
                  console.log('Skipped prefix:', cleanContent.substring(0, Math.min(100, firstBraceIdx)));
                  cleanContent = cleanContent.substring(firstBraceIdx);
                }
              }

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
              let firstBraceIdx = cleanContent.indexOf('{');
              if (firstBraceIdx === -1) {
                console.error('No opening brace found in entire response');
                console.error('Full content:', fullContent);
                throw new Error('AI response does not contain a JSON object');
              }
              
              if (firstBraceIdx > 0) {
                console.log('Skipped', firstBraceIdx, 'characters before first {');
                console.log('Skipped content:', cleanContent.substring(0, Math.min(200, firstBraceIdx)));
                cleanContent = cleanContent.substring(firstBraceIdx);
              }

              let jsonStr = extractFirstJsonObject(cleanContent) ?? '';
              if (!jsonStr) {
                console.error('Could not find complete JSON object');
                console.error('Full content (first 1000):', fullContent.substring(0, 1000));
                throw new Error('AI did not return a valid JSON object');
              }

              // Attempt parse; if it fails, try aggressive sanitization
              const tryParse = (s: string) => {
                try { return JSON.parse(s); } catch { return null; }
              };

              designSpec = tryParse(jsonStr);
              if (!designSpec) {
                // Aggressive sanitization
                let sanitized = jsonStr
                  // Remove duplicate property definitions (e.g., "width": 100, "height": 200, "width": 300)
                  // This regex finds duplicate keys within the same object
                  .replace(/"(\w+)"\s*:\s*[^,}]+,\s*(?=[^{}]*"(\1)"\s*:\s*)/g, '')
                  // Remove obviously corrupted string-only entries like "elements, 209, 0.2)"
                  .replace(/"elements[^"\n]*"\s*,?/g, '')
                  // Remove invalid textAlign properties without a value like "textAlign":,
                  .replace(/"textAlign"\s*:\s*,/g, '')
                  // remove trailing commas in objects/arrays
                  .replace(/,\s*(\}|\])/g, '$1')
                  // fix missing quotes around property names
                  .replace(/([{|,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
                  // fix incomplete strings at the end
                  .replace(/,\s*$/g, '')
                  // remove incomplete property definitions at the end (e.g., "color": "rgba(45, 106, 79)
                  .replace(/,?\s*"\w+"\s*:\s*"[^"]*$/g, '')
                  .replace(/,?\s*"\w+"\s*:\s*\d+$/g, '')
                  // ensure closing brackets
                  .trim();
                
                // Count braces to see if we need to close the JSON
                const openBraces = (sanitized.match(/\{/g) || []).length;
                const closeBraces = (sanitized.match(/\}/g) || []).length;
                const openBrackets = (sanitized.match(/\[/g) || []).length;
                const closeBrackets = (sanitized.match(/\]/g) || []).length;
                
                let fixed = sanitized;
                // Close missing brackets/braces
                for (let i = 0; i < (openBrackets - closeBrackets); i++) fixed += ']';
                for (let i = 0; i < (openBraces - closeBraces); i++) fixed += '}';
                
                designSpec = tryParse(fixed);
                if (!designSpec) {
                  console.error('Sanitized JSON still failed to parse');
                  console.error('Original JSON snippet (first 500):', jsonStr.substring(0, 500));
                  console.error('Original JSON snippet (last 500):', jsonStr.substring(Math.max(0, jsonStr.length - 500)));
                  console.error('Fixed JSON snippet (first 500):', fixed.substring(0, 500));
                  console.error('Fixed JSON snippet (last 500):', fixed.substring(Math.max(0, fixed.length - 500)));
                  throw new Error('Unable to parse JSON even after sanitization');
                }
              }

              // Validate required fields - support both single frame and multi-frame formats
              if (designSpec.frames && Array.isArray(designSpec.frames)) {
                // New multi-frame format
                designSpec.frames.forEach((frame: any, idx: number) => {
                  if (!frame.name || typeof frame.name !== 'string') {
                    throw new Error(`Frame ${idx} missing required 'name' property`);
                  }
                  if (!frame.elements || !Array.isArray(frame.elements)) {
                    throw new Error(`Frame ${idx} missing required 'elements' array`);
                  }
                  if (!frame.width || !frame.height) {
                    throw new Error(`Frame ${idx} missing required width/height`);
                  }
                  // Validate each element has required fields
                  frame.elements.forEach((el: any, elIdx: number) => {
                    if (!el.type || typeof el.x !== 'number' || typeof el.y !== 'number' || !el.width || !el.height) {
                      throw new Error(`Frame ${idx}, element ${elIdx} missing required fields (type, x, y, width, height)`);
                    }
                  });
                });
              } else if (designSpec.elements && Array.isArray(designSpec.elements)) {
                // Legacy single-frame format - convert to frames array
                designSpec = {
                  frames: [{
                    name: designSpec.title || designSpec.name || 'Untitled Design',
                    backgroundColor: designSpec.backgroundColor || '#FFFFFF',
                    width: canvasWidth,
                    height: canvasHeight,
                    elements: designSpec.elements
                  }],
                  style: designSpec.style,
                  mood: designSpec.mood
                };
              } else {
                throw new Error('Invalid design spec: missing frames or elements array');
              }

              // Fix color contrast and image usage PER FRAME for multi-frame designs
              const framesArray = Array.isArray(designSpec.frames)
                ? designSpec.frames
                : [
                    {
                      name: designSpec.title || designSpec.name || 'Untitled Design',
                      backgroundColor: designSpec.backgroundColor || '#FFFFFF',
                      width: canvasWidth,
                      height: canvasHeight,
                      elements: designSpec.elements || [],
                    },
                  ];

              // If a specific number of frames was requested, ensure we have at least that many
              if (frameCount && frameCount > 1 && framesArray.length < frameCount) {
                const baseFrame = framesArray[0];
                for (let i = framesArray.length; i < frameCount; i++) {
                  const cloned = JSON.parse(JSON.stringify(baseFrame));
                  cloned.name = `${baseFrame.name || 'Frame'} ${i + 1}`;
                  framesArray.push(cloned);
                }
                console.log(
                  `Expanded frames to match requested count:`,
                  `requested=${frameCount}, actual=${framesArray.length}`,
                );
              }

              framesArray.forEach((frame: any, frameIdx: number) => {
                const frameBgColor = frame.backgroundColor || '#FFFFFF';
                const isLightBackground = isLightColor(frameBgColor);

                console.log(
                  `Frame ${frameIdx} background color:`,
                  frameBgColor,
                  'Is light:',
                  isLightBackground,
                );

                const elements: any[] = Array.isArray(frame.elements) ? frame.elements : [];

                // Fix text elements with poor contrast
                elements.forEach((el: any, idx: number) => {
                  if (el.type === 'text' && el.color) {
                    const textIsLight = isLightColor(el.color);

                    // Check for poor contrast: light text on light bg OR dark text on dark bg
                    if ((isLightBackground && textIsLight) || (!isLightBackground && !textIsLight)) {
                      const oldColor = el.color;
                      // Fix: Use contrasting color
                      el.color = isLightBackground ? '#000000' : '#FFFFFF';
                      console.log(
                        `Fixed text element ${idx} in frame ${frameIdx}:`,
                        oldColor,
                        '->',
                        el.color,
                        `(background is ${isLightBackground ? 'light' : 'dark'})`,
                      );
                    }
                  }
                });

                // Update image elements to use generated image if available
                if (generatedImageBase64) {
                  console.log('Adding generated image to design spec for frame', frameIdx);

                  const imageElements = elements.filter((el: any) => el.type === 'image');
                  if (imageElements.length > 0) {
                    // Update first image element to use generated image URL
                    imageElements[0].content = generatedImageBase64;
                    imageElements[0].imageUrl = generatedImageBase64;
                    imageElements[0].src = generatedImageBase64;
                    imageElements[0].isGenerated = true;
                    console.log('Updated existing image element with generated image');
                  } else {
                    // Add image element if none exists
                    const frameWidth = frame.width || canvasWidth;
                    const frameHeight = frame.height || canvasHeight;

                    const newImageElement = {
                      type: 'image',
                      content: generatedImageBase64,
                      imageUrl: generatedImageBase64,
                      src: generatedImageBase64,
                      x: 0,
                      y: 0,
                      width: frameWidth,
                      height: Math.floor(frameHeight * 0.6),
                      opacity: 1,
                      isGenerated: true,
                    };
                    elements.unshift(newImageElement);
                    console.log('Added new image element with generated image');
                  }

                  // Add dark overlay for better text contrast if background is an image
                  const hasImage = elements.some((el: any) => el.type === 'image');
                  const hasWhiteText = elements.some(
                    (el: any) =>
                      el.type === 'text' &&
                      (el.color === '#FFFFFF' ||
                        el.color === '#FFF' ||
                        el.color === 'white' ||
                        el.color?.toLowerCase().includes('white')),
                  );

                  if (hasImage && hasWhiteText) {
                    // Add semi-transparent overlay for text readability
                    const overlayExists = elements.some(
                      (el: any) =>
                        el.type === 'shape' &&
                        el.color &&
                        el.color.includes('rgba') &&
                        el.color.includes('0,0,0'),
                    );

                    if (!overlayExists) {
                      const frameHeight = frame.height || canvasHeight;
                      const frameWidth = frame.width || canvasWidth;

                      const overlay = {
                        type: 'shape',
                        shape: 'rectangle',
                        x: 0,
                        y: Math.floor(frameHeight * 0.5), // Bottom half
                        width: frameWidth,
                        height: Math.floor(frameHeight * 0.5),
                        color: 'rgba(0,0,0,0.6)',
                        borderRadius: '0',
                        opacity: 1,
                      };
                      // Insert overlay before text elements
                      const firstTextIndex = elements.findIndex((el: any) => el.type === 'text');
                      if (firstTextIndex > 0) {
                        elements.splice(firstTextIndex, 0, overlay);
                      } else {
                        elements.push(overlay);
                      }
                      console.log('✅ Added contrast overlay for white text readability');
                    }
                  }
                }

                // Write elements back to the frame
                frame.elements = elements;
              });

              // If we constructed framesArray from legacy format, sync it back to designSpec
              if (!Array.isArray(designSpec.frames)) {
                designSpec.frames = framesArray;
              }

              console.log(
                'Successfully parsed design with',
                framesArray.reduce((acc: number, f: any) => acc + (f.elements?.length || 0), 0),
                'elements across',
                framesArray.length,
                'frame(s)',
              );

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
              model,
              targetFrameId, // Include target frame ID in response
              imageUrl: generatedImageBase64 || null // Include final image URL for client-side use
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
