import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/layout/PageLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'
import { formatDate, getScoreLabel } from '@/lib/utils'
import { Target, Plus, Trash2, AlertCircle, Info } from 'lucide-react'

export default function ScoresPage() {
  const { user, isSubscribed } = useAuth()
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ course_name: '', score: '', played_at: new Date().toISOString().split('T')[0], notes: '' })

  const thisMonth = new Date().getMonth()
  const thisYear = new Date().getFullYear()
  const scoresThisMonth = scores.filter(s => {
    const d = new Date(s.played_at)
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
  })
  const canAddMore = scoresThisMonth.length < 5

  async function fetchScores() {
    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
    setScores(data || [])
    setLoading(false)
  }

  useEffect(() => { if (user) fetchScores() }, [user])

  async function handleSubmit(e) {
    e.preventDefault()
    const scoreNum = parseInt(form.score)
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 50) {
      return toast({ title: 'Invalid score', description: 'Stableford score must be between 0 and 50.', variant: 'destructive' })
    }
    if (!canAddMore) {
      return toast({ title: 'Monthly limit reached', description: 'You can log up to 5 scores per month.', variant: 'destructive' })
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('scores').insert({
        user_id: user.id,
        course_name: form.course_name,
        score: scoreNum,
        played_at: form.played_at,
        notes: form.notes,
      })
      if (error) throw error
      toast({ title: 'Score logged!', description: `${scoreNum} points at ${form.course_name}` })
      setForm({ course_name: '', score: '', played_at: new Date().toISOString().split('T')[0], notes: '' })
      setShowForm(false)
      await fetchScores()
    } catch (err) {
      toast({ title: 'Failed to log score', description: err.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('scores').delete().eq('id', id).eq('user_id', user.id)
    if (error) return toast({ title: 'Delete failed', variant: 'destructive' })
    setScores(s => s.filter(x => x.id !== id))
    toast({ title: 'Score removed' })
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">My Scores</h1>
            <p className="text-gray-400 mt-1">Log your Stableford scores — up to 5 per month</p>
          </div>
          {isSubscribed && canAddMore && (
            <Button onClick={() => setShowForm(s => !s)} className="gap-2">
              <Plus className="w-4 h-4" />
              Log score
            </Button>
          )}
        </div>

        {/* Monthly progress */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-semibold">Scores this month</div>
              <div className="text-gray-400 text-sm mt-0.5">{scoresThisMonth.length} of 5 logged</div>
            </div>
            <div className="flex gap-1.5">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                  i <= scoresThisMonth.length ? 'bg-brand-600 text-white' : 'bg-white/5 text-gray-600'
                }`}>
                  {i <= scoresThisMonth.length ? scoresThisMonth[i-1]?.score || '—' : i}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Score entry form */}
        {showForm && (
          <Card className="mb-6 border-brand-500/30">
            <CardHeader>
              <CardTitle>Log a score</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">Course name</Label>
                    <Input
                      id="course"
                      placeholder="e.g. Royal Lytham"
                      value={form.course_name}
                      onChange={e => setForm(f => ({ ...f, course_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="score">Stableford points</Label>
                    <Input
                      id="score"
                      type="number"
                      placeholder="e.g. 32"
                      min="0"
                      max="50"
                      value={form.score}
                      onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date played</Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.played_at}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(f => ({ ...f, played_at: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Input
                      id="notes"
                      placeholder="Weather, handicap, etc."
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save score'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {!isSubscribed && (
          <div className="mb-6 glass-card border-gold-500/30 bg-gold-500/5 p-5 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-gold-400 shrink-0" />
            <p className="text-sm text-gray-300">
              Subscribe to start logging your scores and entering monthly draws.
            </p>
          </div>
        )}

        {/* Scores list */}
        <Card>
          <CardHeader>
            <CardTitle>Score history</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 flex justify-center">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : scores.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No scores logged yet</p>
                <p className="text-gray-600 text-sm mt-1">Log your first Stableford round</p>
              </div>
            ) : (
              <div className="space-y-2">
                {scores.map(score => {
                  const sl = getScoreLabel(score.score)
                  const isCurrentMonth = new Date(score.played_at).getMonth() === thisMonth
                  return (
                    <div key={score.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/3 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-500/20 flex items-center justify-center">
                          <span className="text-brand-400 font-black text-lg">{score.score}</span>
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{score.course_name || 'Unknown course'}</div>
                          <div className="text-gray-500 text-xs mt-0.5">{formatDate(score.played_at)}</div>
                          {score.notes && <div className="text-gray-600 text-xs mt-0.5 italic">{score.notes}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isCurrentMonth && <Badge variant="active" className="text-xs">This month</Badge>}
                        <span className={`text-xs font-medium ${sl.color}`}>{sl.label}</span>
                        <button
                          onClick={() => handleDelete(score.id)}
                          className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                          title="Delete score"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info card */}
        <div className="mt-4 flex items-start gap-2 px-1">
          <Info className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-500">
            Your top 3 scores each month contribute to your draw entry. Higher scores improve your chances of matching the drawn numbers.
          </p>
        </div>
      </div>
    </PageLayout>
  )
}
