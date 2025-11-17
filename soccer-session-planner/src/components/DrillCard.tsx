import { useState } from 'react'
import type { Drill } from '../types'
import { storageService } from '../services/storage'

interface DrillCardProps {
  drill: Drill
  onEdit: (drill: Drill) => void
  onDelete: (id: string) => void
}

export function DrillCard({ drill, onEdit, onDelete }: DrillCardProps) {
  const [showMedia, setShowMedia] = useState(false)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const isVideo = drill.video_file_path?.match(/\.(mp4|webm|mkv|mov)$/i)
  const isImage = drill.video_file_path?.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  const handleMediaClick = async () => {
    if (!drill.video_file_path) return

    if (!mediaUrl) {
      const url = await storageService.getVideoUrl(drill.video_file_path, 3600)
      setMediaUrl(url)
    }
    setShowMedia(!showMedia)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Media Thumbnail/Preview */}
      <div
        className="relative h-48 w-full cursor-pointer bg-slate-100"
        onClick={handleMediaClick}
      >
        {drill.video_file_path && mediaUrl ? (
          showMedia ? (
            isVideo ? (
              <video
                src={mediaUrl}
                controls
                className="h-full w-full object-cover"
                onLoadStart={() => setShowMedia(true)}
              />
            ) : isImage ? (
              <img
                src={mediaUrl}
                alt={drill.name}
                className="h-full w-full object-cover"
              />
            ) : null
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-slate-500">
                {isVideo ? '▶ Click to play video' : isImage ? '🖼 Click to view image' : 'Click to view media'}
              </span>
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

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onEdit(drill)}
            className="flex-1 rounded-lg bg-yellow-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-yellow-600"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm('Delete this drill?')) {
                onDelete(drill.id)
              }
            }}
            className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

