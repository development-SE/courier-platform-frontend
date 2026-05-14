import { useEffect, useState } from 'react'
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

type AddressDetails = {
  street: string
  city: string
  entrance: string
  apt: string
  floor: string
  doorCode: string
  phone: string
}

type AddressDetailsTab = 'Address' | 'Route on map' | 'About delivery'

type UserParcelAddressDetailsModalProps = {
  visible: boolean
  onClose: () => void
  fromAddress: AddressDetails
  toAddress: AddressDetails
  onUpdateAddress?: (type: 'from' | 'to', updatedAddress: AddressDetails) => void
}

const TABS: AddressDetailsTab[] = ['Address', 'Route on map', 'About delivery']

export function UserParcelAddressDetailsModal({
  visible,
  onClose,
  fromAddress,
  toAddress,
  onUpdateAddress,
}: UserParcelAddressDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<AddressDetailsTab>('Address')
  const [localFromAddress, setLocalFromAddress] = useState(fromAddress)
  const [localToAddress, setLocalToAddress] = useState(toAddress)

  useEffect(() => {
    setLocalFromAddress(fromAddress)
    setLocalToAddress(toAddress)
  }, [fromAddress, toAddress])

  const handleUpdateFromAddress = (field: keyof AddressDetails, value: string) => {
    const updated = { ...localFromAddress, [field]: value }
    setLocalFromAddress(updated)
    onUpdateAddress?.('from', updated)
  }

  const handleUpdateToAddress = (field: keyof AddressDetails, value: string) => {
    const updated = { ...localToAddress, [field]: value }
    setLocalToAddress(updated)
    onUpdateAddress?.('to', updated)
  }

  const renderAddressDetailsRow = (
    label1: string,
    field1: keyof AddressDetails,
    value1: string,
    onChange1: (field: keyof AddressDetails, value: string) => void,
    label2: string,
    field2: keyof AddressDetails,
    value2: string,
    onChange2: (field: keyof AddressDetails, value: string) => void,
  ) => (
    <View style={styles.detailRow}>
      <View style={styles.detailFieldHalf}>
        <Text style={styles.detailLabel}>{label1}</Text>
        <TextInput
          style={styles.detailInput}
          value={value1}
          onChangeText={text => onChange1(field1, text)}
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <View style={styles.detailFieldHalf}>
        <Text style={styles.detailLabel}>{label2}</Text>
        <TextInput
          style={styles.detailInput}
          value={value2}
          onChangeText={text => onChange2(field2, text)}
          placeholderTextColor="#9CA3AF"
        />
      </View>
    </View>
  )

  const renderAddressCard = (
    label: 'FROM' | 'TO',
    address: AddressDetails,
    onChange: (field: keyof AddressDetails, value: string) => void,
  ) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressHeaderText}>
          <Text style={styles.addressLabel}>{label}</Text>
          <Text style={styles.addressMain}>{address.street || (label === 'FROM' ? 'Pickup address' : 'Delivery address')}</Text>
          <Text style={styles.addressCity}>{address.city || 'Almaty, Kazakhstan'}</Text>
        </View>
        <TouchableOpacity style={styles.chevronButton} activeOpacity={0.85}>
          <Text style={styles.chevronIcon}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.addressDetailsFields}>
        {renderAddressDetailsRow(
          'Entrance',
          'entrance',
          address.entrance,
          onChange,
          'Apt / Office',
          'apt',
          address.apt,
          onChange,
        )}
        {renderAddressDetailsRow(
          'Floor',
          'floor',
          address.floor,
          onChange,
          'Door code',
          'doorCode',
          address.doorCode,
          onChange,
        )}
      </View>

      <View style={styles.detailsSection}>
        <TouchableOpacity style={styles.detailItem} activeOpacity={0.85}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>i</Text>
          </View>
          <Text style={styles.detailItemText}>Details and photos</Text>
          <Text style={styles.chevronSmall}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.detailItem} activeOpacity={1}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>#</Text>
          </View>
          <TextInput
            style={[styles.detailItemText, styles.phoneInput]}
            value={address.phone}
            onChangeText={text => onChange('phone', text)}
            keyboardType="phone-pad"
            placeholder="+7 777 000 00 00"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.chevronSmall}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <Modal visible={visible} transparent animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerDragHandle} />
          <Text style={styles.headerTitle}>Details</Text>

          <View style={styles.tabsContainer}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, activeTab === tab ? styles.tabActive : styles.tabInactive]}
                activeOpacity={0.88}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentInner}
        >
          {activeTab === 'Address' ? (
            <View style={styles.detailsContainer}>
              {renderAddressCard('FROM', localFromAddress, handleUpdateFromAddress)}
              {renderAddressCard('TO', localToAddress, handleUpdateToAddress)}
            </View>
          ) : (
            <View style={styles.placeholderContent}>
              <Text style={styles.placeholderText}>
                {activeTab === 'Route on map' ? 'Map details are mock for now' : 'Delivery details are mock for now'}
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.doneButton} onPress={onClose} activeOpacity={0.88}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  headerDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 9999,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    lineHeight: 33,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  tabActive: {
    backgroundColor: '#FFF2EE',
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 89, 0.2)',
  },
  tabInactive: {
    backgroundColor: '#F3F4F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#FF7A59',
  },
  tabTextInactive: {
    color: '#4B5563',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  detailsContainer: {
    gap: 16,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  addressHeaderText: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  addressMain: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22.5,
  },
  addressCity: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 24,
    marginTop: 2,
  },
  chevronButton: {
    width: 32,
    height: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronIcon: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '900',
  },
  addressDetailsFields: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailFieldHalf: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 16.5,
    marginBottom: 6,
  },
  detailInput: {
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(223, 192, 184, 0.3)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 32,
    height: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '700',
  },
  detailItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 20,
  },
  phoneInput: {
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  chevronSmall: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '900',
  },
  placeholderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  doneButton: {
    backgroundColor: '#FF7A59',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
})
