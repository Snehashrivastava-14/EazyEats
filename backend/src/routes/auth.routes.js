import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { User } from '../models/User.js'
import { signAccessToken, signRefreshToken, verifyRefresh } from '../utils/tokens.js'

const router = Router()

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/auth'
}

router.post(
  '/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isLength({ min: 2 }),
  body('employeeId').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { email, password, name, employeeId } = req.body
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ error: 'Email already registered' })
    
    // Determine role based on employeeId
    let role = 'user'
    if (employeeId && employeeId.trim()) {
      // If employeeId is provided, create as staff
      // You can add additional validation here if needed
      role = 'staff'
    }
    
    const passwordHash = await User.hashPassword(password)
    const user = await User.create({ email, passwordHash, name, role })

    const accessToken = signAccessToken(user)
    const refreshToken = signRefreshToken(user)
    res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 })
    return res.json({ accessToken, user: { id: user._id, email: user.email, name: user.name, role: user.role } })
  }
)

router.post(
  '/login',
  body('email').isEmail(),
  body('password').isString(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = await user.comparePassword(password)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const accessToken = signAccessToken(user)
    const refreshToken = signRefreshToken(user)
    res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 })
    return res.json({ accessToken, user: { id: user._id, email: user.email, name: user.name, role: user.role } })
  }
)

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken
  if (!token) return res.status(401).json({ error: 'No refresh token' })
  try {
    const payload = verifyRefresh(token)
    const user = await User.findById(payload.sub)
    if (!user) return res.status(401).json({ error: 'User not found' })
    const accessToken = signAccessToken(user)
    const newRefresh = signRefreshToken(user)
    res.cookie('refreshToken', newRefresh, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 })
    return res.json({ accessToken, user: { id: user._id, email: user.email, name: user.name, role: user.role } })
  } catch (e) {
    return res.status(401).json({ error: 'Invalid refresh token' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', cookieOpts)
  res.json({ ok: true })
})

export default router
