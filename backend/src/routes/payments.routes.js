import { Router } from 'express'
import Stripe from 'stripe'
import { Order } from '../models/Order.js'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Create a Checkout Session for an order
router.post('/checkout-session', async (req, res) => {
  const { orderId } = req.body
  if (!orderId) return res.status(400).json({ error: 'orderId required' })
  const order = await Order.findById(orderId)
  if (!order) return res.status(404).json({ error: 'Order not found' })

  const amount = Math.round((order.total || 0) * 100) // smallest currency unit

  // Stripe requires minimum 50 cents USD equivalent
  // For INR, this is approximately ₹50 (at ~80-85 INR per USD)
  const MINIMUM_AMOUNT_INR = 5000 // ₹50 in paise
  if (amount < MINIMUM_AMOUNT_INR) {
    return res.status(400).json({ 
      error: 'Amount too small', 
      detail: `Order total must be at least ₹50. Current total: ₹${(amount / 100).toFixed(2)}`,
      minimumAmount: 50
    })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: process.env.STRIPE_CURRENCY || 'inr',
            product_data: { name: `Order #${order._id.toString().slice(-6)}` },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/orders?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/orders`,
      metadata: { orderId: order._id.toString() },
    })

    res.json({ url: session.url })
  } catch (err) {
    // Log full error for debugging
    console.error('stripe checkout error', err)
    const safeMessage = (process.env.NODE_ENV === 'production') ? 'Failed to create checkout session' : err.message
    res.status(500).json({ error: 'Failed to create checkout session', detail: safeMessage })
  }
})

export default router
