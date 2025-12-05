import { supabase } from '../lib/supabase'

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

  async getVideoUrl(path: string, expiresInSeconds = 60): Promise<string> {
    try {
      // Ensure path is properly formatted (no leading slash)
      const cleanPath = path.startsWith('/') ? path.slice(1) : path
      
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
    } catch (error) {
      console.error('Error creating signed URL:', error, 'Path:', path)
      throw error
    }
  },

  async deleteVideo(path: string): Promise<void> {
    const { error } = await supabase.storage.from('drill-videos').remove([path])
    if (error) throw error
  },
}

