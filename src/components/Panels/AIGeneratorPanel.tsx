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
    { id: "generate-image", label: "Generate Image", description: "Generate image using AI, then create poster" },
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
      <div className="w-[380px] bg-[#1a1a1a] text-white rounded-lg">
        {/* Header Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/10">
            <TabsList className="grid w-fit grid-cols-2 bg-transparent gap-4 p-0">
              <TabsTrigger 
                value="generator"
                className="text-sm data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=inactive]:text-gray-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-0 pb-2"
              >
                Description
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="text-sm data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=inactive]:text-gray-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-0 pb-2"
              >
                Past Conversations
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="generator" className="p-4 space-y-4 mt-0 bg-[#1a1a1a]">
            {/* Model Selector - At the top */}
            <div>
              <Label className="text-xs mb-2 block text-gray-400">AI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-full h-9 text-xs bg-[#2a2a2a] border-white/10 text-white">
                  <SelectValue placeholder="Select AI Model" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-white/10 z-50">
                  <SelectGroup>
                    <SelectLabel className="text-gray-400">Claude (Anthropic)</SelectLabel>
                    <SelectItem value="claude-sonnet-4-5" className="text-white hover:bg-white/10">
                      Claude Sonnet 4.5 (Recommended)
                    </SelectItem>
                    <SelectItem value="claude-opus-4-1" className="text-white hover:bg-white/10">
                      Claude Opus 4.1 (Most Powerful)
                    </SelectItem>
                  </SelectGroup>
                  <SelectSeparator className="bg-white/10" />
                  <SelectGroup>
                    <SelectLabel className="text-gray-400">GPT-5 Series (OpenAI)</SelectLabel>
                    <SelectItem value="gpt-5" className="text-white hover:bg-white/10">GPT-5 (Flagship)</SelectItem>
                    <SelectItem value="gpt-5-mini" className="text-white hover:bg-white/10">GPT-5 Mini (Fast & Efficient)</SelectItem>
                    <SelectItem value="gpt-5-nano" className="text-white hover:bg-white/10">GPT-5 Nano (Fastest)</SelectItem>
                  </SelectGroup>
                  <SelectSeparator className="bg-white/10" />
                  <SelectGroup>
                    <SelectLabel className="text-gray-400">O-Series (Reasoning Models)</SelectLabel>
                    <SelectItem value="o3" className="text-white hover:bg-white/10">O3 (Deep Reasoning)</SelectItem>
                    <SelectItem value="o4-mini" className="text-white hover:bg-white/10">O4 Mini (Fast Reasoning)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Description Section */}
            <div className="space-y-3">
              <Label className="text-xs text-gray-400">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ask Drawtir to create..."
                className="min-h-[80px] text-sm resize-none bg-black border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-white/20"
              />
              
              {/* Upload Image & Generate Button Row */}
              <div className="flex gap-2">
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
                
                <label
                  htmlFor="ai-image-upload"
                  className="flex items-center justify-center gap-2 px-4 h-9 bg-transparent border border-white/20 rounded-md cursor-pointer hover:bg-white/5 transition-colors text-sm text-white whitespace-nowrap"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Image</span>
                </label>

                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !description.trim()} 
                  className="h-9 px-6 text-sm bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? (
                    <span className="truncate">{generationProgress || "Generating..."}</span>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>
            </div>

            {/* Uploaded Images Preview */}
            {captionImage && captionImage.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {captionImage.map((img, idx) => (
                  <div key={idx} className="relative bg-[#2a2a2a] rounded border border-white/10">
                    <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-20 object-cover rounded" />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
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

            {/* Generation Preferences */}
            <div>
              <Label className="text-xs mb-2 block text-gray-400">Generation Preferences</Label>
              <div className="flex flex-wrap gap-2">
                {generationTypes.map((type) => (
                  <Button
                    key={type.id}
                    variant={selectedGenerationType === type.id ? "default" : "outline"}
                    size="sm"
                    className={`h-8 text-xs rounded-full transition-colors ${
                      selectedGenerationType === type.id
                        ? "bg-blue-600 hover:bg-blue-700 text-white border-0"
                        : "bg-[#2a2a2a] hover:bg-[#333] text-gray-300 border-white/10"
                    } ${type.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={type.disabled}
                    onClick={() => !type.disabled && setSelectedGenerationType(type.id)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-2">
                Select Multiple to produce multi-modal agents
              </p>
            </div>

            {/* Progress indicator */}
            {isGenerating && generationProgress && (
              <div className="text-xs text-gray-400 mt-2 p-3 bg-[#2a2a2a] rounded-md border border-white/10">
                {generationProgress}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="p-4 mt-0">
            <ScrollArea className="h-[500px]">
              {isLoadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-gray-400">Loading...</div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-10 w-10 text-gray-600 mb-3" />
                  <p className="text-sm text-gray-400">No past conversations yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Generate designs to see them here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="p-3 bg-[#2a2a2a] border border-white/10 rounded-lg hover:bg-[#333] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-white truncate">{conv.title}</span>
                          </div>
                          {conv.description && (
                            <p className="text-xs text-gray-400 line-clamp-2 mb-1">
                              {conv.description}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-500">
                            {formatDate(conv.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs bg-transparent border-white/10 text-white hover:bg-white/5"
                          onClick={() => handleRestore(conv)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/5"
                          onClick={() => {
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