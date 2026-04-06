const ONLINE_STATUSES = new Set(['online', 'busy'])

export function normalizeCourierProfile(rawCourier) {
  return {
    ...rawCourier,
    name: rawCourier.name ?? '',
    lastName: rawCourier.lastName ?? '',
    park: rawCourier.park ?? '',
    status: rawCourier.status ?? 'offline',
    rating: rawCourier.rating ?? 0,
    score: rawCourier.score ?? 0,
  }
}

export function getCourierInitials(courier) {
  const first = courier.name?.[0] ?? ''
  const last = courier.lastName?.[0] ?? ''
  return `${first}${last}`.toUpperCase()
}

export function isCourierOnlineStatus(status) {
  return ONLINE_STATUSES.has(status)
}
