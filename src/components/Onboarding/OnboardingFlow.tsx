import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function OnboardingFlow() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const shouldShow = localStorage.getItem("showOnboarding");
    if (shouldShow === "true") {
      setOpen(true);
      localStorage.removeItem("showOnboarding");
    }
  }, []);

  const steps = [
    {
      title: "Welcome to Drawtir!",
      description: "Create stunning designs with our powerful canvas editor. Collaborate in real-time with your team.",
      features: ["Unlimited frames", "Video export", "AI-powered generation"],
    },
    {
      title: "Explore the Canvas",
      description: "Add shapes, text, images, and even shaders to your designs. Use the timeline to create animations.",
      features: ["Drag & drop elements", "Timeline animations", "Real-time collaboration"],
    },
    {
      title: "You're All Set!",
      description: "Start creating your first project. Need help? Check out our documentation or contact support.",
      features: ["Access to templates", "AI assistance", "Export in multiple formats"],
    },
  ];

  const currentStep = steps[step - 1];
  const isLastStep = step === steps.length;

  const handleNext = () => {
    if (isLastStep) {
      setOpen(false);
    } else {
      setStep(step + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-5">
        <DialogHeader>
          <DialogTitle className="text-lg">{currentStep.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{currentStep.description}</p>
          
          <ul className="space-y-2">
            {currentStep.features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    idx + 1 === step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            
            <Button onClick={handleNext} size="sm">
              {isLastStep ? "Get Started" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
