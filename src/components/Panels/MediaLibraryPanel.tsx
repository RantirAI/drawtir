import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, Trash2, Loader2, Search, MoreVertical, Copy, Link, Files } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MediaItem {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  source: string;
  thumbnail_url: string | null;
  created_at: string;
}

interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

interface MediaLibraryPanelProps {
  onSelectImage?: (url: string) => void;
  onClose?: () => void;
  open?: boolean;
}

export const MediaLibraryPanel = ({ onSelectImage, onClose, open = false }: MediaLibraryPanelProps) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [unsplashImages, setUnsplashImages] = useState<UnsplashImage[]>([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasLoadedDefault, setHasLoadedDefault] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMedia();
  }, []);

  useEffect(() => {
    if (open && !hasLoadedDefault) {
      searchUnsplash("trending");
      setHasLoadedDefault(true);
    }
  }, [open]);

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

  const searchUnsplash = async (query: string) => {
    const searchTerm = query.trim() || "trending";

    setUnsplashLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-unsplash', {
        body: { query: searchTerm, page: 1, perPage: 30 },
      });

      if (error) throw error;
      setUnsplashImages(data.results || []);
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUnsplashLoading(false);
    }
  };

  const handleUnsplashSelect = async (image: UnsplashImage) => {
    onSelectImage?.(image.urls.regular);
    
    // Save to media library
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('media_library')
        .insert({
          user_id: user.id,
          file_name: `unsplash-${image.id}`,
          file_url: image.urls.regular,
          file_type: 'image/jpeg',
          source: 'unsplash',
          thumbnail_url: image.urls.thumb,
        });
    } catch (error) {
      console.error('Failed to save Unsplash image:', error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[70vh] p-3">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm">Media Library</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="uploads" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full h-8">
              <TabsTrigger value="uploads" className="flex-1 text-xs">My Uploads</TabsTrigger>
              <TabsTrigger value="unsplash" className="flex-1 text-xs">Unsplash</TabsTrigger>
            </TabsList>

            <TabsContent value="uploads" className="flex-1 min-h-0 mt-2">
              <ScrollArea className="h-[calc(70vh-100px)]">
                {loading ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : media.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <p className="text-xs">No media yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-2 p-2">
                    {/* Upload tile */}
                    <label className="relative aspect-square rounded-md overflow-hidden cursor-pointer group border border-dashed border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                        {uploading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">Upload</span>
                          </>
                        )}
                      </div>
                    </label>

                    {/* Existing images */}
                    {media.map((item) => (
                      <div key={item.id} className="relative group">
                        <div
                          className="aspect-square rounded-md overflow-hidden cursor-pointer hover:ring-1 hover:ring-primary transition-all"
                          onClick={() => {
                            onSelectImage?.(item.file_url);
                            onClose?.();
                          }}
                        >
                          <img
                            src={item.file_url}
                            alt={item.file_name}
                            className="w-full h-full object-cover bg-muted/30"
                          />
                        </div>
                        <div className="absolute -bottom-4 left-0 right-0 flex items-center justify-between px-0.5 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                          <p className="text-[9px] text-muted-foreground truncate flex-1 max-w-[80%]">{item.file_name}</p>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(item.file_url);
                                  toast({
                                    title: "Link copied",
                                    description: "Asset URL copied to clipboard",
                                  });
                                }}
                              >
                                <Copy className="w-3 h-3 mr-2" />
                                <span className="text-xs">Copy link</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(item.file_url, '_blank');
                                }}
                              >
                                <Link className="w-3 h-3 mr-2" />
                                <span className="text-xs">Open link</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectImage?.(item.file_url);
                                }}
                              >
                                <Files className="w-3 h-3 mr-2" />
                                <span className="text-xs">Duplicate</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(item.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3 mr-2" />
                                <span className="text-xs">Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="unsplash" className="flex-1 min-h-0 mt-2">
              <div className="mb-2 flex gap-1.5">
                <Input
                  placeholder="Search Unsplash..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      searchUnsplash(searchQuery);
                    }
                  }}
                  className="h-8 text-xs"
                />
                <Button
                  onClick={() => searchUnsplash(searchQuery)}
                  disabled={unsplashLoading}
                  size="sm"
                  className="h-8 px-3"
                >
                  {unsplashLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Search className="w-3 h-3" />
                  )}
                </Button>
              </div>

              <ScrollArea className="h-[calc(70vh-140px)]">
                {unsplashLoading ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : unsplashImages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                    <Search className="w-6 h-6 mb-1" />
                    <p className="text-xs">Search for images</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-2 p-2">
                    {unsplashImages.map((image) => (
                      <div
                        key={image.id}
                        className="relative group aspect-square rounded-md overflow-hidden cursor-pointer hover:ring-1 hover:ring-primary transition-all"
                        onClick={() => {
                          handleUnsplashSelect(image);
                          onClose?.();
                        }}
                      >
                        <img
                          src={image.urls.small}
                          alt={image.alt_description || 'Unsplash image'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1 pt-1.5">
                          <p className="text-white text-[9px] truncate w-full">
                            by {image.user.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Delete image?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will permanently delete the image from your media library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="text-xs h-8">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};