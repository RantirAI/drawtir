import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Upload, Trash2, Pencil, Tag, Loader2 } from "lucide-react";
import {
  useFeaturedImages,
  useUploadFeaturedImage,
  useUpdateFeaturedImage,
  useDeleteFeaturedImage,
  FeaturedImage,
} from "@/hooks/useFeaturedImages";

interface Props {
  projectId: string;
}

export default function FeaturedImagesPanel({ projectId }: Props) {
  const { data: images = [], isLoading } = useFeaturedImages(projectId);
  const upload = useUploadFeaturedImage();
  const updateImg = useUpdateFeaturedImage();
  const del = useDeleteFeaturedImage();

  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<FeaturedImage | null>(null);

  const handlePick = (file: File) => {
    setPendingFile(file);
    setLabel(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    setDescription("");
  };

  const handleUpload = async () => {
    if (!pendingFile || !label.trim()) return;
    await upload.mutateAsync({
      project_id: projectId,
      file: pendingFile,
      label: label.trim(),
      description: description.trim(),
    });
    setPendingFile(null);
    setLabel("");
    setDescription("");
  };

  const handleSaveEdit = async () => {
    if (!editing || !label.trim()) return;
    await updateImg.mutateAsync({
      id: editing.id,
      project_id: projectId,
      label: label.trim(),
      description: description.trim(),
    });
    setEditing(null);
  };

  const openEdit = (img: FeaturedImage) => {
    setEditing(img);
    setLabel(img.label);
    setDescription(img.description);
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Featured product screenshots</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Upload labeled screenshots of your product (e.g. "Event list page", "Add event form"). The AI will reference
          these by label in the script and show the actual screenshots inside generated marketing videos — never
          inventing fake UI.
        </p>
        <div>
          <Button onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
            <Upload className="h-4 w-4" /> Add screenshot
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePick(f);
              e.target.value = "";
            }}
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
      ) : images.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No featured screenshots yet. Add product pages so the AI can reference them in videos.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((img) => (
            <Card key={img.id} className="overflow-hidden flex flex-col">
              <div className="aspect-video bg-muted/30 overflow-hidden">
                <img src={img.image_url} alt={img.label} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 space-y-1 flex-1 flex flex-col">
                <div className="font-medium truncate">{img.label}</div>
                {img.description && (
                  <div className="text-xs text-muted-foreground line-clamp-2">{img.description}</div>
                )}
                <div className="flex items-center gap-1 mt-auto pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(img)} className="flex-1">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => del.mutate({ id: img.id, project_id: projectId })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!pendingFile} onOpenChange={(o) => !o && setPendingFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Label this screenshot</DialogTitle>
            <DialogDescription>
              Tell the AI what this page or screen is so it can reference it accurately in marketing videos.
            </DialogDescription>
          </DialogHeader>
          {pendingFile && (
            <div className="aspect-video rounded overflow-hidden bg-muted">
              <img src={URL.createObjectURL(pendingFile)} alt="preview" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="space-y-2">
            <Label>Label *</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Event list page"
            />
          </div>
          <div className="space-y-2">
            <Label>What does it show? (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Members can browse upcoming events with filters by category and date."
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingFile(null)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!label.trim() || upload.isPending}>
              {upload.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit screenshot</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="aspect-video rounded overflow-hidden bg-muted">
              <img src={editing.image_url} alt="preview" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="space-y-2">
            <Label>Label *</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={!label.trim() || updateImg.isPending}>
              {updateImg.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
