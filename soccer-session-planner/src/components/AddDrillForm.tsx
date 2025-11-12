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

export function AddDrillForm({ onSuccess }: AddDrillFormProps) {
  const { user } = useAuth()
  const [videoFile, setVideoFile] = useState<File | null>(null)
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
  } = useForm<DrillFormData>({
    resolver: zodResolver(drillSchema),
    defaultValues: {
      equipment: [],
      tags: [],
    },
  })

  const equipment = watch('equipment')
  const tags = watch('tags')

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

    if (!videoFile) {
      alert('Please upload a video file.')
      return
    }

    setIsSubmitting(true)
    try {
      const videoPath = await storageService.uploadVideo(videoFile, user.id)

      await drillService.create({
        ...data,
        video_file_path: videoPath,
        user_id: user.id,
      })

      reset()
      setVideoFile(null)
      onSuccess()
    } catch (error) {
      console.error('Failed to create drill:', error)
      alert('Failed to create drill. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Video URL</label>
        <input
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          {...register('video_url')}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        {errors.video_url ? <p className="mt-1 text-sm text-red-500">{errors.video_url.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Upload Video File</label>
        <input
          type="file"
          accept="video/*"
          onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
          className="w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-600 hover:file:bg-blue-100"
        />
        <p className="mt-2 text-xs text-slate-500">
          Download the video from the link above (e.g., with yt-dlp) and upload it here while we build the automated fetcher in a later phase.
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

