import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface TopProgressBarProps {
  isVisible: boolean;
  message: string;
  progress: number;
}

export default function TopProgressBar({ isVisible, message, progress }: TopProgressBarProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      {/* Beautiful glassmorphic card */}
      <div className="mx-auto max-w-3xl mt-6 px-4">
        <div className="backdrop-blur-2xl bg-gradient-to-br from-background/95 to-background/90 border border-border/60 rounded-2xl shadow-2xl overflow-hidden">
          {/* Content */}
          <div className="px-6 py-5 space-y-3">
            {/* Message with icon */}
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <p className="text-base font-semibold text-foreground">
                {message}
              </p>
            </div>
            
            {/* Thicker progress bar with gradient */}
            <div className="relative">
              <div className="h-2.5 w-full bg-muted/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  {/* Animated shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                       style={{ 
                         backgroundSize: '200% 100%',
                         animation: 'shimmer 2s infinite'
                       }}
                  />
                </div>
              </div>
              
              {/* Progress percentage */}
              <div className="absolute -right-12 top-1/2 -translate-y-1/2">
                <span className="text-xs font-medium text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
