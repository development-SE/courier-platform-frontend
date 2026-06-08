import { Platform } from 'react-native'

type ApiError = {
  message: string
  status?: number
}

const DEFAULT_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8080',
  ios: 'http://localhost:8080',
  default: 'http://localhost:8080',
})

export function getApiBaseUrl() {
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL ?? 'http://10.202.21.33:8081'
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<{ ok: true; data: T } | { ok: false; error: ApiError }> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${path}`

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  let body: BodyInit | undefined = options.body ?? undefined
  if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.json)
  }

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(url, {
      ...options,
      body,
      headers: {
        ...headers,
        ...(options.headers ?? {}),
      },
      signal: controller.signal,
    })
    clearTimeout(id)

    const contentType = response.headers.get('content-type') ?? ''
    const isJson = contentType.includes('application/json')
    const payload = isJson ? await response.json() : null

    if (!response.ok) {
      const message: string =
        payload?.error?.message ??
        payload?.message ??
        payload?.data?.message ??
        `Request failed with status ${response.status}`
      return { ok: false, error: { message, status: response.status } }
    }

    return { ok: true, data: payload as T }
  } catch (error) {
    return {
      ok: false,
      error: { message: error instanceof Error ? error.message : 'Network error' },
    }
  }
}
