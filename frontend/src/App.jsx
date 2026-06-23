import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Toaster } from '@/components/ui/toaster'

// Pages
import HomePage       from '@/pages/HomePage'
import LoginPage      from '@/pages/LoginPage'
import SignupPage     from '@/pages/SignupPage'
import DashboardPage  from '@/pages/DashboardPage'
import ScoresPage     from '@/pages/ScoresPage'
import DrawPage       from '@/pages/DrawPage'
import CharityPage    from '@/pages/CharityPage'
import SubscribePage  from '@/pages/SubscribePage'
import AdminPage      from '@/pages/AdminPage'
import WinnersPage    from '@/pages/WinnersPage'

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, profile, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (requireAdmin && profile?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"           element={<HomePage />} />
      <Route path="/login"      element={<LoginPage />} />
      <Route path="/signup"     element={<SignupPage />} />
      <Route path="/charities"  element={<CharityPage />} />

      <Route path="/dashboard"  element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/scores"     element={<ProtectedRoute><ScoresPage /></ProtectedRoute>} />
      <Route path="/draw"       element={<ProtectedRoute><DrawPage /></ProtectedRoute>} />
      <Route path="/subscribe"  element={<ProtectedRoute><SubscribePage /></ProtectedRoute>} />
      <Route path="/winners"    element={<ProtectedRoute><WinnersPage /></ProtectedRoute>} />

      <Route path="/admin"      element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
      <Route path="*"           element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  )
}
