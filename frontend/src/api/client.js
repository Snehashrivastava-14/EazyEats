import axios from 'axios'
import { useAuth } from '../context/AuthProvider.jsx'

// Hook-based API client provider
export function useApi() {
  const { accessToken } = useAuth()
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
    withCredentials: true
  })
  instance.interceptors.request.use((config) => {
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
    return config
  })
  return instance
}
