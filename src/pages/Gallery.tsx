import { useEffect, useState } from "react";
import { Trash2, Loader2, Edit, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import HorizontalNav from "@/components/Navigation/HorizontalNav";

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
      setProjects(data || []);
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
    <div className="min-h-screen bg-background">
      <HorizontalNav />
      <main className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-xl shadow-sm border p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Projects</h1>
            <p className="text-sm text-muted-foreground">View and manage your saved projects</p>
          </div>

          <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No projects yet</p>
              <Button onClick={() => navigate("/")}>Create Your First Project</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project) => (
                <Card 
                  key={project.id} 
                  className="overflow-hidden border shadow-sm group cursor-pointer transition-all hover:shadow-md"
                  onClick={() => openProject(project.id)}
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                    {project.thumbnail_url ? (
                      <img
                        src={project.thumbnail_url}
                        alt={project.project_name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <FolderOpen className="w-12 h-12 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          openProject(project.id);
                        }}
                        size="sm"
                        className="bg-white/90 hover:bg-white text-foreground"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Open
                      </Button>
                      <Button
                        onClick={(e) => deleteProject(project.id, e)}
                        disabled={deletingId === project.id}
                        size="sm"
                        variant="destructive"
                        className="bg-white/90 hover:bg-red-500 text-red-600 hover:text-white"
                      >
                        {deletingId === project.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-card">
                    <h3 className="font-medium text-sm text-foreground truncate mb-1">
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
    </div>
  );
}
