import { create } from 'zustand'
import {
  clearAuthorizedState,
  persistAuthorizedState,
  readAuthorizedState,
  readAuthTokens,
  persistAuthTokens,
  clearAuthTokens,
  readNotificationDeviceState,
  persistNotificationDeviceState,
  clearNotificationDeviceState,
} from '../platform/authStorage'
import { loginWithBackend, refreshSessionWithBackend, registerWithBackend, logout } from '../data/authApi'
import { toggleOnlineStatus } from '../data/logisticsApi'
import { getAuthProfile, type AuthProfile } from '../data/profileApi'
import { getMyCourierProfile, updateCourierProfile, type CourierProfile, type UpdateCourierProfileRequest } from '../data/courierApi'
import {
  registerNotificationDevice,
  setNotificationDeviceEnabled,
  unregisterNotificationDevice,
  type NotificationDeviceState,
  type DeviceRegistrationPayload,
} from '../data/notificationApi'
import { buildExpoNotificationDevicePayload } from '../platform/pushNotifications'
import { useShiftStore } from './shiftStore'

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function atobPureJS(input: string): string {
  const str = String(input).replace(/=+$/, '')
  let output = ''
  if (str.length % 4 === 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.")
  }
  for (
    let bc = 0, bs = 0, buffer, idx = 0;
    (buffer = str.charAt(idx++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer)
  }
  return output
}

function decodeJwt(token: string): { sub?: string; role?: string; username?: string; companyId?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const raw = atobPureJS(base64)
    return JSON.parse(raw)
  } catch (e) {
    console.log('Error decoding JWT:', e)
    return null
  }
}

type AuthStatus = 'loading' | 'ready'

