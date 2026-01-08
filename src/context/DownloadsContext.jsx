import { createContext, useContext, useEffect, useState } from 'react'

const DownloadsContext = createContext()

export const useDownloads = () => {
  const ctx = useContext(DownloadsContext)
  if (!ctx) {
    throw new Error('useDownloads must be used within DownloadsProvider')
  }
  return ctx
}

const STORAGE_KEY = 'cleo_downloads_v1'

export const DownloadsProvider = ({ children }) => {
  const [items, setItems] = useState([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setItems(parsed)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [items])

  const addDownload = (item) => {
    if (!item?.id || !item?.type) return
    setItems((prev) => {
      const exists = prev.some(
        (d) => d.id === item.id && d.type === item.type
      )
      if (exists) return prev
      return [...prev, { ...item, downloadedAt: new Date().toISOString() }]
    })
  }

  const removeDownload = (type, id) => {
    setItems((prev) => prev.filter((d) => !(d.type === type && d.id === id)))
  }

  const clearDownloads = () => setItems([])

  const songs = items.filter((d) => d.type === 'song')
  const videos = items.filter((d) => d.type === 'video')

  return (
    <DownloadsContext.Provider
      value={{
        downloads: items,
        songs,
        videos,
        addDownload,
        removeDownload,
        clearDownloads
      }}
    >
      {children}
    </DownloadsContext.Provider>
  )
}

export default DownloadsContext


