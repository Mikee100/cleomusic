import { useState, useEffect } from 'react'
import axios from 'axios'
import { useResponsive } from '../../hooks/useResponsive'
import { FiPackage, FiEdit, FiTrash2, FiPlus, FiX } from 'react-icons/fi'

const Plans = () => {
  const { isMobile } = useResponsive()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_days: '',
    stripe_price_id: '',
    is_active: true
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/admin/plans')
      setPlans(response.data)
    } catch (err) {
      console.error('Error fetching plans:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingPlan) {
        await axios.put(`/api/admin/plans/${editingPlan.id}`, formData)
      } else {
        await axios.post('/api/admin/plans', formData)
      }
      setShowPlanModal(false)
      setEditingPlan(null)
      setFormData({ name: '', description: '', price: '', duration_days: '', stripe_price_id: '', is_active: true })
      fetchPlans()
    } catch (err) {
      alert(err.response?.data?.error || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this plan?')) return
    try {
      await axios.delete(`/api/admin/plans/${id}`)
      fetchPlans()
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: isMobile ? '1rem' : '2rem' }}>
        <h1 style={{ 
          fontSize: isMobile ? '1.5rem' : '2rem', 
          marginBottom: '0.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <FiPackage /> Subscription Plans
        </h1>
        <p style={{ color: '#999', fontSize: isMobile ? '0.875rem' : '1rem' }}>Manage subscription plans</p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => {
            setEditingPlan(null)
            setFormData({ name: '', description: '', price: '', duration_days: '', stripe_price_id: '', is_active: true })
            setShowPlanModal(true)
          }}
          style={{
            padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem',
            background: '#667eea',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: isMobile ? '0.875rem' : '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            width: isMobile ? '100%' : 'auto',
            justifyContent: 'center'
          }}
        >
          <FiPlus /> Create New Plan
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: isMobile ? '1rem' : '2rem' }}>Loading...</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile 
            ? 'repeat(1, 1fr)' 
            : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          {plans.map(plan => (
            <div key={plan.id} style={{
              background: '#1a1a1a',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #333'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{plan.name}</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                    KES {plan.price}
                  </div>
                </div>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  background: plan.is_active ? '#10b981' : '#666',
                  color: '#fff'
                }}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p style={{ color: '#999', marginBottom: '1rem' }}>{plan.description}</p>
              <div style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Duration: {plan.duration_days} days
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setEditingPlan(plan)
                    setFormData({
                      name: plan.name,
                      description: plan.description || '',
                      price: plan.price,
                      duration_days: plan.duration_days,
                      stripe_price_id: plan.stripe_price_id || '',
                      is_active: plan.is_active
                    })
                    setShowPlanModal(true)
                  }}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <FiEdit /> Edit
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  style={{
                    padding: '0.5rem',
                    background: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPlanModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '2rem'
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '2rem',
            maxHeight: '90vh',
            overflow: 'auto',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>{editingPlan ? 'Edit Plan' : 'Create Plan'}</h2>
              <button onClick={() => {
                setShowPlanModal(false)
                setEditingPlan(null)
              }} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.5rem' }}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    minHeight: '80px'
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#2a2a2a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Duration (days) *</label>
                  <input
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#2a2a2a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Stripe Price ID</label>
                <input
                  type="text"
                  value={formData.stripe_price_id}
                  onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: '20px', height: '20px' }}
                  />
                  Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#667eea',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {editingPlan ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPlanModal(false)
                    setEditingPlan(null)
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Plans

