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
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
      {/* Frame Info */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{frame.name}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          Start: {formatTimeString(frame.startTime || 0)}
        </span>
      </div>

      {/* Duration Mode Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="timeline-mode" className="text-sm">
          Manual Duration
        </Label>
        <Switch
          id="timeline-mode"
          checked={isManualMode}
          onCheckedChange={handleModeToggle}
        />
      </div>

      {/* Duration Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">
            Duration {!isManualMode && "(Auto)"}
          </Label>
          <Input
            type="number"
            value={duration.toFixed(2)}
            onChange={handleDurationInputChange}
            disabled={!isManualMode}
            className="w-20 h-8 text-xs"
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
        
        {!isManualMode && (
          <p className="text-xs text-muted-foreground">
            Duration is calculated from element animations
          </p>
        )}
      </div>

      {/* Transition Duration */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Transition to Next</Label>
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
      <div className="pt-2 border-t border-border">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Elements:</span>
            <span className="ml-1 font-medium">
              {frame.elements?.length || 0}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">End Time:</span>
            <span className="ml-1 font-medium">
              {formatTimeString((frame.startTime || 0) + duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
