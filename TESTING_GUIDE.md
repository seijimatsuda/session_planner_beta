# Testing Guide - Soccer Session Planner

This guide will walk you through every step needed to test the application.

## Prerequisites

### 1. Supabase Project Setup

#### A. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: Soccer Session Planner (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
5. Wait for project to initialize (2-3 minutes)

#### B. Get Your API Keys
1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon public key** (under "Project API keys" → "anon public")

### 2. Database Setup

#### A. Create Tables
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create drills table
CREATE TABLE drills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  video_url TEXT NOT NULL,
  video_file_path TEXT,
  category TEXT NOT NULL CHECK (category IN ('activation', 'dribbling', 'passing', 'shooting')),
  num_players INTEGER,
  equipment TEXT[],
  tags TEXT[],
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  grid_data JSONB NOT NULL DEFAULT '{"grid": [[null,null,null],[null,null,null],[null,null,null],[null,null,null]]}',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policies for drills (users can only access their own drills)
CREATE POLICY "Users can view own drills" ON drills
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drills" ON drills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drills" ON drills
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drills" ON drills
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_drills_user_id ON drills(user_id);
CREATE INDEX idx_drills_category ON drills(category);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
```

4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Verify success: You should see "Success. No rows returned"

#### B. Create Storage Bucket
1. Go to **Storage** in Supabase Dashboard
2. Click **New bucket**
3. Set:
   - **Name**: `drill-videos`
   - **Public bucket**: **UNCHECKED** (keep it private)
4. Click **Create bucket**

#### C. Set Up Storage Policies
1. Still in **Storage**, click on the `drill-videos` bucket
2. Go to **Policies** tab
3. Click **New Policy** → **For full customization**
4. Copy and paste this SQL:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'drill-videos');

-- Allow users to read their own videos
CREATE POLICY "Users can view own videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'drill-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own videos
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'drill-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

5. Click **Review** → **Save Policy** (repeat for each of the 3 policies above)

### 3. Local Environment Setup

#### A. Create Environment File
1. Navigate to the `soccer-session-planner` directory:
```bash
cd soccer-session-planner
```

2. Create a `.env` file:
```bash
touch .env
```

3. Add your Supabase credentials (replace with your actual values):
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: 
- Replace `your-project-id` with your actual Supabase project ID
- Replace `your-anon-key-here` with your actual anon public key
- Never commit this file to git (it should be in `.gitignore`)

#### B. Install Dependencies
```bash
npm install
```

This should complete without errors. If you see any errors, try:
```bash
rm -rf node_modules package-lock.json
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open http://localhost:5173/ in your browser.

---

## Testing Checklist

### Phase 1: Authentication Testing ✅

#### Test Sign Up
- [ ] Navigate to http://localhost:5173/
- [ ] Should redirect to `/login` if not logged in
- [ ] Click "Sign up" link
- [ ] Enter email and password
- [ ] Click "Sign up"
- [ ] **Expected**: Redirected to dashboard or login page
- [ ] Check your email for confirmation link (if email confirmation is enabled)
- [ ] Click confirmation link if received

#### Test Login
- [ ] Go to `/login`
- [ ] Enter your email and password
- [ ] Click "Sign in"
- [ ] **Expected**: Redirected to dashboard
- [ ] Page refresh should keep you logged in

#### Test Logout
- [ ] Click logout button (usually in header/navigation)
- [ ] **Expected**: Redirected to login page
- [ ] Should not be able to access protected routes

#### Test Protected Routes
- [ ] While logged out, try to visit `/library` directly
- [ ] **Expected**: Redirected to login page
- [ ] Try `/drills/new`, `/sessions/new`, etc.
- [ ] **Expected**: All redirect to login when not authenticated

---

### Phase 2: Drill Management Testing ✅

#### Test Add Drill (Image Upload)
1. **Navigate to Add Drill Page**
   - [ ] Click "Add Drill" from dashboard or navigation
   - [ ] Should be at `/drills/new`

2. **Fill Out Form**
   - [ ] Upload an image file (screenshot) - **REQUIRED**
   - [ ] Enter drill name: "Test Ball Mastery Drill"
   - [ ] Select category: "Dribbling"
   - [ ] Enter number of players: 4
   - [ ] Add equipment: "cones", "balls" (press Enter or click Add after each)
   - [ ] Add tags: "beginner", "coordination" (press Enter or click Add after each)
   - [ ] Leave video URL empty (or add optional reference link)

3. **Submit Form**
   - [ ] Click "Create Drill"
   - [ ] **Expected**: Success message or redirect to library
   - [ ] **Expected**: Form clears
   - [ ] **Expected**: Drill appears in library

#### Test Add Drill (Video Upload)
- [ ] Repeat above but upload a video file (MP4, MOV, etc.) instead of image
- [ ] **Expected**: Video uploads successfully
- [ ] **Expected**: Video plays when clicked in library

