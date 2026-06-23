import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard, Trophy, Target, Heart, Settings,
  LogOut, Menu, X, ChevronDown, Shield, Star
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/scores',    label: 'My Scores',  icon: Target },
  { to: '/draw',      label: 'Draw',        icon: Trophy },
  { to: '/charities', label: 'Charities',   icon: Heart },
  { to: '/winners',   label: 'Winners',     icon: Star },
]

export default function Navbar() {
  const { user, profile, isAdmin, isSubscribed, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/10 backdrop-blur-md bg-surface/80">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <span className="text-white font-black text-sm">G</span>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            Golf<span className="text-brand-400">Gives</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === to
                    ? 'bg-brand-600/20 text-brand-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === '/admin'
                    ? 'bg-gold-500/20 text-gold-400'
                    : 'text-gray-400 hover:text-gold-400 hover:bg-gold-500/5'
                )}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {!isSubscribed && (
                <Link to="/subscribe">
                  <Button size="sm" className="hidden md:flex">Subscribe</Button>
                </Link>
              )}
              <div className="hidden md:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-500/30 flex items-center justify-center">
                  <span className="text-brand-400 text-xs font-bold">
                    {profile?.full_name?.[0] || user.email[0].toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/signup"><Button size="sm">Get started</Button></Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setOpen(o => !o)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-surface/95 backdrop-blur-md px-4 py-4 space-y-1">
          {user ? (
            <>
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === to
                      ? 'bg-brand-600/20 text-brand-400'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              {isAdmin && (
                <Link to="/admin" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gold-400">
                  <Shield className="w-4 h-4" />Admin Panel
                </Link>
              )}
              {!isSubscribed && (
                <Link to="/subscribe" onClick={() => setOpen(false)}>
                  <Button className="w-full mt-2" size="sm">Subscribe — £9.99/mo</Button>
                </Link>
              )}
              <button onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 w-full">
                <LogOut className="w-4 h-4" />Sign out
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link to="/login" onClick={() => setOpen(false)}><Button variant="outline" className="w-full">Sign in</Button></Link>
              <Link to="/signup" onClick={() => setOpen(false)}><Button className="w-full">Get started</Button></Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
