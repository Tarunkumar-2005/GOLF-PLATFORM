import express from 'express'
import { supabaseAdmin } from '../config/supabase.js'
import { requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// All admin routes require admin role
router.use(requireAdmin)

// Get platform analytics
router.get('/analytics', async (req, res) => {
  try {
    const [usersRes, subsRes, drawsRes, scoresRes, charitiesRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, created_at', { count: 'exact' }),
      supabaseAdmin.from('subscriptions').select('status, amount', { count: 'exact' }),
      supabaseAdmin.from('draws').select('prize_pool, status'),
      supabaseAdmin.from('scores').select('score', { count: 'exact' }),
      supabaseAdmin.from('charity_selections').select('charity_id'),
    ])

    const activeSubs = subsRes.data?.filter(s => s.status === 'active') || []
    const mrr = activeSubs.reduce((sum, s) => sum + (s.amount || 999), 0) / 100
    const completedDraws = drawsRes.data?.filter(d => d.status === 'completed') || []
    const totalPrizesAwarded = completedDraws.reduce((sum, d) => sum + (d.prize_pool || 0), 0)

    // Charity distribution
    const charityCount = {}
    charitiesRes.data?.forEach(s => {
      charityCount[s.charity_id] = (charityCount[s.charity_id] || 0) + 1
    })

    res.json({
      total_users:        usersRes.count || 0,
      active_subscribers: activeSubs.length,
      monthly_revenue:    mrr,
      total_draws:        drawsRes.data?.length || 0,
      prizes_awarded:     totalPrizesAwarded,
      total_scores:       scoresRes.count || 0,
      charity_distribution: charityCount,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Manage user roles
router.patch('/users/:userId/role', async (req, res) => {
  try {
    const { role } = req.body
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', req.params.userId)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get all users with details
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*, subscriptions(*), charity_selections(*, charities(name))')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
