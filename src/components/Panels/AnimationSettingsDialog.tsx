import { useState } from "react";
import { Element } from "@/types/elements";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AnimationSettingsDialogProps {
  animation: NonNullable<Element["animations"]>[0];
  elementId: string;
  onUpdate: (animationId: string, updates: Partial<NonNullable<Element["animations"]>[0]>) => void;
  onRemove: (animationId: string) => void;
  trigger?: React.ReactNode;
}

export default function AnimationSettingsDialog({
  animation,
  elementId,
  onUpdate,
  onRemove,
  trigger,
}: AnimationSettingsDialogProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getDurationValue = (duration: string) => {
    const match = duration.match(/^([\d.]+)(m?s)$/);
    if (!match) return 0.5;
    const value = parseFloat(match[1]);
    const unit = match[2];
    return unit === 'ms' ? value / 1000 : value;
  };

  const getDelayValue = (delay: string) => {
    const match = delay.match(/^([\d.]+)(m?s)$/);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2];
    return unit === 'ms' ? value / 1000 : value;
  };

  const duration = getDurationValue(animation.duration);
  const delay = getDelayValue(animation.delay);

  const handleDurationChange = (value: number) => {
    onUpdate(animation.id, { duration: `${value}s` });
  };

  const handleDelayChange = (value: number) => {
    onUpdate(animation.id, { delay: `${value}s` });
  };

  const handleTimingFunctionChange = (value: string) => {
    onUpdate(animation.id, { timingFunction: value });
  };

  const handleIterationCountChange = (value: string) => {
    onUpdate(animation.id, { iterationCount: value });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-5 w-5">
            <X className="h-3 w-3" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-3 space-y-3" 
        side="top"
        align="start"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sm">Animation Settings</h4>
            <p className="text-[10px] text-muted-foreground truncate">
              {animation.type}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronUp className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Compact view - just duration and delay */}
        <div className="space-y-2">
          <div>
            <Label className="text-[10px]">Duration: {duration.toFixed(2)}s</Label>
            <Slider
              value={[duration]}
              onValueChange={(v) => handleDurationChange(v[0])}
              min={0.1}
              max={5}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[10px]">Delay: {delay.toFixed(2)}s</Label>
            <Slider
              value={[delay]}
              onValueChange={(v) => handleDelayChange(v[0])}
              min={0}
              max={5}
              step={0.1}
              className="mt-1"
            />
          </div>
        </div>

        {/* Expanded view - timing function and iteration count */}
        {isExpanded && (
          <>
            <Separator />
            <div className="space-y-2">
              <div>
                <Label className="text-[10px]">Timing Function</Label>
                <Select
                  value={animation.timingFunction}
                  onValueChange={handleTimingFunctionChange}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear" className="text-xs">Linear</SelectItem>
                    <SelectItem value="ease" className="text-xs">Ease</SelectItem>
                    <SelectItem value="ease-in" className="text-xs">Ease In</SelectItem>
                    <SelectItem value="ease-out" className="text-xs">Ease Out</SelectItem>
                    <SelectItem value="ease-in-out" className="text-xs">Ease In Out</SelectItem>
                    <SelectItem value="cubic-bezier(0.68, -0.55, 0.265, 1.55)" className="text-xs">
                      Bounce
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px]">Repeat</Label>
                <Select
                  value={animation.iterationCount}
                  onValueChange={handleIterationCountChange}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1" className="text-xs">Once</SelectItem>
                    <SelectItem value="2" className="text-xs">Twice</SelectItem>
                    <SelectItem value="3" className="text-xs">3 times</SelectItem>
                    <SelectItem value="infinite" className="text-xs">Infinite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        <Separator />

        <Button
          variant="destructive"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={() => onRemove(animation.id)}
        >
          Remove Animation
        </Button>
      </PopoverContent>
    </Popover>
  );
}
