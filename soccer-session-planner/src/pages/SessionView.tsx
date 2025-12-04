import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { drillService, sessionService } from '../services/database'
import { DrillDetailModal } from '../components/DrillDetailModal'
import type { Drill, GridCell, Category } from '../types'

export function SessionView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null)

  // Fetch session
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', id],
    queryFn: () => (id ? sessionService.getById(id) : null),
    enabled: !!id,
  })

  // Fetch drills
  const { data: drills = [] } = useQuery({
    queryKey: ['drills'],
    queryFn: drillService.getAll,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Session ID is required')
      await sessionService.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      navigate('/sessions')
    },
    onError: (error) => {
      alert(`Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('Session not found')
      return sessionService.create({
        name: `${session.name} (Copy)`,
        grid_data: session.grid_data,
        user_id: session.user_id,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      navigate('/sessions')
    },
    onError: (error) => {
      alert(`Failed to duplicate session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-600">Loading session...</div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-lg font-medium text-red-800">Error loading session</p>
        <p className="mt-2 text-sm text-red-600">
          {error instanceof Error ? error.message : 'Session not found'}
        </p>
        <button
          onClick={() => navigate('/sessions')}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Back to Sessions
        </button>
      </div>
    )
  }

  // Build grid with drill objects and filter out empty rows/columns
  const gridWithDrills: (Drill | null)[][] = session.grid_data.grid.map((row) =>
    row.map((cell: GridCell | null) => {
      if (!cell) return null
      return drills.find((d) => d.id === cell.drillId) || null
    }),
  )

  // Create dynamic grid - only show rows/columns with drills
  const categories: Category[] = ['activation', 'dribbling', 'passing', 'shooting']
  const categoryColors: Record<string, string> = {
    activation: 'border-yellow-400 bg-yellow-50',
    dribbling: 'border-blue-400 bg-blue-50',
    passing: 'border-green-400 bg-green-50',
    shooting: 'border-red-400 bg-red-50',
  }

  // Filter out completely empty rows
  const filledRows = gridWithDrills
    .map((row, rowIndex) => ({ row, rowIndex, category: categories[rowIndex] }))
    .filter(({ row }) => row.some((cell) => cell !== null))

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{session.name}</h1>
            <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
              <p>Created {new Date(session.created_at).toLocaleDateString()}</p>
              {session.creator_email && <p>Created by {session.creator_email}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/sessions/${id}/edit`)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              onClick={() => duplicateMutation.mutate()}
              disabled={duplicateMutation.isPending}
              className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {duplicateMutation.isPending ? '...' : 'Duplicate'}
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this session?')) {
                  deleteMutation.mutate()
                }
              }}
              disabled={deleteMutation.isPending}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Delete
            </button>
          </div>
        </div>
      </header>

      {/* Dynamic Grid */}
      {filledRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-lg font-medium text-slate-600">This session has no drills yet.</p>
          <button
            onClick={() => navigate(`/sessions/${id}/edit`)}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Add Drills
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filledRows.map(({ row, category }) => {
            // Filter out null cells for this row
            const filledCells = row
              .map((drill, colIndex) => ({ drill, colIndex }))
              .filter(({ drill }) => drill !== null)

            if (filledCells.length === 0) return null

            return (
              <div key={category} className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold capitalize text-slate-900">{category}</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filledCells.map(({ drill, colIndex }) => {
                    if (!drill) return null
                    return (
                      <div
                        key={`${category}-${colIndex}`}
                        className={`cursor-pointer rounded-lg border-2 p-4 transition-shadow hover:shadow-md ${
                          categoryColors[category] || 'border-gray-300 bg-white'
                        }`}
                        onClick={() => setSelectedDrill(drill)}
                      >
                        <h3 className="font-semibold text-slate-900">{drill.name}</h3>
                        {drill.num_players && (
                          <p className="mt-1 text-sm text-slate-600">Players: {drill.num_players}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Drill Detail Modal */}
      {selectedDrill && (
        <DrillDetailModal
          drill={selectedDrill}
          onClose={() => setSelectedDrill(null)}
        />
      )}
    </div>
  )
}

