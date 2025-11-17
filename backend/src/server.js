import http from 'http'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import { initSockets } from './sockets/index.js'

import authRoutes from './routes/auth.routes.js'
import menuRoutes from './routes/menu.routes.js'
import ordersRoutes from './routes/orders.routes.js'
import adminRoutes from './routes/admin.routes.js'
import uploadRoutes from './routes/upload.routes.js'
import paymentsRoutes from './routes/payments.routes.js'
import cartRoutes from './routes/cart.routes.js'

dotenv.config()

const app = express()
const server = http.createServer(app)

// Socket.IO
await connectDB()
initSockets(server)

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true
}))
app.use(morgan('dev'))
// Stripe webhook needs raw body - mount webhook route before express.json
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const orderId = session.metadata?.orderId
      if (orderId) {
        // Lazy import to avoid circular dependency
        const { Order } = await import('./models/Order.js')
        const { emitOrderStatusUpdate } = await import('./sockets/index.js')
        const order = await Order.findById(orderId)
        if (order) {
          // mark payment - add paymentStatus if required
          order.paymentStatus = 'paid'
          order.paidAt = new Date()
          await order.save()
          // Optionally notify staff via orders room
          emitOrderStatusUpdate(order)
        }
      }
    }
    res.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
})

app.use(express.json())
app.use(cookieParser())

// Health
app.get('/health', (req, res) => res.json({ ok: true }))

// Public config endpoint: returns cafeteria scheduling settings the frontend can use
app.get('/config', (req, res) => {
  const cfg = {
    cafeteriaOpenHour: Number(process.env.CAFETERIA_OPEN_HOUR || 9),
    cafeteriaCloseHour: Number(process.env.CAFETERIA_CLOSE_HOUR || 18),
    cafeteriaTimeZone: process.env.CAFETERIA_TIMEZONE || null
  }
  res.json(cfg)
})

// Minimal convenience: redirect root to the frontend origin (set in env)
app.get('/', (req, res) => {
  const frontend = process.env.FRONTEND_ORIGIN || 'https://localhost:5173'
  return res.redirect(frontend)
})

// Routes
app.use('/auth', authRoutes)
app.use('/menu', menuRoutes)
app.use('/orders', ordersRoutes)
app.use('/admin', adminRoutes)
app.use('/upload', uploadRoutes)
app.use('/payments', paymentsRoutes)
app.use('/cart', cartRoutes)

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }))

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})
