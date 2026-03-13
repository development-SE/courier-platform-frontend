const AUTH_SESSION_KEY = 'auth_session'
const AUTH_USERS_KEY = 'auth_users'

const defaultUsers = [
  {
    id: '1',
    name: 'Admin',
    email: 'admin@example.com',
    password: '123456',
    role: 'ADMIN',
  },
  {
    id: '2',
    name: 'Partner',
    email: 'partner@example.com',
    password: '123456',
    role: 'PARTNER',
  },
]

const safeParse = (raw, fallback) => {
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

const normalizeUser = (user) => {
  const email = String(user?.email || '').trim().toLowerCase()
  const roleFromEmail = email === 'admin@example.com' ? 'ADMIN' : undefined

  return {
    ...user,
    email,
    role: roleFromEmail || user?.role || 'PARTNER',
  }
}

const resolveSessionRole = (session, users) => {
  if (session?.role) return session.role

  const matchedUser = users.find(user =>
    (session?.id && user.id === session.id)
    || (session?.email && String(user.email).toLowerCase() === String(session.email).toLowerCase()),
  )

  if (matchedUser?.role) return matchedUser.role
  if (String(session?.email || '').toLowerCase() === 'admin@example.com') return 'ADMIN'
  return 'PARTNER'
}

const ensureUsers = () => {
  const raw = localStorage.getItem(AUTH_USERS_KEY)
  if (!raw) {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(defaultUsers))
    return defaultUsers
  }

  const parsed = safeParse(raw, defaultUsers)
  if (!Array.isArray(parsed) || parsed.length === 0) {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(defaultUsers))
    return defaultUsers
  }

  const normalized = parsed.map(normalizeUser)
  const byEmail = new Map(normalized.map(user => [String(user.email).toLowerCase(), user]))

  // Ensure required demo accounts exist for RBAC testing.
  defaultUsers.forEach(defaultUser => {
    const email = String(defaultUser.email).toLowerCase()
    if (!byEmail.has(email)) {
      byEmail.set(email, defaultUser)
    }
  })

  const mergedUsers = Array.from(byEmail.values())
  const rawNormalized = JSON.stringify(mergedUsers)
  if (rawNormalized !== raw) {
    localStorage.setItem(AUTH_USERS_KEY, rawNormalized)
  }

  return mergedUsers
}

export const auth = {
  initialize() {
    ensureUsers()
  },

  isAuthenticated() {
    return Boolean(this.getSession())
  },

  getSession() {
    const raw = localStorage.getItem(AUTH_SESSION_KEY)
    if (!raw) return null

    const parsed = safeParse(raw, null)
    if (!parsed) return null

    const users = ensureUsers()
    const normalized = {
      ...parsed,
      role: resolveSessionRole(parsed, users),
    }

    if (parsed.role !== normalized.role) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(normalized))
    }

    return normalized
  },

  getDefaultRoute(session = null) {
    const activeSession = session || this.getSession()
    if (!activeSession) return '/sign-in'
    return activeSession.role === 'ADMIN' ? '/orders' : '/my-company'
  },

  signIn(email, password) {
    const users = ensureUsers()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const user = users.find(
      candidate =>
        String(candidate.email || '').trim().toLowerCase() === normalizedEmail
        && String(candidate.password || '') === String(password || ''),
    )

    if (!user) {
      throw new Error('Invalid email or password')
    }

    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'PARTNER',
    }

    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
    return session
  },

  signUp({ name, email, password }) {
    const users = ensureUsers()
    const normalizedEmail = String(email || '').trim().toLowerCase()

    const exists = users.some(
      user => String(user.email || '').trim().toLowerCase() === normalizedEmail,
    )

    if (exists) {
      throw new Error('User with this email already exists')
    }

    const nextUser = {
      id: String(Date.now()),
      name: String(name || '').trim(),
      email: normalizedEmail,
      password: String(password || ''),
      role: 'PARTNER',
    }

    const nextUsers = [nextUser, ...users]
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(nextUsers))

    return nextUser
  },

  signOut() {
    localStorage.removeItem(AUTH_SESSION_KEY)
  },
}
