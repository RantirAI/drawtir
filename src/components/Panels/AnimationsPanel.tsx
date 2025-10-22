import { useState } from "react";
import { X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export type AnimationType = 
  | "none" | "fade-in" | "fade-out" 
  | "slide-in-from-top" | "slide-in-from-bottom" | "slide-in-from-left" | "slide-in-from-right"
  | "slide-out-to-top" | "slide-out-to-bottom" | "slide-out-to-left" | "slide-out-to-right"
  | "zoom-in" | "zoom-out" | "pulse" | "bounce" | "spin" | "ping";

type AnimationCategory = "in" | "out" | "custom";

interface Animation {
  type: AnimationType;
  name: string;
  description: string;
  category: AnimationCategory;
  subcategory?: "fade" | "scale" | "mask" | "blur";
}

const animations: Animation[] = [
  // IN Animations - Fade
  { type: "fade-in", name: "Fade In", description: "Fade in", category: "in", subcategory: "fade" },
  { type: "slide-in-from-top", name: "Slide In Top", description: "Slide from top", category: "in", subcategory: "fade" },
  { type: "slide-in-from-bottom", name: "Slide In Bottom", description: "Slide from bottom", category: "in", subcategory: "fade" },
  { type: "slide-in-from-left", name: "Slide In Left", description: "Slide from left", category: "in", subcategory: "fade" },
  { type: "slide-in-from-right", name: "Slide In Right", description: "Slide from right", category: "in", subcategory: "fade" },
  
  // IN Animations - Scale
  { type: "zoom-in", name: "Grow In", description: "Scale up entrance", category: "in", subcategory: "scale" },
  { type: "spin", name: "Spin In", description: "Rotate entrance", category: "in", subcategory: "scale" },
  { type: "bounce", name: "Bounce In", description: "Bounce entrance", category: "in", subcategory: "scale" },
  
  // OUT Animations - Fade
  { type: "fade-out", name: "Fade Out", description: "Fade out", category: "out", subcategory: "fade" },
  { type: "slide-out-to-top", name: "Slide Out Top", description: "Slide to top", category: "out", subcategory: "fade" },
  { type: "slide-out-to-bottom", name: "Slide Out Bottom", description: "Slide to bottom", category: "out", subcategory: "fade" },
  { type: "slide-out-to-left", name: "Slide Out Left", description: "Slide to left", category: "out", subcategory: "fade" },
  { type: "slide-out-to-right", name: "Slide Out Right", description: "Slide to right", category: "out", subcategory: "fade" },
  
  // OUT Animations - Scale
  { type: "zoom-out", name: "Shrink Out", description: "Scale down exit", category: "out", subcategory: "scale" },
  { type: "pulse", name: "Pulse Out", description: "Pulse exit", category: "out", subcategory: "scale" },
  { type: "ping", name: "Ping Out", description: "Ping exit", category: "out", subcategory: "scale" },
];

interface AnimationsPanelProps {
  open: boolean;
  onClose: () => void;
  currentAnimation?: AnimationType;
  currentDuration?: string;
  currentDelay?: string;
  currentEasing?: string;
  currentIterationCount?: string;
  currentCategory?: AnimationCategory;
  onSelectAnimation: (config: {
    animation: AnimationType;
    duration: string;
    delay: string;
    easing: string;
    iterationCount: string;
    category: AnimationCategory;
  }) => void;
}

export default function AnimationsPanel({
  open,
  onClose,
  currentAnimation = "none",
  currentDuration = "0.5s",
  currentDelay = "0s",
  currentEasing = "ease-out",
  currentIterationCount = "1",
  currentCategory = "in",
  onSelectAnimation,
}: AnimationsPanelProps) {
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationType>(currentAnimation);
  const [hoveredAnimation, setHoveredAnimation] = useState<AnimationType | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [duration, setDuration] = useState(currentDuration);
  const [delay, setDelay] = useState(currentDelay);
  const [easing, setEasing] = useState(currentEasing);
  const [iterationCount, setIterationCount] = useState(currentIterationCount);
  const [activeTab, setActiveTab] = useState<AnimationCategory>(currentCategory);

  const handleApply = () => {
    onSelectAnimation({
      animation: selectedAnimation,
      duration,
      delay,
      easing,
      iterationCount,
      category: activeTab,
    });
    onClose();
  };

  const triggerPreview = () => {
    setPreviewKey(prev => prev + 1);
  };

  const handleAnimationSelect = (anim: Animation) => {
    setSelectedAnimation(anim.type);
    setActiveTab(anim.category);
    
    // Set default timing based on animation type
    if (anim.type.includes("bounce") || anim.type.includes("pulse")) {
      setDuration("0.8s");
    } else if (anim.type.includes("spin")) {
      setDuration("1s");
    } else {
      setDuration("0.5s");
    }
  };

  const filteredAnimations = animations.filter(a => a.category === activeTab);
  
  // Group by subcategory
  const groupedAnimations: Record<string, Animation[]> = {};
  filteredAnimations.forEach(anim => {
    const sub = anim.subcategory || "other";
    if (!groupedAnimations[sub]) groupedAnimations[sub] = [];
    groupedAnimations[sub].push(anim);
  });

  if (!open) return null;

  return (
    <div
      className="fixed right-4 top-20 w-[320px] bg-card/95 backdrop-blur-xl border dark:border-zinc-700 rounded-lg shadow-lg z-50"
      style={{ maxHeight: "calc(100vh - 120px)" }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b dark:border-zinc-700">
        <h3 className="text-[11px] font-medium text-foreground">Animations</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AnimationCategory)} className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-7 mx-3 my-2" style={{ width: "calc(100% - 24px)" }}>
          <TabsTrigger value="in" className="text-[10px] h-6">IN</TabsTrigger>
          <TabsTrigger value="out" className="text-[10px] h-6">OUT</TabsTrigger>
          <TabsTrigger value="custom" className="text-[10px] h-6">CUSTOM</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[320px]">
          <TabsContent value="in" className="px-3 pb-3 mt-0">
            {Object.entries(groupedAnimations).map(([subcategory, anims]) => (
              <div key={subcategory} className="mb-3">
                <h4 className="text-[10px] font-medium text-muted-foreground uppercase mb-1.5">{subcategory}</h4>
                <div className="grid grid-cols-3 gap-1.5">
                  {anims.map((anim) => (
                    <button
                      key={anim.type}
                      onClick={() => handleAnimationSelect(anim)}
                      onMouseEnter={() => setHoveredAnimation(anim.type)}
                      onMouseLeave={() => setHoveredAnimation(null)}
                      className={`relative h-14 rounded border dark:border-zinc-700 overflow-hidden transition-all ${
                        selectedAnimation === anim.type
                          ? "ring-2 ring-primary bg-primary/10"
                          : "hover:border-primary/50 bg-card"
                      }`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          key={hoveredAnimation === anim.type ? previewKey : 0}
                          className={`w-6 h-6 bg-primary rounded ${
                            hoveredAnimation === anim.type ? `animate-${anim.type}` : ""
                          }`}
                          style={{
                            animationDuration: duration,
                            animationTimingFunction: easing,
                          }}
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-1">
                        <p className="text-[9px] font-medium text-center truncate">{anim.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="out" className="px-3 pb-3 mt-0">
            {Object.entries(groupedAnimations).map(([subcategory, anims]) => (
              <div key={subcategory} className="mb-3">
                <h4 className="text-[10px] font-medium text-muted-foreground uppercase mb-1.5">{subcategory}</h4>
                <div className="grid grid-cols-3 gap-1.5">
                  {anims.map((anim) => (
                    <button
                      key={anim.type}
                      onClick={() => handleAnimationSelect(anim)}
                      onMouseEnter={() => setHoveredAnimation(anim.type)}
                      onMouseLeave={() => setHoveredAnimation(null)}
                      className={`relative h-14 rounded border dark:border-zinc-700 overflow-hidden transition-all ${
                        selectedAnimation === anim.type
                          ? "ring-2 ring-primary bg-primary/10"
                          : "hover:border-primary/50 bg-card"
                      }`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          key={hoveredAnimation === anim.type ? previewKey : 0}
                          className={`w-6 h-6 bg-primary rounded ${
                            hoveredAnimation === anim.type ? `animate-${anim.type}` : ""
                          }`}
                          style={{
                            animationDuration: duration,
                            animationTimingFunction: easing,
                          }}
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-1">
                        <p className="text-[9px] font-medium text-center truncate">{anim.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="custom" className="px-3 pb-3 mt-0">
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground mb-3">
                Custom animations coming soon. Use timeline to create keyframe animations.
              </p>
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-muted-foreground">TRANSFORM</p>
                <div className="text-[9px] text-muted-foreground/60 space-y-0.5">
                  <p>• Move</p>
                  <p>• Scale</p>
                  <p>• Rotate</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-muted-foreground">STYLE</p>
                <div className="text-[9px] text-muted-foreground/60 space-y-0.5">
                  <p>• Opacity</p>
                  <p>• Color</p>
                  <p>• Shadow</p>
                  <p>• Blur</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-muted-foreground">OTHER</p>
                <div className="text-[9px] text-muted-foreground/60 space-y-0.5">
                  <p>• Hide/Show</p>
                  <p>• Resize</p>
                  <p>• Corner Radius</p>
                  <p>• Stroke</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Settings Section */}
      {activeTab !== "custom" && (
        <div className="px-3 py-2 border-t dark:border-zinc-700 space-y-2">
          {/* Preview Section */}
          <div className="flex items-center justify-between">
            <Label className="text-[10px] text-muted-foreground">Preview</Label>
            <Button
              onClick={triggerPreview}
              size="sm"
              variant="outline"
              className="h-5 px-2 text-[9px]"
            >
              <Play className="h-2.5 w-2.5 mr-1" />
              Replay
            </Button>
          </div>

          {/* Timing Controls */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[9px] text-muted-foreground">Duration</Label>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-6 text-[10px] mt-0.5"
                placeholder="0.5s"
              />
            </div>
            <div>
              <Label className="text-[9px] text-muted-foreground">Delay</Label>
              <Input
                value={delay}
                onChange={(e) => setDelay(e.target.value)}
                className="h-6 text-[10px] mt-0.5"
                placeholder="0s"
              />
            </div>
          </div>

          <div>
            <Label className="text-[9px] text-muted-foreground">Easing</Label>
            <Select value={easing} onValueChange={setEasing}>
              <SelectTrigger className="h-6 text-[10px] mt-0.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="ease">Ease</SelectItem>
                <SelectItem value="ease-in">Ease In</SelectItem>
                <SelectItem value="ease-out">Ease Out</SelectItem>
                <SelectItem value="ease-in-out">Ease In Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[9px] text-muted-foreground">Iterations</Label>
            <Select value={iterationCount} onValueChange={setIterationCount}>
              <SelectTrigger className="h-6 text-[10px] mt-0.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Once</SelectItem>
                <SelectItem value="2">Twice</SelectItem>
                <SelectItem value="3">3 times</SelectItem>
                <SelectItem value="infinite">Infinite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="flex-1 h-6 text-[10px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              size="sm"
              className="flex-1 h-6 text-[10px]"
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
