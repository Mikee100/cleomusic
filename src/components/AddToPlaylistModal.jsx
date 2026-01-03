import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FiX, FiMusic, FiPlus, FiList } from 'react-icons/fi'

const AddToPlaylistModal = ({ songId, onClose, onSuccess }) => {
  const navigate = useNavigate()
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingToPlaylist, setAddingToPlaylist] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/playlists')
      setPlaylists(response.data.playlists || [])
      setError('')
    } catch (err) {
      console.error('Error fetching playlists:', err)
      setError('Failed to load playlists')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToPlaylist = async (playlistId) => {
    setAddingToPlaylist(playlistId)
    setError('')
    try {
      await axios.post(`/api/playlists/${playlistId}/songs`, { songId })
      if (onSuccess) {
        onSuccess(playlistId)
      }
      onClose()
    } catch (err) {
      console.error('Error adding song to playlist:', err)
      if (err.response?.status === 400 && err.response?.data?.error?.includes('already in')) {
        setError('This song is already in the selected playlist')
      } else {
        setError(err.response?.data?.error || 'Failed to add song to playlist')
      }
    } finally {
      setAddingToPlaylist(null)
    }
  }

  const handleCreateNew = () => {
    onClose()
    navigate('/playlists', { state: { createNew: true, addSongId: songId } })
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          border: '1px solid #333',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Add to Playlist</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#999',
              cursor: 'pointer',
              fontSize: '1.5rem',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
          >
            <FiX />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '0.75rem',
            marginBottom: '1rem',
            color: '#ff6b6b',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleCreateNew}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <FiPlus style={{ fontSize: '1.25rem' }} />
          Create New Playlist
        </button>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
              Loading playlists...
            </div>
          ) : playlists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <FiList style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
              <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                You don't have any playlists yet
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {playlists.map(playlist => (
                <button
                  key={playlist.id}
                  onClick={() => handleAddToPlaylist(playlist.id)}
                  disabled={addingToPlaylist === playlist.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: addingToPlaylist === playlist.id ? '#2a2a2a' : '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '10px',
                    color: '#fff',
                    cursor: addingToPlaylist === playlist.id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: addingToPlaylist === playlist.id ? 0.6 : 1,
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (addingToPlaylist !== playlist.id) {
                      e.currentTarget.style.background = '#222'
                      e.currentTarget.style.borderColor = '#667eea'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (addingToPlaylist !== playlist.id) {
                      e.currentTarget.style.background = '#0a0a0a'
                      e.currentTarget.style.borderColor = '#333'
                    }
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '1.5rem',
                    flexShrink: 0
                  }}>
                    <FiMusic />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '500',
                      marginBottom: '0.25rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {playlist.name}
                    </div>
                    {playlist.description && (
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#999',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '0.25rem'
                      }}>
                        {playlist.description}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                      {(playlist.songs?.length || playlist.song_count || 0)} {(playlist.songs?.length || playlist.song_count || 0) === 1 ? 'song' : 'songs'}
                    </div>
                  </div>
                  {addingToPlaylist === playlist.id && (
                    <div style={{ fontSize: '0.875rem', color: '#667eea' }}>
                      Adding...
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddToPlaylistModal

