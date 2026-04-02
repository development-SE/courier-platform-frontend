function normalizePhone(value) {
  return String(value ?? '').trim()
}

export function openPhoneDialer(phone) {
  const normalizedPhone = normalizePhone(phone)
  if (!normalizedPhone || typeof window === 'undefined') {
    return false
  }

  try {
    window.location.href = `tel:${normalizedPhone}`
    return true
  } catch {
    return false
  }
}
