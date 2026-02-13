-- Studio Session Asset Manager (SSAM) - Row Level Security Policies
-- Migration 002: RLS Policies for Role-Based Access Control

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTION
-- =============================================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================================================
-- USERS TABLE POLICIES
-- =============================================================================

-- All authenticated users can read user profiles
CREATE POLICY "Users: Read all"
  ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "Users: Update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Only admins can insert new users
CREATE POLICY "Users: Admin insert"
  ON public.users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete users
CREATE POLICY "Users: Admin delete"
  ON public.users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- LOCATIONS TABLE POLICIES
-- =============================================================================

-- Everyone can read locations
CREATE POLICY "Locations: Read all"
  ON public.locations
  FOR SELECT
  USING (true);

-- Only admins can manage locations
CREATE POLICY "Locations: Admin manage"
  ON public.locations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- CATEGORIES TABLE POLICIES
-- =============================================================================

-- Everyone can read categories
CREATE POLICY "Categories: Read all"
  ON public.categories
  FOR SELECT
  USING (true);

-- Only admins can manage categories
CREATE POLICY "Categories: Admin manage"
  ON public.categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- ASSETS TABLE POLICIES
-- =============================================================================

-- All authenticated users can read assets
CREATE POLICY "Assets: Read all"
  ON public.assets
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins and engineers can insert assets
CREATE POLICY "Assets: Admin/Engineer insert"
  ON public.assets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

-- Admins and engineers can update assets
CREATE POLICY "Assets: Admin/Engineer update"
  ON public.assets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

-- Only admins can delete assets
CREATE POLICY "Assets: Admin delete"
  ON public.assets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- SESSIONS TABLE POLICIES
-- =============================================================================

-- All authenticated users can read sessions
CREATE POLICY "Sessions: Read all"
  ON public.sessions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins and engineers can create sessions
CREATE POLICY "Sessions: Admin/Engineer insert"
  ON public.sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

-- Admins and engineers can update sessions
CREATE POLICY "Sessions: Admin/Engineer update"
  ON public.sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

-- Only admins can delete sessions
CREATE POLICY "Sessions: Admin delete"
  ON public.sessions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- SESSION ASSETS TABLE POLICIES
-- =============================================================================

-- All authenticated users can read session asset assignments
CREATE POLICY "Session Assets: Read all"
  ON public.session_assets
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins and engineers can manage session asset assignments
CREATE POLICY "Session Assets: Admin/Engineer manage"
  ON public.session_assets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

-- =============================================================================
-- TRANSACTIONS TABLE POLICIES
-- =============================================================================

-- All authenticated users can read transaction history
CREATE POLICY "Transactions: Read all"
  ON public.transactions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- All authenticated users can insert transactions (audit log)
-- This is write-only, no updates or deletes allowed
CREATE POLICY "Transactions: Insert only"
  ON public.transactions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- No updates allowed on transactions (immutable log)
-- No delete policy = no one can delete

-- =============================================================================
-- STORAGE POLICIES (for asset photos)
-- =============================================================================

-- Note: These must be created in Supabase Storage UI or via SQL for storage.objects
-- Bucket name: 'asset-photos'

-- SQL to create storage bucket (run this in Supabase SQL editor):
/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-photos', 'asset-photos', true);

-- Allow authenticated users to upload
CREATE POLICY "Asset photos: Upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'asset-photos');

-- Allow authenticated users to update their uploads
CREATE POLICY "Asset photos: Update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'asset-photos');

-- Allow public read access to asset photos
CREATE POLICY "Asset photos: Public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'asset-photos');

-- Allow admins to delete
CREATE POLICY "Asset photos: Admin delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'asset-photos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
*/
