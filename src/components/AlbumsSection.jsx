import { FiMusic } from 'react-icons/fi'
import { useResponsive } from '../hooks/useResponsive'

const AlbumsSection = ({ albums }) => {
  const { isMobile } = useResponsive()
  
  if (!albums || albums.length === 0) return null

  return (
    <section style={{
      padding: isMobile ? '2rem 1rem' : '4rem 2rem',
      background: 'linear-gradient(to bottom, #0a0a0a, #1a1a1a)'
    }}>
      <h2 style={{
        fontSize: isMobile ? '1.75rem' : '2.5rem',
        fontWeight: 'bold',
        marginBottom: isMobile ? '1rem' : '2rem',
        color: '#fff'
      }}>
        Albums
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile 
          ? 'repeat(2, 1fr)' 
          : 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: isMobile ? '1rem' : '2rem',
        overflowX: 'auto'
      }}>
        {albums.slice(0, 6).map((album) => (
          <div
            key={album.id}
            style={{
              background: '#1a1a1a',
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.3s, box-shadow 0.3s',
              border: '1px solid #333'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)'
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{
              width: '100%',
              aspectRatio: '1',
              background: album.cover_image_path
                ? `url(${import.meta.env.VITE_API_URL || ''}${album.cover_image_path})`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              color: '#fff'
            }}>
              {!album.cover_image_path && <FiMusic />}
            </div>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {album.name}
              </h3>
              <p style={{
                color: '#999',
                fontSize: '0.875rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {album.artist || 'Artist'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default AlbumsSection

