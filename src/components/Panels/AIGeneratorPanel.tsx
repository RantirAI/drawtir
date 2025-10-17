import { useState, useRef, useEffect } from "react";
import { Upload, Sparkles, X, MessageSquare, Settings2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import DraggablePanel from "./DraggablePanel";

interface Message {
  role: "user" | "assistant";
  content: string;
  thinking?: boolean;
}

interface AIGeneratorPanelProps {
  onClose: () => void;
  onGenerate: (design: any) => void;
}

const generationPreferences = [
  { label: "Freeform Creation", value: "freeform" },
  { label: "Generate Image", value: "generate-image" },
  { label: "Replicate", value: "replicate" },
  { label: "Import a Website", value: "import-website" },
  { label: "Auto Layout", value: "auto-layout" },
  { label: "Import Figma", value: "import-figma" },
  { label: "Multiple Frames", value: "multiple-frames" },
  { label: "Generate a Video", value: "generate-video" },
  { label: "Notes", value: "notes" },
];

// Transform AI design spec to canvas format with nesting frames support
const transformDesignSpec = (designSpec: any) => {
  const elements: any[] = [];
  let frameCounter = 1;
  
  // Helper to create a frame from a group of elements
  const createFrame = (groupElements: any[], frameId: string, parentId?: string) => {
    if (groupElements.length === 0) return null;
    
    // Calculate bounds for the frame
    const bounds = groupElements.reduce((acc, el) => {
      const right = el.x + el.width;
      const bottom = el.y + el.height;
      return {
        minX: Math.min(acc.minX, el.x),
        minY: Math.min(acc.minY, el.y),
        maxX: Math.max(acc.maxX, right),
        maxY: Math.max(acc.maxY, bottom),
      };
    }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
    
    const framePadding = 20;
    const frame = {
      id: frameId,
      type: "frame",
      name: `Frame ${frameCounter++}`,
      x: bounds.minX - framePadding,
      y: bounds.minY - framePadding,
      width: bounds.maxX - bounds.minX + framePadding * 2,
      height: bounds.maxY - bounds.minY + framePadding * 2,
      backgroundColor: "transparent",
      children: groupElements.map(el => {
        // Adjust child positions to be relative to frame
        return {
          ...el,
          x: el.x - (bounds.minX - framePadding),
          y: el.y - (bounds.minY - framePadding),
        };
      }),
      autoLayout: designSpec.autoLayout || false,
      parentId: parentId,
    };
    
    return frame;
  };
  
  // Process elements and group them into frames if multiFrame is enabled
  if (designSpec.multiFrame || designSpec.nestingFrames) {
    // Group elements by proximity and type
    const groups: any[][] = [];
    let currentGroup: any[] = [];
    
    designSpec.elements?.forEach((element: any, index: number) => {
      const canvasElement = {
        id: `element-${Date.now()}-${index}`,
        type: element.type,
        content: element.content,
        x: element.x || 100,
        y: element.y || 100,
        width: element.width || 200,
        height: element.height || 100,
        color: element.color,
        fontSize: element.fontSize,
        fontWeight: element.fontWeight,
        rotation: element.rotation || 0,
        borderRadius: element.borderRadius,
        shape: element.shape,
      };
      
      // Group elements that are close together
      if (currentGroup.length === 0) {
        currentGroup.push(canvasElement);
      } else {
        const lastElement = currentGroup[currentGroup.length - 1];
        const distance = Math.abs(canvasElement.y - lastElement.y);
        
        // If elements are far apart, start a new group
        if (distance > 200 || currentGroup.length >= 5) {
          groups.push([...currentGroup]);
          currentGroup = [canvasElement];
        } else {
          currentGroup.push(canvasElement);
        }
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    // Create frames for each group
    groups.forEach((group, index) => {
      const frame = createFrame(group, `frame-${Date.now()}-${index}`);
      if (frame) {
        elements.push(frame);
      }
    });
    
    // If nesting is enabled and we have multiple frames, nest smaller frames into larger ones
    if (designSpec.nestingFrames && elements.length > 1) {
      // Sort frames by size (largest first)
      elements.sort((a, b) => (b.width * b.height) - (a.width * a.height));
      
      // Try to nest smaller frames into larger ones
      for (let i = 1; i < elements.length; i++) {
        const smallFrame = elements[i];
        for (let j = 0; j < i; j++) {
          const largeFrame = elements[j];
          
          // Check if small frame is within large frame bounds
          const isInside = 
            smallFrame.x >= largeFrame.x &&
            smallFrame.y >= largeFrame.y &&
            (smallFrame.x + smallFrame.width) <= (largeFrame.x + largeFrame.width) &&
            (smallFrame.y + smallFrame.height) <= (largeFrame.y + largeFrame.height);
          
          if (isInside) {
            // Make positions relative to parent
            smallFrame.x = smallFrame.x - largeFrame.x;
            smallFrame.y = smallFrame.y - largeFrame.y;
            smallFrame.parentId = largeFrame.id;
            
            if (!largeFrame.children) {
              largeFrame.children = [];
            }
            largeFrame.children.push(smallFrame);
            
            // Remove from top-level elements
            elements.splice(i, 1);
            i--;
            break;
          }
        }
      }
    }
  } else {
    // Single frame mode - all elements in one frame
    const allElements = designSpec.elements?.map((element: any, index: number) => ({
      id: `element-${Date.now()}-${index}`,
      type: element.type,
      content: element.content,
      x: element.x || 100,
      y: element.y || 100,
      width: element.width || 200,
      height: element.height || 100,
      color: element.color,
      fontSize: element.fontSize,
      fontWeight: element.fontWeight,
      rotation: element.rotation || 0,
      borderRadius: element.borderRadius,
      shape: element.shape,
    })) || [];
    
    const mainFrame = createFrame(allElements, `frame-${Date.now()}-main`);
    if (mainFrame) {
      elements.push(mainFrame);
    }
  }
  
  return {
    title: designSpec.title,
    backgroundColor: designSpec.backgroundColor || "#ffffff",
    elements: elements,
    autoLayout: designSpec.autoLayout || false,
  };
};

export default function AIGeneratorPanel({ onClose, onGenerate }: AIGeneratorPanelProps) {
  const [description, setDescription] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(["freeform"]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Each image must be less than 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImages((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!description.trim() && uploadedImages.length === 0) {
      toast.error("Please add a description or upload images");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: description,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      const hasImageGen = selectedPreferences.includes("generate-image");
      const hasReplicate = selectedPreferences.includes("replicate");
      const hasAutoLayout = selectedPreferences.includes("auto-layout");
      const hasMultiFrame = selectedPreferences.includes("multiple-frames");
      
      // Check for unsupported features
      if (selectedPreferences.includes("import-website")) {
        toast.info("Website import coming soon!");
      }
      if (selectedPreferences.includes("import-figma")) {
        toast.info("Figma import coming soon!");
      }
      if (selectedPreferences.includes("generate-video")) {
        toast.info("Video generation coming soon!");
      }
      if (selectedPreferences.includes("notes")) {
        toast.info("Notes feature coming soon!");
      }
      
      if (hasImageGen) {
        // Call OpenAI image generation
        const response = await supabase.functions.invoke("generate-image-openai", {
          body: { 
            prompt: description,
            n: 1,
            size: "1024x1024"
          },
        });

        if (response.error) throw response.error;
        console.log("Image generation response:", response.data);
        
        if (response.data.images && response.data.images.length > 0) {
          const imageUrl = response.data.images[0].url;
          
          // Show loading message
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Image generated! Loading onto canvas...`,
              thinking: true,
            },
          ]);
          
          try {
            // Fetch the image and convert to data URL
            const imageResponse = await fetch(imageUrl);
            const blob = await imageResponse.blob();
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            
            // Update message
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: "assistant",
                content: `Image generated successfully! Added to canvas.`,
                thinking: false,
              };
              return newMessages;
            });
            
            // Create a design with the generated image as data URL
            const design = {
              elements: [
                {
                  id: `generated-image-${Date.now()}`,
                  type: "image",
                  content: dataUrl,
                  x: 100,
                  y: 100,
                  width: 400,
                  height: 400,
                  rotation: 0,
                }
              ]
            };
            
            onGenerate(design);
            toast.success("Generated image added to canvas!");
          } catch (error) {
            console.error("Error loading image:", error);
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: "assistant",
                content: `Failed to load generated image. Please try again.`,
                thinking: false,
              };
              return newMessages;
            });
            toast.error("Failed to load generated image");
          }
        }
      } else {
        // Call AI poster generation with streaming
        const hasImage = uploadedImages.length > 0;
        const wantsReplicate = hasReplicate || /\b(replica(te|tion)|copy|match|mirror)\b/i.test(description);
        let analysisType: 'replicate' | 'create' = 'create';
        if (hasImage && wantsReplicate) {
          analysisType = 'replicate';
        } else if (hasImage) {
          analysisType = 'create'; // use uploaded image as content
        } else {
          analysisType = 'create'; // text-only generation
        }
        if (wantsReplicate && !hasImage) {
          toast.info('Upload an image to replicate. Proceeding with creation from description.');
        }
        
        // Use direct fetch for streaming
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-ai-poster`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({
            prompt: description,
            imageBase64: hasImage ? uploadedImages[0] : null,
            analysisType,
            layoutType: hasAutoLayout ? 'auto' : undefined,
            multiFrame: hasMultiFrame,
            nestingFrames: true, // Enable nesting frames by default
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Stream the response for poster generation
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");
        const decoder = new TextDecoder();
        let fullResponse = "";
        let thinkingMessage: Message = {
          role: "assistant",
          content: "",
          thinking: true,
        };
        
        setMessages((prev) => [...prev, thinkingMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'status' && data.message) {
                  fullResponse += data.message + "\n";
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: "assistant",
                      content: fullResponse,
                      thinking: true,
                    };
                    return newMessages;
                  });
                }

                if (data.type === 'progress' && data.text) {
                  // Optionally accumulate raw progress text
                }

                if (data.type === 'complete' && data.designSpec) {
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: "assistant",
                      content: "Design generated successfully! Applied to canvas.",
                      thinking: false,
                    };
                    return newMessages;
                  });
                  
                  // Transform the design spec into the canvas format
                  const design = transformDesignSpec(data.designSpec);
                  onGenerate(design);
                  toast.success("Design applied to canvas!");
                }
              } catch (e) {
                console.error("Error parsing SSE:", e);
              }
            }
          }
        }
      }

      setDescription(""); // Keep uploaded images to allow follow-up prompts (replicate then describe)
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Generation failed");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error generating the design. Please try again.",
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DraggablePanel
      title="AI Generator"
      onClose={onClose}
      defaultPosition={{ x: 20, y: 100 }}
      className="w-[360px]"
    >
      <div className="flex flex-col h-[600px]">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" className="text-xs">
            <MessageSquare className="w-3 h-3 mr-1" />
            Past Conversations
          </Button>
        </div>

        {/* Description Input */}
        <div className="space-y-3 mb-3">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Description</label>
            <div className="relative border border-border rounded-lg bg-background">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ask Drawtir to create..."
                className="min-h-[100px] text-sm resize-none border-0 bg-transparent pb-12 focus-visible:ring-0"
              />
              {/* Actions inside textarea */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Upload Image
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || (!description.trim() && uploadedImages.length === 0)}
                  className="flex-shrink-0 ml-auto"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {isGenerating ? "Generating..." : "Generate"}
                </Button>
              </div>
            </div>
          </div>

          {/* Uploaded Images Preview */}
          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {uploadedImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img}
                    alt={`Upload ${idx + 1}`}
                    className="w-16 h-16 object-cover rounded border"
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Generation Preferences */}
          <div>
            <label className="text-xs font-medium mb-1.5 block">Generation Preferences</label>
            <div className="flex flex-wrap gap-1.5">
              {generationPreferences.map((pref) => (
                <Badge
                  key={pref.value}
                  variant={selectedPreferences.includes(pref.value) ? "default" : "secondary"}
                  className={`cursor-pointer text-xs py-1.5 px-3 transition-colors rounded-md ${
                    selectedPreferences.includes(pref.value)
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-background/50 text-foreground hover:bg-background/70 border border-border"
                  }`}
                  onClick={() => {
                    setSelectedPreferences(prev => 
                      prev.includes(pref.value)
                        ? prev.filter(p => p !== pref.value)
                        : [...prev, pref.value]
                    );
                  }}
                >
                  {pref.label}
                </Badge>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Select Multiple to produce multi-modal agents
          </p>
        </div>

        {/* Chat History - Moved to bottom */}
        <ScrollArea ref={scrollRef} className="flex-1 mt-3 pr-2">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              Start a conversation to generate designs
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-primary/10 ml-4"
                      : "bg-muted mr-4"
                  }`}
                >
                  {msg.thinking && (
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Settings2 className="w-3 h-3 animate-spin" />
                      Drawtir Creator
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </DraggablePanel>
  );
}
