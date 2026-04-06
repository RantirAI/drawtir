

## Plan: AI Game Builder from Generated Assets

Build a game builder that takes the user's generated assets and knowledge base, then uses AI to generate a complete playable 2D game — rendered in-browser and exportable as a standalone HTML file.

### How It Works

1. User navigates to a new "Build Game" tab within their asset project
2. User selects which assets to include (or selects all), picks a game type (platformer, top-down RPG, puzzle, visual novel), and optionally adds game-specific instructions
3. AI generates a complete self-contained HTML5 Canvas game using the asset image URLs, the project's knowledge base for theming/story, and the selected game type
4. The game renders live in an iframe preview on the page
5. User can re-prompt to tweak gameplay (e.g., "make the character jump higher", "add a second level", "make enemies faster")
6. User can download the entire game as a single HTML file or play it fullscreen

### Architecture

**New Edge Function: `generate-game`**
- Accepts: `project_id`, `asset_ids[]`, `game_type`, `instructions`, optional `previous_code` (for iterative refinement)
- Fetches the project's knowledge base, art style, and selected asset URLs from the database
- Calls `google/gemini-2.5-pro` (needs strong reasoning for code generation) with a detailed system prompt that instructs it to generate a complete, self-contained HTML5 game using Canvas API
- The system prompt includes the asset URLs as sprite references, game type templates, and the knowledge base for story/theme context
- Returns the generated HTML game code as a string
- Handles iterative refinement by accepting previous game code and modification instructions

**New UI: "Build Game" tab in `AssetProject.tsx`**
- Asset selector: grid of generated assets with checkboxes to pick which ones to include
- Game type dropdown: Platformer, Top-down RPG, Tile-based puzzle, Visual novel
- Instructions textarea for custom game requirements
- "Generate Game" button that calls the edge function
- Live preview iframe showing the generated game
- Refinement prompt input below the preview for iterative changes
- "Download as HTML" and "Play Fullscreen" buttons
- Generation history: stores previous versions so user can go back

**Database Changes**
- New table `game_builds`: id, project_id, user_id, game_type, instructions, game_code (text), asset_ids (text[]), created_at
- RLS policies: users can CRUD their own game builds

### Game Generation Strategy

The AI will generate a single self-contained HTML file with embedded JavaScript that:
- Loads asset images from their public URLs
- Implements a game loop with requestAnimationFrame
- Handles keyboard/touch input
- Includes collision detection, scoring, and basic physics based on game type
- Has a start screen, gameplay, and game-over states
- Works standalone when downloaded (assets are referenced by absolute URL)

### File Summary

**New files:**
- `supabase/migrations/..._game_builds.sql` — Game builds table with RLS
- `supabase/functions/generate-game/index.ts` — AI game code generation
- No new page files — adds a "Build Game" tab to existing `AssetProject.tsx`

**Modified files:**
- `src/pages/AssetProject.tsx` — Add "Build Game" tab with asset picker, game type selector, live preview, and refinement prompt
- `src/hooks/useAssetProject.ts` — Add hooks for game builds CRUD

### Technical Details

- Uses `google/gemini-2.5-pro` for game code generation (complex reasoning needed for functional game code)
- Game code is a single HTML string rendered via `srcDoc` in a sandboxed iframe
- Iterative refinement sends the previous game code + new instructions back to the AI
- Downloaded HTML file is fully self-contained and playable offline (assets load from public URLs)
- Game builds are saved to the database so users can revisit and continue refining

