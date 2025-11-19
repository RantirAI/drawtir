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
  onGenerate: (generationTypes: string[], model: string, colorPalette?: string, conversationHistory?: ChatMessage[], targetFrameId?: string) => Promise<void>;
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
  const [activeTab, setActiveTab] = useState("generator");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedGenerationTypes, setSelectedGenerationTypes] = useState<string[]>(["freeform"]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    const supportedModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'];
    const storedModel = localStorage.getItem('ai-poster-model');
    return storedModel && supportedModels.includes(storedModel) ? storedModel : 'gemini-2.5-flash';
  });
  const [selectedPalette, setSelectedPalette] = useState<string>("auto");
  const [customColors, setCustomColors] = useState<string[]>(["", "", "", ""]);
  const [accordionValue, setAccordionValue] = useState<string>("");
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const colorPalettes = [
    { id: "auto", name: "Auto Select", colors: [] },
    { id: "energetic", name: "Energetic", colors: ["#FF6B35", "#F7931E", "#FDC830", "#F37335"] },
    { id: "calm", name: "Calm", colors: ["#89B0AE", "#BEE3DB", "#FFD6BA", "#FEEAFA"] },
    { id: "professional", name: "Professional", colors: ["#2C3E50", "#34495E", "#7F8C8D", "#BDC3C7"] },
    { id: "playful", name: "Playful", colors: ["#FF6B9D", "#C06C84", "#6C5B7B", "#355C7D"] },
    { id: "elegant", name: "Elegant", colors: ["#1A1A2E", "#16213E", "#0F3460", "#533483"] },
    { id: "vibrant", name: "Vibrant", colors: ["#FF00FF", "#00FFFF", "#FFFF00", "#FF0080"] },
    { id: "sunset", name: "Sunset", colors: ["#FF6F61", "#FF9068", "#FFB088", "#FFC3A0"] },
    { id: "ocean", name: "Ocean", colors: ["#006994", "#0582CA", "#00A6FB", "#7DCFB6"] },
    { id: "neon", name: "Neon", colors: ["#39FF14", "#FF10F0", "#00F0FF", "#FFD700"] },
  ];

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
    
    let paletteToUse = selectedPalette !== "auto" ? selectedPalette : undefined;
    
    // If custom palette is selected and has valid colors, use those
    if (selectedPalette === "custom") {
      const validColors = customColors.filter(c => c.trim() !== "");
      if (validColors.length > 0) {
        paletteToUse = validColors.join(",");
      }
    }
    
    // Pass all selected generation types and conversation history, including target frame
    await onGenerate(selectedGenerationTypes, selectedModel, paletteToUse, [...chatMessages, userMessage], selectedFrameId);
    
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

  const handleCustomColorChange = (index: number, value: string) => {
    const newColors = [...customColors];
    newColors[index] = value;
    setCustomColors(newColors);
  };

  const addCustomColor = () => {
    if (customColors.length < 8) {
      setCustomColors([...customColors, ""]);
    }
  };

  const removeCustomColor = (index: number) => {
    if (customColors.length > 1) {
      setCustomColors(customColors.filter((_, i) => i !== index));
    }
  };

  const handlePaletteColorClick = (colorIndex: number) => {
    // Convert preset palette to custom if needed
    if (selectedPalette !== "custom" && selectedPalette !== "auto") {
      const currentPalette = colorPalettes.find(p => p.id === selectedPalette);
      if (currentPalette && currentPalette.colors.length > 0) {
        setCustomColors(currentPalette.colors);
        setSelectedPalette("custom");
      }
    }
    setEditingColorIndex(colorIndex);
  };

  const getCurrentColors = () => {
    if (selectedPalette === "custom") {
      return customColors;
    }
    const palette = colorPalettes.find(p => p.id === selectedPalette);
    return palette?.colors || [];
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
            {/* Target Frame Selector */}
            <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
              <Label className="text-xs text-muted-foreground">Target Frame</Label>
              <Select value={selectedFrameId} onValueChange={onFrameSelect}>
                <SelectTrigger className="w-full h-9 text-sm bg-background border-border">
                  <SelectValue placeholder="Select frame to generate in" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {frames.map((frame) => (
                    <SelectItem key={frame.id} value={frame.id}>
                      {frame.name || frame.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                AI will generate content in the selected frame only
              </p>
            </div>

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

            {/* Color Palette Selection - Accordion Style */}
            <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
              <Label className="text-xs text-muted-foreground">Color Palette</Label>
              
              {/* Selected Palette Display */}
              {selectedPalette && (
                <div className="p-2 rounded-lg border border-primary bg-primary/10">
                  <div className="text-xs font-medium mb-1.5">
                    {colorPalettes.find(p => p.id === selectedPalette)?.name || "Custom"}
                    {selectedPalette !== "auto" && (
                      <span className="text-[10px] text-muted-foreground ml-1">(click colors to edit)</span>
                    )}
                  </div>
                  {selectedPalette === "auto" ? (
                    <div className="h-4 rounded bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 w-full" />
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {getCurrentColors().map((color, idx) => (
                          <button
                            key={idx}
                            onClick={() => handlePaletteColorClick(idx)}
                            className="flex-1 h-4 rounded border border-border hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                            style={{ backgroundColor: color }}
                            title={`Click to edit ${color}`}
                          />
                        ))}
                      </div>
                      {editingColorIndex !== null && (
                        <div className="flex gap-2 items-center">
                          <Input
                            value={customColors[editingColorIndex] || ""}
                            onChange={(e) => handleCustomColorChange(editingColorIndex, e.target.value)}
                            placeholder="#FFFFFF"
                            className="h-7 text-xs"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => setEditingColorIndex(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Palette Accordion */}
              <Accordion type="single" collapsible value={accordionValue} onValueChange={setAccordionValue}>
                <AccordionItem value="palettes" className="border-border">
                  <AccordionTrigger className="text-xs py-1.5 hover:no-underline">
                    Change Palette
                  </AccordionTrigger>
                  <AccordionContent className="pb-1.5 max-h-[300px] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                      {colorPalettes.map((palette) => (
                        <button
                          key={palette.id}
                          onClick={() => {
                            setSelectedPalette(palette.id);
                            setAccordionValue("");
                            setEditingColorIndex(null);
                          }}
                          className={`p-1.5 rounded-lg border transition-all ${
                            selectedPalette === palette.id
                              ? "border-primary bg-primary/10"
                              : "border-border bg-background hover:bg-muted"
                          }`}
                        >
                          <div className="text-[10px] font-medium mb-1">{palette.name}</div>
                          {palette.colors.length > 0 ? (
                            <div className="flex gap-0.5">
                              {palette.colors.map((color, idx) => (
                                <div
                                  key={idx}
                                  className="flex-1 h-3 rounded-sm"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="h-3 rounded-sm bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500" />
                          )}
                        </button>
                      ))}
                      
                      {/* Custom Palette Option */}
                      <button
                        onClick={() => {
                          setSelectedPalette("custom");
                          setAccordionValue("");
                          setEditingColorIndex(null);
                        }}
                        className={`p-2 rounded-lg border transition-all ${
                          selectedPalette === "custom"
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background hover:bg-muted"
                        }`}
                      >
                        <div className="text-xs font-medium mb-1.5">Custom</div>
                        <div className="h-4 rounded bg-gradient-to-r from-gray-300 to-gray-600" />
                      </button>
                    </div>
                    
                    {/* Custom Color Inputs */}
                    {selectedPalette === "custom" && (
                      <div className="mt-3 space-y-2">
                        <Label className="text-xs text-muted-foreground">Custom Colors (hex codes)</Label>
                        {customColors.map((color, idx) => (
                          <div key={idx} className="flex gap-2">
                            <Input
                              value={color}
                              onChange={(e) => handleCustomColorChange(idx, e.target.value)}
                              placeholder="#FFFFFF"
                              className="h-8 text-xs"
                            />
                            {customColors.length > 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => removeCustomColor(idx)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {customColors.length < 8 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs w-full"
                            onClick={addCustomColor}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Color
                          </Button>
                        )}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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