import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiMusic } from 'react-icons/fi'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState('loading') // loading | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const { verifyEmail } = useAuth()

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('Invalid or missing verification link.')
      return
    }
    let cancelled = false
    verifyEmail(token)
      .then(() => { if (!cancelled) setStatus('success') })
      .catch((err) => {
        if (!cancelled) {
          setStatus('error')
          setErrorMsg(err.response?.data?.error || 'Verification failed. The link may have expired.')
        }
      })
    return () => { cancelled = true }
  }, [token, verifyEmail])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2a 50%, #0f0f1e 100%)',
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        padding: '2.5rem',
        background: 'rgba(20, 20, 30, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '60px',
          height: '60px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
          marginBottom: '1rem'
        }}>
          <FiMusic style={{ fontSize: '1.75rem', color: '#667eea' }} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem' }}>Verify email</h1>

        {status === 'loading' && (
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9375rem' }}>Verifying your email...</p>
        )}

        {status === 'success' && (
          <>
            <p style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '10px',
              padding: '1rem',
              color: '#4ade80',
              fontSize: '0.9375rem',
              marginBottom: '1.5rem'
            }}>
              Your email has been verified successfully.
            </p>
            <Link
              to="/"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '10px',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Go to Cleo Music
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <p style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '1rem',
              color: '#ff6b6b',
              fontSize: '0.9375rem',
              marginBottom: '1.5rem'
            }}>
              {errorMsg}
            </p>
            <Link to="/login" style={{ color: '#667eea', textDecoration: 'none' }}>Back to sign in</Link>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail
