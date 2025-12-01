import { motion } from "framer-motion";
import { 
  Palette, 
  Layers, 
  Sparkles, 
  Video, 
  Image, 
  Layout, 
  Users, 
  Code, 
  Zap 
} from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "Vibe design & storyboarding",
    description: "Tell Drawtir what you want and watch AI work its magic.",
  },
  {
    icon: Layers,
    title: "Whiteboard with Superpowers",
    description: "Adjust colors, layouts and styles with natural language.",
  },
  {
    icon: Sparkles,
    title: "Brand Guide & Media",
    description: "Create beautiful UIs with your own design systems.",
  },
  {
    icon: Video,
    title: "Animate & Export",
    description: "Timeline view for storyboarding and commercial editing.",
  },
  {
    icon: Image,
    title: "Generate Images & Video",
    description: "Quick video and imagery with high quality export.",
  },
  {
    icon: Layout,
    title: "Slides, UI or Presentations",
    description: "Create website, poster or social media templates.",
  },
  {
    icon: Users,
    title: "Open source & free",
    description: "Work together, share projects, or fork it yourself.",
  },
  {
    icon: Code,
    title: "Export & Embed",
    description: "Production-ready code editor with SDK experience.",
  },
  {
    icon: Zap,
    title: "AI-Powered Workflow",
    description: "Intelligent suggestions and automated design tasks.",
  },
];

export default function NineFeatureGrid() {
  return (
    <section className="relative z-10 py-20 px-4">
      <div className="max-w-[720px] mx-auto">
        <motion.h2
          className="text-2xl md:text-3xl font-bold text-center text-[hsl(40,20%,92%)] mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Everything you need to create
        </motion.h2>
        
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="p-5 rounded-lg bg-card/50 backdrop-blur-sm border border-border/20 hover:border-border/40 hover:bg-card/70 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <feature.icon className="w-6 h-6 text-foreground mb-3" />
              <h3 className="text-sm font-semibold text-[hsl(40,20%,92%)] mb-1.5">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
