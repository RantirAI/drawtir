import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface UserPresence {
  userId: string;
  userName: string;
  displayName: string;
  avatarUrl: string | null;
  cursorX: number;
  cursorY: number;
  color: string;
  lastSeen: number;
  isActive: boolean; // Flag to track if cursor should be visible
}

const CURSOR_COLORS = [
  'hsl(142, 76%, 36%)', // primary
  'hsl(221, 83%, 53%)', // blue
  'hsl(280, 89%, 55%)', // purple
  'hsl(339, 82%, 52%)', // pink
  'hsl(24, 95%, 53%)', // orange
  'hsl(48, 96%, 53%)', // yellow
];

const CURSOR_HIDE_DELAY = 500; // Hide cursor after 500ms of inactivity
const BROADCAST_THROTTLE = 50; // Throttle broadcasts to every 50ms (20fps is smooth enough)

export const useCollaborativePresence = (projectId: string | null, enabled: boolean = true) => {
  const [activeUsers, setActiveUsers] = useState<Map<string, UserPresence>>(new Map());
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar: string | null } | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastBroadcastRef = useRef<number>(0);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch current user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, email, first_name, last_name')
        .eq('id', user.id)
        .single();

      const displayName = profile?.display_name || 
                         (profile?.first_name && profile?.last_name 
                           ? `${profile.first_name} ${profile.last_name}` 
                           : profile?.first_name || profile?.email || 'Anonymous');

      setCurrentUser({
        id: user.id,
        name: displayName,
        avatar: profile?.avatar_url || null,
      });
    };

    fetchUserInfo();
  }, []);

  // Assign color based on user ID
  const getUserColor = useCallback((userId: string) => {
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
  }, []);

  // Broadcast cursor position (properly throttled)
  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!channelRef.current || !currentUser || !enabled) return;

    const now = Date.now();
    if (now - lastBroadcastRef.current < BROADCAST_THROTTLE) return;
    
    lastBroadcastRef.current = now;

    channelRef.current.track({
      userId: currentUser.id,
      userName: currentUser.name,
      displayName: currentUser.name,
      avatarUrl: currentUser.avatar,
      cursorX: x,
      cursorY: y,
      color: getUserColor(currentUser.id),
      lastSeen: Date.now(),
      isActive: true,
    });
  }, [currentUser, enabled, getUserColor]);

  // Setup presence channel
  useEffect(() => {
    if (!projectId || !currentUser || !enabled) return;

    const channel = supabase.channel(`project:${projectId}:presence`, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = new Map<string, UserPresence>();

        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: UserPresence) => {
            if (presence.userId !== currentUser.id) {
              users.set(presence.userId, presence);
            }
          });
        });

        setActiveUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        setActiveUsers(prev => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Don't broadcast cursor on initial subscription
          await channel.track({
            userId: currentUser.id,
            userName: currentUser.name,
            displayName: currentUser.name,
            avatarUrl: currentUser.avatar,
            cursorX: -1000, // Off-screen initially
            cursorY: -1000,
            color: getUserColor(currentUser.id),
            lastSeen: Date.now(),
            isActive: false,
          });
        }
      });

    channelRef.current = channel;

    // Cleanup stale cursors faster (every 500ms)
    cleanupIntervalRef.current = setInterval(() => {
      const now = Date.now();
      setActiveUsers(prev => {
        const next = new Map(prev);
        let changed = false;

        next.forEach((user, userId) => {
          if (now - user.lastSeen > CURSOR_HIDE_DELAY) {
            // Mark as inactive instead of removing
            if (user.isActive) {
              next.set(userId, { ...user, isActive: false });
              changed = true;
            }
          }
          // Remove completely after 5 seconds
          if (now - user.lastSeen > 5000) {
            next.delete(userId);
            changed = true;
          }
        });

        return changed ? next : prev;
      });
    }, 200); // Check more frequently

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [projectId, currentUser, enabled, getUserColor]);

  return {
    activeUsers: Array.from(activeUsers.values()).filter(u => u.isActive), // Only return active cursors
    broadcastCursor,
    currentUser,
  };
};
