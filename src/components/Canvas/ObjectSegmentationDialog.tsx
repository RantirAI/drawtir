import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Layers } from "lucide-react";
import { segmentImageToLayers, SegmentedLayer } from "@/lib/objectSegmentation";
import { toast } from "sonner";

interface ObjectSegmentationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSelectLayer: (layer: SegmentedLayer) => void;
}

export default function ObjectSegmentationDialog({
  open,
  onOpenChange,
  imageUrl,
  onSelectLayer,
}: ObjectSegmentationDialogProps) {
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [layers, setLayers] = useState<SegmentedLayer[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleSegment = async () => {
    setIsSegmenting(true);
    try {
      const segmentedLayers = await segmentImageToLayers(imageUrl, {
        maxObjects: 8,
        minAreaRatio: 0.02,
      });
      
      if (segmentedLayers.length === 0) {
        toast.error("No objects detected in image");
        return;
      }
      
      setLayers(segmentedLayers);
      toast.success(`Found ${segmentedLayers.length} objects`);
    } catch (error) {
      console.error("Segmentation error:", error);
      toast.error("Failed to segment image");
    } finally {
      setIsSegmenting(false);
    }
  };

  const handleLayerClick = (layer: SegmentedLayer) => {
    onSelectLayer(layer);
    toast.success(`Added ${layer.label} to canvas`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Separate Image Objects
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {layers.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-muted-foreground text-center">
                Detect and separate individual objects in your image
              </p>
              <Button
                onClick={handleSegment}
                disabled={isSegmenting}
                size="lg"
              >
                {isSegmenting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4 mr-2" />
                    Detect Objects
                  </>
                )}
              </Button>
            </div>
          )}

          {layers.length > 0 && (
            <>
              <div className="text-sm text-muted-foreground">
                Click on any object to add it as a new layer
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {layers.map((layer, index) => (
                  <button
                    key={index}
                    onClick={() => handleLayerClick(layer)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="group relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-lg"
                    style={{
                      borderColor: hoveredIndex === index ? "hsl(var(--primary))" : "hsl(var(--border))",
                      backgroundColor: "hsl(var(--muted))",
                    }}
                  >
                    <img
                      src={layer.dataUrl}
                      alt={layer.label}
                      className="w-full h-full object-contain p-2"
                      style={{
                        filter: hoveredIndex === index ? "drop-shadow(0 0 8px hsl(var(--primary)))" : "none",
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-2 text-xs font-medium text-center capitalize">
                      {layer.label}
                    </div>
                    {hoveredIndex === index && (
                      <div className="absolute inset-0 border-4 rounded-lg pointer-events-none animate-pulse"
                        style={{
                          borderColor: "hsl(var(--primary))",
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
              <Button
                onClick={handleSegment}
                variant="outline"
                className="w-full"
                disabled={isSegmenting}
              >
                {isSegmenting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Re-analyzing...
                  </>
                ) : (
                  "Detect Again"
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
