import { useState, useRef, useEffect } from 'react'

import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import { useResponsive } from '../hooks/useResponsive'
import { API_URL } from '../utils/api.js'
import {
  FiPlay, FiPause, FiSkipForward, FiSkipBack, FiVolume2, FiVolumeX,
  FiX, FiMusic, FiShuffle, FiRepeat, FiList, FiChevronRight,
  FiMinimize2, FiMaximize2, FiMoreVertical
} from 'react-icons/fi'
import UpgradeInterruptionModal from '../components/UpgradeInterruptionModal'
import { usePrefetch } from '../hooks/usePrefetch'
import Interactions from '../components/Interactions'

// Component to force audio src update when audioSrc changes
const AudioSrcUpdater = ({ audioRef, audioSrc, isPlaying, setIsPlaying, setDuration }) => {
  const previousSrcRef = useRef(null)

  useEffect(() => {
    if (audioRef.current && audioSrc && previousSrcRef.current !== audioSrc) {
      const audio = audioRef.current
      const currentSrc = audio.src || ''
      const normalizedAudioSrc = audioSrc.trim()
      const normalizedCurrentSrc = currentSrc.trim()
      
      console.log('AudioSrcUpdater - Current src:', normalizedCurrentSrc, 'New src:', normalizedAudioSrc)
      
      if (normalizedCurrentSrc !== normalizedAudioSrc) {
        console.log('Audio src changed! Updating...')
        previousSrcRef.current = audioSrc
        
        // Pause current audio
        audio.pause()
        audio.currentTime = 0
        
        // Update source
        audio.src = normalizedAudioSrc
        audio.load()
        
        // Play after loading if needed
        const handleCanPlay = () => {
          setDuration(audio.duration)
          if (isPlaying) {
            audio.play().catch(err => {
              console.error('Auto-play failed:', err)
            })
          }
          audio.removeEventListener('canplay', handleCanPlay)
        }
        
        audio.addEventListener('canplay', handleCanPlay)
        
        return () => {
          audio.removeEventListener('canplay', handleCanPlay)
        }
      }
    }
  }, [audioSrc, audioRef, isPlaying, setIsPlaying, setDuration])

  return null
}

