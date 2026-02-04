import { Link } from 'react-router-dom'

export function Dashboard() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">
          Quick shortcuts to help you manage drills and build training sessions.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Add Drill" description="Import a new drill with video and metadata." to="/drills/new" />
        <DashboardCard title="View Library" description="Browse, search, and filter existing drills." to="/library" />
        <DashboardCard title="Plan Session" description="Drag drills into the 4x3 session grid." to="/sessions/new" />
        <DashboardCard title="Saved Sessions" description="Review, edit, duplicate, or delete saved plans." to="/sessions" />
      </section>
    </div>
  )
}

interface DashboardCardProps {
  title: string
  description: string
  to: string
}

function DashboardCard({ title, description, to }: DashboardCardProps) {
  return (
    <Link
      to={to}
      className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-800 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-500 hover:shadow-md"
    >
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      <span className="mt-auto pt-4 text-sm font-medium text-slate-300">Go →</span>
    </Link>
  )
}

