import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FrameVideoControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  frameX: number;
  frameY: number;
  frameWidth: number;
  frameHeight: number;
  zoom: number;
}

export default function FrameVideoControls({ 
  videoRef, 
  frameX, 
  frameY, 
  frameWidth, 
  frameHeight,
  zoom 
}: FrameVideoControlsProps) {
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


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div 
      className="absolute z-40 pointer-events-auto flex flex-col items-center gap-1"
      style={{ 
        left: `${frameX + frameWidth / 2}px`,
        top: `${frameY + frameHeight + 8}px`,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Time Badge - Top */}
      <Badge variant="secondary" className="text-xs font-medium whitespace-nowrap px-2 py-1">
        {formatTime(currentTime)} / {formatTime(duration)}
      </Badge>

      {/* Controls Container */}
      <div className="relative">
        {/* Subtle glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/20 via-blue-400/10 to-transparent blur-2xl scale-150" />
        </div>

      <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-background/40 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(59,130,246,0.2)]">
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

        {/* Mute/Unmute */}
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
      </div>
      </div>
    </div>
  );
}
