import type { ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Copy, Trash2, Sparkles, RefreshCw, Layers, Box } from "lucide-react";

interface CanvasContextMenuProps {
  children: ReactNode;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onGenerate?: () => void;
  onRegenerate?: () => void;
  onGroup?: () => void;
  onWrapInFrame?: () => void;
}

export default function CanvasContextMenu({
  children,
  onDelete,
  onDuplicate,
  onGenerate,
  onRegenerate,
  onGroup,
  onWrapInFrame,
}: CanvasContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
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
        {onGroup && (
          <ContextMenuItem onClick={onGroup} className="text-xs">
            <Layers className="h-3 w-3 mr-2" />
            Group Selection
          </ContextMenuItem>
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
