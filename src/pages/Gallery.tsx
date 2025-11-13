import { useEffect, useState, useMemo } from "react";
import { Trash2, Loader2, FolderOpen, Globe, Lock, Search, Filter, Plus, Clock, AlertCircle, FolderInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import HorizontalNav from "@/components/Navigation/HorizontalNav";
import PageFooter from "@/components/Footer/PageFooter";
import { generateThumbnail } from "@/lib/snapshot";
import { useTemplates } from "@/hooks/useTemplates";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { usePermissions } from "@/hooks/usePermissions";
import { useActivityLog } from "@/hooks/useActivityLog";
import { MoveProjectDialog } from "@/components/Gallery/MoveProjectDialog";
import type { CanvasSnapshot } from "@/types/snapshot";
import { formatDistanceToNow } from 'date-fns';

interface Project {
  id: string;
  project_name: string;
  thumbnail_url: string | null;
  canvas_data: any;
  created_at: string;
  is_public: boolean;
  is_template: boolean;
  workspace_id?: string | null;
  user_id?: string;
}

export default function Gallery() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [filterBy, setFilterBy] = useState<"all" | "public" | "private">("all");
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [projectToMove, setProjectToMove] = useState<{ id: string; name: string; workspaceId: string | null } | null>(null);
  const { templates, isLoading: templatesLoading } = useTemplates();
  const { selectedWorkspaceId, selectedWorkspace } = useWorkspaces();
  const { recentProjects, trackProjectView } = useRecentlyViewed();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const { logActivity } = useActivityLog(selectedWorkspaceId);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      fetchProjects();
    };
    checkAuth();
  }, [navigate, selectedWorkspaceId]);

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Always filter by user_id to show only user's own projects
      let query = supabase
        .from('posters')
        .select('id, project_name, thumbnail_url, canvas_data, created_at, is_public, is_template, workspace_id, user_id')
        .eq('user_id', user.id);

      // Filter by workspace if one is selected
      if (selectedWorkspaceId) {
        query = query.eq('workspace_id', selectedWorkspaceId);
      } else {
        // Show projects without workspace_id (personal projects)
        query = query.is('workspace_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

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
    trackProjectView(id);
    navigate(`/?project=${id}`);
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!canDelete) {
      toast.error('You do not have permission to delete projects');
      return;
    }

    setDeletingId(id);
    try {
      const project = projects.find(p => p.id === id);
      const { error } = await supabase
        .from('posters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProjects(projects.filter(p => p.id !== id));
      toast.success("Project deleted");
      
      // Log activity
      if (selectedWorkspaceId && project) {
        await logActivity(
          selectedWorkspaceId,
          'deleted',
          'project',
          id,
          project.project_name
        );
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error("Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  };

  const togglePublic = async (id: string, currentPublic: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('posters')
        .update({ 
          is_public: !currentPublic,
          is_template: !currentPublic // Make it a template when making public
        })
        .eq('id', id);

      if (error) throw error;
      
      setProjects(projects.map(p => 
        p.id === id ? { ...p, is_public: !currentPublic, is_template: !currentPublic } : p
      ));
      
      toast.success(!currentPublic ? "Design is now public! Others can use it as a template." : "Design is now private");
    } catch (error) {
      console.error('Error toggling public status:', error);
      toast.error("Failed to update design");
    }
  };

  const openTemplate = (templateId: string) => {
    navigate(`/?template=${templateId}`);
  };

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.project_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by public/private
    if (filterBy === "public") {
      filtered = filtered.filter(p => p.is_public);
    } else if (filterBy === "private") {
      filtered = filtered.filter(p => !p.is_public);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.project_name.localeCompare(b.project_name);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return filtered;
  }, [projects, searchQuery, sortBy, filterBy]);

  const renderProjectCard = (project: Project, isTemplate = false) => (
    <Card 
      key={project.id} 
      className="group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50"
      onClick={() => isTemplate ? openTemplate(project.id) : openProject(project.id)}
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-muted">
        {project.thumbnail_url ? (
          <img
            src={project.thumbnail_url}
            alt={project.project_name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <FolderOpen className="w-8 h-8 text-muted-foreground/50" />
          </div>
        )}
        {project.is_public && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 shadow-sm">
            <Globe className="w-3 h-3" />
            Public
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              isTemplate ? openTemplate(project.id) : openProject(project.id);
            }}
            size="sm"
            className="bg-white/95 hover:bg-white text-black h-8 text-xs shadow-lg"
          >
            {isTemplate ? "Use Template" : "Open"}
          </Button>
          {!isTemplate && (
            <>
              <Button
                onClick={(e) => togglePublic(project.id, project.is_public, e)}
                size="sm"
                className="bg-white/95 hover:bg-primary hover:text-primary-foreground text-black h-8 w-8 p-0 shadow-lg"
                title={project.is_public ? "Make Private" : "Make Public Template"}
              >
                {project.is_public ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setProjectToMove({
                    id: project.id,
                    name: project.project_name,
                    workspaceId: project.workspace_id || null
                  });
                  setMoveDialogOpen(true);
                }}
                size="sm"
                className="bg-white/95 hover:bg-primary hover:text-primary-foreground text-black h-8 w-8 p-0 shadow-lg"
                title="Move to Workspace"
              >
                <FolderInput className="w-4 h-4" />
              </Button>
              <Button
                onClick={(e) => deleteProject(project.id, e)}
                disabled={deletingId === project.id}
                size="sm"
                variant="destructive"
                className="h-8 w-8 p-0 shadow-lg"
              >
                {deletingId === project.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="p-3 bg-card border-t border-border/50">
        <h3 className="font-medium text-sm text-foreground truncate mb-1">
          {project.project_name}
        </h3>
        <p className="text-xs text-muted-foreground">
          {new Date(project.created_at).toLocaleDateString()}
        </p>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'hsl(var(--page-bg))' }}>
      <HorizontalNav />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'hsl(var(--page-container))' }}>
          <Tabs defaultValue="projects" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-muted">
                <TabsTrigger value="projects" className="data-[state=active]:bg-background">
                  My Projects ({projects.length})
                </TabsTrigger>
                <TabsTrigger value="templates" className="data-[state=active]:bg-background">
                  Templates ({templates.length})
                </TabsTrigger>
              </TabsList>
              {canCreate ? (
                <Button 
                  onClick={() => navigate("/?new=true")}
                  size="default"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {selectedWorkspace ? `New Project in ${selectedWorkspace.name}` : 'Create New Design'}
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Viewers cannot create projects</span>
                </div>
              )}
            </div>

            <TabsContent value="projects" className="space-y-4">
              {/* Recently Viewed Section */}
              {recentProjects.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Recently Viewed</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {recentProjects.map((project) => (
                      <Card 
                        key={project.id}
                        className="group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50"
                        onClick={() => openProject(project.id)}
                      >
                        <div className="relative h-32 bg-muted overflow-hidden">
                          {project.thumbnail_url ? (
                            <img 
                              src={project.thumbnail_url} 
                              alt={project.project_name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                              <FolderOpen className="w-12 h-12 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-card border-t border-border/50">
                          <h4 className="font-medium text-xs truncate">{project.project_name}</h4>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(project.viewed_at), { addSuffix: true })}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Workspace Info Banner */}
              {selectedWorkspace && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">
                        Workspace: {selectedWorkspace.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Projects in this workspace • Role: {selectedWorkspace.your_role}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate('/workspaces')}
                    >
                      Manage Workspace
                    </Button>
                  </div>
                </div>
              )}

              {!canEdit && selectedWorkspace && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Viewer Mode</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You have view-only access to this workspace. Contact the workspace owner to request edit permissions.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date Created</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterBy} onValueChange={(v: any) => setFilterBy(v)}>
                    <SelectTrigger className="w-[120px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Projects Grid */}
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
              ) : filteredAndSortedProjects.length === 0 ? (
                <div className="text-center py-16 bg-muted/30 rounded-lg">
                  <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-base text-muted-foreground mb-4">
                    {searchQuery || filterBy !== "all" ? "No projects match your filters" : "No projects yet"}
                  </p>
                  <Button onClick={() => navigate("/")} variant="default">
                    Create your first project
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredAndSortedProjects.map((project) => renderProjectCard(project))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-16 bg-muted/30 rounded-lg">
                  <Globe className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-base text-muted-foreground mb-2">No public templates yet</p>
                  <p className="text-sm text-muted-foreground">Make one of your projects public to share it as a template!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {templates.map((template) => renderProjectCard(template as Project, true))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <PageFooter />
      
      {projectToMove && (
        <MoveProjectDialog
          projectId={projectToMove.id}
          projectName={projectToMove.name}
          currentWorkspaceId={projectToMove.workspaceId}
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          onSuccess={() => {
            fetchProjects();
            setProjectToMove(null);
          }}
        />
      )}
    </div>
  );
}
