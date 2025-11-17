import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useApi } from '../api/client.js';
import { useAuth } from './AuthProvider.jsx';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]); // [{item, qty}]
  const api = useApi()
  const { user } = useAuth()

  // Load persisted cart from backend when authenticated
  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!user) {
        setCart([])
        return
      }
      try {
        const res = await api.get('/cart')
        if (!mounted) return
        // backend returns cart entries { itemId, name, price, imageUrl, qty }
        const normalized = (res.data.cart || []).map(c => ({ item: { _id: c.itemId, name: c.name, price: c.price, imageUrl: c.imageUrl }, qty: c.qty }))
        setCart(normalized)
      } catch (e) {
        // ignore and keep local cart
      }
    })()
    return () => { mounted = false }
  }, [user])

  async function addToCart(item, qty = 1) {
    // Persist to backend (will return updated cart). If unauthenticated,
    // backend will return 401 and we surface a toast.
    try {
      const payload = { itemId: item._id, name: item.name, price: Number(item.price), imageUrl: item.imageUrl || '', qty }
      const res = await api.post('/cart', payload)
      const normalized = (res.data.cart || []).map(c => ({ item: { _id: c.itemId, name: c.name, price: c.price, imageUrl: c.imageUrl }, qty: c.qty }))
      setCart(normalized)
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'Please login to continue.'
      toast.error(message)
      throw err
    }
  }

  function removeFromCart(itemId) {
    ;(async () => {
      try {
        const res = await api.delete(`/cart/${itemId}`)
        const normalized = (res.data.cart || []).map(c => ({ item: { _id: c.itemId, name: c.name, price: c.price, imageUrl: c.imageUrl }, qty: c.qty }))
        setCart(normalized)
      } catch (e) {
        // fallback to local update
        setCart((prev) => prev.filter((x) => x.item._id !== itemId));
      }
    })()
  }

  function updateQty(itemId, qty) {
    ;(async () => {
      try {
        const item = cart.find(c => c.item._id === itemId)
        if (!item) return
        const payload = { itemId, name: item.item.name, price: Number(item.item.price), imageUrl: item.item.imageUrl || '', qty }
        const res = await api.post('/cart', payload)
        const normalized = (res.data.cart || []).map(c => ({ item: { _id: c.itemId, name: c.name, price: c.price, imageUrl: c.imageUrl }, qty: c.qty }))
        setCart(normalized)
      } catch (e) {
        // fallback local change
        setCart((prev) => prev.map((x) => x.item._id === itemId ? { ...x, qty } : x));
      }
    })()
  }

  function clearCart() {
    ;(async () => {
      try {
        await api.delete('/cart')
        setCart([])
      } catch (e) {
        setCart([])
      }
    })()
  }

  const total = cart.reduce((sum, x) => sum + x.item.price * x.qty, 0);
  const count = cart.reduce((sum, x) => sum + x.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
