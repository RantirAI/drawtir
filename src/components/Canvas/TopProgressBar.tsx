import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TopProgressBarProps {
  isVisible: boolean;
  message: string;
  progress: number;
}

export default function TopProgressBar({ isVisible, message, progress }: TopProgressBarProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      {/* Glassmorphic container */}
      <div className="mx-auto max-w-2xl mt-4 backdrop-blur-xl bg-background/80 border border-border/50 rounded-lg shadow-lg overflow-hidden">
        {/* Progress bar */}
        <Progress 
          value={progress} 
          className="h-1 rounded-none"
        />
        
        {/* Message */}
        <div className="px-4 py-3">
          <p className="text-sm text-foreground font-medium text-center">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
