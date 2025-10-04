import { useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ResizableFrame from "./ResizableFrame";
import DraggablePanel from "../Panels/DraggablePanel";
import ShapeSettingsPanel from "../Panels/ShapeSettingsPanel";
import PropertyPanel from "../Panels/PropertyPanel";
import BottomToolbar from "../Toolbar/BottomToolbar";
import EditorTopBar from "../TopBar/EditorTopBar";
import CanvasBackground from "./CanvasBackground";
import FrameBadge from "./FrameBadge";
import DrawingLayer from "./DrawingLayer";
import ShareDialog from "./ShareDialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Image as ImageIcon, Type, Palette } from "lucide-react";

interface Frame {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
  image: string | null;
  topCaption: string;
  bottomCaption: string;
  textColor: string;
  textAlign: "left" | "center" | "right";
  textSize: number;
  textOpacity: number;
  imageStyle: string;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  linkText: string;
  linkPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  gradientIntensity: number;
  flexDirection: "row" | "column";
  justifyContent: string;
  alignItems: string;
  gap: number;
}

export default function CanvasContainerNew() {
  const [projectTitle, setProjectTitle] = useState("Untitled Poster");
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
    },
  ]);
  const [selectedFrameId, setSelectedFrameId] = useState<string>("frame-1");
  const [activeTool, setActiveTool] = useState<string>("select");
  const [penColor, setPenColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);

  const [showImagePanel, setShowImagePanel] = useState(false);
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [showGeneratePanel, setShowGeneratePanel] = useState(false);
  const [showShapePanel, setShowShapePanel] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const selectedFrame = frames.find((f) => f.id === selectedFrameId);

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
    };
    setFrames([...frames, newFrame]);
    setSelectedFrameId(newFrame.id);
    toast.success("Frame added!");
  };

  const handleFrameUpdate = (id: string, updates: Partial<Frame>) => {
    setFrames(frames.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedFrameId) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        handleFrameUpdate(selectedFrameId, { image: imageUrl });
        toast.success("Image uploaded!");
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
        isSaving={isSaving}
      />

      {/* Canvas Area */}
      <div className="w-full h-full">
        {frames.map((frame) => (
          <div key={frame.id}>
            <FrameBadge
              name={frame.name}
              x={frame.x + frame.width / 2 - 40}
              y={frame.y}
              onChange={(name) => handleFrameUpdate(frame.id, { name })}
            />
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
              isSelected={frame.id === selectedFrameId}
              onUpdate={handleFrameUpdate}
              onSelect={() => setSelectedFrameId(frame.id)}
            />
          </div>
        ))}

        <DrawingLayer
          isActive={activeTool === "pen"}
          color={penColor}
          strokeWidth={strokeWidth}
        />
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
          onBrightnessChange={(val) => handleFrameUpdate(selectedFrameId, { brightness: val })}
          onContrastChange={(val) => handleFrameUpdate(selectedFrameId, { contrast: val })}
          onSaturationChange={(val) => handleFrameUpdate(selectedFrameId, { saturation: val })}
          onBlurChange={(val) => handleFrameUpdate(selectedFrameId, { blur: val })}
          onClose={() => setShowImagePanel(false)}
        />
      )}

      {showTextPanel && selectedFrame && (
        <DraggablePanel title="Text Settings" defaultPosition={{ x: window.innerWidth - 250, y: 150 }} onClose={() => setShowTextPanel(false)} className="w-48">
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Top Caption</Label>
              <Input
                value={selectedFrame.topCaption}
                onChange={(e) => handleFrameUpdate(selectedFrameId, { topCaption: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Bottom Caption</Label>
              <Input
                value={selectedFrame.bottomCaption}
                onChange={(e) => handleFrameUpdate(selectedFrameId, { bottomCaption: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </DraggablePanel>
      )}

      {showShapePanel && selectedFrame && (
        <ShapeSettingsPanel
          backgroundColor={selectedFrame.backgroundColor}
          fill={penColor}
          stroke={penColor}
          strokeWidth={strokeWidth}
          onBackgroundColorChange={(color) => handleFrameUpdate(selectedFrameId, { backgroundColor: color })}
          onFillChange={setPenColor}
          onStrokeChange={setPenColor}
          onStrokeWidthChange={setStrokeWidth}
          onAlign={handleAlign}
          onArrange={handleArrange}
          flexDirection={selectedFrame.flexDirection}
          justifyContent={selectedFrame.justifyContent}
          alignItems={selectedFrame.alignItems}
          gap={selectedFrame.gap}
          onFlexDirectionChange={(dir) => handleFrameUpdate(selectedFrameId, { flexDirection: dir })}
          onJustifyContentChange={(val) => handleFrameUpdate(selectedFrameId, { justifyContent: val })}
          onAlignItemsChange={(val) => handleFrameUpdate(selectedFrameId, { alignItems: val })}
          onGapChange={(val) => handleFrameUpdate(selectedFrameId, { gap: val })}
          onClose={() => setShowShapePanel(false)}
        />
      )}

      {/* Quick Action Buttons */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40">
        <Button
          variant={showGeneratePanel ? "default" : "outline"}
          size="icon"
          className="h-10 w-10 rounded-full bg-card/80 backdrop-blur-xl"
          onClick={() => setShowGeneratePanel(!showGeneratePanel)}
        >
          <Sparkles className="h-4 w-4" />
        </Button>
        <Button
          variant={showImagePanel ? "default" : "outline"}
          size="icon"
          className="h-10 w-10 rounded-full bg-card/80 backdrop-blur-xl"
          onClick={() => setShowImagePanel(!showImagePanel)}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={showTextPanel ? "default" : "outline"}
          size="icon"
          className="h-10 w-10 rounded-full bg-card/80 backdrop-blur-xl"
          onClick={() => setShowTextPanel(!showTextPanel)}
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button
          variant={showShapePanel ? "default" : "outline"}
          size="icon"
          className="h-10 w-10 rounded-full bg-card/80 backdrop-blur-xl"
          onClick={() => setShowShapePanel(!showShapePanel)}
        >
          <Palette className="h-4 w-4" />
        </Button>
      </div>

      <BottomToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onImageUpload={handleImageUpload}
        onAddFrame={handleAddFrame}
        onShowGenerate={() => setShowGeneratePanel(!showGeneratePanel)}
        onShowImage={() => setShowImagePanel(!showImagePanel)}
        onShowText={() => setShowTextPanel(!showTextPanel)}
        onShowColors={() => setShowShapePanel(!showShapePanel)}
        onAlign={handleAlign}
        onArrange={handleArrange}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />

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
