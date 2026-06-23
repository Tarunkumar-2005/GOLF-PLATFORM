import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { UserPlus, Eye, EyeOff, CheckCircle } from 'lucide-react'

const perks = [
  'Monthly prize draws with cash prizes',
  'Stableford score tracking',
  'Charity donation of your choice',
  'Cancel anytime',
]

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      return toast({ title: 'Passwords do not match', variant: 'destructive' })
    }
    if (form.password.length < 8) {
      return toast({ title: 'Password must be at least 8 characters', variant: 'destructive' })
    }
    setLoading(true)
    try {
      await signUp(form.email, form.password, form.fullName)
      toast({ title: 'Account created!', description: 'Check your email to verify your account.' })
      navigate('/login')
    } catch (err) {
      toast({ title: 'Signup failed', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080d18] flex items-center justify-center px-4 py-16 hero-grid">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-10 items-center">
        {/* Left side */}
        <div>
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <span className="text-white font-black">G</span>
            </div>
            <span className="font-bold text-white text-xl">Golf<span className="text-brand-400">Gives</span></span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-3">Join GolfGives today</h1>
          <p className="text-gray-400 mb-8">£9.99/month. No hidden fees. Cancel anytime.</p>
          <ul className="space-y-3">
            {perks.map(p => (
              <li key={p} className="flex items-center gap-3 text-gray-300 text-sm">
                <CheckCircle className="w-5 h-5 text-brand-400 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <Card>
          <h2 className="text-xl font-semibold text-white mb-6">Create your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" placeholder="John Smith" value={form.fullName} onChange={set('fullName')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={set('password')}
                  required
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} required />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" />Create account</span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </div>
          <p className="mt-3 text-xs text-gray-600 text-center">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </Card>
      </div>
    </div>
  )
}
