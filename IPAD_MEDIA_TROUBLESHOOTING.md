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

1. **Check Supabase Dashboard:**
   - Go to Storage → drill-videos
   - Try downloading a file manually
   - If that works, issue is with signed URLs/CORS

2. **Try Public Bucket (Temporary Test):**
   - Make bucket public temporarily
   - Update code to use `getPublicUrl` instead
   - If this works, issue is with signed URL generation

3. **Check Environment Variables:**
   - Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
   - Check they're set in Vercel environment variables

4. **Contact Support:**
   - Check Supabase status page
   - Review Supabase documentation on storage CORS
   - Consider Supabase support if issue persists

## Alternative Solutions

If signed URLs continue to fail on iOS:

1. **Use Public Bucket:** Make bucket public (less secure but works reliably)
2. **Proxy Through Backend:** Create API endpoint that serves media
3. **Use CDN:** Use Cloudflare or similar CDN in front of Supabase storage
4. **Base64 Encoding:** For small images, embed as base64 (not recommended for videos)

