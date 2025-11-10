import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session) {
        navigate("/gallery");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      if (session) {
        navigate("/gallery");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] dark">
      <AnnounceBanner />
      <HomeNav onOpenAuth={() => setAuthModalOpen(true)} />
      
      <div className="relative min-h-[calc(100vh-120px)] overflow-hidden">
        {/* Gradient Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at top left, rgba(30, 41, 59, 0.4) 0%, rgba(10, 10, 11, 1) 50%)",
          }}
        />
        
        {/* Canvas Background Pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${canvasBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Bento Grid Container */}
        <div className="relative container mx-auto px-8 py-16 h-full">
          <div className="grid grid-cols-3 gap-6 h-[600px]">
            {/* Box 1 - Image */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              <img src={panel1} alt="Panel 1" className="w-full h-full object-cover" />
            </div>
            
            {/* Box 2 - Image */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              <img src={panel2} alt="Panel 2" className="w-full h-full object-cover" />
            </div>
            
            {/* Box 3 - Image */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              <img src={panel3} alt="Panel 3" className="w-full h-full object-cover" />
            </div>
            
            {/* Box 4 - Featured Content with Frame */}
            <div className="col-span-2 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-cyan-600/20 backdrop-blur-sm rounded-2xl border-2 border-white/30 p-12 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                <span className="text-xs text-white/80">Frame 1</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                Vibe design
              </h2>
              <p className="text-white/70 text-lg mb-6">
                Tell Drawtir what you want to create and select the tags for the "best" framework and watch the AI work its magic.
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/20 text-white transition-colors">
                  Learn More
                </button>
                <button className="px-6 py-3 bg-white text-black hover:bg-white/90 rounded-lg transition-colors font-medium">
                  Get Started
                </button>
              </div>
            </div>
            
            {/* Box 5 - Secondary Content */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 flex flex-col justify-center">
              <h3 className="text-2xl font-semibold text-white mb-3">
                Export & Embed
              </h3>
              <p className="text-white/60 text-sm">
                Get production-ready code design editor built around your own Figma, Canvas or Web Assets to finalize your Drawtir SDK experience.
              </p>
            </div>
          </div>
        </div>

        {/* Draggable Panels */}
        <DraggablePanel initialX={100} initialY={200} zIndex={50}>
          <img src={panel1} alt="Draggable Panel 1" className="w-48 opacity-80 hover:opacity-100 transition-opacity" />
        </DraggablePanel>
        
        <DraggablePanel initialX={window.innerWidth - 300} initialY={150} zIndex={50}>
          <img src={panel2} alt="Draggable Panel 2" className="w-56 opacity-80 hover:opacity-100 transition-opacity" />
        </DraggablePanel>
        
        <DraggablePanel initialX={window.innerWidth - 350} initialY={500} zIndex={50}>
          <img src={panel3} alt="Draggable Panel 3" className="w-64 opacity-80 hover:opacity-100 transition-opacity" />
        </DraggablePanel>

        {/* Draggable Frame Badge */}
        <DraggablePanel initialX={window.innerWidth / 2 - 50} initialY={100} zIndex={60}>
          <div className="bg-purple-600/30 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-purple-400/50 shadow-lg">
            <span className="text-sm text-white font-medium">Frame 1</span>
          </div>
        </DraggablePanel>
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
};

export default Index;
