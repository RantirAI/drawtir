-- Add fields to posters table to support templates
ALTER TABLE public.posters
ADD COLUMN is_public boolean DEFAULT false,
ADD COLUMN is_template boolean DEFAULT false,
ADD COLUMN template_category text;

-- Create index for better query performance on public templates
CREATE INDEX idx_posters_public_templates ON public.posters(is_public, is_template) WHERE is_public = true;

-- Add RLS policy to allow users to view public templates
CREATE POLICY "Anyone can view public templates"
ON public.posters
FOR SELECT
USING (is_public = true);

-- Add RLS policy to allow users to update their posters to be public
CREATE POLICY "Users can make their posters public"
ON public.posters
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);