import { useState, useEffect } from 'react'
import type { Drill } from '../types'
import { storageService } from '../services/storage'
import { runStorageDiagnostics, logDiagnostics } from '../utils/storageDiagnostics'

interface DrillCardProps {
  drill: Drill
  onEdit: (drill: Drill) => void
  onDelete: (id: string) => void
}

// Detect iOS/iPad devices
const isIOS = () => {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// Check if video format is compatible with iOS Safari
// iOS only supports: MP4 (H.264), MOV, M4V - NOT WebM, MKV, AVI
const isIOSCompatibleVideo = (path: string | null | undefined): boolean => {
  if (!path) return true
  const extension = path.split('.').pop()?.toLowerCase()
  return ['mp4', 'mov', 'm4v'].includes(extension || '')
}

export function DrillCard({ drill, onEdit, onDelete }: DrillCardProps) {
  const [showVideo, setShowVideo] = useState(false)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const [mediaError, setMediaError] = useState(false)
  const isVideo = drill.video_file_path?.match(/\.(mp4|webm|mkv|mov)$/i)
  const isImage = drill.video_file_path?.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  // Check for iOS format incompatibility
  const isIOSDevice = isIOS()
  const hasIncompatibleFormat = isIOSDevice && isVideo && !isIOSCompatibleVideo(drill.video_file_path)

  // Auto-load media URL on mount with retry logic
  useEffect(() => {
    let isMounted = true
    let retryCount = 0
    const maxRetries = 3
    
    const loadMedia = async (retry = false) => {
      if (!drill.video_file_path) return
      if (mediaUrl && !retry) return // Don't reload if we already have a URL
      
      setIsLoadingMedia(true)
      setMediaError(false)
      
      try {
        // Use longer expiration for thumbnail display (1 hour, or 2 hours for iOS)
        console.log('[DrillCard] Loading media for drill:', drill.name, 'Path:', drill.video_file_path)
        const url = await storageService.getVideoUrl(drill.video_file_path, 3600)
        console.log('[DrillCard] Media URL loaded successfully:', url.substring(0, 100) + '...')
        
        if (isMounted) {
          setMediaUrl(url)
          retryCount = 0 // Reset retry count on success
        }
      } catch (error) {
        console.error('[DrillCard] Error loading media:', {
          error,
          message: error instanceof Error ? error.message : String(error),
          drillName: drill.name,
          path: drill.video_file_path,
          retry: retryCount,
        })
        
        if (isMounted) {
          if (retryCount < maxRetries) {
            retryCount++
            // Retry after delay
            setTimeout(() => {
              if (isMounted) {
                loadMedia(true)
              }
            }, 1000 * retryCount) // Exponential backoff
          } else {
            setMediaError(true)
            // Run diagnostics on final failure
            if (drill.video_file_path) {
              console.log('[DrillCard] Running storage diagnostics...')
              runStorageDiagnostics(drill.video_file_path)
                .then((diagnostics) => {
                  logDiagnostics(diagnostics)
                  if (diagnostics.errors.length > 0) {
                    console.error('[DrillCard] Diagnostic errors found - check Supabase configuration')
                  }
                })
                .catch((diagError) => {
                  console.error('[DrillCard] Diagnostics failed:', diagError)
                })
            }
          }
        }
      } finally {
        if (isMounted && !retry) {
          setIsLoadingMedia(false)
        }
      }
    }

    loadMedia()
    
    return () => {
      isMounted = false
    }
  }, [drill.video_file_path])

  const handleMediaClick = () => {
    if (!drill.video_file_path || !mediaUrl || !isVideo) return
    setShowVideo(!showVideo)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Media Thumbnail/Preview */}
      <div
        className={`relative h-48 w-full overflow-hidden bg-slate-100 ${
          isVideo && mediaUrl ? 'cursor-pointer' : ''
        }`}
        onClick={handleMediaClick}
      >
        {isLoadingMedia ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-slate-500">Loading...</span>
          </div>
        ) : hasIncompatibleFormat ? (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <span className="text-sm font-medium text-orange-600">Video format not supported on iPad/iPhone</span>
            <span className="mt-1 text-xs text-slate-500">Please re-upload as MP4</span>
          </div>
        ) : mediaError ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-slate-400">Unable to load media</span>
          </div>
        ) : drill.video_file_path && mediaUrl ? (
          showVideo && isVideo ? (
            // Exact same structure as DrillDetailModal
            <div
              className="overflow-hidden rounded-lg bg-slate-100 h-full"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking video
            >
              <video
                src={mediaUrl}
                controls
                playsInline
                crossOrigin="anonymous"
                // @ts-ignore - webkit-playsinline is needed for older iOS Safari
                webkit-playsinline="true"
                x-webkit-airplay="allow"
                className="w-full h-full"
                preload="metadata"
                onError={async (e) => {
                  console.error('Video load error in DrillCard:', e, 'URL:', mediaUrl)
                  const videoElement = e.currentTarget
                  try {
                    const newUrl = await storageService.getVideoUrl(drill.video_file_path!, 3600)
                    if (newUrl !== mediaUrl) {
                      videoElement.src = newUrl
                      setMediaUrl(newUrl)
                    }
                  } catch (refreshError) {
                    console.error('Failed to refresh video URL:', refreshError)
                    setMediaError(true)
                  }
                }}
                onLoadStart={() => {
                  console.log('Video load started in DrillCard for:', drill.name)
                }}
                onLoadedData={() => {
                  console.log('Video loaded successfully in DrillCard for:', drill.name)
                }}
              />
            </div>
          ) : isVideo ? (
            <div className="relative h-full w-full bg-slate-800">
              {/* Static thumbnail placeholder - don't load video until user clicks */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-white bg-opacity-90 p-4">
                  <svg
                    className="h-12 w-12 text-slate-900"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>
              <p className="absolute bottom-2 left-2 text-xs text-white/70">Tap to play</p>
            </div>
          ) : isImage ? (
            <img
              src={mediaUrl}
              alt={drill.name}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(e) => {
                const imgElement = e.currentTarget
                const errorDetails = {
                  error: e,
                  currentSrc: imgElement.currentSrc,
                  naturalWidth: imgElement.naturalWidth,
                  naturalHeight: imgElement.naturalHeight,
                  complete: imgElement.complete,
                  url: mediaUrl,
                  drillName: drill.name,
                }
                console.error('[DrillCard] Image load error:', errorDetails)
                
                // Try to refresh URL on error
                setTimeout(async () => {
                  try {
                    console.log('[DrillCard] Attempting to refresh image URL...')
                    const newUrl = await storageService.getVideoUrl(drill.video_file_path!, 3600)
                    if (newUrl !== mediaUrl) {
                      console.log('[DrillCard] Refreshing image URL')
                      imgElement.src = newUrl
                      setMediaUrl(newUrl)
                      setMediaError(false)
                    }
                  } catch (refreshError) {
                    console.error('[DrillCard] Failed to refresh image URL:', refreshError)
                    setMediaError(true)
                  }
                }, 1000)
              }}
              onLoad={() => {
                console.log('Image loaded successfully for:', drill.name)
                setMediaError(false)
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-slate-400">Media unavailable</span>
            </div>
          )
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-slate-400">No media available</span>
          </div>
        )}
      </div>

      {/* Drill Info */}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{drill.name}</h3>
          <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 capitalize">
            {drill.category}
          </span>
        </div>

        {drill.num_players && (
          <p className="mb-2 text-sm text-slate-600">Players: {drill.num_players}</p>
        )}

        {drill.equipment.length > 0 && (
          <div className="mb-2">
            <p className="mb-1 text-xs font-medium text-slate-500">Equipment:</p>
            <div className="flex flex-wrap gap-1">
              {drill.equipment.map((item, i) => (
                <span
                  key={i}
                  className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {drill.tags.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-medium text-slate-500">Tags:</p>
            <div className="flex flex-wrap gap-1">
              {drill.tags.map((tag, i) => (
                <span
                  key={i}
                  className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Creator Attribution */}
        {drill.creator_email && (
          <p className="mb-3 text-xs text-slate-500">
            Created by {drill.creator_email}
          </p>
        )}

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onEdit(drill)}
            className="flex-1 rounded-lg bg-yellow-500 px-3 py-3 text-sm font-medium text-white transition hover:bg-yellow-600 touch-manipulation min-h-[44px]"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm('Delete this drill?')) {
                onDelete(drill.id)
              }
            }}
            className="flex-1 rounded-lg bg-red-500 px-3 py-3 text-sm font-medium text-white transition hover:bg-red-600 touch-manipulation min-h-[44px]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

