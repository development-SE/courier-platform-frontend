const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')
const corePackageRoot = path.resolve(workspaceRoot, 'packages/core')
const sharedAssetsRoot = path.resolve(workspaceRoot, 'assets')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [
  corePackageRoot,
  sharedAssetsRoot,
]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config
