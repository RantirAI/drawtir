-- Add missing UPDATE policy for posters table
CREATE POLICY "Users can update their own posters" 
ON public.posters 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);