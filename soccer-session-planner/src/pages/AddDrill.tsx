import { useNavigate } from 'react-router-dom'
import { AddDrillForm } from '../components/AddDrillForm'

export function AddDrill() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Add New Drill</h1>
        <p className="mt-2 text-sm text-slate-600">
          Upload drill details and attach the training video to expand your session library.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AddDrillForm onSuccess={() => navigate('/library')} />
      </div>
    </div>
  )
}

