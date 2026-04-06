import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { tryRequireModule } from '../../../platform/native/optionalDependencies'

function MapFallback({ latitude, longitude }) {
  return (
    <View style={styles.fallbackWrap}>
      <Text style={styles.fallbackTitle}>Карта курьера</Text>
      <Text style={styles.fallbackText}>
        Координаты: {latitude}, {longitude}
      </Text>
      <Text style={styles.fallbackHint}>
        Установите `react-native-maps`, чтобы включить реальную карту.
      </Text>
    </View>
  )
}

export function NativeCourierMap({ longitude, latitude, markerTitle = 'Курьер' }) {
  const mapModule = tryRequireModule('react-native-maps')

  const region = useMemo(
    () => ({
      latitude,
      longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    }),
    [latitude, longitude],
  )

  if (!mapModule?.default) {
    return <MapFallback latitude={latitude} longitude={longitude} />
  }

  const MapView = mapModule.default
  const Marker = mapModule.Marker

  return (
    <View style={styles.mapWrap}>
      <MapView style={styles.map} initialRegion={region}>
        {Marker ? (
          <Marker coordinate={{ latitude, longitude }} title={markerTitle} />
        ) : null}
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  mapWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#25263a',
    backgroundColor: '#111320',
    minHeight: 180,
  },
  map: {
    flex: 1,
  },
  fallbackWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#25263a',
    backgroundColor: '#141621',
    minHeight: 180,
    padding: 12,
    justifyContent: 'center',
    gap: 6,
  },
  fallbackTitle: {
    color: '#f4f5fb',
    fontSize: 15,
    fontWeight: '700',
  },
  fallbackText: {
    color: '#b8bdd0',
    fontSize: 13,
  },
  fallbackHint: {
    color: '#8f95ac',
    fontSize: 12,
  },
})
