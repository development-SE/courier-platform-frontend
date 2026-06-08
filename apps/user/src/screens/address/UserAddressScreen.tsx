import { useEffect, useState, useRef } from 'react'
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import { createAddress, listAddresses, updateAddress, type AddressResponse } from '../../data/addressesApi'

type UserAddressScreenProps = {
  accessToken: string
  onBackPress?: () => void
  onConfirmPress?: () => void
}

type AddressScreenMode = 'list' | 'add'
type SaveAsType = 'apartment' | 'office' | 'other'

type SavedAddress = {
  id: string
  title: string
  text: string
  icon: 'home' | 'work' | 'other'
}

function mapToSaved(addr: AddressResponse): SavedAddress {
  const labelLower = (addr.label ?? '').toLowerCase()
  let icon: SavedAddress['icon'] = 'other'
  if (labelLower === 'home' || labelLower === 'apartment') icon = 'home'
  else if (labelLower === 'work' || labelLower === 'office') icon = 'work'

  const detailParts = [
    addr.entrance ? `Entrance ${addr.entrance}` : null,
    addr.floor ? `Floor ${addr.floor}` : null,
    addr.apartment ? `Apt ${addr.apartment}` : null,
  ].filter(Boolean)

  return {
    id: addr.id,
    title: addr.label || 'Address',
    text: [`${addr.street}, ${addr.city}`, detailParts.join(', ')].filter(Boolean).join('\n'),
    icon,
  }
}

