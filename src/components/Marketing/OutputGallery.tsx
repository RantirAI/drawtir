import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMarketingOutputs } from "@/hooks/useMarketingProject";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function renderMarkdown(text: string): string {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^###\s+(.+)$/gm, '<h3 class="text-lg font-bold mt-6 mb-2 text-foreground border-b border-border pb-1">$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3 text-primary">$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-primary">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^-\s+(.+)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/\n/g, '<br />');
  return `<div class="prose max-w-none"><p class="mb-3">${html}</p></div>`;
}

interface Props {
  projectId: string;
}

export default function OutputGallery({ projectId }: Props) {
  const { data: outputs, isLoading } = useMarketingOutputs(projectId);
  const [filterType, setFilterType] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const qc = useQueryClient();
  const navigate = useNavigate();

  const filtered = (outputs || []).filter(o => {
    if (filterType !== "all" && o.output_type !== filterType) return false;
    if (filterPlatform !== "all" && o.platform !== filterPlatform) return false;
    return true;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("marketing_outputs").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      qc.invalidateQueries({ queryKey: ["marketing-outputs", projectId] });
      toast.success("Deleted");
    }
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading outputs...</div>;

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
                onClick={() => navigate(`/marketing/${projectId}/output/${output.id}`)}
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
                    onClick={(e) => handleDelete(output.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
