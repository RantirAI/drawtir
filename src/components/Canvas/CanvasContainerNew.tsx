import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ResizableFrame from "./ResizableFrame";
import DraggablePanel from "../Panels/DraggablePanel";
import ShapeSettingsPanel from "../Panels/ShapeSettingsPanel";
import { ShaderSettingsPanel } from "../Panels/ShaderSettingsPanel";
import LayersPanel from "../Panels/LayersPanel";
import AIGeneratorPanel from "../Panels/AIGeneratorPanel";
import TemplatesPanel from "../Panels/TemplatesPanel";
import BottomToolbar from "../Toolbar/BottomToolbar";
import EditorTopBar from "../TopBar/EditorTopBar";
import CanvasBackground from "./CanvasBackground";
import FrameBadge from "./FrameBadge";
import DrawingLayer from "./DrawingLayer";
import ShareDialog from "./ShareDialog";
import ExportAllDialog from "./ExportAllDialog";
import PreviewDialog from "./PreviewDialog";
import ResizableElement from "./ResizableElement";
import CanvasContextMenu from "./ContextMenu";
import AnimationsModal from "./AnimationsModal";
import type { AnimationType } from "./AnimationsModal";
import DrawtirFooter from "../Footer/DrawtirFooter";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Layers, SlidersHorizontal, Upload, Layout, Play } from "lucide-react";
import { Frame, Element } from "@/types/elements";
import type { CanvasSnapshot } from "@/types/snapshot";
import { createSnapshot, generateThumbnail, validateSnapshot } from "@/lib/snapshot";
import { useAutoSave } from "@/hooks/useAutoSave";

interface CanvasContainerNewProps {
  isEmbedded?: boolean;
  initialSnapshot?: CanvasSnapshot;
  onSnapshotChange?: (snapshot: CanvasSnapshot) => void;
  onSaveRequest?: (snapshot: CanvasSnapshot) => void | Promise<void>;
  readOnly?: boolean;
}

