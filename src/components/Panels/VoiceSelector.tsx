import { useState } from "react";
import { Volume2, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import maleAvatar from "@/assets/male-voice-avatar.png";
import femaleAvatar from "@/assets/female-voice-avatar.png";

interface Voice {
  id: string;
  name: string;
  gender: "male" | "female";
  preview?: string;
}

const VOICE_OPTIONS: Voice[] = [
  { id: "9BWtsMINqrJLrRacOk9x", name: "Aria", gender: "female" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", gender: "male" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "female" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", gender: "female" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", gender: "male" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", gender: "male" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", gender: "male" },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River", gender: "female" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", gender: "male" },
  { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", gender: "female" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", gender: "female" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", gender: "female" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will", gender: "male" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", gender: "female" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", gender: "male" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris", gender: "male" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", gender: "male" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", gender: "male" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", gender: "female" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill", gender: "male" },
];

interface VoiceSelectorProps {
  onSelectVoice: (voiceId: string, voiceName: string) => void;
}

export default function VoiceSelector({ onSelectVoice }: VoiceSelectorProps) {
  const { toast } = useToast();
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handlePreviewVoice = async (voiceId: string, voiceName: string) => {
    try {
      // Stop any currently playing audio
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }

      setPlayingVoice(voiceId);

      const { data, error } = await supabase.functions.invoke('preview-voice', {
        body: { voiceId }
      });

      if (error) throw error;

      if (!data?.audioContent) {
        throw new Error('No audio content received');
      }

      // Convert base64 to blob and play
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);

      const audio = new Audio(audioUrl);
      setAudioElement(audio);
      
      audio.onended = () => {
        setPlayingVoice(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setPlayingVoice(null);
        toast({
          title: "Playback failed",
          description: "Could not play voice preview",
          variant: "destructive",
        });
      };

      await audio.play();
    } catch (error) {
      console.error('Error previewing voice:', error);
      setPlayingVoice(null);
      toast({
        title: "Preview failed",
        description: error instanceof Error ? error.message : "Failed to preview voice",
        variant: "destructive",
      });
    }
  };

  const handleSelectVoice = (voiceId: string, voiceName: string) => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    setPlayingVoice(null);
    onSelectVoice(voiceId, voiceName);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          title="Add voice"
        >
          <Volume2 className="h-3 w-3" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Select Voice</DrawerTitle>
          <DrawerDescription>
            Click the speaker icon to preview the voice
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2 pb-4">
            {VOICE_OPTIONS.map((voice) => (
              <div
                key={voice.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={voice.gender === "male" ? maleAvatar : femaleAvatar} 
                    alt={voice.name}
                  />
                  <AvatarFallback>{voice.name[0]}</AvatarFallback>
                </Avatar>
                
                <Button
                  variant="ghost"
                  className="flex-1 justify-start h-auto py-2 px-2 font-medium hover:bg-transparent"
                  onClick={() => handleSelectVoice(voice.id, voice.name)}
                >
                  {voice.name}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewVoice(voice.id, voice.name);
                  }}
                  disabled={playingVoice === voice.id}
                >
                  {playingVoice === voice.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
