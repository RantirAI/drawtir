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
import DrawtirFooter from "@/components/Footer/DrawtirFooter";
import homeBackground from "@/assets/home-background.svg";
import panel1 from "@/assets/panel-1-home.svg";
import panel2 from "@/assets/panel-2-home.svg";
import panel3 from "@/assets/panel-3-home.svg";

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

  // If not authenticated, show homepage with login modal
  if (!session) {
  return (
    <div className="min-h-screen bg-[#0A0A0B] dark relative">
      <AnnounceBanner />
      <HomeNav onOpenAuth={() => setAuthModalOpen(true)} />
      
      <div className="relative min-h-[calc(100vh-60px)] overflow-hidden flex items-center justify-center" style={{ paddingTop: '80px' }}>
        {/* Gradient Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at top left, rgba(30, 41, 59, 0.4) 0%, rgba(10, 10, 11, 1) 50%)",
          }}
        />

        {/* Background Frame */}
        <div className="absolute" style={{ 
          width: '1317px', 
          height: '824px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
          <img src={homeBackground} alt="" className="w-full h-full opacity-20" />
        </div>

        {/* Blue Frame Container with Editable Title */}
        <DraggablePanel
          initialX={typeof window !== 'undefined' ? (window.innerWidth - 800) / 2 : 200}
          initialY={typeof window !== 'undefined' ? (window.innerHeight - 600) / 2 : 100}
          zIndex={20}
        >
          <div style={{
            width: '800px',
            height: '600px',
            border: '2px solid #3B82F6',
            borderRadius: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            position: 'relative'
          }}>
            {/* Frame Title */}
            <div className="absolute -top-6 left-0 right-0 flex justify-center pointer-events-none">
              <div className="text-white text-sm font-medium bg-[#0A0A0B] px-3 py-1 rounded">
                Frame 1
              </div>
            </div>

            {/* Bento Grid Content */}
            <div className="w-full h-full p-12 flex items-center justify-center pointer-events-none">
              <div className="w-full max-w-[600px] space-y-4">
                {/* Row 1: Three cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg mb-3"></div>
                    <h3 className="text-xs font-semibold text-white mb-1">Vibe design</h3>
                    <p className="text-[10px] text-white/60">Tell Drawtir what you want to create.</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mb-3"></div>
                    <h3 className="text-xs font-semibold text-white mb-1">Edit visually</h3>
                    <p className="text-[10px] text-white/60">Adjust colors and layouts.</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg mb-3"></div>
                    <h3 className="text-xs font-semibold text-white mb-1">Brand Guide</h3>
                    <p className="text-[10px] text-white/60">Bring your design systems.</p>
                  </div>
                </div>

                {/* Row 2: Two larger cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-5">
                    <h3 className="text-sm font-semibold text-white mb-2">Open source</h3>
                    <p className="text-[10px] text-white/60">Work together and build seamlessly.</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-5">
                    <h3 className="text-sm font-semibold text-white mb-2">Export & Embed</h3>
                    <p className="text-[10px] text-white/60">Get production-ready code.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DraggablePanel>

        {/* Draggable Panels */}
        <DraggablePanel
          initialX={100}
          initialY={200}
          zIndex={30}
        >
          <img src={panel1} alt="Panel 1" className="pointer-events-none" style={{ width: '213px', height: '631px' }} />
        </DraggablePanel>
        <DraggablePanel
          initialX={typeof window !== 'undefined' ? window.innerWidth - 350 : 1000}
          initialY={200}
          zIndex={30}
        >
          <img src={panel2} alt="Panel 2" className="pointer-events-none" style={{ width: '233px', height: '126px' }} />
        </DraggablePanel>
        <DraggablePanel
          initialX={typeof window !== 'undefined' ? window.innerWidth - 400 : 1000}
          initialY={typeof window !== 'undefined' ? window.innerHeight - 600 : 400}
          zIndex={30}
        >
          <img src={panel3} alt="Panel 3" className="pointer-events-none" style={{ width: '305px', height: '542px' }} />
        </DraggablePanel>
      </div>

      <DrawtirFooter />
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
