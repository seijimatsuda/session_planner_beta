import { supabase } from '../lib/supabase'

// Get backend URL from environment variable
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

// Detect if running on iOS/iPad
const isIOS = () => {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// Get authentication token for backend requests
async function getAuthToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session?.access_token) {
    throw new Error('Not authenticated')
  }
  return session.access_token
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

    console.log('[Storage] Getting URL for path:', cleanPath, 'iOS:', isIOS(), 'Backend URL:', BACKEND_URL ? 'configured' : 'NOT SET')

    // Use backend proxy if backend URL is configured
    if (BACKEND_URL) {
      try {
        const token = await getAuthToken()
        // Encode each path segment separately to preserve slashes for Express routing
        // e.g., "userId/video.mp4" -> "userId/video.mp4" (not "userId%2Fvideo.mp4")
        const encodedPath = cleanPath.split('/').map(segment => encodeURIComponent(segment)).join('/')
        const proxyUrl = `${BACKEND_URL}/api/media/${encodedPath}?token=${encodeURIComponent(token)}`
        console.log('[Storage] Using backend proxy URL:', proxyUrl.substring(0, 100) + '...')
        return proxyUrl
      } catch (error) {
        console.error('[Storage] Failed to get auth token for backend proxy:', error)
        // Fall through to signed URL approach if backend fails
      }
    } else {
      console.warn('[Storage] VITE_BACKEND_URL not configured - falling back to Supabase signed URLs (may not work on iOS)')
    }
    
    // Fallback to Supabase signed URLs if backend is not configured
    console.log('[Storage] Falling back to Supabase signed URL')
    
    // Check authentication state
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Error getting auth session:', sessionError)
    }
    
    // For iOS, use longer expiration
    if (isIOS()) {
      expiresInSeconds = Math.max(expiresInSeconds, 7200) // At least 2 hours for iOS
    }

    const { data, error } = await supabase.storage
      .from('drill-videos')
      .createSignedUrl(cleanPath, expiresInSeconds)

    if (error) {
      console.error('[Storage] Supabase storage error:', {
        error,
        message: error.message,
        statusCode: (error as any).statusCode,
        path: cleanPath,
        authenticated: !!session,
      })
      throw error
    }
    
    if (!data?.signedUrl) {
      console.error('[Storage] No signed URL in response:', data)
      throw new Error('No signed URL returned from Supabase')
    }
    
    const url = data.signedUrl.trim()
    console.log('[Storage] Generated signed URL:', url.substring(0, 100) + '...')
    return url
  },

  async deleteVideo(path: string): Promise<void> {
    const { error } = await supabase.storage.from('drill-videos').remove([path])
    if (error) throw error
  },
}

