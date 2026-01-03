import { createContext, useContext, useState } from 'react'

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
    if (currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setCurrentSong(playlist[nextIndex])
    }
  }

  const previousSong = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      setCurrentSong(playlist[prevIndex])
    }
  }

  const clearPlayer = () => {
    setCurrentSong(null)
    setIsPlaying(false)
    setPlaylist([])
    setCurrentIndex(0)
    setIsMinimized(false)
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
      clearPlayer
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

