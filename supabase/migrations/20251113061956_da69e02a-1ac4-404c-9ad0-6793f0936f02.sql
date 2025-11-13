-- Enable REPLICA IDENTITY FULL on posters table for proper real-time updates
-- This ensures all column data is sent in realtime events, not just primary key
ALTER TABLE public.posters REPLICA IDENTITY FULL;