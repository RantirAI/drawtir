import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Download, Trash2, Loader2, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import html2canvas from "html2canvas";

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

export default function MarketingOutputEditor() {
  const { id: projectId, outputId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [refineFeedback, setRefineFeedback] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [liveHtml, setLiveHtml] = useState<string | null>(null);

  const { data: output, isLoading } = useQuery({
    queryKey: ["marketing-output", outputId],
    queryFn: async () => {
      if (!outputId) return null;
      const { data, error } = await supabase
        .from("marketing_outputs")
        .select("*")
        .eq("id", outputId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!outputId,
  });

  const content = output?.content as any;
  const displayHtml = liveHtml || content?.html;

  useEffect(() => {
    setLiveHtml(null);
  }, [outputId]);

  const handleRefine = async () => {
    if (!displayHtml || !refineFeedback.trim()) return;
    setIsRefining(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-marketing-content", {
        body: {
          project_id: projectId,
          output_type: output?.output_type || "poster",
          platform: output?.platform || "general",
          refine_html: displayHtml,
          refine_feedback: refineFeedback,
        },
      });
      if (error) throw error;
      const refined = data?.results?.[0];
      if (refined?.html) {
        setLiveHtml(refined.html);
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

  const handleSaveRefined = async () => {
    if (!liveHtml || !output) return;
    const { error } = await supabase
      .from("marketing_outputs")
      .update({ content: { ...content, html: liveHtml } })
      .eq("id", output.id);
    if (error) {
      toast.error(error.message);
    } else {
      qc.invalidateQueries({ queryKey: ["marketing-output", outputId] });
      qc.invalidateQueries({ queryKey: ["marketing-outputs", projectId] });
      setLiveHtml(null);
      toast.success("Saved refined version!");
    }
  };

  const handleDownload = async () => {
    if (!displayHtml) return;
    toast.info("Rendering image...");
    try {
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;width:1080px;height:1350px";
      document.body.appendChild(container);
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "width:1080px;height:1350px;border:none";
      container.appendChild(iframe);
      await new Promise<void>((r) => { iframe.onload = () => r(); iframe.srcdoc = displayHtml; });
      await new Promise((r) => setTimeout(r, 1500));
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc?.body) throw new Error("No iframe body");
      const canvas = await html2canvas(iframeDoc.body, { width: 1080, height: 1350, scale: 2, useCORS: true, allowTaint: true });
      document.body.removeChild(container);
      const link = document.createElement("a");
      link.download = `${output?.title || "poster"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Downloaded as PNG!");
    } catch {
      const blob = new Blob([displayHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${output?.title || "poster"}.html`; a.click();
      URL.revokeObjectURL(url);
      toast.info("Downloaded as HTML (image rendering failed)");
    }
  };

  const handleDelete = async () => {
    if (!output) return;
    const { error } = await supabase.from("marketing_outputs").delete().eq("id", output.id);
    if (error) toast.error(error.message);
    else {
      qc.invalidateQueries({ queryKey: ["marketing-outputs", projectId] });
      toast.success("Deleted");
      navigate(`/marketing/${projectId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!output) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">Output not found</p>
        <Button variant="outline" onClick={() => navigate(`/marketing/${projectId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  const isVisual = (output.output_type === "poster" || output.output_type === "slide") && displayHtml;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="border-b px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/marketing/${projectId}`)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-sm font-semibold truncate max-w-[300px]">{output.title}</h1>
            <p className="text-xs text-muted-foreground">{output.output_type} · {output.platform}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {liveHtml && (
            <Button size="sm" onClick={handleSaveRefined}>
              <Save className="h-4 w-4 mr-1" /> Save Changes
            </Button>
          )}
          {isVisual && (
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" /> Download
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview area */}
        <div className="flex-1 overflow-auto bg-muted/30">
          {isVisual ? (
            <iframe srcDoc={displayHtml} className="w-full h-full border-none" sandbox="allow-scripts" />
          ) : content?.caption ? (
            <div className="p-8 max-w-2xl mx-auto">
              <p className="text-base whitespace-pre-wrap">{content.caption}</p>
              {content.hashtags && (
                <p className="text-sm text-primary mt-4">{content.hashtags.map((h: string) => `#${h}`).join(" ")}</p>
              )}
              {content.visual_description && (
                <p className="text-sm text-muted-foreground italic mt-3">Visual: {content.visual_description}</p>
              )}
            </div>
          ) : content?.html ? (
            <iframe srcDoc={content.html} className="w-full h-full border-none" sandbox="allow-scripts" />
          ) : (
            <div className="p-8 max-w-3xl mx-auto prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: renderMarkdown(content?.content || JSON.stringify(content, null, 2)) }} />
          )}
        </div>

        {/* Side panel for refining */}
        {isVisual && (
          <div className="w-[340px] border-l flex flex-col shrink-0 bg-background">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm">Refine Design</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Describe changes you want to make to this design
              </p>
            </div>
            <div className="flex-1 p-4 flex flex-col gap-3">
              <Textarea
                value={refineFeedback}
                onChange={(e) => setRefineFeedback(e.target.value)}
                placeholder="e.g. Make the title bigger, change the background to dark blue, add more whitespace around the logo..."
                className="flex-1 min-h-[120px] resize-none"
              />
              <Button
                onClick={handleRefine}
                disabled={isRefining || !refineFeedback.trim()}
                className="w-full"
              >
                {isRefining ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Refining...</>
                ) : (
                  <><RefreshCw className="h-4 w-4 mr-2" /> Refine</>
                )}
              </Button>
              {liveHtml && (
                <p className="text-xs text-muted-foreground text-center">
                  Unsaved changes — click "Save Changes" in the top bar to keep them
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
