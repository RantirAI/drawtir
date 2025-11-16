import { useState, useRef, useEffect } from "react";
import QRCodeElement from "./QRCodeElement";
import BrandKitPanel from "@/components/Panels/BrandKitPanel";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Video, Gallery, Colorfilter } from "iconsax-react";
import { useCollaborativePresence } from "@/hooks/useCollaborativePresence";
import { useCollaborativeCanvas } from "@/hooks/useCollaborativeCanvas";
import { CollaborativeCursor } from "./CollaborativeCursor";
import { CollaborativeUsersBar } from "./CollaborativeUsersBar";
import ResizableFrame from "./ResizableFrame";
import FrameVideoControls from "./FrameVideoControls";
import DraggablePanel from "../Panels/DraggablePanel";
import ShapeSettingsPanel from "../Panels/ShapeSettingsPanel";
import { ShadcnShaderSettingsPanel } from "../Panels/ShadcnShaderSettingsPanel";
import { ShaderLibraryModal } from "./ShaderLibraryModal";
import LayersPanel from "../Panels/LayersPanel";
import AIGeneratorPanel from "../Panels/AIGeneratorPanel";
import TemplatesPanel from "../Panels/TemplatesPanel";
import { MediaLibraryPanel } from "../Panels/MediaLibraryPanel";
import BottomToolbar from "../Toolbar/BottomToolbar";
import EditorTopBar from "../TopBar/EditorTopBar";
import CanvasBackground from "./CanvasBackground";
import FrameBadge from "./FrameBadge";
import DrawingLayer from "./DrawingLayer";
import ShareDialog from "./ShareDialog";
import ExportAllDialog from "./ExportAllDialog";
import ExportDialog from "./ExportDialog";
import PreviewDialog from "./PreviewDialog";
import TimelinePanel from "@/components/Panels/TimelinePanel";
import ResizableElement from "./ResizableElement";
import { exportFrames } from "@/lib/exportUtils";
import CanvasContextMenu from "./ContextMenu";
import AnimationsPanel from "@/components/Panels/AnimationsPanel";
import type { AnimationType } from "@/components/Panels/AnimationsPanel";
import { InteractivityPanel } from "@/components/Panels/InteractivityPanel";
import DrawtirFooter from "../Footer/DrawtirFooter";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Magicpen, Layer, Setting4, DocumentUpload, Element2, PlayCircle } from "iconsax-react";
import { Frame, Element } from "@/types/elements";
import type { CanvasSnapshot } from "@/types/snapshot";
import { createSnapshot, generateThumbnail, validateSnapshot } from "@/lib/snapshot";
import { useAutoSave } from "@/hooks/useAutoSave";
import { segmentImageToLayers } from "@/lib/objectSegmentation";

interface CanvasContainerNewProps {
  isEmbedded?: boolean;
  initialSnapshot?: CanvasSnapshot;
  onSnapshotChange?: (snapshot: CanvasSnapshot) => void;
  onSaveRequest?: (snapshot: CanvasSnapshot) => void | Promise<void>;
  readOnly?: boolean;
  onElementInteraction?: (element: Element) => void;
}

