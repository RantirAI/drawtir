import { useEffect, useState } from "react";
import { Trash2, Loader2, Edit, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import HorizontalNav from "@/components/Navigation/HorizontalNav";
import PageFooter from "@/components/Footer/PageFooter";
import { generateThumbnail, validateSnapshot } from "@/lib/snapshot";
import type { CanvasSnapshot } from "@/types/snapshot";

interface Project {
  id: string;
  project_name: string;
  thumbnail_url: string | null;
  canvas_data: any;
  created_at: string;
}

export default function Gallery() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      fetchProjects();
    };
    checkAuth();
  }, [navigate]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('posters')
        .select('id, project_name, thumbnail_url, canvas_data, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rows = data || [];

      // Generate client-side thumbnails for projects missing one
      const enhanced = await Promise.all(
        rows.map(async (p) => {
          try {
            if (!p.thumbnail_url && p.canvas_data) {
              const snapshot = p.canvas_data as unknown as CanvasSnapshot;
              if (snapshot?.frames && Array.isArray(snapshot.frames)) {
                const thumb = await generateThumbnail(snapshot.frames);
                return { ...p, thumbnail_url: thumb } as Project;
              }
            }
          } catch {}
          return p as Project;
        })
      );

      setProjects(enhanced);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const openProject = (id: string) => {
    navigate(`/?project=${id}`);
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('posters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProjects(projects.filter(p => p.id !== id));
      toast.success("Project deleted");
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error("Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'hsl(var(--page-bg))' }}>
      <HorizontalNav />
      <main className="container mx-auto px-4 py-4">
        <div className="max-w-6xl mx-auto rounded-xl p-4" style={{ backgroundColor: 'hsl(var(--page-container))' }}>
          <h1 className="text-lg font-semibold mb-4">Projects</h1>

          <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No projects yet</p>
              <Button onClick={() => navigate("/")} size="sm" className="h-7 text-xs">
                Create your first project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {projects.map((project) => (
                <Card 
                  key={project.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => openProject(project.id)}
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                    {project.thumbnail_url ? (
                      <img
                        src={project.thumbnail_url}
                        alt={project.project_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <FolderOpen className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          openProject(project.id);
                        }}
                        size="sm"
                        className="bg-white/90 hover:bg-white text-foreground h-6 text-xs"
                      >
                        Open
                      </Button>
                      <Button
                        onClick={(e) => deleteProject(project.id, e)}
                        disabled={deletingId === project.id}
                        size="sm"
                        variant="destructive"
                        className="bg-white/90 hover:bg-red-500 text-red-600 hover:text-white h-6"
                      >
                        {deletingId === project.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="p-2 bg-card">
                    <h3 className="font-medium text-sm text-foreground truncate mb-0.5">
                      {project.project_name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
          </div>
        </div>
      </main>
      <PageFooter />
    </div>
  );
}
