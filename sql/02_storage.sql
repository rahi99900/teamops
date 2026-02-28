-- =====================================================
-- TeamOps Storage Bucket Setup
-- Run this AFTER the schema SQL
-- =====================================================

-- Create storage bucket for verification media
INSERT INTO storage.buckets (id, name, public)
VALUES ('teamops-media', 'teamops-media', false);

-- =====================================================
-- STORAGE RLS POLICIES
-- =====================================================

-- Policy: Users can upload their own verification media
CREATE POLICY "Users can upload own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'teamops-media'
  AND (storage.foldername(name))[1] = (
    SELECT company_id::text FROM public.users WHERE id = auth.uid()
  )
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can view their own media
CREATE POLICY "Users can view own media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'teamops-media'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Managers can view company media
CREATE POLICY "Managers can view company media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'teamops-media'
  AND (storage.foldername(name))[1] = (
    SELECT company_id::text FROM public.users WHERE id = auth.uid()
  )
  AND public.is_manager_or_above(auth.uid())
);

-- Policy: Users can delete their own media
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'teamops-media'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
