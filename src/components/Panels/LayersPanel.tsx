import { useState } from "react";
import { Layers, Eye, EyeOff, Trash2, Square, Circle, Type, Image as ImageIcon, Pen, GripVertical, Lock, Unlock } from "lucide-react";
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
  onElementUpdate?: (frameId: string, elementId: string, updates: Partial<Element>) => void;
  onElementReorder?: (frameId: string, fromIndex: number, toIndex: number) => void;
  onFrameReorder?: (sourceFrameId: string, targetFrameId: string, position: 'before' | 'after' | 'inside') => void;
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
  onElementUpdate,
  onElementReorder,
  onFrameReorder,
  onClose,
}: LayersPanelProps) {
  const [collapsedFrames, setCollapsedFrames] = useState<Set<string>>(new Set());
  const [draggedElement, setDraggedElement] = useState<{ frameId: string; index: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedFrame, setDraggedFrame] = useState<string | null>(null);
  const [dragOverFrame, setDragOverFrame] = useState<{ frameId: string; position: 'before' | 'after' | 'inside' } | null>(null);

  const toggleFrameCollapse = (frameId: string) => {
    const newCollapsed = new Set(collapsedFrames);
    if (newCollapsed.has(frameId)) {
      newCollapsed.delete(frameId);
    } else {
      newCollapsed.add(frameId);
    }
    setCollapsedFrames(newCollapsed);
  };

  const renderFrame = (frame: Frame, depth: number = 0) => {
    const isFrameSelected = frame.id === selectedFrameId;
    const isCollapsed = collapsedFrames.has(frame.id);
    const frameElements = frame.elements || [];
    const nestedFrames = frame.frames || [];
    const isDragOverFrame = dragOverFrame?.frameId === frame.id;

    return (
      <div key={frame.id} className="space-y-0.5">
        {/* Frame Layer */}
        <div
          draggable={onFrameReorder !== undefined}
          onDragStart={(e) => {
            if (!onFrameReorder) return;
            setDraggedFrame(frame.id);
            e.dataTransfer.effectAllowed = "move";
            e.stopPropagation();
          }}
          onDragOver={(e) => {
            if (!onFrameReorder || !draggedFrame || draggedFrame === frame.id) return;
            e.preventDefault();
            e.stopPropagation();
            
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const height = rect.height;
            
            if (y < height * 0.25) {
              setDragOverFrame({ frameId: frame.id, position: 'before' });
            } else if (y > height * 0.75) {
              setDragOverFrame({ frameId: frame.id, position: 'after' });
            } else {
              setDragOverFrame({ frameId: frame.id, position: 'inside' });
            }
          }}
          onDragLeave={(e) => {
            e.stopPropagation();
            setDragOverFrame(null);
          }}
          onDrop={(e) => {
            if (!onFrameReorder || !draggedFrame) return;
            e.preventDefault();
            e.stopPropagation();
            
            if (dragOverFrame && draggedFrame !== dragOverFrame.frameId) {
              onFrameReorder(draggedFrame, dragOverFrame.frameId, dragOverFrame.position);
            }
            
            setDraggedFrame(null);
            setDragOverFrame(null);
          }}
          onDragEnd={() => {
            setDraggedFrame(null);
            setDragOverFrame(null);
          }}
          style={{ marginLeft: `${depth * 16}px` }}
          className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
            isFrameSelected ? "bg-blue-500/20 border border-blue-500" : "bg-secondary/50 hover:bg-secondary"
          } ${
            isDragOverFrame && dragOverFrame.position === 'before' ? "border-t-2 border-blue-500" : ""
          } ${
            isDragOverFrame && dragOverFrame.position === 'after' ? "border-b-2 border-blue-500" : ""
          } ${
            isDragOverFrame && dragOverFrame.position === 'inside' ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={() => onFrameSelect(frame.id)}
        >
          <div className="flex items-center gap-2">
            {onFrameReorder && (
              <GripVertical className="w-3 h-3 text-muted-foreground/50 flex-shrink-0 cursor-grab active:cursor-grabbing" />
            )}
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
            {frameElements.length + nestedFrames.length}
          </span>
        </div>

        {/* Nested frames and elements inside frame */}
        {!isCollapsed && (
          <div className="space-y-0.5">
            {/* Render nested frames first */}
            {nestedFrames.map((nestedFrame) => renderFrame(nestedFrame, depth + 1))}
            
            {/* Then render elements */}
            {frameElements.length > 0 && (
              <div style={{ marginLeft: `${(depth + 1) * 16}px` }} className="space-y-0.5">
                {frameElements.map((element, index) => {
                  const Icon = getElementIcon(element.type, element.shapeType);
                  const isSelected = selectedElementIds.includes(element.id);
                  const isDragOver = dragOverIndex === index;
                  
                  return (
                    <div
                      key={element.id}
                      draggable={onElementReorder !== undefined}
                      onDragStart={(e) => {
                        if (!onElementReorder) return;
                        setDraggedElement({ frameId: frame.id, index });
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        if (!onElementReorder || !draggedElement) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setDragOverIndex(index);
                      }}
                      onDragLeave={() => {
                        setDragOverIndex(null);
                      }}
                      onDrop={(e) => {
                        if (!onElementReorder || !draggedElement) return;
                        e.preventDefault();
                        if (draggedElement.frameId === frame.id && draggedElement.index !== index) {
                          onElementReorder(frame.id, draggedElement.index, index);
                        }
                        setDraggedElement(null);
                        setDragOverIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedElement(null);
                        setDragOverIndex(null);
                      }}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors group ${
                        isSelected ? "bg-blue-500/20 border border-blue-500" : "bg-secondary/30 hover:bg-secondary"
                      } ${isDragOver ? "border-t-2 border-blue-500" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onElementSelect(element.id, e.shiftKey || e.ctrlKey || e.metaKey);
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {onElementReorder && (
                          <GripVertical className="w-3 h-3 text-muted-foreground/50 flex-shrink-0 cursor-grab active:cursor-grabbing" />
                        )}
                        <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs truncate">
                          {element.type === "text"
                            ? element.text || "Text"
                            : element.type === "drawing"
                            ? "Drawing"
                            : element.shapeType || element.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {element.isLocked && onElementUpdate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hover:bg-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onElementUpdate(frame.id, element.id, { isLocked: false });
                            }}
                          >
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-destructive/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            onElementDelete(element.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <DraggablePanel
      title="Layers"
      defaultPosition={{ x: window.innerWidth - 320, y: 100 }}
      onClose={onClose}
    >
      <ScrollArea className="h-[500px] pr-2">
        <div className="space-y-0.5">
          {frames.map((frame) => renderFrame(frame, 0))}
        </div>
      </ScrollArea>
    </DraggablePanel>
  );
}
