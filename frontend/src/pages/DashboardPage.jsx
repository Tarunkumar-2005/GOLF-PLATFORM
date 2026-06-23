import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/layout/PageLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, formatDate, getScoreLabel } from '@/lib/utils'
import { Trophy, Target, Heart, TrendingUp, Calendar, ChevronRight, AlertCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const { user, profile, isSubscribed } = useAuth()
  const [scores, setScores] = useState([])
  const [draws, setDraws] = useState([])
  const [charity, setCharity] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const [scoresRes, drawsRes, charityRes] = await Promise.all([
        supabase.from('scores').select('*').eq('user_id', user.id).order('played_at', { ascending: false }).limit(5),
        supabase.from('draw_entries').select('*, draws(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('charity_selections').select('*, charities(*)').eq('user_id', user.id).maybeSingle(),
      ])
      setScores(scoresRes.data || [])
      setDraws(drawsRes.data || [])
      setCharity(charityRes.data?.charities)
      setLoading(false)
    }
    load()
  }, [user])

  const avgScore = scores.length ? Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length) : 0
  const scoreLabel = getScoreLabel(avgScore)
  const chartData = [...scores].reverse().map(s => ({ date: formatDate(s.played_at), score: s.score }))
  const scoresThisMonth = scores.filter(s => new Date(s.played_at).getMonth() === new Date().getMonth()).length

  if (loading) return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </PageLayout>
  )

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Good to see you, {profile?.full_name?.split(' ')[0] || 'Golfer'} 👋
          </h1>
          <p className="text-gray-400 mt-1">Here's your golf performance summary</p>
        </div>

        {/* Subscription banner */}
        {!isSubscribed && (
          <div className="mb-6 glass-card border-gold-500/30 bg-gold-500/5 p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-gold-400 shrink-0" />
              <div>
                <p className="text-white font-medium text-sm">No active subscription</p>
                <p className="text-gray-400 text-xs">Subscribe to enter draws and track your scores</p>
              </div>
            </div>
            <Link to="/subscribe">
              <Button variant="gold" size="sm">Subscribe — £9.99/mo</Button>
            </Link>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-brand-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Avg Score</span>
            </div>
            <div className="text-2xl font-black text-white">{avgScore || '—'}</div>
            {avgScore > 0 && <span className={`text-xs font-medium ${scoreLabel.color}`}>{scoreLabel.label}</span>}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">This Month</span>
            </div>
            <div className="text-2xl font-black text-white">{scoresThisMonth}<span className="text-sm text-gray-500">/5</span></div>
            <Progress value={(scoresThisMonth / 5) * 100} className="mt-2 h-1" />
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-gold-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Draws</span>
            </div>
            <div className="text-2xl font-black text-white">{draws.length}</div>
            <span className="text-xs text-gray-500">entered</span>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Charity</span>
            </div>
            {charity ? (
              <>
                <div className="text-sm font-semibold text-white truncate">{charity.name}</div>
                <span className="text-xs text-brand-400">Active</span>
              </>
            ) : (
              <Link to="/charities" className="text-xs text-gold-400 hover:underline">Pick a charity →</Link>
            )}
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Score chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-400" />
                Score trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                      labelStyle={{ color: '#9ca3af' }}
                      itemStyle={{ color: '#4ade80' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-gray-500 text-sm">
                  Log at least 2 scores to see your trend
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent scores */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent scores</CardTitle>
                <Link to="/scores"><Button variant="ghost" size="sm" className="text-xs gap-1">View all <ChevronRight className="w-3 h-3" /></Button></Link>
              </div>
            </CardHeader>
            <CardContent>
              {scores.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No scores yet</p>
                  <Link to="/scores"><Button size="sm" className="mt-3">Log first score</Button></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {scores.map(score => {
                    const sl = getScoreLabel(score.score)
                    return (
                      <div key={score.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div>
                          <div className="text-white text-sm font-medium">{score.course_name || 'Unknown course'}</div>
                          <div className="text-gray-500 text-xs">{formatDate(score.played_at)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">{score.score}</div>
                          <span className={`text-xs ${sl.color}`}>{sl.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
