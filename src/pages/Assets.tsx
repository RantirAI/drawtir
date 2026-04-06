import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HorizontalNav from "@/components/Navigation/HorizontalNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Sparkles, FolderOpen } from "lucide-react";
import { useAssetProjects, useCreateAssetProject, useDeleteAssetProject } from "@/hooks/useAssetProject";

export default function Assets() {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useAssetProjects();
  const createProject = useCreateAssetProject();
  const deleteProject = useDeleteAssetProject();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    const project = await createProject.mutateAsync({ name: name.trim(), description: description.trim() || undefined });
    setCreateOpen(false);
    setName("");
    setDescription("");
    if (project) navigate(`/assets/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <HorizontalNav />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">AI Asset Generator</h1>
            <p className="text-sm text-muted-foreground mt-1">Create projects and generate 2D game assets with AI</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />New Project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Asset Project</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Project Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pixel Dungeon RPG" />
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of your game or project" />
                </div>
                <Button onClick={handleCreate} disabled={!name.trim() || createProject.isPending} className="w-full">
                  {createProject.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : !projects?.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first project to start generating assets</p>
              <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Create Project</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <Card key={p.id} className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => navigate(`/assets/${p.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{p.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{(p.art_style || "pixel_art").replace("_", " ")}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8" onClick={e => { e.stopPropagation(); deleteProject.mutate(p.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{p.description}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
