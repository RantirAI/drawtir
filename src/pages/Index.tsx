import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import type { CanvasSnapshot } from "@/types/snapshot";
import { validateSnapshot } from "@/lib/snapshot";
import CanvasContainerNew from "@/components/Canvas/CanvasContainerNew";
import AnnounceBanner from "@/components/HomePage/AnnounceBanner";
import HomeNav from "@/components/HomePage/HomeNav";
import AuthModal from "@/components/HomePage/AuthModal";
import DraggablePanel from "@/components/HomePage/DraggablePanel";
import canvasBg from "@/assets/canvas-background.svg";
import panel1 from "@/assets/panel-1.svg";
import panel2 from "@/assets/panel-2.svg";
import panel3 from "@/assets/panel-3.svg";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [snapshot, setSnapshot] = useState<CanvasSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Only redirect to gallery if authenticated AND no project is being loaded
      if (session && !searchParams.get("project")) {
        navigate("/gallery");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // Only redirect to gallery if authenticated AND no project is being loaded
      if (session && !searchParams.get("project")) {
        navigate("/gallery");
      } else if (session) {
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

  // If not authenticated, show homepage with login modal
  if (!session) {
  return (
    <div className="min-h-screen bg-[#0A0A0B] dark">
      <AnnounceBanner />
      <HomeNav onOpenAuth={() => setAuthModalOpen(true)} />
      
      <div className="relative min-h-[calc(100vh-120px)] overflow-hidden pt-20">
        {/* Gradient Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at top left, rgba(30, 41, 59, 0.4) 0%, rgba(10, 10, 11, 1) 50%)",
          }}
        />

        {/* Bento Grid Container - Centered */}
        <div className="relative container mx-auto px-8 py-16 h-full flex items-center justify-center">
          <div className="w-full max-w-[720px] space-y-6">
            {/* Row 1: Three cards with images */}
            <div className="grid grid-cols-3 gap-4">
              {/* Card 1 */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg mb-4"></div>
                <h3 className="text-sm font-semibold text-white mb-2">Vibe design</h3>
                <p className="text-xs text-white/60">Tell Drawtir what you want to create and watch the AI work its magic.</p>
              </div>

              {/* Card 2 */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mb-4"></div>
                <h3 className="text-sm font-semibold text-white mb-2">Edit visually</h3>
                <p className="text-xs text-white/60">Adjust colors, layouts and styles with manual edit or with the style editor.</p>
              </div>

              {/* Card 3 */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg mb-4"></div>
                <h3 className="text-sm font-semibold text-white mb-2">Brand Guide</h3>
                <p className="text-xs text-white/60">Create beautiful UIs, bring your own design systems and components.</p>
              </div>
            </div>

            {/* Row 2: Two larger cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Large Card 1 */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8">
                <h3 className="text-lg font-semibold text-white mb-3">Open source & free</h3>
                <p className="text-sm text-white/60">Work together, share projects, and build with your team seamlessly or fork and host it yourself with your own AI API keys.</p>
              </div>

              {/* Large Card 2 */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8">
                <h3 className="text-lg font-semibold text-white mb-3">Export & Embed</h3>
                <p className="text-sm text-white/60">Get production-ready code design editor built around your own Figma, Canvas or Web Assets to finetune your Drawtir SDK experience.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Remove draggable panels - they're not needed anymore */}
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
    );
  }

  // If authenticated, show canvas editor
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">
        <CanvasContainerNew initialSnapshot={snapshot || undefined} />
      </div>
    </div>
  );
};

export default Index;
