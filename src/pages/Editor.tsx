import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Save, Loader2, Eraser, RotateCcw, Sparkles, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SliderWithControls } from "@/components/ui/slider-with-controls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { removeBackground } from "@/lib/backgroundRemoval";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Poster {
  id: string;
  image_url: string;
  caption: string;
  image_style: string;
  created_at: string;
}

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [poster, setPoster] = useState<Poster | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isRegeneratingCaption, setIsRegeneratingCaption] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [topCaption, setTopCaption] = useState<string>("");
  const [bottomCaption, setBottomCaption] = useState<string>("");
  const [postContext, setPostContext] = useState<string>("");
  const [linkText, setLinkText] = useState<string>("");
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [linkPosition, setLinkPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">("top-right");
  const [backgroundColor, setBackgroundColor] = useState<string>("#000000");
  const [textColor, setTextColor] = useState<string>("#ffffff");

  // Image controls - Light
  const [temperature, setTemperature] = useState(0);
  const [tint, setTint] = useState(0);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [highlights, setHighlights] = useState(0);
  const [shadows, setShadows] = useState(0);
  const [whites, setWhites] = useState(0);
  const [blacks, setBlacks] = useState(0);

  // Image controls - Color
  const [vibrance, setVibrance] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [hue, setHue] = useState(0);

  // Image controls - Effects
  const [blur, setBlur] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [imageStyle, setImageStyle] = useState<string>("cover");

  // Text controls
  const [textPosition, setTextPosition] = useState<"bottom" | "top" | "center">("bottom");
  const [textSize, setTextSize] = useState(3);
  const [textOpacity, setTextOpacity] = useState(100);
  const [gradientIntensity, setGradientIntensity] = useState(80);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");

  useEffect(() => {
    if (id) {
      fetchPoster();
    }
  }, [id]);

  const fetchPoster = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('posters')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPoster(data);
        setImageStyle(data.image_style);
        
        // Try to parse dual captions if stored, fallback to single caption
        try {
          const parsed = JSON.parse(data.caption);
          if (parsed.top !== undefined || parsed.bottom !== undefined) {
            setTopCaption(parsed.top || "");
            setBottomCaption(parsed.bottom || "");
          } else {
            setBottomCaption(data.caption);
          }
        } catch {
          setBottomCaption(data.caption);
        }

        // Load editor settings if they exist
        if (data.editor_settings && typeof data.editor_settings === 'object' && !Array.isArray(data.editor_settings)) {
          const settings = data.editor_settings as Record<string, any>;
          if (settings.temperature !== undefined) setTemperature(settings.temperature as number);
          if (settings.tint !== undefined) setTint(settings.tint as number);
          if (settings.brightness !== undefined) setBrightness(settings.brightness as number);
          if (settings.contrast !== undefined) setContrast(settings.contrast as number);
          if (settings.highlights !== undefined) setHighlights(settings.highlights as number);
          if (settings.shadows !== undefined) setShadows(settings.shadows as number);
          if (settings.whites !== undefined) setWhites(settings.whites as number);
          if (settings.blacks !== undefined) setBlacks(settings.blacks as number);
          if (settings.vibrance !== undefined) setVibrance(settings.vibrance as number);
          if (settings.saturation !== undefined) setSaturation(settings.saturation as number);
          if (settings.hue !== undefined) setHue(settings.hue as number);
          if (settings.blur !== undefined) setBlur(settings.blur as number);
          if (settings.sepia !== undefined) setSepia(settings.sepia as number);
          if (settings.grayscale !== undefined) setGrayscale(settings.grayscale as number);
          if (settings.textSize !== undefined) setTextSize(settings.textSize as number);
          if (settings.textOpacity !== undefined) setTextOpacity(settings.textOpacity as number);
          if (settings.gradientIntensity !== undefined) setGradientIntensity(settings.gradientIntensity as number);
          if (settings.textAlign !== undefined) setTextAlign(settings.textAlign as "left" | "center" | "right");
          if (settings.backgroundColor !== undefined) setBackgroundColor(settings.backgroundColor as string);
          if (settings.textColor !== undefined) setTextColor(settings.textColor as string);
          if (settings.linkText !== undefined) setLinkText(settings.linkText as string);
          if (settings.linkUrl !== undefined) setLinkUrl(settings.linkUrl as string);
          if (settings.linkPosition !== undefined) setLinkPosition(settings.linkPosition as "top-left" | "top-right" | "bottom-left" | "bottom-right");
          if (settings.postContext !== undefined) setPostContext(settings.postContext as string);
        }
      }
    } catch (error) {
      console.error('Error fetching poster:', error);
      toast.error("Failed to load poster");
      navigate("/gallery");
    } finally {
      setIsLoading(false);
    }
  };

  const getFilterStyle = () => {
    const brightnessVal = 100 + brightness;
    const contrastVal = 100 + contrast;
    const saturateVal = 100 + saturation;
    const vibranceEffect = 100 + vibrance;
    
    return {
      filter: `brightness(${brightnessVal}%) contrast(${contrastVal}%) saturate(${saturateVal}%) blur(${blur}px) hue-rotate(${hue}deg) sepia(${sepia}%) grayscale(${grayscale}%)`,
      objectFit: imageStyle as any,
    };
  };

  const getTextPositionClass = () => {
    switch (textPosition) {
      case "top": return "items-start pt-12";
      case "center": return "items-center";
      case "bottom": default: return "items-end pb-12";
    }
  };

  const getTextSizeClass = () => {
    const sizes = ["text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl"];
    return sizes[textSize - 1] || "text-3xl";
  };

  const resetAll = () => {
    setTemperature(0);
    setTint(0);
    setBrightness(0);
    setContrast(0);
    setHighlights(0);
    setShadows(0);
    setWhites(0);
    setBlacks(0);
    setVibrance(0);
    setSaturation(0);
    setHue(0);
    setBlur(0);
    setSepia(0);
    setGrayscale(0);
    setTextPosition("bottom");
    setTextSize(3);
    setTextOpacity(100);
    setGradientIntensity(80);
    toast.success("Reset to defaults");
  };

  const savePoster = async () => {
    if (!poster) return;
    setIsSaving(true);
    try {
      // Prepare the caption data
      const captionData = JSON.stringify({
        top: topCaption,
        bottom: bottomCaption
      });

      // Prepare all editor settings
      const editorSettings = {
        temperature,
        tint,
        brightness,
        contrast,
        highlights,
        shadows,
        whites,
        blacks,
        vibrance,
        saturation,
        hue,
        blur,
        sepia,
        grayscale,
        textSize,
        textOpacity,
        gradientIntensity,
        textAlign,
        backgroundColor,
        textColor,
        linkText,
        linkUrl,
        linkPosition,
        postContext
      };

      // Save all poster settings
      const { error } = await (supabase as any)
        .from('posters')
        .update({ 
          caption: captionData,
          image_style: imageStyle,
          image_url: processedImageUrl || poster.image_url,
          editor_settings: editorSettings
        })
        .eq('id', poster.id);

      if (error) throw error;
      toast.success("All changes saved!");
    } catch (error) {
      console.error('Error saving:', error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!poster) return;
    
    setIsRemovingBg(true);
    try {
      toast.info("Removing background... This may take a moment");
      const imageUrl = processedImageUrl || poster.image_url;
      const result = await removeBackground(imageUrl);
      setProcessedImageUrl(result);
      toast.success("Background removed successfully!");
    } catch (error) {
      console.error('Error removing background:', error);
      toast.error("Failed to remove background");
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleRegenerateCaption = async () => {
    if (!poster) return;
    
    setIsRegeneratingCaption(true);
    try {
      toast.info("Generating new caption...");
      const { data, error } = await supabase.functions.invoke('generate-poster-caption', {
        body: { 
          description: postContext || "Create an engaging marketing caption",
          imageContext: postContext
        }
      });

      if (error) throw error;
      if (data?.caption) {
        setBottomCaption(data.caption);
        toast.success("New caption generated!");
      }
    } catch (error) {
      console.error('Error regenerating caption:', error);
      toast.error("Failed to generate new caption");
    } finally {
      setIsRegeneratingCaption(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !poster) return;

    setIsUploadingImage(true);
    try {
      toast.info("Uploading new image...");
      
      // Convert image to base64 data URL
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Update database with base64 image
        const { error: updateError } = await supabase
          .from<any>('posters')
          .update({ image_url: base64String })
          .eq('id', poster.id);

        if (updateError) {
          console.error('Error updating image:', updateError);
          toast.error("Failed to upload image");
          setIsUploadingImage(false);
          return;
        }

        setPoster({ ...poster, image_url: base64String });
        setProcessedImageUrl(null);
        toast.success("Image updated successfully!");
        setIsUploadingImage(false);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };

      reader.onerror = () => {
        console.error('Error reading file');
        toast.error("Failed to read image file");
        setIsUploadingImage(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Failed to upload image");
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!poster) return;
    
    try {
      // Clear the image from database
      const { error } = await supabase
        .from<any>('posters')
        .update({ image_url: '' })
        .eq('id', poster.id);

      if (error) throw error;

      setPoster({ ...poster, image_url: '' });
      setProcessedImageUrl(null);
      toast.success("Image cleared successfully!");
    } catch (error) {
      console.error('Error clearing image:', error);
      toast.error("Failed to clear image");
    }
  };

  const getLinkPositionClass = () => {
    switch (linkPosition) {
      case "top-left": return "top-4 left-4";
      case "top-right": return "top-4 right-4";
      case "bottom-left": return "bottom-4 left-4";
      case "bottom-right": return "bottom-4 right-4";
      default: return "top-4 right-4";
    }
  };

  const downloadPoster = () => {
    if (!poster) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = 1200;
      canvas.height = 1600;

      const brightnessVal = 100 + brightness;
      const contrastVal = 100 + contrast;
      const saturateVal = 100 + saturation;
      
      ctx.filter = `brightness(${brightnessVal}%) contrast(${contrastVal}%) saturate(${saturateVal}%) blur(${blur}px) hue-rotate(${hue}deg) sepia(${sepia}%) grayscale(${grayscale}%)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
      gradient.addColorStop(0, `rgba(0, 0, 0, ${gradientIntensity / 200})`);
      gradient.addColorStop(1, `rgba(0, 0, 0, ${gradientIntensity / 100})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = `rgba(255, 255, 255, ${textOpacity / 100})`;
      const fontSize = 40 + (textSize * 10);
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 20;

      const lines = [...(topCaption ? topCaption.split('\n') : []), ...(bottomCaption ? bottomCaption.split('\n') : [])];
      const lineHeight = fontSize + 20;
      let startY: number;

      if (textPosition === 'top') {
        startY = 100;
      } else if (textPosition === 'center') {
        startY = (canvas.height - (lines.length * lineHeight)) / 2;
      } else {
        startY = canvas.height - (lines.length * lineHeight) - 100;
      }

      // Apply text color
      ctx.fillStyle = textColor;
      ctx.globalAlpha = textOpacity / 100;

      // Apply text alignment
      if (textAlign === 'center') {
        ctx.textAlign = 'center';
      } else if (textAlign === 'right') {
        ctx.textAlign = 'right';
      } else {
        ctx.textAlign = 'left';
      }

      lines.forEach((line, index) => {
        const x = textAlign === 'center' ? canvas.width / 2 : textAlign === 'right' ? canvas.width - 80 : 80;
        ctx.fillText(line, x, startY + (index * lineHeight));
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `poster-edited-${Date.now()}.png`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success("Downloaded!");
        }
      });
    };
    img.src = processedImageUrl || poster.image_url;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!poster) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <header className="border-b bg-card px-8 py-4">
          <div className="flex items-center justify-between max-w-7xl">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate("/gallery")}
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Edit Poster</h1>
                <p className="text-sm text-muted-foreground">Fine-tune your marketing poster</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Button onClick={resetAll} variant="ghost" size="sm" className="rounded-full">
                Reset All
              </Button>
              <Button onClick={savePoster} disabled={isSaving} variant="ghost" size="icon" className="rounded-full">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </Button>
              <Button onClick={downloadPoster} size="icon" variant="ghost" className="rounded-full">
                <Download className="w-4 h-4" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-8">
          <Card className="border shadow-sm overflow-hidden">
            <div className="grid lg:grid-cols-[280px,1fr,320px]">
              {/* Left Sidebar - Adjustments */}
              <div className="border-r">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-sm">Adjust</h3>
                </div>
                
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="p-4 space-y-6">
                  {/* Image Upload */}
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="flex-1 rounded-full"
                      variant="ghost"
                      size="sm"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Uploading
                        </>
                      ) : (
                        <>
                          <Upload className="w-3 h-3 mr-1" />
                          Change
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={handleRemoveImage}
                      variant="ghost"
                      className="flex-1 rounded-full"
                      size="sm"
                    >
                      <Eraser className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </div>

                  <Separator />

                  {/* Image Fit */}
                  <div>
                    <Label className="text-xs font-medium mb-2 block">Image Fit</Label>
                    <Select value={imageStyle} onValueChange={setImageStyle}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Cover</SelectItem>
                        <SelectItem value="contain">Contain</SelectItem>
                        <SelectItem value="fill">Fill</SelectItem>
                        <SelectItem value="scale-down">Scale down</SelectItem>
                        <SelectItem value="none">Original</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <Separator />

                  {/* White Balance */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium">White balance</Label>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Temperature</span>
                        <span className="text-xs font-medium">{temperature}</span>
                      </div>
                      <SliderWithControls
                        value={[temperature]}
                        onValueChange={(v) => setTemperature(v[0])}
                        min={-100}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Tint</span>
                        <span className="text-xs font-medium">{tint}</span>
                      </div>
                      <SliderWithControls
                        value={[tint]}
                        onValueChange={(v) => setTint(v[0])}
                        min={-100}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Light */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium">Light</Label>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Brightness</span>
                        <span className="text-xs font-medium">{brightness}</span>
                      </div>
                      <SliderWithControls
                        value={[brightness]}
                        onValueChange={(v) => setBrightness(v[0])}
                        min={-100}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Contrast</span>
                        <span className="text-xs font-medium">{contrast}</span>
                      </div>
                      <SliderWithControls
                        value={[contrast]}
                        onValueChange={(v) => setContrast(v[0])}
                        min={-100}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Highlights</span>
                        <span className="text-xs font-medium">{highlights}</span>
                      </div>
                      <SliderWithControls
                        value={[highlights]}
                        onValueChange={(v) => setHighlights(v[0])}
                        min={-100}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Shadows</span>
                        <span className="text-xs font-medium">{shadows}</span>
                      </div>
                      <SliderWithControls
                        value={[shadows]}
                        onValueChange={(v) => setShadows(v[0])}
                        min={-100}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Whites</span>
                        <span className="text-xs font-medium">{whites}</span>
                      </div>
                      <SliderWithControls
                        value={[whites]}
                        onValueChange={(v) => setWhites(v[0])}
                        min={-100}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Blacks</span>
                        <span className="text-xs font-medium">{blacks}</span>
                      </div>
                      <SliderWithControls
                        value={[blacks]}
                        onValueChange={(v) => setBlacks(v[0])}
                        min={-100}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Color */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium">Color</Label>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Vibrance</span>
                        <span className="text-xs font-medium">{vibrance}</span>
                      </div>
                      <SliderWithControls
                        value={[vibrance]}
                        onValueChange={(v) => setVibrance(v[0])}
                        min={-100}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Saturation</span>
                        <span className="text-xs font-medium">{saturation}</span>
                      </div>
                      <SliderWithControls
                        value={[saturation]}
                        onValueChange={(v) => setSaturation(v[0])}
                        min={-100}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Hue</span>
                        <span className="text-xs font-medium">{hue}°</span>
                      </div>
                      <SliderWithControls
                        value={[hue]}
                        onValueChange={(v) => setHue(v[0])}
                        min={0}
                        max={360}
                        step={1}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Effects */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium">Effects</Label>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Blur</span>
                        <span className="text-xs font-medium">{blur}px</span>
                      </div>
                      <SliderWithControls
                        value={[blur]}
                        onValueChange={(v) => setBlur(v[0])}
                        min={0}
                        max={10}
                        step={0.5}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Sepia</span>
                        <span className="text-xs font-medium">{sepia}%</span>
                      </div>
                      <SliderWithControls
                        value={[sepia]}
                        onValueChange={(v) => setSepia(v[0])}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Grayscale</span>
                        <span className="text-xs font-medium">{grayscale}%</span>
                      </div>
                      <SliderWithControls
                        value={[grayscale]}
                        onValueChange={(v) => setGrayscale(v[0])}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                  </div>


                  {/* Background Gradient - without color picker */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium">Background Gradient</Label>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Intensity</span>
                        <span className="text-xs font-medium">{gradientIntensity}%</span>
                      </div>
                      <SliderWithControls
                        value={[gradientIntensity]}
                        onValueChange={(v) => setGradientIntensity(v[0])}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Tools */}
                  <div className="space-y-2">
                    <Button 
                      onClick={handleRemoveBackground} 
                      disabled={isRemovingBg}
                      variant="ghost" 
                      className="w-full justify-start rounded-full"
                      size="sm"
                    >
                      {isRemovingBg ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Removing BG...
                        </>
                      ) : (
                        <>
                          <Eraser className="w-4 h-4 mr-2" />
                          Remove Background
                        </>
                      )}
                    </Button>

                    <Button 
                      onClick={resetAll}
                      variant="ghost" 
                      className="w-full justify-start rounded-full"
                      size="sm"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset adjustments
                    </Button>
                  </div>
                  </div>
                </ScrollArea>
              </div>

              {/* Preview Section */}
              <div className="flex flex-col">
                <div className="p-6 border-b flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Live Preview</h3>
                    <p className="text-xs text-muted-foreground mt-1">Changes apply in real-time</p>
                  </div>
                  
                  {/* Color Pickers - Top Center */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1.5">
                      <Label className="text-xs text-muted-foreground">Background</Label>
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border-2 cursor-pointer"
                        style={{ padding: '2px' }}
                      />
                    </div>
                    
                    <div className="flex flex-col items-center gap-1.5">
                      <Label className="text-xs text-muted-foreground">Text</Label>
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border-2 cursor-pointer"
                        style={{ padding: '2px' }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div 
                    className="aspect-[3/4] rounded border overflow-hidden relative"
                    style={{ backgroundColor }}
                  >
                    <img
                      src={processedImageUrl || poster.image_url}
                      alt="Poster"
                      className="w-full h-full"
                      style={getFilterStyle()}
                    />
                    
                    {/* Top Caption */}
                    {topCaption && (
                      <div className={`absolute top-0 left-0 right-0 flex ${textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center'} items-start pt-12 px-10`}>
                        <div className="space-y-2" style={{ opacity: textOpacity / 100 }}>
                          {topCaption.split('\n').map((line, i) => (
                            <p 
                              key={i} 
                              className={`${getTextSizeClass()} font-bold drop-shadow-lg text-${textAlign}`}
                              style={{ color: textColor }}
                            >
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Bottom Caption with Gradient */}
                    {bottomCaption && (
                      <div 
                        className={`absolute bottom-0 left-0 right-0 flex ${textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center'} items-end pb-12 px-10`}
                        style={{
                          background: `linear-gradient(to top, rgba(0,0,0,${gradientIntensity / 100}) 0%, rgba(0,0,0,${gradientIntensity / 200}) 60%, transparent 100%)`
                        }}
                      >
                        <div className="space-y-2" style={{ opacity: textOpacity / 100 }}>
                          {bottomCaption.split('\n').map((line, i) => (
                            <p 
                              key={i} 
                              className={`${getTextSizeClass()} font-bold drop-shadow-lg text-${textAlign}`}
                              style={{ color: textColor }}
                            >
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Glassmorphic Link Badge */}
                    {linkText && linkUrl && (
                      <a
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`absolute ${getLinkPositionClass()} animate-fade-in`}
                      >
                        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-4 py-2 shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-105">
                          <span className="text-white text-sm font-semibold drop-shadow-lg">
                            {linkText}
                          </span>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Caption & Link Controls */}
              <div className="border-l">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-sm">Caption & Link</h3>
                </div>
                
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="p-4 space-y-6">
                    {/* Post Context */}
                    <div className="space-y-3">
                      <Label className="text-xs font-medium">Post Context</Label>
                      <Textarea
                        value={postContext}
                        onChange={(e) => setPostContext(e.target.value)}
                        placeholder="Describe your post context (e.g., 'Product launch for eco-friendly water bottles targeting millennials')..."
                        className="text-xs min-h-[80px] resize-none"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        This context helps AI generate better captions
                      </p>
                    </div>

                    <Separator />

                    {/* Top Caption */}
                    <div className="space-y-3">
                      <Label className="text-xs font-medium">Top Caption</Label>
                      <Textarea
                        value={topCaption}
                        onChange={(e) => setTopCaption(e.target.value)}
                        placeholder="Enter top caption (optional)..."
                        className="text-xs min-h-[60px] resize-none"
                      />
                    </div>

                    <Separator />

                    {/* Bottom Caption */}
                    <div className="space-y-3">
                      <Label className="text-xs font-medium">Bottom Caption</Label>
                      <Textarea
                        value={bottomCaption}
                        onChange={(e) => setBottomCaption(e.target.value)}
                        placeholder="Enter bottom caption..."
                        className="text-xs min-h-[80px] resize-none"
                      />

                      <Button 
                        onClick={handleRegenerateCaption}
                        disabled={isRegeneratingCaption}
                        variant="ghost" 
                        className="w-full justify-start rounded-full"
                        size="sm"
                      >
                        {isRegeneratingCaption ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Generate New Caption
                          </>
                        )}
                      </Button>
                    </div>

                    <Separator />

                    {/* Text Controls */}
                    <div className="space-y-3">
                      <Label className="text-xs font-medium">Text Style</Label>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Alignment</Label>
                        <Select value={textAlign} onValueChange={(v: any) => setTextAlign(v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Size</span>
                          <span className="text-xs font-medium">{textSize}</span>
                        </div>
                        <SliderWithControls
                          value={[textSize]}
                          onValueChange={(v) => setTextSize(v[0])}
                          min={1}
                          max={5}
                          step={1}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Opacity</span>
                          <span className="text-xs font-medium">{textOpacity}%</span>
                        </div>
                        <SliderWithControls
                          value={[textOpacity]}
                          onValueChange={(v) => setTextOpacity(v[0])}
                          min={0}
                          max={100}
                          step={5}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Link Badge */}
                    <div className="space-y-3">
                      <Label className="text-xs font-medium">Link Badge</Label>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Link Text</Label>
                        <input
                          type="text"
                          value={linkText}
                          onChange={(e) => setLinkText(e.target.value)}
                          placeholder="e.g., Shop Now"
                          className="w-full h-8 px-3 text-xs rounded-md border bg-background"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Link URL</Label>
                        <input
                          type="url"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full h-8 px-3 text-xs rounded-md border bg-background"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Badge Position</Label>
                        <Select value={linkPosition} onValueChange={(v: any) => setLinkPosition(v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top-left">Top Left</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    {/* Background Gradient */}
                    <div className="space-y-3">
                      <Label className="text-xs font-medium">Background Gradient</Label>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Intensity</span>
                          <span className="text-xs font-medium">{gradientIntensity}%</span>
                        </div>
                        <SliderWithControls
                          value={[gradientIntensity]}
                          onValueChange={(v) => setGradientIntensity(v[0])}
                          min={0}
                          max={100}
                          step={5}
                        />
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
