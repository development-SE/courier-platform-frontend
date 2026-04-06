export const STORAGE_SCOPE = {
  LOCAL: 'local',
  SESSION: 'session',
}

export function createStorageAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') {
    throw new Error('Storage adapter must be an object')
  }

  if (typeof adapter.getItem !== 'function') {
    throw new Error('Storage adapter must provide getItem(key, scope)')
  }

  if (typeof adapter.setItem !== 'function') {
    throw new Error('Storage adapter must provide setItem(key, value, scope)')
  }

  if (typeof adapter.removeItem !== 'function') {
    throw new Error('Storage adapter must provide removeItem(key, scope)')
  }

  return adapter
}
