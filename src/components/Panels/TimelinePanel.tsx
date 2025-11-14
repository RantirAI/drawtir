import { useState, useRef, useEffect } from "react";
import { Element, Frame } from "@/types/elements";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Play, Pause, RotateCcw, Type, Image, Square, Circle, Video, Pen, Mic, Plus, Trash2, ZoomIn, ZoomOut } from "lucide-react";
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

// Voice avatars
import ariaAvatar from "@/assets/voices/aria-avatar.png";
import sarahAvatar from "@/assets/voices/sarah-avatar.png";
import lauraAvatar from "@/assets/voices/laura-avatar.png";
import riverAvatar from "@/assets/voices/river-avatar.png";
import charlotteAvatar from "@/assets/voices/charlotte-avatar.png";
import aliceAvatar from "@/assets/voices/alice-avatar.png";
import matildaAvatar from "@/assets/voices/matilda-avatar.png";
import jessicaAvatar from "@/assets/voices/jessica-avatar.png";
import lilyAvatar from "@/assets/voices/lily-avatar.png";
import rogerAvatar from "@/assets/voices/roger-avatar.png";
import charlieAvatar from "@/assets/voices/charlie-avatar.png";
import georgeAvatar from "@/assets/voices/george-avatar.png";
import callumAvatar from "@/assets/voices/callum-avatar.png";
import liamAvatar from "@/assets/voices/liam-avatar.png";
import willAvatar from "@/assets/voices/will-avatar.png";
import ericAvatar from "@/assets/voices/eric-avatar.png";
import chrisAvatar from "@/assets/voices/chris-avatar.png";
import brianAvatar from "@/assets/voices/brian-avatar.png";
import danielAvatar from "@/assets/voices/daniel-avatar.png";
import billAvatar from "@/assets/voices/bill-avatar.png";

