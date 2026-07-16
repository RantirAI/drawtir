import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Wand2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Frame, Element } from "@/types/elements";

interface AIStudioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSceneGenerated: (frame: Frame) => void;
  onAnimationsApplied: (animations: Array<{ id: string; type: any; delay: string; duration: string; timingFunction: string }>) => void;
  onImageReplaced: (newUrl: string) => void;
  selectedFrame?: Frame | null;
  selectedElement?: Element | null;
}

const ASPECT_TO_SIZE: Record<string, { w: number; h: number }> = {
  "16:9": { w: 1600, h: 900 },
  "1:1": { w: 1200, h: 1200 },
  "9:16": { w: 900, h: 1600 },
  "4:3": { w: 1600, h: 1200 },
  "3:4": { w: 1200, h: 1600 },
};

function specToFrame(spec: any, backgroundUrl: string | null): Frame {
  const size = ASPECT_TO_SIZE[spec.aspectRatio] ?? ASPECT_TO_SIZE["16:9"];
  const elements: Element[] = (spec.elements ?? []).map((el: any, i: number) => {
    const base = {
      id: `ai-${Date.now()}-${i}`,
      x: el.x ?? 0,
      y: el.y ?? 0,
      width: el.width ?? 200,
      height: el.height ?? 60,
      rotation: 0,
      opacity: el.opacity ?? 100,
    };
    if (el.kind === "headline" || el.kind === "subheadline") {
      return {
        ...base,
        type: "text" as const,
        text: el.text ?? "",
        fontSize: el.fontSize ?? (el.kind === "headline" ? 96 : 24),
        fontFamily: "Instrument Sans",
        fontWeight: el.fontWeight ?? (el.kind === "headline" ? "800" : "500"),
        textAlign: el.textAlign ?? "left",
        color: el.color ?? spec.textColor ?? "#ffffff",
        name: el.kind,
      };
    }
    if (el.kind === "cta") {
      // CTA as a shape with nested? We use two elements: shape bg + text on top.
      // But Element schema is flat; emit shape here and a companion text right after.
      return {
        ...base,
        type: "shape" as const,
        shapeType: "rectangle" as const,
        fill: el.bgColor ?? spec.accentColor ?? "#3b82f6",
        cornerRadius: el.cornerRadius ?? 12,
        name: "cta-bg",
      };
    }
    // decorative shape
    return {
      ...base,
      type: "shape" as const,
      shapeType: (el.shapeType === "ellipse" ? "ellipse" : "rectangle") as any,
      fill: el.fill ?? "#ffffff",
      fillOpacity: el.opacity ?? 0.15,
      opacity: 100,
      cornerRadius: el.cornerRadius ?? 0,
      name: "decoration",
    };
  });

  // Emit CTA labels as text on top of CTA shapes
  const ctaLabels: Element[] = [];
  (spec.elements ?? []).forEach((el: any, i: number) => {
    if (el.kind === "cta") {
      ctaLabels.push({
        id: `ai-cta-text-${Date.now()}-${i}`,
        type: "text",
        text: el.text ?? "Get Started",
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        fontSize: 18,
        fontFamily: "Instrument Sans",
        fontWeight: "600",
        textAlign: "center",
        color: el.textColor ?? "#ffffff",
        name: "cta-label",
      } as Element);
    }
  });

  return {
    id: `frame-ai-${Date.now()}`,
    name: spec.title ?? "AI Scene",
    x: 100,
    y: 100,
    width: size.w,
    height: size.h,
    initialWidth: size.w,
    initialHeight: size.h,
    backgroundColor: spec.backgroundColor ?? "#0a0a0b",
    backgroundType: backgroundUrl ? "image" : "solid",
    backgroundImage: backgroundUrl ?? undefined,
    backgroundImageFit: "cover",
    image: null,
    topCaption: "",
    bottomCaption: "",
    textColor: spec.textColor ?? "#ffffff",
    textAlign: "center",
    textSize: 3,
    textOpacity: 100,
    imageStyle: "cover",
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    elements: [...elements, ...ctaLabels],
    cornerRadius: 12,
    opacity: 100,
    blendMode: "normal",
    duration: 3,
    startTime: 0,
    timelineMode: "auto",
    transitionDuration: 0,
  };
}

