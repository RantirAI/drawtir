import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LicenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LicenseModal({ open, onOpenChange }: LicenseModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-card border-border/30 p-0">
        <DialogHeader className="p-4 pb-2 border-b border-border/20">
          <DialogTitle className="text-base font-semibold text-foreground">
            Drawtir Fair-Use License (DFUL)
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Version 1.0 — Effective 2025 • Copyright © 2025–present Rantir, Inc. (DBA HexigonAI, Inc.)
          </p>
        </DialogHeader>
        <ScrollArea className="h-[60vh] px-4 py-3">
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <section>
              <h3 className="text-sm font-medium text-foreground mb-1">0. OVERVIEW</h3>
              <p>This license governs the use of Drawtir, Webtir, the Drawtir SDK, any TIR Templates, and all editor components provided under the Rantir ecosystem (collectively the Software).</p>
              <p className="mt-2">This document includes:</p>
              <ul className="list-disc ml-4 mt-1 space-y-0.5">
                <li>Drawtir Fair-Use License (DFUL) — Free tier and open-source usage</li>
                <li>Drawtir Enterprise License (DEL) — Commercial embedding, SaaS use, resale, and white-labeling</li>
                <li>Rantir Data Policy — Data ownership, security, and model-training restrictions</li>
              </ul>
              <p className="mt-2">If there is a conflict, the Enterprise License governs enterprise components, and the Data Policy governs all user data and AI-related handling.</p>
            </section>

            <section>
              <h3 className="text-sm font-medium text-foreground mb-1">1. LICENSED CONTENT & EXCLUSIONS</h3>
              <p>Files containing .enterprise. or located inside any /enterprise/ directory are not covered under the Drawtir Fair-Use License (DFUL). They require a valid Drawtir Enterprise License (DEL) for production or commercial use.</p>
              <p className="mt-2">All other files are covered under DFUL, except third-party dependencies which remain under their original licenses.</p>
              <p className="mt-2">Any content outside the primary default branch is not licensed for use.</p>
            </section>

            <section>
              <h3 className="text-sm font-medium text-foreground mb-1">2. DRAWTIR FAIR-USE LICENSE (DFUL)</h3>
              <p className="italic">(Free Tier — For individuals, internal teams, and non-commercial builders)</p>
              <p className="mt-2">This license applies to the Drawtir SDK, the Drawtir visual editor, embedded templates, and any non-enterprise components provided in the GitHub repository or published under the Rantir organization.</p>
              
              <h4 className="text-xs font-medium text-foreground mt-3 mb-1">2.1 Acceptance</h4>
              <p>Using the Software constitutes acceptance of all terms in this license.</p>
              
              <h4 className="text-xs font-medium text-foreground mt-3 mb-1">2.2 Copyright License</h4>
              <p>Rantir grants you a worldwide, royalty-free, non-transferable, non-exclusive license to:</p>
              <ul className="list-disc ml-4 mt-1 space-y-0.5">
                <li>run the Software</li>
                <li>self-host or deploy internally</li>
                <li>copy, modify, and create derivative works</li>
                <li>use in internal business workflows</li>
                <li>use for personal projects</li>
                <li>create private templates, integrations, or plugins</li>
              </ul>
              <p className="mt-2">You may not use DFUL for any commercial, monetized, or public SaaS embedding.</p>

              <h4 className="text-xs font-medium text-foreground mt-3 mb-1">2.3 Open-Source Use</h4>
              <p>The Software is free to fork and modify on GitHub for:</p>
              <ul className="list-disc ml-4 mt-1 space-y-0.5">
                <li>private internal business needs</li>
                <li>research</li>
                <li>prototyping</li>
                <li>client deliverables (so long as the Software is not resold or embedded publicly)</li>
              </ul>
              <p className="mt-2">Commercial use requires a DEL or MIT Upgrade License for embedding or distribution.</p>

              <h4 className="text-xs font-medium text-foreground mt-3 mb-1">2.4 Restrictions Under DFUL</h4>
              <p>Under the free Fair-Use License, you may not:</p>
              <ul className="list-disc ml-4 mt-1 space-y-0.5">
                <li>embed Drawtir or Webtir inside a paid SaaS product</li>
                <li>rebrand or white-label the Software</li>
                <li>resell Drawtir, Webtir, or Drawtir SDK derivatives</li>
                <li>use Drawtir to build a competing editor, template marketplace, or SDK</li>
                <li>distribute modified or unmodified copies for any fee</li>
                <li>publish editor components or templates outside the Rantir ecosystem</li>
                <li>remove or alter copyright notices</li>
                <li>use Drawtir data, components, or templates to train public or commercial AI models</li>
                <li>include Drawtir inside another commercial product without proper licensing</li>
              </ul>
              <p className="mt-2">Anything beyond internal or personal use requires an Enterprise or MIT-based license.</p>

              <h4 className="text-xs font-medium text-foreground mt-3 mb-1">2.5 Community Templates</h4>
              <p>Community templates built for Drawtir must remain licensed under DFUL. Creators retain ownership but grant Rantir a perpetual redistribution right inside the ecosystem.</p>
            </section>

            <section>
              <h3 className="text-sm font-medium text-foreground mb-1">3. DRAWTIR ENTERPRISE LICENSE (DEL)</h3>
              <p className="italic">(For SaaS products, white-labeling, resale, and commercial embedding)</p>
              
              <h4 className="text-xs font-medium text-foreground mt-3 mb-1">3.1 Enterprise Components</h4>
              <p>Any file containing .enterprise. or located under /enterprise/ is governed exclusively by DEL.</p>

              <h4 className="text-xs font-medium text-foreground mt-3 mb-1">3.2 Production Rights</h4>
              <p>Enterprise components may only be used in production with a valid license.</p>

              <h4 className="text-xs font-medium text-foreground mt-3 mb-1">3.3 Commercial Rights Granted</h4>
              <p>A DEL grants the ability to:</p>
              <ul className="list-disc ml-4 mt-1 space-y-0.5">
                <li>embed Drawtir or Webtir into a commercial SaaS</li>
                <li>operate the editor under your brand or design system</li>
                <li>resell Rantir-powered products</li>
                <li>distribute derivative templates or editors externally</li>
                <li>build commercial template marketplaces</li>
                <li>deploy modified versions at scale</li>
                <li>perform controlled white-labeling</li>
              </ul>
              <p className="mt-2">These rights are not granted under DFUL.</p>

              <h4 className="text-xs font-medium text-foreground mt-3 mb-1">3.4 Development & Testing</h4>
              <p>Without an enterprise license, you may copy and test enterprise components but may not deploy them publicly.</p>

              <h4 className="text-xs font-medium text-foreground mt-3 mb-1">3.5 No Other Rights</h4>
              <p>All rights not expressly granted are reserved by Rantir.</p>
            </section>

            <section>
              <h3 className="text-sm font-medium text-foreground mb-1">4. DATA POLICY — APPLICABLE TO DFUL & DEL</h3>
              
              <h4 className="text-xs font-medium text-foreground mt-3 mb-1">4.1 Data Handling</h4>
              <p>Rantir does not log, store, sell, analyze, or reuse user data, projects, templates, or content. No customer data is used to train any AI model.</p>

              <h4 className="text-xs font-medium text-foreground mt-3 mb-1">4.2 Data Ownership</h4>
              <p>All data processed by Drawtir stays 100% owned by the user or their organization.</p>

              <h4 className="text-xs font-medium text-foreground mt-3 mb-1">4.3 Environment & API Keys</h4>
              <p>Keys for AI providers (OpenAI, Gemini, Anthropic, Bedrock, etc.) are:</p>
              <ul className="list-disc ml-4 mt-1 space-y-0.5">
                <li>encrypted at rest</li>
                <li>never logged</li>
                <li>never reused</li>
                <li>never used for internal analytics</li>
                <li>only sent directly to the provider to fulfill the user's request</li>
              </ul>

              <h4 className="text-xs font-medium text-foreground mt-3 mb-1">4.4 Bring Your Own Key (BYOK)</h4>
              <p>When keys are supplied:</p>
              <ul className="list-disc ml-4 mt-1 space-y-0.5">
                <li>data sent to the AI provider follows the provider's policies</li>
                <li>Rantir does not access or reuse transmitted content</li>
                <li>no training sets or logs are created</li>
              </ul>

              <h4 className="text-xs font-medium text-foreground mt-3 mb-1">4.5 No Model Training</h4>
              <p>Rantir does not:</p>
              <ul className="list-disc ml-4 mt-1 space-y-0.5">
                <li>train any model on user content</li>
                <li>generate datasets from editor actions</li>
                <li>reuse templates or flows for model improvement</li>
                <li>extract metadata for analytics</li>
              </ul>

              <h4 className="text-xs font-medium text-foreground mt-3 mb-1">4.6 Data Retention</h4>
              <p>No persistent datasets are created except what is required for editor functionality.</p>
            </section>

            <section>
              <h3 className="text-sm font-medium text-foreground mb-1">5. PATENTS</h3>
              <p>A limited patent license is granted solely for using the Software. This license terminates immediately if you pursue a claim asserting patent infringement.</p>
            </section>

            <section>
              <h3 className="text-sm font-medium text-foreground mb-1">6. NOTICES</h3>
              <p>Any redistribution must include this license in full. Modified versions must prominently disclose all changes.</p>
            </section>

            <section>
              <h3 className="text-sm font-medium text-foreground mb-1">7. TERMINATION</h3>
              <p>Any violation terminates your rights immediately. A first violation may be cured within 30 days; subsequent violations permanently terminate rights.</p>
            </section>

            <section>
              <h3 className="text-sm font-medium text-foreground mb-1">8. WARRANTY DISCLAIMER</h3>
              <p>The Software is provided "as is", with no guarantees. Rantir is not liable for any damages.</p>
            </section>

            <section>
              <h3 className="text-sm font-medium text-foreground mb-1">9. DEFINITIONS (Drawtir Context)</h3>
              <ul className="space-y-1 mt-1">
                <li><span className="text-foreground">Licensor:</span> Rantir, Inc. DBA HexigonAI, Inc.</li>
                <li><span className="text-foreground">Software:</span> Drawtir, Drawtir SDK, Webtir, editor components, templates, and TIR frameworks</li>
                <li><span className="text-foreground">Enterprise Components:</span> Files tagged .enterprise. or stored in /enterprise/</li>
                <li><span className="text-foreground">DFUL:</span> Drawtir Fair-Use License</li>
                <li><span className="text-foreground">DEL:</span> Drawtir Enterprise License</li>
                <li><span className="text-foreground">Commercial Use:</span> SaaS integration, resale, redistribution, rebranding, or monetized deployment</li>
                <li><span className="text-foreground">User Data:</span> Any content, templates, workflows, AI prompts, metadata, or logic created by the user</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
