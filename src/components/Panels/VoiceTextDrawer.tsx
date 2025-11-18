import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, X, Mic, Play } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import VoiceSelector from "./VoiceSelector";

interface VoiceTextDrawerProps {
  open: boolean;
  onClose: () => void;
  voiceId: string;
  voiceName: string;
  onVoiceGenerated: (audioUrl: string, text: string, voiceId: string, voiceName: string) => void;
  initialText?: string;
  editMode?: boolean;
}

const emotionControls = [
  { tag: "[laughs]", label: "Laughs", color: "rgb(255, 220, 220)" },
  { tag: "[chuckles]", label: "Chuckles", color: "rgb(255, 240, 200)" },
  { tag: "[whispers]", label: "Whispers", color: "rgb(220, 230, 255)" },
  { tag: "[sighs]", label: "Sighs", color: "rgb(230, 220, 255)" },
  { tag: "[excited]", label: "Excited", color: "rgb(255, 200, 200)" },
  { tag: "[curious]", label: "Curious", color: "rgb(200, 240, 255)" },
  { tag: "[sarcastic]", label: "Sarcastic", color: "rgb(220, 255, 220)" },
  { tag: "[crying]", label: "Crying", color: "rgb(200, 220, 255)" },
  { tag: "[exhales]", label: "Exhales", color: "rgb(240, 220, 255)" },
  { tag: "[snorts]", label: "Snorts", color: "rgb(255, 230, 210)" },
  { tag: "[gulps]", label: "Gulps", color: "rgb(210, 240, 255)" },
  { tag: "[mischievously]", label: "Mischievous", color: "rgb(255, 210, 230)" },
];

export default function VoiceTextDrawer({
  open,
  onClose,
  voiceId: initialVoiceId,
  voiceName: initialVoiceName,
  onVoiceGenerated,
  initialText = "",
  editMode = false,
}: VoiceTextDrawerProps) {
  const { toast } = useToast();
  const [text, setText] = useState(initialText);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceId, setVoiceId] = useState(initialVoiceId);
  const [voiceName, setVoiceName] = useState(initialVoiceName);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Update text and voice when props change (for edit mode)
  useEffect(() => {
    setText(initialText);
    setVoiceId(initialVoiceId);
    setVoiceName(initialVoiceName);
  }, [initialText, initialVoiceId, initialVoiceName, open]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setIsPreviewing(false);
      setIsGenerating(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
  }, [open]);

  const insertEmotionTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + tag + " " + text.substring(end);
    
    setText(newText);
    
    // Set cursor position after the inserted tag
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + tag.length + 1;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleSelectVoice = (id: string, name: string) => {
    setVoiceId(id);
    setVoiceName(name);
    setShowVoiceSelector(false);
  };

  const handlePreview = async () => {
    if (!text.trim() || isPreviewing) return;
    
    setIsPreviewing(true);
    
    try {
      // Get current user for storage path
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('generate-voice', {
        body: { 
          text, 
          voiceId,
          userId: user?.id 
        }
      });

      if (error) throw error;

      if (!data?.audioUrl) {
        throw new Error('No audio URL received');
      }

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Play the audio directly from the stored URL
      const audio = new Audio(data.audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPreviewing(false);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error previewing voice:', error);
      toast({
        title: "Preview failed",
        description: error instanceof Error ? error.message : "Failed to preview voice",
        variant: "destructive",
      });
      setIsPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({
        title: "Text required",
        description: "Please enter text to convert to speech",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Get current user for storage path
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('generate-voice', {
        body: { 
          text, 
          voiceId,
          userId: user?.id 
        }
      });

      if (error) throw error;

      if (!data?.audioUrl) {
        throw new Error('No audio URL received');
      }

      console.log('Voice generated with permanent URL:', data.audioUrl);

      onVoiceGenerated(data.audioUrl, text, voiceId, voiceName);

      toast({
        title: "Voice generated",
        description: "Voice has been added to the timeline",
      });

      setText("");
      onClose();
    } catch (error) {
      console.error('Error generating voice:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate voice",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl">{editMode ? "Edit Voice" : "Generate Voice"}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6 flex flex-col h-[calc(100vh-8rem)]">
            {/* Voice Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Selected Voice
                </Label>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowVoiceSelector(true)}
                className="w-full justify-start text-left"
              >
                {voiceName}
              </Button>
            </div>

            {/* Emotion Controls */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Emotion Tags</Label>
              <p className="text-sm text-muted-foreground">
                Click to insert emotion tags at cursor position
              </p>
              <div className="flex flex-wrap gap-2">
                {emotionControls.map((control) => {
                  return (
                    <Badge
                      key={control.tag}
                      onClick={() => insertEmotionTag(control.tag)}
                      className="cursor-pointer px-2 py-0.5 text-xs font-medium transition-all hover:scale-105 active:scale-95"
                      style={{
                        backgroundColor: control.color,
                        color: 'rgb(80, 80, 80)',
                        borderRadius: '4px',
                        border: 'none',
                      }}
                    >
                      {control.label}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Text Input - at bottom */}
            <div className="space-y-2 flex-1 flex flex-col mt-auto">
              <Label className="text-base font-semibold">Voice Text</Label>
              <Textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to convert to speech... Use the buttons above to add emotion tags!"
                className="flex-1 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Place cursor where you want to add emotions, then click the chips above
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handlePreview}
                disabled={isPreviewing || !text.trim()}
                variant="outline"
                size="lg"
              >
                {isPreviewing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim()}
                className="flex-1"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editMode ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    {editMode ? "Update Voice" : "Add Voice"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <VoiceSelector
        open={showVoiceSelector}
        onClose={() => setShowVoiceSelector(false)}
        onSelectVoice={handleSelectVoice}
      />
    </>
  );
}
