import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface FrameVideoControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  frameWidth: number;
}

export default function FrameVideoControls({ videoRef, frameWidth }: FrameVideoControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [videoRef]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0];
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (!document.fullscreenElement) {
      video.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div 
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto"
      style={{ maxWidth: `${frameWidth - 32}px` }}
    >
      {/* Subtle glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/20 via-blue-400/10 to-transparent blur-2xl scale-150" />
      </div>

      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/40 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(59,130,246,0.2)]">
        {/* Play/Pause */}
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group"
        >
          {isPlaying ? (
            <Pause size={14} className="transition-transform duration-300 group-hover:rotate-6" />
          ) : (
            <Play size={14} className="ml-0.5 transition-transform duration-300 group-hover:rotate-6" />
          )}
        </Button>

        {/* Progress Bar */}
        <div className="flex-1 min-w-[100px] max-w-[200px]">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>

        {/* Time Display */}
        <span className="text-xs text-foreground/80 font-medium whitespace-nowrap">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Volume */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group"
        >
          {isMuted ? (
            <VolumeX size={14} className="transition-transform duration-300 group-hover:rotate-6" />
          ) : (
            <Volume2 size={14} className="transition-transform duration-300 group-hover:rotate-6" />
          )}
        </Button>

        <div className="w-16">
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="cursor-pointer"
          />
        </div>

        {/* Fullscreen */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="h-8 w-8 rounded-full transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(59,130,246,0.4)] hover:bg-primary hover:text-primary-foreground group"
        >
          <Maximize size={14} className="transition-transform duration-300 group-hover:rotate-6" />
        </Button>
      </div>
    </div>
  );
}
