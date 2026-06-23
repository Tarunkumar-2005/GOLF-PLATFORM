import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/layout/PageLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Trophy, Calendar, Hash, Star, Clock } from 'lucide-react'

export default function DrawPage() {
  const { user, isSubscribed } = useAuth()
  const [entries, setEntries] = useState([])
  const [upcomingDraw, setUpcomingDraw] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const [entriesRes, drawRes] = await Promise.all([
        supabase.from('draw_entries')
          .select('*, draws(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('draws')
          .select('*')
          .eq('status', 'scheduled')
          .order('draw_date', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ])
      setEntries(entriesRes.data || [])
      setUpcomingDraw(drawRes.data)
      setLoading(false)
    }
    load()
  }, [user])

  const daysUntilDraw = upcomingDraw
    ? Math.max(0, Math.ceil((new Date(upcomingDraw.draw_date) - new Date()) / (1000 * 60 * 60 * 24)))
    : null

  if (loading) return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </PageLayout>
  )

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Monthly Draw</h1>
          <p className="text-gray-400 mt-1">Your draw entries and results</p>
        </div>

        {/* Upcoming draw hero */}
        {upcomingDraw ? (
          <Card className="mb-8 bg-gradient-to-br from-gold-900/20 to-brand-900/20 border-gold-500/20 glow-gold">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-gold-400 animate-float" />
                </div>
                <div>
                  <div className="text-xs text-gold-400 font-semibold uppercase tracking-wider mb-1">Next Draw</div>
                  <h2 className="text-xl font-bold text-white">{upcomingDraw.name || 'Monthly Prize Draw'}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-sm text-gray-400">{formatDate(upcomingDraw.draw_date)}</span>
                  </div>
                </div>
              </div>
              <div className="text-center md:text-right">
                <div className="text-3xl font-black text-white mb-1">
                  {formatCurrency(upcomingDraw.prize_pool || 0)}
                </div>
                <div className="text-sm text-gray-400">Total prize pool</div>
                {daysUntilDraw !== null && (
                  <Badge variant="gold" className="mt-2">
                    <Clock className="w-3 h-3 mr-1" />
                    {daysUntilDraw === 0 ? 'Today!' : `${daysUntilDraw} days to go`}
                  </Badge>
                )}
              </div>
            </div>

            {/* Prize breakdown */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: 'Jackpot', amount: (upcomingDraw.prize_pool || 0) * 0.4, match: '5 match' },
                { label: '4-Match', amount: (upcomingDraw.prize_pool || 0) * 0.35, match: '4 match' },
                { label: '3-Match', amount: (upcomingDraw.prize_pool || 0) * 0.25, match: '3 match' },
              ].map(({ label, amount, match }) => (
                <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-white font-bold">{formatCurrency(amount)}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                  <div className="text-xs text-gray-600">{match}</div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="mb-8 text-center py-10">
            <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No upcoming draw scheduled</p>
          </Card>
        )}

        {/* Subscription required */}
        {!isSubscribed && (
          <Card className="mb-8 border-gold-500/30 bg-gold-500/5 text-center py-8">
            <Star className="w-10 h-10 text-gold-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Subscribe to enter draws</h3>
            <p className="text-gray-400 text-sm">Active subscribers are automatically entered each month</p>
          </Card>
        )}

        {/* Entry history */}
        <Card>
          <CardHeader>
            <CardTitle>Draw history</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <Hash className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No draw entries yet</p>
                <p className="text-gray-600 text-sm mt-1">
                  {isSubscribed
                    ? 'You\'ll be entered automatically when the next draw is created'
                    : 'Subscribe to be entered into draws'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map(entry => (
                  <div key={entry.id} className="p-4 rounded-xl bg-white/3 hover:bg-white/5 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-white font-medium text-sm">
                          {entry.draws?.name || 'Monthly Draw'}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5">
                          {entry.draws?.draw_date ? formatDate(entry.draws.draw_date) : 'TBD'}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">Your numbers:</span>
                          <div className="flex gap-1">
                            {(entry.entry_numbers || []).map((n, i) => (
                              <span key={i} className="w-6 h-6 rounded bg-brand-600/20 border border-brand-500/20 text-brand-400 text-xs flex items-center justify-center font-bold">
                                {n}
                              </span>
                            ))}
                          </div>
                        </div>
                        {entry.draws?.status === 'completed' && entry.draws?.winning_numbers && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">Winning:</span>
                            <div className="flex gap-1">
                              {entry.draws.winning_numbers.map((n, i) => (
                                <span key={i} className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold ${
                                  entry.entry_numbers?.includes(n)
                                    ? 'bg-gold-500/20 border border-gold-500/30 text-gold-400'
                                    : 'bg-white/5 text-gray-600'
                                }`}>
                                  {n}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant={
                          entry.draws?.status === 'completed' ? (entry.prize_won ? 'gold' : 'secondary') :
                          entry.draws?.status === 'scheduled' ? 'pending' : 'secondary'
                        }>
                          {entry.draws?.status === 'scheduled' ? 'Upcoming' :
                           entry.draws?.status === 'completed' ? (entry.prize_won ? `Won ${formatCurrency(entry.prize_won)}` : 'No prize') :
                           entry.draws?.status || 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