export default function CanvasContainerNew({
  isEmbedded = false,
  initialSnapshot,
  onSnapshotChange,
  onSaveRequest,
  readOnly = false,
  onElementInteraction,
}: CanvasContainerNewProps = {}) {
  const [projectTitle, setProjectTitle] = useState(initialSnapshot?.metadata?.title || "Untitled Poster");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [history, setHistory] = useState<Frame[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedoing, setIsUndoRedoing] = useState(false);
  
  // Video ref tracking for frame-level controls
  const videoRefsMap = useRef<Map<string, HTMLVideoElement>>(new Map());
  
  const [frames, setFrames] = useState<Frame[]>([
    {
      id: "frame-1",
      name: "Frame 1",
      x: 100,
      y: 100,
      width: 400,
      height: 600,
      initialWidth: 400,
      initialHeight: 600,
      enableDynamicScale: false,
      backgroundColor: "#ffffff",
      image: null,
      topCaption: "",
      bottomCaption: "",
      textColor: "#ffffff",
      textAlign: "center",
      textSize: 3,
      textOpacity: 100,
      imageStyle: "cover",
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      linkText: "",
      linkPosition: "top-right",
      gradientIntensity: 80,
      flexDirection: undefined,
      justifyContent: undefined,
      alignItems: undefined,
      gap: 0,
      elements: [],
      cornerRadius: 0,
      opacity: 100,
      blendMode: "normal",
    },
  ]);
  const [selectedFrameId, setSelectedFrameId] = useState<string>("frame-1");
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<"select" | "pen" | "shape" | "text" | "image">("select");
  const [penColor, setPenColor] = useState("#9ca3af");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [zoom, setZoom] = useState(1);
  // Reference to the actual canvas area so centering uses the real viewport, not the window
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  
  // Calculate initial pan offset to center the first frame
  const calculateCenterOffset = () => {
    const viewportWidth = canvasAreaRef.current?.clientWidth ?? window.innerWidth;
    const viewportHeight = canvasAreaRef.current?.clientHeight ?? window.innerHeight;
    const firstFrame = frames[0];
    if (!firstFrame) return { x: 0, y: 0 };
    // Center the frame in the viewport
    const centerX = (viewportWidth / 2) - (firstFrame.width / 2) - firstFrame.x;
    const centerY = (viewportHeight / 2) - (firstFrame.height / 2) - firstFrame.y;
    return { x: centerX, y: centerY };
  };
  const [panOffset, setPanOffset] = useState(calculateCenterOffset());
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [gridStyle, setGridStyle] = useState<"lines" | "dots">("lines");
  const [snapToGrid, setSnapToGrid] = useState(false);

  // Auto-fit frame to viewport
  const fitFrameToView = (frameId: string) => {
    const frame = frames.find(f => f.id === frameId);
    if (!frame) return;

    const viewportWidth = canvasAreaRef.current?.clientWidth ?? window.innerWidth;
    const viewportHeight = canvasAreaRef.current?.clientHeight ?? window.innerHeight;
    const padding = 100; // Leave some padding around the frame

    // Calculate zoom to fit frame with padding
    const zoomX = (viewportWidth - padding * 2) / frame.width;
    const zoomY = (viewportHeight - padding * 2) / frame.height;
    const newZoom = Math.min(zoomX, zoomY, 1); // Don't zoom in beyond 100%

    // Calculate pan offset to center the frame
    const centerX = (viewportWidth / 2) - (frame.width * newZoom / 2) - (frame.x * newZoom);
    const centerY = (viewportHeight / 2) - (frame.height * newZoom / 2) - (frame.y * newZoom);

    setZoom(newZoom);
    setPanOffset({ x: centerX, y: centerY });
  };
  const fitDebounceRef = useRef<number | null>(null);

  // Removed auto-fit frame to view on selection - user can manually fit with F key
  // useEffect(() => {
  //   if (!selectedFrameId) return;
  //   const t = window.setTimeout(() => fitFrameToView(selectedFrameId), 0);
  //   return () => window.clearTimeout(t);
  // }, [selectedFrameId]);

  // Fit on window resize to keep poster fully visible
  useEffect(() => {
    const onResize = () => {
      if (selectedFrameId) fitFrameToView(selectedFrameId);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [selectedFrameId]);

  const [showGeneratePanel, setShowGeneratePanel] = useState(false);
  const [showShapeSettings, setShowShapeSettings] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showExportAllDialog, setShowExportAllDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAnimationsPanel, setShowAnimationsPanel] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [animatingElementId, setAnimatingElementId] = useState<string | null>(null);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showTimelinePanel, setShowTimelinePanel] = useState(false);
  const [timelinePanelHeight, setTimelinePanelHeight] = useState(300);
  const [showBrandKitPanel, setShowBrandKitPanel] = useState(false);
  const [showInteractivityPanel, setShowInteractivityPanel] = useState(false);
  const [showShaderLibrary, setShowShaderLibrary] = useState(false);
  const [isResizingTimeline, setIsResizingTimeline] = useState(false);
  const [snapToGuides, setSnapToGuides] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [maxDuration, setMaxDuration] = useState(5);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false);
  const [animationGlobalKey, setAnimationGlobalKey] = useState(0);
  const [voiceAudios, setVoiceAudios] = useState<Array<{ id: string; url: string; text: string; delay: number; duration: number; voiceId: string; voiceName: string; track?: number; waveformData?: number[] }>>([]);
  const [timelineMarkers, setTimelineMarkers] = useState<Array<{ id: string; time: number; label: string; color?: string }>>([]);
  const [backgroundMusic, setBackgroundMusic] = useState<Array<{ id: string; url: string; fileName: string; duration: number; volume: number; startTime: number; waveformData?: number[] }>>([]);

  const [description, setDescription] = useState("");
  const [captionImage, setCaptionImage] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [generationSteps, setGenerationSteps] = useState<Array<{
    id: string;
    label: string;
    status: 'pending' | 'active' | 'complete' | 'error';
  }>>([]);
  const [generationProgressPercent, setGenerationProgressPercent] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const captionImageInputRef = useRef<HTMLInputElement>(null);

  // Collaborative features
  const enableCollaboration = !isEmbedded && projectId !== null;
  const { activeUsers, broadcastCursor, currentUser } = useCollaborativePresence(
    projectId,
    enableCollaboration
  );
  
  const { isSaving: isCollaborativeSaving } = useCollaborativeCanvas(
    projectId,
    frames,
    (remoteFrames) => {
      console.log('Received remote canvas update, merging...');
      setFrames(remoteFrames);
    },
    enableCollaboration
  );

  // Helper function to find a frame (top-level or nested)
  const findFrame = (frameId: string): { frame: Frame | null, parentId: string | null } => {
    // Check top-level frames
    const topFrame = frames.find(f => f.id === frameId);
    if (topFrame) return { frame: topFrame, parentId: null };
    
    // Check nested frames
    for (const parentFrame of frames) {
      const nestedFrame = parentFrame.frames?.find(nf => nf.id === frameId);
      if (nestedFrame) return { frame: nestedFrame, parentId: parentFrame.id };
    }
    
    return { frame: null, parentId: null };
  };

  // Find selected frame (works for both top-level and nested frames)
  const selectedFrameResult = selectedFrameId ? findFrame(selectedFrameId) : { frame: null, parentId: null };
  const selectedFrame = selectedFrameResult.frame;
  const selectedElements = selectedFrame?.elements?.filter((e) => selectedElementIds.includes(e.id)) || [];
  const selectedElement = selectedElements.length === 1 ? selectedElements[0] : null;
  
  // Determine if we're editing a parent frame (no units like %, rem, em) or an element/nested frame (all units)
  const isEditingParentFrame = !selectedElement && selectedFrame !== undefined;

  // Undo/Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      setIsUndoRedoing(true);
      setHistoryIndex(historyIndex - 1);
      setFrames(JSON.parse(JSON.stringify(history[historyIndex - 1])));
      toast.success("Undone");
    } else {
      toast.info("Nothing to undo");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedoing(true);
      setHistoryIndex(historyIndex + 1);
      setFrames(JSON.parse(JSON.stringify(history[historyIndex + 1])));
      toast.success("Redone");
    } else {
      toast.info("Nothing to redo");
    }
  };

  // Save to history when frames change (but not during undo/redo)
  useEffect(() => {
    if (isUndoRedoing) {
      setIsUndoRedoing(false);
      return;
    }
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(frames)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [frames]);

  // Keyboard shortcuts and zoom controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if user is editing text (in input, textarea, or contenteditable)
        const activeElement = document.activeElement;
        const isEditingText = 
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          (activeElement as HTMLElement)?.isContentEditable ||
          (activeElement as HTMLElement)?.getAttribute('contenteditable') === 'true';
        
        if (!isEditingText && selectedElementIds.length > 0) {
          e.preventDefault();
          handleElementsDelete();
        }
      }
      // Arrange forward: Cmd/Ctrl + ]
      if ((e.ctrlKey || e.metaKey) && e.key === ']') {
        e.preventDefault();
        handleArrange('forward');
      }
      // Arrange backward: Cmd/Ctrl + [
      if ((e.ctrlKey || e.metaKey) && e.key === '[') {
        e.preventDefault();
        handleArrange('backward');
      }
      // Arrow keys to nudge selected elements
      if (selectedElementIds.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const nudgeAmount = e.shiftKey ? 10 : 1;
        const frame = frames.find(f => f.id === selectedFrameId);
        if (!frame || !frame.elements) return;

        const updatedElements = frame.elements.map(el => {
          if (!selectedElementIds.includes(el.id)) return el;
          
          switch (e.key) {
            case 'ArrowUp':
              return { ...el, y: el.y - nudgeAmount };
            case 'ArrowDown':
              return { ...el, y: el.y + nudgeAmount };
            case 'ArrowLeft':
              return { ...el, x: el.x - nudgeAmount };
            case 'ArrowRight':
              return { ...el, x: el.x + nudgeAmount };
            default:
              return el;
          }
        });

        setFrames(frames.map(f =>
          f.id === selectedFrameId ? { ...f, elements: updatedElements } : f
        ));
      }
      if (e.key === ' ') {
        setIsPanning(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsPanning(false);
      }
    };

    // Global prevention of browser zoom when Ctrl/Cmd is held
    const handleGlobalWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // Safari pinch-zoom gestures
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Capture-phase, non-passive listeners to reliably prevent browser zoom
    window.addEventListener('wheel', handleGlobalWheel, { passive: false, capture: true });
    document.addEventListener('wheel', handleGlobalWheel, { passive: false, capture: true });
    document.documentElement.addEventListener('wheel', handleGlobalWheel, { passive: false, capture: true });

    window.addEventListener('gesturestart', preventGesture as any);
    window.addEventListener('gesturechange', preventGesture as any);
    window.addEventListener('gestureend', preventGesture as any);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);

      window.removeEventListener('wheel', handleGlobalWheel as any, { capture: true } as any);
      document.removeEventListener('wheel', handleGlobalWheel as any, { capture: true } as any);
      document.documentElement.removeEventListener('wheel', handleGlobalWheel as any, { capture: true } as any);

      window.removeEventListener('gesturestart', preventGesture as any);
      window.removeEventListener('gesturechange', preventGesture as any);
      window.removeEventListener('gestureend', preventGesture as any);
    };
  }, [historyIndex, history, selectedElementIds]);

  // Calculate max duration based on all content
  useEffect(() => {
    let calculatedMax = 5; // Default minimum duration

    // Check voice clips
    voiceAudios.forEach(voice => {
      const endTime = voice.delay + voice.duration;
      if (endTime > calculatedMax) calculatedMax = endTime;
    });

    // Check animations on elements
    const selectedFrame = frames.find(f => f.id === selectedFrameId);
    if (selectedFrame?.elements) {
      selectedFrame.elements.forEach(element => {
        if (element.animations) {
          element.animations.forEach(anim => {
            const delay = typeof anim.delay === 'string' ? parseFloat(anim.delay) : anim.delay;
            const duration = typeof anim.duration === 'string' ? parseFloat(anim.duration) : anim.duration;
            const endTime = delay + duration;
            if (endTime > calculatedMax) calculatedMax = endTime;
          });
        }
      });
    }

    // Check timeline markers
    timelineMarkers.forEach(marker => {
      if (marker.time > calculatedMax) calculatedMax = marker.time;
    });

    // Check background music
    backgroundMusic.forEach(music => {
      const endTime = music.startTime + music.duration;
      if (endTime > calculatedMax) calculatedMax = endTime;
    });

    // Add 1 second buffer
    setMaxDuration(Math.ceil(calculatedMax) + 1);
  }, [voiceAudios, frames, selectedFrameId, timelineMarkers, backgroundMusic]);

  // Animation playback
  useEffect(() => {
    if (!isPlayingAnimation) return;

    const fps = 60;
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + (1 / fps);
        if (next >= maxDuration) {
          setIsPlayingAnimation(false);
          return maxDuration;
        }
        return next;
      });
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [isPlayingAnimation, maxDuration]);

  const handlePlayPause = () => {
    if (!isPlayingAnimation) {
      setCurrentTime(0);
      setAnimationGlobalKey((k) => k + 1); // restart CSS animations
    }
    setIsPlayingAnimation(!isPlayingAnimation);
  };

  const handleTimelineReset = () => {
    setCurrentTime(0);
    setIsPlayingAnimation(false);
  };

  const getFilterStyle = () => {
    if (!selectedFrame) return {};
    return {
      filter: `brightness(${selectedFrame.brightness}%) contrast(${selectedFrame.contrast}%) saturate(${selectedFrame.saturation}%) blur(${selectedFrame.blur}px)`,
    };
  };

  const handleAddFrame = () => {
    // Place new frame 24px to the right of the rightmost frame (same row)
    const spacing = 24;
    const rightmost = frames.reduce(
      (acc, f) => {
        const right = f.x + f.width;
        if (right > acc.right) return { right, y: f.y };
        return acc;
      },
      { right: -Infinity, y: 100 }
    );

    const newX = isFinite(rightmost.right) ? rightmost.right + spacing : 100;
    const newY = frames.length ? frames[0].y : 100;

    const newFrame: Frame = {
      id: `frame-${Date.now()}`,
      name: `Frame ${frames.length + 1}`,
      x: newX,
      y: newY,
      width: 400,
      height: 600,
      initialWidth: 400,
      initialHeight: 600,
      enableDynamicScale: false,
      backgroundColor: "#ffffff",
      image: null,
      topCaption: "",
      bottomCaption: "",
      textColor: "#ffffff",
      textAlign: "center",
      textSize: 3,
      textOpacity: 100,
      imageStyle: "cover",
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      linkText: "",
      linkPosition: "top-right",
      gradientIntensity: 80,
      flexDirection: undefined,
      justifyContent: undefined,
      alignItems: undefined,
      gap: 0,
      elements: [],
      cornerRadius: 0,
      opacity: 100,
      blendMode: "normal",
    };
    setFrames([...frames, newFrame]);
    setSelectedFrameId(newFrame.id);
    // Center newly added frame
    requestAnimationFrame(() => {
      try { fitFrameToView(newFrame.id); } catch {}
    });
    toast.success("Frame added!");
  };

  const handleAddNestedFrame = () => {
    const selectedFrame = frames.find(f => f.id === selectedFrameId);
    if (!selectedFrame) {
      toast.error("Please select a parent frame first");
      return;
    }

    // Make nested frame 60% of parent width and 50% of parent height with good padding
    const nestedWidth = Math.max(200, Math.floor(selectedFrame.width * 0.6));
    const nestedHeight = Math.max(150, Math.floor(selectedFrame.height * 0.5));
    const paddingX = Math.floor((selectedFrame.width - nestedWidth) / 2);
    const paddingY = Math.floor((selectedFrame.height - nestedHeight) / 2);

    const newNestedFrame: Frame = {
      id: `nested-frame-${Date.now()}`,
      name: `Nested Frame`,
      x: paddingX,
      y: paddingY,
      width: nestedWidth,
      height: nestedHeight,
      sizeUnit: "px",
      initialWidth: nestedWidth,
      initialHeight: nestedHeight,
      enableDynamicScale: false,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      backgroundType: "solid",
      image: null,
      topCaption: "",
      bottomCaption: "",
      textColor: "#000000",
      textAlign: "center",
      textSize: 3,
      textOpacity: 100,
      imageStyle: "cover",
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      linkText: "",
      linkPosition: "top-right",
      gradientIntensity: 80,
      flexDirection: undefined,
      justifyContent: undefined,
      alignItems: undefined,
      gap: 0,
      elements: [],
      frames: [],
      cornerRadius: 8,
      opacity: 100,
      fillOpacity: 90,
      blendMode: "normal",
    };

    setFrames(prevFrames => prevFrames.map(f => {
      if (f.id === selectedFrameId) {
        return { ...f, frames: [...(f.frames || []), newNestedFrame] };
      }
      return f;
    }));
    toast.success("Nested frame added!");
  };

  const handleFrameUpdate = (id: string, updates: Partial<Frame>) => {
    const { parentId } = findFrame(id);
    
    if (parentId) {
      // Update nested frame
      setFrames(frames.map((f) => 
        f.id === parentId
          ? {
              ...f,
              frames: (f.frames || []).map(nf => 
                nf.id === id ? { ...nf, ...updates } : nf
              )
            }
          : f
      ));
    } else {
      // Update top-level frame
      setFrames(frames.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    }
  };

  const handleImageUpload = () => {
    // Open media library panel first instead of directly opening file picker
    setShowMediaLibrary(true);
  };

  const handleVideoUpload = () => {
    // Open media library panel for video selection
    setShowMediaLibrary(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedFrameId) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        
        // Create image element instead of setting frame image
        const newElement: Element = {
          id: `element-${Date.now()}`,
          type: "image",
          x: 50,
          y: 50,
          width: 200,
          height: 200,
          imageUrl,
          imageFit: "cover",
          fillType: "solid",
          fill: "#000000",
          brightness: 100,
          contrast: 100,
          saturation: 100,
          blur: 0,
          opacity: 100,
          cornerRadius: 0,
        };

        setFrames(frames.map(f => {
          if (f.id === selectedFrameId) {
            return { ...f, elements: [...(f.elements || []), newElement] };
          }
          return f;
        }));
        setSelectedElementIds([newElement.id]);
        setShowShapeSettings(true);
        toast.success("Image added!");
      };
      reader.readAsDataURL(file);
    }
  };

  const generateWithAI = async (generationTypes: string[] = ["freeform"], model: string = "gemini-2.5-flash", colorPalette?: string, conversationHistory?: any[], targetFrameId?: string) => {
    const imgs = Array.isArray(captionImage) ? captionImage : [];
    if (!description.trim() && imgs.length === 0) {
      toast.error("Please provide a description or upload an image");
      return;
    }

    setIsGenerating(true);
    
    // Check if image generation or Unsplash search is requested
    const willSearchUnsplash = generationTypes.includes('search-unsplash');
    const willGenerateImage = generationTypes.includes('generate-image');
    
    if (willSearchUnsplash) {
      setGenerationProgress("🔍 Searching Unsplash for photos...");
      toast.info("Finding the perfect photo from Unsplash...");
    } else if (willGenerateImage) {
      setGenerationProgress("🎨 Generating AI image...");
      toast.info("Creating custom AI image for your poster...");
    } else {
      setGenerationProgress(`Starting generation with ${model}...`);
      // Notify user that new elements will be added to existing design
      const frameId = targetFrameId || selectedFrameId;
      const currentFrame = frames.find(f => f.id === frameId);
      const existingElementCount = currentFrame?.elements?.length || 0;
      if (existingElementCount > 0) {
        toast.success(`Adding new elements to ${currentFrame?.name || 'selected frame'} (${existingElementCount} existing elements will be preserved)`);
      }
    }
    setGenerationProgressPercent(0);
    
    // Initialize generation steps based on selected types
    const steps = [];
    const shouldSearchUnsplash = generationTypes.includes("search-unsplash");
    const shouldGenerateImage = generationTypes.includes("generate-image");
    const shouldReplicate = generationTypes.includes("replicate");
    
    if (shouldSearchUnsplash) {
      steps.push({ id: 'unsplash', label: 'Search Unsplash Photos', status: 'pending' as const });
    }
    if (shouldGenerateImage) {
      steps.push({ id: 'image', label: 'Generate Image with AI', status: 'pending' as const });
    }
    if (shouldReplicate) {
      steps.push({ id: 'replicate', label: 'Analyze & Replicate Design', status: 'pending' as const });
    }
    steps.push({ id: 'design', label: 'Create Poster Design', status: 'pending' as const });
    setGenerationSteps(steps);
    
    try {
      // Handle image generation first if selected
      let imagesToUse = [...imgs];
      const shouldGenerateImage = generationTypes.includes("generate-image");
      const shouldReplicate = generationTypes.includes("replicate");
      
      if (shouldGenerateImage) {
        if (!description.trim()) {
          toast.error("Please provide a description for image generation");
          setIsGenerating(false);
          return;
        }

        // Update step to active
        setGenerationSteps(prev => prev.map(s => 
          s.id === 'image' ? { ...s, status: 'active' as const } : s
        ));
        setGenerationProgress("Generating image with AI...");
        setGenerationProgressPercent(10);
        
        try {
          const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-image', {
            body: {
              prompt: description,
              size: "1024x1024",
              quality: "high",
            }
          });

          if (imageError) {
            throw new Error(imageError.message || "Failed to generate image");
          }

          if (imageData?.image) {
            imagesToUse = [imageData.image];
            setGenerationSteps(prev => prev.map(s => 
              s.id === 'image' ? { ...s, status: 'complete' as const } : s
            ));
            setGenerationProgressPercent(33);
            toast.success("Image generated! Now creating poster...");
            setGenerationProgress("Creating poster design...");
          } else {
            throw new Error("No image data received");
          }
        } catch (imageError: any) {
          console.error("Image generation error:", imageError);
          const errorMessage = imageError.message || "Failed to generate image";
          
          // Check if it's a credits exhaustion error
          if (errorMessage.includes("Credits exhausted") || errorMessage.includes("402")) {
            toast.error("AI credits exhausted! Please add credits in Settings → Workspace → Usage to continue generating images.", {
              duration: 6000,
            });
          } else if (errorMessage.includes("Rate limit") || errorMessage.includes("429")) {
            toast.error("Rate limit exceeded. Please wait a moment and try again.", {
              duration: 5000,
            });
          } else {
            toast.error(errorMessage);
          }
          
          setIsGenerating(false);
          setGenerationProgress("");
          setGenerationSteps(prev => prev.map(s => 
            s.id === 'image' ? { ...s, status: 'error' as const } : s
          ));
          return;
        }
      }

      // Intelligently determine analysisType based on context
      let analysisType = shouldReplicate ? "replicate" : "create";
      
      if (imagesToUse.length === 0 && shouldReplicate) {
        toast.error("Please upload an image to replicate");
        setIsGenerating(false);
        return;
      }

      // Update design step to active
      const designStepId = shouldReplicate ? 'replicate' : 'design';
      setGenerationSteps(prev => prev.map(s => 
        s.id === designStepId ? { ...s, status: 'active' as const } : s
      ));
      setGenerationProgressPercent(shouldGenerateImage ? 40 : 20);
      setGenerationProgress(shouldReplicate ? "Analyzing image..." : "Designing poster layout...");

      // Get current frame dimensions to tell AI the canvas size
      const frameId = targetFrameId || selectedFrameId;
      const selectedFrame = frames.find(f => f.id === frameId);
      const canvasWidth = selectedFrame?.width || 800;
      const canvasHeight = selectedFrame?.height || 1200;

      // Get current snapshot for iterative updates
      const currentSnapshot = createSnapshot(frames, projectTitle, zoom, panOffset, "#ffffff", voiceAudios);

      // Full AI poster generation with streaming
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-poster`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            prompt: description,
            imageBase64: imagesToUse.length > 0 ? imagesToUse : null,
            analysisType,
            canvasWidth,
            canvasHeight,
            model,
            colorPalette,
            generationTypes, // Pass generation types to backend
            conversationHistory: conversationHistory || [], // Pass conversation history
            currentSnapshot, // Pass current canvas state
            targetFrameId: frameId, // Pass target frame ID
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        try {
          const err = JSON.parse(text);
          throw new Error(err.error || `Failed to generate (${response.status})`);
        } catch {
          throw new Error(text || `Failed to generate (${response.status})`);
        }
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let designSpec = null;
      let targetFrameIdFromResponse = targetFrameId; // Store target frame ID for applying changes

      if (!reader) {
        throw new Error("No response body");
      }

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'status') {
                // Show friendly status message
                setGenerationProgress(data.message);
                // Increment progress gradually
                setGenerationProgressPercent(prev => Math.min(prev + 5, 90));
                console.log('Status:', data.message);
              } else if (data.type === 'background') {
                // Apply background color immediately
                if (selectedFrameId && data.color) {
                  handleFrameUpdate(selectedFrameId, { backgroundColor: data.color });
                  console.log('Applied background:', data.color);
                }
              } else if (data.type === 'element') {
                // Render element progressively as it arrives
                if (selectedFrameId && data.element) {
                  const el = data.element;
                  
                  // Determine border radius
                  let borderRadius = 0;
                  if (el.borderRadius) {
                    borderRadius = el.borderRadius === '50%' ? 9999 : parseInt(el.borderRadius) || 0;
                  } else if (el.shape === 'circle') {
                    borderRadius = 9999;
                  }

                  // Create element
                  const baseElement: any = {
                    id: crypto.randomUUID(),
                    type: el.type,
                    x: el.x || 100,
                    y: el.y || 100,
                    width: el.width || 200,
                    height: el.height || 100,
                    rotation: 0,
                    opacity: 100,
                    blendMode: "normal" as const,
                  };

                  let newElement: any;
                  if (el.type === "icon") {
                    newElement = {
                      ...baseElement,
                      iconName: el.iconName || "heart",
                      iconFamily: el.iconFamily || "lucide",
                      iconStrokeWidth: el.iconStrokeWidth || 2,
                      fill: el.color || "#000000",
                    };
                  } else if (el.type === "text") {
                    newElement = {
                      ...baseElement,
                      text: el.content || el.text || "Text",
                      fill: el.color || "#000000",
                      fontSize: el.fontSize || 24,
                      fontFamily: "Arial",
                      fontWeight: el.fontWeight || "normal",
                    };
                  } else if (el.type === "shape") {
                    newElement = {
                      ...baseElement,
                      shapeType: el.shape || "rectangle",
                      fill: el.color || "#000000",
                      stroke: "#000000",
                      strokeWidth: 0,
                      borderRadius: borderRadius,
                    };
                  } else if (el.type === "image") {
                    newElement = {
                      ...baseElement,
                      imageUrl: el.content || el.imageUrl || el.src || "",
                      imageFit: "cover",
                      fillType: "solid",
                      fill: "#000000",
                      brightness: 100,
                      contrast: 100,
                      saturation: 100,
                      blur: 0,
                      cornerRadius: borderRadius,
                    };
                  }

                  if (newElement) {
                    // Add element to the current frame (building on top of existing design)
                    setFrames(prevFrames => prevFrames.map(f => {
                      if (f.id === selectedFrameId) {
                        return { ...f, elements: [...(f.elements || []), newElement] };
                      }
                      return f;
                    }));
                    console.log(`Added element ${data.index + 1} on top of existing design:`, el.type);
                  }
                }
              } else if (data.type === 'progress') {
                // Log raw progress for debugging
                console.log('Generating:', data.text);
              } else if (data.type === 'complete') {
                setGenerationProgress('Finalizing design...');
                setGenerationProgressPercent(95);
                setGenerationSteps(prev => prev.map(s => 
                  s.id === designStepId ? { ...s, status: 'complete' as const } : s
                ));
                designSpec = data.designSpec;
                // Store the target frame ID from the response
                targetFrameIdFromResponse = data.targetFrameId;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      console.log('Design spec received:', designSpec);

      if (!designSpec) {
        console.error('No design specification received from AI');
        throw new Error("No design specification received from AI. Please try again.");
      }

      // Flatten any frames into a single editable elements array
      const baseElements = Array.isArray(designSpec.elements) ? designSpec.elements : [];
      let combinedElements: any[] = [...baseElements];

      if (Array.isArray(designSpec.frames)) {
        for (const frameSpec of designSpec.frames) {
          const offsetX = frameSpec.x || 0;
          const offsetY = frameSpec.y || 0;
          const children = Array.isArray(frameSpec.elements) ? frameSpec.elements : [];
          for (const child of children) {
            combinedElements.push({
              ...child,
              x: (child.x || 0) + offsetX,
              y: (child.y || 0) + offsetY,
            });
          }
        }
      }

      if (combinedElements.length === 0) {
        console.warn('Design spec has no elements; only background may be present');
        toast.info("AI generated only a background. Try adding more details to your prompt.");
      }

      // Update current frame background
      const targetFrame = targetFrameIdFromResponse || selectedFrameId;
      if (targetFrame && designSpec.backgroundColor) {
        handleFrameUpdate(targetFrame, { backgroundColor: designSpec.backgroundColor });
      }

        // Add elements to the current frame
        if (targetFrame && combinedElements.length > 0) {
          const newElements = combinedElements.map((el: any) => {
            // Determine border radius based on shape type
            let borderRadius = 0;
            if (el.borderRadius) {
              // If AI provided borderRadius, use it
              borderRadius = el.borderRadius === '50%' ? 9999 : parseInt(el.borderRadius) || 0;
            } else if (el.shape === 'circle') {
              // Fallback: if shape is circle but no borderRadius, make it circular
              borderRadius = 9999;
            }

            // Base element properties
            const baseElement: any = {
              id: crypto.randomUUID(),
              type: el.type,
              x: el.x || 100,
              y: el.y || 100,
              width: el.width || 200,
              height: el.height || 100,
              rotation: 0,
              opacity: 100,
              blendMode: "normal" as const,
            };

            // Type-specific properties
            if (el.type === "icon") {
              return {
                ...baseElement,
                iconName: el.iconName || "heart",
                iconFamily: el.iconFamily || "lucide",
                iconStrokeWidth: el.iconStrokeWidth || 2,
                fill: el.color || "#000000",
              };
            } else if (el.type === "text") {
              return {
                ...baseElement,
                text: el.content || "",
                fontSize: el.fontSize || 16,
                fontWeight: el.fontWeight || "normal",
                fontFamily: "Arial",
                fill: el.color || "#000000",
              };
            } else if (el.type === "image") {
              // For images, use the content from AI (which includes generated or uploaded images)
              return {
                ...baseElement,
                imageUrl: el.content || (imagesToUse.length > 0 ? imagesToUse[0] : ""),
                imageFit: "cover",
                fillType: "solid",
                fill: "#000000",
                brightness: 100,
                contrast: 100,
                saturation: 100,
                blur: 0,
                cornerRadius: borderRadius,
              };
            } else {
              // shape
              return {
                ...baseElement,
                fill: el.color || el.backgroundColor || "#000000",
                stroke: el.borderColor || "#000000",
                strokeWidth: el.borderWidth || 0,
                borderRadius,
                shapeType: el.shape || "rectangle",
              };
            }
          });

          setFrames(frames.map(f => 
            f.id === targetFrame 
              ? { ...f, elements: [...(f.elements || []), ...newElements] }
              : f
          ));
        }

        // Frames from AI are intentionally ignored; content was flattened above to keep everything editable.


      console.log(`Added ${combinedElements.length} elements to canvas`);
      toast.success(`Design generated successfully with ${combinedElements.length} elements!`);
      
      // Auto-fit the frame to view after generation
      if (selectedFrameId) {
        setTimeout(() => fitFrameToView(selectedFrameId), 100);
      }
      
      // Save to conversation history
      if (projectId) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const snapshot = createSnapshot(frames, projectTitle, zoom, panOffset, "#ffffff", voiceAudios);
            await supabase.from('ai_conversations').insert({
              project_id: projectId,
              user_id: user.id,
              title: description.substring(0, 50) || "AI Generation",
              description: description,
              generation_type: generationTypes.join(", "),
              input_data: { prompt: description, hasImage: (captionImage?.length ?? 0) > 0 },
              output_snapshot: snapshot as any
            });
          }
        } catch (error) {
          console.error("Error saving conversation:", error);
          // Don't show error to user, just log it
        }
      }
      
      setDescription("");
      setCaptionImage([]);
      setShowGeneratePanel(false);
      setIsGenerating(false);
      setGenerationProgress("");
    } catch (error: any) {
      console.error("Error generating with AI:", error);
      console.error("Error details:", error.message, error.stack);
      toast.error(error.message || "Failed to generate design. Please try again.");
      setIsGenerating(false);
      setGenerationProgress("");
    }
  };

  const saveToCloud = async () => {
    if (isEmbedded && onSaveRequest) {
      const snapshot = createSnapshot(frames, projectTitle, zoom, panOffset, "#ffffff", voiceAudios);
      await onSaveRequest(snapshot);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to save your work");
        return;
      }

      const snapshot = createSnapshot(frames, projectTitle, zoom, panOffset, "#ffffff", voiceAudios);
      const thumbnail = await generateThumbnail(frames);

      // Get selected workspace ID from localStorage
      const selectedWorkspaceId = localStorage.getItem('selectedWorkspaceId');
      // Normalize "personal" to null and handle empty values
      const workspaceId = selectedWorkspaceId && selectedWorkspaceId !== 'personal' ? selectedWorkspaceId : null;

      const posterData = {
        user_id: user.id,
        project_name: projectTitle,
        canvas_data: snapshot as any,
        thumbnail_url: thumbnail,
        workspace_id: workspaceId,
      };

      if (projectId) {
        const { error } = await supabase
          .from("posters")
          .update(posterData)
          .eq("id", projectId);
        if (error) throw error;
        toast.success("Project saved!");
      } else {
        const { data, error } = await supabase
          .from("posters")
          .insert([posterData] as any)
          .select()
          .single();
        if (error) throw error;
        if (data) {
          setProjectId(data.id);
          // Update URL with project ID
          const url = new URL(window.location.href);
          url.searchParams.set('project', data.id);
          window.history.replaceState({}, '', url);
          toast.success("Project created and saved!");
        }
      }
    } catch (error: any) {
      console.error("Error saving project:", error);
      toast.error(error.message || "Failed to save project");
      throw error;
    }
  };

  const { isSaving: isAutoSaving, forceSave } = useAutoSave({
    onSave: saveToCloud,
    enabled: !isEmbedded,
  });

  // Notify parent of changes in embedded mode
  useEffect(() => {
    if (isEmbedded && onSnapshotChange) {
      const snapshot = createSnapshot(frames, projectTitle, zoom, panOffset, "#ffffff", voiceAudios);
      onSnapshotChange(snapshot);
    }
  }, [frames, projectTitle, zoom, panOffset, isEmbedded, onSnapshotChange, voiceAudios]);

  // Load initial snapshot
  // Load or update from provided snapshot (supports prop changes)
  useEffect(() => {
    if (initialSnapshot && validateSnapshot(initialSnapshot)) {
      setProjectTitle(initialSnapshot.metadata?.title || "Untitled Poster");
      setFrames(initialSnapshot.frames);
      
      // Restore voice audios if available
      if (initialSnapshot.voiceAudios) {
        setVoiceAudios(initialSnapshot.voiceAudios);
      }

      const firstId = initialSnapshot.frames?.[0]?.id;
      if (firstId) {
        setSelectedFrameId(firstId);
        requestAnimationFrame(() => {
          try { fitFrameToView(firstId); } catch {}
        });
      }

      // Apply canvas view if provided
      if (initialSnapshot.canvas?.zoom !== undefined) setZoom(initialSnapshot.canvas.zoom);
      if (initialSnapshot.canvas?.panOffset) setPanOffset(initialSnapshot.canvas.panOffset);
    } else if (!initialSnapshot && frames.length === 0) {
      // If no initial snapshot and no frames, ensure we have a default frame
      setFrames([{
        id: "frame-1",
        name: "Frame 1",
        x: 100,
        y: 100,
        width: 400,
        height: 600,
        initialWidth: 400,
        initialHeight: 600,
        enableDynamicScale: false,
        backgroundColor: "#ffffff",
        image: null,
        topCaption: "",
        bottomCaption: "",
        textColor: "#ffffff",
        textAlign: "center",
        textSize: 3,
        textOpacity: 100,
        imageStyle: "cover",
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        linkText: "",
        linkPosition: "top-right",
        gradientIntensity: 80,
        flexDirection: undefined,
        justifyContent: undefined,
        alignItems: undefined,
        gap: 0,
        elements: [],
        cornerRadius: 0,
        opacity: 100,
        blendMode: "normal",
      }]);
      setSelectedFrameId("frame-1");
    }
  }, [initialSnapshot]);
  
  // Center default frame once canvas is ready
  useEffect(() => {
    if (frames.length === 1 && frames[0].id === "frame-1" && !initialSnapshot && canvasAreaRef.current) {
      // Wait a bit to ensure canvas is fully mounted
      const timer = setTimeout(() => {
        try { fitFrameToView("frame-1"); } catch {}
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [frames, initialSnapshot, canvasAreaRef.current]);

  // Load project from URL on mount
  useEffect(() => {
    const loadProjectFromUrl = async () => {
      const params = new URLSearchParams(window.location.search);
      const projectIdFromUrl = params.get('project');
      
      console.log("🔍 Checking for project in URL:", projectIdFromUrl, "isEmbedded:", isEmbedded);
      
      if (projectIdFromUrl && !isEmbedded) {
        try {
          console.log("📥 Loading project:", projectIdFromUrl);
          const { data, error } = await supabase
            .from('posters')
            .select('canvas_data, project_name')
            .eq('id', projectIdFromUrl)
            .single();
          
          if (error) {
            console.error("❌ Error fetching project:", error);
            throw error;
          }
          
          console.log("📦 Project data received:", data);
          
          if (data?.canvas_data) {
            const snapshot = data.canvas_data as any as CanvasSnapshot;
            console.log("🔍 Validating snapshot:", snapshot);
            
            if (validateSnapshot(snapshot)) {
              console.log("✅ Snapshot is valid, loading project");
              // Extract title from metadata or fallback to project_name
              const title = snapshot.metadata?.title || data.project_name || "Untitled Project";
              setProjectTitle(title);
              setFrames(snapshot.frames);
              
              // Load canvas settings if they exist
              if (snapshot.canvas?.zoom !== undefined) setZoom(snapshot.canvas.zoom);
              if (snapshot.canvas?.panOffset) setPanOffset(snapshot.canvas.panOffset);
              
              setProjectId(projectIdFromUrl);
              console.log("✅ Loaded project from URL:", projectIdFromUrl, "with", snapshot.frames.length, "frames");
              toast.success(`Opened: ${title}`);
            } else {
              console.error("❌ Snapshot validation failed:", snapshot);
              console.error("Snapshot structure:", JSON.stringify(snapshot, null, 2));
              toast.error("Project data is invalid or has no frames");
            }
          } else {
            console.error("❌ No canvas_data found in project");
            toast.error("Project has no canvas data");
          }
        } catch (error) {
          console.error("❌ Error loading project:", error);
          toast.error("Failed to load project");
        }
      } else {
        console.log("⏭️ Skipping project load - no project ID or embedded mode");
      }
    };
    
    loadProjectFromUrl();
  }, [isEmbedded]);

  const downloadPoster = () => {
    if (!selectedFrame) {
      toast.error("No frame selected");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = selectedFrame.width;
    canvas.height = selectedFrame.height;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      ctx.fillStyle = selectedFrame.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (selectedFrame.image) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const link = document.createElement("a");
          link.download = `${projectTitle}-${selectedFrame.name}.png`;
          link.href = canvas.toDataURL();
          link.click();
          toast.success("Poster downloaded!");
        };
        img.src = selectedFrame.image;
      } else {
        const link = document.createElement("a");
        link.download = `${projectTitle}-${selectedFrame.name}.png`;
        link.href = canvas.toDataURL();
        link.click();
        toast.success("Poster downloaded!");
      }
    }
  };

  const handleDuplicate = () => {
    if (!selectedFrame) return;
    const newFrame = { ...selectedFrame, id: `frame-${frames.length + 1}`, name: `${selectedFrame.name} Copy`, x: selectedFrame.x + 50, y: selectedFrame.y + 50 };
    setFrames([...frames, newFrame]);
    setSelectedFrameId(newFrame.id);
    toast.success("Frame duplicated!");
  };

  const handleDelete = () => {
    if (!selectedFrame || frames.length === 1) {
      toast.error("Cannot delete the last frame");
      return;
    }
    setFrames(frames.filter((f) => f.id !== selectedFrameId));
    setSelectedFrameId(frames[0].id);
    toast.success("Frame deleted!");
  };

  const handleAlign = (type: string) => {
    if (!selectedFrameId || selectedElementIds.length === 0) return;
    
    const frame = frames.find(f => f.id === selectedFrameId);
    if (!frame || !frame.elements) return;

    const updatedElements = frame.elements.map(el => {
      if (!selectedElementIds.includes(el.id)) return el;

      switch (type) {
        case "left":
          return { ...el, x: 0 };
        case "center":
          return { ...el, x: Math.max(0, (frame.width - el.width) / 2) };
        case "right":
          return { ...el, x: Math.max(0, frame.width - el.width) };
        case "top":
          return { ...el, y: 0 };
        case "middle":
          return { ...el, y: Math.max(0, (frame.height - el.height) / 2) };
        case "bottom":
          return { ...el, y: Math.max(0, frame.height - el.height) };
        default:
          return el;
      }
    });

    const updatedFrames = frames.map(f =>
      f.id === selectedFrameId ? { ...f, elements: updatedElements } : f
    );

    setFrames(updatedFrames);
  };

  const handleArrange = (type: string, elementIdsParam?: string[], frameIdParam?: string) => {
    // Resolve targets
    const targetFrameId = frameIdParam || selectedFrameId;
    const targetElementIds = (elementIdsParam && elementIdsParam.length > 0) ? elementIdsParam : selectedElementIds;

    // Handle frame arrangement if no elements are selected
    if ((!targetElementIds || targetElementIds.length === 0) && targetFrameId) {
      const currentIndex = frames.findIndex(f => f.id === targetFrameId);
      if (currentIndex === -1) return;

      const newFrames = [...frames];
      
      if (type === "forward") {
        if (currentIndex < frames.length - 1) {
          [newFrames[currentIndex], newFrames[currentIndex + 1]] = [newFrames[currentIndex + 1], newFrames[currentIndex]];
          setFrames(newFrames);
          toast.success("Frame moved forward");
        }
      } else if (type === "backward") {
        if (currentIndex > 0) {
          [newFrames[currentIndex], newFrames[currentIndex - 1]] = [newFrames[currentIndex - 1], newFrames[currentIndex]];
          setFrames(newFrames);
          toast.success("Frame moved backward");
        }
      } else if (type === "toFront") {
        const frame = newFrames.splice(currentIndex, 1)[0];
        newFrames.push(frame);
        setFrames(newFrames);
        toast.success("Frame moved to front");
      } else if (type === "toBack") {
        const frame = newFrames.splice(currentIndex, 1)[0];
        newFrames.unshift(frame);
        setFrames(newFrames);
        toast.success("Frame moved to back");
      }
      return;
    }

    // Handle element arrangement
    if (!targetFrameId || !targetElementIds || targetElementIds.length === 0) return;
    
    const frame = frames.find(f => f.id === targetFrameId);
    if (!frame || !frame.elements || frame.elements.length === 0) return;

    const elements = [...frame.elements];
    const selectedIndices = targetElementIds
      .map(id => elements.findIndex(el => el.id === id))
      .filter(idx => idx !== -1)
      .sort((a, b) => a - b);

    if (selectedIndices.length === 0) return;

    if (type === "forward") {
      // Move elements forward (higher z-index, later in array)
      // Start from the end to avoid index conflicts
      for (let i = selectedIndices.length - 1; i >= 0; i--) {
        const currentIdx = selectedIndices[i];
        const nextIdx = currentIdx + 1;
        
        // Don't move if already at the end or next element is also selected
        if (nextIdx >= elements.length || selectedIndices.includes(nextIdx)) {
          continue;
        }
        
        // Swap with next element
        [elements[currentIdx], elements[nextIdx]] = [elements[nextIdx], elements[currentIdx]];
      }
      
      // Update state
      setFrames(frames.map(f =>
        f.id === targetFrameId ? { ...f, elements } : f
      ));
      toast.success("Moved forward");
    } else if (type === "backward") {
      // Move elements backward (lower z-index, earlier in array)
      // Start from the beginning
      for (let i = 0; i < selectedIndices.length; i++) {
        const currentIdx = selectedIndices[i];
        const prevIdx = currentIdx - 1;
        
        // Don't move if already at the beginning or previous element is also selected
        if (prevIdx < 0 || selectedIndices.includes(prevIdx)) {
          continue;
        }
        
        // Swap with previous element
        [elements[currentIdx], elements[prevIdx]] = [elements[prevIdx], elements[currentIdx]];
      }
      
      // Update state
      setFrames(frames.map(f =>
        f.id === targetFrameId ? { ...f, elements } : f
      ));
      toast.success("Moved backward");
    } else if (type === "toFront") {
      // Move all selected elements to the end (front)
      const selectedElements = selectedIndices.map(idx => elements[idx]);
      const remainingElements = elements.filter((_, idx) => !selectedIndices.includes(idx));
      const newElements = [...remainingElements, ...selectedElements];
      
      // Update state
      setFrames(frames.map(f =>
        f.id === targetFrameId ? { ...f, elements: newElements } : f
      ));
      toast.success("Brought to front");
    } else if (type === "toBack") {
      // Move all selected elements to the beginning (back)
      const selectedElements = selectedIndices.map(idx => elements[idx]);
      const remainingElements = elements.filter((_, idx) => !selectedIndices.includes(idx));
      const newElements = [...selectedElements, ...remainingElements];
      
      // Update state
      setFrames(frames.map(f =>
        f.id === targetFrameId ? { ...f, elements: newElements } : f
      ));
      toast.success("Sent to back");
    }
  };

  const handleDistribute = (type: string) => {
    if (!selectedFrameId || selectedElementIds.length < 2) return;
    
    const frame = frames.find(f => f.id === selectedFrameId);
    if (!frame || !frame.elements) return;

    const selectedElements = frame.elements.filter(el => selectedElementIds.includes(el.id));
    
    if (type === "horizontal") {
      // Sort by x position
      const sorted = [...selectedElements].sort((a, b) => a.x - b.x);
      const totalWidth = sorted.reduce((sum, el) => sum + el.width, 0);
      const availableSpace = frame.width - totalWidth;
      const spacing = availableSpace / (sorted.length + 1);
      
      let currentX = spacing;
      const updatedElements = frame.elements.map(el => {
        const index = sorted.findIndex(s => s.id === el.id);
        if (index === -1) return el;
        
        const newEl = { ...el, x: currentX };
        currentX += el.width + spacing;
        return newEl;
      });
      
      setFrames(frames.map(f =>
        f.id === selectedFrameId ? { ...f, elements: updatedElements } : f
      ));
      toast.success("Distributed horizontally!");
    } else if (type === "vertical") {
      // Sort by y position
      const sorted = [...selectedElements].sort((a, b) => a.y - b.y);
      const totalHeight = sorted.reduce((sum, el) => sum + el.height, 0);
      const availableSpace = frame.height - totalHeight;
      const spacing = availableSpace / (sorted.length + 1);
      
      let currentY = spacing;
      const updatedElements = frame.elements.map(el => {
        const index = sorted.findIndex(s => s.id === el.id);
        if (index === -1) return el;
        
        const newEl = { ...el, y: currentY };
        currentY += el.height + spacing;
        return newEl;
      });
      
      setFrames(frames.map(f =>
        f.id === selectedFrameId ? { ...f, elements: updatedElements } : f
      ));
      toast.success("Distributed vertically!");
    } else if (type === "tidy") {
      // Tidy up: stack elements with equal spacing
      const sorted = [...selectedElements].sort((a, b) => a.y - b.y || a.x - b.x);
      const spacing = 20;
      
      let currentY = spacing;
      const updatedElements = frame.elements.map(el => {
        const index = sorted.findIndex(s => s.id === el.id);
        if (index === -1) return el;
        
        const newEl = { ...el, x: spacing, y: currentY };
        currentY += el.height + spacing;
        return newEl;
      });
      
      setFrames(frames.map(f =>
        f.id === selectedFrameId ? { ...f, elements: updatedElements } : f
      ));
      toast.success("Tidied up!");
    }
  };

  const handleShapeSelect = (shapeType: string) => {
    console.log("🔷 handleShapeSelect called with:", shapeType);
    const targetFrameId = selectedFrameId || frames[0]?.id;
    if (!targetFrameId) {
      console.log("❌ No frame available");
      toast.error("Please add a frame first");
      return;
    }
    
    const { frame, parentId } = findFrame(targetFrameId);
    if (!frame) {
      console.log("❌ Frame not found");
      return;
    }
    console.log("✅ Frame found:", frame.id);

    const defaultWidth = shapeType === "line" || shapeType === "arrow" 
      ? Math.max(150, Math.floor(frame.width * 0.5)) 
      : shapeType === "rectangle"
        ? 120
        : Math.floor(frame.width * 0.25);
    const defaultHeight = shapeType === "line" || shapeType === "arrow" 
      ? 2 
      : shapeType === "rectangle"
        ? 120
        : Math.floor(frame.height * 0.25);

    const x = Math.max(0, Math.floor((frame.width - defaultWidth) / 2));
    const y = Math.max(0, Math.floor((frame.height - (shapeType === "line" || shapeType === "arrow" ? Math.max(2, defaultHeight) : defaultHeight)) / 2));

    const newElement: Element = {
      id: `element-${Date.now()}`,
      type: "shape",
      x,
      y,
      width: defaultWidth,
      height: shapeType === "line" || shapeType === "arrow" ? Math.max(2, defaultHeight) : defaultHeight,
      shapeType: shapeType as any,
      fill: shapeType === "line" || shapeType === "arrow" ? "transparent" : penColor,
      stroke: penColor,
      strokeWidth: shapeType === "line" || shapeType === "arrow" ? 3 : 2,
      opacity: 100,
      cornerRadius: 0,
      blendMode: "normal",
    };

    console.log("🔷 Created new shape element:", newElement);

    if (parentId) {
      // Add to nested frame
      setFrames(prevFrames => prevFrames.map(f => 
        f.id === parentId
          ? {
              ...f,
              frames: (f.frames || []).map(nf => 
                nf.id === targetFrameId
                  ? { ...nf, elements: [...(nf.elements || []), newElement] }
                  : nf
              )
            }
          : f
      ));
    } else {
      // Add to top-level frame
      setFrames(prevFrames => prevFrames.map(f => {
        if (f.id === targetFrameId) {
          const updatedFrame = { ...f, elements: [...(f.elements || []), newElement] };
          console.log("✅ Updated frame with new element. Total elements:", updatedFrame.elements?.length);
          return updatedFrame;
        }
        return f;
      }));
    }
    
    setSelectedElementIds([newElement.id]);
    console.log("✅ Selected new element:", newElement.id);
    setShowShapeSettings(true);
    setActiveTool("select");
    console.log(`✅ ${shapeType} shape added successfully!`);
    toast.success(`${shapeType} added!`);
  };

  const handleQRCodeAdd = () => {
    const targetFrameId = selectedFrameId || frames[0]?.id;
    if (!targetFrameId) {
      toast.error("Please add a frame first");
      return;
    }
    
    const { frame, parentId } = findFrame(targetFrameId);
    if (!frame) return;

    const defaultSize = Math.min(150, Math.floor(frame.width * 0.3));
    const x = Math.max(0, Math.floor((frame.width - defaultSize) / 2));
    const y = Math.max(0, Math.floor((frame.height - defaultSize) / 2));

    const newElement: Element = {
      id: `element-${Date.now()}`,
      type: "qrcode",
      x,
      y,
      width: defaultSize,
      height: defaultSize,
      qrValue: "https://example.com",
      qrFgColor: "#000000",
      qrBgColor: "#ffffff",
      qrLevel: "M",
      opacity: 100,
      cornerRadius: 0,
      blendMode: "normal",
    };

    if (parentId) {
      // Add to nested frame
      setFrames(prevFrames => prevFrames.map(f => 
        f.id === parentId
          ? {
              ...f,
              frames: (f.frames || []).map(nf => 
                nf.id === targetFrameId
                  ? { ...nf, elements: [...(nf.elements || []), newElement] }
                  : nf
              )
            }
          : f
      ));
    } else {
      // Add to top-level frame
      setFrames(prevFrames => prevFrames.map(f => {
        if (f.id === targetFrameId) {
          return { ...f, elements: [...(f.elements || []), newElement] };
        }
        return f;
      }));
    }
    
    setSelectedElementIds([newElement.id]);
    setShowShapeSettings(true);
    setActiveTool("select");
    toast.success("QR Code added");
  };

  const handleIconSelect = (iconName: string, iconFamily: string) => {
    const targetFrameId = selectedFrameId || frames[0]?.id;
    if (!targetFrameId) {
      toast.error("Please add a frame first");
      return;
    }
    
    const { frame, parentId } = findFrame(targetFrameId);
    if (!frame) return;

    const defaultSize = 80;
    const x = Math.max(0, Math.floor((frame.width - defaultSize) / 2));
    const y = Math.max(0, Math.floor((frame.height - defaultSize) / 2));

    const newElement: Element = {
      id: `element-${Date.now()}`,
      type: "icon",
      x,
      y,
      width: defaultSize,
      height: defaultSize,
      shapeType: "icon" as any,
      iconName,
      iconFamily,
      iconStrokeWidth: 2,
      fill: penColor,
      stroke: "transparent",
      strokeWidth: 0,
      opacity: 100,
      cornerRadius: 0,
      blendMode: "normal",
    };

    if (parentId) {
      // Add to nested frame
      setFrames(prevFrames => prevFrames.map(f => 
        f.id === parentId
          ? {
              ...f,
              frames: (f.frames || []).map(nf => 
                nf.id === targetFrameId
                  ? { ...nf, elements: [...(nf.elements || []), newElement] }
                  : nf
              )
            }
          : f
      ));
    } else {
      // Add to top-level frame
      setFrames(prevFrames => prevFrames.map(f => {
        if (f.id === targetFrameId) {
          return { ...f, elements: [...(f.elements || []), newElement] };
        }
        return f;
      }));
    }
    
    setSelectedElementIds([newElement.id]);
    setShowShapeSettings(true);
    setActiveTool("select");
    toast.success(`${iconName} icon added!`);
  };

  const handleShaderSelect = (shaderConfig: any) => {
    const targetFrameId = selectedFrameId || frames[0]?.id;
    if (!targetFrameId) {
      toast.error("Please add a frame first");
      return;
    }

    const defaultWidth = 400;
    const defaultHeight = 400;
    const frame = frames.find(f => f.id === targetFrameId);
    if (!frame) return;

    const x = Math.max(0, Math.floor((frame.width - defaultWidth) / 2));
    const y = Math.max(0, Math.floor((frame.height - defaultHeight) / 2));

    const newElement: Element = {
      id: `element-${Date.now()}`,
      type: "shader",
      x,
      y,
      width: defaultWidth,
      height: defaultHeight,
      shader: {
        type: shaderConfig.type,
        speed: shaderConfig.defaultProps.speed,
        glowIntensity: shaderConfig.defaultProps.glowIntensity,
        colorTint: shaderConfig.defaultProps.colorTint
      },
      opacity: 100,
      cornerRadius: 0,
      blendMode: "normal",
    };

    setFrames(prevFrames => prevFrames.map(f => {
      if (f.id === targetFrameId) {
        return { ...f, elements: [...(f.elements || []), newElement] };
      }
      return f;
    }));
    setSelectedElementIds([newElement.id]);
    setShowShapeSettings(true);
    setActiveTool("select");
    toast.success(`${shaderConfig.name} shader added!`);
  };

  const handleLineAdd = () => {
    const targetFrameId = selectedFrameId || frames[0]?.id;
    if (!targetFrameId) {
      toast.error("Please add a frame first");
      return;
    }
    
    const { frame, parentId } = findFrame(targetFrameId);
    if (!frame) return;

    const defaultWidth = 300;
    const defaultHeight = 100;
    const x = Math.max(0, Math.floor((frame.width - defaultWidth) / 2));
    const y = Math.max(0, Math.floor((frame.height - defaultHeight) / 2));

    const newElement: Element = {
      id: `element-${Date.now()}`,
      type: "shape",
      shapeType: "line",
      x,
      y,
      width: defaultWidth,
      height: defaultHeight,
      stroke: penColor,
      strokeWidth: 3,
      strokeOpacity: 100,
      lineStyle: "solid",
      lineCap: "round",
      lineJoin: "round",
      controlPoints: [
        { x: 0, y: defaultHeight / 2 },
        { x: defaultWidth, y: defaultHeight / 2 }
      ],
      opacity: 100,
      fill: "transparent",
      fillOpacity: 0,
    };

    if (parentId) {
      // Add to nested frame
      setFrames(prevFrames => prevFrames.map(f => 
        f.id === parentId
          ? {
              ...f,
              frames: (f.frames || []).map(nf => 
                nf.id === targetFrameId
                  ? { ...nf, elements: [...(nf.elements || []), newElement] }
                  : nf
              )
            }
          : f
      ));
    } else {
      // Add to top-level frame
      setFrames(prevFrames => prevFrames.map(f => {
        if (f.id === targetFrameId) {
          return { ...f, elements: [...(f.elements || []), newElement] };
        }
        return f;
      }));
    }
    
    setSelectedElementIds([newElement.id]);
    setShowShapeSettings(true);
    setActiveTool("select");
    toast.success(`Line added! Drag control points to bend it`);
  };

  const handleElementUpdate = (elementId: string, updates: Partial<Element>) => {
    setFrames(frames.map(f => {
      if (f.id === selectedFrameId) {
        return {
          ...f,
          elements: (f.elements || []).map(e => 
            e.id === elementId ? { ...e, ...updates } : e
          ),
        };
      }
      return f;
    }));
  };

  const handleAnimationSelect = (config: { animation: AnimationType; duration: string; delay: string; easing: string; iterationCount: string; category: "in" | "out" | "custom" }) => {
    // Use animatingElementId if set, otherwise use selectedElementIds
    const targetIds = animatingElementId ? [animatingElementId] : selectedElementIds;
    
    if (targetIds.length === 0) {
      toast.error("Please select an element to animate");
      return;
    }
    
    // Apply animation to all target elements
    targetIds.forEach(elementId => {
      handleElementUpdate(elementId, {
        animation: config.animation,
        animationDuration: config.duration,
        animationDelay: config.delay,
        animationTimingFunction: config.easing,
        animationIterationCount: config.iterationCount,
        animationCategory: config.category,
      });
    });
    
    toast.success(`Animation ${config.animation !== 'none' ? 'applied' : 'removed'}!`);
    // Keep panel open like other sidebar panels
  };

  const handleAddText = () => {
    if (!selectedFrameId) return;
    
    const newElement: Element = {
      id: `element-${Date.now()}`,
      type: "text",
      x: 50,
      y: 50,
      width: 200,
      height: 50,
      text: "Double click to edit",
      fill: penColor,
      fontSize: 16,
      fontFamily: "Inter",
      fontWeight: "400",
      textAlign: "center",
      color: penColor,
      opacity: 100,
      blendMode: "normal",
    };

    const { parentId } = findFrame(selectedFrameId);
    
    if (parentId) {
      // Add to nested frame
      setFrames(frames.map(f => 
        f.id === parentId
          ? {
              ...f,
              frames: (f.frames || []).map(nf => 
                nf.id === selectedFrameId 
                  ? { ...nf, elements: [...(nf.elements || []), newElement] }
                  : nf
              )
            }
          : f
      ));
    } else {
      // Add to top-level frame
      setFrames(frames.map(f => {
        if (f.id === selectedFrameId) {
          return { ...f, elements: [...(f.elements || []), newElement] };
        }
        return f;
      }));
    }
    
    setSelectedElementIds([newElement.id]);
    setShowShapeSettings(true);
    setActiveTool("select");
    toast.success("Text added!");
  };

  const handleAddRichText = () => {
    if (!selectedFrameId) return;
    const newElement: Element = {
      id: `element-${Date.now()}`,
      type: "richtext" as any,
      x: 60,
      y: 60,
      width: 400,
      height: 500,
      fontSize: 16,
      fontFamily: "Inter",
      fontWeight: "400",
      textAlign: "left",
      color: "#000000",
      fill: "#ffffff",
      fillType: "solid",
      opacity: 100,
      blendMode: "normal",
      richTextBlocks: [
        { id: "1", type: "h2", content: "Heading 2" },
        { id: "2", type: "h3", content: "Heading 3" },
        { id: "3", type: "h4", content: "Heading 4" },
        { id: "4", type: "h5", content: "Heading 5" },
        { id: "5", type: "h6", content: "Heading 6" },
        { id: "6", type: "p", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur." },
        { id: "7", type: "blockquote", content: "Block quote" },
        { id: "8", type: "ol", content: "Ordered list" },
        { id: "9", type: "ol", content: "Item 1" },
        { id: "10", type: "ol", content: "Item 2" },
        { id: "11", type: "ol", content: "Item 3" },
        { id: "12", type: "ul", content: "Unordered list" },
        { id: "13", type: "ul", content: "Item A" },
        { id: "14", type: "ul", content: "Item B" },
        { id: "15", type: "ul", content: "Item C" },
        { id: "16", type: "p", content: "Bold text", styles: { bold: true } },
        { id: "17", type: "p", content: "Emphasis", styles: { italic: true } },
      ]
    };
    setFrames(frames.map(f => {
      if (f.id === selectedFrameId) {
        return { ...f, elements: [...(f.elements || []), newElement] };
      }
      return f;
    }));
    setSelectedElementIds([newElement.id]);
    setShowShapeSettings(true);
    setActiveTool("select");
    toast.success("Rich text added!");
  };

  const handleElementSelect = (elementId: string, multiSelect = false) => {
    if (multiSelect) {
      if (selectedElementIds.includes(elementId)) {
        setSelectedElementIds(selectedElementIds.filter(id => id !== elementId));
      } else {
        setSelectedElementIds([...selectedElementIds, elementId]);
      }
    } else {
      setSelectedElementIds([elementId]);
    }
    setShowShapeSettings(true);
  };

  const handleElementReorder = (frameId: string, fromIndex: number, toIndex: number) => {
    setFrames(frames.map(f => {
      if (f.id === frameId && f.elements) {
        const newElements = [...f.elements];
        const [movedElement] = newElements.splice(fromIndex, 1);
        newElements.splice(toIndex, 0, movedElement);
        return { ...f, elements: newElements };
      }
      return f;
    }));
    toast.success("Layer reordered");
  };

  const handleFrameReorder = (sourceFrameId: string, targetFrameId: string, position: 'before' | 'after' | 'inside') => {
    const findAndRemoveFrame = (frames: Frame[]): { frames: Frame[], removedFrame: Frame | null } => {
      for (let i = 0; i < frames.length; i++) {
        if (frames[i].id === sourceFrameId) {
          const [removed] = frames.splice(i, 1);
          return { frames, removedFrame: removed };
        }
        if (frames[i].frames && frames[i].frames!.length > 0) {
          const result = findAndRemoveFrame(frames[i].frames!);
          if (result.removedFrame) {
            frames[i] = { ...frames[i], frames: result.frames };
            return { frames, removedFrame: result.removedFrame };
          }
        }
      }
      return { frames, removedFrame: null };
    };

    const insertFrame = (frames: Frame[], frame: Frame): Frame[] => {
      for (let i = 0; i < frames.length; i++) {
        if (frames[i].id === targetFrameId) {
          if (position === 'before') {
            frames.splice(i, 0, frame);
            return frames;
          } else if (position === 'after') {
            frames.splice(i + 1, 0, frame);
            return frames;
          } else if (position === 'inside') {
            frames[i] = {
              ...frames[i],
              frames: [...(frames[i].frames || []), frame]
            };
            return frames;
          }
        }
        if (frames[i].frames && frames[i].frames!.length > 0) {
          const updated = insertFrame(frames[i].frames!, frame);
          if (updated !== frames[i].frames) {
            frames[i] = { ...frames[i], frames: updated };
            return frames;
          }
        }
      }
      return frames;
    };

    const newFrames = [...frames];
    const { frames: framesWithoutSource, removedFrame } = findAndRemoveFrame(newFrames);
    
    if (removedFrame) {
      const finalFrames = insertFrame(framesWithoutSource, removedFrame);
      setFrames(finalFrames);
      toast.success("Frame moved");
    }
  };

  const handleElementsDelete = () => {
    if (selectedElementIds.length === 0) return;
    
    setFrames(frames.map(f => ({
      ...f,
      elements: (f.elements || []).filter(e => !selectedElementIds.includes(e.id))
    })));
    setSelectedElementIds([]);
    setShowShapeSettings(false);
    toast.success(`Deleted ${selectedElementIds.length} item(s)`);
  };

  const handleElementDelete = (elementId: string) => {
    setFrames(frames.map(f => ({
      ...f,
      elements: (f.elements || []).filter(e => e.id !== elementId)
    })));
    setSelectedElementIds(selectedElementIds.filter(id => id !== elementId));
    toast.success("Element deleted");
  };

  const handleElementDuplicate = (elementId: string) => {
    const element = selectedFrame?.elements?.find(e => e.id === elementId);
    if (!element) return;

    const newElement = { ...element, id: `element-${Date.now()}`, x: element.x + 20, y: element.y + 20 };
    setFrames(frames.map(f => {
      if (f.id === selectedFrameId) {
        return { ...f, elements: [...(f.elements || []), newElement] };
      }
      return f;
    }));
    toast.success("Element duplicated!");
  };

  const handleMakeEditable = async (elementId: string) => {
    const element = selectedFrame?.elements?.find(e => e.id === elementId);
    if (!element || element.type !== "image" || !element.imageUrl) {
      toast.error("Can only make image elements editable");
      return;
    }

    toast.info("Separating objects into layers...");
    
    try {
      const layers = await segmentImageToLayers(element.imageUrl, { 
        maxObjects: 6, 
        minAreaRatio: 0.008,
        preferredLabels: ["person", "car", "bus", "truck", "bicycle", "motorcycle", "dog", "cat", "bird"]
      });
      
      if (!layers.length) {
        toast.error("No distinct objects detected");
        return;
      }

      const newImageElements: Element[] = layers.map((layer) => {
        const scaleX = (element.width || layer.sourceWidth) / layer.sourceWidth;
        const scaleY = (element.height || layer.sourceHeight) / layer.sourceHeight;
        return {
          id: `element-${Date.now()}-${Math.random()}`,
          type: "image",
          name: layer.label ? layer.label.charAt(0).toUpperCase() + layer.label.slice(1) : "Object",
          imageUrl: layer.dataUrl,
          x: element.x + layer.bbox.x * scaleX,
          y: element.y + layer.bbox.y * scaleY,
          width: layer.bbox.width * scaleX,
          height: layer.bbox.height * scaleY,
          opacity: 100,
          imageFit: "contain",
        } as Element;
      });

      setFrames(frames.map(f => {
        if (f.id === selectedFrameId) {
          return {
            ...f,
            elements: [
              ...(f.elements || []).filter(e => e.id !== elementId),
              ...newImageElements,
            ],
          };
        }
        return f;
      }));

      toast.success(`Separated into ${newImageElements.length} movable layers`);
    } catch (error) {
      console.error("Error making image editable:", error);
      toast.error("Failed to process image");
    }
  };

  const handleWrapInFrame = () => {
    if (selectedElementIds.length === 0) return;
    
    const elements = selectedFrame?.elements?.filter(e => selectedElementIds.includes(e.id)) || [];
    if (elements.length === 0) return;

    // Calculate bounds
    const minX = Math.min(...elements.map(e => e.x));
    const minY = Math.min(...elements.map(e => e.y));
    const maxX = Math.max(...elements.map(e => e.x + e.width));
    const maxY = Math.max(...elements.map(e => e.y + e.height));

    const newFrame: Frame = {
      id: `frame-${Date.now()}-wrapped`,
      name: `Frame ${frames.length + 1}`,
      x: (selectedFrame?.x || 0) + minX - 20,
      y: (selectedFrame?.y || 0) + minY - 20,
      width: maxX - minX + 40,
      height: maxY - minY + 40,
      initialWidth: maxX - minX + 40,
      initialHeight: maxY - minY + 40,
      enableDynamicScale: false,
      backgroundColor: "transparent",
      image: null,
      topCaption: "",
      bottomCaption: "",
      textColor: "#ffffff",
      textAlign: "center",
      textSize: 3,
      textOpacity: 100,
      imageStyle: "cover",
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      linkText: "",
      linkPosition: "top-right",
      gradientIntensity: 80,
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      gap: 0,
      elements: elements.map(e => ({ ...e, x: e.x - minX + 20, y: e.y - minY + 20 })),
      cornerRadius: 0,
      opacity: 100,
      blendMode: "normal",
    };

    // Remove selected elements from current frame and add nested frame as child
    setFrames(frames.map(f => {
      if (f.id === selectedFrameId) {
        const remaining = (f.elements || []).filter(e => !selectedElementIds.includes(e.id));
        return {
          ...f,
          elements: remaining,
          frames: [...(f.frames || []), newFrame]
        };
      }
      return f;
    }));
    
    // Keep current frame selected so users can continue editing context
    setSelectedElementIds([]);
    toast.success("Wrapped into nested frame!");
  };

  const handleFitToFrame = (elementId: string) => {
    const element = selectedFrame?.elements?.find(e => e.id === elementId);
    if (!element || !selectedFrame) return;

    setFrames(frames.map(f => {
      if (f.id === selectedFrameId) {
        return {
          ...f,
          elements: (f.elements || []).map(e => 
            e.id === elementId 
              ? { ...e, x: 0, y: 0, width: selectedFrame.width, height: selectedFrame.height }
              : e
          ),
        };
      }
      return f;
    }));
    
    toast.success("Element fitted to frame!");
  };

  const handleFitWidth = (elementId: string) => {
    const element = selectedFrame?.elements?.find(e => e.id === elementId);
    if (!element || !selectedFrame) return;

    setFrames(frames.map(f => {
      if (f.id === selectedFrameId) {
        return {
          ...f,
          elements: (f.elements || []).map(e => 
            e.id === elementId 
              ? { ...e, x: 0, width: selectedFrame.width }
              : e
          ),
        };
      }
      return f;
    }));
    
    toast.success("Element width fitted to frame!");
  };

  const handleFitHeight = (elementId: string) => {
    const element = selectedFrame?.elements?.find(e => e.id === elementId);
    if (!element || !selectedFrame) return;

    setFrames(frames.map(f => {
      if (f.id === selectedFrameId) {
        return {
          ...f,
          elements: (f.elements || []).map(e => 
            e.id === elementId 
              ? { ...e, y: 0, height: selectedFrame.height }
              : e
          ),
        };
      }
      return f;
    }));
    
    toast.success("Element height fitted to frame!");
  };

  const handleRemoveBackground = async (elementId: string) => {
    const element = selectedFrame?.elements?.find(e => e.id === elementId);
    if (!element || element.type !== "image" || !element.imageUrl) {
      toast.error("Can only remove background from image elements");
      return;
    }

    const toastId = toast.loading("Removing background...");
    
    try {
      const { data, error } = await supabase.functions.invoke('remove-background', {
        body: { imageUrl: element.imageUrl }
      });

      if (error) throw error;
      if (!data?.image) throw new Error('No image returned from API');

      setFrames(frames.map(f => {
        if (f.id === selectedFrameId) {
          return {
            ...f,
            elements: (f.elements || []).map(e => 
              e.id === elementId 
                ? { ...e, imageUrl: data.image }
                : e
            ),
          };
        }
        return f;
      }));

      toast.success("Background removed!", { id: toastId });
    } catch (error) {
      console.error("Error removing background:", error);
      toast.error("Failed to remove background", { id: toastId });
    }
  };

  const handleProjectNameChange = (newName: string) => {
    setProjectTitle(newName);
    // Trigger save after title change
    setTimeout(() => forceSave(), 100);
  };

  // Main canvas container component
  return (
    <div className="w-full h-screen relative flex flex-col">
      <CanvasBackground />

      <EditorTopBar
        projectName={projectTitle}
        onProjectNameChange={handleProjectNameChange}
        onSave={forceSave}
        onDownload={downloadPoster}
        onExport={() => setShowExportDialog(true)}
        onExportAll={() => setShowExportAllDialog(true)}
        onShare={() => setShowShareDialog(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        isSaving={isSaving}
        projectId={projectId}
        isPanMode={isPanning}
        onTogglePanMode={() => setIsPanning(!isPanning)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
        gridStyle={gridStyle}
        onGridStyleChange={setGridStyle}
        snapToGrid={snapToGrid}
        onSnapToGridChange={setSnapToGrid}
        isGenerating={isGenerating}
        generationProgress={generationProgressPercent}
        generationMessage={generationProgress}
        activeUsers={activeUsers}
        currentUser={currentUser}
        enableCollaboration={enableCollaboration}
        onRecenter={() => selectedFrameId && fitFrameToView(selectedFrameId)}
      />

      {/* Canvas Area */}
      <div 
        ref={canvasAreaRef}
        className="flex-1 relative overflow-hidden touch-none overscroll-none select-none"
        onMouseDown={(e) => {
          if (isPanning && e.button === 0 && activeTool !== 'pen') {
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
          }
        }}
        onMouseMove={(e) => {
          if (isPanning && e.buttons === 1 && activeTool !== 'pen') {
            setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
          }
          
          // Broadcast cursor position for collaboration
          if (enableCollaboration) {
            const rect = canvasAreaRef.current?.getBoundingClientRect();
            if (rect) {
              // Transform screen coordinates to canvas coordinates
              const x = (e.clientX - rect.left - panOffset.x) / zoom;
              const y = (e.clientY - rect.top - panOffset.y) / zoom;
              broadcastCursor(x, y);
            }
          }
        }}
        onMouseUp={() => {
          // Ensure panning stops when mouse is released
          if (isPanning && activeTool !== 'pen') {
            // Don't disable pan mode, just stop the drag
          }
        }}
        onWheel={(e) => {
          // Always prevent default to stop browser zoom
          e.preventDefault();
          e.stopPropagation();
          
          if (e.ctrlKey || e.metaKey) {
            // Zoom with Ctrl/Cmd + scroll
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newZoom = Math.max(0.1, Math.min(5, zoom + delta));
            setZoom(newZoom);
          } else if (e.shiftKey) {
            // Horizontal scroll with Shift + scroll
            setPanOffset((prev) => ({ 
              x: prev.x - e.deltaY, 
              y: prev.y 
            }));
          } else {
            // Vertical scroll (default)
            setPanOffset((prev) => ({ 
              x: prev.x, 
              y: prev.y - e.deltaY 
            }));
          }
        }}
      >
        {/* Large canvas workspace to prevent vanishing when scrolled */}
        <div 
          className="absolute inset-0"
          style={{
            transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            cursor: isPanning && activeTool !== 'pen' ? 'grab' : activeTool === 'pen' ? 'crosshair' : 'default',
            minWidth: '100vw',
            minHeight: '100vh',
            width: '400vw',
            height: '400vh',
            left: '0',
            top: '0'
          }}
        >
        {frames.map((frame) => (
          <div key={frame.id}>
            <FrameBadge
              name={frame.name}
              x={frame.x}
              y={frame.y}
              onChange={(name) => handleFrameUpdate(frame.id, { name })}
              onPositionChange={(newX, newY) => handleFrameUpdate(frame.id, { x: newX, y: newY })}
              onSelect={() => setSelectedFrameId(frame.id)}
              onDuplicate={() => {
                if (frame.id === selectedFrameId) {
                  handleDuplicate();
                }
              }}
              onDelete={() => {
                if (frame.id === selectedFrameId) {
                  handleDelete();
                }
              }}
            />
            <CanvasContextMenu
              onDelete={() => frame.id === selectedFrameId && handleDelete()}
              onDuplicate={() => frame.id === selectedFrameId && handleDuplicate()}
              onAddNestedFrame={() => {
                if (frame.id === selectedFrameId) {
                  handleAddNestedFrame();
                }
              }}
              onBringToFront={() => handleArrange('toFront', [], frame.id)}
              onSendToBack={() => handleArrange('toBack', [], frame.id)}
              onBringForward={() => handleArrange('forward', [], frame.id)}
              onSendBackward={() => handleArrange('backward', [], frame.id)}
              onEditFill={() => {
                if (frame.id === selectedFrameId) {
                  setShowShapeSettings(true);
                }
              }}
            >
                <ResizableFrame
                id={frame.id}
                name={frame.name}
                x={frame.x}
                y={frame.y}
                opacity={frame.opacity}
                blendMode={frame.blendMode}
                width={frame.width}
                height={frame.height}
                backgroundColor={frame.backgroundColor}
                backgroundType={frame.backgroundType}
                backgroundImage={frame.backgroundImage}
                backgroundImageFit={frame.backgroundImageFit}
                gradientType={frame.gradientType}
                gradientAngle={frame.gradientAngle}
                gradientStops={frame.gradientStops}
                patternFrameId={frame.patternFrameId}
                videoUrl={frame.videoUrl}
                image={frame.image}
                topCaption={frame.topCaption}
                bottomCaption={frame.bottomCaption}
                textColor={frame.textColor}
                textAlign={frame.textAlign}
                textSize={frame.textSize}
                textOpacity={frame.textOpacity}
                imageStyle={frame.imageStyle}
                filterStyle={frame.id === selectedFrameId ? getFilterStyle() : {}}
                linkText={frame.linkText}
                linkPosition={frame.linkPosition}
                gradientIntensity={frame.gradientIntensity}
                cornerRadius={frame.cornerRadius || 0}
                fillOpacity={frame.fillOpacity || 100}
                flexDirection={frame.flexDirection}
                justifyContent={frame.justifyContent}
                alignItems={frame.alignItems}
                gap={frame.gap}
                initialWidth={frame.initialWidth}
                initialHeight={frame.initialHeight}
                enableDynamicScale={frame.enableDynamicScale}
                isSelected={frame.id === selectedFrameId && selectedElementIds.length === 0}
                isLocked={frame.isLocked}
                showGrid={showGrid}
                gridSize={gridSize}
                gridStyle={gridStyle}
                snapToGrid={snapToGrid}
                zoom={zoom}
                panOffset={panOffset}
                onUpdate={handleFrameUpdate}
                onSelect={() => {
                  setSelectedFrameId(frame.id);
                  setSelectedElementIds([]);
                  setShowShapeSettings(true);
                }}
              >
                {/* Elements inside frame */}
                {(frame.elements || []).map((element) => {
                  console.log("🔷 Rendering element:", element.id, "type:", element.type, "shapeType:", element.shapeType);
                  return (
                   <CanvasContextMenu
                     key={element.id}
                     onDelete={() => handleElementDelete(element.id)}
                     onDuplicate={() => handleElementDuplicate(element.id)}
                     onWrapInFrame={selectedElementIds.length > 0 ? handleWrapInFrame : undefined}
                     onBringToFront={() => handleArrange('toFront', [element.id], frame.id)}
                     onSendToBack={() => handleArrange('toBack', [element.id], frame.id)}
                     onBringForward={() => handleArrange('forward', [element.id], frame.id)}
                     onSendBackward={() => handleArrange('backward', [element.id], frame.id)}
                     onMakeEditable={element.type === "image" ? () => handleMakeEditable(element.id) : undefined}
                     onFitToFrame={() => handleFitToFrame(element.id)}
                     onFitWidth={() => handleFitWidth(element.id)}
                     onFitHeight={() => handleFitHeight(element.id)}
                     onRemoveBackground={element.type === "image" ? () => handleRemoveBackground(element.id) : undefined}
                     onEditFill={() => {
                       setSelectedElementIds([element.id]);
                       setShowShapeSettings(true);
                     }}
                     onEditStroke={() => {
                       setSelectedElementIds([element.id]);
                       setShowShapeSettings(true);
                     }}
                     onEditAnimations={() => {
                       setAnimatingElementId(element.id);
                       setShowAnimationsPanel(true);
                     }}
                    >
                        <ResizableElement
                         id={element.id}
                          type={element.type === "drawing" ? "shape" : element.type === "icon" ? "shape" : element.type === "shader" ? "shader" : element.type === "video" ? "video" : element.type}
                         x={element.x}
                         y={element.y}
                         width={element.width}
                         height={element.height}
                        sizeUnit={element.sizeUnit}
                        frameWidth={frame.width}
                        frameHeight={frame.height}
                        src={element.imageUrl}
                        text={element.text}
                        shapeType={element.shapeType}
                        fill={element.fill}
                        stroke={element.stroke}
                        pathData={element.pathData}
                        strokeWidth={element.strokeWidth}
                        strokeOpacity={element.strokeOpacity}
                        strokePosition={element.strokePosition}
                        fillOpacity={element.fillOpacity}
                        opacity={element.opacity}
                        blendMode={element.blendMode}
                        cornerRadius={element.cornerRadius}
                        brightness={element.brightness}
                        contrast={element.contrast}
                        saturation={element.saturation}
                        blur={element.blur}
                        imageFit={element.imageFit}
                        fontSize={element.fontSize}
                        fontFamily={element.fontFamily}
                        fontWeight={element.fontWeight}
                        textAlign={element.textAlign}
                        color={element.color}
                        fillType={element.fillType}
                        fillImage={element.fillImage}
                        fillImageFit={element.fillImageFit}
                        gradientType={element.gradientType}
                        gradientAngle={element.gradientAngle}
                        gradientStops={element.gradientStops}
                        patternFrameId={element.patternFrameId}
                         videoUrl={element.videoUrl}
                         iconName={element.iconName}
                         iconFamily={element.iconFamily}
                         iconStrokeWidth={element.iconStrokeWidth}
                         shader={element.shader}
                        lineStyle={element.lineStyle}
                        lineCap={element.lineCap}
                        lineJoin={element.lineJoin}
                        dashArray={element.dashArray}
                        controlPoints={element.controlPoints}
                         rotation={element.rotation}
                         animations={element.animations}
                         useFlexLayout={false}
                        isLocked={element.isLocked}
                        isSelected={selectedElementIds.includes(element.id)}
                        zoom={zoom}
                        currentTime={currentTime}
                         isPlaying={isPlayingAnimation}
                         onUpdate={handleElementUpdate}
                         onSelect={(e) => handleElementSelect(element.id, e?.shiftKey || e?.ctrlKey || e?.metaKey)}
                         onDelete={() => handleElementDelete(element.id)}
                         onDuplicate={() => handleElementDuplicate(element.id)}
                          globalAnimationTrigger={animationGlobalKey as any}
                          snapToGrid={snapToGrid}
                          gridSize={gridSize}
                          qrValue={element.qrValue}
                          qrFgColor={element.qrFgColor}
                          qrBgColor={element.qrBgColor}
                          qrLevel={element.qrLevel}
                          interactivity={element.interactivity}
                          readOnly={readOnly}
                          onElementInteraction={() => onElementInteraction?.(element)}
                          onVideoRefUpdate={element.type === "video" ? (ref) => videoRefsMap.current.set(frame.id, ref) : undefined}
                       />
                    </CanvasContextMenu>
                )})}
                
                {/* Nested frames inside parent frame */}
                {(frame.frames || []).map((nestedFrame) => (
                  <CanvasContextMenu
                    key={nestedFrame.id}
                    onDelete={() => {
                      setFrames(frames.map(f => 
                        f.id === frame.id 
                          ? { ...f, frames: (f.frames || []).filter(nf => nf.id !== nestedFrame.id) }
                          : f
                      ));
                      if (selectedFrameId === nestedFrame.id) {
                        setSelectedFrameId(frame.id);
                      }
                      toast.success("Nested frame deleted");
                    }}
                    onDuplicate={() => {
                      const duplicated = { ...nestedFrame, id: crypto.randomUUID(), x: nestedFrame.x + 20, y: nestedFrame.y + 20 };
                      setFrames(frames.map(f => 
                        f.id === frame.id 
                          ? { ...f, frames: [...(f.frames || []), duplicated] }
                          : f
                      ));
                      toast.success("Nested frame duplicated");
                    }}
                    onBringToFront={() => handleArrange('toFront', [], frame.id)}
                    onSendToBack={() => handleArrange('toBack', [], frame.id)}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: nestedFrame.x,
                        top: nestedFrame.y,
                        width: nestedFrame.width,
                        height: nestedFrame.height,
                        outline: nestedFrame.id === selectedFrameId && selectedElementIds.length === 0 
                          ? '2px solid hsl(var(--primary))' 
                          : 'none',
                        outlineOffset: '2px',
                      }}
                    >
                      <ResizableFrame
                        id={nestedFrame.id}
                        name={nestedFrame.name}
                        x={0}
                        y={0}
                        width={nestedFrame.width}
                        height={nestedFrame.height}
                        backgroundColor={nestedFrame.backgroundColor}
                        backgroundType={nestedFrame.backgroundType}
                        backgroundImage={nestedFrame.backgroundImage}
                        backgroundImageFit={nestedFrame.backgroundImageFit}
                        gradientType={nestedFrame.gradientType}
                        gradientAngle={nestedFrame.gradientAngle}
                        gradientStops={nestedFrame.gradientStops}
                        image={nestedFrame.image}
                        topCaption={nestedFrame.topCaption || ""}
                        bottomCaption={nestedFrame.bottomCaption || ""}
                        textColor={nestedFrame.textColor || "#000000"}
                        textAlign={nestedFrame.textAlign || "center"}
                        textSize={nestedFrame.textSize || 2}
                        textOpacity={nestedFrame.textOpacity || 100}
                        imageStyle={nestedFrame.imageStyle || "cover"}
                        filterStyle={{}}
                        linkText={nestedFrame.linkText || ""}
                        linkPosition={nestedFrame.linkPosition || "top-right"}
                        gradientIntensity={nestedFrame.gradientIntensity || 80}
                        cornerRadius={nestedFrame.cornerRadius || 0}
                        fillOpacity={nestedFrame.fillOpacity || 100}
                        opacity={nestedFrame.opacity || 100}
                        blendMode={nestedFrame.blendMode || "normal"}
                        flexDirection={nestedFrame.flexDirection}
                        justifyContent={nestedFrame.justifyContent}
                        alignItems={nestedFrame.alignItems}
                        gap={nestedFrame.gap}
                        initialWidth={nestedFrame.initialWidth}
                        initialHeight={nestedFrame.initialHeight}
                        enableDynamicScale={nestedFrame.enableDynamicScale}
                        isSelected={nestedFrame.id === selectedFrameId && selectedElementIds.length === 0}
                        isLocked={nestedFrame.isLocked}
                        showGrid={showGrid}
                        gridSize={gridSize}
                        gridStyle={gridStyle}
                        snapToGrid={snapToGrid}
                        zoom={zoom}
                        panOffset={panOffset}
                        onUpdate={(id, updates) => {
                          setFrames(frames.map(f => 
                            f.id === frame.id 
                              ? { 
                                  ...f, 
                                  frames: (f.frames || []).map(nf => 
                                    nf.id === id ? { ...nf, ...updates } : nf
                                  )
                                }
                              : f
                          ));
                        }}
                        onSelect={() => {
                          console.log("🎯 Nested frame selected:", nestedFrame.id);
                          setSelectedFrameId(nestedFrame.id);
                          setSelectedElementIds([]);
                          setShowShapeSettings(true);
                          toast.success(`Selected nested frame: ${nestedFrame.name}`);
                        }}
                      >
                        {/* Elements inside nested frame */}
                        {(nestedFrame.elements || []).map((element) => (
                          <CanvasContextMenu
                            key={element.id}
                            onDelete={() => {
                              setFrames(frames.map(f => 
                                f.id === frame.id 
                                  ? {
                                      ...f,
                                      frames: (f.frames || []).map(nf =>
                                        nf.id === nestedFrame.id
                                          ? {
                                              ...nf,
                                              elements: (nf.elements || []).filter(el => el.id !== element.id)
                                            }
                                          : nf
                                      )
                                    }
                                  : f
                              ));
                              toast.success("Element deleted");
                            }}
                            onDuplicate={() => {
                              const duplicated = { ...element, id: crypto.randomUUID(), x: element.x + 20, y: element.y + 20 };
                              setFrames(frames.map(f => 
                                f.id === frame.id 
                                  ? {
                                      ...f,
                                      frames: (f.frames || []).map(nf =>
                                        nf.id === nestedFrame.id
                                          ? {
                                              ...nf,
                                              elements: [...(nf.elements || []), duplicated]
                                            }
                                          : nf
                                      )
                                    }
                                  : f
                              ));
                              toast.success("Element duplicated");
                            }}
                            onBringToFront={() => {
                              setFrames(frames.map(f => 
                                f.id === frame.id 
                                  ? {
                                      ...f,
                                      frames: (f.frames || []).map(nf =>
                                        nf.id === nestedFrame.id
                                          ? {
                                              ...nf,
                                              elements: (() => {
                                                const els = [...(nf.elements || [])];
                                                const idx = els.findIndex(e => e.id === element.id);
                                                if (idx !== -1) {
                                                  const [el] = els.splice(idx, 1);
                                                  els.push(el);
                                                }
                                                return els;
                                              })()
                                            }
                                          : nf
                                      )
                                    }
                                  : f
                              ));
                            }}
                            onSendToBack={() => {
                              setFrames(frames.map(f => 
                                f.id === frame.id 
                                  ? {
                                      ...f,
                                      frames: (f.frames || []).map(nf =>
                                        nf.id === nestedFrame.id
                                          ? {
                                              ...nf,
                                              elements: (() => {
                                                const els = [...(nf.elements || [])];
                                                const idx = els.findIndex(e => e.id === element.id);
                                                if (idx !== -1) {
                                                  const [el] = els.splice(idx, 1);
                                                  els.unshift(el);
                                                }
                                                return els;
                                              })()
                                            }
                                          : nf
                                      )
                                    }
                                  : f
                              ));
                            }}
                            onEditFill={() => {
                              setSelectedFrameId(nestedFrame.id);
                              setSelectedElementIds([element.id]);
                              setShowShapeSettings(true);
                            }}
                          >
                            <ResizableElement
                              id={element.id}
                              type={element.type === "drawing" ? "shape" : element.type === "icon" ? "shape" : element.type === "shader" ? "shader" : element.type === "qrcode" ? "shape" : element.type === "video" ? "video" : element.type}
                              x={element.x}
                              y={element.y}
                              width={element.width}
                              height={element.height}
                              sizeUnit={element.sizeUnit}
                              frameWidth={nestedFrame.width}
                              frameHeight={nestedFrame.height}
                              src={element.imageUrl}
                              text={element.text}
                              shapeType={element.shapeType}
                              fill={element.fill}
                              stroke={element.stroke}
                              strokeWidth={element.strokeWidth}
                              strokeOpacity={element.strokeOpacity}
                              strokePosition={element.strokePosition}
                              fillOpacity={element.fillOpacity}
                              opacity={element.opacity}
                              blendMode={element.blendMode}
                              cornerRadius={element.cornerRadius}
                              brightness={element.brightness}
                              contrast={element.contrast}
                              saturation={element.saturation}
                              blur={element.blur}
                              imageFit={element.imageFit}
                              fontSize={element.fontSize}
                              fontFamily={element.fontFamily}
                              fontWeight={element.fontWeight}
                              textAlign={element.textAlign}
                              color={element.color}
                              fillType={element.fillType}
                              fillImage={element.fillImage}
                              fillImageFit={element.fillImageFit}
                              gradientType={element.gradientType}
                              gradientAngle={element.gradientAngle}
                              gradientStops={element.gradientStops}
                              patternFrameId={element.patternFrameId}
                              videoUrl={element.videoUrl}
                              iconName={element.iconName}
                              iconFamily={element.iconFamily}
                              iconStrokeWidth={element.iconStrokeWidth}
                              shader={element.shader}
                              lineStyle={element.lineStyle}
                              lineCap={element.lineCap}
                              lineJoin={element.lineJoin}
                              dashArray={element.dashArray}
                              controlPoints={element.controlPoints}
                              rotation={element.rotation}
                              animations={element.animations}
                              useFlexLayout={false}
                              isLocked={element.isLocked}
                              isSelected={selectedFrameId === nestedFrame.id && selectedElementIds.includes(element.id)}
                              zoom={zoom}
                              currentTime={currentTime}
                              isPlaying={isPlayingAnimation}
                              snapToGrid={snapToGrid}
                              gridSize={gridSize}
                              qrValue={element.qrValue}
                              qrFgColor={element.qrFgColor}
                              qrBgColor={element.qrBgColor}
                              qrLevel={element.qrLevel}
                              interactivity={element.interactivity}
                              readOnly={readOnly}
                              onUpdate={(id, updates) => {
                                setFrames(frames.map(f => 
                                  f.id === frame.id 
                                    ? {
                                        ...f,
                                        frames: (f.frames || []).map(nf =>
                                          nf.id === nestedFrame.id
                                            ? {
                                                ...nf,
                                                elements: (nf.elements || []).map(el =>
                                                  el.id === id ? { ...el, ...updates } : el
                                                )
                                              }
                                            : nf
                                        )
                                      }
                                    : f
                                ));
                              }}
                              onSelect={(e) => {
                                setSelectedFrameId(nestedFrame.id);
                                if (e?.shiftKey || e?.ctrlKey || e?.metaKey) {
                                  setSelectedElementIds(prev => 
                                    prev.includes(element.id) 
                                      ? prev.filter(id => id !== element.id)
                                      : [...prev, element.id]
                                  );
                                } else {
                                  setSelectedElementIds([element.id]);
                                }
                                setShowShapeSettings(true);
                              }}
                              onDelete={() => {
                                setFrames(frames.map(f => 
                                  f.id === frame.id 
                                    ? {
                                        ...f,
                                        frames: (f.frames || []).map(nf =>
                                          nf.id === nestedFrame.id
                                            ? {
                                                ...nf,
                                                elements: (nf.elements || []).filter(el => el.id !== element.id)
                                              }
                                            : nf
                                        )
                                      }
                                    : f
                                ));
                                toast.success("Element deleted");
                              }}
                              onDuplicate={() => {
                                const duplicated = { ...element, id: crypto.randomUUID(), x: element.x + 20, y: element.y + 20 };
                                setFrames(frames.map(f => 
                                  f.id === frame.id 
                                    ? {
                                        ...f,
                                        frames: (f.frames || []).map(nf =>
                                          nf.id === nestedFrame.id
                                            ? {
                                                ...nf,
                                                elements: [...(nf.elements || []), duplicated]
                                              }
                                            : nf
                                        )
                                      }
                                    : f
                                ));
                                toast.success("Element duplicated");
                              }}
                              globalAnimationTrigger={animationGlobalKey as any}
                              onElementInteraction={() => onElementInteraction?.(element)}
                              onVideoRefUpdate={element.type === "video" ? (ref) => videoRefsMap.current.set(nestedFrame.id, ref) : undefined}
                            />
                          </CanvasContextMenu>
                        ))}
                      </ResizableFrame>
                    </div>
                  </CanvasContextMenu>
                ))}
              </ResizableFrame>
            </CanvasContextMenu>
          </div>
        ))}
        
        {/* Video controls for frames with video elements */}
        {frames.map((frame) => {
          const hasVideo = (frame.elements || []).some(el => el.type === "video");
          const videoRef = videoRefsMap.current.get(frame.id);
          if (!hasVideo || !videoRef) return null;
          
          return (
            <FrameVideoControls
              key={`video-controls-${frame.id}`}
              videoRef={{ current: videoRef } as React.RefObject<HTMLVideoElement>}
              frameX={frame.x}
              frameY={frame.y}
              frameWidth={frame.width}
              frameHeight={frame.height}
              zoom={zoom}
            />
          );
        })}
        
        {/* Nested frame video controls */}
        {frames.map((frame) => 
          (frame.frames || []).map((nestedFrame) => {
            const hasVideo = (nestedFrame.elements || []).some(el => el.type === "video");
            const videoRef = videoRefsMap.current.get(nestedFrame.id);
            if (!hasVideo || !videoRef) return null;
            
            return (
              <FrameVideoControls
                key={`video-controls-${nestedFrame.id}`}
                videoRef={{ current: videoRef } as React.RefObject<HTMLVideoElement>}
                frameX={frame.x + nestedFrame.x}
                frameY={frame.y + nestedFrame.y}
                frameWidth={nestedFrame.width}
                frameHeight={nestedFrame.height}
                zoom={zoom}
              />
            );
          })
        )}
        
        {/* Pen drawing overlay inside transformed canvas */}
        {selectedFrame && (
          <DrawingLayer
            isActive={activeTool === "pen"}
            color={penColor}
            strokeWidth={strokeWidth}
            frameId={selectedFrameId}
            frameX={selectedFrame.x}
            frameY={selectedFrame.y}
            frameWidth={selectedFrame.width}
            frameHeight={selectedFrame.height}
            zoom={zoom}
            panOffsetX={panOffset.x}
            panOffsetY={panOffset.y}
            onPathComplete={(pathData, color, strokeW, bounds) => {
              if (!selectedFrameId) return;
              const newElement: Element = {
                id: `element-${Date.now()}`,
                type: "drawing",
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height,
                pathData,
                stroke: color,
                strokeWidth: strokeW,
                opacity: 100,
                blendMode: "normal",
              };
              setFrames(frames.map(f => f.id === selectedFrameId ? { ...f, elements: [...(f.elements || []), newElement] } : f));
              setSelectedElementIds([newElement.id]);
              setShowShapeSettings(true);
            }}
          />
        )}
      </div>
      </div>

      {/* AI Generation Panel */}
      {showGeneratePanel && (
        <AIGeneratorPanel
          projectId={projectId}
          currentSnapshot={createSnapshot(frames, projectTitle, zoom, panOffset, "#ffffff", voiceAudios)}
          frames={frames}
          selectedFrameId={selectedFrameId}
          onFrameSelect={setSelectedFrameId}
          description={description}
          setDescription={setDescription}
          captionImage={captionImage}
          setCaptionImage={setCaptionImage}
          isGenerating={isGenerating}
          generationProgress={generationProgress}
          captionImageInputRef={captionImageInputRef}
          onGenerate={generateWithAI}
          onRestoreConversation={(snapshot) => {
            setProjectTitle(snapshot.metadata.title);
            setFrames(snapshot.frames);
            setZoom(snapshot.canvas.zoom || 1);
            
            // Center the first frame in the viewport
            const firstFrame = snapshot.frames[0];
            if (firstFrame) {
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight;
              const centerX = (viewportWidth / 2) - (firstFrame.width / 2) - firstFrame.x;
              const centerY = (viewportHeight / 2) - (firstFrame.height / 2) - firstFrame.y;
              setPanOffset({ x: centerX, y: centerY });
            } else {
              setPanOffset(snapshot.canvas.panOffset);
            }
            
            // Select the first frame
            if (snapshot.frames[0]) {
              setSelectedFrameId(snapshot.frames[0].id);
            }
          }}
          onClose={() => {
            setShowGeneratePanel(false);
            setDescription("");
            setCaptionImage([]);
          }}
        />
      )}

      {/* Templates Panel */}
      {showTemplatesPanel && (
        <TemplatesPanel
          onRestoreTemplate={(snapshot) => {
            setProjectTitle(snapshot.metadata.title);
            setFrames(snapshot.frames);
            setZoom(snapshot.canvas.zoom || 1);
            
            // Center the first frame in the viewport
            const firstFrame = snapshot.frames[0];
            if (firstFrame) {
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight;
              const centerX = (viewportWidth / 2) - (firstFrame.width / 2) - firstFrame.x;
              const centerY = (viewportHeight / 2) - (firstFrame.height / 2) - firstFrame.y;
              setPanOffset({ x: centerX, y: centerY });
            } else {
              setPanOffset(snapshot.canvas.panOffset);
            }
            
            setShowTemplatesPanel(false);
            
            // Select the first frame
            if (snapshot.frames[0]) {
              setSelectedFrameId(snapshot.frames[0].id);
            }
          }}
          onClose={() => setShowTemplatesPanel(false)}
        />
      )}

      {/* Unified Shape Settings Panel */}
      {showShapeSettings && selectedElement?.type === "shader" && (
        <DraggablePanel
          title="Shader Settings"
          defaultPosition={{ x: window.innerWidth - 320, y: 100 }}
          onClose={() => setShowShapeSettings(false)}
        >
          <ShadcnShaderSettingsPanel
            element={selectedElement}
            onUpdate={(updates) => handleElementUpdate(selectedElement.id, updates)}
          />
        </DraggablePanel>
      )}

      {showShapeSettings && (selectedElement?.type !== "shader") && (selectedElement || selectedElementIds.length > 1 || (selectedElementIds.length === 0 && selectedFrame)) && (
        <ShapeSettingsPanel
          elementType={selectedElement?.type === "qrcode" ? "qrcode" : selectedElement ? selectedElement.type : "frame"}
          elementName={
            selectedElementIds.length > 1
              ? `${selectedElementIds.length} Elements`
              : selectedElement 
              ? selectedElement.type === "shape" && selectedElement.shapeType
                ? `Shape - ${selectedElement.shapeType.charAt(0).toUpperCase() + selectedElement.shapeType.slice(1)}`
                : selectedElement.type === "icon"
                  ? "Icon"
                  : selectedElement.text 
                    ? selectedElement.text.substring(0, 20)
                    : selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)
              : selectedFrame?.name
          }
          shapeType={selectedElement?.shapeType}
          iconName={selectedElement?.iconName}
          iconFamily={selectedElement?.iconFamily}
          iconStrokeWidth={selectedElement?.iconStrokeWidth}
          backgroundColor={selectedFrame?.backgroundColor}
          backgroundType={selectedFrame?.backgroundType}
          fillType={selectedElement?.fillType}
          fill={selectedElement?.fill || penColor}
          fillImage={selectedElement?.fillImage}
          fillImageFit={selectedElement?.fillImageFit}
          gradientType={selectedElement?.gradientType || selectedFrame?.gradientType}
          gradientAngle={selectedElement?.gradientAngle || selectedFrame?.gradientAngle}
          gradientStops={selectedElement?.gradientStops || selectedFrame?.gradientStops}
          patternFrameId={selectedElement?.patternFrameId}
          videoUrl={selectedElement?.videoUrl}
          stroke={selectedElement?.stroke || penColor}
          strokeWidth={selectedElement?.strokeWidth || strokeWidth}
          strokeWidthUnit={selectedElement?.strokeWidthUnit || "px"}
          strokeOpacity={selectedElement?.strokeOpacity || 100}
          strokePosition={selectedElement?.strokePosition || "center"}
          fillOpacity={selectedElement?.fillOpacity || selectedFrame?.fillOpacity || 100}
          width={selectedElement?.width || selectedFrame?.width}
          height={selectedElement?.height || selectedFrame?.height}
          sizeUnit={selectedElement?.sizeUnit || selectedFrame?.sizeUnit || "px"}
          x={selectedElement?.x}
          y={selectedElement?.y}
          rotation={selectedElement?.rotation || 0}
          opacity={selectedElement?.opacity || selectedFrame?.opacity || 100}
          cornerRadius={selectedElement?.cornerRadius || selectedFrame?.cornerRadius || 0}
          cornerRadiusUnit={selectedElement?.cornerRadiusUnit || selectedFrame?.cornerRadiusUnit || "px"}
          blendMode={selectedElement?.blendMode || selectedFrame?.blendMode || "normal"}
          isParentFrame={isEditingParentFrame}
          fontFamily={selectedElement?.fontFamily}
          fontWeight={selectedElement?.fontWeight}
          textAlign={selectedElement?.textAlign}
          fontSize={selectedElement?.fontSize}
          color={selectedElement?.color}
          imageFit={selectedElement?.imageFit}
          imageUrl={selectedElement?.imageUrl}
          brightness={selectedElement?.brightness}
          contrast={selectedElement?.contrast}
          saturation={selectedElement?.saturation}
          blur={selectedElement?.blur}
          onBackgroundColorChange={(color) => handleFrameUpdate(selectedFrameId, { backgroundColor: color })}
          onBackgroundTypeChange={(type) => handleFrameUpdate(selectedFrameId, { backgroundType: type })}
          onFillTypeChange={(type) => selectedElement && handleElementUpdate(selectedElement.id, { fillType: type })}
          onFillChange={(color) => {
            if (selectedElementIds.length > 0) {
              selectedElementIds.forEach(id => handleElementUpdate(id, { fill: color }));
            } else {
              setPenColor(color);
            }
          }}
          onStrokeChange={(color) => {
            if (selectedElementIds.length > 0) {
              selectedElementIds.forEach(id => handleElementUpdate(id, { stroke: color }));
            } else {
              setPenColor(color);
            }
          }}
          onStrokeWidthChange={(w) => {
            if (selectedElementIds.length > 0) {
              selectedElementIds.forEach(id => handleElementUpdate(id, { strokeWidth: w }));
            } else {
              setStrokeWidth(w);
            }
          }}
          onStrokeOpacityChange={(o) => {
            if (selectedElementIds.length > 0) {
              selectedElementIds.forEach(id => handleElementUpdate(id, { strokeOpacity: o }));
            }
          }}
          onStrokePositionChange={(pos) => {
            if (selectedElementIds.length > 0) {
              selectedElementIds.forEach(id => handleElementUpdate(id, { strokePosition: pos }));
            }
          }}
          onFillOpacityChange={(o) => {
            if (selectedElement) {
              handleElementUpdate(selectedElement.id, { fillOpacity: o });
            } else {
              handleFrameUpdate(selectedFrameId, { fillOpacity: o });
            }
          }}
          onWidthChange={(w) => {
            if (selectedElement) {
              handleElementUpdate(selectedElement.id, { width: w });
            } else {
              handleFrameUpdate(selectedFrameId, { width: w });
            }
          }}
          onHeightChange={(h) => {
            if (selectedElement) {
              handleElementUpdate(selectedElement.id, { height: h });
            } else {
              handleFrameUpdate(selectedFrameId, { height: h });
            }
          }}
          onXChange={(x) => selectedElement && handleElementUpdate(selectedElement.id, { x })}
          onYChange={(y) => selectedElement && handleElementUpdate(selectedElement.id, { y })}
          onRotationChange={(rotation) => selectedElement && handleElementUpdate(selectedElement.id, { rotation })}
          onOpacityChange={(o) => {
            if (selectedElement) {
              handleElementUpdate(selectedElement.id, { opacity: o });
            } else {
              handleFrameUpdate(selectedFrameId, { opacity: o });
            }
          }}
          onCornerRadiusChange={(r) => {
            if (selectedElement) {
              handleElementUpdate(selectedElement.id, { cornerRadius: r });
            } else {
              handleFrameUpdate(selectedFrameId, { cornerRadius: r });
            }
          }}
          onBlendModeChange={(m) => {
            if (selectedElement) {
              handleElementUpdate(selectedElement.id, { blendMode: m });
            } else {
              handleFrameUpdate(selectedFrameId, { blendMode: m });
            }
          }}
          onAlign={handleAlign}
          onArrange={handleArrange}
          onDistribute={handleDistribute}
          flexDirection={selectedFrame?.flexDirection}
          justifyContent={selectedFrame?.justifyContent}
          alignItems={selectedFrame?.alignItems}
          onFlexDirectionChange={(dir) => handleFrameUpdate(selectedFrameId, { flexDirection: dir })}
          onJustifyContentChange={(val) => handleFrameUpdate(selectedFrameId, { justifyContent: val })}
          onAlignItemsChange={(val) => handleFrameUpdate(selectedFrameId, { alignItems: val })}
          onGapChange={(val) => handleFrameUpdate(selectedFrameId, { gap: val })}
          gap={selectedFrame?.gap}
          onFontFamilyChange={(font) => selectedElement && handleElementUpdate(selectedElement.id, { fontFamily: font })}
          onFontWeightChange={(weight) => selectedElement && handleElementUpdate(selectedElement.id, { fontWeight: weight })}
          onTextAlignChange={(align) => selectedElement && handleElementUpdate(selectedElement.id, { textAlign: align })}
          onFontSizeChange={(size) => selectedElement && handleElementUpdate(selectedElement.id, { fontSize: size })}
          onColorChange={(color) => selectedElement && handleElementUpdate(selectedElement.id, { color })}
          onSizeUnitChange={(unit) => {
            if (selectedElement) {
              handleElementUpdate(selectedElement.id, { sizeUnit: unit });
            } else {
              handleFrameUpdate(selectedFrameId, { sizeUnit: unit });
            }
          }}
          onImageFitChange={(fit) => selectedElement && handleElementUpdate(selectedElement.id, { imageFit: fit })}
          onImageUrlChange={(url) => selectedElement && handleElementUpdate(selectedElement.id, { imageUrl: url })}
          onBrightnessChange={(val) => selectedElement && handleElementUpdate(selectedElement.id, { brightness: val })}
          onContrastChange={(val) => selectedElement && handleElementUpdate(selectedElement.id, { contrast: val })}
          onSaturationChange={(val) => selectedElement && handleElementUpdate(selectedElement.id, { saturation: val })}
          onBlurChange={(val) => selectedElement && handleElementUpdate(selectedElement.id, { blur: val })}
          onFillImageChange={(url) => selectedElement && handleElementUpdate(selectedElement.id, { fillImage: url })}
          onFillImageFitChange={(fit) => selectedElement && handleElementUpdate(selectedElement.id, { fillImageFit: fit })}
          onGradientTypeChange={(type) => {
            if (selectedElement) {
              handleElementUpdate(selectedElement.id, { gradientType: type });
            } else if (selectedFrameId) {
              handleFrameUpdate(selectedFrameId, { gradientType: type });
            }
          }}
          onGradientAngleChange={(angle) => {
            if (selectedElement) {
              handleElementUpdate(selectedElement.id, { gradientAngle: angle });
            } else if (selectedFrameId) {
              handleFrameUpdate(selectedFrameId, { gradientAngle: angle });
            }
          }}
          onGradientStopsChange={(stops) => {
            if (selectedElement) {
              handleElementUpdate(selectedElement.id, { gradientStops: stops });
            } else if (selectedFrameId) {
              handleFrameUpdate(selectedFrameId, { gradientStops: stops });
            }
          }}
          onPatternFrameIdChange={(frameId) => selectedElement && handleElementUpdate(selectedElement.id, { patternFrameId: frameId })}
          onVideoUrlChange={(url) => selectedElement && handleElementUpdate(selectedElement.id, { videoUrl: url })}
          availableFrames={frames.map(f => ({ id: f.id, name: f.name }))}
          onIconChange={(iconName, iconFamily) => selectedElement && handleElementUpdate(selectedElement.id, { iconName, iconFamily })}
          onIconStrokeWidthChange={(width) => selectedElement && handleElementUpdate(selectedElement.id, { iconStrokeWidth: width })}
          // Line-specific props and handlers
          lineStyle={selectedElement?.lineStyle}
          lineCap={selectedElement?.lineCap}
          lineJoin={selectedElement?.lineJoin}
          dashArray={selectedElement?.dashArray}
          controlPoints={selectedElement?.controlPoints}
          lineArrowStart={selectedElement?.lineArrowStart}
          lineArrowEnd={selectedElement?.lineArrowEnd}
          onLineStyleChange={(style) => selectedElement && handleElementUpdate(selectedElement.id, { lineStyle: style })}
          onLineCapChange={(cap) => selectedElement && handleElementUpdate(selectedElement.id, { lineCap: cap })}
          onLineJoinChange={(join) => selectedElement && handleElementUpdate(selectedElement.id, { lineJoin: join })}
          onDashArrayChange={(dashArray) => selectedElement && handleElementUpdate(selectedElement.id, { dashArray })}
          onLineArrowStartChange={(arrow) => selectedElement && handleElementUpdate(selectedElement.id, { lineArrowStart: arrow })}
          onLineArrowEndChange={(arrow) => selectedElement && handleElementUpdate(selectedElement.id, { lineArrowEnd: arrow })}
          onControlPointsChange={(points) => selectedElement && handleElementUpdate(selectedElement.id, { controlPoints: points })}
          // QR Code props
          qrValue={selectedElement?.qrValue}
          qrFgColor={selectedElement?.qrFgColor}
          qrBgColor={selectedElement?.qrBgColor}
          qrLevel={selectedElement?.qrLevel}
          onQrValueChange={(value) => selectedElement && handleElementUpdate(selectedElement.id, { qrValue: value })}
          onQrFgColorChange={(color) => selectedElement && handleElementUpdate(selectedElement.id, { qrFgColor: color })}
          onQrBgColorChange={(color) => selectedElement && handleElementUpdate(selectedElement.id, { qrBgColor: color })}
          onQrLevelChange={(level) => selectedElement && handleElementUpdate(selectedElement.id, { qrLevel: level })}
          onOpenBrandKit={() => {
            setShowBrandKitPanel(true);
            setShowShapeSettings(false);
          }}
          onClose={() => {
            setShowShapeSettings(false);
            setSelectedElementIds([]);
          }}
        />
      )}

      {/* Layers Panel */}
      {showLayersPanel && (
        <LayersPanel
          frames={frames}
          selectedFrameId={selectedFrameId}
          selectedElementIds={selectedElementIds}
          onElementSelect={handleElementSelect}
          onFrameSelect={(id) => {
            setSelectedFrameId(id);
            setSelectedElementIds([]);
          }}
          onElementDelete={handleElementDelete}
          onElementUpdate={(frameId, elementId, updates) => {
            handleElementUpdate(elementId, updates);
          }}
          onElementReorder={handleElementReorder}
          onFrameReorder={handleFrameReorder}
          onFrameUpdate={(frameId, updates) => {
            handleFrameUpdate(frameId, updates);
          }}
          onFrameDelete={(frameId) => {
            if (frames.length > 1) {
              setFrames(frames.filter(f => f.id !== frameId));
              if (selectedFrameId === frameId) {
                setSelectedFrameId(frames[0].id === frameId ? frames[1].id : frames[0].id);
              }
              toast.success("Frame deleted");
            } else {
              toast.error("Cannot delete the last frame");
            }
          }}
          onClose={() => setShowLayersPanel(false)}
        />
      )}

      {/* Media Library Panel */}
      {showMediaLibrary && (
        <MediaLibraryPanel
          onSelectImage={(url) => {
            if (!selectedFrame) {
              toast.info("Please select a frame first");
              return;
            }
            
            // Detect if the URL is a video based on file extension or type
            const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video');
            
            // Add as either video or image element
            const newElement: Element = {
              id: `${isVideo ? 'video' : 'image'}-${Date.now()}`,
              type: isVideo ? "video" : "image",
              name: isVideo ? "Video" : "Image",
              x: selectedFrame.width / 2 - 100,
              y: selectedFrame.height / 2 - 100,
              width: 200,
              height: 200,
              imageUrl: url,
              imageFit: "cover",
              fillType: "solid",
              fill: "#000000",
              opacity: 100,
              rotation: 0,
              brightness: 100,
              contrast: 100,
              saturation: 100,
              blur: 0,
            };

            setFrames((prevFrames) =>
              prevFrames.map((frame) =>
                frame.id === selectedFrameId
                  ? {
                      ...frame,
                      elements: [...(frame.elements || []), newElement],
                    }
                  : frame
              )
            );
            
            toast.success("Image added to canvas");
          }}
          onClose={() => setShowMediaLibrary(false)}
          open={showMediaLibrary}
        />
      )}

      {/* Quick Action Buttons */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40">
        <Button
          variant="ghost"
          size="icon"
          className={`h-10 w-10 rounded-full transition-all duration-300 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground shadow-sm group ${
            showGeneratePanel 
              ? 'bg-primary/20 text-primary shadow-primary/20' 
              : 'bg-card hover:shadow-md'
          }`}
          onClick={() => setShowGeneratePanel(!showGeneratePanel)}
        >
          <Magicpen size={16} className={`transition-transform duration-300 group-hover:rotate-6 group-hover:text-white ${showGeneratePanel ? 'text-primary' : 'hover:text-primary/70 transition-colors'}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-10 w-10 rounded-full transition-all duration-300 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground shadow-sm group ${
            showTemplatesPanel 
              ? 'bg-primary/20 text-primary shadow-primary/20' 
              : 'bg-card hover:shadow-md'
          }`}
          onClick={() => setShowTemplatesPanel(!showTemplatesPanel)}
        >
          <Element2 size={16} className={`transition-transform duration-300 group-hover:rotate-6 group-hover:text-white ${showTemplatesPanel ? 'text-primary' : 'hover:text-primary/70 transition-colors'}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-10 w-10 rounded-full transition-all duration-300 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground shadow-sm group ${
            showLayersPanel 
              ? 'bg-primary/20 text-primary shadow-primary/20' 
              : 'bg-card hover:shadow-md'
          }`}
          onClick={() => {
            setShowLayersPanel(!showLayersPanel);
          }}
        >
          <Layer size={16} className={`transition-transform duration-300 group-hover:rotate-6 group-hover:text-white ${showLayersPanel ? 'text-primary' : 'hover:text-primary/70 transition-colors'}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-10 w-10 rounded-full transition-all duration-300 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground shadow-sm group ${
            showMediaLibrary 
              ? 'bg-primary/20 text-primary shadow-primary/20' 
              : 'bg-card hover:shadow-md'
          }`}
          onClick={() => setShowMediaLibrary(!showMediaLibrary)}
          title="Media Library"
        >
          <Gallery size={16} className={`transition-transform duration-300 group-hover:rotate-6 group-hover:text-white ${showMediaLibrary ? 'text-primary' : 'hover:text-primary/70 transition-colors'}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-10 w-10 rounded-full transition-all duration-300 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground shadow-sm group ${
            showShapeSettings || selectedElementIds.length > 0 
              ? 'bg-primary/20 text-primary shadow-primary/20' 
              : 'bg-card hover:shadow-md'
          }`}
          onClick={() => setShowShapeSettings(!showShapeSettings)}
        >
          <Setting4 size={16} className={`transition-transform duration-300 group-hover:rotate-6 group-hover:text-white ${showShapeSettings || selectedElementIds.length > 0 ? 'text-primary' : 'hover:text-primary/70 transition-colors'}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-10 w-10 rounded-full transition-all duration-300 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground shadow-sm group ${
            showAnimationsPanel 
              ? 'bg-primary/20 text-primary shadow-primary/20' 
              : 'bg-card hover:shadow-md'
          }`}
          onClick={() => {
            // Set animatingElementId to first selected element when opening from sidebar
            if (!showAnimationsPanel && selectedElementIds.length > 0) {
              setAnimatingElementId(selectedElementIds[0]);
            }
            setShowAnimationsPanel(!showAnimationsPanel);
          }}
          title="Animations"
        >
          <Video size={16} className={`transition-transform duration-300 group-hover:rotate-6 group-hover:text-white ${showAnimationsPanel ? 'text-primary' : 'hover:text-primary/70 transition-colors'}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-10 w-10 rounded-full transition-all duration-300 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground shadow-sm group ${
            showBrandKitPanel 
              ? 'bg-primary/20 text-primary shadow-primary/20' 
              : 'bg-card hover:shadow-md'
          }`}
          onClick={() => setShowBrandKitPanel(!showBrandKitPanel)}
          title="Brand Kit"
        >
          <Colorfilter size={16} className={`transition-transform duration-300 group-hover:rotate-6 group-hover:text-white ${showBrandKitPanel ? 'text-primary' : 'hover:text-primary/70 transition-colors'}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-10 w-10 rounded-full transition-all duration-300 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground shadow-sm group ${
            showInteractivityPanel 
              ? 'bg-primary/20 text-primary shadow-primary/20' 
              : 'bg-card hover:shadow-md'
          }`}
          onClick={() => setShowInteractivityPanel(!showInteractivityPanel)}
          title="Interactivity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 group-hover:rotate-6 group-hover:text-white ${showInteractivityPanel ? 'text-primary' : 'hover:text-primary/70 transition-colors'}`}>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full transition-all duration-300 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground bg-primary/20 shadow-sm shadow-primary/20 group"
          onClick={() => setShowPreviewDialog(true)}
          title="Preview with animations"
        >
          <PlayCircle size={16} className="text-primary transition-transform duration-300 group-hover:rotate-6" />
        </Button>
      </div>
      
      {/* Zoom Controls */}
      <div className="fixed left-4 bottom-12 flex flex-row items-center gap-1 z-40 bg-card/80 backdrop-blur-xl rounded-full px-2 py-1 border border-border/40 dark:border-border/25 shadow-sm">
        <button
          onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
          className="text-xs font-medium px-2 py-0.5 hover:bg-secondary rounded-full transition-colors"
        >
          +
        </button>
        <div className="text-[10px] font-medium px-2 min-w-[40px] text-center">{Math.round(zoom * 100)}%</div>
        <button
          onClick={() => setZoom(prev => Math.max(0.1, prev - 0.1))}
          className="text-xs font-medium px-2 py-0.5 hover:bg-secondary rounded-full transition-colors"
        >
          -
        </button>
        <div className="w-px h-3 bg-border/40 dark:bg-border/25 mx-1" />
        <button
          onClick={() => {
            setZoom(1);
            setPanOffset({ x: 0, y: 0 });
          }}
          className="text-[10px] font-medium px-2 py-0.5 hover:bg-secondary rounded-full transition-colors"
        >
          Reset
        </button>
      </div>

      <BottomToolbar
        activeTool={activeTool}
        onToolChange={(tool) => {
          setActiveTool(tool as typeof activeTool);
          if (tool === "text") {
            handleAddText();
          }
        }}
        onShapeSelect={handleShapeSelect}
        onIconSelect={handleIconSelect}
        onQRCodeAdd={handleQRCodeAdd}
        timelinePanelOpen={showTimelinePanel}
        timelinePanelHeight={timelinePanelHeight}
        onShaderAdd={() => setShowShaderLibrary(true)}
        onLineAdd={handleLineAdd}
        onImageUpload={handleImageUpload}
        onVideoUpload={handleVideoUpload}
        onAddFrame={handleAddFrame}
        onAddNestedFrame={handleAddNestedFrame}
        onAddRichText={handleAddRichText}
        onDisablePanMode={() => setIsPanning(false)}
      />
      

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        framePreview={selectedFrame?.image || undefined}
        frameName={selectedFrame?.name}
        projectId={projectId}
        onExport={(format, resolution) => {
          console.log(`Exporting as ${format} at ${resolution}px`);
          downloadPoster();
        }}
      />

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        frames={frames}
        defaultSelectedFrameIds={[selectedFrameId]}
        onExport={async (config) => {
          await exportFrames(frames, config);
        }}
      />

      <ExportAllDialog
        open={showExportAllDialog}
        onOpenChange={setShowExportAllDialog}
        frames={frames}
      />

      <AnimationsPanel
        open={showAnimationsPanel}
        onClose={() => {
          setShowAnimationsPanel(false);
          setAnimatingElementId(null);
        }}
        currentAnimation={
          animatingElementId
            ? (frames
                .find(f => f.id === selectedFrameId)
                ?.elements?.find(e => e.id === animatingElementId)
                ?.animation as AnimationType) || "none"
            : "none"
        }
        currentCategory={
          animatingElementId
            ? frames
                .find(f => f.id === selectedFrameId)
                ?.elements?.find(e => e.id === animatingElementId)
                ?.animationCategory || "in"
            : "in"
        }
        currentDuration={
          animatingElementId
            ? frames
                .find(f => f.id === selectedFrameId)
                ?.elements?.find(e => e.id === animatingElementId)
                ?.animationDuration || "0.5s"
            : "0.5s"
        }
        currentDelay={
          animatingElementId
            ? frames
                .find(f => f.id === selectedFrameId)
                ?.elements?.find(e => e.id === animatingElementId)
                ?.animationDelay || "0s"
            : "0s"
        }
        currentEasing={
          animatingElementId
            ? frames
                .find(f => f.id === selectedFrameId)
                ?.elements?.find(e => e.id === animatingElementId)
                ?.animationTimingFunction || "ease-out"
            : "ease-out"
        }
        currentIterationCount={
          animatingElementId
            ? frames
                .find(f => f.id === selectedFrameId)
                ?.elements?.find(e => e.id === animatingElementId)
                ?.animationIterationCount || "1"
            : "1"
        }
        onSelectAnimation={handleAnimationSelect}
      />

      {/* Timeline Panel */}
      {selectedFrame && (
        <div 
          className={`fixed bottom-0 left-0 right-0 z-[60] transition-all duration-300 ease-out ${
            showTimelinePanel ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ 
            marginBottom: showTimelinePanel ? '0' : '-4px',
            height: showTimelinePanel ? `${timelinePanelHeight}px` : '0px',
            minHeight: showTimelinePanel ? `${timelinePanelHeight}px` : '0px',
            transition: isResizingTimeline ? 'none' : undefined
          }}
        >
          {/* Resize Handle */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizingTimeline(true);
              const startY = e.clientY;
              const startHeight = timelinePanelHeight;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaY = startY - moveEvent.clientY;
                const newHeight = Math.min(Math.max(200, startHeight + deltaY), window.innerHeight - 100);
                setTimelinePanelHeight(newHeight);
              };

              const handleMouseUp = () => {
                setIsResizingTimeline(false);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
            className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-primary/20 transition-colors group z-[70] flex items-center justify-center bg-card/80 backdrop-blur-sm border-t border-border"
          >
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-16 h-1 bg-border group-hover:bg-primary rounded-full transition-colors" />
              <div className="w-16 h-1 bg-border group-hover:bg-primary rounded-full transition-colors" />
            </div>
          </div>

          {/* Toggle Handle - Click to toggle, drag to resize */}
          <button
            onClick={() => setShowTimelinePanel(!showTimelinePanel)}
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-xl border border-border rounded-t-lg px-4 py-1.5 hover:bg-card transition-colors shadow-lg z-[80] flex items-center gap-2"
            title="Click to toggle timeline, or drag the handle below to resize"
          >
            <span className="text-xs font-medium">Timeline</span>
            <svg 
              className={`w-4 h-4 transition-transform ${showTimelinePanel ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <TimelinePanel
            frame={selectedFrame}
            elements={selectedFrame.elements || []}
            onUpdateElement={(elementId, updates) => {
              handleElementUpdate(elementId, updates);
            }}
            currentTime={currentTime}
            onTimeChange={setCurrentTime}
            maxDuration={maxDuration}
            isPlaying={isPlayingAnimation}
            onPlayPause={handlePlayPause}
            onReset={handleTimelineReset}
            selectedElementIds={selectedElementIds}
            onElementSelect={(elementId) => {
              setSelectedElementIds([elementId]);
              setShowAnimationsPanel(true);
              setAnimatingElementId(elementId);
            }}
            voiceAudios={voiceAudios}
            onVoiceAudiosChange={setVoiceAudios}
            timelineMarkers={timelineMarkers}
            onTimelineMarkersChange={setTimelineMarkers}
            backgroundMusic={backgroundMusic}
            onBackgroundMusicChange={setBackgroundMusic}
          />
        </div>
      )}

      <PreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        frames={frames}
        initialFrameId={selectedFrame?.id}
      />

      <BrandKitPanel
        isOpen={showBrandKitPanel}
        onClose={() => setShowBrandKitPanel(false)}
        onApplyColor={(color) => {
          if (selectedElement) {
            handleElementUpdate(selectedElement.id, { fill: color });
          }
        }}
        onApplyFont={(font) => {
          if (selectedElement) {
            handleElementUpdate(selectedElement.id, { fontFamily: font });
          }
        }}
      />

      {showInteractivityPanel && (
        <DraggablePanel
          title="Interactivity"
          onClose={() => setShowInteractivityPanel(false)}
          defaultPosition={{ x: window.innerWidth - 420, y: 100 }}
        >
          <InteractivityPanel
            selectedElements={selectedElementIds
              .map((id) => selectedFrame?.elements?.find((e) => e.id === id))
              .filter((e): e is Element => !!e)}
            onUpdate={handleElementUpdate}
          />
        </DraggablePanel>
      )}

      {/* Removed TopProgressBar - now integrated into EditorTopBar */}

      {/* Collaborative Cursors Overlay */}
      {enableCollaboration && activeUsers.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-[9998]">
          {activeUsers.map((user) => {
            const canvasRect = canvasAreaRef.current?.getBoundingClientRect() || null;
            return (
              <CollaborativeCursor
                key={user.userId}
                user={user}
                zoom={zoom}
                panOffset={panOffset}
                canvasRect={canvasRect}
              />
            );
          })}
        </div>
      )}

      <DrawtirFooter />

      {/* Shader Library Modal */}
      <ShaderLibraryModal
        open={showShaderLibrary}
        onClose={() => setShowShaderLibrary(false)}
        onSelect={handleShaderSelect}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />
    </div>
  );
}
