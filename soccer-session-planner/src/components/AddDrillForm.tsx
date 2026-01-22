import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { drillSchema, type DrillFormData } from '../schemas/drillSchema'
import { useAuth } from '../hooks/useAuth'
import { drillService } from '../services/database'
import { storageService } from '../services/storage'

interface AddDrillFormProps {
  onSuccess: () => void
}

// Detect iOS/iPad devices
const isIOS = () => {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function AddDrillForm({ onSuccess }: AddDrillFormProps) {
  const { user } = useAuth()
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const isIOSDevice = isIOS()
  const [equipmentInput, setEquipmentInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(drillSchema),
    defaultValues: {
      video_url: '',
      equipment: [],
      tags: [],
    },
  })

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
      alert('You must be logged in to create drills.')
      return
    }

    if (!mediaFile) {
      alert('Please upload a screenshot or video file.')
      return
    }

    setIsSubmitting(true)
    try {
      const mediaPath = await storageService.uploadMedia(mediaFile, user.id)

      await drillService.create({
        ...data,
        video_url: data.video_url || '',
        video_file_path: mediaPath,
        user_id: user.id,
      })

      reset()
      setMediaFile(null)
      onSuccess()
    } catch (error) {
      console.error('Failed to create drill:', error)
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to create drill. Please try again.'
      alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Upload Screenshot or Video <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          accept={isIOSDevice ? "image/*,video/mp4,video/quicktime,.mp4,.mov,.m4v" : "image/*,video/*"}
          onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)}
          className="w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-600 hover:file:bg-blue-100"
          required
        />
        <p className="mt-2 text-xs text-slate-500">
          Upload a screenshot or video of the drill being done. This will be used to visualize the drill in your library.
        </p>
        {isIOSDevice && (
          <p className="mt-1 text-xs text-orange-600">
            On iPad/iPhone, only MP4 and MOV videos are supported.
          </p>
        )}
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
      >
        {isSubmitting ? 'Creating Drill...' : 'Create Drill'}
      </button>
    </form>
  )
}

