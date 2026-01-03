import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import SubscriptionModal from '../components/SubscriptionModal'
import CreatePlaylistModal from '../components/CreatePlaylistModal'
import { useResponsive } from '../hooks/useResponsive'
import { FiMusic, FiPlus, FiPlay, FiTrash2, FiEdit } from 'react-icons/fi'

const Playlists = () => {
  const { user, subscription } = useAuth()
  const navigate = useNavigate()
  const { isMobile } = useResponsive()
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (subscription || user?.role === 'admin') {
      fetchPlaylists()
    } else {
      setLoading(false)
    }
  }, [subscription, user])

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/playlists')
      setPlaylists(response.data.playlists || [])
      setError('')
    } catch (err) {
      console.error('Error fetching playlists:', err)
      if (err.response?.status === 403 && err.response?.data?.requiresSubscription) {
        setShowSubscriptionModal(true)
        setError('')
      } else {
        setError('Failed to load playlists')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (playlistId, e) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this playlist?')) {
      return
    }

    setDeletingId(playlistId)
    try {
      await axios.delete(`/api/playlists/${playlistId}`)
      setPlaylists(playlists.filter(p => p.id !== playlistId))
    } catch (err) {
      console.error('Error deleting playlist:', err)
      alert(err.response?.data?.error || 'Failed to delete playlist')
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreateSuccess = (newPlaylist) => {
    setPlaylists([newPlaylist, ...playlists])
  }

  if (!subscription && user?.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? '2rem 1rem' : '4rem 2rem' }}>
        <h1 style={{ marginBottom: '1rem', fontSize: isMobile ? '1.5rem' : '2rem' }}>Playlists</h1>
        <p style={{ marginBottom: '2rem', color: '#999', fontSize: isMobile ? '0.875rem' : '1rem' }}>Subscribe to create and manage playlists</p>
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
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: isMobile ? '1rem' : '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ 
            marginBottom: '0.5rem', 
            fontSize: isMobile ? '1.5rem' : '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <FiMusic /> Playlists
          </h1>
          <p style={{ color: '#999', fontSize: isMobile ? '0.875rem' : '1rem' }}>
            Create and manage your playlists
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.5rem',
            background: '#667eea',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: isMobile ? '0.875rem' : '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#5568d3'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#667eea'}
        >
          <FiPlus /> Create Playlist
        </button>
      </div>

      {error && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '1rem',
          color: '#ef4444',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: isMobile ? '2rem 1rem' : '4rem 2rem' }}>
          Loading playlists...
        </div>
      ) : playlists.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: isMobile ? '3rem 1rem' : '4rem 2rem',
          background: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #333'
        }}>
          <FiMusic style={{ fontSize: isMobile ? '3rem' : '4rem', marginBottom: '1rem', opacity: 0.3, color: '#666' }} />
          <p style={{ color: '#999', fontSize: isMobile ? '0.875rem' : '1rem', marginBottom: '1.5rem' }}>
            You don't have any playlists yet. Create your first playlist to get started!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1.5rem',
              background: '#667eea',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <FiPlus /> Create Playlist
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile 
            ? 'repeat(2, 1fr)' 
            : 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: isMobile ? '1rem' : '1.5rem'
        }}>
          {playlists.map(playlist => (
            <div
              key={playlist.id}
              style={{
                background: '#1a1a1a',
                borderRadius: '12px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                border: '1px solid #333',
                position: 'relative'
              }}
              onClick={() => navigate(`/playlists/${playlist.id}`)}
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
                    navigate(`/playlists/${playlist.id}`)
                  }}
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '6px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#fff',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.8)'
                    e.currentTarget.style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.6)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                  title="Edit playlist"
                >
                  <FiEdit />
                </button>
                <button
                  onClick={(e) => handleDelete(playlist.id, e)}
                  disabled={deletingId === playlist.id}
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '6px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: deletingId === playlist.id ? 'not-allowed' : 'pointer',
                    color: '#ef4444',
                    fontSize: '0.875rem',
                    opacity: deletingId === playlist.id ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (deletingId !== playlist.id) {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)'
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (deletingId !== playlist.id) {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.6)'
                      e.currentTarget.style.transform = 'scale(1)'
                    }
                  }}
                  title="Delete playlist"
                >
                  <FiTrash2 />
                </button>
              </div>
              
              <div style={{
                width: '100%',
                aspectRatio: '1',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <FiMusic style={{ opacity: 0.8 }} />
                {playlist.song_count > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '0.5rem',
                    right: '0.5rem',
                    background: 'rgba(0,0,0,0.7)',
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {playlist.song_count}
                  </div>
                )}
              </div>
              
              <h3 style={{ 
                marginBottom: '0.25rem', 
                fontSize: '1rem', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                fontWeight: '600'
              }}>
                {playlist.name}
              </h3>
              
              {playlist.description && (
                <p style={{ 
                  color: '#999', 
                  fontSize: '0.875rem', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap',
                  marginBottom: '0.5rem'
                }}>
                  {playlist.description}
                </p>
              )}
              
              <p style={{ 
                color: '#666', 
                fontSize: '0.75rem',
                marginTop: '0.5rem'
              }}>
                {playlist.song_count} {playlist.song_count === 1 ? 'song' : 'songs'}
              </p>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreatePlaylistModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={handleCreateSuccess}
        />
      )}

      {showSubscriptionModal && (
        <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />
      )}
    </div>
  )
}

export default Playlists

