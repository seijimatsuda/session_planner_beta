import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/library', label: 'Library' },
  { to: '/drills/new', label: 'Add Drill' },
  { to: '/sessions/new', label: 'Plan Session' },
  { to: '/sessions', label: 'Saved Sessions' },
]

export function AppLayout() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Failed to log out', error)
      alert('Failed to log out. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-semibold text-slate-900">Soccer Session Planner</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>

          <nav className="hidden gap-4 text-sm font-medium text-slate-600 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 transition ${
                    isActive ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

