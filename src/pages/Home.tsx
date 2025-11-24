import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import HomeNav from "@/components/HomePage/HomeNav";
import AnnounceBanner from "@/components/HomePage/AnnounceBanner";
import FeaturesSection from "@/components/HomePage/FeaturesSection";
import DraggablePanel from "@/components/HomePage/DraggablePanel";
import PageFooter from "@/components/Footer/PageFooter";
import homeBackground from "@/assets/home-background.svg";
import panel1 from "@/assets/panel-1.svg";
import panel2 from "@/assets/panel-2.svg";
import panel3 from "@/assets/panel-3.svg";
import PricingSection from "@/components/HomePage/PricingSection";

const Home = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="dark min-h-screen bg-background relative overflow-hidden">
      <AnnounceBanner />
      <HomeNav />
      
      {/* Background */}
      <div 
        className="fixed inset-0 z-0 opacity-40"
        style={{
          backgroundImage: `url(${homeBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Draggable Decorative Panels */}
      <DraggablePanel initialX={80} initialY={180} zIndex={5}>
        <img src={panel1} alt="AI Generator Panel" className="w-[170px] opacity-80" />
      </DraggablePanel>
      
      <DraggablePanel initialX={window.innerWidth - 280} initialY={120} zIndex={5}>
        <img src={panel2} alt="Style Panel" className="w-[190px] opacity-80" />
      </DraggablePanel>
      
      <DraggablePanel initialX={150} initialY={window.innerHeight - 400} zIndex={5}>
        <img src={panel3} alt="Layers Panel" className="w-[264px] opacity-80" />
      </DraggablePanel>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-16">
        <div className="text-center space-y-6 max-w-4xl">
          <h1 className="text-6xl md:text-7xl font-bold text-foreground">
            Design Better,
            <br />
            <span className="text-primary">Launch Faster</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create stunning visuals with our powerful design studio. 
            From posters to graphics, bring your ideas to life.
          </p>
        </div>
      </div>

      {/* Features Section */}
      <FeaturesSection />

      {/* Pricing Section */}
      <PricingSection />

      <PageFooter />
    </div>
  );
};

export default Home;
