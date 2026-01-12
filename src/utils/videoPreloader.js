// Video preloader utility for aggressive prefetching and caching

class VideoPreloader {
  constructor() {
    this.prefetchedVideos = new Set()
    this.preloadElements = new Map()
    this.maxPreload = 3 // Preload next 3 videos
  }

  // Prefetch video using link prefetch
  prefetchVideo(url) {
    if (this.prefetchedVideos.has(url)) return
    
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    link.as = 'video'
    document.head.appendChild(link)
    
    this.prefetchedVideos.add(url)
    
    // Clean up after 5 minutes
    setTimeout(() => {
      if (document.head.contains(link)) {
        document.head.removeChild(link)
      }
      this.prefetchedVideos.delete(url)
    }, 300000)
  }

  // Preload video element (hidden) for instant playback
  preloadVideoElement(videoId, url) {
    if (this.preloadElements.has(videoId)) {
      return this.preloadElements.get(videoId)
    }

    const video = document.createElement('video')
    video.src = url
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.style.display = 'none'
    video.style.position = 'absolute'
    video.style.width = '1px'
    video.style.height = '1px'
    video.style.opacity = '0'
    video.style.pointerEvents = 'none'
    
    // Start loading
    video.load()
    
    document.body.appendChild(video)
    this.preloadElements.set(videoId, video)
    
    return video
  }

  // Get preloaded video element
  getPreloadedVideo(videoId) {
    return this.preloadElements.get(videoId)
  }

  // Clean up preloaded video
  cleanupPreloadedVideo(videoId) {
    const video = this.preloadElements.get(videoId)
    if (video) {
      video.pause()
      video.src = ''
      video.load()
      if (video.parentNode) {
        video.parentNode.removeChild(video)
      }
      this.preloadElements.delete(videoId)
    }
  }

  // Prefetch multiple videos
  prefetchVideos(videos, currentIndex) {
    const startIndex = currentIndex + 1
    const endIndex = Math.min(startIndex + this.maxPreload, videos.length)
    
    for (let i = startIndex; i < endIndex; i++) {
      const video = videos[i]
      if (video?.file_path) {
        const url = `${import.meta.env.VITE_API_URL || ''}${video.file_path}`
        this.prefetchVideo(url)
        // Also preload the element for instant switching
        this.preloadVideoElement(video.id, url)
      }
    }
    
    // Clean up videos that are too far back
    const cleanupStart = Math.max(0, currentIndex - 2)
    for (let i = 0; i < cleanupStart; i++) {
      const video = videos[i]
      if (video?.id) {
        this.cleanupPreloadedVideo(video.id)
      }
    }
  }

  // Prefetch video metadata (HEAD request)
  async prefetchMetadata(url) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'Range': 'bytes=0-1023' // Just get first 1KB for metadata
        }
      })
      return response.ok
    } catch (error) {
      console.warn('Failed to prefetch metadata:', error)
      return false
    }
  }

  // Cleanup all
  cleanup() {
    this.preloadElements.forEach((video, videoId) => {
      this.cleanupPreloadedVideo(videoId)
    })
    this.prefetchedVideos.clear()
  }
}

// Singleton instance
export const videoPreloader = new VideoPreloader()

