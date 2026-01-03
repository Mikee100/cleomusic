import { useState, useRef, useEffect } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { useResponsive } from '../hooks/useResponsive'
import { FiPlay, FiPause, FiSkipForward, FiSkipBack, FiMinimize2, FiMaximize2, FiMusic, FiX } from 'react-icons/fi'

const MusicPlayer = () => {
  const { currentSong, isPlaying, setIsPlaying, nextSong, previousSong, isMinimized, setIsMinimized, clearPlayer } = usePlayer()
  const { user, subscription } = useAuth()
  const { isMobile } = useResponsive()
  const audioRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const previousSongIdRef = useRef(null)
  const playTrackedRef = useRef(new Set())

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

  // Only update audio src when song actually changes
  useEffect(() => {
    if (audioRef.current && currentSong && previousSongIdRef.current !== currentSong.id) {
      const wasPlaying = isPlaying
      
      // Update src programmatically to avoid reload
      audioRef.current.src = `${API_URL}${currentSong.file_path}`
      audioRef.current.load()
      
      // Restore play state if it was playing
      if (wasPlaying) {
        audioRef.current.play().catch(console.error)
        // Track play when song actually starts
        if (subscription || user?.role === 'admin') {
          trackPlay(currentSong.id)
        }
      }
      
      previousSongIdRef.current = currentSong.id
    }
  }, [currentSong?.id, isPlaying, subscription, user])

  // Handle play/pause for the same song
  useEffect(() => {
    if (audioRef.current && currentSong && previousSongIdRef.current === currentSong.id) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error)
        // Track play when user clicks play
        if (subscription || user?.role === 'admin') {
          trackPlay(currentSong.id)
        }
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentSong?.id, subscription, user])

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      nextSong()
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
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
      preload="metadata"
      style={{ display: 'none' }}
    />
  )

  // Minimized player view
  if (isMinimized) {
    return (
      <>
        {audioElement}
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
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
              }}
            >
              {isPlaying ? <FiPause /> : <FiPlay />}
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
              style={{
                background: '#667eea',
                border: 'none',
                borderRadius: '50%',
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '1rem' : '1.25rem'
              }}
            >
              {isPlaying ? <FiPause /> : <FiPlay />}
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
