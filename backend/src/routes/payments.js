import express from 'express'
import { stripe } from '../config/stripe.js'
import { supabaseAdmin } from '../config/supabase.js'
import { sendSubscriptionConfirmedEmail } from '../services/emailService.js'

const router = express.Router()

// Create Stripe checkout session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { userId, email } = req.body

    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email are required' })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: { userId },
      success_url: `${process.env.FRONTEND_URL}/dashboard?subscribed=true`,
      cancel_url:  `${process.env.FRONTEND_URL}/subscribe?cancelled=true`,
      subscription_data: {
        metadata: { userId },
      },
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Checkout session error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId  = session.metadata?.userId
        if (!userId) break

        // Create subscription record
        await supabaseAdmin.from('subscriptions').upsert({
          user_id:               userId,
          stripe_customer_id:    session.customer,
          stripe_subscription_id: session.subscription,
          status:                'active',
          started_at:            new Date().toISOString(),
          amount:                999, // pence
          currency:              'gbp',
        }, { onConflict: 'user_id' })

        // Send confirmation email
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', userId)
          .single()

        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (authUser?.user?.email) {
          await sendSubscriptionConfirmedEmail(authUser.user.email, profile?.full_name || 'Golfer')
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const userId = sub.metadata?.userId
        if (!userId) break

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: sub.status, updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', invoice.subscription)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return res.status(500).json({ error: err.message })
  }

  res.json({ received: true })
})

// Cancel subscription
router.post('/cancel', async (req, res) => {
  try {
    const { userId } = req.body

    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (!sub) return res.status(404).json({ error: 'No active subscription' })

    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    res.json({ success: true, message: 'Subscription will cancel at period end' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
