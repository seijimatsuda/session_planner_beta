# Step-by-Step: Running the New Version

Follow these steps in order. Complete each step before moving to the next.

## Part 1: Navigate to Project Directory

**Step 1.1:** Open Terminal (on Mac: Press `Cmd + Space`, type "Terminal", press Enter)

**Step 1.2:** Type this command and press Enter:
```bash
cd /Users/seijimatsuda/session_planner_Beta
```

**Step 1.3:** Verify you're in the right place. Type this and press Enter:
```bash
pwd
```
You should see: `/Users/seijimatsuda/session_planner_Beta`

**Step 1.4:** List files to verify the folder structure. Type this and press Enter:
```bash
ls
```
You should see folders like `soccer-session-planner`, `SHARED_ACCESS_MIGRATION.sql`, etc.

---

## Part 2: Navigate to Frontend Directory

**Step 2.1:** Type this command and press Enter:
```bash
cd soccer-session-planner
```

**Step 2.2:** Verify you're in the frontend folder. Type this and press Enter:
```bash
pwd
```
You should see: `/Users/seijimatsuda/session_planner_Beta/soccer-session-planner`

**Step 2.3:** List files. Type this and press Enter:
```bash
ls
```
You should see `package.json`, `src`, `node_modules`, etc.

---

## Part 3: Install Dependencies (If Needed)

**Step 3.1:** Check if node_modules exists. Type this and press Enter:
```bash
ls node_modules
```

**Step 3.2a:** If you see a list of folders, dependencies are already installed. Skip to Part 4.

**Step 3.2b:** If you see "No such file or directory", install dependencies:
Type this and press Enter:
```bash
npm install
```
Wait for it to finish (may take 1-2 minutes). You'll see many lines of text scrolling.

---

## Part 4: Set Up Environment Variables

**Step 4.1:** Check if `.env.local` file exists. Type this and press Enter:
```bash
ls -la | grep .env
```

**Step 4.2a:** If you see `.env.local`, skip to Step 4.5.

**Step 4.2b:** If you don't see `.env.local`, create it:
Type this and press Enter:
```bash
touch .env.local
```

**Step 4.3:** Open the file in your editor:
- Option A (VS Code): Type `code .env.local` and press Enter
- Option B (nano editor): Type `nano .env.local` and press Enter
- Option C (other editor): Open it manually from your file browser

**Step 4.4:** Add these two lines to the file (replace with your actual values):
```
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Step 4.5:** Get your Supabase URL:
1. Go to https://supabase.com in your browser
2. Log in
3. Click on your project
4. Click "Settings" (gear icon in left sidebar)
5. Click "API" under Settings
6. Under "Project URL", copy the URL (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
7. Paste it in `.env.local` where it says `your_supabase_project_url_here`

**Step 4.6:** Get your Supabase Anon Key:
1. Still on the API settings page
2. Under "Project API keys", find the `anon` `public` key
3. Click the eye icon or "Reveal" to see the full key
4. Copy the entire key (long string of characters)
5. Paste it in `.env.local` where it says `your_supabase_anon_key_here`

**Step 4.7:** Save the file:
- VS Code: Press `Cmd + S`
- nano: Press `Ctrl + X`, then `Y`, then Enter
- Other: Use your editor's save command

**Step 4.8:** Verify the file content. Type this and press Enter:
```bash
cat .env.local
```
You should see your two environment variables (the key will be partially hidden, that's fine).

---

## Part 5: Run SQL Migrations in Supabase

**Step 5.1:** Open Supabase Dashboard:
1. Go to https://supabase.com in your browser
2. Log in
3. Click on your project

**Step 5.2:** Open SQL Editor:
1. Click "SQL Editor" in the left sidebar (icon looks like a document)
2. Click "New query" button

**Step 5.3:** Run the Shared Access Migration:
1. In your Terminal, type this and press Enter:
```bash
cat ../SHARED_ACCESS_MIGRATION.sql
```
2. Copy ALL the output (from Terminal)
3. Paste it into the Supabase SQL Editor
4. Click "Run" button (or press `Cmd + Enter`)
5. Wait for "Success. No rows returned" message at the bottom

**Step 5.4:** Run the Shared Storage Migration:
1. In your Terminal, type this and press Enter:
```bash
cat ../SHARED_STORAGE_MIGRATION.sql
```
2. Copy ALL the output (from Terminal)
3. In Supabase SQL Editor, click "New query" button
4. Paste the SQL code
5. Click "Run" button (or press `Cmd + Enter`)
6. Wait for "Success. No rows returned" message

**Step 5.5:** Verify migrations worked:
1. In Supabase, click "Database" in left sidebar
2. Click "Policies" (under Database)
3. You should see new policies like "All authenticated users can view drills"
4. If you see them, migrations succeeded ✅

---

## Part 6: Start the Development Server

**Step 6.1:** Go back to Terminal (make sure you're in `/Users/seijimatsuda/session_planner_Beta/soccer-session-planner`)

**Step 6.2:** Type this and press Enter:
```bash
npm run dev
```

**Step 6.3:** Wait for the server to start. You'll see output like:
```
  VITE v7.2.2  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Step 6.4:** The website is now running!

---

## Part 7: Open the Website

**Step 7.1:** Open your web browser (Chrome, Firefox, Safari, etc.)

**Step 7.2:** Click on the address bar at the top

**Step 7.3:** Type this and press Enter:
```
http://localhost:5173
```

**Step 7.4:** The website should load! You should see a login/signup page or dashboard (depending on if you're logged in).

---

## Troubleshooting

### If "npm run dev" gives an error:

**Error: "command not found: npm"**
- Solution: Install Node.js from https://nodejs.org

**Error: "Cannot find module..."**
- Solution: Run `npm install` again (see Part 3)

**Error: "VITE_SUPABASE_URL is not defined"**
- Solution: Check your `.env.local` file exists and has the correct values (see Part 4)

### If the website shows a blank page:

**Check the Terminal** for error messages. Common issues:
- Missing environment variables
- Supabase connection issue

### If you see database errors:

**Check Supabase Dashboard:**
1. Go to SQL Editor
2. Run this to check policies:
```sql
SELECT * FROM pg_policies WHERE tablename IN ('drills', 'sessions');
```
You should see the new shared access policies.

---

## Stopping the Server

When you're done testing:

**Step 1:** Go to the Terminal window

**Step 2:** Press `Ctrl + C` (hold Control key, press C)

**Step 3:** The server will stop. You can close the Terminal or run `npm run dev` again later.

---

## Quick Reference

**To start the website again later:**
```bash
cd /Users/seijimatsuda/session_planner_Beta/soccer-session-planner
npm run dev
```

**To check if dependencies are installed:**
```bash
ls node_modules
```

**To check environment variables:**
```bash
cat .env.local
```

**To see all project files:**
```bash
cd /Users/seijimatsuda/session_planner_Beta
ls
```

