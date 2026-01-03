import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import SubscriptionModal from '../components/SubscriptionModal'
import Interactions from '../components/Interactions'
import { 
  FiVideo, FiX, FiHeart, FiMessageCircle, FiShare2, FiChevronUp, FiChevronDown, FiArrowLeft
} from 'react-icons/fi'
import { useResponsive } from '../hooks/useResponsive'

const Videos = () => {
  const { user, subscription } = useAuth()
  const { isMobile } = useResponsive()
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const containerRef = useRef(null)
  const videoRefs = useRef({})
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)
  const isScrolling = useRef(false)

  useEffect(() => {
    if (subscription || user?.role === 'admin') {
      fetchVideos()
    } else {
      setLoading(false)
    }
  }, [subscription, user])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/videos', {
        params: { limit: 100 }
      })
      setVideos(response.data.videos || [])
    } catch (err) {
      console.error('Error fetching videos:', err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-play current video and pause others
  useEffect(() => {
    videos.forEach((video, index) => {
      const videoElement = videoRefs.current[video.id]
      if (videoElement) {
        if (index === currentIndex) {
          videoElement.play().catch(() => {
            // Autoplay was prevented, user interaction required
          })
        } else {
          videoElement.pause()
        }
      }
    })
  }, [currentIndex, videos])

  // Handle scroll to snap to videos
  const handleScroll = useCallback(() => {
    if (isScrolling.current) return
    
    const container = containerRef.current
    if (!container) return

    const scrollTop = container.scrollTop
    const videoHeight = window.innerHeight
    const newIndex = Math.round(scrollTop / videoHeight)
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videos.length) {
      setCurrentIndex(newIndex)
    }
  }, [currentIndex, videos.length])

  // Smooth scroll to video
  const scrollToVideo = (index) => {
    if (index < 0 || index >= videos.length) return
    
    isScrolling.current = true
    const container = containerRef.current
    if (container) {
      container.scrollTo({
        top: index * window.innerHeight,
        behavior: 'smooth'
      })
    }
    
    setTimeout(() => {
      isScrolling.current = false
      setCurrentIndex(index)
    }, 500)
  }

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    touchEndY.current = e.changedTouches[0].clientY
    handleSwipe()
  }

  const handleSwipe = () => {
    const diff = touchStartY.current - touchEndY.current
    const minSwipeDistance = 50

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        // Swipe up - next video
        scrollToVideo(currentIndex + 1)
      } else {
        // Swipe down - previous video
        scrollToVideo(currentIndex - 1)
      }
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        scrollToVideo(currentIndex + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        scrollToVideo(currentIndex - 1)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, videos.length])

  if (!subscription && user?.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h1 style={{ marginBottom: '1rem', fontSize: '2rem' }}>Video Reels</h1>
        <p style={{ marginBottom: '2rem', color: '#999' }}>Subscribe to access our video reels</p>
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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#0a0a0a'
      }}>
        <div style={{ color: '#fff', fontSize: '1.2rem' }}>Loading videos...</div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '4rem', 
        color: '#666',
        background: '#0a0a0a',
        minHeight: '100vh'
      }}>
        <FiVideo style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }} />
        <h2>No videos found</h2>
        <p>Check back later for new content!</p>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000',
      overflow: 'hidden',
      touchAction: 'pan-y'
    }}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          height: '100vh',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none' // IE/Edge
        }}
        className="video-reel-container"
        onWheel={(e) => {
          // Prevent horizontal scrolling
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault()
          }
        }}
      >
        {videos.map((video, index) => (
          <VideoReelItem
            key={video.id}
            video={video}
            index={index}
            isActive={index === currentIndex}
            videoRef={(el) => {
              videoRefs.current[video.id] = el
            }}
            onNext={() => scrollToVideo(index + 1)}
            onPrevious={() => scrollToVideo(index - 1)}
            canGoNext={index < videos.length - 1}
            canGoPrevious={index > 0}
          />
        ))}
      </div>

      {/* Navigation indicators */}
      {!isMobile && videos.length > 1 && (
        <div style={{
          position: 'fixed',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <button
            onClick={() => scrollToVideo(currentIndex - 1)}
            disabled={currentIndex === 0}
            style={{
              padding: '0.75rem',
              background: currentIndex === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              color: '#fff',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: currentIndex === 0 ? 0.3 : 1,
              transition: 'all 0.2s'
            }}
          >
            <FiChevronUp size={24} />
          </button>
          <button
            onClick={() => scrollToVideo(currentIndex + 1)}
            disabled={currentIndex === videos.length - 1}
            style={{
              padding: '0.75rem',
              background: currentIndex === videos.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              color: '#fff',
              cursor: currentIndex === videos.length - 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: currentIndex === videos.length - 1 ? 0.3 : 1,
              transition: 'all 0.2s'
            }}
          >
            <FiChevronDown size={24} />
          </button>
        </div>
      )}

      {/* Back button and video counter */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.5)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="Go back"
        >
          <FiArrowLeft />
        </button>
        <div style={{
          background: 'rgba(0,0,0,0.5)',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          color: '#fff',
          fontSize: '0.875rem',
          backdropFilter: 'blur(10px)'
        }}>
          {currentIndex + 1} / {videos.length}
        </div>
      </div>

      {showSubscriptionModal && (
        <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />
      )}
    </div>
  )
}

