import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useResponsive } from '../hooks/useResponsive'
import Interactions from '../components/Interactions'
import {
  FiHeart, FiMessageCircle, FiShare2, FiPlay, FiPause,
  FiVolume2, FiVolumeX, FiChevronUp, FiChevronDown, FiX
} from 'react-icons/fi'

const Reels = () => {
  const { user } = useAuth()
  const { isMobile } = useResponsive()
  const navigate = useNavigate()
  const [reels, setReels] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const containerRef = useRef(null)
  const videoRefs = useRef({})
  const isScrollingRef = useRef(false)

  useEffect(() => {
    fetchReels()
  }, [])

  useEffect(() => {
    // Auto-play current video when index changes
    if (reels.length > 0 && currentIndex >= 0 && currentIndex < reels.length) {
      playCurrentVideo()
    }
  }, [currentIndex, reels])

  const fetchReels = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/videos', {
        params: {
          limit: 50,
          kind: 'reel'
        }
      })
      setReels(response.data.videos || [])
    } catch (err) {
      console.error('Error fetching reels:', err)
    } finally {
      setLoading(false)
    }
  }

  const playCurrentVideo = () => {
    // Pause all videos
    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        video.pause()
      }
    })

    // Play current video
    const currentVideo = videoRefs.current[currentIndex]
    if (currentVideo) {
      currentVideo.currentTime = 0
      if (isPlaying) {
        currentVideo.play().catch(console.error)
      }
    }
  }

  const handleScroll = useCallback((e) => {
    if (isScrollingRef.current) return

    const container = containerRef.current
    if (!container) return

    const scrollTop = container.scrollTop
    const itemHeight = window.innerHeight
    const newIndex = Math.round(scrollTop / itemHeight)

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
      isScrollingRef.current = true
      setCurrentIndex(newIndex)
      
      // Smooth scroll to exact position
      container.scrollTo({
        top: newIndex * itemHeight,
        behavior: 'smooth'
      })

      setTimeout(() => {
        isScrollingRef.current = false
      }, 500)
    }
  }, [currentIndex, reels.length])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    if (isScrollingRef.current) return

    const container = containerRef.current
    if (!container) return

    const delta = e.deltaY > 0 ? 1 : -1
    const newIndex = Math.max(0, Math.min(reels.length - 1, currentIndex + delta))

    if (newIndex !== currentIndex) {
      isScrollingRef.current = true
      setCurrentIndex(newIndex)
      
      container.scrollTo({
        top: newIndex * window.innerHeight,
        behavior: 'smooth'
      })

      setTimeout(() => {
        isScrollingRef.current = false
      }, 500)
    }
  }, [currentIndex, reels.length])

  const handleTouchStart = useRef({ y: 0 })
  const handleTouchMove = useCallback((e) => {
    handleTouchStart.current.y = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e) => {
    const startY = handleTouchStart.current.y
    const endY = e.changedTouches[0].clientY
    const diff = startY - endY

    if (Math.abs(diff) > 50) {
      const delta = diff > 0 ? 1 : -1
      const newIndex = Math.max(0, Math.min(reels.length - 1, currentIndex + delta))

      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex)
        const container = containerRef.current
        if (container) {
          container.scrollTo({
            top: newIndex * window.innerHeight,
            behavior: 'smooth'
          })
        }
      }
    }
  }, [currentIndex, reels.length])

  const togglePlayPause = () => {
    const currentVideo = videoRefs.current[currentIndex]
    if (currentVideo) {
      if (isPlaying) {
        currentVideo.pause()
      } else {
        currentVideo.play().catch(console.error)
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    const currentVideo = videoRefs.current[currentIndex]
    if (currentVideo) {
      currentVideo.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVideoRef = (index, ref) => {
    if (ref) {
      videoRefs.current[index] = ref
      ref.muted = isMuted
      
      // Auto-play if it's the current video
      if (index === currentIndex && isPlaying) {
        ref.play().catch(console.error)
      }
    }
  }

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: '#fff'
      }}>
        <div>Loading reels...</div>
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: '#fff',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '1.2rem' }}>No reels available</div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#667eea',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Go Home
        </button>
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
      background: '#000',
      overflow: 'hidden',
      zIndex: 1000
    }}>
      {/* Close Button */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 1001,
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.7)'
          e.currentTarget.style.transform = 'scale(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.5)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <FiX size={20} />
      </button>

      {/* Reels Container - Snap Scroll */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onTouchStart={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          height: '100vh',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {reels.map((reel, index) => (
          <ReelItem
            key={reel.id}
            reel={reel}
            index={index}
            isActive={index === currentIndex}
            isPlaying={isPlaying && index === currentIndex}
            isMuted={isMuted}
            onVideoRef={(ref) => handleVideoRef(index, ref)}
            onPlayPause={togglePlayPause}
            onMute={toggleMute}
            currentIndex={currentIndex}
            totalReels={reels.length}
          />
        ))}
      </div>

      {/* Navigation Hints */}
      {!isMobile && (
        <div style={{
          position: 'fixed',
          right: '1rem',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          opacity: 0.6
        }}>
          {currentIndex > 0 && (
            <FiChevronUp size={24} color="#fff" />
          )}
          {currentIndex < reels.length - 1 && (
            <FiChevronDown size={24} color="#fff" />
          )}
        </div>
      )}
    </div>
  )
}

