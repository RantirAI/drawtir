import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, Sparkles, Image as ImageIcon, Wand2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const AIPosterGenerator = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<"create" | "replicate">("create");
  const [isDragging, setIsDragging] = useState(false);

  const examplePrompts = [
    "Create a vibrant summer music festival poster with bold typography, palm trees, and a sunset background",
    "Design a minimalist tech conference poster with geometric shapes and a modern color scheme",
    "Create a vintage coffee shop poster with warm colors, retro fonts, and coffee-related illustrations",
    "Design a fitness motivation poster with energetic colors, bold text, and dynamic shapes"
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      toast.success("Image uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      toast.success("Image uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const generatePoster = async () => {
    if (!prompt && !image) {
      toast.error("Please provide a description or upload an image");
      return;
    }

    setIsGenerating(true);

    try {
      console.log("Generating poster with AI...");
      
      const { data, error } = await supabase.functions.invoke("generate-ai-poster", {
        body: {
          prompt,
          imageBase64: image,
          analysisType: mode,
        },
      });

      if (error) throw error;

      console.log("AI Response:", data);

      if (!data.designSpec) {
        throw new Error("No design specification received");
      }

      // Store the design spec and navigate to canvas editor
      const designSpec = data.designSpec;
      
      // Create a snapshot for the canvas
      const snapshot = {
        version: "1.0.0",
        metadata: {
          title: designSpec.title || "AI Generated Poster",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        canvas: {
          backgroundColor: designSpec.backgroundColor || "#ffffff",
          zoom: 1,
          panOffset: { x: 0, y: 0 },
        },
        frames: [
          {
            id: crypto.randomUUID(),
            x: 100,
            y: 100,
            width: 800,
            height: 1000,
            label: "AI Poster",
            elements: designSpec.elements.map((el: any) => ({
              id: crypto.randomUUID(),
              type: el.type,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              fill: el.color || el.backgroundColor || "#000000",
              stroke: el.borderColor || "#000000",
              strokeWidth: el.borderWidth || 0,
              text: el.content || "",
              fontSize: el.fontSize || 16,
              fontWeight: el.fontWeight || "normal",
              fontFamily: "Arial",
              shape: el.shape || "rectangle",
              imageData: el.type === "image" && image ? image : undefined,
            })),
          },
        ],
      };

      // Store in session storage for the editor
      sessionStorage.setItem("aiGeneratedPoster", JSON.stringify(snapshot));
      
      toast.success("Poster generated! Redirecting to editor...");
      
      // Navigate to canvas editor
      setTimeout(() => {
        navigate("/");
      }, 500);

    } catch (error) {
      console.error("Error generating poster:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate poster");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">AI Poster Generator</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Create stunning posters with AI-powered design assistance
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generation Mode</CardTitle>
            <CardDescription>Choose how you want to create your poster</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as "create" | "replicate")}>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="create" id="create" />
                <Label htmlFor="create" className="font-normal cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Wand2 className="w-4 h-4" />
                    <span className="font-semibold">Create from Description</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Describe what you want and AI will design it for you
                  </p>
                </Label>
              </div>
              <div className="flex items-start space-x-3 space-y-0 mt-4">
                <RadioGroupItem value="replicate" id="replicate" />
                <Label htmlFor="replicate" className="font-normal cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <ImageIcon className="w-4 h-4" />
                    <span className="font-semibold">Replicate from Image</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload a poster and AI will analyze and recreate it
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "create" ? "Describe Your Poster" : "Upload Reference Image"}
            </CardTitle>
            <CardDescription>
              {mode === "create" 
                ? "Tell AI what you want to create. Be as detailed as possible for best results."
                : "Upload a poster image that you want AI to analyze and replicate"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Prompt Area */}
              <div className="space-y-4">
                <div>
                  <Label>Describe Your Poster</Label>
                  <Textarea
                    placeholder={
                      mode === "create"
                        ? "Example: Create a vibrant summer music festival poster with bold typography, palm trees, and a sunset background..."
                        : "Additional instructions for the AI (optional)..."
                    }
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[200px] resize-none mt-2"
                  />
                </div>
                
                {mode === "create" && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Quick examples:</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {examplePrompts.map((example, i) => (
                        <button
                          key={i}
                          onClick={() => setPrompt(example)}
                          className="text-left text-xs p-2 rounded border border-border hover:bg-accent transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Image Upload Area */}
              <div className="space-y-4">
                <Label>
                  {mode === "create" ? "Upload Image (Optional)" : "Upload Reference Image"}
                </Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    isDragging 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {image ? (
                      <div className="space-y-4">
                        <div className="relative group">
                          <img
                            src={image}
                            alt="Uploaded"
                            className="max-h-48 mx-auto rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <div className="text-white space-y-2">
                              <Upload className="w-8 h-8 mx-auto" />
                              <p className="text-sm">Click to change</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button variant="outline" size="sm" type="button">
                            <Upload className="w-3 h-3 mr-2" />
                            Change Image
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setImage(null);
                              toast.info("Image removed");
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 py-8">
                        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                          <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-lg">
                            {isDragging ? "Drop image here" : "Upload an image"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Drag & drop or click to browse
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            PNG, JPG up to 10MB
                          </p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                
                {mode === "create" && !image && (
                  <p className="text-xs text-muted-foreground text-center">
                    💡 Upload an image to incorporate it into your AI-generated design
                  </p>
                )}
                {mode === "replicate" && !image && (
                  <p className="text-xs text-muted-foreground text-center">
                    ⚠️ Reference image is required for replication mode
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={generatePoster}
              disabled={isGenerating || (!prompt && !image)}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Poster
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIPosterGenerator;
