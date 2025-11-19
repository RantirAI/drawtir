import { Frame } from "@/types/elements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Clock, Maximize2 } from "lucide-react";
import { formatTimeString, parseTimeString } from "@/lib/timelineUtils";

interface FrameTimelineControlsProps {
  frame: Frame;
  onUpdateFrame: (frameId: string, updates: Partial<Frame>) => void;
}

export default function FrameTimelineControls({
  frame,
  onUpdateFrame,
}: FrameTimelineControlsProps) {
  const isManualMode = frame.timelineMode === "manual";
  const duration = frame.duration || 3;

  const handleModeToggle = (checked: boolean) => {
    onUpdateFrame(frame.id, {
      timelineMode: checked ? "manual" : "auto",
    });
  };

  const handleDurationChange = (value: number[]) => {
    if (isManualMode) {
      onUpdateFrame(frame.id, {
        duration: value[0],
      });
    }
  };

  const handleDurationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0 && isManualMode) {
      onUpdateFrame(frame.id, {
        duration: value,
      });
    }
  };

  const handleTransitionChange = (value: number[]) => {
    onUpdateFrame(frame.id, {
      transitionDuration: value[0],
    });
  };

  return (
    <div className="space-y-2 p-2 bg-muted/30 rounded border border-border">
      {/* Duration Mode Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="timeline-mode" className="text-xs">
          Manual Duration
        </Label>
        <Switch
          id="timeline-mode"
          checked={isManualMode}
          onCheckedChange={handleModeToggle}
        />
      </div>

      {/* Duration Control */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">
            Duration {!isManualMode && "(Auto)"}
          </Label>
          <Input
            type="number"
            value={duration.toFixed(2)}
            onChange={handleDurationInputChange}
            disabled={!isManualMode}
            className="w-16 h-6 text-xs"
            step="0.1"
            min="0.1"
          />
        </div>
        
        <Slider
          value={[duration]}
          onValueChange={handleDurationChange}
          min={0.5}
          max={30}
          step={0.1}
          disabled={!isManualMode}
          className="w-full"
        />
      </div>

      {/* Transition Duration */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Transition to Next</Label>
          <span className="text-xs text-muted-foreground">
            {formatTimeString(frame.transitionDuration || 0)}
          </span>
        </div>
        
        <Slider
          value={[frame.transitionDuration || 0]}
          onValueChange={handleTransitionChange}
          min={0}
          max={2}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Frame Stats */}
      <div className="pt-1 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Elements: <span className="font-medium text-foreground">{frame.elements?.length || 0}</span>
          </span>
          <span className="text-muted-foreground">
            End Time: <span className="font-medium text-foreground">{formatTimeString((frame.startTime || 0) + duration)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
