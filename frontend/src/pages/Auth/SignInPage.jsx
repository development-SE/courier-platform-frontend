import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { auth } from '../../utils/auth'
import { authApi } from '../../api/auth.api'
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
      const data = await authApi.login({ email, password })
      const decoded = auth.decodeToken(data.accessToken)
      const session = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        role: data.role,
        userId: decoded?.sub || null,
        companyId: decoded?.companyId || null,
      }
      localStorage.setItem('auth_session', JSON.stringify(session))
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
        <section className="auth-visual-panel" style={{ backgroundImage: `url(${authImageUrl})` }}>
          <div className="auth-visual-overlay">
            <h2>Welcome !</h2>
            <p>Log in to track, send and receive orders in one place.</p>
          </div>
        </section>

        <section className="auth-form-wrap">
          <div className="auth-form-panel">
            <h1>Welcome!</h1>

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

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Log in'}
              </button>
            </form>
            <div className="auth-form-meta">
              <Link to="/sign-up" className="link-muted">Create account</Link>
              <button type="button" className="link-muted">Forgot password?</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
