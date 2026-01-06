import { useState, useRef, useEffect } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { useResponsive } from '../hooks/useResponsive'
import { API_URL } from '../utils/api.js'
import { FiPlay, FiPause, FiSkipForward, FiSkipBack, FiMinimize2, FiMaximize2, FiMusic, FiX, FiLoader } from 'react-icons/fi'
import UpgradeInterruptionModal from './UpgradeInterruptionModal'

const MusicPlayer = () => {
  const { currentSong, isPlaying, setIsPlaying, nextSong, previousSong, isMinimized, setIsMinimized, clearPlayer } = usePlayer()
  const { user, subscription } = useAuth()
  const { isMobile } = useResponsive()
  const audioRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [playError, setPlayError] = useState(null)
  const [showInterruptionModal, setShowInterruptionModal] = useState(false)
  const previousSongIdRef = useRef(null)
  const playTrackedRef = useRef(new Set())
  const playPromiseRef = useRef(null)
  const retryCountRef = useRef(0)
  const interruptionTimerRef = useRef(null)
  const isFreeUser = !subscription && user?.role !== 'admin'

  // Track play when song starts playing
  const trackPlay = async (songId) => {
    if (!songId || playTrackedRef.current.has(songId)) return
    
    try {
      await axios.post(`/api/songs/${songId}/play`)
      playTrackedRef.current.add(songId)
    } catch (error) {
      console.error('Failed to track play:', error)
    }
  }

  // Attempt to play audio with retry logic
  const attemptPlay = async (audio, retries = 3) => {
    try {
      // Wait for audio to have enough data buffered
      if (audio.readyState < 3) { // HAVE_FUTURE_DATA
        // Wait for canplay event
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout waiting for audio to load'))
          }, 10000) // 10 second timeout

          const canPlayHandler = () => {
            clearTimeout(timeout)
            audio.removeEventListener('canplay', canPlayHandler)
            audio.removeEventListener('error', errorHandler)
            resolve()
          }

          const errorHandler = (e) => {
            clearTimeout(timeout)
            audio.removeEventListener('canplay', canPlayHandler)
            audio.removeEventListener('error', errorHandler)
            reject(e)
          }

          if (audio.readyState >= 3) {
            clearTimeout(timeout)
            resolve()
          } else {
            audio.addEventListener('canplay', canPlayHandler, { once: true })
            audio.addEventListener('error', errorHandler, { once: true })
          }
        })
      }

      // Attempt to play
      const playPromise = audio.play()
      playPromiseRef.current = playPromise
      
      await playPromise
      setPlayError(null)
      retryCountRef.current = 0
      
      // Track play when song actually starts
      if (subscription || user?.role === 'admin') {
        trackPlay(currentSong.id)
      }
    } catch (error) {
      console.error('Play error:', error)
      
      // Retry if we haven't exceeded retry limit
      if (retries > 0 && retryCountRef.current < 3) {
        retryCountRef.current++
        await new Promise(resolve => setTimeout(resolve, 500)) // Wait 500ms before retry
        return attemptPlay(audio, retries - 1)
      }
      
      setPlayError('Failed to play audio. Please try again.')
      setIsPlaying(false)
      throw error
    } finally {
      playPromiseRef.current = null
      setIsLoading(false)
    }
  }

  // Only update audio src when song actually changes
  useEffect(() => {
    if (audioRef.current && currentSong && previousSongIdRef.current !== currentSong.id) {
      const audio = audioRef.current
      const wasPlaying = isPlaying
      
      // Reset state
      setIsLoading(true)
      setPlayError(null)
      retryCountRef.current = 0
      
      // Update src programmatically to avoid reload
      audio.src = `${API_URL}${currentSong.file_path}`
      audio.load()
      
      // Set up one-time listeners for this song change
      const handleCanPlay = async () => {
        if (wasPlaying) {
          setIsLoading(true)
          try {
            await attemptPlay(audio)
          } catch (error) {
            console.error('Failed to start playback:', error)
          }
        } else {
          setIsLoading(false)
        }
      }

      const handleError = (e) => {
        console.error('Audio loading error:', e)
        setPlayError('Failed to load audio file')
        setIsLoading(false)
        setIsPlaying(false)
      }

      const handleLoadedMetadata = () => {
        setDuration(audio.duration)
      }

      audio.addEventListener('canplay', handleCanPlay, { once: true })
      audio.addEventListener('error', handleError, { once: true })
      audio.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
      
      previousSongIdRef.current = currentSong.id

      return () => {
        audio.removeEventListener('canplay', handleCanPlay)
        audio.removeEventListener('error', handleError)
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }
  }, [currentSong?.id, isPlaying, subscription, user])

  // Handle play/pause for the same song
  useEffect(() => {
    if (audioRef.current && currentSong && previousSongIdRef.current === currentSong.id) {
      const audio = audioRef.current
      
      if (isPlaying) {
        setIsLoading(true)
        attemptPlay(audio).catch(error => {
          console.error('Play failed:', error)
        })
      } else {
        // Cancel any pending play promise
        if (playPromiseRef.current) {
          playPromiseRef.current.catch(() => {}) // Ignore cancellation errors
        }
        audio.pause()
        setIsLoading(false)
      }
    }
  }, [isPlaying, currentSong?.id, subscription, user])

  // Handle interruption for free users
  useEffect(() => {
    if (!isFreeUser || !isPlaying || !currentSong) {
      // Clear timer if user has subscription or not playing
      if (interruptionTimerRef.current) {
        clearTimeout(interruptionTimerRef.current)
        interruptionTimerRef.current = null
      }
      return
    }

    // Start interruption timer when playback starts
    if (isPlaying && audioRef.current) {
      interruptionTimerRef.current = setTimeout(() => {
        // Pause the audio
        if (audioRef.current) {
          audioRef.current.pause()
          setIsPlaying(false)
        }
        // Show interruption modal
        setShowInterruptionModal(true)
      }, 20000) // 20 seconds
    }

    return () => {
      if (interruptionTimerRef.current) {
        clearTimeout(interruptionTimerRef.current)
        interruptionTimerRef.current = null
      }
    }
  }, [isPlaying, currentSong, isFreeUser])

  // Reset interruption timer when song changes
  useEffect(() => {
    if (interruptionTimerRef.current) {
      clearTimeout(interruptionTimerRef.current)
      interruptionTimerRef.current = null
    }
    setShowInterruptionModal(false)
  }, [currentSong?.id])

  // Set up persistent audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => {
      if (audio.duration) {
        setDuration(audio.duration)
      }
    }
    const handleEnded = () => {
      nextSong()
    }
    const handleWaiting = () => {
      setIsLoading(true)
    }
    const handlePlaying = () => {
      setIsLoading(false)
      setPlayError(null)
    }
    const handleStalled = () => {
      setIsLoading(true)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('durationchange', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('stalled', handleStalled)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('durationchange', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('stalled', handleStalled)
    }
  }, [nextSong])

  if (!currentSong) return null

  const formatTime = (seconds) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    if (audioRef.current) {
      audioRef.current.currentTime = percent * duration
    }
  }

  // Single audio element that persists (rendered outside conditional views)
  const audioElement = (
    <audio
      ref={audioRef}
      crossOrigin="anonymous"
      preload="auto"
      style={{ display: 'none' }}
    />
  )

  const handleInterruptionClose = () => {
    setShowInterruptionModal(false)
    // User can continue with free version, but audio stays paused
  }

  const handleInterruptionUpgrade = () => {
    setShowInterruptionModal(false)
    // After upgrade, user can continue playing
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        console.error('Failed to resume playback')
      })
    }
  }

  // Minimized player view
  if (isMinimized) {
    return (
      <>
        {audioElement}
        {showInterruptionModal && (
          <UpgradeInterruptionModal
            onClose={handleInterruptionClose}
            onUpgrade={handleInterruptionUpgrade}
            contentType="music"
          />
        )}
        <div
          onClick={() => setIsMinimized(false)}
          style={{
            position: 'fixed',
            bottom: isMobile ? '10px' : '20px',
            right: isMobile ? '10px' : '20px',
            left: isMobile ? '10px' : 'auto',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            cursor: 'pointer',
            zIndex: 1000,
            minWidth: isMobile ? 'auto' : '280px',
            maxWidth: isMobile ? '100%' : 'none',
            transition: 'all 0.3s ease',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: currentSong.cover_image_path
                ? `url(${API_URL}${currentSong.cover_image_path})`
                : 'rgba(255,255,255,0.2)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1.25rem',
              flexShrink: 0
            }}>
              {!currentSong.cover_image_path && <FiPlay />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 'bold',
                fontSize: '0.875rem',
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: '0.25rem'
              }}>
                {currentSong.title}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.8)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {currentSong.artist}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsPlaying(!isPlaying)
              }}
              disabled={isLoading}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                color: '#fff',
                cursor: isLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                transition: 'background 0.2s',
                opacity: isLoading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
              }}
              title={isLoading ? 'Loading...' : (isPlaying ? 'Pause' : 'Play')}
            >
              {isLoading ? (
                <div style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid #fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
              ) : (
                isPlaying ? <FiPause /> : <FiPlay />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsMinimized(false)
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '0.25rem',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Expand player"
            >
              <FiMaximize2 />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (audioRef.current) {
                  audioRef.current.pause()
                }
                clearPlayer()
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                color: '#fff',
                cursor: 'pointer',
                padding: '0.25rem',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              }}
              title="Close player"
            >
              <FiX />
            </button>
          </div>
        </div>
      </>
    )
  }

  // Full player view
  return (
    <>
      {audioElement}
      {showInterruptionModal && (
        <UpgradeInterruptionModal
          onClose={handleInterruptionClose}
          onUpgrade={handleInterruptionUpgrade}
          contentType="music"
        />
      )}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#1a1a1a',
        borderTop: '1px solid #333',
        padding: isMobile ? '0.75rem' : '1rem',
        zIndex: 1000,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center', 
          gap: isMobile ? '0.75rem' : '1rem', 
          maxWidth: '1200px', 
          margin: '0 auto', 
          position: 'relative' 
        }}>
          <div style={{
            position: isMobile ? 'relative' : 'absolute',
            top: isMobile ? '0' : '-0.5rem',
            right: isMobile ? 'auto' : '0',
            left: isMobile ? 'auto' : 'auto',
            display: 'flex',
            gap: '0.5rem',
            zIndex: 10,
            alignSelf: isMobile ? 'flex-end' : 'auto',
            marginBottom: isMobile ? '0.5rem' : '0'
          }}>
            <button
              onClick={() => setIsMinimized(true)}
              style={{
                background: '#2a2a2a',
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '0.25rem 0.5rem',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2a2a2a'}
              title="Minimize player"
            >
              <FiMinimize2 /> Minimize
            </button>
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause()
                }
                clearPlayer()
              }}
              style={{
                background: '#2a2a2a',
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '0.25rem 0.5rem',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ef4444'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2a2a2a'
                e.currentTarget.style.color = '#ef4444'
              }}
              title="Close player"
            >
              <FiX />
            </button>
          </div>
          <div style={{
            minWidth: isMobile ? '50px' : '60px',
            height: isMobile ? '50px' : '60px',
            background: currentSong.cover_image_path
              ? `url(${API_URL}${currentSong.cover_image_path})`
              : '#2a2a2a',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            flexShrink: 0
          }}>
            {!currentSong.cover_image_path && <FiMusic />}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: isMobile ? 'none' : 'block' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentSong.title}
            </div>
            <div style={{ color: '#999', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentSong.artist}
            </div>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? '0.25rem' : '0.5rem', 
            flex: isMobile ? 'none' : 1,
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}>
            <button
              onClick={previousSong}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: isMobile ? '0.25rem' : '0.5rem',
                fontSize: isMobile ? '1rem' : '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FiSkipBack />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={isLoading}
              style={{
                background: '#667eea',
                border: 'none',
                borderRadius: '50%',
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                color: '#fff',
                cursor: isLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '1rem' : '1.25rem',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid #fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
              ) : (
                isPlaying ? <FiPause /> : <FiPlay />
              )}
            </button>
            <button
              onClick={nextSong}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: isMobile ? '0.25rem' : '0.5rem',
                fontSize: isMobile ? '1rem' : '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FiSkipForward />
            </button>
          </div>
          <div style={{ 
            minWidth: isMobile ? 'auto' : '100px', 
            textAlign: isMobile ? 'center' : 'right', 
            fontSize: isMobile ? '0.75rem' : '0.875rem', 
            color: '#999',
            marginTop: isMobile ? '0.5rem' : '0',
            width: isMobile ? '100%' : 'auto'
          }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          {isMobile && (
            <div style={{ 
              width: '100%', 
              marginTop: '0.5rem',
              textAlign: 'center',
              fontSize: '0.875rem',
              color: '#fff',
              fontWeight: '500',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {currentSong.title} - {currentSong.artist}
            </div>
          )}
          {playError && (
            <div style={{
              position: 'absolute',
              top: '-2.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ef4444',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              zIndex: 1001,
              animation: 'fadeIn 0.3s ease-in'
            }}>
              {playError}
            </div>
          )}
        </div>
        <div
          onClick={handleSeek}
          style={{
            marginTop: '0.5rem',
            height: '4px',
            background: '#333',
            borderRadius: '2px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${duration ? (currentTime / duration) * 100 : 0}%`,
              background: '#667eea',
              borderRadius: '2px'
            }}
          />
        </div>
      </div>
    </>
  )
}

export default MusicPlayer
