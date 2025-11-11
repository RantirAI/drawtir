import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Download, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  framePreview?: string;
  frameName?: string;
  projectId?: string | null;
  onExport?: (format: string, resolution: number) => void;
}

export default function ShareDialog({ open, onOpenChange, framePreview, frameName, projectId, onExport }: ShareDialogProps) {
  const [format, setFormat] = useState("png");
  const [resolution, setResolution] = useState(1920);
  const [isPublic, setIsPublic] = useState(false);
  const [isTemplate, setIsTemplate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const publicUrl = projectId ? `${window.location.origin}/public/${projectId}` : '';
  const shareUrl = isPublic ? publicUrl : window.location.href;

  useEffect(() => {
    const checkPublicStatus = async () => {
      if (!projectId) return;
      
      try {
        const { data } = await supabase
          .from('posters')
          .select('is_public, is_template')
          .eq('id', projectId)
          .maybeSingle();

        if (data) {
          setIsPublic(data.is_public || false);
          setIsTemplate(data.is_template || false);
        }
      } catch (error) {
        console.error('Error checking public status:', error);
      }
    };

    if (open) {
      checkPublicStatus();
    }
  }, [open, projectId]);

  const handleTogglePublic = async () => {
    if (!projectId) {
      toast.error("Save your project first to share it publicly");
      return;
    }

    setIsLoading(true);
    try {
      const newPublicState = !isPublic;
      const { error } = await supabase
        .from('posters')
        .update({ 
          is_public: newPublicState,
          is_template: newPublicState ? isTemplate : false
        })
        .eq('id', projectId);

      if (error) throw error;

      setIsPublic(newPublicState);
      if (!newPublicState) {
        setIsTemplate(false);
      }
      toast.success(newPublicState ? "Project is now public!" : "Project is now private");
    } catch (error) {
      console.error('Error toggling public status:', error);
      toast.error("Failed to update sharing settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTemplate = async () => {
    if (!projectId || !isPublic) {
      toast.error("Project must be public to be a template");
      return;
    }

    setIsLoading(true);
    try {
      const newTemplateState = !isTemplate;
      const { error } = await supabase
        .from('posters')
        .update({ 
          is_template: newTemplateState,
          template_category: newTemplateState ? 'user-created' : null
        })
        .eq('id', projectId);

      if (error) throw error;

      setIsTemplate(newTemplateState);
      toast.success(newTemplateState ? "Added as template!" : "Removed from templates");
    } catch (error) {
      console.error('Error toggling template status:', error);
      toast.error("Failed to update template status");
    } finally {
      setIsLoading(false);
    }
  };

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
      <DialogContent className="sm:max-w-md p-3">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-sm">Share Frame</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {framePreview && (
            <div className="aspect-video w-full rounded-lg overflow-hidden border">
              <img src={framePreview} alt={frameName} className="w-full h-full object-cover" />
            </div>
          )}

          {projectId && (
            <>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2">
                  {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  <div>
                    <Label className="text-sm font-medium">Public Access</Label>
                    <p className="text-xs text-muted-foreground">
                      {isPublic ? "Anyone with the link can view" : "Only you can view"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isPublic}
                  onCheckedChange={handleTogglePublic}
                  disabled={isLoading}
                />
              </div>

              {isPublic && (
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Share as Template</Label>
                    <p className="text-xs text-muted-foreground">
                      Others can use this as a starting point
                    </p>
                  </div>
                  <Switch
                    checked={isTemplate}
                    onCheckedChange={handleToggleTemplate}
                    disabled={isLoading || !isPublic}
                  />
                </div>
              )}
            </>
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
