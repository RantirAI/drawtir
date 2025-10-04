import { Menu, Share2, Download, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ThemeToggle } from "@/components/ThemeToggle";

interface EditorTopBarProps {
  projectName?: string;
  onExport?: () => void;
}

export default function EditorTopBar({ projectName = "Untitled Poster", onExport }: EditorTopBarProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-background/80 backdrop-blur-xl border-b">
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/")}>
              Home
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/gallery")}>
              Gallery
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="text-sm font-semibold">{projectName}</span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button variant="default" size="sm" className="gap-2" onClick={onExport}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
