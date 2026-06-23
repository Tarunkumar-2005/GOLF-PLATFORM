import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/layout/Navbar'
import {
  Trophy, Target, Heart, ChevronRight, Star,
  TrendingUp, Users, Gift, CheckCircle
} from 'lucide-react'

const stats = [
  { label: 'Active Members', value: '2,400+' },
  { label: 'Prize Pool This Month', value: '£14,380' },
  { label: 'Donated to Charity', value: '£48,200' },
  { label: 'Draws Completed', value: '36' },
]

const features = [
  {
    icon: Target,
    title: 'Track Your Stableford Scores',
    desc: 'Log up to 5 scores each month. Every point counts toward your draw entry weight.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
  },
  {
    icon: Trophy,
    title: 'Monthly Prize Draws',
    desc: 'Subscribers are entered into a tiered draw. Jackpot, 4-match, and 3-match prizes up for grabs.',
    color: 'text-gold-400',
    bg: 'bg-gold-500/10',
  },
  {
    icon: Heart,
    title: 'Give as You Play',
    desc: 'Choose from verified charities. A portion of every subscription goes directly to your chosen cause.',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
]

const prizes = [
  { label: 'Jackpot', amount: '£5,000+', match: '5 numbers', color: 'from-gold-500 to-gold-300' },
  { label: '4-Match Prize', amount: '£1,200', match: '4 numbers', color: 'from-brand-500 to-brand-300' },
  { label: '3-Match Prize', amount: '£300', match: '3 numbers', color: 'from-blue-500 to-blue-300' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#080d18]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 hero-grid overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/20 via-transparent to-gold-900/10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <Badge className="mb-6 text-xs px-4 py-1.5">
            ⛳ Golf Subscription Platform
          </Badge>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
            Play better.<br />
            <span className="gradient-text">Win big.</span><br />
            Give back.
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track your Stableford scores, enter monthly prize draws with real cash prizes,
            and automatically donate to charities you care about — all for £9.99/month.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="xl" className="w-full sm:w-auto gap-2">
                Start playing <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/charities">
              <Button size="xl" variant="outline" className="w-full sm:w-auto">
                Explore charities
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-gray-500">No commitment. Cancel anytime.</p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 bg-white/2">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-2xl md:text-3xl font-black text-white mb-1">{value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="section-pad max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything in one subscription
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            One monthly fee. Three ways your money works for you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, color, bg }) => (
            <Card key={title} className="hover:border-white/20 transition-colors">
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-5`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Prize tiers */}
      <section className="section-pad max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Prize tiers</h2>
          <p className="text-gray-400">Match numbers in the monthly draw to win</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {prizes.map(({ label, amount, match, color }) => (
            <Card key={label} className="text-center glow-gold hover:border-gold-500/30 transition-all">
              <div className={`text-3xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent mb-2`}>
                {amount}
              </div>
              <div className="text-white font-semibold mb-1">{label}</div>
              <div className="text-gray-500 text-sm">{match} matched</div>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="section-pad max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How it works</h2>
        </div>
        <div className="space-y-6">
          {[
            { step: '01', title: 'Subscribe for £9.99/month', desc: 'Pay securely via Stripe. Your subscription is split across prizes, platform, and charity.' },
            { step: '02', title: 'Log your Stableford scores', desc: 'Submit up to 5 scores per month. Your best 3 contribute to your draw entry numbers.' },
            { step: '03', title: 'Pick your charity', desc: 'Choose from our vetted charity partners. A fixed portion of every subscription goes to your cause.' },
            { step: '04', title: 'Enter the monthly draw', desc: "Numbers are drawn on the last day of each month. Winners are notified and verified by admins." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-6 items-start glass-card p-6">
              <div className="text-4xl font-black text-brand-500/30 w-14 shrink-0">{step}</div>
              <div>
                <h3 className="text-white font-semibold mb-1">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section-pad text-center">
        <div className="max-w-2xl mx-auto glass-card p-12 glow-brand">
          <Trophy className="w-12 h-12 text-gold-400 mx-auto mb-6 animate-float" />
          <h2 className="text-3xl font-bold text-white mb-4">Ready to tee off?</h2>
          <p className="text-gray-400 mb-8">Join thousands of golfers playing with purpose.</p>
          <Link to="/signup">
            <Button size="xl">Create your account</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-brand-400 font-bold">GolfGives</div>
          <p className="text-gray-600 text-sm">© 2025 GolfGives. All rights reserved.</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
