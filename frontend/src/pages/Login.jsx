import { useState } from 'react'
import { useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider.jsx'

export default function Login() {
  const { login, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()
  const loc = useLocation()
  const [searchParams] = useSearchParams()
  const roleParam = searchParams.get('role')
  const from = loc.state?.from?.pathname || '/'

  console.log('Login page - roleParam:', roleParam)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const userData = await login(email, password)
      
      // If logging in as staff, redirect to staff dashboard
      if (roleParam === 'staff') {
        if (userData.role === 'staff' || userData.role === 'admin') {
          nav('/staff', { replace: true })
        } else {
          setError('You do not have staff access. Please use staff credentials.')
        }
      } else {
        // Regular user login - check if they are staff and redirect accordingly
        if (userData.role === 'staff' || userData.role === 'admin') {
          nav('/staff', { replace: true })
        } else {
          nav(from, { replace: true })
        }
      }
    } catch (e) {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2 className="text-3xl font-bold mb-2">Login to EazyEats</h2>
        
        {/* Debug info */}
        <div className="mb-3 p-2 bg-yellow-100 text-sm">
          <div>Role Param: {roleParam || 'none'}</div>
          <div>Signup Link: /register{roleParam ? `?role=${roleParam}` : ''}</div>
        </div>
        
        {roleParam && (
          <p className="text-sm text-gray-600 mb-5">
            Logging in as <span className="font-semibold text-red-600">{roleParam === 'staff' ? 'Staff Member' : 'User'}</span>
          </p>
        )}
        <form onSubmit={onSubmit} className="space-y">
          <div>
            <label className="text-md md:text-md text-black mb-8 max-w-xl">Email:</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full p-2 rounded-md border border-gray-200 bg-white/95 mb-5"
            />
          </div>
          <div>
            <label className="text-md md:text-md text-black mb-8 max-w-xl">Password:</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className=" mb-5 w-full p-2 rounded-md border border-gray-200 bg-white/95"
            />
          </div>
          {error && <div className="text-red-500">{error}</div>}
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-md mt-2 transition-colors"
          >
            Login
          </button>
        </form>

        <p className="text-center text-sm text-gray-700 mt-4 text-md md:text-md text-black mb-8 max-w-xl">
          Don't have an account? <Link to={`/register${roleParam ? `?role=${roleParam}` : ''}`} className="text-red-600 hover:text-red-700 underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
