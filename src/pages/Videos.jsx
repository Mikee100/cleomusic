import { useState, useEffect, useRef, useCallback } from 'react'
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const containerRef = useRef(null)
  const videoRefs = useRef({})
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)
  const isScrolling = useRef(false)

  useEffect(() => {
    // Allow free users to access videos (they'll get interrupted after 20 seconds)
    fetchVideos()
  }, [subscription, user])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/videos', {
        params: { limit: 20, kind: 'reel' }
      })
      setVideos(response.data.videos || [])
    } catch (err) {
      console.error('Error fetching videos:', err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-play current video and pause others
  useEffect(() => {
    videos.forEach((video, index) => {
      const videoElement = videoRefs.current[video.id]
      if (videoElement) {
        if (index === currentIndex) {
          videoElement.play().catch(() => {
            // Autoplay was prevented, user interaction required
          })
        } else {
          videoElement.pause()
        }
      }
    })

    // Prefetch next video for faster loading - limit to just the next one
    if (currentIndex < videos.length - 1) {
      const nextVideo = videos[currentIndex + 1]
      if (nextVideo?.file_path) {
        const prefetchUrl = `${import.meta.env.VITE_API_URL || ''}${nextVideo.file_path}`

        // Use a more modern and reliable preloading approach for videos
        const video = document.createElement('video')
        video.preload = 'auto'
        video.src = prefetchUrl

        // Clean up after a delay or when we move past
        const cleanup = () => {
          video.src = ''
          video.load()
        }

        const timeoutId = setTimeout(cleanup, 60000)
        return () => {
          clearTimeout(timeoutId)
          cleanup()
        }
      }
    }
  }, [currentIndex, videos])

  // Handle scroll to snap to videos
  const handleScroll = useCallback(() => {
    if (isScrolling.current) return

    const container = containerRef.current
    if (!container) return

    const scrollTop = container.scrollTop
    const videoHeight = window.innerHeight
    const newIndex = Math.round(scrollTop / videoHeight)

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videos.length) {
      setCurrentIndex(newIndex)
    }
  }, [currentIndex, videos.length])

  // Smooth scroll to video
  const scrollToVideo = (index) => {
    if (index < 0 || index >= videos.length) return

    isScrolling.current = true
    const container = containerRef.current
    if (container) {
      container.scrollTo({
        top: index * window.innerHeight,
        behavior: 'smooth'
      })
    }

    setTimeout(() => {
      isScrolling.current = false
      setCurrentIndex(index)
    }, 500)
  }

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    touchEndY.current = e.changedTouches[0].clientY
    handleSwipe()
  }

  const handleSwipe = () => {
    const diff = touchStartY.current - touchEndY.current
    const minSwipeDistance = 50

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        // Swipe up - next video
        scrollToVideo(currentIndex + 1)
      } else {
        // Swipe down - previous video
        scrollToVideo(currentIndex - 1)
      }
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        scrollToVideo(currentIndex + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        scrollToVideo(currentIndex - 1)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, videos.length])

  // Allow free users to access videos - they'll get interrupted after 20 seconds

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

  if (videos.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '4rem',
        color: '#666',
        background: '#0a0a0a',
        minHeight: '100vh'
      }}>
        <FiVideo style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }} />
        <h2>No videos found</h2>
        <p>Check back later for new content!</p>
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
      touchAction: 'pan-y'
    }}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          height: '100vh',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none' // IE/Edge
        }}
        className="video-reel-container"
        onWheel={(e) => {
          // Prevent horizontal scrolling
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault()
          }
        }}
      >
        {videos.map((video, index) => (
          <VideoReelItem
            key={video.id}
            video={video}
            index={index}
            isActive={index === currentIndex}
            videoRef={(el) => {
              videoRefs.current[video.id] = el
            }}
            onNext={() => scrollToVideo(index + 1)}
            onPrevious={() => scrollToVideo(index - 1)}
            canGoNext={index < videos.length - 1}
            canGoPrevious={index > 0}
          />
        ))}
      </div>

      {/* Navigation indicators - Moved to left side to avoid interference */}
      {!isMobile && videos.length > 1 && (
        <div style={{
          position: 'fixed',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <button
            onClick={() => scrollToVideo(currentIndex - 1)}
            disabled={currentIndex === 0}
            style={{
              padding: '0.75rem',
              background: currentIndex === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              color: '#fff',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: currentIndex === 0 ? 0.3 : 1,
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              if (currentIndex > 0) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
                e.currentTarget.style.transform = 'scale(1.1)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = currentIndex === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <FiChevronUp size={24} />
          </button>
          <button
            onClick={() => scrollToVideo(currentIndex + 1)}
            disabled={currentIndex === videos.length - 1}
            style={{
              padding: '0.75rem',
              background: currentIndex === videos.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              color: '#fff',
              cursor: currentIndex === videos.length - 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: currentIndex === videos.length - 1 ? 0.3 : 1,
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              if (currentIndex < videos.length - 1) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
                e.currentTarget.style.transform = 'scale(1.1)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = currentIndex === videos.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <FiChevronDown size={24} />
          </button>
        </div>
      )}

      {/* Back button and video counter */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.5)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="Go back"
        >
          <FiArrowLeft />
        </button>
        <div style={{
          background: 'rgba(0,0,0,0.5)',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          color: '#fff',
          fontSize: '0.875rem',
          backdropFilter: 'blur(10px)'
        }}>
          {currentIndex + 1} / {videos.length}
        </div>
      </div>

      {showSubscriptionModal && (
        <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />
      )}
    </div>
  )
}

const VideoReelItem = ({ video, index, isActive, videoRef, onNext, onPrevious, canGoNext, canGoPrevious }) => {
  const { isMobile } = useResponsive()
  const { user, subscription } = useAuth()
  const { addDownload, downloads } = useDownloads()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [showComments, setShowComments] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [showInterruptionModal, setShowInterruptionModal] = useState(false)
  const videoElementRef = useRef(null)
  const hasInterruptedRef = useRef(false)
  const isFreeUser = !subscription && user?.role !== 'admin'
  const isDownloaded = downloads?.some(
    (d) => d.type === 'video' && d.id === video.id
  )

  useEffect(() => {
    if (videoRef) {
      videoRef(videoElementRef.current)
    }

    // Start loading video metadata even when not active (for faster switching)
    const videoElement = videoElementRef.current
    if (videoElement && videoElement.readyState === 0) {
      videoElement.load()
    }
  }, [videoRef])

  // Sync playing/mute state and handle interruption based on progress
  useEffect(() => {
    const videoElement = videoElementRef.current
    if (!videoElement) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleVolumeChange = () => {
      setIsMuted(videoElement.muted)
    }
    const handleTimeUpdate = () => {
      const duration = videoElement.duration
      const currentTime = videoElement.currentTime

      if (
        isFreeUser &&
        !hasInterruptedRef.current &&
        duration > 0 &&
        currentTime >= duration * 0.25
      ) {
        videoElement.pause()
        setIsPlaying(false)
        setShowInterruptionModal(true)
        hasInterruptedRef.current = true
      }
    }

    videoElement.addEventListener('play', handlePlay)
    videoElement.addEventListener('pause', handlePause)
    videoElement.addEventListener('volumechange', handleVolumeChange)
    videoElement.addEventListener('timeupdate', handleTimeUpdate)

    // Initialize mute state
    setIsMuted(videoElement.muted)

    return () => {
      videoElement.removeEventListener('play', handlePlay)
      videoElement.removeEventListener('pause', handlePause)
      videoElement.removeEventListener('volumechange', handleVolumeChange)
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [isFreeUser])

  // Update playing state when video becomes active/inactive
  useEffect(() => {
    const videoElement = videoElementRef.current
    if (!videoElement) return

    if (isActive) {
      hasInterruptedRef.current = false
      setShowInterruptionModal(false)

      // Start loading immediately when video becomes active
      if (videoElement.readyState < 2) {
        videoElement.load() // Force reload to start buffering
      }

      // Try to play as soon as we have enough data
      const tryPlay = () => {
        if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
          videoElement.play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false))
        }
      }

      // Try immediately if already loaded
      tryPlay()

      // Also try when data becomes available
      videoElement.addEventListener('loadeddata', tryPlay, { once: true })
      videoElement.addEventListener('canplay', tryPlay, { once: true })

      return () => {
        videoElement.removeEventListener('loadeddata', tryPlay)
        videoElement.removeEventListener('canplay', tryPlay)
      }
    } else {
      videoElement.pause()
      setIsPlaying(false)
      setShowInterruptionModal(false)
    }
  }, [isActive])

  useEffect(() => {
    // Fetch interaction counts
    const fetchInteractions = async () => {
      try {
        const [likesRes, commentsRes] = await Promise.all([
          axios.get(`/api/interactions/video/${video.id}/likes`).catch(() => ({ data: { count: 0, liked: false } })),
          axios.get(`/api/interactions/video/${video.id}/comments`).catch(() => ({ data: { comments: [] } }))
        ])
        setLikeCount(likesRes.data.count || 0)
        setIsLiked(likesRes.data.liked || false)
        setCommentCount(commentsRes.data.comments?.length || 0)
      } catch (err) {
        console.error('Error fetching interactions:', err)
      }
    }
    if (isActive) {
      fetchInteractions()
    }
  }, [video.id, isActive])

  const handleLike = async (e) => {
    e.stopPropagation()
    try {
      const response = await axios.post(`/api/interactions/video/${video.id}/likes`)
      setIsLiked(response.data.liked)
      setLikeCount(prev => response.data.liked ? prev + 1 : prev - 1)
    } catch (err) {
      console.error('Error toggling like:', err)
    }
  }

  const handleVideoClick = () => {
    if (videoElementRef.current) {
      if (videoElementRef.current.paused) {
        videoElementRef.current.play()
      } else {
        videoElementRef.current.pause()
      }
    }
  }

  const handlePlayPause = (e) => {
    e.stopPropagation()
    if (videoElementRef.current) {
      if (videoElementRef.current.paused) {
        videoElementRef.current.play()
      } else {
        videoElementRef.current.pause()
      }
    }
  }

  const handleMuteToggle = (e) => {
    e.stopPropagation()
    if (videoElementRef.current) {
      videoElementRef.current.muted = !videoElementRef.current.muted
      setIsMuted(videoElementRef.current.muted)
    }
  }

  const handleDownload = (e) => {
    e.stopPropagation()
    addDownload({
      type: 'video',
      id: video.id,
      title: video.title,
      description: video.description,
      file_path: video.file_path
    })
  }

  const handleInterruptionClose = () => {
    setShowInterruptionModal(false)
    // User can continue with free version, but video stays paused
  }

  const handleInterruptionUpgrade = () => {
    setShowInterruptionModal(false)
    // After upgrade, user can continue playing
    if (videoElementRef.current) {
      videoElementRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        console.error('Failed to resume playback')
      })
    }
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        scrollSnapAlign: 'start',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000'
      }}
    >
      {/* Video */}
      <video
        ref={videoElementRef}
        src={`${import.meta.env.VITE_API_URL || ''}${video.file_path}`}
        loop
        muted={isMuted}
        playsInline
        preload={isActive ? "auto" : "metadata"}
        crossOrigin="anonymous"
        onCanPlay={() => {
          // Video ready to play
          if (isActive && videoElementRef.current) {
            videoElementRef.current.play().catch(() => {
              // Autoplay prevented, will need user interaction
            })
          }
        }}
        onCanPlay={() => {
          // Video can start playing
          if (isActive && videoElementRef.current && videoElementRef.current.paused) {
            videoElementRef.current.play().catch(() => {
              // Autoplay prevented
            })
          }
        }}
        onClick={handleVideoClick}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          cursor: 'pointer'
        }}
      />

      {/* Video Controls - Top Center */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '0.75rem',
        zIndex: 15,
        alignItems: 'center'
      }}>
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            transition: 'all 0.2s',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <FiPause /> : <FiPlay />}
        </button>

        {/* Mute/Unmute Button */}
        <button
          onClick={handleMuteToggle}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            transition: 'all 0.2s',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <FiVolumeX /> : <FiVolume2 />}
        </button>
        {/* Download */}
        <button
          onClick={handleDownload}
          disabled={isDownloaded}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: isDownloaded ? '#22c55e' : '#fff',
            cursor: isDownloaded ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            transition: 'all 0.2s',
            backdropFilter: 'blur(10px)'
          }}
          title={isDownloaded ? 'Saved' : 'Download for offline in‑app viewing'}
        >
          <FiDownload />
        </button>
      </div>

      {/* Overlay UI - Right side actions (Better positioned to avoid scroll buttons) */}
      <div style={{
        position: 'absolute',
        right: isMobile ? '10px' : '20px',
        bottom: isMobile ? '80px' : '120px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        zIndex: 10,
        alignItems: 'center'
      }}>
        {/* Like button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <button
            onClick={handleLike}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: isLiked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: isLiked ? '#ef4444' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isLiked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isLiked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <FiHeart style={{ fill: isLiked ? 'currentColor' : 'none' }} />
          </button>
          <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>
            {likeCount > 0 ? (likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount) : ''}
          </span>
        </div>

        {/* Comment button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowComments(!showComments)
            }}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: showComments ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = showComments ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <FiMessageCircle />
          </button>
          <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>
            {commentCount > 0 ? (commentCount > 999 ? `${(commentCount / 1000).toFixed(1)}K` : commentCount) : ''}
          </span>
        </div>

        {/* Share button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (navigator.share) {
              navigator.share({
                title: video.title,
                text: video.description,
                url: window.location.href
              }).catch(() => { })
            } else {
              navigator.clipboard.writeText(window.location.href)
              alert('Link copied to clipboard!')
            }
          }}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            transition: 'all 0.2s',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <FiShare2 />
        </button>
      </div>


      {/* Interruption Modal */}
      {showInterruptionModal && (
        <UpgradeInterruptionModal
          onClose={handleInterruptionClose}
          onUpgrade={handleInterruptionUpgrade}
          contentType="video"
        />
      )}

      {/* Comments panel */}
      {showComments && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(20px)',
          zIndex: 20,
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h4 style={{ margin: 0, color: '#fff' }}>Comments</h4>
            <button
              onClick={() => setShowComments(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '1.5rem',
                padding: '0.25rem'
              }}
            >
              <FiX />
            </button>
          </div>
          <CommentsPanel contentType="video" contentId={video.id} />
        </div>
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
        <form onSubmit={handleAddComment} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              resize: 'none',
              marginBottom: '0.75rem'
            }}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            style={{
              padding: '0.5rem 1.5rem',
              background: '#667eea',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              cursor: newComment.trim() && !submitting ? 'pointer' : 'not-allowed',
              opacity: newComment.trim() && !submitting ? 1 : 0.5
            }}
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </form>
      )}

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map(comment => (
            <div
              key={comment.id}
              style={{
                padding: '0.75rem',
                marginBottom: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ color: '#fff', fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
                    {comment.user_name || comment.user_email || 'Anonymous'}
                  </strong>
                  <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                {(user?.id === comment.user_id || user?.role === 'admin') && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                    title="Delete comment"
                  >
                    <FiX />
                  </button>
                )}
              </div>
              <p style={{ color: '#fff', fontSize: '0.875rem', margin: 0, lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
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
