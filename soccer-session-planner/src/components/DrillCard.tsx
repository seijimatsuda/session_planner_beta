import { useState, useEffect } from 'react'
import type { Drill } from '../types'
import { storageService } from '../services/storage'

interface DrillCardProps {
  drill: Drill
  onEdit: (drill: Drill) => void
  onDelete: (id: string) => void
}

export function DrillCard({ drill, onEdit, onDelete }: DrillCardProps) {
  const [showVideo, setShowVideo] = useState(false)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const [mediaError, setMediaError] = useState(false)
  const isVideo = drill.video_file_path?.match(/\.(mp4|webm|mkv|mov)$/i)
  const isImage = drill.video_file_path?.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  // Auto-load media URL on mount
  useEffect(() => {
    const loadMedia = async () => {
      if (!drill.video_file_path || mediaUrl) return
      
      setIsLoadingMedia(true)
      setMediaError(false)
      
      try {
        // Use longer expiration for thumbnail display
        const url = await storageService.getVideoUrl(drill.video_file_path, 3600)
        setMediaUrl(url)
      } catch (error) {
        console.error('Error loading media:', error)
        setMediaError(true)
      } finally {
        setIsLoadingMedia(false)
      }
    }

    loadMedia()
  }, [drill.video_file_path, mediaUrl])

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
        ) : mediaError ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-slate-400">Unable to load media</span>
          </div>
        ) : drill.video_file_path && mediaUrl ? (
          showVideo && isVideo ? (
            <video
              src={mediaUrl}
              controls
              playsInline
              className="h-full w-full object-cover"
              preload="metadata"
            />
          ) : isVideo ? (
            <div className="relative h-full w-full">
              <video
                src={mediaUrl}
                playsInline
                muted
                className="h-full w-full object-cover"
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
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
            </div>
          ) : isImage ? (
            <img
              src={mediaUrl}
              alt={drill.name}
              className="h-full w-full object-cover"
              loading="lazy"
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

