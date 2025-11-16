import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../api/client.js';
import { useSocket } from '../providers/SocketProvider.jsx';
import { toast } from 'sonner';

const STATUS_STEPS = [
  { label: 'Order Placed', desc: 'We received your order' },
  { label: 'Accepted', desc: 'Order accepted — please make payment' },
  { label: 'Preparing', desc: 'Kitchen is preparing your order' },
  { label: 'Ready', desc: 'Ready for pickup' },
  { label: 'Picked Up', desc: 'Order completed' },
];

export default function TrackOrder() {
  const api = useApi();
  const { socket } = useSocket();
  const [code, setCode] = useState('');
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleTrack(idOrShort) {
    setError('');
    setOrder(null);
    setLoading(true);
    try {
      const query = (idOrShort ?? code).trim();
      if (!query) { setLoading(false); return; }
      const res = await api.get(`/orders/track/${query}`);
      setOrder(res.data.order);
      setHistory(res.data.history || []);
      // Join socket room for this order to get live updates
      if (socket) {
        socket.emit('join', `order:${res.data.order._id}`);
      }
    } catch (e) {
      setError('Order not found.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!socket) return;
    const onUpdate = (payload) => {
      if (order && payload.orderId === order._id) {
        setOrder((prev) => ({ ...prev, status: payload.status }));
        if (payload.status === 'accepted') {
          toast.success('Order accepted. Please proceed to payment.');
        }
      }
    };
    socket.on('order_status_updated', onUpdate);
    return () => socket.off('order_status_updated', onUpdate);
  }, [socket, order?._id]);

  const statusIdx = useMemo(() => {
    if (!order) return -1;
    // Map backend statuses to step index
    switch (order.status) {
      case 'placed':
        return 0;
      case 'accepted':
        return 1;
      case 'preparing':
        return 2;
      case 'ready':
        return 3;
      case 'picked_up':
        return 4;
      case 'cancelled':
        return -1; // special case handled below
      default:
        return -1;
    }
  }, [order?.status]);

  return (
    <div style={{ maxWidth: 700, margin: '32px auto', background: 'var(--surface)', borderRadius: 12, boxShadow: '0 6px 24px rgba(15,23,42,0.06)', padding: 32 }}>
      <h2 style={{ fontWeight: 700, marginBottom: 24, color: 'var(--text)' }}>Track Your Order</h2>
      <div style={{ display: 'flex', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Enter full Order ID or last 6 characters"
            style={{ flex: 1, fontSize: 20, padding: '10px 14px', borderRadius: 6, border: '1px solid rgba(15,23,42,0.08)', background: 'transparent', color: 'var(--text)' }}
          />
          <button
            onClick={() => handleTrack()}
            title="Search & Track Order"
            style={{ background: '#f4a720', color: '#000', border: 'none', borderRadius: 6, padding: '0 18px', fontWeight: 700, fontSize: 16, height: 44, boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}
            disabled={loading || !code}
          >
            Search
          </button>
        </div>
      </div>
      {error && <div style={{ color: '#d32f2f', marginBottom: 12 }}>{error}</div>}
      {order && (
        <>
          <div style={{ fontWeight: 600, margin: '18px 0 10px', color: 'var(--text)' }}>Order <span style={{ color: 'var(--muted)' }}>#{order.shortId || (order._id?.slice?.(-6) || order._id)}</span> Status:</div>
          {order.status === 'cancelled' ? (
            <div style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', padding: '12px', borderRadius: 6, fontWeight: 600, marginBottom: 18 }}>
              This order was cancelled.
            </div>
          ) : null}
          <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0 18px' ,marginLeft:8}}>
            {STATUS_STEPS.map((step, idx) => (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: statusIdx >= 0 && idx <= statusIdx ? '#16a34a' : '#e6e9ee', // green for completed/current
                  color: statusIdx >= 0 && idx <= statusIdx ? '#fff' : '#8b8f98',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18,
                  border: statusIdx >= 0 && idx === statusIdx ? '3px solid #16a34a' : 'none',
                  boxShadow: statusIdx >= 0 && idx === statusIdx ? '0 0 0 4px rgba(22,163,74,0.25)' : 'none',
                  zIndex: 1,
                  transition: 'background .3s, box-shadow .3s'
                }}>{idx + 1}</div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 6, background: statusIdx >= 0 && idx < statusIdx ? '#16a34a' : '#e6e9ee', borderRadius: 4, transition: 'background .3s' }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0 8px 18px 8px', color: 'var(--muted)', fontWeight: 500, fontSize: 15 }}>
            {STATUS_STEPS.map((step, idx) => (
              <div key={step.label} style={{ width: 120, textAlign: 'center' }}>{step.label}</div>
            ))}
          </div>
          {order.status === 'preparing' && (
            <div style={{ background: 'rgba(255,191,3,0.12)', color: 'var(--brand-dark)', padding: '12px 0', borderRadius: 6, textAlign: 'center', fontWeight: 600, marginBottom: 18 }}>
              Your order is being prepared by our chefs!
            </div>
          )}
          {order.status === 'accepted' && (
            <div style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', padding: '12px 0', borderRadius: 6, textAlign: 'center', fontWeight: 600, marginBottom: 18 }}>
              Your order has been accepted. Please proceed to make payment.
            </div>
          )}
          {order.status === 'accepted' && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <button
                onClick={async () => {
                  try {
                    const res = await api.post('/payments/checkout-session', { orderId: order._id })
                    window.location.href = res.data.url
                  } catch (err) {
                    toast.error('Failed to initiate payment')
                  }
                }}
                className="bg-[#f4a720] text-black font-bold px-6 py-2 rounded-lg"
                style={{ border: 'none', cursor: 'pointer' }}
              >
                Make Payment
              </button>
            </div>
          )}
          <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 22, marginTop: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 10, color: 'var(--text)' }}>Order Details</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: 'var(--muted)' }}>
              <span>Order Date:</span>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: 'var(--muted)' }}>
              <span>Estimated Time:</span>
              <span>{order.estimatedTime || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: 'var(--muted)' }}>
              <span>Items:</span>
              <span>{order.items?.length || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: 'var(--muted)' }}>
              <span>Total Amount:</span>
              <span>₹{order.total?.toFixed(2) || '-'}</span>
            </div>
            {order.instructions && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: 'var(--muted)' }}>
                <span>Your Note:</span>
                <span style={{ maxWidth: 460, textAlign: 'right' }}>{order.instructions}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
