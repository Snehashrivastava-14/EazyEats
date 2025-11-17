import { createContext, useContext, useState } from 'react';
import { toast } from 'sonner';
import { useApi } from '../api/client.js';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]); // [{item, qty}]
  const api = useApi()

  async function addToCart(item, qty = 1) {
    // Validate with backend (returns 401 when not authenticated)
    try {
      await api.post('/cart', { itemId: item._id, qty })
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'Please login to continue.'
      toast.error(message)
      // Do not add to local cart when validation fails
      throw err
    }

    // Only add locally when backend validation passes
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.item._id === item._id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].qty += qty;
        return updated;
      }
      return [...prev, { item, qty }];
    });
  }

  function removeFromCart(itemId) {
    setCart((prev) => prev.filter((x) => x.item._id !== itemId));
  }

  function updateQty(itemId, qty) {
    setCart((prev) => prev.map((x) => x.item._id === itemId ? { ...x, qty } : x));
  }

  function clearCart() {
    setCart([]);
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
