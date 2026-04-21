import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Shirt } from "lucide-react";
import { useMerchDesigns, useGenerateMerchDesign } from "@/hooks/useMerchDesigns";
import MerchDesignCard from "./MerchDesignCard";

interface Props {
  projectId: string;
}

const PRODUCTS = [
  { value: "hoodie", label: "Hoodie" },
  { value: "tshirt", label: "T-Shirt" },
  { value: "crewneck", label: "Crewneck" },
  { value: "cap", label: "Cap" },
  { value: "tote", label: "Tote Bag" },
  { value: "mug", label: "Mug" },
  { value: "handbag", label: "Handbag" },
  { value: "paper_bag", label: "Paper Bag" },
  { value: "shopping_bag", label: "Shopping Bag" },
  { value: "backpack", label: "Backpack" },
  { value: "drawstring_bag", label: "Drawstring Bag" },
];

const COLORS = [
  { value: "black", label: "Black", hex: "#0a0a0a" },
  { value: "white", label: "White", hex: "#f8f8f8" },
  { value: "heather grey", label: "Heather Grey", hex: "#9ca3af" },
  { value: "navy", label: "Navy", hex: "#1e293b" },
  { value: "cream", label: "Cream", hex: "#f5e6c8" },
  { value: "forest green", label: "Forest Green", hex: "#14532d" },
];

const STYLES = [
  { value: "corporate", label: "Corporate" },
  { value: "minimal", label: "Minimal" },
  { value: "vintage", label: "Vintage" },
  { value: "streetwear", label: "Streetwear" },
  { value: "bold_typography", label: "Bold Typography" },
  { value: "illustrated", label: "Illustrated" },
  { value: "y2k", label: "Y2K" },
  { value: "grunge", label: "Grunge" },
];

export default function MerchDesignPanel({ projectId }: Props) {
  const [productType, setProductType] = useState("hoodie");
  const [baseColor, setBaseColor] = useState("black");
  const [style, setStyle] = useState("corporate");
  const [prompt, setPrompt] = useState("");
  const [useLogo, setUseLogo] = useState(true);
  const [useBrandColor, setUseBrandColor] = useState(true);

  const { data: designs = [], isLoading } = useMerchDesigns(projectId);
  const generate = useGenerateMerchDesign();

  const handleGenerate = () => {
    generate.mutate({
      project_id: projectId,
      product_type: productType,
      base_color: baseColor,
      style,
      prompt,
      use_logo: useLogo,
      use_brand_color: useBrandColor,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shirt className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Generate Merch Design</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Product</Label>
            <Select value={productType} onValueChange={setProductType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRODUCTS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Base Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setBaseColor(c.value)}
                  title={c.label}
                  className={`h-9 w-9 rounded-md border-2 transition ${baseColor === c.value ? "border-primary scale-110" : "border-border/40"}`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Optional direction</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Make it about our launch event, feature the mascot, include the tagline..."
            rows={2}
          />
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <Checkbox checked={useLogo} onCheckedChange={(v) => setUseLogo(!!v)} />
            Use project logo
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <Checkbox checked={useBrandColor} onCheckedChange={(v) => setUseBrandColor(!!v)} />
            Use brand color
          </label>

          <Button
            onClick={handleGenerate}
            disabled={generate.isPending}
            className="ml-auto"
          >
            {generate.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate Design Set</>
            )}
          </Button>
        </div>

        {generate.isPending && (
          <p className="text-xs text-muted-foreground">
            Creating front + back designs and product mockups. This usually takes 30–60 seconds.
          </p>
        )}
      </Card>

      <div>
        <h3 className="font-semibold mb-3">Recent Designs</h3>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
        ) : designs.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground text-sm">
            No designs yet. Generate your first merch design above.
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {designs.map((d: any) => <MerchDesignCard key={d.id} design={d} />)}
          </div>
        )}
      </div>
    </div>
  );
}
