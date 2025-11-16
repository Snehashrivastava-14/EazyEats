import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]); // [{item, qty}]

  function addToCart(item, qty = 1) {
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.item._id === item._id);
      if (idx !== -1) {
        // Already in cart, update qty
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
