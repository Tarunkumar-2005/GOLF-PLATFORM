import express from 'express'
import { supabaseAdmin } from '../config/supabase.js'
import { runDraw, simulateDraw } from '../services/drawService.js'
import { requireAdmin } from '../middleware/auth.js'
import { sendWinnerVerifiedEmail } from '../services/emailService.js'

const router = express.Router()

// Run a draw (admin only)
router.post('/:drawId/run', requireAdmin, async (req, res) => {
  try {
    const { drawId } = req.params
    const result = await runDraw(drawId)
    res.json(result)
  } catch (err) {
    console.error('Run draw error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Simulate a draw (admin only)
router.post('/simulate', requireAdmin, async (req, res) => {
  try {
    const { subscriberCount = 100, prizePool = 1000 } = req.body
    const result = simulateDraw(subscriberCount, prizePool)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Verify a winner (admin only)
router.post('/winners/:winnerId/verify', requireAdmin, async (req, res) => {
  try {
    const { winnerId } = req.params

    const { data: winner, error } = await supabaseAdmin
      .from('draw_winners')
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq('id', winnerId)
      .select('*, profiles(full_name)')
      .single()

    if (error) throw error

    // Send verification email
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(winner.user_id)
    if (authUser?.user?.email) {
      await sendWinnerVerifiedEmail(
        authUser.user.email,
        winner.profiles?.full_name || 'Winner',
        winner.prize_amount
      )
    }

    res.json({ success: true, winner })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get all draws (public)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('draws')
      .select('*, draw_winners(count)')
      .order('draw_date', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get draw by id
router.get('/:drawId', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('draws')
      .select('*, draw_winners(*, profiles(full_name))')
      .eq('id', req.params.drawId)
      .single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
