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
  },
  {
    id: 'concert-poster',
    name: 'Concert Poster',
    category: 'event',
    description: 'Bold music concert template',
    snapshot: {
      version: '1.0.0',
      metadata: {
        title: 'Concert Poster',
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
          id: 'concert-frame',
          name: 'Concert Poster',
          x: 100,
          y: 100,
          width: 800,
          height: 1200,
          rotation: 0,
          backgroundColor: '#0a0a0a',
          backgroundType: 'gradient',
          gradientType: 'radial',
          gradientStops: [
            { color: '#1a1a2e', position: 0 },
            { color: '#0a0a0a', position: 100 }
          ],
          elements: [
            {
              id: 'concert-title',
              type: 'text',
              x: 50,
              y: 200,
              width: 700,
              height: 180,
              rotation: 0,
              text: 'LIVE IN',
              fontSize: 80,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#ff0080'
            },
            {
              id: 'concert-artist',
              type: 'text',
              x: 50,
              y: 380,
              width: 700,
              height: 220,
              rotation: 0,
              text: 'CONCERT',
              fontSize: 120,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#ffffff'
            },
            {
              id: 'concert-date',
              type: 'text',
              x: 50,
              y: 650,
              width: 700,
              height: 80,
              rotation: 0,
              text: 'FRIDAY, AUG 15 • 8PM',
              fontSize: 32,
              fontFamily: 'Inter',
              fontWeight: 'medium',
              textAlign: 'center',
              color: '#00f5ff'
            },
            {
              id: 'concert-venue',
              type: 'text',
              x: 50,
              y: 750,
              width: 700,
              height: 60,
              rotation: 0,
              text: 'Madison Square Garden',
              fontSize: 28,
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center',
              color: '#cccccc'
            },
            {
              id: 'concert-accent',
              type: 'shape',
              shapeType: 'rectangle',
              x: 300,
              y: 900,
              width: 200,
              height: 4,
              rotation: 0,
              fill: '#ff0080',
              opacity: 100
            }
          ]
        }
      ]
    }
  },
  {
    id: 'party-poster',
    name: 'Party Poster',
    category: 'event',
    description: 'Vibrant party flyer template',
    snapshot: {
      version: '1.0.0',
      metadata: {
        title: 'Party Poster',
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
          id: 'party-frame',
          name: 'Party Poster',
          x: 100,
          y: 100,
          width: 1080,
          height: 1080,
          rotation: 0,
          backgroundColor: '#ff006e',
          backgroundType: 'gradient',
          gradientType: 'linear',
          gradientAngle: 135,
          gradientStops: [
            { color: '#ff006e', position: 0 },
            { color: '#8338ec', position: 50 },
            { color: '#3a86ff', position: 100 }
          ],
          elements: [
            {
              id: 'party-shape-1',
              type: 'shape',
              shapeType: 'ellipse',
              x: 80,
              y: 80,
              width: 150,
              height: 150,
              rotation: 0,
              fill: '#ffbe0b',
              opacity: 30
            },
            {
              id: 'party-shape-2',
              type: 'shape',
              shapeType: 'ellipse',
              x: 850,
              y: 850,
              width: 180,
              height: 180,
              rotation: 0,
              fill: '#fb5607',
              opacity: 30
            },
            {
              id: 'party-title',
              type: 'text',
              x: 80,
              y: 350,
              width: 920,
              height: 180,
              rotation: 0,
              text: 'SUMMER',
              fontSize: 110,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#ffffff'
            },
            {
              id: 'party-subtitle',
              type: 'text',
              x: 80,
              y: 530,
              width: 920,
              height: 180,
              rotation: 0,
              text: 'PARTY',
              fontSize: 110,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#ffffff'
            },
            {
              id: 'party-details',
              type: 'text',
              x: 80,
              y: 750,
              width: 920,
              height: 80,
              rotation: 0,
              text: 'SATURDAY • 10PM - LATE',
              fontSize: 36,
              fontFamily: 'Inter',
              fontWeight: 'medium',
              textAlign: 'center',
              color: '#ffffff'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'conference-poster',
    name: 'Conference Poster',
    category: 'professional',
    description: 'Professional conference template',
    snapshot: {
      version: '1.0.0',
      metadata: {
        title: 'Conference Poster',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      canvas: {
        backgroundColor: '#f8f9fa',
        zoom: 1,
        panOffset: { x: 0, y: 0 }
      },
      frames: [
        {
          id: 'conference-frame',
          name: 'Conference Poster',
          x: 100,
          y: 100,
          width: 1200,
          height: 630,
          rotation: 0,
          backgroundColor: '#ffffff',
          elements: [
            {
              id: 'conf-header-bar',
              type: 'shape',
              shapeType: 'rectangle',
              x: 0,
              y: 0,
              width: 1200,
              height: 120,
              rotation: 0,
              fill: '#2563eb',
              opacity: 100
            },
            {
              id: 'conf-title',
              type: 'text',
              x: 100,
              y: 200,
              width: 1000,
              height: 150,
              rotation: 0,
              text: 'Tech Conference 2024',
              fontSize: 80,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#1a1a1a'
            },
            {
              id: 'conf-date',
              type: 'text',
              x: 100,
              y: 380,
              width: 1000,
              height: 70,
              rotation: 0,
              text: 'September 20-22, 2024',
              fontSize: 40,
              fontFamily: 'Inter',
              fontWeight: 'medium',
              textAlign: 'center',
              color: '#2563eb'
            },
            {
              id: 'conf-location',
              type: 'text',
              x: 100,
              y: 470,
              width: 1000,
              height: 60,
              rotation: 0,
              text: 'San Francisco Convention Center',
              fontSize: 32,
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center',
              color: '#666666'
            },
            {
              id: 'conf-accent',
              type: 'shape',
              shapeType: 'rectangle',
              x: 450,
              y: 560,
              width: 300,
              height: 5,
              rotation: 0,
              fill: '#2563eb',
              opacity: 100
            }
          ]
        }
      ]
    }
  },
  {
    id: 'workshop-poster',
    name: 'Workshop Poster',
    category: 'professional',
    description: 'Educational workshop template',
    snapshot: {
      version: '1.0.0',
      metadata: {
        title: 'Workshop Poster',
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
          id: 'workshop-frame',
          name: 'Workshop Poster',
          x: 100,
          y: 100,
          width: 800,
          height: 1200,
          rotation: 0,
          backgroundColor: '#f8f9fa',
          elements: [
            {
              id: 'workshop-accent',
              type: 'shape',
              shapeType: 'rectangle',
              x: 0,
              y: 0,
              width: 20,
              height: 1200,
              rotation: 0,
              fill: '#10b981',
              opacity: 100
            },
            {
              id: 'workshop-badge',
              type: 'text',
              x: 80,
              y: 120,
              width: 300,
              height: 50,
              rotation: 0,
              text: 'WORKSHOP',
              fontSize: 24,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'left',
              color: '#10b981'
            },
            {
              id: 'workshop-title',
              type: 'text',
              x: 80,
              y: 220,
              width: 640,
              height: 220,
              rotation: 0,
              text: 'Design Thinking Fundamentals',
              fontSize: 68,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'left',
              color: '#1a1a1a'
            },
            {
              id: 'workshop-desc',
              type: 'text',
              x: 80,
              y: 480,
              width: 640,
              height: 120,
              rotation: 0,
              text: 'Learn the essential principles and methods of design thinking in this hands-on workshop',
              fontSize: 28,
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'left',
              color: '#666666'
            },
            {
              id: 'workshop-date',
              type: 'text',
              x: 80,
              y: 680,
              width: 640,
              height: 60,
              rotation: 0,
              text: 'Tuesday, March 15 • 2-5 PM',
              fontSize: 30,
              fontFamily: 'Inter',
              fontWeight: 'medium',
              textAlign: 'left',
              color: '#1a1a1a'
            },
            {
              id: 'workshop-location',
              type: 'text',
              x: 80,
              y: 760,
              width: 640,
              height: 50,
              rotation: 0,
              text: 'Innovation Hub, Room 302',
              fontSize: 26,
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'left',
              color: '#999999'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'sports-event',
    name: 'Sports Event',
    category: 'event',
    description: 'Dynamic sports event template',
    snapshot: {
      version: '1.0.0',
      metadata: {
        title: 'Sports Event',
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
          id: 'sports-frame',
          name: 'Sports Event',
          x: 100,
          y: 100,
          width: 1080,
          height: 1350,
          rotation: 0,
          backgroundColor: '#0f0f0f',
          elements: [
            {
              id: 'sports-accent-1',
              type: 'shape',
              shapeType: 'rectangle',
              x: 0,
              y: 300,
              width: 1080,
              height: 400,
              rotation: -5,
              fill: '#ef4444',
              opacity: 15
            },
            {
              id: 'sports-title-1',
              type: 'text',
              x: 80,
              y: 250,
              width: 920,
              height: 180,
              rotation: 0,
              text: 'BASKETBALL',
              fontSize: 100,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#ffffff'
            },
            {
              id: 'sports-title-2',
              type: 'text',
              x: 80,
              y: 430,
              width: 920,
              height: 180,
              rotation: 0,
              text: 'TOURNAMENT',
              fontSize: 100,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#ef4444'
            },
            {
              id: 'sports-date',
              type: 'text',
              x: 80,
              y: 700,
              width: 920,
              height: 80,
              rotation: 0,
              text: 'MAY 10-12 • 2024',
              fontSize: 42,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#ffffff'
            },
            {
              id: 'sports-venue',
              type: 'text',
              x: 80,
              y: 800,
              width: 920,
              height: 70,
              rotation: 0,
              text: 'City Sports Arena',
              fontSize: 36,
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center',
              color: '#cccccc'
            },
            {
              id: 'sports-stripe-1',
              type: 'shape',
              shapeType: 'rectangle',
              x: 0,
              y: 1000,
              width: 1080,
              height: 8,
              rotation: 0,
              fill: '#ef4444',
              opacity: 100
            },
            {
              id: 'sports-stripe-2',
              type: 'shape',
              shapeType: 'rectangle',
              x: 0,
              y: 1030,
              width: 1080,
              height: 8,
              rotation: 0,
              fill: '#ef4444',
              opacity: 100
            }
          ]
        }
      ]
    }
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    category: 'business',
    description: 'Modern product launch template',
    snapshot: {
      version: '1.0.0',
      metadata: {
        title: 'Product Launch',
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
          id: 'product-frame',
          name: 'Product Launch',
          x: 100,
          y: 100,
          width: 1080,
          height: 1080,
          rotation: 0,
          backgroundColor: '#0a0a0a',
          backgroundType: 'gradient',
          gradientType: 'linear',
          gradientAngle: 45,
          gradientStops: [
            { color: '#0a0a0a', position: 0 },
            { color: '#1a1a2e', position: 100 }
          ],
          elements: [
            {
              id: 'product-badge',
              type: 'text',
              x: 100,
              y: 180,
              width: 880,
              height: 60,
              rotation: 0,
              text: 'NEW PRODUCT',
              fontSize: 28,
              fontFamily: 'Inter',
              fontWeight: 'medium',
              textAlign: 'center',
              color: '#00f5ff'
            },
            {
              id: 'product-title',
              type: 'text',
              x: 100,
              y: 280,
              width: 880,
              height: 200,
              rotation: 0,
              text: 'LAUNCHING SOON',
              fontSize: 90,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#ffffff'
            },
            {
              id: 'product-desc',
              type: 'text',
              x: 150,
              y: 520,
              width: 780,
              height: 100,
              rotation: 0,
              text: 'Experience the future of innovation',
              fontSize: 32,
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center',
              color: '#cccccc'
            },
            {
              id: 'product-date',
              type: 'text',
              x: 150,
              y: 680,
              width: 780,
              height: 80,
              rotation: 0,
              text: 'NOVEMBER 2024',
              fontSize: 40,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#00f5ff'
            },
            {
              id: 'product-accent',
              type: 'shape',
              shapeType: 'rectangle',
              x: 390,
              y: 800,
              width: 300,
              height: 4,
              rotation: 0,
              fill: '#00f5ff',
              opacity: 100
            }
          ]
        }
      ]
    }
  }
];
