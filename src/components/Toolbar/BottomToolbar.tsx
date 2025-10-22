import { 
  MousePointer2, Paintbrush, Square, Type, Image as ImageIcon, Plus,
  Copy, Trash2, Smile, Box, Pen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ShapeSelector from "./ShapeSelector";
import IconSelector from "./IconSelector";

interface BottomToolbarProps {
  activeTool?: string;
  onToolChange?: (tool: string) => void;
  onImageUpload: () => void;
  onAddFrame: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onShapeSelect?: (shapeType: string) => void;
  onIconSelect?: (iconName: string, iconFamily: string) => void;
  onShaderAdd?: () => void;
  onLineAdd?: () => void;
  timelinePanelOpen?: boolean;
}

export default function BottomToolbar({ 
  activeTool = "select",
  onToolChange,
  onImageUpload, 
  onAddFrame,
  onDuplicate,
  onDelete,
  onShapeSelect,
  onIconSelect,
  onShaderAdd,
  onLineAdd,
  timelinePanelOpen = false
}: BottomToolbarProps) {
  return (
    <TooltipProvider>
      <div 
        className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          timelinePanelOpen ? 'bottom-[260px]' : 'bottom-12'
        }`}
      >
        <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-card/80 backdrop-blur-xl border border-border/40 dark:border-border/25 shadow-lg">
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
                <Paintbrush className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Draw</TooltipContent>
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
                  onClick={() => {
                    onToolChange?.("shape");
                    // Quick add: insert a default rectangle on click
                    onShapeSelect?.("rectangle");
                  }}
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

          <IconSelector onIconSelect={(iconName, iconFamily) => {
            onToolChange?.("icon");
            onIconSelect?.(iconName, iconFamily);
          }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={activeTool === "icon" ? "default" : "ghost"} 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                  onClick={() => {
                    onToolChange?.("icon");
                    onIconSelect?.("heart", "lucide");
                  }}
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Icon</TooltipContent>
            </Tooltip>
          </IconSelector>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={onLineAdd}
              >
                <Pen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Add Line</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={onShaderAdd}
              >
                <Box className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Add 3D Element</TooltipContent>
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
