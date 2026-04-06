

## Plan: Marketing Agent Dashboard

A new `/marketing` page where users create marketing projects, each with a persistent knowledge base, brand assets, and AI-powered content generation.

### Data Model

**New table: `marketing_projects`**
- id, user_id, name, description, knowledge_base (text), primary_color, logos (text[]), images (text[]), created_at, updated_at

**New table: `marketing_outputs`**
- id, project_id, user_id, output_type (poster/slide/social_post/video_script), title, content (jsonb - stores generated HTML/text/poster data), platform (linkedin/instagram/tiktok/general), created_at

### New Edge Function: `generate-marketing-content`

Accepts: project_id, output_type, platform, custom_prompt. Fetches the project's knowledge base, images, branding from the database, then calls Lovable AI (gemini-3-flash-preview) to generate:
- **Posters**: Self-contained HTML with the project's colors/logos baked in (similar to existing AI Wall)
- **Social posts**: Platform-specific copy (LinkedIn professional, Instagram casual, TikTok short-form)
- **Slide decks**: HTML slides summarizing features/value props
- **Marketing strategy**: Text-based plans and content calendars

### New Pages & Components

**`src/pages/Marketing.tsx`** - Dashboard listing all marketing projects with create/delete.

**`src/pages/MarketingProject.tsx`** - Single project view with tabs:
- **Knowledge Base** - Rich text editor for product info, auto-saved
- **Brand Assets** - Upload logos, set primary color, upload feature images over time
- **Generate** - Pick output type (poster/social/slides/strategy), pick platform, describe what you want, AI generates 2-4 variations
- **Outputs** - Gallery of all generated content, filterable by type/platform

### Route Changes

Add to `App.tsx`:
- `/marketing` → Marketing dashboard
- `/marketing/:id` → Single project view

### File Summary

**New files:**
- `supabase/migrations/...marketing_tables.sql`
- `supabase/functions/generate-marketing-content/index.ts`
- `src/pages/Marketing.tsx`
- `src/pages/MarketingProject.tsx`
- `src/hooks/useMarketingProject.ts`
- `src/components/Marketing/KnowledgeBaseEditor.tsx`
- `src/components/Marketing/BrandAssetsPanel.tsx`
- `src/components/Marketing/ContentGenerator.tsx`
- `src/components/Marketing/OutputGallery.tsx`

**Modified files:**
- `src/App.tsx` - Add routes
- `src/components/Navigation/HorizontalNav.tsx` - Add Marketing nav link
- `supabase/config.toml` - Register edge function

### Technical Details

- Images uploaded to existing `media` storage bucket, URLs stored in the project record
- Knowledge base is plain text stored directly in the table (searchable, easy to pass to AI)
- Generated posters use the same iframe-based approach as AI Wall (self-contained HTML with Tailwind CDN)
- Social post generation returns structured JSON with caption, hashtags, and suggested image description
- All content generation goes through a single edge function with branching logic based on `output_type`

