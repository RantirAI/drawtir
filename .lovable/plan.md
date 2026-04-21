

# Merch Design Studio for Marketing Projects

Add a new **Merch** tab inside each marketing project where users can generate AI-designed apparel mockups (front + back) using the project's logo, brand color, and knowledge base as context.

## What the user gets

Inside `/marketing/:id`, a new **Merch** tab next to Knowledge Base / Brand Assets / Generate / Outputs.

**Flow:**
1. Pick a product type — Hoodie, T-Shirt, Crewneck, Cap, Tote Bag, Mug
2. Pick a base color (black, white, heather grey, navy, custom)
3. Pick a design style — Minimal, Vintage, Streetwear, Bold Typography, Illustrated, Y2K, Grunge
4. Optional prompt: "Make it about our launch event" / "Use the mascot"
5. Click **Generate Design Set** → AI produces:
   - **Front design** (isolated PNG, transparent background)
   - **Back design** (isolated PNG, transparent background)
   - **Front mockup** (design composited onto the chosen garment)
   - **Back mockup** (design composited onto the chosen garment)
6. Gallery of past merch sets, each downloadable, regenerable, and saveable to Outputs

The AI automatically pulls in the project's logo, primary color, and knowledge base so designs feel on-brand without re-explaining.

## UI layout

```text
[Merch Tab]
┌────────────────────────────────────────────────┐
│  Product:  [Hoodie ▼]   Color: [⬛][⬜][grey]+  │
│  Style:    [Streetwear ▼]                      │
│  Prompt:   [Optional: extra direction...]      │
│  ☑ Use project logo   ☑ Use brand color        │
│                            [Generate Design]   │
└────────────────────────────────────────────────┘

  Recent Designs
  ┌─────────┐ ┌─────────┐ ┌─────────┐
  │ Hoodie  │ │ T-Shirt │ │ Tote    │
  │ [front] │ │ [front] │ │ [front] │
  │ [back]  │ │ [back]  │ │ [back]  │
  │ ⬇ ↻ 🗑  │ │ ⬇ ↻ 🗑  │ │ ⬇ ↻ 🗑   │
  └─────────┘ └─────────┘ └─────────┘
```

## Technical plan

**Database** — new table `merch_designs`:
- `id`, `project_id`, `user_id`, `created_at`
- `product_type` (text), `base_color` (text), `style` (text), `prompt` (text)
- `front_design_url`, `back_design_url` (transparent PNGs)
- `front_mockup_url`, `back_mockup_url` (composited mockups)
- RLS: user can CRUD their own rows

**Edge function** `generate-merch-design`:
1. Load `marketing_projects` row (logo, primary_color, knowledge_base, name)
2. Build a style-aware prompt per design panel:
   - Front: large hero graphic / wordmark
   - Back: complementary design (often bigger, more detail)
   - Both reference brand color, optional logo, project description
   - Enforce "isolated design on pure white background" for clean compositing
3. Call **Gemini 3.1 Flash Image Preview** (Nano Banana 2) for the 2 design panels
4. Run each through **remove.bg** (key already in secrets) → transparent PNGs
5. Generate the two mockups: send the transparent design + a mockup-instruction prompt back to Gemini ("place this design on the front of a [black hoodie], realistic product photo, studio lighting, centered") — produces final composited mockup
6. Upload all 4 PNGs to the `media` bucket under `merch/{project_id}/{design_id}/`
7. Insert row into `merch_designs`, return URLs

**Frontend** — new files:
- `src/components/Marketing/MerchDesignPanel.tsx` — generation form + recent gallery
- `src/components/Marketing/MerchDesignCard.tsx` — single design with front/back preview, download, regenerate, delete, save-to-outputs
- `src/hooks/useMerchDesigns.ts` — list / create / delete React Query hooks
- Add `<TabsTrigger value="merch">Merch</TabsTrigger>` + `<TabsContent>` in `src/pages/MarketingProject.tsx`
- Register `generate-merch-design` in `supabase/config.toml` with `verify_jwt = false`

**Style presets** (drives prompt quality):
- Minimal — clean lines, monochrome, lots of negative space
- Vintage — distressed textures, retro typography, faded palette
- Streetwear — bold layered graphics, oversized typography, urban
- Bold Typography — wordmark-driven, oversized text, geometric
- Illustrated — hand-drawn character or scene, organic linework
- Y2K — chrome, gradients, futuristic 2000s aesthetic
- Grunge — torn edges, splatter, rough textures

## Out of scope (can come later)
- Print-ready files with bleed/CMYK export
- Direct Printful / Printify integration for ordering
- Multiple size variants (S/M/L mockups)
- 3D rotating preview

