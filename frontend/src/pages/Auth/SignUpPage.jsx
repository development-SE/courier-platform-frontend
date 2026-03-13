import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../../utils/auth'
import authImageUrl from '../../assets/Auth.png'
import './auth.css'

export const SignUpPage = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      auth.signUp({ name, email, password })
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
        <div className="auth-visual">
          <div className="auth-visual-surface" style={{ backgroundImage: `url(${authImageUrl})` }}>
            <div className="auth-visual-title">Hey There!</div>
            <div className="auth-visual-center">
              <div>Welcome Back.</div>
              <div>You are just one step away to your feed.</div>
            </div>
            <div className="auth-visual-footer">
              <span>Already have an account?</span>
              <Link to="/sign-in" className="auth-visual-link">Sign in</Link>
            </div>
          </div>
        </div>

        <div className="auth-form-wrap">
          <h1>SIGN UP</h1>
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={event => setName(event.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" disabled={loading}>{loading ? 'Signing up...' : 'Sign up'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}