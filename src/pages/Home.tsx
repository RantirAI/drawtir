import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import HomeNav from "@/components/HomePage/HomeNav";
import AnnounceBanner from "@/components/HomePage/AnnounceBanner";
import FeaturesSection from "@/components/HomePage/FeaturesSection";
import PageFooter from "@/components/Footer/PageFooter";
import homeBackground from "@/assets/home-background.svg";
import panel1Home from "@/assets/panel-1-home.svg";
import panel2Home from "@/assets/panel-2-home.svg";
import panel3Home from "@/assets/panel-3-home.svg";

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
        className="fixed inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `url(${homeBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Static Decorative Panels */}
      <div className="fixed left-24 top-48 z-0 pointer-events-none">
        <img src={panel1Home} alt="Panel 1" className="w-48 opacity-60" />
      </div>
      
      <div className="fixed right-24 top-40 z-0 pointer-events-none">
        <img src={panel2Home} alt="Panel 2" className="w-56 opacity-60" />
      </div>
      
      <div className="fixed left-48 bottom-32 z-0 pointer-events-none">
        <img src={panel3Home} alt="Panel 3" className="w-40 opacity-60" />
      </div>

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

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
            {isLoggedIn ? (
              <>
                <Button 
                  size="default" 
                  onClick={() => navigate("/gallery")}
                  className="px-6"
                >
                  Go to Gallery
                </Button>
                <Button 
                  size="default" 
                  variant="outline"
                  onClick={() => navigate("/editor")}
                  className="px-6"
                >
                  Create New Project
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="default" 
                  onClick={() => navigate("/auth")}
                  className="px-6"
                >
                  Get Started Free
                </Button>
                <Button 
                  size="default" 
                  variant="outline"
                  onClick={() => navigate("/pricing")}
                  className="px-6"
                >
                  See Pricing
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <FeaturesSection />

      <PageFooter />
    </div>
  );
};

export default Home;
