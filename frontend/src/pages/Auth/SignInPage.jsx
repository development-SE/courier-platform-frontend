import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { auth } from '../../utils/auth'
import authImageUrl from '../../assets/Auth.png'
import './auth.css'

export const SignInPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('partner@example.com')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const redirectTo = location.state?.from?.pathname

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required')
      return
    }

    setLoading(true)
    try {
      const session = await auth.signIn(email, password)
      navigate(redirectTo || auth.getDefaultRoute(session), { replace: true })
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
              <span>Do not have an account?</span>
              <Link to="/sign-up" className="auth-visual-link">Sign up</Link>
            </div>
          </div>
        </div>

        <div className="auth-form-wrap">
          <h1>SIGN IN</h1>
          <form className="auth-form" onSubmit={handleSubmit}>
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
            <div className="auth-form-meta">
              <label><input type="checkbox" /> Keep me logged in</label>
              <button type="button" className="link-muted">Forgot Password?</button>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
            <div className="auth-error" style={{ color: '#64748b' }}>
              Admin: admin@example.com / 123456
            </div>
            <div className="auth-error" style={{ color: '#64748b' }}>
              Partner: partner@example.com / 123456
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
