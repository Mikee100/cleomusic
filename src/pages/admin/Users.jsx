import { useState, useEffect } from 'react'
import axios from 'axios'
import { useResponsive } from '../../hooks/useResponsive'
import AdminErrorBanner, { getAdminErrorMessage } from '../../components/AdminErrorBanner'
import { FiUsers, FiSearch, FiX } from 'react-icons/fi'

const Users = () => {
  const { isMobile } = useResponsive()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [searchTerm])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/admin/users', {
        params: { search: searchTerm }
      })
      setUsers(response.data.users)
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: isMobile ? '1rem' : '2rem' }}>
        <h1 style={{ 
          fontSize: isMobile ? '1.5rem' : '2rem', 
          marginBottom: '0.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <FiUsers /> Users Management
        </h1>
        <p style={{ color: '#999', fontSize: isMobile ? '0.875rem' : '1rem' }}>View and manage all users</p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : '400px',
            padding: '0.75rem',
            background: '#2a2a2a',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            fontSize: isMobile ? '0.875rem' : '1rem'
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: isMobile ? '1rem' : '2rem' }}>Loading...</div>
      ) : error ? null : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile 
            ? 'repeat(1, 1fr)' 
            : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          {users.map(user => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user.id)}
              style={{
                background: '#1a1a1a',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #333',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333'}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {user.name}
              </div>
              <div style={{ color: '#999', marginBottom: '0.5rem' }}>{user.email}</div>
              <div style={{ color: '#666', fontSize: '0.875rem' }}>
                Subscriptions: {user.subscription_count || 0}
              </div>
              {user.last_subscription && (
                <div style={{ color: '#666', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Last: {new Date(user.last_subscription).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedUser && (
        <UserDetailModal
          userId={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}

const UserDetailModal = ({ userId, onClose }) => {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`/api/admin/users/${userId}`)
      .then(res => setUserData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div style={{ color: '#fff' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '2rem'
    }}>
      <div style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '2rem',
        maxHeight: '90vh',
        overflow: 'auto',
        maxWidth: isMobile ? '100%' : '600px',
        width: '100%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>User Details</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.5rem' }}>
            <FiX />
          </button>
        </div>
        {userData && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>{userData.user.name}</h3>
              <p style={{ color: '#999' }}>{userData.user.email}</p>
              <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Joined: {new Date(userData.user.created_at).toLocaleDateString()}
              </p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Subscriptions</h3>
              {userData.subscriptions.length === 0 ? (
                <p style={{ color: '#666' }}>No subscriptions</p>
              ) : (
                userData.subscriptions.map(sub => (
                  <div key={sub.id} style={{
                    background: '#2a2a2a',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>{sub.plan_name}</div>
                    <div style={{ color: '#999', fontSize: '0.875rem' }}>
                      {sub.status} - Expires: {new Date(sub.end_date).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div>
              <h3 style={{ marginBottom: '0.5rem' }}>Recent Payments</h3>
              {userData.payments.length === 0 ? (
                <p style={{ color: '#666' }}>No payments</p>
              ) : (
                userData.payments.map(payment => (
                  <div key={payment.id} style={{
                    background: '#2a2a2a',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>KES {payment.amount}</div>
                      <div style={{ color: '#999', fontSize: '0.875rem' }}>
                        {payment.payment_method} - {payment.payment_status}
                      </div>
                    </div>
                    <div style={{ color: '#666', fontSize: '0.875rem' }}>
                      {new Date(payment.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Users

