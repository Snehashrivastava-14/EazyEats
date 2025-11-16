import { useEffect, useState } from 'react'
import { useApi } from '../api/client.js'
import { useSocket } from '../providers/SocketProvider.jsx'
import { toast } from 'sonner'

export default function StaffQueue() {
  const api = useApi()
  const { socket } = useSocket()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  async function load() {
    try {
      const res = await api.get('/admin/orders')
      setOrders(res.data.orders)
    } catch (e) {
      toast.error('Failed to load orders')
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!socket) return
    socket.emit('join', 'orders')
    const onNew = () => {
      load()
      toast.success('New order received!')
    }
    const onUpdated = () => load()
    socket.on('new_order', onNew)
    socket.on('order_updated', onUpdated)
    return () => {
      socket.off('new_order', onNew)
      socket.off('order_updated', onUpdated)
    }
  }, [socket])

  const updateStatus = async (orderId, status, statusText) => {
    setLoading(true)
    try {
      await api.patch(`/orders/${orderId}/status`, { status })
      toast.success(`Order ${statusText}`)
      await load()
    } catch (e) {
      toast.error('Failed to update order')
    } finally {
      setLoading(false)
    }
  }

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

  const pendingOrders = orders.filter(o => o.status === 'placed')
  const activeOrders = orders.filter(o => ['accepted', 'preparing'].includes(o.status))
  const readyOrders = orders.filter(o => o.status === 'ready')
  const completedOrders = orders.filter(o => ['picked_up', 'cancelled'].includes(o.status))

  const OrderRow = ({ order }) => (
    <div className="order-row bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg p-4 shadow-[0_2px_10px_rgba(255,255,255,0.05)] hover:shadow-[0_4px_15px_rgba(255,255,255,0.1)] transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Order Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <span className={`${getStatusColor(order.status)} text-white px-3 py-1 rounded-full text-xs font-bold uppercase shrink-0`}>
            {order.status}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-white font-bold">#{order._id.slice(-6)}</span>
              <span className="text-white/50 text-sm">
                {order.items.map((it) => `${it.name} x${it.qty}`).join(', ')}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/60">
              <span>₹{order.total.toFixed(2)}</span>
              <span>•</span>
              <span>Pickup: {new Date(order.scheduledPickupAt).toLocaleTimeString()}</span>
            </div>
            {order.instructions && (
              <div className="mt-2 bg-yellow-500/10 border border-yellow-500/30 rounded px-3 py-2 text-sm">
                <span className="text-yellow-500 font-semibold">Note: </span>
                <span className="text-white/80 italic">"{order.instructions}"</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {order.status === 'placed' && (
            <>
              <button
                onClick={() => updateStatus(order._id, 'accepted', 'accepted')}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm"
              >
                Accept
              </button>
              <button
                onClick={() => updateStatus(order._id, 'cancelled', 'rejected')}
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm"
              >
                Reject
              </button>
            </>
          )}
          {order.status === 'accepted' && (
            <button
              onClick={() => updateStatus(order._id, 'preparing', 'is being prepared')}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm"
            >
              Start Preparing
            </button>
          )}
          {order.status === 'preparing' && (
            <button
              onClick={() => updateStatus(order._id, 'ready', 'is ready for pickup')}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm"
            >
              Mark Ready
            </button>
          )}
          {order.status === 'ready' && (
            <button
              onClick={() => updateStatus(order._id, 'picked_up', 'has been picked up')}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm"
            >
              Picked Up
            </button>
          )}
          {['accepted', 'preparing', 'ready'].includes(order.status) && (
            <button
              onClick={() => updateStatus(order._id, 'cancelled', 'cancelled')}
              disabled={loading}
              className="bg-red-500/80 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="staff-queue min-h-screen bg-[#111] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        

        {/* Pending Orders */}
        {pendingOrders.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-yellow-500 mb-4">
              Pending Orders ({pendingOrders.length})
            </h3>
            <div className="space-y-3">
              {pendingOrders.map(order => <OrderRow key={order._id} order={order} />)}
            </div>
          </div>
        )}

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-blue-500 mb-4">
              In Progress ({activeOrders.length})
            </h3>
            <div className="space-y-3">
              {activeOrders.map(order => <OrderRow key={order._id} order={order} />)}
            </div>
          </div>
        )}

        {/* Ready Orders */}
        {readyOrders.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-green-500 mb-4">
              Ready for Pickup ({readyOrders.length})
            </h3>
            <div className="space-y-3">
              {readyOrders.map(order => <OrderRow key={order._id} order={order} />)}
            </div>
          </div>
        )}

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-500 mb-4">
              Completed ({completedOrders.length})
            </h3>
            <div className="space-y-3">
              {completedOrders.slice(0, 6).map(order => <OrderRow key={order._id} order={order} />)}
            </div>
          </div>
        )}

        {orders.length === 0 && (
          <div className="text-center text-white/60 text-xl py-12">
            No orders yet
          </div>
        )}
      </div>
    </div>
  )
}
