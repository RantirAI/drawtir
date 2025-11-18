import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import HomeNav from "@/components/HomePage/HomeNav";
import AnnounceBanner from "@/components/HomePage/AnnounceBanner";
import DraggablePanel from "@/components/HomePage/DraggablePanel";
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

      {/* Draggable Panels */}
      <DraggablePanel initialX={100} initialY={200} zIndex={5}>
        <img src={panel1Home} alt="Panel 1" className="w-64 opacity-80" />
      </DraggablePanel>
      
      <DraggablePanel initialX={window.innerWidth - 350} initialY={150} zIndex={5}>
        <img src={panel2Home} alt="Panel 2" className="w-72 opacity-80" />
      </DraggablePanel>
      
      <DraggablePanel initialX={200} initialY={window.innerHeight - 300} zIndex={5}>
        <img src={panel3Home} alt="Panel 3" className="w-56 opacity-80" />
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

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto pt-8">
            <div className="bg-background/10 backdrop-blur-sm border border-border/20 rounded-lg p-6 text-left">
              <h3 className="text-xl font-bold text-foreground mb-2">Vibe design & storyboarding</h3>
              <p className="text-sm text-muted-foreground">Tell Drawtir what you want to create and select the tags for the "best" framework and watch the AI work its magic.</p>
            </div>
            <div className="bg-background/10 backdrop-blur-sm border border-border/20 rounded-lg p-6 text-left">
              <h3 className="text-xl font-bold text-foreground mb-2">A Whiteboard with Superpowers</h3>
              <p className="text-sm text-muted-foreground">Adjust colors, layouts and styles with manual edit and natural language or with the style editor.</p>
            </div>
            <div className="bg-background/10 backdrop-blur-sm border border-border/20 rounded-lg p-6 text-left">
              <h3 className="text-xl font-bold text-foreground mb-2">Brand Guide & Media Storage</h3>
              <p className="text-sm text-muted-foreground">Create beautiful UIs, bring your own design systems and components.</p>
            </div>
            <div className="bg-background/10 backdrop-blur-sm border border-border/20 rounded-lg p-6 text-left">
              <h3 className="text-xl font-bold text-foreground mb-2">Animate & Export Commercials</h3>
              <p className="text-sm text-muted-foreground">With Drawtir's story boarding and commercial editing animations the Rantir Studio team brings a timeline view to any creation.</p>
            </div>
            <div className="bg-background/10 backdrop-blur-sm border border-border/20 rounded-lg p-6 text-left">
              <h3 className="text-xl font-bold text-foreground mb-2">Generate Images & Video</h3>
              <p className="text-sm text-muted-foreground">Our Studio made this SDK kit for quick video and imagery presentations and high quality video support - now its released to the public.</p>
            </div>
            <div className="bg-background/10 backdrop-blur-sm border border-border/20 rounded-lg p-6 text-left">
              <h3 className="text-xl font-bold text-foreground mb-2">For Slides, UI or Presentations</h3>
              <p className="text-sm text-muted-foreground">Your frames are your canvas, and create presentation, website, poster or social media templates all in one place.</p>
            </div>
            <div className="bg-background/10 backdrop-blur-sm border border-border/20 rounded-lg p-6 text-left md:col-span-2 lg:col-span-1">
              <h3 className="text-xl font-bold text-foreground mb-2">Open source & free (unless using Rantir Studio Cloud)</h3>
              <p className="text-sm text-muted-foreground">Work together, share projects, and build with your team seamlessly or fork and host it yourself with your own AI API keys.</p>
            </div>
            <div className="bg-background/10 backdrop-blur-sm border border-border/20 rounded-lg p-6 text-left md:col-span-2">
              <h3 className="text-xl font-bold text-foreground mb-2">Export & Embed</h3>
              <p className="text-sm text-muted-foreground">Get production-ready code design editor built around your own Figma, Canvas or Web Assets to finetune your own Drawtir SDK experience. Export to your favorite IDE and integrate directly into your workflow and even white-label it.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            {isLoggedIn ? (
              <>
                <Button 
                  size="lg" 
                  onClick={() => navigate("/gallery")}
                  className="text-lg px-8"
                >
                  Go to Gallery
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/editor")}
                  className="text-lg px-8"
                >
                  Create New Project
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth")}
                  className="text-lg px-8"
                >
                  Get Started Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/pricing")}
                  className="text-lg px-8 text-white hover:text-white"
                >
                  See Pricing
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <PageFooter />
    </div>
  );
};

export default Home;
