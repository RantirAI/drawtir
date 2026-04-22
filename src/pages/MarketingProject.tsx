import { useParams, useNavigate } from "react-router-dom";
import HorizontalNav from "@/components/Navigation/HorizontalNav";
import { useMarketingProject } from "@/hooks/useMarketingProject";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import KnowledgeBaseEditor from "@/components/Marketing/KnowledgeBaseEditor";
import BrandAssetsPanel from "@/components/Marketing/BrandAssetsPanel";
import BrandSettingsPanel from "@/components/Marketing/BrandSettingsPanel";
import FeaturedImagesPanel from "@/components/Marketing/FeaturedImagesPanel";
import ContentGenerator from "@/components/Marketing/ContentGenerator";
import OutputGallery from "@/components/Marketing/OutputGallery";
import MerchDesignPanel from "@/components/Marketing/MerchDesignPanel";
import MarketingVideoPanel from "@/components/Marketing/MarketingVideoPanel";

export default function MarketingProject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useMarketingProject(id);

  if (isLoading) return <div className="min-h-screen bg-background"><HorizontalNav /><div className="text-center py-20 text-muted-foreground">Loading...</div></div>;
  if (!project) return <div className="min-h-screen bg-background"><HorizontalNav /><div className="text-center py-20 text-muted-foreground">Project not found</div></div>;

  const p = project as any;

  return (
    <div className="min-h-screen bg-background">
      <HorizontalNav />
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/marketing")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center text-lg font-bold" style={{ backgroundColor: project.primary_color + "20", color: project.primary_color }}>
              {project.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
          </div>
        </div>

        <Tabs defaultValue="knowledge" className="space-y-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="brand">Brand Assets</TabsTrigger>
            <TabsTrigger value="featured">Featured Images</TabsTrigger>
            <TabsTrigger value="settings">Brand Settings</TabsTrigger>
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="merch">Merch</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="outputs">Outputs</TabsTrigger>
          </TabsList>

          <TabsContent value="knowledge">
            <KnowledgeBaseEditor projectId={project.id} initialValue={project.knowledge_base || ""} />
          </TabsContent>

          <TabsContent value="brand">
            <BrandAssetsPanel projectId={project.id} primaryColor={project.primary_color || "#9b87f5"} logos={project.logos || []} images={project.images || []} />
          </TabsContent>

          <TabsContent value="featured">
            <FeaturedImagesPanel projectId={project.id} />
          </TabsContent>

          <TabsContent value="settings">
            <BrandSettingsPanel
              projectId={project.id}
              country={p.country || ""}
              currency={p.currency || "USD"}
              language={p.language || "English"}
              brandVoice={p.brand_voice || ""}
              forbiddenWords={p.forbidden_words || []}
            />
          </TabsContent>

          <TabsContent value="generate">
            <ContentGenerator projectId={project.id} />
          </TabsContent>

          <TabsContent value="merch">
            <MerchDesignPanel projectId={project.id} />
          </TabsContent>

          <TabsContent value="videos">
            <MarketingVideoPanel
              projectId={project.id}
              primaryColor={project.primary_color}
              logoUrl={project.logos?.[0] || null}
              brandName={project.name}
              defaultCountry={p.country}
              defaultCurrency={p.currency}
              defaultLanguage={p.language}
            />
          </TabsContent>

          <TabsContent value="outputs">
            <OutputGallery projectId={project.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
