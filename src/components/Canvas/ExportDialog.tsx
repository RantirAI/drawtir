import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileImage, FileType, Film } from "lucide-react";
import type { Frame } from "@/types/elements";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frames: Frame[];
  onExport: (config: ExportConfig) => Promise<void>;
  defaultSelectedFrameIds?: string[];
}

export interface ExportConfig {
  frameIds: string[];
  format: "PNG" | "JPEG" | "SVG" | "PDF" | "GIF" | "MP4";
  scale: number;
  duration?: number;
  fps?: number;
  socialMediaSizes?: SocialMediaSize[];
}

export interface SocialMediaSize {
  name: string;
  width: number;
  height: number;
  platform: string;
}

const SOCIAL_MEDIA_PRESETS: SocialMediaSize[] = [
  { name: "Instagram Post", width: 1080, height: 1080, platform: "Instagram" },
  { name: "Instagram Story", width: 1080, height: 1920, platform: "Instagram" },
  { name: "Facebook Post", width: 1200, height: 630, platform: "Facebook" },
  { name: "Twitter/X Post", width: 1200, height: 675, platform: "Twitter/X" },
  { name: "LinkedIn Post", width: 1200, height: 627, platform: "LinkedIn" },
  { name: "Pinterest Pin", width: 1000, height: 1500, platform: "Pinterest" },
  { name: "YouTube Thumbnail", width: 1280, height: 720, platform: "YouTube" },
  { name: "TikTok Cover", width: 1080, height: 1920, platform: "TikTok" },
];