export function AIStudioModal({
  open,
  onOpenChange,
  onSceneGenerated,
  onAnimationsApplied,
  onImageReplaced,
  selectedFrame,
  selectedElement,
}: AIStudioModalProps) {
  const [tab, setTab] = useState("scene");
  const [scenePrompt, setScenePrompt] = useState("");
  const [replaceInstruction, setReplaceInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [sceneProvider, setSceneProvider] = useState<"reve" | "ideogram">("reve");
  const [replaceProvider, setReplaceProvider] = useState<"reve" | "ideogram">("reve");

  const runScene = async () => {
    if (!scenePrompt.trim()) return toast.error("Describe your scene");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-scene", {
        body: { prompt: scenePrompt.trim(), provider: sceneProvider },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const frame = specToFrame(data.spec, data.backgroundUrl);
      onSceneGenerated(frame);
      toast.success("Scene generated");
      onOpenChange(false);
      setScenePrompt("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate scene");
    } finally {
      setLoading(false);
    }
  };

  const runReplace = async () => {
    if (!selectedElement?.imageUrl && !selectedFrame?.backgroundImage) {
      return toast.error("Select an image element or a frame with a background image first");
    }
    if (!replaceInstruction.trim()) return toast.error("Describe the edit");
    const source = selectedElement?.imageUrl ?? selectedFrame?.backgroundImage;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("magic-replace", {
        body: { imageUrl: source, instruction: replaceInstruction.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      onImageReplaced(data.imageUrl);
      toast.success("Image reimagined");
      onOpenChange(false);
      setReplaceInstruction("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to edit image");
    } finally {
      setLoading(false);
    }
  };

  const runAutoAnimate = async () => {
    if (!selectedFrame?.elements?.length) return toast.error("Select a frame with elements");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-animate", {
        body: { elements: selectedFrame.elements },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      onAnimationsApplied(data.animations ?? []);
      toast.success("Motion applied");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to auto-animate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Studio
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="scene" className="gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Prompt-to-Scene
            </TabsTrigger>
            <TabsTrigger value="replace" className="gap-1">
              <Wand2 className="h-3.5 w-3.5" /> Magic Replace
            </TabsTrigger>
            <TabsTrigger value="animate" className="gap-1">
              <Zap className="h-3.5 w-3.5" /> Auto-Animate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scene" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground">
              One prompt → a full editable frame: background (Reve), headline, subheading, CTA, decorative shapes.
            </p>
            <Textarea
              placeholder="A revolutionary photography landing page — dark cinematic hero, bold serif headline 'See Differently', golden hour skyline background..."
              value={scenePrompt}
              onChange={(e) => setScenePrompt(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={loading}
            />
            <div className="flex justify-end">
              <Button onClick={runScene} disabled={loading || !scenePrompt.trim()} className="gap-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Generating..." : "Generate scene"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="replace" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground">
              Rewrite the selected image with Reve — keep composition, change anything: lighting, subject, style.
            </p>
            <div className="text-xs px-3 py-2 rounded-md bg-muted/50 border border-border/50">
              Target: {selectedElement?.imageUrl
                ? "selected image element"
                : selectedFrame?.backgroundImage
                  ? `frame background — "${selectedFrame.name}"`
                  : "no image selected"}
            </div>
            <Input
              placeholder="Make the lighting golden-hour sunset, add dramatic clouds"
              value={replaceInstruction}
              onChange={(e) => setReplaceInstruction(e.target.value)}
              disabled={loading}
            />
            <div className="flex justify-end">
              <Button onClick={runReplace} disabled={loading || !replaceInstruction.trim()} className="gap-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {loading ? "Reimagining..." : "Reimagine"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="animate" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground">
              AI reads the selected frame and applies tasteful, staggered entrance animations to every element.
            </p>
            <div className="text-xs px-3 py-2 rounded-md bg-muted/50 border border-border/50">
              Frame: {selectedFrame?.name ?? "none"} · {selectedFrame?.elements?.length ?? 0} elements
            </div>
            <div className="flex justify-end">
              <Button
                onClick={runAutoAnimate}
                disabled={loading || !selectedFrame?.elements?.length}
                className="gap-1"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {loading ? "Choreographing..." : "Auto-animate frame"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
