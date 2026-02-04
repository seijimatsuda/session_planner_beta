import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { drillService, sessionService } from '../services/database'
import { useAuth } from '../hooks/useAuth'
import { SessionGrid } from '../components/SessionGrid'
import { DraggableDrill } from '../components/DraggableDrill'
import { DrillDetailModal } from '../components/DrillDetailModal'
import type { Drill, Category, GridCell } from '../types'

export function SessionPlanner() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Initialize 4x3 grid (4 rows for categories, 3 columns)
  const [grid, setGrid] = useState<(Drill | null)[][]>(
    Array(4)
      .fill(null)
      .map(() => Array(3).fill(null)),
  )
  const [activeDrill, setActiveDrill] = useState<Drill | null>(null)
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all')
  const [sessionName, setSessionName] = useState('')

  const categories: Category[] = ['activation', 'dribbling', 'passing', 'shooting']

  // Fetch drills
  const { data: drills = [], error: drillsError } = useQuery({
    queryKey: ['drills'],
    queryFn: drillService.getAll,
  })

  // Load existing session if editing
  const { data: existingSession, isLoading: isLoadingSession } = useQuery({
    queryKey: ['session', id],
    queryFn: () => (id ? sessionService.getById(id) : null),
    enabled: !!id,
  })

  // Populate grid when editing existing session
  useEffect(() => {
    if (existingSession && drills.length > 0) {
      setSessionName(existingSession.name)
      // Convert grid_data to grid with actual drill objects
      const loadedGrid = existingSession.grid_data.grid.map((row) =>
        row.map((cell: GridCell | null) => {
          if (!cell) return null
          return drills.find((d) => d.id === cell.drillId) || null
        }),
      )
      setGrid(loadedGrid)
    }
  }, [existingSession, drills])

  // Save session mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated')

      // Convert grid to serializable format
      const gridData = {
        grid: grid.map((row) =>
          row.map((drill, colIndex) =>
            drill ? { drillId: drill.id, position: colIndex } : null,
          ),
        ),
      }

      if (id) {
        // Update existing session
        return sessionService.update(id, {
          name: sessionName,
          grid_data: gridData,
        })
      } else {
        // Create new session
        return sessionService.create({
          name: sessionName,
          grid_data: gridData,
          user_id: user.id,
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      navigate('/sessions')
    },
    onError: (error) => {
      alert(`Failed to save session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })

  // Filter drills
  const filteredDrills =
    selectedCategory === 'all'
      ? drills
      : drills.filter((d) => d.category === selectedCategory)

  const handleDragStart = (event: DragStartEvent) => {
    const drill = event.active.data.current?.drill as Drill | undefined
    if (drill) {
      setActiveDrill(drill)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrill(null)

    const { active, over } = event
    if (!over) return

    const drill = active.data.current?.drill as Drill | undefined
    const { rowIndex, colIndex } = (over.data.current || {}) as {
      rowIndex?: number
      colIndex?: number
    }

    if (!drill || rowIndex === undefined || colIndex === undefined) return

    // Validate category match
    const expectedCategory = categories[rowIndex]
    if (drill.category !== expectedCategory) {
      alert(
        `This drill is for ${drill.category}, but you're trying to place it in the ${expectedCategory} row.`,
      )
      return
    }

    // Place drill in grid
    const newGrid = grid.map((row) => [...row])
    newGrid[rowIndex][colIndex] = drill
    setGrid(newGrid)
  }

  const handleAddToSession = (drill: Drill) => {
    // Find first empty cell in correct category row
    const categoryIndex = categories.indexOf(drill.category)
    if (categoryIndex === -1) return

    const row = grid[categoryIndex]
    const emptyColIndex = row.findIndex((cell) => cell === null)

    if (emptyColIndex === -1) {
      alert('No empty slots in this category. Remove a drill first.')
      return
    }

    const newGrid = grid.map((row) => [...row])
    newGrid[categoryIndex][emptyColIndex] = drill
    setGrid(newGrid)
  }

  const handleRemoveDrill = (rowIndex: number, colIndex: number) => {
    const newGrid = grid.map((row) => [...row])
    newGrid[rowIndex][colIndex] = null
    setGrid(newGrid)
  }

  const handleSave = () => {
    if (!sessionName.trim()) {
      alert('Please enter a session name')
      return
    }

    const hasAtLeastOneDrill = grid.some((row) => row.some((cell) => cell !== null))
    if (!hasAtLeastOneDrill) {
      alert('Please add at least one drill to the session')
      return
    }

    saveMutation.mutate()
  }

  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-400">Loading session...</div>
      </div>
    )
  }

  if (drillsError) {
    return (
      <div className="rounded-xl border border-slate-600 bg-slate-800 p-8 text-center">
        <p className="text-lg font-medium text-red-400">Error loading drills</p>
        <p className="mt-2 text-sm text-slate-400">
          {drillsError instanceof Error ? drillsError.message : 'An unknown error occurred'}
        </p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['drills'] })}
          className="mt-4 rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-500"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-100">Plan Session</h1>
        <p className="mt-2 text-sm text-slate-400">
          {id ? 'Edit your session plan' : 'Drag drills into the grid to plan your training session'}
        </p>
      </header>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Session Grid */}
        <div className="mb-8">
          <SessionGrid
            grid={grid}
            onRemoveDrill={handleRemoveDrill}
            onDrillClick={(drill) => setSelectedDrill(drill)}
          />
        </div>

        {/* Drill Library */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-bold text-slate-100">Drill Library</h2>

          {/* Category Filter */}
          <div className="mb-4 flex flex-wrap gap-2">
            {['all', ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as Category | 'all')}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-900 shadow'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Drills Grid */}
          {filteredDrills.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-600 bg-slate-700 p-8 text-center text-sm text-slate-400">
              No drills available. Add some drills first!
            </div>
          ) : (
            <div className="grid max-h-96 grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {filteredDrills.map((drill) => (
                <DraggableDrill
                  key={drill.id}
                  drill={drill}
                  onAddToSession={handleAddToSession}
                />
              ))}
            </div>
          )}
        </div>

        <DragOverlay>
          {activeDrill ? (
            <div className="rounded-lg border border-slate-600 bg-slate-800 p-3 shadow-lg opacity-90">
              <h4 className="font-medium text-slate-100">{activeDrill.name}</h4>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Save Session */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h2 className="mb-4 text-xl font-bold text-slate-100">Save Session</h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Enter session name..."
            className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex-1 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-400 sm:px-6"
            >
              {saveMutation.isPending
                ? 'Saving...'
                : id
                  ? 'Update Session'
                  : 'Save Session'}
            </button>
            <button
              onClick={() => navigate('/sessions')}
              className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-500 sm:px-6"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

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
