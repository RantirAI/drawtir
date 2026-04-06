

## Plan: AI Asset Generator for Game Developers & Creators

A new `/assets` section where users create asset projects (e.g., for a 2D game), maintain a knowledge base describing their project, and use AI to generate downloadable 2D assets like characters, weapons, tiles, backgrounds, etc.

### How It Works

1. User creates a project (e.g., "Pixel Dungeon RPG"), adds a knowledge base describing art style, game theme, etc.
2. User prompts the AI: "Generate a knight character sprite sheet — idle, running, attacking poses" 
3. AI generates images using the image generation model, storing them in the project
4. User can download individual assets as PNG, keep prompting for more assets
5. All generated assets are organized in a gallery per project, filterable by category

### Data Model

**New table: `asset_projects`**
- id, user_id, name, description, knowledge_base (text), art_style (text), created_at, updated_at

**New table: `generated_assets`**
- id, project_id, user_id, prompt (text), image_url (text), category (text — e.g. "character", "weapon", "environment", "ui", "other"), file_name (text), created_at

### New Edge Function: `generate-asset`

Accepts: project_id, prompt, category. Fetches the project's knowledge base and art style from the database, then calls Lovable AI image generation (gemini-3.1-flash-image-preview) with context-aware prompts that incorporate the project's style and theme. Returns the generated image URL after uploading to storage.

### New Pages & Components

**`src/pages/Assets.tsx`** — Dashboard listing all asset projects with create/delete.

**`src/pages/AssetProject.tsx`** — Single project view with two sections:
- **Settings sidebar/tab**: Project name, knowledge base editor, art style selector (pixel art, hand-drawn, vector, realistic, etc.)
- **Generator + Gallery**: Prompt input at top, category selector, generate button. Below it, a masonry/grid gallery of all generated assets with download buttons, category filters, and delete option.

### Route Changes

Add to `App.tsx`:
- `/assets` → Asset projects dashboard  
- `/assets/:id` → Single asset project (generator + gallery)

### File Summary

**New files:**
- `supabase/migrations/..._asset_tables.sql` — Creates both tables with RLS policies
- `supabase/functions/generate-asset/index.ts` — AI image generation with project context
- `src/pages/Assets.tsx` — Projects dashboard
- `src/pages/AssetProject.tsx` — Project view with generator and gallery
- `src/hooks/useAssetProject.ts` — React Query hooks for CRUD operations

**Modified files:**
- `src/App.tsx` — Add routes
- `src/components/Navigation/HorizontalNav.tsx` — Add Assets nav link

### Technical Details

- Uses `google/gemini-3.1-flash-image-preview` (Nano Banana 2) for fast, high-quality image generation
- Images uploaded to the existing `media` storage bucket, public URLs stored in `generated_assets` table
- Knowledge base is injected into every generation prompt so the AI maintains consistent style across all assets
- Art style presets (pixel art, vector, hand-drawn, realistic) are prepended to prompts for consistency
- Each asset is individually downloadable as PNG
- The gallery supports category filtering so users can find specific asset types quickly

