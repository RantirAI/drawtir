import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import type { CanvasSnapshot } from "@/types/snapshot";
import { validateSnapshot } from "@/lib/snapshot";
import CanvasContainerNew from "@/components/Canvas/CanvasContainerNew";
import OnboardingFlow from "@/components/Onboarding/OnboardingFlow";
import { useSubscription } from "@/hooks/useSubscription";

const EditorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [snapshot, setSnapshot] = useState<CanvasSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { subscribed, isLoading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Redirect to auth if not authenticated
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // Redirect to auth if not authenticated
      if (!session) {
        navigate("/auth");
      } else if (searchParams.get("project")) {
        // Authenticated and has project param, load the project
        loadProject();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, searchParams]);

  // Redirect to pricing if not subscribed
  useEffect(() => {
    if (!isLoading && session && !subscriptionLoading && !subscribed) {
      navigate("/pricing");
    }
  }, [isLoading, session, subscriptionLoading, subscribed, navigate]);

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

  // Show loading state while checking auth or subscription
  if (isLoading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  // If not authenticated or not subscribed, redirect happens in useEffect
  if (!session || !subscribed) {
    return null;
  }

  // If authenticated and subscribed, show canvas with onboarding
  return (
    <>
      <OnboardingFlow />
      <CanvasContainerNew initialSnapshot={snapshot || undefined} />
    </>
  );
}

export default EditorPage;
