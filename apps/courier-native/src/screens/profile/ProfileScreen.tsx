import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { appTheme } from '../../theme/appTheme'
import { useAuthStore } from '../../store/authStore'
import { AppButton, AppText } from '../../ui/primitives'
import { uploadDocument, requiredDocuments, type DocumentType } from '../../data/courierApi'

const TRANSPORT_OPTIONS = ['FOOT', 'BIKE', 'SCOOTER', 'CAR', 'VAN'] as const
type TransportOption = typeof TRANSPORT_OPTIONS[number]

export function ProfileScreen() {
  const signOut = useAuthStore(state => state.signOut)
  const patchCourierProfile = useAuthStore(state => state.patchCourierProfile)
  const firstName = useAuthStore(state => state.firstName)
  const lastName = useAuthStore(state => state.lastName)
  const email = useAuthStore(state => state.email)
  const role = useAuthStore(state => state.role)
  const courierProfile = useAuthStore(state => state.courierProfile)
  const notificationDevice = useAuthStore(state => state.notificationDevice)

  const [editOpen, setEditOpen] = useState(false)
  const [editTransport, setEditTransport] = useState<TransportOption>('FOOT')
  const [editMaxOrders, setEditMaxOrders] = useState('3')
  const [saving, setSaving] = useState(false)

  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null)
  const [docNumber, setDocNumber] = useState('')
  const [docNumberForType, setDocNumberForType] = useState<DocumentType | null>(null)
  const reloadCourierProfile = useAuthStore(state => state.reloadCourierProfile)
  const accessToken = useAuthStore(state => state.accessToken)

  const initials = useMemo(() => {
    const seed = [firstName, lastName].filter(Boolean).join(' ').trim()
    if (!seed) return '--'
    return seed
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('')
  }, [firstName, lastName])

  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Курьер'
  const transportLabel = courierProfile?.transportType ?? '—'
  const verificationLabel = courierProfile?.isVerified ? 'Проверен' : 'Не проверен'
  const roleLabel = role ? `Роль ${role}` : 'Курьер'
  const lineStatus = courierProfile?.canTakeOrders ? 'На линии' : 'Недоступен'

  const profileItems = [
    `Статус на линии: ${lineStatus}`,
    `Тип транспорта: ${transportLabel}`,
    `Проверка личности: ${verificationLabel}`,
    `Статус занятости: ${courierProfile?.employmentStatus ?? '—'}`,
    `Тип курьера: ${courierProfile?.courierType ?? '—'}`,
    `Макс. активных заказов: ${courierProfile?.maxActiveOrders ?? '—'}`,
    `Push-уведомления: ${notificationDevice?.enabled ? 'Подключены' : 'Не подключены'}`,
    `Провайдер push: ${notificationDevice?.provider ?? '—'}`,
  ]

  const required = requiredDocuments(courierProfile?.transportType)

  const getDocForType = (type: DocumentType) =>
    courierProfile?.documents?.find(d => d.documentType === type)

  const handleStartUpload = (type: DocumentType) => {
    setDocNumber('')
    setDocNumberForType(type)
  }

  const handlePickAndUpload = async (type: DocumentType) => {
    if (!accessToken) return
    if (!docNumber.trim()) {
      Alert.alert('Required', 'Please enter a document number first.')
      return
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    })
    if (result.canceled || !result.assets[0]) return

    setUploadingType(type)
    setDocNumberForType(null)
    const res = await uploadDocument(accessToken, type, docNumber.trim(), result.assets[0].uri)
    setUploadingType(null)
    if (!res.ok) {
      Alert.alert('Upload failed', res.error.message)
      return
    }
    await reloadCourierProfile()
  }

  const openEdit = () => {
    setEditTransport((courierProfile?.transportType as TransportOption) ?? 'FOOT')
    setEditMaxOrders(String(courierProfile?.maxActiveOrders ?? 3))
    setEditOpen(true)
  }

  const handleSave = async () => {
    const maxOrders = parseInt(editMaxOrders, 10)
    if (isNaN(maxOrders) || maxOrders < 1 || maxOrders > 20) {
      Alert.alert('Validation', 'Max active orders must be between 1 and 20.')
      return
    }
    setSaving(true)
    const result = await patchCourierProfile({
      transportType: editTransport,
      maxActiveOrders: maxOrders,
    })
    setSaving(false)
    if (!result.ok) {
      Alert.alert('Error', result.message)
      return
    }
    setEditOpen(false)
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <AppText variant="title">Профиль</AppText>

        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <AppText variant="label" style={styles.avatarText}>{initials}</AppText>
          </View>
          <View style={styles.identityInfo}>
            <AppText variant="body" style={styles.identityName}>{fullName}</AppText>
            <AppText variant="label" style={styles.identityMuted}>{email ?? courierProfile?.id ?? '—'}</AppText>
            <AppText variant="label" style={styles.identityMuted}>{transportLabel} · {roleLabel}</AppText>
          </View>
        </View>

        <View style={styles.groupCard}>
          {profileItems.map((label, index) => (
            <Pressable
              key={label}
              style={[styles.profileRow, index === 0 ? styles.profileRowFirst : null]}
            >
              <AppText variant="body" style={styles.profileRowText}>{label}</AppText>
              <Ionicons name="chevron-forward" size={16} color="#7b7b96" />
            </Pressable>
          ))}
        </View>

        <View style={styles.groupCard}>
          <View style={[styles.profileRow, styles.profileRowFirst]}>
            <AppText variant="body" style={{ fontWeight: '700' }}>Документы</AppText>
            {courierProfile?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                <AppText variant="label" style={styles.verifiedText}>Верифицирован</AppText>
              </View>
            )}
          </View>

          {required.map((type) => {
            const doc = getDocForType(type)
            const isUploading = uploadingType === type
            const isEnteringNumber = docNumberForType === type

            return (
              <View key={type} style={styles.docRow}>
                <View style={styles.docRowTop}>
                  <AppText variant="label" style={styles.docTypeLabel}>
                    {type === 'IDENTIFICATION' ? 'Удостоверение личности' : 'Водительские права'}
                  </AppText>
                  {doc ? (
                    <View style={[
                      styles.docBadge,
                      doc.status === 'APPROVED' && styles.docBadgeApproved,
                      doc.status === 'PENDING' && styles.docBadgePending,
                      doc.status === 'REJECTED' && styles.docBadgeRejected,
                    ]}>
                      <AppText variant="label" style={styles.docBadgeText}>{doc.status}</AppText>
                    </View>
                  ) : (
                    <View style={styles.docBadge}>
                      <AppText variant="label" style={styles.docBadgeText}>НЕ ЗАГРУЖЕН</AppText>
                    </View>
                  )}
                </View>

                {doc?.rejectionReason && (
                  <AppText variant="label" style={styles.docRejection}>
                    Причина: {doc.rejectionReason}
                  </AppText>
                )}

                {doc?.status !== 'APPROVED' && !isEnteringNumber && (
                  <Pressable
                    style={[styles.docUploadBtn, isUploading && styles.docUploadBtnDisabled]}
                    onPress={() => handleStartUpload(type)}
                    disabled={isUploading}
                  >
                    {isUploading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <AppText variant="label" style={styles.docUploadBtnText}>
                          {doc ? 'Загрузить заново' : 'Загрузить'}
                        </AppText>
                    }
                  </Pressable>
                )}

                {isEnteringNumber && (
                  <View style={styles.docNumberForm}>
                    <TextInput
                      style={styles.docNumberInput}
                      placeholder="Номер документа"
                      placeholderTextColor="#666"
                      value={docNumber}
                      onChangeText={setDocNumber}
                      autoFocus
                    />
                    <View style={styles.docNumberActions}>
                      <Pressable
                        style={[styles.docPickBtn, !docNumber.trim() && styles.docPickBtnDisabled]}
                        disabled={!docNumber.trim()}
                        onPress={() => handlePickAndUpload(type)}
                      >
                        <AppText variant="label" style={styles.docPickBtnText}>Выбрать фото</AppText>
                      </Pressable>
                      <Pressable
                        style={styles.docCancelBtn}
                        onPress={() => setDocNumberForType(null)}
                      >
                        <AppText variant="label" style={styles.docCancelBtnText}>Отмена</AppText>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            )
          })}
        </View>

        <AppButton
          title="Выйти"
          variant="danger"
          onPress={() => void signOut()}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  content: {
    paddingHorizontal: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
    padding: appTheme.spacing.md,
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.card,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f2e1db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: appTheme.colors.primary,
    fontWeight: '700',
  },
  identityInfo: {
    gap: 2,
    flex: 1,
  },
  identityName: {
    fontWeight: '700',
  },
  identityMuted: {
    color: appTheme.colors.textMuted,
  },
  groupCard: {
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.card,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    overflow: 'hidden',
  },
  profileRow: {
    minHeight: 46,
    paddingHorizontal: appTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
  },
  profileRowFirst: {
    borderTopWidth: 0,
  },
  profileRowText: {
    color: appTheme.colors.text,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.card,
    borderWidth: 1,
    borderColor: appTheme.colors.primary,
  },
  editProfileButtonText: {
    color: appTheme.colors.primary,
    fontWeight: '600',
  },
  editCard: {
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.card,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
  },
  editTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  editLabel: {
    color: appTheme.colors.textMuted,
    marginBottom: 2,
  },
  transportRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  transportChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.background,
  },
  transportChipSelected: {
    borderColor: appTheme.colors.primary,
    backgroundColor: appTheme.colors.card,
  },
  transportChipText: {
    color: appTheme.colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  transportChipTextSelected: {
    color: appTheme.colors.primary,
  },
  editInput: {
    height: 42,
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    color: appTheme.colors.text,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: appTheme.colors.background,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  cancelButtonText: {
    color: appTheme.colors.textMuted,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appTheme.colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  logoutBtn: {
    marginTop: 4,
    width: '100%',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    color: '#16a34a',
    fontWeight: '600',
  },
  docRow: {
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
    gap: 6,
  },
  docRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docTypeLabel: {
    color: appTheme.colors.text,
    fontWeight: '600',
    flex: 1,
  },
  docBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  docBadgeApproved: {
    backgroundColor: '#dcfce7',
  },
  docBadgePending: {
    backgroundColor: '#fef9c3',
  },
  docBadgeRejected: {
    backgroundColor: '#fee2e2',
  },
  docBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  docRejection: {
    color: '#dc2626',
    fontSize: 11,
  },
  docUploadBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: appTheme.colors.primary,
    marginTop: 2,
  },
  docUploadBtnDisabled: {
    opacity: 0.5,
  },
  docUploadBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  docNumberForm: {
    gap: 6,
    marginTop: 2,
  },
  docNumberInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    color: appTheme.colors.text,
    paddingHorizontal: 10,
    fontSize: 13,
    backgroundColor: appTheme.colors.background,
  },
  docNumberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  docPickBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appTheme.colors.primary,
  },
  docPickBtnDisabled: {
    opacity: 0.4,
  },
  docPickBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  docCancelBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  docCancelBtnText: {
    color: appTheme.colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
})
