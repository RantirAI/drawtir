import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import type { CanvasSnapshot } from "@/types/snapshot";
import { validateSnapshot } from "@/lib/snapshot";
import CanvasContainerNew from "@/components/Canvas/CanvasContainerNew";
import OnboardingFlow from "@/components/Onboarding/OnboardingFlow";

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
      
      // Only redirect to gallery if authenticated AND no project/new design is being created
      if (session && !searchParams.get("project") && !searchParams.get("new")) {
        navigate("/gallery");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // Only redirect to gallery if authenticated AND no project/new design is being created
      if (session && !searchParams.get("project") && !searchParams.get("new")) {
        navigate("/gallery");
      } else if (session && searchParams.get("project")) {
        // Authenticated and has project param, load the project
        loadProject();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, searchParams]);

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

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (!session) {
    navigate("/auth");
    return null;
  }

  // If authenticated, show canvas with onboarding
  return (
    <>
      <OnboardingFlow />
      <CanvasContainerNew initialSnapshot={snapshot || undefined} />
    </>
  );
}

export default Index;
