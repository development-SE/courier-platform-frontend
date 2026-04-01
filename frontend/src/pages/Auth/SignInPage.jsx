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
        <section className="auth-visual-panel" style={{ backgroundImage: `url(${authImageUrl})` }}>
          <div className="auth-visual-overlay">
            <h2>Welcome !</h2>
            <p>Log in to track, send and receive orders in one place.</p>
            <div className="auth-visual-switch">
              <span>Don&apos;t have an account?</span>
              <Link to="/sign-up">Sign up</Link>
            </div>
          </div>
        </section>

        <section className="auth-form-wrap">
          <div className="auth-form-panel">
            <h1>Welcome!</h1>

            <div className="auth-tab-row">
              <button type="button" className="auth-tab active">Mail</button>
              <button type="button" className="auth-tab">Phone number</button>
            </div>

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
                <button type="button" className="link-muted">Forgot password?</button>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Log in'}
              </button>
            </form>

            <div className="auth-or">OR</div>

            <div className="auth-socials">
              <button type="button">Continue with Google</button>
              <button type="button">Continue with Facebook</button>
              <button type="button">Continue with Apple</button>
            </div>

            <div className="auth-demo-accounts">
              <div>Admin: admin@example.com / 123456</div>
              <div>Partner: partner@example.com / 123456</div>
              <div>User: user@example.com / 123456</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
