import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { drillService } from '../services/database'
import { EditDrillForm } from '../components/EditDrillForm'

export function EditDrill() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: drill, isLoading, error } = useQuery({
    queryKey: ['drill', id],
    queryFn: () => (id ? drillService.getById(id) : null),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-400">Loading drill...</div>
      </div>
    )
  }

  if (error || !drill) {
    return (
      <div className="rounded-xl border border-slate-600 bg-slate-800 p-8 text-center">
        <p className="text-lg font-medium text-red-400">Error loading drill</p>
        <p className="mt-2 text-sm text-slate-400">
          {error instanceof Error ? error.message : 'Drill not found'}
        </p>
        <button
          onClick={() => navigate('/library')}
          className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
        >
          Back to Library
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-100">Edit Drill</h1>
        <p className="mt-2 text-sm text-slate-400">
          Update drill details and media as needed.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
        <EditDrillForm drill={drill} onSuccess={() => navigate('/library')} />
      </div>
    </div>
  )
}

