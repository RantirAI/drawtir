import { Button } from "@/components/ui/button";
import { Frame } from "@/types/elements";
import { toast } from "sonner";

interface NestedFrameSizePanelProps {
  frame: Frame;
  parentFrame: Frame;
  onUpdate: (updates: Partial<Frame>) => void;
}

export function NestedFrameSizePanel({ frame, parentFrame, onUpdate }: NestedFrameSizePanelProps) {
  const handlePercentageSize = (widthPercent: string, heightPercent: string) => {
    const parentW = parentFrame.width;
    const parentH = parentFrame.height;
    
    const calcWidth = Math.round(parentW * parseFloat(widthPercent) / 100);
    const calcHeight = Math.round(parentH * parseFloat(heightPercent) / 100);
    
    onUpdate({ 
      width: calcWidth,
      height: calcHeight,
      percentageWidth: widthPercent,
      percentageHeight: heightPercent
    });
    toast.success(`Frame size set to ${widthPercent} × ${heightPercent}`);
  };

  const getCurrentSize = () => {
    if (frame.percentageWidth || frame.percentageHeight) {
      return `${frame.percentageWidth || `${frame.width}px`} × ${frame.percentageHeight || `${frame.height}px`}`;
    }
    return `${frame.width}px × ${frame.height}px`;
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Nested Frame Size</div>
      <div className="text-xs text-muted-foreground">
        Current: {getCurrentSize()}
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePercentageSize("50%", "50%")}
          className="text-xs"
        >
          50%
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePercentageSize("75%", "75%")}
          className="text-xs"
        >
          75%
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePercentageSize("100%", "100%")}
          className="text-xs"
        >
          100%
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePercentageSize("100%", "50%")}
          className="text-xs"
        >
          Full Width
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePercentageSize("50%", "100%")}
          className="text-xs"
        >
          Full Height
        </Button>
      </div>

      <div className="pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const parentWidth = parentFrame.width;
            const parentHeight = parentFrame.height;
            onUpdate({ 
              width: parentWidth - 40, 
              height: parentHeight - 40,
              percentageWidth: undefined,
              percentageHeight: undefined
            });
            toast.success("Reset to default pixel size");
          }}
          className="w-full text-xs"
        >
          Reset to Pixels
        </Button>
      </div>
    </div>
  );
}
