import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import SubscriptionModal from '../components/SubscriptionModal'
import HeroSection from '../components/HeroSection'
import AlbumsSection from '../components/AlbumsSection'
import SongsSection from '../components/SongsSection'
import InstrumentalsSection from '../components/InstrumentalsSection'
import { FiMusic, FiHeart, FiPlay, FiList, FiTrendingUp, FiCalendar, FiDisc } from 'react-icons/fi'
import { useResponsive } from '../hooks/useResponsive'

const Home = () => {
  const { user, subscription } = useAuth()
  const { playSong } = usePlayer()
  const { isMobile } = useResponsive()
  const navigate = useNavigate()
  const [songs, setSongs] = useState([])
  const [albums, setAlbums] = useState([])
  const [userStats, setUserStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [favorites, setFavorites] = useState(new Set())
  const [upcoming, setUpcoming] = useState([])

  // Placeholder artist info
  const artistInfo = {
    name: 'Cleo Music',
    tagline: 'Your Soundtrack to Life',
    description: 'Discover the finest collection of music curated for your listening pleasure. From the latest hits to timeless classics, immerse yourself in a world of musical excellence.'
  }

  useEffect(() => {
    // Allow free users to access content (they'll get interrupted after 20 seconds)
    fetchData()
  }, [subscription, user])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [songsResponse, albumsResponse, userStatsResponse, upcomingResponse] = await Promise.all([
        axios.get('/api/songs', { params: { limit: 12 } }).catch(() => ({ data: { songs: [] } })),
        axios.get('/api/albums', { params: { limit: 12 } }).catch(() => ({ data: { albums: [] } })),
        axios.get('/api/users/stats').catch(() => ({ data: null })),
        axios.get('/api/upcoming').catch(() => ({ data: { upcoming: [] } }))
      ])

      setSongs(songsResponse.data.songs || [])
      setAlbums(albumsResponse.data.albums || [])
      setUserStats(userStatsResponse.data)
      setUpcoming(upcomingResponse.data.upcoming || [])

      // Check favorites
      if (songsResponse.data.songs?.length > 0) {
        const favoriteChecks = await Promise.all(
          songsResponse.data.songs.map(song =>
            axios.get(`/api/songs/${song.id}/favorite`).then(r => ({ id: song.id, favorited: r.data.favorited })).catch(() => ({ id: song.id, favorited: false }))
          )
        )
        const newFavorites = new Set(favoriteChecks.filter(f => f.favorited).map(f => f.id))
        setFavorites(newFavorites)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (songId, e) => {
    e.stopPropagation()
    try {
      const response = await axios.post(`/api/songs/${songId}/favorite`)
      const newFavorites = new Set(favorites)
      if (response.data.favorited) {
        newFavorites.add(songId)
      } else {
        newFavorites.delete(songId)
      }
      setFavorites(newFavorites)
    } catch (err) {
      console.error('Error toggling favorite:', err)
    }
  }

  const handlePlaySong = (song) => {
    // Navigate to full-screen song player with video background
    navigate(`/song/${song.id}`)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <HeroSection artistInfo={artistInfo} />
      
      {/* Upcoming Releases Section */}
      {upcoming.length > 0 && (
        <section style={{
          padding: isMobile ? '2rem 1rem' : '3rem 2rem',
          background: '#0a0a0a'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <FiCalendar /> Coming Soon
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile 
              ? 'repeat(auto-fill, minmax(150px, 1fr))' 
              : 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: isMobile ? '1rem' : '1.5rem'
          }}>
            {upcoming.slice(0, 6).map(item => (
              <div
                key={item.id}
                style={{
                  background: '#1a1a1a',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #333',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  width: '100%',
                  aspectRatio: '1',
                  background: item.cover_image_path 
                    ? `url(${import.meta.env.VITE_API_URL || ''}${item.cover_image_path})` 
                    : '#2a2a2a',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {!item.cover_image_path && (
                    <div style={{ fontSize: '3rem', color: '#666' }}>
                      {item.type === 'song' ? <FiMusic /> : <FiDisc />}
                    </div>
                  )}
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {item.type === 'song' ? <FiMusic size={12} /> : <FiDisc size={12} />}
                    <span style={{ textTransform: 'capitalize' }}>{item.type}</span>
                  </div>
                </div>
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ 
                    margin: 0, 
                    marginBottom: '0.25rem', 
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.title || item.name}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    marginBottom: '0.5rem',
                    color: '#999', 
                    fontSize: '0.875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.artist}
                  </p>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#667eea',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <FiCalendar size={12} />
                    {formatDate(item.release_date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* User Stats Section */}
      {userStats && (
        <section style={{
          padding: isMobile ? '2rem 1rem' : '3rem 2rem',
          background: '#1a1a1a'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            Your Library
          </h2>
          
          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <StatCard
              title="Playlists"
              value={userStats.playlists?.total || 0}
              icon={<FiList />}
              color="#667eea"
              link="/playlists"
            />
            <StatCard
              title="Favorites"
              value={userStats.favorites?.total || 0}
              icon={<FiHeart />}
              color="#ef4444"
              link="/favorites"
            />
            <StatCard
              title="Total Plays"
              value={(userStats.listening?.total_plays || 0).toLocaleString()}
              icon={<FiPlay />}
              color="#10b981"
            />
            <StatCard
              title="This Month"
              value={(userStats.listening?.plays_last_30_days || 0).toLocaleString()}
              icon={<FiTrendingUp />}
              color="#f59e0b"
            />
          </div>

          {/* Quick Access Sections */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '1.5rem'
          }}>
            {/* Recent Playlists */}
            {userStats.playlists?.recent && userStats.playlists.recent.length > 0 && (
              <div style={{
                background: '#0a0a0a',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #333'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiList /> Your Playlists
                  </h3>
                  <Link to="/playlists" style={{ color: '#667eea', fontSize: '0.875rem', textDecoration: 'none' }}>
                    View all
                  </Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {userStats.playlists.recent.slice(0, 4).map(playlist => (
                    <Link
                      key={playlist.id}
                      to={`/playlists/${playlist.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: '#1a1a1a',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#fff',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#222'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#1a1a1a'}
                    >
                      <div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                          {playlist.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#999' }}>
                          {playlist.song_count} {playlist.song_count === 1 ? 'song' : 'songs'}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Most Played */}
            {userStats.listening?.most_played && userStats.listening.most_played.length > 0 && (
              <div style={{
                background: '#0a0a0a',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #333'
              }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiTrendingUp /> Most Played
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {userStats.listening.most_played.slice(0, 5).map((song, index) => (
                    <div
                      key={song.id}
                      onClick={() => handlePlaySong(song)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        background: '#1a1a1a',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#222'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#1a1a1a'}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '6px',
                        background: song.cover_image_path 
                          ? `url(${import.meta.env.VITE_API_URL || ''}${song.cover_image_path})` 
                          : '#2a2a2a',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        flexShrink: 0
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.9375rem',
                          fontWeight: '500',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginBottom: '0.25rem'
                        }}>
                          {song.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#999' }}>
                          {song.artist}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666', flexShrink: 0 }}>
                        {song.play_count}x
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <AlbumsSection albums={albums} />
      <SongsSection
        songs={songs}
        favorites={favorites}
        loading={loading}
        onPlaySong={handlePlaySong}
        onToggleFavorite={toggleFavorite}
      />
      <InstrumentalsSection />
      {showSubscriptionModal && (
        <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />
      )}
    </div>
  )
}

const StatCard = ({ title, value, icon, color, link }) => {
  const content = (
    <div style={{
      background: '#0a0a0a',
      padding: '1.25rem',
      borderRadius: '12px',
      border: '1px solid #333',
      borderLeft: `4px solid ${color}`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: link ? 'pointer' : 'default'
    }}
    onMouseEnter={(e) => {
      if (link) {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
      }
    }}
    onMouseLeave={(e) => {
      if (link) {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }
    }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.5rem'
      }}>
        <div style={{ color: '#999', fontSize: '0.8125rem', fontWeight: '500' }}>{title}</div>
        <div style={{ color, fontSize: '1.125rem' }}>{icon}</div>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color }}>
        {value}
      </div>
    </div>
  )

  if (link) {
    return (
      <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
        {content}
      </Link>
    )
  }

  return content
}

export default Home
