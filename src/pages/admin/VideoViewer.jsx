import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize2, 
  FiMinimize2, FiArrowLeft, FiChevronLeft, FiChevronRight,
  FiSkipBack, FiSkipForward
} from 'react-icons/fi'
import { useResponsive } from '../../hooks/useResponsive'

const VideoViewer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isMobile } = useResponsive()
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef(null)

  useEffect(() => {
    fetchVideo()
  }, [id])

  const fetchVideo = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/admin/videos/${id}`)
      setVideo(response.data.video || response.data)
    } catch (err) {
      console.error('Error fetching video:', err)
      alert('Video not found')
      navigate('/admin/videos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement || !video) return

    // Start loading video immediately when video data is available
    if (videoElement.readyState === 0) {
      videoElement.load()
    }

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleVolumeChange = () => setIsMuted(videoElement.muted)

    videoElement.addEventListener('timeupdate', handleTimeUpdate)
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoElement.addEventListener('play', handlePlay)
    videoElement.addEventListener('pause', handlePause)
    videoElement.addEventListener('volumechange', handleVolumeChange)

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('play', handlePlay)
      videoElement.removeEventListener('pause', handlePause)
      videoElement.removeEventListener('volumechange', handleVolumeChange)
    }
  }, [video])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    if (videoRef.current) {
      videoRef.current.currentTime = percent * duration
    }
  }

  const handleSkip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds))
    }
  }

  const handlePlaybackRateChange = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlaybackRate(rate)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0a0a0a',
        color: '#fff'
      }}>
        <div>Loading video...</div>
      </div>
    )
  }

  if (!video) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0a0a0a',
        color: '#fff',
        gap: '1rem'
      }}>
        <div>Video not found</div>
        <button
          onClick={() => navigate('/admin/videos')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#667eea',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Back to Videos
        </button>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100vh',
        background: '#000',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)',
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        opacity: showControls ? 1 : 0,
        transition: 'opacity 0.3s'
      }}>
        <button
          onClick={() => navigate('/admin/videos')}
          style={{
            padding: '0.5rem 0.75rem',
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1rem',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.6)'
          }}
        >
          <FiArrowLeft /> Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            margin: 0,
            marginBottom: '0.15rem',
            color: '#fff',
            fontSize: isMobile ? '1rem' : '1.1rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {video.title}
          </h2>
          {video.description && (
            <p style={{
              margin: 0,
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {video.description}
            </p>
          )}
        </div>
      </div>

      {/* Video Container - Centered */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '0.5rem' : '1rem',
        paddingTop: isMobile ? '48px' : '56px',
        paddingBottom: isMobile ? '0.5rem' : '0.75rem',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1400px',
          position: 'relative',
          background: '#000',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
          <video
            ref={videoRef}
            src={`${import.meta.env.VITE_API_URL || ''}${video.file_path}`}
            preload="auto"
            playsInline
            onLoadedData={() => {
              // Video metadata loaded, ready to play
              if (videoRef.current && videoRef.current.readyState >= 2) {
                // Video has enough data to start playing
              }
            }}
            onCanPlay={() => {
              // Video can start playing - try autoplay if user hasn't interacted yet
              if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play().catch(() => {
                  // Autoplay prevented, will need user interaction
                })
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              outline: 'none',
              objectFit: 'contain'
            }}
            onClick={handlePlayPause}
          />

          {/* Custom Controls Overlay */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
            padding: '1.5rem',
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.3s',
            pointerEvents: showControls ? 'auto' : 'none'
          }}>
            {/* Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '3px',
                marginBottom: '1rem',
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={handleSeek}
            >
              <div style={{
                width: `${(currentTime / duration) * 100}%`,
                height: '100%',
                background: '#667eea',
                borderRadius: '3px',
                transition: 'width 0.1s'
              }} />
            </div>

            {/* Controls Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {isPlaying ? <FiPause /> : <FiPlay />}
              </button>

              {/* Skip Backward */}
              <button
                onClick={() => handleSkip(-10)}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)'
                }}
                title="Skip back 10s"
              >
                <FiSkipBack />
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => handleSkip(10)}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)'
                }}
                title="Skip forward 10s"
              >
                <FiSkipForward />
              </button>

              {/* Mute/Unmute */}
              <button
                onClick={handleMuteToggle}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)'
                }}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <FiVolumeX /> : <FiVolume2 />}
              </button>

              {/* Time Display */}
              <div style={{
                color: '#fff',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                marginLeft: 'auto'
              }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {/* Playback Rate */}
              <div style={{
                display: 'flex',
                gap: '0.25rem',
                alignItems: 'center'
              }}>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                  <button
                    key={rate}
                    onClick={() => handlePlaybackRateChange(rate)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: playbackRate === rate ? '#667eea' : 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: playbackRate === rate ? 'bold' : 'normal',
                      transition: 'all 0.2s'
                    }}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)'
                }}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
              </button>
            </div>
          </div>

          {/* Center Play Button (when paused) */}
          {!isPlaying && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 50
              }}
              onClick={handlePlayPause}
            >
              <button
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.7)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102,126,234,0.8)'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.7)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <FiPlay style={{ marginLeft: '4px' }} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* (Optional) Additional info could be overlaid in the header if needed, but we avoid extra height to prevent scrolling */}
    </div>
  )
}

export default VideoViewer