type AuthState = {
  status: AuthStatus
  authorized: boolean
  accessToken?: string
  refreshToken?: string
  courierId?: string
  role?: string
  companyId?: string
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  courierProfile?: CourierProfile
  notificationDevice?: NotificationDeviceState
  hydrate: () => Promise<void>
  signIn: (login: string, password: string) => Promise<{ ok: true } | { ok: false; message: string; reason?: string }>
  signUp: (params: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
  }) => Promise<{ ok: true } | { ok: false; message: string }>
  signOut: () => Promise<void>
  patchCourierProfile: (data: UpdateCourierProfileRequest) => Promise<{ ok: true } | { ok: false; message: string }>
  reloadCourierProfile: () => Promise<{ ok: true } | { ok: false; message: string }>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  authorized: false,
  accessToken: undefined,
  refreshToken: undefined,
  courierId: undefined,
  role: undefined,
  companyId: undefined,
  email: undefined,
  firstName: undefined,
  lastName: undefined,
  phone: undefined,
  courierProfile: undefined,
  notificationDevice: undefined,

  async hydrate() {
    console.log('[AuthStore] Starting auth store hydration...');
    try {
      const authorized = await readAuthorizedState()
      const tokens = await readAuthTokens()
      const storedNotificationDevice = normalizeNotificationDevice(await readNotificationDeviceState())

      console.log('[AuthStore] Storage data retrieved:', {
        authorized,
        hasAccessToken: !!tokens?.accessToken,
        hasRefreshToken: !!tokens?.refreshToken,
        hasNotificationDevice: !!storedNotificationDevice,
      });

      if (!tokens?.accessToken) {
        console.log('[AuthStore] No access token found. Setting status to ready (unauthorized).');
        set({
          authorized: false,
          accessToken: undefined,
          refreshToken: undefined,
          courierId: undefined,
          role: undefined,
          companyId: undefined,
          email: undefined,
          firstName: undefined,
          lastName: undefined,
          phone: undefined,
          courierProfile: undefined,
          notificationDevice: storedNotificationDevice,
          status: 'ready',
        })
        return
      }

      let accessToken = tokens.accessToken
      let refreshToken = tokens.refreshToken

      if (refreshToken) {
        console.log('[AuthStore] Found refresh token. Attempting session refresh...');
        try {
          const refreshResponse = await refreshSessionWithBackend(refreshToken)
          console.log('[AuthStore] Refresh response status ok:', refreshResponse.ok);

          if (
            refreshResponse.ok &&
            refreshResponse.data &&
            refreshResponse.data.success &&
            refreshResponse.data.data?.accessToken &&
            refreshResponse.data.data?.refreshToken
          ) {
            console.log('[AuthStore] Session refresh succeeded.');
            accessToken = refreshResponse.data.data.accessToken
            refreshToken = refreshResponse.data.data.refreshToken
            await persistAuthTokens({ accessToken, refreshToken })
            await persistAuthorizedState(true)
          } else {
            // Check if token is invalid or expired
            const isInvalidToken =
              (!refreshResponse.ok && refreshResponse.error?.status === 401) ||
              (refreshResponse.ok && (!refreshResponse.data || !refreshResponse.data.success))

            if (isInvalidToken) {
              console.log('[AuthStore] Refresh token invalid/expired. Wiping auth state.');
              await clearAuthorizedState()
              await clearAuthTokens()
              await clearNotificationDeviceState()
              set({
                authorized: false,
                accessToken: undefined,
                refreshToken: undefined,
                courierId: undefined,
                role: undefined,
                companyId: undefined,
                email: undefined,
                firstName: undefined,
                lastName: undefined,
                phone: undefined,
                courierProfile: undefined,
                notificationDevice: undefined,
                status: 'ready',
              })
              return
            } else {
              console.log('[AuthStore] Refresh failed due to network/server error. Proceeding with existing tokens.');
            }
          }
        } catch (refreshErr) {
          console.error('[AuthStore] Error during session refresh in hydrate:', refreshErr)
          // Continue attempting to hydrate using existing tokens
        }
      }

      console.log('[AuthStore] Decoding JWT and fetching profiles...');
      const decoded = decodeJwt(accessToken)
      const courierId = decoded?.sub
      const role = decoded?.role
      const companyId = decoded?.companyId

      let authProfile: AuthProfile | null = null
      let isProfileUnauthorized = false
      try {
        console.log('[AuthStore] Fetching auth profile for access token:', accessToken.slice(0, 15) + '...');
        const profileResponse = await getAuthProfile(accessToken)
        console.log('[AuthStore] Auth profile response ok:', profileResponse.ok);
        if (profileResponse.ok && profileResponse.data && profileResponse.data.success && profileResponse.data.data) {
          authProfile = profileResponse.data.data
        } else if (!profileResponse.ok && profileResponse.error?.status === 401) {
          isProfileUnauthorized = true
        }
      } catch (profileErr) {
        console.error('[AuthStore] Error fetching auth profile in hydrate:', profileErr)
      }

      let courierProfile: CourierProfile | undefined = undefined
      let isCourierUnauthorized = false
      let isCourierNotFound = false
      try {
        console.log('[AuthStore] Fetching courier profile...');
        const courierResponse = await getMyCourierProfile(accessToken)
        console.log('[AuthStore] Courier profile response ok:', courierResponse.ok);
        if (courierResponse.ok && courierResponse.data) {
          if (courierResponse.data.success && courierResponse.data.data) {
            courierProfile = courierResponse.data.data
          } else {
            isCourierNotFound = true
            console.warn('[AuthStore] Courier profile not found. data:', JSON.stringify(courierResponse.data))
          }
        } else if (!courierResponse.ok) {
          console.warn('[AuthStore] Courier profile error status:', courierResponse.error?.status, 'message:', courierResponse.error?.message)
          if (courierResponse.error?.status === 401) {
            isCourierUnauthorized = true
          }
        }
      } catch (courierErr) {
        console.error('[AuthStore] Error fetching courier profile in hydrate:', courierErr)
      }

      // If either profile fetch explicitly returns 401, or if courier profile is explicitly not found,
      // it means the session is invalid or incomplete. We should clear state and prompt user to login.
      if (isProfileUnauthorized || isCourierUnauthorized || isCourierNotFound) {
        console.log('[AuthStore] Session invalid, unauthorized or incomplete in hydrate. Wiping auth state.');
        await clearAuthorizedState()
        await clearAuthTokens()
        await clearNotificationDeviceState()
        set({
          authorized: false,
          accessToken: undefined,
          refreshToken: undefined,
          courierId: undefined,
          role: undefined,
          companyId: undefined,
          email: undefined,
          firstName: undefined,
          lastName: undefined,
          phone: undefined,
          courierProfile: undefined,
          notificationDevice: undefined,
          status: 'ready',
        })
        return
      }

      let notificationDevice: NotificationDeviceState | undefined = undefined
      try {
        notificationDevice = await syncNotificationDevice(accessToken, storedNotificationDevice)
        console.log('[AuthStore] Notification device sync complete:', notificationDevice ? 'Success' : 'Failed/Null');
      } catch (pushErr) {
        console.error('[AuthStore] Error syncing notification device in hydrate:', pushErr)
        notificationDevice = storedNotificationDevice || undefined
      }

      set({
        authorized: Boolean(authorized || accessToken),
        accessToken,
        refreshToken,
        courierId,
        role: authProfile?.role ?? role,
        companyId,
        email: authProfile?.email,
        firstName: authProfile?.firstName,
        lastName: authProfile?.lastName,
        phone: authProfile?.phone,
        courierProfile,
        notificationDevice,
        status: 'ready',
      })
      console.log('[AuthStore] Hydration finished successfully. Status: ready.');
    } catch (err) {
      console.error('[AuthStore] Fatal error during auth store hydration:', err)
      // Safety net: always set status to ready so the app does not hang forever!
      set({ status: 'ready' })
    }
  },

  async signIn(login, password) {
    console.log('[AuthStore] Starting signIn for:', login);
    try {
      const response = await loginWithBackend({
        email: login.trim(),
        password,
      })

      console.log('[AuthStore] Login API request finished. Ok:', response.ok);

      if (!response.ok) {
        return { ok: false, message: response.error?.message || 'Network error: could not connect to server' }
      }

      if (!response.data?.success) {
        const errorMsg = response.data?.error?.message || response.data?.message || 'Invalid email or password'
        return { ok: false, message: errorMsg }
      }

      if (!response.data.data?.accessToken) {
        return { ok: false, message: 'Invalid response from server: access token missing' }
      }

      const { accessToken, refreshToken } = response.data.data
      await persistAuthorizedState(true)
      await persistAuthTokens({ accessToken, refreshToken })

      const decoded = decodeJwt(accessToken)
      const courierId = decoded?.sub
      const role = response.data.data.role ?? decoded?.role
      const companyId = decoded?.companyId

      console.log('[AuthStore] Login credentials validated. Fetching profiles...');

      let authProfile: AuthProfile | null = null
      try {
        authProfile = await fetchAuthProfile(accessToken)
        console.log('[AuthStore] Auth profile fetched:', !!authProfile);
      } catch (err) {
        console.error('[AuthStore] Error fetching auth profile in signIn:', err)
      }

      let courierProfile: CourierProfile | undefined = undefined
      try {
        const courierResponse = await getMyCourierProfile(accessToken)
        console.log('[AuthStore] Courier profile response ok:', courierResponse.ok);
        
        if (courierResponse.ok) {
          if (courierResponse.data?.success && courierResponse.data?.data) {
            courierProfile = courierResponse.data.data
          } else {
            console.warn('[AuthStore] Courier profile explicitly not found/invalid in database.');
            await clearAuthorizedState()
            await clearAuthTokens()
            await clearNotificationDeviceState()
            return {
              ok: false,
              message: 'Courier profile not found. Please create your profile first.',
              reason: 'NO_COURIER_PROFILE',
            }
          }
        } else {
          if (courierResponse.error?.status === 404) {
            console.warn('[AuthStore] Courier profile not found (404). Redirecting to profile creation.');
            await clearAuthorizedState()
            await clearAuthTokens()
            await clearNotificationDeviceState()
            return {
              ok: false,
              message: 'Courier profile not found. Please create your profile first.',
              reason: 'NO_COURIER_PROFILE',
            }
          }
          console.warn('[AuthStore] Failed to fetch courier profile due to server error:', courierResponse.error?.message);
        }
      } catch (err) {
        console.error('[AuthStore] Error fetching courier profile in signIn:', err)
      }

      let notificationDevice: NotificationDeviceState | undefined = undefined
      try {
        notificationDevice = await syncNotificationDevice(
          accessToken,
          normalizeNotificationDevice(await readNotificationDeviceState()),
        )
      } catch (pushErr) {
        console.error('[AuthStore] Error syncing notification device in signIn:', pushErr)
      }

      set({
        authorized: true,
        accessToken,
        refreshToken,
        courierId,
        role: authProfile?.role ?? role,
        companyId,
        email: authProfile?.email,
        firstName: authProfile?.firstName,
        lastName: authProfile?.lastName,
        phone: authProfile?.phone,
        courierProfile,
        notificationDevice,
        status: 'ready',
      })
      console.log('[AuthStore] Login flow completed successfully.');
      return { ok: true }
    } catch (err: any) {
      console.error('[AuthStore] Exception during signIn:', err)
      return { ok: false, message: err?.message || 'An unexpected error occurred during login.' }
    }
  },

  async signUp({ email, password, firstName, lastName, phone }) {
    console.log('[AuthStore] Starting signUp for:', email);
    try {
      const response = await registerWithBackend({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone,
      })
      if (!response.ok) {
        return { ok: false, message: response.error?.message || 'Network error during registration' }
      }
      if (!response.data?.success) {
        const msg = response.data?.error?.message ?? response.data?.message
        return { ok: false, message: typeof msg === 'string' ? msg : 'Registration failed. Please try again.' }
      }
      return { ok: true }
    } catch (err: any) {
      console.error('[AuthStore] Exception during signUp:', err)
      return { ok: false, message: err?.message || 'An unexpected error occurred during registration.' }
    }
  },

  async patchCourierProfile(data) {
    const { accessToken, courierProfile } = get()
    if (!accessToken || !courierProfile?.id) {
      return { ok: false, message: 'Not authenticated' }
    }
    try {
      const res = await updateCourierProfile(accessToken, courierProfile.id, data)
      if (!res.ok) {
        return { ok: false, message: res.error?.message || 'Update failed' }
      }
      if (!res.data?.success || !res.data.data) {
        return { ok: false, message: res.data?.message || 'Update failed' }
      }
      set({ courierProfile: res.data.data })
      return { ok: true }
    } catch (err: any) {
      return { ok: false, message: err?.message || 'Unexpected error' }
    }
  },

  async reloadCourierProfile() {
    const { accessToken } = get()
    if (!accessToken) return { ok: false, message: 'Not authenticated' }
    try {
      const res = await getMyCourierProfile(accessToken)
      if (!res.ok) return { ok: false, message: res.error?.message || 'Reload failed' }
      if (!res.data?.success || !res.data.data) return { ok: false, message: 'Profile not found' }
      set({ courierProfile: res.data.data })
      return { ok: true }
    } catch (err: any) {
      return { ok: false, message: err?.message || 'Unexpected error' }
    }
  },

  async signOut() {
    console.log('[AuthStore] Starting signOut...');
    const { accessToken, notificationDevice } = get()
    if (accessToken && notificationDevice?.deviceId) {
      try {
        await unregisterNotificationDevice(accessToken, notificationDevice.deviceId)
        console.log('[AuthStore] Notification device unregistered.');
      } catch (err) {
        console.error('[AuthStore] Failed to unregister notification device during signOut:', err)
      }
    }

    if (accessToken) {
      try {
        await toggleOnlineStatus(accessToken, false)
        console.log('[AuthStore] Went offline before signing out.');
      } catch (err) {
        console.error('[AuthStore] Failed to set offline status during signOut:', err)
      }

      try {
        await logout(accessToken)
        console.log('[AuthStore] Server-side logout successful.');
      } catch (err) {
        console.error('[AuthStore] Server-side logout request failed:', err)
      }
    }

    await clearAuthorizedState()
    await clearAuthTokens()
    await clearNotificationDeviceState()
    useShiftStore.getState().clearAssignmentsOnSignOut()
    set({
      authorized: false,
      accessToken: undefined,
      refreshToken: undefined,
      courierId: undefined,
      role: undefined,
      companyId: undefined,
      email: undefined,
      firstName: undefined,
      lastName: undefined,
      phone: undefined,
      courierProfile: undefined,
      notificationDevice: undefined,
      status: 'ready',
    })
    console.log('[AuthStore] SignOut completed.');
  },
}))

