import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import SubscriptionModal from '../components/SubscriptionModal'
import AddToPlaylistModal from '../components/AddToPlaylistModal'
import Interactions from '../components/Interactions'
import { useResponsive } from '../hooks/useResponsive'
import { FiPlay, FiMusic, FiHeart, FiList } from 'react-icons/fi'

const Popular = () => {
  const { user, subscription } = useAuth()
  const { playSong } = usePlayer()
  const { isMobile } = useResponsive()
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [favorites, setFavorites] = useState(new Set())
  const [addToPlaylistSongId, setAddToPlaylistSongId] = useState(null)

  useEffect(() => {
    // Allow free users to access popular songs (they'll get interrupted after 20 seconds when playing)
    fetchSongs()
  }, [subscription, user])

  const fetchSongs = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/songs/popular', { params: { limit: 100 } })
      setSongs(response.data.songs)
      
      // Check favorites for all songs
      const favoriteChecks = await Promise.all(
        response.data.songs.map(song => 
          axios.get(`/api/songs/${song.id}/favorite`).then(r => ({ id: song.id, favorited: r.data.favorited })).catch(() => ({ id: song.id, favorited: false }))
        )
      )
      const newFavorites = new Set(favoriteChecks.filter(f => f.favorited).map(f => f.id))
      setFavorites(newFavorites)
      
      setError('')
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requiresSubscription) {
        setShowSubscriptionModal(true)
        setError('')
      } else {
        setError('Failed to load songs')
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
    // Allow free users to play songs (they'll get interrupted after 20 seconds)
    playSong(song, songs)
  }

  return (
    <div>
      <div style={{ marginBottom: isMobile ? '1rem' : '2rem' }}>
        <h1 style={{ marginBottom: '1rem', fontSize: isMobile ? '1.5rem' : '2rem' }}>Popular Songs</h1>
        <p style={{ color: '#999', marginBottom: '1rem', fontSize: isMobile ? '0.875rem' : '1rem' }}>Most played songs</p>
      </div>

      {error && <div style={{ color: '#ff6b6b', marginBottom: '1rem', fontSize: isMobile ? '0.875rem' : '1rem' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: isMobile ? '1rem' : '2rem' }}>Loading songs...</div>
      ) : songs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: isMobile ? '1rem' : '2rem', color: '#999' }}>No songs found</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile 
            ? 'repeat(2, 1fr)' 
            : 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: isMobile ? '0.75rem' : '1.5rem'
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
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                display: 'flex',
                gap: '0.5rem',
                zIndex: 10
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setAddToPlaylistSongId(song.id)
                  }}
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#667eea',
                    fontSize: '1rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.8)'
                    e.currentTarget.style.transform = 'scale(1.1)'
                    e.currentTarget.style.color = '#fff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.6)'
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.color = '#667eea'
                  }}
                  title="Add to playlist"
                >
                  <FiList />
                </button>
                <button
                  onClick={(e) => toggleFavorite(song.id, e)}
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: favorites.has(song.id) ? '#ef4444' : '#fff',
                    fontSize: '1rem',
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
                  title="Add to favorites"
                >
                  <FiHeart style={{ fill: favorites.has(song.id) ? '#ef4444' : 'none' }} />
                </button>
              </div>
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
                <div style={{
                  position: 'absolute',
                  bottom: '0.5rem',
                  right: '0.5rem',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <FiPlay style={{ fontSize: '0.75rem' }} />
                  {song.play_count || 0}
                </div>
              </div>
              <h3 style={{ marginBottom: '0.25rem', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</h3>
              <p style={{ color: '#999', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.25rem' }}>{song.artist}</p>
              {song.play_count > 0 && (
                <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  {song.play_count.toLocaleString()} {song.play_count === 1 ? 'play' : 'plays'}
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

      {addToPlaylistSongId && (
        <AddToPlaylistModal
          songId={addToPlaylistSongId}
          onClose={() => setAddToPlaylistSongId(null)}
        />
      )}
    </div>
  )
}

export default Popular

