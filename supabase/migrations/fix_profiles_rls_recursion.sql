-- Migration: Fix infinite recursion in profiles RLS policies
-- This migration drops existing policies and creates safe, non-recursive ones

-- ============================================================================
-- 1. DROP ALL EXISTING POLICIES ON PROFILES TABLE
-- ============================================================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Staff can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- Drop any other policies that might exist (catch-all)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.profiles';
    END LOOP;
END $$;

-- ============================================================================
-- 2. CREATE SECURITY DEFINER FUNCTION FOR ADMIN CHECK
-- ============================================================================

-- Create a security definer function to check admin role without recursion
-- This function runs with elevated privileges and bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    user_id UUID;
    user_role TEXT;
BEGIN
    -- Get the current user's ID
    user_id := auth.uid();
    
    -- If no user is authenticated, return false
    IF user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Query the profiles table directly (bypasses RLS due to SECURITY DEFINER)
    -- This avoids recursion because the function runs with elevated privileges
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = user_id;
    
    -- Return true if role is 'admin', false otherwise
    RETURN COALESCE(user_role = 'admin', FALSE);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE SAFE, NON-RECURSIVE POLICIES
-- ============================================================================

-- Policy 1: Users can SELECT their own profile
-- Uses auth.uid() directly - no recursion
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Users can INSERT their own profile
-- Uses auth.uid() directly - no recursion
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can UPDATE their own profile
-- Uses auth.uid() directly - no recursion
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Admins can SELECT all profiles
-- Uses the is_admin() function which doesn't cause recursion
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Policy 5: Admins can UPDATE all profiles
-- Uses the is_admin() function which doesn't cause recursion
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy 6: Admins can INSERT profiles (for creating profiles for other users if needed)
-- Uses the is_admin() function which doesn't cause recursion
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- What this migration does:
-- 1. Drops all existing policies that might cause recursion
-- 2. Creates is_admin() security definer function to check admin role safely
-- 3. Enables RLS on profiles table
-- 4. Creates new policies that:
--    - Allow users to SELECT/UPDATE their own profile (using auth.uid())
--    - Allow users to INSERT their own profile (using auth.uid())
--    - Allow admins to SELECT/UPDATE/INSERT all profiles (using is_admin())
--
-- Key points:
-- - is_admin() uses SECURITY DEFINER to bypass RLS, preventing recursion
-- - All user policies use auth.uid() directly (no table queries)
-- - Admin policies use is_admin() function (no direct table queries in policy)
-- ============================================================================


