import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider.jsx'

export default function Register() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const roleParam = searchParams.get('role')
  const isStaffRegistration = roleParam === 'staff'

  console.log('Register page - roleParam:', roleParam, 'isStaffRegistration:', isStaffRegistration)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // For staff registration, validate employee ID
    if (isStaffRegistration && !employeeId.trim()) {
      setError('Employee ID is required for staff registration')
      return
    }
    
    try {
      // Pass employeeId to register function for staff registration
      const userData = await register(name, email, password, isStaffRegistration ? employeeId : null)
      
      // If staff registration or user has staff role, redirect to staff dashboard
      if (userData.role === 'staff' || userData.role === 'admin') {
        nav('/staff', { replace: true })
      } else {
        nav('/', { replace: true })
      }
    } catch (e) {
      const data = e?.response?.data
      const msg = data?.error || (Array.isArray(data?.errors) && data.errors[0]?.msg) || 'Registration failed'
      setError(msg)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2 className="text-3xl font-bold mb-2">Create your account</h2>
        
       
        <form onSubmit={onSubmit} className="space-y">
          {isStaffRegistration && (
            <div>
              <label className="text-md md:text-md text-black mb-8 max-w-xl">Employee ID:</label>
              <input
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                className="w-full p-3 rounded-md border border-gray-200 bg-white/95 mb-5"
                placeholder="Enter your employee ID"
              />
            </div>
          )}
          <div>
            <label className="text-md md:text-md text-black mb-8 max-w-xl">Name:</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-3 rounded-md border border-gray-200 bg-white/95 mb-5"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="text-md md:text-md text-black mb-8 max-w-xl">Email:</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full p-3 rounded-md border border-gray-200 bg-white/95 mb-5"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="text-md md:text-md text-black mb-8 max-w-xl">Password:</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="w-full p-3 rounded-md border border-gray-200 bg-white/95 mb-2"
              placeholder="Enter password"
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-md transition-colors mt-4"
          >
            Create account
          </button>
        </form>

        <p className="text-center text-sm text-gray-700 mt-6">
          Have an account? <Link to={`/login${isStaffRegistration ? '?role=staff' : ''}`} className="text-red-600 hover:text-red-700 underline">Login</Link>
        </p>
      </div>
    </div>
  )
}
