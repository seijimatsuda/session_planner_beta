import { supabase } from '../lib/supabase'

export const storageService = {
  async uploadVideo(file: File, userId: string): Promise<string> {
    const extension = file.name.split('.').pop() ?? 'mp4'
    const fileName = `${userId}/${Date.now()}.${extension}`

    const { error } = await supabase.storage.from('drill-videos').upload(fileName, file)
    if (error) throw error

    return fileName
  },

  async getVideoUrl(path: string, expiresInSeconds = 60): Promise<string> {
    const { data, error } = await supabase.storage
      .from('drill-videos')
      .createSignedUrl(path, expiresInSeconds)

    if (error) throw error
    return data.signedUrl
  },

  async deleteVideo(path: string): Promise<void> {
    const { error } = await supabase.storage.from('drill-videos').remove([path])
    if (error) throw error
  },
}

