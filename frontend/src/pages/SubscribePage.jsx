import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import PageLayout from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'
import { CheckCircle, Trophy, Target, Heart, Shield, CreditCard } from 'lucide-react'

const perks = [
  { icon: Target,  text: 'Log up to 5 Stableford scores per month' },
  { icon: Trophy,  text: 'Automatic entry into monthly prize draws' },
  { icon: Heart,   text: '10% of subscription donated to your chosen charity' },
  { icon: Shield,  text: 'Secure payments via Stripe. Cancel anytime.' },
]

export default function SubscribePage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    try {
      const res = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (err) {
      toast({ title: 'Payment error', description: err.message, variant: 'destructive' })
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4">One simple plan</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Subscribe to <span className="gradient-text">GolfGives</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Everything you need to track your game, win prizes, and support charity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Pricing card */}
          <Card className="border-brand-500/30 bg-gradient-to-br from-brand-900/20 to-transparent glow-brand text-center">
            <div className="mb-6">
              <div className="text-6xl font-black text-white mb-2">
                £9<span className="text-2xl text-gray-400">.99</span>
              </div>
              <div className="text-gray-400 text-sm">per month · billed monthly</div>
            </div>

            {/* How subscription is split */}
            <div className="space-y-3 mb-8 text-left">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
                How your £9.99 is used
              </p>
              {[
                { label: 'Prize pool contribution', pct: '60%', color: 'bg-gold-500' },
                { label: 'Platform & operations',    pct: '30%', color: 'bg-brand-500' },
                { label: 'Charity donation',          pct: '10%', color: 'bg-red-500' },
              ].map(({ label, pct, color }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-gray-400">{label}</span>
                  </div>
                  <span className="text-white font-semibold">{pct}</span>
                </div>
              ))}
            </div>

            <Button
              size="xl"
              className="w-full gap-2"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Redirecting to payment…
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Subscribe now
                </>
              )}
            </Button>
            <p className="text-xs text-gray-600 mt-3">
              Secure checkout via Stripe. You'll be redirected to complete payment.
            </p>
          </Card>

          {/* Perks */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-6">What you get</h2>
            {perks.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-4 p-4 glass-card">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-brand-400" />
                </div>
                <p className="text-gray-300 text-sm leading-relaxed pt-1">{text}</p>
              </div>
            ))}

            <div className="p-4 rounded-xl border border-gold-500/20 bg-gold-500/5 mt-6">
              <p className="text-sm text-gray-300">
                <span className="text-gold-400 font-semibold">🏆 Prize pools grow </span>
                with the number of subscribers. The more members, the bigger the jackpot!
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
