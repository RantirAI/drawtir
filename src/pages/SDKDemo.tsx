import { useRef, useState } from "react";
import { DrawtirEmbed } from "@/sdk/DrawtirEmbed";
import type { DrawtirEmbedRef } from "@/sdk/DrawtirEmbed";
import type { CanvasSnapshot } from "@/types/snapshot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Download, Trash2, FileJson, Code, FolderOpen } from "lucide-react";
import HorizontalNav from "@/components/Navigation/HorizontalNav";
import PageFooter from "@/components/Footer/PageFooter";

// Default initial snapshot with a welcome frame
const getInitialSnapshot = (): CanvasSnapshot => {
  // Try to load from localStorage first
  const saved = localStorage.getItem('sdk-demo-canvas');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved snapshot', e);
    }
  }
  
  // Return default welcome frame
  return {
    version: "1.0.0",
    metadata: {
      title: "SDK Demo Canvas",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    canvas: {
      backgroundColor: "#f8f9fa",
      zoom: 1,
      panOffset: { x: 0, y: 0 }
    },
    frames: [
      {
        id: 'welcome-frame',
        name: 'Welcome Frame',
        x: 100,
        y: 100,
        width: 800,
        height: 1200,
        rotation: 0,
        backgroundColor: '#ffffff',
        elements: [
          {
            id: 'welcome-text',
            type: 'text',
            x: 50,
            y: 500,
            width: 700,
            height: 200,
            rotation: 0,
            text: '🎨 Start Creating!\n\nClick "Load Sample" or use the toolbar to add elements',
            fontSize: 48,
            fontFamily: 'Inter',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#1a1a1a'
          }
        ]
      }
    ]
  };
};

