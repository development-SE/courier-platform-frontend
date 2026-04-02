import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ROUTES } from '../../constants/routes'
import './auth.css'

export default function SignUpPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', login: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')

  const hasLowercase = /[a-z]/.test(form.password)
  const hasUppercase = /[A-Z]/.test(form.password)
  const hasDigit = /\d/.test(form.password)
  const hasSpecial = /[^A-Za-z0-9]/.test(form.password)

  const onChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const onSubmit = e => {
    e.preventDefault()
    if (!form.name.trim() || !form.login.trim() || !form.password.trim() || !form.confirmPassword.trim()) {
      setError('Fill all fields')
      return
    }

    if (form.password.length < 8 || !hasLowercase || !hasUppercase || !hasDigit || !hasSpecial) {
      setError('Password must be 8+ chars with upper/lowercase, number and special symbol')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    navigate(ROUTES.SIGN_IN, { replace: true })
  }

  return (
    <div className="auth-page">
      <div className="auth-frame">
        <div className="auth-hero auth-hero--sm">
          <div className="auth-statusbar">
            <span className="auth-statusbar__time">12:30</span>
            <div className="auth-statusbar__icons">
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <rect x="0" y="5" width="3" height="7" rx="1" fill="white" opacity=".45" />
                <rect x="4.5" y="3" width="3" height="9" rx="1" fill="white" opacity=".65" />
                <rect x="9" y="1" width="3" height="11" rx="1" fill="white" opacity=".85" />
                <rect x="13.5" y="0" width="2.5" height="12" rx="1" fill="white" />
              </svg>
            </div>
          </div>
        </div>

        <div className="auth-panel auth-panel--signup">
          <button
            type="button"
            className="auth-back"
            onClick={() => navigate(ROUTES.SIGN_IN)}
            aria-label="Back"
          >
            <ArrowLeft size={17} strokeWidth={2.5} />
          </button>

          <h1 className="auth-title auth-title--signup">Sign Up</h1>
          <p className="auth-subtitle">
            Sign up to track, send, and receive - all in one place.
          </p>

          <form className="auth-form auth-form--signup" onSubmit={onSubmit} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="su-name">Name</label>
              <input
                id="su-name"
                name="name"
                type="text"
                className="auth-input"
                placeholder="Dilnaz"
                value={form.name}
                onChange={onChange}
                autoComplete="name"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="su-login">Email</label>
              <input
                id="su-login"
                name="login"
                type="email"
                className="auth-input"
                placeholder="example@gmail.com"
                value={form.login}
                onChange={onChange}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="su-password">Password</label>
              <input
                id="su-password"
                name="password"
                type="password"
                className="auth-input"
                placeholder="**********"
                value={form.password}
                onChange={onChange}
                autoComplete="new-password"
              />
              <div className="auth-req">
                <p className="auth-req__head">Required</p>
                <ul className="auth-req__list">
                  <li>The minimum password length is 8 characters.</li>
                  <li>At least one lowercase letter (for example, a, b, c).</li>
                  <li>At least one capital letter (for example, A, B, C).</li>
                  <li>At least one digit (for example, 1, 2, 3).</li>
                  <li>At least one special character (for example, !, @, #, $).</li>
                </ul>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="su-confirm">Confirm password</label>
              <input
                id="su-confirm"
                name="confirmPassword"
                type="password"
                className="auth-input"
                placeholder="**********"
                value={form.confirmPassword}
                onChange={onChange}
                autoComplete="new-password"
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-btn-primary">Sign Up</button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to={ROUTES.SIGN_IN}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
