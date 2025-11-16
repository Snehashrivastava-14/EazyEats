import { useEffect, useState } from 'react'
import { useApi } from '../api/client.js'
import { useSocket } from '../providers/SocketProvider.jsx'
import { toast } from 'sonner'

export default function MyOrders() {
  const api = useApi()
  const { socket } = useSocket()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await api.get('/orders/mine')
      setOrders(res.data.orders)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!socket) return
    const onUpdate = (payload) => {
      setOrders((prev) => prev.map((o) => {
        if (o._id === payload.orderId) {
          // Show toast notification when order is accepted
          if (payload.status === 'accepted' && o.status !== 'accepted') {
            toast.success('Order Accepted! Please make payment.', {
              duration: 5000,
              description: `Order #${payload.orderId.slice(-6)} has been accepted by staff.`
            })
          }
          return { ...o, status: payload.status }
        }
        return o
      }))
    }
    socket.on('order_status_updated', onUpdate)
    return () => socket.off('order_status_updated', onUpdate)
  }, [socket])

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
        <h2 className="text-4xl font-bold text-white mb-8">My Orders</h2>
        
        {loading ? (
          <div className="text-center text-white/60 text-xl py-12">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-white/60 text-xl py-12">You have no orders yet.</div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o._id} className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg p-6 shadow-[0_2px_10px_rgba(255,255,255,0.05)]">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Order #{o._id.slice(-6)}</h3>
                    <p className="text-white/60 text-sm">
                      Pickup: {new Date(o.scheduledPickupAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`${getStatusColor(o.status)} text-white px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                    {o.status}
                  </span>
                </div>

                {/* Show payment notification when accepted */}
                {o.status === 'accepted' && (
                  <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-blue-400 font-semibold mb-1">Order Accepted!</p>
                        <p className="text-white/80 text-sm">Your order has been accepted by staff. Please proceed to make payment.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-white/80 mb-2 font-semibold">Items:</p>
                  <ul className="text-white/70 space-y-1">
                    {o.items.map((it, idx) => (
                      <li key={idx}>• {it.name} x{it.qty} - ₹{(it.price * it.qty).toFixed(2)}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-white font-bold text-lg">
                    Total: ₹{o.total.toFixed(2)}
                  </p>
                  {o.status === 'accepted' && (
                    <>
                      {o.total < 50 ? (
                        <div className="text-right">
                          <p className="text-red-400 text-sm mb-1">Minimum order: ₹50</p>
                          <button
                            disabled
                            className="bg-gray-600 text-white/50 font-bold px-6 py-2 rounded-lg cursor-not-allowed"
                          >
                            Amount Too Low
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              const res = await api.post('/payments/checkout-session', { orderId: o._id })
                              // redirect to stripe hosted checkout
                              window.location.href = res.data.url
                            } catch (err) {
                              const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Failed to initiate payment'
                              toast.error(errorMsg)
                            }
                          }}
                          className="bg-[#f4a720] hover:bg-[#f4a720]/90 text-black font-bold px-6 py-2 rounded-lg transition-colors"
                        >
                          Make Payment
                        </button>
                      )}
                    </>
                  )}
                </div>

                {o.instructions && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-white/60 text-sm">
                      <strong>Your Note:</strong> {o.instructions}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
