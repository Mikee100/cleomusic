import { createContext, useContext, useState, useEffect } from 'react'

const PlayerContext = createContext()

export const usePlayer = () => {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider')
  }
  return context
}

export const PlayerProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playlist, setPlaylist] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  // repeatMode: 'off' | 'all' | 'one'
  const [repeatMode, setRepeatMode] = useState('off')

  const playSong = (song, songs = []) => {
    setCurrentSong(song)
    setIsPlaying(true)
    if (songs.length > 0) {
      setPlaylist(songs)
      setCurrentIndex(songs.findIndex(s => s.id === song.id))
    }
  }

  const pauseSong = () => {
    setIsPlaying(false)
  }

  const nextSong = () => {
    if (!playlist.length) return

    // Shuffle: pick a random different index
    if (isShuffle && playlist.length > 1) {
      let nextIndex = currentIndex
      while (nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * playlist.length)
      }
      setCurrentIndex(nextIndex)
      setCurrentSong(playlist[nextIndex])
      setIsPlaying(true)
      return
    }

    if (currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setCurrentSong(playlist[nextIndex])
      setIsPlaying(true)
    } else if (repeatMode === 'all') {
      // Loop back to start
      setCurrentIndex(0)
      setCurrentSong(playlist[0])
      setIsPlaying(true)
    } else {
      // End of playlist, stop playback
      setIsPlaying(false)
    }
  }

  const previousSong = () => {
    if (!playlist.length) return

    // Shuffle: previous is also random
    if (isShuffle && playlist.length > 1) {
      let prevIndex = currentIndex
      while (prevIndex === currentIndex) {
        prevIndex = Math.floor(Math.random() * playlist.length)
      }
      setCurrentIndex(prevIndex)
      setCurrentSong(playlist[prevIndex])
      setIsPlaying(true)
      return
    }

    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      setCurrentSong(playlist[prevIndex])
      setIsPlaying(true)
    } else if (repeatMode === 'all') {
      // Wrap to end
      const lastIndex = playlist.length - 1
      setCurrentIndex(lastIndex)
      setCurrentSong(playlist[lastIndex])
      setIsPlaying(true)
    }
  }

  const clearPlayer = () => {
    setCurrentSong(null)
    setIsPlaying(false)
    setPlaylist([])
    setCurrentIndex(0)
    setIsMinimized(false)
  }

  const reorderQueue = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    setPlaylist(prev => {
      if (!prev || prev.length === 0) return prev
      const updated = [...prev]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)

      // Recalculate currentIndex based on currentSong id
      if (currentSong) {
        const newIndex = updated.findIndex(s => s.id === currentSong.id)
        if (newIndex !== -1) {
          setCurrentIndex(newIndex)
        }
      }

      return updated
    })
  }

  const playFromQueue = (index) => {
    if (!playlist.length || index < 0 || index >= playlist.length) return
    setCurrentIndex(index)
    setCurrentSong(playlist[index])
    setIsPlaying(true)
  }

  return (
    <PlayerContext.Provider value={{
      currentSong,
      isPlaying,
      playlist,
      playSong,
      pauseSong,
      nextSong,
      previousSong,
      setIsPlaying,
      isMinimized,
      setIsMinimized,
      clearPlayer,
      isShuffle,
      setIsShuffle,
      repeatMode,
      setRepeatMode,
      currentIndex,
      reorderQueue,
      playFromQueue
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

