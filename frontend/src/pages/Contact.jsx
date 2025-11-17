import { useState } from 'react'
import { toast } from 'sonner'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !message) {
      toast.error('Please fill name, email and message')
      return
    }
    setLoading(true)
    try {
      // Currently no backend contact endpoint — show a friendly toast.
      // In future, replace with `await api.post('/contact', { name, email, subject, message })`
      await new Promise((r) => setTimeout(r, 700))
      toast.success("Thanks! We'll get back to you shortly.")
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (err) {
      toast.error('Failed to send message — please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="max-w-6xl mx-auto px-5 py-12">
      <div className="bg-black rounded-2xl shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 md:p-10 bg-gradient-to-br from-[#071018] to-[#071525]">
          <h2 className="text-3xl font-bold mb-2 text-white">Get in touch</h2>
          <p className="text-white/70 mb-6">Questions, feedback or partnership inquiries — tell us a bit about it and we'll respond ASAP.</p>

          <div className="text-sm text-white/60 space-y-3">
            <div>
              <strong className="text-white">Email:</strong> <a className="text-brand" href="mailto:support@eazyeats.local">support@eazyeats.local</a>
            </div>
            <div>
              <strong className="text-white">Phone:</strong> <span className="text-white/80">+91 90000 00000</span>
            </div>
            <div>
              <strong className="text-white">Address:</strong> <span className="text-white/80">EazyEats Canteen, Campus Rd</span>
            </div>
          </div>

          <div className="mt-6 text-sm text-white/60">
            <div className="font-semibold text-white mb-1">Opening Hours</div>
            <div>Mon — Fri: 09:00 — 18:00</div>
            <div className="mt-1">Sat: 10:00 — 15:00 · Sun: Closed</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-10 bg-surface">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0b1220] text-white border border-white/6"
            />
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0b1220] text-white border border-white/6"
            />
          </div>

          <input
            type="text"
            placeholder="Subject (optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full mt-3 px-3 py-2 rounded-lg bg-[#0b1220] text-white border border-white/6"
          />

          <textarea
            placeholder="Your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full mt-3 px-3 py-3 rounded-lg bg-[#0b1220] text-white border border-white/6 resize-y"
          />

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-white/70">We typically reply within 24 hours.</div>
            <button
              type="submit"
              disabled={loading}
              className={`bg-brand text-black px-4 py-2 rounded-lg font-semibold ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-brand-dark'}`}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
