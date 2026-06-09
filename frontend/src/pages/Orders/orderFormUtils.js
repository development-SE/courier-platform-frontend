export const SERVICE_TYPES = [
  { value: 'EXPRESS', label: 'Экспресс' },
  { value: 'STANDARD', label: 'Стандарт' },
  { value: 'SCHEDULED', label: 'Супер срочно' },
]

export const DELIVERY_TYPES = [
  'Пеший',
  'Авто',
  'Вело',
]

export const formatPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '')
  let raw = digits

  if (raw.startsWith('7') || raw.startsWith('8')) {
    raw = raw.slice(1)
  }

  raw = raw.slice(0, 10)
  if (raw.length === 0) return ''

  let formatted = '+7'
  if (raw.length > 0) formatted += ` (${raw.slice(0, 3)}`
  if (raw.length >= 3) formatted += ')'
  if (raw.length > 3) formatted += ` ${raw.slice(3, 6)}`
  if (raw.length > 6) formatted += `-${raw.slice(6, 8)}`
  if (raw.length > 8) formatted += `-${raw.slice(8, 10)}`

  return formatted
}

export const isValidPhone = (value) => /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(value)

export const isValidRecipientName = (value) => {
  const parts = String(value || '').trim().split(/\s+/)
  return parts.length >= 2 && parts[0].length >= 2 && parts[1].length >= 2
}

export const isValidDateTime = (value) => {
  if (!String(value || '').trim()) return true
  return /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(value)
}
