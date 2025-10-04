import { ReactNode, useRef, useState } from "react";
import CanvasBackground from "./CanvasBackground";
import PosterPreview from "./PosterPreview";
import BottomToolbar from "../Toolbar/BottomToolbar";
import PropertyPanel from "../Panels/PropertyPanel";
import DraggablePanel from "../Panels/DraggablePanel";
import EditorTopBar from "../TopBar/EditorTopBar";
import SliderControl from "./SliderControl";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Sparkles, Loader2, RotateCcw } from "lucide-react";
import type { User } from "@supabase/supabase-js";

type ImageStyle = "cover" | "contain" | "fill" | "scale-down" | "none";

interface CanvasContainerProps {
  user: User | null;
}

export default function CanvasContainer({ user }: CanvasContainerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [caption, setCaption] = useState("");
  const [imageStyle, setImageStyle] = useState<ImageStyle>("cover");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editor states
  const [temperature, setTemperature] = useState(0);
  const [tint, setTint] = useState(0);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [highlights, setHighlights] = useState(0);
  const [shadows, setShadows] = useState(0);
  const [vibrance, setVibrance] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [hue, setHue] = useState(0);
  const [blur, setBlur] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [textColor, setTextColor] = useState("#ffffff");
  const [topCaption, setTopCaption] = useState("");
  const [bottomCaption, setBottomCaption] = useState("");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [textSize, setTextSize] = useState(3);
  const [textOpacity, setTextOpacity] = useState(100);
  const [linkText, setLinkText] = useState("");
  const [linkPosition, setLinkPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">("top-right");
  const [gradientIntensity, setGradientIntensity] = useState(80);

  // Panel visibility
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [showGeneratePanel, setShowGeneratePanel] = useState(true);

  const getFilterStyle = () => {
    const tempFilter = temperature > 0 
      ? `sepia(${Math.abs(temperature) / 100}) saturate(${1 + Math.abs(temperature) / 50})` 
      : temperature < 0 
      ? `hue-rotate(${temperature * 0.5}deg)` 
      : "";
    
    const tintFilter = tint > 0 
      ? `sepia(${Math.abs(tint) / 200}) hue-rotate(${tint * 3}deg)` 
      : tint < 0 
      ? `sepia(${Math.abs(tint) / 200}) hue-rotate(${tint * 3}deg)` 
      : "";

    return {
      objectFit: imageStyle as any,
      filter: `
        ${tempFilter} 
        ${tintFilter}
        brightness(${1 + brightness / 100}) 
        contrast(${1 + contrast / 100})
        saturate(${1 + (saturation + vibrance) / 100})
        hue-rotate(${hue}deg)
        blur(${blur}px)
      `.trim().replace(/\s+/g, ' '),
    };
  };

  const resetAll = () => {
    setTemperature(0);
    setTint(0);
    setBrightness(0);
    setContrast(0);
    setHighlights(0);
    setShadows(0);
    setVibrance(0);
    setSaturation(0);
    setHue(0);
    setBlur(0);
  };

  const handleImageUpload = (e?: React.ChangeEvent<HTMLInputElement>) => {
    const input = e?.target || fileInputRef.current;
    const file = input?.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
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

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-poster-caption', {
        body: { 
          description: description.trim(),
          imageContext: image ? "an uploaded image" : null
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCaption(data.caption);
      setBottomCaption(data.caption);
      setShowTextPanel(true);
      toast.success("Caption generated!");
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to generate caption");
    } finally {
      setIsGenerating(false);
    }
  };

  const savePoster = async () => {
    if (!image || !caption || !user) {
      toast.error("Please generate a poster first");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await (supabase as any).from('posters').insert({
        user_id: user.id,
        image_url: image,
        caption: caption,
        image_style: imageStyle,
      });

      if (error) throw error;
      toast.success("Poster saved!");
    } catch (error) {
      console.error('Error saving:', error);
      toast.error("Failed to save poster");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPoster = () => {
    if (!image) {
      toast.error("Please upload an image first");
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = 1200;
      canvas.height = 1600;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.filter = `brightness(${1 + brightness / 100}) contrast(${1 + contrast / 100}) saturate(${1 + (saturation + vibrance) / 100}) blur(${blur}px)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';

      const fontSizes = [40, 50, 60, 75, 90];
      const fontSize = fontSizes[textSize - 1] || 60;
      ctx.fillStyle = textColor;
      ctx.font = `bold ${fontSize}px 'Instrument Sans', Arial, sans-serif`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 20;
      ctx.globalAlpha = textOpacity / 100;
      ctx.textAlign = textAlign;
      const xPosition = textAlign === 'left' ? 80 : textAlign === 'right' ? canvas.width - 80 : canvas.width / 2;

      if (topCaption) {
        const topLines = topCaption.split('\n');
        const lineHeight = fontSize * 1.3;
        topLines.forEach((line, index) => {
          ctx.fillText(line, xPosition, 100 + (index * lineHeight));
        });
      }

      if (bottomCaption) {
        const gradientHeight = canvas.height * 0.4;
        const gradient = ctx.createLinearGradient(0, canvas.height - gradientHeight, 0, canvas.height);
        gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
        gradient.addColorStop(0.4, `rgba(0, 0, 0, ${gradientIntensity / 200})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${gradientIntensity / 100})`);
        ctx.globalAlpha = 1;
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height - gradientHeight, canvas.width, gradientHeight);

        ctx.globalAlpha = textOpacity / 100;
        ctx.fillStyle = textColor;
        const bottomLines = bottomCaption.split('\n');
        const lineHeight = fontSize * 1.3;
        const startY = canvas.height - (bottomLines.length * lineHeight) - 80;
        bottomLines.forEach((line, index) => {
          ctx.fillText(line, xPosition, startY + (index * lineHeight));
        });
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `poster-${Date.now()}.png`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success("Downloaded!");
        }
      });
    };
    img.src = image;
  };

  return (
    <>
      <EditorTopBar projectName="AI Poster Generator" onExport={downloadPoster} />
      
      <div className="h-screen w-full pt-14 relative overflow-hidden">
        <CanvasBackground pattern="dots" />
        
        {/* Center Canvas Area */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="w-[600px] h-[800px]">
            <PosterPreview
              image={image}
              topCaption={topCaption}
              bottomCaption={bottomCaption}
              backgroundColor={backgroundColor}
              textColor={textColor}
              textAlign={textAlign}
              textSize={textSize}
              textOpacity={textOpacity}
              imageStyle={imageStyle}
              filterStyle={getFilterStyle()}
              linkText={linkText}
              linkPosition={linkPosition}
              gradientIntensity={gradientIntensity}
            />
          </div>
        </div>

        {/* Floating Panels */}
        {showGeneratePanel && (
          <DraggablePanel
            title="Generate Caption"
            defaultPosition={{ x: 50, y: 100 }}
            onClose={() => setShowGeneratePanel(false)}
          >
            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-2">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your poster..."
                  className="min-h-24 text-sm"
                />
              </div>
              <Button
                onClick={generateCaption}
                disabled={isGenerating || !description.trim() || !image}
                size="sm"
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Caption
                  </>
                )}
              </Button>
            </div>
          </DraggablePanel>
        )}

        {showImagePanel && (
          <DraggablePanel
            title="Image Adjustments"
            defaultPosition={{ x: 50, y: 300 }}
            onClose={() => setShowImagePanel(false)}
          >
            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-2">Style</Label>
                <Select value={imageStyle} onValueChange={(v: ImageStyle) => setImageStyle(v)}>
                  <SelectTrigger className="h-8">
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
              <Button onClick={resetAll} variant="outline" size="sm" className="w-full">
                <RotateCcw className="w-3 h-3 mr-2" />
                Reset
              </Button>
            </div>
          </DraggablePanel>
        )}

        {showTextPanel && (
          <DraggablePanel
            title="Text Controls"
            defaultPosition={{ x: window.innerWidth - 450, y: 100 }}
            onClose={() => setShowTextPanel(false)}
          >
            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-2">Top Caption</Label>
                <Textarea
                  value={topCaption}
                  onChange={(e) => setTopCaption(e.target.value)}
                  placeholder="Top text..."
                  className="min-h-20 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs mb-2">Bottom Caption</Label>
                <Textarea
                  value={bottomCaption}
                  onChange={(e) => setBottomCaption(e.target.value)}
                  placeholder="Bottom text..."
                  className="min-h-20 text-sm"
                />
              </div>
              <SliderControl label="Text Size" value={textSize} onChange={setTextSize} min={1} max={5} step={1} />
              <SliderControl label="Opacity" value={textOpacity} onChange={setTextOpacity} min={0} max={100} />
              <div>
                <Label className="text-xs mb-2">Alignment</Label>
                <Select value={textAlign} onValueChange={(v: any) => setTextAlign(v)}>
                  <SelectTrigger className="h-8">
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

        <PropertyPanel />
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        
        <BottomToolbar
          onImageUpload={() => fileInputRef.current?.click()}
          onDownload={downloadPoster}
          onSave={savePoster}
          isSaving={isSaving}
        />
      </div>
    </>
  );
}
