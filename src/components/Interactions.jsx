import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { FiThumbsUp, FiThumbsDown, FiMessageCircle, FiX } from 'react-icons/fi'

const Interactions = ({ contentType, contentId, compact = false }) => {
  const { user } = useAuth()
  const [likes, setLikes] = useState({ count: 0, liked: false })
  const [dislikes, setDislikes] = useState({ count: 0, disliked: false })
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
      // If user liked, remove dislike if exists
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
      // If user disliked, remove like if exists
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
                padding: '3rem',
                width: '90%',
                maxWidth: '1600px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>Comments ({comments.length})</h3>
                <button
                  onClick={() => setShowComments(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <FiX />
                </button>
              </div>

              {user && (
                <form onSubmit={handleAddComment} style={{ marginBottom: '2rem' }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    style={{
                      width: '100%',
                      minHeight: '150px',
                      padding: '1.25rem',
                      background: '#0a0a0a',
                      border: '1px solid #333',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '1.125rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      marginBottom: '1rem',
                      lineHeight: '1.6'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    style={{
                      padding: '1rem 2.5rem',
                      background: '#667eea',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '1.125rem',
                      fontWeight: 'bold',
                      cursor: newComment.trim() && !submitting ? 'pointer' : 'not-allowed',
                      opacity: newComment.trim() && !submitting ? 1 : 0.5,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (newComment.trim() && !submitting) {
                        e.currentTarget.style.background = '#5568d3'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#667eea'
                    }}
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              )}

              <div style={{ maxHeight: '65vh', overflowY: 'auto', flex: 1, paddingRight: '1rem' }}>
                {comments.length === 0 ? (
                  <p style={{ color: '#666', textAlign: 'center', padding: '4rem', fontSize: '1.25rem' }}>No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map(comment => (
                    <div
                      key={comment.id}
                      style={{
                        padding: '1.5rem',
                        borderBottom: '1px solid #333',
                        marginBottom: '1.5rem',
                        background: '#0f0f0f',
                        borderRadius: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <strong style={{ color: '#fff', fontSize: '1.125rem', display: 'block', marginBottom: '0.5rem' }}>
                            {comment.user_name || comment.user_email || 'Anonymous'}
                          </strong>
                          <span style={{ color: '#666', fontSize: '1rem' }}>
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
                              padding: '0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '1.5rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                              e.currentTarget.style.borderRadius = '4px'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                            }}
                            title="Delete comment"
                          >
                            <FiX />
                          </button>
                        )}
                      </div>
                      <p style={{ color: '#ccc', fontSize: '1.125rem', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
                        {comment.comment_text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <button
          onClick={handleLike}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: likes.liked ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            border: `1px solid ${likes.liked ? '#3b82f6' : '#333'}`,
            color: likes.liked ? '#3b82f6' : '#fff',
            cursor: user ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (user) e.currentTarget.style.background = likes.liked ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = likes.liked ? 'rgba(59, 130, 246, 0.2)' : 'transparent'
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
            background: dislikes.disliked ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
            border: `1px solid ${dislikes.disliked ? '#ef4444' : '#333'}`,
            color: dislikes.disliked ? '#ef4444' : '#fff',
            cursor: user ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (user) e.currentTarget.style.background = dislikes.disliked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = dislikes.disliked ? 'rgba(239, 68, 68, 0.2)' : 'transparent'
          }}
          disabled={!user}
        >
          <FiThumbsDown />
          <span>{dislikes.count}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: showComments ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: '1px solid #333',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.875rem',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => {
            if (!showComments) e.currentTarget.style.background = 'transparent'
          }}
        >
          <FiMessageCircle />
          <span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
        </button>
      </div>

      {showComments && (
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '12px',
          padding: '3rem',
          marginTop: '1.5rem',
          width: '100%',
          maxWidth: 'none'
        }}>
          {user && (
            <form onSubmit={handleAddComment} style={{ marginBottom: '1.5rem' }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '1rem',
                  background: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '0.75rem',
                  lineHeight: '1.5'
                }}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#667eea',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: newComment.trim() && !submitting ? 'pointer' : 'not-allowed',
                  opacity: newComment.trim() && !submitting ? 1 : 0.5,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (newComment.trim() && !submitting) {
                    e.currentTarget.style.background = '#5568d3'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#667eea'
                }}
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          )}

          <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {comments.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '3rem', fontSize: '1rem' }}>No comments yet. Be the first to comment!</p>
            ) : (
              comments.map(comment => (
                <div
                  key={comment.id}
                  style={{
                    padding: '1.25rem',
                    borderBottom: '1px solid #333',
                    marginBottom: '1rem',
                    background: '#0f0f0f',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <strong style={{ color: '#fff', fontSize: '1rem', display: 'block', marginBottom: '0.25rem' }}>
                        {comment.user_name || comment.user_email || 'Anonymous'}
                      </strong>
                      <span style={{ color: '#666', fontSize: '0.875rem' }}>
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
                          padding: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '1.25rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                          e.currentTarget.style.borderRadius = '4px'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                        title="Delete comment"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                  <p style={{ color: '#ccc', fontSize: '1rem', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {comment.comment_text}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Interactions

