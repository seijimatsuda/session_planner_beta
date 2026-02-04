# Backend Proxy Setup for iOS Media Compatibility

This document explains the backend proxy solution implemented to fix iOS media loading issues.

## Overview

The backend proxy serves media files from Supabase Storage through our Express backend, solving iOS Safari CORS issues with signed URLs. Instead of direct Supabase URLs, media is served via: `BACKEND_URL/api/media/:path?token=TOKEN`

## Architecture

```
iOS Device → Backend Proxy (Render) → Supabase Storage → Backend Proxy → iOS Device
```

**Key Benefits:**
- ✅ Full control over CORS headers
- ✅ Works on iOS Safari (no CORS issues)
- ✅ Authentication handled via token in URL query parameter
- ✅ Falls back to Supabase signed URLs if backend not configured

## Backend Implementation

### Route: `GET /api/media/:path`

**Location:** `backend/src/routes/media.ts`

**Authentication:**
- Accepts token via `Authorization: Bearer TOKEN` header OR `?token=TOKEN` query parameter
- Query parameter is used because `<img>` and `<video>` tags can't send custom headers
- Verifies token with Supabase before serving file

**Security:**
- Validates file path to prevent directory traversal attacks
- Requires authenticated user
- Uses Supabase service role key to fetch files

**Response Headers:**
- `Content-Type`: Automatically detected from file extension
- `Access-Control-Allow-Origin`: Set based on request origin
- `Cache-Control`: `public, max-age=3600` (1 hour cache)
- Proper CORS headers for iOS compatibility

## Frontend Implementation

### Storage Service Updates

**Location:** `soccer-session-planner/src/services/storage.ts`

**Changes:**
- `getVideoUrl()` now checks for `VITE_BACKEND_URL` environment variable
- If backend URL is configured, returns proxy URL: `${BACKEND_URL}/api/media/${path}?token=${token}`
- Falls back to Supabase signed URLs if backend not configured (backward compatible)

## Environment Variables

### Backend (Render)

Already configured in `render.yaml`:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DRILL_STORAGE_BUCKET` (defaults to `drill-videos`)

### Frontend

**New environment variable required:**

```bash
VITE_BACKEND_URL=https://your-backend.onrender.com
```

**Where to set:**
1. **Local development** - Add to `soccer-session-planner/.env.local`:
   ```
   VITE_BACKEND_URL=http://localhost:3000
   ```

2. **Vercel deployment** - Add in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `VITE_BACKEND_URL` with your Render backend URL
   - Apply to Production, Preview, and Development environments

**Example values:**
- Local: `http://localhost:3000`
- Render: `https://session-planner-backend-xxxx.onrender.com`
- Custom domain: `https://api.yourdomain.com`

## Deployment Steps

### 1. Deploy Backend Changes

The backend changes are ready. Deploy to Render:
```bash
cd backend
git add .
git commit -m "Add media proxy route for iOS compatibility"
git push
```

Render will automatically rebuild and deploy.

### 2. Get Backend URL

After deployment, note your Render backend URL:
- Go to Render dashboard
- Find your `session-planner-backend` service
- Copy the URL (e.g., `https://session-planner-backend-xxxx.onrender.com`)

### 3. Update Frontend Environment Variables

**In Vercel:**
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add: `VITE_BACKEND_URL` = your Render backend URL
4. Apply to all environments (Production, Preview, Development)
5. **Redeploy** the frontend

**For local development:**
Add to `soccer-session-planner/.env.local`:
```bash
VITE_BACKEND_URL=http://localhost:3000
```

### 4. Test

1. **Test locally:**
   - Start backend: `cd backend && npm run dev`
   - Start frontend: `cd soccer-session-planner && npm run dev`
   - Test media loading in browser
   - Check browser console for `[Storage] Using backend proxy URL` logs

2. **Test on iOS:**
   - Deploy to production
   - Test on iPad/iPhone Safari
   - Media should load without CORS errors

## How It Works

### Flow Diagram

