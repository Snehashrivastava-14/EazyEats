import { useEffect, useMemo, useState } from 'react'
import { useApi } from '../api/client.js'
import { useAuth } from '../context/AuthProvider.jsx'
import { useNavigate } from 'react-router-dom'


// Page styling handled via `App.css` variables

export default function MenuPage() {
  const api = useApi()
  const { user } = useAuth()
  const [menu, setMenu] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/menu')
        setMenu(res.data.menu)
      } catch (e) {
        setError('Failed to load menu')
      }
    }
    load()
  }, [])

  const items = useMemo(() => (menu?.items || []), [menu])

  



  return (
    <section className="min-h-screen pb-16 bg-black">
      <div className="max-w-7xl mx-auto px-5">
        <h2 className="text-center text-4xl font-bold py-12 text-white">Our Delicious Menu</h2>
        {error && <div className="text-red-500 text-center">{error}</div>}
        {!menu ? (
          <div className="text-center mt-10 text-white/70">Loading menu...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((it) => (
              <div 
                key={it._id} 
                className="bg-black rounded-lg overflow-hidden shadow-[0_6px_20px_rgba(255,255,255,0.12)] hover:shadow-[0_6px_18px_rgba(255,255,255,0.16)] transition-all duration-250 transform hover:-translate-y-0.5"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={it.imageUrl || 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop'}
                    alt={it.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg mb-2 text-white font-semibold">{it.name}</h3>
                  <div className="text-red-500 font-bold text-lg mb-3">₹{Number(it.price).toFixed(2)}</div>
                  <div className="flex items-center gap-3">
                    <button
                      className="bg-[#ffc107] hover:bg-[#ffb300] text-black rounded-md py-2 px-3 font-semibold text-sm transition-colors"
                      onClick={() => navigate(`/menu/${it._id}`, { state: { item: it } })}
                    >
                      View Details
                    </button>
                    {!it.isAvailable && (
                      <span className="bg-red-500/20 text-red-500 font-semibold text-sm px-2 py-1 rounded-md border border-red-500/30">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
