import { useState, useEffect } from 'react'
import type { Drill } from '../types'
import { storageService } from '../services/storage'

interface DrillDetailModalProps {
  drill: Drill
  onClose: () => void
}

export function DrillDetailModal({ drill, onClose }: DrillDetailModalProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const isVideo = drill.video_file_path?.match(/\.(mp4|webm|mkv|mov)$/i)
  const isImage = drill.video_file_path?.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  useEffect(() => {
    let isMounted = true
    let retryCount = 0
    const maxRetries = 3
    
    const loadMedia = async (retry = false) => {
      if (!drill.video_file_path) return
      if (mediaUrl && !retry) return
      
      setIsLoadingMedia(true)
      
      try {
        // Use longer expiration for modal viewing (1 hour, or 2 hours for iOS)
        const url = await storageService.getVideoUrl(drill.video_file_path, 3600)
        
        if (isMounted) {
          setMediaUrl(url)
          retryCount = 0
        }
      } catch (error) {
        console.error('Error loading media in modal:', error, 'Retry:', retryCount)
        
        if (isMounted && retryCount < maxRetries) {
          retryCount++
          setTimeout(() => {
            if (isMounted) {
              loadMedia(true)
            }
          }, 1000 * retryCount)
        }
      } finally {
        if (isMounted && !retry) {
          setIsLoadingMedia(false)
        }
      }
    }

    if (drill.video_file_path && !mediaUrl && !isLoadingMedia) {
      loadMedia()
    }
    
    return () => {
      isMounted = false
    }
  }, [drill.video_file_path])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 border-b border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">{drill.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 capitalize">
                  {drill.category}
                </span>
                {drill.num_players && (
                  <span className="text-sm text-slate-600">Players: {drill.num_players}</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 touch-manipulation"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Media */}
          {drill.video_file_path && (
            <div className="mb-6">
              {isLoadingMedia ? (
                <div className="flex h-64 items-center justify-center rounded-lg bg-slate-100">
                  <p className="text-sm text-slate-500">Loading media...</p>
                </div>
              ) : mediaUrl ? (
                <div className="overflow-hidden rounded-lg bg-slate-100">
                  {isVideo ? (
                    <video
                      src={mediaUrl}
                      controls
                      playsInline
                      className="w-full"
                      preload="metadata"
                      onError={async (e) => {
                        console.error('Video load error in modal:', e, 'URL:', mediaUrl)
                        const videoElement = e.currentTarget
                        try {
                          const newUrl = await storageService.getVideoUrl(drill.video_file_path!, 3600)
                          if (newUrl !== mediaUrl) {
                            videoElement.src = newUrl
                            setMediaUrl(newUrl)
                          }
                        } catch (refreshError) {
                          console.error('Failed to refresh video URL in modal:', refreshError)
                        }
                      }}
                      onLoadStart={() => {
                        console.log('Video load started in modal for:', drill.name)
                      }}
                      onLoadedData={() => {
                        console.log('Video loaded successfully in modal for:', drill.name)
                      }}
                    />
                  ) : isImage ? (
                    <img
                      src={mediaUrl}
                      alt={drill.name}
                      className="w-full object-contain"
                      loading="lazy"
                      onError={async (e) => {
                        console.error('Image load error in modal:', e, 'URL:', mediaUrl)
                        const imgElement = e.currentTarget
                        try {
                          const newUrl = await storageService.getVideoUrl(drill.video_file_path!, 3600)
                          if (newUrl !== mediaUrl) {
                            imgElement.src = newUrl
                            setMediaUrl(newUrl)
                          }
                        } catch (refreshError) {
                          console.error('Failed to refresh image URL in modal:', refreshError)
                        }
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully in modal for:', drill.name)
                      }}
                    />
                  ) : null}
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-lg bg-slate-100">
                  <p className="text-sm text-slate-500">Unable to load media</p>
                </div>
              )}
            </div>
          )}

          {/* Equipment */}
          {drill.equipment.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Equipment</h3>
              <div className="flex flex-wrap gap-2">
                {drill.equipment.map((item, i) => (
                  <span
                    key={i}
                    className="rounded bg-slate-100 px-3 py-1 text-sm text-slate-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {drill.tags.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {drill.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="rounded bg-blue-50 px-3 py-1 text-sm text-blue-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Creator */}
          {drill.creator_email && (
            <div className="mb-4 text-sm text-slate-500">
              Created by {drill.creator_email}
            </div>
          )}

          {/* Video URL (if provided) */}
          {drill.video_url && (
            <div className="mt-4">
              <a
                href={drill.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                View original source →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

