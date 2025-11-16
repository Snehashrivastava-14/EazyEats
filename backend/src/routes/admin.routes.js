import { Router } from 'express'
import { authRequired, hasRole } from '../middleware/auth.js'
import { Order } from '../models/Order.js'
import { User } from '../models/User.js'

const router = Router()

// Admin/staff: list orders with basic filters
router.get('/orders', authRequired, hasRole('staff', 'admin'), async (req, res) => {
  const { status, from, to, limit = 50 } = req.query
  const q = {}
  if (status) q.status = status
  if (from || to) {
    q.createdAt = {}
    if (from) q.createdAt.$gte = new Date(from)
    if (to) q.createdAt.$lte = new Date(to)
  }
  const orders = await Order.find(q).sort({ createdAt: -1 }).limit(Number(limit))
  res.json({ orders })
})

// Admin: metrics
router.get('/metrics', authRequired, hasRole('admin'), async (req, res) => {
  const [countTotal, countToday, byStatus] = await Promise.all([
    Order.countDocuments({}),
    Order.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ])
  res.json({
    totalOrders: countTotal,
    todayOrders: countToday,
    byStatus: byStatus.reduce((acc, r) => { acc[r._id] = r.count; return acc }, {})
  })
})

// Admin: change user role
router.patch('/users/:id/role', authRequired, hasRole('admin'), async (req, res) => {
  const { role } = req.body
  if (!['user', 'staff', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' })
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ user: { id: user._id, email: user.email, name: user.name, role: user.role } })
})

export default router
