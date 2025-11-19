# Creator Attribution Setup

To enable creator attribution (showing who created each drill/session), you need to set up one of these approaches:

## Option 1: Create a Profiles Table (Recommended)

Run this SQL in Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view all profiles
CREATE POLICY "All authenticated users can view profiles" ON profiles
  FOR SELECT TO authenticated
  USING (true);

-- Auto-populate profiles when a user signs up (using a trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;
```

Then update `src/services/database.ts` to query from `profiles` instead of `auth.users`:

```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('id, email')
  .in('id', missingIds)
```

## Option 2: Use a Database Function

Create a function that returns user emails (requires service_role key or proper permissions):

```sql
CREATE OR REPLACE FUNCTION get_user_emails(user_ids UUID[])
RETURNS TABLE(user_id UUID, email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email
  FROM auth.users u
  WHERE u.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Then call it from the client (this may require special setup).

## Option 3: Store Email in Drills/Sessions Tables

Add an `creator_email` column to both tables and populate it on creation:

```sql
ALTER TABLE drills ADD COLUMN creator_email TEXT;
ALTER TABLE sessions ADD COLUMN creator_email TEXT;

-- Backfill
UPDATE drills SET creator_email = (SELECT email FROM auth.users WHERE id = drills.user_id);
UPDATE sessions SET creator_email = (SELECT email FROM auth.users WHERE id = sessions.user_id);
```

**For now, creator attribution will gracefully degrade - if emails aren't available, they simply won't be shown.**

