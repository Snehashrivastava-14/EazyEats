import { Link } from 'react-router-dom';
import { useState } from 'react'
import { useAuth } from '../context/AuthProvider.jsx';

export default function StaffNav() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 bg-black border-b border-white/10 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 py-3 flex items-center">
        <Link to="/staff" className="font-bold text-2xl sm:text-4xl tracking-wide text-white/90 font-['Montserrat']">
          EazyEats Staff
        </Link>

        <button className="ml-auto sm:hidden text-white/90" onClick={() => setOpen(s => !s)} aria-label="Toggle menu">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <div className="hidden sm:flex ml-auto items-center gap-6">
          <nav className="flex items-center gap-6">
            <Link className="text-lg md:text-xl text-white/80 hover:text-brand transition-colors" to="/staff/menu">Manage Menu</Link>
            <Link className="text-lg md:text-xl text-white/80 hover:text-brand transition-colors" to="/staff/queue">Orders</Link>
            <Link className="text-lg md:text-xl text-white/80 hover:text-brand transition-colors" to="/staff/payments">Payments</Link>
            {user?.role === 'admin' && (
              <Link className="text-lg md:text-xl text-white/80 hover:text-brand transition-colors" to="/admin">Admin Panel</Link>
            )}
          </nav>

          <div className="flex items-center gap-2.5 ml-6">
            <button className="bg-brand text-black px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-brand-dark transition-colors text-sm md:text-md" onClick={logout}>Logout</button>
          </div>
        </div>

        {open && (
          <div className="sm:hidden absolute left-0 right-0 top-full bg-black border-t border-white/5 z-20">
            <div className="px-4 py-3 flex flex-col gap-3">
              <Link to="/staff/menu" className="text-white/90" onClick={() => setOpen(false)}>Manage Menu</Link>
              <Link to="/staff/queue" className="text-white/90" onClick={() => setOpen(false)}>Orders</Link>
              <Link to="/staff/payments" className="text-white/90" onClick={() => setOpen(false)}>Payments</Link>
              {user?.role === 'admin' && <Link to="/admin" className="text-white/90" onClick={() => setOpen(false)}>Admin Panel</Link>}
              <button className="bg-brand text-black px-3 py-2 rounded-lg font-semibold mt-2" onClick={() => { logout(); setOpen(false); }}>Logout</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
