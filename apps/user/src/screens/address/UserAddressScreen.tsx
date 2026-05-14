import { useMemo, useState } from 'react'
import {
  ImageBackground,
  Linking,
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

type UserAddressScreenProps = {
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

const mapPreviewUrl =
  Platform.OS === 'ios'
    ? 'https://images.unsplash.com/photo-1569336415962-a4bd9f69c07a?auto=format&fit=crop&w=900&q=80'
    : 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=900&q=80'

const baseAddresses: SavedAddress[] = [
  {
    id: 'home',
    title: 'Home',
    text: '1248 Magnolia Way, Apt 3B\nSan Francisco, CA 94107',
    icon: 'home',
  },
  {
    id: 'work',
    title: 'Work',
    text: 'Tech Hub Building, Floor 12\n555 Market St, SF, CA 94104',
    icon: 'work',
  },
]

export function UserAddressScreen({ onBackPress, onConfirmPress }: UserAddressScreenProps) {
  const insets = useSafeAreaInsets()
  const [mode, setMode] = useState<AddressScreenMode>('list')
  const [selectedAddressId, setSelectedAddressId] = useState('home')
  const [customAddress, setCustomAddress] = useState<SavedAddress | null>(null)
  const [streetAddress, setStreetAddress] = useState('124 Cherry Lane')
  const [entrance, setEntrance] = useState('A')
  const [floor, setFloor] = useState('4')
  const [door, setDoor] = useState('402')
  const [buildingName, setBuildingName] = useState('')
  const [courierNotes, setCourierNotes] = useState('')
  const [saveAs, setSaveAs] = useState<SaveAsType>('apartment')

  const savedAddresses = useMemo(
    () => (customAddress ? [...baseAddresses, customAddress] : baseAddresses),
    [customAddress],
  )

  const openMap = async () => {
    const latitude = 37.7749
    const longitude = -122.4194
    const label = encodeURIComponent('Delivery Point')
    const nativeUrl = Platform.select({
      ios: `http://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    })
    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`

    if (nativeUrl && (await Linking.canOpenURL(nativeUrl))) {
      await Linking.openURL(nativeUrl)
      return
    }

    await Linking.openURL(fallbackUrl)
  }

  const handleBack = () => {
    if (mode === 'add') {
      setMode('list')
      return
    }

    onBackPress?.()
  }

  const handleSaveAddress = () => {
    const title = saveAs === 'apartment' ? 'Apartment' : saveAs === 'office' ? 'Office' : 'Other'
    const extraParts = [buildingName, `Entrance ${entrance}`, `Floor ${floor}`, `Door ${door}`].filter(Boolean)

    setCustomAddress({
      id: 'custom',
      title,
      text: `${streetAddress}\n${extraParts.join(', ')}`,
      icon: saveAs === 'apartment' ? 'home' : saveAs === 'office' ? 'work' : 'other',
    })
    setSelectedAddressId('custom')
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
            <View style={styles.searchBox}>
              <Feather name="search" size={18} color="#58423c" />
              <Text allowFontScaling={false} style={styles.searchPlaceholder}>
                Enter address or location
              </Text>
            </View>

            <Pressable onPress={() => void openMap()} style={styles.mapCard}>
              <ImageBackground source={{ uri: mapPreviewUrl }} resizeMode="cover" style={styles.mapImage}>
                <View style={styles.mapTint} />
                <View style={styles.mapPin}>
                  <Ionicons name="location-sharp" size={23} color="#ffffff" />
                </View>
                <Pressable onPress={() => void openMap()} style={styles.currentButton}>
                  <MaterialCommunityIcons name="crosshairs-gps" size={17} color="#1e5bba" />
                  <Text allowFontScaling={false} style={styles.currentText}>
                    Use current
                  </Text>
                </Pressable>
              </ImageBackground>
            </Pressable>

            <View style={styles.section}>
              <Text allowFontScaling={false} style={styles.sectionTitle}>
                Saved Addresses
              </Text>

              {savedAddresses.map(address => {
                const isSelected = selectedAddressId === address.id

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

                    {isSelected ? (
                      <View style={styles.checkCircle}>
                        <Feather name="check" size={14} color="#ffffff" />
                      </View>
                    ) : null}
                  </Pressable>
                )
              })}

              <Pressable onPress={() => setMode('add')} style={styles.addAddressCard}>
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
              Add Address
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
              </View>
            </View>

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

            <View style={styles.fieldGroup}>
              <View style={styles.optionalLabelRow}>
                <Text allowFontScaling={false} style={styles.fieldLabel}>
                  BUILDING NAME
                </Text>
                <Text allowFontScaling={false} style={styles.optionalText}>
                  (OPTIONAL)
                </Text>
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
                COURIER NOTES
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
            <Pressable onPress={handleSaveAddress} style={styles.saveButton}>
              <Text allowFontScaling={false} style={styles.saveButtonText}>
                Save Address
              </Text>
            </Pressable>
          </View>
        </>
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
    paddingRight: 42,
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
  checkCircle: {
    position: 'absolute',
    right: 20,
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
    lineHeight: 24,
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
    color: '#6b7280',
    fontSize: 16,
    lineHeight: 24,
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
    lineHeight: 24,
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
})
