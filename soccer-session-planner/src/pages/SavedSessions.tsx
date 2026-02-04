import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { sessionService } from '../services/database'
import type { Session } from '../types'

export function SavedSessions() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionService.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: sessionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: (error) => {
      alert(`Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: async (session: Session) => {
      return sessionService.create({
        name: `${session.name} (Copy)`,
        grid_data: session.grid_data,
        user_id: session.user_id,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: (error) => {
      alert(`Failed to duplicate session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-400">Loading sessions...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-slate-600 bg-slate-800 p-8 text-center">
        <p className="text-lg font-medium text-red-400">Error loading sessions</p>
        <p className="mt-2 text-sm text-slate-400">
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['sessions'] })}
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Saved Sessions</h1>
            <p className="mt-2 text-sm text-slate-400">
              Review, edit, duplicate, or delete your session plans
            </p>
          </div>
          <button
            onClick={() => navigate('/sessions/new')}
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:bg-slate-200 sm:w-auto"
          >
            + New Session
          </button>
        </div>
      </header>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-600 bg-slate-800 p-12 text-center">
          <p className="text-lg font-medium text-slate-400">No sessions yet. Create your first session!</p>
          <button
            onClick={() => navigate('/sessions/new')}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
          >
            Create Your First Session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => {
            const drillCount = session.grid_data.grid
              .flat()
              .filter((cell) => cell !== null).length

            return (
              <div
                key={session.id}
                className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="mb-2 text-xl font-semibold text-slate-100">{session.name}</h3>
                <p className="mb-1 text-sm text-slate-400">
                  {drillCount} drill{drillCount !== 1 ? 's' : ''}
                </p>
                <p className="mb-1 text-xs text-slate-500">
                  Created {new Date(session.created_at).toLocaleDateString()}
                </p>
                {session.creator_email && (
                  <p className="mb-4 text-xs text-slate-500">
                    Created by {session.creator_email}
                  </p>
                )}
                {!session.creator_email && <div className="mb-4" />}

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/sessions/${session.id}`)}
                    className="flex-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-200"
                  >
                    View
                  </button>
                  <button
                    onClick={() => duplicateMutation.mutate(session)}
                    disabled={duplicateMutation.isPending}
                    className="flex-1 rounded-lg bg-slate-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-500 disabled:cursor-not-allowed disabled:bg-slate-700"
                  >
                    {duplicateMutation.isPending ? '...' : 'Duplicate'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this session?')) {
                        deleteMutation.mutate(session.id)
                      }
                    }}
                    className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-500 hover:text-red-400"
                  >
                    X
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
