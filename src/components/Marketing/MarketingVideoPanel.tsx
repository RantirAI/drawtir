import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Video, Volume2, Globe, ChevronDown, ChevronUp, Mic, Users } from "lucide-react";
import VoiceSelector from "@/components/Panels/VoiceSelector";
import {
  useMarketingVideos,
  useGenerateMarketingVideo,
  useSaveMarketingVideoBlob,
  MarketingVideo,
} from "@/hooks/useMarketingVideos";
import { useFeaturedImages } from "@/hooks/useFeaturedImages";
import { renderMarketingVideo } from "@/lib/marketingVideoRenderer";
import MarketingVideoCard from "./MarketingVideoCard";
import { toast } from "sonner";

interface Props {
  projectId: string;
  primaryColor?: string | null;
  logoUrl?: string | null;
  brandName?: string;
  defaultCountry?: string | null;
  defaultCurrency?: string | null;
  defaultLanguage?: string | null;
}

const DURATIONS = [
  { value: 15, label: "15 seconds — Reel/Short" },
  { value: 30, label: "30 seconds — Social ad" },
  { value: 60, label: "60 seconds — Explainer" },
];

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "energetic", label: "Energetic" },
  { value: "inspirational", label: "Inspirational" },
  { value: "playful", label: "Playful" },
  { value: "luxurious", label: "Luxurious" },
];

