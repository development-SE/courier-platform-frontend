import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithCredentials } from '../../services/authService'
import { ROUTES } from '../../constants/routes'
import './auth.css'

export default function SignInPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const onSubmit = async e => {
    e.preventDefault()
    if (!form.login.trim() || !form.password.trim()) {
      setError('Enter login and password')
      return
    }
    setLoading(true)
    try {
      await signInWithCredentials(form.login.trim(), form.password)
      navigate(ROUTES.DASHBOARD, { replace: true })
    } catch (err) {
      setError(err.message || 'Wrong login or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-frame">

        {/* ── Hero ── */}
        <div className="auth-hero">
          <div className="auth-statusbar">
            <span className="auth-statusbar__time">12:30</span>
            <div className="auth-statusbar__icons">
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <rect x="0" y="5" width="3" height="7" rx="1" fill="white" opacity=".45"/>
                <rect x="4.5" y="3" width="3" height="9" rx="1" fill="white" opacity=".65"/>
                <rect x="9" y="1" width="3" height="11" rx="1" fill="white" opacity=".85"/>
                <rect x="13.5" y="0" width="2.5" height="12" rx="1" fill="white"/>
              </svg>
            </div>
          </div>
        </div>

        {/* ── Panel ── */}
        <div className="auth-panel">
          <h1 className="auth-title">Welcome!</h1>
          <p className="auth-subtitle">Log in. Let&apos;s deliver.</p>

          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <input
              name="login"
              type="text"
              className="auth-input"
              placeholder="Email"
              value={form.login}
              onChange={onChange}
              autoComplete="username"
            />
            <input
              name="password"
              type="password"
              className="auth-input"
              placeholder="Password"
              value={form.password}
              onChange={onChange}
              autoComplete="current-password"
            />

            <div className="auth-row">
              <button type="button" className="auth-forgot">Forgot password</button>
              <button type="submit" className="auth-btn-login" disabled={loading}>
                {loading ? '...' : 'Log in'}
              </button>
            </div>

            {error && <p className="auth-error">{error}</p>}
          </form>

          <div className="auth-or"><span>OR</span></div>

          <div className="auth-socials">
            <button type="button" className="auth-social">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24C18.34 15.9 19.6 13.27 19.6 10.23z" fill="#4285F4"/>
                <path d="M10 20c2.7 0 4.97-.9 6.62-2.43l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.75-5.6-4.11H1.08v2.58A10 10 0 0 0 10 20z" fill="#34A853"/>
                <path d="M4.4 11.9A6 6 0 0 1 4.08 10c0-.66.12-1.3.32-1.9V5.52H1.08A10 10 0 0 0 0 10c0 1.6.39 3.12 1.08 4.48L4.4 11.9z" fill="#FBBC04"/>
                <path d="M10 3.98c1.47 0 2.79.5 3.83 1.5L16.68 2.4A9.9 9.9 0 0 0 10 0 10 10 0 0 0 1.08 5.52L4.4 8.1C5.2 5.73 7.4 3.98 10 3.98z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button type="button" className="auth-social">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M20 10a10 10 0 1 0-11.56 9.88v-6.99H5.9V10h2.54V7.8c0-2.5 1.49-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V10h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 20 10z" fill="#1877F2"/>
              </svg>
              Continue with Facebook
            </button>
            <button type="button" className="auth-social">
              <svg width="20" height="20" viewBox="0 0 814 1000" fill="none">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.3-165.9-40.8l-10.1-.7c-37.8-2.8-120.6-49.6-153.5-147.3-17.4-51.4-28-113.7-28-175.4 0-185 120.1-283 237.9-283 75.9 0 139.1 49.5 183.6 49.5 42.5 0 108.9-52.3 198.2-52.3zm-43.7-157.8c37.3-44.4 64.1-105.7 64.1-167 0-8.3-.6-16.7-2-24.4-59.5 2.3-129 39.7-170.4 88-33.7 38.8-62.3 100.3-62.3 162.3 0 9 1.3 18 2 20.7 3.6.7 9.6 1.3 15.6 1.3 53.3 0 119.1-36 153-80.9z" fill="black"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          <p className="auth-switch">
            Don&apos;t have an account? <Link to={ROUTES.SIGN_UP}>Sign Up</Link>
          </p>
          <p className="auth-legal">
            By continuing, you automatically accept our Terms &amp; Conditions and Privacy Policy.
          </p>
        </div>

      </div>
    </div>
  )
}