#### Test Form Validation
- [ ] Try submitting without media file
- [ ] **Expected**: Error message "Please upload a screenshot or video file"
- [ ] Try submitting without drill name
- [ ] **Expected**: Error message "Name is required"
- [ ] Try invalid video URL format
- [ ] **Expected**: Validation error on URL field

#### Test Library View
1. **View All Drills**
   - [ ] Navigate to `/library`
   - [ ] **Expected**: See all your drills displayed in grid
   - [ ] **Expected**: Each drill card shows:
     - Drill name
     - Category badge
     - Equipment tags
     - Tags
     - Number of players

2. **Test Filtering by Category**
   - [ ] Click "activation" filter
   - [ ] **Expected**: Only activation drills shown
   - [ ] Click "dribbling" filter
   - [ ] **Expected**: Only dribbling drills shown
   - [ ] Click "all" filter
   - [ ] **Expected**: All drills shown

3. **Test Search**
   - [ ] Type drill name in search box
   - [ ] **Expected**: Filtered results shown
   - [ ] Type a tag name
   - [ ] **Expected**: Drills with that tag shown
   - [ ] Clear search
   - [ ] **Expected**: All drills shown again

4. **Test Media Display**
   - [ ] Click on an image in a drill card
   - [ ] **Expected**: Image displays/enlarges
   - [ ] Click on a video in a drill card
   - [ ] **Expected**: Video player appears and can play
   - [ ] Click again to close/hide media

5. **Test Delete Drill**
   - [ ] Click "Delete" on a drill
   - [ ] **Expected**: Confirmation dialog appears
   - [ ] Click "OK" to confirm
   - [ ] **Expected**: Drill removed from list
   - [ ] **Expected**: Media file deleted from storage
   - [ ] Verify in Supabase Storage dashboard that file is gone

---

### Phase 3: Session Planning Testing ✅

#### Test Create New Session
1. **Navigate to Session Planner**
   - [ ] Click "Plan Session" from dashboard
   - [ ] Should be at `/sessions/new`
   - [ ] **Expected**: Empty 4x3 grid displayed
   - [ ] **Expected**: Grid shows 4 rows (activation, dribbling, passing, shooting)
   - [ ] **Expected**: Each row has 3 empty cells

2. **Add Drill via Button**
   - [ ] Scroll down to drill library
   - [ ] Find a drill (make sure you have at least one drill in each category)
   - [ ] Click "+ Add to Session" button
   - [ ] **Expected**: Drill appears in first empty cell of correct category row
   - [ ] **Expected**: Can add multiple drills to same category

3. **Add Drill via Drag and Drop**
   - [ ] Click and hold on a drill name in the library
   - [ ] Drag to an empty cell in the correct category row
   - [ ] **Expected**: Cell highlights when dragging over it
   - [ ] Release mouse
   - [ ] **Expected**: Drill placed in that cell
   - [ ] Try dragging to wrong category row
   - [ ] **Expected**: Alert message about category mismatch

4. **Remove Drill from Grid**
   - [ ] Click "×" button on a drill in the grid
   - [ ] **Expected**: Drill removed from grid
   - [ ] Cell becomes empty again

5. **Save Session**
   - [ ] Enter session name: "Monday Training Session"
   - [ ] Add at least one drill to the grid
   - [ ] Click "Save Session"
   - [ ] **Expected**: Redirected to `/sessions` page
   - [ ] **Expected**: New session appears in saved sessions list

#### Test Edit Existing Session
1. **Load Session**
   - [ ] Go to `/sessions`
   - [ ] Click "Edit" on a saved session
   - [ ] **Expected**: Redirected to `/sessions/{id}/edit`
   - [ ] **Expected**: Session name populated
   - [ ] **Expected**: Grid shows drills from saved session

2. **Modify Session**
   - [ ] Add/remove drills
   - [ ] Change session name
   - [ ] Click "Update Session"
   - [ ] **Expected**: Redirected to `/sessions`
   - [ ] **Expected**: Changes saved

---

### Phase 4: Session Management Testing ✅

#### Test Saved Sessions Page
1. **View All Sessions**
   - [ ] Navigate to `/sessions`
   - [ ] **Expected**: All saved sessions displayed
   - [ ] **Expected**: Each session shows:
     - Session name
     - Number of drills
     - Created date
     - Edit, Duplicate, Delete buttons

2. **Test Duplicate Session**
   - [ ] Click "Duplicate" on a session
   - [ ] **Expected**: New session created with "(Copy)" suffix
   - [ ] **Expected**: Same drills in grid
   - [ ] **Expected**: Original session unchanged

3. **Test Delete Session**
   - [ ] Click "🗑️" (delete) on a session
   - [ ] **Expected**: Confirmation dialog
   - [ ] Click "OK"
   - [ ] **Expected**: Session removed from list

