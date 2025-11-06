import { useState, useRef, useEffect } from "react";
import { Upload, Sparkles, Download, Loader2, Save, FileImage, Eraser, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { User, Session } from "@supabase/supabase-js";
import Sidebar from "./Sidebar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SliderWithControls } from "@/components/ui/slider-with-controls";
import { MediaLibraryPanel } from "@/components/Panels/MediaLibraryPanel";

type ImageStyle = "cover" | "contain" | "fill" | "scale-down" | "none";

const promptSuggestions = [
  "Summer Sale Promotion",
  "New Product Launch",
  "Holiday Special Offer",
  "Brand Awareness Campaign",
  "Event Announcement"
];

export default function PosterGenerator() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [caption, setCaption] = useState("");
  const [imageStyle, setImageStyle] = useState<ImageStyle>("cover");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [recentPosters, setRecentPosters] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Editor states
  const [temperature, setTemperature] = useState(0);
  const [tint, setTint] = useState(0);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [highlights, setHighlights] = useState(0);
  const [shadows, setShadows] = useState(0);
  const [whites, setWhites] = useState(0);
  const [blacks, setBlacks] = useState(0);
  const [vibrance, setVibrance] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [hue, setHue] = useState(0);
  const [blur, setBlur] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [textColor, setTextColor] = useState("#ffffff");
  const [postContext, setPostContext] = useState("");
  const [topCaption, setTopCaption] = useState("");
  const [bottomCaption, setBottomCaption] = useState("");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [textSize, setTextSize] = useState(3);
  const [textOpacity, setTextOpacity] = useState(100);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkPosition, setLinkPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">("top-right");
  const [gradientIntensity, setGradientIntensity] = useState(80);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else {
        fetchRecentPosters(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else {
        fetchRecentPosters(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchRecentPosters = async (userId: string) => {
    const { data, error } = await (supabase as any)
      .from("posters")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching recent posters:", error);
      return;
    }

    setRecentPosters(data || []);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setShowEditor(true);
        toast.success("Image uploaded - you can now adjust settings and generate");
      };
      reader.readAsDataURL(file);
    }
  };

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
      boxShadow: highlights > 0 ? `inset 0 ${highlights}px ${highlights * 2}px rgba(255,255,255,0.1)` : 
                 highlights < 0 ? `inset 0 ${highlights}px ${Math.abs(highlights) * 2}px rgba(0,0,0,0.1)` : undefined,
    };
  };

  const getTextSizeClass = () => {
    const sizes = ["text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl"];
    return sizes[textSize - 1] || "text-2xl";
  };

  const getLinkPositionClass = () => {
    const positions = {
      "top-left": "top-6 left-6",
      "top-right": "top-6 right-6",
      "bottom-left": "bottom-6 left-6",
      "bottom-right": "bottom-6 right-6"
    };
    return positions[linkPosition];
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
      setPostContext(description.trim()); // Keep context in Post Context field
      setShowEditor(true);
      toast.success("Caption generated! Now you can edit your poster");
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
      toast.error("Please generate a poster first");
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

      // Fill background color
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply image filters manually (approximation since canvas doesn't support CSS filters directly)
      ctx.filter = `brightness(${1 + brightness / 100}) contrast(${1 + contrast / 100}) saturate(${1 + (saturation + vibrance) / 100}) blur(${blur}px)`;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Reset filter for text
      ctx.filter = 'none';

      // Calculate font size from textSize (1-5 scale to pixel values)
      const fontSizes = [40, 50, 60, 75, 90];
      const fontSize = fontSizes[textSize - 1] || 60;

      // Set text properties
      ctx.fillStyle = textColor;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 20;
      ctx.globalAlpha = textOpacity / 100;

      // Text alignment
      ctx.textAlign = textAlign;
      const xPosition = textAlign === 'left' ? 80 : textAlign === 'right' ? canvas.width - 80 : canvas.width / 2;

      // Draw top caption
      if (topCaption) {
        const topLines = topCaption.split('\n');
        const lineHeight = fontSize * 1.3;
        topLines.forEach((line, index) => {
          ctx.fillText(line, xPosition, 100 + (index * lineHeight));
        });
      }

      // Draw bottom caption with gradient overlay
      if (bottomCaption) {
        // Draw gradient overlay for bottom text
        const gradientHeight = canvas.height * 0.4;
        const gradient = ctx.createLinearGradient(0, canvas.height - gradientHeight, 0, canvas.height);
        gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
        gradient.addColorStop(0.4, `rgba(0, 0, 0, ${gradientIntensity / 200})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${gradientIntensity / 100})`);
        ctx.globalAlpha = 1;
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height - gradientHeight, canvas.width, gradientHeight);

        // Draw bottom text
        ctx.globalAlpha = textOpacity / 100;
        ctx.fillStyle = textColor;
        const bottomLines = bottomCaption.split('\n');
        const lineHeight = fontSize * 1.3;
        const startY = canvas.height - (bottomLines.length * lineHeight) - 80;
        
        bottomLines.forEach((line, index) => {
          ctx.fillText(line, xPosition, startY + (index * lineHeight));
        });
      }

      // Draw link badge if present
      if (linkText && linkUrl) {
        ctx.globalAlpha = 1;
        const badgePadding = 20;
        const badgeHeight = 50;
        ctx.font = `600 20px Arial, sans-serif`;
        const textWidth = ctx.measureText(linkText).width;
        const badgeWidth = textWidth + (badgePadding * 2);
        
        // Position based on linkPosition
        let badgeX = 0, badgeY = 0;
        if (linkPosition === 'top-left') {
          badgeX = 50;
          badgeY = 50;
        } else if (linkPosition === 'top-right') {
          badgeX = canvas.width - badgeWidth - 50;
          badgeY = 50;
        } else if (linkPosition === 'bottom-left') {
          badgeX = 50;
          badgeY = canvas.height - badgeHeight - 50;
        } else {
          badgeX = canvas.width - badgeWidth - 50;
          badgeY = canvas.height - badgeHeight - 50;
        }
        
        // Draw glassmorphic badge
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        const radius = badgeHeight / 2;
        
        ctx.beginPath();
        ctx.moveTo(badgeX + radius, badgeY);
        ctx.lineTo(badgeX + badgeWidth - radius, badgeY);
        ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + radius);
        ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - radius);
        ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - radius, badgeY + badgeHeight);
        ctx.lineTo(badgeX + radius, badgeY + badgeHeight);
        ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - radius);
        ctx.lineTo(badgeX, badgeY + radius);
        ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw text
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(linkText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + 7);
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

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-8 py-12">
          {!showEditor ? (
            <div className="space-y-8">
              {/* Hero Section */}
              <div className="text-center space-y-3 mb-12">
                <h1 className="text-5xl font-bold text-foreground">
                  Create Posters not Pixels
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Upload your product and generate AI-powered marketing posters for personalized campaigns.
                </p>
              </div>

              {/* Main Input Card */}
              <Card className="max-w-4xl mx-auto p-6 border shadow-sm rounded-2xl">
                {/* Prompt Suggestions */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {promptSuggestions.map((suggestion, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-secondary/80 transition-colors px-3 py-1.5 rounded-full"
                      onClick={() => setDescription(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>

                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you want to build or search for..."
                  className="min-h-32 mb-4 bg-background border-muted text-base resize-none rounded-xl"
                />

                <div className="flex items-center justify-between">
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
                      variant="outline"
                      size="sm"
                      className="gap-2 rounded-full"
                    >
                      <Upload className="w-4 h-4" />
                      Add Image
                    </Button>
                  </div>

                  <Button
                    onClick={generateCaption}
                    disabled={isGenerating || !description.trim() || !image}
                    size="sm"
                    className="gap-2 rounded-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>

                {image && (
                  <div className="mt-4 p-4 border border-dashed rounded-xl bg-muted/30">
                    <img src={image} alt="Uploaded" className="max-h-40 mx-auto rounded-lg" />
                  </div>
                )}
              </Card>

              {/* Recent Activity Section */}
              <div className="max-w-4xl mx-auto mt-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Recent Posters</h2>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => navigate("/gallery")}
                    className="text-primary"
                  >
                    View all
                  </Button>
                </div>
                
                <Card className="border shadow-sm overflow-hidden">
                  {recentPosters.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-12">
                      No recent posters yet. Start by generating your first one!
                    </div>
                  ) : (
                    <div className="divide-y">
                      {recentPosters.map((poster) => (
                        <div 
                          key={poster.id} 
                          className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => navigate("/gallery")}
                        >
                          {/* Image Preview */}
                          <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-muted">
                            <img 
                              src={poster.image_url} 
                              alt="Poster preview" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {poster.caption || "Untitled Poster"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(poster.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => setShowEditor(false)}
                  variant="ghost"
                  size="sm"
                >
                  ← Back to Edit Prompt
                </Button>
                <div className="flex gap-2">
                  <Button onClick={() => setShowMediaLibrary(!showMediaLibrary)} variant="outline" size="sm">
                    <FileImage className="w-4 h-4 mr-1" /> {showMediaLibrary ? 'Hide' : 'Show'} Media
                  </Button>
                  <Button onClick={savePoster} disabled={isSaving} variant="outline" size="sm">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Save</>}
                  </Button>
                  <Button onClick={downloadPoster} size="sm">
                    <Download className="w-4 h-4 mr-1" /> Download
                  </Button>
                </div>
              </div>

              <Card className="border shadow-sm overflow-hidden">
                <div className="grid" style={{ gridTemplateColumns: showMediaLibrary ? '280px 1fr 320px 280px' : '280px 1fr 320px' }}>
                  {/* Left Sidebar - Adjustments */}
                  <div className="border-r">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-sm">Adjust</h3>
                    </div>
                    
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      <div className="p-4 space-y-6">
                        {/* Image Fit */}
                        <div>
                          <Label className="text-xs font-medium mb-2 block">Image Fit</Label>
                          <Select value={imageStyle} onValueChange={(v: ImageStyle) => setImageStyle(v)}>
                            <SelectTrigger className="h-7 text-xs rounded">
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
                        </div>

                        <Separator />

                        <Button onClick={resetAll} variant="outline" size="sm" className="w-full rounded-full">
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset adjustments
                        </Button>
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
                      
                      {/* Color Pickers */}
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
                        {image && (
                          <img
                            src={image}
                            alt="Poster"
                            className="w-full h-full"
                            style={getFilterStyle()}
                          />
                        )}
                        
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
                            onClick={generateCaption}
                            disabled={isGenerating || !description}
                            variant="ghost" 
                            className="w-full justify-start rounded-full"
                            size="sm"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Generate Caption
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
                              <SelectTrigger className="h-7 text-xs rounded">
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
                              className="w-full h-7 px-3 text-xs rounded border bg-background"
                            />
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground mb-2 block">Badge Position</Label>
                            <Select value={linkPosition} onValueChange={(v: any) => setLinkPosition(v)}>
                              <SelectTrigger className="h-7 text-xs rounded">
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

                  {/* Media Library Panel */}
                  {showMediaLibrary && (
                    <MediaLibraryPanel
                      onSelectImage={(url) => {
                        setImage(url);
                        toast.success("Image selected from media library");
                      }}
                      onClose={() => setShowMediaLibrary(false)}
                      open={showMediaLibrary}
                    />
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
