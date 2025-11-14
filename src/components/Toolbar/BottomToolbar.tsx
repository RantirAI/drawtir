import { 
  Brush2, TextBlock, Gallery as GalleryIcon, Add,
  EmojiHappy, BrushBig, Text, ScanBarcode, Edit2, Video
} from "iconsax-react";
import { MousePointer2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ShapeSelector from "./ShapeSelector";
import IconSelector from "./IconSelector";

interface BottomToolbarProps {
  activeTool?: string;
  onToolChange?: (tool: string) => void;
  onImageUpload: () => void;
  onVideoUpload?: () => void;
  onAddFrame: () => void;
  onAddNestedFrame?: () => void;
  onShapeSelect?: (shapeType: string) => void;
  onIconSelect?: (iconName: string, iconFamily: string) => void;
  onShaderAdd?: () => void;
  onLineAdd?: () => void;
  onQRCodeAdd?: () => void;
  timelinePanelOpen?: boolean;
  timelinePanelHeight?: number;
  onAddRichText?: () => void;
  onDisablePanMode?: () => void;
}

export default function BottomToolbar({ 
  activeTool = "select",
  onToolChange,
  onImageUpload,
  onVideoUpload,
  onAddFrame,
  onAddNestedFrame,
  onShapeSelect,
  onIconSelect,
  onShaderAdd,
  onLineAdd,
  onQRCodeAdd,
  timelinePanelOpen = false,
  timelinePanelHeight = 300,
  onAddRichText,
  onDisablePanMode
}: BottomToolbarProps) {
  return (
    <TooltipProvider>
      <div 
        className="fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300"
        style={{ 
          bottom: timelinePanelOpen ? `${timelinePanelHeight}px` : '48px'
        }}
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
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group"
                onClick={() => {
                  onToolChange?.("select");
                  onDisablePanMode?.();
                }}
              >
                <MousePointer2 size={16} className="transition-transform duration-300 group-hover:rotate-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Select</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={activeTool === "pen" ? "default" : "ghost"} 
                size="icon" 
                className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group"
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
                  className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group"
                  onClick={() => {
                    onToolChange?.("shape");
                    // Quick add: insert a default rectangle on click
                    onShapeSelect?.("rectangle");
                  }}
                >
                  <Square size={16} className="transition-transform duration-300 group-hover:rotate-6" />
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
                className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group"
                onClick={() => onToolChange?.("text")}
              >
                <TextBlock size={16} className="transition-transform duration-300 group-hover:rotate-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Text</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group" onClick={onImageUpload}>
                <GalleryIcon size={16} className="transition-transform duration-300 group-hover:rotate-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Image</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group" onClick={onVideoUpload}>
                <Video size={16} className="transition-transform duration-300 group-hover:rotate-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Video</TooltipContent>
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
                  className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group"
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
                className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group"
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
                className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group"
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
                className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group"
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
                className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group"
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
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group" onClick={onAddFrame}>
                <Add size={16} className="transition-transform duration-300 group-hover:rotate-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Add Frame</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(147,51,234,0.4)] hover:bg-purple-500 hover:text-white group" onClick={onAddNestedFrame}>
                <Square size={16} className="transition-transform duration-300 group-hover:scale-90" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Add Nested Frame</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
