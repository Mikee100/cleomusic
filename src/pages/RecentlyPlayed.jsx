import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import SubscriptionModal from '../components/SubscriptionModal'
import Interactions from '../components/Interactions'
import { FiPlay, FiMusic, FiHeart, FiClock } from 'react-icons/fi'
import { usePrefetch } from '../hooks/usePrefetch'

const RecentlyPlayed = () => {
  const { user, subscription } = useAuth()
  const { playSong } = usePlayer()
  const navigate = useNavigate()
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [favorites, setFavorites] = useState(new Set())
  const { prefetchMedia } = usePrefetch()

  useEffect(() => {
    // Allow free users to access recently played songs (they'll get interrupted after 20 seconds when playing)
    fetchSongs()
  }, [subscription, user])

  const fetchSongs = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/songs/recent/played', { params: { limit: 100 } })
      const songsData = response.data.songs || []
      setSongs(songsData)

      // Check favorites using the data already returned by the server
      if (songsData.length > 0) {
        const newFavorites = new Set(
          songsData
            .filter(song => song.is_favorited)
            .map(song => song.id)
        )
        setFavorites(newFavorites)
      }

      setError('')
    } catch (err) {
      console.error('Error fetching recently played:', err)
      if (err.response?.status === 403 && err.response?.data?.requiresSubscription) {
        setShowSubscriptionModal(true)
        setError('')
      } else {
        setError('Failed to load recently played songs')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (songId, e) => {
    e.stopPropagation()
    try {
      const response = await axios.post(`/api/songs/${songId}/favorite`)
      const newFavorites = new Set(favorites)
      if (response.data.favorited) {
        newFavorites.add(songId)
      } else {
        newFavorites.delete(songId)
      }
      setFavorites(newFavorites)
    } catch (err) {
      console.error('Error toggling favorite:', err)
    }
  }

  const handlePlaySong = (song) => {
    // Navigate to full-screen song player with video background
    navigate(`/song/${song.id}`)
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '1rem', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiClock /> Recently Played
        </h1>
        <p style={{ color: '#999', marginBottom: '1rem' }}>Songs you've listened to recently</p>
      </div>

      {error && <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading songs...</div>
      ) : songs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
          <FiMusic style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
          <p>No recently played songs yet. Start playing some music!</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          {songs.map(song => (
            <div
              key={song.id}
              style={{
                background: '#1a1a1a',
                borderRadius: '12px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                border: '1px solid #333',
                position: 'relative'
              }}
              onClick={() => handlePlaySong(song)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)'

                // Prefetch media files on hover
                if (song.file_path) prefetchMedia(song.file_path, 'audio')
                if (song.background_video_path) prefetchMedia(song.background_video_path, 'video')
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <button
                onClick={(e) => toggleFavorite(song.id, e)}
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  background: 'rgba(0,0,0,0.6)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: favorites.has(song.id) ? '#ef4444' : '#fff',
                  fontSize: '1.25rem',
                  zIndex: 10,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.8)'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.6)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <FiHeart style={{ fill: favorites.has(song.id) ? '#ef4444' : 'none' }} />
              </button>
              <div style={{
                width: '100%',
                aspectRatio: '1',
                background: song.cover_image_path ? `url(${import.meta.env.VITE_API_URL || ''}${song.cover_image_path})` : '#2a2a2a',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '8px',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                color: '#666',
                position: 'relative'
              }}>
                {!song.cover_image_path && <FiMusic />}
              </div>
              <h3 style={{ marginBottom: '0.25rem', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</h3>
              <p style={{ color: '#999', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.25rem' }}>{song.artist}</p>
              {song.played_at && (
                <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  Played {new Date(song.played_at).toLocaleDateString()}
                </p>
              )}
              <Interactions contentType="song" contentId={song.id} compact={true} />
            </div>
          ))}
        </div>
      )}

      {showSubscriptionModal && (
        <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />
      )}
    </div>
  )
}

export default RecentlyPlayed

