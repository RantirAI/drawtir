# Drawtir SDK Documentation

The Drawtir SDK allows you to embed the canvas editor in your own applications and manage snapshots programmatically.

## Installation

```bash
npm install drawtir-sdk
```

## Quick Start

### React Integration

```tsx
import { DrawtirEmbed } from 'drawtir-sdk';
import { useRef } from 'react';

function App() {
  const drawtirRef = useRef(null);

  const handleSave = (snapshot) => {
    // Save snapshot to your backend
    localStorage.setItem('canvas', JSON.stringify(snapshot));
    console.log('Saved:', snapshot);
  };

  const handleChange = (snapshot) => {
    console.log('Canvas changed:', snapshot);
  };

  return (
    <DrawtirEmbed
      ref={drawtirRef}
      onSave={handleSave}
      onChange={handleChange}
      hideCloudFeatures={true}
    />
  );
}
```

### Vanilla JavaScript

```html
<div id="drawtir-canvas"></div>

<script type="module">
  import { DrawtirSDK } from 'drawtir-sdk';

  const drawtir = new DrawtirSDK({
    container: '#drawtir-canvas',
    onSave: (snapshot) => {
      localStorage.setItem('canvas', JSON.stringify(snapshot));
    },
    onChange: (snapshot) => {
      console.log('Canvas changed');
    },
    autoSave: true,
    autoSaveDelay: 2000
  });

  // Load existing snapshot
  const saved = localStorage.getItem('canvas');
  if (saved) {
    drawtir.loadSnapshot(JSON.parse(saved));
  }
</script>
```

## API Reference

### DrawtirEmbed (React Component)

#### Props

- `snapshot?: CanvasSnapshot` - Initial snapshot to load
- `onSave?: (snapshot: CanvasSnapshot) => void | Promise<void>` - Called when user saves
- `onChange?: (snapshot: CanvasSnapshot) => void` - Called on any canvas change
- `readOnly?: boolean` - Disable editing (default: false)
- `hideCloudFeatures?: boolean` - Hide cloud-specific features (default: true)
- `className?: string` - CSS class for the container

#### Ref Methods

```tsx
const ref = useRef<DrawtirEmbedRef>(null);

// Get current snapshot
const snapshot = ref.current?.getSnapshot();

// Load snapshot
ref.current?.loadSnapshot(snapshot);

// Export as PNG
const blob = await ref.current?.exportPNG();

// Clear canvas
ref.current?.clear();
```

### DrawtirSDK (Vanilla JS)

#### Constructor Options

```typescript
interface DrawtirSDKOptions {
  container: string | HTMLElement;  // CSS selector or DOM element
  snapshot?: CanvasSnapshot;        // Initial snapshot
  onSave?: (snapshot: CanvasSnapshot) => void | Promise<void>;
  onChange?: (snapshot: CanvasSnapshot) => void;
  readOnly?: boolean;               // Default: false
  autoSave?: boolean;               // Default: false
  autoSaveDelay?: number;           // Default: 2000ms
}
```

#### Methods

```typescript
// Get current state
const snapshot = drawtir.getSnapshot();

// Load state
drawtir.loadSnapshot(snapshot);

// Export as PNG
const pngBlob = await drawtir.exportPNG();

// Export as SVG
const svgString = await drawtir.exportSVG();

// Clear canvas
drawtir.clear();

// Clean up
drawtir.destroy();

// Event listeners
drawtir.on('change', (snapshot) => {});
drawtir.on('save', (snapshot) => {});
drawtir.off('change', callback);
```

## Snapshot Format

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

## Examples

### Save to Local Storage

```tsx
function App() {
  const [snapshot, setSnapshot] = useState(() => {
    const saved = localStorage.getItem('canvas');
    return saved ? JSON.parse(saved) : null;
  });

  const handleSave = (newSnapshot) => {
    localStorage.setItem('canvas', JSON.stringify(newSnapshot));
    setSnapshot(newSnapshot);
  };

  return (
    <DrawtirEmbed
      snapshot={snapshot}
      onSave={handleSave}
    />
  );
}
```

### Save to Backend

```tsx
function App() {
  const handleSave = async (snapshot) => {
    await fetch('/api/canvas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot)
    });
  };

  return <DrawtirEmbed onSave={handleSave} />;
}
```

### Real-time Collaboration

```tsx
function App() {
  const handleChange = (snapshot) => {
    // Send to WebSocket
    ws.send(JSON.stringify({
      type: 'canvas-update',
      snapshot
    }));
  };

  return <DrawtirEmbed onChange={handleChange} />;
}
```

## Differences: Embedded vs Cloud

| Feature | Embedded Mode | Cloud Mode |
|---------|--------------|------------|
| Authentication | Not required | Required |
| Storage | Developer manages | Automatic cloud storage |
| Save Button | Triggers `onSave` callback | Saves to cloud |
| Gallery | Hidden | Available |
| Auto-save | Via `autoSave` option | Automatic |
| Collaboration | DIY with `onChange` | Built-in (future) |

## TypeScript Support

Full TypeScript definitions are included:

```tsx
import type {
  CanvasSnapshot,
  DrawtirSDKOptions,
  DrawtirSDKInstance,
  DrawtirEmbedProps,
  DrawtirEmbedRef
} from 'drawtir-sdk';
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

See LICENSE file for details.
