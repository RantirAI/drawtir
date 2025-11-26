import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Download, Film, Image as ImageIcon } from "lucide-react";
import type { Frame } from "@/types/elements";
import { toast } from "sonner";
// @ts-ignore - gif.js types
import GIF from "gif.js";

interface ExportPresentationDialogProps {
  frames: Frame[];
  frameDuration: number;
  transition: string;
  onClose: () => void;
}

type ExportFormat = "gif" | "video";
type ExportQuality = "low" | "medium" | "high";

export function ExportPresentationDialog({
  frames,
  frameDuration,
  transition,
  onClose,
}: ExportPresentationDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("gif");
  const [quality, setQuality] = useState<ExportQuality>("medium");
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const qualitySettings = {
    low: { width: 480, fps: 10, quality: 20 },
    medium: { width: 720, fps: 15, quality: 10 },
    high: { width: 1080, fps: 24, quality: 5 },
  };

  const exportAsGIF = async () => {
    setIsExporting(true);
    setProgress(0);

    try {
      const settings = qualitySettings[quality];
      const gif = new GIF({
        workers: 2,
        quality: settings.quality,
        width: settings.width,
        height: Math.round(settings.width * (frames[0]?.height / frames[0]?.width || 1)),
        workerScript: "/gif.worker.js",
      });

      // Render each frame to canvas and add to GIF
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        if (!ctx) continue;

        canvas.width = settings.width;
        canvas.height = Math.round(settings.width * (frame.height / frame.width));

        // Draw frame background
        ctx.fillStyle = frame.backgroundColor || "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate scale
        const scale = settings.width / frame.width;

        // Draw frame elements
        for (const element of frame.elements || []) {
          ctx.save();
          
          const x = element.x * scale;
          const y = element.y * scale;
          const width = element.width * scale;
          const height = element.height * scale;

          if (element.type === "text") {
            ctx.fillStyle = element.fill || "#000000";
            ctx.font = `${element.fontWeight || "normal"} ${(element.fontSize || 16) * scale}px ${element.fontFamily || "Arial"}`;
            ctx.textBaseline = "top";
            ctx.fillText(element.text || "", x, y);
          } else if (element.type === "shape") {
            ctx.fillStyle = element.fill || "#000000";
            const hasCircleBorderRadius = element.cornerRadius && element.cornerRadius >= Math.min(width, height) / 2;
            if (element.shapeType === "rectangle" && hasCircleBorderRadius) {
              ctx.beginPath();
              ctx.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.fillRect(x, y, width, height);
            }
          } else if (element.type === "image" && element.imageUrl) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
              img.src = element.imageUrl!;
            });
            if (img.complete) {
              ctx.drawImage(img, x, y, width, height);
            }
          }

          ctx.restore();
        }

        gif.addFrame(canvas, { delay: frameDuration * 1000 });
        setProgress(((i + 1) / frames.length) * 50);
      }

      // Render GIF
      gif.on("progress", (p: number) => {
        setProgress(50 + p * 50);
      });

      gif.on("finished", (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `presentation-${Date.now()}.gif`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success("GIF exported successfully!");
        setIsExporting(false);
        onClose();
      });

      gif.render();
    } catch (error) {
      console.error("Error exporting GIF:", error);
      toast.error("Failed to export GIF");
      setIsExporting(false);
    }
  };

  const exportAsVideo = async () => {
    toast.info("Video export coming soon! For now, try GIF export.");
    // Video export would require MediaRecorder API or similar
    // This is more complex and would need server-side rendering
  };

  const handleExport = async () => {
    if (format === "gif") {
      await exportAsGIF();
    } else {
      await exportAsVideo();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Presentation</DialogTitle>
          <DialogDescription>
            Export your presentation as an animated GIF or video file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gif">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span>Animated GIF</span>
                  </div>
                </SelectItem>
                <SelectItem value="video" disabled>
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    <span>Video (Coming Soon)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quality selection */}
          <div className="space-y-2">
            <Label>Quality</Label>
            <Select value={quality} onValueChange={(v) => setQuality(v as ExportQuality)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (480p, 10fps)</SelectItem>
                <SelectItem value="medium">Medium (720p, 15fps)</SelectItem>
                <SelectItem value="high">High (1080p, 24fps)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frames:</span>
              <span className="font-medium">{frames.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration per frame:</span>
              <span className="font-medium">{frameDuration}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total duration:</span>
              <span className="font-medium">{frames.length * frameDuration}s</span>
            </div>
          </div>

          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                Exporting... {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
