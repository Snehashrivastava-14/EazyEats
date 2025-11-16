import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try refresh on load
    async function tryRefresh() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        })
        if (res.ok) {
          const data = await res.json()
          // helpful debug info while developing authentication
          console.debug('[Auth] refresh OK, user:', data.user)
          setAccessToken(data.accessToken)
          setUser(data.user)
        }
      } catch {}
      setLoading(false)
    }
    tryRefresh()
  }, [])

  const login = async (email, password) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    })
    if (!res.ok) throw new Error('Login failed')
    const data = await res.json()
    console.debug('[Auth] login success, user:', data.user)
    setAccessToken(data.accessToken)
    setUser(data.user)
    return data.user
  }

  const register = async (name, email, password, employeeId) => {
    const body = { name, email, password }
    if (employeeId) {
      body.employeeId = employeeId
    }
    
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include'
    })
    if (!res.ok) throw new Error('Register failed')
    const data = await res.json()
    setAccessToken(data.accessToken)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    })
    setUser(null)
    setAccessToken('')
  }

  const value = useMemo(() => ({ user, accessToken, login, logout, register, loading }), [user, accessToken, loading])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  return useContext(AuthCtx)
}
