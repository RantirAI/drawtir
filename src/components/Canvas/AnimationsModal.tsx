import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  onSelectAnimation: (animation: AnimationType, duration?: string, delay?: string, easing?: string, iterationCount?: string) => void;
}

export default function AnimationsModal({
  open,
  onOpenChange,
  currentAnimation = "none",
  onSelectAnimation,
}: AnimationsModalProps) {
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationType>(currentAnimation);
  const [hoveredAnimation, setHoveredAnimation] = useState<AnimationType | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [duration, setDuration] = useState<string>("0.5");
  const [delay, setDelay] = useState<string>("0");
  const [easing, setEasing] = useState<string>("ease-out");
  const [iterationCount, setIterationCount] = useState<string>("1");

  const handleApply = () => {
    onSelectAnimation(
      selectedAnimation, 
      `${duration}s`, 
      `${delay}s`, 
      easing, 
      iterationCount
    );
    onOpenChange(false);
  };

  const triggerPreview = () => setPreviewKey(prev => prev + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Choose Animation</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Animation Grid - Left 2 columns */}
          <div className="col-span-2">
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid grid-cols-2 gap-3">
                {animations.map((animation) => (
                  <div
                    key={animation.type}
                    className={`group relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedAnimation === animation.type
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => {
                      setSelectedAnimation(animation.type);
                      if (animation.duration) {
                        setDuration(animation.duration.replace('s', ''));
                      }
                    }}
                    onMouseEnter={() => setHoveredAnimation(animation.type)}
                    onMouseLeave={() => setHoveredAnimation(null)}
                  >
                    {/* Preview Box */}
                    <div className="h-24 flex items-center justify-center mb-3 bg-muted/50 rounded-md overflow-hidden">
                      <div
                        key={`${animation.type}-${hoveredAnimation === animation.type ? previewKey : 'static'}`}
                        className={`w-12 h-12 bg-primary rounded ${
                          hoveredAnimation === animation.type && animation.type !== "none"
                            ? `animate-${animation.type}`
                            : ""
                        }`}
                        style={{
                          animationDuration: `${duration}s`,
                          animationDelay: `${delay}s`,
                          animationTimingFunction: easing,
                          animationIterationCount: iterationCount,
                        }}
                      />
                    </div>
                    
                    {/* Animation Name */}
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
          </div>

          {/* Settings Panel - Right column */}
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg border">
              <h3 className="font-medium text-sm mb-4">Selected animation</h3>
              
              {/* Large Preview */}
              <div className="h-32 flex items-center justify-center bg-background rounded-md mb-4">
                <div
                  key={`preview-${selectedAnimation}-${previewKey}`}
                  className={`w-16 h-16 bg-primary rounded-lg ${
                    selectedAnimation !== "none" ? `animate-${selectedAnimation}` : ""
                  }`}
                  style={{
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                    animationTimingFunction: easing,
                    animationIterationCount: iterationCount,
                  }}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mb-4"
                onClick={triggerPreview}
                disabled={selectedAnimation === "none"}
              >
                Replay
              </Button>

              {/* Animation Settings */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Duration (seconds)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">Delay (seconds)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={delay}
                    onChange={(e) => setDelay(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">Easing</Label>
                  <Select value={easing} onValueChange={setEasing}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ease-out">Ease Out</SelectItem>
                      <SelectItem value="ease-in">Ease In</SelectItem>
                      <SelectItem value="ease-in-out">Ease In Out</SelectItem>
                      <SelectItem value="linear">Linear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Repeat</Label>
                  <Select value={iterationCount} onValueChange={setIterationCount}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Once</SelectItem>
                      <SelectItem value="2">Twice</SelectItem>
                      <SelectItem value="3">Three times</SelectItem>
                      <SelectItem value="infinite">Infinite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
