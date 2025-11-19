-- Migration: Enable Shared Access for Coaching Staff
-- This allows all authenticated users to view/edit/delete all drills and sessions

-- Step 1: Drop existing user-specific policies
DROP POLICY IF EXISTS "Users can view own drills" ON drills;
DROP POLICY IF EXISTS "Users can insert own drills" ON drills;
DROP POLICY IF EXISTS "Users can update own drills" ON drills;
DROP POLICY IF EXISTS "Users can delete own drills" ON drills;

DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;

-- Step 2: Create new shared policies for drills
-- All authenticated users can view all drills
CREATE POLICY "All authenticated users can view drills" ON drills
  FOR SELECT TO authenticated
  USING (true);

-- All authenticated users can create drills
CREATE POLICY "All authenticated users can create drills" ON drills
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- All authenticated users can update any drill
CREATE POLICY "All authenticated users can update drills" ON drills
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- All authenticated users can delete any drill
CREATE POLICY "All authenticated users can delete drills" ON drills
  FOR DELETE TO authenticated
  USING (true);

-- Step 3: Create new shared policies for sessions
-- All authenticated users can view all sessions
CREATE POLICY "All authenticated users can view sessions" ON sessions
  FOR SELECT TO authenticated
  USING (true);

-- All authenticated users can create sessions
CREATE POLICY "All authenticated users can create sessions" ON sessions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- All authenticated users can update any session
CREATE POLICY "All authenticated users can update sessions" ON sessions
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- All authenticated users can delete any session
CREATE POLICY "All authenticated users can delete sessions" ON sessions
  FOR DELETE TO authenticated
  USING (true);

-- Enable viewing user emails for attribution (optional - may not work with default RLS)
-- Note: This might not work due to Supabase auth.users security.
-- Alternative: Create a profiles table with email if this doesn't work.
-- For now, try enabling SELECT on auth.users for authenticated users (if supported)
-- If this fails, creator_email will remain undefined and UI will gracefully handle it.

