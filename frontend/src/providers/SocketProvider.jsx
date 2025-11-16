import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthProvider.jsx'

const SocketCtx = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const url = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const connectedRef = useRef(false)

  useEffect(() => {
    const s = io(url, { withCredentials: true })
    setSocket(s)
    s.on('connect', () => {
      connectedRef.current = true
      if (user) {
        s.emit('join', `user:${user.id}`)
      }
      s.emit('join', 'orders')
    })
    return () => {
      connectedRef.current = false
      s.disconnect()
    }
  }, [url])

  useEffect(() => {
    if (socket && socket.connected && user) {
      socket.emit('join', `user:${user.id}`)
    }
  }, [socket, user])

  const value = useMemo(() => ({ socket }), [socket])
  return <SocketCtx.Provider value={value}>{children}</SocketCtx.Provider>
}

export function useSocket() {
  return useContext(SocketCtx)
}
