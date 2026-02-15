import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Check, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIWallDesign {
  title: string;
  html: string;
}

interface AIWallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDesign: (html: string, title: string) => void;
}

export function AIWallModal({ open, onOpenChange, onSelectDesign }: AIWallModalProps) {
  const [prompt, setPrompt] = useState("");
  const [designs, setDesigns] = useState<AIWallDesign[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe what you want to build");
      return;
    }

    setIsGenerating(true);
    setDesigns([]);
    setSelectedIndex(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-wall", {
        body: { prompt: prompt.trim(), count: 4 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.designs && Array.isArray(data.designs)) {
        setDesigns(data.designs);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error("AI Wall error:", err);
      toast.error(err.message || "Failed to generate designs");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelect = () => {
    if (selectedIndex === null || !designs[selectedIndex]) return;
    const design = designs[selectedIndex];
    onSelectDesign(design.html, design.title);
    onOpenChange(false);
    setPrompt("");
    setDesigns([]);
    setSelectedIndex(null);
  };

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setDesigns([]);
      setSelectedIndex(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Wall — Generate Designs
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Prompt input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Describe what you want to build... e.g. 'A landing page for a tech conference with a hero section, speaker cards, and a registration CTA'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleGenerate();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Press ⌘+Enter to generate
              </span>
              <div className="flex gap-2">
                {designs.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Regenerate
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="gap-1"
                >
                  {isGenerating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {isGenerating ? "Generating..." : "Generate"}
                </Button>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {isGenerating && (
            <div className="flex-1 flex items-center justify-center min-h-[300px]">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  Generating 4 unique designs with Aceternity UI aesthetics...
                </p>
                <p className="text-xs text-muted-foreground/60">
                  This may take 15-30 seconds
                </p>
              </div>
            </div>
          )}

          {/* Design gallery */}
          {designs.length > 0 && !isGenerating && (
            <div className="flex-1 overflow-y-auto space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {designs.map((design, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedIndex(index)}
                    className={`relative group rounded-lg border-2 overflow-hidden transition-all duration-200 text-left ${
                      selectedIndex === index
                        ? "border-primary ring-2 ring-primary/30 shadow-lg"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {/* Selected indicator */}
                    {selectedIndex === index && (
                      <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}

                    {/* Design preview iframe */}
                    <div className="relative w-full aspect-[4/3] bg-muted">
                      <iframe
                        srcDoc={design.html}
                        className="w-full h-full pointer-events-none"
                        sandbox="allow-scripts"
                        title={design.title}
                        style={{ transform: "scale(0.5)", transformOrigin: "top left", width: "200%", height: "200%" }}
                      />
                    </div>

                    {/* Title */}
                    <div className="p-2 bg-card border-t">
                      <p className="text-xs font-medium truncate">{design.title}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Select button */}
              <div className="flex justify-end pt-2 pb-1">
                <Button
                  onClick={handleSelect}
                  disabled={selectedIndex === null}
                  className="gap-1"
                >
                  <Check className="h-4 w-4" />
                  Use Selected Design
                </Button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {designs.length === 0 && !isGenerating && (
            <div className="flex-1 flex items-center justify-center min-h-[200px] text-center">
              <div className="space-y-2">
                <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Describe your design and AI will generate 4 unique variations
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
