import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useGenerateContent, useSaveMarketingOutput } from "@/hooks/useMarketingProject";
import { Loader2, Sparkles, Save, Maximize2, Download, RefreshCw } from "lucide-react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

function renderMarkdown(text: string): string {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^######\s+(.+)$/gm, '<h6 class="text-sm font-bold mt-4 mb-1">$1</h6>')
    .replace(/^#####\s+(.+)$/gm, '<h5 class="text-sm font-bold mt-4 mb-1">$1</h5>')
    .replace(/^####\s+(.+)$/gm, '<h4 class="text-base font-bold mt-5 mb-2">$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3 class="text-lg font-bold mt-6 mb-2 border-b pb-1">$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3 text-primary">$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-primary">$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr class="my-4" />')
    .replace(/^\*\s+(.+)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
    .replace(/^-\s+(.+)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal mb-1">$1</li>')
    .replace(/^\|(.+)\|$/gm, (match, inner) => {
      const cells = inner.split("|").map((c: string) => c.trim());
      if (cells.every((c: string) => /^[-:]+$/.test(c))) return '';
      const cellHtml = cells.map((c: string) => `<td class="border px-3 py-1.5 text-sm">${c}</td>`).join("");
      return `<tr>${cellHtml}</tr>`;
    })
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/\n/g, '<br />');
  html = html.replace(/(<tr>.*?<\/tr>(?:\s*<tr>.*?<\/tr>)*)/gs, '<table class="w-full border-collapse border my-4">$1</table>');
  return `<p class="mb-3">${html}</p>`;
}

interface Props {
  projectId: string;
}

export default function ContentGenerator({ projectId }: Props) {
  const [outputType, setOutputType] = useState("poster");
  const [platform, setPlatform] = useState("general");
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [refineFeedback, setRefineFeedback] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const generate = useGenerateContent();
  const save = useSaveMarketingOutput();

  const handleRefine = async () => {
    if (!previewItem?.html || !refineFeedback.trim()) return;
    setIsRefining(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-marketing-content", {
        body: {
          project_id: projectId,
          output_type: outputType,
          platform,
          refine_html: previewItem.html,
          refine_feedback: refineFeedback,
        },
      });
      if (error) throw error;
      const refined = data?.results?.[0];
      if (refined?.html) {
        setPreviewItem(refined);
        setRefineFeedback("");
        toast.success("Design refined!");
      } else {
        toast.error("No refined result returned");
      }
    } catch (err: any) {
      toast.error(err.message || "Refine failed");
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerate = () => {
    generate.mutate(
      { project_id: projectId, output_type: outputType, platform, custom_prompt: prompt },
      { onSuccess: (data) => setResults(data || []) }
    );
  };

  const handleSave = (item: any, index: number) => {
    save.mutate({
      project_id: projectId,
      output_type: outputType,
      title: item.title || `Generated ${outputType} ${index + 1}`,
      content: item,
      platform,
    });
  };

  const handleDownload = async (item: any) => {
    if (!item.html) return;
    toast.info("Rendering image...");
    try {
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "1080px";
      container.style.height = "1350px";
      document.body.appendChild(container);

      const iframe = document.createElement("iframe");
      iframe.style.width = "1080px";
      iframe.style.height = "1350px";
      iframe.style.border = "none";
      container.appendChild(iframe);

      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
        iframe.srcdoc = item.html;
      });
      // Wait for fonts/styles to load
      await new Promise((r) => setTimeout(r, 1500));

      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc?.body) throw new Error("Could not access iframe content");

      const canvas = await html2canvas(iframeDoc.body, {
        width: 1080,
        height: 1350,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      document.body.removeChild(container);

      const link = document.createElement("a");
      link.download = `${item.title || "poster"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Downloaded as PNG!");
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback to HTML download
      const blob = new Blob([item.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.title || "poster"}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.info("Downloaded as HTML (image rendering failed)");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Content Type</label>
          <Select value={outputType} onValueChange={setOutputType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="poster">Poster / Visual</SelectItem>
              <SelectItem value="social_post">Social Media Post</SelectItem>
              <SelectItem value="slide">Slide Deck</SelectItem>
              <SelectItem value="strategy">Marketing Strategy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Platform</label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Describe what you want</label>
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="E.g. Create a launch announcement poster for our new feature..."
          className="min-h-[100px]"
        />
      </div>

      <Button onClick={handleGenerate} disabled={generate.isPending || !prompt.trim()} className="w-full">
        {generate.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Content</>}
      </Button>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-semibold">Generated Results</h3>
          <div className={`grid gap-4 ${outputType === "poster" ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}>
            {results.map((item, i) => (
              <div key={i} className="border rounded-lg overflow-hidden bg-card">
                {(outputType === "poster" || outputType === "slide") && item.html ? (
                  <div className="relative">
                    <iframe srcDoc={item.html} className="w-full h-[400px] border-none pointer-events-none" sandbox="allow-scripts" />
                    <div className="p-3 flex items-center justify-between border-t gap-2">
                      <span className="text-sm font-medium truncate">{item.title}</span>
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="ghost" onClick={() => setPreviewItem(item)} title="Preview">
                          <Maximize2 className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDownload(item)} title="Download">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleSave(item, i)} disabled={save.isPending}>
                          <Save className="h-3 w-3 mr-1" /> Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : outputType === "social_post" ? (
                  <div className="p-4 space-y-3">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm whitespace-pre-wrap">{item.caption}</p>
                    {item.hashtags && (
                      <p className="text-sm text-primary">{item.hashtags.map((h: string) => `#${h}`).join(" ")}</p>
                    )}
                    {item.visual_description && (
                      <p className="text-xs text-muted-foreground italic">Visual: {item.visual_description}</p>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleSave(item, i)} disabled={save.isPending}>
                      <Save className="h-3 w-3 mr-1" /> Save
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    <p className="font-medium">{item.title}</p>
                    <div className="text-sm max-h-[400px] overflow-auto" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.content || "") }} />
                    <Button size="sm" variant="outline" onClick={() => handleSave(item, i)} disabled={save.isPending}>
                      <Save className="h-3 w-3 mr-1" /> Save
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full-screen preview dialog */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold truncate">{previewItem?.title}</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => previewItem && handleDownload(previewItem)}>
                  <Download className="h-3 w-3 mr-1" /> Download
                </Button>
                <Button size="sm" onClick={() => { if (previewItem) { handleSave(previewItem, 0); setPreviewItem(null); } }} disabled={save.isPending}>
                  <Save className="h-3 w-3 mr-1" /> Save
                </Button>
              </div>
            </div>
            {previewItem?.html && (
              <iframe srcDoc={previewItem.html} className="flex-1 w-full border-none" sandbox="allow-scripts" />
            )}
            {previewItem && !previewItem.html && previewItem.caption && (
              <div className="p-6 overflow-auto flex-1">
                <p className="whitespace-pre-wrap">{previewItem.caption}</p>
                {previewItem.hashtags && <p className="text-primary mt-3">{previewItem.hashtags.map((h: string) => `#${h}`).join(" ")}</p>}
              </div>
            )}
            {previewItem && !previewItem.html && previewItem.content && (
              <div className="p-6 overflow-auto flex-1" dangerouslySetInnerHTML={{ __html: renderMarkdown(previewItem.content) }} />
            )}
            {/* Refine bar */}
            {previewItem?.html && (
              <div className="border-t p-3 flex gap-2 items-end">
                <Textarea
                  value={refineFeedback}
                  onChange={(e) => setRefineFeedback(e.target.value)}
                  placeholder="Describe changes... e.g. 'Make the title bigger', 'Change background to dark blue', 'Add more whitespace'"
                  className="min-h-[44px] max-h-[100px] flex-1 resize-none"
                  rows={1}
                />
                <Button onClick={handleRefine} disabled={isRefining || !refineFeedback.trim()} size="sm">
                  {isRefining ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  Refine
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