const ReelItem = ({ reel, index, isActive, isPlaying, isMuted, onVideoRef, onPlayPause, onMute, currentIndex, totalReels }) => {
  const videoRef = useRef(null)
  const { user } = useAuth()
  const [showInteractions, setShowInteractions] = useState(false)

  useEffect(() => {
    if (videoRef.current) {
      onVideoRef(videoRef.current)
    }
  }, [onVideoRef])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted
      if (isActive && isPlaying) {
        videoRef.current.play().catch(console.error)
      } else {
        videoRef.current.pause()
      }
    }
  }, [isActive, isPlaying, isMuted])

  const videoSrc = reel.file_path ? `${import.meta.env.VITE_API_URL || ''}${reel.file_path}` : null

  return (
    <div
      style={{
        height: '100vh',
        width: '100%',
        position: 'relative',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000'
      }}
      onMouseEnter={() => setShowInteractions(true)}
      onMouseLeave={() => setShowInteractions(false)}
    >
      {/* Video */}
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          loop
          playsInline
          muted={isMuted}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: '#000'
          }}
          onLoadedData={() => {
            if (isActive && isPlaying && videoRef.current) {
              videoRef.current.play().catch(console.error)
            }
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          fontSize: '1.5rem'
        }}>
          No video available
        </div>
      )}

      {/* Play/Pause Overlay */}
      {!isPlaying && isActive && (
        <div
          onClick={onPlayPause}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80px',
            height: '80px',
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255,255,255,0.3)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.8)'
            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.6)'
            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
          }}
        >
          <FiPlay size={32} color="#fff" />
        </div>
      )}

      {/* Bottom Info Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '2rem',
        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
        pointerEvents: 'none'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '2rem',
          pointerEvents: 'auto'
        }}>
          {/* Left: User Info & Description */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {(reel.uploaded_by_name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style={{
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  {reel.uploaded_by_name || 'Cleo Music'}
                </div>
                <div style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.85rem'
                }}>
                  {reel.title}
                </div>
              </div>
            </div>
            {reel.description && (
              <div style={{
                color: '#fff',
                fontSize: '0.9rem',
                marginTop: '0.5rem',
                lineHeight: '1.4',
                maxWidth: '70%'
              }}>
                {reel.description}
              </div>
            )}
          </div>

          {/* Right: Interactions */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            alignItems: 'center'
          }}>
            <div style={{ pointerEvents: 'auto' }}>
              <Interactions
                contentType="video"
                contentId={reel.id}
                compact={true}
              />
            </div>

            {/* Mute Button */}
            <button
              onClick={onMute}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {isMuted ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'rgba(255,255,255,0.2)',
        zIndex: 1002
      }}>
        <div style={{
          width: `${((currentIndex + 1) / totalReels) * 100}%`,
          height: '100%',
          background: '#667eea',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  )
}

export default Reels
