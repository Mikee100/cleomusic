import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import ReactionsModal from '../../components/ReactionsModal'
import AdminErrorBanner, { getAdminErrorMessage } from '../../components/AdminErrorBanner'
import { useResponsive } from '../../hooks/useResponsive'
import { 
  FiUpload, FiArchive, FiTrash2, FiEdit, FiFilm, 
  FiCheckSquare, FiSearch, FiX, FiPlay, FiMessageCircle
} from 'react-icons/fi'

const Reels = () => {
  const navigate = useNavigate()
  const { isMobile } = useResponsive()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState(null)
  const [selectedVideos, setSelectedVideos] = useState([])
  const [filterArchived, setFilterArchived] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  })
  const [videoFile, setVideoFile] = useState(null)
  const [viewingReactions, setViewingReactions] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchVideos()
  }, [filterArchived, searchTerm])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get('/api/admin/videos', {
        params: { archived: filterArchived, search: searchTerm, kind: 'reel' }
      })
      setVideos(response.data.videos || response.data)
    } catch (err) {
      console.error('Error fetching reels:', err)
      setError(getAdminErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    setIsUploading(true)
    const uploadData = new FormData()
    uploadData.append('title', formData.title)
    uploadData.append('description', formData.description || '')
    uploadData.append('type', 'reel')
    if (videoFile) uploadData.append('videoFile', videoFile)

    try {
      await axios.post('/api/admin/videos', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setShowUploadModal(false)
      setFormData({ title: '', description: '' })
      setVideoFile(null)
      fetchVideos()
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleBulkArchive = async (archived) => {
    if (selectedVideos.length === 0) return
    try {
      await axios.patch('/api/admin/videos/bulk', { videoIds: selectedVideos, archived })
      setSelectedVideos([])
      fetchVideos()
    } catch (err) {
      alert('Bulk operation failed')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedVideos.length === 0 || !confirm(`Delete ${selectedVideos.length} reels?`)) return
    try {
      await axios.delete('/api/admin/videos/bulk', { data: { videoIds: selectedVideos } })
      setSelectedVideos([])
      fetchVideos()
    } catch (err) {
      alert('Bulk delete failed')
    }
  }

  const toggleSelectVideo = (videoId) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedVideos(prev => 
      prev.length === videos.length 
        ? [] 
        : videos.map(v => v.id)
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
          <FiFilm /> Reels Management
        </h1>
        <p style={{ color: '#999', fontSize: isMobile ? '0.875rem' : '1rem' }}>Create and manage short-form vertical reels (9:16 format)</p>
      </div>

      <AdminErrorBanner error={error} onRetry={() => { setError(null); fetchVideos() }} />
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
            placeholder="Search reels..."
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
          <FiUpload /> Upload Reel
        </button>
      </div>

      {selectedVideos.length > 0 && (
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
            {selectedVideos.length} selected
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
            onClick={() => setSelectedVideos([])}
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
      ) : videos.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          No reels found. Upload your first reel to get started!
        </div>
      ) : (
        <>
          {videos.length > 0 && (
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
                checked={selectedVideos.length === videos.length && videos.length > 0}
                onChange={toggleSelectAll}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ color: '#fff', fontSize: '0.875rem' }}>
                Select All ({videos.length} {videos.length === 1 ? 'reel' : 'reels'})
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
            {videos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                onEdit={(video) => {
                  setEditingVideo(video)
                  setFormData({
                    title: video.title,
                    description: video.description || ''
                  })
                }}
                onArchive={(id, archived) => {
                  axios.patch(`/api/admin/videos/${id}/archive`, { archived })
                    .then(() => fetchVideos())
                }}
                onDelete={(id) => {
                  if (confirm('Delete this reel?')) {
                    axios.delete(`/api/admin/videos/${id}`)
                      .then(() => fetchVideos())
                  }
                }}
                onSelect={toggleSelectVideo}
                isSelected={selectedVideos.includes(video.id)}
                onPlay={(video) => {
                  navigate(`/admin/videos/${video.id}`)
                }}
                onViewReactions={(video) => {
                  setViewingReactions({
                    contentType: 'video',
                    contentId: video.id,
                    contentTitle: video.title
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
          videoFile={videoFile}
          setVideoFile={setVideoFile}
          onSubmit={handleUpload}
          isUploading={isUploading}
          onClose={() => {
            setShowUploadModal(false)
            setFormData({ title: '', description: '' })
            setVideoFile(null)
          }}
        />
      )}

      {editingVideo && (
        <EditModal
          video={editingVideo}
          formData={formData}
          setFormData={setFormData}
          onSubmit={async (e) => {
            e.preventDefault()
            try {
              await axios.put(`/api/admin/videos/${editingVideo.id}`, formData)
              setEditingVideo(null)
              setFormData({ title: '', description: '' })
              fetchVideos()
            } catch (err) {
              alert('Update failed')
            }
          }}
          onClose={() => {
            setEditingVideo(null)
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

// Reuse the same VideoCard / Modal components from Videos.jsx if needed
// For brevity, import or duplicate minimal card implementation here
const VideoCard = ({ video, onEdit, onArchive, onDelete, onSelect, isSelected, onPlay, onViewReactions }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (video.file_path && !video.thumbnail_path) {
      const videoElement = document.createElement('video')
      videoElement.crossOrigin = 'anonymous'
      videoElement.preload = 'metadata'
      videoElement.muted = true
      videoElement.src = `${import.meta.env.VITE_API_URL || ''}${video.file_path}`
      
      const captureFrame = () => {
        try {
          videoElement.currentTime = 1
        } catch (e) {
          videoElement.currentTime = 0.5
        }
      }
      
      videoElement.addEventListener('loadedmetadata', () => {
        if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
          captureFrame()
        }
      })
      
      videoElement.addEventListener('seeked', () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = videoElement.videoWidth || 640
          canvas.height = videoElement.videoHeight || 360
          const ctx = canvas.getContext('2d')
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
          setThumbnailUrl(canvas.toDataURL('image/jpeg', 0.8))
        } catch (e) {
          console.error('Error capturing video frame:', e)
        }
      })
      
      videoElement.addEventListener('error', () => {
        setThumbnailUrl(null)
      })
      
      return () => {
        videoElement.src = ''
        videoElement.load()
      }
    }
  }, [video.file_path, video.thumbnail_path])

  return (
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
        onChange={() => onSelect(video.id)}
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
        aspectRatio: '9/16', // Vertical reel format
        background: video.thumbnail_path 
          ? `url(${import.meta.env.VITE_API_URL || ''}${video.thumbnail_path})` 
          : thumbnailUrl
            ? `url(${thumbnailUrl})`
            : video.file_path 
              ? '#1a1a1a'
              : '#2a2a2a',
        backgroundSize: (video.thumbnail_path || thumbnailUrl) ? 'cover' : 'auto',
        backgroundPosition: 'center',
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
        {video.file_path && !video.thumbnail_path && !thumbnailUrl && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FiPlay style={{ marginLeft: '4px' }} />
          </div>
        )}
        {!video.file_path && <FiFilm />}
      </div>
      <h3 style={{ marginBottom: '0.25rem' }}>{video.title}</h3>
      {video.description && (
        <p style={{ color: '#999', fontSize: '0.875rem', marginBottom: '0.5rem', 
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {video.description}
        </p>
      )}
      {video.uploaded_by_name && (
        <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
          Uploaded by: {video.uploaded_by_name}
        </p>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        {video.file_path && (
          <button
            onClick={() => onPlay && onPlay(video)}
            style={{
              flex: 1,
              minWidth: '80px',
              padding: '0.5rem',
              background: '#667eea',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              fontWeight: 'bold'
            }}
          >
            <FiPlay /> View
          </button>
        )}
        <button
          onClick={() => onViewReactions && onViewReactions(video)}
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
          onClick={() => onEdit(video)}
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
          onClick={() => onArchive(video.id, !video.is_archived)}
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
          <FiArchive /> {video.is_archived ? 'Unarchive' : 'Archive'}
        </button>
        <button
          onClick={() => onDelete(video.id)}
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
}

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

const UploadModal = ({ formData, setFormData, videoFile, setVideoFile, onSubmit, onClose, isUploading }) => (
  <Modal>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <h2>Upload Reel</h2>
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
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Reel Video File *</label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files[0])}
          disabled={isUploading}
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
        <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
          Ideal format for vertical reels (9:16). Max 500MB.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          type="submit"
          disabled={isUploading}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: '#667eea',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: isUploading ? 'wait' : 'pointer',
            opacity: isUploading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          {isUploading ? 'Uploading...' : 'Upload Reel'}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={isUploading}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            opacity: isUploading ? 0.5 : 1
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  </Modal>
)

const EditModal = ({ video, formData, setFormData, onSubmit, onClose }) => (
  <Modal>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <h2>Edit Reel</h2>
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

export default Reels


