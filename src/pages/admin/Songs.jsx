import { useState, useEffect } from 'react'
import axios from 'axios'
import { usePlayer } from '../../context/PlayerContext'
import ReactionsModal from '../../components/ReactionsModal'
import AdminErrorBanner, { getAdminErrorMessage } from '../../components/AdminErrorBanner'
import { useResponsive } from '../../hooks/useResponsive'
import { 
  FiUpload, FiArchive, FiTrash2, FiEdit, FiMusic, FiPlay, 
  FiCheckSquare, FiSearch, FiX, FiMessageCircle, FiLoader
} from 'react-icons/fi'

const Songs = () => {
  const { playSong } = usePlayer()
  const { isMobile } = useResponsive()
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingSong, setEditingSong] = useState(null)
  const [selectedSongs, setSelectedSongs] = useState([])
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
  const [backgroundVideoFile, setBackgroundVideoFile] = useState(null)
  const [viewingReactions, setViewingReactions] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchSongs()
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

  const fetchSongs = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get('/api/admin/songs', {
        params: { archived: filterArchived, search: searchTerm }
      })
      setSongs(response.data.songs)
    } catch (err) {
      console.error('Error fetching songs:', err)
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
    if (backgroundVideoFile) uploadData.append('backgroundVideo', backgroundVideoFile)

    try {
      await axios.post('/api/admin/songs', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setShowUploadModal(false)
      setFormData({ title: '', artist: '', album: '', genre: '', album_id: '' })
      setMusicFile(null)
      setCoverFile(null)
      setBackgroundVideoFile(null)
      fetchSongs()
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleBulkArchive = async (archived) => {
    if (selectedSongs.length === 0) return
    try {
      await axios.patch('/api/admin/songs/bulk', { songIds: selectedSongs, archived })
      setSelectedSongs([])
      fetchSongs()
    } catch (err) {
      alert('Bulk operation failed')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedSongs.length === 0 || !confirm(`Delete ${selectedSongs.length} songs?`)) return
    try {
      await axios.delete('/api/admin/songs/bulk', { data: { songIds: selectedSongs } })
      setSelectedSongs([])
      fetchSongs()
    } catch (err) {
      alert('Bulk delete failed')
    }
  }

  const toggleSelectSong = (songId) => {
    setSelectedSongs(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedSongs(prev => 
      prev.length === songs.length 
        ? [] 
        : songs.map(s => s.id)
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
          <FiMusic /> Songs Management
        </h1>
        <p style={{ color: '#999', fontSize: isMobile ? '0.875rem' : '1rem' }}>Manage all your songs</p>
      </div>

      <AdminErrorBanner error={error} onRetry={() => { setError(null); fetchSongs() }} />
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
            placeholder="Search songs..."
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
          <FiUpload /> Upload Song
        </button>
      </div>

      {selectedSongs.length > 0 && (
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
            {selectedSongs.length} selected
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
            onClick={() => setSelectedSongs([])}
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
      ) : songs.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          No songs found. Upload your first song to get started!
        </div>
      ) : (
        <>
          {songs.length > 0 && (
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
                checked={selectedSongs.length === songs.length && songs.length > 0}
                onChange={toggleSelectAll}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ color: '#fff', fontSize: '0.875rem' }}>
                Select All ({songs.length} {songs.length === 1 ? 'song' : 'songs'})
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
            {songs.map(song => (
            <SongCard
              key={song.id}
              song={song}
              playSong={playSong}
              onEdit={(song) => {
                setEditingSong(song)
                setFormData({
                  title: song.title,
                  artist: song.artist,
                  album: song.album || '',
                  genre: song.genre || '',
                  album_id: song.album_id || ''
                })
              }}
              onArchive={(id, archived) => {
                axios.patch(`/api/admin/songs/${id}/archive`, { archived })
                  .then(() => fetchSongs())
              }}
              onDelete={(id) => {
                if (confirm('Delete this song?')) {
                  axios.delete(`/api/admin/songs/${id}`)
                    .then(() => fetchSongs())
                }
              }}
              onSelect={toggleSelectSong}
              isSelected={selectedSongs.includes(song.id)}
              onViewReactions={(song) => {
                setViewingReactions({
                  contentType: 'song',
                  contentId: song.id,
                  contentTitle: `${song.title} - ${song.artist}`
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
          backgroundVideoFile={backgroundVideoFile}
          setBackgroundVideoFile={setBackgroundVideoFile}
          albums={albums}
          onSubmit={handleUpload}
          isUploading={isUploading}
          onClose={() => {
            setShowUploadModal(false)
            setFormData({ title: '', artist: '', album: '', genre: '', album_id: '' })
            setMusicFile(null)
            setCoverFile(null)
            setBackgroundVideoFile(null)
          }}
        />
      )}

      {editingSong && (
        <EditModal
          song={editingSong}
          formData={formData}
          setFormData={setFormData}
          albums={albums}
          onSubmit={async (e) => {
            e.preventDefault()
            try {
              const updateData = new FormData()
              updateData.append('title', formData.title)
              updateData.append('artist', formData.artist)
              updateData.append('genre', formData.genre || '')
              if (formData.album_id) updateData.append('album_id', formData.album_id)
              if (coverFile) updateData.append('coverImage', coverFile)
              if (backgroundVideoFile) updateData.append('backgroundVideo', backgroundVideoFile)

              await axios.put(`/api/admin/songs/${editingSong.id}`, updateData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              })
              setEditingSong(null)
              setFormData({ title: '', artist: '', album: '', genre: '', album_id: '' })
              setCoverFile(null)
              setBackgroundVideoFile(null)
              fetchSongs()
            } catch (err) {
              alert(err.response?.data?.error || 'Update failed')
            }
          }}
          onClose={() => {
            setEditingSong(null)
            setFormData({ title: '', artist: '', album: '', genre: '', album_id: '' })
            setCoverFile(null)
            setBackgroundVideoFile(null)
          }}
          coverFile={coverFile}
          setCoverFile={setCoverFile}
          backgroundVideoFile={backgroundVideoFile}
          setBackgroundVideoFile={setBackgroundVideoFile}
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

const SongCard = ({ song, playSong, onEdit, onArchive, onDelete, onSelect, isSelected, onViewReactions }) => (
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
      onChange={() => onSelect(song.id)}
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
      background: song.cover_image_path ? `url(${import.meta.env.VITE_API_URL || ''}${song.cover_image_path})` : '#2a2a2a',
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
      {!song.cover_image_path && <FiMusic />}
    </div>
    <h3 style={{ marginBottom: '0.25rem' }}>{song.title}</h3>
    <p style={{ color: '#999', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{song.artist}</p>
    {song.album && <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{song.album}</p>}
    {song.play_count !== undefined && (
      <p style={{ color: '#667eea', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
        {song.play_count.toLocaleString()} {song.play_count === 1 ? 'play' : 'plays'}
      </p>
    )}
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
      <button
        onClick={() => playSong(song, [song])}
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
        onClick={() => onViewReactions && onViewReactions(song)}
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
        onClick={() => onEdit(song)}
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
        onClick={() => onArchive(song.id, !song.is_archived)}
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
        <FiArchive /> {song.is_archived ? 'Unarchive' : 'Archive'}
      </button>
      <button
        onClick={() => onDelete(song.id)}
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

const UploadModal = ({ formData, setFormData, musicFile, setMusicFile, coverFile, setCoverFile, backgroundVideoFile, setBackgroundVideoFile, albums, onSubmit, onClose, isUploading }) => (
  <Modal>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <h2>Upload Song</h2>
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
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Album (or select existing)</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={formData.album}
            onChange={(e) => setFormData({ ...formData, album: e.target.value, album_id: '' })}
            placeholder="New album name"
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <select
            value={formData.album_id}
            onChange={(e) => setFormData({ ...formData, album_id: e.target.value, album: '' })}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <option value="">Select existing album</option>
            {albums.map(album => (
              <option key={album.id} value={album.id}>{album.name} - {album.artist}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: '1rem' }}>
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
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Music File *</label>
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
            borderRadius: '8px',
            color: '#fff'
          }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Cover Image</label>
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
            borderRadius: '8px',
            color: '#fff'
          }}
        />
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Background Video (Optional)</label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setBackgroundVideoFile(e.target.files[0])}
          disabled={isUploading}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#2a2a2a',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff'
          }}
        />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#999' }}>
          Optional: Upload a video to play in the background while the song plays (like Spotify)
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

const EditModal = ({ song, formData, setFormData, albums, onSubmit, onClose, coverFile, setCoverFile, backgroundVideoFile, setBackgroundVideoFile }) => {
  const [coverPreview, setCoverPreview] = useState(song?.cover_image_path ? `${import.meta.env.VITE_API_URL || ''}${song.cover_image_path}` : null)
  const [videoPreview, setVideoPreview] = useState(song?.background_video_path ? `${import.meta.env.VITE_API_URL || ''}${song.background_video_path}` : null)

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

  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setBackgroundVideoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setVideoPreview(URL.createObjectURL(file))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Modal>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Edit Song</h2>
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
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Album</label>
          <select
            value={formData.album_id || ''}
            onChange={(e) => setFormData({ ...formData, album_id: e.target.value, album: '' })}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <option value="">No album</option>
            {albums.map(album => (
              <option key={album.id} value={album.id}>{album.name} - {album.artist}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Genre</label>
          <input
            type="text"
            value={formData.genre || ''}
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
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Cover Image</label>
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
            accept="image/*"
            onChange={handleCoverChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer'
            }}
          />
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#999' }}>
            Leave empty to keep current cover image
          </p>
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Background Video (Optional)</label>
          {videoPreview && (
            <div style={{ marginBottom: '0.75rem' }}>
              <video
                src={videoPreview}
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  maxHeight: '200px',
                  borderRadius: '8px',
                  border: '1px solid #333'
                }}
                controls
                muted
              />
            </div>
          )}
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer'
            }}
          />
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#999' }}>
            Optional: Upload a video to play in the background while the song plays. Leave empty to keep current video or remove if none exists.
          </p>
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
}

export default Songs

