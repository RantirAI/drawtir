import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HorizontalNav from "@/components/Navigation/HorizontalNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarketingProjects, useCreateMarketingProject, useDeleteMarketingProject } from "@/hooks/useMarketingProject";
import { Plus, Trash2, Megaphone, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Marketing() {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useMarketingProjects();
  const create = useCreateMarketingProject();
  const deleteProject = useDeleteMarketingProject();
  const [newName, setNewName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = () => {
    if (!newName.trim()) return;
    create.mutate(newName.trim(), {
      onSuccess: (data) => {
        setNewName("");
        setDialogOpen(false);
        navigate(`/marketing/${data.id}`);
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <HorizontalNav />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Megaphone className="h-8 w-8 text-primary" /> Marketing Agent
            </h1>
            <p className="text-muted-foreground mt-1">Create AI-powered marketing content for your projects</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Marketing Project</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <Input placeholder="Project name (e.g. Kolleti)" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreate()} />
                <Button onClick={handleCreate} disabled={!newName.trim() || create.isPending} className="w-full">
                  {create.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
        ) : !projects?.length ? (
          <div className="text-center py-20 space-y-4">
            <Megaphone className="h-16 w-16 mx-auto text-muted-foreground/30" />
            <p className="text-lg text-muted-foreground">No marketing projects yet</p>
            <p className="text-sm text-muted-foreground">Create a project to start generating marketing content with AI</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(p => (
              <div key={p.id} className="border rounded-xl p-5 bg-card hover:border-primary/30 transition-colors group cursor-pointer" onClick={() => navigate(`/marketing/${p.id}`)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center text-lg font-bold" style={{ backgroundColor: p.primary_color + "20", color: p.primary_color }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold">{p.name}</h3>
                      <p className="text-xs text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={e => { e.stopPropagation(); deleteProject.mutate(p.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 mt-4 text-xs text-muted-foreground">
                  <span>{p.knowledge_base ? "KB configured" : "No KB"}</span>
                  <span>·</span>
                  <span>{(p.logos || []).length} logos</span>
                  <span>·</span>
                  <span>{(p.images || []).length} images</span>
                  <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
