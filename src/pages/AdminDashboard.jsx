import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AdminDashboard = () => {
  const { user } = useAuth()

  if (user?.role !== 'admin') {
    return <div>Access denied</div>
  }

  // Redirect to dashboard by default
  return <Navigate to="/admin/dashboard" replace />
}

export default AdminDashboard
