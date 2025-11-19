
# Quick Start: New Version

## TL;DR - Copy & Paste These Commands

```bash
# 1. Go to project directory
cd /Users/seijimatsuda/session_planner_Beta/soccer-session-planner

# 2. Install dependencies (if needed)
npm install

# 3. Set up environment variables (create .env.local with your Supabase credentials)
# See STEP_BY_STEP_RUN.md Part 4 for details

# 4. Run SQL migrations in Supabase Dashboard (SQL Editor)
# See STEP_BY_STEP_RUN.md Part 5 for details

# 5. Start server
npm run dev

# 6. Open browser to http://localhost:5173 (or 5174 if 5173 is in use)
```

## What's New in This Version?

1. **Shared Access** - All authenticated users can view/edit/delete all drills and sessions
2. **Session View Page** - Click a session to view it (read-only) with dynamic grid
3. **Drill Detail Modal** - Click a drill in session view to see full details
4. **Creator Attribution** - Shows who created each drill/session (if profiles table is set up)

## Required SQL Migrations

Run these in Supabase SQL Editor:
1. `SHARED_ACCESS_MIGRATION.sql` - Enables shared access for drills/sessions
2. `SHARED_STORAGE_MIGRATION.sql` - Enables shared access for storage

## For Detailed Steps

See `STEP_BY_STEP_RUN.md` for smallest possible step-by-step instructions.

