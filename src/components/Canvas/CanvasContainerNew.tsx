import { useRef, useState } from "react";
import CanvasBackground from "./CanvasBackground";
import ResizableFrame from "./ResizableFrame";
import BottomToolbar from "../Toolbar/BottomToolbar";
import DraggablePanel from "../Panels/DraggablePanel";
import ColorPanel from "../Panels/ColorPanel";
import FrameBackgroundPanel from "./FrameBackgroundPanel";
import EditorTopBar from "../TopBar/EditorTopBar";
import EditableTitle from "./EditableTitle";
import SliderControl from "./SliderControl";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, RotateCcw } from "lucide-react";
import type { User } from "@supabase/supabase-js";

type ImageStyle = "cover" | "contain" | "fill" | "scale-down" | "none";

interface Frame {
  id: string;
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
  imageStyle: ImageStyle;
  linkText: string;
  linkPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  gradientIntensity: number;
}

interface CanvasContainerProps {
  user: User | null;
}

export default function CanvasContainer({ user }: CanvasContainerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [frames, setFrames] = useState<Frame[]>([
    {
      id: "frame-1",
      x: 400,
      y: 150,
      width: 400,
      height: 533,
      backgroundColor: "#000000",
      image: null,
      topCaption: "",
      bottomCaption: "",
      textColor: "#ffffff",
      textAlign: "center",
      textSize: 3,
      textOpacity: 100,
      imageStyle: "cover",
      linkText: "",
      linkPosition: "top-right",
      gradientIntensity: 80,
    },
  ]);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>("frame-1");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editor states for selected frame
  const [temperature, setTemperature] = useState(0);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [blur, setBlur] = useState(0);
  const [penColor, setPenColor] = useState("#000000");

  // Panel visibility
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [showGeneratePanel, setShowGeneratePanel] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [showFrameBgPanel, setShowFrameBgPanel] = useState(false);

  const selectedFrame = frames.find((f) => f.id === selectedFrameId);

  const getFilterStyle = () => {
    return {
      objectFit: selectedFrame?.imageStyle as any,
      filter: `brightness(${1 + brightness / 100}) contrast(${1 + contrast / 100}) saturate(${1 + saturation / 100}) blur(${blur}px)`,
    };
  };

  const handleAddFrame = () => {
    const newFrame: Frame = {
      id: `frame-${Date.now()}`,
      x: 100 + frames.length * 50,
      y: 100 + frames.length * 50,
      width: 400,
      height: 533,
      backgroundColor: "#000000",
      image: null,
      topCaption: "",
      bottomCaption: "",
      textColor: "#ffffff",
      textAlign: "center",
      textSize: 3,
      textOpacity: 100,
      imageStyle: "cover",
      linkText: "",
      linkPosition: "top-right",
      gradientIntensity: 80,
    };
    setFrames([...frames, newFrame]);
    setSelectedFrameId(newFrame.id);
    toast.success("Frame added");
  };

  const handleFrameUpdate = (id: string, updates: Partial<Frame>) => {
    setFrames(frames.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleImageUpload = (e?: React.ChangeEvent<HTMLInputElement>) => {
    const input = e?.target || fileInputRef.current;
    const file = input?.files?.[0];
    if (file && selectedFrame) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        handleFrameUpdate(selectedFrame.id, { image: imageData });
        setShowImagePanel(true);
        toast.success("Image uploaded");
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCaption = async () => {
    if (!description.trim()) {
      toast.error("Please describe your poster");
      return;
    }

    if (!selectedFrame?.image) {
      toast.error("Please upload an image first");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-poster-caption", {
        body: {
          description: description.trim(),
          imageContext: selectedFrame.image ? "an uploaded image" : null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      handleFrameUpdate(selectedFrame.id, { bottomCaption: data.caption });
      setShowTextPanel(true);
      toast.success("Caption generated!");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate caption");
    } finally {
      setIsGenerating(false);
    }
  };

  const savePoster = async () => {
    if (!selectedFrame?.image || !user) {
      toast.error("Please add an image first");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await (supabase as any).from("posters").insert({
        user_id: user.id,
        image_url: selectedFrame.image,
        caption: selectedFrame.bottomCaption || selectedFrame.topCaption || "",
        image_style: selectedFrame.imageStyle,
      });

      if (error) throw error;
      toast.success("Poster saved!");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save poster");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPoster = () => {
    if (!selectedFrame?.image) {
      toast.error("Please upload an image first");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = 1200;
      canvas.height = 1600;

      ctx.fillStyle = selectedFrame.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.filter = `brightness(${1 + brightness / 100}) contrast(${1 + contrast / 100}) saturate(${1 + saturation / 100}) blur(${blur}px)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.filter = "none";

      const fontSizes = [40, 50, 60, 75, 90];
      const fontSize = fontSizes[selectedFrame.textSize - 1] || 60;
      ctx.fillStyle = selectedFrame.textColor;
      ctx.font = `bold ${fontSize}px 'Instrument Sans', Arial, sans-serif`;
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 20;
      ctx.globalAlpha = selectedFrame.textOpacity / 100;
      ctx.textAlign = selectedFrame.textAlign;
      const xPosition =
        selectedFrame.textAlign === "left" ? 80 : selectedFrame.textAlign === "right" ? canvas.width - 80 : canvas.width / 2;

      if (selectedFrame.topCaption) {
        const topLines = selectedFrame.topCaption.split("\n");
        const lineHeight = fontSize * 1.3;
        topLines.forEach((line, index) => {
          ctx.fillText(line, xPosition, 100 + index * lineHeight);
        });
      }

      if (selectedFrame.bottomCaption) {
        const gradientHeight = canvas.height * 0.4;
        const gradient = ctx.createLinearGradient(0, canvas.height - gradientHeight, 0, canvas.height);
        gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
        gradient.addColorStop(0.4, `rgba(0, 0, 0, ${selectedFrame.gradientIntensity / 200})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${selectedFrame.gradientIntensity / 100})`);
        ctx.globalAlpha = 1;
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height - gradientHeight, canvas.width, gradientHeight);

        ctx.globalAlpha = selectedFrame.textOpacity / 100;
        ctx.fillStyle = selectedFrame.textColor;
        const bottomLines = selectedFrame.bottomCaption.split("\n");
        const lineHeight = fontSize * 1.3;
        const startY = canvas.height - bottomLines.length * lineHeight - 80;
        bottomLines.forEach((line, index) => {
          ctx.fillText(line, xPosition, startY + index * lineHeight);
        });
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `poster-${Date.now()}.png`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success("Downloaded!");
        }
      });
    };
    img.src = selectedFrame.image;
  };

  return (
    <>
      <div className="h-screen w-full relative overflow-hidden">
        <CanvasBackground pattern="dots" />

        {/* Editable Title at Top */}
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-xl border shadow-lg">
            <EditableTitle value={projectTitle} onChange={setProjectTitle} />
          </div>
        </div>

        {/* Canvas Area */}
        <div className="absolute inset-0">
          {frames.map((frame) => (
            <ResizableFrame
              key={frame.id}
              {...frame}
              filterStyle={getFilterStyle()}
              isSelected={selectedFrameId === frame.id}
              onSelect={() => setSelectedFrameId(frame.id)}
              onUpdate={handleFrameUpdate}
            />
          ))}
        </div>

        {/* Floating Panels */}
        {showGeneratePanel && (
          <DraggablePanel
            title="Generate"
            defaultPosition={{ x: 50, y: 100 }}
            onClose={() => setShowGeneratePanel(false)}
            className="w-64"
          >
            <div className="space-y-2">
              <div>
                <Label className="text-xs mb-1.5">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your poster..."
                  className="min-h-20 text-xs"
                />
              </div>
              <Button onClick={generateCaption} disabled={isGenerating || !description.trim() || !selectedFrame?.image} size="sm" className="w-full gap-2 h-7">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </DraggablePanel>
        )}

        {showImagePanel && selectedFrame && (
          <DraggablePanel
            title="Image"
            defaultPosition={{ x: 50, y: 280 }}
            onClose={() => setShowImagePanel(false)}
            className="w-56"
          >
            <div className="space-y-2">
              <div>
                <Label className="text-xs mb-1.5">Style</Label>
                <Select
                  value={selectedFrame.imageStyle}
                  onValueChange={(v: ImageStyle) => handleFrameUpdate(selectedFrame.id, { imageStyle: v })}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="contain">Contain</SelectItem>
                    <SelectItem value="fill">Fill</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <SliderControl label="Brightness" value={brightness} onChange={setBrightness} min={-100} max={100} />
              <SliderControl label="Contrast" value={contrast} onChange={setContrast} min={-100} max={100} />
              <SliderControl label="Saturation" value={saturation} onChange={setSaturation} min={-100} max={100} />
              <SliderControl label="Blur" value={blur} onChange={setBlur} min={0} max={20} />
              <Button onClick={() => { setBrightness(0); setContrast(0); setSaturation(0); setBlur(0); }} variant="outline" size="sm" className="w-full h-7 text-xs">
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>
          </DraggablePanel>
        )}

        {showTextPanel && selectedFrame && (
          <DraggablePanel
            title="Text"
            defaultPosition={{ x: window.innerWidth - 350, y: 100 }}
            onClose={() => setShowTextPanel(false)}
            className="w-64"
          >
            <div className="space-y-2">
              <div>
                <Label className="text-xs mb-1.5">Top Caption</Label>
                <Textarea
                  value={selectedFrame.topCaption}
                  onChange={(e) => handleFrameUpdate(selectedFrame.id, { topCaption: e.target.value })}
                  placeholder="Top text..."
                  className="min-h-16 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5">Bottom Caption</Label>
                <Textarea
                  value={selectedFrame.bottomCaption}
                  onChange={(e) => handleFrameUpdate(selectedFrame.id, { bottomCaption: e.target.value })}
                  placeholder="Bottom text..."
                  className="min-h-16 text-xs"
                />
              </div>
              <SliderControl
                label="Size"
                value={selectedFrame.textSize}
                onChange={(v) => handleFrameUpdate(selectedFrame.id, { textSize: v })}
                min={1}
                max={5}
                step={1}
              />
              <SliderControl
                label="Opacity"
                value={selectedFrame.textOpacity}
                onChange={(v) => handleFrameUpdate(selectedFrame.id, { textOpacity: v })}
                min={0}
                max={100}
              />
              <div>
                <Label className="text-xs mb-1.5">Alignment</Label>
                <Select
                  value={selectedFrame.textAlign}
                  onValueChange={(v: any) => handleFrameUpdate(selectedFrame.id, { textAlign: v })}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DraggablePanel>
        )}

        {showColorPanel && (
          <ColorPanel
            selectedColor={penColor}
            onColorSelect={(color) => {
              setPenColor(color);
              toast.success("Pen color updated");
            }}
            onClose={() => setShowColorPanel(false)}
          />
        )}

        {showFrameBgPanel && selectedFrame && (
          <FrameBackgroundPanel
            backgroundColor={selectedFrame.backgroundColor}
            onBackgroundColorChange={(color) => handleFrameUpdate(selectedFrame.id, { backgroundColor: color })}
            onClose={() => setShowFrameBgPanel(false)}
          />
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

        <BottomToolbar
          onImageUpload={() => fileInputRef.current?.click()}
          onDownload={downloadPoster}
          onSave={savePoster}
          onAddFrame={handleAddFrame}
          isSaving={isSaving}
        />

        {/* Quick action buttons for panels */}
        <div className="fixed left-4 top-16 z-40 flex flex-col gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowGeneratePanel(!showGeneratePanel)} className="h-7 text-xs">
            Generate
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowImagePanel(!showImagePanel)} className="h-7 text-xs">
            Image
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowTextPanel(!showTextPanel)} className="h-7 text-xs">
            Text
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowColorPanel(!showColorPanel)} className="h-7 text-xs">
            Colors
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowFrameBgPanel(!showFrameBgPanel)} className="h-7 text-xs">
            Background
          </Button>
        </div>
      </div>
    </>
  );
}
