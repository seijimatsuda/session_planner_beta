import { useDroppable } from '@dnd-kit/core'
import type { Drill } from '../types'

interface GridCellProps {
  drill: Drill | null
  rowIndex: number
  colIndex: number
  category: string
  onRemove: (rowIndex: number, colIndex: number) => void
  onDrillClick?: (drill: Drill) => void
}

function GridCell({ drill, rowIndex, colIndex, category, onRemove, onDrillClick }: GridCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${rowIndex}-${colIndex}`,
    data: { rowIndex, colIndex, category },
  })

  const categoryColors: Record<string, string> = {
    activation: 'border-yellow-400 bg-yellow-50',
    dribbling: 'border-blue-400 bg-blue-50',
    passing: 'border-green-400 bg-green-50',
    shooting: 'border-red-400 bg-red-50',
  }

  const borderColor = categoryColors[category]?.split(' ')[0] || 'border-gray-300'

  return (
    <div
      ref={setNodeRef}
      className={`relative min-h-32 rounded-lg border-2 p-3 transition-colors ${
        isOver ? 'bg-blue-100 ring-2 ring-blue-400' : categoryColors[category]?.split(' ')[1] || 'bg-white'
      } ${borderColor}`}
    >
      {drill ? (
        <div className="flex h-full flex-col">
          <button
            type="button"
            className="flex-1 flex items-center justify-center text-center text-sm font-medium text-slate-900 cursor-pointer hover:underline touch-manipulation min-h-[44px]"
            onClick={() => onDrillClick?.(drill)}
          >
            {drill.name}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(rowIndex, colIndex)
            }}
            className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white transition hover:bg-red-600 touch-manipulation"
            aria-label="Remove drill"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-slate-400">
          Drop drill here
        </div>
      )}
    </div>
  )
}

interface SessionGridProps {
  grid: (Drill | null)[][]
  onRemoveDrill: (rowIndex: number, colIndex: number) => void
  onDrillClick?: (drill: Drill) => void
}

export function SessionGrid({ grid, onRemoveDrill, onDrillClick }: SessionGridProps) {
  const categories = ['activation', 'dribbling', 'passing', 'shooting']

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
      <h2 className="mb-4 text-xl font-bold text-slate-900">Session Plan (4x3 Grid)</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {grid.map((row, rowIndex) =>
          row.map((drill, colIndex) => (
            <GridCell
              key={`${rowIndex}-${colIndex}`}
              drill={drill}
              rowIndex={rowIndex}
              colIndex={colIndex}
              category={categories[rowIndex]}
              onRemove={onRemoveDrill}
              onDrillClick={onDrillClick}
            />
          )),
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border-2 border-yellow-400 bg-yellow-50"></div>
          <span className="capitalize">Activation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border-2 border-blue-400 bg-blue-50"></div>
          <span className="capitalize">Dribbling</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border-2 border-green-400 bg-green-50"></div>
          <span className="capitalize">Passing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border-2 border-red-400 bg-red-50"></div>
          <span className="capitalize">Shooting</span>
        </div>
      </div>
    </div>
  )
}

