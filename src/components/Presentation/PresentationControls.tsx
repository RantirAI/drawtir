import { Play, Pause, SkipBack, SkipForward, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PresentationControlsProps {
  currentFrameIndex: number;
  totalFrames: number;
  isPlaying: boolean;
  frameDuration: number;
  transition: string;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onDurationChange: (duration: number) => void;
  onTransitionChange: (transition: string) => void;
  onExport: () => void;
}

export function PresentationControls({
  currentFrameIndex,
  totalFrames,
  isPlaying,
  frameDuration,
  transition,
  onPlayPause,
  onPrevious,
  onNext,
  onDurationChange,
  onTransitionChange,
  onExport,
}: PresentationControlsProps) {
  return (
    <div className="flex items-center justify-between gap-6">
      {/* Left: Frame counter */}
      <div className="text-white text-sm font-medium min-w-[100px]">
        {currentFrameIndex + 1} / {totalFrames}
      </div>

      {/* Center: Playback controls */}
      <div className="flex items-center gap-3">
        <Button
          onClick={onPrevious}
          disabled={currentFrameIndex === 0}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 disabled:opacity-30"
        >
          <SkipBack className="w-5 h-5" />
        </Button>

        <Button
          onClick={onPlayPause}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 w-12 h-12"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </Button>

        <Button
          onClick={onNext}
          disabled={currentFrameIndex === totalFrames - 1}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 disabled:opacity-30"
        >
          <SkipForward className="w-5 h-5" />
        </Button>
      </div>

      {/* Right: Settings and export */}
      <div className="flex items-center gap-4">
        {/* Duration control */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <span className="text-white text-sm whitespace-nowrap">Duration:</span>
          <div className="flex items-center gap-2 flex-1">
            <Slider
              value={[frameDuration]}
              onValueChange={(values) => onDurationChange(values[0])}
              min={1}
              max={10}
              step={0.5}
              className="flex-1"
            />
            <span className="text-white text-sm font-medium w-8">{frameDuration}s</span>
          </div>
        </div>

        {/* Transition selector */}
        <Select value={transition} onValueChange={onTransitionChange}>
          <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Transition</SelectItem>
            <SelectItem value="fade">Fade</SelectItem>
            <SelectItem value="slide-left">Slide Left</SelectItem>
            <SelectItem value="slide-right">Slide Right</SelectItem>
            <SelectItem value="slide-up">Slide Up</SelectItem>
            <SelectItem value="slide-down">Slide Down</SelectItem>
            <SelectItem value="zoom">Zoom</SelectItem>
          </SelectContent>
        </Select>

        {/* Export button */}
        <Button
          onClick={onExport}
          variant="ghost"
          className="text-white hover:bg-white/20 gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
