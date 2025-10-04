import { MousePointer2, PenTool, Square, Type, Image as ImageIcon, MoreHorizontal, Download, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BottomToolbarProps {
  onImageUpload: () => void;
  onDownload: () => void;
  onSave: () => void;
  onAddFrame: () => void;
  isSaving?: boolean;
}

export default function BottomToolbar({ onImageUpload, onDownload, onSave, onAddFrame, isSaving }: BottomToolbarProps) {
  return (
    <TooltipProvider>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-full bg-card/80 backdrop-blur-xl border shadow-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-[18px] w-[18px] rounded-full">
                <MousePointer2 className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Select</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-[18px] w-[18px] rounded-full">
                <PenTool className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Draw</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-[18px] w-[18px] rounded-full">
                <Square className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Shape</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-[18px] w-[18px] rounded-full">
                <Type className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Text</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-[18px] w-[18px] rounded-full" onClick={onImageUpload}>
                <ImageIcon className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Upload Image</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-4 mx-0.5" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-[18px] w-[18px] rounded-full" onClick={onAddFrame}>
                <Plus className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Add Frame</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-[18px] w-[18px] rounded-full" onClick={onSave} disabled={isSaving}>
                <Save className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Save</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-[18px] w-[18px] rounded-full" onClick={onDownload}>
                <Download className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Download</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
