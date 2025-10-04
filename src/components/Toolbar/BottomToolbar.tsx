import { 
  MousePointer2, PenTool, Square, Type, Image as ImageIcon, Plus,
  Copy, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ShapeSelector from "./ShapeSelector";

interface BottomToolbarProps {
  activeTool?: string;
  onToolChange?: (tool: string) => void;
  onImageUpload: () => void;
  onAddFrame: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onShapeSelect?: (shapeType: string) => void;
}

export default function BottomToolbar({ 
  activeTool = "select",
  onToolChange,
  onImageUpload, 
  onAddFrame,
  onDuplicate,
  onDelete,
  onShapeSelect
}: BottomToolbarProps) {
  return (
    <TooltipProvider>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-card/80 backdrop-blur-xl border shadow-lg">
          {/* Basic Tools */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={activeTool === "select" ? "default" : "ghost"} 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={() => onToolChange?.("select")}
              >
                <MousePointer2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Select</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={activeTool === "pen" ? "default" : "ghost"} 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={() => onToolChange?.("pen")}
              >
                <PenTool className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Pen</TooltipContent>
          </Tooltip>

          <ShapeSelector onShapeSelect={(shapeType) => {
            onToolChange?.("shape");
            onShapeSelect?.(shapeType);
          }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={activeTool === "shape" ? "default" : "ghost"} 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                >
                  <Square className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Shape</TooltipContent>
            </Tooltip>
          </ShapeSelector>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={activeTool === "text" ? "default" : "ghost"} 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={() => onToolChange?.("text")}
              >
                <Type className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Text</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onImageUpload}>
                <ImageIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Image</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Frame & Arrange */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onAddFrame}>
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Add Frame</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onDuplicate}>
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Duplicate</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
