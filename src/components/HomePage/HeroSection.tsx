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
        <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border/30 shadow-2xl">
          <video
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="https://fpmlrhpmtmaurrnhsmca.supabase.co/storage/v1/object/public/media/drawtir-demo.mp4" type="video/mp4" />
          </video>
        </div>
      </motion.div>
    </section>
  );
}
