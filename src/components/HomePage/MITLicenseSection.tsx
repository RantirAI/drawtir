import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GitFork, Shield } from "lucide-react";

export default function MITLicenseSection() {
  return (
    <section className="relative z-10 py-16 px-4">
      <div className="max-w-[720px] mx-auto">
        <motion.div
          className="rounded-xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-border/20 p-8 md:p-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <GitFork className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-[hsl(40,20%,92%)]">
              MIT Extended License
            </h2>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Drawtir ships open-source under the MIT license. Fork it, embed it, and build on top of it freely. 
            For businesses needing enterprise-grade use, an extended license is available.
          </p>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border/20 mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Extended License</span>
            </div>
            <div className="sm:ml-auto">
              <span className="text-lg font-bold text-[hsl(40,20%,92%)]">$999</span>
              <span className="text-xs text-muted-foreground">/yearly</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mb-6">
            Free to fork, with Extended MIT-License available for enterprise deployment, 
            commercial redistribution, and priority support.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              size="sm"
              className="text-xs"
              onClick={() => window.open('https://github.com/drawtir', '_blank')}
            >
              <GitFork className="w-3.5 h-3.5 mr-1.5" />
              Fork on GitHub
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs border-border/50"
              onClick={() => window.open('mailto:hello@drawtir.com?subject=Extended%20MIT%20License', '_blank')}
            >
              Request Extended License
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
