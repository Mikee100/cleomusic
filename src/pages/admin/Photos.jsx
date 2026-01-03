import { useState, useEffect } from 'react'
import axios from 'axios'
import ReactionsModal from '../../components/ReactionsModal'
import { useResponsive } from '../../hooks/useResponsive'
import { 
  FiUpload, FiArchive, FiTrash2, FiEdit, FiImage, 
  FiCheckSquare, FiSearch, FiX, FiMessageCircle
} from 'react-icons/fi'

const Photos = () => {
  const { isMobile } = useResponsive()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState(null)
  const [selectedPhotos, setSelectedPhotos] = useState([])
  const [filterArchived, setFilterArchived] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [viewingReactions, setViewingReactions] = useState(null)

  useEffect(() => {
    fetchPhotos()
  }, [filterArchived, searchTerm])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/admin/photos', {
        params: { archived: filterArchived, search: searchTerm }
      })
      setPhotos(response.data.photos || response.data)
    } catch (err) {
      console.error('Error fetching photos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    const uploadData = new FormData()
    uploadData.append('title', formData.title)
    uploadData.append('description', formData.description || '')
    if (photoFile) uploadData.append('photoFile', photoFile)

    try {
      await axios.post('/api/admin/photos', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setShowUploadModal(false)
      setFormData({ title: '', description: '' })
      setPhotoFile(null)
      fetchPhotos()
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed')
    }
  }

  const handleBulkArchive = async (archived) => {
    if (selectedPhotos.length === 0) return
    try {
      await axios.patch('/api/admin/photos/bulk', { photoIds: selectedPhotos, archived })
      setSelectedPhotos([])
      fetchPhotos()
    } catch (err) {
      alert('Bulk operation failed')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPhotos.length === 0 || !confirm(`Delete ${selectedPhotos.length} photos?`)) return
    try {
      await axios.delete('/api/admin/photos/bulk', { data: { photoIds: selectedPhotos } })
      setSelectedPhotos([])
      fetchPhotos()
    } catch (err) {
      alert('Bulk delete failed')
    }
  }

  const toggleSelectPhoto = (photoId) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedPhotos(prev => 
      prev.length === photos.length 
        ? [] 
        : photos.map(p => p.id)
    )
  }

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
          <FiImage /> Photos Management
        </h1>
        <p style={{ color: '#999', fontSize: isMobile ? '0.875rem' : '1rem' }}>Manage all your photos</p>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        marginBottom: '1rem', 
        gap: '1rem' 
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          flex: 1, 
          flexDirection: isMobile ? 'column' : 'row',
          minWidth: isMobile ? 'auto' : '300px' 
        }}>
          <input
            type="text"
            placeholder="Search photos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem'
            }}
          />
          <button
            onClick={() => setFilterArchived(!filterArchived)}
            style={{
              padding: '0.75rem 1.5rem',
              background: filterArchived ? '#667eea' : '#2a2a2a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            {filterArchived ? 'Show Active' : 'Show Archived'}
          </button>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
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
          <FiUpload /> Upload Photo
        </button>
      </div>

      {selectedPhotos.length > 0 && (
        <div style={{
          background: '#2a2a2a',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>
            {selectedPhotos.length} selected
          </span>
          <button
            onClick={() => handleBulkArchive(true)}
            style={{
              padding: '0.5rem 1rem',
              background: '#f59e0b',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FiArchive /> Archive
          </button>
          <button
            onClick={() => handleBulkArchive(false)}
            style={{
              padding: '0.5rem 1rem',
              background: '#10b981',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FiArchive /> Unarchive
          </button>
          <button
            onClick={handleBulkDelete}
            style={{
              padding: '0.5rem 1rem',
              background: '#ef4444',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FiTrash2 /> Delete
          </button>
          <button
            onClick={() => setSelectedPhotos([])}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <FiX /> Clear
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : photos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          No photos found. Upload your first photo to get started!
        </div>
      ) : (
        <>
          {photos.length > 0 && (
            <div style={{
              padding: '0.75rem 1rem',
              background: '#2a2a2a',
              borderRadius: '8px',
              border: '1px solid #333',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onClick={toggleSelectAll}
            onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#2a2a2a'}
            >
              <input
                type="checkbox"
                checked={selectedPhotos.length === photos.length && photos.length > 0}
                onChange={toggleSelectAll}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ color: '#fff', fontSize: '0.875rem' }}>
                Select All ({photos.length} {photos.length === 1 ? 'photo' : 'photos'})
              </span>
            </div>
          )}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile 
              ? 'repeat(1, 1fr)' 
              : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {photos.map(photo => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onEdit={(photo) => {
                setEditingPhoto(photo)
                setFormData({
                  title: photo.title,
                  description: photo.description || ''
                })
              }}
              onArchive={(id, archived) => {
                axios.patch(`/api/admin/photos/${id}/archive`, { archived })
                  .then(() => fetchPhotos())
              }}
              onDelete={(id) => {
                if (confirm('Delete this photo?')) {
                  axios.delete(`/api/admin/photos/${id}`)
                    .then(() => fetchPhotos())
                }
              }}
              onSelect={toggleSelectPhoto}
              isSelected={selectedPhotos.includes(photo.id)}
              onViewReactions={(photo) => {
                setViewingReactions({
                  contentType: 'photo',
                  contentId: photo.id,
                  contentTitle: photo.title
                })
              }}
            />
          ))}
          </div>
        </>
      )}

      {showUploadModal && (
        <UploadModal
          formData={formData}
          setFormData={setFormData}
          photoFile={photoFile}
          setPhotoFile={setPhotoFile}
          onSubmit={handleUpload}
          onClose={() => {
            setShowUploadModal(false)
            setFormData({ title: '', description: '' })
            setPhotoFile(null)
          }}
        />
      )}

      {editingPhoto && (
        <EditModal
          photo={editingPhoto}
          formData={formData}
          setFormData={setFormData}
          onSubmit={async (e) => {
            e.preventDefault()
            try {
              await axios.put(`/api/admin/photos/${editingPhoto.id}`, formData)
              setEditingPhoto(null)
              setFormData({ title: '', description: '' })
              fetchPhotos()
            } catch (err) {
              alert('Update failed')
            }
          }}
          onClose={() => {
            setEditingPhoto(null)
            setFormData({ title: '', description: '' })
          }}
        />
      )}

      {viewingReactions && (
        <ReactionsModal
          contentType={viewingReactions.contentType}
          contentId={viewingReactions.contentId}
          contentTitle={viewingReactions.contentTitle}
          onClose={() => setViewingReactions(null)}
        />
      )}
    </div>
  )
}

const PhotoCard = ({ photo, onEdit, onArchive, onDelete, onSelect, isSelected, onViewReactions }) => (
  <div style={{
    background: '#1a1a1a',
    borderRadius: '12px',
    padding: '1rem',
    border: '1px solid #333',
    position: 'relative'
  }}>
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => onSelect(photo.id)}
      style={{
        position: 'absolute',
        top: '0.5rem',
        left: '0.5rem',
        width: '20px',
        height: '20px',
        zIndex: 10,
        cursor: 'pointer'
      }}
      onClick={(e) => e.stopPropagation()}
    />
    <div style={{
      width: '100%',
      aspectRatio: '1',
      background: photo.file_path ? `url(http://localhost:5000${photo.file_path})` : '#2a2a2a',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      borderRadius: '8px',
      marginBottom: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '3rem',
      color: '#666'
    }}>
      {!photo.file_path && <FiImage />}
    </div>
    <h3 style={{ marginBottom: '0.25rem' }}>{photo.title}</h3>
    {photo.description && (
      <p style={{ color: '#999', fontSize: '0.875rem', marginBottom: '0.5rem', 
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {photo.description}
      </p>
    )}
    {photo.uploaded_by_name && (
      <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
        Uploaded by: {photo.uploaded_by_name}
      </p>
    )}
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
      <button
        onClick={() => onViewReactions && onViewReactions(photo)}
        style={{
          flex: 1,
          minWidth: '80px',
          padding: '0.5rem',
          background: '#3b82f6',
          border: 'none',
          borderRadius: '6px',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.25rem'
        }}
        title="View Reactions"
      >
        <FiMessageCircle /> Reactions
      </button>
      <button
        onClick={() => onEdit(photo)}
        style={{
          flex: 1,
          minWidth: '80px',
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
        onClick={() => onArchive(photo.id, !photo.is_archived)}
        style={{
          flex: 1,
          minWidth: '80px',
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
        <FiArchive /> {photo.is_archived ? 'Unarchive' : 'Archive'}
      </button>
      <button
        onClick={() => onDelete(photo.id)}
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
)

const Modal = ({ children }) => (
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
      {children}
    </div>
  </div>
)

const UploadModal = ({ formData, setFormData, photoFile, setPhotoFile, onSubmit, onClose }) => (
  <Modal>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <h2>Upload Photo</h2>
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.5rem' }}>
        <FiX />
      </button>
    </div>
    <form onSubmit={onSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
          rows="4"
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#2a2a2a',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            resize: 'vertical'
          }}
        />
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Photo File *</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files[0])}
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
          Upload
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
  </Modal>
)

const EditModal = ({ photo, formData, setFormData, onSubmit, onClose }) => (
  <Modal>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <h2>Edit Photo</h2>
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.5rem' }}>
        <FiX />
      </button>
    </div>
    <form onSubmit={onSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows="4"
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#2a2a2a',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            resize: 'vertical'
          }}
        />
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
          Update
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
  </Modal>
)

export default Photos

