import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import CanvasContainerNew from "@/components/Canvas/CanvasContainerNew";
import { Loader2 } from "lucide-react";
import type { CanvasSnapshot } from "@/types/snapshot";
import { validateSnapshot } from "@/lib/snapshot";
import PageFooter from "@/components/Footer/PageFooter";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [snapshot, setSnapshot] = useState<CanvasSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else {
        loadProject();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProject = async () => {
    const projectId = searchParams.get("project");
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("posters")
        .select("canvas_data")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      
      if (data?.canvas_data && validateSnapshot(data.canvas_data)) {
        setSnapshot(data.canvas_data);
      }
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">
        <CanvasContainerNew initialSnapshot={snapshot || undefined} />
      </div>
    </div>
  );
};

export default Index;
