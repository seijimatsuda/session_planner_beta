import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const STORAGE_BUCKET = process.env.DRILL_STORAGE_BUCKET ?? 'drill-videos'

// Content type mapping
const getContentType = (extension: string | undefined): string => {
  if (!extension) return 'application/octet-stream'
  const contentTypes: Record<string, string> = {
    // Videos
    mp4: 'video/mp4',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    m4v: 'video/x-m4v',
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  }
  return contentTypes[extension.toLowerCase()] || 'application/octet-stream'
}

// Set CORS headers for iOS compatibility
const setCorsHeaders = (req: any, res: any) => {
  const origin = req.headers.origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Range')
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length, Content-Range, Accept-Ranges')
  res.setHeader('Vary', 'Origin')
}

router.get('/:path(*)', async (req, res) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Missing Supabase configuration.' })
    }

    // Verify user authentication - check both Authorization header and token query param
    // Query param is needed for <img> and <video> tags which can't send custom headers
    let token: string | undefined
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring('Bearer '.length)
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token
    }

    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token.' })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({ error: 'Unable to authenticate user.' })
    }

    // Get file path from URL parameter
    const filePath = req.params.path
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required.' })
    }

    // Security: Validate path format (prevent directory traversal)
    // Path should be: userId/timestamp.extension (no .. or absolute paths)
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return res.status(400).json({ error: 'Invalid file path.' })
    }

    // Clean the path (remove leading slash if present)
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath

    console.log(`[media-proxy] Fetching file: ${cleanPath} for user: ${user.id}`)

    // Download file from Supabase Storage using service role
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(cleanPath)

    if (error) {
      console.error('[media-proxy] Error downloading file:', error)
      if (error.message?.includes('not found') || error.statusCode === '404') {
        return res.status(404).json({ error: 'File not found.' })
      }
      return res.status(500).json({ error: 'Failed to fetch file.' })
    }

    if (!data) {
      return res.status(404).json({ error: 'File not found.' })
    }

    // Determine content type from file extension
    const extension = cleanPath.split('.').pop()
    const contentType = getContentType(extension)

    // Convert Blob to Buffer
    const arrayBuffer = await data.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileSize = buffer.length

    // Set CORS headers
    setCorsHeaders(req, res)

    // iOS Safari requires Accept-Ranges header for video streaming
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Content-Type', contentType)

    // Cache headers - cache for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600')

    // Handle Range requests (critical for iOS video playback)
    const rangeHeader = req.headers.range
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

      // Validate range
      if (start >= fileSize || end >= fileSize || start > end) {
        res.setHeader('Content-Range', `bytes */${fileSize}`)
        return res.status(416).send('Requested range not satisfiable')
      }

      const chunkSize = (end - start) + 1

      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`)
      res.setHeader('Content-Length', chunkSize)
      res.status(206) // Partial Content

      console.log(`[media-proxy] Range request: ${start}-${end}/${fileSize} (${chunkSize} bytes)`)

      // Send the requested range
      return res.send(buffer.subarray(start, end + 1))
    }

    // No range request - send entire file
    res.setHeader('Content-Length', fileSize)
    console.log(`[media-proxy] Full file: ${cleanPath} (${fileSize} bytes, ${contentType})`)
    res.send(buffer)
  } catch (error) {
    console.error('[media-proxy] Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ error: message })
  }
})

// Handle OPTIONS request for CORS preflight
router.options('/:path(*)', (req, res) => {
  setCorsHeaders(req, res)
  res.setHeader('Access-Control-Max-Age', '86400') // 24 hours
  res.status(204).send()
})

// Handle HEAD request (iOS uses this to probe video files)
router.head('/:path(*)', async (req, res) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Missing Supabase configuration.' })
    }

    // Verify user authentication
    let token: string | undefined
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring('Bearer '.length)
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token
    }

    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token.' })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({ error: 'Unable to authenticate user.' })
    }

    const filePath = req.params.path
    if (!filePath || filePath.includes('..') || filePath.startsWith('/')) {
      return res.status(400).json({ error: 'Invalid file path.' })
    }

    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath

    // Download file to get size (Supabase doesn't have a metadata-only endpoint)
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(cleanPath)

    if (error || !data) {
      return res.status(404).json({ error: 'File not found.' })
    }

    const arrayBuffer = await data.arrayBuffer()
    const fileSize = arrayBuffer.byteLength
    const extension = cleanPath.split('.').pop()
    const contentType = getContentType(extension)

    setCorsHeaders(req, res)
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', fileSize)
    res.setHeader('Cache-Control', 'public, max-age=3600')

    console.log(`[media-proxy] HEAD request: ${cleanPath} (${fileSize} bytes)`)
    res.status(200).end()
  } catch (error) {
    console.error('[media-proxy] HEAD error:', error)
    return res.status(500).end()
  }
})

export default router

