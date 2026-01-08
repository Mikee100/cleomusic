import { useState, useEffect } from 'react'
import axios from 'axios'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useAuth } from '../context/AuthContext'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key')

const SubscriptionForm = ({ plans, onClose, onSuccess }) => {
  const stripe = useStripe()
  const elements = useElements()
  const { fetchUser } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('stripe')
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStripePayment = async () => {
    if (!selectedPlan) return

    setLoading(true)
    setError('')

    try {
      const { data } = await axios.post('/api/payments/stripe/create-intent', {
        planId: selectedPlan.id
      })

      // Test mode: Subscription already created, just refresh user data
      if (data.testMode || data.clientSecret === 'test_mode') {
        await fetchUser()
        onSuccess()
        onClose()
        return
      }

      // Real Stripe payment (when implemented)
      if (!stripe || !elements) {
        setError('Stripe not loaded. Please refresh the page.')
        setLoading(false)
        return
      }

      const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)
        }
      })

      if (confirmError) {
        setError(confirmError.message)
      } else {
        await fetchUser()
        onSuccess()
        onClose()
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError(err.response?.data?.error || err.message || 'Payment failed')
      setLoading(false)
    }
  }

  const handleMpesaPayment = async () => {
    if (!selectedPlan || !mpesaPhone) {
      setError('Please enter your phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data } = await axios.post('/api/payments/mpesa/initiate', {
        planId: selectedPlan.id,
        phoneNumber: mpesaPhone
      })
      
      // Test mode: Subscription already created, just refresh user data
      if (data.testMode) {
        await fetchUser()
        onSuccess()
        onClose()
      } else {
        // Real M-Pesa flow (when implemented)
        alert('Payment request sent. Please check your phone to complete the payment.')
        setTimeout(() => {
          fetchUser()
          onSuccess()
          onClose()
        }, 5000)
      }
    } catch (err) {
      console.error('M-Pesa payment error:', err)
      setError(err.response?.data?.error || err.message || 'Payment initiation failed')
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Choose a Plan</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {plans.map(plan => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan)}
            style={{
              padding: '1.5rem',
              border: selectedPlan?.id === plan.id ? '2px solid #667eea' : '1px solid #333',
              borderRadius: '12px',
              cursor: 'pointer',
              background: selectedPlan?.id === plan.id ? '#1a1a2a' : '#1a1a1a',
              transition: 'all 0.2s'
            }}
          >
            <h3 style={{ marginBottom: '0.5rem' }}>{plan.name}</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              KES {plan.price}
            </div>
            <p style={{ color: '#999', fontSize: '0.875rem' }}>{plan.description}</p>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Payment Method</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setPaymentMethod('stripe')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: paymentMethod === 'stripe' ? '#667eea' : '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Stripe (Card)
              </button>
              <button
                onClick={() => setPaymentMethod('mpesa')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: paymentMethod === 'mpesa' ? '#667eea' : '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                M-Pesa
              </button>
            </div>
          </div>

          {paymentMethod === 'stripe' && stripe && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Card Details</label>
              <div style={{
                padding: '1rem',
                background: '#2a2a2a',
                border: '1px solid #333',
                borderRadius: '8px'
              }}>
                <CardElement />
              </div>
            </div>
          )}
          {paymentMethod === 'stripe' && !stripe && (
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: '#999' }}>
              Test Mode: Subscription will be activated immediately without payment processing.
            </div>
          )}

          {paymentMethod === 'mpesa' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Phone Number</label>
              <input
                type="tel"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                placeholder="254712345678"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              />
            </div>
          )}

          {error && <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={paymentMethod === 'stripe' ? handleStripePayment : handleMpesaPayment}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#667eea',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Processing...' : `Subscribe for KES ${selectedPlan.price}`}
            </button>
            <button
              onClick={onClose}
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
        </div>
      )}
    </div>
  )
}

const SubscriptionModal = ({ onClose, onSuccess }) => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/api/subscriptions/plans')
      setPlans(response.data)
    } catch (err) {
      console.error('Error fetching plans:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOverlayClick = (e) => {
    // Close when clicking on the dark background, not the content
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      onClick={handleOverlayClick}
      style={{
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
      }}
    >
      <div style={{
        position: 'relative',
        background: '#1a1a1a',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Close button in top-right corner */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}
          aria-label="Close subscription plans"
        >
          ×
        </button>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading plans...</div>
        ) : (
          <Elements stripe={stripePromise}>
            <SubscriptionForm plans={plans} onClose={onClose} onSuccess={onSuccess || (() => {})} />
          </Elements>
        )}
      </div>
    </div>
  )
}

export default SubscriptionModal

