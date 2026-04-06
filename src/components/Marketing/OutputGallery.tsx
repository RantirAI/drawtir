import { useState, useRef, useMemo } from "react";
import { useMarketingOutputs } from "@/hooks/useMarketingProject";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Download, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function renderMarkdown(text: string): string {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // Headers
    .replace(/^######\s+(.+)$/gm, '<h6 class="text-sm font-bold mt-4 mb-1 text-foreground">$1</h6>')
    .replace(/^#####\s+(.+)$/gm, '<h5 class="text-sm font-bold mt-4 mb-1 text-foreground">$1</h5>')
    .replace(/^####\s+(.+)$/gm, '<h4 class="text-base font-bold mt-5 mb-2 text-foreground">$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3 class="text-lg font-bold mt-6 mb-2 text-foreground border-b border-border pb-1">$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3 text-primary">$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-primary">$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="text-foreground"><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-4 border-border" />')
    // List items
    .replace(/^\*\s+(.+)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
    .replace(/^-\s+(.+)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal mb-1">$1</li>')
    // Tables (basic pipe tables)
    .replace(/^\|(.+)\|$/gm, (match, inner) => {
      const cells = inner.split("|").map((c: string) => c.trim());
      if (cells.every((c: string) => /^[-:]+$/.test(c))) return '';
      const cellHtml = cells.map((c: string) => `<td class="border border-border px-3 py-1.5 text-sm">${c}</td>`).join("");
      return `<tr>${cellHtml}</tr>`;
    })
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/\n/g, '<br />');
  
  // Wrap table rows
  html = html.replace(/(<tr>.*?<\/tr>(?:\s*<tr>.*?<\/tr>)*)/gs, '<table class="w-full border-collapse border border-border my-4 rounded">$1</table>');
  
  return `<div class="prose max-w-none"><p class="mb-3">${html}</p></div>`;
}

interface Props {
  projectId: string;
}

export default function OutputGallery({ projectId }: Props) {
  const { data: outputs, isLoading } = useMarketingOutputs(projectId);
  const [filterType, setFilterType] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [selectedOutput, setSelectedOutput] = useState<any>(null);
  const qc = useQueryClient();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const filtered = (outputs || []).filter(o => {
    if (filterType !== "all" && o.output_type !== filterType) return false;
    if (filterPlatform !== "all" && o.platform !== filterPlatform) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("marketing_outputs").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      qc.invalidateQueries({ queryKey: ["marketing-outputs", projectId] });
      toast.success("Deleted");
      if (selectedOutput?.id === id) setSelectedOutput(null);
    }
  };

  const handleDownloadPoster = async () => {
    if (!selectedOutput) return;
    const content = selectedOutput.content as any;
    if (!content.html) return;

    try {
      const blob = new Blob([content.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedOutput.title || "poster"}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Downloaded!");
    } catch {
      toast.error("Download failed");
    }
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading outputs...</div>;

  const content = selectedOutput ? (selectedOutput.content as any) : null;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="poster">Posters</SelectItem>
            <SelectItem value="social_post">Social Posts</SelectItem>
            <SelectItem value="slide">Slides</SelectItem>
            <SelectItem value="strategy">Strategy</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Platform" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No outputs yet. Generate some content!</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(output => {
            const c = output.content as any;
            return (
              <div
                key={output.id}
                className="border rounded-lg overflow-hidden bg-card group cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={() => setSelectedOutput(output)}
              >
                {(output.output_type === "poster" || output.output_type === "slide") && c.html ? (
                  <iframe srcDoc={c.html} className="w-full h-[250px] border-none pointer-events-none" sandbox="allow-scripts" />
                ) : output.output_type === "social_post" ? (
                  <div className="p-4 h-[250px] overflow-auto">
                    <p className="text-sm whitespace-pre-wrap">{c.caption}</p>
                    {c.hashtags && <p className="text-xs text-primary mt-2">{c.hashtags.map((h: string) => `#${h}`).join(" ")}</p>}
                  </div>
                ) : (
                  <div className="p-4 h-[250px] overflow-auto text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.content || JSON.stringify(c)) }} />
                )}
                <div className="p-3 border-t flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium truncate">{output.title}</p>
                    <p className="text-xs text-muted-foreground">{output.output_type} · {output.platform}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDelete(output.id); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full preview dialog */}
      <Dialog open={!!selectedOutput} onOpenChange={(open) => !open && setSelectedOutput(null)}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <DialogTitle className="text-lg font-semibold truncate">
              {selectedOutput?.title}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {selectedOutput?.output_type} · {selectedOutput?.platform}
              </span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              {(selectedOutput?.output_type === "poster" || selectedOutput?.output_type === "slide") && content?.html && (
                <Button size="sm" variant="outline" onClick={handleDownloadPoster}>
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { handleDelete(selectedOutput?.id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {content && (selectedOutput?.output_type === "poster" || selectedOutput?.output_type === "slide") && content.html ? (
              <iframe ref={iframeRef} srcDoc={content.html} className="w-full h-full border-none" sandbox="allow-scripts" />
            ) : content && selectedOutput?.output_type === "social_post" ? (
              <div className="p-6 space-y-4 max-w-2xl mx-auto">
                <p className="text-base whitespace-pre-wrap">{content.caption}</p>
                {content.hashtags && (
                  <p className="text-sm text-primary">{content.hashtags.map((h: string) => `#${h}`).join(" ")}</p>
                )}
                {content.visual_description && (
                  <p className="text-sm text-muted-foreground italic">Visual suggestion: {content.visual_description}</p>
                )}
              </div>
            ) : content ? (
              <div className="p-6 max-w-3xl mx-auto text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(content.content || JSON.stringify(content, null, 2)) }} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
