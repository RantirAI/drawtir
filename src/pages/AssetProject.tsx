import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import HorizontalNav from "@/components/Navigation/HorizontalNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Download, Trash2, Sparkles, Loader2, Image as ImageIcon, X, ChevronLeft, ChevronRight, Zap, Gamepad2, Maximize2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAssetProject, useGeneratedAssets, useUpdateAssetProject, useDeleteAsset, useGameBuilds, useCreateGameBuild, useUpdateGameBuild, useDeleteGameBuild } from "@/hooks/useAssetProject";

const ART_STYLES = [
  { value: "pixel_art", label: "Pixel Art" },
  { value: "hand_drawn", label: "Hand Drawn" },
  { value: "vector", label: "Vector / Flat" },
  { value: "realistic", label: "Realistic" },
  { value: "anime", label: "Anime" },
  { value: "low_poly", label: "Low Poly" },
];

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "character", label: "Characters" },
  { value: "weapon", label: "Weapons" },
  { value: "environment", label: "Environment" },
  { value: "ui", label: "UI Elements" },
  { value: "item", label: "Items" },
  { value: "other", label: "Other" },
];

const BULK_PRESETS = [
  { id: "main_character", label: "Main Character (idle pose)", category: "character", prompt: "Main player character, front-facing idle pose, full body" },
  { id: "enemy_basic", label: "Basic Enemy", category: "character", prompt: "A basic enemy creature, front-facing, menacing but simple design" },
  { id: "enemy_boss", label: "Boss Enemy", category: "character", prompt: "A large intimidating boss enemy, detailed design, front-facing" },
  { id: "npc_merchant", label: "NPC Merchant", category: "character", prompt: "A friendly merchant NPC character, standing idle with a shop bag or cart" },
  { id: "sword", label: "Sword", category: "weapon", prompt: "A standard sword weapon, side view, clean isolated design" },
  { id: "shield", label: "Shield", category: "weapon", prompt: "A defensive shield, front-facing view, clean isolated design" },
  { id: "bow", label: "Bow & Arrow", category: "weapon", prompt: "A bow with arrow, side view, clean isolated design" },
  { id: "potion_health", label: "Health Potion", category: "item", prompt: "A red health potion in a glass bottle, front view" },
  { id: "potion_mana", label: "Mana Potion", category: "item", prompt: "A blue mana potion in a glass bottle, front view" },
  { id: "coin", label: "Gold Coin", category: "item", prompt: "A shiny gold coin, front view, clean isolated design" },
  { id: "chest", label: "Treasure Chest", category: "item", prompt: "A wooden treasure chest with gold trim, slightly open, front view" },
  { id: "key", label: "Key", category: "item", prompt: "An ornate golden key, side view, clean isolated design" },
  { id: "floor_tile", label: "Floor Tile", category: "environment", prompt: "A seamless floor tile, top-down view, tileable texture" },
  { id: "wall_tile", label: "Wall Tile", category: "environment", prompt: "A vertical wall tile/block, front view, tileable texture" },
  { id: "tree", label: "Tree", category: "environment", prompt: "A decorative tree, front view, suitable for game environment" },
  { id: "door", label: "Door", category: "environment", prompt: "A wooden door, front view, can be open or closed" },
  { id: "heart_icon", label: "Heart / HP Icon", category: "ui", prompt: "A heart icon for health display, clean pixel-perfect design" },
  { id: "button_ui", label: "UI Button", category: "ui", prompt: "A game UI button, rectangular with rounded corners, clean design" },
];

