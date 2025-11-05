import { useRef, useState } from "react";
import { DrawtirEmbed } from "@/sdk/DrawtirEmbed";
import type { DrawtirEmbedRef } from "@/sdk/DrawtirEmbed";
import type { CanvasSnapshot } from "@/types/snapshot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Download, Save, Trash2, FileJson, Code, Rocket } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Rocket className="w-6 h-6 text-primary" />
                Drawtir SDK Demo
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Embed the full canvas editor in your applications
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleLoadSample} variant="outline" size="sm">
                Load Sample
              </Button>
              <Button onClick={handleExportJSON} variant="outline" size="sm">
                <FileJson className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button onClick={handleExportPNG} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PNG
              </Button>
              <Button onClick={handleClear} variant="outline" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Canvas Embed */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Live Canvas Editor</CardTitle>
                <CardDescription>
                  This is the actual DrawtirEmbed component running live
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-t" style={{ height: '700px' }}>
                  <DrawtirEmbed
                    ref={drawtirRef}
                    snapshot={savedSnapshot}
                    onSave={handleSave}
                    onChange={(snapshot) => setSavedSnapshot(snapshot)}
                    hideCloudFeatures={true}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info & Code */}
          <div className="space-y-6">
            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-medium">Full Editor Embedded</p>
                    <p className="text-muted-foreground">Complete canvas with all tools</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-medium">Export PNG/JSON</p>
                    <p className="text-muted-foreground">Download designs in multiple formats</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-medium">Custom Storage</p>
                    <p className="text-muted-foreground">Save to your own backend</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-medium">TypeScript Support</p>
                    <p className="text-muted-foreground">Full type definitions included</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Code Examples */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Code Examples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={showCode} onValueChange={(v) => setShowCode(v as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="react">React</TabsTrigger>
                    <TabsTrigger value="vanilla">Vanilla JS</TabsTrigger>
                  </TabsList>
                  <TabsContent value="react" className="mt-4">
                    <pre className="text-xs bg-secondary/50 p-4 rounded-lg overflow-x-auto">
                      <code>{reactCode}</code>
                    </pre>
                  </TabsContent>
                  <TabsContent value="vanilla" className="mt-4">
                    <pre className="text-xs bg-secondary/50 p-4 rounded-lg overflow-x-auto">
                      <code>{vanillaCode}</code>
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Installation */}
            <Card>
              <CardHeader>
                <CardTitle>Installation</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-secondary/50 p-4 rounded-lg">
                  <code>npm install drawtir-sdk</code>
                </pre>
                <p className="text-xs text-muted-foreground mt-3">
                  Or import directly from this app's bundle
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