export default function CanvasContainerNew({
  isEmbedded = false,
  initialSnapshot,
  onSnapshotChange,
  onSaveRequest,
  readOnly = false,
}: CanvasContainerNewProps = {}) {
  const [projectTitle, setProjectTitle] = useState(initialSnapshot?.metadata.title || "Untitled Poster");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [history, setHistory] = useState<Frame[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedoing, setIsUndoRedoing] = useState(false);
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
      enableDynamicScale: true,
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
  const [penColor, setPenColor] = useState("#3b82f6");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [zoom, setZoom] = useState(1);
  // Calculate initial pan offset to center the first frame
  const calculateCenterOffset = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const firstFrame = frames[0];
    // Center the frame in the viewport
    const centerX = (viewportWidth / 2) - (firstFrame.width / 2) - firstFrame.x;
    const centerY = (viewportHeight / 2) - (firstFrame.height / 2) - firstFrame.y;
    return { x: centerX, y: centerY };
  };
  const [panOffset, setPanOffset] = useState(calculateCenterOffset());
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Auto-fit frame to viewport
  const fitFrameToView = (frameId: string) => {
    const frame = frames.find(f => f.id === frameId);
    if (!frame) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
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

  // Fit frame to view only when selection changes, not on every frame update
  useEffect(() => {
    if (!selectedFrameId) return;
    const t = window.setTimeout(() => fitFrameToView(selectedFrameId), 0);
    return () => window.clearTimeout(t);
  }, [selectedFrameId]);

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
  const [showAnimationsModal, setShowAnimationsModal] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [animatingElementId, setAnimatingElementId] = useState<string | null>(null);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(false);

  const [description, setDescription] = useState("");
  const [captionImage, setCaptionImage] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const captionImageInputRef = useRef<HTMLInputElement>(null);

  const selectedFrame = frames.find((f) => f.id === selectedFrameId);
  const selectedElements = selectedFrame?.elements?.filter((e) => selectedElementIds.includes(e.id)) || [];
  const selectedElement = selectedElements.length === 1 ? selectedElements[0] : null;

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
        if (selectedElementIds.length > 0) {
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
      if (e.key === ' ') {
        setIsPanning(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsPanning(false);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.1, Math.min(3, prev + delta)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [historyIndex, history, selectedElementIds]);

  const getFilterStyle = () => {
    if (!selectedFrame) return {};
    return {
      filter: `brightness(${selectedFrame.brightness}%) contrast(${selectedFrame.contrast}%) saturate(${selectedFrame.saturation}%) blur(${selectedFrame.blur}px)`,
    };
  };

  const handleAddFrame = () => {
    const newFrame: Frame = {
      id: `frame-${Date.now()}`,
      name: `Frame ${frames.length + 1}`,
      x: 150 + frames.length * 50,
      y: 150 + frames.length * 50,
      width: 400,
      height: 600,
      initialWidth: 400,
      initialHeight: 600,
      enableDynamicScale: true,
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
    toast.success("Frame added!");
  };

  const handleFrameUpdate = (id: string, updates: Partial<Frame>) => {
    setFrames(frames.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleImageUpload = () => {
    // Now creates an image element instead of setting frame image
    imageInputRef.current?.click();
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

  const generateWithAI = async (generationType: string = "freeform", model: string = "claude-sonnet-4-5") => {
    const imgs = Array.isArray(captionImage) ? captionImage : [];
    if (!description.trim() && imgs.length === 0) {
      toast.error("Please provide a description or upload an image");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(`Starting generation with ${model}...`);
    try {
      // Handle image generation first if selected
      let imagesToUse = [...imgs];
      
      if (generationType === "generate-image") {
        if (!description.trim()) {
          toast.error("Please provide a description for image generation");
          setIsGenerating(false);
          return;
        }

        setGenerationProgress("Generating image with AI...");
        
        try {
          const imageResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
              body: JSON.stringify({
                prompt: description,
                size: "1024x1024",
                quality: "high",
              }),
            }
          );

          if (!imageResponse.ok) {
            const errorData = await imageResponse.json();
            throw new Error(errorData.error || "Failed to generate image");
          }

          const imageData = await imageResponse.json();
          if (imageData.image) {
            imagesToUse = [imageData.image];
            toast.success("Image generated! Now creating poster...");
            setGenerationProgress("Creating poster design...");
          } else {
            throw new Error("No image data received");
          }
        } catch (imageError: any) {
          console.error("Image generation error:", imageError);
          toast.error(imageError.message || "Failed to generate image");
          setIsGenerating(false);
          setGenerationProgress("");
          return;
        }
      }

      // Intelligently determine analysisType based on context
      let analysisType = generationType === "replicate" ? "replicate" : "create";
      
      if (imagesToUse.length === 0 && analysisType === "replicate") {
        toast.error("Please upload an image to replicate");
        setIsGenerating(false);
        return;
      }

      // Get current frame dimensions to tell AI the canvas size
      const selectedFrame = frames.find(f => f.id === selectedFrameId);
      const canvasWidth = selectedFrame?.width || 800;
      const canvasHeight = selectedFrame?.height || 1200;

      // Full AI poster generation with streaming
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-poster`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            prompt: description,
            imageBase64: imagesToUse.length > 0 ? imagesToUse : null,
            analysisType,
            canvasWidth,
            canvasHeight,
            model,
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
                console.log('Status:', data.message);
              } else if (data.type === 'progress') {
                // Log raw progress for debugging
                console.log('Generating:', data.text);
              } else if (data.type === 'complete') {
                setGenerationProgress('Finalizing design...');
                designSpec = data.designSpec;
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
      if (selectedFrameId && designSpec.backgroundColor) {
        handleFrameUpdate(selectedFrameId, { backgroundColor: designSpec.backgroundColor });
      }

        // Add elements to the current frame
        if (selectedFrameId && combinedElements.length > 0) {
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
              // For images, use generated or uploaded images
              return {
                ...baseElement,
                imageData: imagesToUse.length > 0 ? imagesToUse[0] : undefined,
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
            f.id === selectedFrameId 
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
            const snapshot = createSnapshot(frames, projectTitle, zoom, panOffset, "#ffffff");
            await supabase.from('ai_conversations').insert({
              project_id: projectId,
              user_id: user.id,
              title: description.substring(0, 50) || "AI Generation",
              description: description,
              generation_type: generationType,
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
      const snapshot = createSnapshot(frames, projectTitle, zoom, panOffset, "#ffffff");
      await onSaveRequest(snapshot);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to save your work");
        return;
      }

      const snapshot = createSnapshot(frames, projectTitle, zoom, panOffset, "#ffffff");
      const thumbnail = await generateThumbnail(frames);

      const posterData = {
        user_id: user.id,
        project_name: projectTitle,
        canvas_data: snapshot as any,
        thumbnail_url: thumbnail,
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
      const snapshot = createSnapshot(frames, projectTitle, zoom, panOffset, "#ffffff");
      onSnapshotChange(snapshot);
    }
  }, [frames, projectTitle, zoom, panOffset, isEmbedded, onSnapshotChange]);

  // Load initial snapshot
  useEffect(() => {
    if (initialSnapshot && validateSnapshot(initialSnapshot)) {
      setProjectTitle(initialSnapshot.metadata.title);
      setFrames(initialSnapshot.frames);
      setZoom(initialSnapshot.canvas.zoom);
      setPanOffset(initialSnapshot.canvas.panOffset);
    }
  }, []);

  // Load project from URL on mount
  useEffect(() => {
    const loadProjectFromUrl = async () => {
      const params = new URLSearchParams(window.location.search);
      const projectIdFromUrl = params.get('project');
      
      if (projectIdFromUrl && !isEmbedded) {
        try {
          const { data, error } = await supabase
            .from('posters')
            .select('canvas_data')
            .eq('id', projectIdFromUrl)
            .single();
          
          if (error) throw error;
          
          if (data?.canvas_data) {
            const snapshot = data.canvas_data as any as CanvasSnapshot;
            if (validateSnapshot(snapshot)) {
              setProjectTitle(snapshot.metadata.title);
              setFrames(snapshot.frames);
              setZoom(snapshot.canvas.zoom);
              setPanOffset(snapshot.canvas.panOffset);
              setProjectId(projectIdFromUrl);
              console.log("✅ Loaded project from URL:", projectIdFromUrl);
            }
          }
        } catch (error) {
          console.error("Error loading project:", error);
          toast.error("Failed to load project");
        }
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
    const frame = frames.find(f => f.id === targetFrameId);
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

    setFrames(prevFrames => prevFrames.map(f => {
      if (f.id === targetFrameId) {
        const updatedFrame = { ...f, elements: [...(f.elements || []), newElement] };
        console.log("✅ Updated frame with new element. Total elements:", updatedFrame.elements?.length);
        return updatedFrame;
      }
      return f;
    }));
    setSelectedElementIds([newElement.id]);
    console.log("✅ Selected new element:", newElement.id);
    setShowShapeSettings(true);
    setActiveTool("select");
    console.log(`✅ ${shapeType} shape added successfully!`);
    toast.success(`${shapeType} added!`);
  };

  const handleIconSelect = (iconName: string, iconFamily: string) => {
    const targetFrameId = selectedFrameId || frames[0]?.id;
    if (!targetFrameId) {
      toast.error("Please add a frame first");
      return;
    }
    const frame = frames.find(f => f.id === targetFrameId);
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
      fill: penColor,
      stroke: "transparent",
      strokeWidth: 0,
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
    toast.success(`Icon added!`);
  };

  const handleShaderAdd = () => {
    const targetFrameId = selectedFrameId || frames[0]?.id;
    if (!targetFrameId) {
      toast.error("Please add a frame first");
      return;
    }
    const frame = frames.find(f => f.id === targetFrameId);
    if (!frame) return;

    const defaultWidth = 400;
    const defaultHeight = 400;
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
        type: "ripple",
        speed: 1,
        intensity: 1,
        scale: 10,
        color1: "#ff0080",
        color2: "#00ffff",
        color3: "#ffff00"
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
    toast.success(`Shader effect added!`);
  };

  const handleLineAdd = () => {
    const targetFrameId = selectedFrameId || frames[0]?.id;
    if (!targetFrameId) {
      toast.error("Please add a frame first");
      return;
    }
    const frame = frames.find(f => f.id === targetFrameId);
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

    setFrames(prevFrames => prevFrames.map(f => {
      if (f.id === targetFrameId) {
        return { ...f, elements: [...(f.elements || []), newElement] };
      }
      return f;
    }));
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

  const handleAnimationSelect = (animation: AnimationType, duration?: string) => {
    if (!animatingElementId) return;
    
    handleElementUpdate(animatingElementId, {
      animation: animation,
      animationDuration: duration,
    });
    
    toast.success(`Animation ${animation !== 'none' ? 'applied' : 'removed'}!`);
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

    setFrames(frames.map(f => {
      if (f.id === selectedFrameId) {
        return { ...f, elements: [...(f.elements || []), newElement] };
      }
      return f;
    }));
    setSelectedElementIds([newElement.id]);
    setShowShapeSettings(true);
    setActiveTool("select");
    toast.success("Text added!");
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
      enableDynamicScale: true,
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

  // Main canvas container component
  return (
    <div className="w-full h-screen relative overflow-hidden">
      <CanvasBackground />

      <EditorTopBar
        projectName={projectTitle}
        onProjectNameChange={setProjectTitle}
        onSave={forceSave}
        onDownload={downloadPoster}
        onExport={downloadPoster}
        onExportAll={() => setShowExportAllDialog(true)}
        onShare={() => setShowShareDialog(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        isSaving={isAutoSaving}
        hideCloudFeatures={isEmbedded}
        projectId={projectId}
      />

      {/* Canvas Area */}
      <div 
        className="w-full h-full"
        onMouseDown={(e) => {
          if (isPanning && e.button === 0 && activeTool !== 'pen') {
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
          }
        }}
        onMouseMove={(e) => {
          if (isPanning && e.buttons === 1 && activeTool !== 'pen') {
            setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
          }
        }}
        style={{
          transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
          transformOrigin: 'center',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          cursor: isPanning && activeTool !== 'pen' ? 'grab' : activeTool === 'pen' ? 'crosshair' : 'default'
        }}
      >
        {frames.map((frame) => (
          <div key={frame.id}>
            <FrameBadge
              name={frame.name}
              x={frame.x + frame.width / 2 - 40}
              y={frame.y}
              onChange={(name) => handleFrameUpdate(frame.id, { name })}
            />
            <CanvasContextMenu
              onDelete={() => frame.id === selectedFrameId && handleDelete()}
              onDuplicate={() => frame.id === selectedFrameId && handleDuplicate()}
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
                isSelected={frame.id === selectedFrameId}
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
                      setShowAnimationsModal(true);
                    }}
                  >
                     <ResizableElement
                      id={element.id}
                       type={element.type === "drawing" ? "shape" : element.type === "icon" ? "shape" : element.type === "shader" ? "shader" : element.type}
                      x={element.x}
                      y={element.y}
                      width={element.width}
                      height={element.height}
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
                      shader={element.shader}
                      lineStyle={element.lineStyle}
                      lineCap={element.lineCap}
                      lineJoin={element.lineJoin}
                      dashArray={element.dashArray}
                      controlPoints={element.controlPoints}
                      rotation={element.rotation}
                      animation={element.animation}
                      animationDuration={element.animationDuration}
                      useFlexLayout={false}
                      isSelected={selectedElementIds.includes(element.id)}
                      zoom={zoom}
                      onUpdate={handleElementUpdate}
                      onSelect={(e) => handleElementSelect(element.id, e?.shiftKey || e?.ctrlKey || e?.metaKey)}
                      onDelete={() => handleElementDelete(element.id)}
                      onDuplicate={() => handleElementDuplicate(element.id)}
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
                      }}
                    >
                      <ResizableFrame
                        id={nestedFrame.id}
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
                        isSelected={false}
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
                          toast.info("Nested frame selected");
                        }}
                      >
                        {/* Elements inside nested frame */}
                        {(nestedFrame.elements || []).map((element) => (
                          <ResizableElement
                            key={element.id}
                            id={element.id}
                            type={element.type === "drawing" ? "shape" : element.type === "icon" ? "shape" : element.type === "shader" ? "shader" : element.type}
                            x={element.x}
                            y={element.y}
                            width={element.width}
                            height={element.height}
                            text={element.text}
                            shapeType={element.shapeType}
                            fill={element.fill}
                            stroke={element.stroke}
                            strokeWidth={element.strokeWidth}
                            opacity={element.opacity}
                            cornerRadius={element.cornerRadius}
                            fontSize={element.fontSize}
                            fontFamily={element.fontFamily}
                            fontWeight={element.fontWeight}
                            iconName={element.iconName}
                            iconFamily={element.iconFamily}
                            shader={element.shader}
                            animation={element.animation}
                            animationDuration={element.animationDuration}
                            useFlexLayout={false}
                            isSelected={false}
                            zoom={zoom}
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
                            onSelect={() => {}}
                            onDelete={() => {}}
                            onDuplicate={() => {}}
                          />
                        ))}
                      </ResizableFrame>
                    </div>
                  </CanvasContextMenu>
                ))}
              </ResizableFrame>
            </CanvasContextMenu>
          </div>
        ))}
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

      {/* AI Generation Panel */}
      {showGeneratePanel && (
        <AIGeneratorPanel
          projectId={projectId}
          currentSnapshot={createSnapshot(frames, projectTitle, zoom, panOffset, "#ffffff")}
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
          <ShaderSettingsPanel
            element={selectedElement}
            onUpdate={(updates) => handleElementUpdate(selectedElement.id, updates)}
          />
        </DraggablePanel>
      )}

      {showShapeSettings && (selectedElement?.type !== "shader") && (selectedElement || (selectedElementIds.length === 0 && selectedFrame)) && (
        <ShapeSettingsPanel
          elementType={selectedElement ? selectedElement.type : "frame"}
          elementName={
            selectedElement 
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
          backgroundColor={selectedFrame?.backgroundColor}
          backgroundType={selectedFrame?.backgroundType}
          fillType={selectedElement?.fillType}
          fill={selectedElement?.fill || penColor}
          fillImage={selectedElement?.fillImage}
          fillImageFit={selectedElement?.fillImageFit}
          gradientType={selectedElement?.gradientType}
          gradientAngle={selectedElement?.gradientAngle}
          gradientStops={selectedElement?.gradientStops}
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
          fontFamily={selectedElement?.fontFamily}
          fontWeight={selectedElement?.fontWeight}
          textAlign={selectedElement?.textAlign}
          fontSize={selectedElement?.fontSize}
          color={selectedElement?.color}
          imageFit={selectedElement?.imageFit}
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
          onImageFitChange={(fit) => selectedElement && handleElementUpdate(selectedElement.id, { imageFit: fit })}
          onBrightnessChange={(val) => selectedElement && handleElementUpdate(selectedElement.id, { brightness: val })}
          onContrastChange={(val) => selectedElement && handleElementUpdate(selectedElement.id, { contrast: val })}
          onSaturationChange={(val) => selectedElement && handleElementUpdate(selectedElement.id, { saturation: val })}
          onBlurChange={(val) => selectedElement && handleElementUpdate(selectedElement.id, { blur: val })}
          onFillImageChange={(url) => selectedElement && handleElementUpdate(selectedElement.id, { fillImage: url })}
          onFillImageFitChange={(fit) => selectedElement && handleElementUpdate(selectedElement.id, { fillImageFit: fit })}
          onGradientTypeChange={(type) => selectedElement && handleElementUpdate(selectedElement.id, { gradientType: type })}
          onGradientAngleChange={(angle) => selectedElement && handleElementUpdate(selectedElement.id, { gradientAngle: angle })}
          onGradientStopsChange={(stops) => selectedElement && handleElementUpdate(selectedElement.id, { gradientStops: stops })}
          onPatternFrameIdChange={(frameId) => selectedElement && handleElementUpdate(selectedElement.id, { patternFrameId: frameId })}
          onVideoUrlChange={(url) => selectedElement && handleElementUpdate(selectedElement.id, { videoUrl: url })}
          availableFrames={frames.map(f => ({ id: f.id, name: f.name }))}
          onIconChange={(iconName, iconFamily) => selectedElement && handleElementUpdate(selectedElement.id, { iconName, iconFamily })}
          // Line-specific props and handlers
          lineStyle={selectedElement?.lineStyle}
          lineCap={selectedElement?.lineCap}
          lineJoin={selectedElement?.lineJoin}
          dashArray={selectedElement?.dashArray}
          controlPoints={selectedElement?.controlPoints}
          onLineStyleChange={(style) => selectedElement && handleElementUpdate(selectedElement.id, { lineStyle: style })}
          onLineCapChange={(cap) => selectedElement && handleElementUpdate(selectedElement.id, { lineCap: cap })}
          onLineJoinChange={(join) => selectedElement && handleElementUpdate(selectedElement.id, { lineJoin: join })}
          onDashArrayChange={(dashArray) => selectedElement && handleElementUpdate(selectedElement.id, { dashArray })}
          onControlPointsChange={(points) => selectedElement && handleElementUpdate(selectedElement.id, { controlPoints: points })}
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
          onElementReorder={handleElementReorder}
          onFrameReorder={handleFrameReorder}
          onClose={() => setShowLayersPanel(false)}
        />
      )}

      {/* Quick Action Buttons */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40">
        <Button
          variant="outline"
          size="icon"
          className={`h-10 w-10 rounded-full bg-card/80 backdrop-blur-xl hover:scale-105 transition-transform ${
            showGeneratePanel ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setShowGeneratePanel(!showGeneratePanel)}
        >
          <Sparkles className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={`h-10 w-10 rounded-full bg-card/80 backdrop-blur-xl hover:scale-105 transition-transform ${
            showTemplatesPanel ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setShowTemplatesPanel(!showTemplatesPanel)}
        >
          <Layout className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={`h-10 w-10 rounded-full bg-card/80 backdrop-blur-xl hover:scale-105 transition-transform ${
            showLayersPanel ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => {
            setShowLayersPanel(!showLayersPanel);
          }}
        >
          <Layers className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={`h-10 w-10 rounded-full bg-card/80 backdrop-blur-xl hover:scale-105 transition-transform ${
            showShapeSettings || selectedElementIds.length > 0 ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setShowShapeSettings(!showShapeSettings)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        <Button
          variant="default"
          size="icon"
          className="h-10 w-10 rounded-full bg-primary hover:scale-105 transition-transform shadow-lg"
          onClick={() => setShowPreviewDialog(true)}
          title="Preview with animations"
        >
          <Play className="h-4 w-4" />
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
        onShaderAdd={handleShaderAdd}
        onLineAdd={handleLineAdd}
        onImageUpload={handleImageUpload}
        onAddFrame={handleAddFrame}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
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

      <ExportAllDialog
        open={showExportAllDialog}
        onOpenChange={setShowExportAllDialog}
        frames={frames}
      />

      <AnimationsModal
        open={showAnimationsModal}
        onOpenChange={setShowAnimationsModal}
        currentAnimation={
          animatingElementId
            ? (frames
                .find(f => f.id === selectedFrameId)
                ?.elements?.find(e => e.id === animatingElementId)
                ?.animation as AnimationType) || "none"
            : "none"
        }
        onSelectAnimation={handleAnimationSelect}
      />

      <PreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        frame={selectedFrame}
      />

      <DrawtirFooter />

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
