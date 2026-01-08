import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import SubscriptionModal from '../components/SubscriptionModal'
import { FiUser, FiMail, FiCalendar, FiCheckCircle, FiAlertCircle, FiEdit2 } from 'react-icons/fi'

const Profile = () => {
  const { user, subscription, fetchUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (!name.trim() && !password) {
        setError('Nothing to update')
        return
      }
      setSaving(true)
      const payload = {}
      if (name.trim() && name.trim() !== user?.name) payload.name = name.trim()
      if (password) payload.password = password

      const res = await axios.put('/api/users/me', payload)
      if (res.data?.user) {
        await fetchUser()
        setPassword('')
        setSuccess('Profile updated successfully')
      }
    } catch (err) {
      console.error('Update profile error:', err)
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (value) => {
    if (!value) return ''
    const d = new Date(value)
    return d.toLocaleDateString()
  }

  const isSubscribed = !!subscription?.isActive

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      padding: window.innerWidth < 768 ? '1.25rem 1rem 6rem' : '2rem 2rem 6rem'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: window.innerWidth < 768 ? '1.75rem' : '2.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <FiUser />
          </div>
          Profile
        </h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 900 ? '1fr' : '1.4fr 1fr',
          gap: '1.5rem'
        }}>
          {/* Profile details */}
          <div style={{
            background: '#111827',
            borderRadius: '12px',
            border: '1px solid #1f2937',
            padding: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiUser /> Account details
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <FiEdit2 /> Editable
              </span>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: '#9CA3AF' }}>Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #374151',
                    background: '#020617',
                    color: '#F9FAFB',
                    fontSize: '0.95rem'
                  }}
                  placeholder="Your name"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: '#9CA3AF' }}>Email</label>
                <div style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  background: '#020617',
                  color: '#9CA3AF',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FiMail style={{ opacity: 0.8 }} /> {user?.email}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: '#9CA3AF' }}>New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #374151',
                    background: '#020617',
                    color: '#F9FAFB',
                    fontSize: '0.95rem'
                  }}
                  placeholder="Leave blank to keep current password"
                />
              </div>

              {error && (
                <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FiAlertCircle /> {error}
                </div>
              )}
              {success && (
                <div style={{ color: '#34d399', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FiCheckCircle /> {success}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: '#4f46e5',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiCalendar />
              <span>
                Member since {formatDate(user?.created_at)} {user?.role === 'admin' && '• Admin account'}
              </span>
            </div>
          </div>

          {/* Subscription section */}
          <div style={{
            background: '#111827',
            borderRadius: '12px',
            border: '1px solid #1f2937',
            padding: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Subscription</h2>
              {isSubscribed ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#34d399' }}>
                  <FiCheckCircle /> Active
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#f59e0b' }}>
                  <FiAlertCircle /> Free preview
                </span>
              )}
            </div>

            {isSubscribed ? (
              <>
                <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#E5E7EB' }}>
                  <strong>{subscription.plan_name || 'Premium Plan'}</strong>
                </div>
                <div style={{ marginBottom: '0.25rem', fontSize: '0.85rem', color: '#9CA3AF' }}>
                  Renews on {formatDate(subscription.end_date)}
                </div>
                {subscription.price && (
                  <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#F9FAFB' }}>
                    KES {subscription.price} / {subscription.duration_days || 30} days
                  </div>
                )}

                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.7rem 1.3rem',
                    borderRadius: '999px',
                    border: '1px solid #4f46e5',
                    background: 'transparent',
                    color: '#e5e7eb',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Change plan
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.9rem', color: '#D1D5DB', marginBottom: '0.75rem' }}>
                  You are currently on the free preview. Subscribe to unlock full songs, videos, instrumentals and photos.
                </p>
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  style={{
                    padding: '0.8rem 1.6rem',
                    borderRadius: '999px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: '#fff',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  View subscription plans
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showSubscriptionModal && (
        <SubscriptionModal
          onClose={() => setShowSubscriptionModal(false)}
          onSuccess={async () => {
            await fetchUser()
            setShowSubscriptionModal(false)
          }}
        />
      )}
    </div>
  )
}

export default Profile


