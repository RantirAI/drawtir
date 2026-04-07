import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { project_id, asset_ids, game_type, instructions, previous_code } = await req.json();
    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch project
    const { data: project, error: projErr } = await supabase
      .from("asset_projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch selected assets
    let assetsQuery = supabase.from("generated_assets").select("*").eq("project_id", project_id);
    if (asset_ids && asset_ids.length > 0) {
      assetsQuery = assetsQuery.in("id", asset_ids);
    }
    const { data: assets } = await assetsQuery;

    const assetList = (assets || []).map((a: any, i: number) => 
      `Asset ${i + 1}: "${a.prompt}" (category: ${a.category}) — URL: ${a.image_url}`
    ).join("\n");

    const gameTypeDescriptions: Record<string, string> = {
      platformer: "A side-scrolling 2D platformer game. The player character can move left/right and jump. Include platforms to jump on, enemies to avoid, collectible items, and a goal to reach. Implement gravity, collision detection, and scoring.",
      topdown_rpg: "A top-down RPG/adventure game. The player can move in 4 directions. Include a map area with obstacles, NPCs to interact with (show dialogue), items to collect, and enemies. Implement simple combat (bump into enemies).",
      puzzle: "A tile-based puzzle game. Create a grid where the player solves puzzles by moving objects, matching items, or navigating a maze. Include multiple levels with increasing difficulty.",
      visual_novel: "A visual novel / story game. Display character sprites and backgrounds. Show dialogue with character names. Include branching choices that affect the story. Use click/tap to advance text.",
    };

    const gameDesc = gameTypeDescriptions[game_type] || gameTypeDescriptions.platformer;

    const systemPrompt = `You are an expert HTML5 game developer. You generate COMPLETE, SELF-CONTAINED HTML files with embedded JavaScript that create playable 2D games using the HTML5 Canvas API.

CRITICAL RULES:
1. Output ONLY the HTML code. No markdown, no code fences, no explanations. Just the raw HTML starting with <!DOCTYPE html>.
2. The game must be a SINGLE HTML file with all CSS and JavaScript embedded.
3. Load game assets (character sprites, items, etc.) using the provided image URLs via new Image() objects.
4. Implement a proper game loop using requestAnimationFrame.
5. Handle keyboard input (arrow keys or WASD) and also add touch/click controls for mobile.
6. Include these game states: START_SCREEN, PLAYING, GAME_OVER (and WIN if applicable).
7. The start screen should show the game title, brief instructions, and "Press any key or click to start".
8. Make the canvas responsive — fill the viewport. Use window.innerWidth and window.innerHeight.
9. Include scoring, a HUD (score, health/lives), and visual feedback.
10. Use clean, well-structured code with comments.
11. All asset image URLs are absolute HTTPS URLs — load them directly. Handle image load errors gracefully with fallback colored rectangles.
12. Make the game FUN and polished — add particle effects, screen shake, smooth animations.
13. Style the page with a dark background (body margin:0, overflow:hidden).`;

    let userPrompt: string;

    if (previous_code) {
      userPrompt = `Here is an existing HTML5 game I built. I want you to modify it based on my new instructions.

CURRENT GAME CODE:
${previous_code}

MODIFICATION INSTRUCTIONS:
${instructions || "Improve the game"}

AVAILABLE ASSETS:
${assetList || "No specific assets — use colored shapes as placeholders."}

GAME CONTEXT: ${project.knowledge_base || "A fun 2D game"}

Output the COMPLETE modified HTML file. Keep everything that works, only change what's requested.`;
    } else {
      userPrompt = `Create a ${game_type} game with the following specifications:

GAME TYPE: ${gameDesc}

GAME THEME & STORY CONTEXT:
${project.knowledge_base || "A fun and engaging game"}

ART STYLE: ${project.art_style || "pixel_art"}

AVAILABLE ASSETS (use these as sprites in the game):
${assetList || "No specific assets available — use colored shapes/rectangles as placeholders for characters, enemies, items, etc."}

${instructions ? `ADDITIONAL INSTRUCTIONS:\n${instructions}` : ""}

Generate the complete HTML5 game file now.`;
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please wait and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", status, errText);
      return new Response(JSON.stringify({ error: "Failed to generate game" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let gameCode = aiData.choices?.[0]?.message?.content || "";

    // Strip any markdown code fences if present
    gameCode = gameCode.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();

    if (!gameCode || !gameCode.includes("<")) {
      return new Response(JSON.stringify({ error: "Failed to generate valid game code" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ game_code: gameCode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
