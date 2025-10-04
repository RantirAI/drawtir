import { useEffect, useState } from "react";
import { Download, Trash2, Loader2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";

interface Poster {
  id: string;
  image_url: string;
  caption: string;
  image_style: string;
  created_at: string;
}

export default function Gallery() {
  const navigate = useNavigate();
  const [posters, setPosters] = useState<Poster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      fetchPosters();
    };
    checkAuth();
  }, [navigate]);

  const fetchPosters = async () => {
    try {
      const { data, error } = await supabase
        .from('posters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosters(data || []);
    } catch (error) {
      console.error('Error fetching posters:', error);
      toast.error("Failed to load posters");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPoster = (poster: Poster) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = 1200;
      canvas.height = 1600;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 60px Arial';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 20;

      const lines = poster.caption.split('\n');
      const lineHeight = 80;
      const startY = canvas.height - (lines.length * lineHeight) - 80;

      lines.forEach((line, index) => {
        ctx.fillText(line, 80, startY + (index * lineHeight));
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `poster-${poster.id}.png`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success("Downloaded!");
        }
      });
    };
    img.src = poster.image_url;
  };

  const deletePoster = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('posters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPosters(posters.filter(p => p.id !== id));
      toast.success("Poster deleted");
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error("Failed to delete poster");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="border-b bg-card px-8 py-4">
          <div className="max-w-7xl">
            <h1 className="text-2xl font-semibold text-foreground mb-1">Your Posters</h1>
            <p className="text-sm text-muted-foreground">View and manage your saved posters</p>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : posters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No posters yet</p>
              <Button onClick={() => navigate("/")}>Create Your First Poster</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posters.map((poster) => (
                <Card 
                  key={poster.id} 
                  className="overflow-hidden border shadow-sm group cursor-pointer transition-all hover:shadow-md"
                  onClick={() => navigate(`/editor/${poster.id}`)}
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                    <img
                      src={poster.image_url}
                      alt="Poster"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-4">
                      <div className="text-white space-y-1">
                        {poster.caption.split('\n').slice(0, 2).map((line, i) => (
                          <p key={i} className="text-sm font-bold drop-shadow-lg line-clamp-1">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/editor/${poster.id}`);
                        }}
                        size="sm"
                        className="bg-white/90 hover:bg-white text-foreground"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadPoster(poster);
                        }}
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={(e) => deletePoster(poster.id, e)}
                        disabled={deletingId === poster.id}
                        size="sm"
                        variant="destructive"
                        className="bg-white/90 hover:bg-red-500 text-red-600 hover:text-white"
                      >
                        {deletingId === poster.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 bg-card">
                    <p className="text-xs text-muted-foreground">
                      {new Date(poster.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
