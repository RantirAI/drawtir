import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Loader2, FileUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CanvasSnapshot } from "@/types/snapshot";

interface FigmaImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (snapshot: CanvasSnapshot) => void;
}

export default function FigmaImportModal({ open, onOpenChange, onImport }: FigmaImportModalProps) {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractFileKey = (url: string): string | null => {
    // Handle various Figma URL formats
    // https://www.figma.com/file/abc123/design-name
    // https://www.figma.com/design/abc123/design-name
    // Just the file key: abc123
    
    if (!url.includes('/')) {
      // Assume it's just the file key
      return url.trim();
    }

    const patterns = [
      /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/,
      /figma\.com\/proto\/([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  };

  const handleImport = async () => {
    setError(null);

    if (!figmaUrl.trim()) {
      setError("Please enter a Figma file URL or key");
      return;
    }

    if (!accessToken.trim()) {
      setError("Please enter your Figma Personal Access Token");
      return;
    }

    const fileKey = extractFileKey(figmaUrl);
    if (!fileKey) {
      setError("Invalid Figma URL. Please enter a valid Figma file URL or file key.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('import-figma-design', {
        body: { fileKey, accessToken },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(`Imported "${data.figmaFileName}" with ${data.frameCount} frame(s)`);
      onImport(data.snapshot as CanvasSnapshot);
      onOpenChange(false);
      
      // Reset form
      setFigmaUrl("");
      setAccessToken("");
    } catch (err: any) {
      console.error("Figma import error:", err);
      setError(err.message || "Failed to import Figma design");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5" />
            Import from Figma
          </DialogTitle>
          <DialogDescription>
            Import frames and elements from a Figma file into your canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="figma-url">Figma File URL or Key</Label>
            <Input
              id="figma-url"
              placeholder="https://www.figma.com/file/abc123/..."
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Paste the full Figma URL or just the file key
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access-token">Personal Access Token</Label>
            <Input
              id="access-token"
              type="password"
              placeholder="figd_..."
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={isLoading}
            />
            <a
              href="https://www.figma.com/developers/api#access-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              How to get a Personal Access Token
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 rounded-md bg-muted/50 text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">What gets imported:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>Frames as canvas frames</li>
              <li>Text elements with styling</li>
              <li>Rectangles, ellipses, and shapes</li>
              <li>Colors, opacity, and corner radius</li>
            </ul>
            <p className="text-xs mt-2">
              <strong>Note:</strong> Complex vectors, effects, and auto-layout are simplified.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              'Import'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
