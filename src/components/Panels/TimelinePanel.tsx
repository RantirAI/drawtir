import { useState, useRef, useEffect } from "react";
import { Element, Frame } from "@/types/elements";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import AnimationSettingsDialog from "./AnimationSettingsDialog";
import VoiceSelector from "./VoiceSelector";
import VoiceTextDrawer from "./VoiceTextDrawer";

interface TimelinePanelProps {
  frame: Frame | null;
  elements: Element[];
  onUpdateElement: (elementId: string, updates: Partial<Element>) => void;
  currentTime: number;
  onTimeChange: (time: number) => void;
  maxDuration: number;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onReset?: () => void;
  selectedElementIds?: string[];
  onElementSelect?: (elementId: string) => void;
  voiceAudios?: Array<{ id: string; url: string; text: string; delay: number; duration: number }>;
  onVoiceAudiosChange?: (voiceAudios: Array<{ id: string; url: string; text: string; delay: number; duration: number }>) => void;
}

export default function TimelinePanel({
  frame,
  elements,
  onUpdateElement,
  currentTime,
  onTimeChange,
  maxDuration = 5,
  isPlaying = false,
  onPlayPause,
  onReset,
  selectedElementIds = [],
  onElementSelect,
  voiceAudios: externalVoiceAudios = [],
  onVoiceAudiosChange,
}: TimelinePanelProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<{ id: string; name: string } | null>(null);
  const [voiceAudios, setVoiceAudios] = useState(externalVoiceAudios);
  const [draggingAnimation, setDraggingAnimation] = useState<{
    elementId: string;
    animationId: string;
    startX: number;
    startDelay: number;
    mode: 'move' | 'resize';
  } | null>(null);
  const [draggingVoice, setDraggingVoice] = useState<{
    voiceId: string;
    startX: number;
    startDelay: number;
    mode: 'move' | 'resize';
  } | null>(null);
  const [voiceDrawerOpen, setVoiceDrawerOpen] = useState(false);
  const [voiceDrawerTimestamp, setVoiceDrawerTimestamp] = useState(0);

  // Sync external voice audios
  useEffect(() => {
    setVoiceAudios(externalVoiceAudios);
  }, [externalVoiceAudios]);

  // Notify parent of voice audios changes
  useEffect(() => {
    onVoiceAudiosChange?.(voiceAudios);
  }, [voiceAudios, onVoiceAudiosChange]);

  const parseDuration = (duration: string): number => {
    if (duration.endsWith('ms')) {
      return parseFloat(duration) / 1000;
    } else if (duration.endsWith('s')) {
      return parseFloat(duration);
    }
    const n = parseFloat(duration);
    return !isNaN(n) ? n : 1;
  };

  const parseDelay = (delay: string): number => {
    if (delay.endsWith('ms')) {
      return parseFloat(delay) / 1000;
    } else if (delay.endsWith('s')) {
      return parseFloat(delay);
    }
    const n = parseFloat(delay);
    return !isNaN(n) ? n : 0;
  };

  const handlePlayheadDrag = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const time = (x / rect.width) * maxDuration;
    onTimeChange(time);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDraggingPlayhead(true);
    handlePlayheadDrag(e);
  };

  const handleAnimationDrag = (e: MouseEvent) => {
    if (!timelineRef.current || !draggingAnimation) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const timeAtMouse = (x / rect.width) * maxDuration;

    const element = elements.find(el => el.id === draggingAnimation.elementId);
    if (!element || !element.animations) return;

    const animation = element.animations.find(a => a.id === draggingAnimation.animationId);
    if (!animation) return;

    if (draggingAnimation.mode === 'move') {
      const deltaX = x - draggingAnimation.startX;
      const deltaTime = (deltaX / rect.width) * maxDuration;
      const newDelay = Math.max(0, Math.min(draggingAnimation.startDelay + deltaTime, maxDuration));
      handleUpdateAnimation(draggingAnimation.elementId, draggingAnimation.animationId, {
        delay: `${newDelay.toFixed(2)}s`,
      });
    } else if (draggingAnimation.mode === 'resize') {
      const delay = parseDelay(animation.delay);
      const newDuration = Math.max(0.1, Math.min(timeAtMouse - delay, maxDuration - delay));
      handleUpdateAnimation(draggingAnimation.elementId, draggingAnimation.animationId, {
        duration: `${newDuration.toFixed(2)}s`,
      });
    }
  };

  const handleVoiceDrag = (e: MouseEvent) => {
    if (!timelineRef.current || !draggingVoice) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const timeAtMouse = (x / rect.width) * maxDuration;

    const voice = voiceAudios.find(v => v.id === draggingVoice.voiceId);
    if (!voice) return;

    if (draggingVoice.mode === 'move') {
      const deltaX = x - draggingVoice.startX;
      const deltaTime = (deltaX / rect.width) * maxDuration;
      const newDelay = Math.max(0, Math.min(draggingVoice.startDelay + deltaTime, maxDuration - voice.duration));
      
      setVoiceAudios(prev => prev.map(v =>
        v.id === draggingVoice.voiceId ? { ...v, delay: newDelay } : v
      ));
    } else if (draggingVoice.mode === 'resize') {
      const newDuration = Math.max(0.1, Math.min(timeAtMouse - voice.delay, maxDuration - voice.delay));
      
      setVoiceAudios(prev => prev.map(v =>
        v.id === draggingVoice.voiceId ? { ...v, duration: newDuration } : v
      ));
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPlayhead) {
        handlePlayheadDrag(e as any);
      } else if (draggingAnimation) {
        handleAnimationDrag(e);
      } else if (draggingVoice) {
        handleVoiceDrag(e);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
      setDraggingAnimation(null);
      setDraggingVoice(null);
    };

    if (isDraggingPlayhead || draggingAnimation || draggingVoice) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingPlayhead, draggingAnimation, draggingVoice, maxDuration, voiceAudios]);

  const timeMarkers = Array.from({ length: maxDuration + 1 }, (_, i) => i);

  // Animation presets organized by category
  const animationsByCategory = {
    "Fade": [
      { name: "Fade In", value: "fade-in" },
      { name: "Fade Out", value: "fade-out" },
    ],
    "Slide In": [
      { name: "From Top", value: "slide-in-from-top" },
      { name: "From Bottom", value: "slide-in-from-bottom" },
      { name: "From Left", value: "slide-in-from-left" },
      { name: "From Right", value: "slide-in-from-right" },
    ],
    "Slide Out": [
      { name: "To Top", value: "slide-out-to-top" },
      { name: "To Bottom", value: "slide-out-to-bottom" },
      { name: "To Left", value: "slide-out-to-left" },
      { name: "To Right", value: "slide-out-to-right" },
    ],
    "Scale": [
      { name: "Zoom In", value: "zoom-in" },
      { name: "Zoom Out", value: "zoom-out" },
      { name: "Bounce", value: "bounce" },
      { name: "Pulse", value: "pulse" },
    ],
    "Special": [
      { name: "Spin", value: "spin" },
      { name: "Ping", value: "ping" },
    ],
  };

  const handleAddAnimation = (elementId: string, animationType: string, clickTimeInSeconds?: number) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const delay = clickTimeInSeconds !== undefined ? clickTimeInSeconds : 0;
    const newAnimation = {
      id: `anim-${Date.now()}`,
      type: animationType as any,
      duration: "0.5s",
      delay: `${delay}s`,
      timingFunction: "ease-out",
      iterationCount: "1",
      category: (animationType.includes("out") ? "out" : "in") as "in" | "out" | "custom",
    };

    const currentAnimations = element.animations || [];
    onUpdateElement(elementId, {
      animations: [...currentAnimations, newAnimation],
    });
  };

  const handleUpdateAnimation = (elementId: string, animationId: string, updates: Partial<Element["animations"][0]>) => {
    const element = elements.find(el => el.id === elementId);
    if (!element || !element.animations) return;

    const updatedAnimations = element.animations.map(anim =>
      anim.id === animationId ? { ...anim, ...updates } : anim
    );

    onUpdateElement(elementId, { animations: updatedAnimations });
  };

  const handleRemoveAnimation = (elementId: string, animationId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (!element || !element.animations) return;

    const updatedAnimations = element.animations.filter(anim => anim.id !== animationId);
    onUpdateElement(elementId, { animations: updatedAnimations });
  };

  const handleTrackRightClick = (element: Element, e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickTime = (x / rect.width) * maxDuration;
    return clickTime;
  };

  const handleVoiceGenerated = (audioUrl: string, text: string) => {
    const audio = new Audio(audioUrl);
    audio.addEventListener('loadedmetadata', () => {
      const newVoice = {
        id: `voice-${Date.now()}`,
        url: audioUrl,
        text,
        delay: voiceDrawerTimestamp,
        duration: audio.duration,
      };
      setVoiceAudios(prev => [...prev, newVoice]);
    });
    setSelectedVoice(null);
    setVoiceDrawerOpen(false);
  };

  const handleRemoveVoice = (voiceId: string) => {
    setVoiceAudios(prev => prev.filter(v => v.id !== voiceId));
  };

  const handleVoiceTrackRightClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickTime = Math.max(0, (x / rect.width) * maxDuration);
    setVoiceDrawerTimestamp(clickTime);
    setVoiceDrawerOpen(true);
  };

  // Play voices at appropriate times
  useEffect(() => {
    voiceAudios.forEach(voice => {
      if (currentTime >= voice.delay && currentTime < voice.delay + voice.duration) {
        const audio = new Audio(voice.url);
        const offset = currentTime - voice.delay;
        audio.currentTime = offset;
        if (isPlaying) {
          audio.play();
        }
      }
    });
  }, [currentTime, isPlaying, voiceAudios]);

  return (
    <>
    <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <h3 className="text-sm font-medium">Timeline</h3>
        <div className="flex items-center gap-2">
          <VoiceSelector onSelectVoice={(voiceId, voiceName) => setSelectedVoice({ id: voiceId, name: voiceName })} />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onReset}
            title="Reset to start"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button
            variant={isPlaying ? "default" : "ghost"}
            size="icon"
            className="h-6 w-6"
            onClick={onPlayPause}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <span className="text-xs text-muted-foreground">
            {currentTime.toFixed(2)}s / {maxDuration}s
          </span>
        </div>
      </div>

      <ScrollArea className="h-48">
        <div className="p-4">
          {/* Header with time markers - aligned with timeline track */}
          <div className="flex items-start gap-2 mb-2">
            <div className="w-32 flex-shrink-0 h-6" /> {/* Spacer for layer names */}
            <div className="flex-1 relative h-6" ref={timelineRef}>
              <div className="absolute inset-0 flex justify-between text-xs text-muted-foreground">
                {timeMarkers.map((marker) => (
                  <div key={marker} className="flex flex-col items-center">
                    <span>{marker}s</span>
                    <div className="w-px h-2 bg-border mt-1" />
                  </div>
                ))}
              </div>

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-px bg-destructive z-10 cursor-ew-resize"
                style={{ left: `${(currentTime / maxDuration) * 100}%` }}
                onMouseDown={handleMouseDown}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-destructive rounded-full -mt-1" />
              </div>

              {/* Click area for playhead positioning */}
              <div
                className="absolute inset-0 cursor-pointer"
                onMouseDown={handleMouseDown}
              />
            </div>
          </div>

          {/* Element tracks */}
          <div className="space-y-2 mt-4">
            {/* Voice track row */}
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div 
                  className="flex items-center gap-2 p-1 rounded hover:bg-muted/50 transition-colors"
                  onContextMenu={(e) => {
                    const trackElement = e.currentTarget.querySelector('.flex-1.relative') as HTMLElement;
                    if (trackElement && timelineRef.current) {
                      const rect = timelineRef.current.getBoundingClientRect();
                      const trackRect = trackElement.getBoundingClientRect();
                      const x = e.clientX - trackRect.left;
                      const clickTime = Math.max(0, (x / trackRect.width) * maxDuration);
                      setVoiceDrawerTimestamp(clickTime);
                    }
                  }}
                >
                  <div className="w-32 flex-shrink-0">
                    <div className="text-xs truncate font-medium">Voice</div>
                    <div className="text-[10px] text-muted-foreground">
                      {voiceAudios.length} clip{voiceAudios.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex-1 relative h-8 bg-muted/30 rounded">
                    {voiceAudios.map((voice) => {
                      const startPercent = (voice.delay / maxDuration) * 100;
                      const widthPercent = (voice.duration / maxDuration) * 100;
                      
                      return (
                        <ContextMenu key={voice.id}>
                          <ContextMenuTrigger asChild>
                            <div
                              className="absolute top-1 bottom-1 rounded bg-purple-500 hover:bg-purple-600 cursor-move transition-colors group"
                              style={{
                                left: `${startPercent}%`,
                                width: `${widthPercent}%`,
                              }}
                              onMouseDown={(e) => {
                                if (!timelineRef.current) return;
                                e.stopPropagation();
                                
                                const rect = timelineRef.current.getBoundingClientRect();
                                const barRect = e.currentTarget.getBoundingClientRect();
                                const clickX = e.clientX - barRect.left;
                                const isResizeZone = clickX > barRect.width - 8;
                                
                                if (isResizeZone) {
                                  setDraggingVoice({
                                    voiceId: voice.id,
                                    startX: e.clientX - rect.left,
                                    startDelay: voice.delay,
                                    mode: 'resize',
                                  });
                                } else {
                                  setDraggingVoice({
                                    voiceId: voice.id,
                                    startX: e.clientX - rect.left,
                                    startDelay: voice.delay,
                                    mode: 'move',
                                  });
                                }
                              }}
                            >
                              <div className="h-full flex items-center justify-between px-1">
                                <div className="text-[10px] text-white font-medium truncate">
                                  {voice.text.substring(0, 15)}...
                                </div>
                                <div className="w-1 h-full bg-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem onClick={() => handleRemoveVoice(voice.id)}>
                              Remove Voice
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      );
                    })}
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => setVoiceDrawerOpen(true)}>
                  Add Voice Here
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
            
            {elements.map((element) => {
              const isSelected = selectedElementIds.includes(element.id);
              const elementName = element.name || (element.type === "text" ? element.text || "Text" : element.type === "drawing" ? "Drawing" : element.shapeType || element.type);
              const elementAnimations = element.animations || [];

              return (
                <ContextMenu key={element.id}>
                  <ContextMenuTrigger asChild>
                    <div 
                      className={`flex items-center gap-2 p-1 rounded transition-colors cursor-pointer ${
                        isSelected ? "bg-blue-500/10 ring-1 ring-blue-500/50" : ""
                      }`}
                      onClick={() => onElementSelect?.(element.id)}
                    >
                  <div className="w-32 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <div className="text-xs truncate font-medium">
                        {elementName}
                      </div>
                    </div>
                    {elementAnimations.length > 0 && (
                      <div className="text-[10px] text-muted-foreground">
                        {elementAnimations.length} animation{elementAnimations.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div className="flex-1 relative h-8 bg-muted/30 rounded">
                        {elementAnimations.map((anim) => {
                          const delay = parseDelay(anim.delay);
                          const duration = parseDuration(anim.duration);
                          const startPercent = (delay / maxDuration) * 100;
                          const widthPercent = (duration / maxDuration) * 100;

                          return (
                            <AnimationSettingsDialog
                              key={anim.id}
                              animation={anim}
                              elementId={element.id}
                              onUpdate={(animId, updates) => handleUpdateAnimation(element.id, animId, updates)}
                              onRemove={(animId) => handleRemoveAnimation(element.id, animId)}
                              trigger={
                                <div
                                  className={`absolute top-1 bottom-1 rounded cursor-move transition-colors group ${
                                    isSelected ? "bg-blue-500 hover:bg-blue-600" : "bg-primary hover:bg-primary/80"
                                  }`}
                                  style={{
                                    left: `${startPercent}%`,
                                    width: `${widthPercent}%`,
                                  }}
                                  onMouseDown={(e) => {
                                    if (!timelineRef.current) return;
                                    e.stopPropagation();
                                    onElementSelect?.(element.id);
                                    
                                    const rect = timelineRef.current.getBoundingClientRect();
                                    const barRect = e.currentTarget.getBoundingClientRect();
                                    const clickX = e.clientX - barRect.left;
                                    const isResizeZone = clickX > barRect.width - 8;
                                    
                                    if (isResizeZone) {
                                      setDraggingAnimation({
                                        elementId: element.id,
                                        animationId: anim.id,
                                        startX: e.clientX - rect.left,
                                        startDelay: parseDelay(anim.delay),
                                        mode: 'resize',
                                      });
                                    } else {
                                      setDraggingAnimation({
                                        elementId: element.id,
                                        animationId: anim.id,
                                        startX: e.clientX - rect.left,
                                        startDelay: parseDelay(anim.delay),
                                        mode: 'move',
                                      });
                                    }
                                  }}
                                >
                                  <div className="h-full flex items-center justify-between px-1">
                                    <div className="text-[10px] text-primary-foreground font-medium truncate">
                                      {anim.type}
                                    </div>
                                    <div className="w-2 h-full cursor-ew-resize flex items-center justify-center">
                                      <div className="w-0.5 h-3 bg-primary-foreground/50 rounded" />
                                    </div>
                                  </div>
                                </div>
                              }
                            />
                          );
                        })}
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-56" onContextMenu={(e) => e.preventDefault()}>
                      {Object.entries(animationsByCategory).map(([category, animations]) => (
                        <ContextMenuSub key={category}>
                          <ContextMenuSubTrigger className="text-xs">
                            {category}
                          </ContextMenuSubTrigger>
                          <ContextMenuSubContent className="w-48">
                            {animations.map((anim) => (
                              <ContextMenuItem
                                key={anim.value}
                                onClick={(e) => {
                                  const clickTime = handleTrackRightClick(element, e as any);
                                  handleAddAnimation(element.id, anim.value, clickTime);
                                }}
                                className="text-xs"
                              >
                                {anim.name}
                              </ContextMenuItem>
                            ))}
                          </ContextMenuSubContent>
                        </ContextMenuSub>
                      ))}
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => onUpdateElement(element.id, { animations: [] })}
                        className="text-xs text-destructive"
                        disabled={elementAnimations.length === 0}
                      >
                        Remove All Animations
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-56">
                {Object.entries(animationsByCategory).map(([category, animations]) => (
                  <ContextMenuSub key={category}>
                    <ContextMenuSubTrigger className="text-xs">
                      {category}
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-48">
                      {animations.map((anim) => (
                        <ContextMenuItem
                          key={anim.value}
                          onClick={() => handleAddAnimation(element.id, anim.value, 0)}
                          className="text-xs"
                        >
                          {anim.name}
                        </ContextMenuItem>
                      ))}
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                ))}
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => onUpdateElement(element.id, { animations: [] })}
                  className="text-xs text-destructive"
                  disabled={elementAnimations.length === 0}
                >
                  Remove All Animations
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>

      <VoiceTextDrawer
        open={voiceDrawerOpen}
        onClose={() => setVoiceDrawerOpen(false)}
        voiceId={selectedVoice?.id || "9BWtsMINqrJLrRacOk9x"}
        voiceName={selectedVoice?.name || "Aria"}
        onVoiceGenerated={handleVoiceGenerated}
      />
    </>
  );
}
