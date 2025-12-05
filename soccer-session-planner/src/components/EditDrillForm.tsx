import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { drillSchema, type DrillFormData } from '../schemas/drillSchema'
import { useAuth } from '../hooks/useAuth'
import { drillService } from '../services/database'
import { storageService } from '../services/storage'
import type { Drill } from '../types'

interface EditDrillFormProps {
  drill: Drill
  onSuccess: () => void
}

export function EditDrillForm({ drill, onSuccess }: EditDrillFormProps) {
  const { user } = useAuth()
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [equipmentInput, setEquipmentInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string | null>(null)
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)

  const isVideo = drill.video_file_path?.match(/\.(mp4|webm|mkv|mov)$/i)
  const isImage = drill.video_file_path?.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DrillFormData>({
    resolver: zodResolver(drillSchema),
    defaultValues: {
      name: drill.name,
      video_url: drill.video_url || '',
      category: drill.category,
      num_players: drill.num_players,
      equipment: drill.equipment || [],
      tags: drill.tags || [],
    },
  })

  // Load current media for preview
  useEffect(() => {
    let isMounted = true
    
    const loadCurrentMedia = async () => {
      if (!drill.video_file_path) return
      
      setIsLoadingMedia(true)
      try {
        const url = await storageService.getVideoUrl(drill.video_file_path, 3600)
        if (isMounted) {
          setCurrentMediaUrl(url)
        }
      } catch (error) {
        console.error('Error loading current media:', error)
      } finally {
        if (isMounted) {
          setIsLoadingMedia(false)
        }
      }
    }

    loadCurrentMedia()
    
    return () => {
      isMounted = false
    }
  }, [drill.video_file_path])

  const equipment = watch('equipment') ?? []
  const tags = watch('tags') ?? []

  const addEquipment = () => {
    const value = equipmentInput.trim()
    if (!value) return
    setValue('equipment', [...equipment, value])
    setEquipmentInput('')
  }

  const removeEquipment = (index: number) => {
    setValue(
      'equipment',
      equipment.filter((_, i) => i !== index),
    )
  }

  const addTag = () => {
    const value = tagInput.trim()
    if (!value) return
    setValue('tags', [...tags, value])
    setTagInput('')
  }

  const removeTag = (index: number) => {
    setValue(
      'tags',
      tags.filter((_, i) => i !== index),
    )
  }

  const onSubmit = async (data: DrillFormData) => {
    if (!user) {
      alert('You must be logged in to edit drills.')
      return
    }

    setIsSubmitting(true)
    try {
      let mediaPath = drill.video_file_path

      // Upload new media if provided
      if (mediaFile) {
        // Upload new file
        mediaPath = await storageService.uploadMedia(mediaFile, user.id)
        // Note: We keep the old file for now (could be deleted later if needed)
      }

      // Update drill in database
      await drillService.update(drill.id, {
        ...data,
        video_url: data.video_url || '',
        video_file_path: mediaPath,
      })

      onSuccess()
    } catch (error) {
      console.error('Failed to update drill:', error)
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to update drill. Please try again.'
      alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Current Media
        </label>
        {isLoadingMedia ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-500">Loading current media...</p>
          </div>
        ) : currentMediaUrl ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
            {isVideo ? (
              <video
                src={currentMediaUrl}
                controls
                playsInline
                className="w-full max-h-48 object-contain"
                preload="metadata"
                onError={(e) => {
                  console.error('Video load error in edit form:', e, 'URL:', currentMediaUrl)
                }}
              />
            ) : isImage ? (
              <img
                src={currentMediaUrl}
                alt={drill.name}
                className="w-full max-h-48 object-contain"
                onError={(e) => {
                  console.error('Image load error in edit form:', e, 'URL:', currentMediaUrl)
                }}
              />
            ) : (
              <div className="flex h-48 items-center justify-center">
                <p className="text-sm text-slate-500">Media preview unavailable</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-500">No media available</p>
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Replace Media (optional)
        </label>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)}
          className="w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-600 hover:file:bg-blue-100"
        />
        <p className="mt-2 text-xs text-slate-500">
          Leave empty to keep the current media. Upload a new file to replace it.
        </p>
        {mediaFile && (
          <p className="mt-1 text-xs text-green-600">
            Selected: {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Video URL (optional)</label>
        <input
          type="url"
          placeholder="https://youtube.com/watch?v=... (optional reference link)"
          {...register('video_url')}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        {errors.video_url ? <p className="mt-1 text-sm text-red-500">{errors.video_url.message}</p> : null}
        <p className="mt-2 text-xs text-slate-500">
          Optionally provide a reference link to the source video (e.g., YouTube, Instagram) for this drill.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Drill Name</label>
        <input
          type="text"
          placeholder="Ball Mastery Drill"
          {...register('name')}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        {errors.name ? <p className="mt-1 text-sm text-red-500">{errors.name.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
        <select
          {...register('category')}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="activation">Activation</option>
          <option value="dribbling">Dribbling</option>
          <option value="passing">Passing</option>
          <option value="shooting">Shooting</option>
        </select>
        {errors.category ? <p className="mt-1 text-sm text-red-500">{errors.category.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Number of Players (optional)</label>
        <input
          type="number"
          min={1}
          max={50}
          {...register('num_players', { valueAsNumber: true })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        {errors.num_players ? <p className="mt-1 text-sm text-red-500">{errors.num_players.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Equipment</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={equipmentInput}
            onChange={(event) => setEquipmentInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addEquipment()
              }
            }}
            placeholder="e.g., cones, balls"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            type="button"
            onClick={addEquipment}
            className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-300"
          >
            Add
          </button>
        </div>
        {equipment.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {equipment.map((item, index) => (
              <span
                key={index}
                className="flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-700"
              >
                {item}
                <button type="button" onClick={() => removeEquipment(index)} className="text-slate-500 hover:text-slate-700">
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Tags</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addTag()
              }
            }}
            placeholder="e.g., beginner, coordination"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            type="button"
            onClick={addTag}
            className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-300"
          >
            Add
          </button>
        </div>
        {tags.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700"
              >
                {tag}
                <button type="button" onClick={() => removeTag(index)} className="text-blue-500 hover:text-blue-700">
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onSuccess}
          className="flex-1 rounded-lg bg-slate-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
        >
          {isSubmitting ? 'Updating Drill...' : 'Update Drill'}
        </button>
      </div>
    </form>
  )
}

