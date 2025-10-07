import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ResizableFrame from "./ResizableFrame";
import DraggablePanel from "../Panels/DraggablePanel";
import ShapeSettingsPanel from "../Panels/ShapeSettingsPanel";
import PropertyPanel from "../Panels/PropertyPanel";
import LayersPanel from "../Panels/LayersPanel";
import BottomToolbar from "../Toolbar/BottomToolbar";
import EditorTopBar from "../TopBar/EditorTopBar";
import CanvasBackground from "./CanvasBackground";
import FrameBadge from "./FrameBadge";
import DrawingLayer from "./DrawingLayer";
import ShareDialog from "./ShareDialog";
import ResizableElement from "./ResizableElement";
import CanvasContextMenu from "./ContextMenu";
import DrawtirFooter from "../Footer/DrawtirFooter";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Image as ImageIcon, Layers, SlidersHorizontal } from "lucide-react";
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

  const [showImagePanel, setShowImagePanel] = useState(false);
  const [showGeneratePanel, setShowGeneratePanel] = useState(false);
  const [showShapeSettings, setShowShapeSettings] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);

  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

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
      id: `frame-${frames.length + 1}`,
      name: `Frame ${frames.length + 1}`,
      x: 150 + frames.length * 50,
      y: 150 + frames.length * 50,
      width: 400,
      height: 600,
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

  const generateCaption = async () => {
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-poster-caption", {
        body: { description, imageContext: selectedFrame?.image ? "with image" : "no image" },
      });

      if (error) throw error;

      if (data.caption && selectedFrameId) {
        handleFrameUpdate(selectedFrameId, { bottomCaption: data.caption });
        toast.success("Caption generated!");
      }
    } catch (error: any) {
      console.error("Error generating caption:", error);
      toast.error(error.message || "Failed to generate caption");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToCloud = async () => {
    if (isEmbedded && onSaveRequest) {
      const snapshot = createSnapshot(frames, projectTitle, zoom, panOffset, "#ffffff");
      await onSaveRequest(snapshot);
      toast.success("Saved!");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

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
      } else {
        const { data, error } = await supabase
          .from("posters")
          .insert([posterData] as any)
          .select()
          .single();
        if (error) throw error;
        if (data) setProjectId(data.id);
      }

      toast.success("Project saved!");
    } catch (error: any) {
      console.error("Error saving project:", error);
      toast.error(error.message || "Failed to save project");
    } finally {
      setIsSaving(false);
    }
  };

  const { isSaving: isAutoSaving, lastSaved, debouncedSave, forceSave } = useAutoSave({
    onSave: saveToCloud,
    enabled: !isEmbedded && projectId !== null,
  });

  // Trigger auto-save when frames change
  useEffect(() => {
    if (!isEmbedded && projectId) {
      debouncedSave();
    }
  }, [frames, projectTitle, zoom, panOffset, isEmbedded, projectId]);

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

  const handleArrange = (type: string) => {
    if (!selectedFrameId || selectedElementIds.length === 0) return;
    
    const frame = frames.find(f => f.id === selectedFrameId);
    if (!frame || !frame.elements || frame.elements.length === 0) return;

    const elements = [...frame.elements];
    const selectedIndices = selectedElementIds
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
      toast.success("Moved backward");
    }

    const updatedFrames = frames.map(f =>
      f.id === selectedFrameId ? { ...f, elements } : f
    );

    setFrames(updatedFrames);
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
      id: `frame-${frames.length + 1}`,
      name: `Frame ${frames.length + 1}`,
      x: (selectedFrame?.x || 0) + minX - 20,
      y: (selectedFrame?.y || 0) + minY - 20,
      width: maxX - minX + 40,
      height: maxY - minY + 40,
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
      justifyContent: "start",
      alignItems: "start",
      gap: 0,
      elements: elements.map(e => ({ ...e, x: e.x - minX + 20, y: e.y - minY + 20 })),
      cornerRadius: 0,
      opacity: 100,
      blendMode: "normal",
    };

    // Remove elements from current frame
    setFrames(frames.map(f => {
      if (f.id === selectedFrameId) {
        return { ...f, elements: (f.elements || []).filter(e => !selectedElementIds.includes(e.id)) };
      }
      return f;
    }).concat(newFrame));
    
    setSelectedFrameId(newFrame.id);
    setSelectedElementIds([]);
    toast.success("Wrapped in new frame!");
  };

  // Main canvas container component
  return (
    <div className="w-full h-screen relative overflow-hidden">
      <CanvasBackground />

      <EditorTopBar
        projectName={projectTitle}
        onProjectNameChange={setProjectTitle}
        onSave={saveToCloud}
        onDownload={downloadPoster}
        onExport={downloadPoster}
        onShare={() => setShowShareDialog(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        isSaving={isSaving}
        hideCloudFeatures={isEmbedded}
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
            >
              <ResizableFrame
                id={frame.id}
                x={frame.x}
                y={frame.y}
                width={frame.width}
                height={frame.height}
                backgroundColor={frame.backgroundColor}
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
                flexDirection={frame.flexDirection}
                justifyContent={frame.justifyContent}
                alignItems={frame.alignItems}
                gap={frame.gap}
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
                  >
                    <ResizableElement
                      id={element.id}
                      type={element.type === "drawing" ? "shape" : element.type}
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
                      opacity={element.opacity}
                      cornerRadius={element.cornerRadius}
                      brightness={element.brightness}
                      contrast={element.contrast}
                      saturation={element.saturation}
                      blur={element.blur}
                      fontSize={element.fontSize}
                      fontFamily={element.fontFamily}
                      fontWeight={element.fontWeight}
                      textAlign={element.textAlign}
                      color={element.color}
                      useFlexLayout={frame.flexDirection !== undefined && frame.flexDirection !== null}
                      isSelected={selectedElementIds.includes(element.id)}
                      onUpdate={handleElementUpdate}
                      onSelect={(e) => handleElementSelect(element.id, e?.shiftKey || e?.ctrlKey || e?.metaKey)}
                      onDelete={() => handleElementDelete(element.id)}
                      onDuplicate={() => handleElementDuplicate(element.id)}
                    />
                  </CanvasContextMenu>
                )})}
              </ResizableFrame>
            </CanvasContextMenu>
          </div>
        ))}
      </div>

      {/* Panels */}
      {showGeneratePanel && (
        <DraggablePanel title="Generate Caption" defaultPosition={{ x: 50, y: 150 }} onClose={() => setShowGeneratePanel(false)}>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your poster..."
                className="h-20 text-xs"
              />
            </div>
            <Button onClick={generateCaption} disabled={isGenerating} className="w-full h-8 text-xs">
              <Sparkles className="h-3 w-3 mr-2" />
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          </div>
        </DraggablePanel>
      )}

      {showImagePanel && selectedFrame && (
        <PropertyPanel
          brightness={selectedFrame.brightness}
          contrast={selectedFrame.contrast}
          saturation={selectedFrame.saturation}
          blur={selectedFrame.blur}
          imageFit={selectedFrame.imageStyle as "fill" | "contain" | "cover" | "crop"}
          onBrightnessChange={(val) => handleFrameUpdate(selectedFrameId, { brightness: val })}
          onContrastChange={(val) => handleFrameUpdate(selectedFrameId, { contrast: val })}
          onSaturationChange={(val) => handleFrameUpdate(selectedFrameId, { saturation: val })}
          onBlurChange={(val) => handleFrameUpdate(selectedFrameId, { blur: val })}
          onImageFitChange={(val) => handleFrameUpdate(selectedFrameId, { imageStyle: val })}
          onClose={() => setShowImagePanel(false)}
        />
      )}

      {/* Unified Shape Settings Panel */}
      {showShapeSettings && (selectedElement || (selectedElementIds.length === 0 && selectedFrame)) && (
        <ShapeSettingsPanel
          elementType={selectedElement ? selectedElement.type : "frame"}
          elementName={
            selectedElement 
              ? selectedElement.type === "shape" && selectedElement.shapeType
                ? `Shape - ${selectedElement.shapeType.charAt(0).toUpperCase() + selectedElement.shapeType.slice(1)}`
                : selectedElement.text 
                  ? selectedElement.text.substring(0, 20)
                  : selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)
              : selectedFrame?.name
          }
          shapeType={selectedElement?.shapeType}
          backgroundColor={selectedFrame?.backgroundColor}
          fill={selectedElement?.fill || penColor}
          stroke={selectedElement?.stroke || penColor}
          strokeWidth={selectedElement?.strokeWidth || strokeWidth}
          width={selectedElement?.width || selectedFrame?.width}
          height={selectedElement?.height || selectedFrame?.height}
          x={selectedElement?.x}
          y={selectedElement?.y}
          opacity={selectedElement?.opacity || selectedFrame?.opacity || 100}
          cornerRadius={selectedElement?.cornerRadius || selectedFrame?.cornerRadius || 0}
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
          onClick={() => {
            setShowGeneratePanel(!showGeneratePanel);
            setShowImagePanel(false);
          }}
        >
          <Sparkles className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={`h-10 w-10 rounded-full bg-card/80 backdrop-blur-xl hover:scale-105 transition-transform ${
            showImagePanel ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => {
            setShowImagePanel(!showImagePanel);
            setShowGeneratePanel(false);
          }}
        >
          <ImageIcon className="h-4 w-4" />
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
      </div>
      
      {/* Zoom Controls */}
      <div className="fixed left-4 bottom-12 flex flex-row items-center gap-1 z-40 bg-card/80 backdrop-blur-xl rounded-full px-2 py-1 border shadow-sm">
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
        <div className="w-px h-3 bg-border mx-1" />
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
        onImageUpload={handleImageUpload}
        onAddFrame={handleAddFrame}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />
      
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

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        framePreview={selectedFrame?.image || undefined}
        frameName={selectedFrame?.name}
        onExport={(format, resolution) => {
          console.log(`Exporting as ${format} at ${resolution}px`);
          downloadPoster();
        }}
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