export default function SDKDemo() {
  const drawtirRef = useRef<DrawtirEmbedRef>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<CanvasSnapshot>(getInitialSnapshot());
  const [showCode, setShowCode] = useState<'react' | 'vanilla'>('react');

  const handleSave = (snapshot: CanvasSnapshot) => {
    setSavedSnapshot(snapshot);
    localStorage.setItem('sdk-demo-canvas', JSON.stringify(snapshot));
    toast.success("Canvas saved!");
  };

  const handleExportPNG = async () => {
    try {
      const blob = await drawtirRef.current?.exportPNG();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `poster-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Exported as PNG!");
      }
    } catch (error) {
      toast.error("Failed to export PNG");
    }
  };

  const handleExportJSON = () => {
    const snapshot = drawtirRef.current?.getSnapshot();
    if (snapshot) {
      const dataStr = JSON.stringify(snapshot, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = `canvas-${Date.now()}.json`;
      a.click();
      toast.success("Exported as JSON!");
    }
  };

  const handleClear = () => {
    const welcomeSnapshot = getInitialSnapshot();
    drawtirRef.current?.loadSnapshot(welcomeSnapshot);
    setSavedSnapshot(welcomeSnapshot);
    localStorage.removeItem('sdk-demo-canvas');
    toast.success("Canvas reset to welcome screen!");
  };

  const handleLoadSample = () => {
    const sampleSnapshot: CanvasSnapshot = {
      version: "1.0.0",
      metadata: {
        title: "SDK Demo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      canvas: {
        backgroundColor: "#f8f9fa",
        zoom: 1,
        panOffset: { x: 0, y: 0 }
      },
      frames: [
        {
          id: 'demo-frame',
          name: 'Demo Poster',
          x: 100,
          y: 100,
          width: 800,
          height: 1200,
          rotation: 0,
          backgroundColor: '#2563eb',
          backgroundType: 'gradient',
          gradientType: 'linear',
          gradientAngle: 135,
          gradientStops: [
            { color: '#2563eb', position: 0 },
            { color: '#7c3aed', position: 100 }
          ],
          elements: [
            {
              id: 'title',
              type: 'text',
              x: 80,
              y: 400,
              width: 640,
              height: 200,
              rotation: 0,
              text: 'Drawtir SDK',
              fontSize: 96,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#ffffff'
            },
            {
              id: 'subtitle',
              type: 'text',
              x: 80,
              y: 620,
              width: 640,
              height: 80,
              rotation: 0,
              text: 'Embed powerful poster design in your app',
              fontSize: 28,
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center',
              color: '#e0e7ff'
            }
          ]
        }
      ]
    };
    
    drawtirRef.current?.loadSnapshot(sampleSnapshot);
    toast.success("Sample poster loaded!");
  };

  const reactCode = `import { DrawtirEmbed } from 'drawtir-sdk';
import { useRef } from 'react';

function App() {
  const drawtirRef = useRef(null);

  const handleSave = (snapshot) => {
    // Save to your backend or localStorage
    localStorage.setItem('canvas', JSON.stringify(snapshot));
    console.log('Saved:', snapshot);
  };

  const handleExport = async () => {
    const blob = await drawtirRef.current?.exportPNG();
    // Download the blob
  };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <DrawtirEmbed
        ref={drawtirRef}
        onSave={handleSave}
        onChange={(snapshot) => console.log('Changed')}
      />
      <button onClick={handleExport}>Export PNG</button>
    </div>
  );
}`;

  const vanillaCode = `<div id="canvas-container" style="width: 100%; height: 600px;"></div>

<script type="module">
  import { DrawtirSDK } from 'drawtir-sdk';

  const drawtir = new DrawtirSDK({
    container: '#canvas-container',
    onSave: (snapshot) => {
      localStorage.setItem('canvas', JSON.stringify(snapshot));
    },
    onChange: (snapshot) => {
      console.log('Canvas changed');
    }
  });

  // Load saved data
  const saved = localStorage.getItem('canvas');
  if (saved) {
    drawtir.loadSnapshot(JSON.parse(saved));
  }

  // Export PNG
  document.getElementById('export-btn').onclick = async () => {
    const blob = await drawtir.exportPNG();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'poster.png';
    a.click();
  };
</script>`;

  return (
    <div className="min-h-screen flex flex-col sdk-demo-page" style={{ backgroundColor: 'hsl(var(--page-bg))' }}>
      <HorizontalNav />
      
      <div className="flex gap-4 px-4 py-4 flex-1 overflow-hidden">
        {/* Canvas Embed - Takes most of the space */}
        <div className="flex-1 min-w-0">
          <Card className="h-full flex flex-col border-border/10">
            <CardContent className="flex-1 p-0 min-h-0">
              <DrawtirEmbed
                ref={drawtirRef}
                onSave={handleSave}
                onChange={(snapshot) => setSavedSnapshot(snapshot)}
                hideCloudFeatures={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Info & Code - Fixed width sidebar on the right */}
        <div className="w-[380px] flex-shrink-0 overflow-y-auto space-y-4">
          {/* Action Buttons */}
          <Card className="border-border/10">
            <CardContent className="p-4 space-y-2">
              <Button onClick={handleLoadSample} variant="outline" size="sm" className="w-full justify-start">
                <FolderOpen className="w-4 h-4 mr-2" />
                Load Sample
              </Button>
              <Button onClick={handleExportJSON} variant="outline" size="sm" className="w-full justify-start">
                <FileJson className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button onClick={handleExportPNG} variant="outline" size="sm" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export PNG
              </Button>
              <Button onClick={handleClear} variant="outline" size="sm" className="w-full justify-start">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Canvas
              </Button>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="border-border/10">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Features</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Full Editor Embedded</p>
                    <p className="text-muted-foreground">Complete canvas with all tools</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Export PNG/JSON</p>
                    <p className="text-muted-foreground">Download designs in multiple formats</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Custom Storage</p>
                    <p className="text-muted-foreground">Save to your own backend</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">TypeScript Support</p>
                    <p className="text-muted-foreground">Full type definitions included</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Code Examples */}
          <Card className="border-border/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="w-4 h-4" />
                <h3 className="text-sm font-semibold">Code Examples</h3>
              </div>
              <Tabs value={showCode} onValueChange={(v) => setShowCode(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="react">React</TabsTrigger>
                  <TabsTrigger value="vanilla">Vanilla JS</TabsTrigger>
                </TabsList>
                <TabsContent value="react" className="mt-4">
                  <pre className="text-[10px] bg-secondary/50 p-3 rounded-lg overflow-x-auto max-h-[300px]">
                    <code>{reactCode}</code>
                  </pre>
                </TabsContent>
                <TabsContent value="vanilla" className="mt-4">
                  <pre className="text-[10px] bg-secondary/50 p-3 rounded-lg overflow-x-auto max-h-[300px]">
                    <code>{vanillaCode}</code>
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Installation */}
          <Card className="border-border/10">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Installation</h3>
              <pre className="text-xs bg-secondary/50 p-3 rounded-lg">
                <code>npm install drawtir-sdk</code>
              </pre>
              <p className="text-xs text-muted-foreground mt-3">
                Or import directly from this app's bundle
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <PageFooter />
    </div>
  );
}