const SongPlayer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isMobile } = useResponsive()
  const { user, subscription } = useAuth()
  const { prefetchNextSongs, prefetchMedia, getPrefetchedVideo } = usePrefetch()
  const {
    playSong, isPlaying, setIsPlaying, nextSong, previousSong,
    currentSong, playlist, currentIndex, isShuffle, setIsShuffle,
    repeatMode, setRepeatMode, playFromQueue, reorderQueue, clearPlayer
  } = usePlayer()
  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showInterruptionModal, setShowInterruptionModal] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const audioRef = useRef(null)
  const videoRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const hasInterruptedRef = useRef(false)
  const [videoOpacity, setVideoOpacity] = useState(0)
  const previousSongIdRef = useRef(null)
  const isFreeUser = !subscription && user?.role !== 'admin'

  // Premium CSS Keyframes
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      .glass-morphism {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
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
      @keyframes slideInUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .playing-bars {
        display: flex;
        gap: 2px;
        align-items: flex-end;
        height: 14px;
      }
      .playing-bars div {
        width: 3px;
        background: #667eea;
        border-radius: 1px;
        animation: activeWave 0.8s ease-in-out infinite;
      }
      .playing-bars div:nth-child(2) { animation-delay: 0.2s; height: 100%; }
      .playing-bars div:nth-child(1) { animation-delay: 0s; height: 60%; }
      .playing-bars div:nth-child(3) { animation-delay: 0.4s; height: 80%; }
      @keyframes activeWave {
        0%, 100% { height: 40%; }
        50% { height: 100%; }
      }
`
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          handlePlayToggle()
          break
        case 'ArrowRight':
          if (audioRef.current) audioRef.current.currentTime += 5
          break
        case 'ArrowLeft':
          if (audioRef.current) audioRef.current.currentTime -= 5
          break
        case 'KeyM':
          toggleMute()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, isMuted, volume])

  useEffect(() => {
    fetchSong()
  }, [id])

  // Sync local song state with currentSong from context (when queue item is clicked)
  useEffect(() => {
    if (currentSong && currentSong.id !== song?.id) {
      setSong(currentSong)
    }
  }, [currentSong])

  // Play audio when currentSong changes (from queue click)
  useEffect(() => {
    console.log('useEffect triggered - currentSong:', currentSong?.id, 'previous:', previousSongIdRef.current)
    
    if (currentSong && currentSong.id !== previousSongIdRef.current) {
      console.log('Song changed! Updating audio source. New song:', currentSong.id, currentSong.title, currentSong.file_path)
      previousSongIdRef.current = currentSong.id
      
      // If file_path is missing, fetch full song details
      if (!currentSong.file_path && currentSong.id) {
        console.log('File path missing, fetching full song details...')
        axios.get(`/api/songs/${currentSong.id}`)
          .then(response => {
            const fullSong = response.data.song
            console.log('Fetched full song:', fullSong.file_path)
            // Update the song in the playlist and currentSong
            setSong(fullSong)
            // Update currentSong in context by calling playSong again with updated song
            playSong(fullSong, playlist)
          })
          .catch(err => {
            console.error('Error fetching song details:', err)
          })
        return
      }
      
      // Update local song state to trigger re-render
      setSong(currentSong)
      
      // The AudioSrcUpdater component will handle updating the audio source
      // when audioSrc changes, so we just need to ensure the song state is updated
      // The audioSrc will be recalculated from activeSong which uses currentSong
    }
  }, [currentSong, isPlaying, API_URL, playlist, playSong])

  useEffect(() => {
    if (song) {
      if (!currentSong || currentSong.id !== song.id) {
        // playSong is called in fetchSong now with the full playlist
        setTimeout(() => {
          if (audioRef.current && isPlaying) {
            audioRef.current.play().catch(err => {
              console.error('Auto-play failed:', err)
            })
          }
        }, 100)
      }
    }
  }, [song, currentSong, isPlaying])

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

  // Prefetch current song's video immediately when it loads
  useEffect(() => {
    if (song?.background_video_path) {
      prefetchMedia(song.background_video_path, 'video')

      // Try to get prefetched video immediately
      const prefetchedVideo = getPrefetchedVideo(song.background_video_path)
      if (prefetchedVideo && videoRef.current) {
        // We can't easily swap refs on an existing element, but we can 
        // copy the source or state if needed. More importantly, 
        // the browser cache will have it.
      }
    }
  }, [song?.background_video_path, prefetchMedia, getPrefetchedVideo])

  // Prefetch next songs (audio and video) when playlist or current index changes
  useEffect(() => {
    if (playlist && playlist.length > 0 && currentIndex >= 0) {
      // Prefetch next 2 songs and previous song (including videos)
      prefetchNextSongs(playlist, currentIndex, 2)
    }
  }, [playlist, currentIndex, prefetchNextSongs])

  const fetchSong = async () => {
    try {
      setLoading(true)
      const cleanId = id ? id.split(',')[0] : id
      const [songResponse, songsResponse] = await Promise.all([
        axios.get(`/api/songs/${cleanId}`),
        axios.get('/api/songs', { params: { limit: 50 } })
      ])
      const songData = songResponse.data.song
      setSong(songData)

      // Build playlist with current song first, then other songs
      const allSongs = songsResponse.data.songs || []
      const currentSongIndex = allSongs.findIndex(s => s.id === songData.id)
      let playlistSongs = []
      
      if (currentSongIndex >= 0) {
        // Start from current song and include songs after it
        playlistSongs = [
          songData,
          ...allSongs.slice(currentSongIndex + 1),
          ...allSongs.slice(0, currentSongIndex)
        ]
      } else {
        // If current song not in list, put it first and add all others
        playlistSongs = [songData, ...allSongs]
      }

      // Always update playlist with the new song list
      playSong(songData, playlistSongs)

      // Immediately prefetch audio and video when song data is fetched
      if (songData?.file_path) {
        prefetchMedia(songData.file_path, 'audio')
      }
      if (songData?.background_video_path) {
        prefetchMedia(songData.background_video_path, 'video')
      }
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
    return `${mins}:${secs.toString().padStart(2, '0')} `
  }

  const handleInterruptionClose = () => {
    setShowInterruptionModal(false)
    if (isFreeUser) {
      hasInterruptedRef.current = false
      navigate('/')
    }
  }

  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    setHoveredIndex(index)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const newPlaylist = [...playlist]
    const draggedItem = newPlaylist[draggedIndex]
    newPlaylist.splice(draggedIndex, 1)
    newPlaylist.splice(dropIndex, 0, draggedItem)

    const newCurrentIndex = newPlaylist.findIndex(s => s.id === currentSong?.id)
    reorderQueue(newPlaylist, newCurrentIndex >= 0 ? newCurrentIndex : 0)

    setDraggedIndex(null)
    setHoveredIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setHoveredIndex(null)
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

  // Use currentSong from context if available, otherwise use local song state
  const activeSong = currentSong || song

  // Calculate audio source - handle both absolute and relative paths
  const getAudioSrc = (song) => {
    if (!song?.file_path) return null
    const path = song.file_path
    if (path.startsWith('http')) return path
    if (path.startsWith('/api/')) return `${API_URL.replace(/\/$/, '')}${path}`
    return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`
  }
  
  const audioSrc = getAudioSrc(activeSong)
  const videoSrc = activeSong?.background_video_path ? `${API_URL}${activeSong.background_video_path} ` : null

  if (!activeSong) {
    return null
  }

  return (
    <div style={{
      height: isMinimized ? '120px' : '100vh',
      width: '100vw',
      background: '#0a0a0a',
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'hidden',
      display: 'flex',
      transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 9999
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
          <>
            {/* High-quality blurred placeholder while video loads */}
            <div style={{
              width: '100%',
              height: '100%',
              background: activeSong.cover_image_path
                ? `url(${API_URL}${activeSong.cover_image_path})`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(20px)',
              transform: 'scale(1.1)',
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 1 - videoOpacity,
              transition: 'opacity 1s ease-in-out',
              zIndex: 0
            }} />
            <video
              ref={videoRef}
              src={videoSrc}
              loop
              muted
              playsInline
              autoPlay
              preload="auto"
              crossOrigin="anonymous"
              onCanPlay={() => {
                setVideoOpacity(1)
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
                left: 0,
                opacity: videoOpacity,
                transition: 'opacity 1s ease-in-out',
                zIndex: 1
              }}
            />
          </>
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: activeSong.cover_image_path
              ? `url(${API_URL}${activeSong.cover_image_path})`
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

      {/* Main Content - Scrollable */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        flex: 1,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: isMobile ? '0.5rem' : '0.75rem',
        overflow: 'hidden'
      }}>
        {/* Header - Absolute Position to save space */}
        <div style={{
          position: 'absolute',
          top: isMobile ? '0.75rem' : '1.5rem',
          left: isMobile ? '0.75rem' : '1.5rem',
          right: isMobile ? '0.75rem' : '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
          opacity: isMinimized ? 0 : 1,
          transition: 'opacity 0.3s',
          pointerEvents: isMinimized ? 'none' : 'auto'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => {
                // Stop audio and video
                if (audioRef.current) {
                  audioRef.current.pause()
                  audioRef.current.currentTime = 0
                }
                if (videoRef.current) {
                  videoRef.current.pause()
                  videoRef.current.currentTime = 0
                }
                // Clear player state
                clearPlayer()
                // Navigate away
                navigate('/')
              }}
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

            <button
              onClick={() => setIsMinimized(!isMinimized)}
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
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? <FiMaximize2 /> : <FiMinimize2 />}
            </button>
          </div>

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
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.5)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <FiList /> {playlist.length}
            </button>
          )}
        </div>

        {/* Minimized View */}
        {isMinimized ? (
          <div
            className="glass-morphism"
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {/* Top Row - Cover, Info, Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '0.75rem'
            }}>
              {/* Cover Art - Small */}
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                flexShrink: 0,
                animation: isPlaying ? 'pulseGlow 2s ease-in-out infinite' : 'none',
                position: 'relative'
              }}>
                {song.cover_image_path ? (
                  <img
                    src={`${API_URL}${song.cover_image_path} `}
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
                    fontSize: '1.5rem',
                    color: 'rgba(255,255,255,0.3)'
                  }}>
                    <FiMusic />
                  </div>
                )}
                {isPlaying && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#667eea',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    boxShadow: '0 0 8px rgba(102, 126, 234, 0.8)'
                  }} />
                )}
              </div>

              {/* Song Info - Compact */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '0.2rem',
                  color: '#fff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {song.title}
                </h3>
                <p style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.7)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {song.artist}
                </p>
              </div>

              {/* Mini Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <button
                  onClick={previousSong}
                  disabled={!playlist || playlist.length <= 1}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: (!playlist || playlist.length <= 1) ? 'rgba(255,255,255,0.3)' : '#fff',
                    cursor: (!playlist || playlist.length <= 1) ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    padding: '0.3rem',
                    transition: 'all 0.2s',
                    borderRadius: '6px'
                  }}
                  onMouseEnter={(e) => {
                    if (playlist && playlist.length > 1) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <FiSkipBack />
                </button>

                <button
                  onClick={handlePlayToggle}
                  disabled={isFreeUser && hasInterruptedRef.current}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: (isFreeUser && hasInterruptedRef.current) ? 'not-allowed' : 'pointer',
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.2s',
                    opacity: (isFreeUser && hasInterruptedRef.current) ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!(isFreeUser && hasInterruptedRef.current)) {
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  {isPlaying ? <FiPause /> : <FiPlay style={{ marginLeft: '2px' }} />}
                </button>

                <button
                  onClick={nextSong}
                  disabled={!playlist || playlist.length <= 1}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: (!playlist || playlist.length <= 1) ? 'rgba(255,255,255,0.3)' : '#fff',
                    cursor: (!playlist || playlist.length <= 1) ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    padding: '0.3rem',
                    transition: 'all 0.2s',
                    borderRadius: '6px'
                  }}
                  onMouseEnter={(e) => {
                    if (playlist && playlist.length > 1) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <FiSkipForward />
                </button>

                {playlist.length > 1 && (
                  <button
                    onClick={() => setShowQueue(!showQueue)}
                    style={{
                      background: showQueue ? 'rgba(102, 126, 234, 0.2)' : 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      padding: '0.3rem 0.5rem',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = showQueue ? 'rgba(102, 126, 234, 0.2)' : 'rgba(0,0,0,0.3)'
                    }}
                  >
                    <FiList />
                  </button>
                )}

                <button
                  onClick={() => setIsMinimized(false)}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    padding: '0.3rem 0.5rem',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.3)'
                  }}
                >
                  <FiMaximize2 />
                </button>
              </div>
            </div>

            {/* Progress Bar - Mini */}
            <div style={{ width: '100%' }}>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleTimeChange}
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
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '0.3rem',
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.7)'
              }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Main Content Area - Scrollable Container */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              overflowX: 'hidden',
              minHeight: 0,
              paddingBottom: '2rem'
            }}>
              {/* Top Section - Cover Art and Song Info */}
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: isMobile ? 'center' : 'center',
                gap: isMobile ? '1.5rem' : '5rem',
                padding: isMobile ? '0.5rem' : '0.5rem 4rem',
                flexShrink: 0
              }}>
              {/* Cover Art - Simple & Smaller */}
              <div style={{
                flexShrink: 0,
                width: isMobile ? '180px' : '280px',
                height: isMobile ? '180px' : '280px',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                {song.cover_image_path ? (
                  <img
                    src={`${API_URL}${song.cover_image_path} `}
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
              </div>

              {/* Song Details - Premium Typography */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: isMobile ? 'center' : 'left',
                minWidth: 0,
                zIndex: 2
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '0.3rem 0.75rem',
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '100px',
                  fontSize: '0.65rem',
                  fontWeight: '600',
                  color: '#667eea',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '1rem',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  alignSelf: isMobile ? 'center' : 'center'
                }}>
                  Now Playing
                </div>

                <h1 style={{
                  fontSize: isMobile ? '1.5rem' : '2.5rem',
                  fontWeight: '800',
                  marginBottom: '0.2rem',
                  color: '#fff',
                  textShadow: '0 5px 15px rgba(0,0,0,0.5)',
                  lineHeight: '1.2',
                  letterSpacing: '-0.01em',
                  wordBreak: 'break-word',
                  textAlign: 'center'
                }}>
                  {activeSong.title}
                </h1>

                <p style={{
                  fontSize: isMobile ? '1rem' : '1.25rem',
                  fontWeight: '400',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '1.5rem',
                  textShadow: '0 5px 15px rgba(0,0,0,0.3)',
                  letterSpacing: '0.01em',
                  textAlign: 'center'
                }}>
                  {activeSong.artist}
                </p>

                {activeSong.album && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '1rem',
                    justifyContent: isMobile ? 'center' : 'flex-start'
                  }}>
                    <FiMusic />
                    <span>{activeSong.album}</span>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                    <span>2024</span>
                  </div>
                )}
              </div>
              </div>

              {/* Player Controls - Transparent Glassmorphic Bar */}
            {!isMinimized && (
              <div
                className="glass-morphism"
                style={{
                  borderRadius: '24px',
                  padding: isMobile ? '0.75rem 1rem' : '1rem 2.5rem',
                  marginBottom: isMobile ? '0.5rem' : '1rem',
                  flexShrink: 0,
                  width: isMobile ? '100%' : '60%',
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {/* Progress Bar with hover effects */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleTimeChange}
                    className="premium-slider"
                    style={{
                      background: `linear-gradient(to right, #667eea ${(currentTime / duration) * 100}%, rgba(255, 255, 255, 0.1) ${(currentTime / duration) * 100}%)`
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '0.4rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.5)',
                    fontFamily: 'monospace'
                  }}>
                    <span>{formatTime(currentTime)}</span>
                    <span style={{ color: '#667eea' }}>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Main Controls Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  {/* Left: Volume & Extra */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={toggleMute}
                        onMouseEnter={() => setShowVolumeSlider(true)}
                        onMouseLeave={() => setShowVolumeSlider(false)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '1.25rem',
                          padding: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        {isMuted ? <FiVolumeX /> : <FiVolume2 />}
                      </button>
                      <div style={{
                        width: (showVolumeSlider || isMobile) ? '100px' : '0',
                        overflow: 'hidden',
                        transition: 'width 0.3s ease-in-out'
                      }}>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="premium-slider"
                          style={{
                            height: '4px',
                            background: `linear-gradient(to right, #fff ${volume * 100}%, rgba(255, 255, 255, 0.1) ${volume * 100}%)`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Center: Playback Controls */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '1.5rem' : '2.5rem'
                  }}>
                    <button
                      onClick={() => setIsShuffle(!isShuffle)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isShuffle ? '#667eea' : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        transition: 'all 0.3s'
                      }}
                      title="Shuffle"
                    >
                      <FiShuffle style={{ filter: isShuffle ? 'drop-shadow(0 0 8px #667eea)' : 'none' }} />
                    </button>

                    <button
                      onClick={previousSong}
                      disabled={!playlist || playlist.length <= 1}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '2rem',
                        opacity: (!playlist || playlist.length <= 1) ? 0.3 : 1,
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1.2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <FiSkipBack />
                    </button>

                    <button
                      onClick={handlePlayToggle}
                      style={{
                        background: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: isMobile ? '48px' : '56px',
                        height: isMobile ? '48px' : '56px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        boxShadow: '0 5px 20px rgba(255,255,255,0.2)',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.08)'
                        e.currentTarget.style.boxShadow = '0 15px 50px rgba(255,255,255,0.5)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                    >
                      {isPlaying ? <FiPause /> : <FiPlay style={{ marginLeft: '4px' }} />}
                    </button>

                    <button
                      onClick={nextSong}
                      disabled={!playlist || playlist.length <= 1}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '2rem',
                        opacity: (!playlist || playlist.length <= 1) ? 0.3 : 1,
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1.2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <FiSkipForward />
                    </button>

                    <button
                      onClick={toggleRepeat}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: repeatMode !== 'off' ? '#667eea' : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        transition: 'all 0.3s'
                      }}
                      title="Repeat"
                    >
                      <FiRepeat style={{ filter: repeatMode !== 'off' ? 'drop-shadow(0 0 8px #667eea)' : 'none' }} />
                    </button>
                  </div>

                  {/* Right: Queue & Options */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flex: 1, gap: '1rem' }}>
                    <button
                      onClick={() => setShowQueue(!showQueue)}
                      className="glass-morphism"
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '100px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: '600',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <FiList /> Queue
                    </button>
                  </div>
                </div>
              </div>
              )}

              {/* Interactions Section - Comments, Likes, Play Count */}
              {!isMinimized && (
                <div style={{
                  padding: isMobile ? '1.5rem 1rem' : '2rem 4rem',
                  maxWidth: '800px',
                  margin: '0 auto',
                  width: '100%',
                  flexShrink: 0
                }}>
                  {/* Play Count */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.9rem'
                  }}>
                    <FiPlay />
                    <span style={{ fontWeight: '600' }}>
                      {activeSong.play_count || 0} {activeSong.play_count === 1 ? 'play' : 'plays'}
                    </span>
                  </div>

                  {/* Interactions Component */}
                  <Interactions 
                    contentType="song" 
                    contentId={activeSong.id}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Queue Panel - Slimmed Down */}
      {showQueue && (
        <div
          className="glass-morphism"
          style={{
            position: 'fixed',
            top: isMobile ? 'auto' : '1.5rem',
            bottom: isMobile ? 0 : '1.5rem',
            right: isMobile ? 0 : '1.5rem',
            width: isMobile ? '100%' : '320px',
            height: isMobile ? '60vh' : 'calc(100vh - 3rem)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: isMobile ? '24px 24px 0 0' : '24px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '-10px 0 50px rgba(0,0,0,0.5)',
            animation: isMobile ? 'slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden'
          }}
        >
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            background: 'rgba(255,255,255,0.02)'
          }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', margin: 0 }}>Up Next</h2>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: '0.1rem 0 0 0' }}>{playlist.length} tracks</p>
            </div>
            <button
              onClick={() => setShowQueue(false)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <FiX />
            </button>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {playlist.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.9rem'
              }}>
                Queue is empty
              </div>
            ) : (
              <>
                {playlist.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => playFromQueue(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: currentIndex === index
                    ? 'rgba(102, 126, 234, 0.15)'
                    : hoveredIndex === index
                      ? 'rgba(255,255,255,0.08)'
                      : 'transparent',
                  border: currentIndex === index
                    ? '1px solid rgba(102, 126, 234, 0.3)'
                    : '1px solid transparent',
                  transition: 'all 0.2s',
                  position: 'relative',
                  transform: draggedIndex === index ? 'scale(0.98)' : 'scale(1)',
                  opacity: draggedIndex === index ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (currentIndex !== index) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={(e) => {
                  if (currentIndex !== index) e.currentTarget.style.background = 'transparent'
                }}
              >
                {/* Number / Active Icon */}
                <div style={{
                  width: '24px',
                  display: 'flex',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  color: currentIndex === index ? '#667eea' : 'rgba(255,255,255,0.3)',
                  fontWeight: '600'
                }}>
                  {currentIndex === index ? (
                    <div className="playing-bars">
                      <div /><div /><div />
                    </div>
                  ) : index + 1}
                </div>

                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                  {item.cover_image_path ? (
                    <img
                      src={`${API_URL}${item.cover_image_path} `}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(255,255,255,0.5)'
                    }}>
                      <FiMusic />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    color: currentIndex === index ? '#fff' : 'rgba(255,255,255,0.9)',
                    marginBottom: '0.1rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.4)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.artist}
                  </div>
                </div>

                {currentIndex === index && (
                  <div style={{
                    padding: '0.2rem 0.5rem',
                    background: 'rgba(102, 126, 234, 0.08)',
                    borderRadius: '100px',
                    fontSize: '0.55rem',
                    fontWeight: '700',
                    color: '#667eea',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(102, 126, 234, 0.15)'
                  }}>
                    Now
                  </div>
                )}
              </div>
            ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Audio Element */}
      {audioSrc && (
        <audio
          key={`audio-${activeSong?.id || 'default'}`}
          ref={audioRef}
          src={audioSrc}
          autoPlay={isPlaying}
          preload="auto"
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

      {/* Force audio src update when audioSrc changes */}
      {audioSrc && audioRef.current && (
        <AudioSrcUpdater
          audioRef={audioRef}
          audioSrc={audioSrc}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          setDuration={setDuration}
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
    transform: translateX(100 %);
    opacity: 0;
  }
          to {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes pulse {
  0 %, 100 % {
    opacity: 1;
    transform: scale(1);
  }
  50 % {
    opacity: 0.5;
    transform: scale(0.8);
  }
}
@keyframes pulseGlow {
  0 %, 100 % {
    box- shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}
50 % {
  box- shadow: 0 4px 30px rgba(102, 126, 234, 0.6);
          }
        }
@keyframes wave {
  0 %, 100 % {
    transform: scaleY(0.5);
  }
  50 % {
    transform: scaleY(1);
  }
}
input[type = "range"]:: -webkit - slider - thumb {
  -webkit - appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border - radius: 50 %;
  background: #667eea;
  cursor: pointer;
  box - shadow: 0 2px 6px rgba(102, 126, 234, 0.5);
}
input[type = "range"]:: -moz - range - thumb {
  width: 14px;
  height: 14px;
  border - radius: 50 %;
  background: #667eea;
  cursor: pointer;
  border: none;
  box - shadow: 0 2px 6px rgba(102, 126, 234, 0.5);
}
`}</style>
    </div>
  )
}

export default SongPlayer
