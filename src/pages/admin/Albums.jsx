import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FiPlus, FiEdit, FiTrash2, FiMusic, FiX, FiSearch } from 'react-icons/fi'

const Albums = () => {
  const navigate = useNavigate()
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    artist: '',
    description: '',
    release_date: '',
    genre: '',
    is_active: true
  })
  const [coverFile, setCoverFile] = useState(null)

  useEffect(() => {
    fetchAlbums()
  }, [searchTerm])

  const fetchAlbums = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/admin/albums', {
        params: { search: searchTerm }
      })
      setAlbums(response.data)
    } catch (err) {
      console.error('Error fetching albums:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const uploadData = new FormData()
    uploadData.append('name', formData.name)
    uploadData.append('artist', formData.artist)
    uploadData.append('description', formData.description)
    uploadData.append('release_date', formData.release_date)
    uploadData.append('genre', formData.genre)
    uploadData.append('is_active', formData.is_active)
    if (coverFile) uploadData.append('coverImage', coverFile)

    try {
      if (editingAlbum) {
        await axios.put(`/api/admin/albums/${editingAlbum.id}`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        await axios.post('/api/admin/albums', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      setShowCreateModal(false)
      setEditingAlbum(null)
      setFormData({ name: '', artist: '', description: '', release_date: '', genre: '', is_active: true })
      setCoverFile(null)
      fetchAlbums()
    } catch (err) {
      alert(err.response?.data?.error || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this album? Songs will be unlinked but not deleted.')) return
    try {
      await axios.delete(`/api/admin/albums/${id}`)
      fetchAlbums()
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiMusic /> Albums Management
        </h1>
        <p style={{ color: '#999' }}>Create and manage albums</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <input
          type="text"
          placeholder="Search albums..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '300px',
            padding: '0.75rem',
            background: '#2a2a2a',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '1rem'
          }}
        />
        <button
          onClick={() => {
            setEditingAlbum(null)
            setFormData({ name: '', artist: '', description: '', release_date: '', genre: '', is_active: true })
            setCoverFile(null)
            setShowCreateModal(true)
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: '#667eea',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          <FiPlus /> Create Album
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {albums.map(album => (
            <div
              key={album.id}
              onClick={() => navigate(`/admin/albums/${album.id}`)}
              style={{
                background: '#1a1a1a',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #333',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333'}
            >
              <div style={{
                width: '100%',
                aspectRatio: '1',
                background: album.cover_image_path 
                  ? `url(${import.meta.env.VITE_API_URL || ''}${album.cover_image_path})` 
                  : '#2a2a2a',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                color: '#666'
              }}>
                {!album.cover_image_path && <FiMusic />}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{album.name}</h3>
                  <p style={{ color: '#999', fontSize: '0.875rem' }}>{album.artist}</p>
                </div>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  background: album.is_active ? '#10b981' : '#666',
                  color: '#fff'
                }}>
                  {album.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {album.song_count || 0} songs
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingAlbum(album)
                    setFormData({
                      name: album.name,
                      artist: album.artist,
                      description: album.description || '',
                      release_date: album.release_date || '',
                      genre: album.genre || '',
                      is_active: album.is_active
                    })
                    setShowCreateModal(true)
                  }}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <FiEdit /> Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(album.id)
                  }}
                  style={{
                    padding: '0.5rem',
                    background: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '6px',
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

      {showCreateModal && (
        <AlbumModal
          formData={formData}
          setFormData={setFormData}
          coverFile={coverFile}
          setCoverFile={setCoverFile}
          editingAlbum={editingAlbum}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowCreateModal(false)
            setEditingAlbum(null)
            setFormData({ name: '', artist: '', description: '', release_date: '', genre: '', is_active: true })
            setCoverFile(null)
          }}
        />
      )}

    </div>
  )
}

const AlbumModal = ({ formData, setFormData, coverFile, setCoverFile, editingAlbum, onSubmit, onClose }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '2rem'
  }}>
    <div style={{
      background: '#1a1a1a',
      borderRadius: '12px',
      padding: '2rem',
      maxHeight: '90vh',
      overflow: 'auto',
      maxWidth: '500px',
      width: '100%'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>{editingAlbum ? 'Edit Album' : 'Create Album'}</h2>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.5rem' }}>
          <FiX />
        </button>
      </div>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Album Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Artist *</label>
          <input
            type="text"
            value={formData.artist}
            onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              minHeight: '80px'
            }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Release Date</label>
            <input
              type="date"
              value={formData.release_date}
              onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#2a2a2a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Genre</label>
            <input
              type="text"
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#2a2a2a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
          </div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Cover Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files[0])}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              style={{ width: '20px', height: '20px' }}
            />
            Active
          </label>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#667eea',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {editingAlbum ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onClose}
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
        </div>
      </form>
    </div>
  </div>
)

export default Albums

