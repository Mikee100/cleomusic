import { useState, useEffect, useRef } from 'react'
import { FiMusic, FiChevronLeft, FiChevronRight, FiPlay } from 'react-icons/fi'
import { useResponsive } from '../hooks/useResponsive'

const HeroSection = ({ artistInfo }) => {
  const { isMobile } = useResponsive()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const carouselIntervalRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  // High-quality music/concert images similar to Red Bull style
  const carouselImages = [
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501281668745-f7f57025e20d?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&h=1080&fit=crop&q=80'
  ]

  useEffect(() => {
    if (!isHovered) {
      // Auto-rotate carousel
      carouselIntervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length)
      }, 6000)
    }

    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current)
      }
    }
  }, [isHovered])

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length)
    resetInterval()
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
    resetInterval()
  }

  const resetInterval = () => {
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current)
      carouselIntervalRef.current = null
    }
  }

  const goToImage = (index) => {
    setCurrentImageIndex(index)
    resetInterval()
  }

  return (
    <section 
      style={{
        position: 'relative',
        height: isMobile ? '70vh' : '100vh',
        minHeight: isMobile ? '500px' : '700px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: isMobile ? '1rem' : '5%',
        paddingRight: isMobile ? '1rem' : '5%',
        paddingTop: isMobile ? '2rem' : '0'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Images with smooth transitions */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1
      }}>
        {carouselImages.map((image, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
              opacity: index === currentImageIndex ? 1 : 0,
              transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 1,
              transform: index === currentImageIndex ? 'scale(1)' : 'scale(1.1)',
              filter: 'brightness(0.7)'
            }}
          />
        ))}
        {/* Gradient overlay - Red Bull style */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.6) 100%)',
          zIndex: 2
        }} />
      </div>

      {/* Image Selector Buttons - Red Bull style side buttons */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          right: '3rem',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          zIndex: 10
        }}>
        {carouselImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            style={{
              width: '12px',
              height: index === currentImageIndex ? '60px' : '12px',
              borderRadius: '6px',
              background: index === currentImageIndex ? '#fff' : 'rgba(255,255,255,0.4)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              if (index !== currentImageIndex) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.6)'
              }
            }}
            onMouseLeave={(e) => {
              if (index !== currentImageIndex) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.4)'
              }
            }}
          />
        ))}
        </div>
      )}

      {/* Navigation Arrows */}
      {!isMobile && (
        <>
          <button
            onClick={prevImage}
            style={{
              position: 'absolute',
              left: '3rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              color: '#fff',
              fontSize: '1.5rem',
              cursor: 'pointer',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
        }}
      >
            <FiChevronLeft />
          </button>
          <button
            onClick={nextImage}
            style={{
              position: 'absolute',
              right: '3rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              color: '#fff',
              fontSize: '1.5rem',
              cursor: 'pointer',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              marginRight: '4rem' // Make room for image selector
            }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
        }}
      >
            <FiChevronRight />
          </button>
        </>
      )}

      {/* Hero Content - Red Bull style left-aligned */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        color: '#fff',
        maxWidth: isMobile ? '100%' : '600px',
        textAlign: isMobile ? 'center' : 'left'
      }}>
        {/* Badge/Tag */}
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          padding: '0.5rem 1.5rem',
          borderRadius: '50px',
          fontSize: '0.875rem',
          fontWeight: '600',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '2rem',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          Music Platform
        </div>

        <h1 style={{
          fontSize: 'clamp(3rem, 8vw, 6rem)',
          fontWeight: '900',
          marginBottom: '1.5rem',
          lineHeight: '1.1',
          letterSpacing: '-0.03em',
          textShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          {artistInfo.name}
        </h1>
        
        <p style={{
          fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
          marginBottom: '2rem',
          opacity: 0.95,
          lineHeight: '1.4',
          fontWeight: '300',
          textShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          {artistInfo.tagline}
        </p>

        <p style={{
          fontSize: '1.1rem',
          opacity: 0.85,
          lineHeight: '1.7',
          marginBottom: '3rem',
          maxWidth: '500px',
          fontWeight: '300'
        }}>
          {artistInfo.description}
        </p>

        {/* CTA Button - Red Bull style */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '1rem' : '1.5rem', 
          alignItems: 'center' 
        }}>
          <button
            style={{
              background: '#fff',
              color: '#000',
              border: 'none',
              padding: isMobile ? '0.875rem 2rem' : '1rem 2.5rem',
              borderRadius: '50px',
              fontSize: isMobile ? '0.875rem' : '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              width: isMobile ? '100%' : 'auto',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f0f0'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'
            }}
          >
            <FiPlay style={{ fontSize: '1.25rem' }} />
            Explore Music
          </button>
          
          <button
            style={{
              background: 'transparent',
              color: '#fff',
              border: '2px solid rgba(255,255,255,0.5)',
              padding: isMobile ? '0.875rem 2rem' : '1rem 2.5rem',
              borderRadius: '50px',
              fontSize: isMobile ? '0.875rem' : '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              backdropFilter: 'blur(10px)',
              width: isMobile ? '100%' : 'auto'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'
            }}
          >
            Learn More
          </button>
        </div>
      </div>

      {/* Bottom indicator showing current image number */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          left: '3rem',
          zIndex: 10,
          color: '#fff',
          fontSize: '0.875rem',
          fontWeight: '600',
          opacity: 0.7,
          letterSpacing: '0.1em'
        }}>
          {String(currentImageIndex + 1).padStart(2, '0')} / {String(carouselImages.length).padStart(2, '0')}
        </div>
      )}
    </section>
  )
}

export default HeroSection
