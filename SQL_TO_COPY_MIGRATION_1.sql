DROP POLICY IF EXISTS "Users can view own drills" ON drills;
DROP POLICY IF EXISTS "Users can insert own drills" ON drills;
DROP POLICY IF EXISTS "Users can update own drills" ON drills;
DROP POLICY IF EXISTS "Users can delete own drills" ON drills;

DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;

CREATE POLICY "All authenticated users can view drills" ON drills
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create drills" ON drills
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "All authenticated users can update drills" ON drills
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can delete drills" ON drills
  FOR DELETE TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can view sessions" ON sessions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create sessions" ON sessions
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "All authenticated users can update sessions" ON sessions
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can delete sessions" ON sessions
  FOR DELETE TO authenticated
  USING (true);

