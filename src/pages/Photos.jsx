import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import Interactions from '../components/Interactions'
import { useResponsive } from '../hooks/useResponsive'
import { FiImage, FiSearch, FiX, FiMaximize2 } from 'react-icons/fi'

const Photos = () => {
  const { user } = useAuth()
  const { isMobile } = useResponsive()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  useEffect(() => {
    fetchPhotos()
  }, [user, searchTerm])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/photos', {
        params: { search: searchTerm, limit: 50 }
      })
      setPhotos(response.data.photos || [])
    } catch (err) {
      console.error('Error fetching photos:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: isMobile ? '1rem' : '2rem' }}>
      <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
        <h1 style={{ 
          fontSize: isMobile ? '1.5rem' : '2rem', 
          marginBottom: '0.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem' 
        }}>
          <FiImage /> Photos Gallery
        </h1>
        <p style={{ color: '#999', fontSize: isMobile ? '0.875rem' : '1rem' }}>Browse our collection of photos</p>
      </div>

      <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
        <div style={{ position: 'relative', maxWidth: '500px' }}>
          <FiSearch style={{ 
            position: 'absolute', 
            left: '1rem', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#666'
          }} />
          <input
            type="text"
            placeholder="Search photos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 3rem',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem'
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>
      ) : photos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
          No photos found.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile 
            ? 'repeat(auto-fill, minmax(150px, 1fr))' 
            : 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: isMobile ? '0.75rem' : '1.5rem'
        }}>
          {photos.map(photo => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              style={{
                background: '#1a1a1a',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #333',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div 
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  background: photo.file_path ? `url(${import.meta.env.VITE_API_URL || ''}${photo.file_path})` : '#2a2a2a',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  const overlay = e.currentTarget.querySelector('.photo-hover-overlay')
                  if (overlay) overlay.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  const overlay = e.currentTarget.querySelector('.photo-hover-overlay')
                  if (overlay) overlay.style.opacity = '0'
                }}
              >
                {/* Hover overlay with view icon */}
                <div 
                  className="photo-hover-overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    pointerEvents: 'none'
                  }}
                >
                  <FiMaximize2 style={{ fontSize: '2rem', color: '#fff' }} />
                </div>
              </div>
              {!isMobile && (
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '0.875rem' }}>{photo.title}</h3>
                  {photo.description && (
                    <p style={{ 
                      color: '#999', 
                      fontSize: '0.75rem', 
                      margin: 0, 
                      marginBottom: '0.5rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {photo.description}
                    </p>
                  )}
                  <Interactions contentType="photo" contentId={photo.id} compact={true} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  )
}

const PhotoModal = ({ photo, onClose }) => {
  const { isMobile } = useResponsive()
  
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: isMobile ? '1rem' : '2rem',
        cursor: 'pointer'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '95vw',
          maxHeight: '95vh',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Photo container */}
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: '8px',
          position: 'relative'
        }}>
          {/* Close button - Inside the image container, top right corner */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: isMobile ? '10px' : '15px',
              right: isMobile ? '10px' : '15px',
              background: 'rgba(0, 0, 0, 0.7)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              color: '#fff',
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              cursor: 'pointer',
              zIndex: 2001,
              width: isMobile ? '40px' : '48px',
              height: isMobile ? '40px' : '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
            title="Close"
          >
            <FiX />
          </button>
          
          <img
            src={`${import.meta.env.VITE_API_URL || ''}${photo.file_path}`}
            alt={photo.title}
            style={{
              maxWidth: '100%',
              maxHeight: isMobile ? '70vh' : '85vh',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}
          />
        </div>
        
        {/* Photo info - Below image */}
        <div style={{
          background: '#1a1a1a',
          padding: isMobile ? '1rem' : '1.5rem',
          borderRadius: '0 0 8px 8px',
          marginTop: '0.5rem',
          width: '100%',
          maxWidth: '100%'
        }}>
          <h3 style={{ 
            margin: 0, 
            marginBottom: '0.5rem',
            fontSize: isMobile ? '1rem' : '1.25rem'
          }}>
            {photo.title}
          </h3>
          {photo.description && (
            <p style={{ 
              color: '#999', 
              margin: 0, 
              marginBottom: '1rem',
              fontSize: isMobile ? '0.875rem' : '1rem',
              lineHeight: '1.5'
            }}>
              {photo.description}
            </p>
          )}
          <Interactions contentType="photo" contentId={photo.id} compact={false} />
        </div>
      </div>
    </div>
  )
}

export default Photos

