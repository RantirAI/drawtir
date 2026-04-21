import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, Maximize2, Box, Users, FileImage, Loader2, Wand2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useDeleteMerchDesign, useGenerateMerchSizes, useRefineMerchDesign } from "@/hooks/useMerchDesigns";
import { generatePrintReadyPNG, getPrintSpecLabel } from "@/lib/printReady";
import { toast } from "sonner";
import Merch3DPreview from "./Merch3DPreview";

interface Props {
  design: any;
}

const downloadBlob = (blob: Blob, filename: string) => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const downloadImage = async (url: string, filename: string) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    downloadBlob(blob, filename);
  } catch {
    window.open(url, "_blank");
  }
};

export default function MerchDesignCard({ design }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [show3D, setShow3D] = useState(false);
  const [showSizes, setShowSizes] = useState(false);
  const [printingSide, setPrintingSide] = useState<"front" | "back" | null>(null);
  const [showRefine, setShowRefine] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState("");
  const [refineFront, setRefineFront] = useState(true);
  const [refineBack, setRefineBack] = useState(true);
  const del = useDeleteMerchDesign();
  const genSizes = useGenerateMerchSizes();
  const refine = useRefineMerchDesign();

  const handleRefine = () => {
    const sides: ("front" | "back")[] = [];
    if (refineFront) sides.push("front");
    if (refineBack) sides.push("back");
    if (!refinePrompt.trim() || sides.length === 0) return;
    refine.mutate(
      { design_id: design.id, project_id: design.project_id, refine_prompt: refinePrompt.trim(), sides },
      {
        onSuccess: () => {
          setShowRefine(false);
          setRefinePrompt("");
        },
      }
    );
  };

  const productLabel = design.product_type.charAt(0).toUpperCase() + design.product_type.slice(1);
  const hasSizes = !!(design.size_small_url && design.size_medium_url && design.size_large_url);

  const handlePrintReady = async (side: "front" | "back") => {
    try {
      setPrintingSide(side);
      const url = side === "front" ? design.front_design_url : design.back_design_url;
      const blob = await generatePrintReadyPNG(url, design.product_type);
      downloadBlob(blob, `${design.product_type}-${side}-print-ready-300dpi.png`);
      toast.success(`Print-ready ${side} downloaded (${getPrintSpecLabel(design.product_type)})`);
    } catch (e: any) {
      toast.error(e.message || "Failed to build print file");
    } finally {
      setPrintingSide(null);
    }
  };

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
            onClick={() => setShowRefine(true)}>
            <Wand2 className="h-3 w-3" /> Refine
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs"
            onClick={() => setShow3D(true)}>
            <Box className="h-3 w-3" /> 3D
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs"
            onClick={() => {
              if (!hasSizes && !genSizes.isPending) {
                genSizes.mutate({ design_id: design.id, project_id: design.project_id });
              }
              setShowSizes(true);
            }}>
            {genSizes.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Users className="h-3 w-3" />} Sizes
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs"
            disabled={printingSide === "front"}
            onClick={() => handlePrintReady("front")}>
            {printingSide === "front" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileImage className="h-3 w-3" />} Print F
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs"
            disabled={printingSide === "back"}
            onClick={() => handlePrintReady("back")}>
            {printingSide === "back" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileImage className="h-3 w-3" />} Print B
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs"
            onClick={() => downloadImage(design.front_design_url, `${design.product_type}-front-design.png`)}>
            <Download className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto text-destructive hover:text-destructive"
            onClick={() => del.mutate({ id: design.id, project_id: design.project_id })}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </Card>

      <Dialog open={showRefine} onOpenChange={(o) => !refine.isPending && setShowRefine(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Refine Design — {productLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>What should change?</Label>
              <Textarea
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                placeholder="e.g. Make the typography bolder, swap the icon for a mountain, use a tighter layout, remove the tagline..."
                rows={4}
                disabled={refine.isPending}
              />
              <p className="text-xs text-muted-foreground">
                The AI will keep the original design's identity and apply your refinements. Mockups will be regenerated automatically.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox checked={refineFront} onCheckedChange={(v) => setRefineFront(!!v)} disabled={refine.isPending} />
                Refine front
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox checked={refineBack} onCheckedChange={(v) => setRefineBack(!!v)} disabled={refine.isPending} />
                Refine back
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRefine(false)} disabled={refine.isPending}>Cancel</Button>
            <Button
              onClick={handleRefine}
              disabled={refine.isPending || !refinePrompt.trim() || (!refineFront && !refineBack)}
            >
              {refine.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Refining...</>
              ) : (
                <><Wand2 className="h-4 w-4" /> Apply Refinement</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-4xl">
          {preview && <img src={preview} alt="preview" className="w-full h-auto rounded" />}
        </DialogContent>
      </Dialog>

      <Dialog open={show3D} onOpenChange={setShow3D}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>3D Preview — {productLabel}</DialogTitle>
          </DialogHeader>
          <div className="h-[480px] relative">
            <Merch3DPreview
              frontImage={design.front_mockup_url}
              backImage={design.back_mockup_url}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSizes} onOpenChange={setShowSizes}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Size Variants — {productLabel}</DialogTitle>
          </DialogHeader>
          {genSizes.isPending && !hasSizes ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Generating size variants on small / medium / large fits...
            </div>
          ) : hasSizes ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { url: design.size_small_url, label: "Small fit" },
                { url: design.size_medium_url, label: "Medium fit" },
                { url: design.size_large_url, label: "Large fit" },
              ].map((s) => (
                <div key={s.label} className="space-y-2">
                  <div className="aspect-[3/4] bg-muted rounded overflow-hidden">
                    <img src={s.url} alt={s.label} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{s.label}</span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs"
                      onClick={() => downloadImage(s.url, `${design.product_type}-${s.label.toLowerCase().replace(" ", "-")}.png`)}>
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">No size variants yet</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
