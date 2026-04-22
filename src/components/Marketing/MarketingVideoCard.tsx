import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, RotateCw, Trash2, Loader2, Play, Sparkles, Volume2 } from "lucide-react";
import { MarketingVideo, useDeleteMarketingVideo, useRefineMarketingVideo } from "@/hooks/useMarketingVideos";
import VoiceSelector from "@/components/Panels/VoiceSelector";

interface Props {
  video: MarketingVideo;
  projectId: string;
  isRendering: boolean;
  renderProgress: number;
  onRerender: () => void;
}

export default function MarketingVideoCard({ video, projectId, isRendering, renderProgress, onRerender }: Props) {
  const del = useDeleteMarketingVideo();
  const refine = useRefineMarketingVideo();

  const [refineOpen, setRefineOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [voiceId, setVoiceId] = useState(video.voice_id);
  const [voiceName, setVoiceName] = useState(video.voice_name);
  const [regenerateImages, setRegenerateImages] = useState(false);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);

  const handleDownload = () => {
    if (!video.video_url) return;
    const a = document.createElement("a");
    a.href = video.video_url;
    a.download = `${video.title.replace(/[^a-z0-9]/gi, "-")}.${video.video_url.endsWith(".mp4") ? "mp4" : "webm"}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  const handleRefine = async () => {
    if (!feedback.trim() && voiceId === video.voice_id && !regenerateImages) {
      return;
    }
    await refine.mutateAsync({
      video_id: video.id,
      project_id: projectId,
      feedback: feedback.trim(),
      voice_id: voiceId !== video.voice_id ? voiceId : undefined,
      voice_name: voiceId !== video.voice_id ? voiceName : undefined,
      regenerate_images: regenerateImages,
    });
    setRefineOpen(false);
    setFeedback("");
    setRegenerateImages(false);
  };

  const isBusy = isRendering || refine.isPending;

  return (
    <>
      <Card className="overflow-hidden flex flex-col">
        <div className="relative aspect-video bg-muted">
          {video.video_url && !refine.isPending ? (
            <video
              src={video.video_url}
              poster={video.thumbnail_url || undefined}
              controls
              className="w-full h-full object-cover"
            />
          ) : video.thumbnail_url ? (
            <>
              <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                {refine.isPending ? (
                  <>
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                    <p className="text-white text-sm font-medium">Refining script & voice...</p>
                  </>
                ) : isRendering ? (
                  <>
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                    <p className="text-white text-sm font-medium">Rendering video... {Math.round(renderProgress * 100)}%</p>
                    <div className="w-3/4 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${renderProgress * 100}%` }} />
                    </div>
                  </>
                ) : (
                  <>
                    <Play className="h-8 w-8 text-white/70" />
                    <p className="text-white text-xs">Scenes ready — click Render to compile video</p>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Generating...
            </div>
          )}
        </div>

        <div className="p-4 space-y-3 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold truncate">{video.title}</p>
              <p className="text-xs text-muted-foreground">
                {video.duration_seconds}s · Voice: {video.voice_name}
              </p>
            </div>
            <Badge variant={video.video_url && !refine.isPending ? "default" : "secondary"}>
              {refine.isPending ? "Refining" : video.video_url ? "Ready" : isRendering ? "Rendering" : "Pending"}
            </Badge>
          </div>

          {video.script && (
            <p className="text-xs text-muted-foreground line-clamp-3">{video.script}</p>
          )}

          <div className="flex items-center gap-2 mt-auto pt-2 flex-wrap">
            {video.video_url ? (
              <Button size="sm" onClick={handleDownload} className="flex-1">
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            ) : (
              <Button size="sm" onClick={onRerender} disabled={isBusy} className="flex-1">
                {isRendering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                Render
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setRefineOpen(true)} disabled={isBusy} title="Refine script or change voice">
              <Sparkles className="h-3.5 w-3.5" /> Refine
            </Button>
            {video.video_url && (
              <Button size="sm" variant="outline" onClick={onRerender} disabled={isBusy} title="Re-render with current brand assets">
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => del.mutate({ id: video.id, project_id: projectId })}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={refineOpen} onOpenChange={setRefineOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Refine video</DialogTitle>
            <DialogDescription>
              Describe changes to the script, swap the voice, or regenerate the visuals.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What should change?</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. Make it punchier, mention free shipping, end with 'visit brand.com today'..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Voice</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 h-10 rounded-md border border-border bg-background">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{voiceName}</span>
                  {voiceId !== video.voice_id && (
                    <Badge variant="secondary" className="ml-auto text-[10px]">changed</Badge>
                  )}
                </div>
                <Button variant="outline" type="button" onClick={() => setVoicePickerOpen(true)}>
                  Change
                </Button>
              </div>
              <div className="hidden">
                <VoiceSelector
                  open={voicePickerOpen}
                  onClose={() => setVoicePickerOpen(false)}
                  onSelectVoice={(id, name) => {
                    setVoiceId(id);
                    setVoiceName(name);
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id={`regen-images-${video.id}`}
                checked={regenerateImages}
                onCheckedChange={(c) => setRegenerateImages(!!c)}
              />
              <Label htmlFor={`regen-images-${video.id}`} className="text-sm font-normal cursor-pointer">
                Regenerate scene visuals (slower, costs more)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRefineOpen(false)} disabled={refine.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleRefine}
              disabled={refine.isPending || (!feedback.trim() && voiceId === video.voice_id && !regenerateImages)}
            >
              {refine.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Refining...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Refine video</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
