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
  }
];
