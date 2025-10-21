import type { CanvasSnapshot } from '@/types/snapshot';

export const starterTemplates: Array<{
  id: string;
  name: string;
  category: string;
  description: string;
  snapshot: CanvasSnapshot;
}> = [
  {
    id: 'minimal-poster',
    name: 'Minimal Poster',
    category: 'starter',
    description: 'Clean and simple poster template',
    snapshot: {
      version: '1.0.0',
      metadata: {
        title: 'Minimal Poster',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      canvas: {
        backgroundColor: '#ffffff',
        zoom: 1,
        panOffset: { x: 0, y: 0 }
      },
      frames: [
        {
          id: 'starter-frame-1',
          name: 'Minimal Poster Frame',
          x: 100,
          y: 100,
          width: 800,
          height: 1200,
          rotation: 0,
          backgroundColor: '#ffffff',
          elements: [
            {
              id: 'text-1',
              type: 'text',
              x: 50,
              y: 50,
              width: 700,
              height: 150,
              rotation: 0,
              text: 'Your Title Here',
              fontSize: 72,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#000000'
            },
            {
              id: 'text-2',
              type: 'text',
              x: 50,
              y: 250,
              width: 700,
              height: 80,
              rotation: 0,
              text: 'Subtitle or description',
              fontSize: 32,
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center',
              color: '#666666'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'bold-announcement',
    name: 'Bold Announcement',
    category: 'starter',
    description: 'Eye-catching announcement template',
    snapshot: {
      version: '1.0.0',
      metadata: {
        title: 'Bold Announcement',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      canvas: {
        backgroundColor: '#1a1a1a',
        zoom: 1,
        panOffset: { x: 0, y: 0 }
      },
      frames: [
        {
          id: 'starter-frame-2',
          name: 'Bold Announcement Frame',
          x: 100,
          y: 100,
          width: 1080,
          height: 1080,
          rotation: 0,
          backgroundColor: '#2563eb',
          elements: [
            {
              id: 'text-3',
              type: 'text',
              x: 80,
              y: 400,
              width: 920,
              height: 280,
              rotation: 0,
              text: 'BIG NEWS',
              fontSize: 120,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#ffffff'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'modern-gradient',
    name: 'Modern Gradient',
    category: 'starter',
    description: 'Stylish gradient background template',
    snapshot: {
      version: '1.0.0',
      metadata: {
        title: 'Modern Gradient',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      canvas: {
        backgroundColor: '#0f0f0f',
        zoom: 1,
        panOffset: { x: 0, y: 0 }
      },
      frames: [
        {
          id: 'starter-frame-3',
          name: 'Modern Gradient Frame',
          x: 100,
          y: 100,
          width: 1200,
          height: 630,
          rotation: 0,
          backgroundColor: '#667eea',
          backgroundType: 'gradient',
          gradientType: 'linear',
          gradientAngle: 135,
          gradientStops: [
            { color: '#667eea', position: 0 },
            { color: '#764ba2', position: 100 }
          ],
          elements: [
            {
              id: 'text-4',
              type: 'text',
              x: 100,
              y: 250,
              width: 1000,
              height: 130,
              rotation: 0,
              text: 'Modern Design',
              fontSize: 96,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#ffffff'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'vibrant-event',
    name: 'Vibrant Event',
    category: 'event',
    description: 'Colorful event poster',
    snapshot: {
      version: '1.0.0',
      metadata: {
        title: 'Vibrant Event',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      canvas: {
        backgroundColor: '#000000',
        zoom: 1,
        panOffset: { x: 0, y: 0 }
      },
      frames: [
        {
          id: 'starter-frame-4',
          name: 'Vibrant Event Frame',
          x: 100,
          y: 100,
          width: 1080,
          height: 1350,
          rotation: 0,
          backgroundColor: '#ff006e',
          backgroundType: 'gradient',
          gradientType: 'linear',
          gradientAngle: 45,
          gradientStops: [
            { color: '#ff006e', position: 0 },
            { color: '#fb5607', position: 50 },
            { color: '#ffbe0b', position: 100 }
          ],
          elements: [
            {
              id: 'text-event-1',
              type: 'text',
              x: 80,
              y: 150,
              width: 920,
              height: 200,
              rotation: 0,
              text: 'SUMMER',
              fontSize: 120,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#ffffff'
            },
            {
              id: 'text-event-2',
              type: 'text',
              x: 80,
              y: 350,
              width: 920,
              height: 200,
              rotation: 0,
              text: 'FESTIVAL',
              fontSize: 120,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#ffffff'
            },
            {
              id: 'text-event-3',
              type: 'text',
              x: 80,
              y: 600,
              width: 920,
              height: 80,
              rotation: 0,
              text: 'JUNE 15-17, 2024',
              fontSize: 36,
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center',
              color: '#ffffff'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'dark-elegant',
    name: 'Dark Elegant',
    category: 'premium',
    description: 'Sophisticated dark design',
    snapshot: {
      version: '1.0.0',
      metadata: {
        title: 'Dark Elegant',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      canvas: {
        backgroundColor: '#000000',
        zoom: 1,
        panOffset: { x: 0, y: 0 }
      },
      frames: [
        {
          id: 'starter-frame-5',
          name: 'Dark Elegant Frame',
          x: 100,
          y: 100,
          width: 800,
          height: 1200,
          rotation: 0,
          backgroundColor: '#0a0a0a',
          elements: [
            {
              id: 'shape-accent',
              type: 'shape',
              shapeType: 'rectangle',
              x: 0,
              y: 0,
              width: 800,
              height: 300,
              rotation: 0,
              fill: '#c9a961',
              opacity: 100
            },
            {
              id: 'text-elegant-1',
              type: 'text',
              x: 80,
              y: 400,
              width: 640,
              height: 180,
              rotation: 0,
              text: 'PREMIUM',
              fontSize: 88,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#c9a961'
            },
            {
              id: 'text-elegant-2',
              type: 'text',
              x: 80,
              y: 600,
              width: 640,
              height: 100,
              rotation: 0,
              text: 'Collection 2024',
              fontSize: 48,
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center',
              color: '#ffffff'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    category: 'modern',
    description: 'Futuristic neon design',
    snapshot: {
      version: '1.0.0',
      metadata: {
        title: 'Neon Glow',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      canvas: {
        backgroundColor: '#000000',
        zoom: 1,
        panOffset: { x: 0, y: 0 }
      },
      frames: [
        {
          id: 'starter-frame-6',
          name: 'Neon Glow Frame',
          x: 100,
          y: 100,
          width: 1080,
          height: 1080,
          rotation: 0,
          backgroundColor: '#000814',
          elements: [
            {
              id: 'text-neon-1',
              type: 'text',
              x: 100,
              y: 400,
              width: 880,
              height: 280,
              rotation: 0,
              text: 'CYBER',
              fontSize: 140,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#00f5ff'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'split-color',
    name: 'Split Color',
    category: 'creative',
    description: 'Two-tone split design',
    snapshot: {
      version: '1.0.0',
      metadata: {
        title: 'Split Color',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      canvas: {
        backgroundColor: '#ffffff',
        zoom: 1,
        panOffset: { x: 0, y: 0 }
      },
      frames: [
        {
          id: 'starter-frame-7',
          name: 'Split Color Frame',
          x: 100,
          y: 100,
          width: 1200,
          height: 630,
          rotation: 0,
          backgroundColor: '#ffffff',
          elements: [
            {
              id: 'shape-left',
              type: 'shape',
              shapeType: 'rectangle',
              x: 0,
              y: 0,
              width: 600,
              height: 630,
              rotation: 0,
              fill: '#ff006e',
              opacity: 100
            },
            {
              id: 'shape-right',
              type: 'shape',
              shapeType: 'rectangle',
              x: 600,
              y: 0,
              width: 600,
              height: 630,
              rotation: 0,
              fill: '#3a86ff',
              opacity: 100
            },
            {
              id: 'text-split',
              type: 'text',
              x: 200,
              y: 250,
              width: 800,
              height: 130,
              rotation: 0,
              text: 'CREATIVE',
              fontSize: 96,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#ffffff'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'quote-typography',
    name: 'Quote Typography',
    category: 'minimal',
    description: 'Typography-focused quote design',
    snapshot: {
      version: '1.0.0',
      metadata: {
        title: 'Quote Typography',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      canvas: {
        backgroundColor: '#fafafa',
        zoom: 1,
        panOffset: { x: 0, y: 0 }
      },
      frames: [
        {
          id: 'starter-frame-8',
          name: 'Quote Frame',
          x: 100,
          y: 100,
          width: 1080,
          height: 1080,
          rotation: 0,
          backgroundColor: '#f8f9fa',
          elements: [
            {
              id: 'text-quote-1',
              type: 'text',
              x: 120,
              y: 350,
              width: 840,
              height: 380,
              rotation: 0,
              text: '"Design is not just what it looks like. Design is how it works."',
              fontSize: 64,
              fontFamily: 'Inter',
              fontWeight: 'medium',
              textAlign: 'center',
              color: '#1a1a1a'
            }
          ]
        }
      ]
    }
  }
];
