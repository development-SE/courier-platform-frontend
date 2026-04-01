import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../../utils/auth'
import authImageUrl from '../../assets/Auth.png'
import './auth.css'

export const SignUpPage = () => {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async event => {
    event.preventDefault()
    setError('')

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('All required fields must be filled')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await auth.signUp({ firstName, lastName, email, password, phone })
      navigate('/sign-in', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <section className="auth-visual-panel" style={{ backgroundImage: `url(${authImageUrl})` }}>
          <div className="auth-visual-overlay">
            <h2>Sign Up</h2>
            <p>Create account to order delivery and track your orders.</p>
            <div className="auth-visual-switch">
              <span>Already have an account?</span>
              <Link to="/sign-in">Sign in</Link>
            </div>
          </div>
        </section>

        <section className="auth-form-wrap">
          <Link to="/sign-in" className="auth-signup-back" aria-label="Back to sign in">
            ←
          </Link>
          <div className="auth-form-panel auth-signup-panel">
            <h1>Sign Up</h1>
            <p className="auth-signup-subtitle">Create your account and start using SwiftDeliver.</p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-input-label" htmlFor="signup-first-name">First Name</label>
              <input
                id="signup-first-name"
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={event => setFirstName(event.target.value)}
              />

              <label className="auth-input-label" htmlFor="signup-last-name">Last Name</label>
              <input
                id="signup-last-name"
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={event => setLastName(event.target.value)}
              />

              <label className="auth-input-label" htmlFor="signup-phone">Phone (optional)</label>
              <input
                id="signup-phone"
                type="text"
                placeholder="Phone"
                value={phone}
                onChange={event => setPhone(event.target.value)}
              />

              <label className="auth-input-label" htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={event => setEmail(event.target.value)}
              />

              <label className="auth-input-label" htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={event => setPassword(event.target.value)}
              />

              <label className="auth-input-label" htmlFor="signup-confirm-password">Confirm password</label>
              <input
                id="signup-confirm-password"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
              />

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" disabled={loading}>
                {loading ? 'Signing up...' : 'Sign up'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
