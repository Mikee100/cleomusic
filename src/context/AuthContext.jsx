import { createContext, useContext, useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''
axios.defaults.baseURL = API_URL
axios.defaults.timeout = 10000
axios.defaults.withCredentials = true

if (import.meta.env.DEV || !API_URL) {
  console.log('🔧 API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    baseURL: axios.defaults.baseURL || '(empty - using relative URLs)'
  })
}

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

async function getCsrfToken() {
  const res = await axios.get('/api/auth/csrf')
  return res.data.csrfToken
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const csrfTokenRef = useRef(null)
  const currentSessionIdRef = useRef(null)

  const getCsrf = async () => {
    if (csrfTokenRef.current) return csrfTokenRef.current
    const token = await getCsrfToken()
    csrfTokenRef.current = token
    return token
  }

  const authHeaders = async () => {
    const token = await getCsrf()
    return { 'X-CSRF-Token': token }
  }

  // Attach CSRF token to all state-changing requests (backend requires it for POST/PUT/PATCH/DELETE)
  useEffect(() => {
    const interceptorId = axios.interceptors.request.use(async (config) => {
      const method = (config.method || 'get').toLowerCase()
      if (['get', 'head', 'options'].includes(method)) return config
      try {
        const token = await getCsrf()
        if (token) config.headers['X-CSRF-Token'] = token
      } catch (_) {}
      return config
    })
    return () => axios.interceptors.request.eject(interceptorId)
  }, [])

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me')
      setUser(response.data.user)
      setSubscription(response.data.subscription)
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.warn('⚠️ Auth check timed out.')
      }
      if (error.response?.status === 401) {
        try {
          const refreshRes = await axios.post('/api/auth/refresh')
          if (refreshRes.data?.currentSessionId) currentSessionIdRef.current = refreshRes.data.currentSessionId
          const retry = await axios.get('/api/auth/me')
          setUser(retry.data.user)
          setSubscription(retry.data.subscription)
          return
        } catch (_) {}
        setUser(null)
        setSubscription(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, rememberMe = false) => {
    const headers = await authHeaders()
    const response = await axios.post('/api/auth/login', { email, password, rememberMe }, { headers })
    if (response.data?.currentSessionId) currentSessionIdRef.current = response.data.currentSessionId
    setUser(response.data.user)
    await fetchUser()
    return response.data
  }

  const register = async (email, password, name) => {
    const headers = await authHeaders()
    const response = await axios.post('/api/auth/register', { email, password, name }, { headers })
    if (response.data?.currentSessionId) currentSessionIdRef.current = response.data.currentSessionId
    setUser(response.data.user)
    await fetchUser()
    return response.data
  }

  const logout = async () => {
    try {
      const headers = await authHeaders()
      await axios.post('/api/auth/logout', {}, { headers })
    } catch (_) {}
    csrfTokenRef.current = null
    currentSessionIdRef.current = null
    setUser(null)
    setSubscription(null)
  }

  const getSessions = async () => {
    const res = await axios.get('/api/auth/sessions')
    return res.data.sessions || []
  }

  const revokeSession = async (jti) => {
    const headers = await authHeaders()
    await axios.delete(`/api/auth/sessions/${jti}`, { headers })
  }

  const revokeOtherSessions = async () => {
    const headers = await authHeaders()
    await axios.post('/api/auth/sessions/revoke-others', { keepSessionId: currentSessionIdRef.current || undefined }, { headers })
  }

  const getCurrentSessionId = () => currentSessionIdRef.current

  const forgotPassword = async (email) => {
    const headers = await authHeaders()
    await axios.post('/api/auth/forgot-password', { email }, { headers })
  }

  const resetPassword = async (token, newPassword) => {
    const headers = await authHeaders()
    await axios.post('/api/auth/reset-password', { token, newPassword }, { headers })
  }

  const verifyEmail = async (token) => {
    const response = await axios.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
    await fetchUser()
    return response.data
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        loading,
        login,
        register,
        logout,
        fetchUser,
        forgotPassword,
        resetPassword,
        verifyEmail,
        getCsrf,
        getSessions,
        revokeSession,
        revokeOtherSessions,
        getCurrentSessionId
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
