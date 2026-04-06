export function createCourierDataRepository(repository) {
  if (!repository || typeof repository !== 'object') {
    throw new Error('Courier data repository must be an object')
  }

  const requiredMethods = [
    'getCourierProfile',
    'getBalanceSnapshot',
    'getIncomingOrderPreview',
    'getSlotsSnapshot',
    'getMessagesSnapshot',
    'getCourierPosition',
    'getOrdersSeed',
  ]

  requiredMethods.forEach(methodName => {
    if (typeof repository[methodName] !== 'function') {
      throw new Error(`Courier data repository must provide ${methodName}()`)
    }
  })

  return repository
}
