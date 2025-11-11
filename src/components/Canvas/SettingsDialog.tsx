import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

export default function SettingsDialog({ open, onOpenChange, projectId }: SettingsDialogProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [isTemplate, setIsTemplate] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && projectId) {
      loadSettings();
    }
  }, [open, projectId]);

  const loadSettings = async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from('posters')
        .select('is_public, is_template')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      
      setIsPublic(data?.is_public || false);
      setIsTemplate(data?.is_template || false);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handlePublicToggle = async (checked: boolean) => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('posters')
        .update({ is_public: checked })
        .eq('id', projectId);

      if (error) throw error;

      setIsPublic(checked);
      toast.success(checked ? "Project is now public" : "Project is now private");
    } catch (error) {
      console.error('Error updating public status:', error);
      toast.error("Failed to update public status");
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateToggle = async (checked: boolean) => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('posters')
        .update({ is_template: checked })
        .eq('id', projectId);

      if (error) throw error;

      setIsTemplate(checked);
      toast.success(checked ? "Added to templates" : "Removed from templates");
    } catch (error) {
      console.error('Error updating template status:', error);
      toast.error("Failed to update template status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-3">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-sm">Project Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-access">Public Access</Label>
              <p className="text-sm text-muted-foreground">
                Allow anyone with the link to view this project
              </p>
            </div>
            <Switch
              id="public-access"
              checked={isPublic}
              onCheckedChange={handlePublicToggle}
              disabled={loading || !projectId}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="template">Share as Template</Label>
              <p className="text-sm text-muted-foreground">
                Make this available in the community templates
              </p>
            </div>
            <Switch
              id="template"
              checked={isTemplate}
              onCheckedChange={handleTemplateToggle}
              disabled={loading || !projectId}
            />
          </div>

          {isPublic && projectId && (
            <div className="pt-4 border-t">
              <Label className="text-sm">Public Link</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/public/${projectId}`}
                  className="flex-1 px-3 py-2 text-sm bg-muted rounded-md"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/public/${projectId}`);
                    toast.success("Link copied to clipboard");
                  }}
                  className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
