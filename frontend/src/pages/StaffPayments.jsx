import { useEffect, useState } from 'react'
import { useApi } from '../api/client.js'
import { useAuth } from '../context/AuthProvider.jsx'

export default function StaffPayments() {
  const api = useApi()
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPayments = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/admin/orders', { params: { limit: 1000 } })
      const orders = res.data.orders || []
      // Filter only paid orders
      const paidOrders = orders.filter(o => o.paymentStatus === 'paid')
      setPayments(paidOrders)
    } catch (e) {
      if (e.response?.status === 401) {
        setError('Unauthorized. Please log in with staff or admin credentials.')
      } else if (e.response?.status === 403) {
        setError('Access denied. You need staff or admin privileges to view payments.')
      } else {
        setError('Failed to load payments')
      }
      console.error('Failed to load payments:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = payments.reduce((s, p) => s + (Number(p.total) || 0), 0)

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed': return 'bg-yellow-500'
      case 'accepted': return 'bg-blue-500'
      case 'preparing': return 'bg-purple-500'
      case 'ready': return 'bg-green-500'
      case 'picked_up': return 'bg-gray-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-[#111] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
        
          <button
            onClick={loadPayments}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors
              ${loading 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-red-400 font-semibold mb-1">Error</p>
                <p className="text-white/80 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="text-center text-white/60 text-xl py-12">Loading...</div>
        ) : (
          <>
            <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-6 shadow-[0_2px_10px_rgba(255,255,255,0.05)]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-white/60 text-sm mb-1">Total Payments Received</p>
                  <p className="text-3xl font-bold text-green-400">₹{total.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-sm mb-1">Paid Orders</p>
                  <p className="text-3xl font-bold text-white">{payments.length}</p>
                </div>
              </div>
            </div>

            {payments.length === 0 ? (
              <div className="text-center text-white/60 text-xl py-12">No payments received yet.</div>
            ) : (
              <div className="space-y-4">
                {payments.map((order) => (
                  <div key={order._id} className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg p-6 shadow-[0_2px_10px_rgba(255,255,255,0.05)]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          Order #{order._id.slice(-6)}
                        </h3>
                        <p className="text-white/60 text-sm">
                          Placed: {new Date(order.createdAt).toLocaleString()}
                        </p>
                        {order.paidAt && (
                          <p className="text-green-400 text-sm font-semibold mt-1">
                            ✓ Paid: {new Date(order.paidAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <span className={`${getStatusColor(order.status)} text-white px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-white/80 mb-2 font-semibold">Items:</p>
                      <ul className="text-white/70 space-y-1">
                        {order.items.map((item, idx) => (
                          <li key={idx}>
                            • {item.name} x{item.qty} - ₹{(item.price * item.qty).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-white/60 text-sm">Payment Status</p>
                          <p className="text-green-400 font-bold text-lg">✓ PAID</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/60 text-sm">Amount</p>
                          <p className="text-white font-bold text-2xl">₹{order.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {order.instructions && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-white/60 text-sm">
                          <strong>Customer Note:</strong> {order.instructions}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
