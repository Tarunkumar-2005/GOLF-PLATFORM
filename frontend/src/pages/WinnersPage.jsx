import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/layout/PageLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Trophy, Medal, Star } from 'lucide-react'

export default function WinnersPage() {
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('draws')
        .select('*, draw_winners(*, profiles(full_name))')
        .eq('status', 'completed')
        .order('draw_date', { ascending: false })
      setDraws(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const prizeLabels = { jackpot: { label: 'Jackpot', icon: Trophy, color: 'text-gold-400' },
    four_match: { label: '4-Match', icon: Medal, color: 'text-brand-400' },
    three_match: { label: '3-Match', icon: Star, color: 'text-blue-400' } }

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
          <h1 className="text-2xl font-bold text-white">Winners Board</h1>
          <p className="text-gray-400 mt-1">Past draw results and prize winners</p>
        </div>

        {draws.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-14 h-14 text-gray-600 mx-auto mb-4" />
            <h2 className="text-white font-semibold mb-2">No draws completed yet</h2>
            <p className="text-gray-500 text-sm">Winners will be announced here after each monthly draw</p>
          </div>
        ) : (
          <div className="space-y-6">
            {draws.map(draw => (
              <Card key={draw.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{draw.name || 'Monthly Draw'}</CardTitle>
                      <p className="text-sm text-gray-400 mt-1">{formatDate(draw.draw_date)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">{formatCurrency(draw.prize_pool || 0)}</div>
                      <div className="text-xs text-gray-500">Prize pool</div>
                    </div>
                  </div>
                  {draw.winning_numbers && (
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-gray-500">Winning numbers:</span>
                      <div className="flex gap-1.5">
                        {draw.winning_numbers.map((n, i) => (
                          <span key={i}
                            className="w-7 h-7 rounded-lg bg-gold-500/20 border border-gold-500/30 text-gold-400 text-xs flex items-center justify-center font-bold">
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {draw.draw_winners && draw.draw_winners.length > 0 ? (
                    <div className="space-y-3">
                      {draw.draw_winners.map(winner => {
                        const prize = prizeLabels[winner.prize_tier] || { label: winner.prize_tier, icon: Star, color: 'text-white' }
                        const Icon = prize.icon
                        return (
                          <div key={winner.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                                <Icon className={`w-4 h-4 ${prize.color}`} />
                              </div>
                              <div>
                                <div className="text-white text-sm font-medium">
                                  {winner.profiles?.full_name || 'Anonymous Winner'}
                                </div>
                                <Badge variant={winner.prize_tier === 'jackpot' ? 'gold' : 'default'} className="text-xs mt-0.5">
                                  {prize.label}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-bold">{formatCurrency(winner.prize_amount)}</div>
                              <Badge variant={winner.verified ? 'active' : 'pending'} className="text-xs mt-0.5">
                                {winner.verified ? 'Verified' : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">No winners recorded for this draw</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
