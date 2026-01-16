import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import SubscriptionModal from '../components/SubscriptionModal'
import { useResponsive } from '../hooks/useResponsive'
import { FiPlay, FiMusic, FiTrash2, FiEdit2, FiX, FiSave, FiArrowLeft } from 'react-icons/fi'
import { usePrefetch } from '../hooks/usePrefetch'

const PlaylistDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, subscription } = useAuth()
  const { playSong } = usePlayer()
  const { isMobile } = useResponsive()
  const { prefetchMedia } = usePrefetch()
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [removingSongId, setRemovingSongId] = useState(null)

  useEffect(() => {
    // Allow free users to access playlists (they'll get interrupted after 20 seconds when playing)
    fetchPlaylist()
  }, [id, subscription, user])

  const fetchPlaylist = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/playlists/${id}`)
      setPlaylist(response.data.playlist)
      setEditName(response.data.playlist.name)
      setEditDescription(response.data.playlist.description || '')
      setError('')
    } catch (err) {
      console.error('Error fetching playlist:', err)
      if (err.response?.status === 403 && err.response?.data?.requiresSubscription) {
        setShowSubscriptionModal(true)
        setError('')
      } else if (err.response?.status === 404) {
        setError('Playlist not found')
      } else {
        setError('Failed to load playlist')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editName.trim()) {
      alert('Playlist name cannot be empty')
      return
    }

    setSaving(true)
    try {
      const response = await axios.put(`/api/playlists/${id}`, {
        name: editName.trim(),
        description: editDescription.trim() || null
      })
      setPlaylist(response.data.playlist)
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating playlist:', err)
      alert(err.response?.data?.error || 'Failed to update playlist')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditName(playlist.name)
    setEditDescription(playlist.description || '')
    setIsEditing(false)
  }

  const handleRemoveSong = async (songId, e) => {
    e.stopPropagation()
    setRemovingSongId(songId)
    try {
      const response = await axios.delete(`/api/playlists/${id}/songs/${songId}`)
      setPlaylist(response.data.playlist)
    } catch (err) {
      console.error('Error removing song:', err)
      alert(err.response?.data?.error || 'Failed to remove song')
    } finally {
      setRemovingSongId(null)
    }
  }

  const handlePlayAll = () => {
    // Allow free users to play songs (they'll get interrupted after 20 seconds)
    if (playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs)
    }
  }

  const handlePlaySong = (song) => {
    // Allow free users to play songs (they'll get interrupted after 20 seconds)
    playSong(song, playlist.songs)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? '2rem 1rem' : '4rem 2rem' }}>
        Loading playlist...
      </div>
    )
  }

  if (error || !playlist) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? '2rem 1rem' : '4rem 2rem' }}>
        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error || 'Playlist not found'}</p>
        <button
          onClick={() => navigate('/playlists')}
          style={{
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
          Back to Playlists
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate('/playlists')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          padding: '0.5rem 1rem',
          background: 'transparent',
          border: '1px solid #333',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a2a'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <FiArrowLeft /> Back to Playlists
      </button>

      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: isMobile ? '1.5rem' : '2rem',
        marginBottom: '2rem',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    outline: 'none'
                  }}
                  placeholder="Playlist name"
                  maxLength={200}
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    marginBottom: '1rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    minHeight: '80px'
                  }}
                  placeholder="Description (optional)"
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editName.trim()}
                    style={{
                      padding: '0.5rem 1rem',
                      background: saving || !editName.trim() ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)',
                      border: 'none',
                      borderRadius: '6px',
                      color: saving || !editName.trim() ? '#ccc' : '#667eea',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: saving || !editName.trim() ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <FiSave /> {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.875rem',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <FiX /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <h1 style={{
                    margin: 0,
                    fontSize: isMobile ? '1.75rem' : '2.5rem',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}>
                    {playlist.name}
                  </h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: '0.5rem',
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    title="Edit playlist"
                  >
                    <FiEdit2 />
                  </button>
                </div>
                {playlist.description && (
                  <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1rem', marginBottom: '1rem' }}>
                    {playlist.description}
                  </p>
                )}
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                  {playlist.song_count} {playlist.song_count === 1 ? 'song' : 'songs'}
                </p>
              </div>
            )}
          </div>
          {playlist.songs.length > 0 && !isEditing && (
            <button
              onClick={handlePlayAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 1.5rem',
                background: '#fff',
                border: 'none',
                borderRadius: '8px',
                color: '#667eea',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <FiPlay style={{ fontSize: '1.25rem' }} /> Play All
            </button>
          )}
        </div>
      </div>

      {playlist.songs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '3rem 1rem' : '4rem 2rem',
          background: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #333'
        }}>
          <FiMusic style={{ fontSize: isMobile ? '3rem' : '4rem', marginBottom: '1rem', opacity: 0.3, color: '#666' }} />
          <p style={{ color: '#999', fontSize: isMobile ? '0.875rem' : '1rem', marginBottom: '1rem' }}>
            This playlist is empty
          </p>
          <p style={{ color: '#666', fontSize: '0.875rem' }}>
            Add songs to this playlist from the songs page
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile
            ? 'repeat(2, 1fr)'
            : 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: isMobile ? '0.75rem' : '1.5rem'
        }}>
          {playlist.songs.map((song, index) => (
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
                onClick={(e) => handleRemoveSong(song.id, e)}
                disabled={removingSongId === song.id}
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  background: 'rgba(0,0,0,0.6)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: removingSongId === song.id ? 'not-allowed' : 'pointer',
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  zIndex: 10,
                  opacity: removingSongId === song.id ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (removingSongId !== song.id) {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)'
                    e.currentTarget.style.transform = 'scale(1.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (removingSongId !== song.id) {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.6)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
                title="Remove from playlist"
              >
                <FiTrash2 />
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
                <div style={{
                  position: 'absolute',
                  bottom: '0.5rem',
                  right: '0.5rem',
                  background: 'rgba(0,0,0,0.7)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '1rem'
                }}>
                  <FiPlay />
                </div>
              </div>
              <h3 style={{
                marginBottom: '0.25rem',
                fontSize: '1rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: '600'
              }}>
                {song.title}
              </h3>
              <p style={{
                color: '#999',
                fontSize: '0.875rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {song.artist}
              </p>
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

export default PlaylistDetail

