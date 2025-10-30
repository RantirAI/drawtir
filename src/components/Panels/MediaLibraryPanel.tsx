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
      <div className={inline ? "p-4 flex items-center justify-between" : "p-4 border-b flex items-center justify-between"}>
          <label>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            <Button size="sm" disabled={uploading} asChild>
              <span className="cursor-pointer flex items-center gap-2">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload Image
              </span>
            </Button>
          </label>
        </div>

        <ScrollArea className={inline ? "h-[calc(100vh-200px)]" : "h-[600px]"}>
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
            <div className={inline ? "grid grid-cols-4 gap-4 p-6" : "grid grid-cols-3 gap-3 p-4"}>
              {media.map((item) => (
                <div
                  key={item.id}
                  className="relative group aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all hover:scale-105"
                  onClick={() => onSelectImage?.(item.file_url)}
                >
                  <img
                    src={item.file_url}
                    alt={item.file_name}
                    className="w-full h-full object-cover"
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
      <div className="absolute inset-0 bg-background/95 backdrop-blur-sm animate-in fade-in duration-300 z-20">
        <div className="h-full flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  return (
    <DraggablePanel
      title="Media Library"
      defaultPosition={{ x: 100, y: 100 }}
      onClose={onClose || (() => {})}
    >
      <div className="w-[580px] bg-card rounded-lg">
        {content}
      </div>
    </DraggablePanel>
  );
};