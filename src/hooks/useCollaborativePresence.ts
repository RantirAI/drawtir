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
}

const CURSOR_COLORS = [
  'hsl(142, 76%, 36%)', // primary
  'hsl(221, 83%, 53%)', // blue
  'hsl(280, 89%, 55%)', // purple
  'hsl(339, 82%, 52%)', // pink
  'hsl(24, 95%, 53%)', // orange
  'hsl(48, 96%, 53%)', // yellow
];

export const useCollaborativePresence = (projectId: string | null, enabled: boolean = true) => {
  const [activeUsers, setActiveUsers] = useState<Map<string, UserPresence>>(new Map());
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar: string | null } | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch current user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, email')
        .eq('id', user.id)
        .single();

      setCurrentUser({
        id: user.id,
        name: profile?.display_name || profile?.email || 'Anonymous',
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

  // Broadcast cursor position (throttled)
  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!channelRef.current || !currentUser || !enabled) return;

    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
    }

    throttleRef.current = setTimeout(() => {
      channelRef.current?.track({
        userId: currentUser.id,
        userName: currentUser.name,
        displayName: currentUser.name,
        avatarUrl: currentUser.avatar,
        cursorX: x,
        cursorY: y,
        color: getUserColor(currentUser.id),
        lastSeen: Date.now(),
      });
    }, 16); // ~60fps
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
          await channel.track({
            userId: currentUser.id,
            userName: currentUser.name,
            displayName: currentUser.name,
            avatarUrl: currentUser.avatar,
            cursorX: 0,
            cursorY: 0,
            color: getUserColor(currentUser.id),
            lastSeen: Date.now(),
          });
        }
      });

    channelRef.current = channel;

    // Cleanup stale cursors every 3 seconds
    cleanupIntervalRef.current = setInterval(() => {
      const now = Date.now();
      setActiveUsers(prev => {
        const next = new Map(prev);
        let changed = false;

        next.forEach((user, userId) => {
          if (now - user.lastSeen > 3000) {
            next.delete(userId);
            changed = true;
          }
        });

        return changed ? next : prev;
      });
    }, 3000);

    return () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [projectId, currentUser, enabled, getUserColor]);

  return {
    activeUsers: Array.from(activeUsers.values()),
    broadcastCursor,
    currentUser,
  };
};
