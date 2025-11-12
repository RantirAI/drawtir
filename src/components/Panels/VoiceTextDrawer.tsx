import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface VoiceTextDrawerProps {
  open: boolean;
  onClose: () => void;
  voiceId: string;
  voiceName: string;
  onVoiceGenerated: (audioUrl: string, text: string) => void;
}

export default function VoiceTextDrawer({
  open,
  onClose,
  voiceId,
  voiceName,
  onVoiceGenerated,
}: VoiceTextDrawerProps) {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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
      const { data, error } = await supabase.functions.invoke('generate-voice', {
        body: { text, voiceId }
      });

      if (error) throw error;

      if (!data?.audioContent) {
        throw new Error('No audio content received');
      }

      // Convert base64 to blob
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);

      onVoiceGenerated(audioUrl, text);

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
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle>Generate Voice - {voiceName}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Voice Text</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the text you want to convert to speech..."
              className="min-h-[200px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This will be converted using the {voiceName} voice
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !text.trim()}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Voice"
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
