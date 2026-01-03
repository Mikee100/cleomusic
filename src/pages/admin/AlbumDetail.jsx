import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { usePlayer } from '../../context/PlayerContext'
import { FiArrowLeft, FiPlay, FiMusic, FiTrash2, FiPlus } from 'react-icons/fi'

const AlbumDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playSong } = usePlayer()
  const [albumData, setAlbumData] = useState(null)
  const [availableSongs, setAvailableSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddSongs, setShowAddSongs] = useState(false)
  const [selectedSongs, setSelectedSongs] = useState([])

  useEffect(() => {
    fetchAlbumDetails()
    fetchAvailableSongs()
  }, [id])

  const fetchAlbumDetails = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/admin/albums/${id}`)
      setAlbumData(response.data)
    } catch (err) {
      console.error('Error fetching album details:', err)
      alert('Failed to load album')
      navigate('/admin/albums')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSongs = async () => {
    try {
      const response = await axios.get('/api/admin/songs', {
        params: { archived: false }
      })
      // Filter out songs already in this album
      if (albumData) {
        const albumSongIds = albumData.songs.map(s => s.id)
        setAvailableSongs(response.data.songs.filter(s => !albumSongIds.includes(s.id)))
      } else {
        setAvailableSongs(response.data.songs)
      }
    } catch (err) {
      console.error('Error fetching songs:', err)
    }
  }

  useEffect(() => {
    if (albumData) {
      fetchAvailableSongs()
    }
  }, [albumData])

  const handleAddSongs = async () => {
    if (selectedSongs.length === 0) return
    try {
      await axios.post(`/api/admin/albums/${id}/songs`, { songIds: selectedSongs })
      setSelectedSongs([])
      setShowAddSongs(false)
      fetchAlbumDetails()
      fetchAvailableSongs()
    } catch (err) {
      alert('Failed to add songs')
    }
  }

  const handleRemoveSong = async (songId) => {
    if (!confirm('Remove this song from the album?')) return
    try {
      await axios.delete(`/api/admin/albums/${id}/songs/${songId}`)
      fetchAlbumDetails()
      fetchAvailableSongs()
    } catch (err) {
      alert('Failed to remove song')
    }
  }

  const handlePlayAll = () => {
    if (albumData?.songs && albumData.songs.length > 0) {
      playSong(albumData.songs[0], albumData.songs)
    }
  }

  const toggleSelectSong = (songId) => {
    setSelectedSongs(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (!albumData) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>Album not found</div>
        <button
          onClick={() => navigate('/admin/albums')}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: '#667eea',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          Back to Albums
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/admin/albums')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          <FiArrowLeft /> Back to Albums
        </button>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'start' }}>
          <div style={{
            width: '300px',
            aspectRatio: '1',
            background: albumData.album.cover_image_path 
              ? `url(${import.meta.env.VITE_API_URL || ''}${albumData.album.cover_image_path})` 
              : '#2a2a2a',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '5rem',
            color: '#666',
            flexShrink: 0
          }}>
            {!albumData.album.cover_image_path && <FiMusic />}
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{albumData.album.name}</h1>
            <p style={{ fontSize: '1.25rem', color: '#999', marginBottom: '1rem' }}>
              {albumData.album.artist}
            </p>
            {albumData.album.description && (
              <p style={{ color: '#666', marginBottom: '1rem', lineHeight: '1.6' }}>
                {albumData.album.description}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {albumData.album.release_date && (
                <span style={{
                  padding: '0.5rem 1rem',
                  background: '#2a2a2a',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#999'
                }}>
                  Released: {new Date(albumData.album.release_date).toLocaleDateString()}
                </span>
              )}
              {albumData.album.genre && (
                <span style={{
                  padding: '0.5rem 1rem',
                  background: '#2a2a2a',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#999'
                }}>
                  {albumData.album.genre}
                </span>
              )}
              <span style={{
                padding: '0.5rem 1rem',
                background: albumData.album.is_active ? '#10b981' : '#666',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#fff'
              }}>
                {albumData.album.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                onClick={handlePlayAll}
                disabled={!albumData.songs || albumData.songs.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: albumData.songs && albumData.songs.length > 0 ? '#667eea' : '#666',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: albumData.songs && albumData.songs.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                <FiPlay /> Play All ({albumData.songs?.length || 0} songs)
              </button>
              <button
                onClick={() => setShowAddSongs(!showAddSongs)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <FiPlus /> Add Songs
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAddSongs && (
        <div style={{
          background: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #333',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Add Songs to Album</h3>
          {availableSongs.length === 0 ? (
            <p style={{ color: '#666' }}>No available songs to add</p>
          ) : (
            <>
              <div style={{
                maxHeight: '400px',
                overflow: 'auto',
                marginBottom: '1rem'
              }}>
                {availableSongs.map(song => (
                  <div
                    key={song.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      marginBottom: '0.5rem',
                      background: '#2a2a2a',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleSelectSong(song.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={selectedSongs.includes(song.id)}
                        onChange={() => toggleSelectSong(song.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <div style={{
                        width: '50px',
                        height: '50px',
                        background: song.cover_image_path 
                          ? `url(${import.meta.env.VITE_API_URL || ''}${song.cover_image_path})` 
                          : '#333',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        color: '#666'
                      }}>
                        {!song.cover_image_path && <FiMusic />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{song.title}</div>
                        <div style={{ color: '#999', fontSize: '0.875rem' }}>{song.artist}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowAddSongs(false)
                    setSelectedSongs([])
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSongs}
                  disabled={selectedSongs.length === 0}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: selectedSongs.length > 0 ? '#667eea' : '#666',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: selectedSongs.length > 0 ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold'
                  }}
                >
                  Add {selectedSongs.length > 0 ? `${selectedSongs.length} ` : ''}Song{selectedSongs.length !== 1 ? 's' : ''}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
          Songs in Album ({albumData.songs?.length || 0})
        </h2>
        {!albumData.songs || albumData.songs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #333',
            color: '#666'
          }}>
            No songs in this album yet. Click "Add Songs" to add songs.
          </div>
        ) : (
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #333',
            overflow: 'hidden'
          }}>
            {albumData.songs.map((song, index) => (
              <div
                key={song.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderBottom: index < albumData.songs.length - 1 ? '1px solid #333' : 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a2a'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: song.cover_image_path 
                    ? `url(${import.meta.env.VITE_API_URL || ''}${song.cover_image_path})` 
                    : '#2a2a2a',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  color: '#666',
                  flexShrink: 0
                }}>
                  {!song.cover_image_path && <FiMusic />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{song.title}</div>
                  <div style={{ color: '#999', fontSize: '0.875rem' }}>{song.artist}</div>
                  {song.genre && (
                    <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {song.genre}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => playSong(song, albumData.songs)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#667eea',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 'bold'
                    }}
                  >
                    <FiPlay /> Play
                  </button>
                  <button
                    onClick={() => handleRemoveSong(song.id)}
                    style={{
                      padding: '0.75rem',
                      background: '#2a2a2a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AlbumDetail

