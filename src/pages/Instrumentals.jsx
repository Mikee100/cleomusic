import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import SubscriptionModal from '../components/SubscriptionModal'
import Interactions from '../components/Interactions'
import { useResponsive } from '../hooks/useResponsive'
import { FiPlay, FiMusic, FiHeart, FiSearch } from 'react-icons/fi'

const Instrumentals = () => {
  const { user, subscription } = useAuth()
  const { playSong } = usePlayer()
  const { isMobile } = useResponsive()
  const [instrumentals, setInstrumentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [favorites, setFavorites] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [genres, setGenres] = useState([])

  useEffect(() => {
    if (subscription || user?.role === 'admin') {
      fetchInstrumentals()
      fetchGenres()
    } else {
      setLoading(false)
    }
  }, [subscription, user, searchTerm, selectedGenre])

  const fetchGenres = async () => {
    try {
      const response = await axios.get('/api/instrumentals/genres')
      setGenres(response.data.genres || [])
    } catch (err) {
      console.error('Error fetching genres:', err)
    }
  }

  const fetchInstrumentals = async () => {
    try {
      setLoading(true)
      const params = { limit: 100 }
      if (searchTerm) params.search = searchTerm
      if (selectedGenre) params.genre = selectedGenre
      
      const response = await axios.get('/api/instrumentals', { params })
      setInstrumentals(response.data.instrumentals || [])
      
      // Check favorites for all instrumentals
      if (response.data.instrumentals?.length > 0) {
        const favoriteChecks = await Promise.all(
          response.data.instrumentals.map(instrumental => 
            axios.get(`/api/songs/${instrumental.id}/favorite`).then(r => ({ id: instrumental.id, favorited: r.data.favorited })).catch(() => ({ id: instrumental.id, favorited: false }))
          )
        )
        const newFavorites = new Set(favoriteChecks.filter(f => f.favorited).map(f => f.id))
        setFavorites(newFavorites)
      }
      
      setError('')
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requiresSubscription) {
        setShowSubscriptionModal(true)
        setError('')
      } else {
        setError('Failed to load instrumentals')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (instrumentalId, e) => {
    e.stopPropagation()
    try {
      const response = await axios.post(`/api/songs/${instrumentalId}/favorite`)
      const newFavorites = new Set(favorites)
      if (response.data.favorited) {
        newFavorites.add(instrumentalId)
      } else {
        newFavorites.delete(instrumentalId)
      }
      setFavorites(newFavorites)
    } catch (err) {
      console.error('Error toggling favorite:', err)
    }
  }

  const handlePlaySong = (instrumental) => {
    if (!subscription && user?.role !== 'admin') {
      setShowSubscriptionModal(true)
      return
    }
    playSong(instrumental, instrumentals)
  }

  if (!subscription && user?.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? '2rem 1rem' : '4rem 2rem' }}>
        <h1 style={{ marginBottom: '1rem', fontSize: isMobile ? '1.5rem' : '2rem' }}>Instrumentals</h1>
        <p style={{ marginBottom: '2rem', color: '#999', fontSize: isMobile ? '0.875rem' : '1rem' }}>Subscribe to access premium instrumentals</p>
        <button
          onClick={() => setShowSubscriptionModal(true)}
          style={{
            padding: isMobile ? '0.875rem 1.5rem' : '1rem 2rem',
            background: '#667eea',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: isMobile ? '0.875rem' : '1rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          View Subscription Plans
        </button>
        {showSubscriptionModal && (
          <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: isMobile ? '1rem' : '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: isMobile ? '1.5rem' : '2rem', 
          marginBottom: '0.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem' 
        }}>
          <FiMusic /> Instrumentals
        </h1>
        <p style={{ color: '#999' }}>Browse our collection of instrumental tracks</p>
      </div>

      {/* Search and Filter */}
      <div style={{ 
        marginBottom: '2rem', 
        display: 'flex', 
        gap: '1rem', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center'
      }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: isMobile ? '100%' : '400px' }}>
          <FiSearch style={{ 
            position: 'absolute', 
            left: '1rem', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#666'
          }} />
          <input
            type="text"
            placeholder="Search instrumentals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 3rem',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem'
            }}
          />
        </div>
        {genres.length > 0 && (
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer',
              minWidth: isMobile ? '100%' : '200px'
            }}
          >
            <option value="">All Genres</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>Loading instrumentals...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>{error}</div>
      ) : instrumentals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
          <FiMusic style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }} />
          <p>No instrumentals found.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          {instrumentals.map(instrumental => (
            <div
              key={instrumental.id}
              style={{
                background: '#1a1a1a',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #333',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              onClick={() => handlePlaySong(instrumental)}
            >
              <div style={{
                width: '100%',
                aspectRatio: '1',
                background: instrumental.cover_image_path 
                  ? `url(http://localhost:5000${instrumental.cover_image_path})` 
                  : `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  background: 'rgba(0,0,0,0.6)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 2
                }}
                onClick={(e) => toggleFavorite(instrumental.id, e)}
                >
                  <FiHeart style={{ 
                    color: favorites.has(instrumental.id) ? '#ef4444' : '#fff',
                    fill: favorites.has(instrumental.id) ? '#ef4444' : 'none'
                  }} />
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: '50%',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s'
                }}
                className="play-button-overlay"
                >
                  <FiPlay style={{ color: '#fff', fontSize: '1.5rem', marginLeft: '4px' }} />
                </div>
              </div>
              <div style={{ padding: '1rem' }}>
                <h3 style={{ margin: 0, marginBottom: '0.25rem', fontSize: '1rem' }}>{instrumental.title}</h3>
                <p style={{ margin: 0, color: '#999', fontSize: '0.875rem' }}>{instrumental.artist}</p>
                {instrumental.genre && (
                  <span style={{ 
                    display: 'inline-block',
                    marginTop: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    background: '#2a2a2a',
                    borderRadius: '4px',
                    color: '#999',
                    fontSize: '0.75rem'
                  }}>
                    {instrumental.genre}
                  </span>
                )}
                <div style={{ marginTop: '0.75rem' }}>
                  <Interactions contentType="song" contentId={instrumental.id} compact={true} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSubscriptionModal && (
        <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />
      )}

      <style>{`
        .play-button-overlay {
          transition: opacity 0.2s;
        }
        div:hover .play-button-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  )
}

export default Instrumentals

