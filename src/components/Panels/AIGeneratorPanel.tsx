import { useState, useRef, useEffect } from "react";
import { Sparkles, Upload, Clock, RotateCcw, Code, Plus, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import DraggablePanel from "./DraggablePanel";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Frame } from "@/types/elements";
import type { CanvasSnapshot } from "@/types/snapshot";
import { useBrandKit } from "@/hooks/useBrandKit";

interface AIGeneratorPanelProps {
  projectId: string | null;
  currentSnapshot: CanvasSnapshot;
  frames: Frame[];
  selectedFrameId: string;
  onFrameSelect: (frameId: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  captionImage: string[];
  setCaptionImage: (img: string[]) => void;
  isGenerating: boolean;
  generationProgress: string;
  captionImageInputRef: React.RefObject<HTMLInputElement>;
  onGenerate: (generationTypes: string[], model: string, brandKitData?: { colors: string[], fonts: string[], logos: string[] }, conversationHistory?: ChatMessage[], targetFrameId?: string, frameCount?: number) => Promise<void>;
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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIGeneratorPanel({
  projectId,
  currentSnapshot,
  frames,
  selectedFrameId,
  onFrameSelect,
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
  const { brandKits, activeBrandKit } = useBrandKit();
  const [activeTab, setActiveTab] = useState("generator");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedGenerationTypes, setSelectedGenerationTypes] = useState<string[]>(["freeform"]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    const supportedModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'];
    const storedModel = localStorage.getItem('ai-poster-model');
    return storedModel && supportedModels.includes(storedModel) ? storedModel : 'gemini-2.5-flash';
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [targetFrameMode, setTargetFrameMode] = useState<string | null>(null); // null = general mode, frameId = specific frame mode

  // Set targetFrameMode when panel opens with a selected frame (optional - user can detach)
  useEffect(() => {
    // Only auto-set on first open if there's a selected frame
    if (selectedFrameId && !targetFrameMode && frames.length > 1) {
      setTargetFrameMode(selectedFrameId);
    }
  }, []); // Only run on mount

  // Save model preference
  useEffect(() => {
    localStorage.setItem('ai-poster-model', selectedModel);
  }, [selectedModel]);

  const generationTypes = [
    { id: "freeform", label: "Freeform Creation" },
    { id: "search-unsplash", label: "Search Unsplash", description: "Find real photos from Unsplash to use in poster" },
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
    if (activeTab === "history" || activeTab === "generator") {
      loadConversations();
    }
  }, [activeTab, projectId]);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: description,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    // Get brand kit data if available
    const brandKitData = activeBrandKit ? {
      colors: activeBrandKit.colors,
      fonts: activeBrandKit.fonts,
      logos: activeBrandKit.logo_urls
    } : undefined;
    
    // Smart frame count detection (only when NOT in target frame mode)
    const lowerPrompt = description.toLowerCase();
    
    let frameCount = 1;
    let wantsMultipleFrames = false;
    
    // Only detect multi-frame intent if we're in general mode (not targeting a specific frame)
    if (!targetFrameMode) {
      // Detect explicit numbers (e.g., "3 posters", "create 5 frames")
      const numberMatch = lowerPrompt.match(/\b(\d+)\s+(posters?|frames?)\b/) || 
                         lowerPrompt.match(/\b(create|generate|make)\s+(\d+)\b/);
      
      // Detect word numbers (e.g., "three posters", "five frames")
      const wordNumbers: Record<string, number> = {
        'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6,
        'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
      };
      
      if (numberMatch && numberMatch[1]) {
        frameCount = parseInt(numberMatch[1]) || parseInt(numberMatch[2]) || 1;
        wantsMultipleFrames = frameCount > 1;
      } else {
        // Check for word numbers
        for (const [word, num] of Object.entries(wordNumbers)) {
          if (lowerPrompt.includes(word + ' poster') || lowerPrompt.includes(word + ' frame')) {
            frameCount = num;
            wantsMultipleFrames = true;
            break;
          }
        }
      }
      
      // Fallback: check for keywords without explicit count
      if (!wantsMultipleFrames) {
        const multiFrameKeywords = ['posters', 'multiple', 'frames', 'series', 'several', 'few', 'variety'];
        wantsMultipleFrames = multiFrameKeywords.some(keyword => lowerPrompt.includes(keyword));
        if (wantsMultipleFrames) {
          frameCount = 3; // Default to 3 frames when no specific number is given
        }
      }
    }
    
    // Show toast with frame count before generation
    if (wantsMultipleFrames) {
      toast.info(`Creating ${frameCount} poster frames...`, {
        description: "The AI will generate multiple distinct posters for you",
        duration: 4000,
      });
    } else if (targetFrameMode) {
      const targetFrame = frames.find(f => f.id === targetFrameMode);
      toast.info(`Updating ${targetFrame?.name || 'selected frame'}...`, {
        description: "AI will modify only this specific frame",
        duration: 3000,
      });
    }
    
    // Pass all selected generation types, conversation history, and frame count
    // Use targetFrameMode if set, otherwise use multi-frame logic
    await onGenerate(
      selectedGenerationTypes, 
      selectedModel, 
      brandKitData, 
      [...chatMessages, userMessage], 
      targetFrameMode || (wantsMultipleFrames ? undefined : selectedFrameId),
      wantsMultipleFrames ? frameCount : undefined
    );
    
    // Add AI response to chat
    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: `I've ${chatMessages.length === 0 ? 'created' : 'updated'} the design based on your request.`,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, aiMessage]);
    
