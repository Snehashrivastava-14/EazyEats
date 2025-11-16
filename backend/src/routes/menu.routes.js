import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { Menu } from '../models/Menu.js'
import { authRequired, hasRole } from '../middleware/auth.js'

const router = Router()

// Public: list active menu (include review aggregates)
router.get('/', async (req, res) => {
  const menu = await Menu.findOne({ isActive: true }).lean()
  if (!menu) return res.json({ menu: null })

  // compute average rating and review count per item for client display
  menu.items = (menu.items || []).map(it => {
    const reviews = it.reviews || []
    const reviewCount = reviews.length
    const avgRating = reviewCount ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviewCount) : 0
    return { ...it, avgRating: Number(avgRating.toFixed(2)), reviewCount }
  })

  res.json({ menu })
})

// Admin: create/replace a menu
router.post(
  '/',
  authRequired,
  hasRole('admin'),
  body('title').isString().isLength({ min: 2 }),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    // deactivate existing active menu
    await Menu.updateMany({ isActive: true }, { $set: { isActive: false } })
    const menu = await Menu.create({ title: req.body.title, isActive: true, items: [] })
    res.status(201).json({ menu })
  }
)

// Staff/Admin: add item to active menu
router.post(
  '/items',
  authRequired,
  hasRole('staff', 'admin'),
  body('name').isString().isLength({ min: 2 }),
  body('price').isFloat({ gt: 0 }),
  body('imageUrl').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const menu = await Menu.findOne({ isActive: true })
    if (!menu) return res.status(400).json({ error: 'No active menu' })
    menu.items.push({
      name: req.body.name,
      description: req.body.description || '',
      price: req.body.price,
      category: req.body.category || '',
      isAvailable: req.body.isAvailable ?? true,
      stock: req.body.stock ?? 0,
      imageUrl: req.body.imageUrl || ''
    })
    await menu.save()
    res.status(201).json({ menu })
  }
)

// Staff/Admin: update item
router.patch(
  '/items/:itemId',
  authRequired,
  hasRole('staff', 'admin'),
  async (req, res) => {
    const { itemId } = req.params
    const menu = await Menu.findOne({ 'items._id': itemId, isActive: true })
    if (!menu) return res.status(404).json({ error: 'Item not found' })
    const item = menu.items.id(itemId)
    if ('name' in req.body) item.name = req.body.name
    if ('description' in req.body) item.description = req.body.description
    if ('price' in req.body) item.price = req.body.price
    if ('category' in req.body) item.category = req.body.category
    if ('isAvailable' in req.body) item.isAvailable = req.body.isAvailable
    if ('stock' in req.body) item.stock = req.body.stock
    if ('imageUrl' in req.body) item.imageUrl = req.body.imageUrl
    await menu.save()
    res.json({ item })
  }
)

// Staff/Admin: toggle availability shortcut
router.patch(
  '/items/:itemId/availability',
  authRequired,
  hasRole('staff', 'admin'),
  body('isAvailable').isBoolean(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { itemId } = req.params
    const menu = await Menu.findOne({ 'items._id': itemId, isActive: true })
    if (!menu) return res.status(404).json({ error: 'Item not found' })
    const item = menu.items.id(itemId)
    item.isAvailable = req.body.isAvailable
    await menu.save()
    res.json({ item })
  }
)

// Staff/Admin: delete item
router.delete(
  '/items/:itemId',
  authRequired,
  hasRole('staff', 'admin'),
  async (req, res) => {
    const { itemId } = req.params
    const menu = await Menu.findOne({ 'items._id': itemId, isActive: true })
    if (!menu) return res.status(404).json({ error: 'Item not found' })
    
    // Use $pull to remove the item from the items array
    await Menu.updateOne(
      { _id: menu._id },
      { $pull: { items: { _id: itemId } } }
    )
    
    // Get the updated menu to return
    const updatedMenu = await Menu.findById(menu._id)
    res.json({ menu: updatedMenu })
  }
)

// User: add or update review for an item
router.post(
  '/items/:itemId/reviews',
  authRequired,
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { itemId } = req.params
    const menu = await Menu.findOne({ 'items._id': itemId, isActive: true })
    if (!menu) return res.status(404).json({ error: 'Item not found' })
    const item = menu.items.id(itemId)
    if (!item) return res.status(404).json({ error: 'Item not found' })

    const existing = item.reviews.find(r => String(r.userId) === String(req.user.id))
    if (existing) {
      existing.rating = req.body.rating
      existing.comment = req.body.comment || ''
      existing.createdAt = new Date()
    } else {
      item.reviews.push({ userId: req.user.id, rating: req.body.rating, comment: req.body.comment || '' })
    }

    await menu.save()

    // return updated item with aggregated data
    const reviews = item.reviews || []
    const reviewCount = reviews.length
    const avgRating = reviewCount ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviewCount) : 0
    res.json({ item: { ...item.toObject(), avgRating: Number(avgRating.toFixed(2)), reviewCount } })
  }
)

export default router
