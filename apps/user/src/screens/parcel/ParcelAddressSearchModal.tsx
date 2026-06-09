import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { Feather, Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  googlePlacesAutocomplete,
  googlePlaceDetails,
  googleReverseGeocode,
} from '../../data/googleMapsApi'

const { height: SCREEN_H } = Dimensions.get('window')

type ParcelAddressSearchModalProps = {
  visible: boolean
  title?: string
  initialAddress?: string
  initialCoords?: { latitude: number; longitude: number } | null
  fallbackCoords?: { latitude: number; longitude: number } | null
  initialMode?: 'search' | 'map'
  onClose: () => void
  onSelect: (address: string, coords: { latitude: number; longitude: number }) => void
}

const ASTANA_CENTER = {
  latitude: 51.169392,
  longitude: 71.449074,
}

export function ParcelAddressSearchModal({
  visible,
  title = 'Select Address',
  initialAddress = '',
  initialCoords = null,
  fallbackCoords = null,
  initialMode = 'search',
  onClose,
  onSelect,
}: ParcelAddressSearchModalProps) {
  const insets = useSafeAreaInsets()
  const mapRef = useRef<MapView | null>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current

  const [mode, setMode] = useState<'search' | 'map'>('search')
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(initialAddress)
  const [selectedCoords, setSelectedCoords] = useState<{
    latitude: number
    longitude: number
  } | null>(initialCoords)
  const defaultCenter = fallbackCoords ?? ASTANA_CENTER
  const [mapRegion, setMapRegion] = useState({
    latitude: initialCoords?.latitude ?? defaultCenter.latitude,
    longitude: initialCoords?.longitude ?? defaultCenter.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  })
  const [mapAddress, setMapAddress] = useState('')
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const ignoreNextRegionChange = useRef(false)

  useEffect(() => {
    if (visible) {
      setQuery('')
      setSuggestions([])
      setMode(initialMode)
      setSelectedAddress(initialAddress)
      setSelectedCoords(initialCoords)
      if (initialCoords) {
        setMapRegion({
          latitude: initialCoords.latitude,
          longitude: initialCoords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        })
        setMapAddress(initialAddress)
      } else {
        setMapRegion({
          latitude: defaultCenter.latitude,
          longitude: defaultCenter.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        })
        setMapAddress('')
      }
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }).start()
    } else {
      slideAnim.setValue(SCREEN_H)
    }
  }, [visible])

  useEffect(() => {
    const kbShow = Keyboard.addListener('keyboardDidShow', () =>
      setIsKeyboardVisible(true),
    )
    const kbHide = Keyboard.addListener('keyboardDidHide', () =>
      setIsKeyboardVisible(false),
    )
    return () => {
      kbShow.remove()
      kbHide.remove()
    }
  }, [])

  const handleSearchText = (text: string) => {
    setQuery(text)
    if (text.trim().length < 3) {
      setSuggestions([])
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
      return
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    setSearching(true)

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await googlePlacesAutocomplete(text)
        setSuggestions(results)
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  const handleSelectSuggestion = async (item: any) => {
    setSearching(true)
    Keyboard.dismiss()

    try {
      let lat = 0
      let lon = 0

      if (item.place_id) {
        const coords = await googlePlaceDetails(item.place_id)
        if (coords) {
          lat = coords.latitude
          lon = coords.longitude
        }
      }

      if (!lat || !lon) {
        setSearching(false)
        return
      }

      const address = item.main_text || item.display_name || query
      onSelect(address, { latitude: lat, longitude: lon })
      handleClose()
    } catch {
      // ignore
    } finally {
      setSearching(false)
    }
  }

  const handleSwitchToMap = () => {
    Keyboard.dismiss()
    setMode('map')
    if (selectedCoords) {
      const region = {
        latitude: selectedCoords.latitude,
        longitude: selectedCoords.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }
      setMapRegion(region)
      setTimeout(() => {
        mapRef.current?.animateToRegion(region, 600)
      }, 300)
    }
  }

  const handleMapRegionChange = async (newRegion: any) => {
    setMapRegion(newRegion)
    if (ignoreNextRegionChange.current) {
      ignoreNextRegionChange.current = false
      return
    }
    try {
      const result = await googleReverseGeocode(
        newRegion.latitude,
        newRegion.longitude,
      )
      if (result?.street) {
        setMapAddress(result.street)
      }
    } catch {
      // ignore
    }
  }

  const handleMapConfirm = () => {
    if (mapAddress && mapRegion) {
      onSelect(mapAddress, {
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
      })
      handleClose()
    }
  }

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_H,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setQuery('')
      setSuggestions([])
      setMode('search')
      onClose()
    })
  }

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View
          style={[
            styles.container,
            { paddingTop: insets.top },
          ]}
        >
          {mode === 'search' ? (
            <>
              {/* Header */}
              <View style={styles.header}>
                <Pressable onPress={handleClose} style={styles.headerBackBtn}>
                  <Feather name="arrow-left" size={22} color="#18181B" />
                </Pressable>
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={styles.headerSpacer} />
              </View>

              {/* Search Input */}
              <View style={styles.searchSection}>
                <View style={styles.searchInputWrap}>
                  <Feather name="search" size={18} color="#FF7A59" />
                  <TextInput
                    value={query}
                    onChangeText={handleSearchText}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    placeholder="Search address or location"
                    placeholderTextColor="rgba(113,113,122,0.7)"
                    style={styles.searchInput}
                  />
                  {searching && (
                    <ActivityIndicator size="small" color="#FF7A59" />
                  )}
                  {query.length > 0 && !searching && (
                    <Pressable
                      onPress={() => {
                        setQuery('')
                        setSuggestions([])
                      }}
                      style={styles.clearBtn}
                    >
                      <Feather name="x" size={16} color="#71717A" />
                    </Pressable>
                  )}
                </View>

                {/* Map Button */}
                <Pressable
                  onPress={handleSwitchToMap}
                  style={styles.mapButton}
                >
                  <Feather name="map-pin" size={18} color="#FF7A59" />
                  <Text style={styles.mapButtonText}>On Map</Text>
                </Pressable>
              </View>

              {/* Suggestions */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={[
                  styles.suggestionsContent,
                  { paddingBottom: 80 + insets.bottom },
                ]}
              >
                {suggestions.length > 0 ? (
                  suggestions.map((item, idx) => (
                    <Pressable
                      key={`${item.place_id ?? idx}`}
                      onPress={() => void handleSelectSuggestion(item)}
                      style={styles.suggestionItem}
                    >
                      <View style={styles.suggestionIconWrap}>
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color="#FF7A59"
                        />
                      </View>
                      <View style={styles.suggestionTextWrap}>
                        {item.main_text ? (
                          <>
                            <Text
                              style={styles.suggestionMainText}
                              numberOfLines={1}
                            >
                              {item.main_text}
                            </Text>
                            <Text
                              style={styles.suggestionSecondaryText}
                              numberOfLines={1}
                            >
                              {item.secondary_text}
                            </Text>
                          </>
                        ) : (
                          <Text
                            style={styles.suggestionMainText}
                            numberOfLines={2}
                          >
                            {item.display_name}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  ))
                ) : query.length > 0 && !searching ? (
                  <View style={styles.emptyState}>
                    <Feather name="search" size={24} color="#D4D4D8" />
                    <Text style={styles.emptyStateText}>
                      No results found
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      Try a different search or use the map
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Feather name="map-pin" size={24} color="#D4D4D8" />
                    <Text style={styles.emptyStateText}>
                      Enter an address
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      Search by street name, building, or location
                    </Text>
                  </View>
                )}
              </ScrollView>
            </>
          ) : (
            /* ========= MAP MODE ========= */
            <>
              <View style={StyleSheet.absoluteFillObject}>
                <MapView
                  ref={mapRef}
                  style={StyleSheet.absoluteFillObject}
                  provider={
                    Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined
                  }
                  initialRegion={mapRegion}
                  onRegionChangeComplete={handleMapRegionChange}
                  showsMyLocationButton={false}
                  showsCompass={false}
                  zoomControlEnabled={false}
                />

                {/* Center pin */}
                <View style={styles.centerPin} pointerEvents="none">
                  <Ionicons
                    name="location-sharp"
                    size={36}
                    color="#FF7A59"
                  />
                  <View style={styles.centerPinShadow} />
                </View>
              </View>

              {/* Map Header */}
              <View
                style={[styles.mapHeader, { paddingTop: insets.top + 8 }]}
              >
                <Pressable
                  onPress={() => setMode('search')}
                  style={styles.mapBackBtn}
                >
                  <Feather name="arrow-left" size={22} color="#18181B" />
                </Pressable>

                <View style={styles.mapSearchWrap}>
                  <Feather name="search" size={16} color="#71717A" />
                  <Pressable
                    onPress={() => setMode('search')}
                    style={styles.mapSearchPress}
                  >
                    <Text
                      style={styles.mapSearchText}
                      numberOfLines={1}
                    >
                      {mapAddress || 'Search address...'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Map Bottom Card */}
              {!isKeyboardVisible && (
                <View
                  style={[
                    styles.mapBottomCard,
                    { paddingBottom: Math.max(24, insets.bottom + 12) },
                  ]}
                >
                  <View style={styles.mapAddressPreview}>
                    <Ionicons
                      name="location"
                      size={22}
                      color="#FF7A59"
                    />
                    <Text
                      style={styles.mapAddressText}
                      numberOfLines={2}
                    >
                      {mapAddress || 'Move the map to select a point'}
                    </Text>
                  </View>

                  <Pressable
                    onPress={handleMapConfirm}
                    style={[
                      styles.mapConfirmBtn,
                      !mapAddress && styles.mapConfirmBtnDisabled,
                    ]}
                    disabled={!mapAddress}
                  >
                    <Text style={styles.mapConfirmText}>
                      Confirm Location
                    </Text>
                    <Feather name="check" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 60,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(228,228,231,0.5)',
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#18181B',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
  },
  headerSpacer: {
    width: 40,
  },
  searchSection: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  searchInputWrap: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: 'rgba(228,228,231,0.6)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 52,
    color: '#18181B',
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 0,
    includeFontPadding: false,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(228,228,231,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,122,89,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,122,89,0.15)',
  },
  mapButtonText: {
    color: '#FF7A59',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  suggestionsContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  suggestionItem: {
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: 'rgba(228,228,231,0.35)',
  },
  suggestionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,122,89,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTextWrap: {
    flex: 1,
    gap: 2,
  },
  suggestionMainText: {
    color: '#18181B',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  suggestionSecondaryText: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyStateText: {
    color: '#71717A',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  emptyStateSubtext: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 260,
  },

  /* === MAP MODE === */
  centerPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18,
    marginTop: -36,
    alignItems: 'center',
  },
  centerPinShadow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,122,89,0.25)',
    marginTop: -4,
  },
  mapHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mapBackBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  mapSearchWrap: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  mapSearchPress: {
    flex: 1,
  },
  mapSearchText: {
    color: '#71717A',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  mapBottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 14,
  },
  mapAddressPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
  },
  mapAddressText: {
    flex: 1,
    color: '#18181B',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  mapConfirmBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF7A59',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  mapConfirmBtnDisabled: {
    opacity: 0.5,
  },
  mapConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
})
