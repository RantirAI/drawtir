import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Vibe design & storyboarding",
    description: "Tell Drawtir what you want to create and select the tags for the 'best' framework and watch the AI work it's magic.",
  },
  {
    title: "A Whiteboard with Superpowers",
    description: "Adjust colors, layouts and styles with manual edit and natural language or with the style editor.",
  },
  {
    title: "Brand Guide & Media Storage",
    description: "Create beautiful UIs, bring your own design systems and components",
  },
  {
    title: "Animate & Export Commercials",
    description: "With Drawtir's story boarding and commercial editing animations the Rantir Studio team brings a timeline view to any creation.",
  },
  {
    title: "Generate Images & Video",
    description: "Our Studio made this SDK kit for quick video and imagery presentations and high quality video support - now it's released to the public.",
  },
  {
    title: "For Slides, UI or Presentations",
    description: "Your frames are your canvas, and create presentation, website, poster or social media templates all in one place.",
  },
  {
    title: "Open source & free (unless using Rantir Studio Cloud)",
    description: "Work together, share projects, and build with your team seamlessly or fork and host it yourself with your own AI API keys.",
  },
  {
    title: "Export & Embed",
    description: "Get production-ready code design editor built around your own Figma, Canvas or Web Assets to finetune your Drawtir SDK experience. Export to your favorite IDE and integrate directly into your workflow and even white-label it.",
  },
];

export default function FeaturesSection() {
  return (
    <div className="relative z-10 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="bg-background/40 backdrop-blur-sm border-border/50 hover:bg-background/60 transition-all"
            >
              <CardHeader>
                <CardTitle className="text-foreground text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
