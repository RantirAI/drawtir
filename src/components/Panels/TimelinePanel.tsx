import { useState, useRef, useEffect } from "react";
import { Element, Frame } from "@/types/elements";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Play, Pause, RotateCcw, Type, Image, Square, Circle, Video, Pen, Mic, Plus, Trash2 } from "lucide-react";
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
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [audioLayers, setAudioLayers] = useState<number[]>([0]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [voiceAudios, setVoiceAudios] = useState(externalVoiceAudios);
  const [draggingAnimation, setDraggingAnimation] = useState<string | null>(null);
  const [draggingVoice, setDraggingVoice] = useState<string | null>(null);
  const [voiceDrawerOpen, setVoiceDrawerOpen] = useState(false);
  const [voiceDrawerTimestamp, setVoiceDrawerTimestamp] = useState(0);
  const [editingAnimation, setEditingAnimation] = useState<{
    elementId: string;
    animIndex: number;
  } | null>(null);
  const [contextMenuElement, setContextMenuElement] = useState<string | null>(null);
  const [audioRefs] = useState<Map<string, HTMLAudioElement>>(new Map());

  const timelineWidth = 800 * zoomLevel;
  const pixelsPerSecond = timelineWidth / maxDuration;

  useEffect(() => {
    setVoiceAudios(externalVoiceAudios);
  }, [externalVoiceAudios]);

  useEffect(() => {
    if (onVoiceAudiosChange) {
      onVoiceAudiosChange(voiceAudios);
    }
  }, [voiceAudios, onVoiceAudiosChange]);

  useEffect(() => {
    if (isDraggingPlayhead || draggingAnimation || draggingVoice) {
      const handleMouseMove = (e: MouseEvent) => {
        if (isDraggingPlayhead) {
          handlePlayheadDrag(e.clientX);
        }
      };

      const handleMouseUp = () => {
        setIsDraggingPlayhead(false);
        setDraggingAnimation(null);
        setDraggingVoice(null);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDraggingPlayhead, draggingAnimation, draggingVoice, maxDuration]);

  useEffect(() => {
    voiceAudios.forEach((voice) => {
      if (!audioRefs.has(voice.id)) {
        const audio = new Audio(voice.url);
        audioRefs.set(voice.id, audio);
      }
    });

    audioRefs.forEach((audio, id) => {
      if (!voiceAudios.find(v => v.id === id)) {
        audio.pause();
        audioRefs.delete(id);
      }
    });

    if (isPlaying) {
      voiceAudios.forEach((voice) => {
        const audio = audioRefs.get(voice.id);
        if (audio) {
          const startTime = voice.delay;
          const endTime = voice.delay + voice.duration;

          if (currentTime >= startTime && currentTime <= endTime) {
            const audioTime = currentTime - startTime;
            if (Math.abs(audio.currentTime - audioTime) > 0.1) {
              audio.currentTime = audioTime;
            }
            if (audio.paused) {
              audio.play().catch(console.error);
            }
          } else {
            if (!audio.paused) {
              audio.pause();
            }
          }
        }
      });
    } else {
      audioRefs.forEach((audio) => {
        if (!audio.paused) {
          audio.pause();
        }
      });
    }
  }, [currentTime, isPlaying, voiceAudios, audioRefs]);

  const parseDuration = (duration?: string): number => {
    if (!duration) return 1;
    const match = duration.match(/(\d+(?:\.\d+)?)/);
    if (!match) return 1;
    return parseFloat(match[1]);
  };

  const parseDelay = (delay?: string): number => {
    if (!delay) return 0;
    const match = delay.match(/(\d+(?:\.\d+)?)/);
    if (!match) return 0;
    return parseFloat(match[1]);
  };

  const handlePlayheadDrag = (clientX: number) => {
    if (!timelineRef.current || !scrollContainerRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const x = clientX - rect.left + scrollLeft;
    const time = (x / timelineWidth) * maxDuration;
    onTimeChange(Math.max(0, Math.min(maxDuration, time)));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.timeline-bg')) {
      setIsDraggingPlayhead(true);
      handlePlayheadDrag(e.clientX);
    }
  };

  const handleAnimationDrag = (e: React.MouseEvent, elementId: string, animIndex: number) => {
    e.preventDefault();
    setDraggingAnimation(`${elementId}-${animIndex}`);
    
    const element = elements.find(el => el.id === elementId);
    if (!element || !element.animations) return;
    
    const animation = element.animations[animIndex];
    const startX = e.clientX;
    const startDelay = parseDelay(animation.delay);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!timelineRef.current || !scrollContainerRef.current) return;
      
      const deltaX = moveEvent.clientX - startX;
      const deltaTime = (deltaX / pixelsPerSecond);
      const newDelay = Math.max(0, startDelay + deltaTime);
      
      const updatedAnimations = [...(element.animations || [])];
      updatedAnimations[animIndex] = {
        ...animation,
        delay: `${newDelay}s`,
      };
      
      onUpdateElement(elementId, { animations: updatedAnimations });
    };
    
    const handleMouseUp = () => {
      setDraggingAnimation(null);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleVoiceDrag = (e: React.MouseEvent, voice: any) => {
    e.preventDefault();
    setDraggingVoice(voice.id);
    
    const startX = e.clientX;
    const startDelay = voice.delay;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!timelineRef.current || !scrollContainerRef.current) return;
      
      const deltaX = moveEvent.clientX - startX;
      const deltaTime = (deltaX / pixelsPerSecond);
      const newDelay = Math.max(0, Math.min(maxDuration - voice.duration, startDelay + deltaTime));
      
      setVoiceAudios(prev => 
        prev.map(v => v.id === voice.id ? { ...v, delay: newDelay } : v)
      );
    };
    
    const handleMouseUp = () => {
      setDraggingVoice(null);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const getElementIcon = (element: Element) => {
    switch (element.type) {
      case "text":
        return <Type className="h-4 w-4" />;
      case "image":
        return <Image className="h-4 w-4" />;
      case "shape":
        return element.shapeType === "ellipse" ? (
          <Circle className="h-4 w-4" />
        ) : (
          <Square className="h-4 w-4" />
        );
      case "video":
        return <Video className="h-4 w-4" />;
      case "drawing":
        return <Pen className="h-4 w-4" />;
      default:
        return <Square className="h-4 w-4" />;
    }
  };

  const animationsByCategory = {
    "Entrance": [
      { id: `anim-${Date.now()}-1`, type: "fade-in" as const, duration: "1s", delay: "0s", timingFunction: "ease-out", iterationCount: "1", category: "in" as const },
      { id: `anim-${Date.now()}-2`, type: "zoom-in" as const, duration: "0.5s", delay: "0s", timingFunction: "ease-out", iterationCount: "1", category: "in" as const },
      { id: `anim-${Date.now()}-3`, type: "slide-in-from-right" as const, duration: "0.5s", delay: "0s", timingFunction: "ease-out", iterationCount: "1", category: "in" as const },
    ],
    "Exit": [
      { id: `anim-${Date.now()}-4`, type: "fade-out" as const, duration: "1s", delay: "0s", timingFunction: "ease-out", iterationCount: "1", category: "out" as const },
      { id: `anim-${Date.now()}-5`, type: "zoom-out" as const, duration: "0.5s", delay: "0s", timingFunction: "ease-out", iterationCount: "1", category: "out" as const },
      { id: `anim-${Date.now()}-6`, type: "slide-out-to-right" as const, duration: "0.5s", delay: "0s", timingFunction: "ease-out", iterationCount: "1", category: "out" as const },
    ],
    "Attention": [
      { id: `anim-${Date.now()}-7`, type: "pulse" as const, duration: "2s", delay: "0s", timingFunction: "ease-in-out", iterationCount: "infinite", category: "custom" as const },
      { id: `anim-${Date.now()}-8`, type: "bounce" as const, duration: "1s", delay: "0s", timingFunction: "ease-out", iterationCount: "1", category: "custom" as const },
    ],
  };

  const handleAddAnimation = (elementId: string, preset: any) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const newAnimation = {
      ...preset,
      id: `anim-${Date.now()}`,
      delay: `${currentTime}s`,
    };

    const updatedAnimations = [...(element.animations || []), newAnimation];
    onUpdateElement(elementId, { animations: updatedAnimations });
  };

  const handleUpdateAnimation = (elementId: string, animIndex: number, updates: any) => {
    const element = elements.find(el => el.id === elementId);
    if (!element || !element.animations) return;

    const updatedAnimations = [...element.animations];
    updatedAnimations[animIndex] = {
      ...updatedAnimations[animIndex],
      ...updates,
    };

    onUpdateElement(elementId, { animations: updatedAnimations });
  };

  const handleRemoveAnimation = (elementId: string, animIndex: number) => {
    const element = elements.find(el => el.id === elementId);
    if (!element || !element.animations) return;

    const updatedAnimations = element.animations.filter((_, idx) => idx !== animIndex);
    onUpdateElement(elementId, { animations: updatedAnimations });
  };

  const handleVoiceGenerated = (audioUrl: string, text: string, voiceId: string, voiceName: string) => {
    const newVoice = {
      id: `voice-${Date.now()}`,
      url: audioUrl,
      text: text,
      delay: voiceDrawerTimestamp,
      duration: 5,
      voiceId: voiceId,
      voiceName: voiceName,
      layerId: 0,
    };
    setVoiceAudios(prev => [...prev, newVoice]);
    setVoiceDrawerOpen(false);
  };

  const handleRemoveVoice = (voiceId: string) => {
    setVoiceAudios(prev => prev.filter(v => v.id !== voiceId));
  };

  const handleVoiceTrackRightClick = (layerId: number, timestamp: number) => {
    setVoiceDrawerTimestamp(timestamp);
    setVoiceDrawerOpen(true);
  };

  const handleAddLayer = () => {
    setAudioLayers(prev => [...prev, Math.max(...prev, -1) + 1]);
  };

  const handleRemoveLayer = (layerId: number) => {
    if (audioLayers.length === 1) return;
    setAudioLayers(prev => prev.filter(id => id !== layerId));
    setVoiceAudios(prev => prev.filter(v => (v.layerId || 0) !== layerId));
  };

  return (
    <div className="flex flex-col h-full bg-background border-t border-border">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Button variant="outline" size="icon" onClick={onPlayPause} className="shrink-0">
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={onReset} className="shrink-0">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <div className="flex-1 px-4">
          <Slider
            value={[currentTime]}
            min={0}
            max={maxDuration}
            step={0.01}
            onValueChange={([value]) => onTimeChange(value)}
            className="w-full"
          />
        </div>
        <span className="text-sm text-muted-foreground shrink-0">
          {currentTime.toFixed(2)}s / {maxDuration}s
        </span>
        <div className="flex items-center gap-2 ml-4 border-l border-border pl-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.5))}
          >
            -
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(prev => Math.min(5, prev + 0.5))}
          >
            +
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div ref={scrollContainerRef} className="h-full overflow-x-auto overflow-y-auto">
          <div className="p-4" style={{ minWidth: `${timelineWidth + 32}px` }}>
            <div
              ref={timelineRef}
              className="relative bg-muted/30 rounded-lg p-4 min-h-[400px] timeline-bg"
              onMouseDown={handleMouseDown}
              style={{ width: `${timelineWidth}px` }}
            >
              <div className="flex justify-between mb-2 text-xs text-muted-foreground">
                {Array.from({ length: Math.ceil(maxDuration) + 1 }, (_, i) => (
                  <span key={i} style={{ position: 'absolute', left: `${(i / maxDuration) * 100}%` }}>{i}s</span>
                ))}
              </div>

              <div
                className="absolute top-0 bottom-0 w-1 bg-primary pointer-events-none z-10"
                style={{ left: `${(currentTime / maxDuration) * 100}%` }}
              />

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Audio Layers</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddLayer}
                    className="h-6 px-2"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Layer
                  </Button>
                </div>
                {audioLayers.map((layerId) => {
                  const layerVoices = voiceAudios.filter(v => (v.layerId || 0) === layerId);
                  return (
                    <div key={layerId} className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Layer {layerId + 1}</span>
                        {audioLayers.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => handleRemoveLayer(layerId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <ContextMenu>
                        <ContextMenuTrigger>
                          <div
                            className="relative h-12 bg-muted/50 rounded cursor-crosshair"
                            onContextMenu={(e) => {
                              if (!timelineRef.current || !scrollContainerRef.current) return;
                              const rect = timelineRef.current.getBoundingClientRect();
                              const scrollLeft = scrollContainerRef.current.scrollLeft;
                              const x = e.clientX - rect.left + scrollLeft;
                              const timestamp = (x / timelineWidth) * maxDuration;
                              handleVoiceTrackRightClick(layerId, Math.max(0, Math.min(maxDuration, timestamp)));
                            }}
                          >
                            {layerVoices.map((voice) => (
                              <ContextMenu key={voice.id}>
                                <ContextMenuTrigger>
                                  <div
                                    className={`absolute top-1 h-10 bg-primary/20 border-2 border-primary/40 rounded flex items-center px-2 gap-2 cursor-move hover:bg-primary/30 transition-colors ${
                                      draggingVoice === voice.id ? 'opacity-50' : ''
                                    }`}
                                    style={{
                                      left: `${(voice.delay / maxDuration) * timelineWidth}px`,
                                      width: `${(voice.duration / maxDuration) * timelineWidth}px`,
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      handleVoiceDrag(e, voice);
                                    }}
                                  >
                                    <Avatar className="h-6 w-6 shrink-0">
                                      <AvatarImage src={VOICE_AVATARS[voice.voiceId]} />
                                      <AvatarFallback>
                                        <Mic className="h-3 w-3" />
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs truncate flex-1">{voice.text}</span>
                                  </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem onClick={() => handleRemoveVoice(voice.id)}>
                                    Remove Voice
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            ))}
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => setVoiceDrawerOpen(true)}>
                            Add Voice
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6">
                <div className="text-sm font-medium mb-2">Elements</div>
                {elements.map((element) => {
                  return (
                    <ContextMenu key={element.id}>
                      <ContextMenuTrigger>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-2 w-32 shrink-0">
                            {getElementIcon(element)}
                            <span className="text-xs truncate">{element.id.slice(0, 8)}</span>
                          </div>
                          <div className="relative flex-1 h-10 bg-muted/50 rounded">
                            {element.animations && element.animations.map((anim, animIndex) => {
                              const duration = parseDuration(anim.duration);
                              const delay = parseDelay(anim.delay);
                              
                              return (
                                <ContextMenu key={animIndex}>
                                  <ContextMenuTrigger>
                                    <div
                                      className={`absolute top-0 h-10 bg-accent/30 border border-accent rounded flex items-center justify-center text-xs cursor-move hover:bg-accent/50 transition-colors ${
                                        draggingAnimation === `${element.id}-${animIndex}` ? 'opacity-50' : ''
                                      }`}
                                      style={{
                                        left: `${(delay / maxDuration) * timelineWidth}px`,
                                        width: `${(duration / maxDuration) * timelineWidth}px`,
                                      }}
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleAnimationDrag(e, element.id, animIndex);
                                      }}
                                      onClick={() => setEditingAnimation({ elementId: element.id, animIndex })}
                                    >
                                      {anim.type}
                                    </div>
                                  </ContextMenuTrigger>
                                  <ContextMenuContent>
                                    <ContextMenuItem onClick={() => setEditingAnimation({ elementId: element.id, animIndex })}>
                                      Edit Animation
                                    </ContextMenuItem>
                                    <ContextMenuItem onClick={() => handleRemoveAnimation(element.id, animIndex)}>
                                      Remove Animation
                                    </ContextMenuItem>
                                  </ContextMenuContent>
                                </ContextMenu>
                              );
                            })}
                          </div>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        {Object.entries(animationsByCategory).map(([category, anims]) => (
                          <ContextMenuSub key={category}>
                            <ContextMenuSubTrigger>{category}</ContextMenuSubTrigger>
                            <ContextMenuSubContent>
                              {anims.map((preset) => (
                                <ContextMenuItem
                                  key={preset.id}
                                  onClick={() => handleAddAnimation(element.id, preset)}
                                >
                                  {preset.type}
                                </ContextMenuItem>
                              ))}
                            </ContextMenuSubContent>
                          </ContextMenuSub>
                        ))}
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editingAnimation && (() => {
        const element = elements.find(el => el.id === editingAnimation.elementId);
        const animation = element?.animations?.[editingAnimation.animIndex];
        if (!element || !animation) return null;
        
        return (
          <AnimationSettingsDialog
            animation={animation}
            elementId={element.id}
            onUpdate={(animId: string, updates: any) => {
              handleUpdateAnimation(element.id, editingAnimation.animIndex, updates);
            }}
            onRemove={(animId: string) => {
              handleRemoveAnimation(element.id, editingAnimation.animIndex);
              setEditingAnimation(null);
            }}
          />
        );
      })()}

      {voiceDrawerOpen && (
        <VoiceTextDrawer
          open={voiceDrawerOpen}
          onClose={() => setVoiceDrawerOpen(false)}
          voiceId={selectedVoice || "9BWtsMINqrJLrRacOk9x"}
          voiceName="Aria"
          onVoiceGenerated={handleVoiceGenerated}
        />
      )}
    </div>
  );
}
