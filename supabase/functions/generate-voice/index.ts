import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId = '9BWtsMINqrJLrRacOk9x', modelId, userId } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    console.log('Generating voice with ElevenLabs for text:', text.substring(0, 100));

    async function tts(modelId: string, timeoutMs: number = 25000) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        console.log('Using ElevenLabs model:', modelId);
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': String(ELEVENLABS_API_KEY),
            },
            body: JSON.stringify({
              text,
              model_id: modelId,
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.5,
                use_speaker_boost: true,
              },
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }

    // Force Eleven v3 by default (acts on emotion tags); allow override; provide robust fallbacks
    const selectedModel = modelId || 'eleven_v3';
    console.log('Selected ElevenLabs model:', selectedModel);

    let response = await tts(selectedModel);
    if (!response.ok) {
      const errTxt = await response.text();
      console.warn('Primary model failed, trying fallbacks:', selectedModel, response.status, errTxt);
      const fallbacks = ['eleven_multilingual_v2', 'eleven_turbo_v2_5'];
      for (const fb of fallbacks) {
        response = await tts(fb);
        if (response.ok) break;
        const t = await response.text();
        console.warn('Fallback failed:', fb, response.status, t);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    
    console.log('Voice generated successfully, uploading to storage...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create a unique filename
    const timestamp = Date.now();
    const sanitizedText = text.substring(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename = `voice-${timestamp}-${sanitizedText}.mp3`;
    const filePath = userId ? `${userId}/${filename}` : `public/${filename}`;

    // Upload to the media bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    console.log('Audio uploaded successfully:', uploadData.path);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(uploadData.path);

    console.log('Public URL generated:', publicUrl);

    return new Response(
      JSON.stringify({ 
        audioUrl: publicUrl,
        filePath: uploadData.path,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-voice function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