export function UserAddressScreen({ accessToken, onBackPress, onConfirmPress }: UserAddressScreenProps) {
  const insets = useSafeAreaInsets()
  const [mode, setMode] = useState<AddressScreenMode>('list')
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [rawAddresses, setRawAddresses] = useState<AddressResponse[]>([])
  const [editingAddress, setEditingAddress] = useState<AddressResponse | null>(null)
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [saving, setSaving] = useState(false)
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity] = useState('Astana')
  const [entrance, setEntrance] = useState('')
  const [floor, setFloor] = useState('')
  const [door, setDoor] = useState('')
  const [buildingName, setBuildingName] = useState('')
  const [courierNotes, setCourierNotes] = useState('')
  const [saveAs, setSaveAs] = useState<SaveAsType>('apartment')

  const [region, setRegion] = useState({
    latitude: 51.169392, // Astana default
    longitude: 71.449074,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  })
  const [isMapExpanded, setIsMapExpanded] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [isAddingFromMap, setIsAddingFromMap] = useState(false)
  const mapRef = useRef<MapView | null>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onRegionChangeComplete = async (newRegion: any) => {
    setRegion(newRegion)
    setHasInteracted(true)
    try {
      let geocode = await Location.reverseGeocodeAsync({
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
      })
      if (geocode.length > 0) {
        const first = geocode[0]
        const street = [first.street, first.streetNumber].filter(Boolean).join(' ')
        if (street) {
          setStreetAddress(street)
        }
        if (first.city) {
          setCity(first.city)
        }
      }
    } catch (e) {
      // safe ignore
    }
  }

  const handleMapPress = (e: any) => {
    const coordinate = e.nativeEvent.coordinate
    if (!coordinate) return
    const newRegion = {
      ...region,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    }
    setHasInteracted(true)
    setRegion(newRegion)
    mapRef.current?.animateToRegion(newRegion, 600)
  }

  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text)
    if (text.trim().length < 3) {
      setSuggestions([])
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
      return
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Instantly set searching indicator for immediate UX feedback
    setSearching(true)

    // Use Photon API (Komoot) which has no strict rate-limiting blocks and is extremely fast!
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5&countrycode=kz&bbox=71.21,50.85,71.79,51.36`,
          {
            headers: {
              'User-Agent': 'SwiftDeliver-UserApp/1.0',
            },
          }
        )
        const data = await response.json()
        if (data && data.features) {
          const mapped = data.features
            .map((feature: any) => {
              const props = feature.properties
              const name = props.name || ''
              const houseNumber = props.housenumber || ''
              const streetPart = houseNumber ? `${name}, ${houseNumber}` : name
              const cityPart = props.city || props.town || props.village || ''
              const districtPart = props.district || ''
              
              const displayParts = [
                streetPart,
                districtPart,
                cityPart,
                props.state || '',
                props.country || ''
              ].filter(Boolean)
              
              return {
                lat: feature.geometry.coordinates[1].toString(),
                lon: feature.geometry.coordinates[0].toString(),
                display_name: displayParts.join(', ')
              }
            })
            .filter((item: any) => {
              const lower = item.display_name.toLowerCase()
              return (
                lower.includes('астана') ||
                lower.includes('astana') ||
                lower.includes('нур-султан') ||
                lower.includes('nursultan')
              )
            })
          setSuggestions(mapped)
        } else {
          setSuggestions([])
        }
      } catch (e) {
        console.log('Photon search error, trying Nominatim fallback:', e)
        // Fallback to OSM Nominatim if Photon is ever down
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
              text
            )}&format=json&limit=5&countrycodes=kz&accept-language=ru&viewbox=71.21,50.85,71.79,51.36&bounded=1`,
            {
              headers: {
                'User-Agent': 'SwiftDeliver-UserApp/1.0',
              },
            }
          )
          const data = await response.json()
          const filtered = (data || []).filter((item: any) => {
            const lower = (item.display_name || '').toLowerCase()
            return (
              lower.includes('астана') ||
              lower.includes('astana') ||
              lower.includes('нур-султан') ||
              lower.includes('nursultan')
            )
          })
          setSuggestions(filtered)
        } catch (err) {
          console.log('Nominatim fallback error:', err)
        }
      } finally {
        setSearching(false)
      }
    }, 500)
  }

  const handleSelectSuggestion = (item: any) => {
    const lat = parseFloat(item.lat)
    const lon = parseFloat(item.lon)
    const newRegion = {
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }
    setRegion(newRegion)
    setHasInteracted(true)
    mapRef.current?.animateToRegion(newRegion, 1000)

    const parts = item.display_name.split(',')
    const cleanAddress = parts.slice(0, 2).join(',').trim()
    setStreetAddress(cleanAddress)

    setSuggestions([])
    setSearchQuery('')
  }

  const useCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return

      let loc = await Location.getCurrentPositionAsync({})
      const newRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }
      setHasInteracted(true)
      setRegion(newRegion)
      mapRef.current?.animateToRegion(newRegion, 1000)
      
      let geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      })
      if (geocode.length > 0) {
        const first = geocode[0]
        const street = [first.street, first.streetNumber].filter(Boolean).join(' ')
        if (street) {
          setStreetAddress(street)
        }
        if (first.city) {
          setCity(first.city)
        }
      }
    } catch (e) {
      console.log('Error getting current location:', e)
    }
  }

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoadingAddresses(true)
      const result = await listAddresses(accessToken)
      if (!active) return
      setLoadingAddresses(false)
      if (result.ok && result.data.content) {
        setRawAddresses(result.data.content)
        setSavedAddresses(result.data.content.map(mapToSaved))
        if (result.data.content.length > 0) {
          const def = result.data.content.find(a => a.defaultAddress) ?? result.data.content[0]
          setSelectedAddressId(def.id)
        }
      }
    }

    void load()
    void useCurrentLocation()

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true)
    })
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false)
    })

    return () => {
      active = false
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [accessToken])

  const enterAddMode = () => {
    setEditingAddress(null)
    setStreetAddress('')
    setCity('Astana')
    setEntrance('')
    setFloor('')
    setDoor('')
    setBuildingName('')
    setCourierNotes('')
    setSaveAs('apartment')
    setHasInteracted(false)
    setSuggestions([])
    setSearchQuery('')
    setIsAddingFromMap(true)
    setIsMapExpanded(true)
  }

  const enterEditMode = (addr: AddressResponse) => {
    setEditingAddress(addr)
    setStreetAddress(addr.street)
    setCity(addr.city)
    setEntrance(addr.entrance ?? '')
    setFloor(addr.floor ?? '')
    setDoor(addr.apartment ?? '')
    setBuildingName('')
    setCourierNotes('')
    const labelLower = (addr.label ?? '').toLowerCase()
    setSaveAs(labelLower === 'office' ? 'office' : labelLower === 'other' ? 'other' : 'apartment')
    setRegion(prev => ({
      ...prev,
      latitude: addr.latitude,
      longitude: addr.longitude,
    }))
    setHasInteracted(true)
    setMode('add')
  }

  const handleBack = () => {
    if (mode === 'add') {
      setMode('list')
      return
    }

    onBackPress?.()
  }

  const handleSaveAddress = async () => {
    setSaving(true)
    const label = saveAs === 'apartment' ? 'Apartment' : saveAs === 'office' ? 'Office' : 'Other'

    const isApartment = saveAs === 'apartment'
    const safeHouse = (isApartment ? '1' : buildingName).trim().slice(0, 50)
    const safeEntrance = (isApartment ? entrance : courierNotes).trim().slice(0, 50)

    const payload = {
      label,
      city: city || 'Astana',
      street: streetAddress.trim(),
      house: safeHouse || '1',
      entrance: safeEntrance,
      floor: isApartment ? floor.trim().slice(0, 50) : '',
      apartment: isApartment ? door.trim().slice(0, 50) : '',
      latitude: region.latitude,
      longitude: region.longitude,
    }

    if (editingAddress) {
      const result = await updateAddress(accessToken, editingAddress.id, payload)
      setSaving(false)
      if (!result.ok) return
      const updated = result.data
      setRawAddresses(prev => prev.map(a => (a.id === updated.id ? updated : a)))
      setSavedAddresses(prev => prev.map(a => (a.id === updated.id ? mapToSaved(updated) : a)))
      setEditingAddress(null)
      setMode('list')
      return
    }

    const result = await createAddress(accessToken, payload)
    setSaving(false)
    if (!result.ok) return

    const reloadResult = await listAddresses(accessToken)
    if (reloadResult.ok && reloadResult.data.content) {
      setRawAddresses(reloadResult.data.content)
      setSavedAddresses(reloadResult.data.content.map(mapToSaved))
      setSelectedAddressId(result.data.id)
    }
    setMode('list')
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      {mode === 'list' ? (
        <>
          <View style={styles.header}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Feather name="arrow-left" size={22} color="#191c1e" />
            </Pressable>
            <Text allowFontScaling={false} style={styles.headerTitle}>
              Delivery Point
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.listContent, { paddingBottom: 124 + insets.bottom }]}
          >
            <View style={styles.searchContainer}>
              <View style={styles.searchBox}>
                <Feather name="search" size={18} color="#58423c" />
                <TextInput
                  allowFontScaling={false}
                  value={searchQuery}
                  onChangeText={handleSearchTextChange}
                  placeholder="Enter address or location"
                  placeholderTextColor="rgba(88, 66, 60, 0.5)"
                  style={styles.searchInput}
                />
                {searching && <ActivityIndicator size="small" color="#a7391e" />}
              </View>

              {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {suggestions.map((item, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleSelectSuggestion(item)}
                      style={styles.suggestionItem}
                    >
                      <Ionicons name="location-outline" size={18} color="#a7391e" style={styles.suggestionIcon} />
                      <Text allowFontScaling={false} style={styles.suggestionText} numberOfLines={2}>
                        {item.display_name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Pressable onPress={() => { setHasInteracted(false); setSuggestions([]); setSearchQuery(''); setIsMapExpanded(true); }} style={styles.mapCard}>
              <MapView
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={StyleSheet.absoluteFillObject}
                region={region}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
              />
              <View style={styles.mapPin} pointerEvents="none">
                <Ionicons name="location-sharp" size={23} color="#ffffff" />
              </View>
              <View style={styles.mapTapOverlay} pointerEvents="none">
                <Feather name="maximize-2" size={14} color="#ffffff" />
                <Text allowFontScaling={false} style={styles.mapTapText}>
                  Tap to expand
                </Text>
              </View>
            </Pressable>

            <View style={styles.section}>
              <Text allowFontScaling={false} style={styles.sectionTitle}>
                Saved Addresses
              </Text>

              {loadingAddresses ? (
                <ActivityIndicator size="small" color="#a7391e" style={{ marginVertical: 16 }} />
              ) : null}

              {!loadingAddresses && savedAddresses.map(address => {
                const isSelected = selectedAddressId === address.id
                const raw = rawAddresses.find(r => r.id === address.id)

                return (
                  <Pressable
                    key={address.id}
                    onPress={() => setSelectedAddressId(address.id)}
                    style={[styles.addressCard, isSelected && styles.addressCardActive]}
                  >
                    <View style={isSelected ? styles.addressIconActive : styles.addressIcon}>
                      {address.icon === 'home' ? (
                        <FontAwesome5 name="home" size={16} color="#a7391e" />
                      ) : address.icon === 'work' ? (
                        <Feather name="briefcase" size={19} color="#58423c" />
                      ) : (
                        <MaterialCommunityIcons name="map-marker-outline" size={20} color="#58423c" />
                      )}
                    </View>

                    <View style={styles.addressBody}>
                      <Text allowFontScaling={false} style={styles.addressTitle}>
                        {address.title}
                      </Text>
                      <Text allowFontScaling={false} style={styles.addressText}>
                        {address.text}
                      </Text>
                    </View>

                    {raw && (
                      <Pressable
                        style={styles.editAddressButton}
                        onPress={() => enterEditMode(raw)}
                        hitSlop={8}
                      >
                        <Feather name="edit-2" size={14} color="#58423c" />
                      </Pressable>
                    )}

                    {isSelected ? (
                      <View style={styles.checkCircle}>
                        <Feather name="check" size={14} color="#ffffff" />
                      </View>
                    ) : null}
                  </Pressable>
                )
              })}

              <Pressable
                onPress={enterAddMode}
                style={styles.addAddressCard}
              >
                <View style={styles.addIcon}>
                  <Feather name="plus" size={20} color="#1e5bba" />
                </View>
                <Text allowFontScaling={false} style={styles.addAddressText}>
                  Add new address
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          <View style={[styles.confirmWrap, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
            <Pressable onPress={onConfirmPress ?? onBackPress} style={styles.confirmButton}>
              <Text allowFontScaling={false} style={styles.confirmText}>
                Confirm Address
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <View style={styles.addHeader}>
            <Pressable onPress={handleBack} style={styles.addBackButton}>
              <Feather name="arrow-left" size={20} color="#40484c" />
            </Pressable>

            <Text allowFontScaling={false} style={styles.addHeaderTitle}>
              {editingAddress ? 'Edit Address' : 'Add Address'}
            </Text>

            <View style={styles.addHeaderSpacer} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.addContent, { paddingBottom: 148 + Math.max(insets.bottom, 16) }]}
          >
            <View style={styles.fieldGroup}>
              <Text allowFontScaling={false} style={styles.fieldLabel}>
                STREET ADDRESS
              </Text>

              <View style={styles.streetField}>
                <Ionicons name="location-sharp" size={18} color="#58423c" />
                <TextInput
                  allowFontScaling={false}
                  value={streetAddress}
                  onChangeText={setStreetAddress}
                  placeholder="Enter street address"
                  placeholderTextColor="rgba(88, 66, 60, 0.5)"
                  style={styles.streetInput}
                />
                <Pressable
                  onPress={() => {
                    setHasInteracted(true)
                    setSuggestions([])
                    setSearchQuery('')
                    setIsAddingFromMap(true)
                    setIsMapExpanded(true)
                  }}
                  style={styles.streetMapButton}
                >
                  <Feather name="map" size={18} color="#a7391e" />
                </Pressable>
              </View>
            </View>

            {saveAs === 'apartment' && (
              <View style={styles.tripleRow}>
                <View style={styles.smallFieldGroup}>
                  <Text allowFontScaling={false} style={styles.fieldLabel}>
                    ENTRANCE
                  </Text>
                  <TextInput
                    allowFontScaling={false}
                    value={entrance}
                    onChangeText={setEntrance}
                    placeholder="A"
                    placeholderTextColor="#6b7280"
                    style={styles.smallInput}
                    textAlign="center"
                  />
                </View>

                <View style={styles.smallFieldGroup}>
                  <Text allowFontScaling={false} style={styles.fieldLabel}>
                    FLOOR
                  </Text>
                  <TextInput
                    allowFontScaling={false}
                    value={floor}
                    onChangeText={setFloor}
                    placeholder="4"
                    placeholderTextColor="#6b7280"
                    style={styles.smallInput}
                    textAlign="center"
                  />
                </View>

                <View style={styles.smallFieldGroup}>
                  <Text allowFontScaling={false} style={styles.fieldLabel}>
                    DOOR
                  </Text>
                  <TextInput
                    allowFontScaling={false}
                    value={door}
                    onChangeText={setDoor}
                    placeholder="402"
                    placeholderTextColor="#6b7280"
                    style={styles.smallInput}
                    textAlign="center"
                  />
                </View>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <View style={styles.optionalLabelRow}>
                <Text allowFontScaling={false} style={styles.fieldLabel}>
                  {saveAs === 'other' ? 'ADDRESS INFO' : 'BUILDING NAME'}
                </Text>
                {saveAs !== 'other' && (
                  <Text allowFontScaling={false} style={styles.optionalText}>
                    (OPTIONAL)
                  </Text>
                )}
              </View>

              <TextInput
                allowFontScaling={false}
                value={buildingName}
                onChangeText={setBuildingName}
                placeholder="e.g. Sunset Apartments"
                placeholderTextColor="rgba(88, 66, 60, 0.5)"
                style={styles.largeInput}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text allowFontScaling={false} style={styles.fieldLabel}>
                {saveAs === 'office'
                  ? 'ENTRANCE/STAIRCASE'
                  : saveAs === 'other'
                  ? 'INSTRUCTION FOR COURIER'
                  : 'COURIER NOTES'}
              </Text>

              <TextInput
                allowFontScaling={false}
                multiline
                textAlignVertical="top"
                value={courierNotes}
                onChangeText={setCourierNotes}
                placeholder={'Gate code: 1234. Leave package at the\ndoor.'}
                placeholderTextColor="rgba(88, 66, 60, 0.5)"
                style={styles.notesInput}
              />
            </View>

            <View style={styles.saveAsSection}>
              <Text allowFontScaling={false} style={styles.fieldLabel}>
                SAVE AS
              </Text>

              <View style={styles.saveAsRow}>
                <Pressable
                  onPress={() => setSaveAs('apartment')}
                  style={[styles.saveAsChip, saveAs === 'apartment' && styles.saveAsChipActive]}
                >
                  <FontAwesome5
                    name="building"
                    size={14}
                    color={saveAs === 'apartment' ? '#701500' : '#58423c'}
                  />
                  <Text
                    allowFontScaling={false}
                    style={[styles.saveAsChipText, saveAs === 'apartment' && styles.saveAsChipTextActive]}
                  >
                    Apartment
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setSaveAs('office')}
                  style={[styles.saveAsChip, saveAs === 'office' && styles.saveAsChipActive]}
                >
                  <Feather
                    name="briefcase"
                    size={15}
                    color={saveAs === 'office' ? '#701500' : '#58423c'}
                  />
                  <Text
                    allowFontScaling={false}
                    style={[styles.saveAsChipText, saveAs === 'office' && styles.saveAsChipTextActive]}
                  >
                    Office
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setSaveAs('other')}
                  style={[styles.saveAsChip, saveAs === 'other' && styles.saveAsChipActive]}
                >
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={16}
                    color={saveAs === 'other' ? '#701500' : '#58423c'}
                  />
                  <Text
                    allowFontScaling={false}
                    style={[styles.saveAsChipText, saveAs === 'other' && styles.saveAsChipTextActive]}
                  >
                    Other
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.addFooter, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
            <Pressable onPress={() => void handleSaveAddress()} disabled={saving} style={styles.saveButton}>
              {saving ? (
                <ActivityIndicator size="small" color="#701500" />
              ) : (
                <Text allowFontScaling={false} style={styles.saveButtonText}>
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </Text>
              )}
            </Pressable>
          </View>
        </>
      )}

      {isMapExpanded && (
        <View style={StyleSheet.absoluteFillObject}>
          <MapView
            ref={mapRef}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            style={StyleSheet.absoluteFillObject}
            initialRegion={region}
            onRegionChangeComplete={onRegionChangeComplete}
            onPress={handleMapPress}
            showsMyLocationButton={false}
            showsCompass={false}
            zoomControlEnabled={false}
          />
          {hasInteracted && (
            <View style={styles.expandedMapPin} pointerEvents="none">
              <Ionicons name="location-sharp" size={32} color="#a7391e" />
            </View>
          )}

          {/* Floating Premium Search Bar Overlay */}
          <View style={[styles.floatingSearchHeader, { top: insets.top + 16 }]}>
            <Pressable
              onPress={() => {
                setIsMapExpanded(false)
                setSuggestions([])
                setSearchQuery('')
                setIsAddingFromMap(false)
                Keyboard.dismiss()
              }}
              style={styles.floatingBackButton}
            >
              <Feather name="arrow-left" size={24} color="#191c1e" />
            </Pressable>

            <View style={styles.floatingSearchContainer}>
              <View style={styles.floatingSearchBox}>
                <Feather name="search" size={18} color="#58423c" />
                <TextInput
                  allowFontScaling={false}
                  value={searchQuery}
                  onChangeText={handleSearchTextChange}
                  placeholder="Search address or location"
                  placeholderTextColor="rgba(88, 66, 60, 0.5)"
                  style={styles.floatingSearchInput}
                />
                {searching && <ActivityIndicator size="small" color="#a7391e" />}
              </View>

              {suggestions.length > 0 && (
                <View style={styles.floatingSuggestionsContainer}>
                  {suggestions.map((item, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        handleSelectSuggestion(item)
                        Keyboard.dismiss()
                      }}
                      style={styles.suggestionItem}
                    >
                      <Ionicons name="location-outline" size={18} color="#a7391e" style={styles.suggestionIcon} />
                      <Text allowFontScaling={false} style={styles.suggestionText} numberOfLines={2}>
                        {item.display_name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          {!isKeyboardVisible && (
            <Pressable
              onPress={() => void useCurrentLocation()}
              style={styles.expandedCurrentButton}
            >
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#1e5bba" />
            </Pressable>
          )}
          {!isKeyboardVisible && (
            <View style={[styles.expandedConfirmWrap, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
              <View style={styles.expandedAddressPreview}>
                <Ionicons name="location" size={20} color="#a7391e" />
                <Text allowFontScaling={false} style={styles.expandedAddressText} numberOfLines={2}>
                  {hasInteracted ? (streetAddress || 'Loading address...') : 'Tap map to pick location'}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setIsMapExpanded(false)
                  setSuggestions([])
                  setSearchQuery('')
                  Keyboard.dismiss()
                  if (isAddingFromMap) {
                    setMode('add')
                    setIsAddingFromMap(false)
                  }
                }}
                style={styles.confirmButton}
              >
                <Text allowFontScaling={false} style={styles.confirmText}>
                  Confirm Selection
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  header: {
    height: 60,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(248, 250, 252, 0.92)',
    shadowColor: '#e2e8f0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 4,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#0f172a',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 36,
  },
  listContent: {
    paddingTop: 32,
    paddingHorizontal: 24,
    gap: 32,
  },
  searchBox: {
    height: 54,
    borderRadius: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e6e8ea',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchPlaceholder: {
    color: 'rgba(88, 66, 60, 0.7)',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  mapCard: {
    height: 192,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#dbeafe',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 40,
    elevation: 2,
  },
  mapImage: {
    flex: 1,
  },
  mapTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(119, 194, 152, 0.16)',
  },
  mapPin: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 42,
    height: 42,
    marginLeft: -21,
    marginTop: -28,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#a7391e',
    shadowColor: '#a7391e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  currentButton: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  currentText: {
    color: '#191c1e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    color: '#191c1e',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
  },
  addressCard: {
    minHeight: 96,
    padding: 20,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  addressCardActive: {
    paddingTop: 28,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 122, 89, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(167, 57, 30, 0.20)',
    shadowColor: '#ff7a59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
  },
  addressIconActive: {
    width: 48,
    height: 48,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  addressIcon: {
    width: 48,
    height: 48,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f4f6',
  },
  addressBody: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 52,
  },
  addressTitle: {
    color: '#191c1e',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '800',
  },
  addressText: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 23,
    fontWeight: '400',
  },
  editAddressButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(88, 66, 60, 0.08)',
  },
  checkCircle: {
    position: 'absolute',
    right: 26,
    top: 58,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#a7391e',
  },
  addAddressCard: {
    height: 88,
    padding: 20,
    borderRadius: 32,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(223, 192, 184, 0.70)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f4f6',
  },
  addAddressText: {
    color: '#1e5bba',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '800',
    paddingLeft: 16,
  },
  confirmWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: 'transparent',
  },
  confirmButton: {
    height: 60,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff7a59',
    shadowColor: '#a7391e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 6,
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '800',
  },
  addHeader: {
    height: 72,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(247, 249, 251, 0.8)',
  },
  addBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f4f6',
  },
  addHeaderTitle: {
    color: '#191c1e',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
  },
  addHeaderSpacer: {
    width: 40,
  },
  addContent: {
    paddingTop: 24,
    paddingHorizontal: 24,
    gap: 24,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    paddingHorizontal: 4,
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.7,
    fontWeight: '500',
  },
  streetField: {
    height: 56,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e6e8ea',
  },
  streetInput: {
    flex: 1,
    height: 56,
    color: '#191c1e',
    fontSize: 16,
    fontWeight: '400',
    paddingVertical: 0,
    includeFontPadding: false,
  },
  tripleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallFieldGroup: {
    flex: 1,
    gap: 8,
  },
  smallInput: {
    height: 56,
    borderRadius: 6,
    backgroundColor: '#e6e8ea',
    color: '#191c1e',
    fontSize: 16,
    fontWeight: '400',
    paddingHorizontal: 16,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  optionalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  optionalText: {
    color: 'rgba(88, 66, 60, 0.5)',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.7,
    fontWeight: '500',
  },
  largeInput: {
    height: 56,
    borderRadius: 32,
    backgroundColor: '#e6e8ea',
    color: '#191c1e',
    fontSize: 16,
    fontWeight: '400',
    paddingHorizontal: 16,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  notesInput: {
    minHeight: 108,
    borderRadius: 32,
    backgroundColor: '#e6e8ea',
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  saveAsSection: {
    gap: 12,
    paddingTop: 8,
  },
  saveAsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveAsChip: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e6e8ea',
  },
  saveAsChipActive: {
    backgroundColor: '#ff7a59',
  },
  saveAsChipText: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  saveAsChipTextActive: {
    color: '#701500',
  },
  addFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 24,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(247, 249, 251, 0.9)',
  },
  saveButton: {
    height: 56,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff7a59',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 6,
  },
  saveButtonText: {
    color: '#701500',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
  },
  mapTapOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  mapTapText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  mapCloseButton: {
    position: 'absolute',
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  expandedMapPin: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 64,
    height: 64,
    marginLeft: -32,
    marginTop: -42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedCurrentButton: {
    position: 'absolute',
    right: 16,
    bottom: 180,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  expandedConfirmWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
  },
  expandedAddressPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    backgroundColor: '#f2f4f6',
    borderRadius: 16,
  },
  expandedAddressText: {
    flex: 1,
    color: '#191c1e',
    fontSize: 15,
    fontWeight: '600',
  },
  searchContainer: {
    zIndex: 10,
    gap: 0,
  },
  searchInput: {
    flex: 1,
    height: 54,
    color: '#191c1e',
    fontSize: 16,
    fontWeight: '400',
    paddingVertical: 0,
    includeFontPadding: false,
  },
  suggestionsContainer: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e8ea',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f4f6',
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionText: {
    flex: 1,
    color: '#191c1e',
    fontSize: 14,
    fontWeight: '500',
  },
  floatingSearchHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    zIndex: 1000,
  },
  floatingBackButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  floatingSearchContainer: {
    flex: 1,
  },
  floatingSearchBox: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  floatingSearchInput: {
    flex: 1,
    height: 50,
    color: '#191c1e',
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
    includeFontPadding: false,
  },
  floatingSuggestionsContainer: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e8ea',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
    overflow: 'hidden',
    maxHeight: 250,
    zIndex: 2000,
  },
  streetMapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginLeft: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
})
