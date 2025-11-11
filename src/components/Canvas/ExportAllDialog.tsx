import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, Loader2, FileImage, FileType, Film } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Frame } from "@/types/elements";
import { exportFrames } from "@/lib/exportUtils";

interface ExportAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frames: Frame[];
}

export default function ExportAllDialog({ open, onOpenChange, frames }: ExportAllDialogProps) {
  const [format, setFormat] = useState<"PNG" | "JPEG" | "PDF" | "SVG" | "GIF" | "MP4">("PNG");
  const [selectedFrameIds, setSelectedFrameIds] = useState<string[]>(frames.map(f => f.id));
  const [isExporting, setIsExporting] = useState(false);
  const [scale, setScale] = useState<number>(2);
  const [duration, setDuration] = useState<number>(3);
  const [fps, setFps] = useState<number>(30);

  const isAnimatedFormat = format === "GIF" || format === "MP4";
  const hasAnimations = frames.some(f => 
    f.elements.some(el => el.animation && el.animation !== 'none')
  );

  const handleToggleFrame = (frameId: string) => {
    setSelectedFrameIds(prev => 
      prev.includes(frameId) 
        ? prev.filter(id => id !== frameId)
        : [...prev, frameId]
    );
  };

  const handleSelectAll = () => {
    setSelectedFrameIds(frames.map(f => f.id));
  };

  const handleDeselectAll = () => {
    setSelectedFrameIds([]);
  };

  const handleExport = async () => {
    if (selectedFrameIds.length === 0) {
      toast.error("Please select at least one frame to export");
      return;
    }

    setIsExporting(true);
    try {
      await exportFrames(frames, {
        frameIds: selectedFrameIds,
        format,
        scale,
        duration: isAnimatedFormat ? duration : undefined,
        fps: isAnimatedFormat ? fps : undefined,
      });
      toast.success(`Exported ${selectedFrameIds.length} frame(s) as ${format}`);
      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export frames");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-3">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-sm">Export All Frames</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Export Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PNG">
                  <div className="flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    PNG (Best Quality)
                  </div>
                </SelectItem>
                <SelectItem value="JPEG">
                  <div className="flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    JPEG (Smaller Size)
                  </div>
                </SelectItem>
                <SelectItem value="PDF">
                  <div className="flex items-center gap-2">
                    <FileType className="h-4 w-4" />
                    PDF (Multiple Pages)
                  </div>
                </SelectItem>
                <SelectItem value="SVG">
                  <div className="flex items-center gap-2">
                    <FileType className="h-4 w-4" />
                    SVG (Vector)
                  </div>
                </SelectItem>
                <SelectItem value="GIF" disabled={!hasAnimations}>
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4" />
                    GIF {!hasAnimations && "(No animations)"}
                  </div>
                </SelectItem>
                <SelectItem value="MP4" disabled={!hasAnimations}>
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4" />
                    MP4 {!hasAnimations && "(No animations)"}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Scale</Label>
            <Select value={scale.toString()} onValueChange={(v) => setScale(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1x (Original)</SelectItem>
                <SelectItem value="2">2x (High Quality)</SelectItem>
                <SelectItem value="3">3x (Ultra HD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAnimatedFormat && (
            <>
              <div className="space-y-2">
                <Label className="text-sm">Duration (seconds)</Label>
                <Select value={duration.toString()} onValueChange={(v) => setDuration(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2s</SelectItem>
                    <SelectItem value="3">3s</SelectItem>
                    <SelectItem value="5">5s</SelectItem>
                    <SelectItem value="10">10s</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">FPS</Label>
                <Select value={fps.toString()} onValueChange={(v) => setFps(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 FPS</SelectItem>
                    <SelectItem value="24">24 FPS</SelectItem>
                    <SelectItem value="30">30 FPS</SelectItem>
                    <SelectItem value="60">60 FPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md bg-muted p-3 text-sm">
                The export will capture all animations exactly as they appear in the canvas.
              </div>
            </>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Select Frames ({selectedFrameIds.length}/{frames.length})</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                  All
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
                  None
                </Button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
              {frames.map((frame) => (
                <div key={frame.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={frame.id}
                    checked={selectedFrameIds.includes(frame.id)}
                    onCheckedChange={() => handleToggleFrame(frame.id)}
                  />
                  <label
                    htmlFor={frame.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {frame.name || `Frame ${frames.indexOf(frame) + 1}`}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleExport} className="w-full" disabled={isExporting || selectedFrameIds.length === 0}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {selectedFrameIds.length} Frame{selectedFrameIds.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
