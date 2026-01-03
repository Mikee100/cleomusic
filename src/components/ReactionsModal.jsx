import { useState, useEffect } from 'react'
import axios from 'axios'
import { FiX, FiThumbsUp, FiThumbsDown, FiMessageCircle, FiTrash2 } from 'react-icons/fi'

const ReactionsModal = ({ contentType, contentId, contentTitle, onClose, onDeleteReaction }) => {
  const [reactions, setReactions] = useState({ likes: [], dislikes: [], comments: [] })
  const [summary, setSummary] = useState({ likes: 0, dislikes: 0, comments: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'likes', 'dislikes', 'comments'

  useEffect(() => {
    if (contentId && contentType) {
      fetchReactions()
    }
  }, [contentId, contentType])

  const fetchReactions = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/admin/reactions/${contentType}/${contentId}`)
      setReactions(response.data.reactions)
      setSummary(response.data.summary)
    } catch (err) {
      console.error('Error fetching reactions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (reactionType, reactionId) => {
    if (!window.confirm(`Are you sure you want to delete this ${reactionType}?`)) {
      return
    }

    try {
      await axios.delete(`/api/admin/reactions/${reactionType}/${reactionId}`)
      fetchReactions()
      if (onDeleteReaction) {
        onDeleteReaction()
      }
    } catch (err) {
      console.error('Error deleting reaction:', err)
      alert('Failed to delete reaction')
    }
  }

  const getReactionIcon = (type) => {
    switch (type) {
      case 'like':
        return <FiThumbsUp style={{ color: '#10b981' }} />
      case 'dislike':
        return <FiThumbsDown style={{ color: '#f59e0b' }} />
      case 'comment':
        return <FiMessageCircle style={{ color: '#3b82f6' }} />
      default:
        return null
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const allReactions = [
    ...reactions.likes.map(r => ({ ...r, reaction_type: 'like' })),
    ...reactions.dislikes.map(r => ({ ...r, reaction_type: 'dislike' })),
    ...reactions.comments.map(r => ({ ...r, reaction_type: 'comment' }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const filteredReactions = activeTab === 'all' 
    ? allReactions 
    : activeTab === 'likes' 
      ? reactions.likes.map(r => ({ ...r, reaction_type: 'like' }))
      : activeTab === 'dislikes'
        ? reactions.dislikes.map(r => ({ ...r, reaction_type: 'dislike' }))
        : reactions.comments.map(r => ({ ...r, reaction_type: 'comment' }))

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: '2rem'
    }}>
      <div style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        padding: '2rem',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '800px',
        width: '100%',
        border: '1px solid #333'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>Reactions for {contentTitle}</h2>
            <p style={{ margin: 0, color: '#999', fontSize: '0.875rem', textTransform: 'capitalize' }}>
              {contentType}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1.5rem',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FiX />
          </button>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <StatCard title="Likes" value={summary.likes} color="#10b981" icon={<FiThumbsUp />} />
          <StatCard title="Dislikes" value={summary.dislikes} color="#f59e0b" icon={<FiThumbsDown />} />
          <StatCard title="Comments" value={summary.comments} color="#3b82f6" icon={<FiMessageCircle />} />
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          borderBottom: '1px solid #333',
          paddingBottom: '0.5rem'
        }}>
          {['all', 'likes', 'dislikes', 'comments'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.5rem 1rem',
                background: activeTab === tab ? '#667eea' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab ? 'bold' : 'normal'
              }}
            >
              {tab} {tab !== 'all' && `(${summary[tab] || 0})`}
            </button>
          ))}
        </div>

        {/* Reactions List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Loading...</div>
          ) : filteredReactions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#999'
            }}>
              No {activeTab === 'all' ? 'reactions' : activeTab} found
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {filteredReactions.map((reaction) => (
                <div
                  key={`${reaction.reaction_type}-${reaction.id}`}
                  style={{
                    background: '#2a2a2a',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '1rem'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    flexShrink: 0
                  }}>
                    {getReactionIcon(reaction.reaction_type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{
                        textTransform: 'capitalize',
                        color: reaction.reaction_type === 'like' ? '#10b981' : 
                               reaction.reaction_type === 'dislike' ? '#f59e0b' : '#3b82f6',
                        fontWeight: 'bold',
                        fontSize: '0.875rem'
                      }}>
                        {reaction.reaction_type}
                      </span>
                      <span style={{ color: '#999', fontSize: '0.75rem' }}>by</span>
                      <span style={{ color: '#fff', fontWeight: '500', fontSize: '0.875rem' }}>
                        {reaction.user_name}
                      </span>
                    </div>
                    {reaction.comment && (
                      <div style={{
                        color: '#ccc',
                        marginTop: '0.5rem',
                        fontSize: '0.875rem',
                        wordBreak: 'break-word'
                      }}>
                        {reaction.comment}
                      </div>
                    )}
                    <div style={{
                      color: '#666',
                      fontSize: '0.75rem',
                      marginTop: '0.5rem'
                    }}>
                      {formatDate(reaction.created_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(reaction.reaction_type, reaction.id)}
                    style={{
                      padding: '0.5rem',
                      background: 'transparent',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: '#f59e0b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                    title="Delete reaction"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ title, value, color, icon }) => (
  <div style={{
    background: '#2a2a2a',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #333',
    borderLeft: `4px solid ${color}`,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  }}>
    <div style={{ color, fontSize: '1.5rem' }}>{icon}</div>
    <div>
      <div style={{ color: '#999', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{title}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color }}>{value}</div>
    </div>
  </div>
)

export default ReactionsModal

