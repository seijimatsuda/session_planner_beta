import { supabase } from '../lib/supabase'

// Detect if running on iOS/iPad
const isIOS = () => {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// Retry function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
  throw new Error('Max retries exceeded')
}

export const storageService = {
  async uploadMedia(file: File, userId: string): Promise<string> {
    const extension = file.name.split('.').pop() ?? (file.type.startsWith('image/') ? 'jpg' : 'mp4')
    const fileName = `${userId}/${Date.now()}.${extension}`

    const { error } = await supabase.storage.from('drill-videos').upload(fileName, file)
    if (error) throw error

    return fileName
  },

  async uploadVideo(file: File, userId: string): Promise<string> {
    // Legacy method for backward compatibility
    return this.uploadMedia(file, userId)
  },

  // Try to get public URL first (if bucket is public), then fall back to signed URL
  async getPublicUrl(path: string): Promise<string | null> {
    try {
      const cleanPath = path.startsWith('/') ? path.slice(1) : path
      const { data } = supabase.storage
        .from('drill-videos')
        .getPublicUrl(cleanPath)
      
      return data?.publicUrl || null
    } catch {
      return null
    }
  },

  async getVideoUrl(path: string, expiresInSeconds = 60): Promise<string> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    
    // For iOS, try multiple approaches
    if (isIOS()) {
      // Approach 1: Try public URL first (if bucket allows)
      try {
        const publicUrl = await this.getPublicUrl(cleanPath)
        if (publicUrl) {
          // For iOS, try public URL (no-cors mode won't throw on failure, but that's okay)
          // We'll let the browser try to load it
          return publicUrl
        }
      } catch {
        // Continue to signed URL approach
      }
      
      // Approach 2: Use signed URL with longer expiration for iOS
      // iOS Safari is more strict, so use longer expiration
      expiresInSeconds = Math.max(expiresInSeconds, 7200) // At least 2 hours for iOS
    }

    // Use retry logic for signed URLs
    return retryWithBackoff(async () => {
      const { data, error } = await supabase.storage
        .from('drill-videos')
        .createSignedUrl(cleanPath, expiresInSeconds)

      if (error) {
        console.error('Supabase storage error:', error, 'Path:', cleanPath)
        throw error
      }
      
      if (!data?.signedUrl) {
        throw new Error('No signed URL returned from Supabase')
      }
      
      // Ensure URL is properly formatted
      const url = data.signedUrl.trim()
      
      // Validate URL format
      try {
        new URL(url)
      } catch {
        throw new Error('Invalid URL format returned from Supabase')
      }
      
      return url
    }, isIOS() ? 3 : 1) // More retries for iOS
  },

  async deleteVideo(path: string): Promise<void> {
    const { error } = await supabase.storage.from('drill-videos').remove([path])
    if (error) throw error
  },
}

