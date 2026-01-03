// API URL helper - uses environment variable or empty string for relative URLs
export const API_URL = import.meta.env.VITE_API_URL || ''

// Helper function to get full URL for media files
export const getMediaUrl = (path) => {
  if (!path) return null
  return `${API_URL}${path}`
}

