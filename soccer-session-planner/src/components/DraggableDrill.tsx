import { useDraggable } from '@dnd-kit/core'
import type { Drill } from '../types'

interface DraggableDrillProps {
  drill: Drill
  onAddToSession: (drill: Drill) => void
}

export function DraggableDrill({ drill, onAddToSession }: DraggableDrillProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: drill.id,
    data: { drill },
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-move rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between">
        <h4
          className="text-sm font-medium text-slate-900"
          {...listeners}
          {...attributes}
        >
          {drill.name}
        </h4>
        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 capitalize">
          {drill.category}
        </span>
      </div>
      <button
        onClick={() => onAddToSession(drill)}
        className="w-full rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700"
      >
        + Add to Session
      </button>
    </div>
  )
}

