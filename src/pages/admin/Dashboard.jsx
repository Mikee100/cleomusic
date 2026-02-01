import { useState, useEffect } from 'react'
import axios from 'axios'
import { FiBarChart2, FiTrendingUp, FiUsers, FiMusic, FiVideo, FiImage, FiDollarSign, FiClock, FiArrowUp, FiArrowDown } from 'react-icons/fi'
import AdminErrorBanner, { getAdminErrorMessage } from '../../components/AdminErrorBanner'
import { useResponsive } from '../../hooks/useResponsive'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { isMobile } = useResponsive()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get('/api/admin/stats')
      setStats(response.data)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError(getAdminErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
  }

  if (error) {
    return (
      <div>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><FiBarChart2 /> Dashboard Overview</h1>
          <p style={{ color: '#999' }}>Welcome to your admin dashboard</p>
        </div>
        <AdminErrorBanner error={error} onRetry={() => { setError(null); fetchStats() }} />
      </div>
    )
  }

  if (!stats) return null

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
          <FiBarChart2 /> Dashboard Overview
        </h1>
        <p style={{ color: '#999', fontSize: isMobile ? '0.875rem' : '1rem' }}>Welcome to your admin dashboard</p>
      </div>

      {/* Main Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile 
          ? 'repeat(1, 1fr)' 
          : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <StatCard 
          title="Total Songs" 
          value={stats.songs.total} 
          color="#667eea"
          icon={<FiMusic />}
        />
        <StatCard 
          title="Active Songs" 
          value={stats.songs.active} 
          color="#10b981" 
          icon={<FiMusic />}
        />
        <StatCard 
          title="Total Users" 
          value={stats.users.total} 
          color="#3b82f6"
          icon={<FiUsers />}
          subtitle={`${stats.users.new_last_7_days} new this week`}
        />
        <StatCard 
          title="Active Subscriptions" 
          value={stats.subscriptions.active} 
          color="#8b5cf6" 
          icon={<FiTrendingUp />}
        />
        <StatCard 
          title="Total Revenue" 
          value={`KES ${stats.revenue.total.toFixed(2)}`} 
          color="#10b981"
          icon={<FiDollarSign />}
        />
        <StatCard 
          title="Monthly Revenue" 
          value={`KES ${stats.revenue.monthly.toFixed(2)}`} 
          color="#06b6d4"
          icon={<FiDollarSign />}
        />
        <StatCard 
          title="Albums" 
          value={stats.content?.albums || 0} 
          color="#f59e0b"
          icon={<FiMusic />}
        />
        <StatCard 
          title="Videos" 
          value={stats.content?.videos || 0} 
          color="#ef4444"
          icon={<FiVideo />}
        />
      </div>

      {/* Two Column Layout for Desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Top Performing Songs */}
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #333'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiTrendingUp /> Top Performing Songs
            </h2>
          </div>
          {stats.top_songs && stats.top_songs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats.top_songs.slice(0, 5).map((song, index) => (
                <div
                  key={song.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem',
                    background: '#0a0a0a',
                    borderRadius: '8px',
                    border: '1px solid #222'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: index === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#2a2a2a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    background: song.cover_image_path 
                      ? `url(${import.meta.env.VITE_API_URL || ''}${song.cover_image_path})` 
                      : '#2a2a2a',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.9375rem',
                      fontWeight: '500',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '0.25rem'
                    }}>
                      {song.title}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#999' }}>
                      {song.artist}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#667eea' }}>
                      {song.play_count.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                      plays
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
              No songs with plays yet
            </div>
          )}
        </div>

        {/* Popular Genres */}
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #333'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiMusic /> Popular Genres
          </h2>
          {stats.popular_genres && stats.popular_genres.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats.popular_genres.slice(0, 8).map((genre, index) => {
                const maxCount = stats.popular_genres[0]?.song_count || 1
                const percentage = (genre.song_count / maxCount) * 100
                return (
                  <div key={genre.name}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '0.9375rem', fontWeight: '500' }}>{genre.name}</span>
                      <span style={{ fontSize: '0.875rem', color: '#999' }}>
                        {genre.song_count} songs
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#0a0a0a',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #667eea, #764ba2)',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
              No genre data available
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Recent Uploads */}
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #333'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiMusic /> Recent Uploads
            </h2>
            <Link to="/admin/songs" style={{ color: '#667eea', fontSize: '0.875rem', textDecoration: 'none' }}>
              View all
            </Link>
          </div>
          {stats.recent_uploads && stats.recent_uploads.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.recent_uploads.slice(0, 5).map(song => (
                <div key={song.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  background: '#0a0a0a'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '6px',
                    background: song.cover_image_path 
                      ? `url(${import.meta.env.VITE_API_URL || ''}${song.cover_image_path})` 
                      : '#2a2a2a',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {song.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#999' }}>
                      {song.artist}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#666', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
              No recent uploads
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #333'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiUsers /> New Users
            </h2>
            <Link to="/admin/users" style={{ color: '#667eea', fontSize: '0.875rem', textDecoration: 'none' }}>
              View all
            </Link>
          </div>
          {stats.recent_users && stats.recent_users.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.recent_users.slice(0, 5).map(user => (
                <div key={user.id} style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: '#0a0a0a'
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#999' }}>
                    {user.email}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#666', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
              No new users
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #333'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiDollarSign /> Recent Payments
            </h2>
            <Link to="/admin/payments" style={{ color: '#667eea', fontSize: '0.875rem', textDecoration: 'none' }}>
              View all
            </Link>
          </div>
          {stats.recent_payments_list && stats.recent_payments_list.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.recent_payments_list.slice(0, 5).map(payment => (
                <div key={payment.id} style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: '#0a0a0a'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#10b981' }}>
                      {payment.currency} {payment.amount.toFixed(2)}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      background: '#1a1a2a',
                      color: '#999',
                      textTransform: 'capitalize'
                    }}>
                      {payment.payment_method}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#999' }}>
                    {payment.user_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                    {new Date(payment.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#666', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
              No recent payments
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ title, value, color, icon, subtitle }) => (
  <div style={{
    background: '#1a1a1a',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #333',
    borderLeft: `4px solid ${color}`,
    transition: 'transform 0.2s, box-shadow 0.2s'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-2px)'
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)'
    e.currentTarget.style.boxShadow = 'none'
  }}
  >
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      marginBottom: '0.75rem'
    }}>
      <div style={{ color: '#999', fontSize: '0.875rem', fontWeight: '500' }}>{title}</div>
      <div style={{ color, fontSize: '1.25rem' }}>{icon}</div>
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 'bold', color, marginBottom: subtitle ? '0.25rem' : '0' }}>
      {value}
    </div>
    {subtitle && (
      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
        {subtitle}
      </div>
    )}
  </div>
)

export default Dashboard