```
1. User loads page with drills
   ↓
2. Frontend calls storageService.getVideoUrl(path)
   ↓
3. Storage service checks for VITE_BACKEND_URL
   ↓
4a. If configured:
    - Gets user's auth token from Supabase session
    - Returns: BACKEND_URL/api/media/path?token=TOKEN
   ↓
4b. If not configured:
    - Falls back to Supabase signed URL (original behavior)
   ↓
5. Browser makes request to proxy URL
   ↓
6. Backend:
    - Validates token with Supabase
    - Fetches file from Supabase Storage (service role)
    - Streams file with proper CORS headers
   ↓
7. Media displays in browser
```

### Token in URL Query Parameter

**Why?**
- `<img>` and `<video>` HTML elements can't send custom headers
- Browser makes the request automatically when `src` is set
- Token in query parameter is the only way to authenticate

**Security:**
- Tokens are short-lived (expire with Supabase session)
- HTTPS encrypts the URL (token not visible in transit)
- Backend validates token before serving file
- File paths are validated to prevent traversal attacks

**Note:** Tokens will be visible in:
- Browser developer tools (Network tab)
- Server access logs
- This is acceptable for short-lived session tokens

## Troubleshooting

### Media Still Not Loading

1. **Check backend URL is set:**
   ```javascript
   console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL)
   ```

2. **Check browser console for errors:**
   - Look for `[Storage]` logs
   - Should see "Using backend proxy URL" message
   - Check Network tab for 401/404 errors

3. **Verify backend is running:**
   - Test: `curl https://your-backend.onrender.com/healthz`
   - Should return `{"status":"ok"}`

4. **Check backend logs:**
   - Go to Render dashboard → Logs
   - Look for `[media-proxy]` log messages
   - Check for authentication errors

5. **Verify token is valid:**
   - Check browser console for auth errors
   - User must be logged in
   - Token expires with session

### CORS Errors

If you see CORS errors:
- Check backend is returning proper CORS headers
- Verify `Access-Control-Allow-Origin` header is present
- Check backend logs for errors

### 401 Unauthorized

- User not logged in (token missing/invalid)
- Check Supabase authentication state
- Verify token is being passed correctly

### 404 Not Found

- File path might be incorrect
- Check file exists in Supabase Storage
- Verify path format: `userId/timestamp.extension`

### Backend Returns Error

- Check Render logs for detailed error messages
- Verify Supabase credentials are correct
- Check storage bucket name matches `DRILL_STORAGE_BUCKET`

## Rollback Plan

If backend proxy causes issues, you can rollback:

1. **Remove `VITE_BACKEND_URL` from Vercel environment variables**
2. **Redeploy frontend**
3. Frontend will automatically fall back to Supabase signed URLs
4. No code changes needed (backward compatible)

## Performance Considerations

- **Latency:** Extra hop through backend (minimal, backend is on Render's CDN)
- **Bandwidth:** Media passes through backend (costs on Render)
- **Caching:** Backend sets 1-hour cache headers (browsers cache responses)
- **Scalability:** Render handles scaling automatically

## Security Best Practices

✅ **Implemented:**
- Token validation before serving files
- Path validation (prevents directory traversal)
- HTTPS required (Render provides SSL)
- Short-lived tokens (expire with session)

⚠️ **Considerations:**
- Tokens visible in URLs (acceptable for session tokens)
- Monitor for abuse (rate limiting can be added)
- Consider IP-based rate limiting for production

## Future Improvements

Possible enhancements:
1. **Caching:** Cache files in backend (Redis/CDN)
2. **Compression:** Compress images on-the-fly
3. **Rate limiting:** Add per-user/IP rate limits
4. **CDN:** Use Cloudflare/CDN in front of backend
5. **Token signing:** Use JWT signing for tokens (instead of Supabase tokens)

## Support

If issues persist:
1. Check browser console logs
2. Check Render backend logs
3. Verify environment variables are set correctly
4. Test with backend proxy disabled (remove `VITE_BACKEND_URL`) to isolate issue


