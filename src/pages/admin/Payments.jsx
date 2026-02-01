import { useState, useEffect } from 'react'
import axios from 'axios'
import { useResponsive } from '../../hooks/useResponsive'
import AdminErrorBanner, { getAdminErrorMessage } from '../../components/AdminErrorBanner'
import { FiDollarSign } from 'react-icons/fi'

const Payments = () => {
  const { isMobile } = useResponsive()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')

  useEffect(() => {
    fetchPayments()
  }, [statusFilter, methodFilter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get('/api/admin/payments', {
        params: { status: statusFilter || undefined, method: methodFilter || undefined }
      })
      setPayments(response.data.payments)
    } catch (err) {
      console.error('Error fetching payments:', err)
      setError(getAdminErrorMessage(err))
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
          <FiDollarSign /> Payments History
        </h1>
        <p style={{ color: '#999', fontSize: isMobile ? '0.875rem' : '1rem' }}>View all payment transactions</p>
      </div>

      <AdminErrorBanner error={error} onRetry={() => { setError(null); fetchPayments() }} />
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        gap: '1rem', 
        marginBottom: '1rem' 
      }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '0.75rem',
            background: '#2a2a2a',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          style={{
            padding: '0.75rem',
            background: '#2a2a2a',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          <option value="">All Methods</option>
          <option value="stripe">Stripe</option>
          <option value="mpesa">M-Pesa</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: isMobile ? '1rem' : '2rem' }}>Loading...</div>
      ) : error ? null : isMobile ? (
        // Mobile: Card layout
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {payments.map(payment => (
            <div
              key={payment.id}
              style={{
                background: '#1a1a1a',
                borderRadius: '12px',
                border: '1px solid #333',
                padding: '1rem'
              }}
            >
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ color: '#fff', fontWeight: '500', marginBottom: '0.25rem' }}>
                  {payment.user_name}
                </div>
                <div style={{ color: '#999', fontSize: '0.875rem' }}>{payment.email}</div>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.125rem' }}>
                    KES {payment.amount}
                  </div>
                  <div style={{ color: '#999', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {payment.payment_method}
                  </div>
                </div>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  background: payment.payment_status === 'completed' ? '#10b981' : 
                              payment.payment_status === 'pending' ? '#f59e0b' : '#ef4444',
                  color: '#fff'
                }}>
                  {payment.payment_status}
                </span>
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                {new Date(payment.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Desktop: Table layout
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #333',
          overflow: 'hidden',
          overflowX: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#2a2a2a', borderBottom: '1px solid #333' }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#fff' }}>User</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#fff' }}>Amount</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#fff' }}>Method</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#fff' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#fff' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '1rem', color: '#fff' }}>{payment.user_name}</td>
                  <td style={{ padding: '1rem', color: '#fff' }}>KES {payment.amount}</td>
                  <td style={{ padding: '1rem', color: '#999' }}>{payment.payment_method}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      background: payment.payment_status === 'completed' ? '#10b981' : 
                                  payment.payment_status === 'pending' ? '#f59e0b' : '#ef4444',
                      color: '#fff'
                    }}>
                      {payment.payment_status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#999' }}>
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Payments

