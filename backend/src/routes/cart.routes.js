import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'

const router = Router()

// Minimal cart endpoint used to validate authentication before client-side add-to-cart
// The route intentionally performs no persistent action for now — it's a guard endpoint.
router.post('/', authRequired, async (req, res) => {
  // Optionally, we could accept itemId/qty and validate availability here.
  return res.json({ ok: true })
})

export default router
