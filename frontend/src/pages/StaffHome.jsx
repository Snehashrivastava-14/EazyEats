import { useEffect, useState } from 'react'
import { useApi } from '../api/client.js'
import { useSocket } from '../providers/SocketProvider.jsx'

function StatCard({ title, value, accent = '#10b981', icon }) {
  const [hover, setHover] = useState(false)

  const container = {
    borderRadius: 12,
    padding: 22,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'linear-gradient(180deg, rgba(6,10,14,0.85), rgba(3,6,10,0.95))',
    boxShadow: hover ? '0 14px 40px rgba(2,6,23,0.65)' : 'inset 0 0 0 1px rgba(255,255,255,0.02), 0 6px 18px rgba(2,6,23,0.5)',
    transform: hover ? 'translateY(-6px)' : 'translateY(0)',
    transition: 'transform 180ms ease, box-shadow 180ms ease'
  }

  const accentStrip = {
    width: 4,
    height: 'calc(100% - 20px)',
    background: `linear-gradient(180deg, ${accent}, rgba(0,0,0,0))`,
    borderRadius: 6,
    position: 'absolute',
    left: 12,
    top: 10,
    opacity: 0.98
  }

  const iconBox = {
    width: 64,
    height: 64,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto'
  }

  const innerCircle = {
    width: 48,
    height: 48,
    borderRadius: 10,
    background: accent,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 22px rgba(2,6,23,0.6)',
    border: '1px solid rgba(255,255,255,0.04)'
  }

  const iconStyle = { color: '#fff', width: 28, height: 28 }

  return (
    <div
      className="staff-stat-card"
      style={container}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="staff-accent-strip" style={accentStrip} />
      <div style={{ paddingLeft: 30, flex: 1 }}>
        <div className="staff-title" style={{ color: '#94a3b8', fontWeight: 600, fontSize: 15 }}>{title}</div>
        <div className="staff-value" style={{ fontSize: 38, fontWeight: 800, marginTop: 8, color: '#fff' }}>{value}</div>
      </div>
      <div className="staff-icon-box" style={iconBox}>
        <div className="staff-inner-circle" style={innerCircle}>
          <div className="staff-icon" style={iconStyle}>{icon}</div>
        </div>
      </div>
    </div>
  )
}

export default function StaffHome() {
  const api = useApi()
  const { socket } = useSocket()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // load today's orders (from start of day)
  async function load() {
    setLoading(true)
    setError('')
    try {
      const start = new Date();
      start.setHours(0,0,0,0)
      const res = await api.get('/admin/orders', { params: { from: start.toISOString(), limit: 1000 } })
      setOrders(res.data.orders || [])
    } catch (e) {
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!socket) return
    const onNew = () => load()
    const onUpdated = () => load()
    socket.on('new_order', onNew)
    socket.on('order_updated', onUpdated)
    return () => {
      socket.off('new_order', onNew)
      socket.off('order_updated', onUpdated)
    }
  }, [socket])

  const totalOrders = orders.length
  const pending = orders.filter(o => o.status === 'placed' || o.status === 'accepted').length
  const preparing = orders.filter(o => o.status === 'preparing').length
  const ready = orders.filter(o => o.status === 'ready').length
  const revenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0)

  return (
    <div className="section" style={{ maxWidth: 900 }}>
      
      {error && <div style={{ color: '#d32f2f', marginBottom: 12 }}>{error}</div>}
      {loading ? (
        <div style={{ color: 'var(--muted)' }}>Loading…</div>
      ) : (
        <div className="staff-grid grid gap-4.5 sm:grid-cols-2">
          <StatCard title="Total Orders" value={totalOrders} accent="#0ea5a4" icon={<svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 16V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
          <StatCard title="Pending" value={pending} accent="#ef4444" icon={<svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 7V12L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
          <StatCard title="Preparing" value={preparing} accent="#2563eb" icon={<svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 16V8a2 2 0 00-2-2h-4V4H9v2H5a2 2 0 00-2 2v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
          <StatCard title="Ready" value={ready} accent="#10b981" icon={<svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
        </div>
      )}
    </div>
  )
}