export default function AssetProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading: projLoading } = useAssetProject(id);
  const updateProject = useUpdateAssetProject();
  const deleteAsset = useDeleteAsset();
  const createGameBuild = useCreateGameBuild();
  const updateGameBuild = useUpdateGameBuild();

  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("character");
  const [filterCategory, setFilterCategory] = useState("all");
  const [generating, setGenerating] = useState(false);
  const [generatingBulk, setGeneratingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, label: "" });
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [artStyle, setArtStyle] = useState("pixel_art");
  const [kbTimer, setKbTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [previewAsset, setPreviewAsset] = useState<any | null>(null);
  const [selectedBulk, setSelectedBulk] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("generate");
  const [mainTab, setMainTab] = useState("assets");

  // Game builder state
  const [gameType, setGameType] = useState("platformer");
  const [gameInstructions, setGameInstructions] = useState("");
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [generatingGame, setGeneratingGame] = useState(false);
  const [activeGameCode, setActiveGameCode] = useState<string>("");
  const [activeGameBuildId, setActiveGameBuildId] = useState<string | null>(null);
  const [refinePrompt, setRefinePrompt] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: assets, refetch: refetchAssets } = useGeneratedAssets(id, filterCategory);
  const { data: allAssets } = useGeneratedAssets(id);
  const { data: gameBuilds } = useGameBuilds(id);

  useEffect(() => {
    if (project) {
      setKnowledgeBase(project.knowledge_base || "");
      setArtStyle(project.art_style || "pixel_art");
    }
  }, [project]);

  const saveKnowledgeBase = (value: string) => {
    setKnowledgeBase(value);
    if (kbTimer) clearTimeout(kbTimer);
    const timer = setTimeout(() => {
      if (id) updateProject.mutate({ id, knowledge_base: value });
    }, 1000);
    setKbTimer(timer);
  };

  const handleStyleChange = (value: string) => {
    setArtStyle(value);
    if (id) updateProject.mutate({ id, art_style: value });
  };

  const generateSingle = async (promptText: string, cat: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-asset", {
        body: { project_id: id, prompt: promptText, category: cat },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from("generated_assets").insert({
        project_id: id!,
        user_id: user.id,
        prompt: promptText,
        image_url: data.image_url,
        category: cat,
        file_name: data.file_name || "asset.png",
      });
      return true;
    } catch (e: any) {
      console.error("Generation failed:", e);
      return false;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !id) return;
    setGenerating(true);
    const success = await generateSingle(prompt.trim(), category);
    if (success) {
      toast.success("Asset generated!");
      setPrompt("");
      refetchAssets();
    } else {
      toast.error("Generation failed");
    }
    setGenerating(false);
  };

  const handleBulkGenerate = async () => {
    if (!selectedBulk.length || !id) return;
    const items = BULK_PRESETS.filter(p => selectedBulk.includes(p.id));
    setGeneratingBulk(true);
    setBulkProgress({ current: 0, total: items.length, label: "" });

    let successCount = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setBulkProgress({ current: i + 1, total: items.length, label: item.label });
      const success = await generateSingle(item.prompt, item.category);
      if (success) successCount++;
      refetchAssets();
    }

    setGeneratingBulk(false);
    setSelectedBulk([]);
    setBulkProgress({ current: 0, total: 0, label: "" });
    toast.success(`Generated ${successCount}/${items.length} assets!`);
  };

  const toggleBulkItem = (itemId: string) => {
    setSelectedBulk(prev => prev.includes(itemId) ? prev.filter(x => x !== itemId) : [...prev, itemId]);
  };

  const selectAllBulk = () => {
    if (selectedBulk.length === BULK_PRESETS.length) {
      setSelectedBulk([]);
    } else {
      setSelectedBulk(BULK_PRESETS.map(p => p.id));
    }
  };

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error("Download failed");
    }
  };

  const navigatePreview = (direction: number) => {
    if (!assets || !previewAsset) return;
    const idx = assets.findIndex(a => a.id === previewAsset.id);
    const newIdx = idx + direction;
    if (newIdx >= 0 && newIdx < assets.length) {
      setPreviewAsset(assets[newIdx]);
    }
  };

  const toggleAssetForGame = (assetId: string) => {
    setSelectedAssetIds(prev => prev.includes(assetId) ? prev.filter(x => x !== assetId) : [...prev, assetId]);
  };

  const selectAllAssetsForGame = () => {
    if (!allAssets) return;
    if (selectedAssetIds.length === allAssets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(allAssets.map(a => a.id));
    }
  };

  const handleGenerateGame = async () => {
    if (!id) return;
    setGeneratingGame(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-game", {
        body: {
          project_id: id,
          asset_ids: selectedAssetIds,
          game_type: gameType,
          instructions: gameInstructions,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const gameCode = data.game_code;
      setActiveGameCode(gameCode);

      const build = await createGameBuild.mutateAsync({
        project_id: id,
        game_type: gameType,
        instructions: gameInstructions,
        game_code: gameCode,
        asset_ids: selectedAssetIds,
      });
      setActiveGameBuildId(build.id);
      toast.success("Game generated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate game");
    }
    setGeneratingGame(false);
  };

  const handleRefineGame = async () => {
    if (!id || !refinePrompt.trim() || !activeGameCode) return;
    setGeneratingGame(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-game", {
        body: {
          project_id: id,
          asset_ids: selectedAssetIds,
          game_type: gameType,
          instructions: refinePrompt,
          previous_code: activeGameCode,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const gameCode = data.game_code;
      setActiveGameCode(gameCode);
      setRefinePrompt("");

      if (activeGameBuildId) {
        await updateGameBuild.mutateAsync({ id: activeGameBuildId, game_code: gameCode, instructions: refinePrompt });
      }
      toast.success("Game updated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to refine game");
    }
    setGeneratingGame(false);
  };

  const handleDownloadGame = () => {
    if (!activeGameCode) return;
    const blob = new Blob([activeGameCode], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${project?.name || "game"}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      iframeRef.current.requestFullscreen?.();
    }
  };

  const loadGameBuild = (build: any) => {
    setActiveGameCode(build.game_code);
    setActiveGameBuildId(build.id);
    setGameType(build.game_type);
  };

  if (projLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HorizontalNav />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <HorizontalNav />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Project not found</p>
          <Button variant="link" onClick={() => navigate("/assets")}>Back to projects</Button>
        </div>
      </div>
    );
  }

  const previewIndex = assets?.findIndex(a => a.id === previewAsset?.id) ?? -1;

  const GAME_TYPES = [
    { value: "platformer", label: "Platformer" },
    { value: "topdown_rpg", label: "Top-down RPG" },
    { value: "puzzle", label: "Tile-based Puzzle" },
    { value: "visual_novel", label: "Visual Novel" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <HorizontalNav />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/assets")}>
            <ArrowLeft className="mr-2 h-4 w-4" />Back to Projects
          </Button>
          <div className="flex gap-2">
            <Button
              variant={mainTab === "assets" ? "default" : "outline"}
              size="sm"
              onClick={() => setMainTab("assets")}
            >
              <ImageIcon className="mr-2 h-4 w-4" />Assets
            </Button>
            <Button
              variant={mainTab === "game" ? "default" : "outline"}
              size="sm"
              onClick={() => setMainTab("game")}
            >
              <Gamepad2 className="mr-2 h-4 w-4" />Build Game
            </Button>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-6">{project.name}</h1>

        {mainTab === "assets" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="generate" className="flex-1 text-xs">Single</TabsTrigger>
                <TabsTrigger value="bulk" className="flex-1 text-xs">Bulk</TabsTrigger>
                <TabsTrigger value="settings" className="flex-1 text-xs">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="generate" className="space-y-4 mt-4">
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(c => c.value !== "all").map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Describe the asset you want</Label>
                  <Textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="e.g. A knight character with sword and shield, front-facing idle pose"
                    className="min-h-[100px]"
                  />
                </div>
                <Button onClick={handleGenerate} disabled={generating || !prompt.trim()} className="w-full">
                  {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : <><Sparkles className="mr-2 h-4 w-4" />Generate Asset</>}
                </Button>
              </TabsContent>

              <TabsContent value="bulk" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Select assets to generate</Label>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAllBulk}>
                    {selectedBulk.length === BULK_PRESETS.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>

                <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                  {["character", "weapon", "item", "environment", "ui"].map(cat => {
                    const items = BULK_PRESETS.filter(p => p.category === cat);
                    return (
                      <div key={cat} className="mb-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 px-1">{cat}</p>
                        {items.map(item => (
                          <label key={item.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer">
                            <Checkbox
                              checked={selectedBulk.includes(item.id)}
                              onCheckedChange={() => toggleBulkItem(item.id)}
                            />
                            <span className="text-xs">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {generatingBulk && (
                  <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs">Generating {bulkProgress.current}/{bulkProgress.total}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{bulkProgress.label}</p>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }} />
                    </div>
                  </div>
                )}

                <Button onClick={handleBulkGenerate} disabled={generatingBulk || !selectedBulk.length} className="w-full">
                  {generatingBulk
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                    : <><Zap className="mr-2 h-4 w-4" />Generate {selectedBulk.length} Assets</>
                  }
                </Button>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <div>
                  <Label className="text-xs">Art Style</Label>
                  <Select value={artStyle} onValueChange={handleStyleChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ART_STYLES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Knowledge Base</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">Describe your game's theme, characters, world — the AI uses this context for every generation</p>
                  <Textarea
                    value={knowledgeBase}
                    onChange={e => saveKnowledgeBase(e.target.value)}
                    placeholder="e.g. A medieval fantasy dungeon crawler with pixel art characters..."
                    className="min-h-[200px]"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Gallery */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {CATEGORIES.map(c => (
                <Button
                  key={c.value}
                  variant={filterCategory === c.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterCategory(c.value)}
                  className="text-xs"
                >
                  {c.label}
                </Button>
              ))}
            </div>

            {!assets?.length ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-1">No assets yet</h3>
                  <p className="text-sm text-muted-foreground">Generate your first asset using the panel on the left</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {assets.map(asset => (
                  <Card key={asset.id} className="overflow-hidden group cursor-pointer" onClick={() => setPreviewAsset(asset)}>
                    <div className="relative aspect-square bg-muted/30 checkerboard-bg">
                      <img
                        src={asset.image_url}
                        alt={asset.prompt}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={e => { e.stopPropagation(); handleDownload(asset.image_url, asset.file_name); }}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={e => { e.stopPropagation(); deleteAsset.mutate(asset.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground line-clamp-2">{asset.prompt}</p>
                      <span className="text-[10px] capitalize text-primary/70 mt-1 inline-block">{asset.category}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        ) : (
        /* Game Builder Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Settings Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <Label className="text-xs">Game Type</Label>
              <Select value={gameType} onValueChange={setGameType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GAME_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Game Instructions (optional)</Label>
              <Textarea
                value={gameInstructions}
                onChange={e => setGameInstructions(e.target.value)}
                placeholder="e.g. Make a 3-level platformer where the player collects coins and fights enemies..."
                className="min-h-[100px]"
              />
            </div>

            {/* Asset Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Select Assets for Game</Label>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAllAssetsForGame}>
                  {allAssets && selectedAssetIds.length === allAssets.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="space-y-1 max-h-[250px] overflow-y-auto pr-1 border rounded-md p-2">
                {!allAssets?.length ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No assets yet. Generate some in the Assets tab first!</p>
                ) : (
                  allAssets.map(asset => (
                    <label key={asset.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer">
                      <Checkbox
                        checked={selectedAssetIds.includes(asset.id)}
                        onCheckedChange={() => toggleAssetForGame(asset.id)}
                      />
                      <img src={asset.image_url} alt="" className="w-8 h-8 object-contain rounded" />
                      <span className="text-xs truncate flex-1">{asset.prompt}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <Button onClick={handleGenerateGame} disabled={generatingGame} className="w-full">
              {generatingGame ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Game...</> : <><Gamepad2 className="mr-2 h-4 w-4" />Generate Game</>}
            </Button>

            {/* Previous Builds */}
            {gameBuilds && gameBuilds.length > 0 && (
              <div>
                <Label className="text-xs">Previous Builds</Label>
                <div className="space-y-1 max-h-[150px] overflow-y-auto mt-1">
                  {gameBuilds.map((build: any) => (
                    <button
                      key={build.id}
                      onClick={() => loadGameBuild(build)}
                      className={`w-full text-left px-3 py-2 rounded text-xs hover:bg-muted/50 transition-colors ${activeGameBuildId === build.id ? 'bg-primary/10 border border-primary/30' : 'bg-muted/20'}`}
                    >
                      <span className="capitalize font-medium">{build.game_type.replace("_", " ")}</span>
                      <span className="text-muted-foreground ml-2">{new Date(build.created_at).toLocaleDateString()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Game Preview */}
          <div className="lg:col-span-2">
            {!activeGameCode ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <Gamepad2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-1">No game yet</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Select your assets, pick a game type, and click "Generate Game" to create a playable HTML5 game using AI
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Game iframe */}
                <div className="relative border rounded-lg overflow-hidden bg-black" style={{ height: "500px" }}>
                  <iframe
                    ref={iframeRef}
                    srcDoc={activeGameCode}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                    title="Game Preview"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleFullscreen} title="Fullscreen">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleDownloadGame} title="Download HTML">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Refinement */}
                <div className="flex gap-2">
                  <Textarea
                    value={refinePrompt}
                    onChange={e => setRefinePrompt(e.target.value)}
                    placeholder="Tweak your game... e.g. 'Make the character jump higher' or 'Add a second level'"
                    className="min-h-[60px] flex-1"
                  />
                  <Button onClick={handleRefineGame} disabled={generatingGame || !refinePrompt.trim()} className="self-end">
                    {generatingGame ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDownloadGame}>
                    <Download className="mr-2 h-4 w-4" />Download as HTML
                  </Button>
                  <Button variant="outline" onClick={handleFullscreen}>
                    <Maximize2 className="mr-2 h-4 w-4" />Play Fullscreen
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Full-screen preview modal */}
      <Dialog open={!!previewAsset} onOpenChange={open => { if (!open) setPreviewAsset(null); }}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-background/95 backdrop-blur-sm border-border/50 overflow-hidden">
          <div className="flex flex-col h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{previewAsset?.prompt}</p>
                <p className="text-xs text-muted-foreground capitalize">{previewAsset?.category}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button size="sm" variant="outline" onClick={() => previewAsset && handleDownload(previewAsset.image_url, previewAsset.file_name)}>
                  <Download className="mr-2 h-3 w-3" />Download PNG
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPreviewAsset(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center p-8 relative">
              {/* Navigation arrows */}
              {assets && previewIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-muted/80"
                  onClick={() => navigatePreview(-1)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              {assets && previewIndex < assets.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-muted/80"
                  onClick={() => navigatePreview(1)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              )}

              <img
                src={previewAsset?.image_url}
                alt={previewAsset?.prompt}
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{ imageRendering: artStyle === "pixel_art" ? "pixelated" : "auto" }}
              />
            </div>

            {/* Footer with counter */}
            {assets && (
              <div className="text-center pb-4">
                <span className="text-xs text-muted-foreground">{previewIndex + 1} / {assets.length}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