export default function MarketingVideoPanel({
  projectId,
  primaryColor,
  logoUrl,
  brandName,
  defaultCountry,
  defaultCurrency,
  defaultLanguage,
}: Props) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [tone, setTone] = useState("professional");
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState<"monologue" | "podcast">("monologue");
  const [voiceId, setVoiceId] = useState("EXAVITQu4vr4xnSDxMaL");
  const [voiceName, setVoiceName] = useState("Sarah");
  const [hostAVoiceId, setHostAVoiceId] = useState("EXAVITQu4vr4xnSDxMaL");
  const [hostAVoiceName, setHostAVoiceName] = useState("Sarah");
  const [hostBVoiceId, setHostBVoiceId] = useState("JBFqnCBsd6RMkjVDRZzb");
  const [hostBVoiceName, setHostBVoiceName] = useState("George");
  const [voicePickerTarget, setVoicePickerTarget] = useState<"mono" | "A" | "B" | null>(null);
  const [renderingId, setRenderingId] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState(0);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [language, setLanguage] = useState("");
  const [burnSubs, setBurnSubs] = useState(false);

  useEffect(() => {
    setCountry(defaultCountry || "");
    setCurrency(defaultCurrency || "");
    setLanguage(defaultLanguage || "");
  }, [defaultCountry, defaultCurrency, defaultLanguage]);

  const { data: videos = [], isLoading } = useMarketingVideos(projectId);
  const { data: featured = [] } = useFeaturedImages(projectId);
  const generate = useGenerateMarketingVideo();
  const saveBlob = useSaveMarketingVideoBlob();

  const handleGenerate = async () => {
    if (format === "monologue" && !voiceId) {
      toast.error("Please pick a voice first");
      return;
    }
    if (format === "podcast" && (!hostAVoiceId || !hostBVoiceId)) {
      toast.error("Please pick both host voices");
      return;
    }
    if (format === "podcast" && hostAVoiceId === hostBVoiceId) {
      toast.error("Pick two different voices for Host A and Host B");
      return;
    }
    try {
      const video = await generate.mutateAsync({
        project_id: projectId,
        duration_seconds: duration,
        voice_id: format === "podcast" ? hostAVoiceId : voiceId,
        voice_name: format === "podcast" ? hostAVoiceName : voiceName,
        prompt,
        title: title.trim() || `${brandName || "Brand"} ${duration}s ${format === "podcast" ? "podcast" : "video"}`,
        tone,
        country: country.trim() || undefined,
        currency: currency.trim().toUpperCase() || undefined,
        language: language.trim() || undefined,
        burn_subtitles: burnSubs,
        format,
        host_a_voice_id: format === "podcast" ? hostAVoiceId : undefined,
        host_a_voice_name: format === "podcast" ? hostAVoiceName : undefined,
        host_b_voice_id: format === "podcast" ? hostBVoiceId : undefined,
        host_b_voice_name: format === "podcast" ? hostBVoiceName : undefined,
      });
      await renderAndUpload(video);
    } catch {
      // toast handled by hook
    }
  };

  const renderAndUpload = async (video: MarketingVideo) => {
    if (!video.audio_url) {
      toast.error("Audio missing — cannot render video");
      return;
    }
    setRenderingId(video.id);
    setRenderProgress(0);
    try {
      const { blob, mimeType } = await renderMarketingVideo(
        video.scenes,
        video.audio_url,
        video.duration_seconds,
        {
          brandColor: primaryColor || "#9b87f5",
          logoUrl: logoUrl || null,
          brandName: brandName || "",
          subtitles: video.subtitles || [],
          burnSubtitles: video.burn_subtitles ?? true,
          onProgress: (p) => setRenderProgress(p),
        },
      );
      await saveBlob.mutateAsync({
        video_id: video.id,
        project_id: projectId,
        blob,
        mime_type: mimeType,
      });
      toast.success("Video ready!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Render failed");
    } finally {
      setRenderingId(null);
      setRenderProgress(0);
    }
  };

  useEffect(() => {
    if (renderingId || generate.isPending) return;
    const pending = videos.find(
      (v) => !v.video_url && v.audio_url && Array.isArray(v.scenes) && v.scenes.length > 0,
    );
    if (pending) renderAndUpload(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos, renderingId, generate.isPending]);

  const featuredHint =
    featured.length === 0
      ? "Tip: add labeled product screenshots in 'Featured Images' so the AI can show your real UI in the video."
      : `${featured.length} featured screenshot${featured.length === 1 ? "" : "s"} available — the AI will weave them into the video.`;

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Generate Marketing Video</h3>
        </div>

        <p className="text-xs text-muted-foreground">{featuredHint}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Title (optional)</Label>
            <Input
              placeholder={`${brandName || "Brand"} — Spring launch`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Voice</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 h-10 rounded-md border border-border bg-background">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{voiceName || "Pick a voice"}</span>
              </div>
              <Button variant="outline" type="button" onClick={() => setVoiceDrawerOpen(true)}>
                Change
              </Button>
            </div>
            <div className="hidden">
              <VoiceSelector
                open={voiceDrawerOpen}
                onClose={() => setVoiceDrawerOpen(false)}
                onSelectVoice={(id, name) => {
                  setVoiceId(id);
                  setVoiceName(name);
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Optional direction</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Promote our spring sale, focus on free shipping, end with 'Shop now at brand.com'..."
            rows={2}
          />
        </div>

        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs gap-1 px-2"
            onClick={() => setAdvancedOpen((v) => !v)}
          >
            {advancedOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Advanced (locale & captions)
          </Button>
        </div>

        {advancedOpen && (
          <div className="space-y-4 rounded-md border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4 text-primary" /> Locale override (defaults from project)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Country</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder={defaultCountry || "United States"} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Currency</Label>
                <Input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  placeholder={defaultCurrency || "USD"}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Language</Label>
                <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder={defaultLanguage || "English"} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2">
              <div>
                <div className="text-sm font-medium">Burn subtitles into video</div>
                <div className="text-xs text-muted-foreground">Word-timed captions for silent autoplay & accessibility.</div>
              </div>
              <Switch checked={burnSubs} onCheckedChange={setBurnSubs} />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground flex-1">
            We'll write a {country || defaultCountry || "locale"}-aware script in {currency || defaultCurrency || "your currency"}, generate{" "}
            {duration <= 15 ? 4 : duration <= 30 ? 6 : 8} branded scenes (with logos painted onto subjects and your real screenshots),
            voice it with {voiceName}, and render a downloadable video.
          </p>
          <Button onClick={handleGenerate} disabled={generate.isPending || !!renderingId}>
            {generate.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating script & scenes...</>
            ) : renderingId ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Rendering {Math.round(renderProgress * 100)}%</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate Video</>
            )}
          </Button>
        </div>
      </Card>

      <div>
        <h3 className="font-semibold mb-3">Recent Videos</h3>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
        ) : videos.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground text-sm">
            No videos yet. Generate your first marketing video above.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((v) => (
              <MarketingVideoCard
                key={v.id}
                video={v}
                projectId={projectId}
                isRendering={renderingId === v.id}
                renderProgress={renderingId === v.id ? renderProgress : 0}
                onRerender={() => renderAndUpload(v)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
