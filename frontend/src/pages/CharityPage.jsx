import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/layout/PageLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'
import { Heart, CheckCircle, ExternalLink, Users } from 'lucide-react'

export default function CharityPage() {
  const { user } = useAuth()
  const [charities, setCharities] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [currentSelection, setCurrentSelection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    async function load() {
      const [charitiesRes, selectionRes] = await Promise.all([
        supabase.from('charities').select('*').eq('is_active', true).order('name'),
        user
          ? supabase.from('charity_selections').select('charity_id').eq('user_id', user.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ])
      setCharities(charitiesRes.data || [])
      setCurrentSelection(selectionRes.data?.charity_id)
      setSelectedId(selectionRes.data?.charity_id)
      setLoading(false)
    }
    load()
  }, [user])

  async function handleSelect(charityId) {
    if (!user) return toast({ title: 'Sign in to select a charity', variant: 'destructive' })
    setSaving(charityId)
    try {
      const { error } = await supabase.from('charity_selections').upsert(
        { user_id: user.id, charity_id: charityId },
        { onConflict: 'user_id' }
      )
      if (error) throw error
      setSelectedId(charityId)
      setCurrentSelection(charityId)
      const charity = charities.find(c => c.id === charityId)
      toast({ title: 'Charity updated!', description: `Donations now go to ${charity?.name}` })
    } catch (err) {
      toast({ title: 'Failed to update charity', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(null)
    }
  }

  const categories = [...new Set(charities.map(c => c.category).filter(Boolean))]

  if (loading) return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </PageLayout>
  )

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Choose your charity</h1>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            10% of your monthly subscription goes directly to the charity you choose.
            Change your selection anytime.
          </p>
        </div>

        {/* Current selection banner */}
        {currentSelection && (
          <div className="mb-8 glass-card border-brand-500/30 bg-brand-500/5 p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-brand-400 shrink-0" />
            <div>
              <span className="text-white text-sm font-medium">Currently supporting: </span>
              <span className="text-brand-400 text-sm font-semibold">
                {charities.find(c => c.id === currentSelection)?.name}
              </span>
            </div>
          </div>
        )}

        {/* Charity grid */}
        {charities.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No charities available at this time</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {charities.map(charity => {
              const isSelected = selectedId === charity.id
              return (
                <Card
                  key={charity.id}
                  className={`relative transition-all cursor-pointer hover:border-white/20 ${
                    isSelected ? 'border-brand-500/50 bg-brand-500/5' : ''
                  }`}
                  onClick={() => !isSelected && handleSelect(charity.id)}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="w-5 h-5 text-brand-400" />
                    </div>
                  )}

                  {/* Category badge */}
                  {charity.category && (
                    <Badge variant="secondary" className="mb-3 text-xs">{charity.category}</Badge>
                  )}

                  {/* Charity icon placeholder */}
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-2xl">
                    {charity.emoji || '🏥'}
                  </div>

                  <h3 className="text-white font-semibold mb-2">{charity.name}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    {charity.description}
                  </p>

                  {charity.website && (
                    <a
                      href={charity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand-400 transition-colors mb-4"
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Visit website
                    </a>
                  )}

                  {charity.supporters_count > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                      <Users className="w-3.5 h-3.5" />
                      {charity.supporters_count} supporters
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant={isSelected ? 'outline' : 'default'}
                    className="w-full"
                    disabled={saving === charity.id || isSelected}
                    onClick={e => { e.stopPropagation(); if (!isSelected) handleSelect(charity.id) }}
                  >
                    {saving === charity.id ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                        Saving…
                      </span>
                    ) : isSelected ? (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Selected
                      </span>
                    ) : 'Choose this charity'}
                  </Button>
                </Card>
              )
            })}
          </div>
        )}

        <p className="text-center text-gray-600 text-xs mt-8">
          All charities are vetted and registered. Donations processed monthly.
        </p>
      </div>
    </PageLayout>
  )
}
