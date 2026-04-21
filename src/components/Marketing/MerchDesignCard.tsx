import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, Maximize2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useDeleteMerchDesign } from "@/hooks/useMerchDesigns";

interface Props {
  design: any;
}

const downloadImage = async (url: string, filename: string) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch {
    window.open(url, "_blank");
  }
};

export default function MerchDesignCard({ design }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const del = useDeleteMerchDesign();

  const productLabel = design.product_type.charAt(0).toUpperCase() + design.product_type.slice(1);

  return (
    <>
      <Card className="overflow-hidden flex flex-col">
        <div className="p-3 flex items-center justify-between border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{productLabel}</span>
            <Badge variant="secondary" className="text-xs capitalize">{design.style.replace("_", " ")}</Badge>
          </div>
          <Badge variant="outline" className="text-xs capitalize">{design.base_color}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-1 p-2 bg-muted/30">
          {[
            { url: design.front_mockup_url, label: "Front" },
            { url: design.back_mockup_url, label: "Back" },
          ].map((m) => (
            <button
              key={m.label}
              onClick={() => setPreview(m.url)}
              className="relative group aspect-square bg-background rounded overflow-hidden"
            >
              {m.url ? (
                <img src={m.url} alt={`${m.label} mockup`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Maximize2 className="h-5 w-5 text-white" />
              </div>
              <span className="absolute top-1 left-1 text-[10px] bg-background/80 px-1.5 py-0.5 rounded">{m.label}</span>
            </button>
          ))}
        </div>

        {design.prompt && (
          <p className="text-xs text-muted-foreground px-3 py-2 line-clamp-2">{design.prompt}</p>
        )}

        <div className="p-2 flex flex-wrap gap-1 border-t border-border/40 mt-auto">
          <Button size="sm" variant="ghost" className="h-7 text-xs"
            onClick={() => downloadImage(design.front_design_url, `${design.product_type}-front-design.png`)}>
            <Download className="h-3 w-3" /> Front PNG
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs"
            onClick={() => downloadImage(design.back_design_url, `${design.product_type}-back-design.png`)}>
            <Download className="h-3 w-3" /> Back PNG
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto text-destructive hover:text-destructive"
            onClick={() => del.mutate({ id: design.id, project_id: design.project_id })}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </Card>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-4xl">
          {preview && <img src={preview} alt="preview" className="w-full h-auto rounded" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
