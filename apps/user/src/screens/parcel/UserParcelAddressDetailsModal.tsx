import { useEffect, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type AddressDetails = {
  street: string
  city: string
  entrance: string
  apt: string
  floor: string
  doorCode: string
  phone: string
  courierInstructions: string
}

type UserParcelAddressDetailsModalProps = {
  visible: boolean
  type: 'from' | 'to'
  address: AddressDetails
  onClose: () => void
  onUpdate: (address: AddressDetails) => void
  onChangeAddress?: () => void
  onChooseOnMap?: () => void
}

export function UserParcelAddressDetailsModal({
  visible,
  type,
  address,
  onClose,
  onUpdate,
  onChangeAddress,
  onChooseOnMap,
}: UserParcelAddressDetailsModalProps) {
  const insets = useSafeAreaInsets()
  const [local, setLocal] = useState<AddressDetails>(address)

  useEffect(() => {
    setLocal(address)
  }, [address, visible])

  const set = (field: keyof AddressDetails, value: string) => {
    const updated = { ...local, [field]: value }
    setLocal(updated)
    onUpdate(updated)
  }

  const label = type === 'from' ? 'From' : 'To'
  const placeholder = type === 'from' ? 'Pickup address' : 'Delivery address'
  const icon = type === 'from' ? 'map-pin' : 'navigation'

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <View style={styles.addressHeader}>
            <View style={styles.addressIconCircle}>
              <Feather name={icon} size={16} color="#ff7a59" />
            </View>
            <View style={styles.addressTitleWrap}>
              <Text style={styles.addressLabel}>{label}</Text>
              <Text style={styles.addressTitle} numberOfLines={1}>
                {local.street || placeholder}
              </Text>
            </View>
            <Pressable style={styles.changeBtn} onPress={onChangeAddress}>
              <Feather name="chevron-right" size={18} color="#58423c" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable style={styles.mapRow} onPress={onChooseOnMap}>
              <View style={styles.mapRowLeft}>
                <MaterialCommunityIcons name="map-marker-outline" size={18} color="#aec6ff" />
                <Text style={styles.mapRowText}>Choose on map</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#58423c" />
            </Pressable>

            <View style={styles.grid}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>ENTRANCE</Text>
                <TextInput
                  style={styles.cardInput}
                  value={local.entrance}
                  onChangeText={v => set('entrance', v)}
                  placeholder="1"
                  placeholderTextColor="#9CA3AF"
                  selectionColor="#ff7a59"
                />
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>APARTMENT, OFFICE</Text>
                <TextInput
                  style={styles.cardInput}
                  value={local.apt}
                  onChangeText={v => set('apt', v)}
                  placeholder="42"
                  placeholderTextColor="#9CA3AF"
                  selectionColor="#ff7a59"
                />
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>FLOOR</Text>
                <TextInput
                  style={styles.cardInput}
                  value={local.floor}
                  onChangeText={v => set('floor', v)}
                  placeholder="5"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  selectionColor="#ff7a59"
                />
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>DOOR PHONE</Text>
                <TextInput
                  style={styles.cardInput}
                  value={local.doorCode}
                  onChangeText={v => set('doorCode', v)}
                  placeholder="1234"
                  placeholderTextColor="#9CA3AF"
                  selectionColor="#ff7a59"
                />
              </View>
            </View>

            <View style={styles.instructionsCard}>
              <Text style={styles.cardLabel}>COURIER INSTRUCTIONS</Text>
              <TextInput
                style={styles.instructionsInput}
                value={local.courierInstructions}
                onChangeText={v => set('courierInstructions', v)}
                placeholder="Leave at the door, ring twice..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                selectionColor="#ff7a59"
              />
            </View>
          </ScrollView>

          <Pressable style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(25, 28, 30, 0.18)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    height: '82%',
    paddingTop: 12,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 16,
  },
  handleWrap: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 999,
    opacity: 0.6,
    backgroundColor: '#e0e3e5',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  addressIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 218, 210, 0.40)',
  },
  addressTitleWrap: {
    flex: 1,
  },
  addressLabel: {
    color: 'rgba(88, 66, 60, 0.60)',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  addressTitle: {
    color: '#191c1e',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  changeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f4f6',
  },
  scrollArea: {
    flex: 1,
  },
  mapRow: {
    padding: 16,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    marginBottom: 12,
  },
  mapRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mapRowText: {
    color: '#191c1e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47.5%',
    minHeight: 84,
    padding: 16,
    borderRadius: 6,
    gap: 4,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardLabel: {
    color: 'rgba(88, 66, 60, 0.60)',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  cardInput: {
    padding: 0,
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  instructionsCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 6,
    gap: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 24,
  },
  instructionsInput: {
    padding: 0,
    color: '#191c1e',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    minHeight: 64,
  },
  doneBtn: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6e8ea',
  },
  doneBtnText: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
})
