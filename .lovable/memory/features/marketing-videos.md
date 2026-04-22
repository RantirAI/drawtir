---
name: marketing-videos
description: Enterprise-grade AI marketing video generation per project — locale-aware scripts, AI logo composited onto subjects, labeled product screenshots used verbatim in scenes, ElevenLabs voice + word-timed burned-in subtitles.
type: feature
---
Marketing projects have a Videos tab that generates voiced marketing videos. Built to be market-level ready for serious brands.

Project-level configuration (per marketing project):
- **Brand Settings tab** (`BrandSettingsPanel`): country, currency, language, brand voice/tone guidelines, forbidden words/claims list. Stored on `marketing_projects` (`country`, `currency`, `language`, `brand_voice`, `forbidden_words`).
- **Featured Images tab** (`FeaturedImagesPanel`): labeled product screenshots (e.g. "Event list page") stored in `marketing_featured_images` (RLS: own only). The AI picks these by label and shows the real UI in scenes — never invents fake product UI.

Generation flow (`generate-marketing-video`):
1. Loads project knowledge_base + brand voice + forbidden words + locale + featured images catalog.
2. Gemini script writer is told the locale (any currency must be the project currency, never default to USD), brand voice rules, forbidden words, and the featured catalog.
3. Returns scenes with `scene_type` ∈ `cinematic | featured | logo_subject`:
   - `cinematic` → Nano Banana 2 image, no text/logos in image.
   - `featured` → looks up the featured screenshot by label; treatment `fullscreen` (renderer shows the screenshot framed on a brand backdrop) or `device_mockup` (Nano Banana 2 edits the screenshot into a laptop mockup).
   - `logo_subject` → generates a base scene with a blank shirt/hat/etc., then a SECOND Nano Banana 2 image-edit call composites the actual brand logo onto the subject (printed/embroidered look following contour & lighting).
4. ElevenLabs `text-to-speech/{voice}/with-timestamps` returns audio + character-level alignment, converted to word-level timings stored in `marketing_videos.subtitles`.
5. Row inserted with `status: rendering`, `subtitles`, `burn_subtitles`, `country/currency/language` (per-video override allowed).

Refine flow (`refine-marketing-video`):
- Same scene_type system + locale + voice/forbidden enforcement. Refine reuses image URLs unless `regenerate_images` is set; voice + alignment always regenerated. Per-video locale on the row overrides the project default.

Client renderer (`src/lib/marketingVideoRenderer.ts`):
- Cinematic/logo_subject scenes → Ken Burns over the AI image.
- Featured fullscreen scenes → branded gradient backdrop with the actual screenshot rendered as a rounded card with shadow + featured-label badge in the top-right.
- Featured device_mockup scenes → AI-composited image used as background.
- Persistent logo watermark (top-left).
- Burned-in subtitles: sliding 5-word window centered on the active word, drawn in a black pill at the bottom (silent autoplay + accessibility). Toggleable per video via `burn_subtitles`.
- WebM (VP9/Opus) preferred over MP4 for reliable playback.

Key files:
- `supabase/functions/generate-marketing-video/index.ts`
- `supabase/functions/refine-marketing-video/index.ts`
- `supabase/functions/save-marketing-video/index.ts`
- `src/lib/marketingVideoRenderer.ts`
- `src/components/Marketing/MarketingVideoPanel.tsx` (locale override + subtitles toggle in Advanced)
- `src/components/Marketing/MarketingVideoCard.tsx`
- `src/components/Marketing/FeaturedImagesPanel.tsx`
- `src/components/Marketing/BrandSettingsPanel.tsx`
- `src/hooks/useMarketingVideos.ts` (`subtitles`, `burn_subtitles`, locale fields)
- `src/hooks/useFeaturedImages.ts`
- Tables: `marketing_videos`, `marketing_featured_images`; new fields on `marketing_projects` for locale + brand voice + forbidden words.
