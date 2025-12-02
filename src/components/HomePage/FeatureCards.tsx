import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import featureBlue from "@/assets/feature-blue.png";
import featureGreen from "@/assets/feature-green.png";
import featureYellow from "@/assets/feature-yellow.png";
import featurePurple from "@/assets/feature-purple.png";

const features = [
  {
    title: "Visual logic without limits",
    description: "Drawtir lets you design complex UI UX, slides, documents even storyboards with agentic instant feedback. Drag, paint, draw and create beautiful UI UX, slides or graphics.",
    accent: "blue",
    glowColor: "hsl(221 83% 53% / 0.3)",
    image: featureBlue,
  },
  {
    title: "Lightweight engine, powerful core",
    description: "A modular AI logic engine that adapts to your designs. Add variables, conditions, async steps, and AI reasoning blocks without writing custom infrastructure.",
    accent: "green",
    glowColor: "hsl(142 71% 45% / 0.3)",
    image: featureGreen,
  },
  {
    title: "Animate with a timeline for effortless videos",
    description: "Create videos in a breeze with Drawtir's quick video and imagery presentations and high quality video support - now it's released to the public.",
    accent: "yellow",
    glowColor: "hsl(48 96% 53% / 0.3)",
    image: featureYellow,
  },
  {
    title: "Theme it to your brand",
    description: "Customize Drawtir's UI to match your product. Adjust tokens, colors, motion, and surface styles so the editor fits seamlessly into your ecosystem.",
    accent: "purple",
    glowColor: "hsl(271 91% 65% / 0.3)",
    image: featurePurple,
  },
];

const accentClasses = {
  blue: "border-l-[hsl(221,83%,53%)]",
  green: "border-l-[hsl(142,71%,45%)]",
  yellow: "border-l-[hsl(48,96%,53%)]",
  purple: "border-l-[hsl(271,91%,65%)]",
};

export default function FeatureCards() {
  return (
    <section className="relative z-10 py-20 px-4">
      <div className="max-w-[720px] mx-auto">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                className={`
                  h-full bg-gradient-to-br from-card/80 to-card/40 
                  backdrop-blur-sm border-border/20 
                  border-l-4 ${accentClasses[feature.accent as keyof typeof accentClasses]}
                  hover:border-border/40 transition-all duration-300 overflow-hidden
                `}
                style={{
                  boxShadow: `0 8px 32px ${feature.glowColor}`,
                }}
              >
                {/* Feature Image */}
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                </div>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-lg font-semibold text-[hsl(40,20%,92%)]">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
