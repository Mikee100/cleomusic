import { useState, useRef, useEffect } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { useResponsive } from '../hooks/useResponsive'
import { API_URL } from '../utils/api.js'
import { FiPlay, FiPause, FiSkipForward, FiSkipBack, FiMinimize2, FiMaximize2, FiMusic, FiX, FiLoader, FiShuffle, FiRepeat, FiList, FiDownload } from 'react-icons/fi'
import { useDownloads } from '../context/DownloadsContext'
import UpgradeInterruptionModal from './UpgradeInterruptionModal'
import { usePrefetch } from '../hooks/usePrefetch'

const MusicPlayer = () => {
  const {
    currentSong,
    isPlaying,
    setIsPlaying,
    nextSong,
    previousSong,
    isMinimized,
    setIsMinimized,
    clearPlayer,
    isShuffle,
    setIsShuffle,
    repeatMode,
    setRepeatMode,
    playlist,
    currentIndex,
    reorderQueue,
    playFromQueue
  } = usePlayer()
  const { addDownload, downloads } = useDownloads()
  const { user, subscription } = useAuth()
  const { isMobile } = useResponsive()
  const { prefetchNextSongs, prefetchMedia, getPrefetchedAudio } = usePrefetch()
  const audioRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [playError, setPlayError] = useState(null)
  const [showInterruptionModal, setShowInterruptionModal] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const previousSongIdRef = useRef(null)
  const playTrackedRef = useRef(new Set())
  const playPromiseRef = useRef(null)
  const retryCountRef = useRef(0)
  const hasInterruptedRef = useRef(false)
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

  // Attempt to play audio with retry logic - more aggressive loading
  const attemptPlay = async (audio, retries = 3) => {
    try {
      // Try to play immediately if we have any data (readyState >= 2 = HAVE_CURRENT_DATA)
      // This allows faster start even with minimal buffering
      if (audio.readyState < 2) {
        // Wait for loadeddata event (less data needed than canplay)
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            // If still not loaded, try playing anyway
            resolve()
          }, 3000) // Reduced timeout to 3 seconds

          const loadedDataHandler = () => {
            clearTimeout(timeout)
            audio.removeEventListener('loadeddata', loadedDataHandler)
            audio.removeEventListener('error', errorHandler)
            resolve()
          }

          const errorHandler = (e) => {
            clearTimeout(timeout)
            audio.removeEventListener('loadeddata', loadedDataHandler)
            audio.removeEventListener('error', errorHandler)
            reject(e)
          }

          if (audio.readyState >= 2) {
            clearTimeout(timeout)
            resolve()
          } else {
            audio.addEventListener('loadeddata', loadedDataHandler, { once: true })
            audio.addEventListener('error', errorHandler, { once: true })
          }
        })
      }

      // Attempt to play - browser will buffer as it plays
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
        await new Promise(resolve => setTimeout(resolve, 300)) // Reduced retry delay
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

  // Prefetch current song immediately when it's set
  useEffect(() => {
    if (currentSong?.file_path) {
      prefetchMedia(currentSong.file_path, 'audio')
      if (currentSong.background_video_path) {
        prefetchMedia(currentSong.background_video_path, 'video')
      }
    }
  }, [currentSong?.id, currentSong?.file_path, currentSong?.background_video_path, prefetchMedia])

  // Only update audio src when song actually changes
  useEffect(() => {
    if (audioRef.current && currentSong && previousSongIdRef.current !== currentSong.id) {
      const audio = audioRef.current
      const wasPlaying = isPlaying
      
      // Reset state
      setIsLoading(true)
      setPlayError(null)
      retryCountRef.current = 0
      
      // Load current song's audio immediately
      if (currentSong.file_path) {
        const audioUrl = `${API_URL}${currentSong.file_path}`
        
        // Check if we have a prefetched audio element we can reuse
        const prefetchedAudio = getPrefetchedAudio(currentSong.file_path)
        if (prefetchedAudio && prefetchedAudio.readyState >= 2) {
          // Use prefetched audio if available and has data
          audio.src = audioUrl
          audio.load()
        } else {
          // Set preload to auto for faster loading
          audio.preload = 'auto'
          audio.src = audioUrl
          // Start loading immediately
          audio.load()
        }
      }
      
      // Set up one-time listeners for this song change
      // Use loadeddata instead of canplay for faster start
      const handleLoadedData = async () => {
        setDuration(audio.duration || 0)
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

      // Also try to play immediately if we have metadata (even faster)
      const handleLoadedMetadata = () => {
        setDuration(audio.duration || 0)
        // If we have metadata and readyState >= 2, try playing immediately
        if (wasPlaying && audio.readyState >= 2) {
          attemptPlay(audio).catch(() => {
            // If immediate play fails, wait for loadeddata
          })
        }
      }

      const handleError = (e) => {
        console.error('Audio loading error:', e)
        setPlayError('Failed to load audio file')
        setIsLoading(false)
        setIsPlaying(false)
      }

      // Try to play as soon as we have any data
      audio.addEventListener('loadeddata', handleLoadedData, { once: true })
      audio.addEventListener('error', handleError, { once: true })
      audio.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
      
      previousSongIdRef.current = currentSong.id

      return () => {
        audio.removeEventListener('loadeddata', handleLoadedData)
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

  // Set up persistent audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      const time = audio.currentTime
      setCurrentTime(time)

      // For free users, interrupt at 25% of the track duration
      if (
        isFreeUser &&
        !hasInterruptedRef.current &&
        duration > 0 &&
        time >= duration * 0.25
      ) {
        if (audioRef.current) {
          audioRef.current.pause()
        }
        setIsPlaying(false)
        setShowInterruptionModal(true)
        hasInterruptedRef.current = true
      }
    }
    const updateDuration = () => {
      if (audio.duration) {
        setDuration(audio.duration)
      }
    }
    const handleEnded = () => {
      if (repeatMode === 'one') {
        // Restart the same song
        audio.currentTime = 0
        setIsPlaying(true)
        attemptPlay(audio).catch(error => {
          console.error('Repeat one play failed:', error)
        })
      } else {
        nextSong()
      }
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
  }, [nextSong, isFreeUser, duration, repeatMode])

  // Reset interruption state when song changes or user gains subscription
  useEffect(() => {
    hasInterruptedRef.current = false
    setShowInterruptionModal(false)
  }, [currentSong?.id, isFreeUser])

  // Prefetch next songs when current song changes or playlist updates
  useEffect(() => {
    if (playlist && playlist.length > 0 && currentIndex >= 0) {
      // Prefetch next 2 songs and previous song
      prefetchNextSongs(playlist, currentIndex, 2)
    }
  }, [playlist, currentIndex, prefetchNextSongs])

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
    // Always move to the next song when the interruption popup is dismissed
    hasInterruptedRef.current = false
    nextSong()
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

  const handlePlayToggle = () => {
    // Free users cannot resume a song once the preview limit has been reached
    if (isFreeUser && hasInterruptedRef.current) {
      return
    }
    setIsPlaying(!isPlaying)
  }

  const isDownloaded = downloads?.some(
    (d) => d.type === 'song' && d.id === currentSong.id
  )

  const handleDownload = () => {
    if (!currentSong) return
    addDownload({
      type: 'song',
      id: currentSong.id,
      title: currentSong.title,
      artist: currentSong.artist,
      cover_image_path: currentSong.cover_image_path,
      file_path: currentSong.file_path
    })
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
                handlePlayToggle()
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
      {showQueue && (
        <QueuePanel
          playlist={playlist}
          currentIndex={currentIndex}
          onReorder={reorderQueue}
          onPlayIndex={playFromQueue}
          isMobile={isMobile}
        />
      )}
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
              onClick={() => setShowQueue(!showQueue)}
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
                transition: 'background 0.2s',
                opacity: showQueue ? 1 : 0.9
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2a2a2a'}
              title="Show queue"
            >
              <FiList /> Queue
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloaded}
              style={{
                background: '#2a2a2a',
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '0.25rem 0.5rem',
                color: isDownloaded ? '#22c55e' : '#fff',
                cursor: isDownloaded ? 'default' : 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'background 0.2s',
                opacity: isDownloaded ? 0.8 : 0.95
              }}
              title={isDownloaded ? 'Already in downloads' : 'Save for offline in-app listening'}
            >
              <FiDownload /> {(!isMobile || isDownloaded) && (isDownloaded ? 'Saved' : 'Download')}
            </button>
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
            gap: isMobile ? '0.25rem' : '0.75rem', 
            flex: isMobile ? 'none' : 1,
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}>
            {/* Shuffle */}
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              style={{
                background: 'transparent',
                border: 'none',
                color: isShuffle ? '#10b981' : '#fff',
                cursor: 'pointer',
                padding: isMobile ? '0.25rem' : '0.5rem',
                fontSize: isMobile ? '0.9rem' : '1rem',
                opacity: isShuffle ? 1 : 0.7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={isShuffle ? 'Shuffle on' : 'Shuffle off'}
            >
              <FiShuffle />
            </button>

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
              onClick={handlePlayToggle}
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

            {/* Repeat all */}
            <button
              onClick={() => {
                // Toggle repeat all; make sure repeat one is off
                if (repeatMode === 'all') {
                  setRepeatMode('off')
                } else {
                  setRepeatMode('all')
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: repeatMode === 'all' ? '#fbbf24' : '#fff',
                cursor: 'pointer',
                padding: isMobile ? '0.25rem' : '0.5rem',
                fontSize: isMobile ? '0.9rem' : '1rem',
                opacity: repeatMode === 'all' ? 1 : 0.7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: isMobile ? '24px' : '28px'
              }}
              title="Repeat all"
            >
              <FiRepeat />
            </button>

            {/* Repeat one */}
            <button
              onClick={() => {
                // Toggle repeat one; make sure repeat all is off
                if (repeatMode === 'one') {
                  setRepeatMode('off')
                } else {
                  setRepeatMode('one')
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: repeatMode === 'one' ? '#fbbf24' : '#fff',
                cursor: 'pointer',
                padding: isMobile ? '0.25rem' : '0.5rem',
                fontSize: isMobile ? '0.9rem' : '1rem',
                opacity: repeatMode === 'one' ? 1 : 0.7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                minWidth: isMobile ? '24px' : '28px'
              }}
              title="Repeat one"
            >
              <FiRepeat />
              <span style={{
                position: 'absolute',
                right: isMobile ? '2px' : '3px',
                bottom: isMobile ? '2px' : '3px',
                fontSize: '0.6rem',
                fontWeight: 'bold'
              }}>
                1
              </span>
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

const QueuePanel = ({ playlist, currentIndex, onReorder, onPlayIndex, isMobile }) => {
  const [dragIndex, setDragIndex] = useState(null)

  if (!playlist || playlist.length === 0) return null

  const handleDragStart = (index) => {
    setDragIndex(index)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (index) => {
    if (dragIndex == null) return
    onReorder(dragIndex, index)
    setDragIndex(null)
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: isMobile ? '0.5rem' : '1.5rem',
        bottom: isMobile ? '4.5rem' : '5.5rem',
        width: isMobile ? '85%' : '320px',
        maxHeight: isMobile ? '40vh' : '50vh',
        background: '#111827',
        borderRadius: '12px',
        border: '1px solid #374151',
        boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        zIndex: 1100
      }}
    >
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid #374151',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>Up Next</span>
        <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>{playlist.length} tracks</span>
      </div>
      <div
        style={{
          maxHeight: isMobile ? '32vh' : '42vh',
          overflowY: 'auto'
        }}
      >
        {playlist.map((song, index) => {
          const isCurrent = index === currentIndex
          return (
            <div
              key={song.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              onClick={() => onPlayIndex(index)}
              style={{
                padding: '0.5rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'grab',
                background: isCurrent ? '#1F2937' : 'transparent',
                borderBottom: '1px solid #111827'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  background: song.cover_image_path
                    ? `url(${API_URL}${song.cover_image_path})`
                    : '#111827',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#6B7280',
                  fontSize: '0.9rem'
                }}
              >
                {!song.cover_image_path && <FiMusic />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: isCurrent ? 600 : 500,
                    color: '#F9FAFB',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {song.title}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#9CA3AF',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {song.artist}
                </div>
              </div>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  border: '1px solid #4B5563',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6rem',
                  color: '#6B7280'
                }}
              >
                ::
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
