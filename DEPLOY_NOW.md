# Deploy Your New Features

Your code is now pushed to GitHub! ✅

## If You Already Have Vercel Connected

**Step 1:** Check if Vercel is auto-deploying:
1. Go to https://vercel.com
2. Log in
3. Click on your project (session_planner_beta or similar)
4. Look at the "Deployments" tab
5. You should see a new deployment starting automatically (from your push)

**Step 2:** Wait 2-3 minutes for deployment to complete

**Step 3:** Visit your deployed website URL (shown in Vercel dashboard)

**Done!** Your new features will be live on the deployed site.

---

## If You DON'T Have Vercel Set Up Yet

### Option 1: Quick Deploy to Vercel (Recommended)

**Step 1:** Go to https://vercel.com and log in (or sign up - free)

**Step 2:** Click "Add New..." → "Project"

**Step 3:** Import your GitHub repository:
- Select "seijimatsuda/session_planner_beta" from the list
- Click "Import"

**Step 4:** Configure the project:
- **Framework Preset:** Vite
- **Root Directory:** `soccer-session-planner` (IMPORTANT!)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

**Step 5:** Add Environment Variables:
Click "Environment Variables" and add:
- `VITE_SUPABASE_URL` = your Supabase URL
- `VITE_SUPABASE_ANON_KEY` = your Supabase Anon Key

(Get these from your `.env.local` file or Supabase dashboard)

**Step 6:** Click "Deploy"

**Step 7:** Wait 2-3 minutes for deployment

**Step 8:** Visit your new website URL (Vercel will give you a URL like `https://your-app.vercel.app`)

---

## Important: SQL Migrations Already Done!

**Good news:** The SQL migrations you ran earlier in Supabase apply to BOTH local and production because:
- Supabase is a cloud database
- Both local and deployed apps use the same Supabase project
- So the shared access policies are already active on production! ✅

**You don't need to run the SQL migrations again.**

---

## After Deployment - Test

1. Visit your deployed website URL
2. Log in
3. Test the new features:
   - See all drills from all users
   - See all sessions from all users
   - View session detail page (click a session)
   - Click drill in session view to see modal
   - Edit/delete any drill or session

---

## Quick Checklist

- [x] Code pushed to GitHub
- [ ] Deployed to Vercel (if not auto-deploying)
- [ ] Environment variables set in Vercel
- [ ] Root directory set to `soccer-session-planner`
- [ ] Deployment successful
- [ ] Tested on deployed site

---

## Troubleshooting

**If deployment fails:**
- Check Vercel build logs for errors
- Make sure Root Directory is set to `soccer-session-planner`
- Verify environment variables are set correctly

**If features don't work on deployed site:**
- Check that SQL migrations were run in Supabase (they should be)
- Check browser console for errors
- Verify environment variables in Vercel match your `.env.local`

---

Your website should be live with all new features! 🚀


