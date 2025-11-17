# Deployment Guide - Soccer Session Planner

This guide will help you deploy your app to a public server so others can access it.

## Option 1: Deploy to Vercel (Recommended - Easiest & Free)

Vercel is perfect for React/Vite apps and has a free tier that's perfect for testing.

### Prerequisites
- Git repository (GitHub, GitLab, or Bitbucket account)
- Your code pushed to GitHub (recommended)

### Step 1: Push Your Code to GitHub

If you haven't already:

```bash
cd /Users/seijimatsuda/session_planner_Beta

# Initialize git if not already done
git init

# Add all files (except .env files)
git add .
git commit -m "Initial commit - Soccer Session Planner"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/soccer-session-planner.git
git branch -M main
git push -u origin main
```

**Important**: Make sure `.env.local` is in `.gitignore` so you don't commit your secrets!

### Step 2: Create `.gitignore` (if not exists)

```bash
cd soccer-session-planner
cat > .gitignore << 'EOF'
# Environment variables
.env
.env.local
.env.*.local

# Dependencies
node_modules
dist
.DS_Store

# IDE
.vscode
.idea
*.swp
*.swo

# Logs
*.log
npm-debug.log*
EOF
```

### Step 3: Deploy to Vercel

#### Method A: Via Vercel Website (Easiest)

1. **Go to [vercel.com](https://vercel.com)**
   - Sign up or log in (use GitHub account for easiest setup)

2. **Click "Add New..." → "Project"**

3. **Import your GitHub repository**
   - Select your `soccer-session-planner` repository
   - Click "Import"

4. **Configure Project**
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `soccer-session-planner` (if your repo has the folder, or leave blank if repo root is the app)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `dist` (auto-filled)
   - **Install Command**: `npm install` (auto-filled)

5. **Add Environment Variables**
   - Click "Environment Variables"
   - Add these two variables:
     ```
     Name: VITE_SUPABASE_URL
     Value: https://qgxlakultcwqznidazhx.supabase.co
     ```
     ```
     Name: VITE_SUPABASE_ANON_KEY
     Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFneGxha3VsdGN3cXpuaWRhemh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NzI3MTMsImV4cCI6MjA3ODU0ODcxM30.ZR7cDwEhH57ZC7mhUWCJuSQYTLEx8JQKNF4vwm3XfFE
     ```
   - Make sure both are set for **Production**, **Preview**, and **Development**

6. **Click "Deploy"**

7. **Wait for deployment** (usually 1-2 minutes)

8. **Get your URL!**
   - Vercel will give you a URL like: `https://soccer-session-planner.vercel.app`
   - This is your live site! Share it with anyone.

#### Method B: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to your project
cd soccer-session-planner

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name? soccer-session-planner
# - Directory? ./ (current directory)
# - Override settings? N

# Add environment variables
vercel env add VITE_SUPABASE_URL
# Paste: https://qgxlakultcwqznidazhx.supabase.co
# Apply to: Production, Preview, Development

vercel env add VITE_SUPABASE_ANON_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
# Apply to: Production, Preview, Development

# Deploy to production
vercel --prod
```

### Step 4: Update Deployment Settings (If Needed)

If your repo structure is:
```
session_planner_Beta/
  soccer-session-planner/  <-- Your app is here
    src/
    package.json
    ...
```

Then in Vercel:
- Go to Project Settings → General
- Set **Root Directory** to: `soccer-session-planner`

### Step 5: Custom Domain (Optional)

Vercel gives you a free `.vercel.app` domain, but you can add a custom domain:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

---

## Option 2: Deploy to Netlify (Alternative - Also Free)

### Step 1: Push to GitHub (same as above)

### Step 2: Deploy via Netlify Website

1. **Go to [netlify.com](https://netlify.com)**
   - Sign up or log in (use GitHub)

2. **Click "Add new site" → "Import an existing project"**

3. **Choose GitHub** and select your repository

4. **Configure build settings:**
   - **Base directory**: `soccer-session-planner` (if needed)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

5. **Add Environment Variables:**
   - Go to Site settings → Environment variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

6. **Deploy!**
   - Your site will be live at: `https://random-name-123.netlify.app`

### Step 3: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd soccer-session-planner
netlify deploy --prod

# Add environment variables
netlify env:set VITE_SUPABASE_URL "https://qgxlakultcwqznidazhx.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-key-here"
```

---

## Option 3: Deploy to Render (Alternative)

1. **Go to [render.com](https://render.com)**
   - Sign up (free tier available)

2. **Create new Static Site**

3. **Connect your GitHub repository**

4. **Configure:**
   - **Name**: soccer-session-planner
   - **Build Command**: `cd soccer-session-planner && npm install && npm run build`
   - **Publish Directory**: `soccer-session-planner/dist`

5. **Add Environment Variables** in the dashboard

6. **Deploy!**

---

## After Deployment Checklist

### ✅ Verify Deployment Works

1. **Visit your deployed URL**
   - Should load without errors

2. **Test Authentication**
   - [ ] Can sign up
   - [ ] Can log in
   - [ ] Session persists

3. **Test Core Features**
   - [ ] Can add drill
   - [ ] Can view library
   - [ ] Can create session
   - [ ] Can save session

4. **Check Browser Console**
   - Open DevTools (F12)
   - No red errors
   - Check Network tab for failed requests

### ✅ Security Reminders

- ✅ Environment variables are set in Vercel/Netlify (not in code)
- ✅ `.env.local` is in `.gitignore` (not committed)
- ✅ Supabase RLS policies protect user data

### ✅ Share Your Site

Once deployed, you'll get a URL like:
- `https://soccer-session-planner.vercel.app` (Vercel)
- `https://soccer-session-planner.netlify.app` (Netlify)

**Share this URL with anyone!** They can access your app from anywhere.

---

## Troubleshooting Deployment

### Issue: "Environment variable not set"
**Fix**: 
- Go to Vercel/Netlify dashboard
- Add environment variables
- Redeploy

### Issue: "Build failed"
**Fix**:
- Check build logs in deployment dashboard
- Make sure `npm run build` works locally first
- Verify all dependencies are in `package.json`

### Issue: "404 on routes"
**Fix**: 
- For Vercel: Create `vercel.json` in root:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
- For Netlify: Create `public/_redirects` file:
```
/*    /index.html   200
```

### Issue: "CORS errors"
**Fix**: 
- Check Supabase CORS settings
- Make sure your domain is allowed in Supabase dashboard

---

## Recommended: Continuous Deployment

Once set up, every time you push to GitHub:
- ✅ Vercel/Netlify automatically rebuilds and deploys
- ✅ You get preview URLs for pull requests
- ✅ Production updates automatically

---

## Quick Command Summary

```bash
# Deploy to Vercel (once set up)
vercel --prod

# Deploy to Netlify (once set up)
netlify deploy --prod

# Build locally to test before deploying
cd soccer-session-planner
npm run build
npm run preview  # Test production build locally
```

---

## Cost

All these options have **free tiers** that are perfect for:
- ✅ Personal projects
- ✅ Testing and demos
- ✅ Sharing with friends/team

Free tiers typically include:
- Custom domain support
- HTTPS (SSL) automatically
- CDN (fast global access)
- Generous bandwidth limits

---

## Next Steps

1. **Choose a platform** (Vercel recommended for easiest setup)
2. **Push code to GitHub** (if not already)
3. **Deploy** (follow steps above)
4. **Share your URL!** 🎉

Your app will be live and accessible to anyone with the URL!

