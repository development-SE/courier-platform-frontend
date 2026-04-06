const moduleCache = new Map()

export function tryRequireModule(moduleName) {
  if (moduleCache.has(moduleName)) {
    return moduleCache.get(moduleName)
  }

  let resolved = null

  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    resolved = require(moduleName)
  } catch {
    resolved = null
  }

  moduleCache.set(moduleName, resolved)
  return resolved
}
