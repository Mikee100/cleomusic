import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDownloads } from '../context/DownloadsContext'
import { usePlayer } from '../context/PlayerContext'
import { useResponsive } from '../hooks/useResponsive'
import { API_URL } from '../utils/api'
import { FiDownload, FiMusic, FiVideo, FiTrash2 } from 'react-icons/fi'
import { usePrefetch } from '../hooks/usePrefetch'

const Downloads = () => {
  const { user } = useAuth()
  const { songs, videos, removeDownload } = useDownloads()
  const { playSong } = usePlayer()
  const { isMobile } = useResponsive()
  const navigate = useNavigate()
  const { prefetchMedia } = usePrefetch()

  const handlePlaySong = (song) => {
    navigate(`/song/${song.id}`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#fff'
        }}>
          <FiDownload /> Offline Downloads
        </h1>
        <p style={{ marginBottom: '1.5rem', color: '#9CA3AF', fontSize: isMobile ? '0.85rem' : '0.95rem' }}>
          These songs and videos are marked for offline in‑app listening on this device. They stay inside Cleo Music and don&apos;t create files in your device storage.
        </p>

        {/* Songs */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#E5E7EB' }}>Songs</h2>
          {songs.length === 0 ? (
            <div style={{ padding: '1rem', color: '#6B7280', fontSize: '0.9rem', background: '#111827', borderRadius: '8px' }}>
              No downloaded songs yet. Use the Download button in the player while listening.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1rem'
            }}>
              {songs.map((song) => (
                <div
                  key={`song-${song.id}`}
                  onClick={() => handlePlaySong(song)}
                  style={{
                    background: '#111827',
                    borderRadius: '10px',
                    border: '1px solid #1f2937',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s, transform 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1f2937'
                    e.currentTarget.style.transform = 'translateY(-2px)'

                    // Prefetch media files on hover
                    if (song.file_path) prefetchMedia(song.file_path, 'audio')
                    if (song.background_video_path) prefetchMedia(song.background_video_path, 'video')
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#111827'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '8px',
                    background: song.cover_image_path
                      ? `url(${API_URL}${song.cover_image_path})`
                      : '#020617',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6B7280',
                    flexShrink: 0
                  }}>
                    {!song.cover_image_path && <FiMusic />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: '#F9FAFB',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {song.title}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#9CA3AF',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {song.artist}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeDownload('song', song.id)
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                    title="Remove from downloads"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Videos */}
        <section>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#E5E7EB' }}>Videos</h2>
          {videos.length === 0 ? (
            <div style={{ padding: '1rem', color: '#6B7280', fontSize: '0.9rem', background: '#111827', borderRadius: '8px' }}>
              No downloaded videos yet. Use the download option from the videos section.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1rem'
            }}>
              {videos.map((video) => (
                <div
                  key={`video-${video.id}`}
                  style={{
                    background: '#111827',
                    borderRadius: '10px',
                    border: '1px solid #1f2937',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '8px',
                    background: '#020617',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6B7280',
                    flexShrink: 0
                  }}>
                    <FiVideo />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: '#F9FAFB',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {video.title || 'Video'}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#9CA3AF',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      Saved for offline in‑app viewing
                    </div>
                  </div>
                  <button
                    onClick={() => removeDownload('video', video.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                    title="Remove from downloads"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Downloads


