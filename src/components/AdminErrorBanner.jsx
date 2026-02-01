/**
 * Reusable error banner for admin list pages. Shows message + Retry button.
 */
export default function AdminErrorBanner({ error, onRetry }) {
  if (!error) return null
  return (
    <div style={{
      background: 'rgba(239, 68, 68, 0.15)',
      border: '1px solid rgba(239, 68, 68, 0.4)',
      borderRadius: '8px',
      padding: '1rem 1.25rem',
      marginBottom: '1rem',
      color: '#fca5a5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      <span>{error}</span>
      <button
        onClick={onRetry}
        style={{
          padding: '0.5rem 1rem',
          background: 'rgba(239, 68, 68, 0.3)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          borderRadius: '6px',
          color: '#fff',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}
      >
        Retry
      </button>
    </div>
  )
}

export function getAdminErrorMessage(err) {
  const status = err.response?.status
  const msg = err.response?.data?.error || err.message || 'Failed to load'
  if (status === 401) return 'Not signed in. Please log in again.'
  if (status === 403) return "You don't have permission to view this page."
  if (status >= 500) return `Server error: ${msg}`
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') return 'Cannot reach the server. Check VITE_API_URL and that the backend is running.'
  return msg
}
