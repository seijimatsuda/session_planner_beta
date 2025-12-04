import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { Library } from './pages/Library'
import { AddDrill } from './pages/AddDrill'
import { EditDrill } from './pages/EditDrill'
import { SavedSessions } from './pages/SavedSessions'
import { SessionPlanner } from './pages/SessionPlanner'
import { SessionView } from './pages/SessionView'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="library" element={<Library />} />
          <Route path="drills/new" element={<AddDrill />} />
          <Route path="drills/:id/edit" element={<EditDrill />} />
          <Route path="sessions" element={<SavedSessions />} />
          <Route path="sessions/new" element={<SessionPlanner />} />
          <Route path="sessions/:id" element={<SessionView />} />
          <Route path="sessions/:id/edit" element={<SessionPlanner />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
