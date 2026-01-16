import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FiVideo, FiPlay, FiArrowLeft, FiEye, FiClock } from 'react-icons/fi'
import { useResponsive } from '../hooks/useResponsive'
import { useAuth } from '../context/AuthContext'

const ClientVideos = () => {
  const { isMobile } = useResponsive()
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get('/api/videos', {
        params: { limit: 100, kind: 'video' }
      })
      setVideos(response.data.videos || [])
    } catch (err) {
      console.error('Error fetching videos:', err)
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoSelect = (video) => {
    navigate(`/videos/${video.id}`)
  }

  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / 86400000)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    if (diffDays < 1) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 30) return `${diffDays} days ago`
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0a0a0a'
      }}>
        <div style={{ color: '#fff', fontSize: '1.2rem' }}>Loading videos...</div>
      </div>
    )
  }

  if (error || videos.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '4rem',
        color: '#fff',
        background: '#0a0a0a',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '70px',
          background: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem'
            }}
          >
            <FiArrowLeft size={20} /> Back
          </button>
        </div>

        <FiVideo style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          {error ? 'Unable to load videos' : 'No videos found'}
        </h2>
        <p style={{ color: '#666', maxWidth: '400px', marginBottom: '2rem' }}>
          {error ? `Reason: ${error}` : 'Check back later for new content!'}
        </p>
        <button
          onClick={() => fetchVideos()}
          style={{
            padding: '0.75rem 2rem',
            background: '#667eea',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      padding: '90px 20px 40px',
      color: '#fff'
    }}>
      {/* Premium Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '70px',
        background: 'rgba(10, 10, 10, 0.85)',
        backdropFilter: 'blur(20px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        padding: '0 25px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.5)'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <FiArrowLeft size={22} />
        </button>
        <h1 style={{ marginLeft: '1.5rem', fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.5px' }}>Music Videos</h1>
      </div>

      {/* Video Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {videos.map((video) => (
          <div
            key={video.id}
            onClick={() => handleVideoSelect(video)}
            onMouseEnter={() => setHoveredId(video.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              cursor: 'pointer',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: hoveredId === video.id ? 'translateY(-5px)' : 'none'
            }}
          >
            {/* Thumbnail Wrapper */}
            <div style={{
              width: '100%',
              height: '420px',
              background: '#1a1a1a',
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: hoveredId === video.id ? '0 15px 35px rgba(0,0,0,0.4)' : '0 8px 15px rgba(0,0,0,0.2)',
              border: hoveredId === video.id ? '4px solid #667eea' : '4px solid #ffffff',
              transition: 'all 0.3s',
              boxSizing: 'border-box'
            }}>
              <video
                src={`${import.meta.env.VITE_API_URL || ''}${video.file_path}#t=1`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                preload="metadata"
              />

              {/* Play Overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: hoveredId === video.id ? 1 : 0,
                transition: 'opacity 0.3s'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#667eea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(102, 126, 234, 0.5)',
                  transform: hoveredId === video.id ? 'scale(1)' : 'scale(0.8)',
                  transition: 'transform 0.3s'
                }}>
                  <FiPlay size={24} fill="#fff" color="#fff" />
                </div>
              </div>
            </div>

            {/* Video Info Container */}
            <div style={{ marginTop: '14px', display: 'flex', gap: '12px' }}>
              {/* Avatar Placeholder */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '0.9rem',
                flexShrink: 0
              }}>
                {(video.uploaded_by_name || 'A')[0].toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  margin: '0 0 4px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#fff',
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {video.title}
                </h3>
                <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '2px' }}>
                  {video.uploaded_by_name || 'Cleo Music Artist'}
                </div>
                <div style={{ color: '#888', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{video.views || 0} views</span>
                  <span style={{ fontSize: '4px' }}>●</span>
                  <span>{formatRelativeDate(video.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ClientVideos