4. **Test Empty State**
   - [ ] Delete all sessions
   - [ ] **Expected**: Message "No sessions yet. Create your first session!"
   - [ ] **Expected**: Button to create new session

---

### Phase 5: User Experience Testing ✅

#### Test Loading States
- [ ] Navigate between pages
- [ ] **Expected**: Loading indicators while data fetches
- [ ] Add/delete drills
- [ ] **Expected**: Loading states during operations

#### Test Error Handling
1. **Network Errors**
   - [ ] Disconnect internet
   - [ ] Try to load library
   - [ ] **Expected**: Error message with retry button
   - [ ] Click retry (with internet back on)
   - [ ] **Expected**: Data loads successfully

2. **Form Errors**
   - [ ] Try invalid operations
   - [ ] **Expected**: Clear error messages
   - [ ] Try saving session without name
   - [ ] **Expected**: Alert "Please enter a session name"
   - [ ] Try saving empty session
   - [ ] **Expected**: Alert "Please add at least one drill"

#### Test Responsive Design
1. **Mobile View**
   - [ ] Open browser DevTools (F12)
   - [ ] Toggle device toolbar (Cmd/Ctrl + Shift + M)
   - [ ] Select mobile device (iPhone, etc.)
   - [ ] Test all pages and features
   - [ ] **Expected**: Layout adapts to mobile
   - [ ] **Expected**: Buttons are touch-friendly
   - [ ] **Expected**: Grid stacks vertically on small screens

2. **Tablet View**
   - [ ] Switch to tablet viewport
   - [ ] Test drag-and-drop
   - [ ] **Expected**: Works on touch devices

3. **Desktop View**
   - [ ] Test at different window sizes
   - [ ] **Expected**: Layout maintains usability

---

### Phase 6: Edge Cases & Validation ✅

#### Test Edge Cases
- [ ] Try uploading very large file (>50MB)
- [ ] **Expected**: Should handle gracefully (may take time or show error)
- [ ] Try special characters in drill name/tags
- [ ] **Expected**: Handles properly
- [ ] Fill grid completely (12 drills - 4 rows × 3 columns)
- [ ] **Expected**: No errors
- [ ] Try adding drill to full category row
- [ ] **Expected**: Alert about no empty slots

#### Test Data Persistence
- [ ] Create drills and sessions
- [ ] Refresh page (F5)
- [ ] **Expected**: All data still there
- [ ] Close browser and reopen
- [ ] **Expected**: Still logged in (session persists)
- [ ] Logout and login again
- [ ] **Expected**: All your data visible

---

## Troubleshooting

### Issue: "Supabase environment variables are not set"
**Solution**: 
- Check that `.env` file exists in `soccer-session-planner/` directory
- Verify variable names: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart dev server after adding/editing `.env` file

### Issue: "Failed to fetch" errors
**Solution**:
- Verify Supabase URL and key are correct
- Check Supabase dashboard to ensure project is active
- Verify RLS policies are set up correctly
- Check browser console for specific error messages

### Issue: "Cannot upload file" errors
**Solution**:
- Verify `drill-videos` bucket exists in Storage
- Check storage policies are set up correctly
- Ensure bucket is private (not public)
- Check file size isn't too large

### Issue: Drag and drop not working
**Solution**:
- Ensure `@dnd-kit` packages are installed: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- Clear browser cache
- Try in different browser
- Check browser console for errors

### Issue: Can't see drills from other users
**Solution**: This is **expected behavior** - RLS policies ensure users only see their own data. This is a security feature, not a bug.

### Issue: TypeScript errors
**Solution**:
- Run `npm install` to ensure all dependencies are installed
- Check that all types are imported correctly
- Restart TypeScript server in your editor

---

## Quick Test Script

Run through this quick test to verify everything works:

```bash
# 1. Start dev server
npm run dev

# 2. In browser:
# - Sign up → Create account
# - Add drill → Upload image/video, fill form, submit
# - View library → See drill appears
# - Create session → Add drill to grid, save
# - View sessions → See saved session
# - Edit session → Modify, update
# - Delete session → Remove it
# - Delete drill → Remove it from library
```

---

## Next Steps After Testing

If all tests pass:

1. **Build for Production**:
   ```bash
   npm run build
   ```

2. **Preview Production Build**:
   ```bash
   npm run preview
   ```

3. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```
   - Add environment variables in Vercel dashboard
   - Redeploy if needed

4. **Test Production Deployment**:
   - Run through all test cases again on production URL
   - Test with multiple users if possible

---

## Success Criteria ✅

The app is ready when:
- ✅ Can sign up and log in
- ✅ Can add drills with images/videos
- ✅ Can view, filter, and search drills
- ✅ Can create and save sessions
- ✅ Can edit and delete sessions
- ✅ Drag-and-drop works smoothly
- ✅ Mobile responsive
- ✅ No console errors
- ✅ Error handling works properly

Good luck testing! 🎉

