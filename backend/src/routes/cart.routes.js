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
    } else {
      user.cart.push({ itemId: String(itemId), name, price, imageUrl: imageUrl || '', qty })
    }

    await user.save()
    return res.json({ cart: user.cart })
  } catch (e) {
    console.error('POST /cart error', e)
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
