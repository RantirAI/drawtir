import { Home2, Gallery, Setting2, Logout, Colorfilter, Ruler } from "iconsax-react";
import { NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThemeToggle } from "./ThemeToggle";
export default function Sidebar() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };
  const navItems = [{
    to: "/",
    icon: Home2,
    label: "Create"
  }, {
    to: "/gallery",
    icon: Gallery,
    label: "Gallery"
  }, {
    to: "/settings",
    icon: Setting2,
    label: "Settings"
  }];
  return <aside className="w-60 border-r bg-sidebar-background border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h2 className="text-sm font-semibold text-foreground">Postir</h2>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => <NavLink key={item.to} to={item.to} className={({
        isActive
      }) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}>
            <item.icon size={16} />
            {item.label}
          </NavLink>)}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors w-full">
          <Logout size={16} />
          Sign Out
        </button>
      </div>
    </aside>;
}