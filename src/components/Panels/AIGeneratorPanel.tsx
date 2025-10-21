import { useState, useRef, useEffect } from "react";
import { Sparkles, Upload, Clock, RotateCcw, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import DraggablePanel from "./DraggablePanel";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Frame } from "@/types/elements";
import type { CanvasSnapshot } from "@/types/snapshot";

interface AIGeneratorPanelProps {
  projectId: string | null;
  currentSnapshot: CanvasSnapshot;
  description: string;
  setDescription: (desc: string) => void;
  captionImage: string[];
  setCaptionImage: (img: string[]) => void;
  isGenerating: boolean;
  generationProgress: string;
  captionImageInputRef: React.RefObject<HTMLInputElement>;
  onGenerate: (generationType: string, model: string) => Promise<void>;
  onRestoreConversation: (snapshot: CanvasSnapshot) => void;
  onClose: () => void;
}

interface Conversation {
  id: string;
  title: string;
  description: string;
  generation_type: string;
  output_snapshot: CanvasSnapshot;
  created_at: string;
}

export default function AIGeneratorPanel({
  projectId,
  currentSnapshot,
  description,
  setDescription,
  captionImage = [], // Default to empty array
  setCaptionImage,
  isGenerating,
  generationProgress,
  captionImageInputRef,
  onGenerate,
  onRestoreConversation,
  onClose,
}: AIGeneratorPanelProps) {
  const [activeTab, setActiveTab] = useState("generator");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedGenerationType, setSelectedGenerationType] = useState("freeform");
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('ai-poster-model') || 'claude-sonnet-4-5';
  });

  // Save model preference
  useEffect(() => {
    localStorage.setItem('ai-poster-model', selectedModel);
  }, [selectedModel]);

  const generationTypes = [
    { id: "freeform", label: "Freeform Creation" },
    { id: "generate-image", label: "Generate Image" },
    { id: "replicate", label: "Replicate" },
    { id: "import-website", label: "Import a Website", disabled: true },
    { id: "auto-layout", label: "Auto Layout", disabled: true },
    { id: "import-figma", label: "Import Figma", disabled: true },
    { id: "multiple-frames", label: "Multiple Frames", disabled: true },
    { id: "generate-video", label: "Generate a Video", disabled: true },
    { id: "notes", label: "Notes", disabled: true },
  ];

  const loadConversations = async () => {
    if (!projectId) return;
    
    setIsLoadingConversations(true);
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConversations((data || []).map(d => ({
        ...d,
        output_snapshot: d.output_snapshot as unknown as CanvasSnapshot
      })));
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversation history');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      loadConversations();
    }
  }, [activeTab, projectId]);

  const handleGenerate = async () => {
    await onGenerate(selectedGenerationType, selectedModel);
    // Reload conversations after generation
    if (projectId) {
      loadConversations();
    }
  };

  const handleRestore = (conversation: Conversation) => {
    onRestoreConversation(conversation.output_snapshot);
    toast.success(`Restored: ${conversation.title}`);
    setActiveTab("generator");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <DraggablePanel
      title="AI Generator"
      defaultPosition={{ x: 50, y: 150 }}
      onClose={onClose}
    >
      <div className="w-80">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="generator">Description</TabsTrigger>
            <TabsTrigger value="history">Past Conversations</TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-3">
            {/* Description Input */}
            <div>
              <Label className="text-xs mb-1 block">Ask Drawtir to create...</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Create a vibrant summer music festival poster... or replicate this design..."
                className="h-20 text-xs resize-none"
              />
            </div>

            {/* Model Selector */}
            <div>
              <Label className="text-xs mb-1 block">AI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Select AI Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Claude (Anthropic)</SelectLabel>
                    <SelectItem value="claude-sonnet-4-5">
                      Claude Sonnet 4.5 (Recommended)
                    </SelectItem>
                    <SelectItem value="claude-opus-4-1">
                      Claude Opus 4.1 (Most Powerful)
                    </SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>GPT-5 Series (OpenAI)</SelectLabel>
                    <SelectItem value="gpt-5">GPT-5 (Flagship)</SelectItem>
                    <SelectItem value="gpt-5-mini">GPT-5 Mini (Fast & Efficient)</SelectItem>
                    <SelectItem value="gpt-5-nano">GPT-5 Nano (Fastest)</SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>O-Series (Reasoning Models)</SelectLabel>
                    <SelectItem value="o3">O3 (Deep Reasoning)</SelectItem>
                    <SelectItem value="o4-mini">O4 Mini (Fast Reasoning)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Choose model based on speed/quality needs
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <Label className="text-xs mb-1 block">Reference Images (Optional)</Label>
              <input
                type="file"
                accept="image/*"
                multiple
                ref={captionImageInputRef}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  
                  // Check file sizes
                  const oversizedFiles = files.filter(f => f.size > 10 * 1024 * 1024);
                  if (oversizedFiles.length > 0) {
                    toast.error("All images must be less than 10MB");
                    return;
                  }
                  
                  // Read all files
                  Promise.all(
                    files.map(file => {
                      return new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                      });
                    })
                  ).then(results => {
                    setCaptionImage([...(captionImage || []), ...results]);
                    toast.success(`${files.length} image(s) uploaded!`);
                  });
                }}
                className="hidden"
                id="ai-image-upload"
              />
              
              {captionImage && captionImage.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {captionImage.map((img, idx) => (
                    <div key={idx} className="relative bg-secondary/30 rounded border">
                      <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-24 object-contain rounded p-1" />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-0 right-0 h-5 w-5 p-0 bg-background/80"
                        onClick={(e) => {
                          e.preventDefault();
                          setCaptionImage(captionImage.filter((_, i) => i !== idx));
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <label
                htmlFor="ai-image-upload"
                className="flex items-center justify-center gap-2 px-3 py-2 border rounded cursor-pointer hover:bg-secondary transition-colors text-xs"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{captionImage && captionImage.length > 0 ? `Add more images (${captionImage.length})` : 'Upload images'}</span>
              </label>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !description.trim()} 
              className="w-full h-9 text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              {isGenerating ? (
                <span className="truncate">{generationProgress || "Generating..."}</span>
              ) : (
                "Generate"
              )}
            </Button>

            {/* Generation Preferences */}
            <div>
              <Label className="text-xs mb-2 block">Generation Preferences</Label>
              <div className="flex flex-wrap gap-1.5">
                {generationTypes.map((type) => (
                  <Button
                    key={type.id}
                    variant={selectedGenerationType === type.id ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    disabled={type.disabled}
                    onClick={() => !type.disabled && setSelectedGenerationType(type.id)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Select Multiple to produce multi-modal agents
              </p>
            </div>

            {/* Progress indicator */}
            {isGenerating && generationProgress && (
              <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2 break-words">
                {generationProgress}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <ScrollArea className="h-[400px]">
              {isLoadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-xs text-muted-foreground">Loading...</div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">No past conversations yet</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Generate designs to see them here
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="p-3 border rounded-lg hover:bg-secondary/50 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                            <span className="text-xs font-medium truncate">{conv.title}</span>
                          </div>
                          {conv.description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mb-1">
                              {conv.description}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground">
                            {formatDate(conv.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs"
                          onClick={() => handleRestore(conv)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            // Preview functionality - could show a modal
                            toast.info("Preview feature coming soon!");
                          }}
                        >
                          <Code className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </DraggablePanel>
  );
}