import { HambergerMenu, DocumentDownload, ExportSquare, ArrowRotateLeft, ArrowRotateRight, Setting2, Magicpen, Grid1, ArrowDown2, Maximize4 } from "iconsax-react";
import { Save, Share2, Hand, Users, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Frame } from "@/types/elements";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserPresence } from "@/hooks/useCollaborativePresence";

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
  activeUsers?: UserPresence[];
  currentUser?: { id: string; name: string; avatar: string | null } | null;
  enableCollaboration?: boolean;
  onRecenter?: () => void;
  frames?: Frame[];
  onPresentationMode?: () => void;
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
  activeUsers = [],
  currentUser = null,
  enableCollaboration = false,
  onRecenter,
  frames = [],
  onPresentationMode,
}: EditorTopBarProps) {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const allUsers = enableCollaboration && currentUser ? [
    {
      userId: currentUser.id,
      displayName: 'You',
      avatarUrl: currentUser.avatar,
      color: 'hsl(var(--primary))',
    },
    ...activeUsers,
  ] : [];

  const hasActiveUsers = allUsers.length > 1;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-16px)] sm:max-w-none">
      {/* Floating generation message */}
      {isGenerating && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <Magicpen size={12} className="text-primary animate-pulse" />
          <span className="text-xs font-medium text-foreground drop-shadow-lg whitespace-nowrap">
            {generationMessage}
          </span>
        </div>
      )}
      
      <div className="relative flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1 rounded-full bg-card/95 backdrop-blur-xl border border-border/60 dark:border-border/40 shadow-lg overflow-hidden">
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
        <div className="relative z-10 flex items-center gap-0.5 sm:gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group">
              <HambergerMenu size={12} className="transition-transform duration-300 group-hover:rotate-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-card/95 backdrop-blur-xl border-border/50">
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
          className="h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group"
          onClick={onUndo} 
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <ArrowRotateLeft size={10} className="sm:w-3 sm:h-3 transition-transform duration-300 group-hover:rotate-6" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group"
          onClick={onRedo} 
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <ArrowRotateRight size={10} className="sm:w-3 sm:h-3 transition-transform duration-300 group-hover:rotate-6" />
        </Button>

        {onSave && !hideCloudFeatures && (
          <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group" onClick={onSave} disabled={isSaving}>
            <Save size={10} className="sm:w-3 sm:h-3 transition-transform duration-300 group-hover:rotate-6" />
          </Button>
        )}

        <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group hidden sm:flex" onClick={onDownload}>
          <DocumentDownload size={10} className="sm:w-3 sm:h-3 transition-transform duration-300 group-hover:rotate-6" />
        </Button>

        <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group hidden sm:flex" onClick={onShare}>
          <Share2 size={10} className="sm:w-3 sm:h-3 transition-transform duration-300 group-hover:rotate-6" />
        </Button>

        {onTogglePanMode && (
          <Button 
            variant={isPanMode ? "default" : "ghost"} 
            size="icon" 
            className="h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group hidden sm:flex" 
            onClick={onTogglePanMode}
            title="Hand Tool (Space)"
          >
            <Hand size={10} className="sm:w-3 sm:h-3 transition-transform duration-300 group-hover:rotate-6" />
          </Button>
        )}

        {onToggleGrid && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={showGrid ? "default" : "ghost"} 
                size="icon" 
                className="h-5 w-5 sm:h-6 sm:w-6 relative transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group hidden sm:flex" 
                title="Grid Settings"
              >
                <Grid1 size={10} className="sm:w-3 sm:h-3 transition-transform duration-300 group-hover:rotate-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-xl border-border/50">
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
        
        {onRecenter && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group" 
            onClick={onRecenter}
            title="Center View (F)"
          >
            <Maximize4 size={10} className="sm:w-3 sm:h-3 transition-transform duration-300 group-hover:rotate-6" />
          </Button>
        )}

        {onPresentationMode && frames.length > 0 && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group hidden sm:flex" 
            onClick={onPresentationMode}
            title="Presentation Mode"
          >
            <Presentation size={10} className="sm:w-3 sm:h-3 transition-transform duration-300 group-hover:rotate-6" />
          </Button>
        )}
        
        <ThemeToggle />

        {/* Collaborative Users - Right side of toolbar - Hidden on mobile */}
        {enableCollaboration && hasActiveUsers && (
          <>
            <Separator orientation="vertical" className="h-4 sm:h-6 mx-0.5 sm:mx-1 hidden sm:block" />
            <div className="relative items-center gap-1 sm:gap-2 hidden sm:flex">
              {/* Glow effects behind each avatar */}
              <div className="absolute inset-0 -z-10 flex items-center justify-end">
                {allUsers.slice(0, 5).map((user, index) => (
                  <div
                    key={user.userId}
                    className="absolute blur-xl scale-125 opacity-30 w-8 sm:w-10 h-8 sm:h-10 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: user.color,
                      right: `${index * 24}px`,
                    }}
                  />
                ))}
              </div>
              
              <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />
              <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground">
                {allUsers.length}
              </span>
              
              <div className="flex -space-x-2">
                <TooltipProvider>
                  {allUsers.slice(0, 5).map((user, index) => (
                    <Tooltip key={user.userId}>
                      <TooltipTrigger asChild>
                        <div
                          className="relative transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:z-50"
                          style={{ zIndex: allUsers.length - index }}
                        >
                          <Avatar 
                            className="h-6 w-6 sm:h-8 sm:w-8 border-2 ring-2 ring-background/50 cursor-pointer"
                            style={{
                              borderColor: user.color,
                              boxShadow: `0 0 16px ${user.color}40`,
                            }}
                          >
                            <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName} />
                            <AvatarFallback 
                              className="text-[8px] sm:text-[10px] font-semibold"
                              style={{
                                backgroundColor: user.color,
                                color: 'white',
                              }}
                            >
                              {user.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {user.userId === currentUser?.id && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-primary border border-background animate-pulse" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-card/95 backdrop-blur-xl border-border/50">
                        <p className="text-xs font-medium">{user.displayName}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  
                  {allUsers.length > 5 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 border-border bg-muted text-[8px] sm:text-[10px] font-semibold text-muted-foreground ring-2 ring-background/50 transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:z-50 cursor-pointer">
                          +{allUsers.length - 5}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-card/95 backdrop-blur-xl border-border/50">
                        <p className="text-xs font-medium">
                          {allUsers.slice(5).map(u => u.displayName).join(', ')}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TooltipProvider>
              </div>
            </div>
          </>
        )}
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
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary group">
              <HambergerMenu size={12} className="transition-transform duration-300 group-hover:rotate-6" />
            </Button>
          </DropdownMenuTrigger>
        </DropdownMenu>
        
        <EditableTitle value={projectName} onChange={onProjectNameChange || (() => {})} />

        {/* Undo/Redo buttons */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-white transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary group"
          onClick={onUndo} 
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <ArrowRotateLeft size={12} className="transition-transform duration-300 group-hover:rotate-6" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-white transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary group"
          onClick={onRedo} 
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <ArrowRotateRight size={12} className="transition-transform duration-300 group-hover:rotate-6" />
        </Button>

        {onSave && !hideCloudFeatures && (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-white transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary group" onClick={onSave} disabled={isSaving}>
            <Save size={12} className="transition-transform duration-300 group-hover:rotate-6" />
          </Button>
        )}

        <Button variant="ghost" size="icon" className="h-6 w-6 text-white transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary group" onClick={onDownload}>
          <DocumentDownload size={12} className="transition-transform duration-300 group-hover:rotate-6" />
        </Button>

        <Button variant="ghost" size="icon" className="h-6 w-6 text-white transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary group" onClick={onShare}>
          <Share2 size={12} className="transition-transform duration-300 group-hover:rotate-6" />
        </Button>

        {onTogglePanMode && (
          <Button 
            variant={isPanMode ? "default" : "ghost"} 
            size="icon" 
            className="h-6 w-6 text-white transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary group" 
            onClick={onTogglePanMode}
            title="Hand Tool (Space)"
          >
            <Hand size={12} className="transition-transform duration-300 group-hover:rotate-6" />
          </Button>
        )}

        {onToggleGrid && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={showGrid ? "default" : "ghost"} 
                size="icon" 
                className="h-6 w-6 text-white relative transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:bg-primary group" 
                title="Grid Settings"
              >
                <Grid1 size={12} className="transition-transform duration-300 group-hover:rotate-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-xl border-border/50">
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

        {/* Collaborative Users - Right side of toolbar (white version) */}
        {enableCollaboration && hasActiveUsers && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <div className="relative flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span className="text-[10px] font-medium">
                {allUsers.length}
              </span>
              
              <div className="flex -space-x-2">
                {allUsers.slice(0, 5).map((user, index) => (
                  <div
                    key={user.userId}
                    className="relative"
                    style={{ zIndex: allUsers.length - index }}
                  >
                    <Avatar 
                      className="h-8 w-8 border-2 ring-2 ring-white/50"
                      style={{
                        borderColor: user.color,
                      }}
                    >
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName} />
                      <AvatarFallback 
                        className="text-[10px] font-semibold"
                        style={{
                          backgroundColor: user.color,
                          color: 'white',
                        }}
                      >
                        {user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user.userId === currentUser?.id && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-white border border-primary" />
                    )}
                  </div>
                ))}
                
                {allUsers.length > 5 && (
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/50 bg-white/20 text-[10px] font-semibold ring-2 ring-white/50">
                    +{allUsers.length - 5}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
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