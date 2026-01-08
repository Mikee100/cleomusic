import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import { useResponsive } from '../hooks/useResponsive'
import { API_URL } from '../utils/api.js'
import { 
  FiPlay, FiPause, FiSkipForward, FiSkipBack, FiVolume2, FiVolumeX, 
  FiX, FiMusic, FiShuffle, FiRepeat, FiList, FiChevronRight 
} from 'react-icons/fi'
import UpgradeInterruptionModal from '../components/UpgradeInterruptionModal'

const SongPlayer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isMobile } = useResponsive()
  const { user, subscription } = useAuth()
  const { 
    playSong, isPlaying, setIsPlaying, nextSong, previousSong, 
    currentSong, playlist, currentIndex, isShuffle, setIsShuffle,
    repeatMode, setRepeatMode, playFromQueue, reorderQueue
  } = usePlayer()
  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showInterruptionModal, setShowInterruptionModal] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const audioRef = useRef(null)
  const videoRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const hasInterruptedRef = useRef(false)
  const isFreeUser = !subscription && user?.role !== 'admin'

  useEffect(() => {
    fetchSong()
  }, [id])

  useEffect(() => {
    if (song) {
      if (!currentSong || currentSong.id !== song.id) {
        playSong(song, [song])
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(err => {
              console.error('Auto-play failed:', err)
            })
          }
        }, 100)
      }
    }
  }, [song])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0
        audio.play().catch(console.error)
      } else {
        setIsPlaying(false)
        if (videoRef.current) {
          videoRef.current.pause()
          videoRef.current.currentTime = 0
        }
        nextSong()
      }
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentSong, repeatMode, nextSong])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !isFreeUser || !currentSong || hasInterruptedRef.current) return

    const checkInterruption = () => {
      if (audio.duration > 0 && audio.currentTime >= audio.duration * 0.25) {
        audio.pause()
        if (videoRef.current) videoRef.current.pause()
        setIsPlaying(false)
        setShowInterruptionModal(true)
        hasInterruptedRef.current = true
      }
    }

    audio.addEventListener('timeupdate', checkInterruption)
    return () => {
      audio.removeEventListener('timeupdate', checkInterruption)
    }
  }, [currentSong, isFreeUser, duration])

  useEffect(() => {
    const video = videoRef.current
    const audio = audioRef.current
    if (!video || !audio || !currentSong || currentSong.id !== song?.id) return

    if (isPlaying) {
      video.play().catch(console.error)
    } else {
      video.pause()
    }
  }, [isPlaying, currentSong, song])

  const fetchSong = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/songs/${id}`)
      setSong(response.data.song)
    } catch (err) {
      console.error('Error fetching song:', err)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handlePlayToggle = () => {
    if (isFreeUser && hasInterruptedRef.current) return

    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      if (videoRef.current) videoRef.current.pause()
    } else {
      audio.play().catch(console.error)
      if (videoRef.current) videoRef.current.play().catch(console.error)
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeChange = (e) => {
    const newTime = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.5
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const toggleRepeat = () => {
    if (repeatMode === 'off') {
      setRepeatMode('all')
    } else if (repeatMode === 'all') {
      setRepeatMode('one')
    } else {
      setRepeatMode('off')
    }
  }

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleInterruptionClose = () => {
    setShowInterruptionModal(false)
    if (isFreeUser) {
      hasInterruptedRef.current = false
      navigate('/')
    }
  }

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        position: 'fixed',
        top: 0,
        left: 0
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(102, 126, 234, 0.3)',
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#999' }}>Loading song...</p>
        </div>
      </div>
    )
  }

  if (!song) {
    return null
  }

  const audioSrc = song.file_path ? `${API_URL}${song.file_path}` : null
  const videoSrc = song.background_video_path ? `${API_URL}${song.background_video_path}` : null

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: '#0a0a0a',
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'hidden',
      display: 'flex'
    }}>
      {/* Background Video - Full Screen */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        overflow: 'hidden'
      }}>
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            loop
            muted
            playsInline
            autoPlay
            onLoadedData={() => {
              if (videoRef.current && isPlaying) {
                videoRef.current.play().catch(console.error)
              }
            }}
            onError={(e) => {
              console.error('Video load error:', e)
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: song.cover_image_path 
              ? `url(${API_URL}${song.cover_image_path})` 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px)',
            transform: 'scale(1.1)',
            position: 'absolute',
            top: 0,
            left: 0
          }} />
        )}
        {/* Dark Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1
        }} />
      </div>

      {/* Main Content - No Scroll */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        flex: 1,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: isMobile ? '1rem' : '1.5rem',
        overflow: 'hidden'
      }}>
        {/* Header - Compact */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isMobile ? '0.75rem' : '1rem',
          flexShrink: 0
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1.1rem',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)'
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
            <FiX />
          </button>

          {playlist.length > 1 && (
            <button
              onClick={() => setShowQueue(!showQueue)}
              style={{
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                padding: '0.4rem 0.8rem',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s',
                backdropFilter: 'blur(10px)',
                fontWeight: showQueue ? '600' : '400'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.7)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.5)'
              }}
            >
              <FiList /> {playlist.length}
            </button>
          )}
        </div>

        {/* Main Content Area - Flex to fill space */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '1rem' : '2rem',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Cover Art - Smaller on mobile */}
          <div style={{
            flexShrink: 0,
            width: isMobile ? '200px' : '300px',
            height: isMobile ? '200px' : '300px',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            {song.cover_image_path ? (
              <img
                src={`${API_URL}${song.cover_image_path}`}
                alt={song.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                color: 'rgba(255,255,255,0.3)'
              }}>
                <FiMusic />
              </div>
            )}
            {videoSrc && (
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: 'rgba(0,0,0,0.7)',
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.7rem',
                color: '#fff',
                backdropFilter: 'blur(10px)'
              }}>
                🎬 Video
              </div>
            )}
          </div>

          {/* Song Details - Compact */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: isMobile ? 'center' : 'left',
            minWidth: 0,
            overflow: 'hidden'
          }}>
            <h1 style={{
              fontSize: isMobile ? '1.5rem' : '2.5rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              color: '#fff',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
              lineHeight: '1.2',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {song.title}
            </h1>

            <p style={{
              fontSize: isMobile ? '1rem' : '1.5rem',
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '0.5rem',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {song.artist}
            </p>

            {song.album && (
              <p style={{
                fontSize: isMobile ? '0.875rem' : '1.1rem',
                color: 'rgba(255,255,255,0.7)',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {song.album}
              </p>
            )}
          </div>
        </div>

        {/* Player Controls - Compact */}
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '20px',
          padding: isMobile ? '1rem' : '1.5rem',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0
        }}>
          {/* Progress Bar */}
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleTimeChange}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: 'rgba(255,255,255,0.2)',
                outline: 'none',
                cursor: 'pointer',
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.8)'
            }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '0.5rem' : '1rem',
            marginBottom: '0.75rem'
          }}>
            {/* Shuffle */}
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              style={{
                background: 'transparent',
                border: 'none',
                color: isShuffle ? '#667eea' : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '0.4rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                if (!isShuffle) {
                  e.currentTarget.style.color = '#fff'
                }
              }}
              onMouseLeave={(e) => {
                if (!isShuffle) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                }
              }}
              title="Shuffle"
            >
              <FiShuffle style={{ 
                filter: isShuffle ? 'drop-shadow(0 0 6px rgba(102, 126, 234, 0.8))' : 'none'
              }} />
            </button>

            {/* Previous */}
            <button
              onClick={previousSong}
              disabled={!playlist || playlist.length <= 1}
              style={{
                background: 'transparent',
                border: 'none',
                color: (!playlist || playlist.length <= 1) ? 'rgba(255,255,255,0.3)' : '#fff',
                cursor: (!playlist || playlist.length <= 1) ? 'not-allowed' : 'pointer',
                fontSize: '1.3rem',
                padding: '0.4rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (playlist && playlist.length > 1) {
                  e.currentTarget.style.transform = 'scale(1.2)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <FiSkipBack />
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlayToggle}
              disabled={isFreeUser && hasInterruptedRef.current}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '50%',
                width: isMobile ? '56px' : '64px',
                height: isMobile ? '56px' : '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: (isFreeUser && hasInterruptedRef.current) ? 'not-allowed' : 'pointer',
                fontSize: '1.5rem',
                boxShadow: '0 8px 30px rgba(102, 126, 234, 0.5)',
                transition: 'all 0.3s',
                opacity: (isFreeUser && hasInterruptedRef.current) ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!(isFreeUser && hasInterruptedRef.current)) {
                  e.currentTarget.style.transform = 'scale(1.1)'
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.7)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.5)'
              }}
            >
              {isPlaying ? <FiPause /> : <FiPlay style={{ marginLeft: '3px' }} />}
            </button>

            {/* Next */}
            <button
              onClick={nextSong}
              disabled={!playlist || playlist.length <= 1}
              style={{
                background: 'transparent',
                border: 'none',
                color: (!playlist || playlist.length <= 1) ? 'rgba(255,255,255,0.3)' : '#fff',
                cursor: (!playlist || playlist.length <= 1) ? 'not-allowed' : 'pointer',
                fontSize: '1.3rem',
                padding: '0.4rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (playlist && playlist.length > 1) {
                  e.currentTarget.style.transform = 'scale(1.2)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <FiSkipForward />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              style={{
                background: 'transparent',
                border: 'none',
                color: repeatMode !== 'off' ? '#667eea' : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '0.4rem',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (repeatMode === 'off') {
                  e.currentTarget.style.color = '#fff'
                }
              }}
              onMouseLeave={(e) => {
                if (repeatMode === 'off') {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                }
              }}
              title={repeatMode === 'off' ? 'Repeat Off' : repeatMode === 'all' ? 'Repeat All' : 'Repeat One'}
            >
              <FiRepeat style={{ 
                filter: repeatMode !== 'off' ? 'drop-shadow(0 0 6px rgba(102, 126, 234, 0.8))' : 'none',
                transform: repeatMode === 'one' ? 'scale(1.15)' : 'scale(1)'
              }} />
              {repeatMode === 'one' && (
                <span style={{
                  position: 'absolute',
                  bottom: '-6px',
                  right: '50%',
                  transform: 'translateX(50%)',
                  fontSize: '0.5rem',
                  color: '#667eea',
                  fontWeight: 'bold'
                }}>1</span>
              )}
            </button>
          </div>

          {/* Volume Control */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <button
              onClick={toggleMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '0.4rem',
                transition: 'all 0.2s'
              }}
            >
              {isMuted ? <FiVolumeX /> : <FiVolume2 />}
            </button>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              width: showVolumeSlider || isMobile ? '100px' : '0',
              overflow: 'hidden',
              transition: 'width 0.3s'
            }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{
                  width: '100%',
                  height: '4px',
                  borderRadius: '2px',
                  background: 'rgba(255,255,255,0.2)',
                  outline: 'none',
                  cursor: 'pointer',
                  WebkitAppearance: 'none',
                  appearance: 'none'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Queue Panel */}
      {showQueue && playlist.length > 1 && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: isMobile ? '100%' : '350px',
          height: '100vh',
          background: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(20px)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <h2 style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#fff',
              margin: 0
            }}>
              Queue ({playlist.length})
            </h2>
            <button
              onClick={() => setShowQueue(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '0.4rem'
              }}
            >
              <FiX />
            </button>
          </div>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.75rem'
          }}>
            {playlist.map((item, index) => (
              <div
                key={item.id}
                onClick={() => playFromQueue(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: currentIndex === index ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                  border: currentIndex === index ? '1px solid rgba(102, 126, 234, 0.5)' : '1px solid transparent',
                  marginBottom: '0.4rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (currentIndex !== index) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentIndex !== index) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <div style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: item.cover_image_path 
                    ? `url(${API_URL}${item.cover_image_path})` 
                    : '#2a2a2a',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  color: '#666',
                  flexShrink: 0
                }}>
                  {!item.cover_image_path && <FiMusic />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: currentIndex === index ? '600' : '400',
                    fontSize: '0.8rem',
                    color: '#fff',
                    marginBottom: '0.2rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255,255,255,0.6)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.artist}
                  </div>
                </div>
                {currentIndex === index && isPlaying && (
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#667eea',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    flexShrink: 0
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio Element */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          autoPlay
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration)
              if (isPlaying && audioRef.current.paused) {
                audioRef.current.play().catch(console.error)
              }
            }
          }}
          onError={(e) => {
            console.error('Audio load error:', e)
          }}
        />
      )}

      {/* Interruption Modal */}
      {showInterruptionModal && (
        <UpgradeInterruptionModal
          onClose={handleInterruptionClose}
          contentType="song"
        />
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.8);
          }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #667eea;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(102, 126, 234, 0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #667eea;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(102, 126, 234, 0.5);
        }
      `}</style>
    </div>
  )
}

export default SongPlayer
