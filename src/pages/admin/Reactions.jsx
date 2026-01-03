import { useState, useEffect } from 'react'
import axios from 'axios'
import { useResponsive } from '../../hooks/useResponsive'
import { FiThumbsUp, FiThumbsDown, FiMessageCircle, FiFilter, FiX, FiTrash2 } from 'react-icons/fi'

const Reactions = () => {
  const { isMobile } = useResponsive()
  const [reactions, setReactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ likes: 0, dislikes: 0, comments: 0 })
  const [filters, setFilters] = useState({
    type: '',
    contentType: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchReactions()
  }, [filters])

  const fetchReactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.contentType) params.append('contentType', filters.contentType)
      
      const response = await axios.get(`/api/admin/reactions?${params.toString()}`)
      setReactions(response.data.reactions || [])
      setSummary(response.data.summary || { likes: 0, dislikes: 0, comments: 0 })
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

  const getReactionColor = (type) => {
    switch (type) {
      case 'like':
        return '#10b981'
      case 'dislike':
        return '#f59e0b'
      case 'comment':
        return '#3b82f6'
      default:
        return '#999'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const clearFilters = () => {
    setFilters({ type: '', contentType: '' })
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: isMobile ? '1rem' : '2rem' }}>
        <h1 style={{ 
          fontSize: isMobile ? '1.5rem' : '2rem', 
          marginBottom: '0.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <FiMessageCircle /> User Reactions
        </h1>
        <p style={{ color: '#999', fontSize: isMobile ? '0.875rem' : '1rem' }}>View all likes, dislikes, and comments from users</p>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile 
          ? 'repeat(1, 1fr)' 
          : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: isMobile ? '1rem' : '2rem'
      }}>
        <StatCard 
          title="Total Likes" 
          value={summary.likes} 
          color="#10b981" 
          icon={<FiThumbsUp />}
        />
        <StatCard 
          title="Total Dislikes" 
          value={summary.dislikes} 
          color="#f59e0b" 
          icon={<FiThumbsDown />}
        />
        <StatCard 
          title="Total Comments" 
          value={summary.comments} 
          color="#3b82f6" 
          icon={<FiMessageCircle />}
        />
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '0.5rem 1rem',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <FiFilter /> Filters
        </button>

        {showFilters && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#999' }}>Reaction Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                style={{
                  padding: '0.5rem',
                  background: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: '#fff',
                  minWidth: '150px'
                }}
              >
                <option value="">All Types</option>
                <option value="like">Likes</option>
                <option value="dislike">Dislikes</option>
                <option value="comment">Comments</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#999' }}>Content Type</label>
              <select
                value={filters.contentType}
                onChange={(e) => setFilters({ ...filters, contentType: e.target.value })}
                style={{
                  padding: '0.5rem',
                  background: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: '#fff',
                  minWidth: '150px'
                }}
              >
                <option value="">All Content</option>
                <option value="song">Songs</option>
                <option value="photo">Photos</option>
                <option value="video">Videos</option>
              </select>
            </div>

            {(filters.type || filters.contentType) && (
              <button
                onClick={clearFilters}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#333',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '1.5rem'
                }}
              >
                <FiX /> Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reactions List */}
      {reactions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '2rem 1rem' : '3rem',
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '8px',
          color: '#999'
        }}>
          No reactions found
        </div>
      ) : isMobile ? (
        // Mobile: Card layout
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {reactions.map((reaction) => (
            <div
              key={`${reaction.reaction_type}-${reaction.id}`}
              style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  {getReactionIcon(reaction.reaction_type)}
                  <span style={{ 
                    textTransform: 'capitalize',
                    color: getReactionColor(reaction.reaction_type),
                    fontWeight: 'bold'
                  }}>
                    {reaction.reaction_type}
                  </span>
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
                    justifyContent: 'center'
                  }}
                  title="Delete reaction"
                >
                  <FiTrash2 />
                </button>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ color: '#fff', fontWeight: '500', fontSize: '0.875rem' }}>{reaction.user_name}</div>
                <div style={{ color: '#999', fontSize: '0.75rem' }}>{reaction.user_email}</div>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ color: '#fff', fontWeight: '500', fontSize: '0.875rem' }}>
                  {reaction.content_title || 'Unknown'}
                  {reaction.content_artist && ` - ${reaction.content_artist}`}
                </div>
                <div style={{ color: '#999', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                  {reaction.content_type}
                </div>
              </div>
              {reaction.reaction_type === 'comment' && (
                <div style={{ 
                  color: '#ccc',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem',
                  wordBreak: 'break-word'
                }}>
                  {reaction.comment || reaction.comment_text}
                </div>
              )}
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                {formatDate(reaction.created_at)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Desktop: Table layout
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '8px',
          overflow: 'hidden',
          overflowX: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', background: '#0a0a0a' }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#999', fontWeight: 'normal' }}>Type</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#999', fontWeight: 'normal' }}>User</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#999', fontWeight: 'normal' }}>Content</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#999', fontWeight: 'normal' }}>Reaction</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#999', fontWeight: 'normal' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'right', color: '#999', fontWeight: 'normal' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reactions.map((reaction) => (
                <tr key={`${reaction.reaction_type}-${reaction.id}`} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getReactionIcon(reaction.reaction_type)}
                      <span style={{ 
                        textTransform: 'capitalize',
                        color: getReactionColor(reaction.reaction_type)
                      }}>
                        {reaction.reaction_type}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: '500' }}>{reaction.user_name}</div>
                      <div style={{ color: '#999', fontSize: '0.875rem' }}>{reaction.user_email}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: '500' }}>
                        {reaction.content_title || 'Unknown'}
                        {reaction.content_artist && ` - ${reaction.content_artist}`}
                      </div>
                      <div style={{ color: '#999', fontSize: '0.875rem', textTransform: 'capitalize' }}>
                        {reaction.content_type}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {reaction.reaction_type === 'comment' ? (
                      <div style={{ 
                        color: '#ccc',
                        maxWidth: '300px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {reaction.comment || reaction.comment_text}
                      </div>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', color: '#999', fontSize: '0.875rem' }}>
                    {formatDate(reaction.created_at)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(reaction.reaction_type, reaction.id)}
                      style={{
                        padding: '0.5rem',
                        background: 'transparent',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        color: '#f59e0b',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      title="Delete reaction"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const StatCard = ({ title, value, color, icon }) => (
  <div style={{
    background: '#1a1a1a',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #333',
    borderLeft: `4px solid ${color}`
  }}>
    <div style={{ color: '#999', marginBottom: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {icon} {title}
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 'bold', color }}>{value}</div>
  </div>
)

export default Reactions

