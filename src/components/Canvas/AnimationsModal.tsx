import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play } from "lucide-react";

export type AnimationType = 
  | "none"
  | "fade-in"
  | "fade-out"
  | "slide-in-from-top"
  | "slide-in-from-bottom"
  | "slide-in-from-left"
  | "slide-in-from-right"
  | "slide-out-to-top"
  | "slide-out-to-bottom"
  | "slide-out-to-left"
  | "slide-out-to-right"
  | "zoom-in"
  | "zoom-out"
  | "pulse"
  | "bounce"
  | "spin"
  | "ping";

interface Animation {
  type: AnimationType;
  name: string;
  description: string;
  duration?: string;
}

const animations: Animation[] = [
  { type: "none", name: "None", description: "No animation" },
  { type: "fade-in", name: "Fade In", description: "Fade in from transparent", duration: "0.5s" },
  { type: "fade-out", name: "Fade Out", description: "Fade out to transparent", duration: "0.5s" },
  { type: "zoom-in", name: "Zoom In", description: "Zoom in from small", duration: "0.5s" },
  { type: "zoom-out", name: "Zoom Out", description: "Zoom out to small", duration: "0.5s" },
  { type: "slide-in-from-top", name: "Slide In Top", description: "Slide in from top", duration: "0.5s" },
  { type: "slide-in-from-bottom", name: "Slide In Bottom", description: "Slide in from bottom", duration: "0.5s" },
  { type: "slide-in-from-left", name: "Slide In Left", description: "Slide in from left", duration: "0.5s" },
  { type: "slide-in-from-right", name: "Slide In Right", description: "Slide in from right", duration: "0.5s" },
  { type: "slide-out-to-top", name: "Slide Out Top", description: "Slide out to top", duration: "0.5s" },
  { type: "slide-out-to-bottom", name: "Slide Out Bottom", description: "Slide out to bottom", duration: "0.5s" },
  { type: "slide-out-to-left", name: "Slide Out Left", description: "Slide out to left", duration: "0.5s" },
  { type: "slide-out-to-right", name: "Slide Out Right", description: "Slide out to right", duration: "0.5s" },
  { type: "pulse", name: "Pulse", description: "Pulsing effect (loop)", duration: "2s" },
  { type: "bounce", name: "Bounce", description: "Bouncing effect (loop)", duration: "1s" },
  { type: "spin", name: "Spin", description: "Spinning effect (loop)", duration: "1s" },
  { type: "ping", name: "Ping", description: "Ping effect (loop)", duration: "1s" },
];

interface AnimationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAnimation?: AnimationType;
  onSelectAnimation: (animation: AnimationType, duration?: string) => void;
}

export default function AnimationsModal({
  open,
  onOpenChange,
  currentAnimation = "none",
  onSelectAnimation,
}: AnimationsModalProps) {
  const [hoveredAnimation, setHoveredAnimation] = useState<AnimationType | null>(null);
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationType>(currentAnimation);
  const [previewKey, setPreviewKey] = useState(0);

  const handleApply = () => {
    const animation = animations.find(a => a.type === selectedAnimation);
    onSelectAnimation(selectedAnimation, animation?.duration);
    onOpenChange(false);
  };

  const triggerPreview = () => {
    setPreviewKey(prev => prev + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose Animation</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Animation List */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {animations.map((animation) => (
                <div
                  key={animation.type}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAnimation === animation.type
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                  onClick={() => setSelectedAnimation(animation.type)}
                  onMouseEnter={() => setHoveredAnimation(animation.type)}
                  onMouseLeave={() => setHoveredAnimation(null)}
                >
                  <div className="font-medium text-sm">{animation.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {animation.description}
                  </div>
                  {animation.duration && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Duration: {animation.duration}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Preview Area */}
          <div className="flex flex-col items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-border">
            <div className="text-center p-8">
              <div
                key={`${hoveredAnimation || selectedAnimation}-${previewKey}`}
                className={`w-20 h-20 bg-primary rounded-lg mx-auto ${
                  hoveredAnimation && hoveredAnimation !== "none"
                    ? `animate-${hoveredAnimation}`
                    : selectedAnimation !== "none"
                    ? `animate-${selectedAnimation}`
                    : ""
                }`}
              />
              <p className="text-sm text-muted-foreground mt-4">
                {hoveredAnimation && hoveredAnimation !== "none"
                  ? "Hover preview"
                  : selectedAnimation !== "none"
                  ? "Selected animation"
                  : "Select an animation to preview"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={triggerPreview}
                disabled={(hoveredAnimation || selectedAnimation) === "none"}
              >
                <Play className="h-4 w-4 mr-2" />
                Replay
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Animation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