const VideoReelItem = ({ video, index, isActive, videoRef, onNext, onPrevious, canGoNext, canGoPrevious }) => {
  const { isMobile } = useResponsive()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [showComments, setShowComments] = useState(false)
  const videoElementRef = useRef(null)

  useEffect(() => {
    if (videoRef) {
      videoRef(videoElementRef.current)
    }
  }, [videoRef])

  useEffect(() => {
    // Fetch interaction counts
    const fetchInteractions = async () => {
      try {
        const [likesRes, commentsRes] = await Promise.all([
          axios.get(`/api/interactions/video/${video.id}/likes`).catch(() => ({ data: { count: 0, liked: false } })),
          axios.get(`/api/interactions/video/${video.id}/comments`).catch(() => ({ data: { comments: [] } }))
        ])
        setLikeCount(likesRes.data.count || 0)
        setIsLiked(likesRes.data.liked || false)
        setCommentCount(commentsRes.data.comments?.length || 0)
      } catch (err) {
        console.error('Error fetching interactions:', err)
      }
    }
    if (isActive) {
      fetchInteractions()
    }
  }, [video.id, isActive])

  const handleLike = async (e) => {
    e.stopPropagation()
    try {
      const response = await axios.post(`/api/interactions/video/${video.id}/likes`)
      setIsLiked(response.data.liked)
      setLikeCount(prev => response.data.liked ? prev + 1 : prev - 1)
    } catch (err) {
      console.error('Error toggling like:', err)
    }
  }

  const handleVideoClick = () => {
    if (videoElementRef.current) {
      if (videoElementRef.current.paused) {
        videoElementRef.current.play()
      } else {
        videoElementRef.current.pause()
      }
    }
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        scrollSnapAlign: 'start',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000'
      }}
    >
      {/* Video */}
      <video
        ref={videoElementRef}
        src={`${import.meta.env.VITE_API_URL || ''}${video.file_path}`}
        loop
        muted={false}
        playsInline
        onClick={handleVideoClick}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          cursor: 'pointer'
        }}
      />

      {/* Overlay UI - Right side actions */}
      <div style={{
        position: 'absolute',
        right: isMobile ? '10px' : '20px',
        bottom: '100px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        zIndex: 10,
        alignItems: 'center'
      }}>
        {/* Like button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <button
            onClick={handleLike}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: isLiked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: isLiked ? '#ef4444' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isLiked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isLiked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <FiHeart style={{ fill: isLiked ? 'currentColor' : 'none' }} />
          </button>
          <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>
            {likeCount > 0 ? (likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount) : ''}
          </span>
        </div>

        {/* Comment button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowComments(!showComments)
            }}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: showComments ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = showComments ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <FiMessageCircle />
          </button>
          <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>
            {commentCount > 0 ? (commentCount > 999 ? `${(commentCount / 1000).toFixed(1)}K` : commentCount) : ''}
          </span>
        </div>

        {/* Share button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (navigator.share) {
              navigator.share({
                title: video.title,
                text: video.description,
                url: window.location.href
              }).catch(() => {})
            } else {
              navigator.clipboard.writeText(window.location.href)
              alert('Link copied to clipboard!')
            }
          }}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            transition: 'all 0.2s',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <FiShare2 />
        </button>
      </div>

      {/* Video info - Bottom left */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: isMobile ? '10px' : '20px',
        right: isMobile ? '80px' : '100px',
        zIndex: 10,
        color: '#fff',
        backdropFilter: 'blur(10px)',
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '1rem',
        borderRadius: '12px',
        maxWidth: '500px'
      }}>
        <h3 style={{ 
          margin: 0, 
          marginBottom: '0.5rem',
          fontSize: isMobile ? '1rem' : '1.25rem',
          fontWeight: 'bold'
        }}>
          {video.title}
        </h3>
        {video.description && (
          <p style={{ 
            margin: 0, 
            marginBottom: '0.5rem',
            fontSize: isMobile ? '0.875rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: '1.4'
          }}>
            {video.description}
          </p>
        )}
        {video.uploaded_by_name && (
          <p style={{ 
            margin: 0,
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            @{video.uploaded_by_name}
          </p>
        )}
      </div>

      {/* Comments panel */}
      {showComments && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(20px)',
          zIndex: 20,
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h4 style={{ margin: 0, color: '#fff' }}>Comments</h4>
            <button
              onClick={() => setShowComments(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '1.5rem',
                padding: '0.25rem'
              }}
            >
              <FiX />
            </button>
          </div>
          <CommentsPanel contentType="video" contentId={video.id} />
        </div>
      )}
    </div>
  )
}

