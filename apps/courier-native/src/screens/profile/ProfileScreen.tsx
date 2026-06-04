import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { appTheme } from '../../theme/appTheme'
import { useAuthStore } from '../../store/authStore'
import { AppButton, AppText } from '../../ui/primitives'

export function ProfileScreen() {
  const signOut = useAuthStore(state => state.signOut)
  const firstName = useAuthStore(state => state.firstName)
  const lastName = useAuthStore(state => state.lastName)
  const email = useAuthStore(state => state.email)
  const role = useAuthStore(state => state.role)
  const courierProfile = useAuthStore(state => state.courierProfile)
  const notificationDevice = useAuthStore(state => state.notificationDevice)

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
  logoutBtn: {
    marginTop: 4,
    width: '100%',
  },
})
