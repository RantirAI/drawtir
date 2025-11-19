import { Progress } from "@/components/ui/progress";
import { Sparkles, Image, Wand2, CheckCircle2 } from "lucide-react";

interface GenerationProgressOverlayProps {
  isVisible: boolean;
  currentStep: string;
  progress: number;
  totalSteps: number;
  steps: Array<{
    id: string;
    label: string;
    status: 'pending' | 'active' | 'complete' | 'error';
    fileName?: string; // Optional file name being processed
  }>;
}

export default function GenerationProgressOverlay({
  isVisible,
  currentStep,
  progress,
  totalSteps,
  steps,
}: GenerationProgressOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Glassmorphic blur background */}
      <div className="absolute inset-0 backdrop-blur-md bg-background/30" />
      
      {/* Progress card */}
      <div className="relative pointer-events-auto">
        <div className="bg-card/90 backdrop-blur-xl border-2 border-primary/20 rounded-2xl shadow-2xl p-8 min-w-[400px] max-w-[500px]">
          {/* Header with sparkle icon */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">Generating Your Poster</h3>
              <p className="text-sm text-muted-foreground">Please wait while we create something amazing...</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps list */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = 
                step.id === 'image' ? Image :
                step.id === 'design' ? Wand2 :
                step.id === 'replicate' ? Wand2 :
                Sparkles;

              return (
                <div 
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                    step.status === 'active' 
                      ? 'bg-primary/10 border-2 border-primary/30' 
                      : step.status === 'complete'
                      ? 'bg-green-500/10 border border-green-500/20'
                      : step.status === 'error'
                      ? 'bg-red-500/10 border border-red-500/20'
                      : 'bg-muted/30 border border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    step.status === 'active'
                      ? 'bg-primary text-primary-foreground animate-pulse'
                      : step.status === 'complete'
                      ? 'bg-green-500 text-white'
                      : step.status === 'error'
                      ? 'bg-red-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {step.status === 'complete' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : step.status === 'error' ? (
                      <span className="text-xs font-bold">✕</span>
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      step.status === 'active' ? 'text-foreground' : 
                      step.status === 'complete' ? 'text-green-600 dark:text-green-400' :
                      step.status === 'error' ? 'text-red-600 dark:text-red-400' :
                      'text-muted-foreground'
                    }`}>
                      {step.label}
                    </p>
                    {step.status === 'active' && (
                      <div className="mt-0.5 space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          {currentStep}
                        </p>
                        {step.fileName && (
                          <p className="text-xs text-primary/70 font-mono">
                            {step.fileName}
                          </p>
                        )}
                      </div>
                    )}
                    {step.status === 'complete' && step.fileName && (
                      <p className="text-xs text-green-600/70 dark:text-green-400/70 font-mono mt-0.5">
                        ✓ {step.fileName}
                      </p>
                    )}
                    {step.status === 'error' && (
                      <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">
                        Failed to generate
                      </p>
                    )}
                  </div>
                  {step.status === 'active' && (
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current step indicator */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              Step {steps.filter(s => s.status === 'complete').length + 1} of {totalSteps}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
