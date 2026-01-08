import { useState, useEffect } from 'react'
import axios from 'axios'
import { useResponsive } from '../../hooks/useResponsive'
import { FiCalendar, FiEdit, FiTrash2, FiPlus, FiX, FiMusic, FiDisc, FiSearch } from 'react-icons/fi'

const Upcoming = () => {
  const { isMobile } = useResponsive()
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [formData, setFormData] = useState({
    type: 'song',
    title: '',
    name: '',
    artist: '',
    description: '',
    release_date: '',
    is_active: true
  })
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)

  useEffect(() => {
    fetchUpcoming()
  }, [searchTerm, filterType])

  const fetchUpcoming = async () => {
    try {
      setLoading(true)
      const params = {}
      if (searchTerm) params.search = searchTerm
      if (filterType) params.type = filterType
      const response = await axios.get('/api/upcoming/admin', { params })
      setUpcoming(response.data.upcoming || [])
    } catch (err) {
      console.error('Error fetching upcoming releases:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const uploadData = new FormData()
      uploadData.append('type', formData.type)
      uploadData.append(formData.type === 'song' ? 'title' : 'name', formData.type === 'song' ? formData.title : formData.name)
      uploadData.append('artist', formData.artist)
      uploadData.append('description', formData.description)
      uploadData.append('release_date', formData.release_date)
      uploadData.append('is_active', formData.is_active)
      if (coverFile) {
        uploadData.append('coverImage', coverFile)
      }

      if (editingItem) {
        await axios.put(`/api/upcoming/admin/${editingItem.id}`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        await axios.post('/api/upcoming/admin', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      setShowModal(false)
      setEditingItem(null)
      setFormData({ type: 'song', title: '', name: '', artist: '', description: '', release_date: '', is_active: true })
      setCoverFile(null)
      setCoverPreview(null)
      fetchUpcoming()
    } catch (err) {
      alert(err.response?.data?.error || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this upcoming release?')) return
    try {
      await axios.delete(`/api/upcoming/admin/${id}`)
      fetchUpcoming()
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      type: item.type,
      title: item.title || item.name || '',
      name: item.name || item.title || '',
      artist: item.artist || '',
      description: item.description || '',
      release_date: item.release_date ? new Date(item.release_date).toISOString().split('T')[0] : '',
      is_active: item.is_active !== false
    })
    setCoverFile(null)
    setCoverPreview(item.cover_image_path ? `${import.meta.env.VITE_API_URL || ''}${item.cover_image_path}` : null)
    setShowModal(true)
  }

  const handleCoverChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const filteredUpcoming = upcoming.filter(item => {
    if (filterType && item.type !== filterType) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        (item.title || item.name || '').toLowerCase().includes(search) ||
        (item.artist || '').toLowerCase().includes(search)
      )
    }
    return true
  })

  return (
    <div>
      <div style={{ marginBottom: isMobile ? '1rem' : '2rem' }}>
        <h1 style={{ 
          fontSize: isMobile ? '1.5rem' : '2rem', 
          marginBottom: '0.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <FiCalendar /> Upcoming Releases
        </h1>
        <p style={{ color: '#999', fontSize: isMobile ? '0.875rem' : '1rem' }}>Manage upcoming songs and albums</p>
      </div>

      <div style={{ 
        marginBottom: '1rem', 
        display: 'flex', 
        gap: '1rem', 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <button
          onClick={() => {
            setEditingItem(null)
            setFormData({ type: 'song', title: '', name: '', artist: '', description: '', release_date: '', is_active: true })
            setCoverFile(null)
            setCoverPreview(null)
            setShowModal(true)
          }}
          style={{
            padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem',
            background: '#667eea',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: isMobile ? '0.875rem' : '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            width: isMobile ? '100%' : 'auto',
            justifyContent: 'center'
          }}
        >
          <FiPlus /> Add Upcoming Release
        </button>

        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          flex: 1, 
          minWidth: isMobile ? '100%' : '300px',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <FiSearch style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#666'
            }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '0.625rem 0.75rem',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
              cursor: 'pointer',
              minWidth: '120px'
            }}
          >
            <option value="">All Types</option>
            <option value="song">Songs</option>
            <option value="album">Albums</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>Loading...</div>
      ) : filteredUpcoming.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
          No upcoming releases found.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {filteredUpcoming.map(item => (
            <div
              key={item.id}
              style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                {item.cover_image_path ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL || ''}${item.cover_image_path}`}
                    alt={item.title || item.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '8px',
                    background: '#2a2a2a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    fontSize: '1.5rem',
                    flexShrink: 0
                  }}>
                    {item.type === 'song' ? <FiMusic /> : <FiDisc />}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    {item.type === 'song' ? <FiMusic size={14} /> : <FiDisc size={14} />}
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: '#667eea', 
                      textTransform: 'uppercase',
                      fontWeight: '600'
                    }}>
                      {item.type}
                    </span>
                    {!item.is_active && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: '#999', 
                        textTransform: 'uppercase'
                      }}>
                        (Inactive)
                      </span>
                    )}
                  </div>
                  <h3 style={{ 
                    margin: 0, 
                    marginBottom: '0.25rem', 
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.title || item.name}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    color: '#999', 
                    fontSize: '0.875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.artist}
                  </p>
                </div>
              </div>

              {item.description && (
                <p style={{ 
                  margin: 0, 
                  color: '#ccc', 
                  fontSize: '0.875rem',
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {item.description}
                </p>
              )}

              <div style={{ 
                padding: '0.5rem',
                background: '#0a0a0a',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#999'
              }}>
                <strong style={{ color: '#667eea' }}>Release Date:</strong> {formatDate(item.release_date)}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleEdit(item)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: 'transparent',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a2a'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <FiEdit /> Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: 'transparent',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ef4444'
                    e.currentTarget.style.color = '#fff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#ef4444'
                  }}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          onClick={() => {
            setShowModal(false)
            setEditingItem(null)
          }}
          style={{
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
            padding: isMobile ? '1rem' : '2rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a1a',
              borderRadius: '12px',
              padding: isMobile ? '1.5rem' : '2rem',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
                {editingItem ? 'Edit Upcoming Release' : 'Add Upcoming Release'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingItem(null)
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  padding: '0.25rem'
                }}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                >
                  <option value="song">Song</option>
                  <option value="album">Album</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>
                  {formData.type === 'song' ? 'Title' : 'Name'} *
                </label>
                <input
                  type="text"
                  value={formData.type === 'song' ? formData.title : formData.name}
                  onChange={(e) => {
                    if (formData.type === 'song') {
                      setFormData({ ...formData, title: e.target.value, name: e.target.value })
                    } else {
                      setFormData({ ...formData, name: e.target.value, title: e.target.value })
                    }
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Artist *</label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Release Date *</label>
                <input
                  type="date"
                  value={formData.release_date}
                  onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Cover Image</label>
                {coverPreview && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      style={{
                        width: '100%',
                        maxWidth: '200px',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #333'
                      }}
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleCoverChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                />
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#999' }}>
                  Accepted formats: JPG, PNG, GIF, WebP (max 5MB)
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="is_active" style={{ color: '#ccc', cursor: 'pointer' }}>Active</label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#667eea',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingItem(null)
                    setCoverFile(null)
                    setCoverPreview(null)
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'transparent',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Upcoming

