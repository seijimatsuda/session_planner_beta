import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { drillService } from '../services/database'
import { storageService } from '../services/storage'
import { DrillCard } from '../components/DrillCard'
import type { Category } from '../types'

export function Library() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch drills
  const { data: drills = [], isLoading, error } = useQuery({
    queryKey: ['drills'],
    queryFn: drillService.getAll,
  })

  // Delete drill mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const drill = drills.find((d) => d.id === id)
      if (drill?.video_file_path) {
        try {
          await storageService.deleteVideo(drill.video_file_path)
        } catch (error) {
          console.error('Error deleting media file:', error)
          // Continue with drill deletion even if media deletion fails
        }
      }
      await drillService.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drills'] })
    },
    onError: (error) => {
      alert(`Failed to delete drill: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })

  // Filter drills
  const filteredDrills = drills.filter((drill) => {
    const matchesCategory = selectedCategory === 'all' || drill.category === selectedCategory
    const matchesSearch =
      drill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drill.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const categories: (Category | 'all')[] = ['all', 'activation', 'dribbling', 'passing', 'shooting']

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-2 text-sm text-slate-600">Loading drills...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-lg font-medium text-red-800">Error loading drills</p>
        <p className="mt-2 text-sm text-red-600">
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['drills'] })}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Drill Library</h1>
            <p className="mt-2 text-sm text-slate-600">
              Browse, search, and manage your drill collection
            </p>
          </div>
          <button
            onClick={() => navigate('/drills/new')}
            className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-green-700 sm:w-auto"
          >
            + Add Drill
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        {/* Category Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Search</label>
          <input
            type="text"
            placeholder="Search by name or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      {/* Drill Grid */}
      {filteredDrills.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-lg font-medium text-slate-600">
            {drills.length === 0
              ? 'No drills yet. Add your first drill to get started!'
              : 'No drills match your filters.'}
          </p>
          {drills.length === 0 && (
            <button
              onClick={() => navigate('/drills/new')}
              className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Add Your First Drill
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDrills.map((drill) => (
            <DrillCard
              key={drill.id}
              drill={drill}
              onEdit={(drill) => {
                navigate(`/drills/${drill.id}/edit`)
              }}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
