-- Add delete policy for cleanup
CREATE POLICY "Anyone can delete public analyses"
ON public.public_recent_analyses
FOR DELETE
USING (true);