import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoModal } from "@/components/Canvas/InfoModal";
import type { CanvasSnapshot } from "@/types/snapshot";
import CanvasContainerNew from "@/components/Canvas/CanvasContainerNew";

export default function PublicPoster() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<CanvasSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState("");
  const [infoModalContent, setInfoModalContent] = useState("");

  useEffect(() => {
    const loadPublicPoster = async () => {
      if (!id) {
        setError("No poster ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("posters")
          .select("canvas_data, project_name, is_public")
          .eq("id", id)
          .eq("is_public", true)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setError("Poster not found or not public");
          setIsLoading(false);
          return;
        }

        if (data.canvas_data) {
          setSnapshot(data.canvas_data as unknown as CanvasSnapshot);
        }
      } catch (error) {
        console.error("Error loading public poster:", error);
        setError("Failed to load poster");
      } finally {
        setIsLoading(false);
      }
    };

    loadPublicPoster();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Poster Not Found</h1>
          <p className="text-muted-foreground">{error || "This poster is not available publicly"}</p>
        </div>
        <Button onClick={() => navigate("/")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">
        <CanvasContainerNew 
          initialSnapshot={snapshot} 
          readOnly={true}
          isEmbedded={true}
          onElementInteraction={(element) => {
            if (!element.interactivity?.enabled) return;
            
            if (element.interactivity.actionType === "link" && element.interactivity.url) {
              window.open(element.interactivity.url, element.interactivity.openInNewTab ? "_blank" : "_self");
            } else if (element.interactivity.actionType === "info") {
              setInfoModalTitle(element.interactivity.infoTitle || "Information");
              setInfoModalContent(element.interactivity.infoContent || "");
              setShowInfoModal(true);
            }
          }}
        />
      </div>
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title={infoModalTitle}
        content={infoModalContent}
      />
    </div>
  );
}
