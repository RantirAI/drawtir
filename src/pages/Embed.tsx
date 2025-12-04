import { useState } from "react";
import HorizontalNav from "@/components/Navigation/HorizontalNav";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code, Layers, FileText } from "lucide-react";
import PageFooter from "@/components/Footer/PageFooter";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Embed() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <SubscriptionGuard>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'hsl(var(--page-bg))' }}>
      <HorizontalNav />
      <main className="container mx-auto px-4 py-4">
        <div className="flex gap-4">
          {/* Main Content */}
          <div className="flex-1">
            <div className="rounded-xl p-6" style={{ backgroundColor: 'hsl(var(--page-container))' }}>
              <h1 className="text-2xl font-bold mb-4">Embed & SDK</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Embed the Drawtir canvas editor in your application using our SDK.
              </p>

              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 mb-6 border border-primary/20">
                <h2 className="text-base font-semibold mb-2">Quick Start</h2>
                <pre className="bg-muted p-2 rounded-lg text-xs overflow-x-auto">
                  <code>{`npm install @drawtir/sdk`}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Modal Links */}
          <aside className="w-48 shrink-0">
            <div className="rounded-xl p-4" style={{ backgroundColor: 'hsl(var(--page-container))' }}>
              <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">SDK Documentation</h3>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-7 text-xs px-2"
                  onClick={() => setActiveModal("sdk-overview")}
                >
                  <Code className="h-3 w-3 mr-1.5" />
                  SDK Overview
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-7 text-xs px-2"
                  onClick={() => setActiveModal("sdk-demo")}
                >
                  <Layers className="h-3 w-3 mr-1.5" />
                  Live SDK Demo
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-7 text-xs px-2"
                  onClick={() => setActiveModal("embed-example")}
                >
                  <Layers className="h-3 w-3 mr-1.5" />
                  Embed Example
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-7 text-xs px-2"
                  onClick={() => setActiveModal("api-reference")}
                >
                  <Code className="h-3 w-3 mr-1.5" />
                  API Reference
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-7 text-xs px-2"
                  onClick={() => setActiveModal("mit-extended")}
                >
                  <FileText className="h-3 w-3 mr-1.5" />
                  MIT Extended License
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <PageFooter />

      {/* SDK Overview Modal */}
      <Dialog open={activeModal === "sdk-overview"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">SDK Overview</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="text-xs space-y-3 pr-4">
              <p className="text-muted-foreground">
                The Drawtir SDK allows you to embed the canvas editor in your application and control it programmatically.
              </p>

              <h3 className="font-semibold pt-2">React Component</h3>
              <pre className="bg-muted p-2 rounded text-[10px] overflow-x-auto">
                <code>{`import { DrawtirEmbed } from '@drawtir/sdk';
import { useRef } from 'react';

function MyEditor() {
  const editorRef = useRef(null);

  return (
    <DrawtirEmbed 
      ref={editorRef}
      onSave={(snapshot) => {
        console.log('Saved:', snapshot);
      }}
      onChange={(snapshot) => {
        console.log('Changed:', snapshot);
      }}
    />
  );
}`}</code>
              </pre>

              <h3 className="font-semibold pt-2">Vanilla JavaScript</h3>
              <pre className="bg-muted p-2 rounded text-[10px] overflow-x-auto">
                <code>{`import DrawtirSDK from '@drawtir/sdk';

const editor = new DrawtirSDK({
  container: '#editor',
  onSave: (snapshot) => {
    console.log('Saved:', snapshot);
  },
  onChange: (snapshot) => {
    console.log('Changed:', snapshot);
  }
});`}</code>
              </pre>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Live SDK Demo Modal */}
      <Dialog open={activeModal === "sdk-demo"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">Live SDK Demo</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="text-xs space-y-3 pr-4">
              <p className="text-muted-foreground">
                Experience the full Drawtir SDK in action. This is a live, interactive demo showing the canvas editor embedded in a page.
              </p>

              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded p-3 border border-primary/20">
                <h3 className="font-semibold mb-2">Interactive Demo</h3>
                <p className="text-muted-foreground mb-3">
                  The demo includes a fully functional canvas editor with export capabilities, event handling, and programmatic controls.
                </p>
                <Button
                  size="sm"
                  onClick={() => window.open('/sdk-demo', '_blank')}
                  className="w-full text-xs h-7"
                >
                  Open Full SDK Demo →
                </Button>
              </div>

              <h3 className="font-semibold pt-2">What's Included</h3>
              <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                <li><strong className="text-foreground">Live Canvas Editor</strong> - Full-featured editor</li>
                <li><strong className="text-foreground">Export Functions</strong> - Download as PNG or JSON</li>
                <li><strong className="text-foreground">Sample Templates</strong> - Load pre-designed posters</li>
                <li><strong className="text-foreground">Code Examples</strong> - React and Vanilla JS</li>
              </ul>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Embed Example Modal */}
      <Dialog open={activeModal === "embed-example"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">Embed Example</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="text-xs space-y-3 pr-4">
              <p className="text-muted-foreground">
                Learn how to embed the Drawtir canvas anywhere in your application.
              </p>

              <h3 className="font-semibold pt-2">Basic Embed</h3>
              <pre className="bg-muted p-2 rounded text-[10px] overflow-x-auto">
                <code>{`<!DOCTYPE html>
<html>
<head>
  <title>Drawtir Embedded Editor</title>
</head>
<body>
  <div id="editor-container"></div>
  
  <script type="module">
    import DrawtirSDK from '@drawtir/sdk';
    
    const editor = new DrawtirSDK({
      container: '#editor-container',
      autoSave: true,
      onSave: (snapshot) => {
        localStorage.setItem('canvas', JSON.stringify(snapshot));
      }
    });
  </script>
</body>
</html>`}</code>
              </pre>

              <h3 className="font-semibold pt-2">With Controls</h3>
              <pre className="bg-muted p-2 rounded text-[10px] overflow-x-auto">
                <code>{`<div class="toolbar">
  <button onclick="editor.clear()">Clear</button>
  <button onclick="handleExport()">Export</button>
</div>
<div id="editor-container"></div>

<script type="module">
  import DrawtirSDK from '@drawtir/sdk';
  
  const editor = new DrawtirSDK({
    container: '#editor-container'
  });
  
  window.handleExport = async () => {
    const blob = await editor.exportPNG();
    // Download blob
  };
</script>`}</code>
              </pre>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* API Reference Modal */}
      <Dialog open={activeModal === "api-reference"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">API Reference</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="text-xs space-y-3 pr-4">
              <h3 className="font-semibold">DrawtirEmbed Props</h3>
              <div className="bg-muted p-2 rounded space-y-2">
                <div>
                  <code className="font-semibold text-[10px]">snapshot?: CanvasSnapshot</code>
                  <p className="text-muted-foreground text-[10px]">Initial canvas state to load</p>
                </div>
                <div>
                  <code className="font-semibold text-[10px]">onSave?: (snapshot) =&gt; void</code>
                  <p className="text-muted-foreground text-[10px]">Called when user saves</p>
                </div>
                <div>
                  <code className="font-semibold text-[10px]">onChange?: (snapshot) =&gt; void</code>
                  <p className="text-muted-foreground text-[10px]">Called when canvas changes</p>
                </div>
                <div>
                  <code className="font-semibold text-[10px]">readOnly?: boolean</code>
                  <p className="text-muted-foreground text-[10px]">Disable editing (default: false)</p>
                </div>
              </div>

              <h3 className="font-semibold pt-2">Ref Methods</h3>
              <div className="bg-muted p-2 rounded space-y-2">
                <div>
                  <code className="font-semibold text-[10px]">getSnapshot(): CanvasSnapshot</code>
                  <p className="text-muted-foreground text-[10px]">Get current canvas state</p>
                </div>
                <div>
                  <code className="font-semibold text-[10px]">loadSnapshot(snapshot): void</code>
                  <p className="text-muted-foreground text-[10px]">Load a canvas state</p>
                </div>
                <div>
                  <code className="font-semibold text-[10px]">exportPNG(): Promise&lt;Blob&gt;</code>
                  <p className="text-muted-foreground text-[10px]">Export canvas as PNG</p>
                </div>
                <div>
                  <code className="font-semibold text-[10px]">clear(): void</code>
                  <p className="text-muted-foreground text-[10px]">Clear the canvas</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* MIT Extended License Modal */}
      <Dialog open={activeModal === "mit-extended"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">MIT Extended License</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh]">
            <div className="text-xs space-y-3 pr-4">
              <div className="text-center pb-2 border-b">
                <p className="font-semibold">Drawtir (by Rantir Studio) — MIT Extended License</p>
                <p className="text-muted-foreground text-[10px]">Version 1.0 — Effective 2025</p>
                <p className="text-muted-foreground text-[10px]">Copyright © 2025–present Rantir, Inc. (DBA HexigonAI, Inc.)</p>
              </div>

              <h3 className="font-semibold">1. MIT LICENSE</h3>
              <p className="text-muted-foreground text-[10px] leading-relaxed">
                Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
              </p>
              <p className="text-muted-foreground text-[10px] leading-relaxed">
                The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
              </p>
              <p className="text-muted-foreground text-[10px] leading-relaxed uppercase">
                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
              </p>

              <h3 className="font-semibold pt-2">2. MIT EXTENDED LICENSE TERMS (REQUIRED FOR DRAWTIR)</h3>
              <p className="text-muted-foreground text-[10px] leading-relaxed">
                This section modifies and extends the MIT License for Drawtir only. The base MIT License above applies to Drawtir only while the licensee maintains an active, paid MIT Extended License Subscription with Rantir, Inc.
              </p>

              <h4 className="font-medium text-[11px]">2.1 Conditioned Grant of Rights</h4>
              <p className="text-muted-foreground text-[10px] leading-relaxed">
                The rights granted under Section 1 (MIT License) are provided solely during the period in which the licensee maintains a valid, paid yearly Drawtir MIT Extended License subscription and the subscription remains active, current, and in good standing. If the subscription lapses, is cancelled, or is not renewed, all MIT rights terminate immediately and automatically, except for internal archival copies already obtained.
              </p>

              <h4 className="font-medium text-[11px]">2.2 Scope of Extended MIT Rights</h4>
              <p className="text-muted-foreground text-[10px] leading-relaxed">
                While the subscription is active, the licensee may: use Drawtir in commercial applications, SaaS platforms, and internal tools; modify Drawtir source code for private or commercial use; redistribute Drawtir as part of a larger system; sublicense Drawtir as part of a combined commercial product; fork the code for internal development; ship derivative works; embed Drawtir in paid or public-facing software products. These rights continue only during the period of paid subscription.
              </p>

              <h4 className="font-medium text-[11px]">2.3 Termination of Rights</h4>
              <p className="text-muted-foreground text-[10px] leading-relaxed">
                If the licensee fails to maintain an active paid subscription: rights to use Drawtir in production terminate; redistribution rights terminate; sublicensing rights terminate; rights to incorporate Drawtir in a commercial SaaS terminate; rebranding/white-label rights terminate; rights to ship derivative works terminate. The licensee may retain local archival copies, but may no longer deploy, distribute, publish, commercialize, or sublicense Drawtir or any derivative work containing it.
              </p>

              <h4 className="font-medium text-[11px]">2.4 Continued Use Requires Continued Payment</h4>
              <p className="text-muted-foreground text-[10px] leading-relaxed">
                Any continued use of Drawtir after termination requires: reinstating the Drawtir MIT Extended License subscription, or purchasing a new license under terms offered at the time of reinstatement. Unauthorized usage constitutes copyright infringement under U.S. and international law.
              </p>

              <h4 className="font-medium text-[11px]">2.5 Ownership</h4>
              <p className="text-muted-foreground text-[10px] leading-relaxed">
                Rantir, Inc. retains full ownership of Drawtir, the Drawtir SDK, the Drawtir rendering engine, templates, UI/UX patterns, documentation, and all derivative capabilities not explicitly granted by this license. No rights are granted except those explicitly described here.
              </p>

              <h4 className="font-medium text-[11px]">2.6 No Transfer of Subscription</h4>
              <p className="text-muted-foreground text-[10px] leading-relaxed">
                The MIT Extended License subscription is non-transferable unless explicitly approved in writing by Rantir, Inc.
              </p>

              <h4 className="font-medium text-[11px]">2.7 No Reversion to MIT After Termination</h4>
              <p className="text-muted-foreground text-[10px] leading-relaxed">
                Drawtir does not revert to MIT License status upon termination. Termination of the paid subscription terminates all MIT rights to Drawtir.
              </p>

              <h3 className="font-semibold pt-2">3. THIRD-PARTY COMPONENTS</h3>
              <p className="text-muted-foreground text-[10px] leading-relaxed">
                Any third-party libraries included in Drawtir retain their original licenses and are not affected by these Extended MIT terms.
              </p>

              <h3 className="font-semibold pt-2">4. DEFINITIONS</h3>
              <ul className="text-muted-foreground text-[10px] space-y-1 list-disc list-inside">
                <li>"Software" means Drawtir, Drawtir SDK, Drawtir rendering engine, UI components, templates, and documentation.</li>
                <li>"Subscription" means the Drawtir MIT Extended License paid yearly contract.</li>
                <li>"Licensee" means the person or entity purchasing and holding the subscription.</li>
                <li>"Commercial Use" includes SaaS integration, resale, deployment, rebranding, paid access, or customer-facing use.</li>
              </ul>

              <h3 className="font-semibold pt-2">5. NO WARRANTY</h3>
              <p className="text-muted-foreground text-[10px] leading-relaxed">
                Drawtir is provided "as-is" without warranty of any kind.
              </p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      </div>
    </SubscriptionGuard>
  );
}
