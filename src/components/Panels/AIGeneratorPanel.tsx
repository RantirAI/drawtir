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
  { label: "Auto Layout", value: "auto-layout" },
  { label: "Multiple Frames", value: "multiple-frames" },
];

export default function AIGeneratorPanel({ onClose, onGenerate }: AIGeneratorPanelProps) {
  const [description, setDescription] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPreference, setSelectedPreference] = useState<string>("freeform");
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
      let response;
      
      if (selectedPreference === "generate-image") {
        // Call OpenAI image generation
        response = await supabase.functions.invoke("generate-image-openai", {
          body: { 
            prompt: description,
            n: 1,
            size: "1024x1024"
          },
        });
      } else {
        // Call AI poster generation for canvas design
        const analysisType = selectedPreference === "replicate" ? "replicate" : "create";
        response = await supabase.functions.invoke("generate-ai-poster", {
          body: {
            prompt: description,
            imageBase64: uploadedImages[0] || null,
            analysisType,
          },
        });
      }

      if (response.error) throw response.error;

      // Stream the response
      const reader = response.data.getReader();
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
              
              if (data.status) {
                fullResponse += data.status + "\n";
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

              if (data.design) {
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: "Design generated successfully! Applied to canvas.",
                    thinking: false,
                  };
                  return newMessages;
                });
                onGenerate(data.design);
                toast.success("Design applied to canvas!");
              }
            } catch (e) {
              console.error("Error parsing SSE:", e);
            }
          }
        }
      }

      setDescription("");
      setUploadedImages([]);
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

        {/* Chat History */}
        <ScrollArea ref={scrollRef} className="flex-1 mb-3 pr-2">
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

        {/* Description Input */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ask Drawtir to create..."
              className="min-h-[80px] text-sm resize-none"
            />
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

          {/* Actions */}
          <div className="flex items-center gap-2">
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
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Upload className="w-3 h-3 mr-1" />
              Upload Image
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (!description.trim() && uploadedImages.length === 0)}
              size="sm"
              className="flex-1"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          </div>

          {/* Generation Preferences */}
          <div>
            <label className="text-xs font-medium mb-1.5 block">Generation Preferences</label>
            <div className="flex flex-wrap gap-1.5">
              {generationPreferences.map((pref) => (
                <Badge
                  key={pref.value}
                  variant={selectedPreference === pref.value ? "default" : "outline"}
                  className="cursor-pointer text-xs py-1 px-2"
                  onClick={() => setSelectedPreference(pref.value)}
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
      </div>
    </DraggablePanel>
  );
}