export default function ExportDialog({ open, onOpenChange, frames, onExport, defaultSelectedFrameIds }: ExportDialogProps) {
  const [selectedFrameIds, setSelectedFrameIds] = useState<string[]>(defaultSelectedFrameIds || []);
  const [format, setFormat] = useState<ExportConfig["format"]>("PNG");
  const [scale, setScale] = useState<number>(2);
  const [duration, setDuration] = useState<number>(3);
  const [fps, setFps] = useState<number>(30);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMode, setExportMode] = useState<"single" | "social-media">("single");
  const [selectedSocialSizes, setSelectedSocialSizes] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSelectedFrameIds(defaultSelectedFrameIds || []);
    }
  }, [open]);

  const isAnimatedFormat = format === "GIF" || format === "MP4";
  const hasAnimations = frames.some(f => 
    f.elements.some(el => 
      (el.animation && el.animation !== 'none') || 
      (el.type === 'shader' && el.shader)
    )
  );

  const handleFrameToggle = (frameId: string) => {
    console.log('Frame toggle clicked:', frameId, 'Current selection:', selectedFrameIds);
    setSelectedFrameIds(prev => {
      const newSelection = prev.includes(frameId)
        ? prev.filter(id => id !== frameId)
        : [...prev, frameId];
      console.log('New selection:', newSelection);
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    console.log('Select all clicked. Current:', selectedFrameIds.length, 'Total frames:', frames.length);
    if (selectedFrameIds.length === frames.length) {
      console.log('Deselecting all');
      setSelectedFrameIds([]);
    } else {
      console.log('Selecting all frames:', frames.map(f => f.id));
      setSelectedFrameIds(frames.map(f => f.id));
    }
  };

  const handleSocialSizeToggle = (sizeName: string) => {
    setSelectedSocialSizes(prev =>
      prev.includes(sizeName)
        ? prev.filter(n => n !== sizeName)
        : [...prev, sizeName]
    );
  };

  const handleSelectAllSocialSizes = () => {
    if (selectedSocialSizes.length === SOCIAL_MEDIA_PRESETS.length) {
      setSelectedSocialSizes([]);
    } else {
      setSelectedSocialSizes(SOCIAL_MEDIA_PRESETS.map(s => s.name));
    }
  };

  const handleExport = async () => {
    console.log('Export clicked. Selected frames:', selectedFrameIds);
    if (selectedFrameIds.length === 0) {
      console.log('No frames selected, aborting');
      return;
    }
    
    setIsExporting(true);
    try {
      const socialMediaSizes = exportMode === "social-media" 
        ? SOCIAL_MEDIA_PRESETS.filter(s => selectedSocialSizes.includes(s.name))
        : undefined;

      console.log('Calling onExport with config:', {
        frameIds: selectedFrameIds,
        format,
        scale,
        socialMediaSizes
      });

      await onExport({
        frameIds: selectedFrameIds,
        format,
        scale,
        duration: isAnimatedFormat ? duration : undefined,
        fps: isAnimatedFormat ? fps : undefined,
        socialMediaSizes,
      });
      
      console.log('Export completed successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-3">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-sm">Export Frames</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Export Mode Selection */}
          <div className="space-y-3">
            <Label>Export Mode</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={exportMode === "single" ? "default" : "outline"}
                onClick={() => setExportMode("single")}
                className="w-full"
              >
                Single Size
              </Button>
              <Button
                variant={exportMode === "social-media" ? "default" : "outline"}
                onClick={() => setExportMode("social-media")}
                className="w-full"
              >
                Social Media Sizes
              </Button>
            </div>
          </div>

          {/* Frame Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Select Frames ({selectedFrameIds.length} selected)</Label>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {selectedFrameIds.length === frames.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <ScrollArea className="h-48 rounded-md border p-4">
              <div className="space-y-2">
                {frames.map((frame) => (
                  <div key={frame.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={frame.id}
                      checked={selectedFrameIds.includes(frame.id)}
                      onCheckedChange={() => handleFrameToggle(frame.id)}
                    />
                    <label
                      htmlFor={frame.id}
                      className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {frame.name || `Frame ${frame.id.slice(0, 8)}`}
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {frame.width}×{frame.height}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Social Media Sizes Selection */}
          {exportMode === "social-media" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Social Media Sizes ({selectedSocialSizes.length} selected)</Label>
                <Button variant="ghost" size="sm" onClick={handleSelectAllSocialSizes}>
                  {selectedSocialSizes.length === SOCIAL_MEDIA_PRESETS.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <ScrollArea className="h-48 rounded-md border p-4">
                <div className="space-y-2">
                  {SOCIAL_MEDIA_PRESETS.map((size) => (
                    <div key={size.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={size.name}
                        checked={selectedSocialSizes.includes(size.name)}
                        onCheckedChange={() => handleSocialSizeToggle(size.name)}
                      />
                      <label
                        htmlFor={size.name}
                        className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {size.name}
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {size.width}×{size.height}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {exportMode === "social-media" && <Separator />}

          {/* Export Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Scale</Label>
              <Select value={scale.toString()} onValueChange={(v) => setScale(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="4">4x</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as ExportConfig["format"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  <SelectItem value="PNG">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      PNG
                    </div>
                  </SelectItem>
                  <SelectItem value="JPEG">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      JPEG
                    </div>
                  </SelectItem>
                  <SelectItem value="SVG">
                    <div className="flex items-center gap-2">
                      <FileType className="h-4 w-4" />
                      SVG
                    </div>
                  </SelectItem>
                  <SelectItem value="PDF">
                    <div className="flex items-center gap-2">
                      <FileType className="h-4 w-4" />
                      PDF
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
          </div>

          {/* Animation Settings */}
          {isAnimatedFormat && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (seconds)</Label>
                <Select value={duration.toString()} onValueChange={(v) => setDuration(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="2">2s</SelectItem>
                    <SelectItem value="3">3s</SelectItem>
                    <SelectItem value="5">5s</SelectItem>
                    <SelectItem value="10">10s</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>FPS</Label>
                <Select value={fps.toString()} onValueChange={(v) => setFps(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="15">15 FPS</SelectItem>
                    <SelectItem value="24">24 FPS</SelectItem>
                    <SelectItem value="30">30 FPS</SelectItem>
                    <SelectItem value="60">60 FPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Info */}
          {exportMode === "social-media" && selectedSocialSizes.length > 0 && (
            <div className="rounded-md bg-primary/10 border border-primary p-3 text-sm">
              <strong>Multi-Size Export:</strong> Will generate {selectedSocialSizes.length} optimized versions for different social media platforms.
            </div>
          )}
          {format === "PDF" && selectedFrameIds.length > 1 && (
            <div className="rounded-md bg-muted p-3 text-sm">
              All selected frames will be combined into a single PDF file.
            </div>
          )}
          {isAnimatedFormat && (
            <div className="rounded-md bg-muted p-3 text-sm">
              The export will capture all animations exactly as they appear in the canvas.
            </div>
          )}

          {/* Export Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={
                selectedFrameIds.length === 0 || 
                isExporting || 
                (exportMode === "social-media" && selectedSocialSizes.length === 0)
              }
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting 
                ? "Exporting..." 
                : exportMode === "social-media" 
                  ? `Export ${selectedSocialSizes.length} Size${selectedSocialSizes.length !== 1 ? 's' : ''}`
                  : "Export"
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
