import jwt from 'jsonwebtoken'

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m'
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || '7d'

export function signAccessToken(user) {
  const payload = { sub: user._id?.toString?.() || user.id, role: user.role, name: user.name }
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret', { expiresIn: ACCESS_TTL })
}

export function signRefreshToken(user) {
  const payload = { sub: user._id?.toString?.() || user.id, tokenType: 'refresh' }
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret', { expiresIn: REFRESH_TTL })
}

export function verifyAccess(token) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret')
}

export function verifyRefresh(token) {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret')
}
