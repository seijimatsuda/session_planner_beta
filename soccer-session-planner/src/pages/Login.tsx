import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface LocationState {
  from?: {
    pathname: string
  }
}

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, isLoading, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const from = (location.state as LocationState | null)?.from?.pathname ?? '/'

  useEffect(() => {
    if (!isLoading && user) {
      navigate(from, { replace: true })
    }
  }, [from, isLoading, navigate, user])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await signIn({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to log in. Please try again later.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-lg">
        <header className="mb-6 text-center">
          <img src="/ttp-logo.png" alt="Trust The Process" className="mx-auto mb-6 h-28 w-auto" />
          <h1 className="text-2xl font-bold text-slate-100">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage drills and plan your next training session.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
              placeholder="coach@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
              placeholder="••••••••"
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Need an account?{' '}
          <Link to="/signup" className="font-semibold text-white hover:text-slate-300">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

