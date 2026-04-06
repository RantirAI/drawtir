import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import HorizontalNav from "@/components/Navigation/HorizontalNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Trash2, Sparkles, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAssetProject, useGeneratedAssets, useUpdateAssetProject, useDeleteAsset } from "@/hooks/useAssetProject";

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

export default function AssetProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading: projLoading } = useAssetProject(id);
  const updateProject = useUpdateAssetProject();
  const deleteAsset = useDeleteAsset();

  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("character");
  const [filterCategory, setFilterCategory] = useState("all");
  const [generating, setGenerating] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [artStyle, setArtStyle] = useState("pixel_art");
  const [kbTimer, setKbTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { data: assets, refetch: refetchAssets } = useGeneratedAssets(id, filterCategory);

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

  const handleGenerate = async () => {
    if (!prompt.trim() || !id) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-asset", {
        body: { project_id: id, prompt: prompt.trim(), category },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from("generated_assets").insert({
        project_id: id,
        user_id: user.id,
        prompt: prompt.trim(),
        image_url: data.image_url,
        category,
        file_name: data.file_name || "asset.png",
      });

      toast.success("Asset generated!");
      setPrompt("");
      refetchAssets();
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setGenerating(false);
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

  return (
    <div className="min-h-screen bg-background">
      <HorizontalNav />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/assets")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />Back to Projects
        </Button>

        <h1 className="text-2xl font-bold mb-6">{project.name}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Tabs defaultValue="generate" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="generate" className="flex-1">Generate</TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
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
                  <p className="text-[10px] text-muted-foreground mb-1">Describe your game's theme, characters, world — the AI will use this context</p>
                  <Textarea
                    value={knowledgeBase}
                    onChange={e => saveKnowledgeBase(e.target.value)}
                    placeholder="e.g. A medieval fantasy dungeon crawler with pixel art characters. The color palette is dark with neon accents..."
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
                  <Card key={asset.id} className="overflow-hidden group">
                    <div className="relative aspect-square bg-muted/50">
                      <img
                        src={asset.image_url}
                        alt={asset.prompt}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => handleDownload(asset.image_url, asset.file_name)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => deleteAsset.mutate(asset.id)}>
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
      </div>
    </div>
  );
}
