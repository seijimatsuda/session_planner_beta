import { useParams } from 'react-router-dom'

export function SessionPlanner() {
  const { id } = useParams()

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
      <p className="font-medium text-slate-600">
        Session Planner Placeholder {id ? `(editing ${id})` : ''}
      </p>
      <p className="mt-2">
        Drag-and-drop planning and Supabase persistence will be implemented in Phases 5 and 6.
        Authentication is protecting this route so development can proceed safely.
      </p>
    </div>
  )
}

