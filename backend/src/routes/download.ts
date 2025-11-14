import { Router } from 'express'
import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const router = Router()
const execFileAsync = promisify(execFile)

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const STORAGE_BUCKET = process.env.DRILL_STORAGE_BUCKET ?? 'drill-videos'
const YT_DLP_BIN = process.env.YT_DLP_BIN ?? 'yt-dlp'
const FFMPEG_BIN = process.env.FFMPEG_BIN ?? 'ffmpeg'
const MAX_FILE_BYTES = Number(process.env.MAX_DOWNLOAD_BYTES ?? 50 * 1024 * 1024)
const ALLOWED_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'm.youtube.com',
  'music.youtube.com',
  'instagram.com',
  'www.instagram.com',
]

router.post('/', async (req, res) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Missing Supabase configuration.' })
    }

    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token.' })
    }
    const token = authHeader.substring('Bearer '.length)

    const { url } = req.body as { url?: string }
    if (!url) {
      return res.status(400).json({ error: 'URL is required.' })
    }

    const parsedUrl = new URL(url)
    if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
      return res.status(400).json({ error: 'URL host is not supported.' })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({ error: 'Unable to authenticate user.' })
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yt-dlp-'))
    try {
      const outputTemplate = path.join(tempDir, '%(id)s.%(ext)s')
      
      // Retry logic with different YouTube client types to bypass bot detection
      let lastError: Error | null = null
      const maxRetries = 4
      const retryDelays = [2000, 3000, 5000, 8000] // 2s, 3s, 5s, 8s
      // Try different YouTube client types to avoid bot detection
      const clientTypes = ['web', 'ios', 'android', 'tv_embedded']
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const clientType = clientTypes[Math.min(attempt, clientTypes.length - 1)]
          const args = [
            url,
            '-f',
            'bestvideo[height<=360]+bestaudio/best[height<=360]/best[height<=360]',
            '--merge-output-format',
            'mp4',
            '--no-playlist',
            '--user-agent',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            '--extractor-args',
            `youtube:player_client=${clientType}`,
            '--no-warnings',
            '--quiet',
            '--output',
            outputTemplate,
          ]
          
          await execFileAsync(YT_DLP_BIN, args)
          lastError = null
          break // Success, exit retry loop
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
          const errorMessage = lastError.message.toLowerCase()
          
          // Check if it's a rate limit or bot detection error
          const isRateLimit = errorMessage.includes('429') || errorMessage.includes('too many requests')
          const isBotDetection = errorMessage.includes('sign in') || errorMessage.includes('not a bot') || errorMessage.includes('bot')
          
          if ((isRateLimit || isBotDetection) && attempt < maxRetries) {
            const delay = retryDelays[attempt]
            const clientType = clientTypes[Math.min(attempt, clientTypes.length - 1)]
            console.log(`[download-video] ${isBotDetection ? 'Bot detection' : 'Rate limited'}, retrying with ${clientType} client in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          } else if (isRateLimit) {
            throw new Error('YouTube rate limit exceeded. Please try again in a few minutes.')
          } else if (isBotDetection) {
            throw new Error('YouTube is blocking automated access. Please try again later or use manual video upload.')
          }
          // If it's not a rate limit or bot detection error, throw immediately
          throw lastError
        }
      }
      
      if (lastError) {
        throw lastError
      }

      const files = await fs.readdir(tempDir)
      let finalPath = files.find((file) => file.match(/\.(mp4|mkv|webm|mov)$/i))
      if (!finalPath) {
        throw new Error('Download succeeded but no video file found.')
      }
      finalPath = path.join(tempDir, finalPath)

      if ((await fs.stat(finalPath)).size > MAX_FILE_BYTES && FFMPEG_BIN) {
        const recompressed = path.join(tempDir, `${Date.now()}-compressed.mp4`)
        await execFileAsync(FFMPEG_BIN, [
          '-i',
          finalPath,
          '-vf',
          'scale=-2:360',
          '-c:v',
          'libx264',
          '-preset',
          'veryfast',
          '-crf',
          '28',
          '-c:a',
          'aac',
          '-y',
          recompressed,
        ])
        finalPath = recompressed
      }

      const stats = await fs.stat(finalPath)
      if (stats.size > MAX_FILE_BYTES) {
        throw new Error('Processed video exceeds size limit.')
      }

      const extension = path.extname(finalPath) || '.mp4'
      const storagePath = `${user.id}/${Date.now()}${extension}`
      const fileBuffer = await fs.readFile(finalPath)
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, fileBuffer, { contentType: 'video/mp4' })

      if (uploadError) throw uploadError

      return res.status(200).json({ video_file_path: storagePath, size: stats.size })
    } finally {
      fs.rm(tempDir, { recursive: true, force: true })
    }
  } catch (error) {
    console.error('[download-video] error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    // Provide user-friendly error messages
    let statusCode = 500
    const lowerMessage = message.toLowerCase()
    if (lowerMessage.includes('rate limit') || lowerMessage.includes('429')) {
      statusCode = 429
    } else if (lowerMessage.includes('not found') || lowerMessage.includes('unavailable')) {
      statusCode = 404
    } else if (lowerMessage.includes('blocking automated') || lowerMessage.includes('bot') || lowerMessage.includes('sign in')) {
      statusCode = 403 // Forbidden - bot detection
    }
    
    return res.status(statusCode).json({ error: message })
  }
})

export default router
