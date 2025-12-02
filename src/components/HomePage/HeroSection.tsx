import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import FloatingDots from "./FloatingDots";
import FloatingCursors from "./FloatingCursors";

export default function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center px-4 pt-32 pb-20 overflow-hidden">
      {/* Floating Background Elements */}
      <FloatingDots />
      <FloatingCursors />
      
      {/* Hero Content */}
      <motion.div
        className="relative z-10 text-center max-w-[720px] mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-[hsl(40,20%,92%)] leading-tight mb-6">
          Your Open Creative Engine for UI, Motion & Slides
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-[600px] mx-auto mb-10 leading-relaxed">
          Build UIs, videos, slides, and interactive visuals — backed by an open, self-hostable editor that grows with your product.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button 
            size="sm" 
            className="px-4 h-8 text-sm font-medium"
            onClick={() => window.location.href = '/auth'}
          >
            Get Started
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="px-4 h-8 text-sm font-medium border-foreground/20 text-foreground hover:bg-foreground/10"
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
          >
            View Pricing
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
            <source src="/drawtir-demo.mp4" type="video/mp4" />
          </video>
        </div>
      </motion.div>
    </section>
  );
}
