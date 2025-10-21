import { useState, useEffect } from "react";
import { Layout } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import DraggablePanel from "./DraggablePanel";
import { toast } from "sonner";
import type { CanvasSnapshot } from "@/types/snapshot";
import { useTemplates } from "@/hooks/useTemplates";
import { starterTemplates } from "@/data/starterTemplates";

interface TemplatesPanelProps {
  onRestoreTemplate: (snapshot: CanvasSnapshot) => void;
  onClose: () => void;
}

export default function TemplatesPanel({
  onRestoreTemplate,
  onClose,
}: TemplatesPanelProps) {
  const { templates, isLoading: isLoadingTemplates, loadTemplates } = useTemplates();

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleTemplateClick = (snapshot: CanvasSnapshot, name: string) => {
    onRestoreTemplate(snapshot);
    toast.success(`Template loaded: ${name}`);
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
                    className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary/50 hover:bg-secondary transition-all hover:scale-105"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Layout className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/90 to-transparent">
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
                      className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary/50 hover:bg-secondary transition-all hover:scale-105"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Layout className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/90 to-transparent">
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
    </DraggablePanel>
  );
}