const VOICE_AVATARS: Record<string, string> = {
  "9BWtsMINqrJLrRacOk9x": ariaAvatar,
  "CwhRBWXzGAHq8TQ4Fs17": rogerAvatar,
  "EXAVITQu4vr4xnSDxMaL": sarahAvatar,
  "FGY2WhTYpPnrIDTdsKH5": lauraAvatar,
  "IKne3meq5aSn9XLyUdCD": charlieAvatar,
  "JBFqnCBsd6RMkjVDRZzb": georgeAvatar,
  "N2lVS1w4EtoT3dr4eOWO": callumAvatar,
  "SAz9YHcvj6GT2YYXdXww": riverAvatar,
  "TX3LPaxmHKxFdv7VOQHJ": liamAvatar,
  "XB0fDUnXU5powFXDhCwa": charlotteAvatar,
  "Xb7hH8MSUJpSbSDYk0k2": aliceAvatar,
  "XrExE9yKIg1WjnnlVkGX": matildaAvatar,
  "bIHbv24MWmeRgasZH58o": willAvatar,
  "cgSgspJ2msm6clMCkdW9": jessicaAvatar,
  "cjVigY5qzO86Huf0OWal": ericAvatar,
  "iP95p4xoKVk53GoZ742B": chrisAvatar,
  "nPczCjzI2devNBz1zQrb": brianAvatar,
  "onwK4e9ZLuTAKqWW03F9": danielAvatar,
  "pFZP5JQG7iQjIQuC4Bku": lilyAvatar,
  "pqHfZKP75CvOlQylNhV4": billAvatar,
};

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
  voiceAudios?: Array<{ id: string; url: string; text: string; delay: number; duration: number; voiceId: string; voiceName: string; layerId?: number }>;
  onVoiceAudiosChange?: (voiceAudios: Array<{ id: string; url: string; text: string; delay: number; duration: number; voiceId: string; voiceName: string; layerId?: number }>) => void;
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [draggingPlayhead, setDraggingPlayhead] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [audioLayers, setAudioLayers] = useState<number[]>([1]);

  // Fixed timeline container width
  const timelineWidth = 800;
  // Content scales with zoom
  const contentWidth = timelineWidth * zoomLevel;
  // Pixels per second scales with zoom
  const pixelsPerSecond = (timelineWidth / maxDuration) * zoomLevel;

  const [voiceAudios, setVoiceAudios] = useState(externalVoiceAudios);
  const [selectedAnimation, setSelectedAnimation] = useState<{ element: Element; animation: any } | null>(null);
  const [contextMenuElement, setContextMenuElement] = useState<Element | null>(null);
  const [voiceDrawerOpen, setVoiceDrawerOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    setVoiceAudios(externalVoiceAudios);
  }, [externalVoiceAudios]);

  const handlePlayheadDrag = (e: React.MouseEvent) => {
    if (!timelineRef.current || !scrollContainerRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const x = e.clientX - rect.left + scrollLeft;
    const newTime = Math.max(0, Math.min((x / contentWidth) * maxDuration, maxDuration));
    onTimeChange(newTime);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDraggingPlayhead(true);
    handlePlayheadDrag(e);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingPlayhead) {
        handlePlayheadDrag(e as any);
      }
    };

    const handleMouseUp = () => {
      setDraggingPlayhead(false);
    };

    if (draggingPlayhead) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingPlayhead]);

  const getElementIcon = (element: Element) => {
    if (element.type === "text") return <Type className="w-3 h-3" />;
    if (element.type === "image") return <Image className="w-3 h-3" />;
    if (element.type === "video") return <Video className="w-3 h-3" />;
    if (element.type === "drawing") return <Pen className="w-3 h-3" />;
    if (element.type === "shape") {
      if (element.shapeType === "rectangle") return <Square className="w-3 h-3" />;
      if (element.shapeType === "ellipse") return <Circle className="w-3 h-3" />;
    }
    return <Square className="w-3 h-3" />;
  };

  const animationsByCategory = {
    entrance: [
      { id: "fade-in", type: "fade-in", name: "Fade In", delay: 0, duration: 1 },
      { id: "slide-in", type: "slide-in", name: "Slide In", delay: 0, duration: 1 },
      { id: "zoom-in", type: "zoom-in", name: "Zoom In", delay: 0, duration: 1 },
    ],
    exit: [
      { id: "fade-out", type: "fade-out", name: "Fade Out", delay: 0, duration: 1 },
      { id: "slide-out", type: "slide-out", name: "Slide Out", delay: 0, duration: 1 },
      { id: "zoom-out", type: "zoom-out", name: "Zoom Out", delay: 0, duration: 1 },
    ],
    emphasis: [
      { id: "pulse", type: "pulse", name: "Pulse", delay: 0, duration: 1 },
      { id: "shake", type: "shake", name: "Shake", delay: 0, duration: 1 },
      { id: "bounce", type: "bounce", name: "Bounce", delay: 0, duration: 1 },
    ],
  };

  const handleAddAnimation = (element: Element, animation: any) => {
    const newAnimation = {
      ...animation,
      id: `${animation.type}-${Date.now()}`,
    };
    const currentAnimations = element.animations || [];
    onUpdateElement(element.id, {
      animations: [...currentAnimations, newAnimation],
    });
  };

  const handleAnimationClick = (element: Element, animation: any) => {
    setSelectedAnimation({ element, animation });
  };

  const handleAnimationDrag = (
    element: Element,
    animation: any,
    e: React.MouseEvent
  ) => {
    if (!timelineRef.current || !scrollContainerRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const startX = e.clientX;
    const startDelay = animation.delay || 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaTime = deltaX / pixelsPerSecond;
      const newDelay = Math.max(0, Math.min(startDelay + deltaTime, maxDuration));

      const updatedAnimations = (element.animations || []).map((anim: any) =>
        anim.id === animation.id ? { ...anim, delay: newDelay } : anim
      );

      onUpdateElement(element.id, { animations: updatedAnimations });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleVoiceDrag = (voice: any, e: React.MouseEvent) => {
    if (!timelineRef.current || !scrollContainerRef.current) return;

    const startX = e.clientX;
    const startDelay = voice.delay || 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaTime = deltaX / pixelsPerSecond;
      const newDelay = Math.max(0, Math.min(startDelay + deltaTime, maxDuration));

      const updatedVoices = voiceAudios.map((v) =>
        v.id === voice.id ? { ...v, delay: newDelay } : v
      );

      setVoiceAudios(updatedVoices);
      onVoiceAudiosChange?.(updatedVoices);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleRemoveAnimation = (element: Element, animationId: string) => {
    const updatedAnimations = (element.animations || []).filter(
      (anim: any) => anim.id !== animationId
    );
    onUpdateElement(element.id, { animations: updatedAnimations });
  };

  const handleRemoveVoice = (voiceId: string) => {
    const updatedVoices = voiceAudios.filter((v) => v.id !== voiceId);
    setVoiceAudios(updatedVoices);
    onVoiceAudiosChange?.(updatedVoices);
  };

  const handleVoiceGenerated = (audioUrl: string, text: string, voiceId: string, voiceName: string) => {
    const newVoice = {
      id: `voice-${Date.now()}`,
      url: audioUrl,
      text: text,
      delay: currentTime,
      duration: 5, // Default duration, will be updated by audio metadata
      voiceId: voiceId,
      voiceName: voiceName,
      layerId: audioLayers[0] || 1,
    };

    const updatedVoices = [...voiceAudios, newVoice];
    setVoiceAudios(updatedVoices);
    onVoiceAudiosChange?.(updatedVoices);
    setVoiceDrawerOpen(false);
  };

  const handleAddLayer = () => {
    const newLayerId = Math.max(...audioLayers, 0) + 1;
    setAudioLayers([...audioLayers, newLayerId]);
  };

  const handleRemoveLayer = (layerId: number) => {
    if (audioLayers.length <= 1) return;
    setAudioLayers(audioLayers.filter(id => id !== layerId));
    const updatedVoices = voiceAudios.filter(v => v.layerId !== layerId);
    setVoiceAudios(updatedVoices);
    onVoiceAudiosChange?.(updatedVoices);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  };

  return (
    <div className="w-full p-4 bg-background border-t border-border">
      <div className="space-y-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPlayPause}
            className="w-20"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Play
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {currentTime.toFixed(2)}s / {maxDuration}s
          </span>

          {/* Zoom Controls */}
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 5}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground mb-1">Playhead Position</div>
          <div 
            ref={scrollContainerRef}
            className="relative overflow-x-auto"
            style={{ width: `${timelineWidth}px` }}
          >
            <div 
              ref={timelineRef}
              className="relative bg-secondary/20 rounded cursor-pointer border border-border/50"
              style={{ 
                width: `${contentWidth}px`,
                height: '60px'
              }}
              onMouseDown={handleMouseDown}
            >
              {/* Time markers */}
              <div className="absolute top-0 left-0 right-0 h-4 flex">
                {Array.from({ length: Math.floor(maxDuration) + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute text-xs text-muted-foreground"
                    style={{ left: `${(i / maxDuration) * 100}%` }}
                  >
                    {i}s
                  </div>
                ))}
              </div>

              {/* Playhead - Blue and full height */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
                style={{ 
                  left: `${(currentTime / maxDuration) * contentWidth}px`,
                  height: '100%'
                }}
              />
            </div>
          </div>
        </div>

        {/* Audio Layers Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground">Audio Layers</div>
            <div className="flex items-center gap-2">
              <VoiceSelector
                onSelectVoice={(voiceId, voiceName) => {
                  setSelectedVoice({ id: voiceId, name: voiceName });
                  setVoiceDrawerOpen(true);
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddLayer}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Layer
              </Button>
            </div>
          </div>

          <div 
            className="overflow-x-auto"
            style={{ width: `${timelineWidth}px` }}
          >
            <div className="space-y-2">
              {audioLayers.map((layer) => (
                <div key={layer} className="flex items-center gap-2">
                  <div className="flex items-center gap-1 min-w-24">
                    <span className="text-xs text-muted-foreground">Layer {layer}</span>
                    {audioLayers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLayer(layer)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <div
                    className="relative bg-secondary/10 rounded border border-border/30"
                    style={{ 
                      width: `${contentWidth}px`,
                      height: '48px'
                    }}
                  >
                    {voiceAudios
                      .filter((voice) => (voice.layerId || 1) === layer)
                      .map((voice) => {
                        const avatar = VOICE_AVATARS[voice.voiceId];
                        return (
                          <ContextMenu key={voice.id}>
                            <ContextMenuTrigger>
                              <div
                                className="absolute top-1 h-10 bg-accent/80 rounded border border-accent flex items-center px-2 gap-2 cursor-move hover:bg-accent transition-colors"
                                style={{
                                  left: `${voice.delay * pixelsPerSecond}px`,
                                  width: `${voice.duration * pixelsPerSecond}px`,
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  handleVoiceDrag(voice, e);
                                }}
                              >
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={avatar} />
                                  <AvatarFallback>
                                    <Mic className="w-3 h-3" />
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs truncate">{voice.voiceName}</span>
                              </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem
                                onClick={() => handleRemoveVoice(voice.id)}
                                className="text-destructive"
                              >
                                Remove
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Elements Timeline */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground mb-2">Element Animations</div>
          <div 
            className="overflow-x-auto"
            style={{ width: `${timelineWidth}px` }}
          >
            <div className="space-y-2">
              {elements.map((element) => (
                <ContextMenu key={element.id}>
                  <ContextMenuTrigger>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-2 min-w-32 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                          selectedElementIds.includes(element.id)
                            ? "bg-primary/20 text-primary"
                            : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                        }`}
                        onClick={() => onElementSelect?.(element.id)}
                      >
                        {getElementIcon(element)}
                        <span className="truncate">{element.id.slice(0, 8)}</span>
                      </div>
                      <div
                        className="relative bg-secondary/10 rounded border border-border/30"
                        style={{ 
                          width: `${contentWidth}px`,
                          height: '40px'
                        }}
                      >
                        {(element.animations || []).map((animation: any) => (
                          <div
                            key={animation.id}
                            className="absolute top-1 h-8 bg-primary/60 rounded border border-primary flex items-center px-2 cursor-move hover:bg-primary/80 transition-colors"
                            style={{
                              left: `${(animation.delay || 0) * pixelsPerSecond}px`,
                              width: `${(animation.duration || 1) * pixelsPerSecond}px`,
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleAnimationDrag(element, animation, e);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnimationClick(element, animation);
                            }}
                          >
                            <span className="text-xs text-primary-foreground truncate">
                              {animation.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuSub>
                      <ContextMenuSubTrigger>Add Animation</ContextMenuSubTrigger>
                      <ContextMenuSubContent>
                        {Object.entries(animationsByCategory).map(([category, animations]) => (
                          <ContextMenuSub key={category}>
                            <ContextMenuSubTrigger className="capitalize">
                              {category}
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent>
                              {animations.map((animation) => (
                                <ContextMenuItem
                                  key={animation.id}
                                  onClick={() => handleAddAnimation(element, animation)}
                                >
                                  {animation.name}
                                </ContextMenuItem>
                              ))}
                            </ContextMenuSubContent>
                          </ContextMenuSub>
                        ))}
                      </ContextMenuSubContent>
                    </ContextMenuSub>
                    <ContextMenuSeparator />
                    {(element.animations || []).length > 0 && (
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>Remove Animation</ContextMenuSubTrigger>
                        <ContextMenuSubContent>
                          {(element.animations || []).map((animation: any) => (
                            <ContextMenuItem
                              key={animation.id}
                              onClick={() => handleRemoveAnimation(element, animation.id)}
                              className="text-destructive"
                            >
                              {animation.type}
                            </ContextMenuItem>
                          ))}
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Voice Text Drawer */}
      <VoiceTextDrawer
        open={voiceDrawerOpen}
        onClose={() => setVoiceDrawerOpen(false)}
        voiceId={selectedVoice?.id || ""}
        voiceName={selectedVoice?.name || ""}
        onVoiceGenerated={handleVoiceGenerated}
      />
    </div>
  );
}
