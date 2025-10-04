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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Image as ImageIcon, Layers } from "lucide-react";
import { Frame, Element } from "@/types/elements";

export default function CanvasContainerNew() {
  const [projectTitle, setProjectTitle] = useState("Untitled Poster");
  const [history, setHistory] = useState<Frame[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [frames, setFrames] = useState<Frame[]>([
    {
      id: "frame-1",
      name: "Frame 1",
      x: 100,
      y: 100,
      width: 400,
      height: 600,
      backgroundColor: "#000000",
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
      elements: [],
      cornerRadius: 0,
      opacity: 100,
      blendMode: "normal",
    },
  ]);
  const [selectedFrameId, setSelectedFrameId] = useState<string>("frame-1");
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<"select" | "pen" | "shape" | "text" | "image">("select");
  const [penColor, setPenColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
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

  // Save to history when frames change
  useEffect(() => {
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

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setFrames(JSON.parse(JSON.stringify(history[historyIndex - 1])));
      toast.success("Undone");
    } else {
      toast.info("Nothing to undo");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setFrames(JSON.parse(JSON.stringify(history[historyIndex + 1])));
      toast.success("Redone");
    } else {
      toast.info("Nothing to redo");
    }
  };

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
      backgroundColor: "#000000",
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

  const savePoster = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const posterData = {
        user_id: user.id,
        title: projectTitle,
        frames: frames,
      };

      const { error } = await (supabase as any).from("posters").insert(posterData);
      if (error) throw error;

      toast.success("Poster saved!");
    } catch (error: any) {
      console.error("Error saving poster:", error);
      toast.error(error.message || "Failed to save poster");
    } finally {
      setIsSaving(false);
    }
  };

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
    toast.info(`Align ${type} - coming soon!`);
  };

  const handleArrange = (type: string) => {
    toast.info(`Arrange ${type} - coming soon!`);
  };

  const handleShapeSelect = (shapeType: string) => {
    if (!selectedFrameId) return;
    
    const newElement: Element = {
      id: `element-${Date.now()}`,
      type: "shape",
      x: 50,
      y: 50,
      width: shapeType === "line" || shapeType === "arrow" ? 150 : 100,
      height: shapeType === "line" || shapeType === "arrow" ? 2 : 100,
      shapeType: shapeType as any,
      fill: penColor,
      stroke: penColor,
      opacity: 100,
      cornerRadius: 0,
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

  return (
    <div className="w-full h-screen relative overflow-hidden">
      <CanvasBackground />

      <EditorTopBar
        projectName={projectTitle}
        onProjectNameChange={setProjectTitle}
        onSave={savePoster}
        onDownload={downloadPoster}
        onExport={downloadPoster}
        onShare={() => setShowShareDialog(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        isSaving={isSaving}
      />

      {/* Canvas Area */}
      <div 
        className="w-full h-full"
        onMouseDown={(e) => {
          if (isPanning && e.button === 0) {
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
          }
        }}
        onMouseMove={(e) => {
          if (isPanning && e.buttons === 1) {
            setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
          }
        }}
        style={{
          transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
          transformOrigin: 'center',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          cursor: isPanning ? 'grab' : 'default'
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
                isSelected={frame.id === selectedFrameId}
                onUpdate={handleFrameUpdate}
                onSelect={() => setSelectedFrameId(frame.id)}
              >
                {/* Elements inside frame */}
                {(frame.elements || []).map((element) => (
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
                      blendMode={element.blendMode}
                      isSelected={selectedElementIds.includes(element.id)}
                      onUpdate={handleElementUpdate}
                      onSelect={(e) => handleElementSelect(element.id, e?.shiftKey || e?.ctrlKey || e?.metaKey)}
                      onDelete={() => handleElementDelete(element.id)}
                      onDuplicate={() => handleElementDuplicate(element.id)}
                    />
                  </CanvasContextMenu>
                ))}
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
          elementName={selectedElement ? `${selectedElement.type}` : selectedFrame?.name}
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
          imageFit={selectedElement?.imageFit}
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
          onImageFitChange={(fit) => selectedElement && handleElementUpdate(selectedElement.id, { imageFit: fit })}
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
      </div>
      
      {/* Zoom Controls */}
      <div className="fixed right-6 bottom-24 flex flex-col gap-2 z-40 bg-card/80 backdrop-blur-xl rounded-lg p-2 border">
        <button
          onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
          className="text-xs font-medium px-3 py-1 hover:bg-secondary rounded transition-colors"
        >
          +
        </button>
        <div className="text-xs font-medium text-center px-2">{Math.round(zoom * 100)}%</div>
        <button
          onClick={() => setZoom(prev => Math.max(0.1, prev - 0.1))}
          className="text-xs font-medium px-3 py-1 hover:bg-secondary rounded transition-colors"
        >
          -
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPanOffset({ x: 0, y: 0 });
          }}
          className="text-xs font-medium px-3 py-1 hover:bg-secondary rounded transition-colors border-t"
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
