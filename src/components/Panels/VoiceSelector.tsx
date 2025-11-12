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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Female avatars
import ariaAvatar from "@/assets/voices/aria-avatar.png";
import sarahAvatar from "@/assets/voices/sarah-avatar.png";
import lauraAvatar from "@/assets/voices/laura-avatar.png";
import riverAvatar from "@/assets/voices/river-avatar.png";
import charlotteAvatar from "@/assets/voices/charlotte-avatar.png";
import aliceAvatar from "@/assets/voices/alice-avatar.png";
import matildaAvatar from "@/assets/voices/matilda-avatar.png";
import jessicaAvatar from "@/assets/voices/jessica-avatar.png";
import lilyAvatar from "@/assets/voices/lily-avatar.png";

// Male avatars
import rogerAvatar from "@/assets/voices/roger-avatar.png";
import charlieAvatar from "@/assets/voices/charlie-avatar.png";
import georgeAvatar from "@/assets/voices/george-avatar.png";
import callumAvatar from "@/assets/voices/callum-avatar.png";
import liamAvatar from "@/assets/voices/liam-avatar.png";
import willAvatar from "@/assets/voices/will-avatar.png";
import ericAvatar from "@/assets/voices/eric-avatar.png";
import chrisAvatar from "@/assets/voices/chris-avatar.png";
import brianAvatar from "@/assets/voices/brian-avatar.png";
import danielAvatar from "@/assets/voices/daniel-avatar.png";
import billAvatar from "@/assets/voices/bill-avatar.png";

interface Voice {
  id: string;
  name: string;
  gender: "male" | "female";
  avatar: string;
}

const VOICE_OPTIONS: Voice[] = [
  { id: "9BWtsMINqrJLrRacOk9x", name: "Aria", gender: "female", avatar: ariaAvatar },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", gender: "male", avatar: rogerAvatar },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "female", avatar: sarahAvatar },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", gender: "female", avatar: lauraAvatar },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", gender: "male", avatar: charlieAvatar },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", gender: "male", avatar: georgeAvatar },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", gender: "male", avatar: callumAvatar },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River", gender: "female", avatar: riverAvatar },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", gender: "male", avatar: liamAvatar },
  { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", gender: "female", avatar: charlotteAvatar },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", gender: "female", avatar: aliceAvatar },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", gender: "female", avatar: matildaAvatar },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will", gender: "male", avatar: willAvatar },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", gender: "female", avatar: jessicaAvatar },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", gender: "male", avatar: ericAvatar },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris", gender: "male", avatar: chrisAvatar },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", gender: "male", avatar: brianAvatar },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", gender: "male", avatar: danielAvatar },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", gender: "female", avatar: lilyAvatar },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill", gender: "male", avatar: billAvatar },
];

const MALE_VOICES = VOICE_OPTIONS.filter(v => v.gender === "male");
const FEMALE_VOICES = VOICE_OPTIONS.filter(v => v.gender === "female");

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

  const renderVoiceList = (voices: Voice[]) => (
    <div className="space-y-2 pb-4">
      {voices.map((voice) => (
        <div
          key={voice.id}
          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
        >
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage 
              src={voice.avatar} 
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
  );

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
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
      <DrawerContent className="h-full w-[400px]">
        <DrawerHeader>
          <DrawerTitle>Select Voice</DrawerTitle>
          <DrawerDescription>
            Click the speaker icon to preview the voice
          </DrawerDescription>
        </DrawerHeader>
        <Tabs defaultValue="female" className="flex-1 flex flex-col">
          <TabsList className="mx-4">
            <TabsTrigger value="female" className="flex-1">Female Voices</TabsTrigger>
            <TabsTrigger value="male" className="flex-1">Male Voices</TabsTrigger>
          </TabsList>
          <TabsContent value="female" className="flex-1 mt-4">
            <ScrollArea className="h-full px-4">
              {renderVoiceList(FEMALE_VOICES)}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="male" className="flex-1 mt-4">
            <ScrollArea className="h-full px-4">
              {renderVoiceList(MALE_VOICES)}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
}
