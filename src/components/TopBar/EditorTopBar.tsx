import { HambergerMenu, Share, DocumentDownload, Save2, ExportSquare, ArrowRotateLeft, ArrowRotateRight, Setting2, Magicpen, Grid1, ArrowDown2, Mouse } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EditableTitle from "@/components/Canvas/EditableTitle";
import SettingsDialog from "@/components/Canvas/SettingsDialog";
import { useState } from "react";

interface EditorTopBarProps {
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
  onSave?: () => void;
  onDownload?: () => void;
  onExport?: () => void;
  onExportAll?: () => void;
  onShare?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isSaving?: boolean;
  hideCloudFeatures?: boolean;
  projectId?: string;
  isPanMode?: boolean;
  onTogglePanMode?: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  gridSize?: number;
  onGridSizeChange?: (size: number) => void;
  gridStyle?: "lines" | "dots";
  onGridStyleChange?: (style: "lines" | "dots") => void;
  snapToGrid?: boolean;
  onSnapToGridChange?: (snap: boolean) => void;
  isGenerating?: boolean;
  generationProgress?: number;
  generationMessage?: string;
}

export default function EditorTopBar({ 
  projectName = "Untitled Poster", 
  onProjectNameChange,
  onSave,
  onDownload,
  onExport,
  onExportAll,
  onShare,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  isSaving,
  hideCloudFeatures = false,
  projectId,
  isPanMode = false,
  onTogglePanMode,
  showGrid = false,
  onToggleGrid,
  gridSize = 20,
  onGridSizeChange,
  gridStyle = "lines",
  onGridStyleChange,
  snapToGrid = false,
  onSnapToGridChange,
  isGenerating = false,
  generationProgress = 0,
  generationMessage = "Generating...",
}: EditorTopBarProps) {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50">
      {/* Floating generation message */}
      {isGenerating && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <Magicpen size={12} className="text-primary animate-pulse" />
          <span className="text-xs font-medium text-foreground drop-shadow-lg whitespace-nowrap">
            {generationMessage}
          </span>
        </div>
      )}
      
      {/* Subtle light source glow behind toolbar */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/25 via-blue-400/15 to-transparent blur-3xl scale-150" />
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/20 via-blue-300/10 to-transparent blur-2xl scale-125" />
      </div>
      
      <div className="relative flex items-center gap-1 px-2 py-1 rounded-full bg-background/40 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(59,130,246,0.2)] overflow-hidden">
        {/* Progress bar overlay */}
        {isGenerating && (
          <div 
            className="absolute inset-0 bg-primary transition-all duration-500 ease-out"
            style={{ 
              width: `${generationProgress}%`,
              transformOrigin: 'left',
              borderRadius: '9999px 0 0 9999px'
            }}
          >
            {/* Shimmer effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{ 
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite linear'
              }}
            />
          </div>
        )}
        
        {/* Content - original (dark) */}
        <div className="relative z-10 flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <HambergerMenu size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/")}>
              Home
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/gallery")}>
              Gallery
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowSettings(true)}>
              <Setting2 size={12} className="mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExport}>
              <ExportSquare size={12} className="mr-2" />
              Export Current Frame
            </DropdownMenuItem>
            {onExportAll && (
              <DropdownMenuItem onClick={onExportAll}>
                <DocumentDownload size={12} className="mr-2" />
                Export All Frames
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <EditableTitle value={projectName} onChange={onProjectNameChange || (() => {})} />

        {/* Undo/Redo buttons */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={onUndo} 
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <ArrowRotateLeft size={12} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={onRedo} 
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <ArrowRotateRight size={12} />
        </Button>

        {onSave && !hideCloudFeatures && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onSave} disabled={isSaving}>
            <Save2 size={12} />
          </Button>
        )}

        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDownload}>
          <DocumentDownload size={12} />
        </Button>

        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onShare}>
          <Share size={12} />
        </Button>

        {onTogglePanMode && (
          <Button 
            variant={isPanMode ? "default" : "ghost"} 
            size="icon" 
            className="h-6 w-6" 
            onClick={onTogglePanMode}
            title="Hand Tool (Space)"
          >
            <Mouse size={12} />
          </Button>
        )}

        {onToggleGrid && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={showGrid ? "default" : "ghost"} 
                size="icon" 
                className="h-6 w-6 relative" 
                title="Grid Settings"
              >
                <Grid1 size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-between px-2 py-1.5">
                <Label htmlFor="grid-toggle" className="text-sm font-normal cursor-pointer">Show Grid</Label>
                <Switch
                  id="grid-toggle"
                  checked={showGrid}
                  onCheckedChange={onToggleGrid}
                />
              </div>
              <Separator className="my-1" />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span className="text-sm">Grid Size: {gridSize}px</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={gridSize?.toString()} onValueChange={(v) => onGridSizeChange?.(parseInt(v))}>
                    <DropdownMenuRadioItem value="10">10px</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="20">20px</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="50">50px</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="100">100px</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span className="text-sm">Grid Style: {gridStyle}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={gridStyle} onValueChange={(v) => onGridStyleChange?.(v as "lines" | "dots")}>
                    <DropdownMenuRadioItem value="lines">Lines</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dots">Dots</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <Separator className="my-1" />
              <div className="flex items-center justify-between px-2 py-1.5">
                <Label htmlFor="snap-toggle" className="text-sm font-normal cursor-pointer">Snap to Grid</Label>
                <Switch
                  id="snap-toggle"
                  checked={snapToGrid}
                  onCheckedChange={onSnapToGridChange}
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <ThemeToggle />
        </div>
        
        {/* Content - duplicate (white) - clipped by progress */}
        {isGenerating && (
          <div 
            className="absolute inset-0 z-20 flex items-center gap-1 px-2 py-1 pointer-events-none"
            style={{
              clipPath: `inset(0 ${100 - generationProgress}% 0 0)`
            }}
          >
            <div className="flex items-center gap-1 text-white [&_svg]:text-white">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:text-white">
              <HambergerMenu size={12} />
            </Button>
          </DropdownMenuTrigger>
        </DropdownMenu>
        
        <EditableTitle value={projectName} onChange={onProjectNameChange || (() => {})} />

        {/* Undo/Redo buttons */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-white hover:text-white" 
          onClick={onUndo} 
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <ArrowRotateLeft size={12} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-white hover:text-white" 
          onClick={onRedo} 
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <ArrowRotateRight size={12} />
        </Button>

        {onSave && !hideCloudFeatures && (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:text-white" onClick={onSave} disabled={isSaving}>
            <Save2 size={12} />
          </Button>
        )}

        <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:text-white" onClick={onDownload}>
          <DocumentDownload size={12} />
        </Button>

        <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:text-white" onClick={onShare}>
          <Share size={12} />
        </Button>

        {onTogglePanMode && (
          <Button 
            variant={isPanMode ? "default" : "ghost"} 
            size="icon" 
            className="h-6 w-6 text-white hover:text-white" 
            onClick={onTogglePanMode}
            title="Hand Tool (Space)"
          >
            <Mouse size={12} />
          </Button>
        )}

        {onToggleGrid && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={showGrid ? "default" : "ghost"} 
                size="icon" 
                className="h-6 w-6 text-white hover:text-white relative" 
                title="Grid Settings"
              >
                <Grid1 size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-between px-2 py-1.5">
                <Label htmlFor="grid-toggle-mobile" className="text-sm font-normal cursor-pointer">Show Grid</Label>
                <Switch
                  id="grid-toggle-mobile"
                  checked={showGrid}
                  onCheckedChange={onToggleGrid}
                />
              </div>
              <Separator className="my-1" />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span className="text-sm">Grid Size: {gridSize}px</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={gridSize?.toString()} onValueChange={(v) => onGridSizeChange?.(parseInt(v))}>
                    <DropdownMenuRadioItem value="10">10px</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="20">20px</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="50">50px</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="100">100px</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span className="text-sm">Grid Style: {gridStyle}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={gridStyle} onValueChange={(v) => onGridStyleChange?.(v as "lines" | "dots")}>
                    <DropdownMenuRadioItem value="lines">Lines</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dots">Dots</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <Separator className="my-1" />
              <div className="flex items-center justify-between px-2 py-1.5">
                <Label htmlFor="snap-toggle-mobile" className="text-sm font-normal cursor-pointer">Snap to Grid</Label>
                <Switch
                  id="snap-toggle-mobile"
                  checked={snapToGrid}
                  onCheckedChange={onSnapToGridChange}
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <ThemeToggle />
            </div>
          </div>
        )}
      </div>

      <SettingsDialog 
        open={showSettings} 
        onOpenChange={setShowSettings}
        projectId={projectId}
      />
      
      {/* CSS for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          from { background-position: -200% 0; }
          to { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
