import { useState } from 'react'
import SubscriptionModal from './SubscriptionModal'
import { FiX, FiZap, FiMusic, FiVideo } from 'react-icons/fi'

const UpgradeInterruptionModal = ({ onClose, onUpgrade, contentType = 'content' }) => {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  const handleUpgrade = () => {
    setShowSubscriptionModal(true)
  }

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionModal(false)
    if (onUpgrade) {
      onUpgrade()
    }
    onClose()
  }

  const getContentIcon = () => {
    switch (contentType) {
      case 'song':
      case 'music':
        return <FiMusic size={48} />
      case 'video':
        return <FiVideo size={48} />
      default:
        return <FiZap size={48} />
    }
  }

  const getContentTypeName = () => {
    switch (contentType) {
      case 'song':
      case 'music':
        return 'song'
      case 'video':
        return 'video'
      default:
        return 'content'
    }
  }

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
        padding: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2a 0%, #2a1a3a 100%)',
          borderRadius: '20px',
          padding: '3rem',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          border: '2px solid #667eea',
          boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3)',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
            title="Continue with free version"
          >
            <FiX />
          </button>

          <div style={{
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              margin: '0 auto'
            }}>
              {getContentIcon()}
            </div>
          </div>

          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: '#fff'
          }}>
            Upgrade to Continue
          </h2>

          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            You've reached the free version limit. Upgrade your package to enjoy uninterrupted {getContentTypeName()} playback and access all premium features.
          </p>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#fff'
            }}>
              Premium Benefits:
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              textAlign: 'left',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#667eea', fontSize: '1.25rem' }}>✓</span>
                Unlimited playback without interruptions
              </li>
              <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#667eea', fontSize: '1.25rem' }}>✓</span>
                Access to all songs, videos, and instrumentals
              </li>
              <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#667eea', fontSize: '1.25rem' }}>✓</span>
                High-quality audio and video streaming
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#667eea', fontSize: '1.25rem' }}>✓</span>
                Ad-free experience
              </li>
            </ul>
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row'
          }}>
            <button
              onClick={handleUpgrade}
              style={{
                flex: 1,
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
            >
              Upgrade Now
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '1rem 2rem',
                background: 'transparent',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              }}
            >
              Continue Free
            </button>
          </div>
        </div>
      </div>

      {showSubscriptionModal && (
        <SubscriptionModal
          onClose={() => setShowSubscriptionModal(false)}
          onSuccess={handleSubscriptionSuccess}
        />
      )}
    </>
  )
}

export default UpgradeInterruptionModal

