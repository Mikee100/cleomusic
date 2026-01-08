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
    const size = window.innerWidth < 768 ? 32 : 40
    switch (contentType) {
      case 'song':
      case 'music':
        return <FiMusic size={size} />
      case 'video':
        return <FiVideo size={size} />
      default:
        return <FiZap size={size} />
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
      {!showSubscriptionModal && (
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
          padding: '0.75rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2a 0%, #2a1a3a 100%)',
            borderRadius: '16px',
            padding: window.innerWidth < 768 ? '1rem' : '1.75rem',
            maxWidth: '360px',
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

            <h2 style={{
              fontSize: window.innerWidth < 768 ? '1.5rem' : '2rem',
              fontWeight: 'bold',
              marginBottom: window.innerWidth < 768 ? '0.5rem' : '0.75rem',
              color: '#fff'
            }}>
              Upgrade to Continue
            </h2>

            <p style={{
              fontSize: window.innerWidth < 768 ? '0.95rem' : '1.05rem',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '1rem',
              lineHeight: '1.5'
            }}>
              Preview ended. Subscribe to keep listening to this {getContentTypeName()} and the rest of the queue without interruptions.
            </p>

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
      )}

      {showSubscriptionModal && (
        <SubscriptionModal
          onClose={() => {
            // User dismissed payment plans – hide and move on
            setShowSubscriptionModal(false)
            onClose()
          }}
          onSuccess={handleSubscriptionSuccess}
        />
      )}
    </>
  )
}

export default UpgradeInterruptionModal

