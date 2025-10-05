import { useState } from "react";
import HorizontalNav from "@/components/Navigation/HorizontalNav";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Square, Type, Image, Pen, Box, Code, Layers } from "lucide-react";
import PageFooter from "@/components/Footer/PageFooter";

export default function Documentation() {
  const [activeSection, setActiveSection] = useState("getting-started");

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'hsl(var(--page-bg))' }}>
      <HorizontalNav />
      <main className="container mx-auto px-4 py-4">
        <div className="flex gap-4">
          {/* Sidebar */}
          <aside className="w-48 shrink-0">
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="space-y-1">
                <h2 className="text-xs font-semibold mb-2 px-2 text-muted-foreground uppercase tracking-wide">Documentation</h2>
                
                <Button
                  variant={activeSection === "getting-started" ? "secondary" : "ghost"}
                  className="w-full justify-start h-7 text-xs px-2"
                  onClick={() => setActiveSection("getting-started")}
                >
                  <Code className="h-3 w-3 mr-1.5" />
                  Getting Started
                </Button>

                <div className="pt-2">
                  <h3 className="text-[10px] font-semibold mb-1 px-2 text-muted-foreground uppercase tracking-wide">Elements</h3>
                  <Button
                    variant={activeSection === "frames" ? "secondary" : "ghost"}
                    className="w-full justify-start h-7 text-xs px-2"
                    onClick={() => setActiveSection("frames")}
                  >
                    <Box className="h-3 w-3 mr-1.5" />
                    Frames
                  </Button>
                  <Button
                    variant={activeSection === "shapes" ? "secondary" : "ghost"}
                    className="w-full justify-start h-7 text-xs px-2"
                    onClick={() => setActiveSection("shapes")}
                  >
                    <Square className="h-3 w-3 mr-1.5" />
                    Shapes
                  </Button>
                  <Button
                    variant={activeSection === "text" ? "secondary" : "ghost"}
                    className="w-full justify-start h-7 text-xs px-2"
                    onClick={() => setActiveSection("text")}
                  >
                    <Type className="h-3 w-3 mr-1.5" />
                    Text
                  </Button>
                  <Button
                    variant={activeSection === "images" ? "secondary" : "ghost"}
                    className="w-full justify-start h-7 text-xs px-2"
                    onClick={() => setActiveSection("images")}
                  >
                    <Image className="h-3 w-3 mr-1.5" />
                    Images
                  </Button>
                  <Button
                    variant={activeSection === "drawing" ? "secondary" : "ghost"}
                    className="w-full justify-start h-7 text-xs px-2"
                    onClick={() => setActiveSection("drawing")}
                  >
                    <Pen className="h-3 w-3 mr-1.5" />
                    Drawing
                  </Button>
                </div>

                <div className="pt-2">
                  <h3 className="text-[10px] font-semibold mb-1 px-2 text-muted-foreground uppercase tracking-wide">SDK</h3>
                  <Button
                    variant={activeSection === "sdk-overview" ? "secondary" : "ghost"}
                    className="w-full justify-start h-7 text-xs px-2"
                    onClick={() => setActiveSection("sdk-overview")}
                  >
                    <Code className="h-3 w-3 mr-1.5" />
                    SDK Overview
                  </Button>
                  <Button
                    variant={activeSection === "embed-example" ? "secondary" : "ghost"}
                    className="w-full justify-start h-7 text-xs px-2"
                    onClick={() => setActiveSection("embed-example")}
                  >
                    <Layers className="h-3 w-3 mr-1.5" />
                    Embed Example
                  </Button>
                  <Button
                    variant={activeSection === "api-reference" ? "secondary" : "ghost"}
                    className="w-full justify-start h-7 text-xs px-2"
                    onClick={() => setActiveSection("api-reference")}
                  >
                    <Code className="h-3 w-3 mr-1.5" />
                    API Reference
                  </Button>
                </div>

                <div className="pt-2">
                  <h3 className="text-[10px] font-semibold mb-1 px-2 text-muted-foreground uppercase tracking-wide">Properties</h3>
                  <Button
                    variant={activeSection === "properties" ? "secondary" : "ghost"}
                    className="w-full justify-start h-7 text-xs px-2"
                    onClick={() => setActiveSection("properties")}
                  >
                    <Layers className="h-3 w-3 mr-1.5" />
                    Properties Panel
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="rounded-xl p-6" style={{ backgroundColor: 'hsl(var(--page-container))' }}>
                {activeSection === "getting-started" && (
                  <div className="prose prose-sm max-w-none">
                    <h1 className="text-2xl font-bold mb-4">Getting Started</h1>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drawtir is a powerful canvas-based design tool that allows you to create frames, shapes, text, images, and drawings.
                    </p>

                    <h2 className="text-lg font-semibold mt-6 mb-3">Installation</h2>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                      <code>{`npm install @drawtir/sdk`}</code>
                    </pre>

                    <h2 className="text-lg font-semibold mt-6 mb-3">Quick Start</h2>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                      <code>{`import { DrawtirEmbed } from '@drawtir/sdk';

function App() {
  return (
    <DrawtirEmbed 
      className="w-full h-screen"
    />
  );
}`}</code>
                    </pre>
                  </div>
                )}

                {activeSection === "frames" && (
                  <div className="prose prose-sm max-w-none">
                    <h1 className="text-2xl font-bold mb-4">Frames</h1>
                    <p className="text-sm text-muted-foreground mb-4">
                      Frames are containers that can hold other elements. They support auto-layout with flexbox properties.
                    </p>

                    <h2 className="text-lg font-semibold mt-6 mb-3">Auto Layout</h2>
                    <p className="text-sm text-muted-foreground mb-3">
                      Frames support auto-layout which allows you to arrange child elements horizontally or vertically with gap spacing.
                    </p>
                    <ul className="text-sm space-y-2 list-disc list-inside">
                      <li><strong>Direction:</strong> Choose horizontal (row) or vertical (column) layout</li>
                      <li><strong>Alignment:</strong> Control how items are aligned and distributed</li>
                      <li><strong>Gap:</strong> Set spacing between child elements (0-100px)</li>
                    </ul>

                    <h2 className="text-lg font-semibold mt-6 mb-3">Properties</h2>
                    <ul className="text-sm space-y-2 list-disc list-inside">
                      <li><strong>Background Color:</strong> Set the frame's background color</li>
                      <li><strong>Corner Radius:</strong> Round the frame corners</li>
                      <li><strong>Opacity:</strong> Control transparency (0-100%)</li>
                      <li><strong>Blend Mode:</strong> Set how the frame blends with elements behind it</li>
                    </ul>
                  </div>
                )}

                {activeSection === "shapes" && (
                  <div className="prose prose-sm max-w-none">
                    <h1 className="text-2xl font-bold mb-4">Shapes</h1>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add various geometric shapes to your canvas including rectangles, circles, lines, arrows, polygons, and stars.
                    </p>

                    <h2 className="text-lg font-semibold mt-6 mb-3">Shape Types</h2>
                    <ul className="text-sm space-y-2 list-disc list-inside mb-4">
                      <li><strong>Rectangle:</strong> Basic rectangular shape with optional rounded corners</li>
                      <li><strong>Ellipse:</strong> Circular or oval shape</li>
                      <li><strong>Line:</strong> Straight line with customizable stroke</li>
                      <li><strong>Arrow:</strong> Line with arrowhead</li>
                      <li><strong>Polygon:</strong> Multi-sided shape</li>
                      <li><strong>Star:</strong> Star shape with customizable points</li>
                    </ul>

                    <h2 className="text-lg font-semibold mt-6 mb-3">Properties</h2>
                    <ul className="text-sm space-y-2 list-disc list-inside">
                      <li><strong>Fill:</strong> Set the shape's fill color</li>
                      <li><strong>Stroke:</strong> Set border color and width</li>
                      <li><strong>Corner Radius:</strong> Round corners (for rectangles)</li>
                      <li><strong>Rotation:</strong> Rotate the shape by degrees</li>
                    </ul>
                  </div>
                )}

                {activeSection === "text" && (
                  <div className="prose prose-sm max-w-none">
                    <h1 className="text-2xl font-bold mb-4">Text</h1>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add and style text elements with extensive typography controls.
                    </p>

                    <h2 className="text-lg font-semibold mt-6 mb-3">Typography Properties</h2>
                    <ul className="text-sm space-y-2 list-disc list-inside">
                      <li><strong>Font Family:</strong> Choose from 35+ Google Fonts</li>
                      <li><strong>Font Size:</strong> Adjust text size (8-200px)</li>
                      <li><strong>Font Weight:</strong> Set text weight (100-900)</li>
                      <li><strong>Text Align:</strong> Left, center, or right alignment</li>
                      <li><strong>Color:</strong> Set text color</li>
                    </ul>
                  </div>
                )}

                {activeSection === "images" && (
                  <div className="prose prose-sm max-w-none">
                    <h1 className="text-2xl font-bold mb-4">Images</h1>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add and manipulate images with various fit modes and adjustments.
                    </p>

                    <h2 className="text-lg font-semibold mt-6 mb-3">Image Fit Modes</h2>
                    <ul className="text-sm space-y-2 list-disc list-inside mb-4">
                      <li><strong>Fill:</strong> Stretch image to fill the entire area</li>
                      <li><strong>Contain:</strong> Fit entire image within bounds</li>
                      <li><strong>Cover:</strong> Cover entire area while maintaining aspect ratio</li>
                      <li><strong>Crop:</strong> Crop image to fit</li>
                    </ul>

                    <h2 className="text-lg font-semibold mt-6 mb-3">Image Adjustments</h2>
                    <ul className="text-sm space-y-2 list-disc list-inside">
                      <li><strong>Brightness:</strong> Adjust image brightness (-100 to +100)</li>
                      <li><strong>Contrast:</strong> Adjust image contrast (-100 to +100)</li>
                      <li><strong>Saturation:</strong> Adjust color saturation (-100 to +100)</li>
                      <li><strong>Blur:</strong> Apply blur effect (0-20px)</li>
                    </ul>
                  </div>
                )}

                {activeSection === "drawing" && (
                  <div className="prose prose-sm max-w-none">
                    <h1 className="text-2xl font-bold mb-4">Drawing</h1>
                    <p className="text-sm text-muted-foreground mb-4">
                      Use the pen tool to create freehand drawings and custom paths.
                    </p>

                    <h2 className="text-lg font-semibold mt-6 mb-3">Drawing Tools</h2>
                    <ul className="text-sm space-y-2 list-disc list-inside">
                      <li><strong>Pen Tool:</strong> Create freehand paths with mouse or touch</li>
                      <li><strong>Stroke Color:</strong> Set the drawing color</li>
                      <li><strong>Stroke Width:</strong> Control line thickness (1-20px)</li>
                    </ul>
                  </div>
                )}

                {activeSection === "sdk-overview" && (
                  <div className="prose prose-sm max-w-none">
                    <h1 className="text-2xl font-bold mb-4">SDK Overview</h1>
                    <p className="text-sm text-muted-foreground mb-4">
                      The Drawtir SDK allows you to embed the canvas editor in your application and control it programmatically.
                    </p>

                    <h2 className="text-lg font-semibold mt-6 mb-3">React Component</h2>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
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

                    <h2 className="text-lg font-semibold mt-6 mb-3">Vanilla JavaScript</h2>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
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
                )}

                {activeSection === "embed-example" && (
                  <div className="prose prose-sm max-w-none">
                    <h1 className="text-2xl font-bold mb-4">Embed Example</h1>
                    <p className="text-sm text-muted-foreground mb-4">
                      Learn how to embed the Drawtir canvas anywhere in your application, just like tldraw.
                    </p>

                    <h2 className="text-lg font-semibold mt-6 mb-3">Basic Embed</h2>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto mb-4">
                      <code>{`<!DOCTYPE html>
<html>
<head>
  <title>Drawtir Embedded Editor</title>
  <style>
    #editor-container {
      width: 100vw;
      height: 100vh;
    }
  </style>
</head>
<body>
  <div id="editor-container"></div>
  
  <script type="module">
    import DrawtirSDK from '@drawtir/sdk';
    
    const editor = new DrawtirSDK({
      container: '#editor-container',
      autoSave: true,
      onSave: (snapshot) => {
        // Save to your backend
        localStorage.setItem('canvas', JSON.stringify(snapshot));
      }
    });
  </script>
</body>
</html>`}</code>
                    </pre>

                    <h2 className="text-lg font-semibold mt-6 mb-3">With Controls</h2>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                      <code>{`<div class="container">
  <div class="toolbar">
    <button onclick="editor.clear()">Clear</button>
    <button onclick="handleExport()">Export PNG</button>
  </div>
  <div id="editor-container"></div>
</div>

<script type="module">
  import DrawtirSDK from '@drawtir/sdk';
  
  const editor = new DrawtirSDK({
    container: '#editor-container'
  });
  
  window.handleExport = async () => {
    const blob = await editor.exportPNG();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canvas.png';
    a.click();
  };
</script>`}</code>
                    </pre>
                  </div>
                )}

                {activeSection === "api-reference" && (
                  <div className="prose prose-sm max-w-none">
                    <h1 className="text-2xl font-bold mb-4">API Reference</h1>
                    
                    <h2 className="text-lg font-semibold mt-6 mb-3">DrawtirEmbed Props</h2>
                    <div className="bg-muted p-4 rounded-lg text-xs space-y-3 mb-6">
                      <div>
                        <code className="font-semibold">snapshot?: CanvasSnapshot</code>
                        <p className="text-muted-foreground mt-1">Initial canvas state to load</p>
                      </div>
                      <div>
                        <code className="font-semibold">onSave?: (snapshot: CanvasSnapshot) =&gt; void</code>
                        <p className="text-muted-foreground mt-1">Called when user saves the canvas</p>
                      </div>
                      <div>
                        <code className="font-semibold">onChange?: (snapshot: CanvasSnapshot) =&gt; void</code>
                        <p className="text-muted-foreground mt-1">Called when canvas changes</p>
                      </div>
                      <div>
                        <code className="font-semibold">readOnly?: boolean</code>
                        <p className="text-muted-foreground mt-1">Disable editing (default: false)</p>
                      </div>
                      <div>
                        <code className="font-semibold">hideCloudFeatures?: boolean</code>
                        <p className="text-muted-foreground mt-1">Hide cloud-specific features (default: true)</p>
                      </div>
                    </div>

                    <h2 className="text-lg font-semibold mt-6 mb-3">Ref Methods</h2>
                    <div className="bg-muted p-4 rounded-lg text-xs space-y-3">
                      <div>
                        <code className="font-semibold">getSnapshot(): CanvasSnapshot</code>
                        <p className="text-muted-foreground mt-1">Get current canvas state</p>
                      </div>
                      <div>
                        <code className="font-semibold">loadSnapshot(snapshot: CanvasSnapshot): void</code>
                        <p className="text-muted-foreground mt-1">Load a canvas state</p>
                      </div>
                      <div>
                        <code className="font-semibold">exportPNG(): Promise&lt;Blob&gt;</code>
                        <p className="text-muted-foreground mt-1">Export canvas as PNG image</p>
                      </div>
                      <div>
                        <code className="font-semibold">clear(): void</code>
                        <p className="text-muted-foreground mt-1">Clear the entire canvas</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "properties" && (
                  <div className="prose prose-sm max-w-none">
                    <h1 className="text-2xl font-bold mb-4">Properties Panel</h1>
                    <p className="text-sm text-muted-foreground mb-4">
                      The properties panel allows you to adjust element-specific settings based on the selected element type.
                    </p>

                    <h2 className="text-lg font-semibold mt-6 mb-3">Common Properties</h2>
                    <ul className="text-sm space-y-2 list-disc list-inside mb-4">
                      <li><strong>Position (X, Y):</strong> Element position on canvas</li>
                      <li><strong>Size (W, H):</strong> Element dimensions</li>
                      <li><strong>Rotation:</strong> Rotate element in degrees</li>
                      <li><strong>Opacity:</strong> Control transparency (0-100%)</li>
                      <li><strong>Corner Radius:</strong> Round corners (0-50px)</li>
                      <li><strong>Blend Mode:</strong> Control how element blends with others</li>
                    </ul>

                    <h2 className="text-lg font-semibold mt-6 mb-3">Frame-Specific</h2>
                    <ul className="text-sm space-y-2 list-disc list-inside mb-4">
                      <li><strong>Auto Layout:</strong> Enable flexbox-based layout</li>
                      <li><strong>Direction:</strong> Horizontal or vertical flow</li>
                      <li><strong>Align Content:</strong> Control alignment and distribution</li>
                      <li><strong>Gap:</strong> Spacing between child elements</li>
                    </ul>

                    <h2 className="text-lg font-semibold mt-6 mb-3">Shape-Specific</h2>
                    <ul className="text-sm space-y-2 list-disc list-inside">
                      <li><strong>Fill Color:</strong> Interior color of shape</li>
                      <li><strong>Stroke Color:</strong> Border color</li>
                      <li><strong>Stroke Width:</strong> Border thickness (0-20px)</li>
                    </ul>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </main>
      <PageFooter />
    </div>
  );
}
