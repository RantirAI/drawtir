---
name: marketing-videos
description: AI marketing video generation per marketing project — script + scene images + ElevenLabs voiceover composited client-side via Canvas + MediaRecorder.
type: feature
---
Marketing projects have a Videos tab that generates voiced marketing videos.

Flow:
1. User picks duration (15/30/60s), tone, voice (existing ElevenLabs VoiceSelector), optional prompt.
2. Edge function `generate-marketing-video` writes a script + scene plan via Gemini structured tool calling, generates N branded scene images via Nano Banana 2 (16:9, no text in image), generates a single-take voiceover via ElevenLabs, uploads everything to media bucket, inserts a `marketing_videos` row with `status: rendering`.
3. Client-side `src/lib/marketingVideoRenderer.ts` composites scene images with Ken Burns motion, animated captions, brand color accent bar, logo watermark, CTA pill, synced to the voiceover audio. Uses Canvas captureStream + AudioContext MediaStreamDestination + MediaRecorder. Picks mp4 if supported, else webm.
4. Edge function `save-marketing-video` accepts the rendered blob via FormData, uploads to storage, updates row to `status: ready` with `video_url`.

Key files:
- `supabase/functions/generate-marketing-video/index.ts`
- `supabase/functions/save-marketing-video/index.ts`
- `src/lib/marketingVideoRenderer.ts`
- `src/components/Marketing/MarketingVideoPanel.tsx`
- `src/components/Marketing/MarketingVideoCard.tsx`
- `src/hooks/useMarketingVideos.ts`
- Table `marketing_videos` (RLS: own only)

Why client-side rendering: Deno edge functions cannot run ffmpeg, so MP4 compositing happens in the browser. This keeps cost predictable (no video-gen API) and is fast (~real-time playback duration to render).
