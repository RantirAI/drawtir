import { 
  Mouse, Brush2, Box1, TextBlock, Gallery as GalleryIcon, Add,
  Copy, Trash, EmojiHappy, BrushBig, Text, ScanBarcode, Edit2
} from "iconsax-react";
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
  onQRCodeAdd?: () => void;
  timelinePanelOpen?: boolean;
  onAddRichText?: () => void;
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
  onQRCodeAdd,
  timelinePanelOpen = false,
  onAddRichText
}: BottomToolbarProps) {
  return (
    <TooltipProvider>
      <div 
        className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          timelinePanelOpen ? 'bottom-[260px]' : 'bottom-12'
        }`}
      >
        {/* Subtle light source glow behind toolbar */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/25 via-blue-400/15 to-transparent blur-3xl scale-150" />
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/20 via-blue-300/10 to-transparent blur-2xl scale-125" />
        </div>
        
        <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-background/40 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(59,130,246,0.2)]">
          {/* Basic Tools */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={activeTool === "select" ? "default" : "ghost"} 
                size="icon" 
                className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.6),0_8px_16px_rgba(59,130,246,0.4)] group"
                onClick={() => onToolChange?.("select")}
              >
                <Mouse size={16} className="transition-transform duration-300 group-hover:rotate-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Select</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={activeTool === "pen" ? "default" : "ghost"} 
                size="icon" 
                className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.6),0_8px_16px_rgba(59,130,246,0.4)] group"
                onClick={() => onToolChange?.("pen")}
              >
                <Brush2 size={16} className="transition-transform duration-300 group-hover:rotate-6" />
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
                  className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.6),0_8px_16px_rgba(59,130,246,0.4)] group"
                  onClick={() => {
                    onToolChange?.("shape");
                    // Quick add: insert a default rectangle on click
                    onShapeSelect?.("rectangle");
                  }}
                >
                  <Box1 size={16} className="transition-transform duration-300 group-hover:rotate-6" />
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
                className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.6),0_8px_16px_rgba(59,130,246,0.4)] group"
                onClick={() => onToolChange?.("text")}
              >
                <TextBlock size={16} className="transition-transform duration-300 group-hover:rotate-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Text</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.6),0_8px_16px_rgba(59,130,246,0.4)] group" onClick={onImageUpload}>
                <GalleryIcon size={16} className="transition-transform duration-300 group-hover:rotate-6" />
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
                  className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.6),0_8px_16px_rgba(59,130,246,0.4)] group"
                  onClick={() => {
                    onToolChange?.("icon");
                    onIconSelect?.("heart", "lucide");
                  }}
                >
                  <EmojiHappy size={16} className="transition-transform duration-300 group-hover:rotate-6" />
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
                className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.6),0_8px_16px_rgba(59,130,246,0.4)] group"
                onClick={onLineAdd}
              >
                <Edit2 size={16} className="transition-transform duration-300 group-hover:rotate-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Add Line</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.6),0_8px_16px_rgba(59,130,246,0.4)] group"
                onClick={onAddRichText}
              >
                <Text size={16} className="transition-transform duration-300 group-hover:rotate-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Rich Text</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.6),0_8px_16px_rgba(59,130,246,0.4)] group"
                onClick={onShaderAdd}
              >
                <BrushBig size={16} className="transition-transform duration-300 group-hover:rotate-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Add Shader</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.6),0_8px_16px_rgba(59,130,246,0.4)] group"
                onClick={onQRCodeAdd}
              >
                <ScanBarcode size={16} className="transition-transform duration-300 group-hover:rotate-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Add QR Code</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Frame & Arrange */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.6),0_8px_16px_rgba(59,130,246,0.4)] group" onClick={onAddFrame}>
                <Add size={16} className="transition-transform duration-300 group-hover:rotate-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Add Frame</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.6),0_8px_16px_rgba(59,130,246,0.4)] group" onClick={onDuplicate}>
                <Copy size={16} className="transition-transform duration-300 group-hover:rotate-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Duplicate</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.6),0_8px_16px_rgba(59,130,246,0.4)] group" onClick={onDelete}>
                <Trash size={16} className="transition-transform duration-300 group-hover:rotate-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
