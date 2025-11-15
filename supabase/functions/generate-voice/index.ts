const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId = '9BWtsMINqrJLrRacOk9x', modelId } = await req.json();

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
    
    // Convert to base64 in chunks to avoid stack overflow
    const uint8Array = new Uint8Array(audioBuffer);
    const chunkSize = 8192;
    let binaryString = '';
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64Audio = btoa(binaryString);

    console.log('Voice generated successfully');

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
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
