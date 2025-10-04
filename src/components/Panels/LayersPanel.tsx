import { useState } from "react";
import { Layers, Eye, EyeOff, Trash2, Square, Circle, Type, Image as ImageIcon, Pen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import DraggablePanel from "./DraggablePanel";
import { Element, Frame } from "@/types/elements";

interface LayersPanelProps {
  frames: Frame[];
  selectedFrameId: string;
  selectedElementIds: string[];
  onElementSelect: (elementId: string, multiSelect?: boolean) => void;
  onFrameSelect: (frameId: string) => void;
  onElementDelete: (elementId: string) => void;
  onClose: () => void;
}

const getElementIcon = (type: Element["type"], shapeType?: string) => {
  if (type === "shape") {
    if (shapeType === "circle" || shapeType === "ellipse") return Circle;
    if (shapeType === "rectangle") return Square;
    return Square;
  }
  if (type === "text") return Type;
  if (type === "image") return ImageIcon;
  if (type === "drawing") return Pen;
  return Square;
};

export default function LayersPanel({
  frames,
  selectedFrameId,
  selectedElementIds,
  onElementSelect,
  onFrameSelect,
  onElementDelete,
  onClose,
}: LayersPanelProps) {
  const [collapsedFrames, setCollapsedFrames] = useState<Set<string>>(new Set());

  const toggleFrameCollapse = (frameId: string) => {
    const newCollapsed = new Set(collapsedFrames);
    if (newCollapsed.has(frameId)) {
      newCollapsed.delete(frameId);
    } else {
      newCollapsed.add(frameId);
    }
    setCollapsedFrames(newCollapsed);
  };

  return (
    <DraggablePanel
      title="Layers"
      defaultPosition={{ x: window.innerWidth - 320, y: 100 }}
      onClose={onClose}
    >
      <ScrollArea className="h-[500px] pr-2">
        <div className="space-y-0.5">
          {frames.map((frame) => {
            const isFrameSelected = frame.id === selectedFrameId;
            const isCollapsed = collapsedFrames.has(frame.id);
            const frameElements = frame.elements || [];

            return (
              <div key={frame.id} className="space-y-0.5">
                {/* Frame Layer */}
                <div
                  className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                    isFrameSelected ? "bg-blue-500/20 border border-blue-500" : "bg-secondary/50 hover:bg-secondary"
                  }`}
                  onClick={() => onFrameSelect(frame.id)}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFrameCollapse(frame.id);
                      }}
                      className="text-muted-foreground hover:text-foreground w-4 h-4 flex items-center justify-center flex-shrink-0"
                    >
                      <span className="text-xs">{isCollapsed ? "▶" : "▼"}</span>
                    </button>
                    <Layers className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs font-medium truncate">{frame.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {frameElements.length}
                  </span>
                </div>

                {/* Elements inside frame */}
                {!isCollapsed && frameElements.length > 0 && (
                  <div className="ml-4 space-y-0.5">
                    {frameElements.map((element) => {
                      const Icon = getElementIcon(element.type, element.shapeType);
                      const isSelected = selectedElementIds.includes(element.id);
                      
                      return (
                        <div
                          key={element.id}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors group ${
                            isSelected ? "bg-blue-500/20 border border-blue-500" : "bg-secondary/30 hover:bg-secondary"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onElementSelect(element.id, e.shiftKey || e.ctrlKey || e.metaKey);
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs truncate">
                              {element.type === "text"
                                ? element.text || "Text"
                                : element.type === "drawing"
                                ? "Drawing"
                                : element.shapeType || element.type}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onElementDelete(element.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </DraggablePanel>
  );
}
