import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { User } from '../models/User.js'

const router = Router()

// Get the current user's cart
router.get('/', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('cart')
    return res.json({ cart: user?.cart || [] })
  } catch (e) {
    console.error('GET /cart error', e)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Add or update an item in the cart. Body: { itemId, name, price, imageUrl, qty }
router.post('/', authRequired, async (req, res) => {
  try {
    const { itemId, name, price, imageUrl, qty } = req.body
    if (!itemId || !name || typeof price !== 'number' || !qty) return res.status(400).json({ error: 'Invalid payload' })

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const idx = user.cart.findIndex(c => c.itemId === String(itemId))
    if (idx !== -1) {
      user.cart[idx].qty = qty
      user.cart[idx].name = name
      user.cart[idx].price = price
      user.cart[idx].imageUrl = imageUrl || user.cart[idx].imageUrl
      // mark as unseen when quantity is changed or item updated
      user.cart[idx].seen = false
    } else {
      user.cart.push({ itemId: String(itemId), name, price, imageUrl: imageUrl || '', qty, seen: false })
    }

    await user.save()
    return res.json({ cart: user.cart })
  } catch (e) {
    console.error('POST /cart error', e)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Mark items as seen by the user. Body: { itemIds?: string[] }
// If no itemIds provided, marks all current cart items as seen.
router.post('/mark-seen', authRequired, async (req, res) => {
  try {
    const { itemIds } = req.body || {}
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      // mark all seen
      user.cart.forEach(c => { c.seen = true })
    } else {
      const ids = itemIds.map(String)
      user.cart.forEach(c => {
        if (ids.includes(String(c.itemId))) c.seen = true
      })
    }

    await user.save()
    return res.json({ cart: user.cart })
  } catch (e) {
    console.error('POST /cart/mark-seen error', e)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Remove an item from cart
router.delete('/:itemId', authRequired, async (req, res) => {
  try {
    const { itemId } = req.params
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    user.cart = user.cart.filter(c => c.itemId !== String(itemId))
    await user.save()
    return res.json({ cart: user.cart })
  } catch (e) {
    console.error('DELETE /cart error', e)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Clear entire cart
router.delete('/', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    user.cart = []
    await user.save()
    return res.json({ cart: [] })
  } catch (e) {
    console.error('DELETE /cart (clear) error', e)
    return res.status(500).json({ error: 'Server error' })
  }
})

export default router
