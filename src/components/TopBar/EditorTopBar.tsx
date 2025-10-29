import { Menu, Share2, Download, Save, FileDown, Undo, Redo, Settings, Hand, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
          <Sparkles className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-xs font-medium text-foreground drop-shadow-lg whitespace-nowrap">
            {generationMessage}
          </span>
        </div>
      )}
      
      <div className="relative flex items-center gap-1 px-2 py-1 rounded-full bg-card/80 backdrop-blur-xl border border-border/40 dark:border-border/25 shadow-lg overflow-hidden">
        {/* Progress bar overlay */}
        {isGenerating && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/40 to-primary/30 transition-all duration-500 ease-out"
            style={{ 
              width: `${generationProgress}%`,
              transformOrigin: 'left'
            }}
          >
            {/* Shimmer effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              style={{ 
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite linear'
              }}
            />
          </div>
        )}
        
        {/* Content - positioned above progress */}
        <div className="relative z-10 flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Menu className="h-3 w-3" />
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
              <Settings className="h-3 w-3 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExport}>
              <FileDown className="h-3 w-3 mr-2" />
              Export Current Frame
            </DropdownMenuItem>
            {onExportAll && (
              <DropdownMenuItem onClick={onExportAll}>
                <Download className="h-3 w-3 mr-2" />
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
          <Undo className="h-3 w-3" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={onRedo} 
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-3 w-3" />
        </Button>

        {onSave && !hideCloudFeatures && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onSave} disabled={isSaving}>
            <Save className="h-3 w-3" />
          </Button>
        )}

        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDownload}>
          <Download className="h-3 w-3" />
        </Button>

        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onShare}>
          <Share2 className="h-3 w-3" />
        </Button>

        {onTogglePanMode && (
          <Button 
            variant={isPanMode ? "default" : "ghost"} 
            size="icon" 
            className="h-6 w-6" 
            onClick={onTogglePanMode}
            title="Hand Tool (Space)"
          >
            <Hand className="h-3 w-3" />
          </Button>
        )}
        
        <ThemeToggle />
        </div>
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