const CommentsPanel = ({ contentType, contentId }) => {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComments()
  }, [contentId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/interactions/${contentType}/${contentId}/comments`)
      setComments(response.data.comments || [])
    } catch (err) {
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    try {
      setSubmitting(true)
      const response = await axios.post(`/api/interactions/${contentType}/${contentId}/comments`, {
        comment_text: newComment.trim()
      })
      setComments(prev => [response.data.comment, ...prev])
      setNewComment('')
    } catch (err) {
      console.error('Error adding comment:', err)
      alert('Failed to add comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return

    try {
      await axios.delete(`/api/interactions/comments/${commentId}`)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (err) {
      console.error('Error deleting comment:', err)
      alert('Failed to delete comment. Please try again.')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {user && (
        <form onSubmit={handleAddComment} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              resize: 'none',
              marginBottom: '0.75rem'
            }}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            style={{
              padding: '0.5rem 1.5rem',
              background: '#667eea',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              cursor: newComment.trim() && !submitting ? 'pointer' : 'not-allowed',
              opacity: newComment.trim() && !submitting ? 1 : 0.5
            }}
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </form>
      )}

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map(comment => (
            <div
              key={comment.id}
              style={{
                padding: '0.75rem',
                marginBottom: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ color: '#fff', fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
                    {comment.user_name || comment.user_email || 'Anonymous'}
                  </strong>
                  <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                {(user?.id === comment.user_id || user?.role === 'admin') && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                    title="Delete comment"
                  >
                    <FiX />
                  </button>
                )}
              </div>
              <p style={{ color: '#fff', fontSize: '0.875rem', margin: 0, lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                {comment.comment_text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Videos
