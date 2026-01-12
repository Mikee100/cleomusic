import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FiVideo, FiPlay, FiPause, FiVolume2, FiVolumeX, FiX, FiChevronUp, FiChevronDown, FiArrowLeft } from 'react-icons/fi'
import { useResponsive } from '../hooks/useResponsive'
import { useAuth } from '../context/AuthContext'
import UpgradeInterruptionModal from '../components/UpgradeInterruptionModal'
import { videoPreloader } from '../utils/videoPreloader'

const ClientVideos = () => {
  const { isMobile } = useResponsive()
  const { user, subscription } = useAuth()
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef(null)
  const videoRefs = useRef({})
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)
  const isScrolling = useRef(false)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/videos', {
        params: { limit: 100, kind: 'video' }
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
          // Try to use preloaded video if available
          const preloaded = videoPreloader.getPreloadedVideo(video.id)
          if (preloaded && preloaded.readyState >= 2) {
            // Copy buffered data from preloaded video
            videoElement.src = preloaded.src
            videoElement.currentTime = 0
          }
          
          videoElement.play().catch(() => {
            // Autoplay was prevented, user interaction required
          })
        } else {
          videoElement.pause()
        }
      }
    })
    
    // Aggressive prefetching - prefetch next 3 videos
    if (videos.length > 0) {
      videoPreloader.prefetchVideos(videos, currentIndex)
    }
  }, [currentIndex, videos])

  // Prefetch all videos on mount
  useEffect(() => {
    if (videos.length > 0) {
      // Prefetch first few videos immediately
      videos.slice(0, 3).forEach(video => {
        if (video?.file_path) {
          const url = `${import.meta.env.VITE_API_URL || ''}${video.file_path}`
          videoPreloader.prefetchVideo(url)
          videoPreloader.preloadVideoElement(video.id, url)
        }
      })
    }
    
    return () => {
      // Cleanup on unmount
      videoPreloader.cleanup()
    }
  }, [videos])

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
        scrollToVideo(currentIndex + 1)
      } else {
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
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        className="video-reel-container"
        onWheel={(e) => {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault()
          }
        }}
      >
        {videos.map((video, index) => (
          <VideoItem
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

      {/* Navigation indicators */}
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
    </div>
  )
}

const VideoItem = ({ video, index, isActive, videoRef, onNext, onPrevious, canGoNext, canGoPrevious }) => {
  const { isMobile } = useResponsive()
  const { user, subscription } = useAuth()
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [showInterruptionModal, setShowInterruptionModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const videoElementRef = useRef(null)
  const hasInterruptedRef = useRef(false)
  const isFreeUser = !subscription && user?.role !== 'admin'

  useEffect(() => {
    if (videoRef) {
      videoRef(videoElementRef.current)
    }
    
    const videoElement = videoElementRef.current
    if (videoElement) {
      // Set smaller buffer to start playing faster
      // This makes the browser start playback with less data
      if (videoElement.readyState === 0) {
        videoElement.load()
      }
      
      // Reduce buffering threshold for faster start
      // The browser will start playing with less buffered data
      if ('webkitPreservesPitch' in videoElement) {
        // WebKit browsers
        videoElement.setAttribute('preload', 'auto')
      }
    }
  }, [videoRef])

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

    setIsMuted(videoElement.muted)

    return () => {
      videoElement.removeEventListener('play', handlePlay)
      videoElement.removeEventListener('pause', handlePause)
      videoElement.removeEventListener('volumechange', handleVolumeChange)
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [isFreeUser])

  useEffect(() => {
    const videoElement = videoElementRef.current
    if (!videoElement) return

    if (isActive) {
      hasInterruptedRef.current = false
      setShowInterruptionModal(false)
      setIsLoading(true)
      
      // Check if we have a preloaded video with buffered data
      const preloaded = videoPreloader.getPreloadedVideo(video.id)
      if (preloaded && preloaded.readyState >= 2 && preloaded.buffered.length > 0) {
        // Use preloaded video's source and buffered data
        videoElement.src = preloaded.src
        videoElement.currentTime = 0
        // The video should start playing almost instantly
      } else if (videoElement.readyState === 0) {
        videoElement.load()
      }
      
      // Aggressive play attempt - try as soon as we have ANY data
      const tryPlay = () => {
        const videoEl = videoElement
        setIsLoading(false)
        // Try with just metadata (readyState >= 1)
        if (videoEl.readyState >= 1) {
          videoEl.play()
            .then(() => setIsPlaying(true))
            .catch(() => {
              // If play fails, wait for more data
              if (videoEl.readyState >= 2) {
                videoEl.play()
                  .then(() => setIsPlaying(true))
                  .catch(() => setIsPlaying(false))
              }
            })
        }
      }
      
      const handleCanPlay = () => {
        setIsLoading(false)
        tryPlay()
      }
      
      const handleWaiting = () => {
        setIsLoading(true)
      }
      
      const handlePlaying = () => {
        setIsLoading(false)
      }
      
      // Try immediately if already loaded
      if (videoElement.readyState >= 1) {
        tryPlay()
      }
      
      // Also try on various events for fastest start
      videoElement.addEventListener('loadedmetadata', tryPlay, { once: true })
      videoElement.addEventListener('loadeddata', tryPlay, { once: true })
      videoElement.addEventListener('canplay', handleCanPlay, { once: true })
      videoElement.addEventListener('waiting', handleWaiting)
      videoElement.addEventListener('playing', handlePlaying)
      videoElement.addEventListener('progress', () => {
        if (videoElement.readyState >= 2 && videoElement.paused && !isLoading) {
          tryPlay()
        }
      })
      
      return () => {
        videoElement.removeEventListener('loadedmetadata', tryPlay)
        videoElement.removeEventListener('loadeddata', tryPlay)
        videoElement.removeEventListener('canplay', handleCanPlay)
        videoElement.removeEventListener('waiting', handleWaiting)
        videoElement.removeEventListener('playing', handlePlaying)
      }
    } else {
      videoElement.pause()
      setIsPlaying(false)
      setIsLoading(false)
      setShowInterruptionModal(false)
    }
  }, [isActive, video.id])

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
      {/* Loading indicator */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(255,255,255,0.3)',
            borderTop: '3px solid #fff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ color: '#fff', fontSize: '0.875rem' }}>Loading...</span>
        </div>
      )}

                <video
        ref={videoElementRef}
                  src={`${import.meta.env.VITE_API_URL || ''}${video.file_path}`}
        loop
        muted={isMuted}
        playsInline
        preload={isActive ? "auto" : "none"}
        onLoadedMetadata={() => {
          setIsLoading(false)
          if (isActive && videoElementRef.current) {
            const videoEl = videoElementRef.current
            if (videoEl.readyState >= 1) {
              videoEl.play().catch(() => {})
            }
          }
        }}
        onLoadedData={() => {
          setIsLoading(false)
          if (isActive && videoElementRef.current && videoElementRef.current.paused) {
            videoElementRef.current.play().catch(() => {})
          }
        }}
        onCanPlay={() => {
          setIsLoading(false)
          if (isActive && videoElementRef.current && videoElementRef.current.paused) {
            videoElementRef.current.play().catch(() => {})
          }
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onProgress={() => {
          if (isActive && videoElementRef.current && videoElementRef.current.paused) {
            const videoEl = videoElementRef.current
            if (videoEl.readyState >= 2 && videoEl.buffered.length > 0) {
              setIsLoading(false)
              videoEl.play().catch(() => {})
            }
          }
        }}
        onClick={handleVideoClick}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
          cursor: 'pointer',
          opacity: isLoading ? 0.7 : 1,
          transition: 'opacity 0.3s'
                  }}
                />

      {/* Video Controls */}
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
        >
          {isPlaying ? <FiPause /> : <FiPlay />}
        </button>
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
        >
          {isMuted ? <FiVolumeX /> : <FiVolume2 />}
        </button>
                  </div>

      {/* Video Info Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        right: '20px',
        zIndex: 10,
        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
        padding: '1.5rem',
        color: '#fff'
      }}>
        <h2 style={{ margin: 0, marginBottom: '0.5rem', fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
                  {video.title}
        </h2>
                {video.description && (
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: isMobile ? '0.875rem' : '1rem' }}>
                    {video.description}
                  </p>
                )}
              </div>

      {showInterruptionModal && (
        <UpgradeInterruptionModal
          onClose={() => setShowInterruptionModal(false)}
          onUpgrade={() => {
            setShowInterruptionModal(false)
            if (videoElementRef.current) {
              videoElementRef.current.play().then(() => {
                setIsPlaying(true)
              }).catch(() => {})
            }
          }}
          contentType="video"
        />
      )}
    </div>
  )
}

export default ClientVideos


