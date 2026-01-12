import { useEffect, useRef } from 'react'
import { API_URL } from '../utils/api.js'

/**
 * Hook to prefetch media files (audio/video) for faster playback
 */
export const usePrefetch = () => {
  const prefetchedRef = useRef(new Set())
  const audioCacheRef = useRef(new Map())
  const videoCacheRef = useRef(new Map())

  /**
   * Prefetch a media file using multiple strategies
   * @param {string} url - The URL to prefetch
   * @param {string} type - 'audio' or 'video'
   */
  const prefetchMedia = (url, type = 'audio') => {
    if (!url || prefetchedRef.current.has(url)) return

    try {
      const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`
      prefetchedRef.current.add(url)

      // Strategy 1: Use link prefetch for browser-level prefetching
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.as = type
      link.href = fullUrl
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)

      // Strategy 2: Create hidden media element to preload
      if (type === 'audio') {
        const audio = document.createElement('audio')
        audio.preload = 'auto'
        audio.crossOrigin = 'anonymous'
        audio.src = fullUrl
        audio.style.display = 'none'
        audio.style.position = 'absolute'
        audio.style.visibility = 'hidden'
        document.body.appendChild(audio)
        
        // Store reference for later use
        audioCacheRef.current.set(url, audio)
        
        // Start loading
        audio.load()
        
        // Clean up after a delay if not used
        setTimeout(() => {
          if (audioCacheRef.current.has(url)) {
            const cachedAudio = audioCacheRef.current.get(url)
            if (cachedAudio && cachedAudio.parentNode) {
              cachedAudio.parentNode.removeChild(cachedAudio)
            }
            audioCacheRef.current.delete(url)
          }
        }, 120000) // Keep for 2 minutes
      } else if (type === 'video') {
        const video = document.createElement('video')
        video.preload = 'auto'
        video.crossOrigin = 'anonymous'
        video.src = fullUrl
        video.muted = true
        video.playsInline = true
        video.style.display = 'none'
        video.style.position = 'absolute'
        video.style.visibility = 'hidden'
        document.body.appendChild(video)
        
        // Store reference for later use
        videoCacheRef.current.set(url, video)
        
        // Start loading
        video.load()
        
        // Clean up after a delay if not used
        setTimeout(() => {
          if (videoCacheRef.current.has(url)) {
            const cachedVideo = videoCacheRef.current.get(url)
            if (cachedVideo && cachedVideo.parentNode) {
              cachedVideo.parentNode.removeChild(cachedVideo)
            }
            videoCacheRef.current.delete(url)
          }
        }, 120000) // Keep for 2 minutes
      }
    } catch (error) {
      console.warn('Prefetch failed for', url, error)
    }
  }

  /**
   * Get a prefetched audio element if available
   */
  const getPrefetchedAudio = (url) => {
    return audioCacheRef.current.get(url) || null
  }

  /**
   * Get a prefetched video element if available
   */
  const getPrefetchedVideo = (url) => {
    return videoCacheRef.current.get(url) || null
  }

  /**
   * Prefetch next songs in playlist
   */
  const prefetchNextSongs = (playlist, currentIndex, count = 2) => {
    if (!playlist || playlist.length === 0) return

    // Prefetch next few songs
    for (let i = 1; i <= count && currentIndex + i < playlist.length; i++) {
      const nextSong = playlist[currentIndex + i]
      if (nextSong?.file_path) {
        prefetchMedia(nextSong.file_path, 'audio')
      }
      if (nextSong?.background_video_path) {
        prefetchMedia(nextSong.background_video_path, 'video')
      }
    }

    // Also prefetch previous song (for back navigation)
    if (currentIndex > 0) {
      const prevSong = playlist[currentIndex - 1]
      if (prevSong?.file_path) {
        prefetchMedia(prevSong.file_path, 'audio')
      }
      if (prevSong?.background_video_path) {
        prefetchMedia(prevSong.background_video_path, 'video')
      }
    }
  }

  /**
   * Clean up prefetched resources
   */
  const cleanup = () => {
    // Clean up audio elements
    audioCacheRef.current.forEach((audio) => {
      if (audio && audio.parentNode) {
        audio.parentNode.removeChild(audio)
      }
    })
    audioCacheRef.current.clear()

    // Clean up video elements
    videoCacheRef.current.forEach((video) => {
      if (video && video.parentNode) {
        video.parentNode.removeChild(video)
      }
    })
    videoCacheRef.current.clear()

    // Clean up link prefetch elements
    const prefetchLinks = document.querySelectorAll('link[rel="prefetch"]')
    prefetchLinks.forEach((link) => {
      if (link.parentNode) {
        link.parentNode.removeChild(link)
      }
    })
  }

  return {
    prefetchMedia,
    prefetchNextSongs,
    getPrefetchedAudio,
    getPrefetchedVideo,
    cleanup
  }
}

