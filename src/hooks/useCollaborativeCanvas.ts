import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Frame } from '@/types/elements';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useCollaborativeCanvas = (
  projectId: string | null,
  frames: Frame[],
  onRemoteUpdate: (newFrames: Frame[]) => void,
  enabled: boolean = true
) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocalUpdateRef = useRef<number>(0);
  const lastBroadcastRef = useRef<number>(0);
  const localChangeIdRef = useRef<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Debounced save to database
  const saveToDatabase = useCallback(async (framesToSave: Frame[]) => {
    if (!projectId) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('posters')
        .update({
          canvas_data: {
            frames: framesToSave,
            version: '1.0',
          } as any,
        })
        .eq('id', projectId);

      if (error) throw error;
      
      lastLocalUpdateRef.current = Date.now();
    } catch (error) {
      console.error('Error saving canvas:', error);
    } finally {
      setIsSaving(false);
    }
  }, [projectId]);

  // Broadcast canvas changes immediately for real-time updates
  const broadcastCanvasUpdate = useCallback((framesToBroadcast: Frame[]) => {
    if (!channelRef.current || !enabled || !projectId) return;

    const now = Date.now();
    // Throttle broadcasts to every 100ms to avoid overwhelming the network
    if (now - lastBroadcastRef.current < 100) return;

    lastBroadcastRef.current = now;
    // Generate a unique ID for this local change
    const changeId = `${Date.now()}-${Math.random()}`;
    localChangeIdRef.current = changeId;

    console.log('📤 Broadcasting canvas update with changeId:', changeId);

    channelRef.current.send({
      type: 'broadcast',
      event: 'canvas-update',
      payload: {
        frames: framesToBroadcast,
        timestamp: now,
        changeId,
      }
    });
  }, [enabled, projectId]);

  // Trigger debounced save and immediate broadcast when frames change
  useEffect(() => {
    if (!enabled || !projectId) return;

    // Broadcast immediately for real-time updates
    broadcastCanvasUpdate(frames);

    // Save to database after delay for persistence
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToDatabase(frames);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [frames, projectId, enabled, saveToDatabase, broadcastCanvasUpdate]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!projectId || !enabled) return;

    const channel = supabase
      .channel(`project:${projectId}:canvas`)
      .on(
        'broadcast',
        { event: 'canvas-update' },
        (payload: any) => {
          const { frames: newFrames, timestamp, changeId } = payload.payload;
          
          // Ignore updates that originated from us
          if (changeId && changeId === localChangeIdRef.current) {
            console.log('📥 Ignoring own broadcast with changeId:', changeId);
            return;
          }

          // Also ignore very recent broadcasts as a fallback
          const timeSinceLastBroadcast = Date.now() - lastBroadcastRef.current;
          if (timeSinceLastBroadcast < 300) {
            console.log('📥 Ignoring broadcast due to timing (< 300ms)');
            return;
          }

          if (newFrames && Array.isArray(newFrames)) {
            console.log('📥 Received real-time canvas update via broadcast from another user');
            onRemoteUpdate(newFrames);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posters',
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          // Ignore updates that we just made
          const timeSinceLastUpdate = Date.now() - lastLocalUpdateRef.current;
          if (timeSinceLastUpdate < 1000) {
            return;
          }

          const newCanvasData = payload.new.canvas_data as any;
          if (newCanvasData?.frames) {
            console.log('Received canvas update from database (fallback sync)');
            onRemoteUpdate(newCanvasData.frames);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [projectId, enabled, onRemoteUpdate]);

  return {
    isSaving,
  };
};
