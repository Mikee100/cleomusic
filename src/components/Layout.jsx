import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import MusicPlayer from './MusicPlayer'
import { 
  FiHome, FiMusic, FiLogOut, FiSettings, FiBarChart2, 
  FiUsers, FiDollarSign, FiPackage, FiDisc, FiTrendingUp,
  FiClock, FiHeart, FiVideo, FiImage, FiChevronLeft, FiChevronRight,
  FiMessageCircle, FiMenu, FiX, FiDownload, FiCalendar
} from 'react-icons/fi'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdminPage = location.pathname.startsWith('/admin')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getLinkStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    marginBottom: '0.5rem',
    borderRadius: '8px',
    color: location.pathname === path ? '#667eea' : '#fff',
    textDecoration: 'none',
    transition: 'background 0.2s',
    background: location.pathname === path ? '#2a2a2a' : 'transparent',
    fontWeight: location.pathname === path ? 'bold' : 'normal',
    justifyContent: isCollapsed ? 'center' : 'flex-start',
    position: 'relative'
  })

  const getSectionHeaderStyle = () => ({
    marginTop: '0.5rem',
    marginBottom: '0.25rem',
    padding: '0.15rem 0.5rem',
    color: '#666',
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    display: (isCollapsed && !isMobile) ? 'none' : 'block',
    fontWeight: '600',
    letterSpacing: '0.5px'
  })

  const getSeparatorStyle = () => ({
    height: '1px',
    background: '#333',
    margin: '0.5rem 0',
    display: (isCollapsed && !isMobile) ? 'none' : 'block'
  })

  const sidebarWidth = isCollapsed && !isMobile ? '80px' : '250px'
  const mobileSidebarWidth = isMobileMenuOpen ? '280px' : '0px'

  return (
    <>
      <style>{`
        .sidebar-nav::-webkit-scrollbar {
          width: 6px;
        }
        
        .sidebar-nav::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }
        
        .sidebar-nav::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 10px;
          transition: background 0.2s ease;
        }
        
        .sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        
        .sidebar-nav::-webkit-scrollbar-thumb:active {
          background: #666;
        }
        
        /* Firefox scrollbar styling */
        .sidebar-nav {
          scrollbar-width: thin;
          scrollbar-color: #444 transparent;
        }

        @media (max-width: 768px) {
          .mobile-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 999;
            transition: opacity 0.3s ease;
          }
        }
      `}</style>
      
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 1001,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          {isMobileMenuOpen ? <FiX /> : <FiMenu />}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            opacity: isMobileMenuOpen ? 1 : 0,
            pointerEvents: isMobileMenuOpen ? 'auto' : 'none'
          }}
        />
      )}

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside style={{
          width: isMobile ? mobileSidebarWidth : sidebarWidth,
          height: '100vh',
          background: '#1a1a1a',
          padding: (isCollapsed && !isMobile) ? '1rem' : '2rem',
          borderRight: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          transition: isMobile 
            ? 'transform 0.3s ease, width 0.3s ease' 
            : 'width 0.3s ease, padding 0.3s ease',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1000,
          overflow: 'hidden',
          transform: isMobile 
            ? (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)')
            : 'translateX(0)',
          boxShadow: isMobile && isMobileMenuOpen ? '4px 0 20px rgba(0,0,0,0.5)' : 'none'
        }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '2rem',
          flexShrink: 0
        }}>
          {(!isCollapsed || isMobile) && (
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Cleo Music</h1>
          )}
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                background: 'transparent',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
                marginLeft: isCollapsed ? '0' : 'auto'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a2a'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </button>
          )}
        </div>
        <nav 
          className="sidebar-nav"
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            overflowX: 'hidden',
            paddingRight: '0.5rem',
            marginRight: '-0.5rem'
          }}
        >
          <Link to="/" style={getLinkStyle('/')}>
            <FiHome /> {(!isCollapsed || isMobile) && 'All Songs'}
          </Link>
          <Link to="/popular" style={getLinkStyle('/popular')}>
            <FiTrendingUp /> {(!isCollapsed || isMobile) && 'Popular'}
          </Link>
          <Link to="/recently-played" style={getLinkStyle('/recently-played')}>
            <FiClock /> {(!isCollapsed || isMobile) && 'Recently Played'}
          </Link>
          <Link to="/favorites" style={getLinkStyle('/favorites')}>
            <FiHeart /> {(!isCollapsed || isMobile) && 'Favorites'}
          </Link>
          <Link to="/playlists" style={getLinkStyle('/playlists')}>
          <FiMusic /> {(!isCollapsed || isMobile) && 'Playlists'}
          </Link>
          <Link to="/downloads" style={getLinkStyle('/downloads')}>
            <FiDownload /> {(!isCollapsed || isMobile) && 'Downloads'}
          </Link>
          <Link to="/photos" style={getLinkStyle('/photos')}>
            <FiImage /> {(!isCollapsed || isMobile) && 'Photos'}
          </Link>
          <Link to="/videos" style={getLinkStyle('/videos')}>
            <FiVideo /> {(!isCollapsed || isMobile) && 'Videos'}
          </Link>
          <Link to="/reels" style={getLinkStyle('/reels')}>
            <FiVideo /> {(!isCollapsed || isMobile) && 'Reels'}
          </Link>
          <Link to="/instrumentals" style={getLinkStyle('/instrumentals')}>
            <FiMusic /> {(!isCollapsed || isMobile) && 'Instrumentals'}
          </Link>
          
          <div style={getSeparatorStyle()} />
          <Link to="/profile" style={getLinkStyle('/profile')}>
            <FiSettings /> {(!isCollapsed || isMobile) && 'Profile'}
          </Link>
          <button
            onClick={handleLogout}
            style={{
              ...getLinkStyle('/logout'),
              background: 'transparent',
              border: 'none',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a2a'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <FiLogOut /> {(!isCollapsed || isMobile) && 'Logout'}
          </button>
          
          {user?.role === 'admin' && (
            <>
              <div style={getSeparatorStyle()} />
              <div style={getSectionHeaderStyle()}>
                Admin
              </div>
              <Link to="/admin/dashboard" style={getLinkStyle('/admin/dashboard')}>
                <FiBarChart2 /> {(!isCollapsed || isMobile) && 'Dashboard'}
              </Link>
              
              <div style={getSeparatorStyle()} />
              <div style={getSectionHeaderStyle()}>
                Songs
              </div>
              <Link to="/admin/songs" style={getLinkStyle('/admin/songs')}>
                <FiMusic /> {(!isCollapsed || isMobile) && 'Songs'}
              </Link>
              <Link to="/admin/albums" style={getLinkStyle('/admin/albums')}>
                <FiDisc /> {(!isCollapsed || isMobile) && 'Albums'}
              </Link>
              <Link to="/admin/instrumentals" style={getLinkStyle('/admin/instrumentals')}>
                <FiMusic /> {(!isCollapsed || isMobile) && 'Instrumentals'}
              </Link>
              
              <div style={getSeparatorStyle()} />
              <div style={getSectionHeaderStyle()}>
                Videos
              </div>
              <Link to="/admin/videos" style={getLinkStyle('/admin/videos')}>
                <FiVideo /> {(!isCollapsed || isMobile) && 'Videos'}
              </Link>
              <Link to="/admin/reels" style={getLinkStyle('/admin/reels')}>
                <FiVideo /> {(!isCollapsed || isMobile) && 'Reels'}
              </Link>
              
              <div style={getSeparatorStyle()} />
              <div style={getSectionHeaderStyle()}>
                Photos
              </div>
              <Link to="/admin/photos" style={getLinkStyle('/admin/photos')}>
                <FiImage /> {(!isCollapsed || isMobile) && 'Photos'}
              </Link>
              
              <div style={getSeparatorStyle()} />
              <Link to="/admin/users" style={getLinkStyle('/admin/users')}>
                <FiUsers /> {(!isCollapsed || isMobile) && 'Users'}
              </Link>
              <Link to="/admin/payments" style={getLinkStyle('/admin/payments')}>
                <FiDollarSign /> {(!isCollapsed || isMobile) && 'Payments'}
              </Link>
              <Link to="/admin/plans" style={getLinkStyle('/admin/plans')}>
                <FiPackage /> {(!isCollapsed || isMobile) && 'Plans'}
              </Link>
              
              <div style={getSeparatorStyle()} />
              <div style={getSectionHeaderStyle()}>
                Content
              </div>
              <Link to="/admin/upcoming" style={getLinkStyle('/admin/upcoming')}>
                <FiCalendar /> {(!isCollapsed || isMobile) && 'Upcoming Releases'}
              </Link>
              
              <div style={getSeparatorStyle()} />
              <div style={getSectionHeaderStyle()}>
                Engagement
              </div>
              <Link to="/admin/reactions" style={getLinkStyle('/admin/reactions')}>
                <FiMessageCircle /> {(!isCollapsed || isMobile) && 'Reactions'}
              </Link>
            </>
          )}
        </nav>
      </aside>
      <main style={{ 
        flex: 1, 
        padding: isMobile ? '1rem' : '2rem', 
        overflow: 'auto',
        marginLeft: isMobile ? '0' : sidebarWidth,
        paddingTop: isMobile ? '4rem' : '2rem',
        minHeight: '100vh',
        transition: 'margin-left 0.3s ease, padding 0.3s ease',
        width: isMobile ? '100%' : `calc(100% - ${sidebarWidth})`
      }}>
        {children}
      </main>
      <MusicPlayer />
      </div>
    </>
  )
}

export default Layout

