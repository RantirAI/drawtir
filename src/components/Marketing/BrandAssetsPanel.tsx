import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateMarketingProject } from "@/hooks/useMarketingProject";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, Image, Palette } from "lucide-react";
import { toast } from "sonner";

interface Props {
  projectId: string;
  primaryColor: string;
  logos: string[];
  images: string[];
}

export default function BrandAssetsPanel({ projectId, primaryColor, logos, images }: Props) {
  const [color, setColor] = useState(primaryColor);
  const update = useUpdateMarketingProject();
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, type: "logos" | "images") => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const path = `${user.id}/marketing/${projectId}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("media").upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
      const current = type === "logos" ? logos : images;
      update.mutate({ id: projectId, [type]: [...current, publicUrl] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const removeItem = (type: "logos" | "images", url: string) => {
    const current = type === "logos" ? logos : images;
    update.mutate({ id: projectId, [type]: current.filter(u => u !== url) });
  };

  const saveColor = () => {
    update.mutate({ id: projectId, primary_color: color });
    toast.success("Color updated");
  };

  return (
    <div className="space-y-8">
      {/* Primary Color */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Palette className="h-5 w-5" /> Primary Color</h3>
        <div className="flex items-center gap-3">
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-14 rounded cursor-pointer" />
          <Input value={color} onChange={e => setColor(e.target.value)} className="w-32" />
          <Button size="sm" onClick={saveColor} disabled={color === primaryColor}>Save</Button>
        </div>
      </div>

      {/* Logos */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Image className="h-5 w-5" /> Logos</h3>
        <div className="grid grid-cols-4 gap-3">
          {logos.map(url => (
            <div key={url} className="relative group rounded-lg border bg-muted/30 p-2">
              <img src={url} alt="Logo" className="w-full h-20 object-contain" />
              <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItem("logos", url)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 cursor-pointer hover:border-primary/50 transition-colors">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">Upload Logo</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], "logos")} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Feature Images */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Image className="h-5 w-5" /> Feature Images</h3>
        <p className="text-sm text-muted-foreground">Upload screenshots, product images, or any visuals the AI can reference.</p>
        <div className="grid grid-cols-4 gap-3">
          {images.map(url => (
            <div key={url} className="relative group rounded-lg border overflow-hidden">
              <img src={url} alt="Feature" className="w-full h-24 object-cover" />
              <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItem("images", url)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 cursor-pointer hover:border-primary/50 transition-colors min-h-[96px]">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">Upload Image</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], "images")} disabled={uploading} />
          </label>
        </div>
      </div>
    </div>
  );
}
