import type { ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Copy, Trash2, Sparkles, RefreshCw, Layers, Box, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Palette, PenTool, Wand2, Eye } from "lucide-react";

interface CanvasContextMenuProps {
  children: ReactNode;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onGenerate?: () => void;
  onRegenerate?: () => void;
  onGroup?: () => void;
  onWrapInFrame?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onEditFill?: () => void;
  onEditStroke?: () => void;
  onEditAnimations?: () => void;
  onMakeEditable?: () => void;
}

export default function CanvasContextMenu({
  children,
  onDelete,
  onDuplicate,
  onGenerate,
  onRegenerate,
  onGroup,
  onWrapInFrame,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onEditFill,
  onEditStroke,
  onEditAnimations,
  onMakeEditable,
}: CanvasContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="relative">{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {onGenerate && (
          <>
            <ContextMenuItem onClick={onGenerate} className="text-xs">
              <Sparkles className="h-3 w-3 mr-2" />
              Generate New
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        {onRegenerate && (
          <>
            <ContextMenuItem onClick={onRegenerate} className="text-xs">
              <RefreshCw className="h-3 w-3 mr-2" />
              Regenerate
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        {onDuplicate && (
          <ContextMenuItem onClick={onDuplicate} className="text-xs">
            <Copy className="h-3 w-3 mr-2" />
            Duplicate
          </ContextMenuItem>
        )}
        
        {/* Arrangement options */}
        {(onBringToFront || onSendToBack || onBringForward || onSendBackward) && (
          <>
            <ContextMenuSeparator />
            {onBringToFront && (
              <ContextMenuItem onClick={onBringToFront} className="text-xs">
                <ChevronsUp className="h-3 w-3 mr-2" />
                Bring to Front
              </ContextMenuItem>
            )}
            {onBringForward && (
              <ContextMenuItem onClick={onBringForward} className="text-xs">
                <ArrowUp className="h-3 w-3 mr-2" />
                Bring Forward
              </ContextMenuItem>
            )}
            {onSendBackward && (
              <ContextMenuItem onClick={onSendBackward} className="text-xs">
                <ArrowDown className="h-3 w-3 mr-2" />
                Send Backward
              </ContextMenuItem>
            )}
            {onSendToBack && (
              <ContextMenuItem onClick={onSendToBack} className="text-xs">
                <ChevronsDown className="h-3 w-3 mr-2" />
                Send to Back
              </ContextMenuItem>
            )}
          </>
        )}
        
        {/* Edit options */}
        {(onEditFill || onEditStroke || onEditAnimations || onMakeEditable) && (
          <>
            <ContextMenuSeparator />
            {onMakeEditable && (
              <ContextMenuItem onClick={onMakeEditable} className="text-xs">
                <Eye className="h-3 w-3 mr-2" />
                Make Editable
              </ContextMenuItem>
            )}
            {onEditFill && (
              <ContextMenuItem onClick={onEditFill} className="text-xs">
                <Palette className="h-3 w-3 mr-2" />
                Edit Fill
              </ContextMenuItem>
            )}
            {onEditStroke && (
              <ContextMenuItem onClick={onEditStroke} className="text-xs">
                <PenTool className="h-3 w-3 mr-2" />
                Edit Stroke
              </ContextMenuItem>
            )}
            {onEditAnimations && (
              <ContextMenuItem onClick={onEditAnimations} className="text-xs">
                <Wand2 className="h-3 w-3 mr-2" />
                Animations
              </ContextMenuItem>
            )}
          </>
        )}
        
        {onGroup && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onGroup} className="text-xs">
              <Layers className="h-3 w-3 mr-2" />
              Group Selection
            </ContextMenuItem>
          </>
        )}
        {onWrapInFrame && (
          <ContextMenuItem onClick={onWrapInFrame} className="text-xs">
            <Box className="h-3 w-3 mr-2" />
            Wrap in Frame
          </ContextMenuItem>
        )}
        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onDelete} className="text-xs text-destructive">
              <Trash2 className="h-3 w-3 mr-2" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
