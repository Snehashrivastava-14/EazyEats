import React, { useState, useEffect, useRef } from 'react'
import { Routes, Route, Link, Navigate, useLocation, useParams, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'

import './App.css'

import Cart from './pages/Cart.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Home from './pages/Home.jsx'
import MenuPage from './pages/Menu.jsx'
import MenuDetail from './pages/MenuDetail.jsx'
import TrackOrder from './pages/TrackOrder.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import MyOrders from './pages/MyOrders.jsx'
import StaffQueue from './pages/StaffQueue.jsx'
import StaffHome from './pages/StaffHome.jsx'
import StaffPayments from './pages/StaffPayments.jsx'
import StaffMenu from './pages/StaffMenu.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

import { useAuth } from './context/AuthProvider.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { CartProvider, useCart } from './context/CartContext.jsx'
import StaffNav from './components/StaffNav.jsx'

function Nav() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [hideBadge, setHideBadge] = useState(false)
  const { count, unseenCount, markSeen } = useCart();
  return (
    <header className="h-20 sticky top-0 bg-black border-b border-white/10 z-10 py-1">
      <div className="max-w-7xl mx-auto px-5 py-4 flex items-center">
        <Link to="/" className="font-bold text-3xl sm:text-4xl tracking-wide text-white/90 font-['Montserrat']">
          EazyEats
        </Link>

        <button className="ml-auto sm:hidden text-white/90" onClick={() => setOpen(s => !s)} aria-label="Toggle menu">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <div className="hidden sm:flex ml-auto items-center gap-6">
          <nav className="flex items-center gap-6">
            {user && (
              <>
                <Link className="text-lg text-white/80 hover:text-brand transition-colors" to="/orders">My Orders</Link>
                <Link className="text-lg text-white/80 hover:text-brand transition-colors" to="/track">Track Order</Link>
              </>
            )}
            <Link className="text-lg text-white/80 hover:text-brand transition-colors" to="/menu">Menu</Link>
            <Link className="text-lg text-white/80 hover:text-brand transition-colors" to="/contact">Contact</Link>
            {user?.role === 'staff' || user?.role === 'admin' ? (
              <Link className="text-white/90 hover:text-brand transition-colors" to="/staff/payments">Payments</Link>
            ) : null}
            {user?.role === 'admin' ? (
              <Link className="text-white/90 hover:text-brand transition-colors" to="/admin">Admin</Link>
            ) : null}
          </nav>

          {user && (
            <Link to="/cart" onClick={() => { markSeen() }} className="relative text-lg text-white/80 hover:text-brand transition-colors">
              Cart
              {unseenCount > 0 && (
                <span className="absolute -top-2 -right-6 bg-brand text-black rounded-full text-xs font-bold px-2 py-0.5 min-w-[20px] text-center shadow-sm">
                  {unseenCount}
                </span>
              )}
            </Link>
          )}

          <div className="flex items-center gap-2.5">
            {user ? (
              <button className="bg-brand text-black px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-brand-dark transition-colors text-sm" onClick={logout}>
                Logout ({user.name})
              </button>
            ) : (
              <>
                <Link to="/login?role=user" className="bg-brand text-black px-4 py-2 rounded-lg font-semibold">Login as user</Link>
                <Link to="/login?role=staff" className="bg-brand text-black px-4 py-2 rounded-lg font-semibold">Login as staff</Link>
                 <Link to="/register" className="bg-brand text-black px-4 py-2 rounded-lg font-semibold">Sign Up</Link>
              </>
            )}
          </div>
        </div>

        {open && (
          <div className="sm:hidden absolute left-0 right-0 top-full bg-black border-t border-white/5 z-20">
            <div className="px-4 py-3 flex flex-col gap-3">
              {user && (
                <>
                  <Link to="/orders" className="text-white/90" onClick={() => setOpen(false)}>My Orders</Link>
                  <Link to="/track" className="text-white/90" onClick={() => setOpen(false)}>Track Order</Link>
                </>
              )}
              <Link to="/menu" className="text-white/90" onClick={() => setOpen(false)}>Menu</Link>
              <Link to="/contact" className="text-white/90" onClick={() => setOpen(false)}>Contact</Link>
              {user?.role === 'staff' || user?.role === 'admin' ? (
                <Link to="/staff/payments" className="text-white/90" onClick={() => setOpen(false)}>Payments</Link>
              ) : null}
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-white/90" onClick={() => setOpen(false)}>Admin</Link>
              )}

                  {user ? (
                <>
                  <Link to="/cart" className="text-white/90" onClick={() => { setOpen(false); markSeen(); }}>Cart{unseenCount > 0 ? ` (${unseenCount})` : ''}</Link>
                  <button className="bg-brand text-black px-3 py-2 rounded-lg font-semibold mt-2" onClick={() => { logout(); setOpen(false); }}>Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login?role=user" className="text-white/90" onClick={() => setOpen(false)}>Login as user</Link>
                  <Link to="/login?role=staff" className="text-white/90" onClick={() => setOpen(false)}>Login as staff</Link>
                  <Link to="/register" className="text-white/90" onClick={() => setOpen(false)}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function App() {
  const { loading } = useAuth()
  const location = useLocation()
  const isStaffRoute = location.pathname.startsWith('/staff')

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>
  return (
    <CartProvider>
      <Toaster position="top-center" expand={false} richColors />
      <div className="flex flex-col min-h-screen">
        {isStaffRoute ? <StaffNav /> : <Nav />}
        <main className="p-4 flex-1">
          <Routes>
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/menu/:itemId" element={<MenuDetailWrapper />} />
            <Route path="/track" element={<TrackOrder />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <MyOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute roles={["staff", "admin"]}>
                  <StaffHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/queue"
              element={
                <ProtectedRoute roles={["staff", "admin"]}>
                  <StaffQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/menu"
              element={
                <ProtectedRoute roles={["staff", "admin"]}>
                  <StaffMenu />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/payments"
              element={
                <ProtectedRoute roles={["staff", "admin"]}>
                  <StaffPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </CartProvider>
  )
}

function MenuDetailWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  if (!location.state || !location.state.item) {
    navigate('/menu');
    return null;
  }
  return <MenuDetail item={location.state.item} />;
}

export default App
