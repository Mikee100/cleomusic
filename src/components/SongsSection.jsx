import { useState, useEffect } from 'react'
import { FiPlay, FiMusic, FiHeart, FiList } from 'react-icons/fi'
import Interactions from './Interactions'
import AddToPlaylistModal from './AddToPlaylistModal'
import { useResponsive } from '../hooks/useResponsive'

const SongsSection = ({ songs, favorites, loading, onPlaySong, onToggleFavorite }) => {
  const { isMobile } = useResponsive()
  const [addToPlaylistSongId, setAddToPlaylistSongId] = useState(null)
  
  return (
    <section style={{
      padding: isMobile ? '2rem 1rem' : '4rem 2rem',
      background: '#1a1a1a'
    }}>
      <h2 style={{
        fontSize: isMobile ? '1.75rem' : '2.5rem',
        fontWeight: 'bold',
        marginBottom: isMobile ? '1rem' : '2rem',
        color: '#fff'
      }}>
        Latest Songs
      </h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: isMobile ? '2rem' : '4rem', color: '#999' }}>Loading...</div>
      ) : songs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: isMobile ? '2rem' : '4rem', color: '#999' }}>No songs available</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile 
            ? 'repeat(2, 1fr)' 
            : 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: isMobile ? '0.75rem' : '1.5rem'
        }}>
          {songs.map((song) => (
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
              onClick={() => onPlaySong(song)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                display: 'flex',
                gap: '0.5rem',
                zIndex: 10
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setAddToPlaylistSongId(song.id)
                  }}
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#667eea',
                    fontSize: '1rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.8)'
                    e.currentTarget.style.transform = 'scale(1.1)'
                    e.currentTarget.style.color = '#fff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.6)'
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.color = '#667eea'
                  }}
                  title="Add to playlist"
                >
                  <FiList />
                </button>
                <button
                  onClick={(e) => onToggleFavorite(song.id, e)}
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: favorites.has(song.id) ? '#ef4444' : '#fff',
                    fontSize: '1rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.8)'
                    e.currentTarget.style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.6)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                  title="Add to favorites"
                >
                  <FiHeart style={{ fill: favorites.has(song.id) ? '#ef4444' : 'none' }} />
                </button>
              </div>
              <div style={{
                width: '100%',
                aspectRatio: '1',
                background: song.cover_image_path
                  ? `url(http://localhost:5000${song.cover_image_path})`
                  : '#2a2a2a',
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
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <FiPlay style={{ fontSize: '0.75rem' }} />
                  {song.play_count || 0}
                </div>
              </div>
              <h3 style={{
                marginBottom: '0.25rem',
                fontSize: '1rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: '#fff'
              }}>
                {song.title}
              </h3>
              <p style={{
                color: '#999',
                fontSize: '0.875rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: '0.25rem'
              }}>
                {song.artist}
              </p>
              {song.play_count > 0 && (
                <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  {song.play_count.toLocaleString()} {song.play_count === 1 ? 'play' : 'plays'}
                </p>
              )}
              <Interactions contentType="song" contentId={song.id} compact={true} />
            </div>
          ))}
        </div>
      )}

      {addToPlaylistSongId && (
        <AddToPlaylistModal
          songId={addToPlaylistSongId}
          onClose={() => setAddToPlaylistSongId(null)}
        />
      )}
    </section>
  )
}

export default SongsSection

