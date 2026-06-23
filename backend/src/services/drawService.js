import { supabaseAdmin } from '../config/supabase.js'
import { sendDrawResultEmail } from './emailService.js'

/**
 * Generate 5 unique random numbers between 1–50
 */
function generateWinningNumbers() {
  const nums = new Set()
  while (nums.size < 5) {
    nums.add(Math.floor(Math.random() * 50) + 1)
  }
  return [...nums].sort((a, b) => a - b)
}

/**
 * Generate entry numbers for a user based on their top 3 scores.
 * Scores map to numbers: score value is used as a seed for picking
 * numbers in specific ranges, ensuring high scorers get better numbers.
 */
function generateEntryNumbers(scores) {
  // Use top 3 scores if available
  const topScores = [...scores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const nums = new Set()

  topScores.forEach(s => {
    // Score influences which number range you draw from
    const base = Math.min(Math.floor(s.score * 1.5), 48)
    nums.add(Math.max(1, base + Math.floor(Math.random() * 3)))
  })

  // Fill remaining numbers randomly
  while (nums.size < 5) {
    nums.add(Math.floor(Math.random() * 50) + 1)
  }

  return [...nums].sort((a, b) => a - b)
}

/**
 * Count how many of the user's numbers match the winning numbers
 */
function countMatches(entryNumbers, winningNumbers) {
  const winSet = new Set(winningNumbers)
  return entryNumbers.filter(n => winSet.has(n)).length
}

/**
 * Determine prize tier and amount based on match count and prize pool
 */
function calculatePrize(matchCount, prizePool) {
  if (matchCount === 5) return { tier: 'jackpot',     amount: prizePool * 0.40 }
  if (matchCount === 4) return { tier: 'four_match',  amount: prizePool * 0.35 }
  if (matchCount === 3) return { tier: 'three_match', amount: prizePool * 0.25 }
  return { tier: null, amount: 0 }
}

/**
 * Main draw execution function
 */
export async function runDraw(drawId) {
  // 1. Fetch draw
  const { data: draw, error: drawErr } = await supabaseAdmin
    .from('draws')
    .select('*')
    .eq('id', drawId)
    .single()

  if (drawErr || !draw) throw new Error('Draw not found')
  if (draw.status !== 'scheduled') throw new Error(`Draw is already ${draw.status}`)

  // 2. Get active subscribers for this draw period
  const { data: subscribers, error: subErr } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, profiles(full_name), users:user_id(email)')
    .eq('status', 'active')

  if (subErr) throw new Error('Failed to fetch subscribers')

  // 3. Generate winning numbers
  const winningNumbers = generateWinningNumbers()

  // 4. Process each subscriber
  const prizePool = draw.prize_pool || 0
  const winners = []
  const entryInserts = []

  for (const sub of subscribers) {
    // Get their scores for this month
    const drawMonth = new Date(draw.draw_date)
    const monthStart = new Date(drawMonth.getFullYear(), drawMonth.getMonth(), 1).toISOString()
    const monthEnd   = new Date(drawMonth.getFullYear(), drawMonth.getMonth() + 1, 0).toISOString()

    const { data: scores } = await supabaseAdmin
      .from('scores')
      .select('score')
      .eq('user_id', sub.user_id)
      .gte('played_at', monthStart)
      .lte('played_at', monthEnd)

    const entryNumbers = generateEntryNumbers(scores || [])
    const matchCount   = countMatches(entryNumbers, winningNumbers)
    const { tier, amount } = calculatePrize(matchCount, prizePool)

    entryInserts.push({
      draw_id:        drawId,
      user_id:        sub.user_id,
      entry_numbers:  entryNumbers,
      prize_won:      amount > 0 ? amount : null,
    })

    if (tier && amount > 0) {
      winners.push({
        draw_id:      drawId,
        user_id:      sub.user_id,
        prize_tier:   tier,
        prize_amount: Math.round(amount * 100) / 100,
        verified:     false,
        match_count:  matchCount,
      })
    }

    // Send email to subscriber
    try {
      const email = sub.users?.email
      const name  = sub.profiles?.full_name || 'Golfer'
      if (email) {
        await sendDrawResultEmail(email, name, {
          prize_amount:    amount,
          match_count:     matchCount,
          winning_numbers: winningNumbers,
          entry_numbers:   entryNumbers,
        })
      }
    } catch (e) {
      console.error('Email error:', e.message)
    }
  }

  // 5. Upsert draw entries
  if (entryInserts.length > 0) {
    await supabaseAdmin.from('draw_entries').insert(entryInserts)
  }

  // 6. Insert winners
  if (winners.length > 0) {
    await supabaseAdmin.from('draw_winners').insert(winners)
  }

  // 7. Update draw status
  await supabaseAdmin
    .from('draws')
    .update({ status: 'completed', winning_numbers: winningNumbers, completed_at: new Date().toISOString() })
    .eq('id', drawId)

  return {
    draw_id:         drawId,
    winning_numbers: winningNumbers,
    total_entries:   entryInserts.length,
    total_winners:   winners.length,
    winners,
  }
}

/**
 * Simulate a draw without saving (for admin preview)
 */
export function simulateDraw(subscriberCount, prizePool) {
  const winningNumbers = generateWinningNumbers()
  const results = { jackpot: 0, four_match: 0, three_match: 0, no_prize: 0 }

  for (let i = 0; i < subscriberCount; i++) {
    const entry = generateEntryNumbers([])
    const matches = countMatches(entry, winningNumbers)
    const { tier } = calculatePrize(matches, prizePool)
    if (tier) results[tier]++
    else results.no_prize++
  }

  return { winning_numbers: winningNumbers, results, prize_pool: prizePool }
}
