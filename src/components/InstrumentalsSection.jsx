import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FiMusic } from 'react-icons/fi'
import { useResponsive } from '../hooks/useResponsive'
import { useAuth } from '../context/AuthContext'

const InstrumentalsSection = () => {
  const { isMobile } = useResponsive()
  const { subscription, user } = useAuth()
  const navigate = useNavigate()
  const [instrumentals, setInstrumentals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (subscription || user?.role === 'admin') {
      fetchInstrumentals()
    } else {
      setLoading(false)
    }
  }, [subscription, user])

  const fetchInstrumentals = async () => {
    try {
      const response = await axios.get('/api/instrumentals', { params: { limit: 6 } })
      setInstrumentals(response.data.instrumentals || [])
    } catch (err) {
      console.error('Error fetching instrumentals:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!subscription && user?.role !== 'admin') return null
  if (loading) return null
  if (!instrumentals || instrumentals.length === 0) return null

  return (
    <section style={{
      padding: isMobile ? '2rem 1rem' : '4rem 2rem',
      background: 'linear-gradient(to bottom, #1a1a1a, #0a0a0a)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isMobile ? '1rem' : '2rem'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.75rem' : '2.5rem',
          fontWeight: 'bold',
          color: '#fff'
        }}>
          Instrumentals
        </h2>
        <button
          onClick={() => navigate('/instrumentals')}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: '1px solid #667eea',
            borderRadius: '8px',
            color: '#667eea',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#667eea'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#667eea'
          }}
        >
          View All
        </button>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile 
          ? 'repeat(2, 1fr)' 
          : 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: isMobile ? '1rem' : '2rem',
        overflowX: 'auto'
      }}>
        {instrumentals.slice(0, 6).map((instrumental) => (
          <div
            key={instrumental.id}
            style={{
              background: '#1a1a1a',
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.3s, box-shadow 0.3s',
              border: '1px solid #333'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)'
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
            onClick={() => navigate('/instrumentals')}
          >
            <div style={{
              width: '100%',
              aspectRatio: '1',
              background: instrumental.cover_image_path
                ? `url(http://localhost:5000${instrumental.cover_image_path})`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              color: '#fff'
            }}>
              {!instrumental.cover_image_path && <FiMusic />}
            </div>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {instrumental.title}
              </h3>
              <p style={{
                color: '#999',
                fontSize: '0.875rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {instrumental.artist || 'Artist'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default InstrumentalsSection

