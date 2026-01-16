import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { FiThumbsUp, FiThumbsDown, FiMessageCircle, FiX, FiSend } from 'react-icons/fi'

const Interactions = ({ contentType, contentId, compact = false, showComments: externalShowComments, onToggleComments }) => {
  const { user } = useAuth()
  const [likes, setLikes] = useState({ count: 0, liked: false })
  const [dislikes, setDislikes] = useState({ count: 0, disliked: false })
  const [comments, setComments] = useState([])
  const [internalShowComments, setInternalShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const showComments = externalShowComments !== undefined ? externalShowComments : internalShowComments
  const setShowComments = (val) => {
    if (onToggleComments) {
      onToggleComments(typeof val === 'function' ? val(showComments) : val)
    } else {
      setInternalShowComments(val)
    }
  }

  useEffect(() => {
    if (contentId) {
      fetchInteractions()
    }
  }, [contentId])

  const fetchInteractions = async () => {
    try {
      setLoading(true)
      const [likesRes, dislikesRes, commentsRes] = await Promise.all([
        axios.get(`/api/interactions/${contentType}/${contentId}/likes`).catch(() => ({ data: { count: 0, liked: false } })),
        axios.get(`/api/interactions/${contentType}/${contentId}/dislikes`).catch(() => ({ data: { count: 0, disliked: false } })),
        axios.get(`/api/interactions/${contentType}/${contentId}/comments`).catch(() => ({ data: { comments: [] } }))
      ])

      setLikes(likesRes.data)
      setDislikes(dislikesRes.data)
      setComments(commentsRes.data.comments || [])
    } catch (err) {
      console.error('Error fetching interactions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (e) => {
    e.stopPropagation()
    if (!user) return

    try {
      const response = await axios.post(`/api/interactions/${contentType}/${contentId}/likes`)
      setLikes(prev => ({
        count: response.data.liked ? prev.count + 1 : prev.count - 1,
        liked: response.data.liked
      }))
      if (response.data.liked && dislikes.disliked) {
        setDislikes(prev => ({ ...prev, count: prev.count - 1, disliked: false }))
      }
    } catch (err) {
      console.error('Error toggling like:', err)
    }
  }

  const handleDislike = async (e) => {
    e.stopPropagation()
    if (!user) return

    try {
      const response = await axios.post(`/api/interactions/${contentType}/${contentId}/dislikes`)
      setDislikes(prev => ({
        count: response.data.disliked ? prev.count + 1 : prev.count - 1,
        disliked: response.data.disliked
      }))
      if (response.data.disliked && likes.liked) {
        setLikes(prev => ({ ...prev, count: prev.count - 1, liked: false }))
      }
    } catch (err) {
      console.error('Error toggling dislike:', err)
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

  if (compact) {
    return (
      <>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={handleLike}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: likes.liked ? '#3b82f6' : '#999',
              cursor: user ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (user) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
            disabled={!user}
          >
            <FiThumbsUp />
            <span>{likes.count}</span>
          </button>
          <button
            onClick={handleDislike}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: dislikes.disliked ? '#ef4444' : '#999',
              cursor: user ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (user) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
            disabled={!user}
          >
            <FiThumbsDown />
            <span>{dislikes.count}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowComments(!showComments)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: '#999',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <FiMessageCircle />
            <span>{comments.length}</span>
          </button>
        </div>

        {showComments && (
          <div
            onClick={() => setShowComments(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.9)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '12px',
                padding: '2rem',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: 'bold' }}>Comments ({comments.length})</h3>
                <button onClick={() => setShowComments(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.25rem' }}>
                  <FiX />
                </button>
              </div>

              {user && (
                <form onSubmit={handleAddComment} style={{ marginBottom: '1.5rem', position: 'relative' }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '0.75rem',
                      background: '#0a0a0a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      resize: 'none',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      bottom: '20px',
                      background: '#667eea',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      opacity: newComment.trim() ? 1 : 0.5
                    }}
                  >
                    <FiSend />
                  </button>
                </form>
              )}

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {comments.map(comment => (
                  <div key={comment.id} style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#fff', fontWeight: '600', fontSize: '0.85rem' }}>{comment.user_name || 'Anonymous'}</span>
                      <span style={{ color: '#666', fontSize: '0.75rem' }}>{formatDate(comment.created_at)}</span>
                    </div>
                    <p style={{ color: '#ccc', margin: 0, fontSize: '0.9rem' }}>{comment.comment_text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Standard YouTube-style in-page rendering
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', overflow: 'hidden' }}>
          <button
            onClick={handleLike}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: likes.liked ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              border: 'none',
              color: likes.liked ? '#3b82f6' : '#fff',
              cursor: user ? 'pointer' : 'not-allowed',
              padding: '0.6rem 1.25rem',
              fontSize: '1rem',
              transition: 'all 0.2s',
              borderRight: '1px solid rgba(255,255,255,0.1)'
            }}
            disabled={!user}
          >
            <FiThumbsUp style={{ fontSize: '1.25rem' }} />
            <span style={{ fontWeight: '500' }}>{likes.count}</span>
          </button>
          <button
            onClick={handleDislike}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: dislikes.disliked ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
              border: 'none',
              color: dislikes.disliked ? '#ef4444' : '#fff',
              cursor: user ? 'pointer' : 'not-allowed',
              padding: '0.6rem 1.25rem',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
            disabled={!user}
          >
            <FiThumbsDown style={{ fontSize: '1.25rem' }} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}>
          <FiMessageCircle />
          <span>{comments.length} Comments</span>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        {user && (
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '15px', marginBottom: '2.5rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#667eea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}>
              {user.name?.[0].toUpperCase() || user.email?.[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid rgba(255,255,255,0.1)',
                  padding: '8px 0',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              {newComment.trim() && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setNewComment('')}
                    style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: '8px 16px', borderRadius: '18px' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: '#667eea',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      padding: '8px 16px',
                      borderRadius: '18px',
                      fontWeight: 'bold'
                    }}
                  >
                    {submitting ? 'Posting...' : 'Comment'}
                  </button>
                </div>
              )}
            </div>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {comments.map(comment => (
            <div key={comment.id} style={{ display: 'flex', gap: '15px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.9rem',
                color: '#aaa'
              }}>
                {(comment.user_name?.[0] || comment.user_email?.[0] || '?').toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>
                    @{comment.user_name || comment.user_email?.split('@')[0] || 'anonymous'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{formatDate(comment.created_at)}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#eee', lineHeight: '1.5' }}>{comment.comment_text}</p>

                <div style={{ marginTop: '8px', display: 'flex', gap: '15px' }}>
                  {/* Minimalist actions like YouTube */}
                  {(user?.id === comment.user_id || user?.role === 'admin') && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.8rem' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>No comments yet. Be the first to share your thoughts!</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Interactions
