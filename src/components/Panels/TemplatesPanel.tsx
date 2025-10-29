import { useState, useEffect } from "react";
import { Layout, Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import DraggablePanel from "./DraggablePanel";
import { toast } from "sonner";
import type { CanvasSnapshot } from "@/types/snapshot";
import { useTemplates } from "@/hooks/useTemplates";
import { starterTemplates } from "@/data/starterTemplates";
import PreviewDialog from "@/components/Canvas/PreviewDialog";
import { supabase } from "@/integrations/supabase/client";

interface TemplatesPanelProps {
  onRestoreTemplate: (snapshot: CanvasSnapshot) => void;
  onClose: () => void;
}

export default function TemplatesPanel({
  onRestoreTemplate,
  onClose,
}: TemplatesPanelProps) {
  const { templates, isLoading: isLoadingTemplates, loadTemplates } = useTemplates();
  const [previewFrame, setPreviewFrame] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleTemplateClick = async (snapshot: CanvasSnapshot, name: string) => {
    try {
      // Transfer images from template to user's media library
      const { data: { user } } = await supabase.auth.getUser();
      if (user && snapshot.frames) {
        const imageUrls = new Set<string>();
        
        // Collect all image URLs from frames and elements
        snapshot.frames.forEach(frame => {
          if (frame.image) imageUrls.add(frame.image);
          if (frame.elements) {
            frame.elements.forEach(element => {
              if (element.type === 'image' && element.imageUrl) {
                imageUrls.add(element.imageUrl);
              }
              if (element.fillImage) {
                imageUrls.add(element.fillImage);
              }
            });
          }
        });

        // Save each image to media library
        for (const url of imageUrls) {
          if (url && url.startsWith('http')) {
            try {
              await supabase.from('media_library').insert({
                user_id: user.id,
                file_name: `template-image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`,
                file_url: url,
                file_type: 'image/png',
                source: 'template',
                metadata: { templateName: name }
              });
            } catch (error) {
              console.error('Error saving template image:', error);
            }
          }
        }
      }
      
      onRestoreTemplate(snapshot);
      toast.success(`Template loaded: ${name}. Images added to your media library.`);
    } catch (error) {
      console.error('Error loading template:', error);
      onRestoreTemplate(snapshot);
      toast.success(`Template loaded: ${name}`);
    }
  };

  const handlePreview = (snapshot: CanvasSnapshot, e: React.MouseEvent) => {
    e.stopPropagation();
    if (snapshot.frames && snapshot.frames.length > 0) {
      setPreviewFrame(snapshot.frames[0]);
      setPreviewOpen(true);
    }
  };

  return (
    <DraggablePanel
      title="Templates"
      defaultPosition={{ x: 50, y: 150 }}
      onClose={onClose}
    >
      <div className="w-[380px] bg-card rounded-lg">
        <ScrollArea className="h-[500px]">
          <div className="p-4 space-y-6">
            {/* Starter Templates */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Starter Templates</h3>
              <div className="grid grid-cols-2 gap-3">
                {starterTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateClick(template.snapshot, template.name)}
                    className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary/50 hover:bg-secondary transition-all hover:scale-105 border border-border/50"
                  >
                    {/* Preview Button */}
                    <button
                      onClick={(e) => handlePreview(template.snapshot, e)}
                      className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Preview template"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {/* Preview */}
                    <div className="absolute inset-0 p-3">
                      <div 
                        className="w-full h-full rounded-md overflow-hidden"
                        style={{
                          backgroundColor: template.snapshot.frames[0]?.backgroundColor || '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '6px',
                          color: template.snapshot.frames[0]?.textColor || '#000000',
                        }}
                      >
                        <div className="text-center text-[6px] opacity-50">Preview</div>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/95 via-background/80 to-transparent">
                      <p className="text-xs font-medium text-foreground truncate">{template.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{template.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Community Templates */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Community Templates</h3>
              {isLoadingTemplates ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Loading community templates...
                </div>
              ) : templates.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No community templates yet. Make your designs public to share them!
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateClick(template.canvas_data, template.project_name)}
                      className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary/50 hover:bg-secondary transition-all hover:scale-105 border border-border/50"
                    >
                      {/* Preview Button */}
                      <button
                        onClick={(e) => handlePreview(template.canvas_data, e)}
                        className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Preview template"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {/* Preview */}
                      {template.thumbnail_url ? (
                        <img 
                          src={template.thumbnail_url} 
                          alt={template.project_name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 p-3">
                          <div 
                            className="w-full h-full rounded-md overflow-hidden"
                            style={{
                              backgroundColor: template.canvas_data.frames[0]?.backgroundColor || '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Layout className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors opacity-30" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/95 via-background/80 to-transparent">
                        <p className="text-xs font-medium text-foreground truncate">{template.project_name}</p>
                        {template.template_category && (
                          <p className="text-[10px] text-muted-foreground truncate">{template.template_category}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        frame={previewFrame}
      />
    </DraggablePanel>
  );
}
