# Drawtir SDK

Embed the powerful Drawtir canvas editor directly into your applications. Create, edit, and export poster designs programmatically with a simple, developer-friendly API.

## 🚀 Features

- ✨ **Full-Featured Editor** - Complete canvas with drawing tools, shapes, text, images, and more
- 📦 **Easy Integration** - Works with React and Vanilla JavaScript
- 💾 **Custom Storage** - Save designs to your own backend
- 🎨 **Export Capabilities** - PNG, JSON snapshot exports
- 🔧 **Programmatic Control** - Full API for canvas manipulation
- 📱 **Responsive** - Works on desktop and mobile
- 🎯 **TypeScript Support** - Full type definitions included

## 📦 Installation

```bash
npm install drawtir-sdk
```

## 🎯 Quick Start

### React

```tsx
import { DrawtirEmbed } from 'drawtir-sdk';
import { useRef } from 'react';

function App() {
  const drawtirRef = useRef(null);

  const handleSave = (snapshot) => {
    // Save to your backend
    localStorage.setItem('canvas', JSON.stringify(snapshot));
  };

  const handleExportPNG = async () => {
    const blob = await drawtirRef.current?.exportPNG();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'poster.png';
    a.click();
  };

  return (
    <div>
      <button onClick={handleExportPNG}>Export PNG</button>
      <div style={{ width: '100%', height: '600px' }}>
        <DrawtirEmbed
          ref={drawtirRef}
          onSave={handleSave}
          onChange={(snapshot) => console.log('Canvas changed')}
        />
      </div>
    </div>
  );
}
```

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>Drawtir SDK Demo</title>
</head>
<body>
  <div id="canvas-container" style="width: 100%; height: 600px;"></div>
  <button onclick="handleExport()">Export PNG</button>

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

    window.handleExport = async () => {
      const blob = await drawtir.exportPNG();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'poster.png';
      a.click();
    };
  </script>
</body>
</html>
```

## 📖 API Reference

### DrawtirEmbed (React Component)

#### Props

```typescript
interface DrawtirEmbedProps {
  snapshot?: CanvasSnapshot;           // Initial canvas state
  onSave?: (snapshot: CanvasSnapshot) => void | Promise<void>;
  onChange?: (snapshot: CanvasSnapshot) => void;
  readOnly?: boolean;                  // Disable editing
  hideCloudFeatures?: boolean;         // Hide cloud-specific features
  className?: string;
}
```

#### Ref Methods

```typescript
interface DrawtirEmbedRef {
  getSnapshot: () => CanvasSnapshot;
  loadSnapshot: (snapshot: CanvasSnapshot) => void;
  exportPNG: (frameId?: string) => Promise<Blob>;
  exportSVG: (frameId?: string) => Promise<string>;
  addFrame: (config?: { width: number; height: number; name?: string }) => void;
  clear: () => void;
}
```

### DrawtirSDK (Vanilla JS)

#### Constructor Options

```typescript
interface DrawtirSDKOptions {
  container: string | HTMLElement;
  snapshot?: CanvasSnapshot;
  onSave?: (snapshot: CanvasSnapshot) => void | Promise<void>;
  onChange?: (snapshot: CanvasSnapshot) => void;
  readOnly?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}
```

#### Methods

```typescript
const drawtir = new DrawtirSDK(options);

// Get current canvas state
const snapshot = drawtir.getSnapshot();

// Load canvas state
drawtir.loadSnapshot(snapshot);

// Export as PNG
const pngBlob = await drawtir.exportPNG();

// Export as SVG
const svgString = await drawtir.exportSVG();

// Export as JSON
const json = await drawtir.exportJSON();

// Add a new frame
drawtir.addFrame({ width: 800, height: 1200, name: 'My Frame' });

// Clear canvas
drawtir.clear();

// Event listeners
drawtir.on('change', (snapshot) => {});
drawtir.on('save', (snapshot) => {});
drawtir.off('change', callback);

// Cleanup
drawtir.destroy();
```

## 💾 Snapshot Format

```typescript
interface CanvasSnapshot {
  version: string;
  metadata: {
    title: string;
    createdAt: string;
    updatedAt: string;
  };
  canvas: {
    backgroundColor: string;
    zoom: number;
    panOffset: { x: number; y: number };
  };
  frames: Frame[];
}
```

## 🎨 Examples

### Save to Backend

```typescript
const handleSave = async (snapshot) => {
  await fetch('/api/designs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot)
  });
};
```

### Auto-save to LocalStorage

```typescript
const [snapshot, setSnapshot] = useState(() => {
  const saved = localStorage.getItem('canvas');
  return saved ? JSON.parse(saved) : null;
});

const handleChange = (newSnapshot) => {
  localStorage.setItem('canvas', JSON.stringify(newSnapshot));
  setSnapshot(newSnapshot);
};
```

### Real-time Collaboration

```typescript
const handleChange = (snapshot) => {
  // Send to WebSocket
  ws.send(JSON.stringify({
    type: 'canvas-update',
    snapshot
  }));
};
```

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📞 Support

For issues and questions, please visit: https://github.com/yourusername/drawtir-sdk/issues
