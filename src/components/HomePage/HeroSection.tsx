import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import FloatingDots from "./FloatingDots";
import FloatingCursors from "./FloatingCursors";

export default function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center px-4 pt-32 pb-20 overflow-hidden">
      {/* Floating Background Elements */}
      <FloatingDots count={80} />
      <FloatingCursors />
      
      {/* Hero Content */}
      <motion.div
        className="relative z-10 text-center max-w-[720px] mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[hsl(40,20%,92%)] leading-tight mb-6">
          Own your Adaptive UI, Slides and Animation design tool
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-[600px] mx-auto mb-10 leading-relaxed">
          Drawtir gives you a visual reasoning canvas for your app — where UI UX design meet, animation, video or a presentation canvas with AI-driven design agent.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            size="lg" 
            className="px-8 h-12 text-base font-medium"
            onClick={() => window.open('mailto:hello@drawtir.com?subject=MIT%20License%20Request', '_blank')}
          >
            Request MIT License
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="px-8 h-12 text-base font-medium border-foreground/20 text-foreground hover:bg-foreground/10"
            onClick={() => window.location.href = '/gallery'}
          >
            View Examples
          </Button>
        </div>
      </motion.div>
      
      {/* Video Block */}
      <motion.div
        className="relative z-10 mt-16 w-full max-w-[720px] mx-auto px-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-card to-card/60 backdrop-blur-sm border border-border/30 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10" />
          <video
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="https://fpmlrhpmtmaurrnhsmca.supabase.co/storage/v1/object/public/media/drawtir-demo.mp4" type="video/mp4" />
          </video>
          {/* Fallback placeholder */}
          <div className="absolute inset-0 flex items-center justify-center bg-card/80">
            <div className="text-center text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <p className="text-sm font-medium">Drawtir Demo</p>
              <p className="text-xs mt-1">Video preview coming soon</p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
