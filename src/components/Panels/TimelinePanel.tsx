import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Element, Frame } from "@/types/elements";
import { VoiceAudio, TimelineMarker, BackgroundMusic } from "@/types/snapshot";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw, Type, Image, Square, Circle, Video, Pen, Mic, ZoomIn, ZoomOut, Flag } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AnimationSettingsDialog from "./AnimationSettingsDialog";
import VoiceSelector from "./VoiceSelector";
import VoiceTextDrawer from "./VoiceTextDrawer";
import { extractWaveform, renderWaveformPath } from "@/lib/audioWaveform";
import { toast } from "sonner";

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
  voiceAudios?: VoiceAudio[];
  onVoiceAudiosChange?: (voiceAudios: VoiceAudio[]) => void;
  timelineMarkers?: TimelineMarker[];
  onTimelineMarkersChange?: (markers: TimelineMarker[]) => void;
  backgroundMusic?: BackgroundMusic[];
  onBackgroundMusicChange?: (music: BackgroundMusic[]) => void;
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
  timelineMarkers: externalMarkers = [],
  onTimelineMarkersChange,
  backgroundMusic: externalMusic = [],
  onBackgroundMusicChange,
}: TimelinePanelProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<{ id: string; name: string } | null>(null);
  const [voiceAudios, setVoiceAudios] = useState(externalVoiceAudios);
  const [markers, setMarkers] = useState<TimelineMarker[]>(externalMarkers);
  const [showMarkerDialog, setShowMarkerDialog] = useState(false);
  const [newMarkerTime, setNewMarkerTime] = useState(0);
  const [newMarkerLabel, setNewMarkerLabel] = useState("");
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
    startY: number;
    startDelay: number;
    startTrack: number;
    mode: 'move' | 'resize';
  } | null>(null);
  const [voiceDrawerOpen, setVoiceDrawerOpen] = useState(false);
  const [voiceDrawerTimestamp, setVoiceDrawerTimestamp] = useState(0);
  const [editingVoiceId, setEditingVoiceId] = useState<string | null>(null);
  const [editingVoiceText, setEditingVoiceText] = useState("");
  const playingAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const completedVoicesRef = useRef<Set<string>>(new Set());
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playheadLeft, setPlayheadLeft] = useState(0);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const processedWaveformsRef = useRef<Set<string>>(new Set());
  const isInternalUpdateRef = useRef(false);
  const parentNotifyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [waveformTrigger, setWaveformTrigger] = useState(0);

  const handleZoomIn = () => {
    setTimelineZoom((prev) => Math.min(4, prev * 1.25));
  };

  const handleZoomOut = () => {
    setTimelineZoom((prev) => Math.max(0.1, prev / 1.25));
  };

  const handleResetZoom = () => {
    setTimelineZoom(1);
  };

  // Shift + mouse wheel to zoom, centered around the cursor position
  const handleWheel = (e: React.WheelEvent) => {
    if (!e.shiftKey) return; // only intercept when Shift is held
    e.preventDefault();

    if (!timelineRef.current || !containerRef.current) return;
    const viewport = containerRef.current.parentElement as HTMLElement | null;
    if (!viewport) return;

    const timelineRect = timelineRef.current.getBoundingClientRect();
    if (timelineRect.width <= 0) return;

    // Ratio of cursor along the timeline (0..1)
    const cursorRatio = Math.max(0, Math.min(1, (e.clientX - timelineRect.left) / timelineRect.width));

    // Smooth zoom factor based on wheel delta
    const prevZoom = timelineZoom;
    const factor = Math.exp(-e.deltaY * 0.002); // negative deltaY -> zoom in
    const nextZoom = Math.min(4, Math.max(0.1, prevZoom * factor));
    if (nextZoom === prevZoom) return;

    setTimelineZoom(nextZoom);

    // After layout updates, adjust scroll so the cursor stays over the same time
    requestAnimationFrame(() => {
      if (!timelineRef.current || !viewport) return;
      const newRect = timelineRef.current.getBoundingClientRect();
      const desiredClientX = newRect.left + newRect.width * cursorRatio;
      const dx = desiredClientX - e.clientX;
      viewport.scrollLeft += dx;
    });
  };
  useEffect(() => {
    const update = () => {
      if (!timelineRef.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, maxDuration ? currentTime / maxDuration : 0));
      const leftPx = (timelineRect.left - containerRect.left) + (timelineRect.width * timelineZoom) * ratio;
      setPlayheadLeft(leftPx);
    };

    update();

    const onResize = () => update();
    window.addEventListener('resize', onResize);

    const viewport = containerRef.current?.parentElement as HTMLElement | null;
    const onScroll = () => update();
    viewport?.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      viewport?.removeEventListener('scroll', onScroll);
    };
  }, [currentTime, maxDuration, timelineZoom]);

  // Debounced parent notification to prevent circular updates
  const notifyParentOfChanges = useCallback((updatedVoices: VoiceAudio[]) => {
    if (parentNotifyTimeoutRef.current) {
      clearTimeout(parentNotifyTimeoutRef.current);
    }
    parentNotifyTimeoutRef.current = setTimeout(() => {
      onVoiceAudiosChange?.(updatedVoices);
    }, 50);
  }, [onVoiceAudiosChange]);

  // Sync external voice audios to internal state (only when external changes)
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    // Assign tracks to prevent overlap
    const withTracks = externalVoiceAudios.map((voice, index) => {
      // If already has a track, keep it
      if (voice.track !== undefined) return voice;
      
      // Find an available track where this voice doesn't overlap with others
      let track = 0;
      let hasOverlap = true;
      
      while (hasOverlap) {
        hasOverlap = externalVoiceAudios.some((other, otherIndex) => {
          if (otherIndex >= index) return false;
          if ((other.track ?? 0) !== track) return false;
          
          const voiceEnd = voice.delay + voice.duration;
          const otherEnd = other.delay + other.duration;
          return !(voiceEnd <= other.delay || voice.delay >= otherEnd);
        });
        
        if (hasOverlap) track++;
      }
      
      return { ...voice, track };
    });
    
    setVoiceAudios(withTracks);
  }, [externalVoiceAudios]);

  // Notify parent of voice changes (debounced)
  useEffect(() => {
    if (isInternalUpdateRef.current) return;
    notifyParentOfChanges(voiceAudios);
  }, [voiceAudios, notifyParentOfChanges]);

  // Sync markers
  useEffect(() => {
    setMarkers(externalMarkers);
  }, [externalMarkers]);

  // Notify parent of markers changes
  useEffect(() => {
    onTimelineMarkersChange?.(markers);
  }, [markers, onTimelineMarkersChange]);

  // Extract waveforms independently (doesn't trigger parent updates)
  useEffect(() => {
    const processVoice = async (voice: VoiceAudio) => {
      // Always process if waveformData is missing, even if we've seen this ID before
      // (in case the voice was reloaded from a saved snapshot without waveform data)
      if (!voice.waveformData && voice.url) {
        // Check if we're already processing this voice
        if (processedWaveformsRef.current.has(voice.id)) {
          return;
        }
        processedWaveformsRef.current.add(voice.id);
        
        try {
          const audio = new Audio();
          await new Promise<void>((resolve, reject) => {
            audio.onloadedmetadata = () => resolve();
            audio.onerror = reject;
            audio.src = voice.url;
          });
          
          const actualDuration = audio.duration;
          const waveform = await extractWaveform(voice.url, 80);
          
          // Mark as internal update to prevent circular notifications
          isInternalUpdateRef.current = true;
          
          setVoiceAudios(prev => {
            const voiceStillExists = prev.find(v => v.id === voice.id);
            if (!voiceStillExists || voiceStillExists.waveformData) {
              return prev;
            }
            return prev.map(v => v.id === voice.id ? { ...v, waveformData: waveform, duration: actualDuration } : v);
          });
        } catch (error) {
          console.error('Failed to extract waveform for voice:', error);
          
          // On error, still set a placeholder waveform so UI doesn't stay stuck on "Loading..."
          const placeholderWaveform = new Array(80).fill(0.35);
          isInternalUpdateRef.current = true;
          setVoiceAudios(prev => prev.map(v =>
            v.id === voice.id ? { ...v, waveformData: placeholderWaveform } : v
          ));
          
          processedWaveformsRef.current.delete(voice.id);
        }
      }
    };

    voiceAudios.forEach(processVoice);
  }, [voiceAudios, waveformTrigger]);
  
  // Clear processed refs when voice audios are removed or changed
  useEffect(() => {
    const currentVoiceIds = new Set(voiceAudios.map(v => v.id));
    const processedIds = Array.from(processedWaveformsRef.current);
    
    // Remove IDs from processedRef that are no longer in voiceAudios
    processedIds.forEach(id => {
      if (!currentVoiceIds.has(id)) {
        processedWaveformsRef.current.delete(id);
      }
    });
  }, [voiceAudios]);

  // Handle marker operations
  const handleAddMarker = (time?: number) => {
    const markerTime = time !== undefined ? time : currentTime;
    setNewMarkerTime(markerTime);
    setNewMarkerLabel("");
    setShowMarkerDialog(true);
  };

  const handleCreateMarker = () => {
    if (!newMarkerLabel.trim()) {
      toast.error("Please enter a label for the marker");
      return;
    }
    
    const newMarker: TimelineMarker = {
      id: `marker-${Date.now()}`,
      time: newMarkerTime,
      label: newMarkerLabel.trim(),
      color: '#3b82f6',
    };
    
    setMarkers(prev => [...prev, newMarker].sort((a, b) => a.time - b.time));
    setShowMarkerDialog(false);
    setNewMarkerLabel("");
    toast.success("Marker added");
  };

  const handleRemoveMarker = (markerId: string) => {
    setMarkers(prev => prev.filter(m => m.id !== markerId));
    toast.success("Marker removed");
  };

  const handleJumpToMarker = (time: number) => {
    onTimeChange(time);
  };

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

  const handleVoiceDrag = useCallback((e: MouseEvent) => {
    if (!timelineRef.current || !draggingVoice) return;
    
    e.preventDefault();
    document.body.style.userSelect = 'none';
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const timeAtMouse = (x / rect.width) * maxDuration;

    const voice = voiceAudios.find(v => v.id === draggingVoice.voiceId);
    if (!voice) return;

    if (draggingVoice.mode === 'move') {
      const deltaX = x - draggingVoice.startX;
      const deltaTime = (deltaX / rect.width) * maxDuration;
      const newDelay = Math.max(0, Math.min(draggingVoice.startDelay + deltaTime, maxDuration - voice.duration));
      
      const deltaY = e.clientY - draggingVoice.startY;
      const trackHeight = 48;
      const trackDelta = Math.round(deltaY / trackHeight);
      const newTrack = Math.max(0, draggingVoice.startTrack + trackDelta);
      
      setVoiceAudios(prev => prev.map(v =>
        v.id === draggingVoice.voiceId ? { ...v, delay: newDelay, track: newTrack } : v
      ));
    } else if (draggingVoice.mode === 'resize') {
      const newDuration = Math.max(0.1, Math.min(timeAtMouse - voice.delay, maxDuration - voice.delay));
      
      setVoiceAudios(prev => prev.map(v =>
        v.id === draggingVoice.voiceId ? { ...v, duration: newDuration } : v
      ));
    }
  }, [draggingVoice, maxDuration, voiceAudios]);

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
      document.body.style.userSelect = '';
    };

    if (isDraggingPlayhead || draggingAnimation || draggingVoice) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDraggingPlayhead, draggingAnimation, draggingVoice, handleVoiceDrag, maxDuration]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (parentNotifyTimeoutRef.current) {
        clearTimeout(parentNotifyTimeoutRef.current);
      }
    };
  }, []);

  // Adaptive time markers based on zoom level
  const timeMarkers = useMemo(() => {
    let interval = 1; // Default: every 1 second
    
    if (timelineZoom <= 0.2) {
      interval = 10; // Every 10 seconds when zoomed way out
    } else if (timelineZoom <= 0.5) {
      interval = 5; // Every 5 seconds when zoomed out
    } else if (timelineZoom <= 0.8) {
      interval = 2; // Every 2 seconds
    }
    // else: Every 1 second when zoomed in (>= 0.8)
    
    const markers: number[] = [];
    for (let i = 0; i <= maxDuration; i += interval) {
      markers.push(i);
    }
    
    // Always include the last marker if not already included
    if (markers[markers.length - 1] !== maxDuration) {
      markers.push(maxDuration);
    }
    
    return markers;
  }, [maxDuration, timelineZoom]);

  // Get icon for element type
  const getElementIcon = (element: Element) => {
    if (element.type === "text") return Type;
    if (element.type === "image") return Image;
    if (element.type === "video") return Video;
    if (element.type === "drawing") return Pen;
    if (element.type === "shape") {
      if (element.shapeType === "ellipse") return Circle;
      return Square;
    }
    return Square; // default
  };

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

  const handleVoiceGenerated = useCallback(async (audioUrl: string, text: string, voiceId: string, voiceName: string) => {
    try {
      const audio = new Audio(audioUrl);
      
      await new Promise<void>((resolve, reject) => {
        audio.onloadedmetadata = () => {
          audio.currentTime = 0;
          resolve();
        };
        audio.onerror = reject;
        audio.load();
      });
      
      const actualDuration = audio.duration;
      
      if (editingVoiceId) {
        processedWaveformsRef.current.delete(editingVoiceId);
        setVoiceAudios(prev => prev.map(v => 
          v.id === editingVoiceId 
            ? { ...v, url: audioUrl, text, duration: actualDuration, voiceId, voiceName, waveformData: undefined }
            : v
        ));
        // Trigger waveform extraction for edited voice
        setWaveformTrigger(prev => prev + 1);
        setEditingVoiceId(null);
        setEditingVoiceText("");
        toast.success("Voice updated successfully");
      } else {
        const newVoice = {
          id: `voice-${Date.now()}`,
          url: audioUrl,
          text,
          delay: voiceDrawerTimestamp,
          duration: actualDuration,
          voiceId,
          voiceName,
        };
        setVoiceAudios(prev => [...prev, newVoice]);
        toast.success("Voice added successfully");
      }
      
      setSelectedVoice(null);
      setVoiceDrawerOpen(false);
    } catch (error) {
      console.error('Error loading audio:', error);
      toast.error("Failed to load audio file");
    }
  }, [editingVoiceId, voiceDrawerTimestamp]);

  const handleRemoveVoice = useCallback((voiceId: string) => {
    setVoiceAudios(prev => prev.filter(v => v.id !== voiceId));
    processedWaveformsRef.current.delete(voiceId);
    toast.success("Voice removed");
  }, []);

  const handleEditVoice = useCallback((voice: VoiceAudio) => {
    setEditingVoiceId(voice.id);
    setEditingVoiceText(voice.text);
    setSelectedVoice({ id: voice.voiceId, name: voice.voiceName });
    setVoiceDrawerOpen(true);
  }, []);

  const handleVoiceTrackRightClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickTime = Math.max(0, (x / rect.width) * maxDuration);
    setVoiceDrawerTimestamp(clickTime);
    setVoiceDrawerOpen(true);
  };

  // Memoize voice IDs and URLs to prevent playback restarts
  const voicePlaybackData = useMemo(() => 
    voiceAudios.map(v => ({ id: v.id, url: v.url, delay: v.delay, duration: v.duration })),
    [voiceAudios.map(v => `${v.id}-${v.delay}-${v.duration}`).join(',')]
  );

  // Play voices at appropriate times (stable dependencies)
  useEffect(() => {
    if (!isPlaying) {
      playingAudiosRef.current.forEach((audio) => {
        audio.pause();
      });
      playingAudiosRef.current.clear();
      completedVoicesRef.current.clear(); // Reset completed voices when stopped
      return;
    }
    
    voicePlaybackData.forEach(voice => {
      const shouldPlay = currentTime >= voice.delay && currentTime < voice.delay + voice.duration;
      const isCurrentlyPlaying = playingAudiosRef.current.has(voice.id);
      const hasCompleted = completedVoicesRef.current.has(voice.id);
      
      // Only play if should play, not currently playing, AND hasn't completed yet
      if (shouldPlay && !isCurrentlyPlaying && !hasCompleted) {
        const audio = new Audio(voice.url);
        const offset = currentTime - voice.delay;
        audio.currentTime = offset;
        audio.play().catch(err => console.error('Audio play error:', err));
        playingAudiosRef.current.set(voice.id, audio);
        
        audio.onended = () => {
          playingAudiosRef.current.delete(voice.id);
          completedVoicesRef.current.add(voice.id); // Mark as completed
        };
      } else if (!shouldPlay && isCurrentlyPlaying) {
        const audio = playingAudiosRef.current.get(voice.id);
        if (audio) {
          audio.pause();
          playingAudiosRef.current.delete(voice.id);
        }
      }
      
      // Reset completed flag when playhead moves before the voice start
      if (currentTime < voice.delay) {
        completedVoicesRef.current.delete(voice.id);
      }
    });
    
    return () => {
      if (!isPlaying) {
        playingAudiosRef.current.forEach((audio) => {
          audio.pause();
        });
        playingAudiosRef.current.clear();
      }
    };
  }, [currentTime, isPlaying, voicePlaybackData]);

  return (
    <>
    <div className="h-full flex flex-col border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <h3 className="text-sm font-medium">Timeline</h3>
        <div className="flex items-center gap-2">
          <VoiceSelector 
            onSelectVoice={(voiceId, voiceName) => {
              setSelectedVoice({ id: voiceId, name: voiceName });
              setVoiceDrawerTimestamp(currentTime);
              setVoiceDrawerOpen(true);
            }} 
          />
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
        
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleZoomOut}
            disabled={timelineZoom <= 0.1}
            title="Zoom out"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={handleResetZoom}
            title="Reset zoom"
          >
            <span className="text-xs">{Math.round(timelineZoom * 100)}%</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleZoomIn}
            disabled={timelineZoom >= 4}
            title="Zoom in"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0" onWheel={handleWheel}>
        <div className="p-4 relative" ref={containerRef}>
          {/* Timeline container with zoom */}
          <div style={{ width: `${100 * timelineZoom}%` }}>
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

              {/* Click area for playhead positioning */}
              <div
                className="absolute inset-0 cursor-pointer"
                onMouseDown={handleMouseDown}
              />
            </div>
          </div>

            {/* Playhead - spans full timeline height */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary z-50 cursor-ew-resize pointer-events-auto"
              style={{ left: playheadLeft }}
              onMouseDown={handleMouseDown}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full -mt-1 pointer-events-auto" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full -mb-1 pointer-events-auto" />
            </div>

            {/* Element tracks */}
            <div className="space-y-2 mt-4">
            {/* Voice tracks - multiple rows */}
            {voiceAudios.length > 0 && (() => {
              // Calculate number of tracks needed
              const maxTrack = Math.max(...voiceAudios.map(v => v.track ?? 0), 0);
              const trackCount = maxTrack + 1;
              
              return (
                <>
                  {Array.from({ length: trackCount }).map((_, trackIndex) => {
                    const tracksVoices = voiceAudios.filter(v => (v.track ?? 0) === trackIndex);
                    
                    return (
                      <ContextMenu key={trackIndex}>
                        <ContextMenuTrigger asChild>
                          <div
                            className="flex items-start gap-2 py-2 hover:bg-muted/20 transition-colors"
                            onClick={(e) => {
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
                              {trackIndex === 0 && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <Mic className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                    <div className="text-xs truncate font-medium">Voice</div>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {voiceAudios.length} clip{voiceAudios.length !== 1 ? 's' : ''}
                                  </div>
                                </>
                              )}
                              {trackIndex > 0 && (
                                <div className="text-[10px] text-muted-foreground pl-4">
                                  Track {trackIndex + 1}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 relative h-12 bg-muted/30 rounded pt-6">
                              {tracksVoices.map((voice) => {
                                const startPercent = (voice.delay / maxDuration) * 100;
                                const widthPercent = (voice.duration / maxDuration) * 100;
                                const isPlaying = playingAudiosRef.current.has(voice.id);
                                const voiceAvatar = VOICE_AVATARS[voice.voiceId];

                                // Strip [audio tags] for display snippet
                                const snippet = (voice.text || "")
                                  .replace(/\[[^\]]+\]/g, "")
                                  .replace(/\s+/g, " ")
                                  .trim()
                                  .slice(0, 40) + (voice.text && voice.text.length > 40 ? "…" : "");
                                
                                return (
                                  <ContextMenu key={voice.id}>
                                    <ContextMenuTrigger asChild>
                                      <div
                                        className={`absolute top-1 bottom-1 rounded bg-background/80 border border-primary/40 hover:border-primary cursor-move transition-all group ${
                                          isPlaying ? 'ring-2 ring-primary/50 ring-offset-1 animate-pulse' : ''
                                        }`}
                                        style={{
                                          left: `${startPercent}%`,
                                          width: `${widthPercent}%`,
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditVoice(voice);
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
                                              startY: e.clientY,
                                              startDelay: voice.delay,
                                              startTrack: voice.track ?? 0,
                                              mode: 'resize',
                                            });
                                          } else {
                                            setDraggingVoice({
                                              voiceId: voice.id,
                                              startX: e.clientX - rect.left,
                                              startY: e.clientY,
                                              startDelay: voice.delay,
                                              startTrack: voice.track ?? 0,
                                              mode: 'move',
                                            });
                                          }
                                        }}
                                      >
                                        {/* Top label with avatar + name */}
                                        <div className="absolute -top-8 left-0 flex items-center gap-1 text-[10px] text-foreground/90 z-20 bg-background/50 px-1 rounded backdrop-blur-sm">
                                          {voiceAvatar && (
                                            <Avatar className="w-5 h-5 border border-primary/30">
                                              <AvatarImage src={voiceAvatar} alt={voice.voiceName} />
                                              <AvatarFallback className="text-[8px]">{voice.voiceName?.[0] || '?'}</AvatarFallback>
                                            </Avatar>
                                          )}
                                          <span className="font-medium truncate max-w-[100px]">{voice.voiceName}</span>
                                        </div>

                                        {/* Inside bar: waveform */}
                                        <div className="h-full flex items-center justify-between px-2 gap-1.5 relative overflow-hidden">
                                          {/* Waveform visualization */}
                                          {voice.waveformData && voice.waveformData.length > 0 ? (
                                            <svg
                                              className="absolute inset-0 w-full h-full"
                                              preserveAspectRatio="none"
                                              viewBox="0 0 100 100"
                                            >
                                              <path
                                                d={renderWaveformPath(voice.waveformData, 100, 100)}
                                                fill="hsl(var(--primary))"
                                                opacity="0.7"
                                              />
                                            </svg>
                                          ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              <div className="text-[10px] text-muted-foreground">Loading...</div>
                                            </div>
                                          )}
                                          <div className="w-1 h-3 bg-primary/30 rounded opacity-0 group-hover:opacity-100 transition-opacity relative z-10" />
                                        </div>
                                      </div>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                      <ContextMenuItem onClick={() => handleEditVoice(voice)}>
                                        Edit Text
                                      </ContextMenuItem>
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
                    );
                  })}
                </>
              );
            })()}
            
            {elements.map((element) => {
              const isSelected = selectedElementIds.includes(element.id);
              const elementName = element.name || (element.type === "text" ? element.text || "Text" : element.type === "drawing" ? "Drawing" : element.shapeType || element.type);
              const elementAnimations = element.animations || [];
              const ElementIcon = getElementIcon(element);

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
                      <ElementIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
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
            {/* Markers Section */}
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div className="flex items-start gap-2 py-2 hover:bg-muted/20 transition-colors">
                  <div className="w-32 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Flag className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <div className="text-xs truncate font-medium">Markers</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {markers.length} marker{markers.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex-1 relative h-8 bg-muted/30 rounded">
                    {markers.map((marker) => {
                      const leftPercent = (marker.time / maxDuration) * 100;
                      
                      return (
                        <ContextMenu key={marker.id}>
                          <ContextMenuTrigger asChild>
                            <div
                              className="absolute top-0 bottom-0 w-1 bg-blue-500 hover:bg-blue-600 cursor-pointer group"
                              style={{ left: `${leftPercent}%` }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJumpToMarker(marker.time);
                              }}
                            >
                              <Flag className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 text-blue-500" fill="currentColor" />
                              <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {marker.label}
                              </div>
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem onClick={() => handleJumpToMarker(marker.time)}>
                              Jump to Marker
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => handleRemoveMarker(marker.id)} className="text-destructive">
                              Remove Marker
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      );
                    })}
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => handleAddMarker()}>
                  Add Marker at Playhead
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>

            </div>
          </div>
        </div>
      </ScrollArea>
    </div>

      <VoiceTextDrawer
        open={voiceDrawerOpen}
        onClose={() => {
          setVoiceDrawerOpen(false);
          setEditingVoiceId(null);
          setEditingVoiceText("");
        }}
        voiceId={selectedVoice?.id || "9BWtsMINqrJLrRacOk9x"}
        voiceName={selectedVoice?.name || "Aria"}
        onVoiceGenerated={handleVoiceGenerated}
        initialText={editingVoiceText}
        editMode={!!editingVoiceId}
      />

      {/* Marker creation dialog */}
      <Dialog open={showMarkerDialog} onOpenChange={setShowMarkerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Timeline Marker</DialogTitle>
            <DialogDescription>
              Add a labeled marker at {newMarkerTime.toFixed(2)}s
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Marker Label</label>
              <Input
                placeholder="e.g., Scene 1, Intro, Main Point"
                value={newMarkerLabel}
                onChange={(e) => setNewMarkerLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateMarker();
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowMarkerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMarker}>
              Add Marker
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
