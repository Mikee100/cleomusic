import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import {
    FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize2,
    FiMinimize2, FiArrowLeft, FiUserPlus, FiUserCheck,
    FiSettings, FiClock, FiEye
} from 'react-icons/fi'
import { useResponsive } from '../hooks/useResponsive'
import { useAuth } from '../context/AuthContext'
import UpgradeInterruptionModal from '../components/UpgradeInterruptionModal'
import Interactions from '../components/Interactions'

const VideoDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { isMobile } = useResponsive()
    const { user, subscription } = useAuth()
    const videoRef = useRef(null)
    const glowVideoRef = useRef(null)
    const containerRef = useRef(null)

    // State
    const [video, setVideo] = useState(null)
    const [recommendations, setRecommendations] = useState([])
    const [loading, setLoading] = useState(true)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [showSettings, setShowSettings] = useState(false)
    const [showInterruptionModal, setShowInterruptionModal] = useState(false)

    const controlsTimeoutRef = useRef(null)
    const hasInterruptedRef = useRef(false)
    const viewIncrementedRef = useRef(false)
    const isFreeUser = !subscription && user?.role !== 'admin'

    useEffect(() => {
        window.scrollTo(0, 0)
        fetchVideoAndRecommendations()
        hasInterruptedRef.current = false
        viewIncrementedRef.current = false
    }, [id])

    const fetchVideoAndRecommendations = async () => {
        try {
            setLoading(true)
            const [videoRes, recsRes] = await Promise.all([
                axios.get(`/api/videos/${id}`),
                axios.get('/api/videos', { params: { limit: 10, kind: 'video' } })
            ])

            setVideo(videoRes.data.video || videoRes.data)
            // Filter out current video from recommendations
            const currentRecs = (recsRes.data.videos || []).filter(v => v.id !== id)
            setRecommendations(currentRecs)
        } catch (err) {
            console.error('Error fetching data:', err)
            navigate('/videos')
        } finally {
            setLoading(false)
        }
    }

    // Sync glow video with main video
    useEffect(() => {
        const v = videoRef.current
        const g = glowVideoRef.current
        if (!v || !g) return

        const syncGlow = () => {
            if (g.paused !== v.paused) {
                if (v.paused) g.pause()
                else g.play().catch(() => { })
            }
            if (Math.abs(g.currentTime - v.currentTime) > 0.3) {
                g.currentTime = v.currentTime
            }
        }

        v.addEventListener('play', syncGlow)
        v.addEventListener('pause', syncGlow)
        v.addEventListener('timeupdate', syncGlow)
        v.addEventListener('ratechange', () => { g.playbackRate = v.playbackRate })

        return () => {
            v.removeEventListener('play', syncGlow)
            v.removeEventListener('pause', syncGlow)
            v.removeEventListener('timeupdate', syncGlow)
        }
    }, [loading])

    useEffect(() => {
        const videoElement = videoRef.current
        if (!videoElement || !video) return

        const handleTimeUpdate = () => {
            setCurrentTime(videoElement.currentTime)

            // View Increment: Count after 5 seconds of play
            if (!viewIncrementedRef.current && videoElement.currentTime > 5) {
                axios.post(`/api/videos/${id}/view`)
                    .then(() => {
                        setVideo(prev => ({ ...prev, views: (prev?.views || 0) + 1 }))
                    })
                    .catch(() => { })
                viewIncrementedRef.current = true
            }

            // Interrupt logic
            if (
                isFreeUser &&
                !hasInterruptedRef.current &&
                videoElement.duration > 0 &&
                videoElement.currentTime >= videoElement.duration * 0.25
            ) {
                videoElement.pause()
                setIsPlaying(false)
                setShowInterruptionModal(true)
                hasInterruptedRef.current = true
            }
        }

        const handleEnded = () => {
            // Auto-play next video if available
            if (recommendations.length > 0) {
                navigate(`/videos/${recommendations[0].id}`)
            }
        }

        videoElement.addEventListener('timeupdate', handleTimeUpdate)
        videoElement.addEventListener('ended', handleEnded)
        videoElement.addEventListener('loadedmetadata', () => setDuration(videoElement.duration))
        videoElement.addEventListener('play', () => setIsPlaying(true))
        videoElement.addEventListener('pause', () => setIsPlaying(false))
        videoElement.addEventListener('volumechange', () => setIsMuted(videoElement.muted))

        return () => {
            videoElement.removeEventListener('timeupdate', handleTimeUpdate)
            videoElement.removeEventListener('ended', handleEnded)
        }
    }, [video, isFreeUser, recommendations])

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) videoRef.current.play()
            else videoRef.current.pause()
        }
    }

    const handleMuteToggle = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted
            setIsMuted(videoRef.current.muted)
        }
    }

    const handleSeek = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const percent = (e.clientX - rect.left) / rect.width
        if (videoRef.current) videoRef.current.currentTime = percent * duration
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    const changePlaybackRate = (rate) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate
            setPlaybackRate(rate)
            setShowSettings(false)
        }
    }

    const handleMouseMove = () => {
        setShowControls(true)
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false)
        }, 3000)
    }

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (loading) return <div style={{ height: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>

    const videoSrc = `${import.meta.env.VITE_API_URL || ''}${video?.file_path}`

    return (
        <div style={{ width: '100%', minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
            {/* Top Bar */}
            <div style={{ position: 'sticky', top: 0, zIndex: 1000, padding: '12px 20px', background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <button onClick={() => navigate('/videos')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', borderRadius: '50%' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <FiArrowLeft size={24} />
                </button>
                <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>Cleo Music Player</div>
            </div>

            <main style={{ maxWidth: '1600px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: '24px', padding: isMobile ? '0' : '24px' }}>

                {/* Left Side: Video & Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Video Section with Glow */}
                    <div ref={containerRef} onMouseMove={handleMouseMove} style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: isMobile ? '0' : '16px', overflow: 'hidden' }}>

                        {/* Ambient Glow Element */}
                        <video ref={glowVideoRef} src={videoSrc} muted loop playsInline style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) scale(1.2)', width: '100%', height: '100%', filter: 'blur(60px) opacity(0.5)', zIndex: 0, pointerEvents: 'none' }} />

                        {/* Main Video */}
                        <video ref={videoRef} src={videoSrc} autoPlay style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} onClick={handlePlayPause} />

                        {/* Controls Overlay */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '30px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', opacity: showControls ? 1 : 0, transition: 'opacity 0.4s', zIndex: 10 }}>
                            <div onClick={handleSeek} style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', marginBottom: '20px', cursor: 'pointer', position: 'relative' }}>
                                <div style={{ width: `${(currentTime / duration) * 100}%`, height: '100%', background: '#667eea', borderRadius: '2px', boxShadow: '0 0 10px #667eea' }} />
                                <div style={{ position: 'absolute', left: `${(currentTime / duration) * 100}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', background: '#667eea', borderRadius: '50%', pointerEvents: 'none' }} />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <button onClick={handlePlayPause} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>{isPlaying ? <FiPause size={28} /> : <FiPlay size={28} />}</button>
                                <button onClick={handleMuteToggle} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>{isMuted ? <FiVolumeX size={24} /> : <FiVolume2 size={24} />}</button>
                                <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{formatTime(currentTime)} / {formatTime(duration)}</span>
                                <div style={{ flex: 1 }} />

                                <div style={{ position: 'relative' }}>
                                    <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><FiSettings size={22} /></button>
                                    {showSettings && (
                                        <div style={{ position: 'absolute', bottom: '40px', right: 0, background: 'rgba(20,20,20,0.95)', border: '1px solid #333', borderRadius: '8px', padding: '8px', width: '140px', backdropFilter: 'blur(10px)' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#888', padding: '4px 8px' }}>Speed</div>
                                            {[0.5, 1, 1.5, 2].map(rate => (
                                                <div key={rate} onClick={() => changePlaybackRate(rate)} style={{ padding: '8px', borderRadius: '4px', cursor: 'pointer', background: playbackRate === rate ? 'rgba(255,255,255,0.1)' : 'transparent', color: playbackRate === rate ? '#667eea' : '#fff' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = playbackRate === rate ? 'rgba(255,255,255,0.1)' : 'transparent'}>
                                                    {rate === 1 ? 'Normal' : `${rate}x`}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>{isFullscreen ? <FiMinimize2 size={24} /> : <FiMaximize2 size={24} />}</button>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <div style={{ padding: isMobile ? '20px' : '0' }}>
                        <h1 style={{ fontSize: '1.6rem', marginBottom: '12px', fontWeight: '700' }}>{video?.title}</h1>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', color: '#888', fontSize: '0.9rem', marginBottom: '24px', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiEye /> {video?.views || 0} views</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiClock /> {new Date(video?.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>

                        {/* Artist Section */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(45deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.2rem' }}>
                                    {video?.uploaded_by_name?.[0].toUpperCase() || 'A'}
                                </div>
                                <div style={{ fontWeight: '600', fontSize: '1.05rem' }}>
                                    {video?.uploaded_by_name || 'Cleo Artist'}
                                </div>
                            </div>
                        </div>

                        <p style={{ color: '#ccc', lineHeight: '1.7', whiteSpace: 'pre-wrap', marginBottom: '30px' }}>{video?.description}</p>

                        <Interactions contentType="video" contentId={id} showComments={true} />
                    </div>
                </div>

                {/* Right Side: Recommended sidebar */}
                {!isMobile && (
                    <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>Up Next</h3>
                            <div style={{ fontSize: '0.8rem', color: '#667eea', fontWeight: '600' }}>AUTO-PLAY ON</div>
                        </div>
                        {recommendations.map(v => (
                            <Link key={v.id} to={`/videos/${v.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: '12px' }}>
                                <div style={{ width: '160px', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 }}>
                                    <video src={`${import.meta.env.VITE_API_URL || ''}${v.file_path}#t=1`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '600', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3', marginBottom: '4px' }}>{v.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>{v.uploaded_by_name || 'Cleo Music'}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#666' }}>{v.views || 0} views</div>
                                </div>
                            </Link>
                        ))}
                    </aside>
                )}

                {/* Mobile version of Recommendations */}
                {isMobile && (
                    <div style={{ padding: '0 20px 40px' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Recommended</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {recommendations.map(v => (
                                <Link key={v.id} to={`/videos/${v.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '140px', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 }}>
                                        <video src={`${import.meta.env.VITE_API_URL || ''}${v.file_path}#t=1`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>{v.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>{v.uploaded_by_name || 'Cleo Music'}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {showInterruptionModal && (
                <UpgradeInterruptionModal
                    onClose={() => setShowInterruptionModal(false)}
                    onUpgrade={() => {
                        setShowInterruptionModal(false)
                        videoRef.current?.play()
                    }}
                    contentType="video"
                />
            )}
        </div>
    )
}

export default VideoDetail
