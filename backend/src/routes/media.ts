import { Router, Request, Response } from 'express'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import { createClient } from '@supabase/supabase-js'

const router = Router()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const STORAGE_BUCKET = process.env.DRILL_STORAGE_BUCKET ?? 'drill-videos'

const CHUNK_SIZE = 10 ** 6 // 1MB chunks

// Content type mapping
const getContentType = (extension: string | undefined): string => {
  if (!extension) return 'application/octet-stream'
  const contentTypes: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    m4v: 'video/x-m4v',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  }
  return contentTypes[extension.toLowerCase()] || 'application/octet-stream'
}

function parseRange(rangeHeader: string | undefined, fileSize: number): { start: number; end: number } | null {
  if (!rangeHeader) return null

  const parts = rangeHeader.replace(/bytes=/, '').split('-')
  const startStr = parts[0] ?? ''
  const endStr = parts[1] ?? ''

  // Suffix range (bytes=-500)
  if (startStr === '') {
    const suffixLength = parseInt(endStr, 10)
    if (isNaN(suffixLength)) return null
    return { start: Math.max(0, fileSize - suffixLength), end: fileSize - 1 }
  }

  const start = parseInt(startStr, 10)
  if (isNaN(start)) return null

  const end = endStr ? parseInt(endStr, 10) : fileSize - 1
  return { start, end: Math.min(end, fileSize - 1) }
}

function isValidRange(start: number, end: number, fileSize: number): boolean {
  return start >= 0 && start < fileSize && end < fileSize && start <= end
}

// Verify auth token
async function verifyToken(token: string): Promise<{ valid: boolean; userId: string | undefined }> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return { valid: false, userId: undefined }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  return { valid: !error && !!user, userId: user?.id }
}

// Extract token from request
function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  if (typeof req.query.token === 'string') {
    return req.query.token
  }
  return undefined
}

// Get signed URL and file metadata
async function getFileInfo(filePath: string): Promise<{ signedUrl: string; fileSize: number; contentType: string } | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Generate signed URL (1 hour expiry)
  const { data: signedData, error: signedError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, 3600)

  if (signedError || !signedData?.signedUrl) {
    console.error('[media-proxy] Failed to create signed URL:', signedError)
    return null
  }

  // Get file metadata via HEAD
  const headResponse = await fetch(signedData.signedUrl, { method: 'HEAD' })
  if (!headResponse.ok) {
    console.error('[media-proxy] HEAD request failed:', headResponse.status)
    return null
  }

  const fileSize = parseInt(headResponse.headers.get('content-length') || '0', 10)
  const extension = filePath.split('.').pop()
  const contentType = getContentType(extension)

  return { signedUrl: signedData.signedUrl, fileSize, contentType }
}

router.get('/*path', async (req: Request, res: Response) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Missing Supabase configuration' })
    }

    // Auth check
    const token = extractToken(req)
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' })
    }

    const { valid, userId } = await verifyToken(token)
    if (!valid) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const filePath = req.params.path
    if (!filePath || filePath.includes('..') || filePath.startsWith('/')) {
      return res.status(400).json({ error: 'Invalid path' })
    }

    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath

    console.log(`[media-proxy] Fetching file: ${cleanPath} for user: ${userId}`)

    const fileInfo = await getFileInfo(cleanPath)
    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' })
    }

    const { signedUrl, fileSize, contentType } = fileInfo

    if (!fileSize) {
      return res.status(500).json({ error: 'Unable to determine file size' })
    }

    const range = parseRange(req.headers.range, fileSize)

    // No Range header - return full file with streaming
    if (!range) {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600'
      })

      const response = await fetch(signedUrl)
      if (!response.ok || !response.body) {
        return res.status(500).json({ error: 'Failed to fetch file' })
      }

      console.log(`[media-proxy] Full file stream: ${cleanPath} (${fileSize} bytes)`)
      const nodeStream = Readable.fromWeb(response.body as import('stream/web').ReadableStream)
      await pipeline(nodeStream, res)
      return
    }

    // Validate range
    if (!isValidRange(range.start, range.end, fileSize)) {
      res.writeHead(416, { 'Content-Range': `bytes */${fileSize}` })
      return res.end()
    }

    // Limit chunk size for efficient streaming
    const end = Math.min(range.start + CHUNK_SIZE - 1, range.end)
    const contentLength = end - range.start + 1

    res.writeHead(206, {
      'Content-Range': `bytes ${range.start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600'
    })

    console.log(`[media-proxy] Range request: ${range.start}-${end}/${fileSize} (${contentLength} bytes)`)

    // Fetch with Range header - let Supabase/S3 handle the chunking
    const response = await fetch(signedUrl, {
      headers: { Range: `bytes=${range.start}-${end}` }
    })

    if (!response.ok || !response.body) {
      console.error('[media-proxy] Failed to fetch range')
      return res.end()
    }

    const nodeStream = Readable.fromWeb(response.body as import('stream/web').ReadableStream)
    await pipeline(nodeStream, res)
  } catch (error) {
    console.error('[media-proxy] Unexpected error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Media streaming error' })
    }
  }
})

// OPTIONS for CORS preflight
router.options('/*path', (_req, res) => {
  res.status(204).end()
})

// HEAD for iOS probing - returns file metadata without body
router.head('/*path', async (req: Request, res: Response) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).end()
    }

    const token = extractToken(req)
    if (!token) {
      return res.status(401).end()
    }

    const { valid } = await verifyToken(token)
    if (!valid) {
      return res.status(401).end()
    }

    const filePath = req.params.path
    if (!filePath || filePath.includes('..') || filePath.startsWith('/')) {
      return res.status(400).end()
    }

    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath

    const fileInfo = await getFileInfo(cleanPath)
    if (!fileInfo) {
      return res.status(404).end()
    }

    const { fileSize, contentType } = fileInfo

    res.writeHead(200, {
      'Accept-Ranges': 'bytes',
      'Content-Type': contentType,
      'Content-Length': fileSize,
      'Cache-Control': 'public, max-age=3600'
    })

    console.log(`[media-proxy] HEAD request: ${cleanPath} (${fileSize} bytes)`)
    res.end()
  } catch (error) {
    console.error('[media-proxy] HEAD error:', error)
    res.status(500).end()
  }
})

export default router