async function fetchAuthProfile(accessToken: string): Promise<AuthProfile | null> {
  const profileResponse = await getAuthProfile(accessToken)
  if (!profileResponse.ok || !profileResponse.data.success || !profileResponse.data.data) {
    return null
  }

  return profileResponse.data.data
}

async function syncNotificationDevice(
  accessToken: string,
  currentDevice:
    | {
        deviceId?: string
        pushToken?: string
        provider?: string
        enabled?: boolean
      }
    | undefined
    | null,
): Promise<NotificationDeviceState | undefined> {
  try {
    const deviceId = currentDevice?.deviceId ?? createDeviceId()
    console.log('[AuthStore] Syncing notification device:', deviceId);

    let payload: DeviceRegistrationPayload | null = null
    try {
      payload = await buildExpoNotificationDevicePayload(deviceId)
    } catch (payloadErr) {
      console.warn('[AuthStore] Error calling buildExpoNotificationDevicePayload:', payloadErr)
    }

    if (!payload) {
      console.log('[AuthStore] No notification payload built. Proceeding with fallback device state.');
      const fallbackState: NotificationDeviceState = {
        deviceId,
        pushToken: currentDevice?.pushToken ?? '',
        provider: currentDevice?.provider ?? 'expo',
        enabled: false,
      }
      await persistNotificationDeviceState(fallbackState)
      return fallbackState
    }

    const registerResponse = await registerNotificationDevice(accessToken, payload)
    console.log('[AuthStore] Register device response ok:', registerResponse.ok);

    if (!registerResponse.ok) {
      console.warn('[AuthStore] Device registration failed. status:', registerResponse.error?.status, 'message:', registerResponse.error?.message)
      // Persist deviceId even on failure so the same ID is reused on next restart
      const partialState: NotificationDeviceState = {
        deviceId: payload.deviceId,
        pushToken: payload.pushToken,
        provider: payload.provider,
        enabled: false,
      }
      await persistNotificationDeviceState(partialState)
      return partialState
    }

    if (!registerResponse.data.success) {
      return currentDevice
        ? {
            deviceId: currentDevice.deviceId ?? deviceId,
            pushToken: currentDevice.pushToken ?? '',
            provider: currentDevice.provider ?? payload.provider,
            enabled: Boolean(currentDevice.enabled),
          }
        : undefined
    }

    const enabledResponse = await setNotificationDeviceEnabled(accessToken, payload.deviceId, true)
    console.log('[AuthStore] Enable device notification response ok:', enabledResponse.ok);

    const nextState: NotificationDeviceState = {
      deviceId: payload.deviceId,
      pushToken: payload.pushToken,
      provider: payload.provider,
      enabled: enabledResponse.ok ? Boolean(enabledResponse.data.success) : true,
    }
    await persistNotificationDeviceState(nextState)
    return nextState
  } catch (err) {
    console.error('[AuthStore] Error inside syncNotificationDevice helper:', err)
    return currentDevice
      ? {
          deviceId: currentDevice.deviceId ?? createDeviceId(),
          pushToken: currentDevice.pushToken ?? '',
          provider: currentDevice.provider ?? 'expo',
          enabled: Boolean(currentDevice.enabled),
        }
      : undefined
  }
}

function createDeviceId() {
  return `courier-native-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeNotificationDevice(
  device:
    | {
        deviceId?: string
        pushToken?: string
        provider?: string
        enabled?: boolean
      }
    | null,
): NotificationDeviceState | undefined {
  if (!device?.deviceId) {
    return undefined
  }

  return {
    deviceId: device.deviceId,
    pushToken: device.pushToken ?? '',
    provider: device.provider ?? 'expo',
    enabled: Boolean(device.enabled),
  }
}
