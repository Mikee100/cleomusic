import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import SubscriptionModal from '../components/SubscriptionModal'
import Interactions from '../components/Interactions'
import { FiImage, FiSearch, FiX } from 'react-icons/fi'

const Photos = () => {
  const { user, subscription } = useAuth()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  useEffect(() => {
    if (subscription || user?.role === 'admin') {
      fetchPhotos()
    } else {
      setLoading(false)
    }
  }, [subscription, user, searchTerm])

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

  if (!subscription && user?.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h1 style={{ marginBottom: '1rem', fontSize: '2rem' }}>Photos Gallery</h1>
        <p style={{ marginBottom: '2rem', color: '#999' }}>Subscribe to access our photo gallery</p>
        <button
          onClick={() => setShowSubscriptionModal(true)}
          style={{
            padding: '1rem 2rem',
            background: '#667eea',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          View Subscription Plans
        </button>
        {showSubscriptionModal && (
          <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiImage /> Photos Gallery
        </h1>
        <p style={{ color: '#999' }}>Browse our collection of photos</p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
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
                transition: 'transform 0.2s, box-shadow 0.2s'
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
              <div style={{
                width: '100%',
                aspectRatio: '1',
                background: photo.file_path ? `url(http://localhost:5000${photo.file_path})` : '#2a2a2a',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }} />
              <div style={{ padding: '1rem' }}>
                <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>{photo.title}</h3>
                {photo.description && (
                  <p style={{ color: '#999', fontSize: '0.875rem', margin: 0, marginBottom: '0.5rem' }}>
                    {photo.description}
                  </p>
                )}
                <Interactions contentType="photo" contentId={photo.id} compact={true} />
              </div>
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

      {showSubscriptionModal && (
        <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />
      )}
    </div>
  )
}

const PhotoModal = ({ photo, onClose }) => (
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
      padding: '2rem',
      cursor: 'pointer'
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        maxWidth: '90vw',
        maxHeight: '90vh',
        position: 'relative'
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '-3rem',
          right: 0,
          background: 'transparent',
          border: 'none',
          color: '#fff',
          fontSize: '2rem',
          cursor: 'pointer',
          zIndex: 2001
        }}
      >
        <FiX />
      </button>
      <img
        src={`http://localhost:5000${photo.file_path}`}
        alt={photo.title}
        style={{
          maxWidth: '100%',
          maxHeight: '90vh',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}
      />
      <div style={{
        background: '#1a1a1a',
        padding: '1.5rem',
        borderRadius: '0 0 8px 8px',
        marginTop: '-4px'
      }}>
        <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>{photo.title}</h3>
        {photo.description && (
          <p style={{ color: '#999', margin: 0, marginBottom: '1rem' }}>{photo.description}</p>
        )}
        <Interactions contentType="photo" contentId={photo.id} compact={false} />
      </div>
    </div>
  </div>
)

export default Photos

