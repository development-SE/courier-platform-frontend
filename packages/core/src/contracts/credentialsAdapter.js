export function createCredentialsAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') {
    throw new Error('Credentials adapter must be an object')
  }

  if (typeof adapter.listCredentials !== 'function') {
    throw new Error('Credentials adapter must provide listCredentials()')
  }

  return {
    listCredentials() {
      const credentials = adapter.listCredentials()
      return Array.isArray(credentials) ? credentials : []
    },
  }
}
