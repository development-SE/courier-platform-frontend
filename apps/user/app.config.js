const baseConfig = require('./app.json')

const expoConfig = baseConfig.expo
const locationPermissionText =
  '\u041d\u0443\u0436\u043d\u043e \u0434\u043b\u044f \u043e\u0442\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u044f \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0438 \u043d\u0430 \u043a\u0430\u0440\u0442\u0435'
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

const normalizedPlugins = [...(expoConfig.plugins ?? [])].filter(plugin => {
  if (Array.isArray(plugin)) {
    return plugin[0] !== 'expo-location'
  }

  return plugin !== 'expo-location'
})

module.exports = () => ({
  ...expoConfig,
  ios: {
    ...expoConfig.ios,
    config: {
      ...(expoConfig.ios?.config ?? {}),
      googleMapsApiKey,
    },
    infoPlist: {
      ...(expoConfig.ios?.infoPlist ?? {}),
      NSLocationWhenInUseUsageDescription: locationPermissionText,
    },
  },
  android: {
    ...expoConfig.android,
    permissions: Array.from(
      new Set([
        ...(expoConfig.android?.permissions ?? []),
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
      ]),
    ),
    config: {
      ...(expoConfig.android?.config ?? {}),
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
  },
  plugins: [
    ...normalizedPlugins,
    ['expo-location', { locationWhenInUsePermission: locationPermissionText }],
  ],
})
