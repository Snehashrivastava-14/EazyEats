import { useCart } from '../context/CartContext.jsx';
import { useState, useEffect } from 'react';
import { useApi } from '../api/client.js';
import { useNavigate } from 'react-router-dom';

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-60" onClick={onClose}>
      <div className="bg-surface rounded-2xl p-6 min-w-[420px] max-w-[90%]" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default function Cart() {
  const { cart, removeFromCart, updateQty, total } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [pickupTime, setPickupTime] = useState('');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const api = useApi();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null)
  const [minPickup, setMinPickup] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await api.get('/config')
        if (!mounted) return
        setConfig(res.data)
        const tz = res.data?.cafeteriaTimeZone || null
        // compute current time in cafeteria timezone formatted for datetime-local
        const now = new Date()
        if (tz) {
          try {
            const parts = new Intl.DateTimeFormat('en-CA', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz
            }).formatToParts(now).reduce((acc, p) => { acc[p.type] = p.value; return acc }, {})
            const year = parts.year
            const month = parts.month
            const day = parts.day
            const hour = parts.hour
            const minute = parts.minute
            // ensure seconds floored to minute
            setMinPickup(`${year}-${month}-${day}T${hour}:${minute}`)
          } catch (e) {
            setMinPickup(new Date().toISOString().slice(0,16))
          }
        } else {
          setMinPickup(new Date().toISOString().slice(0,16))
        }
      } catch (err) {
        // ignore, fallback to local time
        setMinPickup(new Date().toISOString().slice(0,16))
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="max-w-[700px] mx-auto my-10 bg-surface rounded-2xl shadow-lg p-8">
      <h2 className="text-center font-bold mb-8 text-2xl">Your Cart</h2>
      {cart.length === 0 ? (
        <div className="text-center text-muted text-lg">Your cart is empty.</div>
      ) : (
        <>
          {cart.map(({ item, qty }) => (
            <div key={item._id} className="flex items-center mb-4.5">
              <img 
                src={item.imageUrl || 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop'} 
                alt={item.name} 
                className="w-[60px] h-[60px] object-cover rounded-lg mr-4.5" 
              />
              <div className="flex-1">
                <div className="font-bold text-lg">{item.name}</div>
                <div className="text-red-600 font-semibold text-base">₹{Number(item.price).toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item._id, Math.max(1, qty - 1))} className="px-2.5 text-lg">-</button>
                <span className="min-w-[24px] text-center">{qty}</span>
                <button onClick={() => updateQty(item._id, qty + 1)} className="px-2.5 text-lg">+</button>
              </div>
              <button 
                onClick={() => removeFromCart(item._id)} 
                className="ml-3 bg-red-600 text-white rounded px-3.5 py-1.5 font-semibold hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
          <hr className="my-7" />
          <div className="flex justify-between font-bold text-xl mb-4.5">
            <span>Total:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          {total < 50 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 text-yellow-400 text-sm">
              ⚠️ Minimum order amount is ₹50 for online payment
            </div>
          )}
          <button 
            onClick={() => setShowCheckout(true)}
            className="w-full bg-green-500 text-white rounded-lg py-3.5 font-bold text-lg hover:bg-green-600 transition-colors"
          >
            Proceed
          </button>

          {showCheckout && (
              <Modal onClose={() => !loading && setShowCheckout(false)}>
              <h2 className="mt-0 mb-6 text-2xl font-bold">Checkout</h2>
              {error && <div className="text-red-500 mb-4 p-3 bg-red-500/10 rounded-lg">{error}</div>}
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!pickupTime) {
                  setError('Please select a pickup time');
                  return;
                }
                
                setLoading(true);
                setError('');
                try {
                  const scheduledPickupAt = new Date(pickupTime).toISOString();
                  const items = cart.map(({ item, qty }) => ({
                    itemId: item._id,
                    qty
                  }));
                  
                  await api.post('/orders', {
                    items,
                    scheduledPickupAt,
                    instructions: instructions.trim()
                  });
                  
                  navigate('/orders');
                } catch (err) {
                  setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create order');
                  setLoading(false);
                }
              }}>
                <div className="mb-5">
                  <label className="block mb-2 text-muted">Pickup Time*</label>
                  <div className="text-sm text-white/70 mb-2">
                    Cafeteria hours: {String(config?.cafeteriaOpenHour ?? 9).padStart(2, '0')}:00 — {String(config?.cafeteriaCloseHour ?? 18).padStart(2, '0')}:00 {config?.cafeteriaTimeZone ? `(${config.cafeteriaTimeZone})`:""}
                  </div>
                  <input
                    type="datetime-local"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    min={minPickup || new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2.5 border border-gray-600/20 rounded-lg text-base bg-surface"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block mb-2 text-muted">Special Instructions</label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Any special instructions for your order..."
                    className="w-full px-3 py-2.5 border border-gray-600/20 rounded-lg text-base bg-surface min-h-[100px] resize-y"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => !loading && setShowCheckout(false)}
                    className={`px-6 py-2.5 border border-gray-200/20 rounded-lg text-base bg-surface 
                      ${loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-gray-200/40'}`}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-2.5 rounded-lg bg-green-500 text-white text-base font-semibold 
                      ${loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-green-600'}`}
                    disabled={loading}
                  >
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}
    </div>
  );
}
