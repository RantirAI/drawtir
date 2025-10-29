import { Sparkles } from "lucide-react";

interface TopProgressBarProps {
  isVisible: boolean;
  message: string;
  progress: number;
}

export default function TopProgressBar({ isVisible, message, progress }: TopProgressBarProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Message floating above */}
      <div className="flex items-center justify-center gap-2 py-3">
        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        <p className="text-sm font-semibold text-foreground drop-shadow-lg">
          {message}
        </p>
      </div>
      
      {/* Progress bar card - the card IS the progress */}
      <div className="relative h-3 w-full overflow-hidden bg-muted/30 backdrop-blur-sm">
        {/* Animated progress fill */}
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary to-primary/90 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer overlay */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{ 
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite linear'
            }}
          />
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-primary/20 blur-sm" />
        </div>
        
        {/* Percentage indicator */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 text-[10px] font-bold text-white mix-blend-difference transition-all duration-500"
          style={{ left: `calc(${progress}% - 20px)` }}
        >
          {Math.round(progress)}%
        </div>
      </div>
      
      {/* CSS for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          from { background-position: -200% 0; }
          to { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