    // Clear the input
    setDescription("");
    
    // Reload conversations after generation
    if (projectId) {
      loadConversations();
    }
  };

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const toggleGenerationType = (typeId: string) => {
    if (typeId === "freeform") {
      // Freeform is always selected
      return;
    }
    
    setSelectedGenerationTypes(prev => {
      if (prev.includes(typeId)) {
        // Remove if already selected (but keep at least freeform)
        const filtered = prev.filter(t => t !== typeId);
        return filtered.length === 0 ? ["freeform"] : filtered;
      } else {
        // Add to selection
        return [...prev, typeId];
      }
    });
  };

  const handleRestore = (conversation: Conversation) => {
    onRestoreConversation(conversation.output_snapshot);
    toast.success(`Restored: ${conversation.title}`);
    setActiveTab("generator");
  };

  const handleMakeEditable = async (imageUrl: string) => {
    try {
      setIsLoadingConversations(true);
      toast("Analyzing image...", {
        description: "Converting AI-generated poster to editable elements",
      });

      const { data, error } = await supabase.functions.invoke('analyze-image-structure', {
        body: { imageUrl }
      });

      if (error) throw error;

      // Convert the analyzed structure into canvas elements
      const { frame: frameData, elements } = data;
      
      const newFrame: Frame = {
        id: `frame-${Date.now()}`,
        name: "Editable Poster",
        x: 100,
        y: 100,
        width: frameData.width,
        height: frameData.height,
        backgroundColor: frameData.backgroundColor,
        elements: elements.map((el: any, idx: number) => {
          const baseElement = {
            id: `element-${Date.now()}-${idx}`,
            type: el.type as any,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            opacity: el.opacity || 1,
          };

          if (el.type === 'text') {
            return {
              ...baseElement,
              text: el.content,
              fontSize: el.fontSize || 16,
              fontWeight: el.fontWeight || 'normal',
              color: el.color || '#000000',
              textAlign: el.textAlign || 'left',
            };
          } else if (el.type === 'shape') {
            return {
              ...baseElement,
              shapeType: el.shapeType || 'rectangle',
              fill: el.fill || el.backgroundColor || '#cccccc',
              fillType: 'solid' as const,
            };
          }

          return baseElement;
        }),
      };

      // Add the new editable frame to the canvas
      const updatedSnapshot = {
        ...currentSnapshot,
        frames: [...currentSnapshot.frames, newFrame],
      };
      
      onRestoreConversation(updatedSnapshot);

      toast.success("Success!", {
        description: "Poster converted to editable elements. You can now move and edit each element!",
      });
      setActiveTab("generator");
    } catch (error) {
      console.error('Error making editable:', error);
      toast.error("Conversion failed", {
        description: "Failed to convert image to editable elements",
      });
    } finally {
      setIsLoadingConversations(false);
    }
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
      defaultPosition={{ x: 120, y: 150 }}
      onClose={onClose}
    >
      <div className="w-[380px] bg-background border border-border rounded-lg">
        {/* Header Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border">
            <TabsList className="grid w-fit grid-cols-2 bg-transparent gap-4 p-0">
              <TabsTrigger 
                value="generator"
                className="text-sm data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2"
              >
                Description
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="text-sm data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2"
              >
                History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="generator" className="p-3 space-y-3 mt-0">
            {/* Target Frame Mode Indicator & Controls */}
            {targetFrameMode ? (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <Label className="text-xs font-medium text-primary">
                      Editing: {frames.find(f => f.id === targetFrameMode)?.name || 'Frame'}
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTargetFrameMode(null);
                      toast.success("Switched to general mode");
                    }}
                    className="h-7 px-2 text-xs hover:bg-primary/20"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Detach
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  AI will modify only this specific frame. Click "Detach" to create new frames or make general prompts.
                </p>
              </div>
            ) : (
              <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Mode: General</Label>
                  {frames.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTargetFrameMode(selectedFrameId);
                        toast.info(`Now targeting: ${frames.find(f => f.id === selectedFrameId)?.name}`);
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      Target Frame
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Create new frames or use keywords like "3 posters" to generate multiple frames at once.
                </p>
              </div>
            )}

            {/* Chat Messages */}
            {chatMessages.length > 0 && (
              <ScrollArea className="h-[200px] bg-muted/30 border border-border rounded-lg p-3">
                <div className="space-y-3">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background border border-border'
                        }`}
                      >
                        <p className="text-xs opacity-70 mb-1">
                          {msg.role === 'user' ? 'You' : 'AI'}
                        </p>
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
            )}

            {/* Description Section */}
            <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
              {/* Description Label and AI Model Selector Row */}
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-[200px] h-8 text-xs bg-background border-border">
                    <SelectValue placeholder="Select AI Model" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    <SelectGroup>
                      <SelectLabel className="text-muted-foreground">Lovable AI (Google Gemini)</SelectLabel>
                      <SelectItem value="gemini-2.5-flash">
                        Gemini 2.5 Flash (Recommended) 
                      </SelectItem>
                      <SelectItem value="gemini-2.5-pro">
                        Gemini 2.5 Pro (Most Capable)
                      </SelectItem>
                      <SelectItem value="gemini-2.5-flash-lite">
                        Gemini 2.5 Flash Lite (Fastest)
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder={chatMessages.length === 0 ? "Describe what you want to create..." : "Tell me what to change or add..."}
                className="min-h-[80px] text-sm resize-none bg-background border-border placeholder:text-muted-foreground"
              />
              
              {/* Upload Image & Generate Button Row */}
              <div className="flex gap-2 justify-between">
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
                  className="flex items-center justify-center gap-2 px-3 h-8 bg-transparent border border-dashed border-border rounded-md cursor-pointer hover:bg-muted transition-colors text-xs"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Image</span>
                </label>

                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !description.trim()} 
                  className="h-8 px-4 text-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  {isGenerating ? (
                    <span className="truncate">{generationProgress || "Generating..."}</span>
                  ) : (
                    chatMessages.length === 0 ? "Generate" : "Update"
                  )}
                </Button>
              </div>

              {/* New Conversation Button */}
              {chatMessages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setChatMessages([]);
                    setDescription("");
                    toast.success("Started new conversation");
                  }}
                  className="w-full h-8 text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  New Conversation
                </Button>
              )}
            </div>

            {/* Context Indicator */}
            {chatMessages.length > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 text-xs text-center">
                <span className="text-primary font-medium">
                  💬 {chatMessages.length} message{chatMessages.length !== 1 ? 's' : ''} in conversation
                </span>
                <p className="text-muted-foreground mt-0.5">AI will build on your existing design</p>
              </div>
            )}

            {/* Uploaded Images Preview */}
            {captionImage && captionImage.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5">
                {captionImage.map((img, idx) => (
                  <div key={idx} className="relative bg-muted rounded border border-border">
                    <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-16 object-cover rounded" />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full"
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

            {/* Brand Kit Selection - Compact */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Brand Kit</Label>
              
              {activeBrandKit ? (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="brandkit" className="border rounded-lg border-primary bg-primary/10">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="text-sm font-medium">{activeBrandKit.name}</div>
                      </div>
                      <div className="flex items-center gap-3 mr-2 text-[10px] text-muted-foreground">
                        {activeBrandKit.colors.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span>Colors</span>
                            <div className="flex gap-0.5">
                              {activeBrandKit.colors.slice(0, 3).map((color, idx) => (
                                <div
                                  key={idx}
                                  className="w-3 h-3 rounded-sm border border-border/50"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                              {activeBrandKit.colors.length > 3 && (
                                <span className="text-[10px]">+{activeBrandKit.colors.length - 3}</span>
                              )}
                            </div>
                          </div>
                        )}
                        {activeBrandKit.fonts.length > 0 && (
                          <span>Fonts</span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 pt-1">
                      {/* Colors */}
                      {activeBrandKit.colors.length > 0 && (
                        <div className="space-y-1.5 mb-2">
                          <div className="text-xs text-muted-foreground">Colors</div>
                          <div className="flex gap-1 flex-wrap">
                            {activeBrandKit.colors.map((color, idx) => (
                              <div
                                key={idx}
                                className="w-7 h-7 rounded border border-border"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Fonts */}
                      {activeBrandKit.fonts.length > 0 && (
                        <div className="space-y-1.5 mt-2">
                          <div className="text-xs text-muted-foreground">Fonts</div>
                          <div className="flex gap-1.5 flex-wrap">
                            {activeBrandKit.fonts.map((font, idx) => (
                              <div
                                key={idx}
                                className="px-2 py-0.5 rounded bg-background border border-border text-[10px]"
                                style={{ fontFamily: font }}
                              >
                                {font}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Logos */}
                      {activeBrandKit.logo_urls.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-muted-foreground">
                            {activeBrandKit.logo_urls.length} logo{activeBrandKit.logo_urls.length !== 1 ? 's' : ''} available
                          </div>
                        </div>
                      )}
                      
                      <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/50">
                        AI will use your brand kit in the design
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <div className="bg-muted/30 border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    No brand kit selected. Open Brand Kit panel to create one.
                  </p>
                </div>
              )}
            </div>

            {/* Generation Preferences */}
            <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
              <Label className="text-xs text-muted-foreground">Generation Preferences</Label>
              
              <div className="flex flex-wrap gap-2">
                {generationTypes.map((type) => {
                  const isSelected = selectedGenerationTypes.includes(type.id);
                  const isFreeform = type.id === "freeform";
                  
                  return (
                    <Button
                      key={type.id}
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      disabled={type.disabled || (isFreeform && isSelected)}
                      onClick={() => toggleGenerationType(type.id)}
                      className={`h-8 text-xs ${
                        isFreeform && isSelected ? "opacity-100" : ""
                      } ${type.disabled ? "opacity-50" : ""}`}
                      title={type.description || type.label}
                    >
                      {type.label}
                    </Button>
                  );
                })}
              </div>
              
              <p className="text-[10px] text-muted-foreground">
                Select Multiple to produce multi-modal agents
              </p>
            </div>

            {/* Progress indicator */}
            {isGenerating && generationProgress && (
              <div className="text-xs text-muted-foreground mt-2 p-3 bg-muted rounded-md border border-border">
                {generationProgress}
              </div>
            )}

            {/* Past Conversations Preview */}
            {conversations.length > 0 && (
              <div className="space-y-2">
                {conversations.slice(0, 2).map((conv) => (
                  <div
                    key={conv.id}
                    className="p-3 bg-muted/30 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => handleRestore(conv)}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">{conv.title}</span>
                        {conv.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {conv.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                      <span>{formatDate(conv.created_at)}</span>
                      <div className="flex gap-2">
                        <button className="hover:text-foreground transition-colors">Preview</button>
                        <button className="hover:text-foreground transition-colors">Restore</button>
                        <button className="hover:text-foreground transition-colors">Code</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="p-4 mt-0">
            <ScrollArea className="h-[500px]">
              {isLoadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading...</div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No past conversations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Generate designs to see them here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="p-3 bg-muted border border-border rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span className="text-sm font-medium truncate">{conv.title}</span>
                          </div>
                          {conv.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                              {conv.description}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground">
                            {formatDate(conv.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleRestore(conv)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restore
                        </Button>
                        {conv.output_snapshot?.frames?.[0]?.image && (
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 h-8 text-xs"
                            onClick={() => handleMakeEditable(conv.output_snapshot.frames[0].image!)}
                            disabled={isLoadingConversations}
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Make Editable
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
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