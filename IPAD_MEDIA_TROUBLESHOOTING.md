# iPad/iOS Media Loading Troubleshooting Guide

## Common Issues and Solutions

### Issue: Images/Videos Show Blank Grey Screen on iPad

This is a known issue with iOS Safari and Supabase signed URLs. Here are the potential causes and solutions:

## Potential Causes

### 1. **CORS Configuration Missing**
iOS Safari is very strict about CORS. If Supabase storage bucket doesn't have proper CORS headers, media won't load.

**Solution:** Configure CORS in Supabase Dashboard:
1. Go to Supabase Dashboard → Storage → Settings
2. Find CORS configuration
3. Add your domain (e.g., `https://your-app.vercel.app`)
4. Allow methods: `GET, HEAD`
5. Allow headers: `*` or specific headers
6. Save changes

### 2. **Signed URL Expiration**
Signed URLs expire after a set time. iOS Safari might cache failed requests.

**Solution:** The code now:
- Uses longer expiration times (2 hours) for iOS devices
- Automatically refreshes URLs on error
- Implements retry logic with exponential backoff

### 3. **Storage Bucket Privacy Settings**
If the bucket is private, signed URLs are required. If public, we can use public URLs.

**Solution Options:**
- **Option A (Recommended):** Keep bucket private, ensure CORS is configured
- **Option B:** Make bucket public (less secure but simpler for media)

### 4. **iOS Safari Cache Issues**
iOS Safari aggressively caches failed requests.

**Solution:**
- Clear Safari cache on iPad: Settings → Safari → Clear History and Website Data
- Or use private browsing mode to test

### 5. **Network/Security Restrictions**
Corporate networks or VPNs might block Supabase URLs.

**Solution:** Test on different networks (WiFi vs cellular)

## Code Improvements Made

1. **iOS Detection:** Automatically detects iOS/iPad devices
2. **Retry Logic:** Automatically retries failed URL generation (up to 3 times)
3. **URL Refresh:** Automatically refreshes URLs if media fails to load
4. **Longer Expiration:** Uses 2-hour expiration for iOS (vs 1 hour for others)
5. **Public URL Fallback:** Tries public URLs first if available
6. **Better Error Handling:** Comprehensive error logging for debugging

## Manual Testing Steps

1. **Check Browser Console:**
   - Connect iPad to Mac
   - Enable Web Inspector: Settings → Safari → Advanced → Web Inspector
   - Open Safari on Mac: Develop → [Your iPad] → [Your Site]
   - Check console for errors

2. **Test URL Directly:**
   - Copy the signed URL from console
   - Paste in Safari address bar on iPad
   - See if it loads directly

3. **Check Network Tab:**
   - In Web Inspector, check Network tab
   - Look for failed requests
   - Check response headers for CORS errors

## Supabase Configuration Checklist

- [ ] Storage bucket `drill-videos` exists
- [ ] CORS is configured for your domain
- [ ] Storage policies allow authenticated users to read
- [ ] Bucket is set to private (for security)
- [ ] Test signed URL generation works in Supabase dashboard

## If Still Not Working

### Step 1: Check Browser Console on iPad

**This is the most important step!**

1. **Connect iPad to Mac:**
   - On iPad: Settings → Safari → Advanced → Web Inspector (enable)
   - On Mac: Open Safari → Develop menu → [Your iPad] → [Your Site]

2. **Look for these specific errors:**
   - `[Storage]` - Shows URL generation attempts
   - `[DrillCard]` - Shows media loading attempts
   - CORS errors (will say "CORS" or "Access-Control-Allow-Origin")
   - Network errors (404, 403, 401)
   - Authentication errors

3. **Check Network Tab:**
   - Look for requests to Supabase storage URLs
   - Check response status codes
   - Check response headers (look for CORS headers)

### Step 2: Verify Authentication

The console logs now show `Authenticated: true/false`. If it shows `false`:
- User might not be logged in
- Session might have expired
- Try logging out and back in

### Step 3: Test URL Generation

Check console for:
- `[Storage] Getting URL for path:` - Should show the path
- `[Storage] Generated signed URL` - Should show the URL
- If you see errors here, the issue is with Supabase API

### Step 4: Test URL Directly

1. Copy a signed URL from console logs
2. Paste in Safari address bar on iPad
3. **If URL loads directly:**
   - Issue is in the app code (media element handling)
   - Check video/image element errors in console
4. **If URL doesn't load:**
   - Issue is with Supabase/CORS/Storage policies
   - Check Supabase dashboard

### Step 5: Check Supabase Storage Policies

Go to Supabase Dashboard → Storage → Policies:

**Required Policy for Signed URLs:**
```sql
-- Allow authenticated users to read all files
CREATE POLICY "Authenticated users can read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'drill-videos');
```

**Check if policy exists:**
- Go to Storage → drill-videos → Policies
- Should see a SELECT policy for authenticated users
- If missing, create it using SQL Editor

### Step 6: Check CORS Configuration

**Critical for iOS!**

1. Go to Supabase Dashboard → Storage → Settings
2. Find "CORS Configuration" or "Allowed Origins"
3. Add your Vercel domain: `https://your-app.vercel.app`
4. Also add: `https://*.vercel.app` (for preview deployments)
5. Allow methods: `GET, HEAD, OPTIONS`
6. Allow headers: `*` or `Authorization, Content-Type`
7. **Save and wait 1-2 minutes for changes to propagate**

### Step 7: Check Environment Variables

In Vercel Dashboard:
- Go to Settings → Environment Variables
- Verify `VITE_SUPABASE_URL` is correct
- Verify `VITE_SUPABASE_ANON_KEY` is correct
- **Redeploy after changing environment variables**

### Step 8: Test with Public Bucket (Diagnostic)

**Temporary test to isolate the issue:**

1. In Supabase Dashboard → Storage → drill-videos
2. Click "Make Public" (temporarily)
3. The code will automatically try public URLs first on iOS
4. If this works, the issue is with signed URL generation
5. **Remember to make it private again after testing!**

### Step 9: Check File Path Format

Console logs show the path being used. Verify:
- Path should be: `userId/timestamp.extension`
- No leading slash
- No special characters that need encoding

### Step 10: Network/Device Issues

- Try different WiFi network
- Try cellular data
- Try different iPad
- Clear Safari cache: Settings → Safari → Clear History
- Try incognito/private browsing mode

## Alternative Solutions

If signed URLs continue to fail on iOS:

1. **Use Public Bucket:** Make bucket public (less secure but works reliably)
2. **Proxy Through Backend:** Create API endpoint that serves media
3. **Use CDN:** Use Cloudflare or similar CDN in front of Supabase storage
4. **Base64 Encoding:** For small images, embed as base64 (not recommended for videos)

