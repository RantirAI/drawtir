import { useState } from "react";
import { Volume2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Voice {
  id: string;
  name: string;
  preview?: string; // Preview audio URL if available
}

const VOICE_OPTIONS: Voice[] = [
  { id: "9BWtsMINqrJLrRacOk9x", name: "Aria" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum" },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam" },
  { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill" },
];

interface VoiceSelectorProps {
  onSelectVoice: (voiceId: string, voiceName: string) => void;
}

export default function VoiceSelector({ onSelectVoice }: VoiceSelectorProps) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handlePreviewVoice = (voiceId: string, voiceName: string) => {
    // Play a sample "Hello" with the voice
    const utterance = new SpeechSynthesisUtterance("Hello, this is " + voiceName);
    
    // Try to find a matching voice in available voices
    const voices = speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => 
      v.name.toLowerCase().includes(voiceName.toLowerCase())
    );
    
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    
    setPlayingVoice(voiceId);
    speechSynthesis.speak(utterance);
    
    utterance.onend = () => {
      setPlayingVoice(null);
    };
  };

  const handleSelectVoice = (voiceId: string, voiceName: string) => {
    speechSynthesis.cancel(); // Stop any playing preview
    setPlayingVoice(null);
    onSelectVoice(voiceId, voiceName);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          title="Add voice"
        >
          <Volume2 className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Select Voice</h4>
          <p className="text-xs text-muted-foreground">
            Click the speaker icon to preview
          </p>
          <ScrollArea className="h-64">
            <div className="space-y-1">
              {VOICE_OPTIONS.map((voice) => (
                <div
                  key={voice.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent group"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-start h-auto py-1 px-2 font-normal"
                    onClick={() => handleSelectVoice(voice.id, voice.name)}
                  >
                    {voice.name}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewVoice(voice.id, voice.name);
                    }}
                    disabled={playingVoice === voice.id}
                  >
                    <Volume2 className={`h-3 w-3 ${playingVoice === voice.id ? 'animate-pulse text-primary' : ''}`} />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
