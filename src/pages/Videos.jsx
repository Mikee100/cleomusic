import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import SubscriptionModal from '../components/SubscriptionModal'
import UpgradeInterruptionModal from '../components/UpgradeInterruptionModal'
import Interactions from '../components/Interactions'
import {
  FiVideo, FiX, FiHeart, FiMessageCircle, FiShare2, FiChevronUp, FiChevronDown, FiArrowLeft,
  FiPlay, FiPause, FiVolume2, FiVolumeX, FiDownload
} from 'react-icons/fi'
import { useResponsive } from '../hooks/useResponsive'
import { useDownloads } from '../context/DownloadsContext'

const Videos = () => {
  const { user, subscription } = useAuth()
  const { isMobile } = useResponsive()
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'video', 'reel'
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchVideos()
  }, [filter, searchQuery])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/videos', {
        params: {
          limit: 40,
          kind: filter === 'all' ? undefined : filter,
          search: searchQuery || undefined
        }
      })
      setVideos(response.data.videos || [])
    } catch (err) {
      console.error('Error fetching videos:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0b',
      color: '#fff',
      paddingBottom: '2rem'
    }}>
      {/* Search and Navigation Bar */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem 3rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: '1.5rem',
        background: 'rgba(10, 10, 11, 0.8)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            <FiArrowLeft />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.75rem', fontWeight: 800 }}>
              Discover Videos
            </h1>
            <p style={{ margin: 0, opacity: 0.5, fontSize: '0.8rem' }}>
              Explore premium music videos and exclusives
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          width: isMobile ? '100%' : 'auto',
          alignItems: 'center'
        }}>
          {/* Filters */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {['all', 'video', 'reel'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: filter === f ? '#667eea' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  textTransform: 'capitalize'
                }}
              >
                {f}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div style={{
        padding: isMobile ? '1rem' : '2rem 3rem',
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '280px' : '320px'}, 1fr))`,
        gap: '2rem'
      }}>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              aspectRatio: '16/9',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              animation: 'pulse 1.5s infinite'
            }} />
          ))
        ) : videos.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
            No videos found
          </div>
        ) : (
          videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => setSelectedVideo(video)}
            />
          ))
        )}
      </div>

      {/* Full Screen Player Overlay */}
      {selectedVideo && (
        <PremiumVideoPlayer
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }
        .premium-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }
        .premium-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(102, 126, 234, 0.8);
          transition: transform 0.2s;
        }
        .premium-slider:hover::-webkit-slider-thumb {
          transform: scale(1.3);
        }
        .glass-morphism {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

const VideoCard = ({ video, onClick }) => {
  const [isHovered, setIsHovered] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    let timeout;
    if (isHovered && videoRef.current) {
      // Small delay before playing for smoother browsing
      timeout = setTimeout(() => {
        videoRef.current.play().catch(() => { })
      }, 300);
    } else if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
    return () => clearTimeout(timeout);
  }, [isHovered])

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        zIndex: isHovered ? 10 : 1
      }}
    >
      <div style={{
        position: 'relative',
        aspectRatio: '16/9',
        borderRadius: '20px',
        overflow: 'hidden',
        background: '#1a1a1c',
        boxShadow: isHovered ? '0 30px 60px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.2)',
        border: isHovered ? '4px solid #667eea' : '4px solid #ffffff',
        transition: 'border-color 0.3s ease, border-width 0.3s ease',
        boxSizing: 'border-box'
      }}>
        {/* Thumbnail Placeholder */}
        <div style={{
          width: '100%',
          height: '100%',
          display: isHovered ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a1c, #2a2a2c)',
          position: 'relative'
        }}>
          {/* If there was a thumbnail we'd use it, otherwise a premium icon/gradient */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle at 20% 20%, #667eea 0%, transparent 40%)'
          }} />
          <FiPlay size={40} style={{ opacity: 0.2, color: '#667eea' }} />
        </div>

        {/* Muted Preview on Hover */}
        <video
          ref={videoRef}
          src={`${import.meta.env.VITE_API_URL || ''}${video.file_path}`}
          muted
          loop
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: isHovered ? 'block' : 'none',
            background: '#000'
          }}
        />

        {/* Bottom Info Overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '1.5rem 1rem 1rem',
          background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          opacity: isHovered ? 0 : 1,
          transition: 'opacity 0.3s'
        }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <h3 style={{
              margin: 0,
              fontSize: '0.9rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: '#fff'
            }}>
              {video.title}
            </h3>
          </div>
          <div style={{
            background: 'rgba(102, 126, 234, 0.2)',
            color: '#667eea',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.65rem',
            fontWeight: 800,
            marginLeft: '10px',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            letterSpacing: '0.5px'
          }}>
            {video.type?.toUpperCase() || 'REEL'}
          </div>
        </div>

        {/* Hover Controls */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(0.8)',
          width: '60px',
          height: '60px',
          background: 'rgba(102, 126, 234, 0.95)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isHovered ? 1 : 0,
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          boxShadow: '0 0 30px rgba(102, 126, 234, 0.6)',
          transform: isHovered ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.8)'
        }}>
          <FiPlay size={24} fill="white" color="white" />
        </div>
      </div>
    </div>
  )
}

const PremiumVideoPlayer = ({ video, onClose }) => {
  const { isMobile } = useResponsive()
  const { user, subscription } = useAuth()
  const { addDownload, downloads } = useDownloads()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showInterruptionModal, setShowInterruptionModal] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const videoRef = useRef(null)
  const hasInterruptedRef = useRef(false)
  const isFreeUser = !subscription && user?.role !== 'admin'

  const isDownloaded = downloads?.some(
    (d) => d.type === 'video' && d.id === video.id
  )

  useEffect(() => {
    // Esc to close
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handlePlayToggle = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error)
        setIsPlaying(true)
      } else {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }
  }

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v) return
    setCurrentTime(v.currentTime)

    if (isFreeUser && !hasInterruptedRef.current && v.currentTime >= v.duration * 0.25) {
      v.pause()
      setIsPlaying(false)
      setShowInterruptionModal(true)
      hasInterruptedRef.current = true
    }
  }

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const formatTime = (time) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 5, 6, 0.98)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      backdropFilter: 'blur(30px)'
    }}>
      {/* Top Header */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem 2.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            <FiX size={24} />
          </button>
          <div style={{ overflow: 'hidden' }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {video.title}
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.5 }}>{video.uploaded_by_name || 'Cleo Artist'}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {!isMobile && <Interactions contentType="video" contentId={video.id} />}
          <button
            onClick={() => setShowComments(!showComments)}
            style={{
              background: showComments ? '#667eea' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '30px',
              padding: '10px 24px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'all 0.3s'
            }}
          >
            <FiMessageCircle size={18} />
            {!isMobile && 'Comments'}
          </button>
          <button
            onClick={() => addDownload(video)}
            disabled={isDownloaded}
            style={{
              background: isDownloaded ? '#22c55e' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            <FiDownload size={20} />
          </button>
        </div>
      </div>

      {/* Media & Sidebar Wrapper */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Main Player Display */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#000',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <video
            ref={videoRef}
            src={`${import.meta.env.VITE_API_URL || ''}${video.file_path}`}
            playsInline
            crossOrigin="anonymous"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={(e) => setDuration(e.target.duration)}
            style={{
              width: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              boxShadow: '0 0 100px rgba(102, 126, 234, 0.1)'
            }}
            onClick={handlePlayToggle}
          />

          {/* Large Center Play Overlay */}
          {!isPlaying && (
            <div
              onClick={handlePlayToggle}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100px',
                height: '100px',
                background: 'rgba(102, 126, 234, 0.95)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 0 40px rgba(102, 126, 234, 0.4)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
            >
              <FiPlay size={44} fill="white" color="white" />
            </div>
          )}

          {/* Player controls bar */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: isMobile ? '1.5rem' : '3rem',
            background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ position: 'relative' }}>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="premium-slider"
                style={{
                  background: `linear-gradient(to right, #667eea ${(currentTime / duration) * 100}%, rgba(255, 255, 255, 0.1) ${(currentTime / duration) * 100}%)`
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <button
                  onClick={handlePlayToggle}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '1.75rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {isPlaying ? <FiPause /> : <FiPlay />}
                </button>
                <span style={{ fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                  {formatTime(currentTime)} <span style={{ opacity: 0.3, margin: '0 8px' }}>/</span> <span style={{ color: '#667eea' }}>{formatTime(duration)}</span>
                </span>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', width: isMobile ? '100px' : '180px' }}>
                <button
                  onClick={() => {
                    const newMuted = !isMuted
                    setIsMuted(newMuted)
                    if (videoRef.current) videoRef.current.muted = newMuted
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}
                >
                  {isMuted ? <FiVolumeX size={22} /> : <FiVolume2 size={22} />}
                </button>
                {!isMobile && (
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      setVolume(v)
                      if (videoRef.current) {
                        videoRef.current.volume = v
                        videoRef.current.muted = v === 0
                        setIsMuted(v === 0)
                      }
                    }}
                    className="premium-slider"
                    style={{
                      height: '4px',
                      background: `linear-gradient(to right, #fff ${volume * 100}%, rgba(255, 255, 255, 0.1) ${volume * 100}%)`
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Comments Sidebar */}
        {showComments && (
          <div className="glass-morphism" style={{
            width: isMobile ? '100%' : '450px',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem',
            animation: 'slideInRight 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiMessageCircle size={22} style={{ color: '#667eea' }} />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Comments</h3>
              </div>
              <button
                onClick={() => setShowComments(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FiX size={20} />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <CommentsPanel contentType="video" contentId={video.id} />
            </div>
          </div>
        )}
      </div>

      {showInterruptionModal && (
        <UpgradeInterruptionModal
          onClose={() => setShowInterruptionModal(false)}
          onUpgrade={() => {
            setShowInterruptionModal(false)
            if (videoRef.current) videoRef.current.play()
          }}
          contentType="video"
        />
      )}
    </div>
  )
}

const CommentsPanel = ({ contentType, contentId }) => {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComments()
  }, [contentId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/interactions/${contentType}/${contentId}/comments`)
      setComments(response.data.comments || [])
    } catch (err) {
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    try {
      setSubmitting(true)
      const response = await axios.post(`/api/interactions/${contentType}/${contentId}/comments`, {
        comment_text: newComment.trim()
      })
      setComments(prev => [response.data.comment, ...prev])
      setNewComment('')
    } catch (err) {
      console.error('Error adding comment:', err)
      alert('Failed to add comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return

    try {
      await axios.delete(`/api/interactions/comments/${commentId}`)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (err) {
      console.error('Error deleting comment:', err)
      alert('Failed to delete comment. Please try again.')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {user && (
        <form onSubmit={handleAddComment} style={{ marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                color: '#fff',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(102, 126, 234, 0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                padding: '8px 20px',
                background: '#667eea',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: newComment.trim() && !submitting ? 'pointer' : 'not-allowed',
                opacity: newComment.trim() && !submitting ? 1 : 0.5,
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
              }}
            >
              {submitting ? 'Post...' : 'Post'}
            </button>
          </div>
        </form>
      )}

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', scrollbarWidth: 'thin' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
            No comments yet.<br />Be the first to share your thoughts!
          </div>
        ) : (
          comments.map(comment => (
            <div
              key={comment.id}
              style={{
                padding: '1.25rem',
                marginBottom: '1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'background 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ color: '#fff', fontSize: '0.9rem', display: 'block', fontWeight: 700 }}>
                    {comment.user_name || comment.user_email || 'Anonymous'}
                  </strong>
                  <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem' }}>
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                {(user?.id === comment.user_id || user?.role === 'admin') && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '8px',
                      display: 'flex',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    title="Delete"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {comment.comment_text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Videos
