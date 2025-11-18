import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
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
              className="text-lg px-8"
            >
              See Pricing
            </Button>
          </div>
        </div>
      </div>

      <PageFooter />
    </div>
  );
};

export default Home;
