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
      shooter: "A 2D shooter game. The player controls a character or ship that can move and shoot projectiles. Include waves of enemies, power-ups, boss fights, and increasing difficulty. Can be top-down or side-scrolling.",
      racing: "A 2D racing game. The player controls a vehicle on a track. Include obstacles, speed boosts, laps/checkpoints, AI opponents, and a timer. Can be top-down or pseudo-3D perspective.",
      tower_defense: "A tower defense game. Enemies follow a path, the player places towers/turrets along the path to stop them. Include different tower types, enemy waves, upgrade system, and resource management.",
      endless_runner: "An endless runner game. The character automatically moves forward, the player controls jumping/dodging. Include procedurally generated obstacles, collectibles, increasing speed, and high score tracking.",
      fighting: "A 2D fighting game. Two characters face each other with health bars. Include punch, kick, block, and special moves. Can be player vs AI. Include combo system and round-based gameplay.",
      strategy: "A 2D strategy game. Include unit placement, resource gathering, simple AI opponents, and turn-based or real-time mechanics. Think simplified RTS or tactical combat.",
      card_game: "A card-based game. Include a deck, hand management, card effects, and an AI opponent. Can be a battle card game, solitaire variant, or memory matching game.",
      custom: "A custom 2D game. Follow the user's instructions exactly to determine the game mechanics, rules, and gameplay style.",
    };

    const gameDesc = gameTypeDescriptions[game_type] || "A 2D game based on the user's description. Determine the best game mechanics from the instructions provided.";

    const hasAssets = assetList && assetList.trim().length > 0;

    const systemPrompt = `You are an expert HTML5 game developer. You generate COMPLETE, SELF-CONTAINED HTML files with embedded JavaScript that create playable 2D games using the HTML5 Canvas API.

CRITICAL RULES:
1. Output ONLY the HTML code. No markdown, no code fences, no explanations. Just the raw HTML starting with <!DOCTYPE html>.
2. The game must be a SINGLE HTML file with all CSS and JavaScript embedded.
3. ${hasAssets ? "Load game assets (character sprites, items, etc.) using the provided image URLs via new Image() objects." : "Since no asset images are provided, create ALL visual elements using Canvas drawing (shapes, gradients, patterns). Make them look polished and visually appealing — use colors, shadows, and details to make drawn sprites look good."}
4. Implement a proper game loop using requestAnimationFrame.
5. Handle keyboard input (arrow keys or WASD) and also add touch/click controls for mobile.
6. Include these game states: START_SCREEN, PLAYING, GAME_OVER (and WIN if applicable).
7. The start screen should show the game title, brief instructions, and "Press any key or click to start".
8. Make the canvas responsive — fill the viewport. Use window.innerWidth and window.innerHeight.
9. Include scoring, a HUD (score, health/lives), and visual feedback.
10. Use clean, well-structured code with comments.
11. ${hasAssets ? "All asset image URLs are absolute HTTPS URLs — load them directly. Handle image load errors gracefully with fallback colored rectangles." : "Draw all game entities using Canvas 2D API — rectangles, circles, paths, gradients. Make characters and objects visually distinct and appealing."}
12. Make the game FUN and polished — add particle effects, screen shake, smooth animations.
13. Style the page with a dark background (body margin:0, overflow:hidden).
14. You are NOT limited to platformers — you can build ANY type of 2D game. Match the game type requested.`;

    let userPrompt: string;

    if (previous_code) {
      userPrompt = `Here is an existing HTML5 game I built. I want you to modify it based on my new instructions.

CURRENT GAME CODE:
${previous_code}

MODIFICATION INSTRUCTIONS:
${instructions || "Improve the game"}

AVAILABLE ASSETS:
${hasAssets ? assetList : "No assets provided — create ALL visuals using Canvas drawing API. Make them look polished and professional."}

GAME CONTEXT: ${project.knowledge_base || "A fun 2D game"}

Output the COMPLETE modified HTML file. Keep everything that works, only change what's requested.`;
    } else {
      userPrompt = `Create a ${game_type.replace("_", " ")} game with the following specifications:

GAME TYPE: ${gameDesc}

GAME THEME & STORY CONTEXT:
${project.knowledge_base || "A fun and engaging game"}

ART STYLE: ${project.art_style || "pixel_art"}

${hasAssets ? `AVAILABLE ASSETS (use these as sprites in the game):\n${assetList}` : "NO ASSET IMAGES PROVIDED — Draw ALL game visuals using Canvas 2D API (shapes, gradients, paths). Make characters, enemies, items, and environments look visually appealing using only code-drawn graphics."}

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
