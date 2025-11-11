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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  category: "in" | "out" | "scale" | "special";
  duration?: string;
}

const animations: Animation[] = [
  { type: "none", name: "None", description: "No animation", category: "in" },
  { type: "fade-in", name: "Fade In", description: "Smooth fade in", category: "in", duration: "0.5s" },
  { type: "slide-in-from-top", name: "From Top", description: "Slide from top", category: "in", duration: "0.5s" },
  { type: "slide-in-from-bottom", name: "From Bottom", description: "Slide from bottom", category: "in", duration: "0.5s" },
  { type: "slide-in-from-left", name: "From Left", description: "Slide from left", category: "in", duration: "0.5s" },
  { type: "slide-in-from-right", name: "From Right", description: "Slide from right", category: "in", duration: "0.5s" },
  { type: "zoom-in", name: "Zoom In", description: "Scale up", category: "scale", duration: "0.5s" },
  { type: "bounce", name: "Bounce", description: "Bouncing entrance", category: "scale", duration: "1s" },
  { type: "fade-out", name: "Fade Out", description: "Smooth fade out", category: "out", duration: "0.5s" },
  { type: "slide-out-to-top", name: "To Top", description: "Slide to top", category: "out", duration: "0.5s" },
  { type: "slide-out-to-bottom", name: "To Bottom", description: "Slide to bottom", category: "out", duration: "0.5s" },
  { type: "slide-out-to-left", name: "To Left", description: "Slide to left", category: "out", duration: "0.5s" },
  { type: "slide-out-to-right", name: "To Right", description: "Slide to right", category: "out", duration: "0.5s" },
  { type: "zoom-out", name: "Zoom Out", description: "Scale down", category: "out", duration: "0.5s" },
  { type: "pulse", name: "Pulse", description: "Pulsing loop", category: "special", duration: "2s" },
  { type: "spin", name: "Spin", description: "Rotation loop", category: "special", duration: "1s" },
  { type: "ping", name: "Ping", description: "Ping effect", category: "special", duration: "1s" },
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
  const [activeTab, setActiveTab] = useState<"in" | "out" | "special">("in");

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

  const getAnimationsByCategory = (category: "in" | "out" | "scale" | "special") => {
    return animations.filter(anim => anim.category === category);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-2 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <DialogTitle className="text-sm">Animations</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-0 h-[600px]">
          {/* Animation Grid - Left 2 columns */}
          <div className="col-span-2 border-r">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full flex flex-col">
              <TabsList className="w-full rounded-none border-b bg-muted/30 h-12 p-1">
                <TabsTrigger value="in" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Entrance
                </TabsTrigger>
                <TabsTrigger value="out" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Exit
                </TabsTrigger>
                <TabsTrigger value="special" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Loops
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                <TabsContent value="in" className="p-6 mt-0">
                  {/* FADE Section */}
                  <div className="mb-8">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Fade</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {getAnimationsByCategory("in").filter(a => a.type.includes("fade")).map((animation) => (
                        <AnimationCard
                          key={animation.type}
                          animation={animation}
                          selected={selectedAnimation === animation.type}
                          hovered={hoveredAnimation === animation.type}
                          previewKey={previewKey}
                          duration={duration}
                          delay={delay}
                          easing={easing}
                          iterationCount={iterationCount}
                          onSelect={() => {
                            setSelectedAnimation(animation.type);
                            if (animation.duration) setDuration(animation.duration.replace('s', ''));
                          }}
                          onHover={setHoveredAnimation}
                        />
                      ))}
                    </div>
                  </div>

                  {/* SLIDE Section */}
                  <div className="mb-8">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Slide</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {getAnimationsByCategory("in").filter(a => a.type.includes("slide")).map((animation) => (
                        <AnimationCard
                          key={animation.type}
                          animation={animation}
                          selected={selectedAnimation === animation.type}
                          hovered={hoveredAnimation === animation.type}
                          previewKey={previewKey}
                          duration={duration}
                          delay={delay}
                          easing={easing}
                          iterationCount={iterationCount}
                          onSelect={() => {
                            setSelectedAnimation(animation.type);
                            if (animation.duration) setDuration(animation.duration.replace('s', ''));
                          }}
                          onHover={setHoveredAnimation}
                        />
                      ))}
                    </div>
                  </div>

                  {/* SCALE Section */}
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Scale</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {getAnimationsByCategory("scale").map((animation) => (
                        <AnimationCard
                          key={animation.type}
                          animation={animation}
                          selected={selectedAnimation === animation.type}
                          hovered={hoveredAnimation === animation.type}
                          previewKey={previewKey}
                          duration={duration}
                          delay={delay}
                          easing={easing}
                          iterationCount={iterationCount}
                          onSelect={() => {
                            setSelectedAnimation(animation.type);
                            if (animation.duration) setDuration(animation.duration.replace('s', ''));
                          }}
                          onHover={setHoveredAnimation}
                        />
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="out" className="p-6 mt-0">
                  {/* FADE OUT Section */}
                  <div className="mb-8">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Fade</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {getAnimationsByCategory("out").filter(a => a.type.includes("fade")).map((animation) => (
                        <AnimationCard
                          key={animation.type}
                          animation={animation}
                          selected={selectedAnimation === animation.type}
                          hovered={hoveredAnimation === animation.type}
                          previewKey={previewKey}
                          duration={duration}
                          delay={delay}
                          easing={easing}
                          iterationCount={iterationCount}
                          onSelect={() => {
                            setSelectedAnimation(animation.type);
                            if (animation.duration) setDuration(animation.duration.replace('s', ''));
                          }}
                          onHover={setHoveredAnimation}
                        />
                      ))}
                    </div>
                  </div>

                  {/* SLIDE OUT Section */}
                  <div className="mb-8">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Slide</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {getAnimationsByCategory("out").filter(a => a.type.includes("slide")).map((animation) => (
                        <AnimationCard
                          key={animation.type}
                          animation={animation}
                          selected={selectedAnimation === animation.type}
                          hovered={hoveredAnimation === animation.type}
                          previewKey={previewKey}
                          duration={duration}
                          delay={delay}
                          easing={easing}
                          iterationCount={iterationCount}
                          onSelect={() => {
                            setSelectedAnimation(animation.type);
                            if (animation.duration) setDuration(animation.duration.replace('s', ''));
                          }}
                          onHover={setHoveredAnimation}
                        />
                      ))}
                    </div>
                  </div>

                  {/* SCALE OUT Section */}
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Scale</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {getAnimationsByCategory("out").filter(a => a.type.includes("zoom")).map((animation) => (
                        <AnimationCard
                          key={animation.type}
                          animation={animation}
                          selected={selectedAnimation === animation.type}
                          hovered={hoveredAnimation === animation.type}
                          previewKey={previewKey}
                          duration={duration}
                          delay={delay}
                          easing={easing}
                          iterationCount={iterationCount}
                          onSelect={() => {
                            setSelectedAnimation(animation.type);
                            if (animation.duration) setDuration(animation.duration.replace('s', ''));
                          }}
                          onHover={setHoveredAnimation}
                        />
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="special" className="p-6 mt-0">
                  <div className="grid grid-cols-3 gap-3">
                    {getAnimationsByCategory("special").map((animation) => (
                      <AnimationCard
                        key={animation.type}
                        animation={animation}
                        selected={selectedAnimation === animation.type}
                        hovered={hoveredAnimation === animation.type}
                        previewKey={previewKey}
                        duration={duration}
                        delay={delay}
                        easing={easing}
                        iterationCount={iterationCount}
                        onSelect={() => {
                          setSelectedAnimation(animation.type);
                          if (animation.duration) setDuration(animation.duration.replace('s', ''));
                        }}
                        onHover={setHoveredAnimation}
                      />
                    ))}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Settings Panel - Right column */}
          <div className="p-6 bg-muted/20 flex flex-col">
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="font-semibold text-sm mb-3 text-foreground">Preview</h3>
                
                {/* Large Preview */}
                <div className="h-40 flex items-center justify-center bg-background rounded-lg border-2 border-border/50 mb-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                  <div
                    key={`preview-${selectedAnimation}-${previewKey}`}
                    className={`w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-xl shadow-lg relative z-10 ${
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
                  className="w-full"
                  onClick={triggerPreview}
                  disabled={selectedAnimation === "none"}
                >
                  <Play className="w-3 h-3 mr-2" />
                  Replay Preview
                </Button>
              </div>

              {/* Animation Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-foreground">Settings</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium">Duration</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">seconds</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Delay</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={delay}
                        onChange={(e) => setDelay(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">seconds</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Easing</Label>
                    <Select value={easing} onValueChange={setEasing}>
                      <SelectTrigger className="h-9 text-sm mt-1.5">
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
                    <Label className="text-xs font-medium">Repeat</Label>
                    <Select value={iterationCount} onValueChange={setIterationCount}>
                      <SelectTrigger className="h-9 text-sm mt-1.5">
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

            <div className="flex gap-2 pt-4 border-t mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleApply} className="flex-1">
                Apply
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Animation Card Component
interface AnimationCardProps {
  animation: Animation;
  selected: boolean;
  hovered: boolean;
  previewKey: number;
  duration: string;
  delay: string;
  easing: string;
  iterationCount: string;
  onSelect: () => void;
  onHover: (type: AnimationType | null) => void;
}

function AnimationCard({
  animation,
  selected,
  hovered,
  previewKey,
  duration,
  delay,
  easing,
  iterationCount,
  onSelect,
  onHover,
}: AnimationCardProps) {
  return (
    <div
      className={`group relative p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] ${
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border/50 hover:border-primary/30 hover:bg-accent/30"
      }`}
      onClick={onSelect}
      onMouseEnter={() => onHover(animation.type)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Preview Box */}
      <div className="h-20 flex items-center justify-center mb-2 bg-gradient-to-br from-muted/80 to-muted/40 rounded-md overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div
          key={`${animation.type}-${hovered ? previewKey : 'static'}`}
          className={`w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-lg shadow-md relative z-10 ${
            hovered && animation.type !== "none" ? `animate-${animation.type}` : ""
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
      <div className="text-center">
        <div className="font-medium text-xs text-foreground">{animation.name}</div>
      </div>

      {/* Selected Indicator */}
      {selected && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
      )}
    </div>
  );
}
