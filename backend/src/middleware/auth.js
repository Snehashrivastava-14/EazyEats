import { verifyAccess } from '../utils/tokens.js'

export function authRequired(req, res, next) {
  const auth = req.headers.authorization
  const bearer = auth && auth.startsWith('Bearer ')
  const token = bearer ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = verifyAccess(token)
    req.user = { id: payload.sub, role: payload.role, name: payload.name }
    return next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function hasRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}
