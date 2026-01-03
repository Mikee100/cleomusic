import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

// Configure axios defaults
const API_URL = import.meta.env.VITE_API_URL || ''
axios.defaults.baseURL = API_URL

// Debug: Log API configuration (only in development or if API_URL is missing)
if (import.meta.env.DEV || !API_URL) {
  console.log('🔧 API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    baseURL: axios.defaults.baseURL || '(empty - using relative URLs)',
    note: API_URL ? '✅ Using backend URL' : '⚠️ No VITE_API_URL set - requests will go to current domain'
  })
}

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me')
      setUser(response.data.user)
      setSubscription(response.data.subscription)
    } catch (error) {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password })
    localStorage.setItem('token', response.data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
    setUser(response.data.user)
    await fetchUser()
    return response.data
  }

  const register = async (email, password, name) => {
    const response = await axios.post('/api/auth/register', { email, password, name })
    localStorage.setItem('token', response.data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
    setUser(response.data.user)
    await fetchUser()
    return response.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    setSubscription(null)
  }

  return (
    <AuthContext.Provider value={{ user, subscription, loading, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

