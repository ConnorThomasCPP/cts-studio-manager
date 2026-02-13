# Supabase Setup Guide

This directory contains the database schema and migration files for the Studio Session Asset Manager (SSAM).

## Initial Setup

### 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in the project details:
   - **Name**: Studio Session Asset Manager (or any name you prefer)
   - **Database Password**: Choose a strong password
   - **Region**: Select the region closest to you
4. Wait for the project to be created (~2 minutes)

### 2. Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### 3. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 4. Run Database Migrations

#### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of each migration file in order:
   - `migrations/001_initial_schema.sql`
   - `migrations/002_rls_policies.sql`
   - `migrations/003_functions.sql`
5. Click **Run** after pasting each file

#### Option B: Using Supabase CLI

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link to your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Apply migrations:
   ```bash
   supabase db push
   ```

### 5. Create Storage Bucket for Asset Photos

1. In Supabase dashboard, go to **Storage**
2. Click **New Bucket**
3. Name: `asset-photos`
4. Make it **Public**
5. Click **Create Bucket**

6. Go to **Policies** tab and run this SQL:
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Asset photos: Upload"
   ON storage.objects
   FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'asset-photos');

   -- Allow authenticated users to update
   CREATE POLICY "Asset photos: Update"
   ON storage.objects
   FOR UPDATE
   TO authenticated
   USING (bucket_id = 'asset-photos');

   -- Allow public read access
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
   ```

### 6. Create Your First User

After deploying the app, you'll need to manually set the role for your first user:

1. Sign up through the app (this creates an auth user)
2. Go to Supabase dashboard → **Authentication** → **Users**
3. Copy your user UUID
4. Go to **SQL Editor** and run:
   ```sql
   INSERT INTO public.users (id, name, role)
   VALUES ('your-user-uuid-here', 'Your Name', 'admin');
   ```

## Database Schema Overview

### Tables

- **users** - User profiles with role-based access control
- **assets** - Equipment inventory with barcodes and status tracking
- **categories** - Asset categories (Microphones, Cables, etc.)
- **locations** - Physical storage locations
- **sessions** - Recording sessions (hire contracts)
- **session_assets** - Junction table linking sessions to checked-out assets
- **transactions** - Immutable audit log of all asset movements

### Key Functions

- `check_out_asset(asset_id, session_id, user_id, condition, note)` - Check out an asset
- `check_in_asset(asset_id, session_id, user_id, condition, note)` - Check in an asset
- `can_complete_session(session_id)` - Check if all assets returned
- `generate_asset_code(category_name)` - Auto-generate unique asset codes
- `get_asset_history(asset_id, limit)` - Get transaction history

## Roles

- **admin** - Full access to all features, can manage users
- **engineer** - Can manage assets and sessions, check-out/check-in
- **viewer** - Read-only access

## Troubleshooting

### Migration Errors

If you encounter errors when running migrations:

1. Check that you're running them in order (001, 002, 003)
2. Make sure the `uuid-ossp` extension is enabled
3. Verify you have the correct permissions (should be project owner)

### RLS Policy Issues

If you can't access data after setup:

1. Verify your user has been added to the `public.users` table
2. Check that RLS policies are enabled
3. Test with the Supabase SQL Editor using the "Run as user" feature

### Storage Issues

If photo uploads fail:

1. Verify the `asset-photos` bucket exists and is public
2. Check storage policies are created
3. Ensure CORS is configured in Supabase (usually automatic)

## Next Steps

After completing the database setup:

1. Run the development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Sign up for an account
4. Manually set your role to 'admin' in the database
5. Start creating assets and sessions!
