import { useState, useEffect } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import DraggablePanel from "./DraggablePanel";

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

  // Sync state when props change (e.g., from timeline updates)
  useEffect(() => {
    setSelectedAnimation(currentAnimation);
    setDuration(currentDuration);
    setDelay(currentDelay);
    setEasing(currentEasing);
    setIterationCount(currentIterationCount);
    setActiveTab(currentCategory);
  }, [currentAnimation, currentDuration, currentDelay, currentEasing, currentIterationCount, currentCategory]);

  const handleApply = () => {
    const normalize = (v: string) => {
      const t = (v || '').toString().trim();
      if (!t) return '0s';
      if (t.endsWith('ms') || t.endsWith('s')) return t;
      return `${t}s`;
    };
    onSelectAnimation({
      animation: selectedAnimation,
      duration: normalize(duration),
      delay: normalize(delay),
      easing,
      iterationCount,
      category: activeTab,
    });
    // Keep panel open after applying to match other sidebars
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
    <DraggablePanel
      title="Animations"
      onClose={onClose}
      defaultPosition={{ x: window.innerWidth - 360, y: 100 }}
      className="w-[320px]"
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AnimationCategory)} className="w-full">
        <TabsList className="w-full inline-flex h-9 items-center justify-start gap-0 bg-transparent p-0 border-b border-border">
          <TabsTrigger 
            value="in" 
            className="relative text-xs h-9 px-4 data-[state=active]:text-foreground data-[state=active]:font-medium text-muted-foreground rounded-none border-r border-border first:border-l-0 hover:text-foreground transition-colors data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary"
          >
            IN
          </TabsTrigger>
          <TabsTrigger 
            value="out" 
            className="relative text-xs h-9 px-4 data-[state=active]:text-foreground data-[state=active]:font-medium text-muted-foreground rounded-none border-r border-border hover:text-foreground transition-colors data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary"
          >
            OUT
          </TabsTrigger>
          <TabsTrigger 
            value="custom" 
            className="relative text-xs h-9 px-4 data-[state=active]:text-foreground data-[state=active]:font-medium text-muted-foreground rounded-none hover:text-foreground transition-colors data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary"
          >
            CUSTOM
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[280px] mt-3">
          <TabsContent value="in" className="pb-2 mt-0">
            {Object.entries(groupedAnimations).map(([subcategory, anims]) => (
              <div key={subcategory} className="mb-4">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase mb-2 tracking-wide">{subcategory}</h4>
                <div className="grid grid-cols-3 gap-2">
                  {anims.map((anim) => (
                    <button
                      key={anim.type}
                      onClick={() => handleAnimationSelect(anim)}
                      onMouseEnter={() => setHoveredAnimation(anim.type)}
                      onMouseLeave={() => setHoveredAnimation(null)}
                      className={`relative h-16 rounded-lg border overflow-hidden transition-all ${
                        selectedAnimation === anim.type
                          ? "ring-2 ring-primary bg-primary/10 border-primary"
                          : "hover:border-primary/50 bg-card/50 hover:bg-card border-border"
                      }`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center pb-5">
                        <div
                          key={hoveredAnimation === anim.type ? previewKey : 0}
                          className={`w-5 h-5 bg-primary rounded ${
                            hoveredAnimation === anim.type ? `animate-${anim.type}` : ""
                          }`}
                          style={{
                            animationDuration: duration,
                            animationTimingFunction: easing,
                          }}
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent p-1">
                        <p className="text-[9px] font-medium text-center truncate leading-tight">{anim.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="out" className="pb-2 mt-0">
            {Object.entries(groupedAnimations).map(([subcategory, anims]) => (
              <div key={subcategory} className="mb-4">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase mb-2 tracking-wide">{subcategory}</h4>
                <div className="grid grid-cols-3 gap-2">
                  {anims.map((anim) => (
                    <button
                      key={anim.type}
                      onClick={() => handleAnimationSelect(anim)}
                      onMouseEnter={() => setHoveredAnimation(anim.type)}
                      onMouseLeave={() => setHoveredAnimation(null)}
                      className={`relative h-16 rounded-lg border overflow-hidden transition-all ${
                        selectedAnimation === anim.type
                          ? "ring-2 ring-primary bg-primary/10 border-primary"
                          : "hover:border-primary/50 bg-card/50 hover:bg-card border-border"
                      }`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center pb-5">
                        <div
                          key={hoveredAnimation === anim.type ? previewKey : 0}
                          className={`w-5 h-5 bg-primary rounded ${
                            hoveredAnimation === anim.type ? `animate-${anim.type}` : ""
                          }`}
                          style={{
                            animationDuration: duration,
                            animationTimingFunction: easing,
                          }}
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent p-1">
                        <p className="text-[9px] font-medium text-center truncate leading-tight">{anim.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="custom" className="pb-2 mt-0">
            <div className="space-y-3 p-2">
              <p className="text-xs text-muted-foreground">
                Custom animations coming soon. Use timeline to create keyframe animations.
              </p>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">TRANSFORM</p>
                <div className="text-xs text-muted-foreground/70 space-y-1 pl-2">
                  <p>• Move</p>
                  <p>• Scale</p>
                  <p>• Rotate</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">STYLE</p>
                <div className="text-xs text-muted-foreground/70 space-y-1 pl-2">
                  <p>• Opacity</p>
                  <p>• Color</p>
                  <p>• Shadow</p>
                  <p>• Blur</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">OTHER</p>
                <div className="text-xs text-muted-foreground/70 space-y-1 pl-2">
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
      {activeTab !== "custom" && selectedAnimation !== "none" && (
        <div className="pt-3 mt-3 border-t space-y-3">
          {/* Preview Section */}
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Preview</Label>
            <Button
              onClick={triggerPreview}
              size="sm"
              variant="outline"
              className="h-7 px-3 text-xs"
            >
              <Play className="h-3 w-3 mr-1.5" />
              Replay
            </Button>
          </div>

          {/* Timing Controls */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Duration</Label>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-8 text-xs"
                placeholder="0.5s"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Delay</Label>
              <Input
                value={delay}
                onChange={(e) => setDelay(e.target.value)}
                className="h-8 text-xs"
                placeholder="0s"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Easing</Label>
            <Select value={easing} onValueChange={setEasing}>
              <SelectTrigger className="h-8 text-xs">
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
            <Label className="text-xs text-muted-foreground mb-1.5 block">Iterations</Label>
            <Select value={iterationCount} onValueChange={setIterationCount}>
              <SelectTrigger className="h-8 text-xs">
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
              className="flex-1 h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              size="sm"
              className="flex-1 h-8 text-xs"
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </DraggablePanel>
  );
}
