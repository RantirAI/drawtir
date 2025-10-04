import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  framePreview?: string;
  frameName?: string;
  onExport?: (format: string, resolution: number) => void;
}

export default function ShareDialog({ open, onOpenChange, framePreview, frameName, onExport }: ShareDialogProps) {
  const [format, setFormat] = useState("png");
  const [resolution, setResolution] = useState(1920);
  const shareUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };

  const handleExport = () => {
    onExport?.(format, resolution);
    toast.success(`Exporting ${frameName || 'frame'} as ${format.toUpperCase()}...`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Frame</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {framePreview && (
            <div className="aspect-video w-full rounded-lg overflow-hidden border">
              <img src={framePreview} alt={frameName} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Share Link</Label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Export Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpg">JPG</SelectItem>
                <SelectItem value="svg">SVG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Resolution</Label>
            <Select value={resolution.toString()} onValueChange={(v) => setResolution(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1920">1920px (Full HD)</SelectItem>
                <SelectItem value="2560">2560px (2K)</SelectItem>
                <SelectItem value="3840">3840px (4K)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleExport} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Export Frame
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
