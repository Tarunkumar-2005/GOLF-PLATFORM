import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/layout/PageLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toaster'
import { formatDate, formatCurrency, calculatePrizePool } from '@/lib/utils'
import {
  Users, Trophy, Heart, BarChart3, Play, CheckCircle,
  Shield, RefreshCw, DollarSign, TrendingUp, AlertCircle
} from 'lucide-react'

export default function AdminPage() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [draws, setDraws] = useState([])
  const [charities, setCharities] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  // New draw form
  const [drawForm, setDrawForm] = useState({
    name: '',
    draw_date: '',
    prize_pool: '',
  })

  // New charity form
  const [charityForm, setCharityForm] = useState({
    name: '', description: '', category: '', website: '', emoji: '🏥', is_active: true
  })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [usersRes, drawsRes, charitiesRes, subsRes] = await Promise.all([
      supabase.from('profiles').select('*, subscriptions(*)').order('created_at', { ascending: false }),
      supabase.from('draws').select('*, draw_winners(*)').order('draw_date', { ascending: false }),
      supabase.from('charities').select('*, charity_selections(count)').order('name'),
      supabase.from('subscriptions').select('*').eq('status', 'active'),
    ])
    const allUsers = usersRes.data || []
    const activeSubscribers = subsRes.data?.length || 0
    const prizePool = calculatePrizePool(activeSubscribers)
    setUsers(allUsers)
    setDraws(drawsRes.data || [])
    setCharities(charitiesRes.data || [])
    setStats({
      totalUsers: allUsers.length,
      activeSubscribers,
      totalDraws: drawsRes.data?.length || 0,
      estimatedPool: prizePool.jackpot,
      totalCharities: charitiesRes.data?.length || 0,
    })
    setLoading(false)
  }

  async function createDraw(e) {
    e.preventDefault()
    const { error } = await supabase.from('draws').insert({
      name: drawForm.name,
      draw_date: drawForm.draw_date,
      prize_pool: parseFloat(drawForm.prize_pool),
      status: 'scheduled',
    })
    if (error) return toast({ title: 'Failed to create draw', description: error.message, variant: 'destructive' })
    toast({ title: 'Draw scheduled!' })
    setDrawForm({ name: '', draw_date: '', prize_pool: '' })
    loadAll()
  }

  async function runDraw(drawId) {
    setRunning(true)
    try {
      const res = await fetch(`/api/draws/${drawId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Draw completed!', description: `Winning numbers: ${data.winning_numbers?.join(', ')}` })
      loadAll()
    } catch (err) {
      toast({ title: 'Draw failed', description: err.message, variant: 'destructive' })
    } finally {
      setRunning(false)
    }
  }

  async function verifyWinner(winnerId) {
    const { error } = await supabase.from('draw_winners').update({ verified: true }).eq('id', winnerId)
    if (error) return toast({ title: 'Verification failed', variant: 'destructive' })
    toast({ title: 'Winner verified!' })
    loadAll()
  }

  async function createCharity(e) {
    e.preventDefault()
    const { error } = await supabase.from('charities').insert(charityForm)
    if (error) return toast({ title: 'Failed to add charity', description: error.message, variant: 'destructive' })
    toast({ title: 'Charity added!' })
    setCharityForm({ name: '', description: '', category: '', website: '', emoji: '🏥', is_active: true })
    loadAll()
  }

  async function toggleCharity(id, current) {
    await supabase.from('charities').update({ is_active: !current }).eq('id', id)
    loadAll()
  }

  if (loading) return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </PageLayout>
  )

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              <p className="text-gray-400 text-sm">Platform management</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadAll} className="gap-2">
            <RefreshCw className="w-4 h-4" />Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-blue-400' },
            { label: 'Subscribers', value: stats?.activeSubscribers, icon: CheckCircle, color: 'text-brand-400' },
            { label: 'Draws Run', value: stats?.totalDraws, icon: Trophy, color: 'text-gold-400' },
            { label: 'Est. Jackpot', value: formatCurrency(stats?.estimatedPool || 0), icon: DollarSign, color: 'text-green-400' },
            { label: 'Charities', value: stats?.totalCharities, icon: Heart, color: 'text-red-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="p-4">
              <Icon className={`w-4 h-4 ${color} mb-2`} />
              <div className="text-xl font-black text-white">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="draws">
          <TabsList className="mb-6">
            <TabsTrigger value="draws">Draws</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="charities">Charities</TabsTrigger>
          </TabsList>

          {/* ── Draws Tab ── */}
          <TabsContent value="draws">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Schedule draw */}
              <Card>
                <CardHeader><CardTitle>Schedule new draw</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={createDraw} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Draw name</Label>
                      <Input placeholder="e.g. July 2025 Draw"
                        value={drawForm.name}
                        onChange={e => setDrawForm(f => ({ ...f, name: e.target.value }))}
                        required />
                    </div>
                    <div className="space-y-2">
                      <Label>Draw date</Label>
                      <Input type="date"
                        value={drawForm.draw_date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setDrawForm(f => ({ ...f, draw_date: e.target.value }))}
                        required />
                    </div>
                    <div className="space-y-2">
                      <Label>Prize pool (£)</Label>
                      <Input type="number" step="0.01" min="0" placeholder="e.g. 1500"
                        value={drawForm.prize_pool}
                        onChange={e => setDrawForm(f => ({ ...f, prize_pool: e.target.value }))}
                        required />
                    </div>
                    <Button type="submit" className="w-full">Schedule draw</Button>
                  </form>
                </CardContent>
              </Card>

              {/* Draws list */}
              <Card>
                <CardHeader><CardTitle>All draws</CardTitle></CardHeader>
                <CardContent>
                  {draws.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-6">No draws created yet</p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {draws.map(draw => (
                        <div key={draw.id} className="p-3 rounded-xl bg-white/3 border border-white/5">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="text-white text-sm font-medium">{draw.name}</div>
                              <div className="text-gray-500 text-xs">{formatDate(draw.draw_date)}</div>
                            </div>
                            <Badge variant={
                              draw.status === 'completed' ? 'active' :
                              draw.status === 'scheduled' ? 'pending' : 'secondary'
                            }>
                              {draw.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white font-semibold">{formatCurrency(draw.prize_pool || 0)}</span>
                            {draw.status === 'scheduled' && (
                              <Button size="sm" variant="gold"
                                onClick={() => runDraw(draw.id)}
                                disabled={running}
                                className="gap-1.5 text-xs">
                                <Play className="w-3 h-3" />
                                {running ? 'Running…' : 'Run draw'}
                              </Button>
                            )}
                          </div>
                          {/* Winners inside draw */}
                          {draw.draw_winners?.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              {draw.draw_winners.map(w => (
                                <div key={w.id} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-400">{w.prize_tier} — {formatCurrency(w.prize_amount)}</span>
                                  {!w.verified ? (
                                    <Button size="sm" variant="outline"
                                      className="h-6 text-xs px-2"
                                      onClick={() => verifyWinner(w.id)}>
                                      Verify
                                    </Button>
                                  ) : (
                                    <Badge variant="active" className="text-xs">Verified</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Users Tab ── */}
          <TabsContent value="users">
            <Card>
              <CardHeader><CardTitle>All users ({users.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left">
                        <th className="pb-3 text-gray-400 font-medium">Name</th>
                        <th className="pb-3 text-gray-400 font-medium">Role</th>
                        <th className="pb-3 text-gray-400 font-medium">Subscription</th>
                        <th className="pb-3 text-gray-400 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => {
                        const activeSub = u.subscriptions?.find(s => s.status === 'active')
                        return (
                          <tr key={u.id} className="border-b border-white/5 hover:bg-white/2">
                            <td className="py-3">
                              <div className="text-white font-medium">{u.full_name || 'Unknown'}</div>
                            </td>
                            <td className="py-3">
                              <Badge variant={u.role === 'admin' ? 'gold' : 'secondary'}>
                                {u.role || 'user'}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <Badge variant={activeSub ? 'active' : 'inactive'}>
                                {activeSub ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="py-3 text-gray-500">{formatDate(u.created_at)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Charities Tab ── */}
          <TabsContent value="charities">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Add charity form */}
              <Card>
                <CardHeader><CardTitle>Add charity</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={createCharity} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input placeholder="Charity name"
                          value={charityForm.name}
                          onChange={e => setCharityForm(f => ({ ...f, name: e.target.value }))}
                          required />
                      </div>
                      <div className="space-y-2">
                        <Label>Emoji icon</Label>
                        <Input placeholder="🏥"
                          value={charityForm.emoji}
                          onChange={e => setCharityForm(f => ({ ...f, emoji: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input placeholder="What this charity does…"
                        value={charityForm.description}
                        onChange={e => setCharityForm(f => ({ ...f, description: e.target.value }))}
                        required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Input placeholder="e.g. Health, Education"
                          value={charityForm.category}
                          onChange={e => setCharityForm(f => ({ ...f, category: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Website</Label>
                        <Input placeholder="https://…"
                          value={charityForm.website}
                          onChange={e => setCharityForm(f => ({ ...f, website: e.target.value }))} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">Add charity</Button>
                  </form>
                </CardContent>
              </Card>

              {/* Charity list */}
              <Card>
                <CardHeader><CardTitle>Charities ({charities.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {charities.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-white/3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{c.emoji || '🏥'}</span>
                          <div>
                            <div className="text-white text-sm font-medium">{c.name}</div>
                            <div className="text-gray-500 text-xs">{c.category || 'General'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={c.is_active ? 'active' : 'inactive'}>
                            {c.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button size="sm" variant="ghost" className="text-xs h-7"
                            onClick={() => toggleCharity(c.id, c.is_active)}>
                            {c.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
