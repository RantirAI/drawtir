import { Menu, Share2, Download, Save, FileDown, Undo, Redo, Settings, Hand } from "lucide-react";
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
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-card/80 backdrop-blur-xl border border-border/40 dark:border-border/25 shadow-lg">
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

      <SettingsDialog 
        open={showSettings} 
        onOpenChange={setShowSettings}
        projectId={projectId}
      />
    </div>
  );
}
