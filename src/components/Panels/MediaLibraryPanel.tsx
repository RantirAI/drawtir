import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import DraggablePanel from "./DraggablePanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MediaItem {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  source: string;
  thumbnail_url: string | null;
  created_at: string;
}

interface MediaLibraryPanelProps {
  onSelectImage?: (url: string) => void;
  onClose?: () => void;
  inline?: boolean;
}

export const MediaLibraryPanel = ({ onSelectImage, onClose, inline = false }: MediaLibraryPanelProps) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading media",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('media_library')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          source: 'upload',
        });

      if (dbError) throw dbError;

      toast({
        title: "Upload successful",
        description: "Image added to media library",
      });

      loadMedia();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const mediaItem = media.find(m => m.id === deleteId);
      if (!mediaItem) return;

      const fileName = mediaItem.file_url.split('/').slice(-2).join('/');
      
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([fileName]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('media_library')
        .delete()
        .eq('id', deleteId);

      if (dbError) throw dbError;

      toast({
        title: "Deleted",
        description: "Image removed from library",
      });

      loadMedia();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const content = (
    <>
      {/* Header */}
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-1">Media Library</h2>
        <p className="text-sm text-muted-foreground">Upload and manage your images</p>
      </div>

      <ScrollArea className={inline ? "h-[calc(100vh-140px)]" : "h-[600px]"}>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <ImageIcon className="w-8 h-8 mb-2" />
              <p className="text-sm">No media yet</p>
              <p className="text-xs">Upload images or generate with AI</p>
            </div>
          ) : (
            <div className={inline ? "grid grid-cols-2 gap-3 p-4" : "grid grid-cols-3 gap-3 p-4"}>
              {/* Upload tile as first item */}
              <label className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border-2 border-dashed border-muted-foreground/30 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">Upload</span>
                    </>
                  )}
                </div>
              </label>

              {/* Existing images */}
              {media.map((item) => (
                <div
                  key={item.id}
                  className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all hover:scale-[1.02]"
                  onClick={() => onSelectImage?.(item.file_url)}
                >
                  <img
                    src={item.file_url}
                    alt={item.file_name}
                    className="w-full h-full object-contain bg-muted/30"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(item.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {item.source === 'ai-generated' && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      AI
                    </div>
                  )}
                  {item.source === 'template' && (
                    <div className="absolute top-2 right-2 bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">
                      Template
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete image?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the image from your media library.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  );

  if (inline) {
    return (
      <div className="absolute left-16 top-0 bottom-0 w-80 animate-in fade-in slide-in-from-left duration-300 z-30">
        <div className="h-full flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  return (
    <DraggablePanel
      title="Media Library"
      defaultPosition={{ x: 120, y: 100 }}
      onClose={onClose || (() => {})}
    >
      <div className="w-[580px] bg-card rounded-lg">
        {content}
      </div>
    </DraggablePanel>
  );
};