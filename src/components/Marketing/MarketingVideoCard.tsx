import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RotateCw, Trash2, Loader2, Play } from "lucide-react";
import { MarketingVideo, useDeleteMarketingVideo } from "@/hooks/useMarketingVideos";

interface Props {
  video: MarketingVideo;
  projectId: string;
  isRendering: boolean;
  renderProgress: number;
  onRerender: () => void;
}

export default function MarketingVideoCard({ video, projectId, isRendering, renderProgress, onRerender }: Props) {
  const del = useDeleteMarketingVideo();

  const handleDownload = () => {
    if (!video.video_url) return;
    const a = document.createElement("a");
    a.href = video.video_url;
    a.download = `${video.title.replace(/[^a-z0-9]/gi, "-")}.${video.video_url.endsWith(".mp4") ? "mp4" : "webm"}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="relative aspect-video bg-muted">
        {video.video_url ? (
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
              {isRendering ? (
                <>
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                  <p className="text-white text-sm font-medium">Rendering video... {Math.round(renderProgress * 100)}%</p>
                  <div className="w-3/4 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${renderProgress * 100}%` }}
                    />
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
          <Badge variant={video.video_url ? "default" : "secondary"}>
            {video.video_url ? "Ready" : isRendering ? "Rendering" : "Pending"}
          </Badge>
        </div>

        {video.script && (
          <p className="text-xs text-muted-foreground line-clamp-3">{video.script}</p>
        )}

        <div className="flex items-center gap-2 mt-auto pt-2">
          {video.video_url ? (
            <Button size="sm" onClick={handleDownload} className="flex-1">
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          ) : (
            <Button size="sm" onClick={onRerender} disabled={isRendering} className="flex-1">
              {isRendering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Render
            </Button>
          )}
          {video.video_url && (
            <Button size="sm" variant="outline" onClick={onRerender} disabled={isRendering} title="Re-render with current brand assets">
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
  );
}
