import { useState, useEffect } from 'react'
import axios from 'axios'
import { usePlayer } from '../../context/PlayerContext'
import ReactionsModal from '../../components/ReactionsModal'
import AdminErrorBanner, { getAdminErrorMessage } from '../../components/AdminErrorBanner'
import { useResponsive } from '../../hooks/useResponsive'
import { 
  FiUpload, FiArchive, FiTrash2, FiEdit, FiMusic, FiPlay, 
  FiCheckSquare, FiSearch, FiX, FiMessageCircle
} from 'react-icons/fi'

const Instrumentals = () => {
  const { playSong } = usePlayer()
  const { isMobile } = useResponsive()
  const [instrumentals, setInstrumentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingInstrumental, setEditingInstrumental] = useState(null)
  const [selectedInstrumentals, setSelectedInstrumentals] = useState([])
  const [filterArchived, setFilterArchived] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [albums, setAlbums] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    genre: '',
    album_id: ''
  })
  const [musicFile, setMusicFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [viewingReactions, setViewingReactions] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchInstrumentals()
    fetchAlbums()
  }, [filterArchived, searchTerm])

  const fetchAlbums = async () => {
    try {
      const response = await axios.get('/api/admin/albums')
      setAlbums(response.data)
    } catch (err) {
      console.error('Error fetching albums:', err)
    }
  }

  const fetchInstrumentals = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get('/api/admin/instrumentals', {
        params: { archived: filterArchived, search: searchTerm }
      })
      setInstrumentals(response.data.instrumentals || [])
    } catch (err) {
      console.error('Error fetching instrumentals:', err)
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
    uploadData.append('artist', formData.artist)
    uploadData.append('album', formData.album)
    uploadData.append('genre', formData.genre)
    if (formData.album_id) uploadData.append('album_id', formData.album_id)
    if (musicFile) uploadData.append('musicFile', musicFile)
    if (coverFile) uploadData.append('coverImage', coverFile)

    try {
      await axios.post('/api/admin/instrumentals', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setShowUploadModal(false)
      setFormData({ title: '', artist: '', album: '', genre: '', album_id: '' })
      setMusicFile(null)
      setCoverFile(null)
      fetchInstrumentals()
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const toggleSelectInstrumental = (instrumentalId) => {
    setSelectedInstrumentals(prev => 
      prev.includes(instrumentalId) 
        ? prev.filter(id => id !== instrumentalId)
        : [...prev, instrumentalId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedInstrumentals(prev => 
      prev.length === instrumentals.length 
        ? [] 
        : instrumentals.map(i => i.id)
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
          <FiMusic /> Instrumentals Management
        </h1>
        <p style={{ color: '#999', fontSize: isMobile ? '0.875rem' : '1rem' }}>Manage all your instrumental tracks</p>
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
            placeholder="Search instrumentals..."
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
          <FiUpload /> Upload Instrumental
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : instrumentals.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          No instrumentals found. Upload your first instrumental to get started!
        </div>
      ) : (
        <>
          {instrumentals.length > 0 && (
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
                checked={selectedInstrumentals.length === instrumentals.length && instrumentals.length > 0}
                onChange={toggleSelectAll}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ color: '#fff', fontSize: '0.875rem' }}>
                Select All ({instrumentals.length} {instrumentals.length === 1 ? 'instrumental' : 'instrumentals'})
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
            {instrumentals.map(instrumental => (
              <InstrumentalCard
                key={instrumental.id}
                instrumental={instrumental}
                playSong={playSong}
                onEdit={(instrumental) => {
                  setEditingInstrumental(instrumental)
                  setFormData({
                    title: instrumental.title,
                    artist: instrumental.artist,
                    album: instrumental.album || '',
                    genre: instrumental.genre || '',
                    album_id: instrumental.album_id || ''
                  })
                }}
                onArchive={(id, archived) => {
                  axios.patch(`/api/admin/songs/${id}/archive`, { archived })
                    .then(() => fetchInstrumentals())
                }}
                onDelete={(id) => {
                  if (confirm('Delete this instrumental?')) {
                    axios.delete(`/api/admin/songs/${id}`)
                      .then(() => fetchInstrumentals())
                  }
                }}
                onSelect={toggleSelectInstrumental}
                isSelected={selectedInstrumentals.includes(instrumental.id)}
                onViewReactions={(instrumental) => {
                  setViewingReactions({
                    contentType: 'song',
                    contentId: instrumental.id,
                    contentTitle: `${instrumental.title} - ${instrumental.artist}`
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
          musicFile={musicFile}
          setMusicFile={setMusicFile}
          coverFile={coverFile}
          setCoverFile={setCoverFile}
          albums={albums}
          onSubmit={handleUpload}
          isUploading={isUploading}
          onClose={() => {
            setShowUploadModal(false)
            setFormData({ title: '', artist: '', album: '', genre: '', album_id: '' })
            setMusicFile(null)
            setCoverFile(null)
          }}
        />
      )}

      {editingInstrumental && (
        <EditModal
          instrumental={editingInstrumental}
          formData={formData}
          setFormData={setFormData}
          albums={albums}
          onSubmit={async (e) => {
            e.preventDefault()
            try {
              await axios.put(`/api/admin/songs/${editingInstrumental.id}`, formData)
              setEditingInstrumental(null)
              setFormData({ title: '', artist: '', album: '', genre: '', album_id: '' })
              fetchInstrumentals()
            } catch (err) {
              alert('Update failed')
            }
          }}
          onClose={() => {
            setEditingInstrumental(null)
            setFormData({ title: '', artist: '', album: '', genre: '', album_id: '' })
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

const InstrumentalCard = ({ instrumental, playSong, onEdit, onArchive, onDelete, onSelect, isSelected, onViewReactions }) => (
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
      onChange={() => onSelect(instrumental.id)}
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
      background: instrumental.cover_image_path ? `url(${import.meta.env.VITE_API_URL || ''}${instrumental.cover_image_path})` : '#2a2a2a',
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
      {!instrumental.cover_image_path && <FiMusic />}
    </div>
    <h3 style={{ marginBottom: '0.25rem' }}>{instrumental.title}</h3>
    <p style={{ color: '#999', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{instrumental.artist}</p>
    {instrumental.album && <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{instrumental.album}</p>}
    {instrumental.play_count !== undefined && (
      <p style={{ color: '#667eea', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
        {instrumental.play_count.toLocaleString()} {instrumental.play_count === 1 ? 'play' : 'plays'}
      </p>
    )}
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
      <button
        onClick={() => playSong(instrumental, [instrumental])}
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
        <FiPlay /> Play
      </button>
      <button
        onClick={() => onViewReactions && onViewReactions(instrumental)}
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
        onClick={() => onEdit(instrumental)}
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
        onClick={() => onArchive(instrumental.id, !instrumental.is_archived)}
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
        <FiArchive /> {instrumental.is_archived ? 'Unarchive' : 'Archive'}
      </button>
      <button
        onClick={() => onDelete(instrumental.id)}
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

// Reuse modals from Songs.jsx - simplified versions
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

const UploadModal = ({ formData, setFormData, musicFile, setMusicFile, coverFile, setCoverFile, albums, onSubmit, onClose, isUploading }) => (
  <Modal>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <h2>Upload Instrumental</h2>
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.5rem' }}>
        <FiX />
      </button>
    </div>
    <form onSubmit={onSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>Title *</label>
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
            borderRadius: '6px',
            color: '#fff'
          }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>Artist *</label>
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
            borderRadius: '6px',
            color: '#fff'
          }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>Album</label>
        <input
          type="text"
          value={formData.album}
          onChange={(e) => setFormData({ ...formData, album: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#2a2a2a',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#fff'
          }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>Genre</label>
        <input
          type="text"
          value={formData.genre}
          onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#2a2a2a',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#fff'
          }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>Music File *</label>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setMusicFile(e.target.files[0])}
          disabled={isUploading}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#2a2a2a',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#fff'
          }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>Cover Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files[0])}
          disabled={isUploading}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#2a2a2a',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#fff'
          }}
        />
      </div>
      <button
        type="submit"
        disabled={isUploading}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: '#667eea',
          border: 'none',
          borderRadius: '6px',
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
        {isUploading ? (
          <>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid #fff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            Uploading...
          </>
        ) : (
          'Upload'
        )}
      </button>
    </form>
  </Modal>
)

const EditModal = ({ instrumental, formData, setFormData, albums, onSubmit, onClose }) => (
  <Modal>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <h2>Edit Instrumental</h2>
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.5rem' }}>
        <FiX />
      </button>
    </div>
    <form onSubmit={onSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>Title</label>
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
            borderRadius: '6px',
            color: '#fff'
          }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>Artist</label>
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
            borderRadius: '6px',
            color: '#fff'
          }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>Album</label>
        <input
          type="text"
          value={formData.album}
          onChange={(e) => setFormData({ ...formData, album: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#2a2a2a',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#fff'
          }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>Genre</label>
        <input
          type="text"
          value={formData.genre}
          onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#2a2a2a',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#fff'
          }}
        />
      </div>
      <button
        type="submit"
        style={{
          width: '100%',
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
        Update
      </button>
    </form>
  </Modal>
)

export default Instrumentals

