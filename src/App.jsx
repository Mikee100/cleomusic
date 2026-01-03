import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PlayerProvider } from './context/PlayerContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Popular from './pages/Popular'
import RecentlyPlayed from './pages/RecentlyPlayed'
import Favorites from './pages/Favorites'
import AdminDashboard from './pages/AdminDashboard'
import Dashboard from './pages/admin/Dashboard'
import Songs from './pages/admin/Songs'
import Albums from './pages/admin/Albums'
import AlbumDetail from './pages/admin/AlbumDetail'
import Users from './pages/admin/Users'
import Payments from './pages/admin/Payments'
import Plans from './pages/admin/Plans'
import Photos from './pages/admin/Photos'
import Videos from './pages/admin/Videos'
import Reactions from './pages/admin/Reactions'
import ClientPhotos from './pages/Photos'
import ClientVideos from './pages/Videos'
import Instrumentals from './pages/Instrumentals'
import AdminInstrumentals from './pages/admin/Instrumentals'
import Playlists from './pages/Playlists'
import PlaylistDetail from './pages/PlaylistDetail'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'

function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Home />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/popular"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Popular />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recently-played"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RecentlyPlayed />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Favorites />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/photos"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClientPhotos />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/videos"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClientVideos />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/instrumentals"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Instrumentals />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/playlists"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Playlists />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/playlists/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PlaylistDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/songs"
              element={
                <AdminRoute>
                  <Layout>
                    <Songs />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/albums"
              element={
                <AdminRoute>
                  <Layout>
                    <Albums />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/albums/:id"
              element={
                <AdminRoute>
                  <Layout>
                    <AlbumDetail />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/instrumentals"
              element={
                <AdminRoute>
                  <Layout>
                    <AdminInstrumentals />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <Layout>
                    <Users />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <AdminRoute>
                  <Layout>
                    <Payments />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/plans"
              element={
                <AdminRoute>
                  <Layout>
                    <Plans />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/photos"
              element={
                <AdminRoute>
                  <Layout>
                    <Photos />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/videos"
              element={
                <AdminRoute>
                  <Layout>
                    <Videos />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/reactions"
              element={
                <AdminRoute>
                  <Layout>
                    <Reactions />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </PlayerProvider>
    </AuthProvider>
  )
}

export default App

