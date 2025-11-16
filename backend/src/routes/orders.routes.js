import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { authRequired, hasRole } from '../middleware/auth.js'
import { Order, OrderStatusHistory } from '../models/Order.js'
import { Menu } from '../models/Menu.js'
import { isWithinHours, slotKey } from '../utils/scheduling.js'
import { emitNewOrder, emitOrderStatusUpdate } from '../sockets/index.js'

const router = Router()

// Simple in-memory capacity per slot (MVP)
const capacityPerSlot = Number(process.env.SLOT_CAPACITY || 20)
const slotCounts = new Map()

function canSchedule(date) {
  const key = slotKey(date)
  const count = slotCounts.get(key) || 0
  return count < capacityPerSlot
}

function reserveSlot(date) {
  const key = slotKey(date)
  const count = slotCounts.get(key) || 0
  slotCounts.set(key, count + 1)
}

// User: create pre-order
router.post(
  '/',
  authRequired,
  body('items').isArray({ min: 1 }),
  body('scheduledPickupAt').isISO8601(),
  body('instructions').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const scheduledPickupAt = new Date(req.body.scheduledPickupAt)
    if (scheduledPickupAt < new Date()) return res.status(400).json({ error: 'Pickup time in the past' })
    if (!isWithinHours(scheduledPickupAt)) return res.status(400).json({ error: 'Outside cafeteria hours' })
    if (!canSchedule(scheduledPickupAt)) return res.status(429).json({ error: 'Time slot at capacity' })

    const activeMenu = await Menu.findOne({ isActive: true })
    if (!activeMenu) return res.status(400).json({ error: 'Menu unavailable' })

    // Build items and total
    const itemsReq = req.body.items
    const items = []
    let total = 0
    for (const it of itemsReq) {
      const item = activeMenu.items.id(it.itemId)
      if (!item || !item.isAvailable) return res.status(400).json({ error: 'Invalid item' })
      const qty = Math.max(1, Number(it.qty || 1))
      items.push({ itemId: item._id, name: item.name, price: item.price, qty })
      total += item.price * qty
    }

    const order = await Order.create({
      userId: req.user.id,
      items,
      total,
      scheduledPickupAt,
      instructions: req.body.instructions,
      status: 'placed'
    })
    await OrderStatusHistory.create({ orderId: order._id, status: 'placed', byUserId: req.user.id })

    reserveSlot(scheduledPickupAt)
    emitNewOrder(order)

    res.status(201).json({ order })
  }
)

// User: my orders
router.get('/mine', authRequired, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 })
  res.json({ orders })
})

// Track an order by full id or short id (last 6 chars). Only the owner can access.
router.get('/track/:idOrShort', authRequired, async (req, res) => {
  const { idOrShort } = req.params
  let order = null
  // Try full ObjectId first
  if (/^[a-fA-F0-9]{24}$/.test(idOrShort)) {
    order = await Order.findById(idOrShort)
  }
  // Fallback to matching by shortId among user's recent orders
  if (!order) {
    const recent = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50)
    order = recent.find(o => o._id.toString().endsWith(idOrShort)) || null
  }

  if (!order) return res.status(404).json({ error: 'Order not found' })
  if (String(order.userId) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' })

  const history = await OrderStatusHistory.find({ orderId: order._id }).sort({ at: 1 })

  return res.json({
    order: {
      _id: order._id,
      shortId: order._id.toString().slice(-6),
      status: order.status,
      total: order.total,
      items: order.items,
      scheduledPickupAt: order.scheduledPickupAt,
      createdAt: order.createdAt,
      instructions: order.instructions,
    },
    history
  })
})

// User/Staff/Admin: get order by id (users only their own)
router.get('/:id', authRequired, async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ error: 'Not found' })
  if (req.user.role === 'user' && String(order.userId) !== String(req.user.id)) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  res.json({ order })
})

// Staff: update order status
router.patch('/:id/status', authRequired, hasRole('staff', 'admin'), body('status').isString(), async (req, res) => {
  const allowed = ['accepted', 'preparing', 'ready', 'picked_up', 'cancelled']
  const { status } = req.body
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' })
  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ error: 'Not found' })
  order.status = status
  await order.save()
  await OrderStatusHistory.create({ orderId: order._id, status, byUserId: req.user.id })
  emitOrderStatusUpdate(order)
  res.json({ order })
})

export default router
