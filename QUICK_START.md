# Quick Start - Getting Your Website Running

## ✅ Good News! Your Setup is Already Done

You have:
- ✅ Supabase credentials configured (`.env.local`)
- ✅ Dependencies installed (`node_modules` exists)
- ✅ Dev server running (Vite is active)

## What To Do Right Now

### 1. Open Your Browser
Go to: **http://localhost:5173/**

If you already have it open, just **reload the page** (press `F5` or `Cmd/Ctrl + R`)

The dev server automatically reloads when code changes, so:
- ✅ Changes to React components → Auto-reloads
- ✅ Changes to TypeScript files → Auto-reloads  
- ✅ You don't need to restart anything for frontend changes

### 2. If the Page Doesn't Load

**Check if dev server is running:**
```bash
cd soccer-session-planner
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### 3. Before You Can Use the App

**You need to set up Supabase first** (one-time setup):

#### A. Create Database Tables
1. Go to https://qgxlakultcwqznidazhx.supabase.co (your Supabase project)
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL (from TESTING_GUIDE.md):
   - Go to the "Database Setup" section
   - Copy the entire SQL block
   - Paste and click **Run**

#### B. Create Storage Bucket
1. In Supabase, click **Storage** in left sidebar
2. Click **New bucket**
3. Name: `drill-videos`
4. **Uncheck** "Public bucket" (keep it private)
5. Click **Create bucket**

#### C. Add Storage Policies
1. Click on the `drill-videos` bucket
2. Go to **Policies** tab
3. Add the 3 policies from TESTING_GUIDE.md (Storage Setup section)

### 4. Once Supabase is Set Up

Just **reload your browser** at http://localhost:5173/

You should be able to:
- ✅ Sign up / Log in
- ✅ Add drills
- ✅ View library
- ✅ Create sessions

## When You Make Code Changes

**Frontend code (React, TypeScript):**
- ✅ Just save the file
- ✅ Browser auto-reloads
- ✅ No need to restart dev server

**Environment variables (`.env.local`):**
- ❌ Restart dev server required
- Run: `npm run dev` again

**Supabase changes (tables, policies):**
- ✅ Just reload browser
- ✅ No code changes needed

## Quick Troubleshooting

**"Cannot connect" or page won't load:**
```bash
cd soccer-session-planner
npm run dev
```

**"Supabase environment variables not set" warning:**
- Your `.env.local` looks correct, but make sure it's in the right place:
  - Should be: `soccer-session-planner/.env.local`
  - Not in the root directory

**Auth/login not working:**
- Make sure you've created the database tables in Supabase (see step 3A above)

**File upload not working:**
- Make sure you've created the storage bucket and policies (see step 3B-C above)

## Summary

**Right now:**
1. Open http://localhost:5173/ in browser
2. If page loads → Great! Just reload to see latest changes
3. If you see errors → Follow step 3 above to set up Supabase tables/storage

**When you change code:**
- Just save → Browser auto-reloads → Done!

**No need to:**
- ❌ Restart dev server (unless you change `.env` files)
- ❌ Go to Supabase for code changes (only for database/storage setup)
- ❌ Rebuild anything (Vite handles it automatically)

